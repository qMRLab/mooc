/* Exercise 1: IR null times and WM/GM contrast, worked on the book's Figure 2.2 (irPlot1).
 * Figure 2.2's x values are in seconds; its traces are WM (0.9 s), GM (1.5 s), CSF (4.0 s).
 * Each action draws its slide up to ctx.step: data first, then the result, then the proof. */
(function () {
  'use strict';
  const { action, bookLayout, axisTitles, COLORS, fmt } = window.T1Exercise;
  const S = window.T1Solve;
  const T1_WM = 900;
  const T1_GM = 1500;
  const marker = (x, y, name) => ({
    x: [x], y: [y], mode: 'markers', name, marker: { size: 13, color: 'black', symbol: 'x' }, hoverinfo: 'name',
  });

  // b. Step 1: the readings against T1. Step 2: the fit through the origin and its slope.
  //    Step 3: the proof from Eq. 2.3 (an answer box in the markup; the figure stays as in step 2).
  action('ex1-fit', {
    run(ctx) {
      const t1 = [ctx.num('t1wm', 'WM T₁'), ctx.num('t1gm', 'GM T₁'), ctx.num('t1csf', 'CSF T₁')];
      const ti = [ctx.num('wm', 'WM null TI'), ctx.num('gm', 'GM null TI'), ctx.num('csf', 'CSF null TI')];
      const xMax = Math.max(...t1) * 1.15;
      const data = [
        { x: t1, y: ti, mode: 'markers+text', name: 'Read from Figure 2.2', marker: { size: 12, color: COLORS[0] },
          text: ['WM', 'GM', 'CSF'], textposition: 'top left', textfont: { family: 'Times New Roman', size: 16 }, hoverinfo: 'x+y' },
      ];
      let fit = null;
      if (ctx.step >= 2) {
        fit = S.fitThroughOrigin(t1, ti);
        if (!fit.ok) throw new window.T1Exercise.InputError(fit.error);
        data.push({ x: [0, xMax], y: [0, fit.k * xMax], mode: 'lines', name: `Fit: TI<sub>null</sub> = ${fmt(fit.k, 3)} T<sub>1</sub>`,
          line: { color: COLORS[1], width: 2 } });
      }
      ctx.plot({
        data,
        layout: bookLayout('irPlot1', {
          width: 560, height: 430,
          margin: { l: 100, r: 30, t: 10, b: 70 },
          annotations: axisTitles('T<sub>1</sub> (ms)', 'Null TI (ms)', { xy: -0.16, yx: -0.2 }),
          legend: { x: 0.03, y: 0.97 },
          showlegend: true,
          xaxis: { range: [0, xMax] },
          yaxis: { range: [0, Math.max(...ti) * 1.15] },
        }),
      });
      ctx.say(fit
        ? `Least-squares line through the origin: slope <b>k = ${fmt(fit.k, 3)}</b> (R² = ${fmt(fit.r2, 4)}).`
        : 'The three points fall on a straight line through the origin.');
    },
  });

  // The book figure on this slide redrawn as magnitude images show it, |Mz|. Returns the plot.
  function showMagnitude(ctx) {
    ctx.restoreBookFigure();
    const gd = ctx.bookPlot();
    window.Plotly.restyle(gd, { y: gd.data.slice(0, 3).map((t) => t.y.map(Math.abs)) }, [0, 1, 2]);
    window.Plotly.relayout(gd, { 'annotations[1].text': '|M<sub>z</sub>| (magnitude)' });
    return gd;
  }

  // c. Step 1: the book's data as magnitude, |Mz|. Step 2: where |Mz(WM)| = |Mz(GM)|.
  action('ex1-magnitude', {
    run(ctx) {
      const ti = S.irMagnitudeCrossing(T1_WM, T1_GM);
      ctx.slide.querySelector('.ans-crossing').textContent = fmt(ti);
      if (!ctx.bookPlot()) return;
      const gd = showMagnitude(ctx);
      if (ctx.step >= 2) {
        window.Plotly.addTraces(gd, marker(ti / 1000, Math.abs(S.irLongTR(ti, T1_WM)), `|WM| = |GM| at ${fmt(ti)} ms`));
      }
    },
    undo(ctx) { ctx.restoreBookFigure(); },
  });

  // d. Step 0 (on opening): the book figure as magnitude, as in c. Step 1: the WM/GM contrast,
  //    ||Mz(WM)| − |Mz(GM)||, from the book's own traces. Step 2: its maximum. Step 3: the proof (markup).
  action('ex1-difference', {
    run(ctx) {
      const best = S.irMaxContrastTI(T1_WM, T1_GM);
      ctx.slide.querySelector('.ans-best').textContent = fmt(best);
      if (!ctx.bookPlot()) return;
      const gd = showMagnitude(ctx);
      if (ctx.step < 1) return;
      const [wm, gm] = gd.data;
      window.Plotly.addTraces(gd, {
        x: wm.x, y: wm.y.map((v, i) => Math.abs(v - gm.y[i])), mode: 'lines', name: 'Contrast: ||WM| − |GM||',
        line: { color: 'black', dash: 'dash', width: 2 }, hoverinfo: 'x+y+name',
      });
      if (ctx.step >= 2) {
        window.Plotly.addTraces(gd, marker(best / 1000, S.irLongTR(best, T1_WM) - S.irLongTR(best, T1_GM), `Maximum at ${fmt(best)} ms`));
      }
    },
  });
})();
