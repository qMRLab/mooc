/* Exercise 5-3: shimming the 2013 Stikov B0 map with the scanner's 0th, 1st and 2nd order shims.
 * The B0 map: the dual-echo phase difference / (2π ΔTE), ΔTE 2.24 ms (nii/stikov2013_b0_*), in the brain (echo 1
 * magnitude above 20 % of its range, peeled by two voxels, largest connected piece, grown back by one: no scalp).
 * The shim terms: the Siemens basis of Shimming Toolbox (shimmingtoolbox/coils/spher_harm_basis.py, siemens_basis),
 * which is, in Hz per unit shim at scanner (RAS, mm) positions x, y, z (checked against it to 1e-15):
 *   f0: 1 Hz;  X: −g x,  Y: +g y,  Z: −g z  (per µT/m, g = 0.0425775 Hz/mm);
 *   Z2: h (z² − (x² + y²)/2),  ZX: 2h z x,  ZY: −2h z y,  X2−Y2: h (x² − y²),  XY: −2h x y  (per µT/m², h = g/1000)
 * The voxel positions: the MINC affine of series 49 (column c, row r of the slice):
 *   x = 90.421 − 2 c,  y = 142.648 − 1.963 r,  z = 35.999 − 0.382 r   (a tilted axial slice).
 * Each slide (section.ex53): data-preset="f0:90,y:50,..." adds those shim settings to the measured map to make the input
 * (the field to shim); the sliders, all at 0, are then added to it to make the output. */
(function () {
  'use strict';
  const DTE = 2.24e-3, G = 0.0425775, H = G / 1000;
  const TERMS = [
    { key: 'f0', name: 'f<sub>0</sub>', order: 0, unit: 'Hz', max: 300, step: 1, f: () => 1 },
    { key: 'x', name: 'X', order: 1, unit: 'µT/m', max: 100, step: 0.5, f: (x) => -G * x },
    { key: 'y', name: 'Y', order: 1, unit: 'µT/m', max: 100, step: 0.5, f: (x, y) => G * y },
    { key: 'z', name: 'Z', order: 1, unit: 'µT/m', max: 100, step: 0.5, f: (x, y, z) => -G * z },
    { key: 'z2', name: 'Z<sup>2</sup>', order: 2, unit: 'µT/m²', max: 1000, step: 5, f: (x, y, z) => H * (z * z - (x * x + y * y) / 2) },
    { key: 'zx', name: 'ZX', order: 2, unit: 'µT/m²', max: 1000, step: 5, f: (x, y, z) => 2 * H * z * x },
    { key: 'zy', name: 'ZY', order: 2, unit: 'µT/m²', max: 1000, step: 5, f: (x, y, z) => -2 * H * z * y },
    { key: 'x2y2', name: 'X<sup>2</sup>−Y<sup>2</sup>', order: 2, unit: 'µT/m²', max: 1000, step: 5, f: (x, y) => H * (x * x - y * y) },
    { key: 'xy', name: 'XY', order: 2, unit: 'µT/m²', max: 1000, step: 5, f: (x, y) => -2 * H * x * y },
  ];
  const BWR = [[0, [5, 48, 97]], [0.2, [33, 102, 172]], [0.4, [146, 197, 222]], [0.5, [255, 255, 255]], [0.6, [244, 165, 130]], [0.8, [178, 24, 43]], [1, [103, 0, 31]]];
  const bwr = (t) => {
    t = Math.max(0, Math.min(1, t));
    for (let k = 1; k < BWR.length; k++) if (t <= BWR[k][0]) {
      const [t0, a] = BWR[k - 1], [t1, b] = BWR[k], u = (t - t0) / (t1 - t0);
      return a.map((v, i) => Math.round(v + u * (b[i] - v)));
    }
    return BWR[BWR.length - 1][1];
  };
  const BG = [233, 237, 241];
  const pct = (v, p) => { const s = Float64Array.from(v).sort(); return s.length ? s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))] : 0; };
  const wrap = (a) => a - 2 * Math.PI * Math.floor((a + Math.PI) / (2 * Math.PI));
  const fmtV = (v, unit) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)} ${unit}`;

  // the data, once for all slides: the measured B0 map, the brain, the shim terms and their peak over the brain
  const data = (async () => {
    const get = async (u) => NiftiLite.read(new Uint8Array(await (await fetch(u)).arrayBuffer()));
    const [ph, mg] = await Promise.all([get('nii/stikov2013_b0_phase.nii.gz'), get('nii/stikov2013_b0_mag.nii.gz')]);
    const [nx, ny] = ph.dims, n = nx * ny;
    let lo = Infinity, hi = -Infinity; for (const v of ph.data) { if (v < lo) lo = v; if (v > hi) hi = v; }
    const s = hi > 3.2 || lo < -3.2 ? Math.PI / 4096 : 1;   // the Siemens scale (±4096 = ±π), or radians
    const b0 = new Float32Array(n);
    for (let i = 0; i < n; i++) b0[i] = wrap((ph.data[n + i] - ph.data[i]) * s) / (2 * Math.PI * DTE);
    const m1 = mg.data.subarray(0, n), i2 = pct(m1, 0.02), thr = i2 + 0.2 * (pct(m1, 0.98) - i2);
    const a = new Uint8Array(n);
    for (let i = 0; i < n; i++) a[i] = m1[i] >= thr ? 1 : 0;
    const erode = (src) => { const o = new Uint8Array(n); for (let r = 1; r < ny - 1; r++) for (let c = 1; c < nx - 1; c++) { const i = r * nx + c; o[i] = src[i] && src[i - 1] && src[i + 1] && src[i - nx] && src[i + nx] ? 1 : 0; } return o; };
    const b = erode(erode(a));   // two voxels off the edge, so thin bridges to the scalp break
    const lab = new Int32Array(n).fill(-1), sizes = [], stack = [];
    for (let s0 = 0; s0 < n; s0++) {
      if (!b[s0] || lab[s0] >= 0) continue;
      const id = sizes.length; let cnt = 0; lab[s0] = id; stack.push(s0);
      while (stack.length) { const i = stack.pop(); cnt++; for (const j of [i - 1, i + 1, i - nx, i + nx]) if (j >= 0 && j < n && b[j] && lab[j] < 0) { lab[j] = id; stack.push(j); } }
      sizes.push(cnt);
    }
    const big = sizes.indexOf(Math.max(...sizes)), core = new Uint8Array(n), mask = new Uint8Array(n);
    for (let i = 0; i < n; i++) core[i] = lab[i] === big ? 1 : 0;
    for (let r = 1; r < ny - 1; r++) for (let c = 1; c < nx - 1; c++) {   // grown back by one voxel, inside the threshold
      const i = r * nx + c; mask[i] = a[i] && (core[i] || core[i - 1] || core[i + 1] || core[i - nx] || core[i + nx]) ? 1 : 0;
    }
    const basis = TERMS.map(() => new Float32Array(n)), norm = TERMS.map(() => 0);
    for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++) {
      const i = r * nx + c, x = 90.421 - 2 * c, y = 142.648 - 1.963 * r, z = 35.999 - 0.382 * r;
      TERMS.forEach((t, k) => { const v = t.f(x, y, z); basis[k][i] = v; if (mask[i]) norm[k] = Math.max(norm[k], Math.abs(v)); });
    }
    return { nx, ny, n, b0, mask, basis, norm };
  })();

  function paint(cv, d, colourOf) {
    cv.width = d.nx; cv.height = d.ny;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(d.nx, d.ny);
    for (let i = 0; i < d.n; i++) { const [R, G2, B] = colourOf(i); img.data.set([R, G2, B, 255], 4 * i); }
    ctx.putImageData(img, 0, 0);
  }
  const cbar = (el, lim, unit) => {
    el.innerHTML = `<i style="background:linear-gradient(to right, ${BWR.map(([t, c]) => `rgb(${c.join(',')}) ${t * 100}%`).join(', ')})"></i><span>−${lim} ${unit}</span><span>0</span><span>${lim} ${unit}</span>`;
  };
  const stats = (d, a) => { let s = 0, s2 = 0, m = 0; for (let i = 0; i < d.n; i++) if (d.mask[i]) { s += a[i]; s2 += a[i] * a[i]; m++; } const mu = s / m; return [mu, Math.sqrt(Math.max(0, s2 / m - mu * mu))]; };

  // the optimal shim: the currents c that minimize Σ (input + Σ c_k basis_k)² over the brain (least squares, all 9
  // terms), which makes the mean 0 and the SD as small as these shims can. On one slice the terms are not independent
  // (this slice is tilted, so z is a linear function of y: Z = a f0 + b Y, and ZY, Z2 overlap with Y², …), so many
  // currents give the same field; of those, this takes the smallest, each current relative to its slider's range
  // (a tiny ridge, 1e-9 of the mean diagonal, on currents scaled by their range). Normal equations, Gauss–Jordan.
  function optimal(d, input) {
    const idx = []; for (let i = 0; i < d.n; i++) if (d.mask[i]) idx.push(i);
    return lsq(d.basis, input, idx, null);
  }
  // lsq(basis, target, voxels, prior): the currents c minimizing Σ_voxels (target + Σ c_k basis_k)², plus a tiny ridge
  // (1e-9 of the mean diagonal) on (c − prior) scaled by each slider's range: of all the currents that fit equally well,
  // the one nearest the prior (0 if none)
  function lsq(basis, target, idx, prior) {
    const K = TERMS.length, M = Array.from({ length: K }, () => new Float64Array(K + 1)), sc = TERMS.map((t) => t.max);
    for (const i of idx) {
      for (let a = 0; a < K; a++) {
        const ba = basis[a][i] * sc[a]; M[a][K] -= ba * target[i];
        for (let b = a; b < K; b++) M[a][b] += ba * basis[b][i] * sc[b];
      }
    }
    for (let a = 0; a < K; a++) for (let b = 0; b < a; b++) M[a][b] = M[b][a];
    let tr = 0; for (let a = 0; a < K; a++) tr += M[a][a];
    const lam = 1e-9 * tr / K;
    for (let a = 0; a < K; a++) { M[a][a] += lam; if (prior) M[a][K] += lam * prior[a] / sc[a]; }
    for (let p = 0; p < K; p++) {   // Gaussian elimination with partial pivoting
      let m = p; for (let r = p + 1; r < K; r++) if (Math.abs(M[r][p]) > Math.abs(M[m][p])) m = r;
      [M[p], M[m]] = [M[m], M[p]];
      for (let r = 0; r < K; r++) if (r !== p) { const f = M[r][p] / M[p][p]; for (let c = p; c <= K; c++) M[r][c] -= f * M[p][c]; }
    }
    return M.map((row, a) => (row[K] / row[a]) * sc[a]);
  }
  const shimmed = (d, input, c) => { const o = new Float32Array(d.n); for (let i = 0; i < d.n; i++) { let v = input[i]; for (let k = 0; k < TERMS.length; k++) v += c[k] * d.basis[k][i]; o[i] = v; } return o; };
  // the comparison slide (section.ex53-cmp): the currents, yours and the optimal, one chart per order (its own unit)
  function showCompare(res) {
    const sl = document.querySelector('section.ex53-cmp'); if (!sl) return;
    sl.classList.add('ex53-done');
    const fmt = (v) => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2));
    sl.querySelector('.ex53-cmp-st').innerHTML = `<div><span>Your shim</span><b>Mean ${fmt(res.mine.mean)} Hz · SD ${fmt(res.mine.sd)} Hz</b></div><div><span>Optimal shim</span><b>Mean ${fmt(res.opt.mean)} Hz · SD ${fmt(res.opt.sd)} Hz</b></div>`;
    // the two shimmed maps on one range, and their difference (yours − optimal) on its own
    const d = res.d, inBrain = (a) => Array.from(a).filter((_, i) => d.mask[i]).map(Math.abs);
    const lim = Math.max(5, Math.round(pct([...inBrain(res.mine.map), ...inBrain(res.opt.map)], 0.98)));
    const diff = new Float32Array(d.n); for (let i = 0; i < d.n; i++) diff[i] = res.mine.map[i] - res.opt.map[i];
    const limD = Math.max(1, Math.round(pct(inBrain(diff), 0.98)));
    paint(sl.querySelector('.ex53-c-mine'), d, (i) => (d.mask[i] ? bwr(0.5 + res.mine.map[i] / (2 * lim)) : BG));
    paint(sl.querySelector('.ex53-c-opt'), d, (i) => (d.mask[i] ? bwr(0.5 + res.opt.map[i] / (2 * lim)) : BG));
    paint(sl.querySelector('.ex53-c-diff'), d, (i) => (d.mask[i] ? bwr(0.5 + diff[i] / (2 * limD)) : BG));
    sl.querySelectorAll('.ex53-cbar-b0').forEach((el) => cbar(el, lim, 'Hz'));
    cbar(sl.querySelector('.ex53-cbar-diff'), limD, 'Hz');
    sl.querySelector('.ex53-bars').innerHTML = [0, 1, 2].map((o) => {
      const ks = TERMS.map((t, k) => k).filter((k) => TERMS[k].order === o), unit = TERMS[ks[0]].unit;
      const vmax = Math.max(1, ...ks.map((k) => Math.max(Math.abs(res.mine.c[k]), Math.abs(res.opt.c[k])))) * 1.15;
      const W = 70 + ks.length * 104, Hh = 230, top = 34, bot = 36, y0 = top + (Hh - top - bot) / 2, sc = (Hh - top - bot) / 2 / vmax;
      const bar = (x, v, col) => { const h = v * sc; return `<rect x="${x}" y="${Math.min(y0, y0 - h)}" width="34" height="${Math.max(1, Math.abs(h))}" fill="${col}"/><text x="${x + 17}" y="${h >= 0 ? y0 - h - 5 : y0 - h + 14}" text-anchor="middle" font-size="12">${fmt(v)}</text>`; };
      return `<figure><svg viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" role="img" aria-label="${['0th', '1st', '2nd'][o]} order shim currents">
        <text x="10" y="18" font-size="14" font-weight="700" fill="#5b6776">${['0TH', '1ST', '2ND'][o]} ORDER (${unit})</text>
        <line x1="50" x2="${W - 10}" y1="${y0}" y2="${y0}" stroke="#9aa6b4"/>
        ${ks.map((k, j) => { const x = 62 + j * 104; return `<rect x="${x - 10}" y="${top - 4}" width="96" height="${Hh - top - 2}" rx="6" fill="#f2f5f8"/>` + bar(x, res.mine.c[k], '#1f5f99') + bar(x + 42, res.opt.c[k], '#d9822b') + `<text x="${x + 38}" y="${Hh - 12}" text-anchor="middle" font-size="15" font-weight="700" fill="#1d2733">${TERMS[k].name.replace(/<sub>0<\/sub>/, '₀').replace(/<sup>2<\/sup>/g, '²')}</text>`; }).join('')}
      </svg></figure>`;
    }).join('');
  }

  function initSlide(slide) {
    const q = (s) => slide.querySelector(s);
    const preset = {};
    (slide.dataset.preset || '').split(',').filter(Boolean).forEach((p) => { const [k, v] = p.split(':'); preset[k] = Number(v); });
    // the term tiles and sliders: in one block (.ex53-terms) or one block per order (.ex53-terms[data-order])
    const tile = (t) => `<figure><canvas data-term-c="${t.key}"></canvas><figcaption>${t.name}</figcaption><span class="ex53-peak" data-term-p="${t.key}"></span>
      <input type="range" data-term="${t.key}" min="${-t.max}" max="${t.max}" step="${t.step}" value="0" aria-label="${t.key} shim, ${t.unit}"><b data-term-v="${t.key}"></b></figure>`;
    slide.querySelectorAll('.ex53-terms').forEach((box) => {
      const orders = box.dataset.order != null ? [Number(box.dataset.order)] : [0, 1, 2];
      box.innerHTML = orders.map((o) => `<div class="ex53-order">${box.dataset.order != null ? '' : `<p class="ex53-oh">${['0th', '1st', '2nd'][o]} order</p>`}<div class="ex53-row">${TERMS.filter((t) => t.order === o).map(tile).join('')}</div></div>`).join('');
    });
    slide.querySelectorAll('.ex-tabs [data-tab]').forEach((b) => b.addEventListener('click', () => {
      b.blur();
      slide.querySelectorAll('.ex-tabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      slide.querySelectorAll('.ex-panel').forEach((p) => { p.hidden = p.dataset.panel !== b.dataset.tab; });
    }));
    data.then((d) => {
      const input = new Float32Array(d.n);
      for (let i = 0; i < d.n; i++) { let v = d.b0[i]; TERMS.forEach((t, k) => { if (preset[t.key]) v += preset[t.key] * d.basis[k][i]; }); input[i] = v; }
      // the colour ranges: the input's 98th percentile of |B0| at first; on the exercise slides, the input and the output
      // each have their own, which a drag left or right on the map or its colour bar changes (double-click: back to it)
      const auto = Math.max(10, Math.round(pct(Array.from(input).filter((_, i) => d.mask[i]).map(Math.abs), 0.98)));
      const own = !!q('.pipe-in .ex53-cbar'), lim = { in: auto, out: auto };
      const drawIn = () => {
        paint(q('.ex53-c-in'), d, (i) => (d.mask[i] ? bwr(0.5 + input[i] / (2 * lim.in)) : BG));
        if (own) cbar(q('.pipe-in .ex53-cbar'), lim.in, 'Hz'); else slide.querySelectorAll('.ex53-cbar').forEach((el) => cbar(el, lim.in, 'Hz'));
      };
      drawIn();
      const [mi, si] = stats(d, input);
      if (q('.ex53-in-st')) q('.ex53-in-st').innerHTML = `Mean <b>${mi.toFixed(1)} Hz</b> · SD <b>${si.toFixed(1)} Hz</b>`;
      TERMS.forEach((t, k) => {
        const cv = q(`[data-term-c="${t.key}"]`); if (!cv) return;
        paint(cv, d, (i) => (d.mask[i] ? bwr(0.5 + (d.norm[k] ? d.basis[k][i] / d.norm[k] : 1) / 2) : BG));
        q(`[data-term-p="${t.key}"]`).textContent = `±${d.norm[k] < 0.1 ? d.norm[k].toFixed(3) : d.norm[k].toFixed(2)} Hz per ${t.unit}`;
      });
      const update = () => {
        const c = TERMS.map((t) => { const el = q(`[data-term="${t.key}"]`); return el ? Number(el.value) : 0; });
        TERMS.forEach((t, k) => { const el = q(`[data-term-v="${t.key}"]`); if (el) el.textContent = fmtV(c[k], t.unit); });
        const out = new Float32Array(d.n);
        for (let i = 0; i < d.n; i++) { let v = input[i]; for (let k = 0; k < TERMS.length; k++) if (c[k]) v += c[k] * d.basis[k][i]; out[i] = v; }
        paint(q('.ex53-c-out'), d, (i) => (d.mask[i] ? bwr(0.5 + out[i] / (2 * (own ? lim.out : lim.in))) : BG));
        if (own) cbar(q('.pipe-out .ex53-cbar'), lim.out, 'Hz');
        const [m, s] = stats(d, out);
        q('.ex53-mean').textContent = `${m.toFixed(1)} Hz`; q('.ex53-sd').textContent = `${s.toFixed(1)} Hz`;
      };
      slide.querySelectorAll('[data-term]').forEach((el) => {
        el.addEventListener('input', () => requestAnimationFrame(update));
        el.addEventListener('keydown', (e) => e.stopPropagation());
        el.addEventListener('dblclick', () => { el.value = '0'; update(); });
      });
      if (own) [['in', '.pipe-in figure', drawIn], ['out', '.pipe-out figure', update]].forEach(([key, sel, draw]) => {
        const fig = q(sel); let drag = null;
        fig.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, lim: lim[key] }; fig.setPointerCapture(e.pointerId); e.preventDefault(); });
        fig.addEventListener('pointermove', (e) => { if (!drag) return; lim[key] = Math.max(1, Math.round(drag.lim * Math.exp((e.clientX - drag.x) / 120))); requestAnimationFrame(draw); });
        const end = () => { drag = null; };
        fig.addEventListener('pointerup', end); fig.addEventListener('pointercancel', end);
        fig.addEventListener('dblclick', () => { lim[key] = auto; draw(); });
        fig.title = 'Drag left or right to change the range; double-click to reset it';
      });
      if (q('.ex53-submit')) q('.ex53-submit').addEventListener('click', (e) => {
        e.currentTarget.blur();
        const c = TERMS.map((t) => { const el = q(`[data-term="${t.key}"]`); return el ? Number(el.value) : 0; }), co = optimal(d, input);
        const map1 = shimmed(d, input, c), map2 = shimmed(d, input, co), [m1, s1] = stats(d, map1), [m2, s2] = stats(d, map2);
        showCompare({ d, mine: { c, mean: m1, sd: s1, map: map1 }, opt: { c: co, mean: m2, sd: s2, map: map2 } });
        if (typeof Reveal !== 'undefined') Reveal.next();
      });
      if (q('.ex53-reset')) q('.ex53-reset').addEventListener('click', (e) => { e.currentTarget.blur(); slide.querySelectorAll('[data-term]').forEach((el) => { el.value = '0'; }); update(); });
      // ?shim=key:value,… sets the sliders, ?submit=1 then submits (for checking the slides)
      const U = new URLSearchParams(location.search);
      if (q('.ex53-submit') && U.get('shim')) U.get('shim').split(',').forEach((kv) => { const [k, v] = kv.split(':'); const el = q(`[data-term="${k}"]`); if (el) el.value = v; });
      update();
      if (q('.ex53-submit') && U.get('submit') === '1') q('.ex53-submit').click();
    }).catch((e) => { const m = q('.ex53-mean'); if (m) m.textContent = `Could not load the B0 map: ${e.message || e}`; });
  }

  // ---------------------------------------------------------------- (c) the QSM scan: shim the volume, or one slice
  // nii/qsmcons_siemens_field*: the B0 field (Hz, unwrapped in 3D), echo 1 magnitude and the brain, 2 mm isotropic;
  // data-affine: voxel (i, j, k) → scanner RAS mm (12 numbers, row by row); data-slice: the slice shown (0-based k).
  // Shim over the volume: the mean and SD over every brain voxel; over axial slice data-slice + 1: over its brain voxels only. The
  // slice-wise sliders start from the volume-wise ones. Submit: the optimal volume-wise shim, then the optimal
  // slice-wise shim nearest to it, and the comparison on the next slide (section.ex53-cmp2), on that slice.
  const volData = (async () => {
    const get = async (u) => NiftiLite.read(new Uint8Array(await (await fetch(u)).arrayBuffer()));
    const [f, m, b] = await Promise.all(['nii/qsmcons_siemens_field.nii.gz', 'nii/qsmcons_siemens_field_mag.nii.gz', 'nii/qsmcons_siemens_field_brain.nii.gz'].map(get));
    return { dims: f.dims, field: f.data, mag: m.data, brain: b.data };
  })();
  function initVolSlide(slide) {
    const q = (s) => slide.querySelector(s);
    const A = slide.dataset.affine.split(',').map(Number), kSel = Number(slide.dataset.slice);
    const tile = (t) => `<figure><canvas data-term-c="${t.key}"></canvas><figcaption>${t.name}</figcaption><span class="ex53-peak" data-term-p="${t.key}"></span>
      <input type="range" data-term="${t.key}" min="${-t.max}" max="${t.max}" step="${t.step}" value="0" aria-label="${t.key} shim, ${t.unit}"><b data-term-v="${t.key}"></b></figure>`;
    slide.querySelectorAll('.ex53-terms').forEach((box) => { box.innerHTML = `<div class="ex53-row">${TERMS.filter((t) => t.order === Number(box.dataset.order)).map(tile).join('')}</div>`; });
    slide.querySelectorAll('.ex-tabs [data-tab]').forEach((bt) => bt.addEventListener('click', () => {
      bt.blur();
      slide.querySelectorAll('.ex-tabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === bt)));
      slide.querySelectorAll('.ex-panel').forEach((pn) => { pn.hidden = pn.dataset.panel !== bt.dataset.tab; });
    }));
    volData.then((v) => {
      const [nx, ny, nz] = v.dims, ns = nx * ny, N = ns * nz;
      // every brain voxel, and those of the shimmed slice; the shim terms at each (indexed by voxel, 0 elsewhere)
      const all = [], sl = [];
      for (let i = 0; i < N; i++) if (v.brain[i] > 0) { all.push(i); if (Math.floor(i / ns) === kSel) sl.push(i); }
      const basis = TERMS.map(() => new Float32Array(N)), norm = TERMS.map(() => 0);
      for (const i of all) {
        const k = Math.floor(i / ns), j = Math.floor((i % ns) / nx), c = i % nx;
        const x = A[0] * c + A[1] * j + A[2] * k + A[3], y = A[4] * c + A[5] * j + A[6] * k + A[7], z = A[8] * c + A[9] * j + A[10] * k + A[11];
        TERMS.forEach((t, kk) => { const val = t.f(x, y, z); basis[kk][i] = val; if (k === kSel) norm[kk] = Math.max(norm[kk], Math.abs(val)); });
      }
      const d = { nx, ny, n: ns, mask: new Uint8Array(ns) };   // the shimmed slice, for painting
      for (const i of sl) d.mask[i - kSel * ns] = 1;
      const onSlice = (a) => a.subarray(kSel * ns, (kSel + 1) * ns);
      const inS = onSlice(v.field), auto = Math.max(10, Math.round(pct(sl.map((i) => Math.abs(v.field[i])), 0.98)));
      const lim = { in: auto, out: auto };
      // the views, the same for the input and the output: an axial slice (k) and a sagittal one (column i), each with a
      // line where the other cuts it; the slice-wise shim is always over slice kSel
      const view = { k: kSel, i: Math.max(0, Math.min(nx - 1, Math.round(-A[3] / A[0]))) };   // the sagittal: x = 0
      const LINE = [70, 78, 90], RED = [214, 39, 40];
      let mode = 'vol';   // shim over: 'vol' or 'slice'
      const fieldAt = (idx, c) => { let val = v.field[idx]; if (c) for (let kk = 0; kk < TERMS.length; kk++) if (c[kk]) val += c[kk] * basis[kk][idx]; return val; };
      const drawViews = (axSel, sagSel, c, L) => {
        const ax = { nx, ny, n: ns }, sag = { nx: ny, ny: nz, n: ny * nz };
        paint(q(axSel), ax, (p) => { const idx = view.k * ns + p; if (p % nx === view.i) return LINE; return v.brain[idx] > 0 ? bwr(0.5 + fieldAt(idx, c) / (2 * L)) : BG; });
        paint(q(sagSel), sag, (p) => {
          const r = Math.floor(p / ny), j = p % ny, k = nz - 1 - r, idx = k * ns + j * nx + view.i;   // superior at the top, anterior at the left
          if (mode === 'slice' && k === kSel) return RED;   // the slice being shimmed
          if (k === view.k) return LINE;
          return v.brain[idx] > 0 ? bwr(0.5 + fieldAt(idx, c) / (2 * L)) : BG;
        });
      };
      const drawIn = () => { drawViews('.ex53-c-in', '.ex53-c-in-sag', null, lim.in); cbar(q('.pipe-in .ex53-cbar'), lim.in, 'Hz'); };
      const showView = () => { q('.ex53-k-v').textContent = `${view.k + 1} / ${nz}`; q('.ex53-i-v').textContent = `${view.i + 1} / ${nx}`; slide.classList.toggle('ex53-onshim', view.k === kSel); };
      q('.ex53-k').max = String(nz - 1); q('.ex53-k').value = String(view.k);
      q('.ex53-i').max = String(nx - 1); q('.ex53-i').value = String(view.i);
      showView(); drawIn();
      TERMS.forEach((t, kk) => {
        const cv = q(`[data-term-c="${t.key}"]`), bs = onSlice(basis[kk]);
        paint(cv, d, (i) => (d.mask[i] ? bwr(0.5 + (norm[kk] ? bs[i] / norm[kk] : 1) / 2) : BG));
        q(`[data-term-p="${t.key}"]`).textContent = `±${norm[kk] < 0.1 ? norm[kk].toFixed(3) : norm[kk].toFixed(2)} Hz per ${t.unit}`;
      });
      const statsOf = (idx, c) => {
        let s1 = 0, s2 = 0;
        for (const i of idx) { let val = v.field[i]; for (let kk = 0; kk < TERMS.length; kk++) if (c[kk]) val += c[kk] * basis[kk][i]; s1 += val; s2 += val * val; }
        const mu = s1 / idx.length; return [mu, Math.sqrt(Math.max(0, s2 / idx.length - mu * mu))];
      };
      const sliceMap = (c) => { const o = new Float32Array(ns); for (const i of sl) { let val = v.field[i]; for (let kk = 0; kk < TERMS.length; kk++) if (c[kk]) val += c[kk] * basis[kk][i]; o[i - kSel * ns] = val; } return o; };
      // the two sets of currents (volume, slice); the sliders show the active one
      const cur = { vol: TERMS.map(() => 0), slice: null };
      const read = () => TERMS.map((t) => Number(q(`[data-term="${t.key}"]`).value));
      const write = (c) => TERMS.forEach((t, kk) => { q(`[data-term="${t.key}"]`).value = String(c[kk]); });
      const update = () => {
        const c = read(); cur[mode] = c;
        TERMS.forEach((t, kk) => { q(`[data-term-v="${t.key}"]`).textContent = fmtV(c[kk], t.unit); });
        drawViews('.ex53-c-out', '.ex53-c-out-sag', c, lim.out);
        cbar(q('.pipe-out .ex53-cbar'), lim.out, 'Hz');
        const [mu, sd] = statsOf(mode === 'vol' ? all : sl, c);
        q('.ex53-mean').textContent = `${mu.toFixed(1)} Hz`; q('.ex53-sd').textContent = `${sd.toFixed(1)} Hz`;
        q('.ex53-over').textContent = mode === 'vol' ? 'over the volume' : `over axial slice ${kSel + 1}`;
        slide.classList.toggle('ex53-slicemode', mode === 'slice'); slide.classList.toggle('ex53-onshim', view.k === kSel);
      };
      slide.querySelectorAll('[data-shimover]').forEach((bt) => bt.addEventListener('click', () => {
        bt.blur(); mode = bt.dataset.shimover;
        slide.querySelectorAll('[data-shimover]').forEach((x) => x.setAttribute('aria-pressed', String(x === bt)));
        if (mode === 'slice' && !cur.slice) cur.slice = cur.vol.slice();   // the slice starts from the volume's shim
        write(cur[mode]); update(); drawIn();
      }));
      slide.querySelectorAll('[data-term]').forEach((el) => {
        el.addEventListener('input', () => requestAnimationFrame(update));
        el.addEventListener('keydown', (e) => e.stopPropagation());
        el.addEventListener('dblclick', () => { el.value = '0'; update(); });
      });
      [['.ex53-k', 'k'], ['.ex53-i', 'i']].forEach(([sel, key]) => {   // the planes shown, for both the input and the output
        const el = q(sel);
        el.addEventListener('input', () => { view[key] = Number(el.value); showView(); requestAnimationFrame(() => { drawIn(); update(); }); });
        el.addEventListener('keydown', (e) => e.stopPropagation());
      });
      [['in', '.pipe-in .ex53-views', drawIn], ['out', '.pipe-out .ex53-views', update]].forEach(([key, sel, draw]) => {
        const fig = q(sel); let drag = null;
        fig.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, lim: lim[key] }; fig.setPointerCapture(e.pointerId); e.preventDefault(); });
        fig.addEventListener('pointermove', (e) => { if (!drag) return; lim[key] = Math.max(1, Math.round(drag.lim * Math.exp((e.clientX - drag.x) / 120))); requestAnimationFrame(draw); });
        const end = () => { drag = null; };
        fig.addEventListener('pointerup', end); fig.addEventListener('pointercancel', end);
        fig.addEventListener('dblclick', () => { lim[key] = auto; draw(); });
        fig.title = 'Drag left or right to change the range; double-click to reset it';
      });
      q('.ex53-reset').addEventListener('click', (e) => { e.currentTarget.blur(); write(TERMS.map(() => 0)); update(); });
      // submit the volume-wise shim first: it is kept, and the slice-wise shim starts from it; then the slice-wise one
      let mineVol = null;
      const toMode = (m) => { const bt = q(`[data-shimover="${m}"]`); if (bt) bt.click(); };
      q('.ex53-submit-vol').addEventListener('click', (e) => {
        e.currentTarget.blur();
        if (mode !== 'vol') toMode('vol');
        mineVol = read(); cur.slice = mineVol.slice();
        q('.ex53-submit-vol').classList.add('done'); q('.ex53-submit-slice').disabled = false;
        toMode('slice');
      });
      q('.ex53-submit-slice').addEventListener('click', (e) => {
        e.currentTarget.blur(); if (!mineVol) return;
        if (mode !== 'slice') toMode('slice');
        const mineSlice = read(), cv = lsq(basis, v.field, all, null), cs = lsq(basis, v.field, sl, cv);
        const entry = (c) => ({ c, map: sliceMap(c), slice: statsOf(sl, c), vol: statsOf(all, c) });
        showCompare2({ d, k: kSel, mineVol: entry(mineVol), mineSlice: entry(mineSlice), vol: entry(cv), slice: entry(cs) });
        if (typeof Reveal !== 'undefined') Reveal.next();
      });
      const U = new URLSearchParams(location.search);   // ?vshim=key:value,… and ?vsubmit=1, for checking the slides
      if (U.get('vshim')) { U.get('vshim').split(',').forEach((kv) => { const [k, val] = kv.split(':'); const el = q(`[data-term="${k}"]`); if (el) el.value = val; }); }
      update();
      if (U.get('vsubmit') === '1') { q('.ex53-submit-vol').click(); q('.ex53-submit-slice').click(); }
      else if (U.get('vsubmit') === 'vol') q('.ex53-submit-vol').click();
    }).catch((e) => { q('.ex53-mean').textContent = `Could not load: ${e.message || e}`; });
  }
  // (d) the comparison, on the shimmed slice: yours, the optimal volume-wise and slice-wise shims; their currents, maps and the
  // difference between the two optimal ones
  function showCompare2(res) {
    const sl = document.querySelector('section.ex53-cmp2'); if (!sl) return;
    sl.classList.add('ex53-done');
    const d = res.d, fmt = (val) => (Math.abs(val) >= 100 ? val.toFixed(0) : Math.abs(val) >= 10 ? val.toFixed(1) : val.toFixed(2));
    const n1 = res.k + 1, series = [['mineVol', 'Yours, volume', '#1f5f99'], ['vol', 'Optimal, volume', '#d9822b'], ['mineSlice', `Yours, slice ${n1}`, '#7fb0dc'], ['slice', `Optimal, slice ${n1}`, '#3f8f5a']];
    sl.querySelector('.ex53-legend').innerHTML = series.map(([, name, col]) => `<i style="background:${col}"></i>${name}`).join(' ');
    sl.querySelector('.ex53-bars').innerHTML = [0, 1, 2].map((o) => {
      const ks = TERMS.map((t, k) => k).filter((k) => TERMS[k].order === o), unit = TERMS[ks[0]].unit;
      const vmax = Math.max(1, ...ks.flatMap((k) => series.map(([key]) => Math.abs(res[key].c[k])))) * 1.2;
      const W = 50 + ks.length * 102, Hh = 214, top = 30, bot = 30, y0 = top + (Hh - top - bot) / 2, scl = (Hh - top - bot) / 2 / vmax;
      const bar = (x, val, col) => { const h = val * scl; return `<rect x="${x}" y="${Math.min(y0, y0 - h)}" width="20" height="${Math.max(1, Math.abs(h))}" fill="${col}"/><text x="${x + 10}" y="${h >= 0 ? y0 - h - 4 : y0 - h + 11}" text-anchor="middle" font-size="9">${fmt(val)}</text>`; };
      return `<figure><svg viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" role="img" aria-label="${['0th', '1st', '2nd'][o]} order shim currents">
        <text x="6" y="16" font-size="13" font-weight="700" fill="#5b6776">${['0TH', '1ST', '2ND'][o]} ORDER (${unit})</text>
        <line x1="44" x2="${W - 6}" y1="${y0}" y2="${y0}" stroke="#9aa6b4"/>
        ${ks.map((k, j) => { const x = 46 + j * 102; return `<rect x="${x - 6}" y="${top - 4}" width="98" height="${Hh - top - 2}" rx="6" fill="#f2f5f8"/>` + series.map(([key, , col], si) => bar(x + si * 22 + (si >= 2 ? 4 : 0), res[key].c[k], col)).join('') + `<text x="${x + 45}" y="${Hh - 8}" text-anchor="middle" font-size="14" font-weight="700" fill="#1d2733">${TERMS[k].name.replace(/<sub>0<\/sub>/, '₀').replace(/<sup>2<\/sup>/g, '²')}</text>`; }).join('')}
      </svg></figure>`;
    }).join('');
    const inSl = (a) => Array.from(a).filter((_, i) => d.mask[i]).map(Math.abs);
    const lim = Math.max(5, Math.round(pct([...inSl(res.vol.map), ...inSl(res.slice.map), ...inSl(res.mineVol.map), ...inSl(res.mineSlice.map)], 0.98)));
    const diff = new Float32Array(d.n); for (let i = 0; i < d.n; i++) diff[i] = res.vol.map[i] - res.slice.map[i];
    const limD = Math.max(1, Math.round(pct(inSl(diff), 0.98)));
    [['mineVol', '.ex53-c-minevol'], ['mineSlice', '.ex53-c-mineslice'], ['vol', '.ex53-c-vol'], ['slice', '.ex53-c-slice']].forEach(([key, cls]) => paint(sl.querySelector(cls), d, (i) => (d.mask[i] ? bwr(0.5 + res[key].map[i] / (2 * lim)) : BG)));
    paint(sl.querySelector('.ex53-c-diff'), d, (i) => (d.mask[i] ? bwr(0.5 + diff[i] / (2 * limD)) : BG));
    sl.querySelectorAll('.ex53-cbar-b0').forEach((el) => cbar(el, lim, 'Hz'));
    cbar(sl.querySelector('.ex53-cbar-diff'), limD, 'Hz');
    sl.querySelectorAll('[data-slicen]').forEach((el) => { el.textContent = String(n1); });
    sl.querySelectorAll('[data-st]').forEach((el) => { const e = res[el.dataset.st]; el.innerHTML = `slice ${n1}: mean ${fmt(e.slice[0])} · SD <b>${fmt(e.slice[1])}</b> Hz<br>volume: mean ${fmt(e.vol[0])} · SD <b>${fmt(e.vol[1])}</b> Hz`; });
  }
  document.querySelectorAll('section.ex53').forEach(initSlide);
  document.querySelectorAll('section.ex53-vol').forEach(initVolSlide);
})();
