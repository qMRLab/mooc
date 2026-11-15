/* Exercise 6-3's first two slides, moved here from the lecture: real Z-spectra of the dataset, voxel by voxel
 * (measured points and the two-pool model with qMRLab's fit), then a live Z-spectrum with F, k_f, T2,r and T2,f sliders. */
(function () {
  'use strict';
  const { S, C, plot, slider, throttle, brain, brainHeat, brainAxes } = window.MT;
  const W = window.MTDeck.widget;
  const $ = (id) => document.getElementById(id);
  const logspace = (a, b, n) => Array.from({ length: n }, (_, i) => 10 ** (Math.log10(a) + ((Math.log10(b) - Math.log10(a)) * i) / (n - 1)));

  // ------------------------------------------------------------------ real Z-spectra, voxel by voxel
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

  // ------------------------------------------------------------------ the Z-spectrum, live
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
})();
