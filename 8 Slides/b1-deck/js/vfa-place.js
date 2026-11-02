/* Where would you put your three flip angles? (Exercise 4-5, #vfa-place). A brain at 3 T, no B1 map: the fit solves for A, T1
 * and B1 from three SPGR measurements. The plot starts empty (no curves, no signal scale): pick a TR, click on the plot to drop
 * an angle (up to three), drag to move one, then "Scan". Revealed: the WM / GM / CSF curves (T1 = 900, 1500, 4000 ms,
 * PD 0.7 / 0.8 / 1), the measured points, each tissue's fitted curve, and a table: true and fitted T1 (and its error) and
 * fitted B1. No noise yet (SIG = 0). After the reveal the angles and TR can still be changed; everything refits. The fit: A in
 * closed form for each (B1, T1), a grid over B1 (linear) and T1 (log), then Nelder–Mead (vfa-sim.js), within B1 0.7–1.3 (the
 * range expected in the brain, as the slide says) and T1 100–10000 ms. */
(function () {
  'use strict';
  const slide = document.getElementById('vfa-place'); if (!slide || !window.Plotly || !window.VFASIM) return;
  const q = (c) => slide.querySelector(c), host = q('.vp-plot'), trIn = q('.vp-tr');
  const DEG = Math.PI / 180, B1 = 1.1, SIG = 0, XMAX = 90, NMAX = 3;   // SIG: noise σ per image, none for now
  const B1LO = 0.7, B1HI = 1.3, T1LO = 100, T1HI = 10000;
  const TISSUE = [{ name: 'WM', t1: 900, pd: 0.7, color: '#1f5f99' }, { name: 'GM', t1: 1500, pd: 0.8, color: '#d2691e' }, { name: 'CSF', t1: 4000, pd: 1.0, color: '#2e8b3a' }];
  const W = 640, H = 430, M = { l: 64, r: 16, t: 16, b: 56 };
  const FONT = { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', size: 14, color: INK };
  const st = { angles: [], shown: false };

  const V = window.VFASIM, model = V.model, rng = V.rng, gauss = V.gauss;
  const fit = (al, y, tr) => V.fit(al, y, tr, { b1lo: B1LO, b1hi: B1HI, t1lo: T1LO, t1hi: T1HI });   // three unknowns, A in closed form
  const scan = (t, al, tr, r) => al.map((a) => t.pd * model(a, B1, t.t1, tr) + SIG * gauss(r));

  // the plot: before the scan, only the chosen angles (no curves, no signal ticks); after, the curves, points and fits
  const yTop = (tr) => 1.18 * Math.max(...TISSUE.map((t) => { const e = Math.exp(-tr / t.t1); return t.pd * model(Math.acos(e) / DEG / B1, B1, t.t1, tr); }));
  let res = null;
  function draw() {
    const tr = Number(trIn.value), top = yTop(tr), traces = [], XS = Array.from({ length: 361 }, (_, i) => i / 4);
    if (st.shown && res) {
      TISSUE.forEach((t, k) => {
        const f = res.one[k];
        traces.push({ x: XS, y: XS.map((a) => t.pd * model(a, B1, t.t1, tr)), mode: 'lines', name: `${t.name} (T₁ = ${t.t1} ms)`, line: { color: t.color, width: 3 }, hoverinfo: 'skip' });
        traces.push({ x: XS, y: XS.map((a) => f.a * model(a, f.b1, f.t1, tr)), mode: 'lines', showlegend: false, line: { color: t.color, width: 1.5, dash: 'dash' }, hoverinfo: 'skip' });
        traces.push({ x: st.angles, y: res.y[k], mode: 'markers', showlegend: false, marker: { size: 11, color: t.color, line: { color: '#fff', width: 1.5 } }, hoverinfo: 'skip', cliponaxis: false });
      });
    }
    traces.push({ x: st.angles, y: st.angles.map(() => 0), mode: 'markers+text', text: st.angles.map((a) => `${a.toFixed(0)}°`), textposition: 'top center', textfont: { size: 14, color: INK },
      marker: { symbol: 'triangle-up', size: 16, color: INK, line: { width: 0 } }, showlegend: false, hoverinfo: 'skip', cliponaxis: false });
    Plotly.react(host, traces, {
      width: W, height: H, margin: M, font: FONT, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: st.shown ? 'rgba(0,0,0,0)' : '#fbfcfd',
      xaxis: { title: { text: 'flip angle (°), as set on the scanner' }, range: [0, XMAX], dtick: 10, gridcolor: '#eef1f4', zeroline: false, fixedrange: true },
      yaxis: { title: { text: 'signal' }, range: [0, top], showticklabels: st.shown, gridcolor: st.shown ? '#eef1f4' : 'rgba(0,0,0,0)', zeroline: false, fixedrange: true, tickformat: '.2f' },
      shapes: st.angles.map((a) => ({ type: 'line', x0: a, x1: a, y0: 0, y1: top, line: { color: st.shown ? '#dfe4ea' : '#9aa5b1', width: 1.5, dash: 'dot' }, layer: 'below' })),
      annotations: st.shown ? [] : [{ x: 45, y: top * 0.55, text: st.angles.length < NMAX ? `Click to place angle ${st.angles.length + 1} of ${NMAX}` : 'Drag to adjust, then Scan', showarrow: false, font: { size: 18, color: '#9aa5b1' } }],
      legend: { x: 0.98, xanchor: 'right', y: 0.98, bgcolor: 'rgba(255,255,255,0.85)' }, dragmode: false,
    }, { displayModeBar: false, staticPlot: true });
  }

  function compute() {
    const tr = Number(trIn.value), al = st.angles, r1 = rng(1);
    const y = TISSUE.map((t) => scan(t, al, tr, r1)), one = TISSUE.map((t, k) => fit(al, y[k], tr));
    res = { y, one };
  }
  const pct = (v) => (v >= 100 ? `${v.toFixed(0)} %` : `${v.toFixed(1)} %`);
  function table() {
    const tb = q('.vp-rows'); tb.innerHTML = '';
    if (!st.shown || !res) { q('.vp-result').hidden = true; return; }
    q('.vp-result').hidden = false;
    TISSUE.forEach((t, k) => {
      const f = res.one[k], tr = document.createElement('tr');
      tr.innerHTML = `<td><b style="color:${t.color}">${t.name}</b></td><td>${t.t1}</td><td>${Math.round(f.t1)}</td><td>${pct(Math.abs(f.t1 / t.t1 - 1) * 100)}</td><td>${f.b1.toFixed(2)}</td>`;
      tb.appendChild(tr);
    });
  }
  function chips() {
    const n = st.angles.length;
    q('.vp-chips').textContent = n ? st.angles.map((a) => `${a.toFixed(0)}°`).join(', ') : 'none yet';
    q('.vp-scan').disabled = n < NMAX; q('.vp-scan').hidden = st.shown;
  }
  function update(refit) {
    st.angles.sort((a, b) => a - b);
    if (st.shown && refit) compute();
    chips(); draw(); table();
  }

  // click to place, drag to move: positions from the pointer, through the slide's scale, in plot coordinates
  const toAngle = (ev) => { const b = host.getBoundingClientRect(), px = ((ev.clientX - b.left) / b.width) * W; return Math.round(((px - M.l) / (W - M.l - M.r)) * XMAX); };
  const inPlot = (ev) => { const b = host.getBoundingClientRect(), px = ((ev.clientX - b.left) / b.width) * W, py = ((ev.clientY - b.top) / b.height) * H; return px >= M.l - 8 && px <= W - M.r + 8 && py >= M.t && py <= H - M.b + 28; };
  let drag = -1;
  host.addEventListener('pointerdown', (ev) => {
    if (!inPlot(ev)) return;
    const a = Math.min(XMAX, Math.max(1, toAngle(ev)));
    let k = -1, best = 3; st.angles.forEach((x, i) => { if (Math.abs(x - a) <= best) { best = Math.abs(x - a); k = i; } });
    if (k < 0) { if (st.angles.length >= NMAX) return; st.angles.push(a); k = st.angles.length - 1; }
    drag = k; host.setPointerCapture(ev.pointerId); ev.preventDefault();
    st.angles[k] = a; draw(); chips();
  });
  host.addEventListener('pointermove', (ev) => {
    if (drag < 0) { host.style.cursor = inPlot(ev) ? (st.angles.some((x) => Math.abs(x - toAngle(ev)) <= 3) ? 'ew-resize' : (st.angles.length < NMAX ? 'copy' : 'default')) : 'default'; return; }
    st.angles[drag] = Math.min(XMAX, Math.max(1, toAngle(ev))); draw(); chips();
  });
  const end = () => { if (drag < 0) return; drag = -1; update(true); };
  host.addEventListener('pointerup', end); host.addEventListener('pointercancel', end);

  q('.vp-scan').addEventListener('click', (e) => { e.currentTarget.blur(); if (st.angles.length < NMAX) return; st.shown = true; update(true); });
  q('.vp-clear').addEventListener('click', (e) => { e.currentTarget.blur(); st.angles = []; st.shown = false; res = null; update(false); });
  trIn.addEventListener('input', () => { q('.vp-tr-read').textContent = `${trIn.value} ms`; update(true); });
  keepSlider(trIn);
  q('.vp-tr-read').textContent = `${trIn.value} ms`;
  onShow(slide, () => update(false));
})();
