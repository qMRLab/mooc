/* Exercise 3: IR at 1.5 T with TR = 3 s. Every curve and fit is computed live by qmrust
 * and drawn in the style of the book's IR figures (irPlot1's template, fonts and axes).
 * Each action draws its slide up to ctx.step: data first, then the result, then the explanation. */
(function () {
  'use strict';
  const { action, bookLayout, axisTitles, COLORS, fmt, withQmRust } = window.T1Exercise;
  const S = window.T1Solve;
  const Q = window.QmRust;
  const range = (a, b, step) => Array.from({ length: Math.floor((b - a) / step) + 1 }, (_, i) => a + i * step);

  function irLayout(overrides) {
    return bookLayout('irPlot1', Object.assign({
      width: 580, height: 430,
      margin: { l: 90, r: 30, t: 10, b: 70 },
      annotations: axisTitles('Inversion Time – TI (ms)', 'Long. Magnetization (M<sub>z</sub>)', { xy: -0.16, yx: -0.15 }),
    }, overrides));
  }

  // a. Step 0: runs the notebook code on the slide (as loaded, it reproduces Figure 2.2).
  //    Step 1: the book's own 3 T curves, dashed. Step 2: the null times of the curves in the code.
  //    Times are in seconds here, as in the notebook.
  const TISSUE = { WM: 'White Matter', GM: 'Grey Matter', CSF: 'Cerebrospinal Fluid' };
  action('ex3-curves', {
    run(ctx) {
      const code = S.parseIrCode(ctx.slide.querySelector('[data-key="code"]').value);
      if (!code.ok) throw new window.T1Exercise.InputError(code.error);
      return withQmRust(ctx, () => {
        const { start, stop, n } = code.ti;
        const ti = Array.from({ length: n }, (_, i) => (start + ((stop - start) * i) / (n - 1)) * 1000);
        const data = code.curves.map((c, i) => {
          const s = Q.signal({ t1: c.t1 * 1000, tr: c.tr * 1000, tis: ti, model: c.longTR ? 'longTR' : 'general', magnitude: false });
          const label = `T<sub>1</sub> = ${fmt(c.t1, 2)} s (${TISSUE[c.name] || c.name})`;
          return { x: ti.map((t) => t / 1000), y: s.map((v) => v * c.constant), mode: 'lines', name: label, text: label,
            hoverinfo: 'x+y+text', line: { color: COLORS[i % COLORS.length], width: 2.5 } };
        });
        if (ctx.step >= 1) {
          window.T1Figures.irPlot1.data.forEach((tr, i) => {
            data.push({ x: tr.x, y: tr.y, mode: 'lines', name: `${tr.name.replace(/ \(.*/, '')}, book (3 T)`,
              line: { color: COLORS[i], width: 1.5, dash: 'dash' }, opacity: 0.7, hoverinfo: 'skip' });
          });
        }
        let nulls = [];
        if (ctx.step >= 2) {
          nulls = code.curves.map((c) => ({ name: c.name, t: c.longTR ? S.irNullLongTR(c.t1) : S.irNullGeneral(c.t1, c.tr) }));
          data.push({ x: nulls.map((x) => x.t), y: nulls.map(() => 0), mode: 'markers+text', name: 'Null times', text: nulls.map((x) => x.name),
            textposition: 'top left', textfont: { family: 'Times New Roman', size: 15 }, marker: { size: 12, color: 'black', symbol: 'x' } });
        }
        // The book's own figure layout.
        ctx.plot({ data, layout: bookLayout('irPlot1', {}) });
        ctx.say(nulls.length
          ? `<p class="answer">Null times (<i>TI</i><sub>null</sub> = <i>T</i><sub>1</sub> ln 2): ${nulls.map((x) => `${x.name} <b>${fmt(x.t * 1000)} ms</b>`).join(', ')}.</p>`
          : '');
      });
    },
  });

  // b. Step 0: general-equation data at TR. Step 1: the long-TR fit. Step 2: the general fit.
  //    Step 3: the long-TR fit at both field strengths, and the conclusion.
  action('ex3-longtr', {
    run(ctx) {
      const t1 = ctx.num('t1', 'WM T₁');
      const tr = ctx.num('tr', 'TR');
      return withQmRust(ctx, () => {
        const tis = range(50, Math.min(1500, tr - 50), 50);
        const signal = Q.signal({ t1, tr, tis, model: 'general', magnitude: true });
        // Each fitted model as qmrust parameterizes it, |a + b·e^(−TI/T1)|, evaluated on a fine grid.
        const curve = (f) => {
          const x = range(0, tis[tis.length - 1], 5);
          return { x, y: x.map((ti) => Math.abs(f.a + f.b * Math.exp(-ti / f.t1))) };
        };
        const data = [{ x: tis, y: signal, mode: 'markers', name: `Simulated data (Eq. 2.2), T<sub>1</sub> = ${fmt(t1)} ms`, marker: { size: 8, color: 'black' } }];
        const lines = [`Data from the general equation (Eq. 2.2), WM <i>T</i><sub>1</sub> = ${fmt(t1)} ms, TR = ${fmt(tr)} ms.`];
        if (ctx.step >= 1) {
          const longTR = Q.fit({ tis, signal, model: 'longTR' });
          data.push({ ...curve(longTR), mode: 'lines', name: `[C(1-2e<sup>-TI/T<sub>1</sub></sup>)] Fitted T<sub>1</sub>: <b>${fmt(longTR.t1)} ms</b>`, line: { color: COLORS[0], width: 2.5 } });
          lines.push(`Long-TR fit: <b>${fmt(longTR.t1)} ms</b> (${fmt((longTR.t1 / t1 - 1) * 100, 1)}%).`);
        }
        if (ctx.step >= 2) {
          const general = Q.fit({ tis, signal, model: 'general' });
          data.push({ ...curve(general), mode: 'lines', name: `[a+be<sup>-TI/T<sub>1</sub></sup>] Fitted T<sub>1</sub>: <b>${fmt(general.t1)} ms</b>`, line: { color: COLORS[1], width: 2, dash: 'dot' } });
          lines.push(`General fit: <b>${fmt(general.t1)} ms</b>.`);
        }
        ctx.plot({
          data,
          layout: irLayout({
            annotations: axisTitles('Inversion Time – TI (ms)', 'Signal (magnitude)', { xy: -0.16, yx: -0.15 }),
            legend: { x: 0.3, y: 0.08, font: { family: 'Times New Roman', size: 13 } },
          }),
        });
        if (ctx.step < 3) { ctx.say(lines.join(' ')); return; }
        const rows = [[650, '1.5 T'], [900, '3 T']].map(([t, field]) => {
          const f = Q.fit({ tis, signal: Q.signal({ t1: t, tr, tis, model: 'general', magnitude: true }), model: 'longTR' });
          return { field, t, fit: f.t1, err: (f.t1 / t - 1) * 100, e: Math.exp(-tr / t) };
        });
        ctx.say(`<table class="measure"><tr><th>TR ${fmt(tr)} ms</th><th>True</th><th>Long-TR fit</th><th>Error</th><th>e<sup>−TR/T<sub>1</sub></sup></th></tr>${
          rows.map((r) => `<tr><td>WM, ${r.field}</td><td>${fmt(r.t)}</td><td>${fmt(r.fit)}</td><td><b>${fmt(r.err, 1)}%</b></td><td>${fmt(r.e, 3)}</td></tr>`).join('')
        }</table><p class="answer">Usable at 1.5 T (${fmt(rows[0].err, 1)}%), but biased at 3 T (${fmt(rows[1].err, 1)}%): the long-TR model drops e<sup>−TR/T<sub>1</sub></sup>, which grows as TR/<i>T</i><sub>1</sub> shrinks.</p>`);
      });
    },
  });

  // c. Figure 2.6 as the book publishes it: Monte Carlo fits for T1 = 900 ms, six TIs spread linearly
  //    up to TR. Step 1: its slider moved to the TR where the second TI (TR/5) lands on the null, with
  //    that TI and the jump in the STD of the fitted T1 marked. Step 2: the answer (markup).
  const FIG26 = { t1: 900, tr: 2900 };
  action('ex3-null', {
    run(ctx) {
      ctx.slide.querySelector('.ans-null').textContent = fmt(S.irNullGeneral(650, 3000));
      if (!ctx.bookPlot()) return;
      ctx.restoreBookFigure();
      if (ctx.step < 1) return;
      const gd = ctx.bookPlot();
      const slider = gd.layout.sliders[0];
      const k = slider.steps.findIndex((st) => Number(st.label) === FIG26.tr);
      window.Plotly.restyle(gd, ...slider.steps[k].args);
      window.Plotly.relayout(gd, { 'sliders[0].active': k });
      // Traces come in groups of one per slider step: noiseless curve, Monte Carlo points, mean T1, STD T1.
      const curve = gd.data[k];
      const stdTrace = gd.data[3 * slider.steps.length + k];
      const ti = FIG26.tr / 5;
      const near = Array.from(curve.x).reduce((b, x, i) => (Math.abs(x - ti) < Math.abs(curve.x[b] - ti) ? i : b), 0);
      const tr = Array.from(stdTrace.x);
      const std = (r) => stdTrace.y[tr.indexOf(r)];
      const around = [2200, 2300, 2400, 3000, 3100, 3200, 3300].map(std);
      const ring = { size: 22, color: 'rgba(0,0,0,0)', line: { color: 'black', width: 2.5 } };
      window.Plotly.addTraces(gd, [
        { x: [ti], y: [curve.y[near]], mode: 'markers', marker: ring, name: `TI = ${fmt(ti)} ms ≈ null (${fmt(S.irNullGeneral(FIG26.t1, FIG26.tr))} ms)`, hoverinfo: 'name' },
        { x: [FIG26.tr], y: [std(FIG26.tr)], xaxis: 'x2', yaxis: 'y3', mode: 'markers', marker: ring, showlegend: false, hoverinfo: 'x+y' },
      ]);
      ctx.say(`At TR = ${fmt(FIG26.tr)} ms the second TI (${fmt(ti)} ms) lands on the null of <i>T</i><sub>1</sub> = ${fmt(FIG26.t1)} ms: ` +
        `the STD of the fitted <i>T</i><sub>1</sub> jumps to <b>${fmt(std(FIG26.tr))} ms</b>, against ≈ ${fmt(around.reduce((a, b) => a + b) / around.length)} ms for nearby TRs.`);
    },
    undo(ctx) { ctx.restoreBookFigure(); },
  });
})();
