/* Which filter would you use? (Exercise 4-6, #filt-1d). Three 1D B1 profiles (64 voxels, a smooth centre-high "true" profile):
 * random noise, one spurious voxel, and a 3-voxel dip (e.g. the ventricles reading low). For each, the student picks median
 * or Gaussian first; then the filtered profile is shown with the voxels that end up more than 2 % off the truth in red, and
 * both filters can be compared. Window width w (odd, 3–15 voxels): the median of the w values, or a Gaussian of σ = w/4
 * truncated to the same window (as on the 2D slides); at the ends the window is cut to the voxels that exist. The position
 * slider (and Play) animates the convolution, as in the chapter's figure: the window on the signal (top), and the output
 * built up to that voxel (bottom). Score: right answers out of three. */
(function () {
  'use strict';
  const slide = document.getElementById('filt-1d'); if (!slide || !window.Plotly) return;
  const q = (c) => slide.querySelector(c), host = q('.f1-plot');
  const N = 64, X = Array.from({ length: N }, (_, i) => i), TOL = 0.02;
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const TRUE = X.map((x) => 1.12 - 0.25 * ((x - 32) / 32) ** 2);
  const noisy = (sd, seed) => { const r = rng(seed); return TRUE.map((v) => v + sd * gauss(r)); };
  const EX = [
    { key: 'noise', y: noisy(0.03, 11), a: 'gauss', why: 'Gaussian. For random noise, a weighted average uses every neighbour, so it smooths more than a median of the same window, which keeps only the middle value.' },
    { key: 'spike', y: (() => { const y = noisy(0.008, 12); y[30] += 0.5; return y; })(), a: 'median', why: 'Median. The spurious voxel is one value out of w, so the median ignores it. A Gaussian averages it in, and spreads a smaller error over the whole window.' },
    { key: 'dip', y: (() => { const y = noisy(0.008, 13); for (let i = 30; i < 33; i++) y[i] -= 0.22; return y; })(), a: 'median', why: 'Median, with a window more than twice as wide as the dip (7 or more here): the 3 low values are then a minority and are ignored. With 3 or 5, the median keeps the dip; a Gaussian smears it over its neighbours.' },
  ];
  const WORD = { median: 'Median', gauss: 'Gaussian' };
  function filt(y, kind, w) {
    const h = (w - 1) / 2, s = w / 4;
    return y.map((_, i) => {
      const lo = Math.max(0, i - h), hi = Math.min(N - 1, i + h);
      if (kind === 'median') { const v = y.slice(lo, hi + 1).sort((a, b) => a - b), n = v.length; return n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2; }
      let sw = 0, sv = 0; for (let j = lo; j <= hi; j++) { const wt = Math.exp(-((j - i) ** 2) / (2 * s * s)); sw += wt; sv += wt * y[j]; } return sv / sw;
    });
  }
  const st = { ex: 0, ans: [null, null, null], kind: 'median', w: 7, pos: N - 1, timer: null };
  const wIn = q('.f1-w'), pIn = q('.f1-pos'), FONT = { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', size: 13, color: INK };
  function draw() {
    const ex = EX[st.ex], answered = st.ans[st.ex] != null, w = st.w, h = (w - 1) / 2, pos = st.pos;
    const f = filt(ex.y, st.kind, w), bad = X.filter((i) => Math.abs(f[i] / TRUE[i] - 1) > TOL);
    const shown = X.filter((i) => i <= pos), badShown = bad.filter((i) => i <= pos);
    const traces = [
      { x: X, y: TRUE, mode: 'lines', name: 'true B₁', line: { color: '#9aa5b1', width: 2 }, hoverinfo: 'skip' },
      { x: X, y: ex.y, mode: 'markers', name: 'measured', marker: { color: '#e8770e', size: 6 }, hoverinfo: 'skip' },
    ];
    const shapes = [];
    if (answered) {
      const lo = Math.max(0, pos - h), hi = Math.min(N - 1, pos + h);
      shapes.push({ type: 'rect', xref: 'x', yref: 'paper', x0: lo - 0.5, x1: hi + 0.5, y0: 0.56, y1: 1, fillcolor: 'rgba(31,95,153,0.12)', line: { width: 0 } });
      if (st.kind === 'gauss') { const s = w / 4, kx = []; for (let j = lo; j <= hi; j++) kx.push(j);
        traces.push({ x: kx, y: kx.map((j) => 0.66 + 0.1 * Math.exp(-((j - pos) ** 2) / (2 * s * s))), mode: 'lines', name: 'kernel', line: { color: '#1f5f99', width: 2 }, hoverinfo: 'skip', showlegend: false }); }
      traces.push({ x: X, y: TRUE, xaxis: 'x2', yaxis: 'y2', mode: 'lines', showlegend: false, line: { color: '#9aa5b1', width: 2, dash: 'dot' }, hoverinfo: 'skip' });
      traces.push({ x: shown, y: shown.map((i) => f[i]), xaxis: 'x2', yaxis: 'y2', mode: 'lines+markers', name: `${WORD[st.kind]}-filtered`, line: { color: '#1f5f99', width: 2.5 }, marker: { size: 4, color: '#1f5f99' }, hoverinfo: 'skip' });
      traces.push({ x: badShown, y: badShown.map((i) => f[i]), xaxis: 'x2', yaxis: 'y2', mode: 'markers', name: `> ${TOL * 100} % off`, marker: { size: 10, color: 'rgba(0,0,0,0)', line: { color: '#c0392b', width: 2.5 } }, hoverinfo: 'skip' });
      if (pos < N - 1 || st.timer) traces.push({ x: [pos], y: [f[pos]], xaxis: 'x2', yaxis: 'y2', mode: 'markers', showlegend: false, marker: { size: 12, color: '#1f5f99' }, hoverinfo: 'skip' });
    }
    const yr = [0.6, Math.max(1.45, Math.max(...ex.y) + 0.08)];   // room for the spurious voxel
    Plotly.react(host, traces, {
      width: 720, height: 470, margin: { l: 56, r: 12, t: 24, b: 44 }, font: FONT, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', showlegend: true,
      legend: { orientation: 'h', x: 0, y: 1.06, font: { size: 12 } }, shapes,
      xaxis: { domain: [0, 1], anchor: 'y', range: [-1, N], showticklabels: false, gridcolor: '#eef1f4', zeroline: false, fixedrange: true },
      yaxis: { domain: [0.56, 1], title: { text: 'signal (B₁)' }, range: yr, gridcolor: '#eef1f4', zeroline: false, fixedrange: true },
      xaxis2: { domain: [0, 1], anchor: 'y2', range: [-1, N], title: { text: 'voxel' }, gridcolor: '#eef1f4', zeroline: false, fixedrange: true },
      yaxis2: { domain: [0, 0.44], title: { text: answered ? 'filtered' : '' }, range: yr, gridcolor: '#eef1f4', zeroline: false, fixedrange: true, showticklabels: answered },
      annotations: answered ? [] : [{ xref: 'paper', yref: 'paper', x: 0.5, y: 0.22, text: 'Pick a filter first', showarrow: false, font: { size: 18, color: '#9aa5b1' } }],
      dragmode: false,
    }, { displayModeBar: false, staticPlot: true });
    // panel
    slide.querySelectorAll('[data-f1ex]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.f1ex) === st.ex)));
    slide.querySelectorAll('[data-f1kind]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f1kind === st.kind)));
    slide.querySelectorAll('[data-f1ans]').forEach((b) => { b.disabled = answered; b.classList.toggle('f1-good', answered && b.dataset.f1ans === ex.a); b.classList.toggle('f1-bad', answered && b.dataset.f1ans === st.ans[st.ex] && st.ans[st.ex] !== ex.a); });
    const fb = q('.f1-fb'), ok = st.ans[st.ex] === ex.a;
    fb.hidden = !answered; fb.className = `f1-fb ${ok ? 'f1-right' : 'f1-wrong'}`; fb.textContent = ok ? '✓ Right' : '✗ Not the best choice';
    q('.f1-why').hidden = !answered; q('.f1-why').textContent = answered ? ex.why : '';
    q('.f1-tools').hidden = !answered;
    q('.f1-w-read').textContent = `${w} voxels${st.kind === 'gauss' ? ` (σ = ${(w / 4).toFixed(2)})` : ''}`;
    const maxErr = Math.max(...X.map((i) => Math.abs(f[i] / TRUE[i] - 1))) * 100;
    q('.f1-err').innerHTML = `${WORD[st.kind]}, w = ${w}: <b>${bad.length}</b> voxel${bad.length === 1 ? '' : 's'} more than 2 % off, worst ${maxErr.toFixed(1)} %`;
    const right = st.ans.filter((a, i) => a === EX[i].a).length, done = st.ans.filter((a) => a != null).length;
    q('.f1-score').textContent = `${right} / ${done} right`;
  }
  slide.querySelectorAll('[data-f1ex]').forEach((b) => b.addEventListener('click', () => { b.blur(); stop(); st.ex = Number(b.dataset.f1ex); st.pos = N - 1; pIn.value = st.pos; if (st.ans[st.ex]) st.kind = st.ans[st.ex]; draw(); }));
  slide.querySelectorAll('[data-f1ans]').forEach((b) => b.addEventListener('click', () => { b.blur(); if (st.ans[st.ex] != null) return; st.ans[st.ex] = b.dataset.f1ans; st.kind = b.dataset.f1ans; st.pos = N - 1; pIn.value = st.pos; draw(); }));
  slide.querySelectorAll('[data-f1kind]').forEach((b) => b.addEventListener('click', () => { b.blur(); st.kind = b.dataset.f1kind; draw(); }));
  wIn.addEventListener('input', () => { st.w = 2 * Number(wIn.value) + 1; draw(); }); keepSlider(wIn);
  pIn.addEventListener('input', () => { stop(); st.pos = Number(pIn.value); draw(); }); keepSlider(pIn);
  function stop() { if (st.timer) { clearInterval(st.timer); st.timer = null; q('.f1-play').textContent = '▶ Play'; } }
  q('.f1-play').addEventListener('click', (e) => {
    e.currentTarget.blur();
    if (st.timer) { stop(); draw(); return; }
    st.pos = 0; e.currentTarget.textContent = '❚❚ Pause';
    st.timer = setInterval(() => { st.pos += 1; pIn.value = st.pos; if (st.pos >= N - 1) stop(); draw(); }, 90);
  });
  Reveal.on('slidechanged', () => stop());
  onShow(slide, draw);
})();
