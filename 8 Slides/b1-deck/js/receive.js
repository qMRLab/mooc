/* The coils don't move with the head (#reg-rx). The two scans of dam-motion.js in the laboratory (32 × 32 cm... here
 * 30 × 30 cm, 2 mm pixels), with the receive coils drawn where they are, fixed in the scanner. The students move (drag) and
 * turn (slider) the head for the second scan; the two scans are then registered perfectly (the exact inverse of the
 * motion, no interpolation of the anatomy), so every remaining error comes from the receive field: each piece of brain is
 * seen by rec(P(x)) in the second scan and rec(x) in the first, and the ratio keeps rec(P(x)) / rec(x).
 * Motion P(x) = c + d + R(φ)(x − c) in lab coordinates (u right, v up, φ counter-clockwise), about the same centre as the
 * hidden motion of #reg (the "Motion from (a)" button). It starts with no motion. */
(function () {
  'use strict';
  const slide = document.getElementById('reg-rx'), M = window.DAM_MOTION; if (!slide || !M) return;
  const { D, MOTION, DEG, A, PIX, NR, NC, H, W, N, CX, CY, r0, c0, U, V, SEG, wires, rec, MASK, TRUE, SCORE, sample, OBJ60, OBJ120, UNIT } = M;
  const LH = 0.15, LN = Math.round((2 * LH) / PIX), MAXD = 0.010, MAXR = 10;   // lab half-width (m), its pixels, motion limits (m, °)
  const uc = U(CX - 0.5), vc = V(CY - 0.5);   // the rotation centre: the crop's centre, as for #reg
  const labU = (b) => (b + 0.5 - LN / 2) * PIX, labV = (a) => (LN / 2 - (a + 0.5)) * PIX;
  const cropX = (u) => u / PIX + (NC - 1) / 2 - c0 + 0.5, cropY = (v) => (NR - 1) / 2 - v / PIX - r0 + 0.5;   // continuous crop coordinates
  const segAt = (u, v) => { const i = Math.round((NR - 1) / 2 - v / PIX), j = Math.round(u / PIX + (NC - 1) / 2); return i >= 0 && i < NR && j >= 0 && j < NC && SEG[i * NC + j] > 0; };
  const START = { du: MOTION.du * PIX, dv: -MOTION.dv * PIX, rot: -MOTION.rot };   // #reg's hidden motion, in lab terms
  const st = { du: 0, dv: 0, rot: 0 };   // start with no motion: the students move the head themselves

  // the receive field on the lab grid, fixed
  const RL = new Float64Array(LN * LN);
  for (let a = 0; a < LN; a++) for (let b = 0; b < LN; b++) RL[a * LN + b] = rec(labU(b), labV(a));

  // the two scans, as acquired, on the lab grid
  const GMAX = 1200, HEADG = 38;   // grey scale top (image units, as on #reg), and the grey of the head outside the brain
  function scan(cv, move, obj) {
    const co = Math.cos(-move.rot * DEG), si = Math.sin(-move.rot * DEG);
    cv.width = LN; cv.height = LN;
    const ctx = cv.getContext('2d'), im = ctx.createImageData(LN, LN);
    for (let a = 0; a < LN; a++) for (let b = 0; b < LN; b++) {
      const yu = labU(b) - uc - move.du, yv = labV(a) - vc - move.dv;
      const xu = uc + co * yu - si * yv, xv = vc + si * yu + co * yv;   // P⁻¹(y): where this point of the head was in scan 1
      const s = UNIT * RL[a * LN + b] * sample(obj, cropX(xu), cropY(xv));
      const g = s > 0 ? Math.min(255, (255 * s) / GMAX) : segAt(xu, xv) ? HEADG : 0;
      im.data.set([g, g, g, 255], 4 * (a * LN + b));
    }
    ctx.putImageData(im, 0, 0);
    return cv;
  }
  const off1 = scan(document.createElement('canvas'), { du: 0, dv: 0, rot: 0 }, OBJ60), off2 = document.createElement('canvas');

  // the lab views: the scan, then the coils on top (loops seen edge-on: the line between their two wires)
  const v1 = slide.querySelector('canvas.rx-s1'), v2 = slide.querySelector('canvas.rx-s2');
  const toPx = (cv, u, v) => [((u + LH) / (2 * LH)) * cv.width, ((LH - v) / (2 * LH)) * cv.height];
  function view(cv, img) {
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    ctx.lineCap = 'round';
    for (const w of wires) {
      const [x1, y1] = toPx(cv, w[0][0], w[0][1]), [x2, y2] = toPx(cv, w[1][0], w[1][1]);
      ctx.strokeStyle = '#e8770e'; ctx.lineWidth = cv.width / 90;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
  }
  view(v1, off1);

  // perfect registration: what is left in the ratio, and in the B1 map
  const B1 = new Float64Array(N).fill(NaN), G = new Float64Array(N).fill(NaN);
  function compute() {
    const co = Math.cos(st.rot * DEG), si = Math.sin(st.rot * DEG);
    let err = 0;
    for (let p = 0; p < N; p++) {
      if (!MASK[p]) continue;
      const i = Math.floor(p / W), j = p % W, xu = U(j) - uc, xv = V(i) - vc;
      const g = rec(uc + st.du + co * xu - si * xv, vc + st.dv + si * xu + co * xv) / rec(U(j), V(i));   // rec(P(x)) / rec(x)
      G[p] = g;
      B1[p] = Math.acos(Math.max(-1, Math.min(1, (g * OBJ120[p]) / (2 * OBJ60[p])))) / (A * DEG);
    }
    for (const p of SCORE) err += Math.abs(B1[p] - TRUE[p]) / TRUE[p];
    return (100 * err) / SCORE.length;
  }
  const BWR = [[5, 48, 97], [33, 102, 172], [67, 147, 195], [146, 197, 222], [247, 247, 247], [244, 165, 130], [214, 96, 77], [178, 24, 43], [103, 0, 31]];
  // R2/R1: blue–red like the B1 map, but the viewer's coolwarm (other blues and reds, a grey centre), so the two differ
  const RATIO = [[59, 76, 192], [78, 104, 216], [98, 130, 234], [119, 154, 247], [141, 176, 254], [163, 194, 254], [185, 208, 249], [204, 217, 237], [221, 220, 220],
    [236, 211, 197], [245, 196, 172], [247, 176, 147], [244, 152, 122], [235, 125, 98], [221, 95, 75], [202, 59, 55], [180, 4, 38]];
  const cmap = (A, t) => { const x = Math.max(0, Math.min(1, t)) * (A.length - 1), k = Math.min(A.length - 2, Math.floor(x)), f = x - k; return A[k].map((c, n) => c + f * (A[k + 1][n] - c)); };
  function paint(cv, arr, lo, hi, A) {
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'), im = ctx.createImageData(W, H);
    for (let p = 0; p < N; p++) if (MASK[p]) im.data.set([...cmap(A, (arr[p] - lo) / (hi - lo)), 255], 4 * p);
    ctx.putImageData(im, 0, 0);
  }
  slide.querySelectorAll('canvas.rg-thumb').forEach((c) => { c.style.width = `${c.dataset.w}px`; c.style.height = `${Math.round((c.dataset.w * H) / W)}px`; });

  const q = (c) => slide.querySelector(c);
  let queued = false;
  function update() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      view(v2, scan(off2, st, OBJ120));
      const e = compute();
      paint(q('canvas.rx-ratio'), G, 0.8, 1.2, RATIO);
      paint(q('canvas.rx-b1'), B1, 0.7, 1.3, BWR);
      q('.rx-score').textContent = `${e.toFixed(1)} %`;
      const mm = (v, pos, neg) => `${Math.abs(1000 * v).toFixed(1)} mm ${v < 0 ? neg : pos}`;
      q('.rx-shift').textContent = `${mm(st.du, 'right', 'left')}, ${mm(st.dv, 'up', 'down')}`;
      q('.rx-rot-v').textContent = `${(-st.rot).toFixed(1)}°`;
    });
  }

  // drag the head in the second scan; the slider turns it (clockwise on screen, as on #reg)
  v2.addEventListener('pointerdown', (e) => {
    e.preventDefault(); v2.setPointerCapture(e.pointerId);
    const m = (2 * LH) / v2.getBoundingClientRect().width;   // metres per screen pixel
    const x0 = e.clientX, y0 = e.clientY, du0 = st.du, dv0 = st.dv;
    const clamp = (v) => Math.max(-MAXD, Math.min(MAXD, v));
    const move = (ev) => { st.du = clamp(du0 + (ev.clientX - x0) * m); st.dv = clamp(dv0 - (ev.clientY - y0) * m); update(); };
    const up = () => { v2.removeEventListener('pointermove', move); v2.removeEventListener('pointerup', up); v2.removeEventListener('pointercancel', up); };
    v2.addEventListener('pointermove', move); v2.addEventListener('pointerup', up); v2.addEventListener('pointercancel', up);
  });
  const rot = q('.rx-rot');
  rot.min = -MAXR; rot.max = MAXR; rot.value = -st.rot;
  rot.addEventListener('input', () => { st.rot = -Number(rot.value); update(); });
  rot.addEventListener('keydown', (e) => e.stopPropagation());   // arrow keys move the slider, not the slides
  const set = (m) => { Object.assign(st, m); rot.value = -st.rot; update(); };
  q('.rx-start').addEventListener('click', () => set(START));
  q('.rx-none').addEventListener('click', () => set({ du: 0, dv: 0, rot: 0 }));
  update();
})();
