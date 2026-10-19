#!/usr/bin/env python3
"""Check that every data-book anchor in the deck exists on the live chapter page.

Usage (from the t2-deck folder):  python3 -I tools/check_links.py
"""
import re
import sys
import urllib.request
from pathlib import Path

DECK = Path(__file__).resolve().parents[1]
BOOK = "https://qmrlab.org/mooc/t2-mapping"


def main():
    pages = [DECK / "index.html"]
    labels = sorted({label for page in pages for label in re.findall(r'data-book="([^"]+)"', page.read_text())} - {"top"})
    with urllib.request.urlopen(BOOK) as response:
        ids = set(re.findall(r'\bid="([^"]+)"', response.read().decode("utf-8", "replace")))
    missing = [label for label in labels if label not in ids]
    print(f"{len(labels)} anchors from {len(pages)} pages checked against {BOOK}")
    if missing:
        sys.exit("missing on the book page: " + ", ".join(missing))
    print("all anchors found")


if __name__ == "__main__":
    main()
