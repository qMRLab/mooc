/* Why do a double angle at all? (#fa-fit) One voxel, FLASH at TR ≫ 5·T1 and a fixed TE, so the magnitude signal at
 * nominal flip angle α is S(α) = A·|sin(αB1)|, with A = M0·e^(−TE/T2*)·(receive). Pick any angles, acquire them with
 * Gaussian noise (σ = A/SNR), and fit A and B1 by least squares, with B1 kept within the expected range (as in practice):
 * for each B1 on a grid, A has a closed form; the best B1 is then refined by golden-section search. Repeating the acquisition with fresh noise gives the fit's precision.
 * #fa-fit-rx: the same, with every measurement multiplied by one receive factor R. Noise is either thermal (σ fixed,
 * set by the SNR at R = 1, so the SNR scales with R) or scaled with the signal (σ × R, the SNR stays the same). */
function faFitSlide(id, withRx) {
  'use strict';
  const slide = document.getElementById(id); if (!slide) return;
  const DEG = Math.PI / 180, T2S = 50, TE = 5, A0 = Math.exp(-TE / T2S);   // T2* 50 ms, TE 5 ms: A = 0.905 M0
  const NMC = 300, NSHOW = 25, B1LO = 0.5, B1HI = 1.5;   // the fit's B1 range: the expected range (the slider's)
  const st = { b1: 1.2, snr: 50, angles: [60, 120], seed: 1, spread: false, rx: withRx ? 0.3 : 1, noise: 'thermal' };
  const sigma = () => (A0 / st.snr) * (st.noise === 'scaled' ? st.rx : 1);

  // a small seeded generator, so a draw is the same until "New noise"
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const model = (al, b1) => Math.abs(Math.sin(al * DEG * b1));

  function fit(al, y) {   // → { b1, a }
    const sse = (b) => { let sy = 0, ss = 0; for (let i = 0; i < al.length; i++) { const m = model(al[i], b); sy += m * y[i]; ss += m * m; }
      const a = ss > 0 ? sy / ss : 0; let e = 0; for (let i = 0; i < al.length; i++) e += (y[i] - a * model(al[i], b)) ** 2; return [e, a]; };
    let best = B1LO, be = Infinity;
    for (let b = B1LO; b <= B1HI + 1e-9; b += 0.002) { const [e] = sse(b); if (e < be) { be = e; best = b; } }
    let lo = Math.max(B1LO, best - 0.002), hi = Math.min(B1HI, best + 0.002);
    for (let k = 0; k < 40; k++) { const m1 = lo + (hi - lo) * 0.382, m2 = lo + (hi - lo) * 0.618; if (sse(m1)[0] < sse(m2)[0]) hi = m2; else lo = m1; }
    const b = (lo + hi) / 2; return { b1: b, a: sse(b)[1] };
  }
  function acquire(r) { const sig = sigma(); return st.angles.map((al) => A0 * st.rx * model(al, st.b1) + sig * gauss(r)); }

  const host = slide.querySelector('[data-key="fafit"]');
  const XS = Array.from({ length: 181 }, (_, i) => i);
  function draw() {
    const al = st.angles.slice().sort((a, b) => a - b), r = rng(st.seed), sig = sigma();
    const traces = [];
    if (withRx) traces.push({ x: XS, y: XS.map((x) => A0 * model(x, st.b1)), name: 'without the receive field', line: { color: '#9aa5b1', width: 1.5, dash: 'dot' }, hovertemplate: '%{x}°: %{y:.3f}<extra>no receive</extra>' });
    traces.push({ x: XS, y: XS.map((x) => A0 * st.rx * model(x, st.b1)), name: `true signal curve (B<sub>1</sub> = ${st.b1.toFixed(2)}${withRx ? `, × R = ${st.rx.toFixed(2)}` : ''})`, line: { color: '#9aa5b1', width: 3 }, hovertemplate: '%{x}°: %{y:.3f}<extra>true</extra>' });
    let res = null, draws = [];
    if (al.length >= 2) {
      const y = acquire(r); res = fit(st.angles, y);
      for (let k = 0; k < NMC; k++) draws.push(fit(st.angles, acquire(r)));
      if (st.spread) draws.slice(0, NSHOW).forEach((d, k) => traces.push({ x: XS, y: XS.map((x) => d.a * model(x, d.b1)), mode: 'lines', line: { color: 'rgba(31, 95, 153, 0.13)', width: 1.5 }, hoverinfo: 'skip', name: 'fits if the scan were repeated (new noise)', legendgroup: 'mc', showlegend: k === 0 }));
      traces.push({ x: XS, y: XS.map((x) => res.a * model(x, res.b1)), name: `curve fitted to the measured points (B<sub>1</sub> = ${res.b1.toFixed(3)})`, line: { color: '#1f5f99', width: 2.4, dash: 'dash' }, hovertemplate: '%{x}°: %{y:.3f}<extra>fit</extra>' });
      traces.push({ x: st.angles, y, mode: 'markers', name: 'measured (± noise)', marker: { color: '#e8770e', size: 11, line: { color: '#fff', width: 2 } }, error_y: { type: 'constant', value: sig, color: '#e8770e', thickness: 1.5, width: 5 }, hovertemplate: '%{x}°: %{y:.3f}<extra>measured</extra>' });
    } else if (al.length === 1) {
      traces.push({ x: st.angles, y: acquire(r), mode: 'markers', name: 'measured (± noise)', marker: { color: '#e8770e', size: 11 } });
    }
    Plotly.react(host, traces, {
      width: 760, height: 430, margin: { l: 58, r: 16, t: 50, b: 48 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', size: 13.5, color: INK },
      xaxis: { title: { text: 'nominal flip angle α (°) — click to add an angle', standoff: 4 }, range: [0, 180], dtick: 30, fixedrange: true, zeroline: false, gridcolor: '#eef1f4' },
      yaxis: { title: { text: 'signal (× M<sub>0</sub>)', standoff: 4 }, range: [-0.05, Math.max(1.1, 1.1 * A0 * st.rx + 2 * sig)], fixedrange: true, zeroline: true, zerolinecolor: '#d8dee6', gridcolor: '#eef1f4' },
      legend: { orientation: 'h', x: 0, y: 1.02, yanchor: 'bottom', font: { size: 12.5 } }, hovermode: 'closest',
    }, { displayModeBar: false, scrollZoom: false, responsive: false });
    // stats
    const q = (c) => slide.querySelector(c);
    q('.ff-true').textContent = st.b1.toFixed(3);
    if (res) {
      // median and 1.4826·MAD over the draws
      const v = draws.map((d) => d.b1).sort((a, b) => a - b), med = v[Math.floor(NMC / 2)];
      const mad = 1.4826 * draws.map((d) => Math.abs(d.b1 - med)).sort((a, b) => a - b)[Math.floor(NMC / 2)];
      q('.ff-fit').textContent = res.b1.toFixed(3);
      q('.ff-mc').textContent = `${med.toFixed(3)} ± ${mad.toFixed(3)}`;
      const edge = draws.filter((d) => d.b1 <= B1LO + 0.003 || d.b1 >= B1HI - 0.003).length;   // fits stuck on the range limits
      q('.ff-prec').textContent = edge > NMC / 10 ? `${(100 * mad / st.b1).toFixed(1)} %, but ${(100 * edge / NMC).toFixed(0)} % of fits hit the range limit` : `${(100 * mad / st.b1).toFixed(1)} %`;
      q('.ff-bias').textContent = `${(100 * (med / st.b1 - 1)).toFixed(1).replace(/^-0\.0$/, '0.0').replace('-', '−')} %`;
      if (withRx) { q('.ff-a').textContent = `${(res.a / A0).toFixed(3)} (true R ${st.rx.toFixed(3)})`; q('.ff-snrnow').textContent = (A0 * st.rx / sig).toFixed(1); }
    } else ['.ff-fit', '.ff-mc', '.ff-prec', '.ff-bias', '.ff-a', '.ff-snrnow'].forEach((c) => { const e = q(c); if (e) e.textContent = 'need 2 angles'; });
    const chips = q('.ff-chips'); chips.innerHTML = '';
    st.angles.forEach((a, i) => {
      const b = document.createElement('button'); b.className = 'bs-btn ff-chip'; b.innerHTML = `${a}° <span aria-hidden="true">×</span>`; b.title = 'Remove this angle';
      b.addEventListener('click', () => { st.angles.splice(i, 1); draw(); });
      chips.appendChild(b);
    });
  }
  const add = (a) => { a = Math.round(a); if (a >= 1 && a <= 180 && !st.angles.includes(a)) { st.angles.push(a); draw(); } };
  slide.querySelector('.ff-add').addEventListener('click', (e) => { e.currentTarget.blur(); add(Number(slide.querySelector('.ff-in').value)); });
  slide.querySelector('.ff-in').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') add(Number(e.currentTarget.value)); });
  slide.querySelectorAll('[data-ffpre]').forEach((b) => b.addEventListener('click', () => { b.blur(); st.angles = b.dataset.ffpre.split(',').map(Number); draw(); }));
  slide.querySelector('.ff-clear').addEventListener('click', (e) => { e.currentTarget.blur(); st.angles = []; draw(); });
  slide.querySelector('.ff-noise').addEventListener('click', (e) => { e.currentTarget.blur(); st.seed += 1; draw(); });
  const spB = slide.querySelector('.ff-spread');
  spB.addEventListener('click', () => { st.spread = !st.spread; spB.setAttribute('aria-pressed', String(st.spread)); spB.blur(); draw(); });
  const bind = (cls, key, fmt, toState) => {
    const el = slide.querySelector(`.${cls}`), out = slide.querySelector(`.${cls}-read`);
    const show = () => { out.textContent = fmt(st[key]); };
    el.addEventListener('input', () => { st[key] = toState(Number(el.value)); show(); draw(); });
    keepSlider(el); show();
  };
  bind('ff-b1', 'b1', (v) => v.toFixed(2), (v) => v);
  bind('ff-snr', 'snr', (v) => v.toFixed(0), (v) => Math.round(10 ** v));
  if (withRx) {
    bind('ff-rx', 'rx', (v) => v.toFixed(2), (v) => Math.min(2, Number((10 ** v).toPrecision(2))));   // log slider, 0.01–2
    segToggle(slide, 'ffnoise', (v) => { st.noise = v; draw(); });
  }
  onShow(slide, () => { draw(); if (!host._ffClick) { host._ffClick = true; host.on('plotly_click', (e) => { if (e.points && e.points[0]) add(e.points[0].x); }); } });
}
faFitSlide('fa-fit', false);
faFitSlide('fa-fit-rx', true);
