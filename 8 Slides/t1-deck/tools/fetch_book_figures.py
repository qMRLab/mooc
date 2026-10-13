#!/usr/bin/env python3
"""Copy the T1 chapter's published Plotly figures from the live book into js/figures/.

The book (https://qmrlab.org/mooc/t1-mapping) stores each notebook output either inline in
the page JSON or as /mooc/build/<hash>.json. This script finds every Plotly output by the
label of its figure container (irPlot1, vfaPlot2, ...) and writes it unchanged, wrapped in a
one-line script so the deck also works from file://.

Usage (from the t1-deck folder):
    python3 -I tools/fetch_book_figures.py           # refresh js/figures/
    python3 -I tools/fetch_book_figures.py --check   # report whether js/figures/ matches the book
"""
import json
import sys
import urllib.request
from pathlib import Path

DECK = Path(__file__).resolve().parents[1]
OUT = DECK / "js" / "figures"
SITE = "https://qmrlab.org"
PAGE = f"{SITE}/mooc/t1-mapping.json"
PLOTLY = "application/vnd.plotly.v1+json"
LABELS = [
    "irPlot1", "irPlot2", "irPlot3", "irPlot4", "irPlot5",
    "vfaPlot1", "vfaPlot2", "vfaPlot3", "vfaPlot4", "vfaPlot5", "vfaPlot6",
    "mp2rageplot1", "mp2rageplot2",
]


def get(url):
    with urllib.request.urlopen(url) as response:
        return response.read().decode("utf-8")


def plotly_outputs(node, label=None, found=None):
    """Map figure-container label -> Plotly output entry, walking the page's mdast."""
    found = {} if found is None else found
    if isinstance(node, dict):
        if node.get("type") == "container" and node.get("label"):
            label = node["label"]
        data = (node.get("jupyter_data") or {}).get("data") or {}
        if PLOTLY in data and label:
            found[label] = data[PLOTLY]
        for value in node.values():
            plotly_outputs(value, label, found)
    elif isinstance(node, list):
        for value in node:
            plotly_outputs(value, label, found)
    return found


def figure_json(entry):
    if "path" in entry:
        return get(SITE + entry["path"])
    content = entry["content"]
    return content if isinstance(content, str) else json.dumps(content)


def as_script(label, text):
    json.loads(text)  # refuse anything that is not valid JSON
    return (
        "// Published figure from https://qmrlab.org/mooc/t1-mapping, copied unchanged by\n"
        "// tools/fetch_book_figures.py. Do not edit.\n"
        f"window.T1Figures = window.T1Figures || {{}};\nwindow.T1Figures[{json.dumps(label)}] = {text.strip()};\n"
    )


def main():
    check = "--check" in sys.argv[1:]
    outputs = plotly_outputs(json.loads(get(PAGE))["mdast"])
    missing = [label for label in LABELS if label not in outputs]
    if missing:
        sys.exit(f"Not found on {PAGE}: {', '.join(missing)}. Nothing was written.")
    scripts = {label: as_script(label, figure_json(outputs[label])) for label in LABELS}
    if check:
        changed = [l for l, s in scripts.items() if not (OUT / f"{l}.js").exists() or (OUT / f"{l}.js").read_text() != s]
        print("identical to the book" if not changed else "differs from the book: " + ", ".join(changed))
        sys.exit(1 if changed else 0)
    OUT.mkdir(parents=True, exist_ok=True)
    for label, script in scripts.items():
        (OUT / f"{label}.js").write_text(script)
        print(f"js/figures/{label}.js  {len(script) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
