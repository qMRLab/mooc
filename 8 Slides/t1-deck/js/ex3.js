/* Exercise 3: IR at 1.5 T with TR = 3 s. Every curve and fit is computed live by qmrust
 * and drawn in the style of the book's IR figures (irPlot1's template, fonts and axes). */
(function () {
  'use strict';
  const { action, bookLayout, axisTitles, COLORS, fmt, withQmRust } = window.T1Exercise;
  const S = window.T1Solve;
  const Q = window.QmRust;
  const NAMES = ['White Matter', 'Grey Matter', 'Cerebrospinal Fluid'];
  const range = (a, b, step) => Array.from({ length: Math.floor((b - a) / step) + 1 }, (_, i) => a + i * step);

  function irLayout(overrides) {
    return bookLayout('irPlot1', Object.assign({
      width: 580, height: 430,
      margin: { l: 90, r: 30, t: 10, b: 70 },
      annotations: axisTitles('Inversion Time – TI (ms)', 'Long. Magnetization (M<sub>z</sub>)', { xy: -0.16, yx: -0.15 }),
    }, overrides));
  }

  // a. Figure 2.2 (Eq. 2.3) at 1.5 T, with the book's 3 T curves dashed for comparison.
  action('ex3-curves', {
    run(ctx) {
      const t1 = [ctx.num('wm', 'WM T₁'), ctx.num('gm', 'GM T₁'), ctx.num('csf', 'CSF T₁')];
      return withQmRust(ctx, () => {
        const book = window.T1Figures.irPlot1.data;
        const data = [];
        t1.forEach((t, i) => {
          const c = Q.curve({ t1: t, tiMax: 5000, n: 501, model: 'longTR', magnitude: false });
          data.push({ x: c.ti, y: c.s, mode: 'lines', name: `T<sub>1</sub> = ${fmt(t / 1000, 2)} s (${NAMES[i]}), 1.5 T`,
            line: { color: COLORS[i], width: 2.5 } });
        });
        book.forEach((tr, i) => {
          data.push({ x: tr.x.map((s) => s * 1000), y: tr.y, mode: 'lines', name: `${tr.name.replace(/ \(.*/, '')}, 3 T (book)`,
            line: { color: COLORS[i], width: 1.5, dash: 'dash' }, opacity: 0.7, hoverinfo: 'skip' });
        });
        ctx.plot({ data, layout: irLayout({ legend: { x: 0.42, y: 0.05, font: { family: 'Times New Roman', size: 12 } } }) });
        ctx.say('');
        const nulls = ctx.slide.querySelector('.ans-nulls');
        if (nulls) nulls.textContent = t1.map((t, i) => `${['WM', 'GM', 'CSF'][i]} ${fmt(S.irNullLongTR(t))} ms`).join(', ');
      });
    },
  });

  action('ex3-nulls', {
    run(ctx) {
      const t1 = [ctx.num('wm', 'WM T₁'), ctx.num('gm', 'GM T₁'), ctx.num('csf', 'CSF T₁')];
      ctx.slide.querySelector('.ans-nulls').textContent =
        t1.map((t, i) => `${['WM', 'GM', 'CSF'][i]} ${fmt(S.irNullLongTR(t))} ms`).join(', ');
    },
    undo() {},
  });

  // b. As Figure 2.4: general-equation data at the chosen TR, fitted with the long-TR and general models.
  action('ex3-longtr', {
    run(ctx) {
      const t1 = ctx.num('t1', 'WM T₁');
      const tr = ctx.num('tr', 'TR');
      return withQmRust(ctx, () => {
        const tis = range(50, Math.min(1500, tr - 50), 50);
        const signal = Q.signal({ t1, tr, tis, model: 'general', magnitude: true });
        const longTR = Q.fit({ tis, signal, model: 'longTR' });
        const general = Q.fit({ tis, signal, model: 'general' });
        // Each fitted model as qmrust parameterizes it, |a + b·e^(−TI/T1)|, evaluated on a fine grid.
        const curve = (f) => {
          const x = range(0, tis[tis.length - 1], 5);
          return { x, y: x.map((ti) => Math.abs(f.a + f.b * Math.exp(-ti / f.t1))) };
        };
        ctx.plot({
          data: [
            { x: tis, y: signal, mode: 'markers', name: 'Simulated data (Eq. 2.2)', marker: { size: 8, color: 'black' } },
            { ...curve(longTR), mode: 'lines', name: `[C(1-2e<sup>-TI/T<sub>1</sub></sup>)] Fitted T<sub>1</sub>: <b>${fmt(longTR.t1)} ms</b>`, line: { color: COLORS[0], width: 2.5 } },
            { ...curve(general), mode: 'lines', name: `[a+be<sup>-TI/T<sub>1</sub></sup>] Fitted T<sub>1</sub>: <b>${fmt(general.t1)} ms</b>`, line: { color: COLORS[1], width: 2, dash: 'dot' } },
          ],
          layout: irLayout({
            annotations: axisTitles('Inversion Time – TI (ms)', 'Signal (magnitude)', { xy: -0.16, yx: -0.15 }),
            legend: { x: 0.3, y: 0.08, font: { family: 'Times New Roman', size: 13 } },
          }),
        });
        // The same fit for WM at both field strengths, at this TR.
        const rows = [[650, '1.5 T'], [900, '3 T']].map(([t, field]) => {
          const s = Q.signal({ t1: t, tr, tis, model: 'general', magnitude: true });
          const f = Q.fit({ tis, signal: s, model: 'longTR' });
          return `<tr><td>WM, ${field}</td><td>${fmt(t)}</td><td>${fmt(f.t1)}</td><td><b>${fmt((f.t1 / t - 1) * 100, 1)}%</b></td><td>${fmt(Math.exp(-tr / t), 3)}</td></tr>`;
        });
        ctx.say(`<table class="measure"><tr><th>TR ${fmt(tr)} ms</th><th>True</th><th>Long-TR fit</th><th>Error</th><th>e<sup>−TR/T<sub>1</sub></sup></th></tr>${rows.join('')}</table>`);
      });
    },
  });

  // c. As Figure 2.3: the measured signal (general equation) against the long-TR model, in magnitude.
  action('ex3-models', {
    run(ctx) {
      const t1 = ctx.num('t1', 'WM T₁');
      const tr = ctx.num('tr', 'TR');
      return withQmRust(ctx, () => {
        const tiMax = tr - 1;
        const general = Q.curve({ t1, tr, tiMax, n: 601, model: 'general', magnitude: true });
        const longTR = Q.curve({ t1, tr, tiMax, n: 601, model: 'longTR', magnitude: true });
        const nullG = S.irNullGeneral(t1, tr);
        const nullL = S.irNullLongTR(t1);
        ctx.plot({
          data: [
            { x: longTR.ti, y: longTR.s, mode: 'lines', name: '[Eq. 2.3] – Long TR approximation', line: { color: COLORS[0], width: 2.5 } },
            { x: general.ti, y: general.s, mode: 'lines', name: '[Eq. 2.2] – General Equation', line: { color: COLORS[1], width: 2.5, dash: 'dash' } },
          ],
          layout: irLayout({
            annotations: axisTitles('Inversion Time – TI (ms)', 'Signal (magnitude)', { xy: -0.16, yx: -0.15 }),
            legend: { x: 0.4, y: 0.35 },
            xaxis: { range: [0, tr], autorange: false },
            yaxis: { range: [0, 1.05], autorange: false },
            shapes: [{ type: 'rect', xref: 'x', yref: 'paper', x0: nullG - 150, x1: nullL + 150, y0: 0, y1: 1,
              fillcolor: '#b45309', opacity: 0.12, line: { width: 0 } }],
          }),
        });
        ctx.say(`Nulls: <b>${fmt(nullG)} ms</b> (measured) vs <b>${fmt(nullL)} ms</b> (model). The curves differ by e<sup>−TR/T<sub>1</sub></sup> = ${fmt(Math.exp(-tr / t1), 3)} everywhere: a large <i>relative</i> error where the signal is small (shaded).`);
      });
    },
  });

  // c. Long-TR fit error for 3 TIs (centre ± 100 ms) as the centre moves along the recovery.
  action('ex3-windows', {
    run(ctx) {
      const t1 = 650;
      const tr = 3000;
      return withQmRust(ctx, () => {
        const centres = range(150, tr - 150, 25);
        const err = centres.map((c) => {
          const tis = [c - 100, c, c + 100];
          const f = Q.fit({ tis, signal: Q.signal({ t1, tr, tis, model: 'general' }), model: 'longTR' });
          return (f.t1 / t1 - 1) * 100;
        });
        const CLIP = 40;
        const ok = err.map((e) => (Math.abs(e) <= CLIP ? e : null));
        const failed = centres.filter((c, i) => Math.abs(err[i]) > CLIP);
        ctx.plot({
          data: [
            { x: centres, y: ok, mode: 'lines+markers', name: 'Long-TR fit error', line: { color: COLORS[0], width: 2 }, marker: { size: 5 }, connectgaps: false },
            { x: failed, y: failed.map(() => CLIP), mode: 'markers', name: `Fit fails (error beyond ±${CLIP}%)`, marker: { color: '#b45309', symbol: 'triangle-up', size: 8 } },
            { x: [0, tr], y: [-1.7, -1.7], mode: 'lines', name: 'Spread-out protocol (part b)', line: { color: 'black', dash: 'dot', width: 1.5 } },
          ],
          layout: irLayout({
            annotations: axisTitles('Centre of the 3 TIs (ms)', 'T<sub>1</sub> error (%)', { xy: -0.16, yx: -0.13 }),
            legend: { x: 0.4, y: 0.25 },
            xaxis: { range: [0, tr], autorange: false },
            yaxis: { range: [-CLIP - 5, CLIP + 5], autorange: false, zeroline: true },
            shapes: [{ type: 'line', xref: 'x', yref: 'paper', x0: S.irNullGeneral(t1, tr), x1: S.irNullGeneral(t1, tr), y0: 0, y1: 1, line: { color: '#b45309', dash: 'dash', width: 1.5 } }],
          }),
        });
        const nearNull = err.filter((e, i) => centres[i] < 1000 && Math.abs(e) <= CLIP);
        const plateau = failed.find((c) => c > 2 * S.irNullGeneral(t1, tr));
        ctx.say(`Near the null (dashed) the error swings from <b>${fmt(Math.min(...nearNull))}%</b> to <b>+${fmt(Math.max(...nearNull))}%</b>` +
          (plateau ? `; from about <b>${fmt(plateau)} ms</b> on, the fit fails.` : '.'));
      });
    },
  });

  action('ex3-avoid', { run() {}, undo() {} });
})();
