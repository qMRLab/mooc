# T1 Mapping slides

Slides for the [T1 Mapping chapter](https://qmrlab.org/mooc/t1-mapping) of the qMRLab mOOC: inversion recovery, variable flip angle and MP2RAGE (66 slides, about 40 minutes per method), plus worked solutions to the chapter's Exercises 1–4 and 6 (`exercise-1.html` … `exercise-6.html`).

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

## Exercise solutions

Each exercise is its own short deck. They are **unlisted**: neither the book nor the T1 deck links to them. One central page, `exercises.html`, links them all; share its address (https://qmrlab.org/mooc/slides/t1/exercises.html once deployed) when the solutions should be available. The exercise pages and `exercises.html` carry `noindex` so search engines skip them. Each deck opens on the problem (quoted from the book), then each part as a question beside its figure, then the answer.

- **Step by step.** Each answer builds up one click at a time: the data first, then what a fit or calculation gives, then the proof or explanation. → (or a clicker) takes the next step and ← undoes it; the numbered buttons (1 · Plot, 2 · Fit, 3 · Prove…) jump to a step.
- **Editable values.** Readings taken from a book figure (Exercises 1a and 2a) are typed on that slide and carry over to the later slides and the answers. Other "measured" values sit in input boxes, pre-filled with our readings. Every step computes from whatever is in the boxes (Enter redraws); **Reset** restores them.
- **Exercises 1–2** work on the book's own Figures 2.2 and 2.8, with overlays (magnitude, WM − GM) added on click.
- **Exercises 3–4** run live in the page with [qmrust](https://github.com/qMRLab/qmrust), the Rust/WebAssembly port of qMRLab: IR signals, long-TR and general-equation fits, and Monte Carlo noise simulations. Results appear in well under a second. If WebAssembly can't load, the plots show a fallback card.

| Exercise | Slides | Live |
|---|---|---|
| 1 · IR null times and WM/GM contrast | 6 | Figure 2.2 + fit |
| 2 · Ernst angle, optimal VFA angles, SPGR contrast | 7 | Figure 2.8 + Eqs. 2.5–2.6 |
| 3 · IR at 1.5 T with TR = 3 s | 5 | qmrust (a, b); Figure 2.6 (c) |
| 4 · From human to mouse: IR protocol design | 5 | qmrust |
| 6 · A collaborator's strange T1 values (images in reverse TI order) | 8 | qmrust on real data: ISMRM 2020 T1 challenge, human + NIST phantom |

## What's here

| Path | Contents |
|---|---|
| `index.html` | The slides. Each `<section>` has `data-book="<anchor>"` for its link back to the book |
| `deck.css` | Theme |
| `js/deck.js` | Reveal setup, math rendering, book links (`LABELS`), figure rendering |
| `exercise-*.html`, `js/ex*.js` | The exercise decks and their Solve actions |
| `js/exercise.js` | Exercise runtime: Solve/Reset buttons, inputs, click-to-solve steps |
| `js/solve.js` | The maths of the solutions (Node-tested) |
| `js/qmrust.js` | Loads qmrust and wraps its inversion recovery model (times in ms) |
| `js/data/ex6.js` | Exercise 6 data, one slice each of the human brain and NIST phantom (rebuild with `python3 -I tools/build_ex6_data.py`) |
| `vendor/qmrust/` | qmrust WebAssembly engine and glue; provenance in `SOURCE.md` (refresh with `python3 -I tools/extract_qmrust.py`) |
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
npm test                         # structure, the solutions' maths, and qmrust (real WebAssembly)
npm run smoke                    # every slide and exercise step in headless Chromium, offline, two screen sizes
python3 -I tools/check_links.py  # every book anchor exists on the live chapter page
```

`npm run smoke` writes screenshots to `tests/screenshots/` for visual review.

## Deploying

Copy `index.html`, `exercises.html`, `exercise-*.html`, `deck.css`, `js/`, `img/` and `vendor/` to the host. The book's deploy workflow does this into `/mooc/slides/t1/`, which `8 Slides/2 - T1 Mapping.md` embeds.

## Chapter issues found while building the deck

- Eq. 2.15 is missing the `=` after m<sub>z,ss</sub> (fixed on the slide).
- The TC definition after Eq. 2.14 uses TI<sub>1</sub>; it should be TI<sub>2</sub> (fixed on the slide).
- The MP2RAGE *Data Fitting* paragraph links "2.16" to `#mp2rageEq3`.
- Figure 2.2's caption says Eq. 2.2, but the plotted curves are Eq. 2.3.
- Figure 2.6's caption says 5 TI values; the data use 6.
- Two figures are numbered 2.11 (`vfaPlot4` and `vfaPlot5`).
- Eq. 2.11 conjugates both GRE signals; Marques et al. (2010) conjugate only S<sub>TI1</sub>.
- Figures 2.2 and 2.3 labelled their x-axis "TI (ms)", but the data are in seconds. Fixed in the book notebooks (Figure-2-1-1/2) and, by hand, in `js/figures/irPlot1.js` and `irPlot2.js`.
- Exercise 2c: Deoni et al. (2003) place the two optimal angles where the signal is ≈ 71% of the Ernst signal, not at "70% of the Ernst angle" (footnoted on the slide).
- Exercise 3a cites Figure 2.3 (`irPlot2`) and "that blog post"; the WM/GM/CSF curves are Figure 2.2 (corrected on the slide).
