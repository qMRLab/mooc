# T1 Exercise Slides: Design

- **Date:** 2026-10-14
- **Author:** Mathieu Boudreau (with Claude)
- **Status:** Implemented (Mathieu: "just go", review on the live version)
- **Branch:** `mb/t1-exercises`, branched from `mb/t1-slides`, which is not merged yet

## 1. Purpose

Nikola asked to see what a worked solution to a T1 problem would look like. This adds solution slides for **Exercises 1–4** of the T1 chapter. Each exercise is its own short deck that Nikola can open in class, from the T1 deck or directly.

Every exercise deck follows the same flow:

1. **Problem:** the exercise text, quoted from the book.
2. **Part (a):** the question next to the figure it needs. Nikola works the figure live with the class.
3. **Answer to (a):** the question, the values "measured" from the figure, and a step that solves it on click.
4. **Parts (b), (c) and so on,** each in the same question → figure → answer pattern.

### Success criteria

1. Opening `exercise-1.html` … `exercise-4.html` (hosted, or double-clicked with no network) starts on the problem slide and steps through the parts in order.
2. Parts that read values off a figure use the **book's own interactive figure**, exactly as on the book page (the same JSON the T1 deck uses).
3. **Answers build up step by step**, one click each: the data first, then the fit or computed result, then the proof or explanation (Mathieu's feedback on Exercise 1b, 2026-10-14). ← undoes a step.
4. "Measured" values sit in **editable boxes, pre-filled with our readings**. **Solve** computes from whatever is in the boxes, and **Reset** restores our readings. Pressing → on a solve slide triggers Solve too, so a presenter's clicker works.
4. Exercises 3 and 4 recompute live in the page with **qmrust**, the Rust/WASM port of qMRLab, drawn in the same layout as the book figure they extend.
5. Each result appears within about 1 s on a laptop.
6. Every slide links back to the book (`#exercises`, or the figure's own anchor).
7. The T1 deck's *Exercises* slide links to the four exercise decks.

### Decisions made

| Decision | Choice |
|---|---|
| Measured values | Pre-filled and editable. Solve uses the boxes; Reset restores our values (option A, approved). |
| Packaging | One HTML page per exercise in `8 Slides/t1-deck/`, sharing its `vendor/`, `deck.css`, `js/deck.js` and `js/figures/`. Deployed with the T1 deck. |
| Question text | Quoted from the book. Two errors are corrected, with a footnote on the slide and an explanation in the speaker notes (§4). |
| Answer text | New content, since the book has no solutions. Kept short: the result, one line on why, and the equation from the book where one applies. |
| New plots | Only where the solution needs one: the fit in 1b, the optimal-angle markers in 2c, and the live qmrust figures in 3–4. These reuse the layout, colours and fonts of the book figure they extend. |
| qmrust | The compiled WASM and glue are copied from `~/neuropoly/projects/mooc-rust/figures-t1-chapter-qmrust.html` (Aug 3). They are loaded only by exercises 3 and 4. |
| Book anchors | `#exercises`. The per-exercise ids on the book page (`exercise-zweyb0wian` …) are generated and change between builds. |

## 2. Architecture

```
8 Slides/t1-deck/
  exercise-1.html … exercise-4.html   new: one deck each
  js/deck.js                          existing: Reveal, KaTeX, book links, book figures (reused unchanged)
  js/solve.js                         new: pure maths (UMD, Node-testable)
  js/exercise.js                      new: browser widgets (inputs, Solve/Reset, result plots, fragment trigger)
  js/qmrust.js                        new: qmrust loader and a small IR API (exercises 3–4 only)
  vendor/qmrust/qmrust_wasm.js        new: wasm-bindgen glue (--target no-modules, 30 KB)
  vendor/qmrust/qmrust_wasm_b64.js    new: `var QMRUST_WASM_B64 = "…"` (≈1.8 MB)
  tools/extract_qmrust.py             new: copies the two vendor files out of the qmrust HTML; records sha256 in VERSIONS.md
  index.html                          changed: the Exercises slide links to the four decks
```

- **Offline-first, as before.** Classic scripts only. The WASM is base64, decoded with `atob` and passed to `wasm_bindgen({module_or_path: bytes})`, so it works from `file://`.
- **`js/deck.js` is reused as is.** Exercise sections carry `data-book`, and `.fig-host[data-fig]` mounts book figures the same way it does in the T1 deck.
- **Exercise pages load only the figure files they need:** `irPlot1` (Ex. 1) and `vfaPlot1` (Ex. 2). Exercises 3 and 4 copy the layouts of `irPlot1`, `irPlot3` and `irPlot5` and replace the data with live qmrust output, so they load those three figure files too.

### Widgets (`js/exercise.js`)

A solve slide declares its widget in markup:

```html
<section data-book="exercises" data-solve="ex1-null-fit">
  <h2>…</h2>
  <table class="measure">…<input data-key="wm" value="624"> …</table>
  <button class="solve">Solve</button> <button class="reset">Reset</button>
  <div class="result-plot"></div><p class="result"></p>
  <span class="fragment solve-step"></span>
</section>
```

- `exercise.js` keeps a registry: `id → function(inputs, slide)`. Each function reads the inputs, calls `solve.js`, and draws the result plot and text.
- The empty `.solve-step` fragment makes → (or a clicker) run Solve. Moving ← un-shows it and clears the result.
- Reveal ignores arrow keys while an input has focus, so typing values doesn't change slides.
- Invalid or missing input shows an inline message (e.g. "Enter a T₁ for each tissue") instead of a plot. Nothing throws.

### qmrust API (`js/qmrust.js`)

`QmRust.ready()` returns a promise that resolves once the WASM is instantiated (started on page load). On top of it are four IR helpers, in ms in and ms out (qmrust works in seconds internally):

| Helper | Wraps | Returns |
|---|---|---|
| `irSignal({t1, tr, tis, longTR})` | `forward` with a=C(1+e^(−TR/T₁)) or a=C, b=−2C | `[signal per TI]` |
| `irFit({tis, signal, model})` | `fit_voxel`, model `barral` or `long_tr_lm` | `{t1, a, b}` |
| `irMonteCarlo({t1, tr, tis, snr, trials, seed})` | `sim("single-voxel", … rician noise …)` | `{mean, std, signalMean, signalStd}` |
| `irCurve({t1, tr, tiMax, n, longTR})` | `irSignal` on a dense TI grid | for drawing curves |

- If the WASM fails to load, every qmrust plot slot shows a card: "Live simulation unavailable", plus the precomputed answer and the book link.
- `trials` defaults to 500, which keeps each Monte Carlo run well under 1 s.

## 3. Slides

Text in *italics* is quoted from the book. "Answer" slides show results computed by `solve.js` or qmrust. The numbers below are what the current figures give.

### Exercise 1: IR null times and contrast (6 slides)

1. **Problem:** *a–d*, quoted.
2. **(a) Question** next to the book's **Figure 2.2** (`irPlot1`). Nikola hovers to find where each curve crosses zero.
3. **(a) Answer, then (b) Solve:**
   - Editable null times: WM 624, GM 1040, CSF 2773 ms, next to the T₁ values 900 / 1500 / 4000 ms.
   - **Solve** fits a line through the origin, TI<sub>null</sub> = k·T₁. It plots the three points and the line, and prints k ≈ 0.69.
   - It then shows the book's Eq. 2.3 set to zero, which gives TI<sub>null</sub> = T₁ ln 2 (ln 2 = 0.693).
4. **(c) Question** next to Figure 2.2 with a **Magnitude** toggle, which plots |M<sub>z</sub>| of the same book data.
   - **Answer:** |WM| = |GM| near **TI ≈ 800 ms** (797 in the data), the lowest WM/GM contrast.
5. **(d) Question** next to Figure 2.2 with a **Show WM − GM** toggle, which adds the difference curve.
   - **Answer:** the largest difference is near **TI ≈ 1150 ms**.
   - Analytically, TI = T₁<sup>WM</sup>T₁<sup>GM</sup> ln(T₁<sup>GM</sup>/T₁<sup>WM</sup>) / (T₁<sup>GM</sup> − T₁<sup>WM</sup>) = 1149 ms. This is computed live from the T₁ boxes.
6. **Summary:** the four answers on one slide.

### Exercise 2: Ernst angle and VFA flip angles (6 slides)

1. **Problem:** *a–d*, quoted.
2. **(a) Question** next to the book's **Figure 2.8** (`vfaPlot1`, with its TR slider). Nikola moves the slider to 15, 50 and 140 ms and reads each peak.
3. **(a) Answer, then (b) Solve:**
   - Editable "read from figure" values: WM 10°, GM 15°, CSF 15°.
   - **Solve** adds a column from the book's Eq. 2.6, θ<sub>E</sub> = arccos(e^(−TR/T₁)): 10.4°, 14.7° and 15.1°, and shows the differences.
   - One line explains why GM and CSF match: their TR/T₁ ratios are almost equal (0.033 and 0.035).
4. **(c) Solve:** the optimal two-angle pair for each tissue.
   - It plots each tissue's curve with two markers.
   - Values: WM 4.4° / 24.7°, GM 6.2° / 34.4°, CSF 6.3° / 35.2°.
   - Footnote: *see §4, correction 2.*
5. **(d) Question** next to Figure 2.8 at TR = 30 ms with a **Show WM − GM** toggle.
   - **Answer:** about **22°**, which is the maximum of S<sub>WM</sub> − S<sub>GM</sub> in Eq. 2.5. It is computed live and matches the figure (22).
6. **Summary.**

### Exercise 3: IR at 1.5 T with TR = 3 s (qmrust, about 7 slides)

1. **Problem:** *a–c*, quoted. 3a points to Figure 2.2 (§4, correction 1).
2. **(a) Live Figure 2.2 at 1.5 T:**
   - The book's `irPlot1` layout, with curves recomputed by qmrust.
   - Editable T₁ values: WM 650, GM 1200, CSF 4000 ms.
   - A toggle overlays the book's 3 T curves (dashed) for comparison.
3. **(a) Answer:** the 1.5 T null times are shorter (WM ≈ 450, GM ≈ 830 ms), and the WM/GM crossings move earlier.
4. **(b) Live Figure 2.4 (long-TR fit):**
   - The book's `irPlot3` layout (TIs 50–1500 ms).
   - Data are simulated with the **general** equation at TR = 3000 ms and fitted with the **long-TR** model (`long_tr_lm`), with the general fit (`barral`) for reference.
   - Presets for WM at 1.5 T (650 ms) and at 3 T (900 ms). TR and T₁ are editable.
5. **(b) Answer:**
   - Fitted vs true T₁ at both fields. The error grows as TR/T₁ shrinks: e^(−TR/T₁) is 0.010 at 1.5 T and 0.036 at 3 T.
   - Whether each is acceptable is stated against a ±5 % line. Final numbers come from qmrust.
6. **(c) Live, as Figure 2.3:** the measured signal (general equation) against the long-TR model in magnitude, at WM 650 ms and TR 3 s. They differ by the constant e^(−TR/T₁) ≈ 0.01. The region around the two nulls (444 and 451 ms) is shaded.
7. **(c) Which TIs to avoid, live:** the long-TR fit error for three TIs (centre ± 100 ms) as the centre moves along the recovery.
   - Near the null the error swings from about −26 % to +33 %.
   - From about 1.6 s (≈ 2.5 T₁) on, the samples sit on the plateau and the fit fails.
   - Spread-out protocols stay at the −1.7 % of part b.
   - **Answer:** don't concentrate TIs around the null or far past it, and keep TI below TR minus the readout.

   (The first idea, leaving one TI out of a spread-out protocol, barely changed the bias: −1.5 % to −1.7 %. With noise, a near-null TI only raised the SD from about 5 % to 7.7 %. So the slide shows clustered TIs instead.)

### Exercise 4: mouse WM at 9.4 T with a human 1.5 T protocol (qmrust, about 6 slides)

1. **Problem:** the scenario and *a–c*, quoted.
2. **(a) Live Monte Carlo:**
   - The book's `irPlot5` layout (Figure 2.6).
   - Protocol boxes: TR 1000 ms; TI 100, 300, 600, 900 ms; SNR 100; trials 500.
   - **Run** simulates and fits (`barral`) both T₁ = 600 ms (human 1.5 T) and T₁ = 1700 ms (mouse 9.4 T).
   - It shows the noisy samples on the signal curves, and the fitted mean ± SD for each.
3. **(a) Answer:**
   - Bias and coefficient of variation for each T₁, from the run.
   - The conclusion: the protocol that worked for 600 ms is poor for 1700 ms.
4. **(b) Why:**
   - The same figure, with the TI range shaded. For 1700 ms, the four TIs sample only the start of the recovery.
   - TR = 1000 ms is much shorter than T₁, so the signal stays far from recovery and the curve is flat across the TIs.
   - The arguments are drawn from the chapter (TR of 2–5 T₁, and sampling around the null).
5. **(c) Proposed protocol:**
   - A **Proposed** preset, chosen by simulation during implementation: TR of a few T₁, and TIs spread across and past the null (around T₁ ln 2 ≈ 1.2 s).
   - **Run** shows the old and new CV side by side.
   - The protocol stays editable so the class can try its own.
6. **(c) Answer:** the CV and bias before and after, plus the scan-time cost of the longer TR.

As built:
- The human protocol gives a CV of 4.8 % on human WM and 11.5 % on mouse WM.
- The proposed protocol is TR 5000 ms with TI 100 / 1000 / 2000 / 4000 ms. It gives a CV of 2.3 %, and CV·√time improves from 23 to 10.5.
- A long-TR fit at TR 1000 ms would give about 414 ms (human) and 553 ms (mouse).
- The answers and the summary are folded into the slides themselves, giving 5 slides.

## 4. Corrections to the exercise text

1. **Ex. 3a** cites `irPlot2` (Figure 2.3), a single-T₁ slider figure. The WM/GM/CSF curves are in **Figure 2.2** (`irPlot1`). The slide cites Figure 2.2 and drops the leftover phrase "that blog post".
2. **Ex. 2c** says the optimal flip angles are "approximately 70% of the Ernst angle". Deoni, Rutt and Peters (2003) give the two angles at which the signal is about **71% of the Ernst signal**, one on each side of θ<sub>E</sub>. The slide quotes the exercise as written, adds a footnote with the corrected statement, and computes the Deoni pair. The literal 0.7 × θ<sub>E</sub> values (7.3°, 10.3°, 10.5°) appear in the speaker notes.

The README's chapter-issues list gains both corrections, plus the units of Figure 2.2's x-axis (labelled ms, data in s).

## 5. Testing

- **`tests/solve.test.js`** (Node), for the pure maths:
  - Fit through the origin on (900, 624), (1500, 1040), (4000, 2773) gives k ≈ 0.693 (±0.002).
  - Ernst angles 10.43 / 14.71 / 15.07.
  - At the Deoni pair, signal ÷ Ernst signal = 0.71 (±1e-6).
  - WM/GM contrast optimum 1149 ms. VFA contrast optimum 22.4° at TR = 30 ms.
  - Invalid input (empty, ≤ 0, NaN) returns an error result rather than throwing.
- **`tests/deck.test.js`** (extended):
  - Each exercise page loads its needed scripts in order.
  - Every `data-solve` has a registered widget.
  - Every `data-book` label exists in `LABELS`.
  - The T1 deck links to all four exercise pages.
- **`tests/smoke.js`** (extended to the exercise pages: offline, 1280×720 and 1920×1080):
  - Every slide renders with no overflow and no flat sub/sup.
  - Solve and → each produce a result, and Reset restores the defaults.
  - Exercises 3–4: qmrust initializes, and each live run returns within 1 s. The fitted T₁ values fall in the expected ranges: Ex. 4 human ≈ 600 ± 30 ms; Ex. 3 long-TR fit at 1.5 T within 5 % of 650 ms.
  - With the WASM base64 file blocked, the fallback card appears.
- **`tools/check_links.py`** also scans the exercise pages.
- Deploy: `deploy.yml` also copies `exercise-*.html`. The full set is checked in a local MyST build at `/mooc/slides/t1/`, as for the T1 deck.

## 6. Open questions for review

- **Q1, intended answer to Ex. 3c.** Implemented as described in §3 (Exercise 3, slides 6–7) and labelled in the speaker notes as a proposed answer. Mathieu reviews it on the live version.
- **Q2, provenance of qmrust.** The WASM is reused as a compiled binary. The Rust source for the `long_tr_lm` fit and the `signal_mean`/`signal_std` sim outputs exists only as uncommitted changes on qmrust branch `mb/dims` (in `projects/mooc-rust/qmrust`). `VERSIONS.md` will record the source file and its sha256. Committing that qmrust work is outside this task.
