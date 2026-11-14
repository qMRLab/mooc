/* Exercise 6-2: the chapter's MTR exercises (1-7). (a) MTR of each point of a measured Z-spectrum (white matter voxel
 * of js/data/brain.js); (b, c) MTR of the chapter's tissue for F = 0, 10, 20 % and kf = 5, 2.5, 0 with the Brown 2013
 * Siemens protocol, simulated with js/mt-sim.js (the chapter used qMRLab); (d) the six answers on the two curves. */
(function () {
  'use strict';
  const { S, C, plot, slider, throttle, brain } = window.MT;
  const W = window.MTDeck.widget;
  const $ = (id) => document.getElementById(id);
  const P = S.MTR_PROTOCOLS.brownSiemens;
  const tissue = (F, kf) => ({ F, kf, R1f: 1 / 1.2, R1r: 1, T2f: 0.1, T2r: 10e-6 });
  const mtr = (F, kf) => S.mtr(tissue(F, kf), P);
  const ANS = { b: [0, 0.1, 0.2].map((F) => mtr(F, 5)), c: [5, 2.5, 0].map((kf) => mtr(0.2, kf)) };
  ['b1', 'b2', 'b3'].forEach((id, i) => { $(`ex62-${id}`).dataset.answer = ANS.b[i]; });
  ['c1', 'c2', 'c3'].forEach((id, i) => { $(`ex62-${id}`).dataset.answer = ANS.c[i]; });

  function predict(name, right, fb, texts) {
    const box = document.querySelector(`[data-ctl="${name}"]`);
    box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      b.blur();
      box.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      $(fb).innerHTML = (b.dataset.v === right ? '✓ ' : '✗ ') + texts[b.dataset.v === right ? 'right' : 'wrong'];
    }));
  }
  const mtrAxis = { title: { text: 'MTR (%)' }, range: [0, 60] };

  // ------------------------------------------------------------------ (a)
  W('ex62-a', () => {
    if (!brain) return;
    const [y, x] = brain.preset('wm');
    const d = brain.B.mt.map((m) => m[y][x]);
    const picks = { a1: brain.idx(1, 1), a2: brain.idx(2, 0), a3: brain.idx(4, 1) };
    for (const [id, k] of Object.entries(picks)) {
      const box = $(`ex62-${id}`);
      box.querySelector('.val').textContent = d[k].toFixed(3);
      box.dataset.answer = 100 * (1 - d[k]);
    }
    let all = false;
    const draw = () => {
      const traces = [142, 426].map((a, ai) => {
        const ys = S.QMT_OFFSETS.map((o, oi) => d[brain.idx(oi, ai)]);
        return {
          x: S.QMT_OFFSETS, y: ys, mode: all ? 'markers+text' : 'markers', text: ys.map((v) => `${(100 * (1 - v)).toFixed(1)} %`),
          textposition: ai ? 'bottom center' : 'top center', textfont: { size: 14, color: ai ? C.a426 : C.a142 },
          marker: { color: ai ? C.a426 : C.a142, size: 13, line: { color: '#fff', width: 2 } }, hovertemplate: `${a}°: S/S0 %{y:.3f}<extra></extra>`,
        };
      });
      const hl = Object.values(picks).map((k) => ({ x: S.QMT_OFFSETS[Math.floor(k / 2)], y: d[k] }));
      traces.push({ x: hl.map((h) => h.x), y: hl.map((h) => h.y), mode: 'markers', marker: { symbol: 'circle-open', size: 24, color: '#ff2d55', line: { width: 2.5 } }, hoverinfo: 'skip' });
      plot($('ex62-plot-a'), traces, {
        xaxis: { type: 'log', title: { text: 'MT pulse offset' }, range: [Math.log10(300), Math.log10(25000)], tickvals: [300, 1000, 3000, 10000], ticktext: ['300 Hz', '1 kHz', '3 kHz', '10 kHz'] },
        yaxis: { title: { text: 'S<sub>MT</sub> / S<sub>0</sub>' }, range: [0, 1.06] },
        margin: { l: 70, r: 20, t: 16, b: 60 },
        annotations: [
          { x: Math.log10(14000), y: 0.12, text: '<b>142°</b>', showarrow: false, font: { color: C.a142, size: 17 } },
          { x: Math.log10(14000), y: 0.05, text: '<b>426°</b>', showarrow: false, font: { color: C.a426, size: 17 } },
          { xref: 'paper', yref: 'paper', x: 0.02, y: 0.98, xanchor: 'left', yanchor: 'top', text: 'circled: the three to compute', showarrow: false, font: { size: 14, color: '#ff2d55' } },
        ],
      });
    };
    $('ex62-all').addEventListener('click', (e) => { e.currentTarget.blur(); all = !all; e.currentTarget.textContent = all ? 'Hide the values' : 'Show all ten'; draw(); });
    draw();
  });

  // ------------------------------------------------------------------ (b) F
  W('ex62-b', () => {
    const Fs = Array.from({ length: 31 }, (_, i) => i * 0.01);
    const curve = Fs.map((F) => mtr(F, 5));
    predict('p0', 'few', 'ex62-p0-fb', { right: `Right: ${ANS.b[0].toFixed(1)} %. The pulse also saturates water directly, a little.`, wrong: `It is a few % (${ANS.b[0].toFixed(1)} % here): the pulse saturates water directly, a little, even without macromolecules.` });
    const draw = throttle(() => {
      const F = sF.get(), v = mtr(F, 5);
      $('ex62-mtr-b').textContent = `${v.toFixed(1)} %`;
      plot($('ex62-plot-b'), [
        { x: Fs.map((f) => 100 * f), y: curve, mode: 'lines', line: { color: C.mtr, width: 3.5 }, hovertemplate: 'F %{x:.0f} %: MTR %{y:.1f} %<extra></extra>' },
        { x: [100 * F], y: [v], mode: 'markers', marker: { color: C.mtr, size: 15, line: { color: '#fff', width: 2 } }, hoverinfo: 'skip' },
      ], { xaxis: { title: { text: 'F (%)' } }, yaxis: mtrAxis, margin: { l: 70, r: 20, t: 16, b: 60 } });
    });
    const sF = slider('ex62-F', (v) => `${(100 * v).toFixed(0)} %`, draw);
    draw();
  });

  // ------------------------------------------------------------------ (c) kf
  W('ex62-c', () => {
    const ks = Array.from({ length: 41 }, (_, i) => i * 0.2);
    const curve = ks.map((k) => mtr(0.2, k));
    predict('pk', 'f0', 'ex62-pk-fb', { right: `Right: ${ANS.c[2].toFixed(1)} %, as with F = 0. Saturated macromolecules that cannot pass it on are invisible.`, wrong: `It is ${ANS.c[2].toFixed(1)} %, the same as with F = 0: saturated macromolecules that cannot exchange are invisible.` });
    const draw = throttle(() => {
      const k = sK.get(), v = mtr(0.2, k);
      $('ex62-mtr-c').textContent = `${v.toFixed(1)} %`;
      plot($('ex62-plot-c'), [
        { x: ks, y: curve, mode: 'lines', line: { color: C.mtr, width: 3.5 }, hovertemplate: 'k<sub>f</sub> %{x:.1f} s⁻¹: MTR %{y:.1f} %<extra></extra>' },
        { x: [k], y: [v], mode: 'markers', marker: { color: C.mtr, size: 15, line: { color: '#fff', width: 2 } }, hoverinfo: 'skip' },
      ], { xaxis: { title: { text: 'k<sub>f</sub> (s⁻¹)' } }, yaxis: mtrAxis, margin: { l: 70, r: 20, t: 16, b: 60 } });
    });
    const sK = slider('ex62-kf', (v) => `${v.toFixed(1)} s⁻¹`, draw);
    draw();
  });

  // ------------------------------------------------------------------ (d) both curves, the six answers
  W('ex62-d', () => {
    const Fs = Array.from({ length: 31 }, (_, i) => i * 0.01), ks = Array.from({ length: 41 }, (_, i) => i * 0.2);
    const m = { l: 70, r: 20, t: 10, b: 52 };
    plot($('ex62-plot-d1'), [
      { x: Fs.map((f) => 100 * f), y: Fs.map((F) => mtr(F, 5)), mode: 'lines', line: { color: C.mtr, width: 3 }, hoverinfo: 'skip' },
      { x: [0, 10, 20], y: ANS.b, mode: 'markers+text', text: ANS.b.map((v) => `${v.toFixed(1)} %`), textposition: ['top right', 'top left', 'top left'], marker: { color: C.mtr, size: 12 }, hoverinfo: 'skip' },
    ], { xaxis: { title: { text: 'F (%), k<sub>f</sub> = 5 s⁻¹' } }, yaxis: mtrAxis, margin: m });
    plot($('ex62-plot-d2'), [
      { x: ks, y: ks.map((k) => mtr(0.2, k)), mode: 'lines', line: { color: C.mtr, width: 3 }, hoverinfo: 'skip' },
      { x: [5, 2.5, 0], y: ANS.c, mode: 'markers+text', text: ANS.c.map((v) => `${v.toFixed(1)} %`), textposition: ['bottom right', 'bottom right', 'top right'], marker: { color: C.mtr, size: 12 }, hoverinfo: 'skip' },
    ], { xaxis: { title: { text: 'k<sub>f</sub> (s⁻¹), F = 20 %' } }, yaxis: mtrAxis, margin: m });
  });
})();
