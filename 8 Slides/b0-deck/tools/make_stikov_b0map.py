#!/usr/bin/env python3
"""Write js/figures/b0MapStikov.js: a measured 3 T B0 map for slide 2, from the 2013 Stikov session.

Data: the `mtspgr_b0` series of stikov_nikola_20131017_113942 (the B1 deck's dataset), the B0 map of
the qMT protocol (Boudreau, Stikov & Pike, "B1-Sensitivity Analysis of Quantitative Magnetization
Transfer Imaging", MRM 2018, doi:10.1002/mrm.26673): a two-point phase-difference gradient echo,
TR 25 ms, FA 7°, one 5 mm axial slice, 2 x 2 mm. The two echoes are saved as two "measurements":
series 48 (magnitude) and 49 (phase, Siemens scale ±4096 = ±π). The headers keep only TE1 = 4 ms.

ΔTE = 2.24 ms (TE2 ≈ 6.24 ms; one fat-water in-phase period at 3 T), from the data:
- regressing this phase difference against a reference with a documented 11 ms gap (the same
  session's Bloch-Siegert pair at TE 15 ms minus this scan's 4 ms echo) gives ΔTE ≈ 2.2-2.3 ms
  (series 48/49 and 50/51);
- the magnitude drops ~4 % between the echoes: T2* ≈ 55 ms at 2.24 ms (vs ~110 ms at 4.48 ms);
- the original pipeline (qmt_preprocess.m / calcB0.m -> calculateB0FieldMap_3t.m) scales the
  pixel difference by 1/(4096 × 4.48 ms) = 1/(8192 × 2.24 ms), i.e. exactly this ΔTE with the
  correct ±π scale, so its b0_map.mnc files (checked on this subject) equal this map.
The paper's "TE1/TE2 = 4/8.48 ms" (and the code's 4.48 ms default) are most likely a reporting error.

The map is the complex phase difference divided by 2π·ΔTE (Eq. 5.5-5.6 and 5.8 of the chapter),
masked to the head minus the scalp (whose fat and edges carry chemical-shift and partial-volume
phase, not field).

Usage (from the b0-deck folder):
    python3 -I tools/make_stikov_b0map.py [path/to/stikov_nikola_20131017_113942]
"""
import json
import sys
from pathlib import Path

import nibabel as nib
import numpy as np
from scipy import ndimage as ndi

DECK = Path(__file__).resolve().parents[1]
DEFAULT_DATA = Path.home() / "neuropoly/mooc/repos/mooc_b1_class/stikov_nikola_20131017_113942"
SUBJECT = "stikov_nikola_20131017_113942"
MAG, PHASE = "48", "49"  # mtspgr_b0
DTE = 2.24e-3  # s, see above
LIMIT = 30  # Hz, colour range ±LIMIT
OUT = DECK / "js" / "figures" / "b0MapStikov.js"


def load(data, series):
    return np.asarray(nib.load(data / f"{SUBJECT}_{series}_mri.mnc").dataobj, dtype=float)[:, 0]


def main():
    data = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DATA
    mag = load(data, MAG)
    phase = load(data, PHASE) * np.pi / 4096
    z1, z2 = mag[0] * np.exp(1j * phase[0]), mag[1] * np.exp(1j * phase[1])
    dphi = np.angle(z2 * np.conj(z1))
    field = dphi / (2 * np.pi * DTE)

    head = ndi.binary_fill_holes(mag[0] > 0.12 * mag[0].max())
    inside = ndi.distance_transform_edt(head) > 7  # drop the scalp and the partial-volume rim
    inside = ndi.binary_opening(inside, iterations=2)
    hz = np.where(inside, np.round(field, 1), np.nan)

    # Crop to the head, with a small border, so the slice fills the slide.
    rows, cols = np.nonzero(head)
    r0, r1 = max(rows.min() - 3, 0), min(rows.max() + 4, head.shape[0])
    c0, c1 = max(cols.min() - 3, 0), min(cols.max() + 4, head.shape[1])
    hz = hz[r0:r1, c0:c1]

    # Image rows run anterior (top) to posterior; flip so Plotly's y axis (bottom-up) shows it the same way.
    hz = hz[::-1]
    z_hz = [[None if np.isnan(v) else float(v) for v in row] for row in hz]
    # Blue - white - red, white at 0 Hz (ColorBrewer RdBu ends); outside the mask shows the light grey plot background.
    bwr = [[0, "#053061"], [0.2, "#2166ac"], [0.4, "#92c5de"], [0.5, "#ffffff"], [0.6, "#f4a582"], [0.8, "#b2182b"], [1, "#67001f"]]
    fig = {
        "data": [
            dict(type="heatmap", z=z_hz, colorscale=bwr, zmin=-LIMIT, zmax=LIMIT, hoverongaps=False, name="ΔB0",
                 colorbar=dict(title=dict(text="Hz"), thickness=14, len=0.8), hovertemplate="ΔB<sub>0</sub> %{z:.0f} Hz<extra></extra>"),
        ],
        "layout": {
            "width": 440, "height": 500,
            "margin": dict(l=10, r=10, t=10, b=10),
            "paper_bgcolor": "#ffffff", "plot_bgcolor": "#e9edf1",
            "xaxis": dict(visible=False, scaleanchor="y", constrain="domain"),
            "yaxis": dict(visible=False, constrain="domain"),
        },
    }
    text = json.dumps(fig, separators=(",", ":"), ensure_ascii=False).replace("NaN", "null")
    OUT.write_text(
        f"// Measured 3 T B0 map (2013 Stikov session, mtspgr_b0 series {MAG}/{PHASE}, ΔTE 2.24 ms), written by\n"
        "// tools/make_stikov_b0map.py. Do not edit.\n"
        f"window.B0Figures = window.B0Figures || {{}};\nwindow.B0Figures[\"b0MapStikov\"] = {text};\n"
    )
    vals = hz[~np.isnan(hz)]
    print(f"{OUT.relative_to(DECK)}  {OUT.stat().st_size / 1024:.0f} KB; ΔB0 in mask: 1st–99th percentile "
          f"{np.percentile(vals, 1):.1f} to {np.percentile(vals, 99):.1f} Hz, std {vals.std():.1f} Hz")


if __name__ == "__main__":
    main()
