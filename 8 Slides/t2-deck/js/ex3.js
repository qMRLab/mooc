/* Exercise 3: Eq. 3.8 at several echo times, for a voxel of 50% MW and 50% IEW, drawn in the style of
 * the book's Figure 3.5 (t2Plot4). Times in ms.
 * The action draws its slide up to ctx.step: the values first, then the whole curve, then the meaning. */
(function () {
  'use strict';
  const { action, bookLayout, axisTitles, COLORS, fmt } = window.T2Exercise;
  const S = window.T2Solve;

  // Percentages from 50% down to 0.0002%, to two significant digits.
  const pct = (x) => `${Number((100 * x).toPrecision(2))}%`;

  // Step 1: Eq. 3.8 at the TEs, as a table and points. Step 2: the whole curve from TE = 0.
  // Step 3: the meaning (markup; fills the MW/IEW decay ratio).
  action('ex3-mwf', {
    run(ctx) {
      const t2mw = ctx.num('t2mw', 'T₂ of MW');
      const t2iew = ctx.num('t2iew', 'T₂ of IEW');
      const fmw = ctx.num('fmw', 'MW in the voxel') / 100;
      const tes = ctx.list('tes', 'TEs');
      if (fmw >= 1) throw new window.T2Exercise.InputError('MW in the voxel: enter a percentage below 100.');
      ctx.slide.querySelector('.ans-factor').textContent = fmt(t2iew / t2mw);
      const values = tes.map((te) => S.mwf(te, t2mw, t2iew, fmw));
      const teMax = Math.max(300, ...tes);
      const data = [];
      if (ctx.step >= 2) {
        const x = Array.from({ length: 301 }, (_, i) => (i * teMax) / 300);
        data.push({
          x, y: x.map((te) => 100 * S.mwf(te, t2mw, t2iew, fmw)), mode: 'lines', name: 'Eq. 3.8', line: { color: COLORS[4], width: 2 }, hoverinfo: 'x+y',
        });
        data.push({
          x: [0], y: [100 * fmw], mode: 'markers', name: `TE = 0: ${fmt(100 * fmw)}%, the voxel’s MW`, marker: { size: 13, color: 'black', symbol: 'x' }, hoverinfo: 'name',
        });
      }
      data.push({
        x: tes, y: values.map((v) => 100 * v), mode: 'markers', name: 'At the chosen TEs', marker: { size: 11, color: COLORS[2] },
        hovertemplate: 'TE %{x} ms: %{y:.3g}%<extra></extra>',
      });
      ctx.plot({
        data,
        layout: bookLayout('t2Plot4', {
          width: 600, height: 440,
          margin: { l: 90, r: 30, t: 20, b: 70 },
          annotations: axisTitles('Echo Time – TE (ms)', 'MWF from Eq. 3.8 (%)', { xy: -0.16, yx: -0.15 }),
          legend: { x: 0.38, y: 0.97 },
          showlegend: true,
          xaxis: { range: [-5, teMax * 1.03], zeroline: false },
          yaxis: { range: [0, 100 * fmw * 1.15], zeroline: false },
        }),
      });
      ctx.say(`<table class="measure wide"><tr><th>TE (ms)</th>${tes.map((te) => `<th>${te}</th>`).join('')}</tr>`
        + `<tr><td>MWF</td>${values.map((v) => `<td><b>${pct(v)}</b></td>`).join('')}</tr></table>`);
    },
  });
})();
