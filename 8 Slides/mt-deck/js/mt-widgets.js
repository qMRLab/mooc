/* The MT lecture deck's live figures. Each registers with MTDeck.widget(slideId, init) and is built the first time its
 * slide is current or next to it. Physics: js/mt-sim.js (two-pool Bloch-McConnell, MT-SPGR); data: js/data/brain.js
 * (the chapter's 3 T qMT slice, through MT.brain); look and controls: js/mt-common.js. */
(function () {
  'use strict';
  const { S, C, TISSUE_COLORS, PROTOCOL_COLORS, VIRIDIS, BWR, GRAY, plot, seg, slider, throttle, fmt, brain, brainHeat, brainAxes } = window.MT;
  const W = window.MTDeck.widget;
  const $ = (id) => document.getElementById(id);
  const DEG = Math.PI / 180;
  const SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, parent, text) {
    const el = document.createElementNS(SVGNS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
    if (text != null) el.textContent = text;
    if (parent) parent.appendChild(el);
    return el;
  }
  const logspace = (a, b, n) => Array.from({ length: n }, (_, i) => 10 ** (Math.log10(a) + ((Math.log10(b) - Math.log10(a)) * i) / (n - 1)));
  const linspace = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
  const KS = S.MTSAT_PROTOCOLS.karakuzuSiemens;
  // Healthy WM as in the chapter's Appendix C simulations (T1 = 1 s), and the Table 6.3 tissues.
  const WM1 = { ...S.TISSUES.wm, R1f: 1 };
  const hzTicks = { tickvals: [100, 300, 1000, 3000, 10000, 30000, 100000], ticktext: ['100 Hz', '300 Hz', '1 kHz', '3 kHz', '10 kHz', '30 kHz', '100 kHz'] };

  // ------------------------------------------------------------------ 2 · two kinds of protons (F map)
  W('s-onoff', (section) => {
    if (!brain) return;
    const B = brain.B, K = brain.idx(1, 1);   // 1088 Hz, 426°
    // the mask's one-voxel rim is left out: partial volume makes it darker in MT off and brighter in the ratio
    // (and so are the few non-brain voxels at the edge with almost no MT-off signal)
    const off = (y, x) => (B.S0 ? B.S0[y][x] : 1), ratio = (y, x) => B.mt[K][y][x];
    const inner = (y, x) => off(y, x) > 0.35 && [[0, 1], [0, -1], [1, 0], [-1, 0]].every(([dy, dx]) => brain.inMask(y + dy, x + dx));
    const grid = (f) => brain.grid((y, x) => (inner(y, x) ? f(y, x) : null));
    // the same margins on every view (room for the ratio's colour bar), so the brain keeps its size when the right panel switches
    const lay = brainAxes({ margin: { l: 2, r: 52, t: 2, b: 2, autoexpand: false } });
    const grey = { colorscale: GRAY, zmin: 0, zmax: 1, showscale: false };
    if (B.S0) plot($('oo-off'), [brainHeat(grid(off), { ...grey, hovertemplate: 'MT off: %{z:.2f}<extra></extra>' })], lay);
    const right = (v) => {
      if (v === 'ratio' || !B.S0) {
        plot($('oo-on'), [brainHeat(grid(ratio), { zmin: 0.25, zmax: 1, colorbar: { thickness: 12, len: 0.7, outlinewidth: 0, tickfont: { size: 12 } }, hovertemplate: 'MT on ÷ MT off: %{z:.2f}<extra></extra>' })], lay);
      } else {
        plot($('oo-on'), [brainHeat(grid((y, x) => off(y, x) * ratio(y, x)), { ...grey, hovertemplate: 'MT on: %{z:.2f}<extra></extra>' })], lay);
      }
    };
    seg(section, 'oo-right', right);
    right('on');
    const pct = (f) => `${Math.round(100 * brain.median(brain.voxels.filter(([y, x]) => f(y, x)).map(([y, x]) => ratio(y, x))))} %`;
    $('oo-wm').textContent = pct(brain.wmLike);
    $('oo-gm').textContent = pct(brain.gmLike);
  });

  // ------------------------------------------------------------------ the two-pool tanks (Bloch-McConnell slide)
  // Two tanks of Mz (water, macromolecules) during 4 s of off-resonance RF and after it, with a play button and a time
  // slider; cases: two pools, no exchange (kf = 0), water only (F = 0). Used by the Bloch-McConnell slide (tanks only; the
  // optional Mz plot below them is not used at the moment). ids: { tanks, play, time, plot (optional), seg, start }.
  function exchangeTanks(section, ids) {
    const ON = 4, OFF = 4, N = 200;
    const w1 = 2 * Math.PI * 100, offset = 2000;
    const cases = {
      both: WM1,
      nokf: { ...WM1, kf: 0 },
      noF: { ...WM1, F: 0 },
    };
    const runs = {};
    for (const [k, t] of Object.entries(cases)) runs[k] = S.cwEvolution(t, { w1, offset, on: ON, off: OFF, n: N });
    let which = ids.start || 'both', i = 0, timer = null;

    // tanks
    const host = $(ids.tanks);
    const s = svg('svg', { viewBox: '0 0 820 260', width: '100%', height: '260' }, host);
    const tank = (x, w, color, label, sub) => {
      const g = svg('g', {}, s);
      svg('rect', { x, y: 40, width: w, height: 180, rx: 8, fill: '#fff', stroke: C.rule, 'stroke-width': 2 }, g);
      const fill = svg('rect', { x: x + 3, y: 43, width: w - 6, height: 174, rx: 6, fill: color, opacity: 0.85 }, g);
      svg('text', { x: x + w / 2, y: 28, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, fill: color }, g, label);
      const val = svg('text', { x: x + w / 2, y: 248, 'text-anchor': 'middle', 'font-size': 17, fill: C.ink }, g, sub);
      return { fill, val, g };
    };
    const water = tank(70, 300, C.free, 'Water (free pool)', '');
    const macro = tank(560, 110, C.restr, 'Macromolecules', '');
    const exArrow = svg('g', {}, s);
    const exR = svg('path', { d: 'M 395 120 L 535 120', stroke: C.ex, 'stroke-width': 6, fill: 'none', 'marker-end': `url(#${ids.tanks}-head)` }, exArrow);
    const exL = svg('path', { d: 'M 535 160 L 395 160', stroke: C.ex, 'stroke-width': 6, fill: 'none', 'marker-end': `url(#${ids.tanks}-head)` }, exArrow);
    const defs = svg('defs', {}, s);
    const m = svg('marker', { id: `${ids.tanks}-head`, viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto-start-reverse' }, defs);
    svg('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: C.ex }, m);
    svg('text', { x: 465, y: 98, 'text-anchor': 'middle', 'font-size': 16, fill: C.ex }, exArrow, 'k_f · Mz,f');
    svg('text', { x: 465, y: 196, 'text-anchor': 'middle', 'font-size': 16, fill: C.ex }, exArrow, 'k_r · Mz,r');
    const rf = svg('g', {}, s);
    svg('path', { d: 'M 735 40 l -16 26 l 14 0 l -16 30', stroke: C.restr, 'stroke-width': 4, fill: 'none' }, rf);
    svg('text', { x: 742, y: 50, 'font-size': 17, 'font-weight': 700, fill: C.restr }, rf, 'RF');
    const noMacro = svg('text', { x: 615, y: 135, 'text-anchor': 'middle', 'font-size': 17, fill: C.muted }, s, '(none)');

    const el = ids.plot ? $(ids.plot) : null;
    const time = slider(ids.time, (v) => `${((v / N) * (ON + OFF)).toFixed(1)} s`, (v) => { i = v; render(); });
    function render() {
      const r = runs[which], t = cases[which];
      const fw = r.mzf[i], fr = t.F > 0 ? r.mzr[i] / t.F : 0;
      const setFill = (tk, frac) => {
        const h = 174 * Math.max(0, Math.min(1, frac));
        tk.fill.setAttribute('y', 43 + 174 - h);
        tk.fill.setAttribute('height', h);
      };
      setFill(water, fw);
      setFill(macro, fr);
      water.val.textContent = `Mz = ${(100 * fw).toFixed(0)} % of equilibrium`;
      macro.val.textContent = t.F > 0 ? `${(100 * fr).toFixed(0)} %` : '';
      macro.g.style.opacity = t.F > 0 ? 1 : 0.25;
      noMacro.style.display = t.F > 0 ? 'none' : '';
      const on = r.t[i] < ON;
      rf.style.opacity = on && t.F >= 0 ? 1 : 0.12;
      const kf = t.F > 0 ? t.kf : 0, kr = t.F > 0 ? kf / t.F : 0;
      const net = kf * r.mzf[i] - kr * r.mzr[i];   // > 0: water loses to macromolecules
      const wR = Math.min(14, 2 + 60 * Math.max(0, net));
      const wL = Math.min(14, 2 + 60 * Math.max(0, -net));
      exR.setAttribute('stroke-width', wR); exL.setAttribute('stroke-width', wL);
      exArrow.style.opacity = kf > 0 ? 1 : 0.15;
      time.set(i);
      if (!el) return;
      plot(el, [
        { x: r.t, y: r.mzf.map((v) => 100 * v), mode: 'lines', line: { color: C.free, width: 3 }, hovertemplate: 'water %{y:.0f} %<extra></extra>' },
        ...(t.F > 0 ? [{ x: r.t, y: r.mzr.map((v) => (100 * v) / t.F), mode: 'lines', line: { color: C.restr, width: 3 }, hovertemplate: 'macromolecules %{y:.0f} %<extra></extra>' }] : []),
      ], {
        xaxis: { title: { text: 'time (s)' }, range: [0, ON + OFF] },
        yaxis: { title: { text: 'Mz (% of eq.)' }, range: [0, 105] },
        margin: { l: 70, r: 20, t: 10, b: 52 },
        shapes: [
          { type: 'rect', x0: 0, x1: ON, yref: 'paper', y0: 0, y1: 1, fillcolor: C.restr, opacity: 0.07, line: { width: 0 } },
          { type: 'line', x0: r.t[i], x1: r.t[i], yref: 'paper', y0: 0, y1: 1, line: { color: C.ink, width: 1.5, dash: 'dot' } },
        ],
        annotations: [{ x: ON / 2, y: 1, yref: 'paper', yanchor: 'top', text: 'RF on', showarrow: false, font: { color: C.restr } }],
      });
    }
    const play = $(ids.play);
    const stop = () => { clearInterval(timer); timer = null; play.textContent = '▶ Play'; };
    play.addEventListener('click', () => {
      play.blur();
      if (timer) { stop(); return; }
      if (i >= N) i = 0;
      play.textContent = '❚❚ Pause';
      timer = setInterval(() => { i += 1; if (i >= N) { i = N; stop(); } render(); }, 35);
    });
    seg(section, ids.seg, (v) => { which = v; render(); if (ids.onCase) ids.onCase(v); });
    i = 0; render();
    if (ids.onCase) ids.onCase(which);
    return { hide: stop };
  }

  // ------------------------------------------------------------------ 5 · MT everywhere: VFA T1 in WM
  W('s-everywhere', () => {
    const t = WM1;
    const p = KS;
    const trueT1 = 1 / S.r1Observed(t);
    const one = S.helms({ sMT: 1, sPD: S.spgr(trueT1, p.pdw.flipAngle, p.pdw.tr), sT1: S.spgr(trueT1, p.t1w.flipAngle, p.t1w.tr), aMT: 6, aPD: p.pdw.flipAngle, aT1: p.t1w.flipAngle, trMT: 0.032, trPD: p.pdw.tr, trT1: p.t1w.tr }).T1;
    const two = S.mtsatExperiment(t, p).T1;
    $('every-true').textContent = `${trueT1.toFixed(2)} s`;
    $('every-one').textContent = `${one.toFixed(2)} s`;
    $('every-two').textContent = `${two.toFixed(2)} s`;
  });

  // ------------------------------------------------------------------ 7 · the MT-SPGR sequence, to scale
  function drawSequence(host, { mtOn = true, slim = false, helms = false } = {}) {
    host.replaceChildren();
    const Wd = 840, H = slim ? 150 : 420;
    const s = svg('svg', { viewBox: `0 0 ${Wd} ${H}`, width: '100%', height: H }, host);
    const TR = 32, x0 = 60, x1 = Wd - 30;
    const X = (ms) => x0 + ((x1 - x0) * ms) / TR;
    const rfY = slim ? 80 : 130, gY = slim ? 0 : 255, adcY = slim ? 0 : 335;
    const label = (x, y, text, opts = {}) => svg('text', Object.assign({ x, y, 'font-size': 16, fill: C.ink }, opts), s, text);
    if (!slim) {
      label(10, rfY + 5, 'RF', { 'font-weight': 700 });
      label(10, gY + 5, 'G', { 'font-weight': 700 });
      label(10, adcY + 5, 'ADC', { 'font-weight': 700 });
      [rfY, gY, adcY].forEach((y) => svg('line', { x1: x0, x2: x1, y1: y, y2: y, stroke: C.rule, 'stroke-width': 1.5 }, s));
    } else {
      svg('line', { x1: x0, x2: x1, y1: rfY, y2: rfY, stroke: C.rule, 'stroke-width': 1.5 }, s);
    }
    // MT pulse: 10 ms Gaussian envelope × cos(2π · 1.2 kHz · t), starting at 0.5 ms
    const t0 = 0.5, dur = 10, f = 1.2, amp = slim ? 55 : 95;
    if (helms) {
      // Helms: an instantaneous α2 in place of the pulse
      const xa = X(t0 + dur / 2);
      svg('line', { x1: xa, x2: xa, y1: rfY, y2: rfY - amp * 0.8, stroke: C.restr, 'stroke-width': 4, 'marker-end': 'url(#ah)' }, s);
      const d = svg('defs', {}, s); const mk = svg('marker', { id: 'ah', viewBox: '0 0 10 10', refX: 5, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, d); svg('path', { d: 'M0 0 L10 5 L0 10 z', fill: C.restr }, mk);
      label(xa + 8, rfY - amp * 0.75, 'α₂ (instant)', { fill: C.restr, 'font-weight': 700 });
    } else if (mtOn) {
      let d = '';
      const sigma = 2.3548 / (2 * Math.PI * 0.2) ; // ms, 200 Hz FWHM
      for (let k = 0; k <= 600; k++) {
        const t = t0 + (dur * k) / 600;
        const env = Math.exp(-0.5 * ((t - t0 - dur / 2) / sigma) ** 2);
        const y = rfY - amp * env * Math.cos(2 * Math.PI * f * (t - t0 - dur / 2));
        d += `${k ? 'L' : 'M'} ${X(t).toFixed(1)} ${y.toFixed(1)} `;
      }
      svg('path', { d, stroke: C.restr, 'stroke-width': 2, fill: 'none' }, s);
      if (!slim) label(X(t0 + dur / 2), rfY - amp - 14, 'MT pulse · 10 ms · 1.2 kHz off · 540°', { 'text-anchor': 'middle', fill: C.restr, 'font-weight': 700 });
    } else {
      svg('line', { x1: X(t0), x2: X(t0 + dur), y1: rfY, y2: rfY, stroke: C.restr, 'stroke-width': 2, 'stroke-dasharray': '6 5' }, s);
      label(X(t0 + dur / 2), rfY - 18, 'no MT pulse (same timing)', { 'text-anchor': 'middle', fill: C.muted });
    }
    // excitation: small sinc at 13.5 ms
    const te = 13.5;
    let d = '';
    for (let k = 0; k <= 120; k++) {
      const u = -3 + (6 * k) / 120, sinc = u === 0 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u);
      d += `${k ? 'L' : 'M'} ${X(te + u * 0.25).toFixed(1)} ${(rfY - (slim ? 30 : 42) * sinc).toFixed(1)} `;
    }
    svg('path', { d, stroke: C.free, 'stroke-width': 2.5, fill: 'none' }, s);
    label(X(te), rfY - (slim ? 40 : 56), helms ? 'α₁' : '6° excitation', { 'text-anchor': 'middle', fill: C.free, 'font-weight': 700 });
    if (!slim) {
      // spoilers and readout
      const trap = (a, b, h, text) => {
        const r = 0.5;
        svg('path', { d: `M ${X(a)} ${gY} L ${X(a + r)} ${gY - h} L ${X(b - r)} ${gY - h} L ${X(b)} ${gY} Z`, fill: '#dfe5ec', stroke: C.muted, 'stroke-width': 1.5 }, s);
        label((X(a) + X(b)) / 2, gY - h - 8, text, { 'text-anchor': 'middle', 'font-size': 14, fill: C.muted });
      };
      trap(10.8, 12.9, 46, 'spoiler');
      trap(22.5, 31, 46, 'spoiler');
      svg('rect', { x: X(16), y: adcY - 26, width: X(21.5) - X(16), height: 26, fill: '#e7f0f9', stroke: C.free, 'stroke-width': 1.5 }, s);
      label((X(16) + X(21.5)) / 2, adcY - 8, 'readout', { 'text-anchor': 'middle', 'font-size': 14, fill: C.free });
      // TR arrow and time axis
      const ay = H - 30;
      svg('line', { x1: X(0), x2: X(TR), y1: ay, y2: ay, stroke: C.ink, 'stroke-width': 1.5 }, s);
      [0, 8, 16, 24, 32].forEach((ms) => {
        svg('line', { x1: X(ms), x2: X(ms), y1: ay - 5, y2: ay + 5, stroke: C.ink }, s);
        label(X(ms), ay + 22, `${ms} ms`, { 'text-anchor': 'middle', 'font-size': 13, fill: C.muted });
      });
      label(X(TR / 2), ay - 10, 'TR = 32 ms, then repeat', { 'text-anchor': 'middle', 'font-size': 15 });
    }
    return { X, s };
  }
  W('s-seq', (section) => {
    const host = $('seq-svg');
    seg(section, 'mt', (v) => drawSequence(host, { mtOn: v === 'on' }));
    drawSequence(host, { mtOn: true });
  });

  // ------------------------------------------------------------------ MTR, the first method: the dataset's MTR map
  W('s-mtrintro', () => {
    if (!brain) return;
    const B = brain.B, K = brain.idx(1, 1);   // 1088 Hz, 426°
    const mtr = (y, x) => 100 * (1 - B.mt[K][y][x]);
    // the mask's one-voxel rim and the near-empty edge voxels are left out, as on "MT off vs MT on"
    const inner = (y, x) => (!B.S0 || B.S0[y][x] > 0.35) && [[0, 1], [0, -1], [1, 0], [-1, 0]].every(([dy, dx]) => brain.inMask(y + dy, x + dx));
    plot($('mi-map'), [brainHeat(brain.grid((y, x) => (inner(y, x) ? mtr(y, x) : null)), {
      zmin: 30, zmax: 65, colorbar: { title: { text: 'MTR (%)', side: 'top', font: { size: 14 } }, thickness: 14, len: 0.8, outlinewidth: 0, tickfont: { size: 13 } },
      hovertemplate: 'MTR = %{z:.1f} %<extra></extra>',
    })], brainAxes({ margin: { l: 2, r: 70, t: 2, b: 2 } }));
    const med = (f) => `${Math.round(brain.median(brain.voxels.filter(([y, x]) => f(y, x)).map(([y, x]) => mtr(y, x))))} %`;
    $('mi-wm').textContent = med(brain.wmLike);
    $('mi-gm').textContent = med(brain.gmLike);
  });

  // ------------------------------------------------------------------ 9 · the Z-spectrum, live
  W('s-zspec', (section) => {
    const el = $('z-plot');
    const xs = logspace(250, 40000, 22);
    const angles = [142, 426];
    const seq = (offset, angle) => ({ tr: 0.025, flipAngle: 7, mt: { shape: 'gausshann', duration: 0.01024, angle, offset } });
    const draw = throttle(() => {
      const t = { F: zF.get(), kf: zkf.get(), R1f: 1, R1r: 1, T2f: zt2f.get() / 1000, T2r: zt2r.get() * 1e-6 };
      const water = { ...t, F: 0 };
      const traces = [];
      angles.forEach((a, k) => {
        const col = k ? C.a426 : C.a142;
        traces.push({ x: xs, y: xs.map((o) => S.normalizedSignal(water, seq(o, a), { steps: 40 })), mode: 'lines', line: { color: col, width: 2, dash: 'dash' }, hovertemplate: `water alone, ${a}°: %{y:.3f}<extra></extra>` });
        traces.push({ x: xs, y: xs.map((o) => S.normalizedSignal(t, seq(o, a), { steps: 40 })), mode: 'lines', line: { color: col, width: 3.5, shape: 'spline' }, hovertemplate: `${a}°: %{y:.3f}<extra></extra>` });
        traces.push({ x: S.QMT_OFFSETS, y: S.QMT_OFFSETS.map((o) => S.normalizedSignal(t, seq(o, a), { steps: 40 })), mode: 'markers', marker: { color: '#fff', size: 10, line: { color: col, width: 2.5 } }, hoverinfo: 'skip' });
      });
      plot(el, traces, {
        xaxis: { type: 'log', title: { text: 'MT pulse offset' }, range: [Math.log10(250), Math.log10(40000)], tickvals: [300, 1000, 3000, 10000, 30000], ticktext: ['300 Hz', '1 kHz', '3 kHz', '10 kHz', '30 kHz'] },
        yaxis: { title: { text: 'S<sub>MT</sub> / S<sub>0</sub>' }, range: [0, 1.04] },
        annotations: [
          { x: Math.log10(18000), y: 0.12, text: '<b>142°</b>', showarrow: false, font: { color: C.a142, size: 17 } },
          { x: Math.log10(18000), y: 0.05, text: '<b>426°</b>', showarrow: false, font: { color: C.a426, size: 17 } },
          { x: Math.log10(18000), y: 0.19, text: 'MT pulse', showarrow: false, font: { color: C.muted, size: 14 } },
        ],
        margin: { l: 70, r: 20, t: 16, b: 60 },
      });
    });
    const zF = slider('z-F', (v) => `${(100 * v).toFixed(1)} %`, draw);
    const zkf = slider('z-kf', (v) => `${v.toFixed(1)} s⁻¹`, draw);
    const zt2r = slider('z-t2r', (v) => `${v.toFixed(1)} µs`, draw);
    const zt2f = slider('z-t2f', (v) => `${v.toFixed(0)} ms`, draw);
    const setT = (t) => { zF.set(t.F); zkf.set(t.kf); zt2r.set(t.T2r * 1e6); zt2f.set(t.T2f * 1000); draw(); };
    $('z-reset').addEventListener('click', (e) => { e.target.blur(); setT(S.TISSUES.wm); });
    $('z-gm').addEventListener('click', (e) => { e.target.blur(); setT(S.TISSUES.gm); });
    draw();
  });

  // ------------------------------------------------------------------ 10 · real Z-spectra
  W('s-realz', (section) => {
    if (!brain) return;
    const B = brain.B;
    const elMap = $('realz-map'), elPlot = $('realz-plot');
    let sel = brain.preset('wm');
    const xs = logspace(300, 25000, 18);
    function drawMap() {
      plot(elMap, [
        brainHeat(brain.grid((y, x) => 100 * B.F[y][x]), { zmin: 0, zmax: 30, showscale: false, hovertemplate: 'F = %{z:.1f} %<extra></extra>' }),
        { type: 'scatter', x: [sel[1]], y: [sel[0]], mode: 'markers', marker: { symbol: 'circle-open', size: 16, color: '#ff2d55', line: { width: 3 } }, hoverinfo: 'skip' },
      ], brainAxes());
    }
    function drawPlot() {
      const [y, x] = sel;
      const t = brain.tissue(y, x);
      const traces = [];
      [142, 426].forEach((a, ai) => {
        const col = ai ? C.a426 : C.a142;
        traces.push({ x: xs, y: xs.map((o) => brain.model(y, x, o, a, t)), mode: 'lines', line: { color: col, width: 3 }, hovertemplate: `model ${a}°: %{y:.3f}<extra></extra>` });
        traces.push({ x: S.QMT_OFFSETS, y: S.QMT_OFFSETS.map((o, oi) => B.mt[brain.idx(oi, ai)][y][x]), mode: 'markers', marker: { color: col, size: 13, line: { color: '#fff', width: 2 } }, hovertemplate: `measured ${a}°: %{y:.3f}<extra></extra>` });
      });
      plot(elPlot, traces, {
        xaxis: { type: 'log', title: { text: 'MT pulse offset' }, range: [Math.log10(300), Math.log10(25000)], tickvals: [300, 1000, 3000, 10000], ticktext: ['300 Hz', '1 kHz', '3 kHz', '10 kHz'] },
        yaxis: { title: { text: 'S<sub>MT</sub> / S<sub>0</sub>' }, range: [0, 1.04] },
        annotations: [
          { x: Math.log10(14000), y: 0.12, text: '<b>142°</b>', showarrow: false, font: { color: C.a142, size: 17 } },
          { x: Math.log10(14000), y: 0.05, text: '<b>426°</b>', showarrow: false, font: { color: C.a426, size: 17 } },
        ],
        margin: { l: 70, r: 20, t: 16, b: 60 },
      });
      $('realz-table').innerHTML = [
        ['F', `${(100 * B.F[y][x]).toFixed(1)} %`], ['k<sub>f</sub>', `${B.kf[y][x].toFixed(2)} s⁻¹`],
        ['T<sub>2,f</sub>', `${B.T2f[y][x].toFixed(1)} ms`], ['T<sub>2,r</sub>', `${B.T2r[y][x].toFixed(1)} µs`],
        ['T<sub>1</sub>', `${(1 / B.R1[y][x]).toFixed(2)} s`], ['B<sub>1</sub>', B.B1[y][x].toFixed(2)],
      ].map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('');
    }
    drawMap(); drawPlot();
    elMap.on('plotly_click', (ev) => {
      const p = ev.points && ev.points[0];
      if (!p) return;
      const y = Math.round(p.y), x = Math.round(p.x);
      if (!brain.inMask(y, x)) return;
      sel = [y, x]; drawMap(); drawPlot();
    });
    section.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => { b.blur(); sel = brain.preset(b.dataset.preset); drawMap(); drawPlot(); }));
  });

  // ------------------------------------------------------------------ Bloch-McConnell: the equations, with the two-pool tanks
  // Picking a case greys out the terms it removes: no exchange, the exchange terms (green); water only, those and the
  // whole restricted-pool equation (4th line). Terms are found by their KaTeX colour.
  W('s-bm', (section) => {
    const EXCH = /rgb\(43,\s*138,\s*62\)|#2b8a3e/i;   // the exchange colour, as the browser writes KaTeX's inline style
    const grey = (v) => {
      const eqs = [...section.querySelectorAll('.bm-eqs .katex-display')];
      section.querySelectorAll('.bm-eqs .bm-off').forEach((e) => e.classList.remove('bm-off'));
      if (v === 'both' || eqs.length < 4) return;
      section.querySelectorAll('.bm-eqs [style]').forEach((e) => { if (EXCH.test(e.getAttribute('style'))) e.classList.add('bm-off'); });
      if (v === 'noF') eqs[3].classList.add('bm-off');
    };
    return exchangeTanks(section, { tanks: 'bm-tanks', play: 'bm-play', time: 'bm-time', seg: 'bm-case', start: 'both', onCase: grey });
  });

  // ------------------------------------------------------------------ 12 · fit errors from wrong input maps
  W('s-fit', (section) => {
    const E = window.MTFitErrors, el = $('fit-plot');
    if (!E) return;
    const COLS = { F: C.restr, kf: C.ex, T2f: C.free, T2r: C.t1 };
    const NAMES = { F: 'F', kf: 'k<sub>f</sub>', T2f: 'T<sub>2,f</sub>', T2r: 'T<sub>2,r</sub>' };
    const AX = { B1: 'B<sub>1</sub> map used (true B<sub>1</sub> = 1)', T1: 'T<sub>1</sub> map used ÷ true T<sub>1</sub>', B0: 'B<sub>0</sub> map used − true B<sub>0</sub> (Hz)' };
    const draw = (k) => {
      const c = E.cases[k];
      const traces = Object.keys(COLS).map((p) => ({ x: c.x, y: c.err[p], mode: 'lines+markers', name: NAMES[p], line: { color: COLS[p], width: p === 'F' ? 4 : 2.5 }, marker: { size: p === 'F' ? 8 : 6 }, hovertemplate: `${NAMES[p]}: %{y:+.0f} %<extra></extra>` }));
      const last = c.x.length - 1;
      plot(el, traces, {
        xaxis: { title: { text: AX[k] } }, yaxis: { title: { text: 'error in the fitted value (%)' }, range: [-60, 120], zeroline: true, zerolinecolor: '#9aa5b1' },
        margin: { l: 70, r: 70, t: 16, b: 60 },
        annotations: Object.keys(COLS).map((p) => ({ x: c.x[last], y: Math.max(-58, Math.min(118, c.err[p][last])), text: `<b>${NAMES[p]}</b>`, showarrow: false, xanchor: 'left', xshift: 8, font: { color: COLS[p], size: 16 } })),
        shapes: [{ type: 'line', x0: k === 'B0' ? 0 : 1, x1: k === 'B0' ? 0 : 1, yref: 'paper', y0: 0, y1: 1, line: { color: C.muted, width: 1, dash: 'dot' } }],
      });
    };
    seg(section, 'map', draw);
    draw('B1');
  });

  // ------------------------------------------------------------------ 13 · qMT maps
  W('s-maps', (section) => {
    if (!brain) return;
    const B = brain.B, el = $('maps-plot');
    const MAPS = {
      F: { f: (y, x) => 100 * B.F[y][x], z: [0, 30], unit: '%', title: 'F (%)', d: 1, text: '<b>Pool size ratio F</b>: macromolecular protons per water proton. Highest in white matter (myelin).' },
      kf: { f: (y, x) => B.kf[y][x], z: [0, 4], unit: 's⁻¹', title: 'k<sub>f</sub> (s⁻¹)', d: 2, text: '<b>Exchange rate k<sub>f</sub></b> (free → restricted). Noisier: harder to pin down than F.' },
      T2f: { f: (y, x) => B.T2f[y][x], z: [10, 60], unit: 'ms', title: 'T<sub>2,f</sub> (ms)', d: 1, text: '<b>Water T<sub>2,f</sub></b>, from the Z-spectrum near resonance (direct saturation).' },
      T2r: { f: (y, x) => B.T2r[y][x], z: [6, 18], unit: 'µs', title: 'T<sub>2,r</sub> (µs)', d: 1, text: '<b>Macromolecular T<sub>2,r</sub></b>: about 12 µs everywhere in tissue: the width of its line.' },
      B0: { f: (y, x) => B.B0[y][x], z: [-40, 40], unit: 'Hz', title: 'B<sub>0</sub> (Hz)', d: 0, scale: BWR, text: '<b>Input: B<sub>0</sub> map</b>. Shifts every MT offset by up to ±30 Hz here.' },
      B1: { f: (y, x) => B.B1[y][x], z: [0.7, 1.3], unit: '', title: 'B<sub>1</sub>', d: 2, scale: BWR, text: '<b>Input: B<sub>1</sub> map</b> (relative). Scales both RF pulses: ~0.8 to 1.1 across this slice.' },
      T1: { f: (y, x) => 1 / B.R1[y][x], z: [0.5, 3], unit: 's', title: 'T<sub>1</sub> (s)', d: 2, text: '<b>Input: measured T<sub>1</sub></b> (inversion recovery). Gives R<sub>1,f</sub> through Eq. 6.6.' },
    };
    const draw = (k) => {
      const m = MAPS[k];
      plot(el, [brainHeat(brain.grid(m.f), { colorscale: m.scale || VIRIDIS, zmin: m.z[0], zmax: m.z[1], colorbar: { title: { text: m.title, side: 'right' }, thickness: 16, len: 0.85 }, hovertemplate: `%{z:.${m.d}f} ${m.unit}<extra></extra>` })], brainAxes({ margin: { l: 4, r: 90, t: 4, b: 4 } }));
      const wm = brain.median(brain.voxels.filter(([y, x]) => brain.wmLike(y, x)).map(([y, x]) => m.f(y, x)));
      const gm = brain.median(brain.voxels.filter(([y, x]) => brain.gmLike(y, x)).map(([y, x]) => m.f(y, x)));
      $('maps-text').innerHTML = `<p>${m.text}</p><table class="params big"><tr><th>White matter</th><td>${wm.toFixed(m.d)} ${m.unit}</td></tr><tr><th>Grey matter</th><td>${gm.toFixed(m.d)} ${m.unit}</td></tr></table><p class="fig-hint">Medians over voxels with F &gt; 18 % (WM) and 5–10 % (GM). Hover to read a voxel.</p>`;
    };
    seg(section, 'map', draw);
    draw('F');
  });

  // ------------------------------------------------------------------ 14 · MTR on real data
  W('s-mtr', (section) => {
    if (!brain) return;
    const B = brain.B, el = $('mtr-plot');
    let ai = 1, oi = 2;
    const hasS0 = !!B.S0;
    const draw = () => {
      const k = brain.idx(oi, ai);
      const n = (y, x) => B.mt[k][y][x];
      const s0 = (y, x) => (hasS0 ? B.S0[y][x] : 1);
      const traces = [
        brainHeat(brain.grid(s0), { colorscale: GRAY, zmin: 0, zmax: 1, showscale: false, xaxis: 'x', yaxis: 'y', hovertemplate: 'S0 %{z:.2f}<extra></extra>' }),
        brainHeat(brain.grid((y, x) => s0(y, x) * n(y, x)), { colorscale: GRAY, zmin: 0, zmax: 1, showscale: false, xaxis: 'x2', yaxis: 'y2', hovertemplate: 'S_MT %{z:.2f}<extra></extra>' }),
        brainHeat(brain.grid((y, x) => 100 * (1 - n(y, x))), { zmin: 0, zmax: 70, xaxis: 'x3', yaxis: 'y3', colorbar: { title: { text: 'MTR (%)', side: 'right' }, x: 1.0, thickness: 14, len: 0.9 }, hovertemplate: 'MTR %{z:.1f} %<extra></extra>' }),
      ];
      const ax = (dom, a) => ({ domain: dom, visible: false, fixedrange: true, ...(a ? { anchor: a } : {}) });
      const ay = (a) => ({ visible: false, autorange: 'reversed', scaleanchor: a, scaleratio: 1, fixedrange: true });
      plot(el, traces, {
        xaxis: ax([0, 0.3]), yaxis: ay('x'), xaxis2: ax([0.33, 0.63], 'y2'), yaxis2: { ...ay('x2'), anchor: 'x2' }, xaxis3: ax([0.66, 0.95], 'y3'), yaxis3: { ...ay('x3'), anchor: 'x3' },
        margin: { l: 4, r: 70, t: 34, b: 4 }, plot_bgcolor: 'rgba(0,0,0,0)',
        annotations: [
          { xref: 'paper', yref: 'paper', x: 0.15, y: 1.06, text: '<b>S<sub>0</sub></b> · MT off', showarrow: false, font: { size: 17 } },
          { xref: 'paper', yref: 'paper', x: 0.48, y: 1.06, text: `<b>S<sub>MT</sub></b> · ${S.QMT_ANGLES[ai]}° at ${fmt.hz(S.QMT_OFFSETS[oi])}`, showarrow: false, font: { size: 17 } },
          { xref: 'paper', yref: 'paper', x: 0.805, y: 1.06, text: '<b>MTR</b>', showarrow: false, font: { size: 17, color: C.mtr } },
        ],
      });
      const wm = brain.median(brain.voxels.filter(([y, x]) => brain.wmLike(y, x)).map(([y, x]) => 100 * (1 - n(y, x))));
      const gm = brain.median(brain.voxels.filter(([y, x]) => brain.gmLike(y, x)).map(([y, x]) => 100 * (1 - n(y, x))));
      $('mtr-stats').innerHTML = `MTR in white matter <b>${wm.toFixed(0)} %</b> · grey matter <b>${gm.toFixed(0)} %</b> · same brain, same session; only the MT pulse changed.`;
    };
    seg(section, 'angle', (v) => { ai = Number(v); draw(); });
    seg(section, 'offset', (v) => { oi = Number(v); draw(); });
    draw();
  });

  // ------------------------------------------------------------------ 15 · same tissue, different scanner
  W('s-scanners', () => {
    const el = $('sc-plot');
    const tk = ['gm', 'wm', 'nawm', 'early', 'late'];
    const pk = ['brownSiemens', 'brownPhilips', 'karakuzuGE', 'karakuzuSiemens'];
    const vals = pk.map((p) => tk.map((t) => S.mtr(S.TISSUES[t], S.MTR_PROTOCOLS[p])));
    let level = null;
    const shapeOf = (P) => ({ gaussian: 'Gauss', sincgauss: 'Sinc-Gauss', fermi: 'Fermi' }[P.mt.shape]);
    $('sc-table').innerHTML = pk.map((p, i) => {
      const P = S.MTR_PROTOCOLS[p];
      return `<li><b><i style="background:${PROTOCOL_COLORS[i]}"></i>${P.name.replace(' · ', ' ')}</b><span>${shapeOf(P)} ${(P.mt.duration * 1000).toFixed(1).replace('.0', '')} ms, ${P.mt.angle}°, ${(P.mt.offset / 1000).toFixed(1)} kHz</span></li>`;
    }).join('');
    const draw = () => plot(el, pk.map((p, i) => ({
      type: 'bar', name: S.MTR_PROTOCOLS[p].name, x: tk.map((t) => S.TISSUES[t].name), y: vals[i], marker: { color: PROTOCOL_COLORS[i] },
      hovertemplate: `${S.MTR_PROTOCOLS[p].name}<br>%{x}: <b>%{y:.1f} %</b><extra></extra>`,
    })), {
      barmode: 'group', bargap: 0.25,
      yaxis: { title: { text: 'MTR (%)' }, range: [0, 60] }, xaxis: { tickfont: { size: 14 } },
      margin: { l: 66, r: 16, t: 16, b: 50 },
      shapes: level == null ? [] : [{ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: level, y1: level, line: { color: C.ink, width: 2, dash: 'dash' } }],
    });
    draw();
    el.on('plotly_click', (ev) => { const p = ev.points && ev.points[0]; if (!p) return; level = level === p.y ? null : p.y; draw(); });
  });

  // ------------------------------------------------------------------ 16 · MTR vs T1 and B1
  W('s-mtrconf', () => {
    const base = S.TISSUES.wm, seq = KS.mtw;
    const tissueAt = (T1) => ({ ...base, R1f: S.r1fFromMeasured(1 / T1, base.F, base.kf, 1) });
    const mtrAt = (T1, b1) => S.mtr(tissueAt(T1), { ...seq, b1 }, { steps: 48 });
    const T1s = linspace(0.4, 1.6, 25), B1s = linspace(0.7, 1.3, 25);
    const draw = throttle(() => {
      const T1 = t1.get(), b1 = b1s.get();
      const now = mtrAt(T1, b1);
      $('mc-mtr').textContent = `${now.toFixed(1)} %`;
      const common = { yaxis: { title: { text: 'MTR (%)' }, range: [30, 70] }, margin: { l: 66, r: 16, t: 12, b: 52 } };
      plot($('mc-t1-plot'), [
        { x: T1s, y: T1s.map((T) => mtrAt(T, b1)), mode: 'lines', line: { color: C.mtr, width: 3 }, hovertemplate: 'T1 %{x:.2f} s: MTR %{y:.1f} %<extra></extra>' },
        { x: [T1], y: [now], mode: 'markers', marker: { color: C.mtr, size: 14, line: { color: '#fff', width: 2 } }, hoverinfo: 'skip' },
      ], { ...common, xaxis: { title: { text: 'T<sub>1</sub> (s)' } } });
      plot($('mc-b1-plot'), [
        { x: B1s, y: B1s.map((b) => mtrAt(T1, b)), mode: 'lines', line: { color: C.mtr, width: 3 }, hovertemplate: 'B1 %{x:.2f}: MTR %{y:.1f} %<extra></extra>' },
        { x: [b1], y: [now], mode: 'markers', marker: { color: C.mtr, size: 14, line: { color: '#fff', width: 2 } }, hoverinfo: 'skip' },
      ], { ...common, xaxis: { title: { text: 'B<sub>1</sub> (relative)' } } });
    });
    const t1 = slider('mc-t1', (v) => `${v.toFixed(2)} s`, draw);
    const b1s = slider('mc-b1', (v) => v.toFixed(2), draw);
    draw();
  });

  // ------------------------------------------------------------------ 17 · Helms' trick
  // One-pool steady state with an instantaneous fractional loss δ at time tp and the excitation at te (both in a TR).
  function helmsTR(R1, delta, seq, tp, te, n = 400) {
    const a = seq.flipAngle * DEG, TR = seq.tr;
    // steady state by iterating the affine map (fast convergence)
    const relax = (m, dt) => 1 - (1 - m) * Math.exp(-R1 * dt);
    const once = (m0) => { let m = relax(m0, tp); m *= 1 - delta; m = relax(m, te - tp); m *= Math.cos(a); return relax(m, TR - te); };
    let m = 1; for (let k = 0; k < 2000; k++) m = once(m);
    const t = [], mz = [];
    let cur = m, last = 0;
    const events = [[tp, (v) => v * (1 - delta)], [te, (v) => v * Math.cos(a)]];
    for (let k = 0; k <= n; k++) {
      const tk = (TR * k) / n;
      for (const [te_, f] of events) if (last < te_ && tk >= te_) { cur = relax(cur, te_ - last); t.push(te_); mz.push(cur); cur = f(cur); t.push(te_); mz.push(cur); last = te_; }
      cur = relax(cur, tk - last); last = tk; t.push(tk); mz.push(cur);
    }
    const beforeExc = (() => { let v = relax(m, tp); v *= 1 - delta; return relax(v, te - tp); })();
    return { t, mz, beforeExc };
  }
  W('s-helms', (section) => {
    const t = WM1, seq = KS.mtw;
    const R1 = S.r1Observed(t);
    const ss = S.steadyState(t, seq);
    const one = S.trajectory(t, seq, 1, { steps: 120, restSamples: 80, start: ss.z });
    const te = seq.mt.duration + 0.003, tp = seq.mt.duration / 2;
    // δ such that the one-pool model gives the two-pool signal (water Mz before the excitation)
    let lo = 0, hi = 0.5;
    for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (helmsTR(R1, mid, seq, tp, te).beforeExc > ss.beforeExcitation[0]) lo = mid; else hi = mid; }
    const delta = (lo + hi) / 2;
    const h = helmsTR(R1, delta, seq, tp, te);
    drawSequence($('helms-seq'), { slim: true });
    const trig = $('helms-trig');
    const ts = svg('svg', { viewBox: '0 0 300 150', width: '100%', height: 150 }, trig);
    const a2 = Math.acos(1 - 0.25);   // exaggerated for the drawing
    const ox = 60, oy = 140, L = 120;
    svg('line', { x1: ox, y1: oy, x2: ox, y2: oy - L, stroke: C.free, 'stroke-width': 3, 'stroke-dasharray': '5 4' }, ts);
    svg('line', { x1: ox, y1: oy, x2: ox + L * Math.sin(a2), y2: oy - L * Math.cos(a2), stroke: C.free, 'stroke-width': 3 }, ts);
    svg('line', { x1: ox, y1: oy - L * Math.cos(a2), x2: ox + L * Math.sin(a2), y2: oy - L * Math.cos(a2), stroke: C.muted, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }, ts);
    svg('path', { d: `M ${ox} ${oy - 34} A 34 34 0 0 1 ${ox + 34 * Math.sin(a2)} ${oy - 34 * Math.cos(a2)}`, stroke: C.restr, 'stroke-width': 2.5, fill: 'none' }, ts);
    svg('text', { x: ox + 8, y: oy - 42, 'font-size': 16, fill: C.restr, 'font-weight': 700 }, ts, 'α₂');
    svg('line', { x1: ox - 14, y1: oy - L, x2: ox - 14, y2: oy - L * Math.cos(a2), stroke: C.restr, 'stroke-width': 4 }, ts);
    svg('text', { x: ox - 20, y: oy - L * (1 + Math.cos(a2)) / 2 + 5, 'font-size': 16, fill: C.restr, 'text-anchor': 'end', 'font-weight': 700 }, ts, 'δ·Mz');
    svg('text', { x: 150, y: 50, 'font-size': 16, fill: C.ink }, ts, 'cos α₂ = 1 − δ');
    svg('text', { x: 150, y: 76, 'font-size': 16, fill: C.ink }, ts, 'δ ≈ α₂²/2');
    svg('text', { x: 150, y: 102, 'font-size': 16, fill: C.restr, 'font-weight': 700 }, ts, `here δ = ${(100 * delta).toFixed(1)} %`);
    const el = $('helms-plot');
    const draw = (which) => {
      const traces = [];
      if (which !== 'helms') traces.push({ x: one.t.map((v) => v * 1000), y: one.mzf, mode: 'lines', line: { color: C.free, width: 3.5 }, name: 'two pools', hovertemplate: 'two pools %{y:.4f}<extra></extra>' });
      if (which !== 'real') traces.push({ x: h.t.map((v) => v * 1000), y: h.mz, mode: 'lines', line: { color: C.restr, width: 3, dash: which === 'both' ? 'dash' : 'solid' }, name: 'Helms model', hovertemplate: 'Helms %{y:.4f}<extra></extra>' });
      const ys = [...one.mzf, ...h.mz];
      plot(el, traces, {
        xaxis: { title: { text: 'time within a steady-state TR (ms)' }, range: [0, 32] },
        yaxis: { title: { text: 'water Mz / M0' }, range: [Math.min(...ys) - 0.01, Math.max(...ys) + 0.01] },
        showlegend: true, legend: { x: 0.99, xanchor: 'right', y: 0.02, yanchor: 'bottom', font: { size: 15 } },
        margin: { l: 70, r: 16, t: 12, b: 52 },
        shapes: [{ type: 'rect', x0: 0, x1: 10, yref: 'paper', y0: 0, y1: 1, fillcolor: C.restr, opacity: 0.07, line: { width: 0 } },
          { type: 'line', x0: te * 1000, x1: te * 1000, yref: 'paper', y0: 0, y1: 1, line: { color: C.free, dash: 'dot', width: 1.5 } }],
        annotations: [{ x: te * 1000, y: 0.98, yref: 'paper', yanchor: 'top', xanchor: 'left', xshift: 6, text: 'readout: same signal', showarrow: false, font: { size: 14, color: C.free } }],
      });
    };
    seg(section, 'show', draw);
    draw('both');
  });

  // ------------------------------------------------------------------ 19 · MTsat across protocols
  W('s-mtsat', () => {
    const tk = ['gm', 'wm', 'nawm', 'early', 'late'];
    const pk = Object.keys(S.MTSAT_PROTOCOLS);
    plot($('ms-plot'), pk.map((p, i) => ({
      type: 'bar', name: S.MTSAT_PROTOCOLS[p].name.replace('Karakuzu 2022 · ', 'Karakuzu '), x: tk.map((t) => S.TISSUES[t].name),
      y: tk.map((t) => S.mtsatExperiment(S.TISSUES[t], S.MTSAT_PROTOCOLS[p]).mtsat), marker: { color: PROTOCOL_COLORS[i] },
      hovertemplate: `${S.MTSAT_PROTOCOLS[p].name}<br>%{x}: <b>%{y:.2f} %</b><extra></extra>`,
    })), {
      barmode: 'group', bargap: 0.2, showlegend: true, legend: { orientation: 'h', y: 1.13, x: 0, font: { size: 14 }, entrywidth: 170 },
      yaxis: { title: { text: 'MTsat (%)' }, range: [0, 8] }, xaxis: { tickfont: { size: 14 } },
      margin: { l: 66, r: 16, t: 66, b: 50 },
    });
  });

  // ------------------------------------------------------------------ 20 · MTsat vs MTR: T1 and B1
  W('s-mtsatconf', (section) => {
    const base = S.TISSUES.wm, p = KS;
    const T1nom = 1 / S.r1Observed(base);
    const at = (T1, b1) => S.mtsatExperiment({ ...base, R1f: S.r1fFromMeasured(1 / T1, base.F, base.kf, 1) }, p, { b1, b1Known: true, steps: 48 });
    const ref = at(T1nom, 1);
    const fT = linspace(0.6, 1.4, 17), fB = linspace(0.7, 1.3, 17);
    const rT = fT.map((f) => at(T1nom * f, 1)), rB = fB.map((b) => at(T1nom, b));
    const rel = (v, r) => 100 * (v / r - 1);
    let corr = false;
    const draw = () => {
      const lines = (xs, rs, xb) => {
        const tr = [
          { x: xs, y: rs.map((r) => rel(r.mtr, ref.mtr)), mode: 'lines', line: { color: C.mtr, width: 3.5 }, name: 'MTR' },
          { x: xs, y: rs.map((r, i) => rel(corr && xb ? S.correctMTsatB1(r.mtsat, xb[i]) : r.mtsat, ref.mtsat)), mode: 'lines', line: { color: C.mtsat, width: 3.5 }, name: corr && xb ? 'MTsat (B₁-corr.)' : 'MTsat' },
          { x: xs, y: rs.map((r) => rel(r.T1, ref.T1)), mode: 'lines', line: { color: C.exc, width: 2, dash: 'dot' }, name: 'T₁ (Helms)' },
        ];
        tr.forEach((t) => { t.hovertemplate = `${t.name}: %{y:+.1f} %<extra></extra>`; });
        return tr;
      };
      const common = { yaxis: { title: { text: 'change (%)' }, range: [-45, 45], zeroline: true, zerolinecolor: '#9aa5b1' }, margin: { l: 66, r: 16, t: 12, b: 52 }, showlegend: true, legend: { x: 0.01, y: 0.99, font: { size: 14 }, bgcolor: 'rgba(255,255,255,0.8)' } };
      plot($('mm-t1'), lines(fT.map((f) => T1nom * f), rT, null), { ...common, xaxis: { title: { text: 'true T<sub>1</sub> (s)' } } });
      plot($('mm-b1'), lines(fB, rB, fB), { ...common, showlegend: false, xaxis: { title: { text: 'B<sub>1</sub> (relative)' } } });
    };
    seg(section, 'corr', (v) => { corr = v === '1'; draw(); });
    draw();
  });

  // ------------------------------------------------------------------ 21 · what MTsat measures (budget)
  W('s-budget', (section) => {
    const el = $('bud-plot');
    const tissues = { wm: WM1, gm: S.TISSUES.gm, late: S.TISSUES.late };
    const seq = KS.mtw;
    const draw = (k) => {
      const t = tissues[k];
      const b = S.budget(t, seq);
      // Helms MTsat from the simulated MTw and PDw with the true T1 (two images, A from PDw)
      const sMT = S.signal(t, seq), sPD = S.signal(t, { ...seq, mt: null });
      const a = seq.flipAngle * DEG, R1 = S.r1Observed(t);
      const helms = 100 * (R1 * seq.tr + (a * a) / 2) * (sPD / sMT - 1);
      const steps = [
        ['T₁ recovery', b.t1Pulse, C.t1, 'pulse'], ['exchange', b.exPulse, C.ex, 'pulse'], ['direct sat.', b.direct, C.direct, 'pulse'],
        ['exchange', b.exAfter, C.ex, 'after'], ['T₁ recovery', b.t1After, C.t1, 'after'], ['excitation', b.excitation, C.exc, 'after'],
      ];
      let level = 100;
      const x = [], base = [], h = [], col = [], txt = [];
      x.push('start'); base.push(0); h.push(100); col.push('#c9d3de'); txt.push('100 %');
      steps.forEach(([name, v, c, when], i) => {
        const d = 100 * v;
        x.push(`${name}<br><span style="font-size:12px;color:#5b6776">${when === 'pulse' ? 'during pulse' : 'after pulse'}</span>`.replace(/^/, `${i}·`));
        base.push(d >= 0 ? level : level + d); h.push(Math.abs(d)); col.push(c); txt.push(`${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(2)} %`);
        level += d;
      });
      x.push('end'); base.push(0); h.push(level); col.push('#c9d3de'); txt.push(`${level.toFixed(1)} %`);
      const lo = Math.min(...base.slice(1, -1)) - 1.2, hi = Math.max(...base.map((v, i) => v + h[i]).slice(1, -1)) + 1;
      plot(el, [{ type: 'bar', x, y: h, base, marker: { color: col }, text: txt, textposition: 'outside', textfont: { size: 14 }, cliponaxis: false, hovertemplate: '%{text}<extra></extra>' }], {
        xaxis: { tickvals: x, ticktext: x.map((s) => s.replace(/^\d·/, '')), tickfont: { size: 13 } },
        yaxis: { title: { text: 'water Mz (% of its value before the pulse)' }, range: [lo, hi] },
        margin: { l: 80, r: 16, t: 20, b: 80 },
        shapes: [{ type: 'rect', x0: 0.5, x1: 3.5, yref: 'paper', y0: 0, y1: 1, fillcolor: C.restr, opacity: 0.06, line: { width: 0 } }],
        annotations: [{ x: 2, y: 1, yref: 'paper', yanchor: 'top', text: 'during the MT pulse', showarrow: false, font: { color: C.restr, size: 15 } },
          { x: 5, y: 1, yref: 'paper', yanchor: 'top', text: 'rest of the TR', showarrow: false, font: { color: C.muted, size: 15 } }],
      });
      const mtLoss = -100 * (b.exPulse + b.exAfter + b.direct);
      $('bud-nums').innerHTML = `
        <div><span>Net drop across the pulse</span><b>${(100 * b.netDropDuringPulse).toFixed(2)} %</b></div>
        <div class="hl-mt"><span>All MT losses in the TR</span><b>${mtLoss.toFixed(1)} %</b></div>
        <div class="hl-mt"><span>Helms MTsat (same images)</span><b>${helms.toFixed(1)} %</b></div>`;
    };
    seg(section, 'tissue', draw);
    draw('wm');
  });

  // ------------------------------------------------------------------ 22 · real MTR and MTsat maps
  W('s-realmtsat', (section) => {
    if (!brain) return;
    const B = brain.B, el = $('rm-plot');
    const TR = 0.025, A7 = 7 * DEG;
    const draw = (k) => {
      k = Number(k);
      const n = (y, x) => B.mt[k][y][x];
      const mtr = (y, x) => 100 * (1 - n(y, x));
      const mtsat = (y, x) => { const a = A7 * B.B1[y][x]; return 100 * (B.R1[y][x] * TR + (a * a) / 2) * (1 / n(y, x) - 1); };
      const vM = brain.voxels.map(([y, x]) => mtr(y, x)), vS = brain.voxels.map(([y, x]) => mtsat(y, x)), vT = brain.voxels.map(([y, x]) => 1 / B.R1[y][x]);
      const q = (arr, p) => { const s = arr.filter(Number.isFinite).slice().sort((a, b) => a - b); return s[Math.floor(p * (s.length - 1))]; };
      const sMax = Math.ceil(q(vS, 0.98) * 2) / 2, mMax = Math.ceil(q(vM, 0.98) / 5) * 5;
      const ax = (dom, a) => ({ domain: dom, visible: false, fixedrange: true, anchor: a });
      const ay = (a) => ({ visible: false, autorange: 'reversed', scaleanchor: a, scaleratio: 1, fixedrange: true, anchor: a });
      plot(el, [
        brainHeat(brain.grid(mtr), { zmin: 0, zmax: mMax, xaxis: 'x', yaxis: 'y', colorbar: { title: { text: 'MTR (%)', side: 'right' }, x: 0.235, thickness: 12, len: 0.8 }, hovertemplate: 'MTR %{z:.1f} %<extra></extra>' }),
        brainHeat(brain.grid(mtsat), { zmin: 0, zmax: sMax, xaxis: 'x2', yaxis: 'y2', colorbar: { title: { text: 'MTsat (%)', side: 'right' }, x: 0.555, thickness: 12, len: 0.8 }, hovertemplate: 'MTsat %{z:.2f} %<extra></extra>' }),
        { type: 'scatter', mode: 'markers', x: vS, y: vM, xaxis: 'x3', yaxis: 'y3', marker: { size: 4, color: vT, colorscale: 'Plasma', cmin: 0.6, cmax: 2.5, opacity: 0.7, colorbar: { title: { text: 'T₁ (s)', side: 'right' }, x: 1.0, thickness: 12, len: 0.8 } }, hovertemplate: 'MTsat %{x:.2f} % · MTR %{y:.1f} %<extra></extra>' },
      ], {
        xaxis: ax([0, 0.22], 'y'), yaxis: ay('x'), xaxis2: ax([0.32, 0.54], 'y2'), yaxis2: ay('x2'),
        xaxis3: { domain: [0.69, 0.94], anchor: 'y3', title: { text: 'MTsat (%)' }, range: [0, sMax] },
        yaxis3: { domain: [0.08, 1], anchor: 'x3', title: { text: 'MTR (%)' }, range: [0, mMax] },
        margin: { l: 10, r: 60, t: 20, b: 50 }, plot_bgcolor: '#fff',
        annotations: [
          { xref: 'paper', yref: 'paper', x: 0.11, y: 1.04, text: '<b>MTR</b>', showarrow: false, font: { size: 17, color: C.mtr } },
          { xref: 'paper', yref: 'paper', x: 0.43, y: 1.04, text: '<b>MTsat</b>', showarrow: false, font: { size: 17, color: C.mtsat } },
          { xref: 'paper', yref: 'paper', x: 0.815, y: 1.04, text: 'every brain voxel', showarrow: false, font: { size: 15 } },
        ],
      });
    };
    seg(section, 'pt', draw);
    draw(3);
  });
})();
