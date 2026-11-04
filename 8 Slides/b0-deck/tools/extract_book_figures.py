#!/usr/bin/env python3
"""Copy the B0 chapter's Plotly figures from its notebooks into js/figures/, in compact form.

The B0 notebooks (5 B0 Mapping/*/Notebooks/*.ipynb) are the book's figures: each code cell's
first `#| label:` names the figure the chapter embeds (b0Fig1jn, ...). This script takes the
saved Plotly output of the cells listed in FIGURES and writes one script per figure,
js/figures/<label>.js, which sets window.B0Figures[<label>]. Unlike the T2 deck's figures
(copied byte for byte from the live book), these are made smaller so the deck stays light:

- numbers are rounded to 4 significant digits (well below what a plot or colour bar shows);
- the Plotly theme, the same in every figure, is stored once in js/figures/template.js and put
  back by js/deck.js;
- the two 500 x 500 phase images (b0Fig13jn, b0Fig14jn) keep every second pixel, with dx/dy
  set to 2 so axes and overlays stay where they were;
- figures saved without a size get the book's default (800 x 450).

Usage (from the b0-deck folder):
    python3 -I tools/extract_book_figures.py           # refresh js/figures/
    python3 -I tools/extract_book_figures.py --check   # report whether js/figures/ is up to date
"""
import json
import math
import re
import sys
from pathlib import Path

DECK = Path(__file__).resolve().parents[1]
REPO = DECK.parents[1]
NOTEBOOKS = REPO / "5 B0 Mapping"
OUT = DECK / "js" / "figures"
PLOTLY = "application/vnd.plotly.v1+json"
SIG = 4
DEFAULT_SIZE = (800, 450)
HALVE = {"b0Fig13jn", "b0Fig14jn"}

# Cell label -> notebook (relative to "5 B0 Mapping"). Figures 5.5 and 5.12 are drawn by js/b0-widgets.js.
FIGURES = {
    "b0Fig1jn": "1 B0 Inhomogeneities/Notebooks/Figure-5-1-1.ipynb",
    "b0Fig2jn": "1 B0 Inhomogeneities/Notebooks/Figure-5-1-2.ipynb",
    "b0Fig3ajn": "1 B0 Inhomogeneities/Notebooks/Figure-5-1-3.ipynb",
    "b0Fig4jn": "1 B0 Inhomogeneities/Notebooks/Figure-5-1-4.ipynb",
    "b0Fig6jn": "2 Dual echo B0 mapping/Notebooks/Figure-5-2-1.ipynb",
    "b0Fig7jn": "2 Dual echo B0 mapping/Notebooks/Figure-5-2-2.ipynb",
    "b0Fig8jna": "2 Dual echo B0 mapping/Notebooks/Figure-5-2-3.ipynb",
    "b0Fig8jn": "2 Dual echo B0 mapping/Notebooks/Figure-5-2-3.ipynb",
    "b0Fig9jna": "2 Dual echo B0 mapping/Notebooks/Figure-5-2-4.ipynb",
    "b0Fig9jn": "2 Dual echo B0 mapping/Notebooks/Figure-5-2-4.ipynb",
    "b0Fig10jn": "3 Phase Unwrapping/Notebooks/Figure-5-3-1.ipynb",
    "b0Fig11jn": "3 Phase Unwrapping/Notebooks/Figure-5-3-2.ipynb",
    "b0Fig13jn": "3 Phase Unwrapping/Notebooks/Figure-5-3-4.ipynb",
    "b0Fig14jn": "3 Phase Unwrapping/Notebooks/Figure-5-3-5.ipynb",
    "b0Fig15jn": "4 Advanced B0 Mapping Methods/Notebooks/Figure-5-4-1.ipynb",
    "b0Fig16jn": "4 Advanced B0 Mapping Methods/Notebooks/Figure-5-4-2.ipynb",
    "b0Fig17jn": "4 Advanced B0 Mapping Methods/Notebooks/Figure-5-4-3.ipynb",
    "b0Fig18jn": "4 Advanced B0 Mapping Methods/Notebooks/Figure-5-4-4.ipynb",
}

# Figure 5.3: b0Fig3ajn holds the cylinder and the brain images (the brain hidden) but no menu; b0Fig3jn has the
# Cylinders/Brain menu but only the cylinder images. The deck shows b0Fig3ajn with b0Fig3jn's menu.
MENU_FROM = {"b0Fig3ajn": "b0Fig3jn"}

# Blue - white - red, white at 0 (ColorBrewer RdBu ends), as on slide 2.
BWR = [[0, "#053061"], [0.2, "#2166ac"], [0.4, "#92c5de"], [0.5, "#ffffff"], [0.6, "#f4a582"], [0.8, "#b2182b"], [1, "#67001f"]]


def fig1_field_map_first(fig):
    """Figure 5.1 on slide 3: open on the field map in ppm (trace 4, menu entry 4) and show the three field
    maps (Hz, µT, ppm: traces 2-4) in blue-white-red around 0, with matching ranges (±0.65 ppm at 3 T)."""
    menu = fig["layout"]["updatemenus"][0]
    # No plot title: it repeats the menu (and sat off-centre). Subscript 0 in the menu labels.
    fig["layout"].pop("title", None)
    for button in menu["buttons"]:
        if len(button["args"]) > 1:
            button["args"][1].pop("title", None)
        button["label"] = button["label"].replace("B0", "B<sub>0</sub>")
    ppm = menu["buttons"][4]
    for trace, show in zip(fig["data"], ppm["args"][0]["visible"]):
        trace["visible"] = show
    fig["layout"].update(ppm["args"][1])  # the title and panel letter the ppm entry sets
    menu["active"] = 4
    ppm_limit = 0.65
    f0_mhz = 127.7  # 3 T
    for trace, limit in zip(fig["data"][2:5], (ppm_limit * f0_mhz, ppm_limit * 3.0, ppm_limit)):
        trace.update(colorscale=BWR, zmin=-limit, zmax=limit)


def fig2_dipole_bwr(fig):
    """Figure 5.2 on slide 4: both kernels in blue-white-red around 0. d (image space) is clipped at ±1e-6 in the
    book (sign only: it falls off as 1/r³, ~1e-3 at 5 px to ~3e-7 at 80 px); here ±2e-6, so the lobes fade at the edges. D (k-space, real: 1/3 - kz²/k², scaled) uses a
    symmetric range so that 0 is white."""
    d, D = fig["data"][0], fig["data"][1]
    # Titles: name d, and show D as its Fourier transform. B0 runs left-right in both panels (d > 0 and
    # D = -2/3 along it); the images have no axes, so an arrow under each panel says so.
    titles = fig["layout"]["annotations"]
    titles[0]["text"] = "Dipole kernel – <i>d</i>"
    titles[1]["text"] = "<i>D</i> = ℱ{<i>d</i>}"
    # ℱ (U+2131) needs a math font; the default sans-serif falls back to an odd glyph.
    titles[1]["font"] = dict(titles[1].get("font", {}), family="Cambria Math, STIX Two Math, STIXGeneral, Times New Roman, serif", size=19)
    for xref, yref in (("x domain", "y domain"), ("x2 domain", "y2 domain")):
        titles.append(dict(xref=xref, yref=yref, x=0.68, y=-0.06, ax=-70, ay=0, showarrow=True, arrowhead=2,
                           arrowsize=1.2, arrowwidth=1.6, arrowcolor="#2a3f5f", text="B<sub>0</sub>",
                           font=dict(size=15, color="#2a3f5f"), xanchor="right"))
    d.update(colorscale=BWR, zmin=-2e-6, zmax=2e-6)
    limit = max(abs(v) for row in D["z"] for v in row if v is not None)
    D.update(colorscale=BWR, zmin=-limit, zmax=limit)
    # Colour bars. d is clipped (it spans three decades), so its bar gives the sign only. The book's D is
    # 1/3 - kz²/k² times a constant: label the bar with the true values (-2/3 along B0, +1/3 across it).
    bar = dict(thickness=12, len=0.75, y=0.5, ticks="outside", tickfont=dict(size=13))
    d.update(showscale=True, colorbar=dict(bar, x=fig["layout"]["xaxis"]["domain"][1] + 0.012,
             tickvals=[-2e-6, 0, 2e-6], ticktext=["−", "0", "+"]))
    # D spans -2/3 to +1/3 (times the book's scale): fit the bar to that range, with white kept at 0 by
    # squeezing the blue half of BWR into the bottom 2/3 of the bar and the red half into the top 1/3.
    scale = limit / (2 / 3)
    zero = 2 / 3
    uneven = [[p / 0.5 * zero, c] if p <= 0.5 else [zero + (p - 0.5) / 0.5 * (1 - zero), c] for p, c in BWR]
    D.update(colorscale=uneven, zmin=-2 / 3 * scale, zmax=1 / 3 * scale, showscale=True,
             colorbar=dict(bar, x=1.012, tickvals=[-2 / 3 * scale, 0, 1 / 3 * scale], ticktext=["−2/3", "0", "+1/3"]))


# Deck-only display changes, applied before compacting.
TWEAKS = {"b0Fig1jn": fig1_field_map_first, "b0Fig2jn": fig2_dipole_bwr}


def figure_from(notebook, label):
    """The Plotly output of the cell whose first `#| label:` is `label` (as MyST resolves it)."""
    nb = json.loads((NOTEBOOKS / notebook).read_text())
    for cell in nb["cells"]:
        labels = re.findall(r"#\|\s*label:\s*(\S+)", "".join(cell.get("source", "")))
        if labels and labels[0] == label:
            for out in cell.get("outputs", []):
                fig = out.get("data", {}).get(PLOTLY)
                if fig:
                    return fig
    sys.exit(f"No Plotly output labelled {label} in {notebook}. Nothing was written.")


def rounded(value):
    if isinstance(value, float):
        if not math.isfinite(value) or value == 0:
            return value
        r = float(f"{value:.{SIG}g}")
        return int(r) if r.is_integer() and abs(r) < 1e15 else r
    if isinstance(value, list):
        return [rounded(v) for v in value]
    if isinstance(value, dict):
        return {k: rounded(v) for k, v in value.items()}
    return value


def halve(fig):
    for trace in fig["data"]:
        z = trace.get("z")
        if trace.get("type") == "heatmap" and isinstance(z, list) and "x" not in trace and "y" not in trace:
            trace["z"] = [row[::2] for row in z[::2]]
            trace["dx"] = trace.get("dx", 1) * 2
            trace["dy"] = trace.get("dy", 1) * 2


def compact(label, fig):
    fig = json.loads(json.dumps(fig))
    template = fig["layout"].pop("template", None)
    if label in HALVE:
        halve(fig)
    fig["layout"].setdefault("width", DEFAULT_SIZE[0])
    fig["layout"].setdefault("height", DEFAULT_SIZE[1])
    fig.pop("config", None)
    return rounded(fig), template


def as_script(label, fig, notebook):
    text = json.dumps(fig, separators=(",", ":"), ensure_ascii=False)
    return (
        f"// Figure {label} from '5 B0 Mapping/{notebook}', compacted by tools/extract_book_figures.py. Do not edit.\n"
        f"window.B0Figures = window.B0Figures || {{}};\nwindow.B0Figures[{json.dumps(label)}] = {text};\n"
    )


def main():
    check = "--check" in sys.argv[1:]
    scripts, templates = {}, set()
    for label, notebook in FIGURES.items():
        source = figure_from(notebook, label)
        if label in MENU_FROM:
            source["layout"]["updatemenus"] = figure_from(notebook, MENU_FROM[label])["layout"]["updatemenus"]
            # Drop the book's panel letter ("a" of Figure 5.3a/b): one figure on the slide.
            source["layout"]["annotations"] = [a for a in source["layout"].get("annotations", []) if len(a.get("text", "")) > 1]
        if label in TWEAKS:
            TWEAKS[label](source)
        fig, template = compact(label, source)
        templates.add(json.dumps(template, sort_keys=True))
        scripts[f"{label}.js"] = as_script(label, fig, notebook)
    if len(templates) != 1:
        sys.exit("The figures use different Plotly themes; extend js/figures/template.js first. Nothing was written.")
    template = json.loads(templates.pop())
    scripts["template.js"] = (
        "// The Plotly theme shared by every B0 notebook figure, written by tools/extract_book_figures.py. Do not edit.\n"
        f"window.B0Template = {json.dumps(template, separators=(',', ':'))};\n"
    )
    if check:
        changed = [n for n, s in scripts.items() if not (OUT / n).exists() or (OUT / n).read_text() != s]
        print("up to date" if not changed else "out of date: " + ", ".join(changed))
        sys.exit(1 if changed else 0)
    OUT.mkdir(parents=True, exist_ok=True)
    for name, script in scripts.items():
        (OUT / name).write_text(script)
        print(f"js/figures/{name:16s} {len(script.encode()) / 1024:7.0f} KB")


if __name__ == "__main__":
    main()
