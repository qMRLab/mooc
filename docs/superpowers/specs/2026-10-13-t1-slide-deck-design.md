# T1 Mapping Slide Deck: Design

- **Date:** 2026-10-13 (revision 2: reuse the book's figures and text)
- **Author:** Mathieu Boudreau (with Claude)
- **Status:** Draft, awaiting review
- **Branch:** `mb/t1-slides`

## 1. Purpose

Nikola Stikov asked for slides derived from the T1 mapping chapter, in the style of the existing MT deck (`8 Slides/6 - Magnetization Transfer Imaging.md`, which iframes `mtslides.html` from S3). This deck covers the whole chapter: inversion recovery (IR), variable flip angle (VFA) and MP2RAGE. It replaces the 2025 IR-only demo (`s3/t1summary.html`), which has no links back to the book and embeds a separate 4–6 MB Plotly export per figure.

**The deck mirrors the book.** It does not extend it.

- **Figures:** the chapter's own figures, identical to what the book publishes. The only changes are larger fonts and fitting each figure to the slide.
- **Text:** condensed from the chapter. Slides carry enough to state the main points and set up each figure. They don't reproduce every paragraph, and the deck adds no new explanations.

### Audience and use

- **Primary:** Nikola teaching a 3-hour class, about 40 minutes per method including discussion and pauses on the interactive figures.
- **Secondary:** students browsing the mOOC, who reach the deck through an embedded page in the book's *Slides* section.

### Success criteria

1. One URL (or double-clicking `index.html` with no network) opens a 66-slide deck: 22 IR, 21 VFA, 18 MP2RAGE, plus 3 opening and 2 closing slides.
2. All 16 chapter figures appear: 3 pulse-sequence images and 13 Plotly figures. (The book numbers them 2.1–2.15 because two figures share 2.11.) The Plotly figures are rendered from the exact JSON the book publishes and keep the book's own interactivity: sliders, dropdowns and hover.
3. Every slide has a consistently placed link to the exact book anchor it comes from (`https://qmrlab.org/mooc/t1-mapping#<label>`).
4. Every bullet, speaker note and equation can be traced to a sentence or equation in the chapter.
5. No runtime network requests, and total weight ≤ 10 MB. The 13 figures account for 5.5 MB of JSON, compared with ~26 MB for the old IR demo's 5 figures.

### Decisions made

| Decision | Choice |
|---|---|
| Scope | Deck only. The worked problem solution in qMRLab format is a separate follow-up project. |
| Hosting | Undecided, so the deck is a portable static folder with relative paths only. |
| Depth | About 40 min per method: IR and VFA 20–25 slides, MP2RAGE as much as its shorter section supports. Text density is calibrated on the MT and old IR decks, slightly more detailed. |
| Figures | The book's published Plotly JSON, rendered by the same plotly.js version the book uses (2.35.2). The pulse-sequence PNGs come from the chapter's `img/` folders. |
| Text | Condensed from the chapter only. |

## 2. Architecture

```
mooc/8 Slides/t1-deck/
  index.html                slide markup only
  deck.css                  theme (16:9, light, projector-friendly)
  js/
    deck.js                 Reveal init, KaTeX, book-link footers, figure lifecycle, font scaling
    figures/<label>.js      one file per book figure: window.T1Figures["irPlot1"] = {data, layout, ...}
  img/                      ir_pulsesequences.png, vfa_pulsesequence.png, mp2rage_pulsesequence.png
  vendor/                   reveal.js 5.2.1, KaTeX 0.16.11 (+woff2 fonts), plotly.js 2.35.2 (cartesian dist)
  tools/
    fetch_book_figures.py   pulls the published figure JSON from the live book into js/figures/
    vendor.js               copies the pinned library builds from npm into vendor/
    check_links.py          checks every data-book anchor exists on the live chapter page
  tests/
    deck.test.js            node --test: structure checks (labels, scripts, figures)
    smoke.js                headless Chromium walk-through at two sizes, offline
  README.md                 present, edit, refresh figures, test, deploy
```

### Key choices

- **The figures come from the published book, not from regeneration.** The chapter page's JSON (`https://qmrlab.org/mooc/t1-mapping.json`) lists every notebook output. Each Plotly output is either inline or stored at `/mooc/build/<hash>.json`. `fetch_book_figures.py` walks the page JSON, finds the figure container label (`irPlot1` … `mp2rageplot2`), downloads that output and writes it unchanged into `js/figures/<label>.js`. Re-running it after a book rebuild refreshes the deck. Running the notebooks, downloading data or matching Python versions are not needed.
- **The same renderer as the book:** plotly.js 2.35.2, the version the book's outputs load. The cartesian dist covers the scatter and heatmap traces that all 13 figures use.
- **Only two display adjustments, applied at render time in `deck.js` so the stored JSON stays byte-identical to the book:**
  1. The fixed `width`/`height` (540–600 px wide in the book) is removed so the figure fills the slide's figure area. Sliders, menus and annotations are positioned in paper coordinates, so they move with the figure.
  2. Every font size in the layout is multiplied by one factor (`FONT_SCALE`, default 1.5) so text reads from the back of a room. This covers the global font, axis titles and ticks, legend, annotations, slider and menu labels, and colorbars.

  Nothing else changes: not the colours, traces, ranges or default slider positions.
- **Classic scripts only:** no ES modules and no `fetch()`, so `index.html` works from `file://` on a laptop with no network.
- **Figures render inline,** not as iframes. `deck.js` creates a figure (`Plotly.newPlot` on a deep copy of the stored JSON) when its slide or the next one becomes current, and purges figures two or more slides away. In `?print-pdf` mode every figure renders once.
- **Keyboard isolation:** while focus is on a Plotly slider or menu, arrow keys stay with the figure. Escape gives them back to the slides.

## 3. Slide outline

Each row is one slide. The "Source" column names the chapter anchor the slide's content comes from, which is also its book link. "Figure 2.x" rows show the book figure. Other rows hold condensed chapter text or equations.

### Opening (3)

| # | Slide | Source |
|---|---|---|
| 1 | Title: *T1 Mapping*, qMRI mOOC Chapter 2 | chapter top |
| 2 | What T1 is and why map it: a biomarker; needed for the Ernst angle; a correction factor for qMT and DCE | `introduction` |
| 3 | Three approaches: IR (gold standard, long TR), VFA (rapid 3D, B1-sensitive), dictionary-based such as MP2RAGE (turnkey, clinical availability) | `introduction` |

### Inversion recovery (22, about 40 min)

| # | Slide | Source |
|---|---|---|
| 4 | Section: Inversion Recovery T1 Mapping. "Widely considered the gold standard" | `irintroduction` |
| 5 | The experiment: invert with 180°, recover for TI, take a 90° snapshot, read out with SE or GRE | `irintroduction` |
| 6 | History: NMR in the 1940s (Hahn, Drain); the first T1 map used saturation recovery (Pykett 1978) | `irintroduction` |
| 7 | Strengths and the catch: large dynamic range, insensitive to imperfections; TR of 2–5 T1, so it serves as a reference measurement | `irintroduction` |
| 8 | **Figure 2.1** pulse sequence | `irfig1` |
| 9 | Eq. 2.1, the general steady-state model; in-phase signal × k sin θ90 e^(−TE/T2) | `ireq1` |
| 10 | Eq. 2.2: constants grouped into C, ideal inversion | `ireq2` |
| 11 | Eq. 2.3: TR > 5 T1, the most widely used model; magnitude images give \|Eq. 2.3\| | `ireq3` |
| 12 | **Figure 2.2** IR curves for WM/GM/CSF | `irplot1` |
| 13 | Why simulate with Eq. 2.1: TR rarely exceeds 5 T1 for every tissue (e.g. CSF), and inversion is not ideal (slice profile) | `irplot2` |
| 14 | **Figure 2.3** Eq. 2.1 vs Eq. 2.3, T1 slider | `irplot2` |
| 15 | Fitting considerations: magnitude data needs polarity restoration (Rician noise at the null); phase data needs a phase term; use Eq. 2.3 only for long TR | `data-fitting` |
| 16 | Fitting methods: null method, semi-log linear fit, non-linear least squares (Levenberg–Marquardt) | `data-fitting` |
| 17 | RD-NLS (Barral 2010): Eq. 2.4, up to 75× faster with no loss of precision, makes no TR assumption, open source and in qMRLab | `ireq4` |
| 18 | **Figure 2.4** RD-NLS vs Levenberg–Marquardt, TR slider | `irplot3` |
| 19 | **Figure 2.5** brain dataset and T1 map, TI dropdown | `irplot4` |
| 20 | Why it is the gold standard: long TR with ≥ 5 TIs; dynamic range [−kM0, kM0]; insensitive to flip angle and spoiling | `benefits-and-pitfalls` |
| 21 | Protocol design: avoid TIs at the tissue's null (Rician noise); runs on standard sequences with no calibration | `benefits-and-pitfalls` |
| 22 | **Figure 2.6** Monte Carlo T1 mean/STD vs TR, TR slider | `irplot5` |
| 23 | Drawback: 10–25 min per slice (one TI per TR of 2–5 s, 100–200 phase-encode lines); still useful as a reference | `benefits-and-pitfalls` |
| 24 | Look-Locker: a θ pulse train after the inversion; efficient but lower SNR and B1/spoiling-sensitive; MOLLI/ShMOLLI for cardiac | `other-saturation-recovery-t1-mapping-techniques` |
| 25 | Saturation recovery: a 90° preparation needs no long TR; TIs still ~T1; half the dynamic range; low SNR at short TIs | `other-saturation-recovery-t1-mapping-techniques` |

### Variable flip angle (21, about 40 min)

| # | Slide | Source |
|---|---|---|
| 26 | Section: Variable Flip Angle (DESPOT1). "Rapid… 3D T1 maps in a clinically feasible time" | `vfaintroduction` |
| 27 | The idea: several spoiled GRE acquisitions with different θn; short TR (~10 ms); sensitive to T1 over a wide range of angles | `vfaintroduction` |
| 28 | Origins and strengths: from NMR; time-efficient; 3D acquisition gives more SNR and fewer slice-profile effects | `vfaintroduction` |
| 29 | The catch: flip-angle accuracy (up to ±30 % at 3T) needs a B1 map, and B1 errors propagate into T1 | `vfaintroduction` |
| 30 | **Figure 2.7** pulse sequence | `vfafig1` |
| 31 | Eq. 2.5, the SPGR steady-state signal | `vfaeq1` |
| 32 | **Figure 2.8** VFA curves for WM/GM/CSF, TR slider | `vfaplot1` |
| 33 | Eq. 2.6, the Ernst angle: the signal maximum depends on T1 and TR | `vfaeq2` |
| 34 | Model assumptions: steady state after many TRs, perfect spoiling; Bloch simulations are more realistic | `vfaeq2` |
| 35 | **Figure 2.9** Bloch simulation vs analytical, nth-TR slider | `vfaplot2` |
| 36 | Spoiling, the hardest parameter to control: gradient plus RF spoiling (Φ0 = 117°); strong gradients add diffusion effects | `vfaplot3` |
| 37 | **Figure 2.10** ideal vs gradient+RF vs no spoiling, nth-TR slider | `vfaplot3` |
| 38 | Fitting: NLLS on Eq. 2.5 is valid, but Gupta's rearrangement (Eq. 2.7 → 2.8) allows a linear fit | `vfaeq3` |
| 39 | Eq. 2.9: T1 from the slope; with two angles, the elementary slope | `vfaeq5` |
| 40 | **Figure 2.11** nonlinear vs linear form, Monte Carlo | `vfaplot4` |
| 41 | Choosing flip angles: two angles at 71 % of the maximum signal (Deoni 2003, Schabel 2008); extra angles; at low SNR use NLLS or weighted LLS | `vfadatafitting` |
| 42 | B1 correction, Eq. 2.10; B1 is normalised and unitless | `vfaeq6` |
| 43 | **Figure 2.11** (book's second 2.11) fitted T1 vs B1, with and without correction | `vfaplot5` |
| 44 | **Figure 2.12** brain dataset, B1 map and T1 map, image dropdown | `vfaplot6` |
| 45 | Pitfalls: sensitive to implementation; spoiling bias up to 30 % vs IR; depends on B1-map quality | `benefits-and-pitfalls-1` |
| 46 | Why it is still widely used: fast acquisition and processing, widely available, an input to qMT and DCE | `benefits-and-pitfalls-1` |

### MP2RAGE (18, about 40 min)

| # | Slide | Source |
|---|---|---|
| 47 | Section: MP2RAGE | `mp2rageintroduction` |
| 48 | Dictionary-based techniques: pre-computed signal databases (MRF, CS, MP2RAGE), growing clinical availability, fast processing | `mp2rageintroduction` |
| 49 | MP2RAGE: an extension of MPRAGE and a hybrid of IR and VFA. A 180°, then two low-flip-angle GRE blocks at TI1 and TI2 | `mp2rageintroduction` |
| 50 | Encoding: a constant "y" phase encode per TR_MP2RAGE, varying "z" per TR; the k-space centre is acquired at TI1 and TI2 | `mp2rageintroduction` |
| 51 | **Figure 2.13** pulse sequence | `mp2ragefig1` |
| 52 | Eq. 2.11, S_MP2RAGE for complex data: bounded in [−0.5, 0.5], reduces some B0 effects | `mp2rageeq1` |
| 53 | Eq. 2.12, for real or polarity-restored data | `mp2rageeq2` |
| 54 | Signal equations: no steady state within a GRE block; assumes full sampling (no partial Fourier or parallel imaging) | `mp2rageeq3` |
| 55 | Eq. 2.13 and Eq. 2.14 | `mp2rageeq3` |
| 56 | Definitions: ER, EA, EB, EC, and TA/TB/TC from the TIs, n and TR | `mp2rageeq4` |
| 57 | Eq. 2.15 and Eq. 2.16, steady-state m_z,ss and β | `mp2rageeq5` |
| 58 | What S_MP2RAGE removes (B1⁻, T2*, M0) and what remains (B1⁺ through θ1, θ2), which protocol design can reduce | `mp2rageeq6` |
| 59 | Dictionary fitting: interpolate a pre-computed table, with no Levenberg–Marquardt; fast enough to run on the scanner console | `data-fitting-1` |
| 60 | **Figure 2.14** T1 lookup table over S_MP2RAGE × B1 | `mp2rageplot1` |
| 61 | **Figure 2.15** 7T brain dataset and T1 map, image dropdown | `mp2rageplot2` |
| 62 | Software: vendor reconstruction or open-source packages (Marques 2017, de Hollander 2017), not your own code | `data-fitting-1` |
| 63 | Benefits: turnkey; reproducible across 8 sites (Voelker 2016); fast; 1 mm at 3T and sub-mm at 7T in under 10 min | `benefits-and-pitfalls-2` |
| 64 | Pitfalls: one dictionary per study; residual B1 sensitivity, and B1 mapping brings its own errors | `benefits-and-pitfalls-2` |

### Closing (2)

| # | Slide | Source |
|---|---|---|
| 65 | Summary of the three methods, using only statements from the chapter introduction and the benefits/pitfalls sections | `introduction` |
| 66 | Exercises and discussion: link to the chapter exercises and GitHub Discussions | `exercises` |

**Speaker notes:** each slide carries 2–4 sentences condensed from the chapter paragraph it draws on. Figure slides carry the book's figure caption, shortened.

**Equations** are copied from the chapter's LaTeX. Obvious typos (§8) are fixed and the fix is noted in the speaker notes.

## 4. Figures

| Label | Book figure | Size | Built-in interactivity |
|---|---|---|---|
| `irPlot1` | 2.2 IR curves | 120 KB | hover |
| `irPlot2` | 2.3 Eq. 2.1 vs 2.3 | 1.5 MB | T1 slider |
| `irPlot3` | 2.4 fitting comparison | 229 KB | TR slider |
| `irPlot4` | 2.5 IR brain | 554 KB | TI dropdown |
| `irPlot5` | 2.6 Monte Carlo | 888 KB | TR slider |
| `vfaPlot1` | 2.8 VFA curves | 282 KB | TR slider |
| `vfaPlot2` | 2.9 Bloch steady state | 74 KB | nth-TR slider |
| `vfaPlot3` | 2.10 spoiling | 86 KB | nth-TR slider |
| `vfaPlot4` | 2.11 linear vs nonlinear | 19 KB | hover |
| `vfaPlot5` | 2.11 B1 Monte Carlo | 10 KB | hover |
| `vfaPlot6` | 2.12 VFA brain | 381 KB | image dropdown |
| `mp2rageplot1` | 2.14 lookup table | 35 KB | hover |
| `mp2rageplot2` | 2.15 MP2RAGE brain | 1.4 MB | image dropdown |

(Sizes and interactivity checked against the live book on 2026-10-13.)

`fetch_book_figures.py` fails loudly if any of the 13 labels is missing from the page, so a renamed figure in the book can't silently drop a slide.

## 5. Book links and embedding

- Each slide declares `data-book="<anchor>"`. `deck.js` turns it into a footer link such as `📖 Figure 2.2 · Inversion Recovery`, with the same position and style on every slide, opening `https://qmrlab.org/mooc/t1-mapping#<anchor>` in a new tab.
- The anchor → text table (e.g. `irplot1 → "Figure 2.2"`, `vfaeq2 → "Eq. 2.6"`) lives in `deck.js` and uses the book's displayed numbers. Text-only slides link to their section heading (`data-fitting`, `benefits-and-pitfalls-1`, …). All anchors were verified on the live page on 2026-10-13. Heading ids are generated by MyST, so the link checker guards them.
- **MyST page:** a new `8 Slides/2 - T1 Mapping.md` (label `page-t1`), modelled on the MT page. It iframes the deck, with an *Open in new tab* link under it, and goes in the `Slides` toc entry ahead of MT. The iframe `src` follows the chosen deployment, defaulting to the S3 path `…/t1/index.html` to match MT.
- `docs/**` and `8 Slides/t1-deck/**` are added to the `exclude` list in `myst.yml`.

## 6. Error handling

- If a figure fails to render (missing file or a Plotly error), its area shows "This figure couldn't load. See it in the book →" with the slide's book link. The rest of the deck keeps working, and the error goes to the console.
- `fetch_book_figures.py` refuses to write partial output. Either all 13 figures are fetched or no file changes.

## 7. Testing

1. **Fidelity:** `fetch_book_figures.py --check` re-downloads the figures and compares them with `js/figures/*.js`, reporting "identical" or the labels that changed. A deck test asserts that each stored figure parses and has the trace count and slider/menu count listed in §4.
2. **Structure** (`node --test`): every `data-book` value has a label entry; every `<script src>` exists; every figure slide's label has a figure file loaded by a script tag; each of the 13 figures appears exactly once.
3. **Link check** (`tools/check_links.py`): every `data-book` anchor exists on the live chapter page.
4. **Browser smoke test:** headless Chromium (Playwright pinned in a dev-only `package.json`; `node_modules/` gitignored). It steps through every slide at 1280×720 and 1920×1080 with all network blocked. It asserts no console errors, a book link on every slide, every figure drawn, and no slide overflowing, and saves screenshots for visual review. It also checks that arrow keys on a focused Plotly slider don't change the slide, and that rapid navigation leaves at most 3 figures mounted.
5. **Manual:** open `index.html` from `file://` with networking off; use speaker view (`S`) and `?print-pdf`.

## 8. Out of scope, and findings to report

**Out of scope:**
- The worked problem solution in qMRLab format (a separate follow-up).
- Uploading to S3 or changing the deploy workflow; Mathieu deploys.
- Changes to the chapter.
- Refactoring the MT deck.
- Deleting `t1summary.html` from S3.

**Chapter issues found while preparing the deck.** These will be reported to Mathieu, not fixed on this branch.
- Eq. 2.15 (`mp2rageEq5`) is missing the `=` after `m_{z,ss}`.
- The MP2RAGE *Data Fitting* paragraph links "2.16" to `#mp2rageEq3`.
- Figure 2.2's caption says it plots Eq. 2.2, but the data are Eq. 2.3, the long-TR form (checked against the pickled curves).
- Figure 2.6's caption says 5 TI values; the data use 6.
- `vfaPlot4` and `vfaPlot5` are both numbered "Figure 2.11".
- Eq. 2.11 conjugates both GRE signals, whereas Marques et al. (2010) conjugate only S_TI1.
- In `fig2.mat`, the UNI image is stored under the key `B1map`.
- Figures 2.14 and 2.15 were generated with different MP2RAGE inversion efficiencies (1.0 vs 0.96).
