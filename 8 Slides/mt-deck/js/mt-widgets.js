/* The MT lecture deck's live figures. Each registers with MTDeck.widget(slideId, init) and is built the first time its
 * slide is current or next to it. Physics: js/mt-sim.js (two-pool Bloch-McConnell, MT-SPGR); data: js/data/brain.js
 * (the chapter's 3 T qMT slice, through MT.brain); look and controls: js/mt-common.js. */
(function () {
  'use strict';
  const { S, C, GRAY, plot, seg, slider, brain, brainHeat, brainAxes } = window.MT;
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
  // Healthy WM as in the chapter's Appendix C simulations (T1 = 1 s), and the Table 6.3 tissues.
  const WM1 = { ...S.TISSUES.wm, R1f: 1 };

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

  // ------------------------------------------------------------------ MTsat: protocol & equations (three output maps)
  W('s-mtsatproto', () => {
    if (!brain) return;
    const B = brain.B, K = brain.idx(1, 1), TR = 0.025, A7 = 7 * DEG;   // 1088 Hz, 426°, as on the MTR slide
    const inner = (y, x) => (!B.S0 || B.S0[y][x] > 0.35) && [[0, 1], [0, -1], [1, 0], [-1, 0]].every(([dy, dx]) => brain.inMask(y + dy, x + dx));
    const n = (y, x) => B.mt[K][y][x];
    const maps = [
      ['mp-mtr', (y, x) => 100 * (1 - n(y, x)), 30, 65, '%', 'MTR %{z:.1f} %'],
      ['mp-t1', (y, x) => 1 / B.R1[y][x], 0.6, 2, 's', 'T₁ %{z:.2f} s'],
      ['mp-mtsat', (y, x) => { const a = A7 * B.B1[y][x]; return 100 * (B.R1[y][x] * TR + (a * a) / 2) * (1 / n(y, x) - 1); }, 0, null, '%', 'MTsat %{z:.2f} %'],
    ];
    maps.forEach(([id, f, zmin, zmax, unit, hover]) => {
      if (zmax === null) {   // 98th percentile of the brain, as on "MTR and MTsat of the same brain"
        const v = brain.voxels.map(([y, x]) => f(y, x)).filter(Number.isFinite).sort((a, b) => a - b);
        zmax = Math.ceil(v[Math.floor(0.98 * (v.length - 1))] * 2) / 2;
      }
      plot($(id), [brainHeat(brain.grid((y, x) => (inner(y, x) ? f(y, x) : null)), {
        zmin, zmax, colorbar: { title: { text: unit, side: 'top', font: { size: 13 } }, thickness: 11, len: 0.85, outlinewidth: 0, tickfont: { size: 12 } },
        hovertemplate: `${hover}<extra></extra>`,
      })], brainAxes({ margin: { l: 2, r: 50, t: 2, b: 2, autoexpand: false } }));
    });
  });

  // ------------------------------------------------------------------ qMT: acquisition protocol (Z-spectrum of white matter)
  W('s-qmtproto', () => {
    const el = $('qp-plot'), E = window.MTFitErrors;
    const T = E ? E.truth : { F: 0.2222, kf: 1.746, T2f: 0.0207, T2r: 11.88e-6, R1: 1.016 };   // the dataset's median white matter fit
    const t = { F: T.F, kf: T.kf, T2f: T.T2f, T2r: T.T2r, R1r: 1, R1f: S.r1fFromMeasured(T.R1, T.F, T.kf, 1) };
    const seq = (offset, angle) => ({ tr: 0.025, flipAngle: 7, mt: { shape: 'gausshann', duration: 0.01024, angle, offset } });
    const xs = logspace(250, 40000, 40);
    const traces = [];
    S.QMT_ANGLES.forEach((a, ai) => {
      const col = ai ? C.a426 : C.a142;
      traces.push({ x: xs, y: xs.map((o) => S.normalizedSignal(t, seq(o, a), { steps: 40 })), mode: 'lines', line: { color: col, width: 3, shape: 'spline' }, name: `${a}°`, hovertemplate: `model, ${a}°: %{y:.3f}<extra></extra>` });
      if (brain) {
        const med = S.QMT_OFFSETS.map((o, oi) => { const k = brain.idx(oi, ai); return brain.median(brain.voxels.filter(([y, x]) => brain.wmLike(y, x)).map(([y, x]) => brain.B.mt[k][y][x])); });
        traces.push({ x: S.QMT_OFFSETS, y: med, mode: 'markers', marker: { color: col, size: 13, line: { color: '#fff', width: 2 } }, name: `${a}° measured`, hovertemplate: `measured WM, ${a}°, %{x} Hz: %{y:.3f}<extra></extra>` });
      }
    });
    plot(el, traces, {
      xaxis: { type: 'log', title: { text: 'MT pulse offset frequency' }, range: [Math.log10(250), Math.log10(40000)], tickvals: [300, 1000, 3000, 10000, 30000], ticktext: ['300 Hz', '1 kHz', '3 kHz', '10 kHz', '30 kHz'] },
      yaxis: { title: { text: 'S<sub>MT</sub> / S<sub>0</sub>' }, range: [0, 1.04] },
      showlegend: false, margin: { l: 70, r: 20, t: 34, b: 60 },
      annotations: [
        { x: Math.log10(22000), y: 0.2, text: '<b>142°</b>', showarrow: false, font: { color: C.a142, size: 18 } },
        { x: Math.log10(22000), y: 0.11, text: '<b>426°</b>', showarrow: false, font: { color: C.a426, size: 18 } },
        { x: Math.log10(22000), y: 0.29, text: 'MT angle', showarrow: false, font: { color: C.muted, size: 15 } },
        { xref: 'paper', yref: 'paper', x: 0, y: 1.07, xanchor: 'left', text: 'White matter of the brain: <b>dots</b> measured (10 images), lines the two-pool model', showarrow: false, font: { size: 14, color: C.muted } },
      ],
    });
  });

  // ------------------------------------------------------------------ qMT: outputs (four fitted maps)
  W('s-qmtout', () => {
    if (!brain) return;
    const B = brain.B;
    const MAPS = [
      ['qo-F', (y, x) => 100 * B.F[y][x], 0, 30, '%', 'F %{z:.1f} %'],
      ['qo-kf', (y, x) => B.kf[y][x], 0, 4, 's⁻¹', 'k<sub>f</sub> %{z:.2f} s⁻¹'],
      ['qo-T2f', (y, x) => B.T2f[y][x], 10, 60, 'ms', 'T<sub>2,f</sub> %{z:.1f} ms'],
      ['qo-T2r', (y, x) => B.T2r[y][x], 6, 18, 'µs', 'T<sub>2,r</sub> %{z:.1f} µs'],
    ];
    MAPS.forEach(([id, f, zmin, zmax, unit, hover]) => {
      plot($(id), [brainHeat(brain.grid(f), {
        zmin, zmax, colorbar: { title: { text: unit, side: 'top', font: { size: 13 } }, thickness: 11, len: 0.85, outlinewidth: 0, tickfont: { size: 12 } },
        hovertemplate: `${hover}<extra></extra>`,
      })], brainAxes({ margin: { l: 2, r: 50, t: 2, b: 2, autoexpand: false } }));
    });
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
})();
