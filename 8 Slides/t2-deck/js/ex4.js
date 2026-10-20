/* Exercise 4: SNR against echo time, simulated live as in the notebook of the book's Figure 3.4 (t2Plot3):
 * the decay plus Gaussian noise whose SD is set by the SNR at TE = 0. Drawn in the style of Figure 3.4.
 * Times in ms. Each action draws its slide up to ctx.step: data first, then the result, then the explanation. */
(function () {
  'use strict';
  const { action, bookLayout, axisTitles, COLORS, fmt } = window.T2Exercise;
  const S = window.T2Solve;
  const SEED = 1;
  // Figure 3.4's echo times: 30 echoes, 12.8 ms apart.
  const FIG34_TES = Array.from({ length: 30 }, (_, i) => 12.8 * (i + 1));

  // SNR as a short number: 89, 9.5, 1.4, 0.02, 0.000003; and "0" for a simulated value that is noise.
  const snrText = (x) => (x >= 10 ? fmt(x) : x >= 1 ? fmt(x, 1) : String(Number(x.toPrecision(1))));
  // A simulated SNR within 3 standard errors (about 1/√trials) of zero is noise.
  const measured = (r) => (Math.abs(r.snr) < 3 / Math.sqrt(r.trials) ? '≈ 0' : snrText(r.snr));

  function inputs(ctx) {
    return {
      t2: ctx.num('t2', 'T₂'),
      snr0: ctx.num('snr0', 'SNR at TE = 0'),
      tes: ctx.list('tes', 'TEs'),
      trials: Math.max(2, Math.min(20000, Math.round(ctx.num('trials', 'Noise trials')))),
    };
  }

  // a and b. Step 0 (on opening): the noiseless decay, one noisy acquisition at Figure 3.4's echoes, and the
  //    noise level. Step 1: the Monte Carlo at the chosen TEs, mean ± SD. Step 2: the SNR table.
  //    Step 3: the explanation (markup, filled with the formula's values).
  function snrAction(id, symbol) {
    action(id, {
      run(ctx) {
        const p = inputs(ctx);
        const sigma = 1 / p.snr0;
        const teMax = Math.max(400, ...p.tes);
        const x = Array.from({ length: 401 }, (_, i) => (i * teMax) / 400);
        const randn = S.gaussian(SEED + 1);
        const data = [
          { x: [0, teMax, teMax, 0], y: [-sigma, -sigma, sigma, sigma], fill: 'toself', mode: 'lines', line: { width: 0 },
            fillcolor: 'rgba(120,120,120,0.25)', name: 'Noise level (± 1 SD)', hoverinfo: 'name' },
          { x, y: x.map((te) => S.decay(te, p.t2)), mode: 'lines', name: `Noiseless, ${symbol} = ${fmt(p.t2)} ms`, line: { color: COLORS[0], width: 2 }, hoverinfo: 'x+y' },
          { x: FIG34_TES, y: FIG34_TES.map((te) => S.decay(te, p.t2) + sigma * randn()), mode: 'markers', name: `One acquisition, SNR<sub>0</sub> = ${fmt(p.snr0)}`,
            marker: { color: 'red', size: 6 }, hoverinfo: 'x+y' },
        ];
        ctx.slide.querySelector('.ans-snr').textContent = p.tes.map((te) => snrText(S.snrAt(te, p.t2, p.snr0))).join(', ');
        let mc = null;
        if (ctx.step >= 1) {
          mc = S.simulateSNR(p.tes, p.t2, p.snr0, p.trials, SEED).map((r) => Object.assign(r, { trials: p.trials }));
          data.push({
            x: p.tes, y: mc.map((r) => r.mean), mode: 'markers', name: `Mean ± SD of ${fmt(p.trials)} repetitions`,
            marker: { color: 'black', size: 10, symbol: 'diamond' }, error_y: { type: 'data', array: mc.map((r) => r.sd), color: 'black', thickness: 2, width: 8 },
            hoverinfo: 'x+y',
          });
        }
        ctx.plot({
          data,
          layout: bookLayout('t2Plot3', {
            width: 600, height: 440,
            margin: { l: 90, r: 30, t: 20, b: 70 },
            annotations: axisTitles('Echo Time – TE (ms)', 'Transverse Magnetization (M<sub>xy</sub>)', { xy: -0.16, yx: -0.15 }),
            legend: { x: 0.36, y: 0.97 },
            showlegend: true,
            xaxis: { range: [0, teMax], zeroline: false },
            yaxis: { range: [-0.05, 1.05], zeroline: true, zerolinecolor: '#999' },
          }),
        });
        if (!mc) {
          ctx.say(`The noise SD is 1/SNR<sub>0</sub> = ${fmt(sigma, 3)} at every echo.`);
          return;
        }
        if (ctx.step < 2) {
          ctx.say(`${fmt(p.trials)} noisy repetitions at each TE.`);
          return;
        }
        ctx.say('<table class="measure"><tr><th>TE (ms)</th><th>Mean</th><th>SD</th><th>SNR</th><th>SNR<sub>0</sub> e<sup>−TE/' + symbol + '</sup></th></tr>'
          + mc.map((r) => `<tr><td>${r.te}</td><td>${fmt(r.mean, 4)}</td><td>${fmt(r.sd, 4)}</td><td><b>${measured(r)}</b></td><td>${snrText(r.truth)}</td></tr>`).join('')
          + '</table>');
      },
    });
  }

  snrAction('ex4-a', '<i>T</i><sub>2</sub>');
  snrAction('ex4-b', '<i>T</i><sub>2</sub><sup>*</sup>');

  // c. Step 0: SNR against TE (log scale) for both decays. Step 1: the lowest useful SNR and where each
  //    curve reaches it. Step 2: the protocol comments (markup, filled with the gains from 4× averaging).
  action('ex4-c', {
    run(ctx) {
      const snr0 = ctx.num('snr0', 'SNR at TE = 0');
      const snrMin = ctx.num('snrmin', 'Lowest useful SNR');
      const sets = [
        { t2: ctx.num('t2', 'T₂'), name: 'T<sub>2</sub>', color: COLORS[0] },
        { t2: ctx.num('t2star', 'T₂*'), name: 'T<sub>2</sub><sup>*</sup>', color: COLORS[1] },
      ];
      if (snrMin >= snr0) throw new window.T2Exercise.InputError('Lowest useful SNR: enter a value below the SNR at TE = 0.');
      ctx.slide.querySelector('.ans-gain').textContent = fmt(sets[0].t2 * Math.LN2);
      ctx.slide.querySelector('.ans-gain-star').textContent = fmt(sets[1].t2 * Math.LN2);
      const limits = sets.map((s) => S.maxUsefulTE(s.t2, snr0, snrMin));
      const teMax = Math.max(400, ...limits.map((l) => l * 1.1));
      const x = Array.from({ length: 401 }, (_, i) => (i * teMax) / 400);
      const data = sets.map((s) => ({
        x, y: x.map((te) => S.snrAt(te, s.t2, snr0)), mode: 'lines', name: `${s.name} = ${fmt(s.t2)} ms`, line: { color: s.color, width: 2 }, hoverinfo: 'x+y',
      }));
      if (ctx.step >= 1) {
        data.push({ x: [0, teMax], y: [snrMin, snrMin], mode: 'lines', name: `Lowest useful SNR (${fmt(snrMin, snrMin % 1 ? 1 : 0)})`, line: { color: 'black', dash: 'dot', width: 2 }, hoverinfo: 'name' });
        sets.forEach((s, i) => data.push({
          x: [limits[i]], y: [snrMin], mode: 'markers', name: `${s.name}: up to ${fmt(limits[i])} ms`, marker: { size: 13, color: s.color, symbol: 'x' }, hoverinfo: 'name',
        }));
      }
      ctx.plot({
        data,
        layout: bookLayout('t2Plot3', {
          width: 600, height: 440,
          margin: { l: 90, r: 30, t: 20, b: 70 },
          annotations: axisTitles('Echo Time – TE (ms)', 'SNR', { xy: -0.16, yx: -0.13 }),
          legend: { x: 0.5, y: 0.97 },
          showlegend: true,
          xaxis: { range: [0, teMax] },
          yaxis: { type: 'log', range: [-1, Math.log10(snr0 * 2)], tickvals: [0.1, 1, 10, 100, 1000], ticktext: ['0.1', '1', '10', '100', '1000'] },
        }),
      });
      if (ctx.step < 1) {
        ctx.say('On a log scale, each decay is a straight line.');
        return;
      }
      ctx.say(`TE<sub>max</sub> = <i>T</i><sub>2</sub> ln(SNR<sub>0</sub>/SNR<sub>min</sub>): <b>${fmt(limits[0])} ms</b> for ${sets[0].name} (${fmt(limits[0] / sets[0].t2, 1)} ${sets[0].name}), <b>${fmt(limits[1])} ms</b> for ${sets[1].name}.`);
    },
  });
})();
