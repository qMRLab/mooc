/* Exercise 2: Ernst angles, the Deoni optimal angle pair and SPGR contrast (Eqs. 2.5–2.6),
 * drawn in the style of the book's Figure 2.8 (vfaPlot1). */
(function () {
  'use strict';
  const { action, bookLayout, axisTitles, COLORS, fmt } = window.T1Exercise;
  const S = window.T1Solve;
  const TISSUES = [
    { key: 'wm', name: 'White matter', tr: 15, t1: 900 },
    { key: 'gm', name: 'Grey matter', tr: 50, t1: 1500 },
    { key: 'csf', name: 'CSF', tr: 140, t1: 4000 },
  ];
  const range = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

  // b. Eq. 2.6 next to the readings, and Eq. 2.6 as a function of TR/T1.
  action('ex2-ernst', {
    run(ctx) {
      const rows = TISSUES.map((t) => {
        const read = ctx.num(t.key, `${t.name} reading`);
        return { ...t, read, eq: S.ernst(t.tr, t.t1), ratio: t.tr / t.t1 };
      });
      ctx.say(`<table class="measure"><tr><th>Tissue</th><th>TR/<i>T</i><sub>1</sub></th><th>Read</th><th>Eq. 2.6</th><th>Difference</th></tr>${
        rows.map((r) => `<tr><td>${r.name}</td><td>${fmt(r.ratio, 3)}</td><td>${fmt(r.read, 1)}°</td><td><b>${fmt(r.eq, 1)}°</b></td><td>${fmt(r.read - r.eq, 1)}°</td></tr>`).join('')
      }</table>`);
      const x = range(0, 0.05, 101);
      ctx.plot({
        data: [
          { x, y: x.map((r) => S.ernst(r, 1)), mode: 'lines', name: 'Eq. 2.6', line: { color: 'black', width: 2 } },
          ...rows.map((r, i) => ({
            x: [r.ratio], y: [r.read], mode: 'markers', name: `${r.name} (read)`,
            marker: { size: 12, color: COLORS[i] },
          })),
        ],
        layout: bookLayout('vfaPlot1', {
          width: 560, height: 450,
          annotations: axisTitles('TR / T<sub>1</sub>', 'Ernst angle (°)', { xy: -0.15, yx: -0.15 }),
          legend: { x: 0.04, y: 0.97 },
          xaxis: { range: [0, 0.05], autorange: false },
          yaxis: { range: [0, 20], autorange: false },
        }),
      });
    },
  });

  // c. Eq. 2.5 normalized to the Ernst signal; the pair sits where it crosses 0.71.
  action('ex2-deoni', {
    run(ctx) {
      const theta = range(0, 60, 241);
      const data = [];
      const rows = TISSUES.map((t, i) => {
        const e = S.ernst(t.tr, t.t1);
        const peak = S.spgr(e, t.tr, t.t1);
        const pair = S.deoniPair(t.tr, t.t1);
        data.push({ x: theta, y: theta.map((a) => S.spgr(a, t.tr, t.t1) / peak), mode: 'lines',
          name: `${t.name}, TR ${t.tr} ms`, line: { color: COLORS[i], width: 2 } });
        data.push({ x: [pair.low, pair.high], y: [0.71, 0.71], mode: 'markers', showlegend: false,
          marker: { size: 11, color: COLORS[i], line: { color: 'black', width: 1 } }, hoverinfo: 'x' });
        return { ...t, e, ...pair };
      });
      data.push({ x: [0, 60], y: [0.71, 0.71], mode: 'lines', name: '71% of the Ernst signal',
        line: { color: 'black', dash: 'dash', width: 1.5 } });
      ctx.plot({
        data,
        layout: bookLayout('vfaPlot1', {
          width: 580, height: 450,
          annotations: axisTitles('Excitation Flip Angle (°)', 'Signal / Ernst signal', { xy: -0.15, yx: -0.15 }),
          legend: { x: 0.45, y: 0.3 },
          xaxis: { range: [0, 60], autorange: false },
          yaxis: { range: [0, 1.05], autorange: false },
        }),
      });
      ctx.say(`<table class="measure"><tr><th>Tissue</th><th>Ernst</th><th>Low</th><th>High</th></tr>${
        rows.map((r) => `<tr><td>${r.name}</td><td>${fmt(r.e, 1)}°</td><td><b>${fmt(r.low, 1)}°</b></td><td><b>${fmt(r.high, 1)}°</b></td></tr>`).join('')
      }</table>`);
    },
  });

  // d. WM, GM and their difference at the chosen TR.
  action('ex2-contrast', {
    run(ctx) {
      const tr = ctx.num('tr', 'TR');
      const theta = range(0, 90, 361);
      const wm = theta.map((a) => S.spgr(a, tr, 900));
      const gm = theta.map((a) => S.spgr(a, tr, 1500));
      const best = S.spgrMaxContrastAngle(tr, 900, 1500);
      const bestDiff = S.spgr(best, tr, 900) - S.spgr(best, tr, 1500);
      ctx.plot({
        data: [
          { x: theta, y: wm, mode: 'lines', name: 'T<sub>1</sub> = 0.9 s (White Matter)', line: { color: COLORS[0] } },
          { x: theta, y: gm, mode: 'lines', name: 'T<sub>1</sub> = 1.5 s (Grey Matter)', line: { color: COLORS[1] } },
          { x: theta, y: wm.map((v, i) => v - gm[i]), mode: 'lines', name: 'WM − GM', line: { color: 'black', dash: 'dash', width: 2 } },
          { x: [best], y: [bestDiff], mode: 'markers', name: `Maximum at ${fmt(best, 1)}°`, marker: { size: 13, color: 'black', symbol: 'x' } },
        ],
        layout: bookLayout('vfaPlot1', {
          width: 580, height: 450,
          annotations: axisTitles('Excitation Flip Angle (°)', 'Signal', { xy: -0.15, yx: -0.15 }),
          legend: { x: 0.45, y: 0.95 },
          xaxis: { range: [0, 90], autorange: false },
        }),
      });
      ctx.say(`<p class="answer">Best WM/GM contrast at <b>${fmt(best, 1)}°</b> for TR = ${fmt(tr)} ms (Ernst angles: WM ${fmt(S.ernst(tr, 900), 1)}°, GM ${fmt(S.ernst(tr, 1500), 1)}°).</p>`);
    },
  });
})();
