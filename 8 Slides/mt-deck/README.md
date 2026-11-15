# Magnetization Transfer slides (draft)

Lecture deck and exercises for the [Magnetization Transfer chapter](https://qmrlab.org/mooc/magnetization-transfer-imaging) of the qMRLab mOOC: `index.html` (28 slides; 2, 3, 4, 5 are new drafts, to be trimmed) and five exercise decks linked from `exercises.html`. Same static-folder format as the T1, T2, B1 and B0 decks: reveal.js, KaTeX and plotly.js (cartesian) are vendored in `vendor/`, `deck.css` is the shared deck style and `js/nav.js` adds the left and right click zones. Everything works offline, even from `file://`.

Unlike the other decks, almost no figure is copied from the book. The slides are built around one engine, **a two-pool Bloch–McConnell simulator that runs in the page** (`js/mt-sim.js`), and **the chapter's own 3 T qMT dataset** (`js/data/brain.js`). Every plot is computed live, so students can move a slider, click a voxel or switch a protocol. The order of the slides follows the physics (two pools, saturation, exchange, then the Z-spectrum, then qMT, MTR and MTsat), not the chapter's sections.

## Slides

| # | Slide | What is live |
|---|---|---|
| 2 | A tale of two timescales (draft) | One on-resonance FID over 300 ms (slow part, T<sub>2</sub> = 70 ms) beside an MPRAGE of the same volunteer, and its first 0.1 ms zoomed in from a red rectangle: a fast part (T<sub>2</sub> ≈ 12 µs) falling to the slow part, beside an image that cannot exist (`js/mt-scales.js`, `img/mprage.png`) |
| 3 | Mobile and restricted protons (draft) | Two animations: water molecules tumbling and moving freely, and a lipid bilayer (myelin) whose hydrogens are locked in place; hydrogen drawn the same in both (`js/mt-protons.js`) |
| 4 | Decay ⇄ lineshape (draft) | 2 × 2: the FIDs of water (T<sub>2</sub> = 70 ms) and of the macromolecules (super-Lorentzian decay, T<sub>2</sub> = 12 µs), and their Fourier transforms on the same symmetric-log offset axis (±100 kHz, linear within ±0.1 Hz), Lorentzian and super-Lorentzian (`js/mt-fidgrid.js`) |
| 5 | Where it happens: myelin (draft) | Animated cartoon of myelin lamellae: RF saturates the membrane, water carries the saturation away (`js/mt-myelin.js`) |
| 6 | The model behind it: Bloch–McConnell | The equations, colour-coded (with the chapter's sign errors fixed), F = M<sub>0,r</sub>/M<sub>0,f</sub> defined, and the two-pool tanks during and after off-resonance RF: water only, two pools without exchange, two pools with exchange (the default; no signal curve). Picking a case greys out the terms it removes from the equations |
| 7 | MT off vs MT on | The real slice without and with the off-resonance RF (same grey scale) and their ratio: the signal drops most where there is myelin |
| 8–9 | MT-based mapping methods we’ll cover (MTR, MTsat, qMT); the MT-SPGR | The sequence drawn to scale, MT on or off |
| 10 | MTR (method 1 of 3) | A method banner; 2 acquisitions, Eq. 6.7, units and the WM range (30–60 %, depending on the protocol), typical MT pulse settings; the dataset's MTR map with WM and GM medians |
| 11 | MTR: benefits and pitfalls | Benefits (available, fast to acquire and process) and pitfalls (not tissue-specific, B<sub>1</sub><sup>+</sup>, T<sub>1</sub>, vendor settings), each pitfall with a simulated WM number |
| 12 | MTsat (method 2 of 3) | A method banner; Helms 2008, the MT pulse modelled as a second on-resonance pulse α<sub>2</sub>, MTsat = δ = 1 − cos α<sub>2</sub>, units and the WM range (2–7 %, Table 6.4 protocols simulated); the chapter's Figures 6.14 and 6.15 (`img/mtsat-sequence.png`, `img/mtsat-model.png`) |
| 13 | The Z-spectrum | Sliders for F, k<sub>f</sub>, T<sub>2,r</sub>, T<sub>2,f</sub>; direct saturation alone dashed |
| 14 | Real Z-spectra | Click any voxel: its 10 measured points and the model with qMRLab's fit |
| 15 | qMT fit | Error in the fitted F, k<sub>f</sub>, T<sub>2,f</sub>, T<sub>2,r</sub> when the B<sub>1</sub>, T<sub>1</sub> or B<sub>0</sub> map is wrong (our redo of Figure 6.6) |
| 16 | qMT maps | F, k<sub>f</sub>, T<sub>2,f</sub>, T<sub>2,r</sub>, B<sub>0</sub>, B<sub>1</sub>, T<sub>1</sub>, with WM and GM medians |
| 17 | MTR | S<sub>0</sub>, S<sub>MT</sub> and the MTR map for any of the 10 MT images of the same session |
| 18 | Same tissue, different scanner | MTR of five tissues × four vendor protocols (Figure 6.9) |
| 19 | MTR vs T<sub>1</sub> and B<sub>1</sub> | Sliders and curves (Figures 6.10–6.11) |
| 20 | Helms' trick | One steady-state TR, two-pool water M<sub>z</sub> against the Helms model with the same signal |
| 21 | The derivation | Fragments; the TR<sub>1</sub> → TR correction |
| 22 | MTsat across protocols | Five tissues × six protocols of Table 6.4 (Figure 6.17) |
| 23 | MTsat vs MTR, T<sub>1</sub> and B<sub>1</sub> | Relative change, with or without B<sub>1</sub> correction (Figures 6.18–6.19) |
| 24 | What MTsat measures | The free pool's M<sub>z</sub> budget over one TR, term by term (Appendix C, exact) |
| 25 | MTR and MTsat of one brain | Real maps and every voxel's MTR against MTsat, coloured by T<sub>1</sub> |
| 26 | MT is in every sequence (moved near the end: keep or scrap) | Two-pool simulation of VFA T<sub>1</sub>: 0.87 s for a true 1.00 s |

Pause badges link the exercises: 6-1 on slide 7, 6-2 on slide 9, 6-3 on slide 16, 6-4 on slide 19, 6-5 on slide 25.

## Exercises

Each is its own short deck (cover, one to three parts, summary), with checked answers, "predict first" questions and the simulator. The pages carry `noindex`. The book embeds `exercises.html` on `8 Slides/6 - Magnetization Transfer Exercises.md`.

| Exercise | Parts |
|---|---|
| 6-1 · Two tanks, one pipe | The two-pool equations as plumbing (moved from the lecture): faucet + drain = T<sub>1</sub>, one pipe = exchange, RF valve = W<sub>r</sub>, direct-saturation valve = W<sub>f</sub>; live levels, strip chart, RF amplitude and offset, F, k<sub>f</sub>, T<sub>1</sub>; presets for white matter, no exchange and water only |
| 6-2 · Pulse after pulse | 80 TRs of the Karakuzu Siemens MT-weighted protocol from equilibrium (moved from the lecture): WM, GM or a water phantom; TR slider for the zoomed TR, with the pulse power and water's exchange vs T<sub>1</sub> rates; optional MT-off overlay |
| 6-3 · Fit a qMT voxel by hand | (a) sliders on a real voxel against its 10 points; (b) your fit, the computer's (Levenberg–Marquardt with the simulator) and qMRLab's, and the F–k<sub>f</sub> valley; (c) refit with a wrong B<sub>1</sub> |
| 6-4 · What does MTR measure? | The chapter's Exercises 1–7: (a) MTR from a Z-spectrum; (b) F = 0, 10, 20 %; (c) k<sub>f</sub> = 5, 2.5, 0; (d) what it means |
| 6-5 · MTsat by hand, then on a brain | (a) R<sub>1</sub>, A and MTsat from three images; (b) against the simulation's truth; (c) MTsat of a real voxel, then MTR and MTsat maps and their WM/GM contrast |

## What's here

| Path | Contents |
|---|---|
| `index.html`, `mt.css` | The lecture and its styles (on top of `deck.css`) |
| `exercises.html`, `exercise-6-*.html`, `exercise.css` | The exercises |
| `js/mt-sim.js` | The simulator (also loads in Node): lineshapes, MT pulse shapes, the Bloch–McConnell propagators, the steady state of one TR as an affine map (exact, instant), trajectories, the TR budget, Helms' equations, a qMT fit, and the chapter's tissues and protocols |
| `js/deck.js` | Reveal and KaTeX setup, 📖 links (`LABELS`), pop-out link, and the widget hook (`MTDeck.widget(slideId, init)`: built when its slide is current or next to it) |
| `js/mt-common.js` | Colours (one per physical thing, the same on every slide), Plotly wrapper, controls, access to the real slice |
| `js/mt-widgets.js` | The lecture's live figures |
| `js/mt-scales.js` | Slide 2 (draft): two timescales, the zoom from ms to µs drawn over the plots |
| `js/mt-protons.js` | Slide 3 (draft): mobile water and a restricted lipid bilayer, two canvas animations drawn while shown |
| `js/mt-fidgrid.js` | Slide 4 (draft): decays and their Fourier transforms (symmetric-log ±100 kHz), water and macromolecules, fixed T<sub>2</sub>s |
| `js/mt-tanks.js` | Exercise 6-1: the two-tank, one-pipe picture, animated while shown |
| `js/mt-steady.js` | Exercise 6-2: 80 MT-SPGR repetitions to a steady state, one TR zoomed in (moved from the lecture) |
| `js/mt-myelin.js` | Slide 5 (draft): the myelin cartoon, a 22 s canvas loop drawn while shown |
| `js/ex-common.js`, `js/ex6*.js` | Answer boxes and the exercises' scripts |
| `js/data/brain.js` | One slice of the dataset, written by `tools/make_brain_data.py` |
| `js/data/fit-errors.js` | Slide 15's fits, written by `tools/make_fit_errors.js` |
| `vendor/` | reveal.js 5.2.1, KaTeX 0.16.11, plotly.js-cartesian 2.35.2 (copied from the B0 deck) |

## The simulator

Two pools (Henkelman 1993; Sled & Pike 2000, 2001), as qMRLab's qMT-SPGR "Bloch sim": the free pool with full Bloch equations during the MT pulse, the restricted pool saturated at W = πω<sub>1</sub>²G(Δ, T<sub>2,r</sub>), exchange k<sub>f</sub> and k<sub>r</sub> = k<sub>f</sub>/F. Each TR is an MT pulse (piecewise-constant ω<sub>1</sub>, exact matrix exponentials), a 3 ms gap, an instantaneous excitation of the free pool and ideal spoiling. Ideal spoiling makes one TR an affine map of (M<sub>z,f</sub>, M<sub>z,r</sub>), so the steady state is one 2 × 2 solve.

The number of pulse steps depends on the offset. Holding ω<sub>1</sub> constant over steps of dt adds copies of the pulse's spectrum at multiples of 1/dt, and one landing on water would saturate it directly (errors up to 0.08 in S<sub>MT</sub>/S<sub>0</sub>). The steps are chosen to put the offset midway between two copies (`stepsFor`).

Checked in `tests/sim.test.js` against the chapter's qMRLab results:

| | qMRLab (chapter) | Here |
|---|---|---|
| Appendix C, Simulation 1: MTR / MTsat / T<sub>1</sub> (WM, Karakuzu Siemens) | 58.98 % / 5.34 % / 1.01 s | 59.8 % / 5.5 % / 1.01 s |
| Simulation 2: net M<sub>z</sub> drop across the pulse | 0.314 % | 0.318 % |
| Figure 6.9: MTR, 5 tissues × 4 protocols | | within 1.3 points |
| The dataset: qMRLab's fit → the measured data | resnorm ~0.004 | median abs. error ~0.013 |

The GE protocol's Fermi pulse shape is not reported, so its plateau and edge widths are set to reproduce Figure 6.9. Campbell 2018 reports no MT pulse shape or duration, so Helms 2008's are used.

## Data

`js/data/brain.js` holds one axial slice (2 × 2 × 5 mm) of the 2013 Stikov 3 T session, the qMT protocol of Boudreau, Stikov & Pike (MRM 2018). That protocol is qMRLab's default qMT-SPGR: 7°, TR 25 ms, a Gauss-Hann MT pulse of 10.24 ms at 142° and 426°, offsets 443–17235 Hz. The slice contains:

- the normalized MT data, mask and qMRLab fit (F, k<sub>f</sub>, T<sub>2,f</sub>, T<sub>2,r</sub>) with its input B<sub>0</sub>, B<sub>1</sub> and R<sub>1</sub> maps, from the book's `06-MT-01-qMT.zip` (qMRLab/mooc-data v1.1, `results/realData`, the data of Figure 6.7);
- the MT-off image (series 52 of the raw session) for anatomy.

The book's arrays are the raw slice transposed and mirrored; the tool puts them back, anterior up.

```sh
python3 -I tools/make_brain_data.py [--book path/to/realData] [--raw path/to/stikov_nikola_20131017_113942]
node tools/make_fit_errors.js
python3 -I tools/make_mprage.py   # img/mprage.png, slide 2 (--raw path/to/stikov_nikola_20131017_113942)
```

## Tests

```sh
npm install && npx playwright install chromium   # once
npm test         # simulator vs qMRLab and the dataset, deck structure, the book's pages and deployment
npm run smoke    # every slide and exercise in headless Chromium, offline, two screen sizes, with the main interactions
python3 -I tools/check_links.py                  # every book anchor exists on the live chapter page
```

## Deploying

The book's deploy workflow copies `index.html`, `exercises.html`, `exercise-*.html`, `deck.css`, `mt.css`, `exercise.css`, `js/`, `img/` and `vendor/` to `/mooc/slides/mt/`. That folder is embedded by `8 Slides/6 - Magnetization Transfer Imaging.md` and `8 Slides/6 - Magnetization Transfer Exercises.md`. The old single-file deck (`8 Slides/mtslides.html`, hosted on S3) is no longer embedded.

## Chapter issues found while building the deck

- **Eq. 6.3** is missing the −k<sub>f</sub>M<sub>z,f</sub> exchange term, and in **Eq. 6.4** the saturation term should be −WM<sub>z,r</sub> (fixed on slide 6).
- **Eqs. 6.10–6.12** (MTsat theory) have R<sub>1</sub>·TR<sub>1</sub> in their denominators; it is R<sub>1</sub>·TR (Helms 2008; the chapter's own Appendix B computes with TR). Eq. 6.10's denominator should be 1 − cos α<sub>1</sub> cos α<sub>2</sub>(1 − R<sub>1</sub>TR). Fixed on slide 21.
- **Equation numbers repeat**: 6.5–6.9 are each used twice (qMT and MTsat), and MTR is Eq. 6.7 as well.
- **Appendix B** says α<sub>1</sub> = 15° (Brown 2013's angle) but computes with 0.087 rad = 5°. With 15°, δ would be 7.5 %, not 4.9 %.
- The MTsat text refers to "Appendix A" for the derivation that is in Appendix B; the label `mtsatAppendixA` names Appendix B. Appendix C has two sections titled "Simulation 3" and still contains "(figure or quote)".
- **Exercise 1** refers to `#daPlot3`, a double-angle figure of the B<sub>1</sub> chapter, not a Z-spectrum. Exercises 2–4 give F as "0.0, 10.0, 20.0", which only makes sense in %. Exercise 6-4 uses a measured Z-spectrum and reads F in %.
- The captions of Figures 6.10–6.12 still have placeholders ("(protocol?) and (tissue?)"), and Figure 6.13's caption is "Surface map". Figure 6.14's caption calls the MTsat sequence "an MTR imaging sequence", and Figure 6.17's caption says "four … MTR protocols" where Table 6.4 lists six MTsat protocols.
- In **Figure 6.6** one x-axis title ("Input map") covers three different quantities (B<sub>1</sub> relative, B<sub>0</sub> in Hz, T<sub>1</sub> as a ratio), and the T<sub>2,f</sub> panel's axis says "(s)" for a % error (slide 15 redoes it).
- The MTsat theory checks the δ = 0 limit against "[](#mtsatFig3)", a figure; the equation meant is Eq. 6.11/6.12.
