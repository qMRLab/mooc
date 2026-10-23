#!/usr/bin/env python3
"""Copy the T2 chapter's published Plotly figures (and one B1 map, for Exercise 2-3) from the live book into js/figures/.

The book (https://qmrlab.org/mooc/t2-mapping) stores each notebook output either inline in
the page JSON or as /mooc/build/<hash>.json. This script finds every Plotly output by the
label of its figure container (t2Plot1, t2Plot2, ...) and writes it unchanged, wrapped in a
one-line script so the deck also works from file://.

Usage (from the t2-deck folder):
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
PLOTLY = "application/vnd.plotly.v1+json"
# The book has no t2Plot6, and Figure 3.6 (t2Plot7) has no published output: its notebook is not built.
LABELS = ["t2Plot1", "t2Plot2", "t2Plot3", "t2Plot4", "t2Plot5", "t2Plot8"]
# Each chapter page and the figures taken from it. Exercise 2-3's intermezzo uses the B1 chapter's Figure 4.13.
PAGES = {"t2-mapping": LABELS, "b1-mapping": ["afiPlot8"]}


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


def as_script(label, text, page):
    json.loads(text)  # refuse anything that is not valid JSON
    return (
        f"// Published figure from https://qmrlab.org/mooc/{page}, copied unchanged by\n"
        "// tools/fetch_book_figures.py. Do not edit.\n"
        f"window.T2Figures = window.T2Figures || {{}};\nwindow.T2Figures[{json.dumps(label)}] = {text.strip()};\n"
    )


def main():
    check = "--check" in sys.argv[1:]
    scripts = {}
    for page, labels in PAGES.items():
        url = f"{SITE}/mooc/{page}.json"
        outputs = plotly_outputs(json.loads(get(url))["mdast"])
        missing = [label for label in labels if label not in outputs]
        if missing:
            sys.exit(f"Not found on {url}: {', '.join(missing)}. Nothing was written.")
        scripts.update({label: as_script(label, figure_json(outputs[label]), page) for label in labels})
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
