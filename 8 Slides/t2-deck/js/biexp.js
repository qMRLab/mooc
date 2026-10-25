/* Exercise 2-4, "Two components in one voxel": the echoes of one voxel (two water compartments plus a little noise)
 * and a model to fit by hand, S(TE) = a1 e^(−TE/T2,1) + a2 e^(−TE/T2,2) (S0 = 1, so a1 and a2 are each component's
 * share of the signal, and a1 + a2 = 100%). Each component is an arrow on a T2 plot (T2 across, on a log scale; % up):
 * drag it left or right to set its T2, up or down to set its %; the other arrow takes the rest. "Fit one exponential" overlays the best single exponential, which
 * cannot follow the data; on a log scale it is a straight line and the data bend. Under the decay, the residuals
 * (data − model): very different pairs of components draw nearly the same curve, so the residuals are what show a wrong
 * one (a systematic wave rather than noise). "Show answer" draws the values the echoes were made with, as dashed arrows. */
(function () {
  'use strict';
  const slide = document.querySelector('section.biexp');
  if (!slide || !window.Plotly) return;

  const INK = '#1d2733', MUTED = '#5b6776', MODEL = '#c0392b', MONO = '#1f5f99';
  const COLOURS = ['#a8538a', '#b9770e'];
  const TRUE = [{ t2: 18, pct: 25 }, { t2: 78, pct: 75 }];  // ms and % of the signal
  const START = [{ t2: 40, pct: 40 }, { t2: 150, pct: 60 }];  // the shares always add up to 100%
  const TE = Array.from({ length: 32 }, (_, k) => 10 * (k + 1));  // 32 echoes, 10 ms apart
  // The measured echoes: the true decay plus Gaussian noise (SD 0.002, SNR 500), from a seeded generator so it never changes.
  let seed = 7;
  const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-12)) * Math.cos(2 * Math.PI * rand());
  const model = (te, comps) => comps.reduce((a, c) => a + c.pct / 100 * Math.exp(-te / c.t2), 0);
  const SD = 0.002;
  const DATA = TE.map((te) => model(te, TRUE) + SD * gauss());
  const rms = (pred) => Math.sqrt(pred.reduce((a, p, k) => a + (p - DATA[k]) ** 2, 0) / DATA.length);

  // The best single exponential S0 e^(−TE/T2): a scan over T2, with S0 by least squares at each.
  const mono = (() => {
    let best = null;
    for (let t2 = 5; t2 <= 400; t2 += 0.25) {
      const e = TE.map((te) => Math.exp(-te / t2));
      const s0 = e.reduce((a, x, k) => a + x * DATA[k], 0) / e.reduce((a, x) => a + x * x, 0);
      const err = rms(e.map((x) => s0 * x));
      if (!best || err < best.err) best = { t2, s0, err };
    }
    return best;
  })();

  let comps = START.map((c) => ({ ...c })), showMono = false, showAnswer = false;

  // ---- the T2 plot with the two arrows ----
  const svg = slide.querySelector('svg.biexp-t2');
  const NS = 'http://www.w3.org/2000/svg';
  const L = 58, R = 500, T = 18, B = 214, T2MIN = 5, T2MAX = 300;
  const X = (t2) => L + (R - L) * (Math.log(t2) - Math.log(T2MIN)) / (Math.log(T2MAX) - Math.log(T2MIN));
  const Y = (pct) => B - (B - T) * pct / 100;
  const invX = (x) => Math.exp(Math.log(T2MIN) + (x - L) / (R - L) * (Math.log(T2MAX) - Math.log(T2MIN)));
  const invY = (y) => (B - y) / (B - T) * 100;
  const el = (tag, attrs, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  function axes() {
    for (const p of [0, 25, 50, 75, 100]) {
      el('line', { x1: L, y1: Y(p), x2: R, y2: Y(p), class: 'grid' });
      el('text', { x: L - 8, y: Y(p) + 5, class: 'tick', 'text-anchor': 'end' }).textContent = `${p}%`;
    }
    for (const t of [5, 10, 20, 50, 100, 200, 300]) {
      el('line', { x1: X(t), y1: B, x2: X(t), y2: B + 5, class: 'axis' });
      el('text', { x: X(t), y: B + 22, class: 'tick', 'text-anchor': 'middle' }).textContent = t;
    }
    el('line', { x1: L, y1: T - 6, x2: L, y2: B, class: 'axis' });
    el('line', { x1: L, y1: B, x2: R, y2: B, class: 'axis' });
    el('text', { x: (L + R) / 2, y: B + 44, class: 'lab', 'text-anchor': 'middle' }).textContent = 'T₂ (ms)';
  }
  axes();
  const answerLayer = el('g', { class: 'answer' });
  function arrow(parent, c, colour, dashed) {
    const g = el('g', {}, parent);
    el('line', { x1: X(c.t2), y1: B, x2: X(c.t2), y2: Y(c.pct) + 10, stroke: colour, 'stroke-width': dashed ? 2.5 : 5, 'stroke-dasharray': dashed ? '6 5' : 'none' }, g);
    el('path', { d: `M${X(c.t2) - 9},${Y(c.pct) + 12} L${X(c.t2)},${Y(c.pct) - 4} L${X(c.t2) + 9},${Y(c.pct) + 12} z`, fill: dashed ? 'none' : colour, stroke: colour, 'stroke-width': dashed ? 2 : 0 }, g);
    return g;
  }
  const handles = comps.map((_, k) => {
    const g = el('g', { class: 'handle', tabindex: 0, 'aria-label': `Component ${k + 1}: drag to set its T2 and its share` });
    g.style.cursor = 'grab';
    return g;
  });
  function drawArrows() {
    const ys = comps.map((c) => Math.max(T + 12, Y(c.pct) + 6));
    if (Math.abs(ys[0] - ys[1]) < 20 && Math.abs(X(comps[0].t2) - X(comps[1].t2)) < 170) {  // keep the two labels apart
      const hi = ys[0] <= ys[1] ? 0 : 1;
      ys[hi] = Math.max(T + 12, Math.min(ys[0], ys[1]) - 22); ys[1 - hi] = ys[hi] + 22;
    }
    comps.forEach((c, k) => {
      const g = handles[k];
      while (g.firstChild) g.removeChild(g.firstChild);
      el('line', { x1: X(c.t2), y1: B, x2: X(c.t2), y2: Y(c.pct) - 8, stroke: 'transparent', 'stroke-width': 28 }, g);  // easy to grab
      arrow(g, c, COLOURS[k], false);
      const right = X(c.t2) < (L + R) / 2;
      el('text', { x: X(c.t2) + (right ? 12 : -12), y: ys[k], class: 'arrow-lab', fill: COLOURS[k], 'text-anchor': right ? 'start' : 'end' }, g)
        .textContent = `${Math.round(c.t2)} ms · ${Math.round(c.pct)}%`;
    });
    while (answerLayer.firstChild) answerLayer.removeChild(answerLayer.firstChild);
    if (showAnswer) TRUE.forEach((c, k) => arrow(answerLayer, c, COLOURS[k], true));
  }
  // Drag: the pointer's position on the plot (in the plot's own units, whatever the slide's scale) sets T2 and %.
  let dragging = null;
  const toPlot = (e) => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
  handles.forEach((g, k) => {
    g.addEventListener('pointerdown', (e) => { dragging = k; g.setPointerCapture(e.pointerId); g.style.cursor = 'grabbing'; e.preventDefault(); e.stopPropagation(); });
    g.addEventListener('pointermove', (e) => {
      if (dragging !== k) return;
      const p = toPlot(e);
      const pct = Math.min(100, Math.max(0, Math.round(invY(p.y))));
      comps[k] = { t2: Math.min(T2MAX, Math.max(T2MIN, Math.round(invX(p.x)))), pct };
      comps[1 - k] = { ...comps[1 - k], pct: 100 - pct };  // the other component takes the rest of the signal
      draw();
    });
    const stop = () => { dragging = null; g.style.cursor = 'grab'; };
    g.addEventListener('pointerup', stop);
    g.addEventListener('pointercancel', stop);
  });
  svg.style.touchAction = 'none';
  for (const type of ['touchstart', 'touchmove']) svg.addEventListener(type, (e) => e.stopPropagation());

  // ---- the decay plot ----
  const host = slide.querySelector('.biexp-plot');
  function draw() {
    drawArrows();
    const log = slide.querySelector('[data-bx-log]').checked;
    const err = rms(TE.map((te) => model(te, comps)));
    // How close, against the noise (the true values give about SD): within 1.5 SD is as good as it gets; "close" is 2 SD.
    const quality = err < 1.5 * SD ? ['as close as the noise allows', 'good'] : err < 2 * SD ? ['close', 'ok'] : ['not yet', 'far'];
    slide.querySelector('.biexp-err').innerHTML = `Fit error: <b>${(100 * err).toFixed(2)}%</b> <span class="bx-${quality[1]}">${quality[0]}</span>`;
    const t = Array.from({ length: 331 }, (_, k) => k);
    const traces = comps.map((c, k) => ({ x: t, y: t.map((x) => c.pct / 100 * Math.exp(-x / c.t2)), mode: 'lines',
      line: { color: COLOURS[k], width: 2, dash: 'dash' }, name: `component ${k + 1}`, hoverinfo: 'skip' }));
    traces.push({ x: t, y: t.map((x) => model(x, comps)), mode: 'lines', line: { color: MODEL, width: 3 }, name: 'your model', hoverinfo: 'skip' });
    traces.push({ x: TE, y: DATA, mode: 'markers', marker: { color: INK, size: 8 }, name: 'measured echoes', hovertemplate: 'TE = %{x} ms<br>S = %{y:.3f}<extra></extra>' });
    if (showMono) {
      traces.push({ x: t, y: t.map((x) => mono.s0 * Math.exp(-x / mono.t2)), mode: 'lines', line: { color: MONO, width: 3, dash: 'dot' },
        name: `one exponential (T₂ = ${Math.round(mono.t2)} ms)`, hoverinfo: 'skip' });
    }
    // Residuals, in % of S0: random scatter means the model fits; a wave means it does not.
    traces.push({ x: TE, y: TE.map((te, k) => 100 * (DATA[k] - model(te, comps))), mode: 'markers', marker: { color: MODEL, size: 6 },
      xaxis: 'x', yaxis: 'y2', showlegend: false, hovertemplate: 'TE = %{x} ms<br>data − model = %{y:.2f}%<extra></extra>' });
    if (showMono) {
      traces.push({ x: TE, y: TE.map((te, k) => 100 * (DATA[k] - mono.s0 * Math.exp(-te / mono.t2))), mode: 'markers',
        marker: { color: MONO, size: 6, symbol: 'diamond-open' }, xaxis: 'x', yaxis: 'y2', showlegend: false, hoverinfo: 'skip' });
    }
    window.Plotly.react(host, traces, {
      width: 600, height: 520, margin: { l: 60, r: 10, t: 10, b: 50 }, dragmode: false,
      grid: { rows: 2, columns: 1, roworder: 'top to bottom' },
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', size: 15, color: INK },
      xaxis: { title: { text: 'TE (ms)' }, range: [0, 330], fixedrange: true, gridcolor: '#e6eaef', zeroline: false, anchor: 'y2' },
      yaxis: Object.assign(log ? { title: { text: 'signal (log scale)' }, type: 'log', range: [Math.log10(0.02), 0.05] }
        : { title: { text: 'signal' }, range: [0, 1.05], zeroline: false }, { domain: [0.34, 1], fixedrange: true, gridcolor: '#e6eaef' }),
      yaxis2: { title: { text: 'data − model (%)', font: { size: 13 } }, domain: [0, 0.25], range: [-2.5, 2.5], fixedrange: true,
        gridcolor: '#e6eaef', zeroline: true, zerolinecolor: '#9aa5b1', zerolinewidth: 2, tickvals: [-2, 0, 2] },
      legend: { x: 0.98, xanchor: 'right', y: 0.98, bgcolor: 'rgba(255,255,255,0.85)', font: { size: 14 } },
      hoverlabel: { bgcolor: '#fff', bordercolor: INK, font: { size: 15, color: INK } },
    }, { displayModeBar: false, scrollZoom: false });
    const mono_ = slide.querySelector('.biexp-mono');
    mono_.hidden = !showMono;
    mono_.innerHTML = `One exponential at best: T<sub>2</sub> = ${Math.round(mono.t2)} ms, fit error ${(100 * mono.err).toFixed(2)}%. It starts too low and cuts through the data.`;
    const ans = slide.querySelector('.biexp-answer');
    ans.hidden = !showAnswer;
    ans.innerHTML = `Answer (dashed arrows): T<sub>2</sub> = <b>${TRUE[0].t2} ms</b> with <b>${TRUE[0].pct}%</b> (myelin water), and T<sub>2</sub> = <b>${TRUE[1].t2} ms</b> with <b>${TRUE[1].pct}%</b> (intra/extracellular water).`;
  }

  slide.querySelector('[data-bx-log]').addEventListener('change', (e) => { e.currentTarget.blur(); draw(); });
  slide.querySelector('[data-bx-mono]').addEventListener('click', (e) => {
    e.currentTarget.blur(); showMono = !showMono; e.currentTarget.textContent = showMono ? 'Hide one exponential' : 'Fit one exponential'; draw();
  });
  slide.querySelector('[data-bx-answer]').addEventListener('click', (e) => {
    e.currentTarget.blur(); showAnswer = !showAnswer; e.currentTarget.textContent = showAnswer ? 'Hide answer' : 'Show answer'; draw();
  });
  slide.querySelector('[data-bx-reset]').addEventListener('click', (e) => { e.currentTarget.blur(); comps = START.map((c) => ({ ...c })); draw(); });

  let shown = false;
  const start = () => { if (!shown) { shown = true; draw(); } };
  if (window.Reveal) {
    window.Reveal.on('slidechanged', (e) => { if (e.currentSlide === slide) start(); });
    window.Reveal.on('ready', (e) => { if (e.currentSlide === slide) start(); });
    if (window.Reveal.isReady() && window.Reveal.getCurrentSlide() === slide) start();
  }
  window.BiExp = { truth: TRUE, mono, data: DATA, set: (k, t2, pct) => { comps[k] = { t2, pct }; comps[1 - k] = { ...comps[1 - k], pct: 100 - pct }; draw(); },
    get comps() { return comps.map((c) => ({ ...c })); } };
})();
