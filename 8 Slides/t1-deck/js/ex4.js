/* Exercise 4: mouse WM at 9.4 T with a human 1.5 T IR protocol. Monte Carlo simulations and
 * fits run live in qmrust, drawn in the style of the book's IR figures (Figure 2.6 in particular).
 * Each action draws its slide up to ctx.step: data first, then the result, then the explanation. */
(function () {
  'use strict';
  const { action, bookLayout, axisTitles, COLORS, fmt, withQmRust } = window.T1Exercise;
  const Q = window.QmRust;
  const HUMAN = { t1: 600, name: 'Human WM, 1.5 T (600 ms)' };
  const MOUSE = { t1: 1700, name: 'Mouse WM, 9.4 T (1700 ms)' };
  const HUMAN_PROTOCOL = { tr: 1000, tis: [100, 300, 600, 900] };
  const SEED = 1;

  function irLayout(overrides) {
    return bookLayout('irPlot1', Object.assign({
      width: 580, height: 430,
      margin: { l: 90, r: 30, t: 10, b: 70 },
      annotations: axisTitles('Inversion Time – TI (ms)', 'Signal (magnitude)', { xy: -0.16, yx: -0.15 }),
    }, overrides));
  }

  // Headroom above the curves so the legend sits clear of them.
  const yHeadroom = { range: [0, 1.45], autorange: false, tickvals: [0, 0.2, 0.4, 0.6, 0.8, 1] };

  // A tissue's noiseless curve and its protocol samples: noise-free points, or the Monte Carlo mean ± SD.
  function tissueTraces(t1, p, color, name, mc) {
    const c = Q.curve({ t1, tr: p.tr, tiMax: p.tr - 1, n: 300, model: 'general', magnitude: true });
    const samples = mc
      ? { x: mc.tis, y: mc.signalMean, name: `${name}: Monte Carlo mean ± SD`, error_y: { type: 'data', array: mc.signalStd, color, thickness: 2, width: 6 } }
      : { x: p.tis, y: Q.signal({ t1, tr: p.tr, tis: p.tis, model: 'general', magnitude: true }), name: `${name}: protocol TIs` };
    return [
      { x: c.ti, y: c.s, mode: 'lines', name: `${name}: noiseless`, line: { color, width: 2 } },
      { mode: 'markers', marker: { color, size: 9 }, ...samples },
    ];
  }

  const HEADER = '<tr><th></th><th>True</th><th>Fitted (mean ± SD)</th><th>Bias</th><th>CV</th></tr>';
  const row = (label, t1, mc) =>
    `<tr><td>${label}</td><td>${fmt(t1)}</td><td>${fmt(mc.mean)} ± ${fmt(mc.std)}</td><td>${fmt(mc.bias, 1)}%</td><td><b>${fmt(mc.cv, 1)}%</b></td></tr>`;

  function protocol(ctx, withTrials) {
    return {
      tr: ctx.num('tr', 'TR'),
      tis: ctx.list('tis', 'TIs'),
      snr: ctx.num('snr', 'SNR'),
      trials: withTrials ? Math.min(5000, Math.round(ctx.num('trials', 'Noise trials'))) : 500,
    };
  }

  // a. Step 0: both tissues' curves with the protocol's TIs. Step 1: the Monte Carlo fits.
  //    Step 2: the conclusion (markup, filled from the run).
  action('ex4-mc', {
    run(ctx) {
      const p = protocol(ctx, true);
      const t1h = ctx.num('t1human', 'Human WM T₁');
      const t1m = ctx.num('t1mouse', 'Mouse WM T₁');
      return withQmRust(ctx, () => {
        const human = ctx.step >= 1 ? Q.monteCarlo({ ...p, t1: t1h, seed: SEED }) : null;
        const mouse = ctx.step >= 1 ? Q.monteCarlo({ ...p, t1: t1m, seed: SEED }) : null;
        ctx.plot({
          data: [...tissueTraces(t1h, p, COLORS[0], `Human (T<sub>1</sub> ${fmt(t1h)} ms)`, human), ...tissueTraces(t1m, p, COLORS[1], `Mouse (T<sub>1</sub> ${fmt(t1m)} ms)`, mouse)],
          layout: irLayout({ legend: { x: 0.25, y: 0.99 }, xaxis: { range: [0, p.tr], autorange: false }, yaxis: yHeadroom }),
        });
        if (!human) {
          ctx.say(`The protocol’s ${p.tis.length} TIs on each tissue’s noiseless signal (general equation, TR = ${fmt(p.tr)} ms).`);
          return;
        }
        ctx.say(`<table class="measure">${HEADER}${row('Human', t1h, human)}${row('Mouse', t1m, mouse)}</table>`);
        ctx.slide.querySelector('.ans-ratio').textContent = fmt(mouse.cv / human.cv, 1);
        ctx.slide.querySelector('.ans-mouse').textContent = fmt(mouse.cv);
        ctx.slide.querySelector('.ans-human').textContent = fmt(human.cv);
      });
    },
  });

  // b. Step 0: the signal measured at TR = 1000 ms, with the TIs. Step 1: full recovery, dashed, and the
  //    signal ranges. Step 2: what a long-TR fit would report. Step 3: the arguments (markup).
  action('ex4-why', {
    run(ctx) {
      const { tr, tis } = HUMAN_PROTOCOL;
      return withQmRust(ctx, () => {
        const data = [];
        const rows = [HUMAN, MOUSE].map((t, i) => {
          const c = Q.curve({ t1: t.t1, tr, tiMax: tr - 1, n: 300, model: 'general', magnitude: true });
          const s = Q.signal({ t1: t.t1, tr, tis, model: 'general', magnitude: true });
          data.push({ x: c.ti, y: c.s, mode: 'lines', name: `${t.name}: TR 1000 ms`, line: { color: COLORS[i], width: 2.5 } });
          data.push({ x: tis, y: s, mode: 'markers', showlegend: false, marker: { color: COLORS[i], size: 10 } });
          if (ctx.step >= 1) {
            const full = Q.curve({ t1: t.t1, tr, tiMax: tr - 1, n: 300, model: 'longTR', magnitude: true });
            data.push({ x: full.ti, y: full.s, mode: 'lines', name: `${t.name}: full recovery`, line: { color: COLORS[i], width: 1.5, dash: 'dash' } });
          }
          const longTR = ctx.step >= 2 ? Q.monteCarlo({ t1: t.t1, tr, tis, snr: 100, trials: 300, seed: SEED, model: 'longTR' }) : null;
          return `<tr><td>${t.name.split(',')[0]}</td><td>${fmt(Math.exp(-tr / t.t1), 2)}</td><td>${fmt(Math.max(...s) - Math.min(...s), 2)}</td>${
            longTR ? `<td>${fmt(longTR.mean)} ms</td>` : ''}</tr>`;
        });
        ctx.plot({
          data,
          layout: irLayout({ legend: { x: 0.2, y: 0.99, font: { family: 'Times New Roman', size: 12 } }, xaxis: { range: [0, tr], autorange: false }, yaxis: yHeadroom }),
        });
        if (ctx.step < 1) {
          ctx.say(`The signal of human WM (<i>T</i><sub>1</sub> = ${fmt(HUMAN.t1)} ms) and mouse WM (<i>T</i><sub>1</sub> = ${fmt(MOUSE.t1)} ms) with the human protocol (TR = 1000 ms), and its four TIs.`);
          return;
        }
        ctx.say(`<table class="measure"><tr><th></th><th>e<sup>−TR/T<sub>1</sub></sup></th><th>Signal range</th>${
          ctx.step >= 2 ? '<th>Long-TR fit</th>' : ''}</tr>${rows.join('')}</table>`);
      });
    },
  });

  // c. Step 0: the human protocol on mouse WM (the baseline). Step 1: the protocol in the boxes,
  //    compared with it. Step 2: why it works (markup).
  action('ex4-proposed', {
    run(ctx) {
      const p = protocol(ctx, false);
      const t1m = ctx.num('t1mouse', 'Mouse WM T₁');
      const human = { ...HUMAN_PROTOCOL, snr: p.snr, trials: 500 };
      return withQmRust(ctx, () => {
        const before = Q.monteCarlo({ ...human, t1: t1m, seed: SEED });
        const after = ctx.step >= 1 ? Q.monteCarlo({ ...p, t1: t1m, seed: SEED }) : null;
        const data = tissueTraces(t1m, human, COLORS[1], 'Human protocol', before);
        if (after) data.push(...tissueTraces(t1m, p, COLORS[2], 'New protocol', after));
        ctx.plot({
          data,
          layout: irLayout({ legend: { x: 0.3, y: 0.99 }, xaxis: { range: [0, Math.max(after ? p.tr : 0, 1000)], autorange: false }, yaxis: yHeadroom }),
        });
        // Scan time per slice is proportional to TR × number of TIs; CV × √time compares equal-time precision.
        const eff = (q, mc) => mc.cv * Math.sqrt((q.tr * q.tis.length) / 1000);
        const line = (label, q, mc) =>
          `<tr><td>${label}</td><td>${fmt(mc.bias, 1)}%</td><td><b>${fmt(mc.cv, 1)}%</b></td><td>${fmt((q.tr * q.tis.length) / 1000, 1)} s</td><td>${fmt(eff(q, mc), 1)}</td></tr>`;
        ctx.say(`<table class="measure"><tr><th>Mouse WM</th><th>Bias</th><th>CV</th><th>Time*</th><th>CV·√time</th></tr>${
          line('Human', human, before)}${after ? line('New', p, after) : ''}</table>` +
          '<p class="footnote">* TR × number of TIs, per k-space line. Lower CV·√time means more precision for the same scan time.</p>');
      });
    },
  });
})();
