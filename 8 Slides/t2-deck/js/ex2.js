/* Exercise 2: reading MW and IEW decay times off the book's Figure 3.5 (t2Plot4), and the mono-exponential
 * fit of a 50/50 voxel. Figure 3.5's traces: MW (T2 19.0 ms), IEW (T2 121.4 ms), and their mix, which
 * its slider sets in 5% steps. Times in ms.
 * Each action draws its slide up to ctx.step: data first, then the result, then the explanation. */
(function () {
  'use strict';
  const { action, fmt } = window.T2Exercise;
  const S = window.T2Solve;
  const MW = 0;
  const IEW = 1;
  const MIX = 2;
  const DROPS = [0.5, 0.63, 0.9];
  const marker = (x, y, name) => ({
    x: [x], y: [y], mode: 'markers', name, marker: { size: 12, color: 'black', symbol: 'x' }, hoverinfo: 'name', showlegend: false,
  });

  // Horizontal dotted lines at the given signal levels, labelled at the right end of the plot.
  function showLevels(gd, levels) {
    const shapes = levels.map((l) => ({
      type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y', y0: l.y, y1: l.y, line: { color: '#555', width: 1.5, dash: 'dot' },
    }));
    const notes = levels.map((l) => ({
      text: l.text, xref: 'paper', x: 0.99, xanchor: 'right', yref: 'y', y: l.y, yanchor: 'bottom', showarrow: false,
      font: { family: 'Times New Roman', size: 14, color: '#333' },
    }));
    window.Plotly.relayout(gd, { shapes, annotations: [...gd.layout.annotations, ...notes] });
  }

  const dropLevels = () => DROPS.map((d) => ({ y: 1 - d, text: `${fmt(100 * d)}% drop` }));

  // TE at each drop, read off a book trace by interpolating between its samples.
  const readDrops = (trace) => DROPS.map((d) => S.crossing(trace.x, trace.y, 1 - d));

  // a and b. Step 0 (on opening): the book figure. Step 1: the three levels. Step 2: where the tissue's
  //    curve crosses them. Step 3: the explanation (markup; b also fills the MW/IEW ratio).
  function dropAction(id, index, name) {
    action(id, {
      run(ctx) {
        const gd = ctx.bookPlot();
        if (!gd) return;
        ctx.restoreBookFigure();
        const factor = ctx.slide.querySelector('.ans-factor');
        if (factor) factor.textContent = fmt(S.crossing(gd.data[IEW].x, gd.data[IEW].y, 0.5) / S.crossing(gd.data[MW].x, gd.data[MW].y, 0.5), 1);
        if (ctx.step < 1) { ctx.say(''); return; }
        showLevels(gd, dropLevels());
        if (ctx.step < 2) {
          ctx.say(`Follow the ${name} curve down to each level.`);
          return;
        }
        const tes = readDrops(gd.data[index]);
        window.Plotly.addTraces(gd, tes.map((te, i) => marker(te, 1 - DROPS[i], `${name}: ${fmt(100 * DROPS[i])}% drop at ${fmt(te, 1)} ms`)));
        ctx.say(`${name}: <b>${tes.map((te) => `${fmt(te)} ms`).join(', ')}</b> for 50%, 63% and 90% drops.`);
      },
      undo(ctx) { ctx.restoreBookFigure(); ctx.clear(); },
    });
  }

  dropAction('ex2-mw', MW, 'MW');
  dropAction('ex2-iew', IEW, 'IEW');

  // c. Step 0: the book figure. Step 1: the 1/e level and where each curve crosses it: T2.
  //    Step 2: every reading of parts a and b divided by its multiple of T2 gives the same T2.
  action('ex2-t2', {
    run(ctx) {
      const gd = ctx.bookPlot();
      if (!gd) return;
      ctx.restoreBookFigure();
      const t2 = [MW, IEW].map((i) => S.crossing(gd.data[i].x, gd.data[i].y, Math.exp(-1)));
      ctx.slide.querySelector('.ans-mw').textContent = fmt(t2[0]);
      ctx.slide.querySelector('.ans-iew').textContent = fmt(t2[1]);
      if (ctx.step < 1) { ctx.say(''); return; }
      showLevels(gd, [{ y: Math.exp(-1), text: '1/e (63.2% drop)' }]);
      window.Plotly.addTraces(gd, [
        marker(t2[0], Math.exp(-1), `MW: T2 ≈ ${fmt(t2[0], 1)} ms`),
        marker(t2[1], Math.exp(-1), `IEW: T2 ≈ ${fmt(t2[1], 1)} ms`),
      ]);
      if (ctx.step < 2) {
        ctx.say('A mono-exponential has dropped to 1/<i>e</i> when TE = <i>T</i><sub>2</sub>.');
        return;
      }
      // −ln(1 − drop): the multiple of T2 at which each drop happens.
      const k = DROPS.map((d) => -Math.log(1 - d));
      const row = (label, keys) => {
        const est = keys.map((key, i) => ctx.num(key, `${label} TE at ${fmt(100 * DROPS[i])}%`) / k[i]);
        return `<tr><td>${label}</td>${est.map((v) => `<td>${fmt(v)}</td>`).join('')}</tr>`;
      };
      ctx.say('<table class="measure"><tr><th><i>T</i><sub>2</sub> (ms) = TE ÷</th><th>0.69</th><th>0.99</th><th>2.30</th></tr>'
        + `${row('MW', ['mw50', 'mw63', 'mw90'])}${row('IEW', ['iew50', 'iew63', 'iew90'])}</table>`);
    },
    undo(ctx) { ctx.restoreBookFigure(); ctx.clear(); },
  });

  // d. Step 0: the book figure. Step 1: the dotted curve set to exactly 50% MW + 50% IEW.
  //    Step 2: a mono-exponential fit of it (Eq. 3.2, S0 and T2 free). Step 3: the explanation (markup).
  action('ex2-mono', {
    run(ctx) {
      const gd = ctx.bookPlot();
      if (!gd) return;
      ctx.restoreBookFigure();
      const [mw, iew] = [gd.data[MW], gd.data[IEW]];
      const te = mw.x;
      const mix = mw.y.map((v, i) => 0.5 * v + 0.5 * iew.y[i]);
      const fit = S.fitMono(te, mix);
      const late = te.map((t, i) => [t, mix[i]]).filter(([t]) => t >= 50);
      const lateFit = S.fitMono(late.map((p) => p[0]), late.map((p) => p[1]));
      const t2 = (trace) => S.crossing(trace.x, trace.y, Math.exp(-1));
      ctx.slide.querySelector('.ans-t2').textContent = fmt(fit.t2);
      ctx.slide.querySelector('.ans-mw').textContent = fmt(t2(mw));
      ctx.slide.querySelector('.ans-iew').textContent = fmt(t2(iew));
      ctx.slide.querySelector('.ans-late').textContent = fmt(lateFit.t2);
      if (ctx.step < 1) { ctx.say(''); return; }
      window.Plotly.restyle(gd, { y: [mix], name: 'Multi-exponential : 50% MW + 50% IEW' }, [MIX]);
      if (ctx.step < 2) {
        ctx.say('The dotted curve: half MW, half IEW (Eq. 3.5).');
        return;
      }
      window.Plotly.addTraces(gd, {
        x: te, y: te.map((t) => fit.s0 * S.decay(t, fit.t2)), mode: 'lines', name: `Mono-exponential fit: T<sub>2</sub> = ${fmt(fit.t2)} ms`,
        line: { color: 'black', dash: 'dash', width: 2 }, hoverinfo: 'x+y+name',
      });
      ctx.say(`Fit of <i>S</i><sub>0</sub> e<sup>−TE/<i>T</i><sub>2</sub></sup> on the figure’s ${te.length} echoes: <b><i>T</i><sub>2</sub> = ${fmt(fit.t2)} ms</b>, <i>S</i><sub>0</sub> = ${fmt(fit.s0, 2)}.`);
    },
    undo(ctx) { ctx.restoreBookFigure(); ctx.clear(); },
  });
})();
