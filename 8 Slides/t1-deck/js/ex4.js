/* Exercise 4: mouse WM at 9.4 T with a human 1.5 T IR protocol. Monte Carlo simulations and
 * fits run live in qmrust, drawn in the style of the book's IR figures (Figure 2.6 in particular). */
(function () {
  'use strict';
  const { action, bookLayout, axisTitles, COLORS, fmt, withQmRust } = window.T1Exercise;
  const Q = window.QmRust;
  const HUMAN = { t1: 600, name: 'Human WM, 1.5 T (600 ms)' };
  const MOUSE = { t1: 1700, name: 'Mouse WM, 9.4 T (1700 ms)' };
  const SEED = 1;

  function irLayout(overrides) {
    return bookLayout('irPlot1', Object.assign({
      width: 580, height: 430,
      margin: { l: 90, r: 30, t: 10, b: 70 },
      annotations: axisTitles('Inversion Time – TI (ms)', 'Signal (magnitude)', { xy: -0.16, yx: -0.15 }),
    }, overrides));
  }

  // Noiseless curve plus the Monte Carlo mean ± SD at the protocol's TIs.
  function mcTraces(t1, tr, mc, color, name) {
    const c = Q.curve({ t1, tr, tiMax: tr - 1, n: 300, model: 'general', magnitude: true });
    return [
      { x: c.ti, y: c.s, mode: 'lines', name: `${name}: noiseless`, line: { color, width: 2 } },
      { x: mc.tis, y: mc.signalMean, mode: 'markers', name: `${name}: Monte Carlo mean ± SD`,
        marker: { color, size: 9 }, error_y: { type: 'data', array: mc.signalStd, color, thickness: 2, width: 6 } },
    ];
  }

  const row = (label, t1, mc) =>
    `<tr><td>${label}</td><td>${fmt(t1)}</td><td>${fmt(mc.mean)} ± ${fmt(mc.std)}</td><td>${fmt(mc.bias, 1)}%</td><td><b>${fmt(mc.cv, 1)}%</b></td></tr>`;
  const HEADER = '<tr><th></th><th>True</th><th>Fitted (mean ± SD)</th><th>Bias</th><th>CV</th></tr>';

  function protocol(ctx, withTrials) {
    return {
      tr: ctx.num('tr', 'TR'),
      tis: ctx.list('tis', 'TIs'),
      snr: ctx.num('snr', 'SNR'),
      trials: withTrials ? Math.min(5000, Math.round(ctx.num('trials', 'Noise trials'))) : 500,
    };
  }

  // a. The same protocol on human and mouse WM.
  action('ex4-mc', {
    run(ctx) {
      const p = protocol(ctx, true);
      return withQmRust(ctx, () => {
        const human = Q.monteCarlo({ ...p, t1: HUMAN.t1, seed: SEED });
        const mouse = Q.monteCarlo({ ...p, t1: MOUSE.t1, seed: SEED });
        ctx.plot({
          data: [...mcTraces(HUMAN.t1, p.tr, human, COLORS[0], 'Human'), ...mcTraces(MOUSE.t1, p.tr, mouse, COLORS[1], 'Mouse')],
          layout: irLayout({ legend: { x: 0.25, y: 0.98 }, xaxis: { range: [0, p.tr], autorange: false }, yaxis: { range: [0, 1.05], autorange: false } }),
        });
        ctx.say(`<table class="measure">${HEADER}${row('Human', HUMAN.t1, human)}${row('Mouse', MOUSE.t1, mouse)}</table>`);
        ctx.slide._ex4 = { human, mouse };
        fillAnswer(ctx);
      });
    },
  });

  function fillAnswer(ctx) {
    const r = ctx.slide._ex4;
    if (!r) return;
    ctx.slide.querySelector('.ans-ratio').textContent = fmt(r.mouse.cv / r.human.cv, 1);
    ctx.slide.querySelector('.ans-mouse').textContent = fmt(r.mouse.cv);
    ctx.slide.querySelector('.ans-human').textContent = fmt(r.human.cv);
  }
  action('ex4-mc-answer', { run: fillAnswer, undo() {} });

  // b. Measured (general equation, TR = 1000 ms) against full recovery (long TR), both tissues.
  action('ex4-why', {
    run(ctx) {
      const tr = 1000;
      const tis = [100, 300, 600, 900];
      return withQmRust(ctx, () => {
        const data = [];
        const rows = [HUMAN, MOUSE].map((t, i) => {
          const c = Q.curve({ t1: t.t1, tr, tiMax: tr - 1, n: 300, model: 'general', magnitude: true });
          const full = Q.curve({ t1: t.t1, tr, tiMax: tr - 1, n: 300, model: 'longTR', magnitude: true });
          const s = Q.signal({ t1: t.t1, tr, tis, model: 'general', magnitude: true });
          data.push({ x: c.ti, y: c.s, mode: 'lines', name: `${t.name}: TR 1000 ms`, line: { color: COLORS[i], width: 2.5 } });
          data.push({ x: full.ti, y: full.s, mode: 'lines', name: `${t.name}: full recovery`, line: { color: COLORS[i], width: 1.5, dash: 'dash' } });
          data.push({ x: tis, y: s, mode: 'markers', showlegend: false, marker: { color: COLORS[i], size: 10 } });
          const longTR = Q.monteCarlo({ t1: t.t1, tr, tis, snr: 100, trials: 300, seed: SEED, model: 'longTR' });
          return `<tr><td>${t.name.split(',')[0]}</td><td>${fmt(Math.exp(-tr / t.t1), 2)}</td><td>${fmt(Math.max(...s) - Math.min(...s), 2)}</td><td>${fmt(longTR.mean)} ms</td></tr>`;
        });
        ctx.plot({
          data,
          layout: irLayout({ legend: { x: 0.2, y: 0.99, font: { family: 'Times New Roman', size: 12 } }, xaxis: { range: [0, tr], autorange: false }, yaxis: { range: [0, 1.45], autorange: false, tickvals: [0, 0.2, 0.4, 0.6, 0.8, 1] } }),
        });
        ctx.say(`<table class="measure"><tr><th></th><th>e<sup>−TR/T<sub>1</sub></sup></th><th>Signal range</th><th>Long-TR fit</th></tr>${rows.join('')}</table>`);
      });
    },
  });
  action('ex4-why-answer', { run() {}, undo() {} });

  // c. The protocol on the slide, against the human protocol, for mouse WM.
  action('ex4-proposed', {
    run(ctx) {
      const p = protocol(ctx, false);
      const human = { tr: 1000, tis: [100, 300, 600, 900], snr: p.snr, trials: 500 };
      return withQmRust(ctx, () => {
        const before = Q.monteCarlo({ ...human, t1: MOUSE.t1, seed: SEED });
        const after = Q.monteCarlo({ ...p, t1: MOUSE.t1, seed: SEED });
        ctx.plot({
          data: [...mcTraces(MOUSE.t1, human.tr, before, COLORS[1], 'Human protocol'), ...mcTraces(MOUSE.t1, p.tr, after, COLORS[2], 'Protocol on the slide')],
          layout: irLayout({ legend: { x: 0.3, y: 0.99 }, xaxis: { range: [0, Math.max(p.tr, 1000)], autorange: false }, yaxis: { range: [0, 1.45], autorange: false, tickvals: [0, 0.2, 0.4, 0.6, 0.8, 1] } }),
        });
        // Scan time per slice is proportional to TR × number of TIs; CV × √time compares equal-time precision.
        const eff = (q, mc) => mc.cv * Math.sqrt((q.tr * q.tis.length) / 1000);
        const line = (label, q, mc) =>
          `<tr><td>${label}</td><td>${fmt(mc.bias, 1)}%</td><td><b>${fmt(mc.cv, 1)}%</b></td><td>${fmt((q.tr * q.tis.length) / 1000, 1)} s</td><td>${fmt(eff(q, mc), 1)}</td></tr>`;
        ctx.say(`<table class="measure"><tr><th>Mouse WM</th><th>Bias</th><th>CV</th><th>Time*</th><th>CV·√time</th></tr>${
          line('Human', human, before)}${line('On the slide', p, after)}</table>` +
          '<p class="footnote">* TR × number of TIs, per k-space line. Lower CV·√time means more precision for the same scan time.</p>');
      });
    },
  });
  action('ex4-proposed-answer', { run() {}, undo() {} });
})();
