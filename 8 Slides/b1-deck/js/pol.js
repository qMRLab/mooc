/* Why the Sled & Pike B1+ map is diagonal (#pol, #pol-sum). The exact solver's two linear coils separately
 * (wasm compute_fields: per pixel the complex (B_x, B_y) of the x coil and of the y coil). A drive a·(x coil) + b·(y coil)
 * gives b = (B_x, B_y); the field vector over one RF cycle is Re(b e^{jωt}), an ellipse; the part turning with the
 * spins is B+ = ½ (B_x + jB_y), the part turning against them B− = ½ (B_x − jB_y). CP (the scanner's drive) is
 * x coil − j·(y coil), = the deck's other slides (checked to 1e-15). The receive sensitivity of the quadrature coil is
 * the B− of the opposite drive (x + j·y) = the mirror image of B1+ (checked to 1e-15).
 * #pol: animated field vectors and their loops on a grid, for the x coil, the y coil or CP; colour = which way the loop
 * turns. #pol-sum: B1+ of the x coil, the y coil and of both with a chosen phase between them, and the receive B1−.
 * #pol-curr: one coil's induced current along the cylinder (J_z ∝ ∂B_y/∂x − ∂B_x/∂y, Ampère) and the sample's own field
 * (total − the coil's uniform field), animated, with the sine curves at a chosen point.
 * #pol-time: at one chosen point, B_x(t) and B_y(t) over one RF cycle as two sine curves, and the loop they trace, drawn
 * as two rotating arrows: B+ e^{jωt} (with the spins, its length = B1+) then conj(B−) e^{−jωt} (against), since
 * B_x(t) + jB_y(t) = B+ e^{jωt} + conj(B−) e^{−jωt}. One scale for every point of a drive; dashed circle: B1+ = 1. */
(async function () {
  'use strict';
  const S1 = document.getElementById('pol'), S2 = document.getElementById('pol-sum'), S0 = document.getElementById('pol-time'), S3 = document.getElementById('pol-curr'); if (!S1 && !S2 && !S0 && !S3) return;
  const RX = 0.10, RY = 0.075, STEP = 2e-3, EPS = 80, DEG = Math.PI / 180, ORANGE = [232, 119, 14], BLUE = [31, 95, 153], GREY = [150, 158, 168];
  const W = await wasm;
  if (!W.compute_fields) {   // an older sledpike.wasm (e.g. from the browser cache) without the per-coil fields
    [S0, S1, S2, S3].forEach((s) => { if (s) s.querySelector('h2').insertAdjacentHTML('afterend', '<p class="ph-note" style="color:#c0392b">This slide needs the newer solver (js/sledpike.wasm with compute_fields): reload the page with Cmd+Shift+R.</p>'); });
    return;
  }
  let F = null, NX = 0, NY = 0;   // the fields: 8 per pixel
  function solve(rho, b0) {
    W.compute_fields(rho, GAMMA_BAR * b0, EPS, RX, RY, STEP, 10);
    NX = W.map_nx(); NY = W.map_ny(); F = new Float64Array(W.memory.buffer, W.map_ptr(), 8 * NX * NY).slice();
  }
  // field phasors (bx, by) at pixel k for drive a·x + b·y (a, b complex [re, im]); null outside
  function drive(k, a, b) {
    const o = 8 * k; if (Number.isNaN(F[o])) return null;
    const m = (p, q, r, s) => [p * r - q * s, p * s + q * r];
    const [a1, a2] = m(a[0], a[1], F[o], F[o + 1]), [b1, b2] = m(b[0], b[1], F[o + 4], F[o + 5]);
    const [c1, c2] = m(a[0], a[1], F[o + 2], F[o + 3]), [d1, d2] = m(b[0], b[1], F[o + 6], F[o + 7]);
    return [a1 + b1, a2 + b2, c1 + d1, c2 + d2];   // re/im of B_x, re/im of B_y
  }
  const plus = ([xr, xi, yr, yi]) => 0.5 * Math.hypot(xr - yi, xi + yr);   // |½ (B_x + jB_y)|
  const minus = ([xr, xi, yr, yi]) => 0.5 * Math.hypot(xr + yi, xi - yr);  // |½ (B_x − jB_y)|
  const pix = (i, j) => [RX - (i + 0.5) * STEP, RY - (j + 0.5) * STEP];      // x up, y to the left
  function bplusMap(a, b, fn = plus) {   // ÷ its own mean; + the diagonal index (x·y > 0 quadrants − x·y < 0) ÷ mean
    const M = new Float64Array(NX * NY).fill(NaN); let s = 0, n = 0, d = 0;
    for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) { const k = i * NY + j, f = drive(k, a, b); if (!f) continue; const v = fn(f); M[k] = v; s += v; n++; const [x, y] = pix(i, j); d += Math.sign(x * y) * v; }
    for (let k = 0; k < M.length; k++) M[k] /= s / n;
    return { M, diag: d / s };
  }
  const RD = CMAPS.rdbu.map(([t, c]) => [t, ...c.match(/\d+/g).map(Number)]);
  const rdbu = (v, lo, hi) => {
    const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo))); let n = 1; while (n < RD.length - 1 && RD[n][0] < t) n++;
    const [t0, ...a] = RD[n - 1], [t1, ...b] = RD[n], u = (t - t0) / (t1 - t0); return a.map((x, i) => x + u * (b[i] - x));
  };
  const diagTxt = (d) => `${(100 * d).toFixed(1).replace('-', '−')} %`;
  const DRIVES = { x: [[1, 0], [0, 0]], y: [[0, 0], [1, 0]], cp: [[1, 0], [0, -1]] };

  // ---------------- #pol-time: the field's two components at one point, over one RF cycle ----------------
  if (S0) (function () {
    const st = { rho: 2, lossless: false, drive: 'cp', play: true, pt: [0.06, 0.04], view: 'all' };   // view: all, plus (with the spins), minus (against)   // pt = (x, y) in metres
    const q = (c) => S0.querySelector(c), host = q('[data-key="sines"]');
    const mc = q('canvas.pt-map'), mx = mc.getContext('2d'), MK = mc.height / (2 * RX);
    const lc = q('canvas.pt-loop'), lx = lc.getContext('2d');
    const off = document.createElement('canvas'), octx = off.getContext('2d');
    let f = null, e0 = null, raf = 0, t0 = performance.now(), meanP = 1, maxLoop = 1, maxComp = 1;   // e0: the same drive in the empty coil
    const PRE = { ul: [0.06, 0.04], ur: [0.06, -0.04], ll: [-0.06, 0.04], lr: [-0.06, -0.04], axis: [0.06, 0.001] };
    function rebuild() {
      solve(st.lossless ? 1e6 : st.rho, 3);
      const [a, b] = DRIVES[st.drive], { M } = bplusMap(a, b);
      off.width = NY; off.height = NX; const img = octx.createImageData(NY, NX);
      for (let k = 0; k < NX * NY; k++) { if (Number.isNaN(M[k])) { img.data.set([255, 255, 255, 0], 4 * k); continue; } const [r, g, bb] = rdbu(M[k], 0.5, 1.5); img.data.set([r, g, bb, 255], 4 * k); }
      octx.putImageData(img, 0, 0);
      // one scale for every point of this drive: the mean B+, the biggest loop, the biggest component
      let sp = 0, n = 0; maxLoop = 0; maxComp = 0;
      for (let k = 0; k < NX * NY; k++) { const g = drive(k, a, b); if (!g) continue; const p1 = plus(g), m1 = minus(g); sp += p1; n++; maxLoop = Math.max(maxLoop, p1 + m1); maxComp = Math.max(maxComp, Math.hypot(g[0], g[1]), Math.hypot(g[2], g[3])); }
      meanP = sp / n;
      const i = Math.round((RX - st.pt[0]) / STEP - 0.5), j = Math.round((RY - st.pt[1]) / STEP - 0.5);
      f = drive(i * NY + j, a, b);
      e0 = [2 * a[0], 2 * a[1], 2 * b[0], 2 * b[1]];   // each coil's applied field is 2 in the solver's units (the 0.01 T limit)
      const P = plus(f), Mi = minus(f), share = P / (P + Mi), [xr, xi, yr, yi] = f;
      let lag = (Math.atan2(xi, xr) - Math.atan2(yi, yr)) * 180 / Math.PI; lag = ((lag % 360) + 360) % 360;   // how much later B_y peaks than B_x
      q('.pt-where').textContent = `x ${(100 * st.pt[0]).toFixed(1)} cm, y ${(100 * st.pt[1]).toFixed(1)} cm`;
      q('.pt-ratio').textContent = `${(Math.hypot(yr, yi) / Math.hypot(xr, xi)).toFixed(2)}`;
      const ratio = Math.hypot(yr, yi) / Math.hypot(xr, xi), late = (d) => (Math.round(d) === 0 ? 'at the same time' : d > 0 ? `${Math.round(d)}° later` : `${Math.round(-d)}° earlier`);
      q('.pt-lag').textContent = ratio < 0.02 ? '– (no B_y here)' : st.drive === 'cp' ? `${lag.toFixed(0)}° after B_x (the drive: 90°)` : lag > 90 && lag <= 270 ? `flipped, then ${late(lag - 180)}` : late(lag > 270 ? lag - 360 : lag);
      q('.pt-plus').textContent = `${(P / meanP).toFixed(2)}`;
      q('.pt-minus').textContent = `${(Mi / meanP).toFixed(2)}`;
      const vs = (re, im, r0, i0) => { if (Math.hypot(r0, i0) < 1e-9) return 'none in the empty coil'; let d = (Math.atan2(i0, r0) - Math.atan2(im, re)) * 180 / Math.PI; d = ((d + 540) % 360) - 180; return `${(Math.hypot(re, im) / Math.hypot(r0, i0)).toFixed(2)}×, ${Math.abs(d) < 0.5 ? 'in step' : d > 0 ? `${d.toFixed(0)}° late` : `${(-d).toFixed(0)}° early`}`; };
      q('.pt-empty').innerHTML = `B<sub>x</sub> ${vs(xr, xi, e0[0], e0[1])}; B<sub>y</sub> ${vs(yr, yi, e0[2], e0[3])}`;
      void share;
      q('.pt-what').innerHTML = { x: 'The x coil alone: its main part is B<sub>x</sub>; B<sub>y</sub> is the part the ellipse bends.', y: 'The y coil alone: its main part is B<sub>y</sub>; B<sub>x</sub> is the part the ellipse bends.', cp: 'Both coils (CP): B<sub>y</sub> is mostly the y coil, a quarter cycle after the x coil.' }[st.drive];
    }
    const layout = {
      width: 560, height: 250, margin: { l: 50, r: 12, t: 30, b: 44 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', size: 13.5, color: INK },
      xaxis: { title: { text: 'time in one RF cycle (°)', standoff: 4 }, range: [0, 360], dtick: 90, fixedrange: true, zeroline: false, gridcolor: '#eef1f4' },
      yaxis: { title: { text: 'field', standoff: 2 }, range: [-1.15, 1.15], fixedrange: true, zeroline: true, zerolinecolor: '#c9d1da', gridcolor: '#eef1f4', showticklabels: false },
      legend: { orientation: 'h', x: 0, y: 1.02, yanchor: 'bottom' },
    };
    const TT = Array.from({ length: 181 }, (_, n) => 2 * n);
    function frame(now) {
      const ph = (((now - t0) / 2600) * 360) % 360, [xr, xi, yr, yi] = f, sc = 1 / maxComp;   // one scale for the whole phantom
      // B_x(t) + jB_y(t) = B+ e^{jωt} (with the spins) + conj(B−) e^{−jωt} (against)
      const Pr = 0.5 * (xr - yi), Pi = 0.5 * (xi + yr), Mr = 0.5 * (xr + yi), Mi2 = -0.5 * (xi - yr);
      const z1 = (t) => { const c = Math.cos(t * DEG), sn = Math.sin(t * DEG); return [Pr * c - Pi * sn, Pr * sn + Pi * c]; };
      const z2 = (t) => { const c = Math.cos(t * DEG), sn = -Math.sin(t * DEG); return [Mr * c - Mi2 * sn, Mr * sn + Mi2 * c]; };
      const cx = (t) => sc * (xr * Math.cos(t * DEG) - xi * Math.sin(t * DEG)), cy = (t) => sc * (yr * Math.cos(t * DEG) - yi * Math.sin(t * DEG));
      const part = st.view === 'plus' ? z1 : st.view === 'minus' ? z2 : null, px_ = (t) => sc * part(t)[0], py_ = (t) => sc * part(t)[1];
      layout.shapes = [{ type: 'line', x0: ph, x1: ph, y0: -1.15, y1: 1.15, line: { color: '#9aa5b1', width: 1.5, dash: 'dot' } }];
      const e0x = (t) => sc * (e0[0] * Math.cos(t * DEG) - e0[1] * Math.sin(t * DEG)), e0y = (t) => sc * (e0[2] * Math.cos(t * DEG) - e0[3] * Math.sin(t * DEG));
      const empty = [
        { x: TT, y: TT.map(e0x), mode: 'lines', line: { color: '#9aa5b1', width: 2, dash: 'dash' }, name: 'without the sample (B<sub>x</sub>, B<sub>y</sub>)', hoverinfo: 'skip' },
        { x: TT, y: TT.map(e0y), mode: 'lines', line: { color: '#c7a6d6', width: 2, dash: 'dash' }, showlegend: false, hoverinfo: 'skip' },
      ];
      const tr = part ? [
        { x: TT, y: TT.map(cx), mode: 'lines', line: { color: '#b8c0c9', width: 1.5, dash: 'dot' }, name: 'full B<sub>x</sub>, B<sub>y</sub>', hoverinfo: 'skip' },
        { x: TT, y: TT.map(cy), mode: 'lines', line: { color: '#b8c0c9', width: 1.5, dash: 'dot' }, showlegend: false, hoverinfo: 'skip' },
        { x: TT, y: TT.map(px_), mode: 'lines', line: { color: INK, width: 3 }, name: `B<sub>x</sub> of the part ${st.view === 'plus' ? 'with' : 'against'} the spins`, hoverinfo: 'skip' },
        { x: TT, y: TT.map(py_), mode: 'lines', line: { color: '#7b3fa0', width: 3 }, name: 'its B<sub>y</sub>', hoverinfo: 'skip' },
        { x: [ph, ph], y: [px_(ph), py_(ph)], mode: 'markers', marker: { color: [INK, '#7b3fa0'], size: 10 }, showlegend: false, hoverinfo: 'skip' },
      ] : [
        { x: TT, y: TT.map(cx), mode: 'lines', line: { color: INK, width: 3 }, name: 'B<sub>x</sub> (up–down)', hoverinfo: 'skip' },
        { x: TT, y: TT.map(cy), mode: 'lines', line: { color: '#7b3fa0', width: 3 }, name: 'B<sub>y</sub> (left–right)', hoverinfo: 'skip' },
        { x: [ph, ph], y: [cx(ph), cy(ph)], mode: 'markers', marker: { color: [INK, '#7b3fa0'], size: 10 }, showlegend: false, hoverinfo: 'skip' },
      ];
      Plotly.react(host, st.view === 'all' ? empty.concat(tr) : tr, layout, { displayModeBar: false, scrollZoom: false, responsive: false });
      // the map with the chosen point
      const W2 = mc.width, H2 = mc.height;
      mx.clearRect(0, 0, W2, H2); mx.imageSmoothingEnabled = true; mx.drawImage(off, 0, 0, W2, H2);
      mx.strokeStyle = INK; mx.lineWidth = 2; mx.beginPath(); mx.ellipse(W2 / 2, H2 / 2, W2 / 2 - 1, H2 / 2 - 1, 0, 0, 2 * Math.PI); mx.stroke();
      mx.setLineDash([6, 6]); mx.beginPath(); mx.moveTo(W2 / 2, 0); mx.lineTo(W2 / 2, H2); mx.moveTo(0, H2 / 2); mx.lineTo(W2, H2 / 2); mx.stroke(); mx.setLineDash([]);
      const px = W2 / 2 - st.pt[1] * MK, py = H2 / 2 - st.pt[0] * MK;
      mx.fillStyle = '#fff'; mx.beginPath(); mx.arc(px, py, 10, 0, 2 * Math.PI); mx.fill(); mx.lineWidth = 4; mx.stroke();
      // the loop the field tip traces (x up, y to the left) = an arrow turning with the spins (orange, length B+) plus one
      // turning against them (blue, length B−) on its tip; one scale for the whole phantom; dashed: the circle of B1+ = 1
      const LW = lc.width, LH = lc.height, LS = (0.46 * LW) / maxLoop, O = [LW / 2, LH / 2];
      const scr = (re, im) => [O[0] - im * LS, O[1] - re * LS];   // z = B_x + jB_y: real part up, imaginary part to the left
      lx.clearRect(0, 0, LW, LH);
      lx.strokeStyle = '#d8dee6'; lx.lineWidth = 1.5; lx.beginPath(); lx.moveTo(LW / 2, 8); lx.lineTo(LW / 2, LH - 8); lx.moveTo(8, LH / 2); lx.lineTo(LW - 8, LH / 2); lx.stroke();
      lx.strokeStyle = '#5b6773'; lx.lineWidth = 2; lx.setLineDash([7, 6]); lx.beginPath(); lx.arc(O[0], O[1], meanP * LS, 0, 2 * Math.PI); lx.stroke(); lx.setLineDash([]);
      if (st.view === 'all') {   // the empty coil's field at this instant, for comparison
        const g = scr(e0[0] * Math.cos(ph * DEG) - e0[1] * Math.sin(ph * DEG), e0[2] * Math.cos(ph * DEG) - e0[3] * Math.sin(ph * DEG));
        lx.strokeStyle = '#9aa5b1'; lx.lineWidth = 3; lx.setLineDash([5, 4]); lx.beginPath(); lx.moveTo(O[0], O[1]); lx.lineTo(g[0], g[1]); lx.stroke(); lx.setLineDash([]);
      }
      const P0 = plus(f), M0 = minus(f), a1 = z1(ph), e1 = scr(a1[0], a1[1]), a2 = z2(ph), e2 = scr(a1[0] + a2[0], a1[1] + a2[1]);
      const arrow = (from, to, col) => { lx.strokeStyle = col; lx.lineWidth = 5; lx.beginPath(); lx.moveTo(...from); lx.lineTo(...to); lx.stroke(); lx.fillStyle = col; lx.beginPath(); lx.arc(to[0], to[1], 5, 0, 2 * Math.PI); lx.fill(); };
      const ring = (c, r, col, w) => { lx.strokeStyle = col; lx.lineWidth = w; lx.beginPath(); lx.arc(c[0], c[1], r, 0, 2 * Math.PI); lx.stroke(); };
      lx.strokeStyle = st.view === 'all' ? INK : 'rgba(29,39,51,0.22)'; lx.lineWidth = 2.5; lx.beginPath();   // the full loop
      for (let n = 0; n <= 96; n++) { const u1 = z1(n * 3.75), u2 = z2(n * 3.75), [p1, p2] = scr(u1[0] + u2[0], u1[1] + u2[1]); if (n) lx.lineTo(p1, p2); else lx.moveTo(p1, p2); }
      lx.stroke();
      if (st.view === 'all') {
        ring(O, P0 * LS, 'rgba(232,119,14,0.55)', 2); ring(e1, M0 * LS, 'rgba(31,95,153,0.55)', 2);
        arrow(O, e1, '#e8770e'); arrow(e1, e2, '#1f5f99');
        lx.fillStyle = INK; lx.beginPath(); lx.arc(e2[0], e2[1], 7, 0, 2 * Math.PI); lx.fill();
      } else if (st.view === 'plus') { ring(O, P0 * LS, '#e8770e', 3.5); arrow(O, e1, '#e8770e'); }
      else { const e3 = scr(a2[0], a2[1]); ring(O, M0 * LS, '#1f5f99', 3.5); arrow(O, e3, '#1f5f99'); }
      lx.fillStyle = INK; lx.font = '600 20px "Helvetica Neue", Arial, sans-serif'; lx.textAlign = 'center'; lx.fillText('x ↑', LW / 2 + 22, 24); lx.textAlign = 'left'; lx.fillText('← y', 8, LH / 2 - 10);
      lx.strokeStyle = '#c2610a'; lx.lineWidth = 3; lx.beginPath(); lx.arc(LW - 34, LH - 34, 16, -0.25 * Math.PI, 1.1 * Math.PI, true); lx.stroke();   // the spins turn counter-clockwise on this view
      const ea = 1.1 * Math.PI, ex = LW - 34 + 16 * Math.cos(ea), ey = LH - 34 + 16 * Math.sin(ea);
      lx.fillStyle = '#c2610a'; lx.beginPath(); lx.moveTo(ex - 7, ey - 2); lx.lineTo(ex + 6, ey - 6); lx.lineTo(ex + 1, ey + 7); lx.fill();
      lx.font = '600 13px "Helvetica Neue", Arial, sans-serif'; lx.fillText('spins', LW - 54, LH - 6);
      if (st.play) raf = requestAnimationFrame(frame);
    }
    const start = () => { cancelAnimationFrame(raf); if (st.play) raf = requestAnimationFrame(frame); else frame(performance.now()); };
    const redo = () => { rebuild(); start(); };
    mc.addEventListener('click', (e) => {
      const r = mc.getBoundingClientRect(), X = ((e.clientX - r.left) / r.width) * mc.width, Y = ((e.clientY - r.top) / r.height) * mc.height;
      const x = (mc.height / 2 - Y) / MK, y = (mc.width / 2 - X) / MK;
      if ((x / (RX - 0.003)) ** 2 + (y / (RY - 0.003)) ** 2 < 1) { st.pt = [x, y]; redo(); }
    });
    S0.querySelectorAll('[data-ptpre]').forEach((b) => b.addEventListener('click', () => { b.blur(); st.pt = PRE[b.dataset.ptpre].slice(); redo(); }));
    segToggle(S0, 'ptdrive', (v) => { st.drive = v; redo(); });
    segToggle(S0, 'ptview', (v) => { st.view = v; start(); });
    const rs = q('.pt-rho'), ro = q('.pt-rho-read'), lb = q('.pt-lossless'), pb = q('.pt-play');
    const showRho = () => { ro.textContent = st.lossless ? 'lossless' : `${st.rho.toPrecision(2)} Ωm`; };
    rs.addEventListener('input', () => { st.rho = Number((10 ** Number(rs.value)).toPrecision(2)); st.lossless = false; lb.setAttribute('aria-pressed', 'false'); showRho(); redo(); }); keepSlider(rs);
    lb.addEventListener('click', () => { st.lossless = !st.lossless; lb.setAttribute('aria-pressed', String(st.lossless)); lb.blur(); showRho(); redo(); });
    pb.addEventListener('click', () => { st.play = !st.play; pb.textContent = st.play ? 'Pause' : 'Play'; pb.blur(); start(); });
    showRho(); rebuild();
    Reveal.on('slidechanged', (e) => { if (e.currentSlide === S0) start(); else cancelAnimationFrame(raf); });
    onShow(S0, start);
  })();

  // ---------------- #pol-curr: the sample's currents and the field they make ----------------
  if (S3) (function () {
    const st = { rho: 2, lossless: false, coil: 'x', play: true, pt: [-0.06, 0.04] };
    const q = (c) => S3.querySelector(c), host = q('[data-key="pc"]');
    const cv = q('canvas.pc-cv'), ctx = cv.getContext('2d'), K = cv.height / (2 * RX);
    let J = null, Bs = null, jmax = 1, bmax = 1, raf = 0, t0 = performance.now();
    function rebuild() {
      solve(st.lossless ? 1e6 : st.rho, 3);
      const c0 = st.coil === 'x' ? 0 : 4, app = st.coil === 'x' ? [2, 0, 0, 0] : [0, 0, 2, 0];   // the coil's own (uniform) field, solver units
      const g = (i, j, c) => F[8 * (i * NY + j) + c0 + c], inside = (i, j) => i >= 0 && i < NX && j >= 0 && j < NY && !Number.isNaN(F[8 * (i * NY + j)]);
      J = new Float64Array(2 * NX * NY).fill(NaN); Bs = new Float64Array(4 * NX * NY).fill(NaN); jmax = 0; bmax = 0;
      for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
        if (!inside(i, j)) continue;
        const k = i * NY + j;
        for (let c = 0; c < 4; c++) Bs[4 * k + c] = g(i, j, c) - app[c];
        bmax = Math.max(bmax, Math.hypot(Bs[4 * k], Bs[4 * k + 1], Bs[4 * k + 2], Bs[4 * k + 3]));
        if (![[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]].every(([a, b]) => inside(a, b))) continue;
        for (let c = 0; c < 2; c++) J[2 * k + c] = -(g(i + 1, j, 2 + c) - g(i - 1, j, 2 + c)) / (2 * STEP) + (g(i, j + 1, c) - g(i, j - 1, c)) / (2 * STEP);   // ∂B_y/∂x − ∂B_x/∂y
        jmax = Math.max(jmax, Math.hypot(J[2 * k], J[2 * k + 1]));
      }
      readout();
    }
    const near = () => { const i = Math.round((RX - st.pt[0]) / STEP - 0.5), j = Math.round((RY - st.pt[1]) / STEP - 0.5); return i * NY + j; };
    const late = (re, im) => { const d = -Math.atan2(im, re) * 180 / Math.PI; return Math.abs(d) < 0.5 ? 'in step with the coil' : d > 0 ? `${d.toFixed(0)}° behind the coil` : `${(-d).toFixed(0)}° ahead of the coil`; };
    function readout() {
      const k = near(), i = Math.floor(k / NY), j = k % NY;
      // the current: its timing on the sheet the point is nearest (the sign of the sheet is part of the pattern, not of the timing)
      const jj = st.coil === 'x' ? Math.round((RY - 0.06) / STEP - 0.5) : j, ii = st.coil === 'x' ? Math.round(RX / STEP - 0.5) : Math.round((RX - 0.08) / STEP - 0.5);
      const ks = ii * NY + (st.coil === 'x' ? jj : Math.round(RY / STEP - 0.5)), cr = J[2 * ks], ci = J[2 * ks + 1];
      q('.pc-jt').textContent = late(cr, ci);
      const o = 4 * k, main = st.coil === 'x' ? 0 : 2, bent = st.coil === 'x' ? 2 : 0;
      const appMain = 2;
      q('.pc-where').textContent = `x ${(100 * st.pt[0]).toFixed(1)} cm, y ${(100 * st.pt[1]).toFixed(1)} cm`;
      const mag = (r, m) => (Math.hypot(r, m) / appMain).toFixed(2);
      q('.pc-bent').textContent = `${mag(Bs[o + bent], Bs[o + bent + 1])} × the coil’s field`;
      // timing of the bent part relative to the coil, after taking out the sign of the curl: for both coils, without loss, the
      // bent part has the sign of x·y (relative to the coil's own direction), so it flips across each axis
      const sg = Math.sign(st.pt[0] * st.pt[1]) || 1, br = sg * Bs[o + bent], bi = sg * Bs[o + bent + 1];
      let d = -Math.atan2(bi, br) * 180 / Math.PI; d = ((d + 540) % 360) - 180;
      q('.pc-bentt').textContent = Math.hypot(br, bi) / appMain < 0.02 ? '– (none on the axes)' : `${Math.abs(d) < 0.5 ? 'in step with the coil' : d > 0 ? `${d.toFixed(0)}° behind the coil` : `${(-d).toFixed(0)}° ahead of the coil`}; curls ${sg > 0 ? '+' : '−'} here`;
      const tot = F.slice(8 * k + (st.coil === 'x' ? 0 : 4), 8 * k + (st.coil === 'x' ? 4 : 8)), P = plus(tot), M = minus(tot);
      const sh = q('.pc-share'); sh.textContent = `${Math.round((100 * P) / (P + M))} %`; sh.style.color = P / (P + M) > 0.52 ? '#c2610a' : P / (P + M) < 0.48 ? '#1f5f99' : INK;
      q('.pc-what').innerHTML = st.coil === 'x' ? 'The x coil: its own field points up–down (B<sub>x</sub>). Its currents run along the two long sides, in opposite directions.' : 'The y coil: its own field points left–right (B<sub>y</sub>). Its currents run near the two tips, in opposite directions.';
      q('.pc-bentname').innerHTML = st.coil === 'x' ? 'B<sub>y</sub>' : 'B<sub>x</sub>';
    }
    const layout = {
      width: 520, height: 260, margin: { l: 46, r: 10, t: 30, b: 44 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', size: 13.5, color: INK },
      xaxis: { title: { text: 'time in one RF cycle (°)', standoff: 4 }, range: [0, 360], dtick: 90, fixedrange: true, zeroline: false, gridcolor: '#eef1f4' },
      yaxis: { title: { text: 'field ÷ the coil’s', standoff: 2 }, fixedrange: true, zeroline: true, zerolinecolor: '#c9d1da', gridcolor: '#eef1f4' },
      legend: { orientation: 'h', x: 0, y: 1.02, yanchor: 'bottom', font: { size: 12 } },
    };
    const TT = Array.from({ length: 181 }, (_, n) => 2 * n);
    function frame(now) {
      const ph = ((((now - t0) / 3200) * 360) % 360) * DEG, c = Math.cos(ph), sn = Math.sin(ph), W2 = cv.width, H2 = cv.height;
      // the current along the cylinder now (red: out of the screen, blue: into it)
      const img = ctx.createImageData(NY, NX);
      for (let k = 0; k < NX * NY; k++) {
        if (Number.isNaN(F[8 * k])) { img.data.set([255, 255, 255, 0], 4 * k); continue; }
        const v = Number.isNaN(J[2 * k]) ? 0 : (J[2 * k] * c - J[2 * k + 1] * sn) / jmax, [r, g, b] = rdbu(v, -1, 1);
        img.data.set([r, g, b, 255], 4 * k);
      }
      const tmp = document.createElement('canvas'); tmp.width = NY; tmp.height = NX; tmp.getContext('2d').putImageData(img, 0, 0);
      ctx.clearRect(0, 0, W2, H2); ctx.imageSmoothingEnabled = true; ctx.drawImage(tmp, 0, 0, W2, H2);
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(W2 / 2, H2 / 2, W2 / 2 - 1, H2 / 2 - 1, 0, 0, 2 * Math.PI); ctx.stroke();
      // the sample's own field now, on a grid
      const toC = (x, y) => [W2 / 2 - y * K, H2 / 2 - x * K], L = 0.75 * 0.015 * K;
      for (let gx = -0.09; gx <= 0.0901; gx += 0.015) for (let gy = -0.06; gy <= 0.0601; gy += 0.015) {
        if ((gx / (RX - 0.006)) ** 2 + (gy / (RY - 0.006)) ** 2 >= 1) continue;
        const k = Math.round((RX - gx) / STEP - 0.5) * NY + Math.round((RY - gy) / STEP - 0.5), o = 4 * k; if (Number.isNaN(Bs[o])) continue;
        const bx = (Bs[o] * c - Bs[o + 1] * sn) / bmax, by = (Bs[o + 2] * c - Bs[o + 3] * sn) / bmax, [x0, y0] = toC(gx, gy), x1 = x0 - by * L, y1 = y0 - bx * L;
        const len = Math.hypot(x1 - x0, y1 - y0); if (len < 1.5) continue;
        ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        const ux = (x1 - x0) / len, uy = (y1 - y0) / len, hs = Math.min(9, 0.45 * len);
        ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - hs * ux + 0.6 * hs * uy, y1 - hs * uy - 0.6 * hs * ux); ctx.lineTo(x1 - hs * ux - 0.6 * hs * uy, y1 - hs * uy + 0.6 * hs * ux); ctx.fill();
      }
      const [px, py] = toC(st.pt[0], st.pt[1]); ctx.strokeStyle = '#2e8b3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(px, py, 13, 0, 2 * Math.PI); ctx.stroke();
      // the coil's own field now (uniform), top-left corner
      const a = 2 * c, cx0 = 56, cy0 = 70, AL = 46;
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(6, 6, 104, 128); ctx.fillStyle = '#5b6773'; ctx.font = '600 17px "Helvetica Neue", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('coil now', cx0, 28);
      const [ex, ey] = st.coil === 'x' ? [cx0, cy0 - (a / 2) * AL] : [cx0 - (a / 2) * AL, cy0];
      ctx.strokeStyle = '#9aa5b1'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(ex, ey); ctx.stroke(); ctx.fillStyle = '#9aa5b1'; ctx.beginPath(); ctx.arc(ex, ey, 6, 0, 2 * Math.PI); ctx.fill();
      // sine curves at the chosen point
      const k = near(), o = 4 * k, main = st.coil === 'x' ? 0 : 2, bent = st.coil === 'x' ? 2 : 0, w = (r, m) => TT.map((t) => (r * Math.cos(t * DEG) - m * Math.sin(t * DEG)) / 2);
      const tM = [Bs[o + main] + 2, Bs[o + main + 1]];
      const phd = (ph / DEG) % 360;
      layout.shapes = [{ type: 'line', x0: phd, x1: phd, y0: 0, y1: 1, yref: 'paper', line: { color: '#9aa5b1', width: 1.5, dash: 'dot' } }];
      const nm = st.coil === 'x' ? ['B<sub>x</sub>', 'B<sub>y</sub>'] : ['B<sub>y</sub>', 'B<sub>x</sub>'];
      Plotly.react(host, [
        { x: TT, y: TT.map((t) => Math.cos(t * DEG)), mode: 'lines', line: { color: '#9aa5b1', width: 2.5, dash: 'dash' }, name: `the coil’s ${nm[0]}`, hoverinfo: 'skip' },
        { x: TT, y: w(Bs[o + main], Bs[o + main + 1]), mode: 'lines', line: { color: '#2e8b3a', width: 2 }, name: `the sample’s ${nm[0]}`, hoverinfo: 'skip' },
        { x: TT, y: w(tM[0], tM[1]), mode: 'lines', line: { color: INK, width: 3 }, name: `total ${nm[0]}`, hoverinfo: 'skip' },
        { x: TT, y: w(Bs[o + bent], Bs[o + bent + 1]), mode: 'lines', line: { color: '#7b3fa0', width: 3 }, name: `${nm[1]} (all from the sample)`, hoverinfo: 'skip' },
      ], layout, { displayModeBar: false, scrollZoom: false, responsive: false });
      if (st.play) raf = requestAnimationFrame(frame);
    }
    const start = () => { cancelAnimationFrame(raf); if (st.play) raf = requestAnimationFrame(frame); else frame(performance.now()); };
    const redo = () => { rebuild(); start(); };
    cv.addEventListener('click', (e) => {
      const r = cv.getBoundingClientRect(), X = ((e.clientX - r.left) / r.width) * cv.width, Y = ((e.clientY - r.top) / r.height) * cv.height;
      const x = (cv.height / 2 - Y) / K, y = (cv.width / 2 - X) / K;
      if ((x / (RX - 0.004)) ** 2 + (y / (RY - 0.004)) ** 2 < 1) { st.pt = [x, y]; readout(); start(); }
    });
    segToggle(S3, 'pccoil', (v) => { st.coil = v; redo(); });
    const rs = q('.pc-rho'), ro = q('.pc-rho-read'), lb = q('.pc-lossless'), pb = q('.pc-play');
    const showRho = () => { ro.textContent = st.lossless ? 'lossless' : `${st.rho.toPrecision(2)} Ωm`; };
    rs.addEventListener('input', () => { st.rho = Number((10 ** Number(rs.value)).toPrecision(2)); st.lossless = false; lb.setAttribute('aria-pressed', 'false'); showRho(); redo(); }); keepSlider(rs);
    lb.addEventListener('click', () => { st.lossless = !st.lossless; lb.setAttribute('aria-pressed', String(st.lossless)); lb.blur(); showRho(); redo(); });
    pb.addEventListener('click', () => { st.play = !st.play; pb.textContent = st.play ? 'Pause' : 'Play'; pb.blur(); start(); });
    showRho(); rebuild();
    Reveal.on('slidechanged', (e) => { if (e.currentSlide === S3) start(); else cancelAnimationFrame(raf); });
    onShow(S3, start);
  })();

  // ---------------- #pol: which way does the field turn? ----------------
  if (S1) (function () {
    const st = { rho: 2, lossless: false, b0: 3, drive: 'x', play: true };
    const cv = S1.querySelector('canvas.pl-cv'), ctx = cv.getContext('2d'), K = cv.height / (2 * RX);   // px per metre
    const off = document.createElement('canvas'), octx = off.getContext('2d');
    let glyphs = [], mapImg = null, t0 = performance.now(), raf = 0;
    const q = (c) => S1.querySelector(c);
    function rebuild() {
      solve(st.lossless ? 1e6 : st.rho, st.b0);
      const [a, b] = DRIVES[st.drive], { M, diag } = bplusMap(a, b);
      off.width = NY; off.height = NX; const img = octx.createImageData(NY, NX);
      for (let k = 0; k < NX * NY; k++) { if (Number.isNaN(M[k])) { img.data.set([255, 255, 255, 0], 4 * k); continue; } const [r, g, bb] = rdbu(M[k], 0.5, 1.5); img.data.set([r, g, bb, 255], 4 * k); }
      octx.putImageData(img, 0, 0); mapImg = off;
      // glyphs every 1.5 cm, inside the ellipse less 0.8 cm
      glyphs = []; let big = 0;
      for (let gx = -0.09; gx <= 0.0901; gx += 0.015) for (let gy = -0.06; gy <= 0.0601; gy += 0.015) {
        if ((gx / (RX - 0.008)) ** 2 + (gy / (RY - 0.008)) ** 2 >= 1) continue;
        const i = Math.round((RX - gx) / STEP - 0.5), j = Math.round((RY - gy) / STEP - 0.5), f = drive(i * NY + j, a, b); if (!f) continue;
        const P = plus(f), Mi = minus(f); big = Math.max(big, P + Mi);
        glyphs.push({ gx, gy, f, share: P / (P + Mi) });
      }
      glyphs.forEach((g) => { g.s = (0.0068 * K) / big; });   // the biggest loop: 6.8 mm across half-width
      // quadrant shares of the field turning with the spins
      const qs = { pp: [0, 0], pm: [0, 0], mp: [0, 0], mm: [0, 0] };
      for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
        const f = drive(i * NY + j, a, b); if (!f) continue; const [x, y] = pix(i, j); if (Math.abs(x) < 0.015 || Math.abs(y) < 0.015) continue;
        const key = (x > 0 ? 'p' : 'm') + (y > 0 ? 'p' : 'm'), P = plus(f), Mi = minus(f); qs[key][0] += P / (P + Mi); qs[key][1]++;
      }
      Object.entries(qs).forEach(([key, [s, n]]) => { const el = q(`.pl-q-${key}`); const v = s / n; el.textContent = `${Math.round(100 * v)} %`; el.style.color = v > 0.52 ? '#c2610a' : v < 0.48 ? '#1f5f99' : INK; });
      q('.pl-diag').textContent = diagTxt(diag);
      q('.pl-what').innerHTML = { x: 'the x coil alone (a linear coil, field along x)', y: 'the y coil alone (a linear coil, field along y)', cp: 'both coils, the y coil 90° behind (CP, the scanner’s drive)' }[st.drive];
    }
    function frame(now) {
      const W2 = cv.width, H2 = cv.height, ph = ((now - t0) / 2600) * 2 * Math.PI;   // one RF cycle per 2.6 s, slowed down hugely
      ctx.clearRect(0, 0, W2, H2);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(mapImg, 0, 0, W2, H2);
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(W2 / 2, H2 / 2, W2 / 2 - 1, H2 / 2 - 1, 0, 0, 2 * Math.PI); ctx.stroke();
      const toC = (x, y) => [W2 / 2 - y * K, H2 / 2 - x * K];
      for (const g of glyphs) {
        const [cx, cy] = toC(g.gx, g.gy), [xr, xi, yr, yi] = g.f, at = (w) => { const c = Math.cos(w), s = Math.sin(w); return [cx - g.s * (yr * c - yi * s), cy - g.s * (xr * c - xi * s)]; };
        const u = Math.max(-1, Math.min(1, (g.share - 0.5) / 0.2)), col = (u >= 0 ? ORANGE : BLUE).map((v, n) => Math.round(GREY[n] + Math.abs(u) * (v - GREY[n])));
        ctx.strokeStyle = `rgb(${col.join(',')})`; ctx.lineWidth = 2.2; ctx.beginPath();
        for (let n = 0; n <= 48; n++) { const [px, py] = at((n / 48) * 2 * Math.PI); if (n) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.stroke();
        const [tx, ty] = at(ph); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(tx, ty, 3.2, 0, 2 * Math.PI); ctx.fill();
      }
      ctx.fillStyle = INK; ctx.font = '600 22px "Helvetica Neue", Arial, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('x ↑', W2 / 2, 26); ctx.textAlign = 'left'; ctx.fillText('← y', 10, H2 / 2 - 10);
      if (st.play) raf = requestAnimationFrame(frame);
    }
    const start = () => { cancelAnimationFrame(raf); if (st.play) raf = requestAnimationFrame(frame); else frame(performance.now()); };
    segToggle(S1, 'pldrive', (v) => { st.drive = v; rebuild(); start(); });
    segToggle(S1, 'plb0', (v) => { st.b0 = Number(v); rebuild(); start(); });
    const rs = q('.pl-rho'), ro = q('.pl-rho-read');
    const showRho = () => { ro.textContent = st.lossless ? 'lossless' : `${st.rho.toPrecision(2)} Ωm`; };
    rs.addEventListener('input', () => { st.rho = Number((10 ** Number(rs.value)).toPrecision(2)); st.lossless = false; lb.setAttribute('aria-pressed', 'false'); showRho(); rebuild(); start(); }); keepSlider(rs);
    const lb = q('.pl-lossless');
    lb.addEventListener('click', () => { st.lossless = !st.lossless; lb.setAttribute('aria-pressed', String(st.lossless)); lb.blur(); showRho(); rebuild(); start(); });
    const pb = q('.pl-play');
    pb.addEventListener('click', () => { st.play = !st.play; pb.textContent = st.play ? 'Pause' : 'Play'; pb.blur(); start(); });
    showRho(); rebuild();
    Reveal.on('slidechanged', (e) => { if (e.currentSlide === S1) start(); else cancelAnimationFrame(raf); });
    if (Reveal.getCurrentSlide && Reveal.getCurrentSlide() === S1) start(); else frame(performance.now());
  })();

  // ---------------- #pol-sum: two coils, a phase apart ----------------
  if (S2) (function () {
    const st = { rho: 2, lossless: false, b0: 3, phi: 90 };
    const q = (c) => S2.querySelector(c), host = (k) => S2.querySelector(`[data-key="${k}"]`);
    const rows = (M) => Array.from({ length: NX }, (_, i) => Array.from(M.subarray(i * NY, (i + 1) * NY), (v) => (Number.isNaN(v) ? null : v)));
    function heat(h, M, hover) {
      Plotly.react(h, [{ type: 'heatmap', z: rows(M), colorscale: CMAPS.rdbu, zmin: 0.5, zmax: 1.5, hoverongaps: false, hovertemplate: `${hover} %{z:.2f} × its mean<extra></extra>`, showscale: false }], {
        width: 150, height: 200, margin: { l: 1, r: 1, t: 1, b: 1 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { visible: false, fixedrange: true }, yaxis: { visible: false, autorange: 'reversed', scaleanchor: 'x', fixedrange: true }, dragmode: false,
      }, { displayModeBar: false, scrollZoom: false, responsive: false });
    }
    function draw() {
      solve(st.lossless ? 1e6 : st.rho, st.b0);
      const w = [Math.cos(-st.phi * DEG), Math.sin(-st.phi * DEG)], wr = [Math.cos(st.phi * DEG), Math.sin(st.phi * DEG)];
      const X = bplusMap([1, 0], [0, 0]), Y = bplusMap([0, 0], [1, 0]), B = bplusMap([1, 0], w), R = bplusMap([1, 0], wr, minus);
      heat(host('x'), X.M, 'x coil B<sub>1</sub><sup>+</sup>'); heat(host('y'), Y.M, 'y coil B<sub>1</sub><sup>+</sup>');
      heat(host('both'), B.M, 'both B<sub>1</sub><sup>+</sup>'); heat(host('rx'), R.M, 'receive B<sub>1</sub><sup>−</sup>');
      q('.ps-dx').textContent = diagTxt(X.diag); q('.ps-dy').textContent = diagTxt(Y.diag); q('.ps-db').textContent = diagTxt(B.diag); q('.ps-dr').textContent = diagTxt(R.diag);
      // how strong is "both" (its mean B1+) compared with the CP drive?
      let sb = 0, sc = 0; for (let k = 0; k < NX * NY; k++) { const f1 = drive(k, [1, 0], w), f2 = drive(k, [1, 0], [0, -1]); if (f1) { sb += plus(f1); sc += plus(f2); } }
      q('.ps-strength').textContent = `${(sb / sc).toFixed(2)} × CP`;
    }
    segToggle(S2, 'psb0', (v) => { st.b0 = Number(v); draw(); });
    const ps = q('.ps-phi'), po = q('.ps-phi-read');
    const showPhi = () => { po.textContent = `${st.phi.toFixed(0)}°${st.phi === 90 ? ' (CP)' : st.phi === -90 ? ' (wired backwards)' : st.phi === 0 ? ' (one linear coil at 45°)' : ''}`; };
    ps.addEventListener('input', () => { st.phi = Number(ps.value); showPhi(); draw(); }); keepSlider(ps);
    S2.querySelectorAll('[data-psphi]').forEach((b) => b.addEventListener('click', () => { b.blur(); st.phi = Number(b.dataset.psphi); ps.value = String(st.phi); showPhi(); draw(); }));
    const rs = q('.ps-rho'), ro = q('.ps-rho-read'), lb = q('.ps-lossless');
    const showRho = () => { ro.textContent = st.lossless ? 'lossless' : `${st.rho.toPrecision(2)} Ωm`; };
    rs.addEventListener('input', () => { st.rho = Number((10 ** Number(rs.value)).toPrecision(2)); st.lossless = false; lb.setAttribute('aria-pressed', 'false'); showRho(); draw(); }); keepSlider(rs);
    lb.addEventListener('click', () => { st.lossless = !st.lossless; lb.setAttribute('aria-pressed', String(st.lossless)); lb.blur(); showRho(); draw(); });
    showRho(); showPhi();
    onShow(S2, draw);
  })();
})();
