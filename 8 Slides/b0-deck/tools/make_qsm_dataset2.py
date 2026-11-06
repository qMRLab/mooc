#!/usr/bin/env python3
"""Write js/figures/b0QsmPhases.js and b0QsmDiff.js: "Dataset 2" on slide 12, whose phase difference still wraps.

Data: nii/qsmcons_siemens_e12_{phase,mag}.nii.gz (the QSM consensus example, Siemens 3 T, echoes 1 and 2:
TE 5.25 and 11.08 ms, ΔTE 5.83 ms; see nii/qsmcons_SOURCE.md, CC BY 4.0). With ΔTE = 5.83 ms the phase
difference wraps for offsets beyond ±1/(2·ΔTE) ≈ ±86 Hz, and near the frontal sinus the field reaches
~300 Hz, so the difference keeps a wrap there (slice 13 of the 32, through the frontal lobe above the sinus).

Two figures, the same two views as Figure 5.9 (Dataset 1), laid out like it (tools/extract_book_figures.py):
- b0QsmPhases: the phase of each echo, blue-white-red on ±π;
- b0QsmDiff: the complex phase difference on ±π, and ΔB0 = Δφ / (2π ΔTE) with no unwrapping, so the wrap shows in
  the map as well. On ±125 Hz, wider than its ±86 Hz span, so that the map doesn't look the same as Δφ.
The head only (magnitude above 8 % of its maximum), anterior up.

Usage (from the b0-deck folder):
    python3 -I tools/make_qsm_dataset2.py
"""
import json
import math
from pathlib import Path

import nibabel as nib
import numpy as np

HERE = Path(__file__).resolve().parent.parent
SLICE = 13
DTE = 5.83e-3  # s
BWR = [[0, "#053061"], [0.2, "#2166ac"], [0.4, "#92c5de"], [0.5, "#ffffff"], [0.6, "#f4a582"], [0.8, "#b2182b"], [1, "#67001f"]]
PI = "𝜋"

phase = nib.load(HERE / "nii/qsmcons_siemens_e12_phase.nii.gz").get_fdata()
mag = nib.load(HERE / "nii/qsmcons_siemens_e12_mag.nii.gz").get_fdata()
p1, p2, m1 = phase[:, :, SLICE, 0], phase[:, :, SLICE, 1], mag[:, :, SLICE, 0]
head = m1 > 0.08 * mag[..., 0].max()
dphi = np.angle(np.exp(1j * (p2 - p1)))
field = dphi / (2 * math.pi * DTE)  # Hz, not unwrapped

# Orientation from the anatomy (the stored affine is only the voxel size): np.rot90 puts the eyes in the last
# rows, which Plotly draws at the top, so anterior is up. The image is cropped to the head, with a 2-voxel margin.
rows = np.rot90(head)
r = np.flatnonzero(rows.any(axis=1)); c = np.flatnonzero(rows.any(axis=0))
crop = np.s_[max(r[0] - 2, 0):r[-1] + 3, max(c[0] - 2, 0):c[-1] + 3]


def image(a):
    """Anterior at the top, outside the head empty, cropped to the head."""
    a = np.rot90(np.where(head, a, np.nan))[crop]
    return [[None if not np.isfinite(v) else round(float(v), 3) for v in row] for row in a]


# Panels sized to the image (square pixels), so each colour bar sits right beside its panel.
n_rows, n_cols = rows[crop].shape
W, H, MARGIN = 750, 325, dict(t=40, b=15, l=20, r=20)
plot_w, plot_h = W - MARGIN["l"] - MARGIN["r"], H - MARGIN["t"] - MARGIN["b"]
width = n_cols / n_rows * plot_h / plot_w
domains = ([0.08, 0.08 + width], [0.55, 0.55 + width])
RAD = dict(title=dict(text="Rad", side="top"), tickmode="array", tickvals=[-math.pi, 0, math.pi],
           ticktext=[f"-{PI}", "0", PI], len=0.9)
HZ = dict(title=dict(text="Hz", side="top"), len=0.9)
frame = dict(showticklabels=False, showgrid=False, zeroline=False, showline=True, mirror=True,
             linecolor="#c9d1db", linewidth=1)


def figure(panels):
    """panels: two (title, image, limit, colour bar)."""
    data, annotations = [], []
    for i, (title, a, limit, bar) in enumerate(panels):
        suffix = "" if i == 0 else "2"
        data.append(dict(type="heatmap", z=image(a), xaxis=f"x{suffix}", yaxis=f"y{suffix}", colorscale=BWR,
                         zmin=-limit, zmax=limit, hoverinfo="skip", colorbar=dict(bar, x=domains[i][1] + 0.012)))
        annotations.append(dict(text=title, x=sum(domains[i]) / 2, y=1, xref="paper", yref="paper", xanchor="center",
                                yanchor="bottom", showarrow=False, font=dict(size=16)))
    layout = dict(
        width=W, height=H, margin=MARGIN, plot_bgcolor="rgba(0,0,0,0)", annotations=annotations,
        xaxis=dict(frame, domain=domains[0], anchor="y"),
        yaxis=dict(frame, anchor="x", scaleanchor="x"),
        xaxis2=dict(frame, domain=domains[1], anchor="y2"),
        yaxis2=dict(frame, anchor="x2", scaleanchor="x2"),
    )
    return dict(data=data, layout=layout)


FIGURES = {
    "b0QsmPhases": figure([("Phase 1", p1, math.pi, RAD), ("Phase 2", p2, math.pi, RAD)]),
    "b0QsmDiff": figure([("Phase difference", dphi, math.pi, RAD),
                         ("ΔB<sub>0</sub> map, not unwrapped", field, 125, HZ)]),
}
for label, fig in FIGURES.items():
    out = HERE / f"js/figures/{label}.js"
    text = json.dumps(fig, separators=(",", ":"), ensure_ascii=False)
    out.write_text(
        f"// Slide 12, Dataset 2: QSM consensus example data (nii/qsmcons_SOURCE.md), slice {SLICE}, "
        "written by tools/make_qsm_dataset2.py. Do not edit.\n"
        "window.B0Figures = window.B0Figures || {};\n"
        f"window.B0Figures[{json.dumps(label)}] = {text};\n"
    )
    print(f"{out.relative_to(HERE)}  {len(out.read_bytes()) / 1024:.0f} KB")
