/* Exercise 6-3: fit a qMT voxel by hand (a), against the computer's fit and qMRLab's, with the F-kf valley (b),
 * then refit with a wrong B1 (c). Data: the chapter's 3 T slice (js/data/brain.js); model and fitter: js/mt-sim.js
 * (S.qmtForward, S.fitQMT). One voxel is shared by the three slides; picking another resets them. */
(function () {
  'use strict';
  const { S, C, plot, seg, slider, throttle, brain, brainHeat, brainAxes, VIRIDIS } = window.MT;
  const W = window.MTDeck.widget;
  const $ = (id) => document.getElementById(id);
  if (!brain) return;
  const B = brain.B;
  const XS = Array.from({ length: 16 }, (_, i) => 10 ** (Math.log10(300) + (Math.log10(25000) - Math.log10(300)) * i / 15));
  const START = { F: 0.1, kf: 3, T2f: 0.04, T2r: 15e-6 };

  const st = { vox: brain.preset('wm'), user: { ...START }, submitted: null, fit: null, refit: null, guess: null };
  const known = () => { const [y, x] = st.vox; return { R1meas: B.R1[y][x], b1: B.B1[y][x], b0: B.B0[y][x] }; };
  const data = () => { const [y, x] = st.vox; return B.mt.map((m) => m[y][x]); };
  const qmrlab = () => { const [y, x] = st.vox; return { F: B.F[y][x], kf: B.kf[y][x], T2f: B.T2f[y][x] / 1e3, T2r: B.T2r[y][x] / 1e6 }; };
  const forward = (p, b1 = known().b1) => S.qmtForward(p, { protocol: S.QMT_PROTOCOL, ...known(), b1, steps: 32 });
  const sse = (m) => m.reduce((a, v, i) => a + (v - data()[i]) ** 2, 0);
  const fitWith = (b1, start) => S.fitQMT(data(), { protocol: S.QMT_PROTOCOL, ...known(), b1, steps: 32, start: start || qmrlab(), maxIter: 50 });
  // a dense Z-spectrum curve of the model for plotting
  function curve(p, angle, b1 = known().b1) {
    const k = known();
    const t = { ...p, R1r: 1, R1f: S.r1fFromMeasured(k.R1meas, p.F, p.kf, 1) };
    return XS.map((o) => S.normalizedSignal(t, { tr: 0.025, flipAngle: 7, b1, mt: { shape: 'gausshann', duration: 0.01024, angle, offset: o + k.b0 } }, { steps: 32 }));
  }
  function pointsTraces() {
    const d = data();
    return [142, 426].map((a, ai) => ({
      x: S.QMT_OFFSETS, y: S.QMT_OFFSETS.map((o, oi) => d[brain.idx(oi, ai)]), mode: 'markers',
      marker: { color: ai ? C.a426 : C.a142, size: 13, line: { color: '#fff', width: 2 } }, hovertemplate: `measured ${a}°: %{y:.3f}<extra></extra>`,
    }));
  }
  function curveTraces(p, dash, name, b1) {
    return [142, 426].map((a, ai) => ({ x: XS, y: curve(p, a, b1), mode: 'lines', line: { color: ai ? C.a426 : C.a142, width: dash ? 2.5 : 3.5, dash: dash || 'solid' }, hovertemplate: `${name} ${a}°: %{y:.3f}<extra></extra>` }));
  }
  const zLayout = (extra) => Object.assign({
    xaxis: { type: 'log', title: { text: 'MT pulse offset' }, range: [Math.log10(300), Math.log10(25000)], tickvals: [300, 1000, 3000, 10000], ticktext: ['300 Hz', '1 kHz', '3 kHz', '10 kHz'] },
    yaxis: { title: { text: 'S<sub>MT</sub> / S<sub>0</sub>' }, range: [0, 1.04] },
    margin: { l: 70, r: 20, t: 16, b: 60 },
  }, extra || {});
  const fmtP = {
    F: (p) => `${(100 * p.F).toFixed(1)} %`, kf: (p) => `${p.kf.toFixed(2)} s⁻¹`,
    T2f: (p) => `${(p.T2f * 1e3).toFixed(1)} ms`, T2r: (p) => `${(p.T2r * 1e6).toFixed(1)} µs`,
  };
  const listeners = [];
  const onVoxel = (fn) => listeners.push(fn);
  function setVoxel(v) {
    st.vox = v; st.submitted = null; st.fit = null; st.refit = null;
    listeners.forEach((fn) => fn());
  }

  // ------------------------------------------------------------------ (a) by hand
  W('ex63-a', (section) => {
    const elMap = $('ex63-map'), el = $('ex63-plot');
    const drawMap = () => plot(elMap, [
      brainHeat(brain.grid((y, x) => 100 * B.F[y][x]), { zmin: 0, zmax: 30, showscale: false, hovertemplate: 'F (qMRLab) %{z:.0f} %<extra></extra>' }),
      { type: 'scatter', x: [st.vox[1]], y: [st.vox[0]], mode: 'markers', marker: { symbol: 'circle-open', size: 12, color: '#ff2d55', line: { width: 3 } }, hoverinfo: 'skip' },
    ], brainAxes());
    const draw = throttle(() => {
      const p = { F: sF.get(), kf: sK.get(), T2f: sT2f.get() / 1e3, T2r: sT2r.get() * 1e-6 };
      st.user = p;
      const e = sse(forward(p));
      const box = $('ex63-sse');
      box.textContent = e.toFixed(4);
      box.style.color = e < 0.01 ? '#2e8b3a' : '';
      plot(el, [...curveTraces(p, null, 'your model'), ...pointsTraces()], zLayout({
        annotations: [
          { x: Math.log10(14000), y: 0.12, text: '<b>142°</b>', showarrow: false, font: { color: C.a142, size: 17 } },
          { x: Math.log10(14000), y: 0.05, text: '<b>426°</b>', showarrow: false, font: { color: C.a426, size: 17 } },
        ],
      }));
    });
    const sF = slider('ex63-F', (v) => `${(100 * v).toFixed(1)} %`, draw);
    const sK = slider('ex63-kf', (v) => `${v.toFixed(2)} s⁻¹`, draw);
    const sT2f = slider('ex63-T2f', (v) => `${v.toFixed(1)} ms`, draw);
    const sT2r = slider('ex63-T2r', (v) => `${v.toFixed(1)} µs`, draw);
    const showKnown = () => { const k = known(); $('ex63-known').innerHTML = `T<sub>1</sub> ${(1 / k.R1meas).toFixed(2)} s, B<sub>1</sub> ${k.b1.toFixed(2)}, B<sub>0</sub> ${k.b0.toFixed(0)} Hz.`; };
    const reset = () => { sF.set(START.F); sK.set(START.kf); sT2f.set(START.T2f * 1e3); sT2r.set(START.T2r * 1e6); $('ex63-sub-note').textContent = ''; draw(); };
    $('ex63-reset').addEventListener('click', (e) => { e.currentTarget.blur(); reset(); });
    $('ex63-submit').addEventListener('click', (e) => {
      e.currentTarget.blur();
      st.submitted = { ...st.user };
      const ok = sse(forward(st.submitted)) < 0.01;
      $('ex63-sub-note').innerHTML = ok ? '✓ Submitted. Compare it with the computer on the next slide.' : 'Submitted, though the fit could be closer (aim below 0.01). Compare on the next slide.';
      listeners.forEach((fn) => fn('submit'));
    });
    seg(section, 'voxel', (v) => setVoxel(brain.preset(v)));
    onVoxel((why) => { if (why === 'submit') return; drawMap(); showKnown(); reset(); });
    drawMap(); showKnown(); draw();
    elMap.on('plotly_click', (ev) => {   // after the first plot: Plotly adds .on() to the element
      const pt = ev.points && ev.points[0];
      if (!pt) return;
      const y = Math.round(pt.y), x = Math.round(pt.x);
      if (brain.inMask(y, x)) setVoxel([y, x]);
    });
  });

  // ------------------------------------------------------------------ (b) the computer's fit and the valley
  W('ex63-b', () => {
    const el = $('ex63-plot-b');
    let view = 'curves';
    function table() {
      const cols = [['You', st.submitted || st.user], ['Computer', st.fit], ['qMRLab', qmrlab()]];
      const head = `<tr><th></th>${cols.map(([n]) => `<th>${n}</th>`).join('')}</tr>`;
      const rows = Object.keys(fmtP).map((k) => `<tr><td>${{ F: 'F', kf: 'k<sub>f</sub>', T2f: 'T<sub>2,f</sub>', T2r: 'T<sub>2,r</sub>' }[k]}</td>${cols.map(([n, p], i) => `<td class="${i === 0 ? 'you' : ''}">${p ? fmtP[k](p) : '–'}</td>`).join('')}</tr>`).join('');
      const errs = `<tr><td>Squared errors</td>${cols.map(([, p], i) => `<td class="${i === 0 ? 'you' : ''}">${p ? sse(forward(p)).toFixed(4) : '–'}</td>`).join('')}</tr>`;
      $('ex63-table').innerHTML = head + rows + errs;
    }
    function drawCurves() {
      const tr = [...pointsTraces()];
      tr.unshift(...curveTraces(st.submitted || st.user, 'dash', 'you'));
      if (st.fit) tr.unshift(...curveTraces(st.fit, null, 'computer'));
      plot(el, tr, zLayout({
        annotations: [{ xref: 'paper', yref: 'paper', x: 0.98, y: 0.04, xanchor: 'right', text: `dashed: you${st.fit ? ' · solid: computer' : ''}`, showarrow: false, font: { size: 15, color: C.muted } }],
      }));
    }
    function drawValley() {
      const best = st.fit;
      const Fs = Array.from({ length: 15 }, (_, i) => best.F * (0.5 + i * (1.1 / 14)));
      const ks = Array.from({ length: 15 }, (_, i) => best.kf * 10 ** (-0.45 + i * (0.9 / 14)));
      const z = ks.map((kf) => Fs.map((F) => Math.log10(sse(forward({ ...best, F, kf })))));
      const you = st.submitted || st.user;
      plot(el, [
        { type: 'contour', x: Fs.map((v) => 100 * v), y: ks, z, colorscale: VIRIDIS, reversescale: true, contours: { coloring: 'heatmap' }, line: { width: 0.5, color: 'rgba(255,255,255,0.5)' }, colorbar: { title: { text: 'log₁₀ squared errors', side: 'right' }, thickness: 14 }, hovertemplate: 'F %{x:.1f} %, k<sub>f</sub> %{y:.2f} s⁻¹<br>log₁₀ SSE %{z:.2f}<extra></extra>' },
        { type: 'scatter', x: [100 * best.F], y: [best.kf], mode: 'markers+text', text: ['computer'], textposition: 'top center', marker: { color: '#fff', size: 12, line: { color: C.ink, width: 2 } }, textfont: { color: '#fff', size: 15 }, hoverinfo: 'skip' },
        ...(you.F >= Fs[0] && you.F <= Fs[14] && you.kf >= ks[0] && you.kf <= ks[14] ? [{ type: 'scatter', x: [100 * you.F], y: [you.kf], mode: 'markers+text', text: ['you'], textposition: 'bottom center', marker: { color: '#ff2d55', size: 12 }, textfont: { color: '#fff', size: 15 }, hoverinfo: 'skip' }] : []),
      ], {
        xaxis: { title: { text: 'F (%)' } }, yaxis: { title: { text: 'k<sub>f</sub> (s⁻¹)' }, type: 'log' },
        margin: { l: 70, r: 20, t: 16, b: 60 },
        annotations: [{ xref: 'paper', yref: 'paper', x: 0.02, y: 0.98, xanchor: 'left', yanchor: 'top', text: 'T<sub>2,f</sub>, T<sub>2,r</sub> fixed at the computer’s fit', showarrow: false, font: { color: '#fff', size: 14 } }],
      });
    }
    const draw = () => { table(); (view === 'valley' && st.fit ? drawValley : drawCurves)(); };
    const fitBtn = $('ex63-fit'), valBtn = $('ex63-valley');
    function runFit(then) {
      fitBtn.disabled = true; fitBtn.textContent = 'Fitting…';
      setTimeout(() => { st.fit = fitWith(known().b1); fitBtn.disabled = false; fitBtn.textContent = 'Fit it for me'; then(); }, 30);
    }
    fitBtn.addEventListener('click', () => { fitBtn.blur(); view = 'curves'; valBtn.textContent = 'Show the F–kf valley'; runFit(draw); });
    valBtn.addEventListener('click', () => {
      valBtn.blur();
      if (view === 'valley') { view = 'curves'; valBtn.textContent = 'Show the F–kf valley'; draw(); return; }
      const go = () => { view = 'valley'; valBtn.textContent = 'Show the curves'; valBtn.disabled = true; setTimeout(() => { draw(); valBtn.disabled = false; }, 30); };
      if (!st.fit) runFit(go); else go();
    });
    onVoxel(() => { view = 'curves'; valBtn.textContent = 'Show the F–kf valley'; draw(); });
    draw();
    return { show: draw };
  });

  // ------------------------------------------------------------------ (c) a wrong B1
  W('ex63-c', (section) => {
    const el = $('ex63-plot-c');
    const more = $('ex63-c-more');
    let b1s = null;
    const truthText = () => {
      const b = known().b1;
      $('ex63-b1true').textContent = b.toFixed(2);
      $('ex63-b1rel').textContent = b > 1 ? 'lower than the truth' : 'higher than the truth';
    };
    function table() {
      const k = known();
      const rows = [['Measured B<sub>1</sub>', k.b1, st.fit], ['Assumed B<sub>1</sub>', b1s ? b1s.get() : 1, st.refit]];
      $('ex63-table-c').innerHTML = `<tr><th>B<sub>1</sub> used</th><th>F</th><th>k<sub>f</sub></th><th>T<sub>2,f</sub></th><th>T<sub>2,r</sub></th></tr>` +
        rows.map(([n, b, p], i) => `<tr><td>${n} ${b.toFixed(2)}</td>${['F', 'kf', 'T2f', 'T2r'].map((key) => `<td class="${i ? 'you' : ''}">${p ? fmtP[key](p) : '…'}</td>`).join('')}</tr>`).join('') +
        (st.fit && st.refit ? `<tr><td>Error in F</td><td class="you" colspan="4" style="text-align:left">${(100 * (st.refit.F / st.fit.F - 1)).toFixed(0)} %</td></tr>` : '');
    }
    function draw() {
      const tr = [...pointsTraces()];
      if (st.fit) tr.unshift(...curveTraces(st.fit, null, 'true B1'));
      if (st.refit) tr.unshift(...curveTraces(st.refit, 'dash', 'wrong B1', b1s.get()));
      plot(el, tr, zLayout({ annotations: [{ xref: 'paper', yref: 'paper', x: 0.98, y: 0.04, xanchor: 'right', text: 'solid: fit with the measured B₁ · dashed: with the assumed B₁', showarrow: false, font: { size: 14, color: C.muted } }] }));
      table();
    }
    function refit() {
      if (!st.fit) st.fit = fitWith(known().b1);
      st.refit = fitWith(b1s.get(), st.fit);
      draw();
    }
    const guessBox = section.querySelector('[data-ctl="guess"]');
    guessBox.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      b.blur();
      guessBox.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      st.guess = b.dataset.v;
      const right = known().b1 > 1 ? 'higher' : 'lower';
      $('ex63-guess-fb').innerHTML = st.guess === right ? '✓ Right. See by how much below.' : `✗ It comes out <b>${right}</b>. See below, then why.`;
      more.hidden = false;
      if (!b1s) {
        b1s = slider('ex63-b1', (v) => v.toFixed(2), () => { table(); });
        b1s.el.addEventListener('change', () => setTimeout(refit, 10));
      }
      setTimeout(refit, 30);
    }));
    onVoxel(() => { truthText(); st.refit = null; more.hidden = true; guessBox.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false')); $('ex63-guess-fb').textContent = ''; draw(); });
    truthText(); draw();
  });
})();
