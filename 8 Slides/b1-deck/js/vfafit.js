/* Fit T1 and B1 together from a VFA experiment? (#vfa-fit) One voxel, spoiled gradient echo at short TR, magnitude
 * signal S(α) = A·|sin θ|(1 − E1)/(1 − E1 cos θ), θ = αB1, E1 = e^(−TR/T1), A = M0·e^(−TE/T2*)·(receive).
 * Ideal receive and a known M0·e^(−TE/T2*): A is known, two unknowns (T1, B1). Gaussian noise, σ set by the SNR at the
 * Ernst angle (B1 = 1, R = 1). Least squares on (B1, T1) within the expected ranges: a grid (B1 linear, T1 log), then
 * Nelder–Mead in (B1, ln T1). Repeating the acquisition with fresh noise gives the fit's precision.
 * #vfa-fit-rx: every measurement × one receive factor R. The fit either assumes R = 1 (A known, as on #vfa-fit) or fits
 * A as a third unknown (closed form for each B1, T1). Noise is thermal: σ fixed, so the SNR scales with R. */
function vfaFitSlide(id, withRx) {
  'use strict';
  const slide = document.getElementById(id); if (!slide) return;
  const DEG = Math.PI / 180, T2S = 50, TE = 5, A0 = Math.exp(-TE / T2S);   // T2* 50 ms, TE 5 ms: A = 0.905 M0
  const NMC = 300, NSHOW = 25, B1LO = 0.5, B1HI = 1.5, T1LO = 100, T1HI = 5000;   // the fit's expected ranges
  const st = { b1: 1.2, t1: 1000, tr: 15, snr: 50, angles: [3, 17], seed: 1, spread: false, rx: withRx ? 0.7 : 1, fitA: false };
  const E1 = (t1) => Math.exp(-st.tr / t1);
  const sigma = () => { const e = E1(st.t1); return A0 * Math.sqrt((1 - e) / (1 + e)) / st.snr; };   // max SPGR signal ÷ SNR
  const nUnk = () => (st.fitA ? 3 : 2);

  // a small seeded generator, so a draw is the same until "New noise"
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const model = (al, b1, t1) => { const th = al * DEG * b1, e = E1(t1); return Math.abs(Math.sin(th)) * (1 - e) / (1 - e * Math.cos(th)); };

  function fit(al, y) {   // → { b1, t1, a }
    const n = al.length, m = new Array(n);
    const cost = (b, t) => {
      let sy = 0, ss = 0; for (let i = 0; i < n; i++) { m[i] = model(al[i], b, t); sy += m[i] * y[i]; ss += m[i] * m[i]; }
      const a = st.fitA ? (ss > 0 ? Math.max(0, sy / ss) : 0) : A0;
      let e = 0; for (let i = 0; i < n; i++) e += (y[i] - a * m[i]) ** 2; return [e, a];
    };
    const NB = 26, NT = 31; let bb = 1, bt = 1000, be = Infinity;
    for (let i = 0; i < NB; i++) { const b = B1LO + (B1HI - B1LO) * i / (NB - 1);
      for (let j = 0; j < NT; j++) { const t = T1LO * (T1HI / T1LO) ** (j / (NT - 1)), e = cost(b, t)[0]; if (e < be) { be = e; bb = b; bt = t; } } }
    // Nelder–Mead in (B1, ln T1), kept inside the ranges
    const LT0 = Math.log(T1LO), LT1 = Math.log(T1HI);
    const clamp = (p) => [Math.min(B1HI, Math.max(B1LO, p[0])), Math.min(LT1, Math.max(LT0, p[1]))];
    const f = (p) => cost(p[0], Math.exp(p[1]))[0];
    const pt = (p) => { p = clamp(p); return { p, v: f(p) }; };
    const S = [pt([bb, Math.log(bt)]), pt([bb + 0.02, Math.log(bt)]), pt([bb, Math.log(bt) + 0.07])];
    const along = (c, w, k) => pt([c[0] + k * (w[0] - c[0]), c[1] + k * (w[1] - c[1])]);
    for (let k = 0; k < 120; k++) {
      S.sort((a, b) => a.v - b.v);
      const c = [(S[0].p[0] + S[1].p[0]) / 2, (S[0].p[1] + S[1].p[1]) / 2], w = S[2].p, r = along(c, w, -1);
      if (r.v < S[0].v) { const e = along(c, w, -2); S[2] = e.v < r.v ? e : r; }
      else if (r.v < S[1].v) S[2] = r;
      else { const q = along(c, w, 0.5); if (q.v < S[2].v) S[2] = q; else for (let i = 1; i < 3; i++) S[i] = along(S[0].p, S[i].p, 0.5); }
    }
    S.sort((a, b) => a.v - b.v);
    const b = S[0].p[0], t = Math.exp(S[0].p[1]); return { b1: b, t1: t, a: cost(b, t)[1] };
  }
  function acquire(r) { const sig = sigma(); return st.angles.map((al) => A0 * st.rx * model(al, st.b1, st.t1) + sig * gauss(r)); }

  const host = slide.querySelector('[data-key="vfafit"]');
  const XS = Array.from({ length: 361 }, (_, i) => i / 2);
  const T1C = Array.from({ length: 101 }, (_, i) => B1LO + i / 100);   // B1 values for the T1·B1² = const curve
  function draw() {
    const r = rng(st.seed), sig = sigma(), xmax = Math.max(90, ...st.angles.map((a) => a + 5));
    const traces = [];
    if (withRx) traces.push({ x: XS, y: XS.map((x) => A0 * model(x, st.b1, st.t1)), name: 'without the receive field', line: { color: '#9aa5b1', width: 1.5, dash: 'dot' }, hovertemplate: '%{x}°: %{y:.4f}<extra>no receive</extra>' });
    traces.push({ x: XS, y: XS.map((x) => A0 * st.rx * model(x, st.b1, st.t1)), name: `true signal curve${withRx ? ` (× R = ${st.rx.toFixed(2)})` : ''}`, line: { color: '#9aa5b1', width: 3 }, hovertemplate: '%{x}°: %{y:.4f}<extra>true</extra>' });
    const t1c = st.t1 * st.b1 * st.b1;
    traces.push({ x: T1C, y: T1C.map((b) => t1c / (b * b)), xaxis: 'x2', yaxis: 'y2', mode: 'lines', name: 'T<sub>1</sub>·B<sub>1</sub>² = true value', line: { color: '#7b3fa0', width: 1.5, dash: 'dot' }, hoverinfo: 'skip' });
    let res = null, draws = [];
    if (st.angles.length >= nUnk()) {
      const y = acquire(r); res = fit(st.angles, y);
      for (let k = 0; k < NMC; k++) draws.push(fit(st.angles, acquire(r)));
      if (st.spread) draws.slice(0, NSHOW).forEach((d, k) => traces.push({ x: XS, y: XS.map((x) => d.a * model(x, d.b1, d.t1)), mode: 'lines', line: { color: 'rgba(31, 95, 153, 0.13)', width: 1.5 }, hoverinfo: 'skip', name: 'fits if the scan were repeated (new noise)', legendgroup: 'mc', showlegend: k === 0 }));
      traces.push({ x: XS, y: XS.map((x) => res.a * model(x, res.b1, res.t1)), name: 'curve fitted to the measured points', line: { color: '#1f5f99', width: 2.4, dash: 'dash' }, hovertemplate: '%{x}°: %{y:.4f}<extra>fit</extra>' });
      traces.push({ x: st.angles, y, mode: 'markers', name: 'measured (± noise)', marker: { color: '#e8770e', size: 11, line: { color: '#fff', width: 2 } }, error_y: { type: 'constant', value: sig, color: '#e8770e', thickness: 1.5, width: 5 }, hovertemplate: '%{x}°: %{y:.4f}<extra>measured</extra>' });
      traces.push({ x: draws.map((d) => d.b1), y: draws.map((d) => d.t1), xaxis: 'x2', yaxis: 'y2', mode: 'markers', name: `fits of ${NMC} repeated scans`, marker: { color: 'rgba(31, 95, 153, 0.3)', size: 5 }, hovertemplate: 'B<sub>1</sub> %{x:.3f}, T<sub>1</sub> %{y:.0f} ms<extra>repeat</extra>' });
      traces.push({ x: [res.b1], y: [res.t1], xaxis: 'x2', yaxis: 'y2', mode: 'markers', name: 'this acquisition', showlegend: false, marker: { color: '#e8770e', size: 11, line: { color: '#fff', width: 2 } }, hovertemplate: 'B<sub>1</sub> %{x:.3f}, T<sub>1</sub> %{y:.0f} ms<extra>this fit</extra>' });
    } else if (st.angles.length) {
      traces.push({ x: st.angles, y: acquire(r), mode: 'markers', name: 'measured (± noise)', marker: { color: '#e8770e', size: 11 } });
    }
    traces.push({ x: [st.b1], y: [st.t1], xaxis: 'x2', yaxis: 'y2', mode: 'markers', name: 'true', showlegend: false, marker: { color: INK, size: 13, symbol: 'x-thin', line: { color: INK, width: 3 } }, hovertemplate: 'true: B<sub>1</sub> %{x:.2f}, T<sub>1</sub> %{y:.0f} ms<extra></extra>' });
    const ymax = 1.15 * Math.max(...XS.map((x) => A0 * Math.max(1, st.rx) * model(x, st.b1, st.t1))) + 2 * sig;   // room for the curve without receive too
    Plotly.react(host, traces, {
      width: 760, height: 430, margin: { l: 58, r: 12, t: 74, b: 48 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', size: 13.5, color: INK },
      xaxis: { domain: [0, 0.55], title: { text: 'nominal flip angle α (°) — click to add', standoff: 4 }, range: [0, xmax], dtick: xmax > 90 ? 30 : 15, fixedrange: true, zeroline: false, gridcolor: '#eef1f4' },
      yaxis: { title: { text: 'signal (× M<sub>0</sub>)', standoff: 4 }, range: [-0.005, ymax], fixedrange: true, zeroline: true, zerolinecolor: '#d8dee6', gridcolor: '#eef1f4' },
      xaxis2: { domain: [0.68, 1], anchor: 'y2', title: { text: 'fitted B<sub>1</sub>', standoff: 4 }, range: [B1LO - 0.03, B1HI + 0.03], dtick: 0.25, fixedrange: true, zeroline: false, gridcolor: '#eef1f4' },
      yaxis2: { anchor: 'x2', type: 'log', title: { text: 'fitted T<sub>1</sub> (ms)', standoff: 2 }, range: [Math.log10(T1LO) - 0.05, Math.log10(T1HI) + 0.05], tickvals: [100, 200, 500, 1000, 2000, 5000], fixedrange: true, gridcolor: '#eef1f4' },
      legend: { orientation: 'h', x: 0, y: 1.02, yanchor: 'bottom', font: { size: 12 } }, hovermode: 'closest',
    }, { displayModeBar: false, scrollZoom: false, responsive: false });
    // stats
    const q = (c) => slide.querySelector(c);
    q('.vf-true-b1').textContent = st.b1.toFixed(3); q('.vf-true-t1').textContent = `${st.t1.toFixed(0)} ms`;
    const cells = ['.vf-fit-b1', '.vf-fit-t1', '.vf-mc-b1', '.vf-mc-t1', '.vf-prec-b1', '.vf-prec-t1', '.vf-bias-b1', '.vf-bias-t1'];
    if (res) {
      // median and 1.4826·MAD over the draws
      const stat = (key) => { const v = draws.map((d) => d[key]).sort((a, b) => a - b), med = v[Math.floor(NMC / 2)];
        return [med, 1.4826 * draws.map((d) => Math.abs(d[key] - med)).sort((a, b) => a - b)[Math.floor(NMC / 2)]]; };
      const [mb, sb] = stat('b1'), [mt, stt] = stat('t1');
      const pc = (v) => `${(100 * v).toFixed(1).replace(/^-0\.0$/, '0.0').replace('-', '−')} %`;
      q('.vf-fit-b1').textContent = res.b1.toFixed(3); q('.vf-fit-t1').textContent = `${res.t1.toFixed(0)} ms`;
      q('.vf-mc-b1').textContent = `${mb.toFixed(3)} ± ${sb.toFixed(3)}`; q('.vf-mc-t1').textContent = `${mt.toFixed(0)} ± ${stt.toFixed(0)}`;
      q('.vf-prec-b1').textContent = pc(sb / st.b1); q('.vf-prec-t1').textContent = pc(stt / st.t1);
      q('.vf-bias-b1').textContent = pc(mb / st.b1 - 1); q('.vf-bias-t1').textContent = pc(mt / st.t1 - 1);
      const edge = draws.filter((d) => d.b1 <= B1LO + 0.003 || d.b1 >= B1HI - 0.003 || d.t1 <= T1LO * 1.01 || d.t1 >= T1HI * 0.99).length;
      q('.vf-edge').textContent = `${(100 * edge / NMC).toFixed(0)} %`;
      if (withRx) { q('.vf-a').textContent = st.fitA ? `${(res.a / A0).toFixed(3)} (true R ${st.rx.toFixed(2)})` : 'fixed at 1 (R assumed 1)'; }
    } else { cells.concat('.vf-edge', '.vf-a').forEach((c) => { const e = q(c); if (e) e.textContent = '–'; }); q('.vf-fit-b1').textContent = `need ${nUnk()} angles for ${nUnk()} unknowns`; }
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
  slide.querySelectorAll('[data-vfpre]').forEach((b) => b.addEventListener('click', () => { b.blur(); st.angles = b.dataset.vfpre.split(',').map(Number); draw(); }));
  slide.querySelector('.ff-clear').addEventListener('click', (e) => { e.currentTarget.blur(); st.angles = []; draw(); });
  slide.querySelector('.ff-noise').addEventListener('click', (e) => { e.currentTarget.blur(); st.seed += 1; draw(); });
  const spB = slide.querySelector('.ff-spread');
  spB.addEventListener('click', () => { st.spread = !st.spread; spB.setAttribute('aria-pressed', String(st.spread)); spB.blur(); draw(); });
  const bind = (cls, key, fmt, toState) => {
    const el = slide.querySelector(`.${cls}`), out = slide.querySelector(`.${cls}-read`);
    const show = () => { out.textContent = fmt(st[key]); };
    el.addEventListener('input', () => { st[key] = toState(Number(el.value)); show(); draw(); });
    keepSlider(el); show();
    return { el, show };
  };
  bind('vf-b1', 'b1', (v) => v.toFixed(2), (v) => v);
  bind('vf-t1', 't1', (v) => `${v.toFixed(0)} ms`, (v) => v);
  bind('vf-tr', 'tr', (v) => `${v.toFixed(0)} ms`, (v) => v);
  bind('vf-snr', 'snr', (v) => v.toFixed(0), (v) => Math.round(10 ** v));
  if (withRx) {
    const rx = bind('vf-rx', 'rx', (v) => v.toFixed(2), (v) => Number((10 ** v).toPrecision(2)));   // log slider, 0.25–4
    slide.querySelector('.vf-rand').addEventListener('click', (e) => {   // log-uniform in 0.5–2
      e.currentTarget.blur(); const lg = Math.log10(0.5) + Math.random() * Math.log10(4);
      st.rx = Number((10 ** lg).toPrecision(2)); rx.el.value = String(Math.log10(st.rx)); rx.show(); draw();
    });
    segToggle(slide, 'vffit', (v) => { st.fitA = v === 'a'; draw(); });
  }
  onShow(slide, () => { draw(); if (!host._vfClick) { host._vfClick = true; host.on('plotly_click', (e) => { const p = e.points && e.points[0]; if (p && p.data.xaxis !== 'x2') add(p.x); }); } });
}
vfaFitSlide('vfa-fit', false);
vfaFitSlide('vfa-fit-rx', true);
