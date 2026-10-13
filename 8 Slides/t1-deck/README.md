# T1 Mapping slides

Slides for the [T1 Mapping chapter](https://qmrlab.org/mooc/t1-mapping) of the qMRLab mOOC: inversion recovery, variable flip angle and MP2RAGE (66 slides, about 40 minutes per method).

The deck is a static folder. Open `index.html` directly (it works offline, even from `file://`) or put the folder on any static host.

## Presenting

| Key | Action |
|---|---|
| → / ← | Next / previous slide |
| S | Speaker notes (condensed chapter text and figure captions) |
| F | Full screen |
| Esc | Slide overview |

Add `?print-pdf` to the URL and print to PDF from Chrome for a static copy.

The interactive figures are the book's own Plotly figures. Use their sliders, buttons and hover with the mouse. Every slide links (bottom left) to the matching place in the book.

## What's here

| Path | Contents |
|---|---|
| `index.html` | The slides. Each `<section>` has `data-book="<anchor>"` for its link back to the book |
| `deck.css` | Theme |
| `js/deck.js` | Reveal setup, math rendering, book links (`LABELS`), figure rendering |
| `js/figures/*.js` | The book's published figures, copied unchanged. Do not edit |
| `img/` | Pulse-sequence diagrams from the chapter |
| `vendor/` | reveal.js 5.2.1, KaTeX 0.16.11, plotly.js 2.35.2 (the version the book uses) |

## Figures

The figures are drawn at the book's own size and scaled up as a whole to fit the slide. Nothing else about them changes.

To refresh them after the book is rebuilt:

```sh
python3 -I tools/fetch_book_figures.py           # copy the latest figures from the book
python3 -I tools/fetch_book_figures.py --check   # report whether js/figures/ matches the book
```

## Tests

```sh
npm install && npx playwright install chromium   # once
npm test                         # structure: book anchors, script tags, figures
npm run smoke                    # every slide in headless Chromium, offline, two screen sizes
python3 -I tools/check_links.py  # every book anchor exists on the live chapter page
```

`npm run smoke` writes screenshots to `tests/screenshots/` for visual review.

## Deploying

Copy `index.html`, `deck.css`, `js/`, `img/` and `vendor/` to the host. The MyST page `8 Slides/2 - T1 Mapping.md` iframes `https://qmrlabmooc.s3.ca-central-1.amazonaws.com/t1/index.html`. Update that URL if the deck is hosted elsewhere.

## Chapter issues found while building the deck

- Eq. 2.15 is missing the `=` after m<sub>z,ss</sub> (fixed on the slide).
- The TC definition after Eq. 2.14 uses TI<sub>1</sub>; it should be TI<sub>2</sub> (fixed on the slide).
- The MP2RAGE *Data Fitting* paragraph links "2.16" to `#mp2rageEq3`.
- Figure 2.2's caption says Eq. 2.2, but the plotted curves are Eq. 2.3.
- Figure 2.6's caption says 5 TI values; the data use 6.
- Two figures are numbered 2.11 (`vfaPlot4` and `vfaPlot5`).
- Eq. 2.11 conjugates both GRE signals; Marques et al. (2010) conjugate only S<sub>TI1</sub>.
