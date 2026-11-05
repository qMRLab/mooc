/* Exercise 5-1: water, fat and B0.
 *   #wf-phasor  one voxel: water and fat phasors at two echoes, the field the pair gives, its error against ΔTE.
 *   #fs-intro   a T1-weighted GRE of the 2013 Stikov 3 T slice, with fat.
 *   #fs-stir    inversion recovery curves and the STIR image (perfect inversion or the measured B1).
 *   #fs-sat     fat saturation: place a band on the slice's spectrum (uniform field).
 *   #fs-shim    the same band with a simulated field across the head (poor shim).
 *   #fs-dixon2  2-point Dixon (in phase + opposed) with that field: water and fat mix.
 *   #fs-dixon3  3-point Dixon: echoes 1 and 3 give a B0 map; removing it separates water and fat.
 * The head: js/head-data.js (the B1 deck's fl-data.js): measured T1 in the brain, WM/GM/CSF fractions, the measured B1
 * map and the head segmentation (0 air, 1 brain, 2 bone, 3 scalp, 4 fat). Fat: T1 = 380 ms, one peak at −434 Hz. */
(function () {
  'use strict';
  const FF = -434;          // fat − water frequency at 3 T (−3.4 ppm × 127.7 MHz), Hz
  const T1F = 380;          // fat T1 at 3 T, ms
  const PERIOD = 1000 / Math.abs(FF);   // fat–water cycle, ms (2.30)
  const mod = (a, n) => ((a % n) + n) % n;
  const wrapPi = (p) => p - 2 * Math.PI * Math.round(p / (2 * Math.PI));

  // ---------------------------------------------------------------- the head slice
  const D = window.FLASH_BRAIN;
  const NY = D.grid.rows, NX = D.grid.cols, N = NY * NX;
  const bytes = (b64) => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const SEG = bytes(D.seg), T1M = new Uint16Array(bytes(D.t1_ms).buffer), WM = bytes(D.wm), GM = bytes(D.gm), CSF = bytes(D.csf);
  const B1 = Array.from(new Uint16Array(bytes(D.b1).buffer), (v) => (v === 65535 ? 1 : v / 20000));
  // per voxel: water and fat proton densities and water T1 (fat T1 is T1F)
  const PW = new Float32Array(N), PF = new Float32Array(N), T1W = new Float32Array(N);
  const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)] || 0; };
  const brainT1 = median(Array.from(T1M).filter((v, k) => SEG[k] === 1 && v > 0));
  for (let k = 0; k < N; k++) {
    switch (SEG[k]) {
      case 1: { const w = WM[k], g = GM[k], c = CSF[k], s = w + g + c; PW[k] = s ? (0.69 * w + 0.8 * g + 1.0 * c) / s : 0.8; T1W[k] = T1M[k] || brainT1; break; }
      case 2: PW[k] = 0.08; PF[k] = 0.3; T1W[k] = 1000; break;     // bone: fatty marrow
      case 3: PW[k] = 0.3; PF[k] = 0.6; T1W[k] = 1100; break;      // scalp: mostly subcutaneous fat
      case 4: PW[k] = 0.05; PF[k] = 0.95; T1W[k] = 1100; break;    // fat
      default: break;
    }
  }
  const tissueT1 = (sel) => median(Array.from(T1M).filter((v, k) => SEG[k] === 1 && v > 0 && sel(k)));
  const T1_WM = tissueT1((k) => WM[k] > 70), T1_GM = tissueT1((k) => GM[k] > 70), T1_CSF = Math.max(3000, tissueT1((k) => CSF[k] > 70));

  // T1-weighted spoiled GRE (TR 20 ms, 25°, measured B1): water and fat parts, used by every image below
  const gre = (pd, t1, b1) => { const a = (25 * Math.PI) / 180 * b1, E = Math.exp(-20 / t1); return (pd * Math.sin(a) * (1 - E)) / (1 - Math.cos(a) * E); };
  const SW = new Float32Array(N), SF = new Float32Array(N);
  for (let k = 0; k < N; k++) if (SEG[k]) { SW[k] = gre(PW[k], T1W[k], B1[k]); SF[k] = gre(PF[k], T1F, B1[k]); }
  const MAX = Math.max(...Array.from(SW, (w, k) => w + SF[k]));

  // a field across the head (left-right), as from a poor linear shim: from −g/2 to +g/2 over the head's width
  let c0 = NX, c1 = 0;
  for (let k = 0; k < N; k++) if (SEG[k]) { const c = k % NX; c0 = Math.min(c0, c); c1 = Math.max(c1, c); }
  const fieldAt = (k, g) => g * (((k % NX) - c0) / (c1 - c0) - 0.5);

  // images: 128 x 88, anterior at the top
  const toRows = (f) => Array.from({ length: NY }, (_, i) => Array.from({ length: NX }, (_, j) => f(i * NX + j)));
  const imgLayout = (w, h, extra) => Object.assign({ width: w, height: h, margin: { l: 2, r: 2, t: 2, b: 2 }, paper_bgcolor: '#fff', plot_bgcolor: '#000',
    xaxis: { visible: false, scaleanchor: 'y', constrain: 'domain', fixedrange: true }, yaxis: { visible: false, autorange: 'reversed', constrain: 'domain', fixedrange: true } }, extra || {});
  const gray = (z, zmax) => ({ type: 'heatmap', z, colorscale: [[0, '#000'], [1, '#fff']], zmin: 0, zmax, showscale: false, hovertemplate: '%{z:.2f}<extra></extra>' });
  const fieldHeat = (z, lim) => ({ type: 'heatmap', z, colorscale: BWR, zmin: -lim, zmax: lim, hoverongaps: false, colorbar: { title: { text: 'Hz' }, thickness: 10, len: 0.8 }, hovertemplate: '%{z:.0f} Hz<extra></extra>' });
  const CFG = { displayModeBar: false };
  function plot(el, data, layout) { if (el._drawn) Plotly.react(el, data, layout, CFG); else { Plotly.newPlot(el, data, layout, CFG); el._drawn = true; } }
  const pct = (v) => `${Math.round(100 * v)} %`;

  // ---------------------------------------------------------------- (a) one voxel, two echoes
  (function phasor() {
    const slide = document.getElementById('wf-phasor'); if (!slide) return;
    const q = (c) => slide.querySelector(c);
    const ff = q('.wp-ff'), psi = q('.wp-psi'), te1 = q('.wp-te1'), dte = q('.wp-dte');
    [ff, psi, te1, dte].forEach(keepSlider);
    const svg = q('.ph-svg');
    const panel = (cx, label) => {
      const g = svgEl('g', {}, svg);
      svgEl('circle', { cx, cy: 140, r: 110, fill: 'none', stroke: '#d8dee6', 'stroke-width': 1.5 }, g);
      svgEl('line', { x1: cx - 115, y1: 140, x2: cx + 115, y2: 140, stroke: '#eef1f4' }, g);
      svgEl('line', { x1: cx, y1: 25, x2: cx, y2: 255, stroke: '#eef1f4' }, g);
      const title = svgEl('text', { x: cx, y: 18, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, fill: INK }, g);
      const w = svgEl('line', { x1: cx, y1: 140, stroke: '#1f5f99', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
      const f = svgEl('line', { stroke: '#e0a800', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
      const s = svgEl('line', { x1: cx, y1: 140, stroke: INK, 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }, g);
      const dot = svgEl('circle', { r: 5, fill: INK }, g);
      const ang = svgEl('text', { x: cx, y: 282, 'text-anchor': 'middle', 'font-size': 14, fill: '#5b6776' }, g);
      return { cx, title, w, f, s, dot, ang, label };
    };
    const P = [panel(145, 'Echo 1'), panel(435, 'Echo 2')];
    const legend = svgEl('text', { x: 290, y: 18, 'text-anchor': 'middle', 'font-size': 12, fill: '#5b6776' }, svg);
    legend.textContent = '';
    const sig = (fat, f, t) => {   // complex signal at t (ms): (W + F e^{i2π fF t}) e^{i2π f t}
      const pw = 2 * Math.PI * f * t * 1e-3, pf = 2 * Math.PI * (f + FF) * t * 1e-3;
      return [(1 - fat) * Math.cos(pw) + fat * Math.cos(pf), (1 - fat) * Math.sin(pw) + fat * Math.sin(pf)];
    };
    const measured = (fat, f, t1, d) => {
      const [x1, y1] = sig(fat, f, t1), [x2, y2] = sig(fat, f, t1 + d);
      return Math.atan2(y2 * x1 - x2 * y1, x2 * x1 + y2 * y1) / (2 * Math.PI * d * 1e-3);
    };
    let err = q('.ph-err');
    function draw() {
      const fat = Number(ff.value) / 100, f = Number(psi.value), t1 = Number(te1.value), d = Number(dte.value);
      q('.wp-ff-read').textContent = `${Math.round(fat * 100)} %`; q('.wp-psi-read').textContent = `${f > 0 ? '+' : ''}${f} Hz`;
      q('.wp-te1-read').textContent = `${t1.toFixed(2)} ms`; q('.wp-dte-read').textContent = `${d.toFixed(2)} ms`;
      const R = 105;
      [t1, t1 + d].forEach((t, n) => {
        const p = P[n], pw = 2 * Math.PI * f * t * 1e-3, pf = 2 * Math.PI * (f + FF) * t * 1e-3;
        const wx = p.cx + R * (1 - fat) * Math.cos(pw), wy = 140 - R * (1 - fat) * Math.sin(pw);
        const fx = wx + R * fat * Math.cos(pf), fy = wy - R * fat * Math.sin(pf);
        p.w.setAttribute('x2', wx); p.w.setAttribute('y2', wy);
        p.f.setAttribute('x1', wx); p.f.setAttribute('y1', wy); p.f.setAttribute('x2', fx); p.f.setAttribute('y2', fy);
        p.s.setAttribute('x2', fx); p.s.setAttribute('y2', fy); p.dot.setAttribute('cx', fx); p.dot.setAttribute('cy', fy);
        p.title.textContent = `${p.label}: TE = ${t.toFixed(2)} ms`;
        const a = mod(360 * FF * t * 1e-3 + 180, 360) - 180;
        p.ang.textContent = `fat at ${Math.round(a)}° from water`;
      });
      legend.textContent = '';
      const m = measured(fat, f, t1, d), e0 = m - f, e = Math.abs(e0) < 0.05 ? 0 : e0;
      q('.wp-meas').textContent = `${m > 0 ? '+' : ''}${m.toFixed(1)} Hz (true ${f > 0 ? '+' : ''}${f})`;
      const ec = q('.wp-errv'); ec.textContent = `${e > 0 ? '+' : ''}${e.toFixed(1)} Hz`; ec.classList.toggle('warn', Math.abs(e) > 1); ec.classList.toggle('ok', Math.abs(e) <= 1);
      const a1 = mod(360 * FF * t1 * 1e-3 + 180, 360) - 180, a2 = mod(360 * FF * (t1 + d) * 1e-3 + 180, 360) - 180;
      q('.wp-ang').textContent = `${Math.round(a1)}° / ${Math.round(a2)}°`;
      // error against ΔTE for this voxel and TE1
      const xs = [], ys = [];
      for (let x = 0.5; x <= 6.0001; x += 0.02) { xs.push(x); ys.push(measured(fat, f, t1, x) - f); }
      const shapes = [1, 2].map((n) => ({ type: 'line', x0: n * PERIOD, x1: n * PERIOD, yref: 'paper', y0: 0, y1: 1, line: { color: '#2e8b3a', dash: 'dot', width: 1.5 } }));
      plot(err, [
        { x: xs, y: ys, mode: 'lines', line: { color: '#1f5f99', width: 2.5 }, hovertemplate: 'ΔTE %{x:.2f} ms → %{y:.1f} Hz<extra></extra>' },
        { x: [d], y: [e], mode: 'markers', marker: { size: 11, color: '#c0392b' }, hoverinfo: 'skip' },
      ], { width: 560, height: 230, margin: { l: 60, r: 12, t: 26, b: 42 }, showlegend: false, paper_bgcolor: '#fff', plot_bgcolor: '#fff',
        xaxis: { title: { text: 'ΔTE (ms)' }, range: [0.5, 6], fixedrange: true, gridcolor: '#eef1f4' },
        yaxis: { title: { text: 'error (Hz)' }, range: [-120, 120], fixedrange: true, gridcolor: '#eef1f4', zerolinecolor: '#9aa5b1' },
        shapes, annotations: [1, 2].map((n) => ({ x: n * PERIOD, y: 1, yref: 'paper', text: `${(n * PERIOD).toFixed(2)} ms`, showarrow: false, yanchor: 'bottom', font: { size: 12, color: '#2e8b3a' } })) });
    }
    [ff, psi, te1, dte].forEach((el) => el.addEventListener('input', draw));
    slide.querySelectorAll('[data-wp]').forEach((b) => b.addEventListener('click', () => {
      b.blur();
      // 2.30 and 1.15 in the labels stand for the exact cycle and half cycle (1/434 Hz = 2.304 ms)
      const exact = (v) => (Math.abs(v - 2.3) < 0.01 ? PERIOD : Math.abs(v - 1.15) < 0.01 ? PERIOD / 2 : v);
      const [a, d] = b.dataset.wp.split(',').map(Number).map(exact); te1.value = a; dte.value = d; draw();
    }));
    onShow(slide, draw);
  })();

  // ---------------------------------------------------------------- (b) the image
  (function intro() {
    const slide = document.getElementById('fs-intro'); if (!slide) return;
    onShow(slide, () => plot(slide.querySelector('.fs-base'), [gray(toRows((k) => SW[k] + SF[k]), MAX)], imgLayout(300, 430)));
  })();

  // ---------------------------------------------------------------- (c) STIR
  (function stir() {
    const slide = document.getElementById('fs-stir'); if (!slide) return;
    const q = (c) => slide.querySelector(c), ti = q('.st-ti');
    keepSlider(ti);
    let useB1 = false;
    const mz = (t1, t, b1) => Math.abs(1 - (1 - Math.cos(Math.PI * b1)) * Math.exp(-t / t1));
    function draw() {
      const t = Number(ti.value);
      q('.st-ti-read').textContent = `${t} ms`;
      const b = (k) => (useB1 ? B1[k] : 1);
      const img = toRows((k) => (SEG[k] ? PW[k] * mz(T1W[k], t, b(k)) + PF[k] * mz(T1F, t, b(k)) : 0));
      plot(q('.st-img'), [gray(img, 1)], imgLayout(250, 360));
      // fat left, and tissue signal relative to no inversion
      let fl = 0, f0 = 0; for (let k = 0; k < N; k++) if (PF[k] > 0) { fl += PF[k] * mz(T1F, t, b(k)); f0 += PF[k]; }
      const fc = q('.st-fat'); fc.textContent = pct(fl / f0); fc.classList.toggle('ok', fl / f0 < 0.05); fc.classList.toggle('warn', fl / f0 >= 0.05);
      q('.st-wgc').textContent = [T1_WM, T1_GM, T1_CSF].map((x) => pct(mz(x, t, 1))).join(' / ');
      const xs = Array.from({ length: 241 }, (_, i) => i * 5);
      const curve = (t1, name, color) => ({ x: xs, y: xs.map((x) => mz(t1, x, 1)), mode: 'lines', name, line: { color, width: 2.5 } });
      plot(q('.ir-plot'), [curve(T1F, 'fat', '#e0a800'), curve(T1_WM, 'WM', '#1f5f99'), curve(T1_GM, 'GM', '#7a8a9c'), curve(T1_CSF, 'CSF', '#2e8b3a')],
        { width: 330, height: 300, margin: { l: 46, r: 8, t: 10, b: 44 }, paper_bgcolor: '#fff', plot_bgcolor: '#fff', legend: { x: 1, xanchor: 'right', y: 0.02, yanchor: 'bottom', font: { size: 12 } },
          xaxis: { title: { text: 'TI (ms)' }, range: [0, 1200], fixedrange: true, gridcolor: '#eef1f4' }, yaxis: { title: { text: '|signal|' }, range: [0, 1.02], fixedrange: true, gridcolor: '#eef1f4' },
          shapes: [{ type: 'line', x0: t, x1: t, yref: 'paper', y0: 0, y1: 1, line: { color: '#c0392b', width: 2 } }] });
    }
    ti.addEventListener('input', draw);
    segToggle(slide, 'stb1', (v) => { useB1 = v === 'meas'; draw(); });
    onShow(slide, draw);
  })();

  // ---------------------------------------------------------------- (d) and (e): fat saturation
  const BAND = { c: -150, w: 200 };
  const sat = (f) => { const e = 15, d = Math.abs(f - BAND.c) - BAND.w / 2; return 1 / (1 + Math.exp(d / (e / 4))); };   // 1 inside the band
  const lor = (x, x0, a, fw = 25) => (a * (fw / 2) ** 2) / ((x - x0) ** 2 + (fw / 2) ** 2);
  const SX = Array.from({ length: 261 }, (_, i) => -900 + i * 5);
  // the slice's spectrum for a field g: water and fat lines of every column, weighted by its signal
  function spectrum(g) {
    const wcol = new Float64Array(NX), fcol = new Float64Array(NX);
    for (let k = 0; k < N; k++) if (SEG[k]) { wcol[k % NX] += SW[k]; fcol[k % NX] += SF[k]; }
    const ys = SX.map(() => 0);
    for (let c = 0; c < NX; c++) {
      if (!wcol[c] && !fcol[c]) continue;
      const psi = g * ((c - c0) / (c1 - c0) - 0.5);
      SX.forEach((x, i) => { ys[i] += lor(x, psi, wcol[c]) + lor(x, psi + FF, fcol[c]); });
    }
    const m = Math.max(...ys); return ys.map((y) => y / m);
  }
  function satImage(g) {
    let fl = 0, f0 = 0, wl = 0, w0 = 0;
    const img = toRows((k) => {
      if (!SEG[k]) return 0;
      const psi = fieldAt(k, g), w = SW[k] * (1 - sat(psi)), f = SF[k] * (1 - sat(psi + FF));
      fl += f; f0 += SF[k]; wl += w; w0 += SW[k];
      return w + f;
    });
    return { img, fat: fl / f0, water: wl / w0 };
  }
  const specLayout = (w, h) => ({ width: w, height: h, margin: { l: 36, r: 8, t: 8, b: 40 }, showlegend: false, paper_bgcolor: '#fff', plot_bgcolor: '#fff',
    xaxis: { title: { text: 'frequency from water (Hz)' }, range: [-900, 400], fixedrange: true, gridcolor: '#eef1f4' }, yaxis: { visible: false, range: [0, 1.1], fixedrange: true },
    shapes: [{ type: 'rect', x0: BAND.c - BAND.w / 2, x1: BAND.c + BAND.w / 2, yref: 'paper', y0: 0, y1: 1, fillcolor: 'rgba(31,95,153,0.18)', line: { color: '#1f5f99', width: 1 } }],
    annotations: [{ x: 0, y: 1.05, text: 'water', showarrow: false, font: { size: 12, color: '#5b6776' } }, { x: FF, y: 1.05, text: 'fat', showarrow: false, font: { size: 12, color: '#b07800' } }] });
  const specTrace = (ys) => ({ x: SX, y: ys, mode: 'lines', line: { color: INK, width: 2 }, fill: 'tozeroy', fillcolor: 'rgba(29,39,51,0.08)', hoverinfo: 'skip' });

  (function fatsat() {
    const slide = document.getElementById('fs-sat'); if (!slide) return;
    const q = (c) => slide.querySelector(c), cc = q('.sa-c'), ww = q('.sa-w');
    [cc, ww].forEach(keepSlider);
    const SPEC0 = spectrum(0);
    function draw() {
      BAND.c = Number(cc.value); BAND.w = Number(ww.value);
      q('.sa-c-read').textContent = `${BAND.c} Hz`; q('.sa-w-read').textContent = `${BAND.w} Hz`;
      plot(q('.sa-spec'), [specTrace(SPEC0)], specLayout(390, 250));
      const r = satImage(0);
      plot(q('.sa-img'), [gray(r.img, MAX)], imgLayout(250, 360));
      q('.sa-fat').textContent = pct(r.fat); q('.sa-water').textContent = pct(r.water);
      const good = r.fat < 0.05 && r.water > 0.95;
      const g = q('.sa-goal'); g.innerHTML = good ? '<span class="ok">✓ Fat gone, water kept.</span>' : r.water <= 0.95 ? '<span class="warn">The band is eating water.</span>' : 'Fat is still there: move or widen the band.';
    }
    [cc, ww].forEach((el) => el.addEventListener('input', draw));
    onShow(slide, draw);
  })();

  (function shim() {
    const slide = document.getElementById('fs-shim'); if (!slide) return;
    const q = (c) => slide.querySelector(c), gg = q('.sh-g');
    keepSlider(gg);
    function draw() {
      const g = Number(gg.value);
      q('.sh-g-read').textContent = `±${g / 2} Hz`;
      plot(q('.sh-spec'), [specTrace(spectrum(g))], specLayout(390, 250));
      plot(q('.sh-map'), [fieldHeat(toRows((k) => (SEG[k] ? fieldAt(k, g) : null)), 250)], imgLayout(390, 200, { plot_bgcolor: '#e9edf1' }));
      const r = satImage(g);
      plot(q('.sh-img'), [gray(r.img, MAX)], imgLayout(250, 360));
      const f = q('.sh-fat'), w = q('.sh-water');
      f.textContent = pct(r.fat); w.textContent = pct(r.water);
      f.classList.toggle('warn', r.fat > 0.1); w.classList.toggle('warn', r.water < 0.9);
    }
    gg.addEventListener('input', draw);
    // the band may have changed on (d): redraw whenever the slide is shown
    Reveal.on('slidechanged', (e) => { if (e.currentSlide === slide) draw(); });
    onShow(slide, draw);
  })();

  // ---------------------------------------------------------------- (g) and (h): Dixon
  const TE = [PERIOD / 2, PERIOD, 1.5 * PERIOD];   // opposed, in phase, opposed (ms)
  const S = (k, psi, t) => {   // (W + F e^{i2π fF t}) e^{i2π ψ t}
    const pw = 2 * Math.PI * psi * t * 1e-3, pf = 2 * Math.PI * (psi + FF) * t * 1e-3;
    return [SW[k] * Math.cos(pw) + SF[k] * Math.cos(pf), SW[k] * Math.sin(pw) + SF[k] * Math.sin(pf)];
  };
  const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  // water and fat from IP and OP, after removing a field estimate (none for 2-point)
  function separate(g, three) {
    const W = new Float32Array(N), F = new Float32Array(N), B = new Array(N).fill(null);
    let leak = 0, ftot = 0, berr = 0, nb = 0;
    for (let k = 0; k < N; k++) {
      if (!SEG[k]) continue;
      const psi = fieldAt(k, g);
      let op = S(k, psi, TE[0]), ip = S(k, psi, TE[1]);
      if (three) {
        const op2 = S(k, psi, TE[2]);
        const est = Math.atan2(op2[1] * op[0] - op2[0] * op[1], op2[0] * op[0] + op2[1] * op[1]) / (2 * Math.PI * (TE[2] - TE[0]) * 1e-3);
        B[k] = est; berr += (est - psi) ** 2; nb++;
        op = rot(op, -2 * Math.PI * est * TE[0] * 1e-3); ip = rot(ip, -2 * Math.PI * est * TE[1] * 1e-3);
      }
      W[k] = Math.hypot(ip[0] + op[0], ip[1] + op[1]) / 2;
      F[k] = Math.hypot(ip[0] - op[0], ip[1] - op[1]) / 2;
      leak += Math.abs(W[k] - SW[k]); ftot += SF[k];
    }
    return { W, F, B, leak: leak / ftot, berr: nb ? Math.sqrt(berr / nb) : 0 };
  }
  const ZMAX = Math.max(...SF) * 1.05;

  (function dixon2() {
    const slide = document.getElementById('fs-dixon2'); if (!slide) return;
    const q = (c) => slide.querySelector(c), gg = q('.d2-g');
    keepSlider(gg);
    function draw() {
      const g = Number(gg.value), r = separate(g, false);
      q('.d2-g-read').textContent = `±${g / 2} Hz`;
      plot(q('.d2-w'), [gray(toRows((k) => r.W[k]), ZMAX)], imgLayout(250, 360));
      plot(q('.d2-f'), [gray(toRows((k) => r.F[k]), ZMAX)], imgLayout(250, 360));
      const lc = q('.d2-leak'); lc.textContent = pct(r.leak); lc.classList.toggle('warn', r.leak > 0.05); lc.classList.toggle('ok', r.leak <= 0.05);
      q('.d2-ph').textContent = `${Math.round((360 * (g / 2) * (TE[1] - TE[0])) / 1000)}°`;
    }
    gg.addEventListener('input', draw);
    onShow(slide, draw);
  })();

  (function dixon3() {
    const slide = document.getElementById('fs-dixon3'); if (!slide) return;
    const q = (c) => slide.querySelector(c), gg = q('.d3-g');
    keepSlider(gg);
    // three small phasor panels: one scalp voxel (60 % fat) at the highest edge of the field
    const svg = q('.d3-ph'), names = ['Echo 1: opposed, 1.15 ms', 'Echo 2: in phase, 2.30 ms', 'Echo 3: opposed, 3.45 ms'];
    const panels = names.map((nm, n) => {
      const cx = 130 + n * 260, g = svgEl('g', {}, svg);
      svgEl('circle', { cx, cy: 92, r: 62, fill: 'none', stroke: '#d8dee6', 'stroke-width': 1.5 }, g);
      svgEl('text', { x: cx, y: 16, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: INK }, g).textContent = nm;
      return { cx, w: svgEl('line', { x1: cx, y1: 92, stroke: '#1f5f99', 'stroke-width': 5, 'stroke-linecap': 'round' }, g),
        f: svgEl('line', { stroke: '#e0a800', 'stroke-width': 5, 'stroke-linecap': 'round' }, g),
        s: svgEl('line', { x1: cx, y1: 92, stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '5 4' }, g) };
    });
    const note = svgEl('text', { x: 390, y: 166, 'text-anchor': 'middle', 'font-size': 13, fill: '#5b6776' }, svg);
    function draw() {
      const g = Number(gg.value), r = separate(g, true), psi = g / 2, fat = 0.6, R = 60;
      q('.d3-g-read').textContent = `±${g / 2} Hz`;
      panels.forEach((p, n) => {
        const t = TE[n], pw = 2 * Math.PI * psi * t * 1e-3, pf = 2 * Math.PI * (psi + FF) * t * 1e-3;
        const wx = p.cx + R * (1 - fat) * Math.cos(pw), wy = 92 - R * (1 - fat) * Math.sin(pw);
        const fx = wx + R * fat * Math.cos(pf), fy = wy - R * fat * Math.sin(pf);
        p.w.setAttribute('x2', wx); p.w.setAttribute('y2', wy);
        p.f.setAttribute('x1', wx); p.f.setAttribute('y1', wy); p.f.setAttribute('x2', fx); p.f.setAttribute('y2', fy);
        p.s.setAttribute('x2', fx); p.s.setAttribute('y2', fy);
      });
      note.textContent = `one scalp voxel (60 % fat) at +${psi} Hz: echoes 1 and 3 have the same shape, turned by the field (${Math.round(360 * psi * (TE[2] - TE[0]) / 1000)}°)`;
      plot(q('.d3-w'), [gray(toRows((k) => r.W[k]), ZMAX)], imgLayout(230, 330));
      plot(q('.d3-f'), [gray(toRows((k) => r.F[k]), ZMAX)], imgLayout(230, 330));
      plot(q('.d3-b'), [fieldHeat(toRows((k) => r.B[k]), 300)], imgLayout(300, 330, { plot_bgcolor: '#e9edf1' }));
      const lc = q('.d3-leak'); lc.textContent = pct(r.leak); lc.classList.toggle('warn', r.leak > 0.05); lc.classList.toggle('ok', r.leak <= 0.05);
      const bc = q('.d3-berr'); bc.textContent = `${r.berr.toFixed(0)} Hz`; bc.classList.toggle('warn', r.berr > 5); bc.classList.toggle('ok', r.berr <= 5);
    }
    gg.addEventListener('input', draw);
    onShow(slide, draw);
  })();
})();
