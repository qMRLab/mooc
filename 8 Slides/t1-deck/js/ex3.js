/* Exercise 3: IR at 1.5 T with TR = 3 s. Every curve and fit is computed live by qmrust
 * and drawn in the style of the book's IR figures (irPlot1's template, fonts and axes).
 * Each action draws its slide up to ctx.step: data first, then the result, then the explanation. */
(function () {
  'use strict';
  const { action, bookLayout, axisTitles, COLORS, fmt, withQmRust } = window.T1Exercise;
  const S = window.T1Solve;
  const Q = window.QmRust;
  const CAUTION = '#b45309';
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
        // The book's own figure layout; only the x-axis title is corrected to seconds.
        const layout = bookLayout('irPlot1', {});
        layout.annotations[0].text = 'Inversion Time – TI (s)';
        ctx.plot({ data, layout });
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

  // c. Which TIs affect the fitted T1 the most. Step 0: the data (general equation, magnitude) at TIs
  //    every 100 ms. Step 1: add a small error to one TI at a time, refit with the long-TR model, and
  //    plot how far T1 moves (bottom panel). Step 2: shade the most sensitive TIs. Step 3: why (markup).
  action('ex3-sensitivity', {
    run(ctx) {
      const t1 = ctx.num('t1', 'WM T₁');
      const tr = ctx.num('tr', 'TR');
      const err = ctx.num('err', 'Signal error') / 100;
      return withQmRust(ctx, () => {
        const tis = range(100, tr - 100, 100);
        const signal = Q.signal({ t1, tr, tis, model: 'general', magnitude: true });
        const curve = Q.curve({ t1, tr, tiMax: tr - 1, n: 601, model: 'general', magnitude: true });
        const data = [
          { x: curve.ti, y: curve.s, mode: 'lines', name: 'Signal (Eq. 2.2)', line: { color: COLORS[1], width: 2 }, hoverinfo: 'skip' },
          { x: tis, y: signal, mode: 'markers', name: 'Protocol TIs', marker: { size: 7, color: 'black' } },
        ];
        const nullG = S.irNullGeneral(t1, tr);
        const two = ctx.step >= 1;
        let shift = [];
        let zone = null;
        if (two) {
          const base = Q.fit({ tis, signal, model: 'longTR' }).t1;
          shift = tis.map((t, i) => {
            const s2 = signal.slice();
            s2[i] += err;
            return Math.abs(Q.fit({ tis, signal: s2, model: 'longTR' }).t1 - base);
          });
          data.push({ x: tis, y: shift, type: 'bar', name: `|ΔT<sub>1</sub>| for a ${fmt(err * 100, 1)}% error at that TI`,
            marker: { color: COLORS[0] }, xaxis: 'x', yaxis: 'y2', width: 70 });
          if (ctx.step >= 2) {
            const top = Math.max(...shift);
            const hot = tis.filter((t, i) => shift[i] >= top / 2);
            zone = [hot[0], hot[hot.length - 1]];
          }
        }
        const font = { family: 'Times New Roman', size: 20 };
        const layout = bookLayout('irPlot1', {
          width: 580, height: 470,
          margin: { l: 90, r: 30, t: 10, b: 70 },
          legend: { x: 0.42, y: two ? 0.62 : 0.3, font: { family: 'Times New Roman', size: 12 } },
          xaxis: { range: [0, tr], autorange: false, anchor: two ? 'y2' : 'y' },
          yaxis: { range: [0, 1.05], autorange: false, domain: two ? [0.5, 1] : [0, 1] },
          annotations: [
            { font, showarrow: false, text: 'Inversion Time – TI (ms)', x: 0.5, xref: 'paper', y: -0.14, yref: 'paper' },
            { font, showarrow: false, text: 'Signal', textangle: -90, x: -0.14, xref: 'paper', y: two ? 0.77 : 0.5, yref: 'paper' },
            ...(two ? [{ font, showarrow: false, text: '|ΔT<sub>1</sub>| (ms)', textangle: -90, x: -0.14, xref: 'paper', y: 0.2, yref: 'paper' }] : []),
          ],
          shapes: [
            { type: 'line', xref: 'x', yref: 'paper', x0: nullG, x1: nullG, y0: 0, y1: 1, line: { color: CAUTION, dash: 'dot', width: 1.5 } },
            ...(zone ? [{ type: 'rect', xref: 'x', yref: 'paper', x0: zone[0] - 50, x1: zone[1] + 50, y0: 0, y1: 1, fillcolor: CAUTION, opacity: 0.13, line: { width: 0 } }] : []),
          ],
        });
        if (two) layout.yaxis2 = { domain: [0, 0.4], linecolor: 'black', linewidth: 2, showgrid: false, rangemode: 'tozero' };
        ctx.plot({ data, layout });
        if (!two) {
          ctx.say(`The data: WM, <i>T</i><sub>1</sub> = ${fmt(t1)} ms, TR = ${fmt(tr)} ms, a TI every 100 ms. Null (dotted) at ${fmt(nullG)} ms.`);
        } else if (!zone) {
          ctx.say(`Each bar: how far the long-TR fit of <i>T</i><sub>1</sub> moves when only that TI’s signal is off by ${fmt(err * 100, 1)}%.`);
        } else {
          ctx.say(`An error at TIs from <b>${fmt(zone[0])}</b> to <b>${fmt(zone[1])} ms</b> (shaded, up to ≈ ${fmt(zone[1] / t1, 1)} <i>T</i><sub>1</sub>) moves <i>T</i><sub>1</sub> the most, peaking around the null (${fmt(nullG)} ms).`);
        }
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
