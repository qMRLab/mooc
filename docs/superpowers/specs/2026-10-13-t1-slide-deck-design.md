# T1 Mapping Slide Deck — Design

- **Date:** 2026-10-13
- **Author:** Mathieu Boudreau (with Claude)
- **Status:** Draft, awaiting review
- **Branch:** `mb/t1-slides`

## 1. Purpose

Nikola Stikov asked for slides derived from the T1 mapping chapter, in the style of the existing MT deck (`8 Slides/6 - Magnetization Transfer Imaging.md`, which iframes `mtslides.html` from S3). The 2025 ChatGPT-era IR demo (`s3/t1summary.html`) covers only inversion recovery, has no links back to the book, and embeds a separate 4–6 MB Plotly export per figure.

This deck replaces that demo with one polished, interactive, web-hosted deck covering the whole chapter: inversion recovery (IR), variable flip angle (VFA), and MP2RAGE.

### Audience and use

- **Primary:** an instructor (Nikola) presenting live in class. They need sparse slides, live sliders for "what if" questions, speaker notes, and a way to hide answers so the exercises can be done in class.
- **Secondary:** students browsing the mOOC, who reach the deck through an embedded page in the book's *Slides* section.

### Success criteria

1. Opening one URL (or double-clicking `index.html` offline) gives a ~43-slide deck covering IR, VFA, and MP2RAGE.
2. Every content slide has a consistently placed link to the exact book anchor it comes from (`https://qmrlab.org/mooc/t1-mapping#<label>`).
3. Closed-form figures are live: dragging a slider (TR, TI, flip angle, T1, B1) redraws the curve instantly.
4. Every equation and simulated value matches the chapter, and automated tests check the JS model against Python reference values.
5. The whole deck weighs ≤ 8 MB (today's IR demo with its figure iframes is ~26 MB) and has no runtime network dependency.

### Decisions already made

| Decision | Choice |
|---|---|
| Scope | Deck only. The worked problem solution in qMRLab format is a separate follow-up project. |
| Hosting | Undecided, so the deck is a portable static folder with relative paths only. |
| Depth | Detailed, 10–15 slides per method. |
| Approach | reveal.js deck, live JS model for closed-form figures, precomputed data for simulations and brain datasets. |

## 2. Architecture

```
mooc/8 Slides/t1-deck/
  index.html              slide markup only
  deck.css                theme (16:9, light, book-matched typography)
  js/
    t1-models.js          pure math, no DOM (UMD: browser global + Node require)
    deck.js               Reveal init, KaTeX render, book-link footers, figure lifecycle
    figures/<name>.js     one module per interactive figure
    data/<name>.js        precomputed data as JS files (window.T1Data.<name> = {...})
  img/                    pulse-sequence PNG/SVG copied from the chapter img/ folders
  vendor/                 pinned reveal.js 5.x, KaTeX 0.16.x (+fonts), plotly.js cartesian dist 2.x
  tools/
    export_data.py        builds js/data/*.js and tests/fixtures/*.json
    check_links.py        checks every data-book anchor exists on the live chapter page
  tests/
    models.test.js        node --test, no npm dependencies
    fixtures/*.json       Python-generated reference values
  README.md               how to present, edit, re-export data, test, deploy
```

### Key choices

- **Classic scripts, not ES modules, with data as `.js` files rather than JSON.** Browsers block `fetch()` and module imports on `file://`, so this is the only way double-clicking `index.html` on a laptop with no internet still works. Each file attaches to one namespace: `window.T1Models`, `window.T1Figures`, `window.T1Data`.
- **Figures render inline in `<div>`s, not iframes.** This removes the iframe sizing hacks and the duplicated plotly.js. `deck.js` mounts a figure when its slide (or the next one) becomes current, and unmounts figures two or more slides away, which keeps memory flat. In `?print-pdf` mode every figure mounts once with default parameters, so PDF export shows a static snapshot.
- **Figure contract:** `T1Figures.<name> = { mount(el, opts) -> { unmount() } }`. A figure reads only `T1Models`, `T1Data`, and the shared plot style. Slides declare `data-fig="<name>"`.
- **Keyboard isolation:** while focus is on a figure control, keydown events are stopped before they reach Reveal, so arrow keys on a slider never change the slide.
- **Libraries are vendored and pinned:** no CDN at runtime. Exact versions are recorded in `vendor/VERSIONS.md`.
- **One shared plot style** (`T1Figures._style`) sets fixed tissue colours used everywhere (WM, GM, CSF, plus the "with/without correction" pair), fonts, margins, and hover format. Colours are chosen with the dataviz guidance and checked for colour-blind safety.

## 3. Slide outline

Each row is one slide. **Live** means computed in the browser from `t1-models.js`. **Pre** means precomputed data exported from the chapter's notebooks or datasets. **New** marks a visual that illustrates a statement in the chapter text but has no matching book figure.

### Opening (3)

| # | Slide | Media | Book anchor |
|---|---|---|---|
| 1 | Title: *T1 Mapping*, qMRI mOOC Chapter 2 | — | chapter top |
| 2 | Why measure T1? Biomarker, Ernst angle, correction factor for qMT and DCE | text | chapter top |
| 3 | Three methods at a glance: IR (gold standard), VFA (fast, B1-sensitive), MP2RAGE (dictionary) | 3 cards | chapter top |

### Inversion recovery (13)

| # | Slide | Media | Book anchor |
|---|---|---|---|
| 4 | Section: Inversion Recovery, "the gold standard" | — | `irintroduction` |
| 5 | Pulse sequence: 180° – TI – 90° – readout | image | `irfig1` |
| 6 | Full signal model, Eq. 2.1, with colour-coded terms | math | `ireq1` |
| 7 | Simplifications Eq. 2.2 → 2.3, revealed step by step with the "TR > 5 T1" condition | math | `ireq2`, `ireq3` |
| 8 | IR curves for WM/GM/CSF. Sliders: TR, T1 per tissue. Toggles: real vs magnitude, **show null points** (off by default) | Live `ir-curves` | `irplot1` |
| 9 | Eq. 2.1 (dotted) vs Eq. 2.3 (solid) for T1 = 0.25–5 s. Slider: TR | Live `ir-trcompare` | `irplot2` |
| 10 | Fitting approaches: null method, semi-log linear, NLLS, RD-NLS, plus Eq. 2.4 | text + math | `ireq4` |
| 11 | RD-NLS vs Levenberg-Marquardt long-TR fit, T1 = 1 s, TR = 1.5–5 s | Pre `ir-fitcompare` | `irplot3` |
| 12 | Brain dataset: 4 TI images + T1 map. Click a voxel to plot its 4 samples and the fitted curve | Pre `ir-brain` | `irplot4` |
| 13 | Why IR is robust: long TR, wide dynamic range, insensitive to flip angle and spoiling | text | `irplot5` section |
| 14 | Pitfall: null points and Rician noise. Monte Carlo T1 mean/STD vs TR | Pre `ir-nullnoise` | `irplot5` |
| 15 | Pitfall: scan time, TR × N_TI × N_PE ≈ 10–25 min per slice | text + math | `irplot5` section |
| 16 | Variants: Look-Locker, MOLLI/ShMOLLI, saturation recovery | text | `irplot5` section |

### Variable flip angle (14)

| # | Slide | Media | Book anchor |
|---|---|---|---|
| 17 | Section: VFA / DESPOT1, "fast 3D T1" | — | `vfaintroduction` |
| 18 | Pulse sequence: spoiled GRE, θ_n – TR | image | `vfafig1` |
| 19 | SPGR steady-state signal, Eq. 2.5 | math | `vfaeq1` |
| 20 | VFA curves for WM/GM/CSF. Sliders: TR, T1s. Toggle: **show Ernst angles** (off by default) | Live `vfa-curves` | `vfaplot1` |
| 21 | Ernst angle, Eq. 2.6, with a small live readout: enter T1 and TR to get θ_E | math + Live mini | `vfaeq2` |
| 22 | Approach to steady state: Bloch simulation vs ideal | Pre `vfa-steadystate` | `vfaplot2` |
| 23 | Spoiling: ideal vs gradient+RF vs none | Pre `vfa-spoiling` | `vfaplot3` |
| 24 | Linearisation, Eq. 2.7 → 2.8 → 2.9, revealed step by step | math | `vfaeq3`–`vfaeq5` |
| 25 | Nonlinear vs linear space, Monte Carlo. Sliders: SNR, two flip angles. Shows the fitted line and T1 estimate | Live `vfa-linear` (seeded MC) | `vfaplot4` |
| 26 | Choosing two flip angles: the 71 %-of-Ernst-signal rule. Toggle: **show optimal angles** (off by default) | Live `vfa-optimal` (New) | `vfaplot4` section |
| 27 | B1 correction, Eq. 2.10 | math | `vfaeq6` |
| 28 | Fitted T1 vs B1 bias, without and with correction, Monte Carlo. Sliders: nominal angles, SNR | Live `vfa-b1bias` (seeded MC) | `vfaplot5` |
| 29 | Brain dataset: FA 3°, FA 20°, B1 map, T1 map. Toggle: **B1 correction on/off** recomputes the T1 map live | Pre data + Live fit `vfa-brain` | `vfaplot6` |
| 30 | Benefits & pitfalls: up to 30 % spoiling bias, B1-map quality, fast, widely available | text | `vfaplot6` section |

### MP2RAGE (11)

| # | Slide | Media | Book anchor |
|---|---|---|---|
| 31 | Section: MP2RAGE, "dictionary-based T1" (MRF, CS, MP2RAGE) | — | `mp2rageintroduction` |
| 32 | Pulse sequence: inversion + two GRE blocks | image | `mp2ragefig1` |
| 33 | Mz trajectory over one TR_MP2RAGE for WM/GM/CSF, with shaded GRE blocks. Sliders: TI1, TI2, θ1, θ2 | Live `mp2rage-trajectory` (New) | `mp2ragefig1` |
| 34 | S_MP2RAGE, Eq. 2.11/2.12: bounded in [−0.5, 0.5]; cancels M0, B1⁻ and T2* | math | `mp2rageeq1`, `mp2rageeq2` |
| 35 | Signal equations, Eq. 2.13–2.16, compact with highlighted terms; detail in speaker notes | math | `mp2rageeq3`–`mp2rageeq6` |
| 36 | Lookup table S_MP2RAGE ↔ T1. Sliders: TI1, TI2, θ1, θ2. Hover reads T1 off the curve | Live `mp2rage-lut` | `mp2rageplot1` |
| 37 | Dictionary fitting: measured S → interpolate the lookup table → T1, fast enough to run on the scanner console | text + diagram | `mp2rageplot1` section |
| 38 | B1 sensitivity: lookup curves for B1 = 0.8 / 1.0 / 1.2, and a 2-D [T1, B1, S] dictionary | Live `mp2rage-b1` (New) | `mp2rageplot1` section |
| 39 | 7T brain dataset: UNI image + T1 map, with hover values | Pre `mp2rage-brain` | `mp2rageplot2` |
| 40 | Benefits: reproducibility (Voelker 2016), speed, sub-mm resolution | text | `mp2rageplot2` section |
| 41 | Pitfalls: dictionary dependence across sites, residual B1, acceleration-specific equations | text | `mp2rageplot2` section |

### Closing (2)

| # | Slide | Media | Book anchor |
|---|---|---|---|
| 42 | Comparison cards IR / VFA / MP2RAGE: accuracy, speed, B1 sensitivity, typical use (MT-summary style) | cards | chapter top |
| 43 | Exercises & discussion: links to the chapter exercises and GitHub Discussions; key references; CC-BY 4.0 | links | `exercises` |

**Answer-hiding toggles** (slides 8, 20, 26) are off by default because they reveal answers to chapter Exercises 1–2. The instructor turns them on after the class has tried the problem.

**Speaker notes:** every content slide carries 2–4 notes condensed from the chapter paragraph it summarises (the reveal speaker view opens with `S`).

## 4. Models and data

### `t1-models.js` (live, pure functions, units in ms and degrees)

- `irFull(TI, TR, T1, {theta180=180, theta90=90, M0=1})`: Eq. 2.1
- `irGeneral(TI, TR, T1, C=1)`: Eq. 2.2
- `irLongTR(TI, T1, C=1)`: Eq. 2.3
- `irNullTI(T1, TR)`: zero crossing of Eq. 2.2, `T1·ln(2/(1+e^{−TR/T1}))`
- `spgr(theta, TR, T1, M0=1)`: Eq. 2.5
- `ernst(TR, T1)`: Eq. 2.6
- `vfaOptimalPair(TR, T1, frac=0.71)`: the two angles where the SPGR signal equals 71 % of the Ernst maximum
- `vfaLinearFit(S[], theta[], TR)`: Eqs. 2.8–2.9; returns `{T1, M0}`
- `mp2rageSignals(T1, protocol, B1=1)`: Eqs. 2.13–2.16, following Marques et al.'s open-source `MPRAGEfunc` (not the chapter typesetting; see §8)
- `mp2rageUNI(S1, S2)`: Eq. 2.12
- `mp2rageLUT(protocol, T1range, B1=1)`
- `mzTrajectory(T1, protocol)`: discrete magnetisation stepping for slide 33
- `rng(seed)` (seeded PRNG) and `gaussian(rng)`, so Monte Carlo figures reproduce exactly

### `tools/export_data.py`

- Downloads datasets the same way the notebooks do, via `binder/data_requirement.json` and repo2data (IR, VFA, MP2RAGE, and the `qmrlab-t1-book` pickles).
- Writes `js/data/<name>.js`:
  - `ir-fitcompare`, `ir-nullnoise`, `vfa-steadystate`, `vfa-spoiling`: the pickled arrays the notebooks plot.
  - `ir-brain`, `vfa-brain`, `mp2rage-brain`: the single slice the book shows, cropped to the brain bounding box, stored as Float32 base64 with shape and scale metadata.
- Writes `tests/fixtures/*.json`: NumPy evaluations of each closed-form equation on a parameter grid; the book's MP2RAGE lookup table (`fig1.mat`); Monte Carlo summary statistics from the pickles.
- Is deterministic and re-runnable. Its outputs are committed, so presenting never needs Python.

## 5. Book links and embedding

- Slides declare `data-book="irplot1"`. `deck.js` turns this into a footer link `📖 Figure 2.2 · Inversion Recovery` with the same position and style on every slide. It opens `BOOK_BASE + '#' + label` in a new tab, where `BOOK_BASE = 'https://qmrlab.org/mooc/t1-mapping'` is defined once.
- The label → display text table (e.g. `irplot1 → "Figure 2.2"`, `vfaeq2 → "Eq. 2.6"`) lives in `deck.js` and matches the chapter's `:enumerator:` values.
- A slide that covers several anchors links to the first one.
- **MyST page:** new `8 Slides/2 - T1 Mapping.md` (label `page-t1`), modelled on the MT page. It iframes the deck and adds two links under it: *Open full screen* and *Open in new tab*. It goes in the `Slides` toc entry ahead of MT.
- The iframe `src` is set from the deployment chosen at review time. The default is the S3 bucket path `…/t1/index.html`, matching MT.
- `docs/**` and `8 Slides/t1-deck/**` are added to `myst.yml` `exclude`, so MyST doesn't try to process the spec or the deck sources.

## 6. Error handling

- If a figure's data or model throws on mount, the figure's `<div>` shows a card that says "This figure couldn't load. See it in the book →" with the slide's book link. The rest of the deck keeps working, and the error goes to the console.
- If `T1Data.<name>` is missing (data not exported), the same fallback card appears.
- Slider ranges are clamped to physically meaningful values (e.g. TI < TR, TI2 > TI1 + GRE block length) so the models never receive impossible protocols. When a slider pushes another value out of range, a short inline message explains the adjustment.

## 7. Testing

1. **Model tests** (`node --test tests/`, no dependencies): each `t1-models.js` function vs the Python fixtures, with relative error < 1e-9 for closed-form equations. The MP2RAGE lookup table is compared with the book's `fig1.mat` within 1 % in T1 over the monotonic range.
2. **Monte Carlo tests:** the seeded JS Monte Carlo for `vfa-linear` and `vfa-b1bias` at the book's parameters (N = 1000) matches the pickled mean/STD within 3 standard errors.
3. **Link check** (`tools/check_links.py`): every `data-book` label exists as an `id` on the live chapter page. All 36 labels used (33 equation/figure labels plus `irintroduction`, `vfaintroduction`, `exercises`) were verified on 2026-10-13.
4. **Browser smoke test:** a headless Chromium run (Playwright via `npx`, a development-only tool) steps through every slide at 1280×720 and 1920×1080. It asserts no console errors, a visible book link on each content slide, and a non-empty figure on each `data-fig` slide, and saves screenshots for visual review.
5. **Manual check:** open `index.html` from `file://` with networking disabled, run through the deck, try every slider, speaker view, and `?print-pdf`.

## 8. Out of scope, and findings to report

- **Out of scope:**
  - The worked problem solution in qMRLab format (separate follow-up).
  - Uploading to S3 or changing the deploy workflow; Mathieu deploys.
  - Changes to the chapter text.
  - Refactoring the MT deck. The architecture allows porting it later.
  - Deleting `t1summary.html` from S3.
- **Chapter issues found while reading:**
  - Eq. 2.15 (`mp2rageEq5`) is missing the `=` after `m_{z,ss}`.
  - The MP2RAGE *Data Fitting* paragraph links "2.16" to `#mp2rageEq3`.
  - The deck uses the corrected forms. These issues will be reported to Mathieu, not fixed in this branch.
- **New visuals (slides 26, 33, 38):** these illustrate statements made in the chapter text but have no corresponding book figure. They are flagged here so they can be dropped at review if the deck should be strictly figure-for-figure.
