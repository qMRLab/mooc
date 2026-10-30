/* Filtering a B1 map with bright vessels (Exercise 4-6, the chapter's filtering exercise). The "true" B1 is the 3 T head
 * model's |B1+| on the brain slice of fl-data.js (smooth, 0.77–1.24); the "measured" map adds Gaussian noise (SD 0.03) and
 * bright spots where blood flow corrupts it (VESSELS: small blobs, B1 up to ~2), all seeded so every student gets the same
 * map. Filters work on the brain only (pixels outside it, and masked pixels, are left out of every window): median over a
 * w × w window, or Gaussian with σ = w / 4 truncated to the same window. Masked pixels (measured B1 above a threshold) are
 * then filled from their neighbours. Score: rms % error against the truth over the tissue, i.e. the brain without the
 * vessel pixels, which the researcher doesn't need. window.B1FILTER.build(D) is the maths (Node-testable); the slides
 * (section.flt, data-mask="no" | "yes") use it below. */
(function () {
  'use strict';
  const VESSELS = [[24, 40, 1.4, 0.9], [36, 52, 1.1, 0.7], [52, 30, 1.0, 1.0], [60, 58, 1.3, 0.6], [74, 44, 1.2, 0.8],
    [86, 26, 1.0, 0.9], [92, 60, 1.1, 0.7], [104, 42, 1.4, 1.0], [46, 64, 0.9, 0.5], [70, 20, 0.9, 0.6]];   // [row, col, radius (px), extra B1]
  function build(D) {
    const NR = D.grid.rows, NC = D.grid.cols;
    const bytes = (b64) => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
    const u16 = (b64) => Array.from(new Uint16Array(bytes(b64).buffer), (v) => (v === 65535 ? NaN : v / 20000));
    const WM = bytes(D.wm), GM = bytes(D.gm), CSF = bytes(D.csf), B1 = u16(D.b1), SIM = u16(D.sim3t_head);
    const inBrain = (k) => WM[k] + GM[k] + CSF[k] > 50 && !Number.isNaN(B1[k]) && !Number.isNaN(SIM[k]);
    let r0 = NR, r1 = 0, c0 = NC, c1 = 0;
    for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) if (inBrain(i * NC + j)) { r0 = Math.min(r0, i); r1 = Math.max(r1, i); c0 = Math.min(c0, j); c1 = Math.max(c1, j); }
    r0 -= 2; r1 += 2; c0 -= 2; c1 += 2;
    const H = r1 - r0 + 1, W = c1 - c0 + 1, N = H * W;
    const BRAIN = new Uint8Array(N), TRUE = new Float64Array(N).fill(NaN), RAW = new Float64Array(N).fill(NaN), VES = new Uint8Array(N);
    let seed = 7;   // mulberry32 + Box–Muller: the same noise for everyone
    const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
    for (let i = 0; i < H; i++) for (let j = 0; j < W; j++) {
      const ii = i + r0, jj = j + c0, p = i * W + j;
      if (ii < 0 || ii >= NR || jj < 0 || jj >= NC || !inBrain(ii * NC + jj)) continue;
      BRAIN[p] = 1; TRUE[p] = SIM[ii * NC + jj]; RAW[p] = TRUE[p] + 0.03 * gauss();
    }
    for (const [vi, vj, rad, extra] of VESSELS) {
      for (let i = 0; i < H; i++) for (let j = 0; j < W; j++) {
        const p = i * W + j, d = Math.hypot(i + r0 - vi, j + c0 - vj);
        if (!BRAIN[p] || d > rad + 0.5) continue;
        VES[p] = 1; RAW[p] += extra * Math.exp(-((d / (rad + 0.5)) ** 2));
      }
    }
    const TISSUE = []; for (let p = 0; p < N; p++) if (BRAIN[p] && !VES[p]) TISSUE.push(p);

    // filter the brain with a w × w window, leaving out masked pixels; masked pixels are filled the same way
    function apply({ kind = 'none', w = 5, thr = Infinity }) {
      const OUT = new Float64Array(N).fill(NaN), MASK = new Uint8Array(N), h = Math.floor(w / 2), s = w / 4;
      for (let p = 0; p < N; p++) if (BRAIN[p] && RAW[p] > thr) MASK[p] = 1;
      const use = (p) => BRAIN[p] && !MASK[p];
      for (let i = 0; i < H; i++) for (let j = 0; j < W; j++) {
        const p = i * W + j; if (!BRAIN[p]) continue;
        if (kind === 'none') { OUT[p] = MASK[p] ? NaN : RAW[p]; continue; }
        const vals = []; let sw = 0, sv = 0;
        for (let di = -h; di <= h; di++) for (let dj = -h; dj <= h; dj++) {
          const a = i + di, b = j + dj; if (a < 0 || a >= H || b < 0 || b >= W) continue;
          const q = a * W + b; if (!use(q)) continue;
          if (kind === 'median') vals.push(RAW[q]);
          else { const g = Math.exp(-(di * di + dj * dj) / (2 * s * s)); sw += g; sv += g * RAW[q]; }
        }
        if (kind === 'median') { if (vals.length) { vals.sort((x, y) => x - y); const m = vals.length >> 1; OUT[p] = vals.length % 2 ? vals[m] : (vals[m - 1] + vals[m]) / 2; } }
        else if (sw > 0) OUT[p] = sv / sw;
      }
      let e2 = 0, n = 0;
      for (const p of TISSUE) { const v = Number.isNaN(OUT[p]) ? RAW[p] : OUT[p]; e2 += ((v - TRUE[p]) / TRUE[p]) ** 2; n++; }
      return { OUT, MASK, score: 100 * Math.sqrt(e2 / n) };
    }
    return { H, W, N, BRAIN, TRUE, RAW, VES, TISSUE, apply };
  }
  window.B1FILTER = { build };
  if (typeof document === 'undefined') return;

  // ---- the slides ----
  const D = window.FLASH_BRAIN; if (!D) return;
  const F = build(D), { H, W, N, BRAIN, TRUE, RAW, VES } = F;
  const BWR = [[5, 48, 97], [33, 102, 172], [67, 147, 195], [146, 197, 222], [247, 247, 247], [244, 165, 130], [214, 96, 77], [178, 24, 43], [103, 0, 31]];
  const PRGN = [[64, 0, 75], [118, 42, 131], [153, 112, 171], [194, 165, 207], [247, 247, 247], [166, 219, 160], [90, 174, 97], [27, 120, 55], [0, 68, 27]];   // error map: its own scale, not B1's
  const cmap = (A, t) => { const x = Math.max(0, Math.min(1, t)) * (A.length - 1), k = Math.min(A.length - 2, Math.floor(x)), f = x - k; return A[k].map((c, n) => c + f * (A[k + 1][n] - c)); };
  function paint(cv, val) {
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'), im = ctx.createImageData(W, H);
    for (let p = 0; p < N; p++) { const c = val(p); if (c) im.data.set([c[0], c[1], c[2], 255], 4 * p); }
    ctx.putImageData(im, 0, 0);
  }
  const b1c = (v) => cmap(BWR, (v - 0.7) / 0.6), MASKC = [232, 119, 14];
  document.querySelectorAll('section.flt').forEach((slide) => {
    const q = (c) => slide.querySelector(c), withMask = slide.dataset.mask === 'yes';
    slide.querySelectorAll('canvas.flt-map').forEach((c) => { c.style.width = `${c.dataset.w}px`; c.style.height = `${Math.round((c.dataset.w * H) / W)}px`; });
    const st = { kind: 'none', w: 5, thr: withMask ? 1.4 : Infinity, maskOn: withMask };
    function update() {
      const r = F.apply({ kind: st.kind, w: st.w, thr: st.maskOn ? st.thr : Infinity });
      paint(q('canvas.flt-raw'), (p) => (!BRAIN[p] ? null : r.MASK[p] ? MASKC : b1c(RAW[p])));
      paint(q('canvas.flt-out'), (p) => (!BRAIN[p] || Number.isNaN(r.OUT[p]) ? null : b1c(r.OUT[p])));
      paint(q('canvas.flt-err'), (p) => (!BRAIN[p] || VES[p] || Number.isNaN(r.OUT[p]) ? null : cmap(PRGN, 0.5 + (r.OUT[p] - TRUE[p]) / TRUE[p] / 0.2)));
      q('.flt-score').textContent = `${r.score.toFixed(2)} %`;
      q('.flt-w-read').textContent = st.kind === 'none' ? '–' : `${st.w} × ${st.w} pixels (${2 * st.w} mm)`;
      if (withMask) {
        let n = 0; for (let p = 0; p < N; p++) n += r.MASK[p];
        q('.flt-thr-read').textContent = st.maskOn ? `B1 > ${st.thr.toFixed(2)} · ${n} pixels masked` : 'off';
      }
    }
    segToggle(slide, 'fltkind', (v) => { st.kind = v; update(); });
    const wIn = q('.flt-w'); wIn.addEventListener('input', () => { st.w = Number(wIn.value); update(); }); keepSlider(wIn);
    if (withMask) {
      const tIn = q('.flt-thr'); tIn.addEventListener('input', () => { st.thr = Number(tIn.value); update(); }); keepSlider(tIn);
      const mb = q('.flt-maskon'); mb.addEventListener('click', () => { st.maskOn = !st.maskOn; mb.setAttribute('aria-pressed', String(st.maskOn)); mb.textContent = st.maskOn ? 'Mask on' : 'Mask off'; mb.blur(); update(); });
    }
    update();
  });
})();
