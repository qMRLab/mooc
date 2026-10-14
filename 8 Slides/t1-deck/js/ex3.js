/* Exercise 3: IR at 1.5 T with TR = 3 s. Every curve and fit is computed live by qmrust
 * and drawn in the style of the book's IR figures (irPlot1's template, fonts and axes).
 * Each action draws its slide up to ctx.step: data first, then the result, then the explanation. */
(function () {
  'use strict';
  const { action, bookLayout, axisTitles, COLORS, fmt, withQmRust } = window.T1Exercise;
  const S = window.T1Solve;
  const Q = window.QmRust;
  const NAMES = ['White Matter', 'Grey Matter', 'Cerebrospinal Fluid'];
  const SHORT = ['WM', 'GM', 'CSF'];
  const CAUTION = '#b45309';
  const range = (a, b, step) => Array.from({ length: Math.floor((b - a) / step) + 1 }, (_, i) => a + i * step);

  function irLayout(overrides) {
    return bookLayout('irPlot1', Object.assign({
      width: 580, height: 430,
      margin: { l: 90, r: 30, t: 10, b: 70 },
      annotations: axisTitles('Inversion Time – TI (ms)', 'Long. Magnetization (M<sub>z</sub>)', { xy: -0.16, yx: -0.15 }),
    }, overrides));
  }

  // a. Step 0: Figure 2.2 (Eq. 2.3) at 1.5 T. Step 1: the book's 3 T curves, dashed. Step 2: the null times.
  action('ex3-curves', {
    run(ctx) {
      const t1 = [ctx.num('wm', 'WM T₁'), ctx.num('gm', 'GM T₁'), ctx.num('csf', 'CSF T₁')];
      return withQmRust(ctx, () => {
        const data = t1.map((t, i) => {
          const c = Q.curve({ t1: t, tiMax: 5000, n: 501, model: 'longTR', magnitude: false });
          return { x: c.ti, y: c.s, mode: 'lines', name: `T<sub>1</sub> = ${fmt(t / 1000, 2)} s (${NAMES[i]}), 1.5 T`,
            line: { color: COLORS[i], width: 2.5 } };
        });
        if (ctx.step >= 1) {
          window.T1Figures.irPlot1.data.forEach((tr, i) => {
            data.push({ x: tr.x.map((s) => s * 1000), y: tr.y, mode: 'lines', name: `${tr.name.replace(/ \(.*/, '')}, 3 T (book)`,
              line: { color: COLORS[i], width: 1.5, dash: 'dash' }, opacity: 0.7, hoverinfo: 'skip' });
          });
        }
        if (ctx.step >= 2) {
          const nulls = t1.map((t) => S.irNullLongTR(t));
          data.push({ x: nulls, y: nulls.map(() => 0), mode: 'markers+text', name: 'Null times, 1.5 T', text: SHORT,
            textposition: 'top left', textfont: { family: 'Times New Roman', size: 15 },
            marker: { size: 12, color: 'black', symbol: 'x' } });
          ctx.slide.querySelector('.ans-nulls').textContent =
            nulls.map((n, i) => `${SHORT[i]} ${fmt(n)} ms`).join(', ');
        }
        ctx.plot({ data, layout: irLayout({ legend: { x: 0.42, y: 0.05, font: { family: 'Times New Roman', size: 12 } } }) });
        ctx.say(ctx.step >= 1 ? '' : 'Figure 2.2 recomputed by qmrust for the 1.5 T values.');
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

  // c. Step 0: the measured signal (general equation), as Figure 2.3. Step 1: the long-TR model.
  //    Step 2: where their difference matters, around the null.
  action('ex3-models', {
    run(ctx) {
      const t1 = ctx.num('t1', 'WM T₁');
      const tr = ctx.num('tr', 'TR');
      return withQmRust(ctx, () => {
        const general = Q.curve({ t1, tr, tiMax: tr - 1, n: 601, model: 'general', magnitude: true });
        const data = [{ x: general.ti, y: general.s, mode: 'lines', name: '[Eq. 2.2] – General Equation (measured)', line: { color: COLORS[1], width: 2.5, dash: 'dash' } }];
        if (ctx.step >= 1) {
          const longTR = Q.curve({ t1, tr, tiMax: tr - 1, n: 601, model: 'longTR', magnitude: true });
          data.unshift({ x: longTR.ti, y: longTR.s, mode: 'lines', name: '[Eq. 2.3] – Long TR approximation (fitted)', line: { color: COLORS[0], width: 2.5 } });
        }
        const nullG = S.irNullGeneral(t1, tr);
        const nullL = S.irNullLongTR(t1);
        const shapes = ctx.step >= 2
          ? [{ type: 'rect', xref: 'x', yref: 'paper', x0: nullG - 150, x1: nullL + 150, y0: 0, y1: 1, fillcolor: CAUTION, opacity: 0.12, line: { width: 0 } }]
          : [];
        ctx.plot({
          data,
          layout: irLayout({
            annotations: axisTitles('Inversion Time – TI (ms)', 'Signal (magnitude)', { xy: -0.16, yx: -0.15 }),
            legend: { x: 0.35, y: 0.35 },
            showlegend: true,
            xaxis: { range: [0, tr], autorange: false },
            yaxis: { range: [0, 1.05], autorange: false },
            shapes,
          }),
        });
        const say = [
          `What the scanner measures: WM, <i>T</i><sub>1</sub> = ${fmt(t1)} ms, TR = ${fmt(tr)} ms.`,
          `The long-TR model is off by e<sup>−TR/T<sub>1</sub></sup> = ${fmt(Math.exp(-tr / t1), 3)} everywhere.`,
          `That offset is a large <i>relative</i> error where the signal is small, around the nulls (shaded): <b>${fmt(nullG)} ms</b> measured vs <b>${fmt(nullL)} ms</b> in the model.`,
        ];
        ctx.say(say.slice(0, ctx.step + 1).join(' '));
      });
    },
  });

  // c. Step 1: long-TR fit error for 3 TIs (centre ± 100 ms) as the centre moves along the recovery.
  //    Step 2: the problem zones marked. Step 3: the answer (markup).
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
        const failed = centres.filter((c, i) => Math.abs(err[i]) > CLIP);
        const data = [
          { x: centres, y: err.map((e) => (Math.abs(e) <= CLIP ? e : null)), mode: 'lines+markers', name: 'Long-TR fit error',
            line: { color: COLORS[0], width: 2 }, marker: { size: 5 }, connectgaps: false },
        ];
        const nullG = S.irNullGeneral(t1, tr);
        let shapes = [];
        if (ctx.step >= 2) {
          data.push({ x: failed, y: failed.map(() => CLIP), mode: 'markers', name: `Fit fails (error beyond ±${CLIP}%)`, marker: { color: CAUTION, symbol: 'triangle-up', size: 8 } });
          data.push({ x: [0, tr], y: [-1.7, -1.7], mode: 'lines', name: 'Spread-out protocol (part b)', line: { color: 'black', dash: 'dot', width: 1.5 } });
          shapes = [{ type: 'line', xref: 'x', yref: 'paper', x0: nullG, x1: nullG, y0: 0, y1: 1, line: { color: CAUTION, dash: 'dash', width: 1.5 } }];
        }
        ctx.plot({
          data,
          layout: irLayout({
            annotations: axisTitles('Centre of the 3 TIs (ms)', 'T<sub>1</sub> error (%)', { xy: -0.16, yx: -0.13 }),
            legend: { x: 0.4, y: 0.25 },
            showlegend: true,
            xaxis: { range: [0, tr], autorange: false },
            yaxis: { range: [-CLIP - 5, CLIP + 5], autorange: false, zeroline: true },
            shapes,
          }),
        });
        if (ctx.step < 2) { ctx.say('Where does the error jump?'); return; }
        const nearNull = err.filter((e, i) => centres[i] < 1000 && Math.abs(e) <= CLIP);
        const plateau = failed.find((c) => c > 2 * nullG);
        ctx.say(`Around the null (dashed, ${fmt(nullG)} ms) the error swings from <b>${fmt(Math.min(...nearNull))}%</b> to <b>+${fmt(Math.max(...nearNull))}%</b>` +
          (plateau ? `; from about <b>${fmt(plateau)} ms</b> on (≈ ${fmt(plateau / t1, 1)} <i>T</i><sub>1</sub>), the fit fails.` : '.'));
      });
    },
  });
})();
