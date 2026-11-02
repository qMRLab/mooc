/* Real images have noise (Exercise 4-5). #vfa-noise-q: two questions. (1) how many flip angles are enough to fit B1 at SNR 100
 * (WM, Ernst angle)? typed in; (2) is VFA alone with that many angles still more efficient than an AFI B1 map + 2 angles?
 * Scan time in units of TR_VFA: VFA alone N; AFI (TR1 = TR_VFA, TR2 = 5 TR1) is 6, plus 2 angles: 8. The feedback compares the
 * two with their own N, and points to the next slide.
 * #vfa-noise-check: the check. WM (T1 900 ms, PD 0.7), B1 1.1, TR 15 ms, σ = WM's Ernst-angle signal / 100 in every image.
 * T1 std (% of true) over 300 noisy repeats against scan time: VFA alone, N = 3…20 angles evenly spaced 3°–90° (whole degrees;
 * #vfa-fit reproduces each point with the same angles, fit and noise draws), fitting A, T1
 * and B1 (B1 in 0.7–1.3, as on #vfa-place); AFI (60°, n = 5, same σ) → B1, then VFA at the 0.71 × Ernst pair with that B1
 * fixed: one point at 8. Their guess N is marked. Computed when the slide is first shown, one N at a time. */
(function () {
  'use strict';
  const V = window.VFASIM; if (!V) return;
  const st = { n: null };

  // ---- the questions
  const qs = document.getElementById('vfa-noise-q');
  if (qs) {
    const q = (c) => qs.querySelector(c), nIn = q('.nq-n'), AFI_T = 8;
    const step2 = q('.nq-step2'), fb = q('.nq-fb');
    function submit() {
      const n = Math.round(Number(nIn.value));
      if (!Number.isFinite(n) || n < 1) { nIn.focus(); return; }
      st.n = n; window.vfaGuess = n; nIn.value = n; nIn.disabled = true; q('.nq-go').hidden = true; q('.nq-redo').hidden = false;
      q('.nq-mine').textContent = `${n}`; step2.hidden = false; reset2();
      document.dispatchEvent(new CustomEvent('vfa-guess', { detail: n }));
    }
    function reset2() { fb.hidden = true; qs.querySelectorAll('[data-nq]').forEach((b) => { b.disabled = false; b.classList.remove('nq-pick'); }); }
    q('.nq-go').addEventListener('click', (e) => { e.currentTarget.blur(); submit(); });
    nIn.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') submit(); });
    q('.nq-redo').addEventListener('click', (e) => {
      e.currentTarget.blur(); st.n = null; window.vfaGuess = null; nIn.disabled = false; nIn.value = ''; q('.nq-go').hidden = false; q('.nq-redo').hidden = true; step2.hidden = true; nIn.focus();
    });
    qs.querySelectorAll('[data-nq]').forEach((b) => b.addEventListener('click', () => {
      b.blur(); const yes = b.dataset.nq === 'yes', n = st.n, faster = n < AFI_T;
      qs.querySelectorAll('[data-nq]').forEach((x) => { x.disabled = true; x.classList.toggle('nq-pick', x === b); });
      let ok, msg;
      if (yes && !faster) { ok = false; msg = `Not by your own estimate: ${n} angles take ${n} × TR, while AFI (6 × TR) + 2 angles take 8 × TR. Adding a B<sub>1</sub> map is the faster route.`; }
      else if (!yes && !faster) { ok = true; msg = `By your own estimate, AFI (6 × TR) + 2 angles take 8 × TR, less than ${n} angles (${n} × TR).`; }
      else if (yes) { ok = true; msg = `On scan time, yes: ${n} × TR against 8 × TR for AFI (6 × TR) + 2 angles. But is the T<sub>1</sub> map as precise?`; }
      else { ok = null; msg = `On scan time alone, your ${n} angles (${n} × TR) are faster than AFI (6 × TR) + 2 angles (8 × TR), so it comes down to precision.`; }
      fb.hidden = false; fb.className = `nq-fb ${ok === false ? 'nq-wrong' : ok ? 'nq-right' : 'nq-maybe'}`;
      fb.innerHTML = `${ok === false ? '✗ ' : ok ? '✓ ' : ''}${msg} <b>We verify this on the next slide.</b>`;
    }));
  }

  // ---- the check
  const ck = document.getElementById('vfa-noise-check');
  if (!ck || !window.Plotly) return;
  const q = (c) => ck.querySelector(c), host = q('.nc-plot');
  const TR = 15, T1 = 900, PD = 0.7, B1 = 1.1, NMC = 300, NS = Array.from({ length: 18 }, (_, i) => i + 3);
  const E = Math.exp(-TR / T1), ERN = Math.acos(E) / V.DEG, SMAX = PD * V.model(ERN, 1, T1, TR), SIG = SMAX / 100;
  const std = (v) => { const m = v.reduce((a, b) => a + b, 0) / v.length; return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1)); };
  const PAIR = (() => {   // the two angles at 0.71 × the Ernst-angle signal (B1 = 1)
    const tg = 0.71 * V.model(ERN, 1, T1, TR);
    const sol = (lo, hi) => { const up = V.model(hi, 1, T1, TR) > V.model(lo, 1, T1, TR); for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if ((V.model(m, 1, T1, TR) < tg) === up) lo = m; else hi = m; } return (lo + hi) / 2; };
    return [sol(0.01, ERN), sol(ERN, 90)];
  })();
  function vfaOnly(n) {
    const al = V.evenAngles(n), r = V.rng(5 + n), t = [];   // the same seed as #vfa-fit's repeats, for these angles
    for (let i = 0; i < NMC; i++) t.push(V.fit(al, al.map((a) => PD * V.model(a, B1, T1, TR) + SIG * V.gauss(r)), TR, { b1lo: 0.7, b1hi: 1.3 }).t1);
    return (100 * std(t)) / T1;
  }
  function afiVfa() {
    const r = V.rng(9), t = [], [a1, a2] = V.afi(60, B1, T1, TR, 5 * TR);
    for (let i = 0; i < NMC; i++) {
      const b = V.afiB1(PD * a1 + SIG * V.gauss(r), PD * a2 + SIG * V.gauss(r), 60, 5);
      t.push(V.fit(PAIR, PAIR.map((a) => PD * V.model(a, B1, T1, TR) + SIG * V.gauss(r)), TR, { b1lo: b, b1hi: b }).t1);
    }
    return (100 * std(t)) / T1;
  }
  const res = { vfa: [], afi: null };
  const FONT = { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', size: 14, color: INK }, VC = '#c0392b', AC = '#1f5f99';
  function draw() {
    const xs = res.vfa.map((_, i) => NS[i]), g = st.n, traces = [];
    traces.push({ x: xs, y: res.vfa, mode: 'lines+markers', name: 'VFA alone, fitting A, T₁ and B₁', line: { color: VC, width: 3 }, marker: { size: 7, color: VC }, hoverinfo: 'skip' });
    if (res.afi != null) traces.push({ x: [8], y: [res.afi], mode: 'markers+text', name: 'AFI B₁ map + 2 angles', text: [`${res.afi.toFixed(1)} %`], textposition: 'bottom center', textfont: { size: 15, color: AC },
      marker: { size: 16, color: AC, symbol: 'diamond' }, hoverinfo: 'skip', cliponaxis: false });
    const gi = g != null ? NS.indexOf(g) : -1;
    if (gi >= 0 && gi < res.vfa.length) traces.push({ x: [g], y: [res.vfa[gi]], mode: 'markers+text', name: 'your guess', text: [`your ${g}: ${res.vfa[gi].toFixed(1)} %`], textposition: 'top right', textfont: { size: 15, color: VC },
      marker: { size: 18, color: 'rgba(0,0,0,0)', line: { color: INK, width: 2.5 } }, hoverinfo: 'skip', cliponaxis: false, showlegend: false });
    const top = Math.max(40, ...res.vfa.map((v) => v * 1.1));
    Plotly.react(host, traces, {
      width: 680, height: 430, margin: { l: 64, r: 16, t: 12, b: 56 }, font: FONT, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      xaxis: { title: { text: 'scan time (× TR), = number of VFA angles (+ 6 for AFI)' }, range: [2, 21], dtick: 2, gridcolor: '#eef1f4', zeroline: false, fixedrange: true },
      yaxis: { title: { text: 'T₁ std, % of true (WM)' }, range: [0, top], gridcolor: '#eef1f4', zeroline: false, fixedrange: true },
      legend: { x: 0.98, xanchor: 'right', y: 0.98, bgcolor: 'rgba(255,255,255,0.85)' }, dragmode: false,
    }, { displayModeBar: false, staticPlot: true });
    const mine = q('.nc-mine');
    if (g == null) mine.innerHTML = 'Answer the question on the previous slide to see your guess here.';
    else if (gi < 0) mine.innerHTML = `Your guess, <b>${g}</b> angles, is off this plot (3 to 20).`;
    else if (gi < res.vfa.length) mine.innerHTML = `Your guess, <b>${g}</b> angles (${g} × TR): T<sub>1</sub> std <b style="color:${VC}">${res.vfa[gi].toFixed(1)} %</b>.`;
    if (res.afi != null) q('.nc-afi').innerHTML = `AFI + 2 angles (8 × TR): T<sub>1</sub> std <b style="color:${AC}">${res.afi.toFixed(1)} %</b>.`;
    q('.nc-busy').hidden = res.vfa.length >= NS.length;
  }
  function run() {   // one N per tick, so the page stays responsive
    res.afi = afiVfa(); draw();
    const next = () => { if (res.vfa.length >= NS.length) { draw(); return; } res.vfa.push(vfaOnly(NS[res.vfa.length])); draw(); setTimeout(next, 0); };
    setTimeout(next, 0);
  }
  q('.nc-pair').textContent = `${PAIR[0].toFixed(1)}° and ${PAIR[1].toFixed(1)}°`;
  document.addEventListener('vfa-guess', () => { if (res.afi != null) draw(); });
  onShow(ck, run);
  Reveal.on('slidechanged', (e) => { if (e.currentSlide === ck && res.afi != null) draw(); });
})();
