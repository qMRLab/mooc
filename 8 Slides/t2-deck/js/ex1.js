/* Exercise 1: the echo time with the best WM/GM contrast, worked on the book's Figure 3.3 (t2Plot2)
 * and Figure 3.1 (t2Plot1). Figure 3.3's traces: T2 WM (109.77 ms), T2 GM (96.07 ms), then T2* WM
 * (67.63 ms) and T2* GM (48.48 ms); its menu shows T2, T2* or both.
 * Each action draws its slide up to ctx.step: data first, then the result, then the proof. */
(function () {
  'use strict';
  const { action, COLORS, fmt } = window.T2Exercise;
  const S = window.T2Solve;
  const T2 = { wm: 109.77, gm: 96.07, traces: [0, 1], menu: 0, label: 'T<sub>2</sub>' };
  const T2STAR = { wm: 67.63, gm: 48.48, traces: [2, 3], menu: 1, label: 'T<sub>2</sub><sup>*</sup>' };
  const FIG31_TES = [12.8, 128, 256, 384];
  const marker = (x, y, name, yaxis) => ({
    x: [x], y: [y], yaxis, mode: 'markers', name, marker: { size: 13, color: 'black', symbol: 'x' }, hoverinfo: 'name',
  });

  // Shows only `set`'s two curves, with the figure's menu set to match.
  function showSet(gd, set) {
    const visible = gd.data.map((_, i) => set.traces.includes(i));
    window.Plotly.restyle(gd, { visible }, gd.data.map((_, i) => i));
    window.Plotly.relayout(gd, { 'updatemenus[0].active': set.menu });
  }

  // Adds the WM/GM contrast of `set`, from the book's own traces, on a second axis (right). Returns its peak.
  function showContrast(gd, set) {
    const [wm, gm] = set.traces.map((i) => gd.data[i]);
    const peak = S.contrast(S.maxContrastTE(set.wm, set.gm), set.wm, set.gm);
    window.Plotly.addTraces(gd, {
      x: wm.x, y: wm.y.map((v, i) => Math.abs(v - gm.y[i])), yaxis: 'y2', mode: 'lines', name: 'WM/GM contrast (right axis)',
      line: { color: 'black', dash: 'dash', width: 2 }, hoverinfo: 'x+y+name',
    });
    window.Plotly.relayout(gd, {
      'margin.r': 85,
      yaxis2: {
        overlaying: 'y', side: 'right', range: [0, peak * 1.25], showgrid: false, zeroline: false,
        linecolor: 'black', linewidth: 2, tickfont: { family: 'Times New Roman', size: 14 },
        title: { text: 'Contrast |WM − GM|', font: { family: 'Times New Roman', size: 18 } },
      },
    });
    return peak;
  }

  // a and b. Step 0 (on opening): the book figure showing `set`'s curves. Step 1: their difference, the
  //    WM/GM contrast, from the book's own traces, on a second axis. Step 2: its maximum. Step 3: markup.
  function contrastAction(id, set) {
    action(id, {
      run(ctx) {
        const best = S.maxContrastTE(set.wm, set.gm);
        ctx.slide.querySelectorAll('.ans-best').forEach((el) => { el.textContent = fmt(best); });
        const ratio = ctx.slide.querySelector('.ans-ratio');
        if (ratio) {
          ratio.textContent = fmt((100 * (set.wm - set.gm)) / set.gm);
          ctx.slide.querySelector('.ans-ratio-t2').textContent = fmt((100 * (T2.wm - T2.gm)) / T2.gm);
        }
        if (!ctx.bookPlot()) return;
        ctx.restoreBookFigure();
        const gd = ctx.bookPlot();
        showSet(gd, set);
        if (ctx.step < 1) return;
        const peak = showContrast(gd, set);
        if (ctx.step >= 2) {
          window.Plotly.addTraces(gd, marker(best, peak, `Maximum at ${fmt(best)} ms`, 'y2'));
          ctx.say(`Largest difference: <b>${fmt(peak, 3)}</b> of the signal at TE = 0, at TE = ${fmt(best)} ms.`);
        } else {
          ctx.say(`The contrast is the gap between the two ${set.label} curves.`);
        }
      },
      undo(ctx) { ctx.restoreBookFigure(); ctx.clear(); },
    });
  }

  contrastAction('ex1-t2', T2);
  contrastAction('ex1-t2star', T2STAR);

  // Share of the best T2 contrast at TE.
  const shareOfBest = (te) => S.contrast(te, T2.wm, T2.gm) / S.contrast(S.maxContrastTE(T2.wm, T2.gm), T2.wm, T2.gm);

  // c, first slide. Step 1: the contrast predicted at Figure 3.1's four TEs. Step 2: the choice, shown on
  //    the figure (its 128 ms image).
  action('ex1-pick', {
    run(ctx) {
      const rows = FIG31_TES.map((te) => {
        const cell = (v) => (ctx.step >= 2 && te === 128 ? `<b>${v}</b>` : v);
        return `<tr><td>${cell(te)}</td><td>${cell(fmt(S.contrast(te, T2.wm, T2.gm), 3))}</td><td>${cell(`${fmt(100 * shareOfBest(te))}%`)}</td></tr>`;
      });
      ctx.say('<table class="measure"><tr><th>TE (ms)</th><th>WM/GM contrast</th><th>of the best</th></tr>'
        + `${rows.join('')}</table>`);
      ctx.slide.querySelector('.ans-best').textContent = fmt(S.maxContrastTE(T2.wm, T2.gm));
      ctx.slide.querySelector('.ans-pct').textContent = fmt(100 * shareOfBest(128));
      ctx.restoreBookFigure();
      const gd = ctx.bookPlot();
      if (gd && ctx.step >= 2) {
        // Figure 3.1's menu: one heatmap per TE, plus the T2 map (last trace), always shown.
        window.Plotly.restyle(gd, { visible: [false, true, false, false, true] }, [0, 1, 2, 3, 4]);
        window.Plotly.relayout(gd, { 'updatemenus[0].active': 1 });
      }
    },
    undo(ctx) { ctx.restoreBookFigure(); ctx.clear(); },
  });

  // c, second slide. Step 0 (on opening): Figure 3.3 with the T2 contrast, as in a. Step 1: Figure 3.1's
  //    four TEs on the contrast curve. Step 2: why (markup, filled here).
  action('ex1-why', {
    run(ctx) {
      ctx.slide.querySelector('.ans-pct').textContent = fmt(100 * shareOfBest(128));
      ctx.slide.querySelector('.ans-s256').textContent = fmt(100 * S.decay(256, T2.wm));
      ctx.slide.querySelector('.ans-s384').textContent = fmt(100 * S.decay(384, T2.wm));
      if (!ctx.bookPlot()) return;
      ctx.restoreBookFigure();
      const gd = ctx.bookPlot();
      showSet(gd, T2);
      showContrast(gd, T2);
      if (ctx.step < 1) { ctx.say(''); return; }
      window.Plotly.addTraces(gd, {
        x: FIG31_TES, y: FIG31_TES.map((te) => S.contrast(te, T2.wm, T2.gm)), yaxis: 'y2', mode: 'markers+text', name: 'Figure 3.1’s TEs',
        text: FIG31_TES.map((te) => `${te} ms`), textposition: 'top center', textfont: { family: 'Times New Roman', size: 14 },
        marker: { size: 12, color: COLORS[3] }, hoverinfo: 'x+y',
      });
      ctx.say(`128 ms is just past the peak, at ${fmt(100 * shareOfBest(128))}% of the best contrast.`);
    },
    undo(ctx) { ctx.restoreBookFigure(); ctx.clear(); },
  });
})();
