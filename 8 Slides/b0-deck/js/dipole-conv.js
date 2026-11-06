/* Lecture slide 5: ΔB0 as a convolution, voxel by voxel. ΔB0(r) / B0 = Σ_r' Δχ(r') d(r − r'), with the dipole kernel
 * d(r) = (3 cos²θ − 1) / (4π r³) (θ from B0 = z; r in voxels; the voxel's own term is 0, the Lorentz sphere), summed
 * over the voxels of the 3D volume within RAD voxels of r (the kernel cut off there: an approximation, so that what is
 * shown is exactly what is summed), for the voxels of one sagittal plane (z up, y across). Data: js/dipoleConvData.js. */
(function () {
  'use strict';
  const slide = document.querySelector('.dc'); if (!slide) return;
  const q = (s) => slide.querySelector(s);
  const BWR = [[0, [5, 48, 97]], [0.2, [33, 102, 172]], [0.4, [146, 197, 222]], [0.5, [255, 255, 255]], [0.6, [244, 165, 130]], [0.8, [178, 24, 43]], [1, [103, 0, 31]]];
  const bwr = (t) => { t = Math.max(0, Math.min(1, t)); for (let k = 1; k < BWR.length; k++) if (t <= BWR[k][0]) { const [t0, a] = BWR[k - 1], [t1, b] = BWR[k], u = (t - t0) / (t1 - t0); return a.map((v, i) => Math.round(v + u * (b[i] - v))); } return BWR[6][1]; };
  const MARK = [0, 229, 255];   // r, the voxel where ΔB0 is computed
  // Δχ: white at 0, as on the other maps, to purple (ColorBrewer Purples; not red or blue, which are the kernel's)
  const HOT = [[0, [255, 255, 255]], [0.25, [218, 218, 235]], [0.5, [188, 189, 220]], [0.75, [128, 125, 186]], [1, [84, 39, 143]]];
  const hot = (t) => { t = Math.max(0, Math.min(1, t)); for (let k = 1; k < HOT.length; k++) if (t <= HOT[k][0]) { const [t0, a] = HOT[k - 1], [t1, b] = HOT[k], u = (t - t0) / (t1 - t0); return a.map((v, i) => Math.round(v + u * (b[i] - v))); } return HOT[4][1]; };
  const kern = (dy, dz, dx = 0) => { const r2 = dx * dx + dy * dy + dz * dz; if (!r2) return 0; const r = Math.sqrt(r2); return (3 * dz * dz / r2 - 1) / (4 * Math.PI * r2 * r); };
  const pct = (v, p) => { const s = Float64Array.from(v).sort(); return s.length ? s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))] : 0; };
  let C = null, idx = 0, playing = false, last = 0, speed = 1;   // paused at first; speed: × the base sweep
  const RAD = { impulse: 10, sphere: 10, interface: 10, interface90: 10 };   // the kernel's radius, in voxels

  // the sphere with an interface: the sphere of 'sphere', with the part beyond a plane 2 voxels from its centre at 80 %
  // lower chi; the plane's normal at `angle` degrees from B0 (z), towards y: 'interface' 0° (the interface perpendicular to
  // B0), 'interface90' 90° (parallel to it)
  function interfaceVolume(angle) {
    const d = window.DipoleConv.sphere, { nx, ny, nz } = d, base = Uint8Array.from(atob(d.codes), (ch) => ch.charCodeAt(0));
    const cx = nx >> 1, cy = ny >> 1, cz = nz >> 1, a = (angle * Math.PI) / 180, ny_ = Math.sin(a), nz_ = Math.cos(a);
    const table = [0, 0.2, 1], one = d.table.indexOf(1), bytes = new Uint8Array(base.length);
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const p = (k * ny + j) * nx + i; if (base[p] !== one) continue;
      bytes[p] = (j - cy) * ny_ + (k - cz) * nz_ > 2 ? 1 : 2;
    }
    return { nx, ny, nz, plane: d.plane, table, bytes };
  }
  function load(name) {
    const d = name === 'interface' ? interfaceVolume(0) : name === 'interface90' ? interfaceVolume(90) : window.DipoleConv[name], { nx, ny, nz } = d;
    const bytes = d.bytes || Uint8Array.from(atob(d.codes), (ch) => ch.charCodeAt(0));
    const src = [];   // the non-zero voxels: x, y, z, Δχ
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const v = d.table[bytes[(k * ny + j) * nx + i]]; if (v) src.push(i, j, k, v); }
    const W = ny, H = nz, plane = d.plane, chiP = new Float32Array(W * H);
    // pixel (row r, column c): z = nz − 1 − r (up), y = ny − 1 − c (anterior on the left)
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) { const k = nz - 1 - r, j = ny - 1 - c; chiP[r * W + c] = d.table[bytes[(k * ny + j) * nx + plane]]; }
    C = { name, d, W, H, plane, src: Float32Array.from(src), chiP, field: new Float32Array(W * H), done: 0, lim: 1, off: 0 };
    idx = 0; computeAll();
  }
  // the whole plane, in chunks (so the page stays responsive); the sweep then shows each value as it is reached
  function computeAll() {
    const c = C, { W, H, plane, src } = c, n = src.length / 4, nz = c.d.nz, ny = c.d.ny, R2 = RAD[c.name] ** 2;
    const step = () => {
      if (C !== c) return;
      const end = Math.min(W * H, c.done + 300);
      for (let p = c.done; p < end; p++) {
        const r = Math.floor(p / W), col = p % W, k0 = nz - 1 - r, j0 = ny - 1 - col; let s = 0;
        for (let t = 0; t < n; t++) {
          const o = 4 * t, dy = j0 - src[o + 1], dz = k0 - src[o + 2], dx = plane - src[o];
          if (dx * dx + dy * dy + dz * dz <= R2) s += src[o + 3] * kern(dy, dz, dx);
        }
        c.field[p] = s;
      }
      c.done = end;
      q('.dc-status').textContent = c.done < W * H ? `computing ${Math.round((100 * c.done) / (W * H))} %` : '';
      if (c.done < W * H) setTimeout(step, 0);
      else {   // the colour range: ± the 99.5th percentile of |field| over the plane
        const a = []; for (let p = 0; p < W * H; p++) a.push(Math.abs(c.field[p]));
        c.lim = pct(a, 0.995) || 1;
        q('.dc-lim').textContent = `±${c.lim < 0.01 ? c.lim.toExponential(1) : c.lim.toFixed(2)} ppm`;
      }
    };
    step();
  }
  function paint(cv, W, H, colourOf) {
    cv.width = W; cv.height = H; const ctx = cv.getContext('2d'), img = ctx.createImageData(W, H);
    for (let p = 0; p < W * H; p++) { const [R, G, B] = colourOf(p); img.data[4 * p] = R; img.data[4 * p + 1] = G; img.data[4 * p + 2] = B; img.data[4 * p + 3] = 255; }
    ctx.putImageData(img, 0, 0);
  }
  function draw() {
    const c = C; if (!c) return;
    const { W, H, chiP } = c, r0 = Math.floor(idx / W), c0 = idx % W, R = RAD[c.name];
    const cmax = Math.max(...c.d.table);
    paint(q('.dc-chi0'), W, H, (p) => hot(chiP[p] / (cmax || 1)));   // the static Δχ (left)
    // one colour scale for the kernel and for Δχ × d (the kernel's strength halfway out); the products are also scaled
    // by the largest |Δχ|, so the middle panel is the kernel, masked and weighted by Δχ
    const kScale = Math.abs(kern(0, R / 2)), chiMax = Math.max(...c.d.table.map(Math.abs)) || 1;
    const inR = (dy, dz) => dy * dy + dz * dz <= R * R;
    // χ, with the kernel (within R voxels) laid over it, centred on the current voxel
    paint(q('.dc-chi'), W, H, (p) => {
      const r = Math.floor(p / W), col = p % W, base = hot(chiP[p] / (cmax || 1));
      const dy = col - c0, dz = r0 - r;
      if (!dy && !dz) return MARK;
      if (!inR(dy, dz)) return base;
      const k = kern(dy, dz), t = Math.tanh(Math.abs(k) / kScale), col2 = bwr(0.5 + 0.5 * Math.sign(k) * Math.max(t, 0.25)), a = 0.65;
      return base.map((v, i) => Math.round(v * (1 - a) + col2[i] * a));
    });
    // Δχ × d over this plane, within R: each voxel's contribution to the field at the current voxel
    paint(q('.dc-prod'), W, H, (p) => {
      if (p === idx) return MARK;
      const r = Math.floor(p / W), col = p % W, dy = col - c0, dz = r0 - r;
      if (!inR(dy, dz)) return [233, 237, 241];
      return bwr(0.5 + 0.5 * Math.tanh((chiP[p] * kern(dy, dz)) / (chiMax * kScale)));
    });
    // the field: the voxels reached so far
    paint(q('.dc-field'), W, H, (p) => (p === idx ? MARK : p < idx && p < c.done ? bwr(0.5 + (c.field[p] - c.off) / (2 * c.lim)) : [233, 237, 241]));
    q('.dc-pos').max = String(W * H - 1); q('.dc-pos').value = String(idx);
  }
  const isCurrent = () => typeof Reveal === 'undefined' || !Reveal.getCurrentSlide || Reveal.getCurrentSlide() === slide;
  function tick(t) {
    if (playing && C && isCurrent()) {   // only while the slide is shown
      const perSec = ((C.W * C.H) / 16) * speed;   // a full sweep in about 16 s at 1×
      if (last) idx = Math.min(C.W * C.H - 1, idx + Math.max(1, Math.round(((t - last) / 1000) * perSec)));
      if (idx >= C.W * C.H - 1) { playing = false; q('.dc-play').textContent = '▶ Play'; }
      draw();
    }
    last = t; requestAnimationFrame(tick);
  }
  slide.querySelectorAll('[data-case]').forEach((b) => b.addEventListener('click', () => {
    b.blur(); slide.querySelectorAll('[data-case]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    load(b.dataset.case); playing = false; q('.dc-play').textContent = '▶ Play'; draw();
  }));
  q('.dc-play').addEventListener('click', (e) => {
    e.currentTarget.blur();
    if (!playing && idx >= C.W * C.H - 1) idx = 0;
    playing = !playing; e.currentTarget.textContent = playing ? '❚❚ Pause' : '▶ Play';
  });
  q('.dc-speed').addEventListener('input', (e) => {   // 0.25× to 4×, on a log scale
    speed = 2 ** Number(e.target.value); q('.dc-speed-v').textContent = `${speed < 1 ? speed.toFixed(2).replace(/0$/, '') : speed.toFixed(speed % 1 ? 1 : 0)}×`;
  });
  q('.dc-speed').addEventListener('keydown', (e) => e.stopPropagation());
  q('.dc-pos').addEventListener('input', (e) => { playing = false; q('.dc-play').textContent = '▶ Play'; idx = Number(e.target.value); draw(); });
  q('.dc-pos').addEventListener('keydown', (e) => e.stopPropagation());
  q('.dc-chi').addEventListener('pointerdown', (e) => {   // click on χ: the kernel there
    const cv = e.currentTarget, rc = cv.getBoundingClientRect();
    const col = Math.floor(((e.clientX - rc.left) / rc.width) * C.W), r = Math.floor(((e.clientY - rc.top) / rc.height) * C.H);
    playing = false; q('.dc-play').textContent = '▶ Play'; idx = Math.max(0, Math.min(C.W * C.H - 1, r * C.W + col)); draw();
  });
  load(new URLSearchParams(location.search).get('case') || 'impulse');
  slide.querySelectorAll('[data-case]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.case === C.name)));
  // the kernel on its own (left): the full dipole, which has no edge, over ±2R voxels, with the mask of the r′ that are
  // summed (|r − r′| ≤ R) outlined
  (function () {
    const R = 10, H2 = 2 * R, n = 2 * H2 + 1, kScale = Math.abs(kern(0, 1.5 * R));   // a softer scale, so its reach beyond the mask shows
    paint(q('.dc-kern'), n, n, (p) => {
      const dy = (p % n) - H2, dz = H2 - Math.floor(p / n), rr = Math.sqrt(dy * dy + dz * dz);
      if (!dy && !dz) return MARK;
      if (Math.abs(rr - R) < 0.5) return [20, 24, 30];   // the mask's edge
      const k = kern(dy, dz), t = Math.tanh(Math.abs(k) / kScale);
      return bwr(0.5 + 0.5 * Math.sign(k) * t);
    });
  })();
  draw();
  requestAnimationFrame(tick);
})();
