/* VFA on the brain, fitting T1 and B1 per voxel (#vfa-brain): the voxel of #vfa-fit-rx, now every brain voxel of the
 * measured slice (fl-data.js): its measured T1, the measured transmit B1 map, PD·e^(−TE/T2) from the WM/GM/CSF
 * fractions (the #fl guesses), seen through movable receive coils, plus Gaussian noise (one draw per voxel):
 *   S_i = R · A · |sin θ_i|(1 − E1)/(1 − E1 cos θ_i) + noise,  θ_i = α_i B1,  E1 = e^(−TR/T1)
 * Thermal noise as on #vfa-fit-rx: σ fixed over the image, set by the SNR of a typical voxel (brain-mean A, T1 1 s,
 * B1 1, R 1) at its Ernst angle, so voxels the coils see poorly get a lower SNR. "No noise" turns it off.
 * Fit per voxel, B1 in 0.5–1.5 and T1 in 100–6000 ms: "assume R = 1" (A known, two unknowns) or "fit A too" (three).
 * Grid (B1 linear, T1 log; sin/cos/E1 precomputed) then Nelder–Mead in (B1, ln T1), as on #vfa-fit.
 * Receive: loops seen edge-on (two antiparallel wires), quasi-static, |B1−| = |B⊥|/2, root-sum-of-squares, normalized
 * to the brain mean, as on #fl-rx (a compact copy: drag a coil's centre; it keeps facing the head).
 * #vfa-afi (below): the same coils; an AFI B1 map, then VFA with B1 fixed to it, vs the 3-unknown fit. */
(function () {
  'use strict';
  const slide = document.getElementById('vfa-brain'); const D = window.FLASH_BRAIN; if (!slide || !D) return;
  const NR = D.grid.rows, NC = D.grid.cols, N = NR * NC, PIX = D.grid.mm * 1e-3, DEG = Math.PI / 180;
  const bytes = (b64) => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const T1 = new Uint16Array(bytes(D.t1_ms).buffer), SEG = bytes(D.seg), WM = bytes(D.wm), GM = bytes(D.gm), CSF = bytes(D.csf);
  const B1 = Array.from(new Uint16Array(bytes(D.b1).buffer), (v) => (v === 65535 ? NaN : v / 20000));
  const PD = { wm: 0.69 * Math.exp(-5 / 70), gm: 0.8 * Math.exp(-5 / 90), csf: Math.exp(-5 / 1000) };   // PD·e^(−TE/T2), TE 5 ms
  const BRAIN = new Uint8Array(N), A = new Float64Array(N), HEAD = new Uint8Array(N);
  for (let k = 0; k < N; k++) {
    HEAD[k] = SEG[k] > 0 ? 1 : 0;
    BRAIN[k] = WM[k] + GM[k] + CSF[k] > 50 && Number.isFinite(B1[k]) && T1[k] > 0 ? 1 : 0;
    A[k] = (WM[k] * PD.wm + GM[k] * PD.gm + CSF[k] * PD.csf) / 100;
  }
  const B1LO = 0.5, B1HI = 1.5, T1LO = 100, T1HI = 6000;
  const st = { angles: [3, 17], tr: 15, fitA: false, coils: [], sel: -1, snr: 200, noise: true, seed: 1 };
  let ABAR = 0, nb = 0; for (let k = 0; k < N; k++) if (BRAIN[k]) { ABAR += A[k]; nb++; } ABAR /= nb;
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

  // ---- receive coils (as #fl-rx) ----
  const LAB = 0.16, LOOP = 0.08, WIRE = 0.003, MARGIN = 0.012;
  const U = (j) => (j - (NC - 1) / 2) * PIX, V = (i) => ((NR - 1) / 2 - i) * PIX;
  let cu = 0, cv = 0, nh = 0;
  for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) if (HEAD[i * NC + j]) { cu += U(j); cv += V(i); nh++; }
  cu /= nh; cv /= nh;
  const RM = Math.ceil(MARGIN / PIX), FAR = new Uint8Array(N);   // the head dilated by MARGIN
  for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) {
    let hit = 0;
    for (let di = -RM; di <= RM && !hit; di++) for (let dj = -RM; dj <= RM && !hit; dj++) { const a = i + di, b = j + dj; if (a >= 0 && a < NR && b >= 0 && b < NC && di * di + dj * dj <= RM * RM && HEAD[a * NC + b]) hit = 1; }
    FAR[i * NC + j] = hit;
  }
  const nearHead = (u, v) => { const i = Math.round((NR - 1) / 2 - v / PIX), j = Math.round(u / PIX + (NC - 1) / 2); return i >= 0 && i < NR && j >= 0 && j < NC && FAR[i * NC + j]; };
  function setCoil(c, u, v) {   // the loop faces the head; both wires stay ≥ MARGIN from it (slides out along the ray)
    u = Math.max(-LAB + 0.01, Math.min(LAB - 0.01, u)); v = Math.max(-LAB + 0.01, Math.min(LAB - 0.01, v));
    let du = u - cu, dv = v - cv; const r = Math.hypot(du, dv) || 1; du /= r; dv /= r;
    const ang = Math.atan2(v - cv, u - cu) + Math.PI / 2, eu = Math.cos(ang) * LOOP / 2, ev = Math.sin(ang) * LOOP / 2;
    for (let s = 0; s < 600 && (nearHead(u, v) || nearHead(u + eu, v + ev) || nearHead(u - eu, v - ev)); s++) { u += du * 5e-4; v += dv * 5e-4; }
    c.u = u; c.v = v; c.w = [[u + eu, v + ev, 1], [u - eu, v - ev, -1]]; return c;
  }
  const around = (phi, d = 0.02) => {
    let u = cu, v = cv; for (let s = 0; s < 600 && (nearHead(u, v) || Math.hypot(u - cu, v - cv) < 0.05); s++) { u += Math.cos(phi) * 5e-4; v += Math.sin(phi) * 5e-4; }
    return setCoil({}, u + Math.cos(phi) * (d - MARGIN), v + Math.sin(phi) * (d - MARGIN));
  };
  const PRESETS = {
    ring8: () => Array.from({ length: 8 }, (_, k) => around((2 * Math.PI * k) / 8 + Math.PI / 8)),
    side: () => Array.from({ length: 4 }, (_, k) => around(Math.PI * (0.6 + (0.8 * k) / 3))),
    back: () => Array.from({ length: 3 }, (_, k) => around(-Math.PI / 2 + (k - 1) * 0.45)),
    one: () => [around(Math.PI / 2)],
  };
  const rss = (u, v) => {
    let s2 = 0;
    for (const c of st.coils) { let bx = 0, by = 0; for (const [px, py, sg] of c.w) { const dx = u - px, dy = v - py, f = sg / Math.max(dx * dx + dy * dy, WIRE * WIRE); bx -= dy * f; by += dx * f; } s2 += bx * bx + by * by; }
    return Math.sqrt(s2) / 2;
  };
  function field() {   // ÷ brain mean
    const f = new Float64Array(N); let sum = 0, n = 0;
    for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) { const k = i * NC + j; if (BRAIN[k]) { f[k] = rss(U(j), V(i)); sum += f[k]; n++; } }
    for (let k = 0; k < N; k++) f[k] /= sum / n || 1;
    return f;
  }

  // ---- the fit ----
  const NB = 26, NT = 31, GB = Array.from({ length: NB }, (_, i) => B1LO + ((B1HI - B1LO) * i) / (NB - 1)), GT = Array.from({ length: NT }, (_, j) => T1LO * (T1HI / T1LO) ** (j / (NT - 1)));
  // the noisy VFA signals of every brain voxel (thermal noise: one σ for the image), n per voxel
  const sigmaFor = (tr, snr, on) => { const Er = Math.exp(-tr / 1000); return on ? (ABAR * Math.sqrt((1 - Er) / (1 + Er))) / snr : 0; };
  function vfaData(R, al, tr, sig, seed) {
    const n = al.length, Y = new Float64Array(N * n).fill(NaN), r = rng(seed);
    for (let k = 0; k < N; k++) {
      if (!BRAIN[k]) continue;
      const E0 = Math.exp(-tr / T1[k]);
      for (let i = 0; i < n; i++) { const th = al[i] * DEG * B1[k]; Y[k * n + i] = R[k] * A[k] * Math.abs(Math.sin(th)) * (1 - E0) / (1 - E0 * Math.cos(th)) + sig * gauss(r); }
    }
    return Y;
  }
  // fit every voxel. mode 'r1': A known (= the true A, ideal receive), B1 and T1 free; 'a': A, B1, T1 free;
  // 'fix': B1 fixed from the map B1fix, A and T1 free (T1 on the grid, then golden-section in ln T1)
  function fitVFA(Y, al, tr, mode, B1fix) {
    const n = al.length;
    const SIN = GB.map((b) => al.map((a) => Math.abs(Math.sin(a * DEG * b)))), COS = GB.map((b) => al.map((a) => Math.cos(a * DEG * b))), GE = GT.map((t) => Math.exp(-tr / t));
    const fb = new Float64Array(N).fill(NaN), ft = new Float64Array(N).fill(NaN), y = new Float64Array(n), m = new Float64Array(n);
    const LT0 = Math.log(T1LO), LT1 = Math.log(T1HI);
    let edge = 0, cnt = 0;
    for (let k = 0; k < N; k++) {
      if (!BRAIN[k]) continue;
      for (let i = 0; i < n; i++) y[i] = Y[k * n + i];
      const sse = () => {   // m[] holds the model shape; A known (×A[k]) or in closed form
        let sy = 0, ss = 0; for (let i = 0; i < n; i++) { sy += m[i] * y[i]; ss += m[i] * m[i]; }
        const a = mode === 'r1' ? A[k] : (ss > 0 ? Math.max(0, sy / ss) : 0);
        let e = 0; for (let i = 0; i < n; i++) e += (y[i] - a * m[i]) ** 2; return e;
      };
      if (mode === 'fix') {
        const b = Math.min(2, Math.max(0.3, B1fix[k])), sn = al.map((a) => Math.abs(Math.sin(a * DEG * b))), cs = al.map((a) => Math.cos(a * DEG * b));
        const g = (lt) => { const E = Math.exp(-tr / Math.exp(lt)); for (let i = 0; i < n; i++) m[i] = sn[i] * (1 - E) / (1 - E * cs[i]); return sse(); };
        let bj = 0, be = Infinity;
        for (let j = 0; j < NT; j++) { const e = g(Math.log(GT[j])); if (e < be) { be = e; bj = j; } }
        let lo = Math.log(GT[Math.max(0, bj - 1)]), hi = Math.log(GT[Math.min(NT - 1, bj + 1)]);
        for (let it = 0; it < 40; it++) { const m1 = lo + (hi - lo) * 0.382, m2 = lo + (hi - lo) * 0.618; if (g(m1) < g(m2)) hi = m2; else lo = m1; }
        fb[k] = B1fix[k]; ft[k] = Math.exp((lo + hi) / 2); cnt++;
        if (ft[k] <= T1LO * 1.01 || ft[k] >= T1HI * 0.99) edge++;
        continue;
      }
      let bi = 0, bj = 0, be = Infinity;
      for (let a = 0; a < NB; a++) for (let b = 0; b < NT; b++) {
        const E = GE[b]; for (let i = 0; i < n; i++) m[i] = SIN[a][i] * (1 - E) / (1 - E * COS[a][i]);
        const e = sse(); if (e < be) { be = e; bi = a; bj = b; }
      }
      const f = (p) => { const b = Math.min(B1HI, Math.max(B1LO, p[0])), E = Math.exp(-tr / Math.exp(Math.min(LT1, Math.max(LT0, p[1])))); for (let i = 0; i < n; i++) { const th = al[i] * DEG * b; m[i] = Math.abs(Math.sin(th)) * (1 - E) / (1 - E * Math.cos(th)); } return sse(); };
      const clamp = (p) => [Math.min(B1HI, Math.max(B1LO, p[0])), Math.min(LT1, Math.max(LT0, p[1]))];
      const pt = (p) => { p = clamp(p); return { p, v: f(p) }; };
      const S = [pt([GB[bi], Math.log(GT[bj])]), pt([GB[bi] + 0.02, Math.log(GT[bj])]), pt([GB[bi], Math.log(GT[bj]) + 0.07])];
      const along = (c, w, t) => pt([c[0] + t * (w[0] - c[0]), c[1] + t * (w[1] - c[1])]);
      for (let it = 0; it < 120; it++) {
        S.sort((a, b) => a.v - b.v);
        const c = [(S[0].p[0] + S[1].p[0]) / 2, (S[0].p[1] + S[1].p[1]) / 2], w = S[2].p, r = along(c, w, -1);
        if (r.v < S[0].v) { const e = along(c, w, -2); S[2] = e.v < r.v ? e : r; }
        else if (r.v < S[1].v) S[2] = r;
        else { const q = along(c, w, 0.5); if (q.v < S[2].v) S[2] = q; else for (let i = 1; i < 3; i++) S[i] = along(S[0].p, S[i].p, 0.5); }
      }
      S.sort((a, b) => a.v - b.v);
      fb[k] = S[0].p[0]; ft[k] = Math.exp(S[0].p[1]); cnt++;
      if (fb[k] <= B1LO + 0.003 || fb[k] >= B1HI - 0.003 || ft[k] <= T1LO * 1.01 || ft[k] >= T1HI * 0.99) edge++;
    }
    return { fb, ft, edge: edge / cnt };
  }

  // ---- maps (cropped to the brain) ----
  let r0 = NR, r1 = 0, c0 = NC, c1 = 0;
  for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) if (BRAIN[i * NC + j]) { r0 = Math.min(r0, i); r1 = Math.max(r1, i); c0 = Math.min(c0, j); c1 = Math.max(c1, j); }
  r0 = Math.max(0, r0 - 1); r1 = Math.min(NR - 1, r1 + 1); c0 = Math.max(0, c0 - 1); c1 = Math.min(NC - 1, c1 + 1);
  const CR = r1 - r0 + 1, CC = c1 - c0 + 1, MW = 118, MH = Math.round((MW * CR) / CC);
  const grid = (f) => Array.from({ length: CR }, (_, i) => Array.from({ length: CC }, (_, j) => { const k = (i + r0) * NC + j + c0; return BRAIN[k] ? f(k) : null; }));
  const host = (key) => slide.querySelector(`[data-key="${key}"]`);
  function heat(h, z, cs, zmin, zmax, hover, bar) {
    Plotly.react(h, [{ type: 'heatmap', z, colorscale: cs, zmin, zmax, hoverongaps: false, hovertemplate: `${hover}<extra></extra>`,
      showscale: true, colorbar: { thickness: 8, len: 0.9, outlinewidth: 0, tickfont: { size: 10.5, color: INK }, ...bar } }], {
      width: MW + 44, height: MH, margin: { l: 1, r: 44, t: 1, b: 1 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      xaxis: { visible: false, fixedrange: true }, yaxis: { visible: false, autorange: 'reversed', scaleanchor: 'x', fixedrange: true }, dragmode: false,
      hoverlabel: { bgcolor: '#fff', bordercolor: INK, font: { size: 13, color: INK } },
    }, { displayModeBar: false, scrollZoom: false, responsive: false });
  }
  heat(host('b1'), grid((k) => B1[k]), CMAPS.rdbu, 0.7, 1.3, 'true B<sub>1</sub> %{z:.3f}', { dtick: 0.3 });
  heat(host('t1'), grid((k) => T1[k] / 1000), CMAPS.viridis, 0, 3, 'true T<sub>1</sub> %{z:.2f} s', { dtick: 1, ticksuffix: ' s' });
  const q = (c) => slide.querySelector(c);
  const pc = (v) => `${(100 * v).toFixed(1)} %`;
  function pctl(v, p) { const s = v.slice().sort((a, b) => a - b); return s[Math.floor(p * (s.length - 1))]; }
  function fitAndDraw() {
    const R = field();
    if (st.angles.length < (st.fitA ? 3 : 2)) {
      q('.vb-msg').textContent = `need ${st.fitA ? 3 : 2} angles for ${st.fitA ? 3 : 2} unknowns`;
      ['fb1', 'ft1', 'db1', 'dt1'].forEach((k) => Plotly.purge(host(k))); return;
    }
    q('.vb-msg').textContent = '';
    const t0 = performance.now(), Y = vfaData(R, st.angles, st.tr, sigmaFor(st.tr, st.snr, st.noise), st.seed);
    const { fb, ft, edge } = fitVFA(Y, st.angles, st.tr, st.fitA ? 'a' : 'r1'), ms = performance.now() - t0;
    heat(host('fb1'), grid((k) => fb[k]), CMAPS.rdbu, 0.7, 1.3, 'fitted B<sub>1</sub> %{z:.3f}', { dtick: 0.3 });
    heat(host('ft1'), grid((k) => ft[k] / 1000), CMAPS.viridis, 0, 3, 'fitted T<sub>1</sub> %{z:.2f} s', { dtick: 1, ticksuffix: ' s' });
    heat(host('db1'), grid((k) => 100 * (fb[k] / B1[k] - 1)), CMAPS.rdbu, -30, 30, 'B<sub>1</sub> error %{z:.1f} %', { dtick: 15, ticksuffix: ' %' });
    heat(host('dt1'), grid((k) => 100 * (ft[k] / T1[k] - 1)), CMAPS.rdbu, -30, 30, 'T<sub>1</sub> error %{z:.1f} %', { dtick: 15, ticksuffix: ' %' });
    const eb = [], et = [], rr = [];
    for (let k = 0; k < N; k++) if (BRAIN[k]) { eb.push(Math.abs(fb[k] / B1[k] - 1)); et.push(Math.abs(ft[k] / T1[k] - 1)); rr.push(R[k]); }
    q('.vb-eb').textContent = `${pc(pctl(eb, 0.5))} / ${pc(pctl(eb, 0.9))}`;
    q('.vb-et').textContent = `${pc(pctl(et, 0.5))} / ${pc(pctl(et, 0.9))}`;
    q('.vb-edge').textContent = pc(edge);
    q('.vb-rx').textContent = `${pctl(rr, 0).toFixed(2)} – ${pctl(rr, 1).toFixed(2)}`;
    q('.vb-time').textContent = `${ms.toFixed(0)} ms`;
  }
  let timer = null;
  const refit = (delay = 150) => { clearTimeout(timer); timer = setTimeout(fitAndDraw, delay); };

  // ---- lab view: receive field, head and brain outlines, coils (drag a coil's centre) ----
  const canvas = slide.querySelector('canvas.vb-lab'), ctx = canvas.getContext('2d'), CP = canvas.width, K = CP / (2 * LAB);
  const LOW = 160, off = document.createElement('canvas'); off.width = off.height = LOW;
  const octx = off.getContext('2d'), img = octx.createImageData(LOW, LOW);
  const VIR = CMAPS.viridis.map(([t, h]) => [t, parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const vir = (t) => { t = Math.max(0, Math.min(1, t)); let k = 1; while (k < VIR.length - 1 && VIR[k][0] < t) k++; const [t0, ...a] = VIR[k - 1], [t1, ...b] = VIR[k], w = (t - t0) / (t1 - t0); return a.map((x, i) => x + w * (b[i] - x)); };
  const toC = (u, v) => [CP / 2 + u * K, CP / 2 - v * K];
  const outl = document.createElement('canvas'); outl.width = NC; outl.height = NR;
  (function () {
    const o = outl.getContext('2d'), d = o.createImageData(NC, NR);
    const edgeOf = (M, k, i, j) => M[k] && ((i > 0 && !M[k - NC]) || (i < NR - 1 && !M[k + NC]) || (j > 0 && !M[k - 1]) || (j < NC - 1 && !M[k + 1]));
    for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) { const k = i * NC + j; if (edgeOf(BRAIN, k, i, j)) d.data.set([255, 255, 255, 255], 4 * k); else if (edgeOf(HEAD, k, i, j)) d.data.set([255, 255, 255, 150], 4 * k); }
    o.putImageData(d, 0, 0);
  })();
  function drawLab() {
    let sum = 0, n = 0;
    for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) if (BRAIN[i * NC + j]) { sum += rss(U(j), V(i)); n++; }
    const mean = sum / n || 1;
    for (let r = 0; r < LOW; r++) for (let c = 0; c < LOW; c++) { const [R0, G, B] = vir(rss(-LAB + ((c + 0.5) / LOW) * 2 * LAB, LAB - ((r + 0.5) / LOW) * 2 * LAB) / mean / 3); img.data.set([R0, G, B, 255], 4 * (r * LOW + c)); }
    octx.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, CP, CP);
    const [x0, y0] = toC(U(0) - PIX / 2, V(0) + PIX / 2);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(outl, x0, y0, NC * PIX * K, NR * PIX * K);
    st.coils.forEach((c, n2) => {
      const [a, b] = c.w.map(([u, v]) => toC(u, v)), sel = n2 === st.sel, col = sel ? '#e8770e' : '#1d2733';
      ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
      const [hx, hy] = toC(c.u, c.v);
      ctx.fillStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, hy, 13, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.fillStyle = col; ctx.font = '700 15px "Helvetica Neue", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n2 + 1), hx, hy + 1);
    });
    q('.vb-del').disabled = st.sel < 0 || st.coils.length <= 1;
  }
  let pend = false;
  const schedule = () => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; drawLab(); }); };
  const toLab = (e) => { const r = canvas.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * CP, y = ((e.clientY - r.top) / r.height) * CP; return [x, y, (x - CP / 2) / K, (CP / 2 - y) / K]; };
  let drag = -1;
  canvas.addEventListener('pointerdown', (e) => {
    const [x, y] = toLab(e); drag = -1;
    st.coils.forEach((c, n2) => { const [hx, hy] = toC(c.u, c.v); if (drag < 0 && Math.hypot(x - hx, y - hy) < 22) drag = n2; });
    st.sel = drag; if (drag >= 0) { canvas.setPointerCapture(e.pointerId); e.stopPropagation(); } schedule();
  });
  canvas.addEventListener('pointermove', (e) => { if (drag < 0) return; const [, , u, v] = toLab(e); setCoil(st.coils[drag], u, v); schedule(); refit(250); });
  canvas.addEventListener('pointerup', () => { if (drag >= 0) refit(0); drag = -1; });
  for (const type of ['touchstart', 'touchmove']) canvas.addEventListener(type, (e) => e.stopPropagation());
  slide.querySelectorAll('[data-vbpre]').forEach((b) => b.addEventListener('click', () => { b.blur(); st.coils = PRESETS[b.dataset.vbpre](); st.sel = -1; drawLab(); refit(0); }));
  q('.vb-add').addEventListener('click', (e) => {
    e.currentTarget.blur();
    const ang = st.coils.map((c) => Math.atan2(c.v - cv, c.u - cu)).sort((a, b) => a - b); let phi = Math.PI / 2;
    if (ang.length) { let best = -1; ang.forEach((a, n2) => { const b = n2 + 1 < ang.length ? ang[n2 + 1] : ang[0] + 2 * Math.PI; if (b - a > best) { best = b - a; phi = a + (b - a) / 2; } }); }
    st.coils.push(around(phi)); st.sel = st.coils.length - 1; drawLab(); refit(0);
  });
  q('.vb-del').addEventListener('click', (e) => { e.currentTarget.blur(); if (st.sel >= 0 && st.coils.length > 1) { st.coils.splice(st.sel, 1); st.sel = -1; drawLab(); refit(0); } });

  // ---- angles, TR, fit model ----
  function chips() {
    const box = q('.ff-chips'); box.innerHTML = '';
    st.angles.forEach((a, i) => {
      const b = document.createElement('button'); b.className = 'bs-btn ff-chip'; b.innerHTML = `${a}° <span aria-hidden="true">×</span>`; b.title = 'Remove this angle';
      b.addEventListener('click', () => { st.angles.splice(i, 1); chips(); refit(0); });
      box.appendChild(b);
    });
  }
  const add = (a) => { a = Math.round(a); if (a >= 1 && a <= 180 && !st.angles.includes(a)) { st.angles.push(a); st.angles.sort((x, y) => x - y); chips(); refit(0); } };
  q('.ff-add').addEventListener('click', (e) => { e.currentTarget.blur(); add(Number(q('.ff-in').value)); });
  q('.ff-in').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') add(Number(e.currentTarget.value)); });
  slide.querySelectorAll('[data-vfpre]').forEach((b) => b.addEventListener('click', () => { b.blur(); st.angles = b.dataset.vfpre.split(',').map(Number); chips(); refit(0); }));
  const trEl = q('.vb-tr'), trOut = q('.vb-tr-read');
  const showTr = () => { trOut.textContent = `${st.tr.toFixed(0)} ms`; };
  trEl.addEventListener('input', () => { st.tr = Number(trEl.value); showTr(); refit(); }); keepSlider(trEl); showTr();
  segToggle(slide, 'vbfit', (v) => { st.fitA = v === 'a'; refit(0); });
  const snEl = q('.vb-snr'), snOut = q('.vb-snr-read');
  const showSn = () => { snOut.textContent = st.noise ? st.snr.toFixed(0) : 'off'; };
  snEl.addEventListener('input', () => { st.snr = Math.round(10 ** Number(snEl.value)); st.noise = true; nzB.setAttribute('aria-pressed', 'false'); showSn(); refit(); }); keepSlider(snEl);
  const nzB = q('.vb-nonoise');
  nzB.addEventListener('click', () => { st.noise = !st.noise; nzB.setAttribute('aria-pressed', String(!st.noise)); nzB.blur(); showSn(); refit(0); });
  q('.vb-new').addEventListener('click', (e) => { e.currentTarget.blur(); st.seed += 1; refit(0); });
  showSn();
  st.coils = PRESETS.ring8(); chips();
  onShow(slide, () => { drawLab(); fitAndDraw(); });
  // ---------------- #vfa-afi: a separate AFI B1 map, then VFA with it, vs the 3-unknown VFA fit ----------------
  // The coils of #vfa-brain. AFI (Yarnykh 2007, ideal spoiling), TR1 20 ms, TR2 = n·TR1, the same α:
  //   S1 = R·A·sin θ (1 − E2 + (1 − E1)E2 cos θ)/(1 − E1E2 cos²θ),  S2 = R·A·sin θ (1 − E1 + (1 − E2)E1 cos θ)/(1 − E1E2 cos²θ)
  //   r = S2/S1 (R and A cancel), cos θ_est = (r n − 1)/(n − r): the usual short-TR estimate. Same thermal σ as the VFA.
  (function () {
    const sl = document.getElementById('vfa-afi'); if (!sl) return;
    const s2 = { angles: [3, 17, 60], tr: 15, snr: 200, noise: true, seed: 1, afa: 60, n: 5 }, TR1 = 20;
    const h2 = (key) => sl.querySelector(`[data-key="${key}"]`), q2 = (c) => sl.querySelector(c);
    let shown = false;
    function run() {
      if (!shown) return;
      const R = field(), sig = sigmaFor(s2.tr, s2.snr, s2.noise), t0 = performance.now();
      // AFI
      const ra = rng(s2.seed * 7919 + 1), afi = new Float64Array(N).fill(NaN), tr2 = s2.n * TR1;
      for (let k = 0; k < N; k++) {
        if (!BRAIN[k]) continue;
        const th = s2.afa * DEG * B1[k], c = Math.cos(th), E1 = Math.exp(-TR1 / T1[k]), E2 = Math.exp(-tr2 / T1[k]), den = 1 - E1 * E2 * c * c;
        const S1 = Math.abs(R[k] * A[k] * Math.sin(th) * (1 - E2 + (1 - E1) * E2 * c) / den + sig * gauss(ra));
        const S2 = Math.abs(R[k] * A[k] * Math.sin(th) * (1 - E1 + (1 - E2) * E1 * c) / den + sig * gauss(ra));
        const r = S2 / S1, ce = (r * s2.n - 1) / (s2.n - r);
        afi[k] = Math.acos(Math.max(-1, Math.min(1, ce))) / (s2.afa * DEG);
      }
      // the same VFA data for both methods
      const Y = vfaData(R, s2.angles, s2.tr, sig, s2.seed);
      const fix = fitVFA(Y, s2.angles, s2.tr, 'fix', afi);
      const three = s2.angles.length >= 3 ? fitVFA(Y, s2.angles, s2.tr, 'a') : null;
      const ms = performance.now() - t0;
      heat(h2('b1'), grid((k) => B1[k]), CMAPS.rdbu, 0.7, 1.3, 'true B<sub>1</sub> %{z:.3f}', { dtick: 0.3 });
      heat(h2('t1'), grid((k) => T1[k] / 1000), CMAPS.viridis, 0, 3, 'true T<sub>1</sub> %{z:.2f} s', { dtick: 1, ticksuffix: ' s' });
      const rows = [['f', fix], ['3', three]];
      const eb = {}, et = {};
      rows.forEach(([key, res]) => {
        if (!res) { ['b1', 't1', 'db1', 'dt1'].forEach((m) => Plotly.purge(h2(`${key}${m}`))); return; }
        heat(h2(`${key}b1`), grid((k) => res.fb[k]), CMAPS.rdbu, 0.7, 1.3, 'B<sub>1</sub> %{z:.3f}', { dtick: 0.3 });
        heat(h2(`${key}t1`), grid((k) => res.ft[k] / 1000), CMAPS.viridis, 0, 3, 'T<sub>1</sub> %{z:.2f} s', { dtick: 1, ticksuffix: ' s' });
        heat(h2(`${key}db1`), grid((k) => 100 * (res.fb[k] / B1[k] - 1)), CMAPS.rdbu, -30, 30, 'B<sub>1</sub> error %{z:.1f} %', { dtick: 15, ticksuffix: ' %' });
        heat(h2(`${key}dt1`), grid((k) => 100 * (res.ft[k] / T1[k] - 1)), CMAPS.rdbu, -30, 30, 'T<sub>1</sub> error %{z:.1f} %', { dtick: 15, ticksuffix: ' %' });
        const b = [], t = []; for (let k = 0; k < N; k++) if (BRAIN[k]) { b.push(Math.abs(res.fb[k] / B1[k] - 1)); t.push(Math.abs(res.ft[k] / T1[k] - 1)); }
        eb[key] = `${pc(pctl(b, 0.5))} / ${pc(pctl(b, 0.9))}`; et[key] = `${pc(pctl(t, 0.5))} / ${pc(pctl(t, 0.9))}`;
        q2(`.va-edge-${key}`).textContent = pc(res.edge);
      });
      ['f', '3'].forEach((key) => { q2(`.va-eb-${key}`).textContent = eb[key] || 'need 3 angles'; q2(`.va-et-${key}`).textContent = et[key] || '–'; if (!eb[key]) q2(`.va-edge-${key}`).textContent = '–'; });
      q2('.va-time').textContent = `${ms.toFixed(0)} ms`;
      q2('.va-ncoil').textContent = `${st.coils.length} coil${st.coils.length === 1 ? '' : 's'}`;
    }
    let tm = null;
    const later = (d = 150) => { clearTimeout(tm); tm = setTimeout(run, d); };
    function chips2() {
      const box = q2('.ff-chips'); box.innerHTML = '';
      s2.angles.forEach((a, i) => {
        const b = document.createElement('button'); b.className = 'bs-btn ff-chip'; b.innerHTML = `${a}° <span aria-hidden="true">×</span>`; b.title = 'Remove this angle';
        b.addEventListener('click', () => { s2.angles.splice(i, 1); chips2(); later(0); });
        box.appendChild(b);
      });
    }
    const add2 = (a) => { a = Math.round(a); if (a >= 1 && a <= 180 && !s2.angles.includes(a)) { s2.angles.push(a); s2.angles.sort((x, y) => x - y); chips2(); later(0); } };
    q2('.ff-add').addEventListener('click', (e) => { e.currentTarget.blur(); add2(Number(q2('.ff-in').value)); });
    q2('.ff-in').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') add2(Number(e.currentTarget.value)); });
    sl.querySelectorAll('[data-vfpre]').forEach((b) => b.addEventListener('click', () => { b.blur(); s2.angles = b.dataset.vfpre.split(',').map(Number); chips2(); later(0); }));
    const bind2 = (cls, key, fmt, toState = (v) => v) => {
      const el = q2(`.${cls}`), out = q2(`.${cls}-read`);
      const show = () => { out.textContent = fmt(s2[key]); };
      el.addEventListener('input', () => { s2[key] = toState(Number(el.value)); if (key === 'snr') { s2.noise = true; nz.setAttribute('aria-pressed', 'false'); } show(); later(); });
      keepSlider(el); show(); return show;
    };
    const nz = q2('.va-nonoise');
    bind2('va-tr', 'tr', (v) => `${v.toFixed(0)} ms`);
    const showSnr = bind2('va-snr', 'snr', (v) => (s2.noise ? v.toFixed(0) : 'off'), (v) => Math.round(10 ** v));
    bind2('va-afa', 'afa', (v) => `${v.toFixed(0)}°`);
    bind2('va-n', 'n', (v) => `${v.toFixed(1)} (TR₂ ${(v * TR1).toFixed(0)} ms)`);
    nz.addEventListener('click', () => { s2.noise = !s2.noise; nz.setAttribute('aria-pressed', String(!s2.noise)); nz.blur(); showSnr(); later(0); });
    q2('.va-new').addEventListener('click', (e) => { e.currentTarget.blur(); s2.seed += 1; later(0); });
    chips2();
    onShow(sl, () => { shown = true; run(); });
    Reveal.on('slidechanged', (e) => { if (e.currentSlide === sl) { shown = true; run(); } });   // the coils may have moved on the previous slide
  })();
})();
