# T2 Mapping slides

Slides for the [T2 Mapping chapter](https://qmrlab.org/mooc/t2-mapping) of the qMRLab mOOC: mono-exponential and multi-exponential T2 mapping, with T2* and QSM (33 slides: 6 opening, 13 mono-exponential, 12 multi-exponential, 2 closing), plus worked solutions to the chapter's Exercises 1–4 (`exercise-1.html` … `exercise-4.html`). Same format as the [T1 deck](../t1-deck/README.md).

The deck is a static folder. Open `index.html` directly (it works offline, even from `file://`) or put the folder on any static host.

## Presenting

| Key | Action |
|---|---|
| → / ← | Next / previous slide |
| S | Speaker notes (condensed chapter text and figure captions) |
| F | Full screen |
| Esc | Slide overview |

Add `?print-pdf` to the URL and print to PDF from Chrome for a static copy.

The interactive figures are the book's own Plotly figures. Use their menus, sliders and hover with the mouse. Every slide links (bottom left) to the matching place in the book.

## Exercise solutions

As for the T1 deck: each exercise is its own short deck, and one central page, `exercises.html` (https://qmrlab.org/mooc/slides/t2/exercises.html), links them all. The book embeds it in its own page, `8 Slides/3 - T2 Mapping Exercises.md`; that page is no longer in the TOC (Exercises 2-1 to 2-4 below took its place under Slides), so the book no longer builds it, but the slides themselves are still deployed and reachable at that address. The T2 deck itself does not link to the solutions; it may point to the interactive Exercises 2-1 to 2-4, in a new tab (slide 10 does, for Exercise 2-3). The exercise pages and `exercises.html` carry `noindex` so search engines skip them. Each deck opens on the problem (quoted from the book), then each part as a question beside its figure, then the answer.

- **Step by step.** Each answer builds up one click at a time: the data first, then the result, then the proof or explanation. → (or a clicker) takes the next step and ← undoes it; the numbered buttons (1 · Contrast, 2 · Maximum, 3 · Prove…) jump to a step.
- **Editable values.** Readings taken from a book figure (Exercise 2a–b) are typed on that slide and carry over to the later slides and the answers. Other values sit in input boxes, pre-filled; every step computes from whatever is in the boxes (Enter redraws), and **Reset** restores them.
- **Exercises 1–2** work on the book's own Figures 3.3, 3.1 and 3.5, with overlays (contrast curve, levels, readings, a mono-exponential fit) added on click.
- **Exercises 3–4** compute in the page (`js/solve.js`), drawn in the style of Figures 3.5 and 3.4. Exercise 4 simulates noise as the Figure 3.4 notebook does (Gaussian, SD = 1/SNR at TE = 0), with a seeded generator so the slides are the same every time. No qmrust is needed: the T2 exercises only need closed forms, a 1-D fit and Gaussian noise.

| Exercise | Slides | Live |
|---|---|---|
| 1 · Optimal TE for WM/GM contrast (T2, T2*), and which of Figure 3.1's TEs to use | 6 | Figures 3.3 and 3.1 + Eq. 3.1 |
| 2 · MW and IEW decay times, T2 without fitting, mono-exponential fit of a 50/50 voxel | 6 | Figure 3.5 + fit of Eq. 3.2 |
| 3 · MWF (Eq. 3.8) at six TEs | 3 | Eq. 3.8 |
| 4 · SNR at four TEs for T2 = 109 ms and T2* = 30 ms; longest useful TE | 5 | Monte Carlo as in Figure 3.4's notebook |

## Exercises 2-1 to 2-4 (interactive)

Four interactive exercises on echoes, the CPMG echo train and myelin water, with a starting page, `exercises-2.html` (https://qmrlab.org/mooc/slides/t2/exercises-2.html), that the book embeds in `8 Slides/3 - T2 Mapping Exercises 2.md`, listed under Slides below the T2 deck. Exercises 2-1 to 2-3 run on `js/exn.js`: a Bloch simulation of 385 spins (1537 for the Lorentzian fan) with relaxation, drawn in 3D, and the arrow keys as RF pulses about ±x and ±y.

- **Exercise 2-1, RF phase and spin echoes** (`exercise-2-1.html`, 9 slides). The controls (B₁ along ±x or ±y, with the tip's trail: a circle or a cone, and the arrow keys on screen); a target game on the same sphere (two levels, scored in RF pulses and total angle, with an expert score and an animated solution); a fan of spins TE/2 after the 90° (flip-angle slider, animated pulses, Wait TE/2 and Wait TE); a lab with free timing: a spin echo; and a tutorial-style single echo (a red square at TE/2 to press, ACQ at TE), which gives T₂ = −TE / ln S, or T₂* without the 180°.
- **Exercise 2-2, Stimulated echoes** (`exercise-2-2.html`, 8 slides). Labs with free timing: a stimulated echo (three 90°s), an imperfect refocusing pulse (part 180°, part 0°, part 90°, with live bars), and evenly spaced pulses.
- In the labs of Exercises 2-1 and 2-2, after each pulse, markers show every spin echo (SE) and stimulated echo (STE) it will make, with its size, from the extended phase graph of the actual pulse times, angles and axes. Each lab asks a question; the "What we saw" slide after it answers.
- **Exercise 2-3, Measuring T₂ with an echo train** (`exercise-2-3.html`, 14 slides). Questions (a)–(d) on the title slide, a refresher on the controls and symbols, then the "Phase"Hero game: hit each 180° box on the beat (a press inside the box fires exactly on it) and pick each pulse's axis; the next slide fits S0·e^(−TE/T2) to the ten echoes. With perfect pulses, then an intermezzo with a measured B₁ map (the B₁ chapter's Figure 4.13, `js/figures/afiPlot8.js`, with contours every 0.1 from B₁ = 0.8 to 1.1), then with B₁ = 0.89 (80°/160°, crushers on), then B₁ = 0.67 (60°/120°) with fits to all echoes, without echo 1, to even or odd echoes. Then the lessons and a sandbox with every setting open (angles, crushers, T₂, T₁, τ, echoes, fan, speed), whose runs can be exported as JSON.
- **Exercise 2-4, Myelin water** (`exercise-2-4.html`, 3 slides, `js/mwf.js`). One slice of fresh sheep brain at 7 T (104 echoes, 5 ms apart). Slide 2: an echo slider over the raw images; a click on a pixel shows its T₂ distribution, and its echoes with the decay the distribution predicts; students pick a white-matter pixel. Slide 3: that pixel's distribution with two rectangles, MW and IEW, to drag and stretch; Generate MWF map computes MWF = S_MW / (S_MW + S_IEW) at every pixel from the areas inside them, and maps it (hover for values). The distributions were fitted once, offline (`tools/prep_mwf_sheep.py`: NNLS on an EPG basis with the refocusing angle fitted per pixel, a noise-floor term and light smoothing).
- **Exercise 2-4's data is CC BY-NC 4.0** (Murguia et al., University of Michigan Deep Blue Data, doi:10.7302/dp7t-c323), so it is not committed here. It is published, modified (one slice, cropped, fitted), with its README and license notice, in the [qMRLab/mooc-data v1.3 release](https://github.com/qMRLab/mooc-data/releases/tag/v1.3) as `03-T2-04-MWF-sheep.zip`. `python3 -I tools/fetch_mwf_data.py` downloads it (checking its SHA-256) into `data/` and writes `js/data/mwfSheep.js` (8-bit, about 2.8 MB), which the deck loads; both folders are git-ignored. The deploy workflow runs it before copying the deck. The slides credit the data and its license.
- On each game and lab, the fan of spins can be equally spaced (the signal decays as a sinc), Gaussian, or Lorentzian (it decays as e^(−t/T₂′), so with no refocusing pulses the fit gives T₂*). Exercise 2-3's games and sandbox start on the Lorentzian fan.
- On these slides the arrow keys play the game, so the slides move with the grey bars at the left and right edges (or Space and Page Down).

## What's here

| Path | Contents |
|---|---|
| `index.html` | The slides. Each `<section>` has `data-book="<anchor>"` for its link back to the book |
| `deck.css` | Theme (the T1 deck's, without its notebook-code box) |
| `js/deck.js` | Reveal setup, math rendering, book links (`LABELS`), figure rendering |
| `js/nav.js` | The grey bars at the left and right edges that move between slides (the lecture deck and Exercises 2-1 to 2-4) |
| `js/relax.js` | The lecture deck's T<sub>2</sub> / T<sub>2</sub>* animation (slide 2) |
| `js/t2wmap.js` | Slide 3: the T<sub>2</sub>-weighted image beside the T<sub>2</sub> map (log-processed Navia, Fuderer et al. 2025) |
| `js/t2wsim.js`, `js/phantom/brainT2w.js`, `tools/prep_t2w_phantom.py` | Slide 6: a T<sub>2</sub>-weighted spin echo simulated from T<sub>1</sub>, T<sub>2</sub> and PD maps of one brain slice, with TR and TE sliders. The anatomy is KomaMRI's brain phantom (MIT license), from the BrainWeb digital brain; the 3 T tissue values and their sources are in the script |
| `exercises.html`, `exercise-*.html`, `js/ex*.js` | The exercise decks and their actions |
| `exercises-2.html`, `exercise-2-1.html`, `exercise-2-2.html`, `exercise-2-3.html`, `js/exn.js` | Exercises 2-1 to 2-3: the starting page, the three decks, and their simulation, games and fits |
| `exercise-2-4.html`, `js/mwf.js` | Exercise 2-4: the myelin water deck and its image, plots and MWF map |
| `tools/prep_mwf_sheep.py`, `tools/fetch_mwf_data.py` | Exercise 2-4's data: the one-off fit that made the mooc-data release, and the build step that fetches it and writes `js/data/mwfSheep.js` |
| `js/exercise.js` | Exercise runtime (the T1 deck's, without qmrust): step buttons, Reset, inputs, click-to-solve steps |
| `js/solve.js` | The maths of the solutions (Node-tested) |
| `js/figures/*.js` | The book's published figures, copied unchanged (the T2 chapter's, and the B1 chapter's Figure 4.13 for Exercise 2-3). Do not edit |
| `img/` | Pulse-sequence diagram from the chapter (`t2_sequence.png`, and `t2_sequence.svg`, a vector redraw of it made by `tools/draw_t2_sequence.py`, which the slide shows), qMRLab logo |
| `vendor/` | reveal.js 5.2.1, KaTeX 0.16.11, plotly.js 2.35.2 (the version the book uses) |

## Figures

Six figures: 3.1, 3.3, 3.4, 3.5, 3.7 and 3.8 (`t2Plot1`–`t2Plot5`, `t2Plot8`), plus the Figure 3.2 pulse sequence image. Figure 3.6 is not in the deck: the book publishes no output for it (see below).

The figures are drawn at the book's own size and scaled up as a whole to fit the slide. Nothing else about them changes.

To refresh them after the book is rebuilt:

```sh
python3 -I tools/fetch_book_figures.py           # copy the latest figures from the book
python3 -I tools/fetch_book_figures.py --check   # report whether js/figures/ matches the book
```

## Tests

```sh
npm install && npx playwright install chromium   # once
npm test                         # structure (book links, scripts, figures, book pages, deploy wiring) and the solutions' maths
npm run smoke                    # every slide and exercise step in headless Chromium, offline, two screen sizes
python3 -I tools/check_links.py  # every book anchor exists on the live chapter page
```

`npm run smoke` writes screenshots to `tests/screenshots/` for visual review.

## Deploying

Run `python3 -I tools/fetch_mwf_data.py` (Exercise 2-4's data), then copy `index.html`, `exercises.html`, `exercises-2.html`, `exercise-*.html`, `deck.css`, `js/`, `img/` and `vendor/` to the host. The book's deploy workflow does this into `/mooc/slides/t2/`, which `8 Slides/3 - T2 Mapping.md` and `8 Slides/3 - T2 Mapping Exercises.md` embed.

## Chapter issues found while building the deck

- Eq. 3.4 is a copy of Eq. 3.2 (T<sub>2</sub> in the exponent); the text describes the T<sub>2</sub><sup>*</sup> decay (fixed on the slide).
- The T2* section's first paragraph points to Eq. 3.3 and Figure 3.1; it means Eq. 3.1 (the T<sub>2</sub> decay) and Figure 3.3 (the T<sub>2</sub><sup>*</sup> curves).
- In the *Noise* section, the code dropdown says it generated Figure 3.5 (`t2Plot4`); it is the code for Figure 3.4 (`t2Plot3`).
- Figure 3.6 (`t2Plot7`, embed `t2Fig6jn`) shows only its caption: `Figure-3-3-3.ipynb` is not in the `myst.yml` TOC, so it is never executed. Its caption is a copy of Figure 3.5's, but the notebook draws spinal cord images like Figure 3.7.
- Figure 3.8: the caption is cut off ("This figure was generated by reusing"), has typos ("in ppm a brain resuting", "seperated"), and describes high- and low-frequency field components (left, middle). The figure itself shows a simulated B<sub>0</sub> map (left) and the susceptibility distribution (middle), with an empty third column. Its colorbar units are swapped (the B<sub>0</sub> map says ppm, χ says Hz): the `t2Fig7jn` cell in `5 B0 Mapping/.../Figure-5-1-3.ipynb` swaps the panels' data and titles but not their colorbars. Flagged in the slide's speaker notes.
- Figure 3.1: the T<sub>2</sub> map trace is named "T1 values (ms)" (visible on hover).
- Figure 3.7: each of the two menus resets the other panel (choosing a TE shows the MWF map; choosing a map shows the 256 ms image).
- The QSM paragraph lists calcium among the paramagnetic substances; calcium is diamagnetic. The slide lists the substances without classing them.
- Figure 3.3 gives WM a longer T<sub>2</sub> than GM (109.77 vs 96.07 ms). Most reports have GM longer than WM; worth checking against Siemonsen 2008. Exercise 1 uses the figure's values as published.
- Figure 3.5 first draws its dotted curve at 52% MW (the simulation's fitted MWF) while its slider reads "50% MW 50% IEW". Some slider labels don't add up to 100% ("60% MW 39% IEW"). Exercise 2d redraws an exact 50/50 mix.
- Exercise 2a: "the signal myelin water (MW) signal" (quoted as written).
- Exercise 3: Eq. 3.8 evaluated at a TE gives MW's share of the signal at that echo, not the voxel's MWF; only TE = 0 gives the voxel's 50%. The solution makes this the point of the exercise.
- Exercise 4a takes Figure 3.1's TEs (12.8, 128, 256, 384 ms) for Figure 3.4's T<sub>2</sub> of 109 ms.
