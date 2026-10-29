/* FLASH on the brain (#fl) and receive coils on it (#fl-rx).
 * Data (fl-data.js): one 2 mm slice of the 2013 Stikov 3 T session: inversion-recovery T1, WM/GM/CSF fractions, the
 * measured B1 (DAM) and the head segmentation. Signal per voxel, spoiled gradient echo:
 *   S = sin(αB1)(1 − E1)/(1 − E1 cos(αB1)) · Σ_t f_t PD_t e^(−TE/T2_t),  E1 = e^(−TR/T1)
 * with T1 measured per voxel and PD, T2 guessed per tissue. Receive: loops seen edge-on (two antiparallel wires along z),
 * quasi-static Biot–Savart, |B1−| = |B⊥|/2 per coil, root-sum-of-squares, as on the motion slide (#mo). */
(function () {
  'use strict';
  const D = window.FLASH_BRAIN; if (!D) return;
  const NR = D.grid.rows, NC = D.grid.cols, N = NR * NC, PIX = D.grid.mm * 1e-3, DEG = Math.PI / 180;
  const bytes = (b64) => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const T1 = new Uint16Array(bytes(D.t1_ms).buffer), SEG = bytes(D.seg);
  const FR = { wm: bytes(D.wm), gm: bytes(D.gm), csf: bytes(D.csf) };
  const B1M = Array.from(new Uint16Array(bytes(D.b1).buffer), (v) => (v === 65535 ? NaN : v / 20000));
  const u16map = (b64) => Array.from(new Uint16Array(bytes(b64).buffer), (v) => (v === 65535 ? NaN : v / 20000));
  const SIM_HEAD = u16map(D.sim3t_head), SIM_FEET = u16map(D.sim3t_feet);   // 3 T head model |B1+|, B0 towards the head / the feet
  const BRAIN = new Uint8Array(N);
  for (let k = 0; k < N; k++) BRAIN[k] = FR.wm[k] + FR.gm[k] + FR.csf[k] > 50 ? 1 : 0;
  const TISSUES = ['wm', 'gm', 'csf'];
  // display ceiling for received images: the 98th percentile over the brain, so a few voxels next to a coil don't darken the rest
  function top(...arrs) {
    const v = []; for (const a of arrs) for (let k = 0; k < N; k++) if (BRAIN[k]) v.push(a[k]);
    v.sort((x, y) => x - y); return v[Math.floor(0.98 * (v.length - 1))] || 1;
  }
  const st = { tr: 10000, te: 5, fa: 60, tx: 'meas', pd: { wm: 0.69, gm: 0.8, csf: 1 }, t2: { wm: 70, gm: 90, csf: 1000 } };
  let SIG = new Float64Array(N);   // the simulated image (uniform receive), shared with #fl-rx
  const listeners = [];
  const RX = { field: () => new Float64Array(N).fill(1), n: () => 0 };   // the receive field of #fl-rx (÷ brain mean), once it is set up

  // maps are shown cropped to the brain (plus a 2-voxel border)
  let r0 = NR, r1 = 0, c0 = NC, c1 = 0;
  for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) if (BRAIN[i * NC + j]) { r0 = Math.min(r0, i); r1 = Math.max(r1, i); c0 = Math.min(c0, j); c1 = Math.max(c1, j); }
  r0 = Math.max(0, r0 - 2); r1 = Math.min(NR - 1, r1 + 2); c0 = Math.max(0, c0 - 2); c1 = Math.min(NC - 1, c1 + 2);
  const CR = r1 - r0 + 1, CC = c1 - c0 + 1;
  const grid = (f) => Array.from({ length: CR }, (_, i) => Array.from({ length: CC }, (_, j) => f((i + r0) * NC + j + c0)));
  function heat(host, z, cs, zmin, zmax, hover, w, h, bar) {
    Plotly.react(host, [{ type: 'heatmap', z, colorscale: cs, zmin, zmax, hoverongaps: false, hovertemplate: `${hover}<extra></extra>`,
      showscale: !!bar && !bar.hide, colorbar: bar && !bar.hide ? { thickness: 8, len: 0.9, outlinewidth: 0, tickfont: { size: 11, color: INK }, ...bar } : undefined }], {
      width: w, height: h, margin: { l: 1, r: bar ? 40 : 1, t: 1, b: 1 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      xaxis: { visible: false, fixedrange: true }, yaxis: { visible: false, autorange: 'reversed', scaleanchor: 'x', fixedrange: true }, dragmode: false,
      hoverlabel: { bgcolor: '#fff', bordercolor: INK, font: { size: 13, color: INK } },
    }, { displayModeBar: false, scrollZoom: false, responsive: false });
  }

  // ---------------- #fl: the FLASH image ----------------
  const applied = (k) => (st.tx === 'meas' && Number.isFinite(B1M[k]) ? B1M[k] : 1);   // the transmit B1 the scanner applies
  // the FLASH signal at nominal flip angle fa (degrees), uniform receive; signed (a magnitude image takes |S|)
  function signal(fa) {
    const sig = new Float64Array(N);
    for (let k = 0; k < N; k++) {
      if (!BRAIN[k]) continue;
      const a = fa * DEG * applied(k), E1 = Math.exp(-st.tr / Math.max(T1[k], 1));
      let m = 0;
      for (const t of TISSUES) m += (FR[t][k] / 100) * st.pd[t] * Math.exp(-st.te / st.t2[t]);
      sig[k] = (Math.sin(a) * (1 - E1)) / (1 - E1 * Math.cos(a)) * m;
    }
    return sig;
  }
  function simulate() {
    SIG = signal(st.fa);
    listeners.forEach((fn) => fn());
  }
  (function () {
    const slide = document.getElementById('fl'); if (!slide) return;
    const host = (k) => slide.querySelector(`[data-key="${k}"]`);
    const m0 = (k) => TISSUES.reduce((s, t) => s + (FR[t][k] / 100) * st.pd[t], 0);
    const t2eff = (k) => { let a = 0, b = 0; for (const t of TISSUES) { const w = (FR[t][k] / 100) * st.pd[t]; a += w * st.t2[t]; b += w; } return b ? a / b : NaN; };
    function drawParams() {
      heat(host('t1'), grid((k) => (BRAIN[k] ? T1[k] / 1000 : null)), CMAPS.viridis, 0, 3, 'T<sub>1</sub> %{z:.2f} s', 190, 200, { ticksuffix: ' s', dtick: 1 });
      heat(host('t2'), grid((k) => (BRAIN[k] ? t2eff(k) : null)), CMAPS.viridis, 0, 200, 'T<sub>2</sub> %{z:.0f} ms', 190, 200, { dtick: 100 });
      heat(host('m0'), grid((k) => (BRAIN[k] ? m0(k) : null)), CMAPS.gray, 0, 1, 'PD %{z:.2f}', 190, 200, { dtick: 0.5 });
      heat(host('b1'), grid((k) => (BRAIN[k] ? (st.tx === 'meas' ? B1M[k] : 1) : null)), CMAPS.rdbu, 0.7, 1.3, 'B<sub>1</sub> %{z:.3f}', 190, 200, { dtick: 0.3 });
    }
    function drawImage() {
      let mx = 0; for (let k = 0; k < N; k++) mx = Math.max(mx, SIG[k]);
      heat(host('img'), grid((k) => (BRAIN[k] ? SIG[k] : null)), CMAPS.gray, 0, mx, 'S %{z:.3f}', 300, 400);
      const mean = (t) => { let s = 0, n = 0; for (let k = 0; k < N; k++) if (FR[t][k] > 90) { s += SIG[k]; n++; } return s / n; };
      const w = mean('wm'), g = mean('gm'), c = mean('csf');
      slide.querySelector('.fl-wm').textContent = w.toFixed(3);
      slide.querySelector('.fl-gm').textContent = g.toFixed(3);
      slide.querySelector('.fl-csf').textContent = c.toFixed(3);
      slide.querySelector('.fl-gmwm').textContent = (g / w).toFixed(2);
    }
    const update = (params) => { simulate(); if (params) drawParams(); drawImage(); };
    const sl = (cls, key, fmt, toState = (v) => v) => {
      const el = slide.querySelector(`.${cls}`), out = slide.querySelector(`.${cls}-read`);
      const show = () => { out.textContent = fmt(st[key]); };
      el.addEventListener('input', () => { st[key] = toState(Number(el.value)); show(); update(false); });
      keepSlider(el); show();
    };
    sl('fl-tr', 'tr', (v) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)} s` : `${v.toFixed(0)} ms`), (v) => 10 ** v);
    sl('fl-te', 'te', (v) => `${v.toFixed(0)} ms`);
    sl('fl-fa', 'fa', (v) => `${v.toFixed(0)}°`);
    segToggle(slide, 'fltx', (v) => { st.tx = v; update(true); });
    slide.querySelectorAll('.fl-guess input').forEach((inp) => {
      inp.addEventListener('keydown', (e) => e.stopPropagation());
      inp.addEventListener('change', () => {
        const v = Number(inp.value); if (!(v > 0)) { inp.value = st[inp.dataset.p][inp.dataset.t]; return; }
        st[inp.dataset.p][inp.dataset.t] = v; update(true);
      });
    });
    onShow(slide, () => update(true));
  })();
  simulate();

  // ---------------- #fl-rx: receive coils on the simulated brain ----------------
  (function () {
    const slide = document.getElementById('fl-rx'); if (!slide) return;
    const LAB = 0.16, LOOP = 0.08, WIRE = 0.003, MARGIN = 0.012;   // lab half-width, loop width, wire radius, gap to the head (m)
    const canvas = slide.querySelector('canvas.fr-lab'), ctx = canvas.getContext('2d'), CP = canvas.width, K = CP / (2 * LAB);
    // grid pixel (i, j) → lab (u right, v up = anterior), metres
    const U = (j) => (j - (NC - 1) / 2) * PIX, V = (i) => ((NR - 1) / 2 - i) * PIX;
    const HEAD = new Uint8Array(N); for (let k = 0; k < N; k++) HEAD[k] = SEG[k] > 0 ? 1 : 0;
    let cu = 0, cv = 0, nh = 0;
    for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) if (HEAD[i * NC + j]) { cu += U(j); cv += V(i); nh++; }
    cu /= nh; cv /= nh;
    // head dilated by MARGIN: a coil centre must stay outside it
    const R = Math.ceil(MARGIN / PIX), FAR = new Uint8Array(N);
    for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) {
      let hit = 0;
      for (let di = -R; di <= R && !hit; di++) for (let dj = -R; dj <= R && !hit; dj++) {
        const a = i + di, b = j + dj; if (a >= 0 && a < NR && b >= 0 && b < NC && di * di + dj * dj <= R * R && HEAD[a * NC + b]) hit = 1;
      }
      FAR[i * NC + j] = hit;
    }
    const nearHead = (u, v) => { const i = Math.round((NR - 1) / 2 - v / PIX), j = Math.round(u / PIX + (NC - 1) / 2); return i >= 0 && i < NR && j >= 0 && j < NC && FAR[i * NC + j]; };
    const st = { coils: [], sel: -1, bg: 'rx' };

    // Both wires (and the centre) must stay at least MARGIN from the head: if not, the coil slides out along the ray
    // from the head centre.
    function setCoil(c, u, v, psi) {
      u = Math.max(-LAB + 0.01, Math.min(LAB - 0.01, u)); v = Math.max(-LAB + 0.01, Math.min(LAB - 0.01, v));
      let du = u - cu, dv = v - cv; const r = Math.hypot(du, dv) || 1; du /= r; dv /= r;
      const ang = psi === undefined ? Math.atan2(v - cv, u - cu) + Math.PI / 2 : psi;   // default: the loop faces the head
      const h = LOOP / 2, eu = Math.cos(ang) * h, ev = Math.sin(ang) * h;
      for (let s = 0; s < 600 && (nearHead(u, v) || nearHead(u + eu, v + ev) || nearHead(u - eu, v - ev)); s++) { u += du * 5e-4; v += dv * 5e-4; }
      c.u = u; c.v = v; c.psi = ang;
      c.w = [[u + eu, v + ev, 1], [u - eu, v - ev, -1]];
      return c;
    }
    const around = (phi, d = 0.02) => {   // a coil on the ray at angle phi, just outside the head
      let u = cu, v = cv; for (let s = 0; s < 600 && (nearHead(u, v) || Math.hypot(u - cu, v - cv) < 0.05); s++) { u += Math.cos(phi) * 5e-4; v += Math.sin(phi) * 5e-4; }
      return setCoil({}, u + Math.cos(phi) * (d - MARGIN), v + Math.sin(phi) * (d - MARGIN));
    };
    const PRESETS = {
      ring8: () => Array.from({ length: 8 }, (_, k) => around((2 * Math.PI * k) / 8 + Math.PI / 8)),
      side: () => Array.from({ length: 4 }, (_, k) => around(Math.PI * (0.6 + (0.8 * k) / 3))),   // patient right (screen left)
      back: () => Array.from({ length: 3 }, (_, k) => around(-Math.PI / 2 + (k - 1) * 0.45)),
      one: () => [around(Math.PI / 2)],
    };

    // RSS sensitivity, and each coil's own, at lab (u, v)
    function coilSens(c, u, v) {
      let bx = 0, by = 0;
      for (const [px, py, sg] of c.w) { const dx = u - px, dy = v - py, f = sg / Math.max(dx * dx + dy * dy, WIRE * WIRE); bx -= dy * f; by += dx * f; }
      return Math.hypot(bx, by) / 2;
    }
    const rss = (u, v) => Math.sqrt(st.coils.reduce((s, c) => s + coilSens(c, u, v) ** 2, 0));

    // ---- lab view: receive field (or the received image) with the head outline and the coils ----
    const LOW = 200, off = document.createElement('canvas'); off.width = off.height = LOW;
    const octx = off.getContext('2d'), img = octx.createImageData(LOW, LOW);
    const VIR = CMAPS.viridis.map(([t, h]) => [t, parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
    const vir = (t) => {
      t = Math.max(0, Math.min(1, t)); let k = 1; while (k < VIR.length - 1 && VIR[k][0] < t) k++;
      const [t0, ...a] = VIR[k - 1], [t1, ...b] = VIR[k], q = (t - t0) / (t1 - t0); return a.map((x, i) => x + q * (b[i] - x));
    };
    const toC = (u, v) => [CP / 2 + u * K, CP / 2 - v * K];
    const outl = document.createElement('canvas'); outl.width = NC; outl.height = NR;
    (function () {   // head (light) and brain (white) outlines, one grid pixel wide
      const o = outl.getContext('2d'), d = o.createImageData(NC, NR);
      const edge = (M, k, i, j) => M[k] && ((i > 0 && !M[k - NC]) || (i < NR - 1 && !M[k + NC]) || (j > 0 && !M[k - 1]) || (j < NC - 1 && !M[k + 1]));
      for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) {
        const k = i * NC + j;
        if (edge(BRAIN, k, i, j)) d.data.set([255, 255, 255, 255], 4 * k);
        else if (edge(HEAD, k, i, j)) d.data.set([255, 255, 255, 150], 4 * k);
      }
      o.putImageData(d, 0, 0);
    })();
    let brainMean = 1;
    function drawLab() {
      const vals = new Float64Array(LOW * LOW);
      for (let r = 0; r < LOW; r++) for (let q = 0; q < LOW; q++) vals[r * LOW + q] = rss(-LAB + ((q + 0.5) / LOW) * 2 * LAB, LAB - ((r + 0.5) / LOW) * 2 * LAB);
      for (let i = 0; i < LOW * LOW; i++) { const [R0, G, B] = vir(vals[i] / brainMean / 3); img.data.set([R0, G, B, 255], 4 * i); }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, CP, CP);
      // the grid's corner (i = j = 0) sits at u = U(0) − PIX/2, v = V(0) + PIX/2
      const [x0, y0] = toC(U(0) - PIX / 2, V(0) + PIX / 2);
      if (st.bg === 'img') {   // the received image over the brain
        const t = document.createElement('canvas'); t.width = NC; t.height = NR;
        const tc = t.getContext('2d'), d = tc.createImageData(NC, NR); let mx = 0;
        const recv = new Float64Array(N);
        for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) { const k = i * NC + j; if (BRAIN[k]) { recv[k] = SIG[k] * rss(U(j), V(i)); mx = Math.max(mx, recv[k]); } }
        mx = top(recv);
        for (let k = 0; k < N; k++) if (BRAIN[k]) { const g = Math.round(255 * Math.min(1, recv[k] / mx)); d.data.set([g, g, g, 255], 4 * k); }
        tc.putImageData(d, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(t, x0, y0, NC * PIX * K, NR * PIX * K);
      }
      ctx.imageSmoothingEnabled = false; ctx.drawImage(outl, x0, y0, NC * PIX * K, NR * PIX * K);
      st.coils.forEach((c, n) => {
        const [a, b] = c.w.map(([u, v]) => toC(u, v)), sel = n === st.sel;
        ctx.strokeStyle = sel ? '#e8770e' : '#1d2733'; ctx.lineWidth = 12; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.strokeStyle = sel ? '#e8770e' : '#1d2733'; ctx.lineWidth = 3;
        const [hx, hy] = toC(c.u, c.v);
        ctx.beginPath(); ctx.arc(hx, hy, 12, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
        ctx.fillStyle = sel ? '#e8770e' : '#1d2733'; ctx.beginPath(); ctx.arc(a[0], a[1], 9, 0, 2 * Math.PI); ctx.fill();   // turn handle
        ctx.fillStyle = sel ? '#e8770e' : '#1d2733'; ctx.font = '700 15px "Helvetica Neue", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(n + 1), hx, hy + 1);
      });
    }

    // ---- maps ----
    const host = (k) => slide.querySelector(`[data-key="${k}"]`);
    const strip = slide.querySelector('.rx-strip');
    function drawMaps() {
      const s = new Float64Array(N); let sum = 0, n = 0;
      for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) { const k = i * NC + j; if (BRAIN[k]) { s[k] = rss(U(j), V(i)); sum += s[k]; n++; } }
      brainMean = sum / n || 1;
      let mxS = 0, mxR = 0, lo = Infinity, hi = 0, ss = 0;
      for (let k = 0; k < N; k++) if (BRAIN[k]) {
        const r = s[k] / brainMean; mxS = Math.max(mxS, SIG[k]); mxR = Math.max(mxR, SIG[k] * r); lo = Math.min(lo, r); hi = Math.max(hi, r); ss += (r - 1) ** 2;
      }
      heat(host('sig'), grid((k) => (BRAIN[k] ? SIG[k] : null)), CMAPS.gray, 0, mxS, 'S %{z:.3f}', 168, 216);
      heat(host('rx'), grid((k) => (BRAIN[k] ? s[k] / brainMean : null)), CMAPS.viridis, 0, 3, 'receive %{z:.2f} × mean', 168, 216);
      const recvImg = new Float64Array(N); for (let k = 0; k < N; k++) if (BRAIN[k]) recvImg[k] = SIG[k] * s[k] / brainMean;
      heat(host('img'), grid((k) => (BRAIN[k] ? recvImg[k] : null)), CMAPS.gray, 0, top(recvImg), 'S × receive %{z:.3f}', 168, 216);
      slide.querySelector('.rx-sd').textContent = `${(100 * Math.sqrt(ss / n)).toFixed(0)} %`;
      slide.querySelector('.rx-range').textContent = `${lo.toFixed(2)} – ${hi.toFixed(2)} (×${(hi / lo).toFixed(1)})`;
      slide.querySelector('.rx-n').textContent = String(st.coils.length);
      // one image per coil, on a common scale
      strip.innerHTML = '';
      const per = st.coils.map((c) => { const a = new Float64Array(N); for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) { const k = i * NC + j; if (BRAIN[k]) a[k] = SIG[k] * coilSens(c, U(j), V(i)); } return a; });
      const mx = per.length ? top(...per) : 1;
      per.forEach((a, n2) => {
        const cv2 = document.createElement('canvas'); cv2.width = CC; cv2.height = CR; cv2.title = `Coil ${n2 + 1}`;
        const c2 = cv2.getContext('2d'), d = c2.createImageData(CC, CR);
        for (let i = 0; i < CR; i++) for (let j = 0; j < CC; j++) {
          const k = (i + r0) * NC + j + c0, g = BRAIN[k] ? Math.round(255 * Math.min(1, a[k] / mx)) : 255;
          d.data.set([g, g, g, 255], 4 * (i * CC + j));
        }
        c2.putImageData(d, 0, 0);
        const wrap = document.createElement('div'); wrap.className = 'rx-thumb' + (n2 === st.sel ? ' sel' : '');
        wrap.appendChild(cv2); const lab = document.createElement('span'); lab.textContent = String(n2 + 1); wrap.appendChild(lab);
        wrap.addEventListener('click', () => { st.sel = n2; redraw(false); });
        strip.appendChild(wrap);
      });
    }
    let pending = false;
    function redraw(maps = true) {
      if (maps) drawMaps(); else strip.querySelectorAll('.rx-thumb').forEach((w, n) => w.classList.toggle('sel', n === st.sel));
      drawLab();
      slide.querySelector('.rx-del').disabled = st.sel < 0 || st.coils.length <= 1;
      slide.querySelector('.rx-face').disabled = st.sel < 0;
    }
    const schedule = () => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; redraw(); }); };

    // ---- drag: the centre moves a coil, the dark end turns it ----
    const toLab = (e) => { const r = canvas.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * CP, y = ((e.clientY - r.top) / r.height) * CP; return [x, y, (x - CP / 2) / K, (CP / 2 - y) / K]; };
    let drag = null;
    canvas.addEventListener('pointerdown', (e) => {
      const [x, y] = toLab(e); drag = null;
      st.coils.forEach((c, n) => {
        const [hx, hy] = toC(c.u, c.v), [ax, ay] = toC(c.w[0][0], c.w[0][1]);
        if (Math.hypot(x - ax, y - ay) < 18) drag = { n, kind: 'turn' };
        else if (!drag && Math.hypot(x - hx, y - hy) < 20) drag = { n, kind: 'move' };
      });
      if (drag) { st.sel = drag.n; canvas.setPointerCapture(e.pointerId); e.stopPropagation(); schedule(); }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const [, , u, v] = toLab(e), c = st.coils[drag.n];
      if (drag.kind === 'move') { setCoil(c, u, v, c.psi); drag.u = c.u; drag.v = c.v; }
      else { if (drag.u === undefined) { drag.u = c.u; drag.v = c.v; } setCoil(c, drag.u, drag.v, Math.atan2(v - drag.v, u - drag.u)); }   // turn about where the drag started
      schedule();
    });
    canvas.addEventListener('pointerup', () => { drag = null; });
    for (const type of ['touchstart', 'touchmove']) canvas.addEventListener(type, (e) => e.stopPropagation());

    // ---- buttons ----
    slide.querySelectorAll('[data-rxpre]').forEach((b) => b.addEventListener('click', () => { b.blur(); st.coils = PRESETS[b.dataset.rxpre](); st.sel = -1; redraw(); }));
    slide.querySelector('.rx-add').addEventListener('click', (e) => {
      e.currentTarget.blur();
      // the largest angular gap between the coils, as seen from the head centre
      const ang = st.coils.map((c) => Math.atan2(c.v - cv, c.u - cu)).sort((a, b) => a - b);
      let phi = Math.PI / 2;
      if (ang.length) { let best = -1; ang.forEach((a, n) => { const b = n + 1 < ang.length ? ang[n + 1] : ang[0] + 2 * Math.PI; if (b - a > best) { best = b - a; phi = a + (b - a) / 2; } }); }
      st.coils.push(around(phi)); st.sel = st.coils.length - 1; redraw();
    });
    slide.querySelector('.rx-del').addEventListener('click', (e) => { e.currentTarget.blur(); if (st.sel >= 0 && st.coils.length > 1) { st.coils.splice(st.sel, 1); st.sel = -1; redraw(); } });
    slide.querySelector('.rx-face').addEventListener('click', (e) => { e.currentTarget.blur(); const c = st.coils[st.sel]; if (c) { setCoil(c, c.u, c.v); redraw(); } });
    segToggle(slide, 'rxbg', (v) => { st.bg = v; drawLab(); });

    RX.field = () => {
      const f = new Float64Array(N); let sum = 0, n = 0;
      for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) { const k = i * NC + j; if (BRAIN[k]) { f[k] = rss(U(j), V(i)); sum += f[k]; n++; } }
      for (let k = 0; k < N; k++) f[k] /= sum / n;
      return f;
    };
    RX.n = () => st.coils.length;
    st.coils = PRESETS.ring8();
    listeners.push(() => { if (Reveal.getCurrentSlide() === slide) redraw(); });
    onShow(slide, () => redraw());
    Reveal.on('slidechanged', (e) => { if (e.currentSlide === slide) redraw(); });
  })();
  // ---------------- #fl-dam: a FLASH double angle on the same brain, coils and transmit ----------------
  (function () {
    const slide = document.getElementById('fl-dam'); if (!slide) return;
    const host = (k) => slide.querySelector(`[data-key="${k}"]`);
    const dst = { fa: 60 };
    function draw() {
      const rx = RX.field(), s1 = signal(dst.fa), s2 = signal(2 * dst.fa);
      const i1 = new Float64Array(N), i2 = new Float64Array(N), est = new Float64Array(N);
      let mx = 0, n = 0, e2 = 0, eb = 0, em = 0, wrap = 0;
      for (let k = 0; k < N; k++) {
        if (!BRAIN[k]) continue;
        i1[k] = Math.abs(s1[k]) * rx[k]; i2[k] = Math.abs(s2[k]) * rx[k];   // magnitude images through the receive coils
        mx = Math.max(mx, i1[k], i2[k]);
        est[k] = Math.acos(Math.max(-1, Math.min(1, i2[k] / (2 * i1[k])))) / (dst.fa * DEG);
        const e = est[k] / applied(k) - 1;
        n++; e2 += e * e; eb += e; em = Math.max(em, Math.abs(e));
        if (2 * dst.fa * applied(k) > 180) wrap++;
      }
      const B = (k) => (BRAIN[k] ? 1 : 0);
      mx = top(i1, i2);
      heat(host('a1'), grid((k) => (B(k) ? i1[k] : null)), CMAPS.gray, 0, mx, `α image %{z:.3f}`, 190, 220);
      heat(host('a2'), grid((k) => (B(k) ? i2[k] : null)), CMAPS.gray, 0, mx, `2α image %{z:.3f}`, 190, 220);
      heat(host('est'), grid((k) => (B(k) ? est[k] : null)), CMAPS.rdbu, 0.7, 1.3, 'B<sub>1</sub> calculated %{z:.3f}', 190, 220, { dtick: 0.1 });
      heat(host('app'), grid((k) => (B(k) ? applied(k) : null)), CMAPS.rdbu, 0.7, 1.3, 'B<sub>1</sub> applied %{z:.3f}', 190, 220, { dtick: 0.1 });
      heat(host('diff'), grid((k) => (B(k) ? 100 * (est[k] / applied(k) - 1) : null)), CMAPS.rdbu, -10, 10, 'calculated − applied: %{z:.2f} %', 190, 220, { dtick: 5, ticksuffix: ' %' });
      const pct = (v) => `${v >= 0 ? '' : '−'}${Math.abs(100 * v).toFixed(Math.abs(100 * v) < 0.01 ? 4 : 2)} %`;
      slide.querySelector('.dam-rms').textContent = pct(Math.sqrt(e2 / n));
      slide.querySelector('.dam-bias').textContent = pct(eb / n);
      slide.querySelector('.dam-max').textContent = pct(em);
      slide.querySelector('.dam-wrap').textContent = wrap ? `${(100 * wrap / n).toFixed(1)} % of the brain` : 'none';
      const tr = st.tr >= 1000 ? `${(st.tr / 1000).toFixed(st.tr >= 10000 ? 0 : 1)} s` : `${st.tr.toFixed(0)} ms`;
      slide.querySelector('.dam-setup').innerHTML = `TR ${tr}, TE ${st.te} ms, transmit ${st.tx === 'meas' ? 'measured B<sub>1</sub>' : 'uniform'} (slide 7); ${RX.n() || 'no'} receive coil${RX.n() === 1 ? '' : 's'} (slide 8).`;
    }
    const el = slide.querySelector('.dam-fa'), out = slide.querySelector('.dam-fa-read');
    const show = () => { out.textContent = `${dst.fa}° and ${2 * dst.fa}°`; };
    el.addEventListener('input', () => { dst.fa = Number(el.value); show(); draw(); });
    keepSlider(el); show();
    onShow(slide, draw);
    Reveal.on('slidechanged', (e) => { if (e.currentSlide === slide) draw(); });
  })();
  // ---------------- #fl-afi: actual flip angle imaging on the same brain, coils and transmit ----------------
  // Yarnykh 2007, ideal spoiling: two interleaved TRs, TR2 = n·TR1, the same α;
  //   S1 ∝ sin α (1 − E2 + (1 − E1) E2 cos α) / (1 − E1E2 cos²α),  S2 ∝ sin α (1 − E1 + (1 − E2) E1 cos α) / (1 − E1E2 cos²α)
  //   r = S2/S1,  cos α_est = (r n − 1)/(n − r)
  (function () {
    const slide = document.getElementById('fl-afi'); if (!slide) return;
    const host = (k) => slide.querySelector(`[data-key="${k}"]`);
    const ast = { fa: 60, tr1: 20, n: 5 };
    function draw() {
      const rx = RX.field(), tr2 = ast.n * ast.tr1;
      const i1 = new Float64Array(N), i2 = new Float64Array(N), est = new Float64Array(N);
      let mx = 0, n = 0, e2 = 0, eb = 0, em = 0, bad = 0;
      for (let k = 0; k < N; k++) {
        if (!BRAIN[k]) continue;
        const a = ast.fa * DEG * applied(k), c = Math.cos(a), E1 = Math.exp(-ast.tr1 / Math.max(T1[k], 1)), E2 = Math.exp(-tr2 / Math.max(T1[k], 1));
        let m = 0;
        for (const t of TISSUES) m += (FR[t][k] / 100) * st.pd[t] * Math.exp(-st.te / st.t2[t]);
        const den = 1 - E1 * E2 * c * c;
        i1[k] = Math.abs(Math.sin(a) * (1 - E2 + (1 - E1) * E2 * c) / den * m) * rx[k];
        i2[k] = Math.abs(Math.sin(a) * (1 - E1 + (1 - E2) * E1 * c) / den * m) * rx[k];
        mx = Math.max(mx, i1[k], i2[k]);
        const r = i2[k] / i1[k], cosE = (r * ast.n - 1) / (ast.n - r);
        if (cosE > 1 || cosE < -1) bad++;
        est[k] = Math.acos(Math.max(-1, Math.min(1, cosE))) / (ast.fa * DEG);
        const e = est[k] / applied(k) - 1;
        n++; e2 += e * e; eb += e; em = Math.max(em, Math.abs(e));
      }
      const B = (k) => (BRAIN[k] ? 1 : 0);
      mx = top(i1, i2);
      heat(host('a1'), grid((k) => (B(k) ? i1[k] : null)), CMAPS.gray, 0, mx, 'S<sub>1</sub> (TR<sub>1</sub>) %{z:.4f}', 190, 220);
      heat(host('a2'), grid((k) => (B(k) ? i2[k] : null)), CMAPS.gray, 0, mx, 'S<sub>2</sub> (TR<sub>2</sub>) %{z:.4f}', 190, 220);
      heat(host('est'), grid((k) => (B(k) ? est[k] : null)), CMAPS.rdbu, 0.7, 1.3, 'B<sub>1</sub> calculated %{z:.3f}', 190, 220, { dtick: 0.1 });
      heat(host('app'), grid((k) => (B(k) ? applied(k) : null)), CMAPS.rdbu, 0.7, 1.3, 'B<sub>1</sub> applied %{z:.3f}', 190, 220, { dtick: 0.1 });
      heat(host('diff'), grid((k) => (B(k) ? 100 * (est[k] / applied(k) - 1) : null)), CMAPS.rdbu, -10, 10, 'calculated − applied: %{z:.2f} %', 190, 220, { dtick: 5, ticksuffix: ' %' });
      const pct = (v) => `${v >= 0 ? '' : '−'}${Math.abs(100 * v).toFixed(Math.abs(100 * v) < 0.01 ? 4 : 2)} %`;
      slide.querySelector('.afi-rms').textContent = pct(Math.sqrt(e2 / n));
      slide.querySelector('.afi-bias').textContent = pct(eb / n);
      slide.querySelector('.afi-max').textContent = pct(em);
      slide.querySelector('.afi-bad').textContent = bad ? `${(100 * bad / n).toFixed(1)} % of the brain` : 'none';
      slide.querySelector('.afi-setup').innerHTML = `TE ${st.te} ms, transmit ${st.tx === 'meas' ? 'measured B<sub>1</sub>' : 'uniform'} (slide 7); ${RX.n() || 'no'} receive coil${RX.n() === 1 ? '' : 's'} (slide 8). TR<sub>2</sub> = ${tr2.toFixed(0)} ms.`;
    }
    const bindS = (cls, key, fmt) => {
      const el = slide.querySelector(`.${cls}`), out = slide.querySelector(`.${cls}-read`);
      const show = () => { out.textContent = fmt(ast[key]); };
      el.addEventListener('input', () => { ast[key] = Number(el.value); show(); draw(); });
      keepSlider(el); show();
    };
    bindS('afi-fa', 'fa', (v) => `${v}°`);
    bindS('afi-tr1', 'tr1', (v) => `${v} ms`);
    bindS('afi-n', 'n', (v) => `${v}`);
    onShow(slide, draw);
    Reveal.on('slidechanged', (e) => { if (e.currentSlide === slide) draw(); });
  })();
  // ---------------- #fl-txrx: one B1 map as receive field, and as transmit field, side by side ----------------
  // Receive: S = M0·B1(x)·f(α, T1), linear in B1, the same factor for every tissue. Transmit: S = M0·f(αB1(x), T1),
  // f(a) = sin a (1 − E1)/(1 − E1 cos a): not linear in B1 and, at short TR, not the same for every T1.
  (function () {
    const slide = document.getElementById('fl-txrx'); if (!slide) return;
    const host = (k) => slide.querySelector(`[data-key="${k}"]`);
    const xs = { fa: 30, tr: 15 };
    const fin = (v) => (Number.isFinite(v) ? v : 1);
    const f = (a, t1) => { const E1 = Math.exp(-xs.tr / Math.max(t1, 1)); return Math.sin(a) * (1 - E1) / (1 - E1 * Math.cos(a)); };
    const TCOL = { wm: '#1f5f99', gm: '#2e8b3a', csf: '#b2182b' }, TNAME = { wm: 'WM', gm: 'GM', csf: 'CSF' };
    const T1MED = { wm: 847, gm: 1328, csf: 1484 };
    const W0 = 150, H0 = 176;
    function draw() {
      const a0 = xs.fa * DEG, ideal = new Float64Array(N), rx = new Float64Array(N), tx = new Float64Array(N), fixRx = new Float64Array(N), fixTx = new Float64Array(N);
      for (let k = 0; k < N; k++) {
        if (!BRAIN[k]) continue;
        const b = fin(B1M[k]);
        let m = 0; for (const t of TISSUES) m += (FR[t][k] / 100) * st.pd[t] * Math.exp(-st.te / st.t2[t]);
        ideal[k] = m * Math.abs(f(a0, T1[k]));
        rx[k] = ideal[k] * b;                                   // as receive: × B1
        tx[k] = m * Math.abs(f(a0 * b, T1[k]));                 // as transmit: through the signal equation
        fixRx[k] = rx[k] / b;                                   // ÷ the one receive field: B1 itself
        fixTx[k] = tx[k] / (Math.abs(f(a0 * b, T1MED.wm)) / Math.abs(f(a0, T1MED.wm)));   // ÷ the one field that fixes WM
      }
      const gmax = top(ideal, rx, tx), B = (k) => BRAIN[k];
      const gray = (key, a, lab) => heat(host(key), grid((k) => (B(k) ? a[k] : null)), CMAPS.gray, 0, gmax, `${lab} %{z:.4f}`, W0, H0, { hide: true });
      const ratio = (key, a, bar) => heat(host(key), grid((k) => (B(k) ? a[k] / ideal[k] : null)), CMAPS.rdbu, 0.6, 1.4, 'raw ÷ ideal %{z:.3f}', W0, H0, bar ? { dtick: 0.2 } : { hide: true });
      const left = (key, a, bar) => heat(host(key), grid((k) => (B(k) ? 100 * (a[k] / ideal[k] - 1) : null)), CMAPS.rdbu, -10, 10, 'left over %{z:.2f} %', W0, H0, bar ? { dtick: 5, ticksuffix: ' %' } : { hide: true });
      gray('ideal', ideal, 'ideal');
      heat(host('b1'), grid((k) => (B(k) ? fin(B1M[k]) : null)), CMAPS.rdbu, 0.6, 1.4, 'B<sub>1</sub> %{z:.3f}', W0, H0, { hide: true });
      gray('rx', rx, 'as receive'); ratio('rxr', rx, true); left('rxl', fixRx, true);
      gray('tx', tx, 'as transmit'); ratio('txr', tx, true); left('txl', fixTx, true);
      // signal vs B1, relative to B1 = 1
      const bx = Array.from({ length: 101 }, (_, i) => 0.5 + i / 100);
      const traces = [{ x: bx, y: bx, name: 'receive (any tissue, any α, TR)', line: { color: INK, width: 2, dash: 'dash' }, hovertemplate: 'receive: %{y:.3f}<extra></extra>' }];
      for (const t of TISSUES) traces.push({ x: bx, y: bx.map((b) => f(a0 * b, T1MED[t]) / f(a0, T1MED[t])), name: `transmit, ${TNAME[t]} (T<sub>1</sub> ${(T1MED[t] / 1000).toFixed(2)} s)`, line: { color: TCOL[t], width: 2.4 }, hovertemplate: `${TNAME[t]}: %{y:.3f}<extra></extra>` });
      traces.push({ x: bx, y: bx.map((b) => f(a0 * b, 4000) / f(a0, 4000)), name: 'transmit, T<sub>1</sub> 4 s (CSF, real)', line: { color: TCOL.csf, width: 1.6, dash: 'dot' }, hovertemplate: 'T<sub>1</sub> 4 s: %{y:.3f}<extra></extra>' });
      Plotly.react(host('plot'), traces, {
        width: 430, height: 300, margin: { l: 52, r: 10, t: 62, b: 42 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', size: 13, color: INK },
        xaxis: { title: { text: 'B<sub>1</sub> (× nominal)', standoff: 4 }, range: [0.5, 1.5], fixedrange: true, zeroline: false, dtick: 0.25 },
        yaxis: { title: { text: 'signal ÷ signal at B<sub>1</sub> = 1', standoff: 4 }, range: [0.3, 1.7], fixedrange: true, zeroline: false },
        legend: { orientation: 'h', x: 0, y: 1.02, yanchor: 'bottom', font: { size: 12 } }, hovermode: 'x',
        shapes: [{ type: 'line', x0: 1, x1: 1, y0: 0.3, y1: 1.7, line: { color: '#d8dee6', width: 1 } }, { type: 'line', x0: 0.5, x1: 1.5, y0: 1, y1: 1, line: { color: '#d8dee6', width: 1 } }],
      }, { displayModeBar: false, scrollZoom: false, responsive: false });
      const q = (fn) => { const v = []; for (let k = 0; k < N; k++) if (BRAIN[k]) v.push(Math.abs(fn(k))); v.sort((x, y) => x - y); return `${(100 * v[Math.floor(0.5 * (v.length - 1))]).toFixed(2)} % / ${(100 * v[Math.floor(0.9 * (v.length - 1))]).toFixed(2)} %`; };
      slide.querySelector('.tx-left-rx').textContent = q((k) => fixRx[k] / ideal[k] - 1);
      slide.querySelector('.tx-left-tx').textContent = q((k) => fixTx[k] / ideal[k] - 1);
      slide.querySelector('.tx-ernst').textContent = `${(Math.acos(Math.exp(-xs.tr / T1MED.wm)) / DEG).toFixed(1)}° / ${(Math.acos(Math.exp(-xs.tr / T1MED.gm)) / DEG).toFixed(1)}° / ${(Math.acos(Math.exp(-xs.tr / T1MED.csf)) / DEG).toFixed(1)}°`;
    }
    const bindS = (cls, key, fmt, toState = (v) => v) => {
      const el = slide.querySelector(`.${cls}`), out = slide.querySelector(`.${cls}-read`);
      const show = () => { out.textContent = fmt(xs[key]); };
      el.addEventListener('input', () => { xs[key] = toState(Number(el.value)); show(); draw(); });
      keepSlider(el); show();
    };
    bindS('tx-fa', 'fa', (v) => `${v}°`);
    bindS('tx-tr', 'tr', (v) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)} s` : `${v.toFixed(0)} ms`), (v) => Math.round(10 ** v));
    onShow(slide, draw);
    Reveal.on('slidechanged', (e) => { if (e.currentSlide === slide) draw(); });
  })();
  // ---------------- #ph-txrx: a uniform phantom, its B1 map as receive field and as transmit field ----------------
  // Sled & Pike elliptic water phantom (exact solver, sledpike.wasm), uniform M0 and T1. Both images are shown ÷ the
  // image the same scan gives with a perfect B1 (B1 = 1 everywhere):
  //   receive:  B1(x) · f(α) / f(α) = B1(x)                     whatever α, TR, T1
  //   transmit: f(αB1(x)) / f(α),  f(a) = sin a (1 − E1)/(1 − E1 cos a)
  (async function () {
    const slide = document.getElementById('ph-txrx'); if (!slide) return;
    const host = (k) => slide.querySelector(`[data-key="${k}"]`);
    const RX = 0.10, RY = 0.075, STEP = 1.5e-3;   // as fine as the orientation slide's map
    const ps = { b0: 3, fa: 60, tr: 10000, t1: 1000, view: 'raw', inv: false };
    let M = null;   // { b1: Float64Array, nx, ny }
    const W = await wasm;
    function solve() {
      W.compute(2, GAMMA_BAR * ps.b0, 80, RX, RY, STEP, 10, 2e-3);
      const nx = W.map_nx(), ny = W.map_ny();
      M = { b1: Float64Array.from(new Float64Array(W.memory.buffer, W.map_ptr(), nx * ny)), nx, ny };
    }
    const f = (a) => { const E1 = Math.exp(-ps.tr / ps.t1); return Math.abs(Math.sin(a) * (1 - E1) / (1 - E1 * Math.cos(a))); };
    function draw() {
      if (!M) return;
      const { b1, nx, ny } = M, a0 = ps.fa * DEG, f0 = f(a0), after = ps.view === 'div';
      const rxv = (b) => (after ? 1 : b), txv0 = (b) => (after ? f(a0 * b) / f0 / b : f(a0 * b) / f0), txv = (b) => (ps.inv ? 1 / txv0(b) : txv0(b));   // optionally 1 / value
      const rows = (fn) => Array.from({ length: nx }, (_, i) => Array.from({ length: ny }, (_, j) => { const b = b1[i * ny + j]; return Number.isNaN(b) ? null : fn(b); }));
      const W0 = 170, H0 = 215;
      heat(host('b1'), rows((b) => b), CMAPS.rdbu, 0.6, 1.4, 'B<sub>1</sub> %{z:.3f} × nominal', W0, H0, { dtick: 0.2 });   // the orientation slide's scale
      const glab = after ? '÷ B<sub>1</sub> map' : '÷ perfect-B<sub>1</sub> image';
      heat(host('rx'), rows(rxv), CMAPS.gray, 0.5, 1.5, `receive, ${glab}: %{z:.3f}`, W0, H0, { dtick: 0.25 });   // a colour bar on each map, so all three are the same size
      heat(host('tx'), rows(txv), CMAPS.gray, 0.5, 1.5, `transmit, ${glab}${ps.inv ? ', inverted (1 / value)' : ''}: %{z:.3f}`, W0, H0, { dtick: 0.25 });
      // profiles along the major axis (the middle column)
      const j = Math.floor(ny / 2), xs = [], pb = [], pr = [], pt = [];
      for (let i = 0; i < nx; i++) { const b = b1[i * ny + j]; if (Number.isNaN(b)) continue; xs.push(100 * (RX - (i + 0.5) * STEP)); pb.push(b); pr.push(rxv(b)); pt.push(txv(b)); }
      const lo = Math.min(0.4, ...pb, ...pt) - 0.05, hi = Math.max(1.6, ...pb, ...pt) + 0.05;
      Plotly.react(host('plot'), [
        { x: xs, y: pb, name: 'B<sub>1</sub> map', line: { color: '#e8770e', width: after ? 1.5 : 5 }, opacity: after ? 0.5 : 1, hovertemplate: 'B<sub>1</sub> %{y:.3f}<extra></extra>' },
        { x: xs, y: pr, name: after ? 'receive image ÷ B<sub>1</sub> map' : 'image, B<sub>1</sub> as receive', line: { color: INK, width: 2.2, dash: 'dash' }, hovertemplate: 'receive %{y:.3f}<extra></extra>' },
        { x: xs, y: pt, name: `${after ? 'transmit image ÷ B<sub>1</sub> map' : 'image, B<sub>1</sub> as transmit'}${ps.inv ? ', inverted (1/·)' : ''}`, line: { color: '#1f5f99', width: 2.6 }, hovertemplate: 'transmit %{y:.3f}<extra></extra>' },
      ], {
        width: 440, height: 300, margin: { l: 50, r: 10, t: 46, b: 42 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', size: 13, color: INK },
        xaxis: { title: { text: 'position along the long axis (cm)', standoff: 4 }, range: [-10, 10], fixedrange: true, zeroline: false },
        yaxis: { title: { text: after ? 'image ÷ B<sub>1</sub> map' : 'relative to perfect B<sub>1</sub>', standoff: 4 }, range: [lo, hi], fixedrange: true, zeroline: false },
        legend: { orientation: 'h', x: 0, y: 1.02, yanchor: 'bottom', font: { size: 12 } }, hovermode: 'x',
        shapes: [{ type: 'line', x0: -10, x1: 10, y0: 1, y1: 1, line: { color: '#d8dee6', width: 1 } }],
      }, { displayModeBar: false, scrollZoom: false, responsive: false });
      let r = [Infinity, -Infinity], t = [Infinity, -Infinity], bb = [Infinity, -Infinity];
      for (let k = 0; k < nx * ny; k++) { const b = b1[k]; if (Number.isNaN(b)) continue; const u = rxv(b), v = txv(b); bb = [Math.min(bb[0], b), Math.max(bb[1], b)]; r = [Math.min(r[0], u), Math.max(r[1], u)]; t = [Math.min(t[0], v), Math.max(t[1], v)]; }
      const rng = (x) => `${x[0].toFixed(2)} – ${x[1].toFixed(2)}`;
      slide.querySelector('.ph-b1').textContent = rng(bb);
      slide.querySelector('.ph-rx').textContent = rng(r);
      slide.querySelector('.ph-tx').textContent = rng(t);
      slide.querySelectorAll('.ph-what').forEach((e) => { e.innerHTML = after ? '÷ B<sub>1</sub> map' : '÷ perfect-B<sub>1</sub> image'; });
      slide.querySelector('.ph-txcap').innerHTML = ps.inv ? ' (1/·)' : '';
      slide.querySelector('.ph-txrow').innerHTML = ps.inv ? ', inverted' : '';
      slide.querySelector('.ph-long').innerHTML = after ? 'each divided by the B<sub>1</sub> map (flat = fully corrected)' : 'each divided by the image a perfect B<sub>1</sub> would give (1 = no B<sub>1</sub> effect)';
    }
    const bindS = (cls, key, fmt, toState = (v) => v) => {
      const el = slide.querySelector(`.${cls}`), out = slide.querySelector(`.${cls}-read`);
      const show = () => { out.textContent = fmt(ps[key]); };
      el.addEventListener('input', () => { ps[key] = toState(Number(el.value)); show(); draw(); });
      keepSlider(el); show();
    };
    const ms = (v) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)} s` : `${v.toFixed(0)} ms`);
    bindS('ph-fa', 'fa', (v) => `${v}°`);
    bindS('ph-tr', 'tr', ms, (v) => Math.round(10 ** v));
    bindS('ph-t1', 't1', ms);
    segToggle(slide, 'phb0', (v) => { ps.b0 = Number(v); solve(); draw(); });
    segToggle(slide, 'phview', (v) => { ps.view = v; draw(); });
    const invB = slide.querySelector('.ph-inv');
    invB.addEventListener('click', () => { ps.inv = !ps.inv; invB.setAttribute('aria-pressed', String(ps.inv)); invB.blur(); draw(); });
    slide.querySelector('.ph-txcap').innerHTML = '';
    slide.querySelector('.busy')?.remove();
    solve();
    onShow(slide, draw);
    Reveal.on('slidechanged', (e) => { if (e.currentSlide === slide) draw(); });
    if (Reveal.getCurrentSlide() === slide) draw();
  })();
  // ---------------- #ph-angles: where B1 acts as × B1, or as × 1/B1, against TR ----------------
  // Spoiled gradient echo f(a) = sin a (1 − E1)/(1 − E1 cos a). Over B1 = 0.8–1.2: the largest α with
  // max |f(αB1)/f(α) ÷ B1 − 1| ≤ 1 % or 5 % (multiplicative), the α range with max |f(αB1)/f(α) · B1 − 1| ≤ 5 % (inverse),
  // the α where the local exponent d ln S / d ln B1 = −1, its small-angle estimate (24 TR/T1)^¼, and the Ernst angle.
  (function () {
    const slide = document.getElementById('ph-angles'); if (!slide) return;
    const COL = { mult: '#c95f0a', inv: '#1f5f99', ernst: '#2e8b3a' };
    const TRS = Array.from({ length: 121 }, (_, i) => 2 * 10 ** (i * Math.log10(10000 / 2) / 120));   // 2 ms … 10 s
    const BS = Array.from({ length: 41 }, (_, i) => 0.8 + i * 0.01);
    let t1 = 1000;
    function curves() {
      const out = { ernst: [], p1: [], approx: [], m1: [], m5: [], ilo: [], ihi: [] };
      for (const tr of TRS) {
        const E = Math.exp(-tr / t1), f = (a) => Math.abs(Math.sin(a) * (1 - E) / (1 - E * Math.cos(a)));
        const dev = (al, s) => { const f0 = f(al * DEG); let m = 0; for (const b of BS) m = Math.max(m, Math.abs((f(al * DEG * b) / f0) * b ** -s - 1)); return m; };
        const p = (a) => a * (1 / Math.tan(a) - E * Math.sin(a) / (1 - E * Math.cos(a)));
        out.ernst.push(Math.acos(E) / DEG);
        let x = null; for (let al = 0.2; al < 179.5; al += 0.1) if (p(al * DEG) <= -1) { x = al; break; }
        out.p1.push(x);
        const ap = (24 * tr / t1) ** 0.25 / DEG; out.approx.push(ap < 180 ? ap : null);
        let m1 = null, m5 = null; for (let al = 0.1; al <= 90; al += 0.1) { const d = dev(al, 1); if (m1 === null && d > 0.01) m1 = al - 0.1; if (d > 0.05) { m5 = al - 0.1; break; } }
        out.m1.push(m1); out.m5.push(m5);
        let lo = null, hi = null; for (let al = 1; al <= 179; al += 0.5) { if (dev(al, -1) <= 0.05) { if (lo === null) lo = al; hi = al; } }
        out.ilo.push(lo); out.ihi.push(hi);
      }
      return out;
    }
    function draw() {
      const c = curves(), x = TRS;
      const band = (y0, y1, colour, name, op) => [
        { x, y: y0, mode: 'lines', line: { width: 0 }, hoverinfo: 'skip', showlegend: false, connectgaps: false },
        { x, y: y1, mode: 'lines', line: { width: 0 }, fill: 'tonexty', fillcolor: colour.replace('rgb', 'rgba').replace(')', `, ${op})`), name, hoverinfo: 'skip', connectgaps: false },
      ];
      const zeros = x.map(() => 0);
      const traces = [
        ...band(zeros, c.m5, 'rgb(201, 95, 10)', 'B<sub>1</sub> acts as × B<sub>1</sub> (within 5 %)', 0.16),
        ...band(zeros, c.m1, 'rgb(201, 95, 10)', 'within 1 %', 0.32),
        ...band(c.ilo, c.ihi, 'rgb(31, 95, 153)', 'B<sub>1</sub> acts as × 1/B<sub>1</sub> (within 5 %)', 0.18),
        { x, y: c.p1, name: 'exactly 1/B<sub>1</sub> locally (d ln S/d ln B<sub>1</sub> = −1)', line: { color: COL.inv, width: 2.4 }, hovertemplate: '1/B<sub>1</sub>: %{y:.1f}°<extra></extra>' },
        { x, y: c.approx, name: '(24 TR/T<sub>1</sub>)<sup>¼</sup>', line: { color: COL.inv, width: 1.6, dash: 'dot' }, hovertemplate: '(24 TR/T<sub>1</sub>)<sup>¼</sup>: %{y:.1f}°<extra></extra>' },
        { x, y: c.ernst, name: 'Ernst angle', line: { color: COL.ernst, width: 2.4 }, hovertemplate: 'Ernst: %{y:.1f}°<extra></extra>' },
        { x, y: c.m5, name: '', line: { color: COL.mult, width: 1.2 }, showlegend: false, hovertemplate: '× B<sub>1</sub> to 5 %: below %{y:.1f}°<extra></extra>' },
      ];
      const last = (arr) => { for (let i = arr.length - 1; i >= 0; i--) if (arr[i] != null) return [x[i], arr[i]]; return [x[0], 0]; };
      const lab = (xy, text, colour, ay = 0) => ({ x: Math.log10(xy[0]), y: xy[1], text, showarrow: false, xanchor: 'left', yshift: ay, font: { size: 12.5, color: colour } });
      Plotly.react(slide.querySelector('[data-key="angles"]'), traces, {
        width: 820, height: 440, margin: { l: 56, r: 120, t: 70, b: 48 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', size: 13.5, color: INK },
        xaxis: { type: 'log', title: { text: 'TR (ms)', standoff: 4 }, range: [Math.log10(2), 4], fixedrange: true, tickvals: [2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000], ticktext: ['2', '5', '10', '20', '50', '100', '200', '500', '1000', '2000', '5000', '10 000'], gridcolor: '#eef1f4' },
        yaxis: { title: { text: 'flip angle α (°)', standoff: 4 }, range: [0, 150], dtick: 15, fixedrange: true, gridcolor: '#eef1f4', zeroline: false },
        legend: { orientation: 'h', x: 0, y: 1.02, yanchor: 'bottom', font: { size: 12.5 } }, hovermode: 'x unified',
        annotations: [lab(last(c.ernst), 'Ernst', COL.ernst), lab(last(c.p1), '× 1/B<sub>1</sub>', COL.inv), lab(last(c.m5), '× B<sub>1</sub> below', COL.mult)],
      }, { displayModeBar: false, scrollZoom: false, responsive: false });
      const pick = (tr) => TRS.reduce((b, v, i) => (Math.abs(Math.log(v / tr)) < Math.abs(Math.log(TRS[b] / tr)) ? i : b), 0);   // nearest grid TR
      const rows = [5, 25, 100, 1000, 10000].map((tr) => { const i = pick(tr); return `<tr><td>${tr >= 1000 ? tr / 1000 + ' s' : tr + ' ms'}</td><td>${c.ernst[i].toFixed(1)}°</td><td>${c.m1[i] != null ? c.m1[i].toFixed(1) + '°' : '–'} / ${c.m5[i] != null ? c.m5[i].toFixed(1) + '°' : '–'}</td><td>${c.p1[i] ? c.p1[i].toFixed(1) + '°' : '–'}</td><td>${c.ilo[i] != null ? `${c.ilo[i].toFixed(0)}–${c.ihi[i].toFixed(0)}°` : 'none'}</td></tr>`; }).join('');
      slide.querySelector('.ang-table tbody').innerHTML = rows;
    }
    segToggle(slide, 'angt1', (v) => { t1 = Number(v); draw(); });
    onShow(slide, draw);
  })();
  // ---------------- #ph-vfa: the T1 chapter's Figure 2.8 (Eq. 2.5 curves vs flip angle, TR slider), with the angles marked ----------------
  // Same tissues and TR steps as the book's figure (T1 0.9 / 1.5 / 4.0 s, TR 5–200 ms), redrawn so the points can be added.
  // Criteria over B1 = 0.8–1.2, as on the previous slide.
  (function () {
    const slide = document.getElementById('ph-vfa'); if (!slide) return;
    const TIS = [{ t1: 900, name: 'WM', long: 'T<sub>1</sub> = 0.9 s (White Matter)', col: '#636efa' },
      { t1: 1500, name: 'GM', long: 'T<sub>1</sub> = 1.5 s (Grey Matter)', col: '#EF553B' },
      { t1: 4000, name: 'CSF', long: 'T<sub>1</sub> = 4.0 s (Cerebrospinal Fluid)', col: '#00cc96' }];
    const BS = Array.from({ length: 41 }, (_, i) => 0.8 + i * 0.01), FA = Array.from({ length: 181 }, (_, i) => i * 0.5);
    let tr = 15;
    function angles(t1) {
      const E = Math.exp(-tr / t1), f = (a) => Math.abs(Math.sin(a) * (1 - E) / (1 - E * Math.cos(a)));
      const dev = (al, s) => { const f0 = f(al * DEG); let m = 0; for (const b of BS) m = Math.max(m, Math.abs((f(al * DEG * b) / f0) * b ** -s - 1)); return m; };
      const p = (a) => a * (1 / Math.tan(a) - E * Math.sin(a) / (1 - E * Math.cos(a)));
      let m1 = null, m5 = null; for (let al = 0.1; al <= 90; al += 0.1) { const d = dev(al, 1); if (m1 === null && d > 0.01) m1 = al - 0.1; if (d > 0.05) { m5 = al - 0.1; break; } }
      let inv = null; for (let al = 0.2; al < 179.5; al += 0.1) if (p(al * DEG) <= -1) { inv = al; break; }
      let lo = null, hi = null; for (let al = 1; al <= 90; al += 0.25) if (dev(al, -1) <= 0.05) { if (lo === null) lo = al; hi = al; }
      return { f: (al) => f(al * DEG), ernst: Math.acos(E) / DEG, m1, m5, inv, lo, hi };
    }
    function draw() {
      const traces = [], rows = [];
      const SH = [['ernst', 'circle', 'Ernst angle'], ['m1', 'triangle-up-open', '× B<sub>1</sub> to 1 % (below)'], ['m5', 'triangle-up', '× B<sub>1</sub> to 5 % (below)'], ['inv', 'diamond', 'exactly 1/B<sub>1</sub> (locally)']];
      TIS.forEach((t, n) => {
        const A = angles(t.t1);
        traces.push({ x: FA, y: FA.map(A.f), name: t.long, line: { color: t.col, width: 2.4 }, hovertemplate: `${t.name}: %{y:.4f}<extra></extra>` });
        if (A.lo !== null) { const seg = FA.filter((x) => x >= A.lo && x <= A.hi); traces.push({ x: seg, y: seg.map(A.f), mode: 'lines', line: { color: t.col, width: 11 }, opacity: 0.25, name: '1/B<sub>1</sub> to 5 % (window)', legendgroup: 'win', showlegend: false, hoverinfo: 'skip' }); }
        for (const [k, sym, lab] of SH) {
          const al = A[k]; if (al == null || al > 90) continue;
          traces.push({ x: [al], y: [A.f(al)], mode: 'markers', marker: sym.endsWith('open') ? { symbol: sym, size: 12, color: t.col, line: { width: 2 } } : { symbol: sym, size: 12, color: t.col, line: { color: '#fff', width: 2 } }, name: lab, legendgroup: k, showlegend: false, hovertemplate: `${t.name}, ${lab}: %{x:.1f}°<extra></extra>` });
        }
        const fmt = (v) => (v == null ? '–' : `${v.toFixed(1)}°`);
        rows.push(`<tr><td style="color:${t.col};font-weight:700">${t.name}</td><td>${fmt(A.m1)} / ${fmt(A.m5)}</td><td>${fmt(A.ernst)}</td><td>${fmt(A.inv)}</td><td>${A.lo == null ? 'none' : `${A.lo.toFixed(0)}–${A.hi.toFixed(0)}°`}</td></tr>`);
      });
      // legend entries for the marker shapes, in ink (the colour is the tissue's)
      for (const [k, sym, lab] of SH) traces.push({ x: [null], y: [null], mode: 'markers', marker: { symbol: sym, size: 11, color: INK, line: { width: sym.endsWith('open') ? 2 : 0 } }, name: lab, legendgroup: k });
      traces.push({ x: [null], y: [null], mode: 'lines', line: { color: INK, width: 11 }, opacity: 0.25, name: '1/B<sub>1</sub> to 5 % (window)', legendgroup: 'win' });
      Plotly.react(slide.querySelector('[data-key="vfa"]'), traces, {
        width: 760, height: 450, margin: { l: 64, r: 16, t: 64, b: 50 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', size: 13.5, color: INK },
        xaxis: { title: { text: 'Excitation flip angle (°)', standoff: 4 }, range: [0, 90], dtick: 10, fixedrange: true, linecolor: INK, linewidth: 1.5, showgrid: false, zeroline: false },
        yaxis: { title: { text: 'Long. magnetization (M<sub>z</sub> / M<sub>0</sub>)', standoff: 4 }, rangemode: 'tozero', fixedrange: true, linecolor: INK, linewidth: 1.5, showgrid: false, zeroline: false },
        legend: { orientation: 'h', x: 0, y: 1.02, yanchor: 'bottom', font: { size: 12 } }, hovermode: 'closest',
      }, { displayModeBar: false, scrollZoom: false, responsive: false });
      slide.querySelector('.vfa-table tbody').innerHTML = rows.join('');
      slide.querySelector('.vfa-tr-read').textContent = `${tr} ms`;
    }
    const el = slide.querySelector('.vfa-tr');
    el.addEventListener('input', () => { tr = Number(el.value); draw(); });
    keepSlider(el);
    onShow(slide, draw);
  })();
})();
