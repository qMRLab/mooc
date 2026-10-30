/* The double angle scans of Exercise 2, shared by its slides (register.js, receive.js). The brain slice of fl-data.js imaged
 * at α = 60° and 2α = 120° (long TR, S = receive·PD·e^(−TE/T2)·sin(αB1), the PD/T2 guesses of #fl, TE 5 ms, no noise).
 * Between the two scans the head moved by a rigid shift and rotation in the slice (MOTION; transmit B1 moves with the
 * head). Receive: an array of COILS fixed in the scanner, quasi-static loops as on #mo / #fl-rx / #guess (two antiparallel
 * wires, |B1−| = |B⊥|/2, root-sum-of-squares), ÷ its brain mean: it does not move with the head, so registration cannot
 * remove it from the ratio.
 * Grid: the brain's bounding box plus PAD pixels (2 mm), pixel (i, j) covering [j, j + 1] × [i, i + 1]; MOTION is in those
 * pixels (right, down) and degrees (clockwise on screen), about the crop's centre (CX, CY). Lab coordinates: U(j), V(i) in
 * metres, u right, v up (anterior). */
window.DAM_MOTION = (function () {
  'use strict';
  const D = window.FLASH_BRAIN; if (!D) return null;
  const MOTION = { du: 2.5, dv: -3.5, rot: 6.7 };   // pixels (2 mm) right and down, degrees: how the head moved for the 120° scan
  const NR = D.grid.rows, NC = D.grid.cols, DEG = Math.PI / 180, A = 60, PAD = 8;
  const bytes = (b64) => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  // [angle around the head centre (°, 0 = screen right, 90 = anterior), gap to the head (mm), loop width (cm)]: 8 loops around
  const COILS = [0, 45, 90, 135, 180, 225, 270, 315].map((a) => [a, 4, 8]);
  const PIX = D.grid.mm * 1e-3;
  const SEG = bytes(D.seg), WM = bytes(D.wm), GM = bytes(D.gm), CSF = bytes(D.csf);
  const B1 = Array.from(new Uint16Array(bytes(D.b1).buffer), (v) => (v === 65535 ? NaN : v / 20000));
  const PD = { wm: 0.69 * Math.exp(-5 / 70), gm: 0.8 * Math.exp(-5 / 90), csf: Math.exp(-5 / 1000) };
  const brainAt = (k) => WM[k] + GM[k] + CSF[k] > 50 && !Number.isNaN(B1[k]);

  // crop to the brain, with room for the motion
  let r0 = NR, r1 = 0, c0 = NC, c1 = 0;
  for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) if (brainAt(i * NC + j)) { r0 = Math.min(r0, i); r1 = Math.max(r1, i); c0 = Math.min(c0, j); c1 = Math.max(c1, j); }
  r0 -= PAD; r1 += PAD; c0 -= PAD; c1 += PAD;
  const H = r1 - r0 + 1, W = c1 - c0 + 1, N = H * W, CX = W / 2, CY = H / 2;
  const src = (i, j) => { const ii = i + r0, jj = j + c0; return ii >= 0 && ii < NR && jj >= 0 && jj < NC ? ii * NC + jj : -1; };

  // receive sensitivity at each crop pixel, lab-fixed (u right, v up = anterior, metres; coils just outside the head)
  const U = (j) => (j + c0 - (NC - 1) / 2) * PIX, V = (i) => ((NR - 1) / 2 - (i + r0)) * PIX;
  const inHead = (u, v) => { const i = Math.round((NR - 1) / 2 - v / PIX), j = Math.round(u / PIX + (NC - 1) / 2); return i >= 0 && i < NR && j >= 0 && j < NC && SEG[i * NC + j] > 0; };
  let hu = 0, hv = 0, nh = 0;
  for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) if (SEG[i * NC + j]) { hu += (j - (NC - 1) / 2) * PIX; hv += ((NR - 1) / 2 - i) * PIX; nh++; }
  hu /= nh; hv /= nh;
  const wires = COILS.map(([phi, gap, L]) => {
    const p = phi * DEG; let u = hu, v = hv;
    while (inHead(u, v) || Math.hypot(u - hu, v - hv) < 0.05) { u += Math.cos(p) * 5e-4; v += Math.sin(p) * 5e-4; }
    const d = gap / 1000 + 0.004; u += Math.cos(p) * d; v += Math.sin(p) * d;   // + the wire radius and a little air
    const tu = -Math.sin(p), tv = Math.cos(p), l = L / 100;
    return [[u + tu * l / 2, v + tv * l / 2, 1], [u - tu * l / 2, v - tv * l / 2, -1]];
  });
  function sens(u, v) {
    let s2 = 0;
    for (const w of wires) {
      let bx = 0, by = 0;
      for (const [px, py, sg] of w) { const dx = u - px, dy = v - py, f = sg / Math.max(dx * dx + dy * dy, 9e-6); bx -= dy * f; by += dx * f; }
      s2 += bx * bx + by * by;
    }
    return Math.sqrt(s2) / 2;
  }
  const REC = new Float64Array(N);
  for (let i = 0; i < H; i++) for (let j = 0; j < W; j++) REC[i * W + j] = sens(U(j), V(i));

  const OBJ60 = new Float64Array(N), OBJ120 = new Float64Array(N), TRUE = new Float64Array(N).fill(NaN), MASK = new Uint8Array(N);
  for (let i = 0; i < H; i++) for (let j = 0; j < W; j++) {
    const k = src(i, j); if (k < 0 || !brainAt(k)) continue;
    const pd = (WM[k] * PD.wm + GM[k] * PD.gm + CSF[k] * PD.csf) / 100, p = i * W + j;
    OBJ60[p] = pd * Math.sin(A * DEG * B1[k]); OBJ120[p] = pd * Math.sin(2 * A * DEG * B1[k]); TRUE[p] = B1[k]; MASK[p] = 1;
  }
  let rs = 0, rn = 0;
  for (let p = 0; p < N; p++) if (MASK[p]) { rs += REC[p]; rn++; }
  const RN = rs / rn, rec = (u, v) => sens(u, v) / RN;   // receive, ÷ its brain mean with the head in the first position
  const S60 = new Float64Array(N);
  for (let p = 0; p < N; p++) { REC[p] /= RN; S60[p] = REC[p] * OBJ60[p]; }
  // score inside the brain, one pixel in from its edge
  const SCORE = [];
  for (let i = 1; i < H - 1; i++) for (let j = 1; j < W - 1; j++) {
    const p = i * W + j;
    if (MASK[p] && MASK[p - 1] && MASK[p + 1] && MASK[p - W] && MASK[p + W]) SCORE.push(p);
  }

  // bilinear sample of an image at a continuous point (x right, y down, pixel centres at +0.5), 0 outside
  function sample(img, x, y) {
    const fx = x - 0.5, fy = y - 0.5, j = Math.floor(fx), i = Math.floor(fy), a = fx - j, b = fy - i;
    const at = (ii, jj) => (ii >= 0 && ii < H && jj >= 0 && jj < W ? img[ii * W + jj] : 0);
    return (1 - b) * ((1 - a) * at(i, j) + a * at(i, j + 1)) + b * ((1 - a) * at(i + 1, j) + a * at(i + 1, j + 1));
  }
  // the 120° scan: the head moved by P(x) = c + d + R(rot)(x − c), so I120(y) = OBJ120(P⁻¹(y))
  const S120 = new Float64Array(N);
  {
    const co = Math.cos(-MOTION.rot * DEG), si = Math.sin(-MOTION.rot * DEG);
    for (let i = 0; i < H; i++) for (let j = 0; j < W; j++) {
      const ux = j + 0.5 - CX - MOTION.du, uy = i + 0.5 - CY - MOTION.dv;
      S120[i * W + j] = REC[i * W + j] * sample(OBJ120, CX + co * ux - si * uy, CY + si * ux + co * uy);   // the head moved, the coils didn't
    }
  }
  // images in arbitrary units: the 98th percentile of the 60° brain = 1000
  const all = []; for (let p = 0; p < N; p++) if (MASK[p]) all.push(S60[p]);
  all.sort((a, b) => a - b);
  const UNIT = 1000 / all[Math.floor(0.98 * (all.length - 1))];
  for (let p = 0; p < N; p++) { S60[p] *= UNIT; S120[p] *= UNIT; }
  return { D, MOTION, DEG, A, PIX, NR, NC, H, W, N, CX, CY, r0, c0, U, V, SEG, wires, rec, MASK, TRUE, SCORE, sample, OBJ60, OBJ120, S60, S120, UNIT };
})();
