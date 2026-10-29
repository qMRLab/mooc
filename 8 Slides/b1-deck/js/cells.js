/* The sample as a grid of little wires (#cells). The phantom is cut into h × h cells; each is a column of water and salt
 * along the cylinder. The electric field along the cylinder (E_z, the only component in this 2D model) drives a current
 * in each column, I = Y E_z h², Y = σ + jωε0ε_r (the water's polarization current, in step with the coil when nothing else
 * acts, + the ions' conduction current); each column's current makes a magnetic field that swirls round it
 * (Biot–Savart) and an electric field felt by every other column. Solving all columns together (a volume integral
 * equation with a quasi-static background, the same physics as Sled & Pike):
 *   E_i − (jωμ0/2π) Σ_j ln|r_i − r_j| I_j = E_coil,i,   self term ln a − ½ (a round cell of equal area, a = h/√π)
 * Coils: x coil B = (1, 0), E_coil = −jω y; y coil B = (0, 1), E_coil = +jω x; CP = x − j·y. Fields at any point,
 * inside or outside: the coil's + Σ over columns (each a round column of current, so its field is finite inside it).
 * Checked against the exact elliptic solution (wasm) with 6 mm cells: rms error ~1 % inside, 0.8 % on |B1+|. */
(function () {
  'use strict';
  const slide = document.getElementById('cells'); if (!slide) return;
  const H = 0.006, WIN = 0.15, GS = 0.0125, DEG = Math.PI / 180, MU = 4e-7 * Math.PI, EPS0 = 8.8541878128e-12;
  const SHAPES = {
    ellipse: { name: 'ellipse 20 × 15 cm', inside: (x, y) => (x / 0.10) ** 2 + (y / 0.075) ** 2 < 1, draw: (c, s) => { c.ellipse(s.ox, s.oy, 0.075 * s.k, 0.10 * s.k, 0, 0, 2 * Math.PI); } },
    rect: { name: 'rectangle 20 × 15 cm', inside: (x, y) => Math.abs(x) < 0.10 && Math.abs(y) < 0.075, draw: (c, s) => { c.rect(s.ox - 0.075 * s.k, s.oy - 0.10 * s.k, 0.15 * s.k, 0.20 * s.k); } },
    square: { name: 'square 15 × 15 cm', inside: (x, y) => Math.abs(x) < 0.075 && Math.abs(y) < 0.075, draw: (c, s) => { c.rect(s.ox - 0.075 * s.k, s.oy - 0.075 * s.k, 0.15 * s.k, 0.15 * s.k); } },
    circle: { name: 'circle, 17.3 cm across', inside: (x, y) => x * x + y * y < 0.0866 ** 2, draw: (c, s) => { c.arc(s.ox, s.oy, 0.0866 * s.k, 0, 2 * Math.PI); } },
  };
  const st = { shape: 'ellipse', coil: 'x', show: 'total', colour: 'current', b0: 3, rho: 2, lossless: false, play: true, pick: -1 };
  let P = [], I = null, G = [], raf = 0, t0 = performance.now(), solveMs = 0;   // P: cell centres; I: currents per coil; G: grid points

  function solve() {
    const t = performance.now(), w = 2 * Math.PI * GAMMA_BAR * st.b0, rho = st.lossless ? 1e9 : st.rho, Yr = 1 / rho, Yi = w * EPS0 * 80, ins = SHAPES[st.shape].inside;
    P = []; for (let x = -WIN + H / 2; x < WIN; x += H) for (let y = -WIN + H / 2; y < WIN; y += H) if (ins(x, y)) P.push([x, y]);
    const N = P.length, a = H / Math.sqrt(Math.PI), c = ((w * MU) / (2 * Math.PI)) * H * H;
    const Mr = new Float64Array(N * N), Mi = new Float64Array(N * N);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const L = i === j ? Math.log(a) - 0.5 : Math.log(Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]));
      Mr[i * N + j] = (i === j ? 1 : 0) + c * L * Yi; Mi[i * N + j] = -c * L * Yr;   // 1 − j c L Y
    }
    for (let k = 0; k < N; k++) {   // complex LU, no pivoting (the matrix is dominated by its diagonal here)
      const pr = Mr[k * N + k], pi = Mi[k * N + k], d = pr * pr + pi * pi, ko = k * N;
      for (let i = k + 1; i < N; i++) {
        const ar = Mr[i * N + k], ai = Mi[i * N + k], fr = (ar * pr + ai * pi) / d, fi = (ai * pr - ar * pi) / d, ro = i * N;
        Mr[ro + k] = fr; Mi[ro + k] = fi;
        for (let j = k + 1; j < N; j++) { const ur = Mr[ko + j], ui = Mi[ko + j]; Mr[ro + j] -= fr * ur - fi * ui; Mi[ro + j] -= fr * ui + fi * ur; }
      }
    }
    const back = (br, bi) => {
      const xr = Float64Array.from(br), xi = Float64Array.from(bi);
      for (let i = 0; i < N; i++) for (let j = 0; j < i; j++) { const fr = Mr[i * N + j], fi = Mi[i * N + j]; xr[i] -= fr * xr[j] - fi * xi[j]; xi[i] -= fr * xi[j] + fi * xr[j]; }
      for (let i = N - 1; i >= 0; i--) {
        for (let j = i + 1; j < N; j++) { const ur = Mr[i * N + j], ui = Mi[i * N + j]; xr[i] -= ur * xr[j] - ui * xi[j]; xi[i] -= ur * xi[j] + ui * xr[j]; }
        const pr = Mr[i * N + i], pi = Mi[i * N + i], d = pr * pr + pi * pi, tr = xr[i], ti = xi[i]; xr[i] = (tr * pr + ti * pi) / d; xi[i] = (ti * pr - tr * pi) / d;
      }
      return [xr, xi];
    };
    const Ex = back(new Float64Array(N), Float64Array.from(P, (p) => -w * p[1])), Ey = back(new Float64Array(N), Float64Array.from(P, (p) => w * p[0]));
    const cur = ([er, ei]) => [er.map((v, i) => (Yr * v - Yi * ei[i]) * H * H), ei.map((v, i) => (Yr * v + Yi * er[i]) * H * H)];
    I = { x: cur(Ex), y: cur(Ey), w, a };
    // the grid points (inside and outside): the coil's field, the sample's field and E_z, per coil (phasors)
    G = [];
    for (let gx = -WIN + GS / 2; gx < WIN; gx += GS) for (let gy = -WIN + GS / 2; gy < WIN; gy += GS) G.push({ x: gx, y: gy, ins: ins(gx, gy), s: { x: fieldAt(gx, gy, I.x), y: fieldAt(gx, gy, I.y) } });
    solveMs = performance.now() - t;
  }
  // the sample's field (Bx, By re/im) and E_z (re/im) at (x, y) from currents [Ir, Ii]
  function fieldAt(x, y, [Ir, Ii]) {
    let bxr = 0, bxi = 0, byr = 0, byi = 0, er = 0, ei = 0; const a = I.a, cE = (I.w * MU) / (2 * Math.PI);
    for (let j = 0; j < P.length; j++) {
      const dx = x - P[j][0], dy = y - P[j][1], r2 = Math.max(dx * dx + dy * dy, a * a), f = MU / (2 * Math.PI * r2);
      bxr -= dy * f * Ir[j]; bxi -= dy * f * Ii[j]; byr += dx * f * Ir[j]; byi += dx * f * Ii[j];
      const L = 0.5 * Math.log(r2);   // E_z += jωμ0/(2π) ln r · I
      er -= cE * L * Ii[j]; ei += cE * L * Ir[j];
    }
    return [bxr, bxi, byr, byi, er, ei];
  }
  // a drive's phasors: coil field (Bx, By, Ez) + the sample's, from the two coils' solutions; CP = x − j·y
  const comb = (px, py) => (st.coil === 'x' ? px : st.coil === 'y' ? py : px.map((v, n) => (n % 2 === 0 ? v + py[n + 1] : v - py[n - 1])));
  const coilPh = (g) => comb([1, 0, 0, 0, 0, -I.w * g.y], [0, 0, 1, 0, 0, I.w * g.x]);   // the coil's own field and E_z (empty scanner)
  const cellI = (j) => comb([I.x[0][j], I.x[1][j]], [I.y[0][j], I.y[1][j]]);

  const q = (c) => slide.querySelector(c), cv = q('canvas.ce-cv'), ctx = cv.getContext('2d'), SC = { k: cv.width / (2 * WIN), ox: cv.width / 2, oy: cv.height / 2 };
  const toC = (x, y) => [SC.ox - y * SC.k, SC.oy - x * SC.k];
  const RD = CMAPS.rdbu.map(([t, c]) => [t, ...c.match(/\d+/g).map(Number)]);
  const rdbu = (v) => { const t = Math.max(0, Math.min(1, (v + 1) / 2)); let n = 1; while (n < RD.length - 1 && RD[n][0] < t) n++; const [t0_, ...a] = RD[n - 1], [t1, ...b] = RD[n], u = (t - t0_) / (t1 - t0_); return `rgb(${a.map((x, i) => Math.round(x + u * (b[i] - x))).join(',')})`; };
  function frame(now) {
    const ph = ((((now - t0) / 3200) * 360) % 360) * DEG, c = Math.cos(ph), s = Math.sin(ph), re = (r, m) => r * c - m * s, W2 = cv.width, H2 = cv.height;
    ctx.clearRect(0, 0, W2, H2); ctx.fillStyle = '#fafbfc'; ctx.fillRect(0, 0, W2, H2);
    // colour: each cell's current, or the electric field along the cylinder (everywhere, on the arrow grid)
    if (st.colour === 'current') {
      let mx = 0; for (let j = 0; j < P.length; j++) { const [r, m] = cellI(j); mx = Math.max(mx, Math.hypot(r, m)); }
      const sz = H * SC.k;
      for (let j = 0; j < P.length; j++) { const [r, m] = cellI(j), [px, py] = toC(P[j][0], P[j][1]); ctx.fillStyle = rdbu(re(r, m) / mx); ctx.fillRect(px - sz / 2, py - sz / 2, sz + 0.5, sz + 0.5); }
    } else {
      let mx = 0; const E = G.map((g) => { const t = comb(g.s.x, g.s.y), cp = coilPh(g), v = [t[4] + cp[4], t[5] + cp[5]]; mx = Math.max(mx, Math.hypot(...v)); return v; });
      const sz = GS * SC.k;
      // "¼ cycle later": B = (j/ω)(∂E_z/∂y, −∂E_z/∂x), so the arrows now run along the bands of the electric field a quarter cycle later
      const lag = st.colour === 'elater' ? 0.5 * Math.PI : 0, cl = Math.cos(ph + lag), sl = Math.sin(ph + lag);
      G.forEach((g, n) => { const [px, py] = toC(g.x, g.y); ctx.fillStyle = rdbu((E[n][0] * cl - E[n][1] * sl) / mx); ctx.fillRect(px - sz / 2, py - sz / 2, sz + 0.5, sz + 0.5); });
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); SHAPES[st.shape].draw(ctx, SC); ctx.stroke();
    // arrows: Bx, By now
    let vec;
    if (st.show === 'one' && st.pick >= 0) {
      const [Ir, Ii] = cellI(st.pick), a = I.a;
      vec = G.map((g) => { const dx = g.x - P[st.pick][0], dy = g.y - P[st.pick][1], r2 = Math.max(dx * dx + dy * dy, a * a), f = MU / (2 * Math.PI * r2); return [-dy * f * Ir, -dy * f * Ii, dx * f * Ir, dx * f * Ii]; });
    } else vec = G.map((g) => { const smp = comb(g.s.x, g.s.y), cp = coilPh(g); return st.show === 'coil' ? cp.slice(0, 4) : st.show === 'sample' ? smp.slice(0, 4) : [0, 1, 2, 3].map((n) => smp[n] + cp[n]); });
    // scale: a typical (90th percentile) size, not the largest (points right next to a column see a huge field); cap the longest
    const amps = vec.map((v) => Math.hypot(v[0], v[1], v[2], v[3])).filter((v) => v > 0).sort((u, w) => u - w);
    const ref = amps.length ? amps[Math.floor((st.show === 'one' ? 0.5 : 0.9) * (amps.length - 1))] : 1, AL = 0.5 * GS * SC.k;
    vec.forEach((v, n) => {
      const g = G[n], bx = re(v[0], v[1]), by = re(v[2], v[3]), [x0, y0] = toC(g.x, g.y);
      let m = Math.hypot(bx, by) / ref; if (m < 1e-6) return;
      const lenv = AL * (st.show === 'one' ? Math.min(1.1, Math.sqrt(m)) : Math.min(1.1, m)), ux = -by / Math.hypot(bx, by), uy = -bx / Math.hypot(bx, by);
      if (lenv < 1.2) return;
      const x2 = x0 + ux * lenv, y2 = y0 + uy * lenv;
      const col = g.ins ? INK : '#5b6773';
      ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x2, y2); ctx.stroke();
      const hs = Math.min(9, 0.45 * lenv);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - hs * ux + 0.55 * hs * uy, y2 - hs * uy - 0.55 * hs * ux); ctx.lineTo(x2 - hs * ux - 0.55 * hs * uy, y2 - hs * uy + 0.55 * hs * ux); ctx.fill();
    });
    if (st.pick >= 0) { const [px, py] = toC(P[st.pick][0], P[st.pick][1]); ctx.strokeStyle = '#2e8b3a'; ctx.lineWidth = 3.5; ctx.strokeRect(px - H * SC.k, py - H * SC.k, 2 * H * SC.k, 2 * H * SC.k); }
    ctx.fillStyle = INK; ctx.font = '600 20px "Helvetica Neue", Arial, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('x ↑', SC.ox + 6, 22); ctx.fillText('← y', 6, SC.oy - 8);
    // the coil now (its own uniform field)
    const cp = coilPh(G[0]), cbx = re(cp[0], cp[1]), cby = re(cp[2], cp[3]), cx0 = W2 - 62, cy0 = 70, CL = 40;
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(W2 - 118, 6, 112, 124); ctx.fillStyle = '#5b6773'; ctx.font = '600 16px "Helvetica Neue", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('coil now', cx0, 26);
    ctx.strokeStyle = '#9aa5b1'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx0 - cby * CL, cy0 - cbx * CL); ctx.stroke();
    if (st.play) raf = requestAnimationFrame(frame);
  }
  function readout() {
    q('.ce-n').textContent = `${P.length} cells of ${(H * 1000).toFixed(0)} mm, solved in ${solveMs.toFixed(0)} ms`;
    const w = 2 * Math.PI * GAMMA_BAR * st.b0, sig = st.lossless ? 0 : 1 / st.rho, d = w * EPS0 * 80;
    q('.ce-mix').textContent = `water ${d.toFixed(2)} S/m (in step with E + a quarter cycle) · salt ${sig.toFixed(2)} S/m (in step with E)`;
    if (st.pick >= 0) {
      const [r, m] = cellI(st.pick); let dd = -Math.atan2(m, r) / DEG; dd = ((dd + 540) % 360) - 180;
      q('.ce-pick').textContent = `cell at x ${(100 * P[st.pick][0]).toFixed(1)}, y ${(100 * P[st.pick][1]).toFixed(1)} cm: its current peaks ${Math.abs(dd) < 0.5 ? 'with' : dd > 0 ? `${dd.toFixed(0)}° after` : `${(-dd).toFixed(0)}° before`} the coil's field`;
    } else q('.ce-pick').textContent = 'Click a cell to pick it.';
  }
  const start = () => { cancelAnimationFrame(raf); if (st.play) raf = requestAnimationFrame(frame); else frame(performance.now()); };
  const redo = () => { const b = q('.ce-busy'); b.hidden = false; setTimeout(() => { solve(); st.pick = -1; readout(); start(); b.hidden = true; }, 20); };
  segToggle(slide, 'ceshape', (v) => { st.shape = v; redo(); });
  segToggle(slide, 'cecoil', (v) => { st.coil = v; readout(); start(); });
  segToggle(slide, 'ceshow', (v) => { st.show = v; start(); });
  segToggle(slide, 'cecol', (v) => { st.colour = v; start(); });
  segToggle(slide, 'ceb0', (v) => { st.b0 = Number(v); redo(); });
  const rs = q('.ce-rho'), ro = q('.ce-rho-read'), lb = q('.ce-lossless'), pb = q('.ce-play');
  const showRho = () => { ro.textContent = st.lossless ? 'lossless' : `${st.rho.toPrecision(2)} Ωm`; };
  rs.addEventListener('change', () => { st.rho = Number((10 ** Number(rs.value)).toPrecision(2)); st.lossless = false; lb.setAttribute('aria-pressed', 'false'); showRho(); redo(); });
  rs.addEventListener('input', () => { st.rho = Number((10 ** Number(rs.value)).toPrecision(2)); showRho(); }); keepSlider(rs);
  lb.addEventListener('click', () => { st.lossless = !st.lossless; lb.setAttribute('aria-pressed', String(st.lossless)); lb.blur(); showRho(); redo(); });
  pb.addEventListener('click', () => { st.play = !st.play; pb.textContent = st.play ? 'Pause' : 'Play'; pb.blur(); start(); });
  cv.addEventListener('click', (e) => {
    const r = cv.getBoundingClientRect(), X = ((e.clientX - r.left) / r.width) * cv.width, Y = ((e.clientY - r.top) / r.height) * cv.height, x = (SC.oy - Y) / SC.k, y = (SC.ox - X) / SC.k;
    let best = -1, bd = Infinity; P.forEach((p, j) => { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < bd) { bd = d; best = j; } });
    if (best >= 0 && bd < (2 * H) ** 2) { st.pick = best; readout(); start(); }
  });
  showRho();
  onShow(slide, () => { solve(); readout(); start(); });
  Reveal.on('slidechanged', (e) => { if (e.currentSlide === slide) start(); else cancelAnimationFrame(raf); });
})();
