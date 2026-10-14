/* Exercise 2: Ernst angles, the Deoni optimal angle pair and SPGR contrast (Eqs. 2.5–2.6),
 * drawn in the style of the book's Figure 2.8 (vfaPlot1).
 * Each action draws its slide up to ctx.step: data first, then the result, then the explanation. */
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
  const marker = (x, y, name) => ({ x: [x], y: [y], mode: 'markers', name, marker: { size: 13, color: 'black', symbol: 'x' } });

  function vfaLayout(overrides) {
    return bookLayout('vfaPlot1', Object.assign({ width: 580, height: 450 }, overrides));
  }

  // b. Step 1: the readings against TR/T1. Step 2: Eq. 2.6 as a curve and a table. Step 3: why (markup).
  action('ex2-ernst', {
    undo(ctx) {
      ctx.clear();
      ctx.slide.querySelectorAll('[data-out]').forEach((td) => { td.textContent = ''; });
    },
    run(ctx) {
      const rows = TISSUES.map((t) => ({ ...t, read: ctx.num(t.key, `${t.name} reading`), eq: S.ernst(t.tr, t.t1), ratio: t.tr / t.t1 }));
      const x = range(0, 0.05, 101);
      const data = rows.map((r, i) => ({
        x: [r.ratio], y: [r.read], mode: 'markers', name: `${r.name} (read)`, marker: { size: 12, color: COLORS[i] },
      }));
      if (ctx.step >= 2) {
        data.unshift({ x, y: x.map((r) => S.ernst(r, 1)), mode: 'lines', name: 'Eq. 2.6', line: { color: 'black', width: 2 } });
      }
      ctx.plot({
        data,
        layout: vfaLayout({
          width: 560,
          annotations: axisTitles('TR / T<sub>1</sub>', 'Ernst angle (°)', { xy: -0.15, yx: -0.15 }),
          legend: { x: 0.04, y: 0.97 },
          showlegend: true,
          xaxis: { range: [0, 0.05], autorange: false },
          yaxis: { range: [0, 20], autorange: false },
        }),
      });
      // Eq. 2.6 fills the last two columns of the input table from step 2.
      rows.forEach((r) => {
        ctx.slide.querySelector(`[data-out="${r.key}-eq"]`).innerHTML = ctx.step >= 2 ? `<b>${fmt(r.eq, 1)}°</b>` : '';
        ctx.slide.querySelector(`[data-out="${r.key}-diff"]`).textContent = ctx.step >= 2 ? `${fmt(r.read - r.eq, 1)}°` : '';
      });
      ctx.say(ctx.step >= 2 ? 'Eq. 2.6 against the readings.' : 'The readings, plotted against TR/<i>T</i><sub>1</sub>.');
    },
  });

  // c. Step 1: Eq. 2.5 normalized to the Ernst signal. Step 2: where each crosses 0.71. Step 3: comparison (markup).
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
        if (ctx.step >= 2) {
          data.push({ x: [pair.low, pair.high], y: [0.71, 0.71], mode: 'markers', showlegend: false,
            marker: { size: 11, color: COLORS[i], line: { color: 'black', width: 1 } }, hoverinfo: 'x' });
        }
        return { ...t, e, ...pair };
      });
      if (ctx.step >= 2) {
        data.push({ x: [0, 60], y: [0.71, 0.71], mode: 'lines', name: '71% of the Ernst signal',
          line: { color: 'black', dash: 'dash', width: 1.5 } });
      }
      ctx.plot({
        data,
        layout: vfaLayout({
          annotations: axisTitles('Excitation Flip Angle (°)', 'Signal / Ernst signal', { xy: -0.15, yx: -0.15 }),
          legend: { x: 0.45, y: 0.3 },
          xaxis: { range: [0, 60], autorange: false },
          yaxis: { range: [0, 1.05], autorange: false },
        }),
      });
      const literal = ctx.slide.querySelector('.ans-literal');
      if (literal) literal.textContent = rows.map((r) => `${fmt(0.7 * r.e, 1)}°`).join(', ');
      ctx.say(ctx.step >= 2
        ? `<table class="measure"><tr><th>Tissue</th><th>Ernst</th><th>Low</th><th>High</th></tr>${
          rows.map((r) => `<tr><td>${r.name}</td><td>${fmt(r.e, 1)}°</td><td><b>${fmt(r.low, 1)}°</b></td><td><b>${fmt(r.high, 1)}°</b></td></tr>`).join('')
        }</table>`
        : 'Each tissue’s signal (Eq. 2.5 at its TR), divided by its value at the Ernst angle.');
    },
  });

  // d. Step 1: WM and GM at the chosen TR. Step 2: their difference. Step 3: its maximum.
  action('ex2-contrast', {
    run(ctx) {
      const tr = ctx.num('tr', 'TR');
      const theta = range(0, 90, 361);
      const wm = theta.map((a) => S.spgr(a, tr, 900));
      const gm = theta.map((a) => S.spgr(a, tr, 1500));
      const data = [
        { x: theta, y: wm, mode: 'lines', name: 'T<sub>1</sub> = 0.9 s (White Matter)', line: { color: COLORS[0] } },
        { x: theta, y: gm, mode: 'lines', name: 'T<sub>1</sub> = 1.5 s (Grey Matter)', line: { color: COLORS[1] } },
      ];
      const best = S.spgrMaxContrastAngle(tr, 900, 1500);
      if (ctx.step >= 2) data.push({ x: theta, y: wm.map((v, i) => v - gm[i]), mode: 'lines', name: 'WM − GM', line: { color: 'black', dash: 'dash', width: 2 } });
      if (ctx.step >= 3) data.push(marker(best, S.spgr(best, tr, 900) - S.spgr(best, tr, 1500), `Maximum at ${fmt(best, 1)}°`));
      ctx.plot({
        data,
        layout: vfaLayout({
          annotations: axisTitles('Excitation Flip Angle (°)', 'Signal', { xy: -0.15, yx: -0.15 }),
          legend: { x: 0.45, y: 0.95 },
          xaxis: { range: [0, 90], autorange: false },
        }),
      });
      const say = [
        `Eq. 2.5 at TR = ${fmt(tr)} ms: the curves peak at their Ernst angles (WM ${fmt(S.ernst(tr, 900), 1)}°, GM ${fmt(S.ernst(tr, 1500), 1)}°).`,
        'The contrast is the gap between the two curves.',
        `<p class="answer">Best WM/GM contrast at <b>${fmt(best, 1)}°</b>: above both Ernst angles. Best contrast and best signal are different goals.</p>`,
      ];
      ctx.say(say.slice(0, Math.max(1, ctx.step)).join(' '));
    },
  });
})();
