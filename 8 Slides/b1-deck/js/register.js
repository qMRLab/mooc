/* Register the double angle scans (#reg), simulated in dam-motion.js (the head moved between them, MOTION, hidden from
 * the students; the receive coils didn't). The students drag the 120° image over the 60° one and turn and scale it, in a
 * small copy of qmrlab.org/viewer (layers, colour map, range, opacity); every change resamples it (bilinear),
 * computes B1 = arccos(S120 / 2 S60) / 60° and its mean % error against the expected map (the measured map, which stands
 * in for an AFI scan taken in the first position), inside the brain, one pixel in from its edge.
 * Coordinates: grid pixels of the crop, pixel (i, j) covering [j, j + 1] × [i, i + 1]; the student's transform
 * Q(y) = c + t + s·R(θ)(y − c) maps the 120° image onto the 60° one, so the registered image at x is I120(Q⁻¹(x)). */
(function () {
  'use strict';
  const slide = document.getElementById('reg'), M = window.DAM_MOTION; if (!slide || !M) return;
  const { DEG, A, H, W, N, CX, CY, MASK, TRUE, SCORE, sample, S60, S120 } = M;

  // the student's transform, and what it gives
  const st = { tu: 0, tv: 0, rot: 0, scale: 1 };
  const B1REG = new Float64Array(N).fill(NaN);
  function compute() {
    const co = Math.cos(-st.rot * DEG), si = Math.sin(-st.rot * DEG);
    let err = 0;
    for (let p = 0; p < N; p++) {
      if (!MASK[p]) continue;
      const i = Math.floor(p / W), j = p % W;
      const ux = (j + 0.5 - CX - st.tu) / st.scale, uy = (i + 0.5 - CY - st.tv) / st.scale;
      const s120 = sample(S120, CX + co * ux - si * uy, CY + si * ux + co * uy);
      const r = Math.max(-1, Math.min(1, s120 / (2 * S60[p])));
      B1REG[p] = Math.acos(r) / (A * DEG);
    }
    for (const p of SCORE) err += Math.abs(B1REG[p] - TRUE[p]) / TRUE[p];
    return (100 * err) / SCORE.length;
  }

  // colour maps, as in qmrlab.org/viewer
  const ANCHORS = {
    gray: [[0, 0, 0], [255, 255, 255]],
    hot: [[0, 0, 0], [230, 0, 0], [255, 210, 0], [255, 255, 255]],
    viridis: [[68, 1, 84], [71, 44, 122], [59, 82, 139], [44, 114, 142], [33, 145, 140], [40, 174, 128], [94, 201, 98], [173, 220, 48], [253, 231, 37]],
    'blue-white-red': [[5, 48, 97], [33, 102, 172], [67, 147, 195], [146, 197, 222], [247, 247, 247], [244, 165, 130], [214, 96, 77], [178, 24, 43], [103, 0, 31]],
  };
  const color = (cm, t) => {
    const a = ANCHORS[cm], x = Math.max(0, Math.min(1, t)) * (a.length - 1), k = Math.min(a.length - 2, Math.floor(x)), f = x - k;
    return a[k].map((c, n) => c + f * (a[k + 1][n] - c));
  };
  function paint(cv, val) {   // val(p) → [r, g, b] or null (transparent), at the grid's size
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'), im = ctx.createImageData(W, H);
    for (let p = 0; p < N; p++) {
      const c = val(p); if (!c) continue;
      im.data.set([c[0], c[1], c[2], 255], 4 * p);
    }
    ctx.putImageData(im, 0, 0);
    return cv;
  }
  const B1LO = 0.7, B1HI = 1.3, b1col = (v) => color('blue-white-red', (v - B1LO) / (B1HI - B1LO));
  const q = (c) => slide.querySelector(c);
  paint(q('canvas.rg-afi'), (p) => (MASK[p] ? b1col(TRUE[p]) : null));
  const yours = q('canvas.rg-yours');
  slide.querySelectorAll('canvas.rg-thumb').forEach((c) => { c.style.width = `${c.dataset.w}px`; c.style.height = `${Math.round((c.dataset.w * H) / W)}px`; });

  // the layers, bottom first: each with its colour map, range and opacity, as in the viewer
  const robust = (img) => { const v = Array.from(img).sort((a, b) => a - b); return [v[Math.floor(0.005 * (v.length - 1))], v[Math.floor(0.995 * (v.length - 1))]]; };
  const mkLayer = (name, img, alpha, moving) => {
    const [mn, mx] = robust(img);
    return { name, img, moving, visible: true, cmap: 'gray', min: Math.round(mn), max: Math.round(mx), alpha, auto: [Math.round(mn), Math.round(mx)], cv: document.createElement('canvas') };
  };
  const LAYERS = [mkLayer('FA1_60deg.nii.gz', S60, 1, false), mkLayer('FA2_120deg.nii.gz', S120, 0.5, true)];
  let sel = 1;
  const repaint = (L) => paint(L.cv, (p) => color(L.cmap, (L.img[p] - L.min) / (L.max - L.min || 1)));
  LAYERS.forEach(repaint);

  const over = q('canvas.rg-over'), octx = over.getContext('2d');
  const K = Math.min(Number(over.dataset.w) / W, Number(over.dataset.h) / H);
  over.width = Math.round(K * W); over.height = Math.round(K * H);
  function drawView() {
    octx.setTransform(1, 0, 0, 1, 0, 0); octx.globalAlpha = 1;
    octx.fillStyle = '#000'; octx.fillRect(0, 0, over.width, over.height);
    octx.imageSmoothingEnabled = true;
    for (const L of LAYERS) {
      if (!L.visible) continue;
      octx.setTransform(K, 0, 0, K, 0, 0);
      octx.globalAlpha = L.alpha;
      if (L.moving) { octx.translate(CX + st.tu, CY + st.tv); octx.rotate(st.rot * DEG); octx.scale(st.scale, st.scale); octx.translate(-CX, -CY); }
      octx.drawImage(L.cv, 0, 0);
    }
    octx.globalAlpha = 1;
    over.classList.toggle('can-drag', LAYERS[1].visible);
  }
  let queued = false, scoreDirty = true;
  function update(scoreToo) {
    if (scoreToo) scoreDirty = true;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      drawView();
      if (!scoreDirty) return;
      scoreDirty = false;
      const e = compute();
      paint(yours, (p) => (MASK[p] ? b1col(B1REG[p]) : null));
      q('.rg-score').textContent = `${e.toFixed(1)} %`;
      const mm = (v, pos, neg) => `${Math.abs(2 * v).toFixed(1)} mm ${v < 0 ? neg : pos}`;
      q('.rg-shift').textContent = `${mm(st.tu, 'right', 'left')}, ${mm(st.tv, 'down', 'up')}`;
      const rv = q('.rg-rot-v'), sv = q('.rg-scale-v');
      if (rv) rv.textContent = `${st.rot.toFixed(1)}°`;
      if (sv) sv.textContent = st.scale.toFixed(3);
    });
  }

  // the layer list and the selected layer's controls
  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const noKeys = (el) => el.addEventListener('keydown', (e) => e.stopPropagation());   // arrows and digits edit, not the slides
  function panel() {
    const list = q('.vw-layers'); list.innerHTML = '';
    LAYERS.forEach((L, idx) => {
      const row = document.createElement('div');
      row.className = `vw-layer${idx === sel ? ' sel' : ''}`;
      row.innerHTML = `<input type="checkbox" ${L.visible ? 'checked' : ''} title="Show / hide"><span class="vw-name">${esc(L.name)}</span>`;
      row.querySelector('input').addEventListener('change', (e) => { L.visible = e.target.checked; update(); });
      row.addEventListener('click', (e) => { if (e.target.tagName === 'INPUT') return; sel = idx; panel(); });
      list.prepend(row);   // the top of the list is drawn on top
    });
    const L = LAYERS[sel], box = q('.vw-ctl');
    box.innerHTML = `<h5>${esc(L.name)}</h5>
      <label class="vw-row">Colour map <select class="vw-cm">${Object.keys(ANCHORS).map((c) => `<option ${c === L.cmap ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <div class="vw-range"><label>Min <input class="vw-mn" type="number" step="any" value="${L.min}"></label><label>Max <input class="vw-mx" type="number" step="any" value="${L.max}"></label><button class="vw-auto" title="Reset to the 0.5–99.5 % range">Auto</button></div>
      <label>Opacity <input class="vw-op" type="range" min="0" max="1" step="0.05" value="${L.alpha}"></label>` +
      (L.moving ? `<div class="vw-reg"><h6>Registration <small>this layer only</small></h6>
      <p>Shown over FA1, <b>drag it</b> in the view to move it.</p>
      <label class="vw-sl">Rotation <b class="rg-rot-v"></b><input class="rg-rot" type="range" min="-15" max="15" step="0.1" value="${st.rot}"></label>
      <label class="vw-sl">Scale <b class="rg-scale-v"></b><input class="rg-scale" type="range" min="0.9" max="1.1" step="0.002" value="${st.scale}"></label>
      <button class="rg-reset">Reset</button></div>` : '');
    box.querySelectorAll('input, select').forEach(noKeys);
    const restyle = () => { repaint(L); update(); };
    box.querySelector('.vw-cm').addEventListener('change', (e) => { L.cmap = e.target.value; restyle(); });
    box.querySelector('.vw-mn').addEventListener('change', (e) => { L.min = parseFloat(e.target.value); restyle(); });
    box.querySelector('.vw-mx').addEventListener('change', (e) => { L.max = parseFloat(e.target.value); restyle(); });
    box.querySelector('.vw-auto').addEventListener('click', () => { [L.min, L.max] = L.auto; panel(); restyle(); });
    box.querySelector('.vw-op').addEventListener('input', (e) => { L.alpha = Number(e.target.value); update(); });
    if (L.moving) {
      box.querySelector('.rg-rot').addEventListener('input', (e) => { st.rot = Number(e.target.value); update(true); });
      box.querySelector('.rg-scale').addEventListener('input', (e) => { st.scale = Number(e.target.value); update(true); });
      box.querySelector('.rg-reset').addEventListener('click', () => { Object.assign(st, { tu: 0, tv: 0, rot: 0, scale: 1 }); panel(); update(true); });
    }
    update(true);
  }

  // drag FA2 when it is shown (in screen pixels, whatever Reveal's scale)
  over.addEventListener('pointerdown', (e) => {
    if (!LAYERS[1].visible) return;
    e.preventDefault(); over.setPointerCapture(e.pointerId);
    const r = over.getBoundingClientRect(), px = W / r.width;   // grid pixels per screen pixel
    const x0 = e.clientX, y0 = e.clientY, tu0 = st.tu, tv0 = st.tv;
    const move = (ev) => { st.tu = tu0 + (ev.clientX - x0) * px; st.tv = tv0 + (ev.clientY - y0) * px; update(true); };
    const up = () => { over.removeEventListener('pointermove', move); over.removeEventListener('pointerup', up); over.removeEventListener('pointercancel', up); };
    over.addEventListener('pointermove', move); over.addEventListener('pointerup', up); over.addEventListener('pointercancel', up);
  });
  panel();
})();
