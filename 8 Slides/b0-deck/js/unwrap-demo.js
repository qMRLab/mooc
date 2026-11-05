/* Exercise 5-2, the unwrapping viewers (section.uw-view): input (magnitude, wrapped phase) → mask → phase intervals
 * → unwrapped phase, with the knobs that matter: the mask (none, or a magnitude threshold), the number of phase
 * intervals, and for the simulation TE and SNR.
 *
 * data-uw="sim": a Shepp–Logan phantom (magnitude) with a made-up smooth field (a gradient plus a bump near the top);
 *   signal ρ·e^{iθ}, θ = 2π ΔB0 TE, plus complex Gaussian noise of SD 1/SNR everywhere (fixed seed), so the background
 *   has noise magnitude and random phase, as in a real image. Voxels unwrapped wrongly in the phantom are drawn black;
 *   "misclassified" is the paper's MCR (wrong / phantom voxels in the mask, after removing the one global 2π offset),
 *   against θ plus each voxel's own phase noise.
 * data-uw="real": NIfTI or MINC phase (+ magnitude). Starts with data-default (comma-separated URLs); other files can be
 *   dropped on the slide, opened, or given as ?load=a.nii.gz,b.nii.gz in the URL. Pick the slice and echo. Phase
 *   outside [−π, π] (e.g. scanner integers) is rescaled linearly from its range to [−π, π).
 * data-grad (on a real viewer): a made-up linear field gradient along x (Hz/cm, slider) is added to every echo,
 *   φ += 2π G x TE, with TE = data-te1 (ms) + echo index × ΔTE, then re-wrapped: like a poor shim.
 * .uw-f0 (a slider, on a real viewer): a B0 offset (Hz) added to the whole field, φ += 2π f0 TE in every echo (TE as for
 *   data-grad), and to the expected field when there is one: like a centre frequency set off resonance.
 * data-truth (on a real viewer): the field (Hz) the default example was simulated from, a NIfTI on the same grid;
 *   shown as the expected B0, with the unwrapped map's error (not with the student's own files).
 * data-bs (on a real viewer): Bloch–Siegert B1 mapping. The two frames are the acquisitions with the off-resonance pulse
 *   at +ω and −ω; their phase difference is 2 K_BS B1², so B1 (relative to nominal) = c √|Δφ|, with the constants of
 *   the original analysis (fitDataBSB1.m, Boudreau et al.): c = γ (AmpInt/512) T (180/π) / (θ_nom √(2 K_BS)), from
 *   data-kbs (rad/G²), data-ampint, data-dur (ms), data-flip (°); γ = 26745 rad/s/G. B1 maps replace the B0 maps.
 * Mask: none (every voxel is unwrapped), or the magnitude above I2 + f (I98 − I2) on the slice (the paper's rule,
 * f = 0.1 by default; adjustable).
 * Unwrapping: our clean-room implementation of Jenkinson 2003 (MRM 49:193–197) in WebAssembly (vendor/unwrap/,
 * see SOURCE.md there). NIfTI reading: js/nifti-lite.js; MINC: vendor/volread/ (the qMRLab viewer's reader). */
(function () {
  'use strict';
  const views = [...document.querySelectorAll('section.uw-view')]; if (!views.length) return;
  const BWR = [[0, [5, 48, 97]], [0.2, [33, 102, 172]], [0.4, [146, 197, 222]], [0.5, [255, 255, 255]], [0.6, [244, 165, 130]], [0.8, [178, 24, 43]], [1, [103, 0, 31]]];
  const BG = [233, 237, 241];
  // wrapped phase: a softer, pastel blue-white-red, −π to π (the unwrapped phase and B0 maps use the deeper BWR)
  const PASTEL = [[0, [86, 124, 189]], [0.25, [160, 188, 226]], [0.5, [255, 255, 255]], [0.75, [238, 172, 160]], [1, [196, 92, 84]]];
  const BOX = [250, 250];   // the largest size of each panel on the slide (px), keeping the image's aspect
  const PANELS = ['.uw-c-mag', '.uw-c-mask', '.uw-c-wrap', '.uw-c-int', '.uw-c-reg', '.uw-c-unw'];

  // ------------------------------------------------------------------ shared: the WebAssembly module, the B0 map
  let modP = null, exP = null, volP = null;
  // MINC (and anything js/nifti-lite.js can't read): the qMRLab viewer's parser in WebAssembly, loaded on first use
  const loadVolread = () => (volP = volP || import(new URL('vendor/volread/volread.js', document.baseURI).href).then(async (x) => { await x.default(); return x; }));
  async function readVolume(name, bytes) {
    if (!/\.mnc(\.gz)?$/i.test(name)) return NiftiLite.read(bytes);
    const vr = await loadVolread();
    let v;
    try { v = vr.readVolume(bytes); } catch (e) { throw new Error(String(e && e.message ? e.message : e)); }
    const out = { dims: Array.from(v.dims), pixdim: Array.from(v.pixdim), data: Float32Array.from(v.data) };
    v.free();
    return out;
  }
  const loadModule = () => (modP = modP || import(new URL('vendor/unwrap/regionmerge_unwrap.js', document.baseURI).href).then(async (x) => { await x.default(); return x; }));
  // the simulation: a Shepp–Logan phantom (Toft's modified version; brain 0.6, ventricles 0.4, skull 1) and a made-up
  // smooth field: a gradient of ±20 Hz across the head plus a 150 Hz bump near the top (like the sinuses).
  // Row 0 is the top of the head; x right, y up, both in [−1, 1].
  function loadExample() {
    exP = exP || Promise.resolve().then(() => {
      const N = 128, nx = N, ny = N, n = nx * ny;
      const E = [   // [intensity, a, b, x0, y0, angle°]
        [1, 0.69, 0.92, 0, 0, 0], [-0.4, 0.6624, 0.874, 0, -0.0184, 0],
        [-0.2, 0.11, 0.31, 0.22, 0, -18], [-0.2, 0.16, 0.41, -0.22, 0, 18],
        [0.1, 0.21, 0.25, 0, 0.35, 0], [0.1, 0.046, 0.046, 0, 0.1, 0], [0.1, 0.046, 0.046, 0, -0.1, 0],
        [0.1, 0.046, 0.023, -0.08, -0.605, 0], [0.1, 0.023, 0.023, 0, -0.606, 0], [0.1, 0.023, 0.046, 0.06, -0.605, 0],
      ];
      const rho = new Float64Array(n), map = new Float64Array(n), brain = new Uint8Array(n);
      for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++) {
        const x = (c - (nx - 1) / 2) / (nx / 2), y = ((ny - 1) / 2 - r) / (ny / 2), i = r * nx + c;
        let v = 0;
        for (const [A, a, b, x0, y0, deg] of E) {
          const t = (deg * Math.PI) / 180, dx = x - x0, dy = y - y0;
          const u = dx * Math.cos(t) + dy * Math.sin(t), w = -dx * Math.sin(t) + dy * Math.cos(t);
          if ((u * u) / (a * a) + (w * w) / (b * b) <= 1) v += A;
        }
        rho[i] = Math.max(0, v);
        if (rho[i] > 0) brain[i] = 1;
        map[i] = 20 * (0.6 * x + 0.8 * y) + 150 * Math.exp(-(x * x + (y - 0.78) ** 2) / (2 * 0.14 * 0.14));
      }
      // two fixed fields of standard normal noise (mulberry32 + Box–Muller): the real and imaginary parts
      let s0 = 20031;
      const rnd = () => { s0 = (s0 + 0x6d2b79f5) | 0; let t = Math.imul(s0 ^ (s0 >>> 15), 1 | s0); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
      const g1 = new Float64Array(n), g2 = new Float64Array(n);
      for (let i = 0; i < n; i++) { g1[i] = gauss(); g2[i] = gauss(); }
      return { rho, map, brain, g1, g2, nx, ny };
    });
    return exP;
  }

  // ------------------------------------------------------------------ drawing helpers
  const wrap = (p) => p - 2 * Math.PI * Math.floor((p + Math.PI) / (2 * Math.PI));
  const ramp = (stops) => (t) => {
    t = Math.min(1, Math.max(0, t));
    let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [t0, c0] = stops[k], [t1, c1] = stops[k + 1], f = (t - t0) / (t1 - t0);
    return c0.map((v, j) => Math.round(v + f * (c1[j] - v)));
  };
  const bwr = ramp(BWR), pastel = ramp(PASTEL);
  // the colour of phase interval k of n: evenly around a colour wheel, since phase is cyclic (the last interval,
  // just below +π, is next to the first, just above −π)
  function intervalColour(k, n) {
    const h = k / n, l = 0.56, sat = 0.62;
    const f = (m) => { const kk = (m + h * 12) % 12; return Math.round(255 * (l - sat * Math.min(l, 1 - l) * Math.max(-1, Math.min(kk - 3, 9 - kk, 1)))); };
    return [f(0), f(8), f(4)];
  }
  function regionColour(id) {   // a distinct colour per region: hues spread by the golden ratio, two lightness levels
    const h = (id * 0.618033988749895) % 1, l = id % 2 ? 0.62 : 0.48, sat = 0.6;
    const f = (m) => { const k = (m + h * 12) % 12; return Math.round(255 * (l - sat * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
    return [f(0), f(8), f(4)];
  }
  // an interval edge, −π + k·2π/n, as a fraction of π: "−2π/3", "0", "π"
  function piFrac(k, n) {
    let num = 2 * k - n, den = n;   // (2k − n)/n · π
    const g = (x, y) => (y ? g(y, x % y) : x), d = g(Math.abs(num), den);
    num /= d; den /= d;
    if (num === 0) return '0';
    const sign = num < 0 ? '−' : '', m = Math.abs(num);
    return `${sign}${m === 1 ? '' : m}π${den === 1 ? '' : `/${den}`}`;
  }
  const percentile = (vals, p) => { const s = Float32Array.from(vals).sort(); return s.length ? s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))] : 0; };
  const isMag = (name) => /mag|magnitude/i.test(name) && !/phase/i.test(name);
  const isPhase = (name) => /phase|_ph(?![a-z])|ph\.(nii|mnc)/i.test(name);
  const VOLUME = /\.(nii|mnc)(\.gz)?$/i;

  views.forEach(initViewer);

  function initViewer(slide) {
    const q = (c) => slide.querySelector(c);
    const sim = slide.dataset.uw === 'sim', grad = 'grad' in slide.dataset, truthUrl = slide.dataset.truth || '', te1 = Number(slide.dataset.te1 || 4), bs = 'bs' in slide.dataset;
    // Bloch–Siegert: B1 (relative to nominal) = c √|Δφ|
    const b1c = bs ? (26745 * (Number(slide.dataset.ampint) / 512) * (Number(slide.dataset.dur) / 1000) * (180 / Math.PI)) / Number(slide.dataset.flip) / Math.sqrt(2 * Number(slide.dataset.kbs)) : 0;
    // unwrap: 'echo' (each echo, then subtract), 'diff' (the phase difference Δφ itself) or 'none' (Δφ as it is); ?unwrap= in the URL, or data-unwrap
    const st = { mask: 'thr', view: 'mag', fixed: {}, unwrap: ({ diff: 'diff', none: 'none' })[new URLSearchParams(location.search).get('unwrap') || slide.dataset.unwrap] || 'echo' };   // fixed[key]: a colour range held by its lock button (null = automatic)
    const range = (key, auto) => (st.fixed[key] != null ? st.fixed[key] : auto);
    let mod = null, ex = null, file = null, busy = false, again = false, ready = null;
    let truthVol = null;
    let maskVol = null;   // a mask file loaded by the student (Mask: Load), nx×ny×nz, non-zero = inside   // data-truth: the known field (Hz) of the default example, nx×ny×nz
    const box = sim ? [215, 215] : grad || truthUrl ? [122, 145] : [146, 166];   // panel size: 6 panels in 3 columns (simulation) or 8 in 4 (real data)
    const pipe = slide.classList.contains('uw-pipe');   // the input | steps (tabs) | output layout
    const panels = [...PANELS, '.uw-c-ph1', '.uw-c-ph2', '.uw-c-b0u2', '.uw-c-b0p', '.uw-c-b0u', '.uw-c-b0x', '.uw-c-b0e', '.uw-c-b0d'].filter((c) => q(c));

    function setup() {
      ready = ready || (async () => {
        mod = await loadModule();
        if (sim) ex = await loadExample();
        else {
          const toLoad = new URLSearchParams(location.search).get('load') || slide.dataset.default || '';
          if (toLoad) await loadUrls(toLoad);
          if (truthUrl) {
            const r = await fetch(truthUrl);
            if (r.ok) truthVol = await readVolume(truthUrl.split('/').pop(), new Uint8Array(await r.arrayBuffer()));
          }
          const dteU = Number(new URLSearchParams(location.search).get('dte'));   // ?dte=<ms>: the echo spacing of a loaded file
          if (dteU > 0 && q('.uw-dte')) q('.uw-dte').value = String(dteU);
          const thrU = new URLSearchParams(location.search).get('thr');   // ?thr=<0..1>: the mask threshold
          if (thrU != null && q('.uw-thr')) q('.uw-thr').value = thrU;
          const nU = new URLSearchParams(location.search).get('n');   // ?n=<1..12>: the number of intervals
          if (nU != null && q('.uw-n')) q('.uw-n').value = nU;
          const f0U = new URLSearchParams(location.search).get('f0');   // ?f0=<Hz>: the added B0 offset
          if (f0U != null && q('.uw-f0')) q('.uw-f0').value = f0U;
        }
        run();
      })();
      return ready;
    }
    async function loadUrls(list) {
      const files = await Promise.all(list.split(',').filter(Boolean).map(async (u) => {
        const r = await fetch(u); if (!r.ok) throw new Error(`${u}: ${r.status}`);
        return new File([await r.blob()], decodeURIComponent(u.split('/').pop()));
      }));
      await openFiles(files, true);
      const z0 = Number(new URLSearchParams(location.search).get('z') || slide.dataset.z);   // ?z= or data-z: the first slice (0-based)
      if (z0 > 0 && file && z0 < file.nz) { q('.uw-z').value = String(z0); run(); }
      const eU = Number(new URLSearchParams(location.search).get('echo'));   // ?echo=<1-based>: the echo shown
      if (eU > 1 && file && eU <= file.nt) { q('.uw-t').value = String(eU - 1); run(); }
    }

    function sizeCanvases(nx, ny, dx = 1, dy = 1) {   // fit the image in the panel box (or its own data-box="w,h"), keeping its physical aspect
      panels.forEach((c) => {
        const cv = q(c), b = cv.dataset.box ? cv.dataset.box.split(',').map(Number) : box;
        const s = Math.min(b[0] / (nx * dx), b[1] / (ny * dy));
        if (cv.width !== nx || cv.height !== ny) { cv.width = nx; cv.height = ny; }
        cv.style.width = `${Math.round(nx * dx * s)}px`; cv.style.height = `${Math.round(ny * dy * s)}px`;
      });
    }
    function paint(sel, nx, ny, colourOf) {   // row 0 at the top (brains the right way up for both data sets)
      const cv = q(sel); if (!cv) return;   // a layout without this panel
      const ctx = cv.getContext('2d'), img = ctx.createImageData(nx, ny);
      for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++) {
        const [R, G, B] = colourOf(r * nx + c), o = (r * nx + c) * 4;
        img.data[o] = R; img.data[o + 1] = G; img.data[o + 2] = B; img.data[o + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }

    // a colour bar under a panel: the colour ramp, with its two ends and middle labelled
    // lim: the range shown; lockable: a button that holds it while other settings change
    // lockKey: the range the lock holds (both B0 maps share one, 'b0')
    function setCbar(key, stops, lo, mid, hi, lim, lockable, lockKey = key) {
      const el = q(`.uw-cbar[data-for="${key}"]`); if (!el) return;
      const grad = stops.map(([t, c]) => `rgb(${c.join(',')}) ${Math.round(t * 100)}%`).join(', ');
      const on = st.fixed[lockKey] != null;
      el.dataset.lim = String(lim);
      el.classList.toggle('uw-lockable', !!lockable);
      el.innerHTML = `<i style="background:linear-gradient(to right, ${grad})"></i><span>${lo}</span><span>${mid}</span><span>${hi}</span>`
        + (lockable ? `<button class="uw-lock" data-key="${lockKey}" data-bar="${key}" aria-pressed="${on}" title="${on ? 'Range fixed: click to let it follow the data again' : 'Fix this range, so it stays while other settings change'}">${on ? '🔒' : '🔓'}</button>` : '');
    }
    slide.addEventListener('click', (e) => {
      const b = e.target.closest('.uw-lock'); if (!b) return;
      b.blur();
      const key = b.dataset.key, el = q(`.uw-cbar[data-for="${b.dataset.bar}"]`);
      st.fixed[key] = st.fixed[key] != null ? null : Number(el.dataset.lim);
      run();
    });
    const piLabel = (x) => { const m = x / Math.PI; return `${m > 0.95 && m < 1.05 ? '' : +m.toFixed(m < 1 ? 2 : 1)}π`; };   // a dragged range can go below π
    // the list of intervals under their panel: colour, then [lower, upper)
    function showIntervals(n, cols) {
      const box = q('.uw-int-list'); if (!box || box.dataset.n === String(n)) return;
      box.dataset.n = String(n);
      box.innerHTML = cols.map((c, k) => `<span><i style="background:rgb(${c.join(',')})"></i>[${piFrac(k, n)}, ${piFrac(k + 1, n)})</span>`).join('');
    }
    function run() {
      if (!mod || (sim ? !ex : !file)) return;
      if (busy) { again = true; return; }
      busy = true;
      try { show(sim ? simSlice() : fileSlice()); } finally {
        busy = false;
        if (again) { again = false; requestAnimationFrame(run); }
      }
    }
    // the simulation: magnitude and phase of 1·e^{iθ} (brain) or 0 (outside), plus complex noise of SD 1/SNR
    function simSlice() {
      const { rho, map, brain, g1, g2, nx, ny } = ex;
      const te = Number(q('.uw-te').value) / 1000, snr = Number(q('.uw-snr').value), sd = 1 / snr;
      q('.uw-te-v').textContent = `${(te * 1000).toFixed(1)} ms`;
      q('.uw-snr-v').textContent = String(snr);
      const n = nx * ny, phase = new Float32Array(n), mag = new Float32Array(n), truth = new Float64Array(n).fill(NaN);
      for (let i = 0; i < n; i++) {
        const th = 2 * Math.PI * map[i] * te, s = rho[i];
        const re = s * Math.cos(th) + sd * g1[i], im = s * Math.sin(th) + sd * g2[i];
        mag[i] = Math.hypot(re, im); phase[i] = Math.atan2(im, re);
        if (brain[i]) truth[i] = th + wrap(phase[i] - th);   // θ plus this voxel's own phase noise
      }
      return { nx, ny, dx: 1, dy: 1, phase, mag, truth };
    }
    // the phase of echo t, slice z, with the added gradient (if any), wrapped to [−π, π)
    function slicePhase(t, z) {
      const f = file, nx = f.nx, ny = f.ny, n = nx * ny, base = (t * f.nz + z) * n, p = f.phase.subarray(base, base + n);
      const f0 = q('.uw-f0') ? Number(q('.uw-f0').value) : 0;
      if (!grad && !f0) return p;
      const g = grad ? Number(q('.uw-g').value) : 0, te = (te1 + t * Number(q('.uw-dte').value)) / 1000, out = new Float32Array(n);
      for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++) {
        const i = r * nx + c, xcm = ((c - (nx - 1) / 2) * f.dx) / 10;
        out[i] = isFinite(p[i]) ? wrap(p[i] + 2 * Math.PI * (g * xcm + f0) * te) : NaN;
      }
      return out;
    }
    function fileSlice() {
      const f = file, nx = f.nx, ny = f.ny, z = Number(q('.uw-z').value), t = Number(q('.uw-t').value);
      q('.uw-z-v').textContent = `${z + 1} / ${f.nz}`;
      q('.uw-t-v').textContent = bs && f.nt === 2 ? (t === 0 ? '+ω' : '−ω') : `${t + 1} / ${f.nt}`;
      if (grad) q('.uw-g-v').textContent = `${q('.uw-g').value} Hz/cm`;
      if (q('.uw-f0')) { const v = Number(q('.uw-f0').value); q('.uw-f0-v').textContent = `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)} Hz`; }
      let mag = null;
      if (f.mag) { const mt = Math.min(t, f.magNt - 1), mb = (mt * f.nz + z) * nx * ny; mag = f.mag.subarray(mb, mb + nx * ny); }
      const mag0 = f.mag ? f.mag.subarray(z * nx * ny, (z + 1) * nx * ny) : null;   // the first echo's: the mask is made from it, for both echoes
      // unwrapping the phase difference: the image shown and unwrapped is Δφ = echo 2 − echo 1 (complex difference)
      if (st.unwrap === 'diff' && f.nt === 2) {
        const a = slicePhase(0, z), b = slicePhase(1, z), dp = new Float32Array(a.length);
        for (let i = 0; i < a.length; i++) dp[i] = isFinite(a[i]) && isFinite(b[i]) ? wrap(b[i] - a[i]) : NaN;
        return { nx, ny, dx: f.dx, dy: f.dy, phase: dp, mag, mag0, truth: null, note: f.note };
      }
      return { nx, ny, dx: f.dx, dy: f.dy, phase: slicePhase(t, z), mag, mag0, truth: null, note: f.note };
    }
    // unwrap one 2D image. With 1 interval nothing is cut: each connected patch of the mask is one region, so no
    // voxel is ever shifted by 2π and the output is the input (the library needs at least 2 intervals, so this case is here)
    function unwrapSlice(p, nx, ny, mask, nInt) {
      const ph = p instanceof Float32Array ? p : new Float32Array(p);
      if (nInt >= 2) {
        const r = mod.unwrap2d(ph, nx, ny, mask, nInt);
        const o = { unwrapped: r.unwrapped, labels: r.labels, nRegions: r.nRegions, mask: r.mask }; r.free(); return o;
      }
      const n = nx * ny, used = new Uint8Array(n), labels = new Int32Array(n).fill(-1), stack = [];
      for (let i = 0; i < n; i++) used[i] = (!mask || mask[i]) && isFinite(ph[i]) ? 1 : 0;
      let nRegions = 0;
      for (let s0 = 0; s0 < n; s0++) {
        if (!used[s0] || labels[s0] >= 0) continue;
        labels[s0] = nRegions; stack.push(s0);
        while (stack.length) {
          const i = stack.pop(), r = Math.floor(i / nx), c = i - r * nx;
          for (const j of [c > 0 ? i - 1 : -1, c < nx - 1 ? i + 1 : -1, r > 0 ? i - nx : -1, r < ny - 1 ? i + nx : -1]) {
            if (j >= 0 && used[j] && labels[j] < 0) { labels[j] = nRegions; stack.push(j); }
          }
        }
        nRegions++;
      }
      const unwrapped = new Float32Array(n); for (let i = 0; i < n; i++) unwrapped[i] = used[i] ? ph[i] : 0;
      return { unwrapped, labels, nRegions, mask: used };
    }
    function show(sl) {
      // the magnitude shown (the input: echo 1) and the one the mask is made from (always echo 1, the same mask for both echoes)
      const { nx, ny, phase, truth } = sl, n = nx * ny, nInt = Number(q('.uw-n').value), f = Number(q('.uw-thr').value);
      const mag = pipe && sl.mag0 ? sl.mag0 : sl.mag, mmag = sl.mag0 || sl.mag;
      q('.uw-n-v').textContent = String(nInt);
      q('.uw-thr-v').textContent = f.toFixed(2);
      // the mask: none, or the magnitude above I2 + f (I98 − I2) on this slice
      let mask = null;
      slide.classList.toggle('uw-no-mag', !mag);
      if (st.mask === 'thr' && mmag) {
        const fin = []; for (let i = 0; i < n; i++) if (isFinite(mmag[i])) fin.push(mmag[i]);
        const i2 = percentile(fin, 0.02), i98 = percentile(fin, 0.98), thr = i2 + f * (i98 - i2);
        mask = new Uint8Array(n); for (let i = 0; i < n; i++) mask[i] = mmag[i] >= thr ? 1 : 0;
      } else if (st.mask === 'file' && maskVol) {
        const z = Number(q('.uw-z').value), mv = maskVol.data.subarray(z * n, (z + 1) * n);
        mask = new Uint8Array(n); for (let i = 0; i < n; i++) mask[i] = mv[i] > 0 ? 1 : 0;
      }
      let res;
      const t0 = performance.now();
      try { res = unwrapSlice(phase, nx, ny, mask, nInt); } catch (e) { q('.uw-stats').textContent = String(e.message || e); return; }
      const ms = performance.now() - t0, u = res.unwrapped, labels = res.labels, nReg = res.nRegions, used = res.mask;
      let nUsed = 0; for (let i = 0; i < n; i++) nUsed += used[i];
      // the simulation: wrong voxels in the phantom, after removing the one global 2π offset (the most common one)
      let wrongAt = null, k0 = 0, stat = '';
      if (truth) {
        const count = new Map(), off = new Int32Array(n);
        for (let i = 0; i < n; i++) if (used[i] && isFinite(truth[i])) { off[i] = Math.round((u[i] - truth[i]) / (2 * Math.PI)); count.set(off[i], (count.get(off[i]) || 0) + 1); }
        let best = -1; count.forEach((v, k) => { if (v > best) { best = v; k0 = k; } });
        let nb = 0, wrong = 0;
        wrongAt = new Uint8Array(n);
        for (let i = 0; i < n; i++) if (used[i] && isFinite(truth[i])) { nb++; if (off[i] !== k0) { wrong++; wrongAt[i] = 1; } }
        stat = ` · misclassified in the phantom <b>${nb ? ((100 * wrong) / nb).toFixed(2) : '0.00'} %</b>`;
      }
      const shifted = u.map((v) => v - 2 * Math.PI * k0);
      const absU = []; for (let i = 0; i < n; i++) if (used[i]) absU.push(Math.abs(shifted[i]));
      let limU = percentile(absU, 0.98);
      if (!sim && file && file.nt === 2 && st.unwrap !== 'diff') {   // one range for both echoes, so it holds when the echo changes
        const z = Number(q('.uw-z').value), t = Number(q('.uw-t').value);
        try {
          const o = unwrapSlice(slicePhase(1 - t, z), nx, ny, mask, nInt), absO = [];
          for (let i = 0; i < n; i++) if (o.mask[i]) absO.push(Math.abs(o.unwrapped[i]));
          limU = Math.max(limU, percentile(absO, 0.98));
        } catch (e) { /* keep this echo's range */ }
      }
      const lim = range('unw', Math.max(limU, Math.PI));
      const magMax = mag ? Math.max(percentile(Array.from(mag).filter(isFinite), 0.99), 1e-12) : 1;
      sizeCanvases(nx, ny, sl.dx, sl.dy);
      // input: magnitude, with the voxels left out of the mask dimmed
      paint('.uw-c-mag', nx, ny, (i) => {
        if (!mag) return BG;
        const g = Math.round(Math.min(1, mag[i] / magMax) * 255);
        return used[i] || pipe ? [g, g, g] : [Math.round(0.35 * g + 133), Math.round(0.35 * g + 139), Math.round(0.35 * g + 147)];   // the input: as acquired
      });
      paint('.uw-c-wrap', nx, ny, (i) => (isFinite(phase[i]) ? pastel((wrap(phase[i]) + Math.PI) / (2 * Math.PI)) : BG));
      if (q('.uw-c-ph1') && file && file.nt >= 2) {   // the input: both echoes' phase, as acquired
        const z = Number(q('.uw-z').value);
        [0, 1].forEach((t) => { const p = slicePhase(t, z); paint(`.uw-c-ph${t + 1}`, nx, ny, (i) => (isFinite(p[i]) ? pastel((wrap(p[i]) + Math.PI) / (2 * Math.PI)) : BG)); });
      }
      // the phase intervals (before connected components): the interval of each voxel in the mask, n colours
      const iw = (2 * Math.PI) / nInt, cols = Array.from({ length: nInt }, (_, k) => intervalColour(k, nInt));
      paint('.uw-c-int', nx, ny, (i) => (used[i] ? cols[Math.min(nInt - 1, Math.floor((wrap(phase[i]) + Math.PI) / iw))] : BG));
      showIntervals(nInt, cols);
      // the mask actually used (white = unwrapped), and the regions: connected patches of one interval
      paint('.uw-c-mask', nx, ny, (i) => (used[i] ? [255, 255, 255] : [20, 24, 30]));
      paint('.uw-c-reg', nx, ny, (i) => (used[i] ? regionColour(labels[i]) : BG));
      paint('.uw-c-unw', nx, ny, (i) => (!used[i] ? BG : wrongAt && wrongAt[i] ? [0, 0, 0] : bwr(0.5 + shifted[i] / (2 * lim))));
      setCbar('wrap', PASTEL, '−π', '0', 'π', Math.PI, false);
      setCbar('unw', BWR, `−${piLabel(lim)}`, '0', piLabel(lim), lim, true);
      if (pipe) q('.uw-stats').innerHTML = `<b>${nReg}</b> regions`;
      else q('.uw-stats').innerHTML = `<b>${nReg}</b> regions · ${nUsed} of ${n} voxels unwrapped${stat} · ${ms.toFixed(0)} ms${sl.note ? `<br>${sl.note}` : ''}`;
      if (!sim) showMaps(mask, nInt);
    }
    // real data with two echoes: the B0 map from the two wrapped phases (their complex difference, Δφ in (−π, π]) and
    // from the two phases unwrapped with the current settings (same mask and intervals for both echoes). Each unwrapped
    // echo carries its own global 2π offset, so the multiple of 2π that brings the median difference closest to 0 is
    // removed. B0 = Δφ / (2π ΔTE), in Hz; both maps on the same colour scale, ± the 98th percentile of the first.
    // Bloch–Siegert: B1 from the raw phase difference and from the unwrapped one, and their difference, all relative to
    // nominal (1 = the intended flip angle); one range, centred on 1, held by one lock
    function showB1(f, z, n, nx, ny, p1, p2, u1, u2, k, inside) {
      const b1P = new Float32Array(n), b1U = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        if (!inside(i)) continue;
        b1P[i] = b1c * Math.sqrt(Math.abs(wrap(p2[i] - p1[i]))); b1U[i] = b1c * Math.sqrt(Math.abs(u2[i] - u1[i] - 2 * Math.PI * k));
      }
      let ref = (i) => inside(i);
      if (f.mag) {
        const mg = f.mag.subarray(z * n, (z + 1) * n), fin = Array.from(mg).filter(isFinite);
        const i2 = percentile(fin, 0.02), thr = i2 + 0.1 * (percentile(fin, 0.98) - i2);
        ref = (i) => inside(i) && mg[i] >= thr;
      }
      const dev = []; for (let i = 0; i < n; i++) if (ref(i)) dev.push(Math.abs(b1P[i] - 1));
      const lim = range('b1', Math.max(0.1, Math.round(percentile(dev, 0.98) * 100) / 100));
      const col = (v) => bwr(0.5 + (v - 1) / (2 * lim));
      paint('.uw-c-b0p', nx, ny, (i) => (inside(i) ? col(b1P[i]) : BG));
      paint('.uw-c-b0u', nx, ny, (i) => (inside(i) ? col(b1U[i]) : BG));
      paint('.uw-c-b0x', nx, ny, (i) => (inside(i) ? bwr(0.5 + (b1U[i] - b1P[i]) / (2 * lim)) : BG));
      const lo = (1 - lim).toFixed(2), hi = (1 + lim).toFixed(2), l = lim.toFixed(2);
      setCbar('b0p', BWR, lo, '1', hi, lim, true, 'b1');
      setCbar('b0u', BWR, lo, '1', hi, lim, true, 'b1');
      setCbar('b0x', BWR, `−${l}`, '0', `+${l}`, lim, false);
    }
    // the brain on this slice, for the output's colour range only: echo 1's magnitude above 20 % of its range, peeled
    // by one voxel, and its largest connected piece (the scalp ring is cut off by the dark skull)
    const brainCache = new Map();
    function brainMask(z) {
      const key = `${z}`; if (brainCache.has(key) && brainCache.get(key).f === file) return brainCache.get(key).m;
      const f = file, nx = f.nx, ny = f.ny, n = nx * ny, mg = f.mag.subarray(z * n, (z + 1) * n);
      const fin = Array.from(mg).filter(isFinite), i2 = percentile(fin, 0.02), thr = i2 + 0.2 * (percentile(fin, 0.98) - i2);
      const a = new Uint8Array(n), b = new Uint8Array(n);
      for (let i = 0; i < n; i++) a[i] = mg[i] >= thr ? 1 : 0;
      for (let r = 1; r < ny - 1; r++) for (let c = 1; c < nx - 1; c++) { const i = r * nx + c; b[i] = a[i] && a[i - 1] && a[i + 1] && a[i - nx] && a[i + nx] ? 1 : 0; }
      const lab = new Int32Array(n).fill(-1), sizes = [], stack = [];
      for (let s0 = 0; s0 < n; s0++) {
        if (!b[s0] || lab[s0] >= 0) continue;
        const id = sizes.length; let cnt = 0; lab[s0] = id; stack.push(s0);
        while (stack.length) {
          const i = stack.pop(); cnt++;
          for (const j of [i - 1, i + 1, i - nx, i + nx]) if (j >= 0 && j < n && b[j] && lab[j] < 0) { lab[j] = id; stack.push(j); }
        }
        sizes.push(cnt);
      }
      const big = sizes.indexOf(Math.max(...sizes)), m = new Uint8Array(n);
      for (let i = 0; i < n; i++) m[i] = lab[i] === big ? 1 : 0;
      brainCache.set(key, { f: file, m });
      return m;
    }
    function showMaps(mask, nInt) {
      const f = file, two = f.nt === 2;   // a two-point map; more frames (e.g. a Look-Locker series) are just viewed
      slide.classList.toggle('uw-two-echoes', two);
      const dte = bs ? 1 : Number(q('.uw-dte').value) / 1000;
      if (!two || !(dte > 0)) return;
      const nx = f.nx, ny = f.ny, n = nx * ny, z = Number(q('.uw-z').value);
      const p1 = slicePhase(0, z), p2 = slicePhase(1, z);
      // 'echo': unwrap each echo, subtract, remove the 2π offset between them (median closest to 0);
      // 'diff': unwrap the phase difference itself (its global offset is the unwrapper's: median closest to 0)
      let u1, u2, m1, m2;
      try {
        if (st.unwrap === 'diff') {
          const dp = new Float32Array(n); for (let i = 0; i < n; i++) dp[i] = isFinite(p1[i]) && isFinite(p2[i]) ? wrap(p2[i] - p1[i]) : NaN;
          const r = unwrapSlice(dp, nx, ny, mask, nInt);
          u2 = r.unwrapped; m1 = m2 = r.mask; u1 = new Float32Array(n);
        } else {
          const r1 = unwrapSlice(p1, nx, ny, mask, nInt), r2 = unwrapSlice(p2, nx, ny, mask, nInt);
          u1 = r1.unwrapped; u2 = r2.unwrapped; m1 = r1.mask; m2 = r2.mask;
        }
      } catch (e) { return; }
      const inside = (i) => m1[i] && m2[i];
      const d = []; for (let i = 0; i < n; i++) if (inside(i)) d.push(u2[i] - u1[i]);
      const k = st.unwrap === 'diff' ? 0 : Math.round(percentile(d, 0.5) / (2 * Math.PI)), toHz = 1 / (2 * Math.PI * dte);
      if (bs) { showB1(f, z, n, nx, ny, p1, p2, u1, u2, k, inside); return; }
      const hzP = new Float32Array(n), hzU = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        if (!inside(i)) continue;
        hzP[i] = wrap(p2[i] - p1[i]) * toHz;
        hzU[i] = st.unwrap === 'none' ? hzP[i] : (u2[i] - u1[i] - 2 * Math.PI * k) * toHz;   // none: the phase difference as it is
      }
      // the colour scale: ± the 98th percentile of |B0 from phase| over the paper's default mask (f = 0.1) of the first
      // echo's magnitude, so it stays put while the mask and intervals change (all voxels when there is no magnitude)
      let ref = null;
      if (f.mag) {
        const mg = f.mag.subarray(z * n, (z + 1) * n), fin = Array.from(mg).filter(isFinite);
        const i2 = percentile(fin, 0.02), thr = i2 + 0.1 * (percentile(fin, 0.98) - i2);
        ref = (i) => mg[i] >= thr;
      }
      const absP = []; for (let i = 0; i < n; i++) if ((ref ? ref(i) : true) && isFinite(p1[i]) && isFinite(p2[i])) absP.push(Math.abs(wrap(p2[i] - p1[i]) * toHz));
      // with the added gradient (data-grad), the expected map is known: the scan's own field (its phase difference,
      // which does not wrap) plus the gradient; the error of the unwrapped map is then shown, and counted
      let hzE = null;
      if (grad) {
        const raw1 = f.phase.subarray(z * n, (z + 1) * n), raw2 = f.phase.subarray((f.nz + z) * n, (f.nz + z + 1) * n), g = Number(q('.uw-g').value);
        hzE = new Float32Array(n);
        for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++) { const i = r * nx + c; hzE[i] = wrap(raw2[i] - raw1[i]) * toHz + (g * (c - (nx - 1) / 2) * f.dx) / 10; }
      } else if (truthVol && !slide.classList.contains('uw-own') && truthVol.dims[0] === nx && truthVol.dims[1] === ny && truthVol.dims[2] === f.nz) {
        const tv = truthVol.data.subarray(z * n, (z + 1) * n), f0 = q('.uw-f0') ? Number(q('.uw-f0').value) : 0;
        hzE = new Float32Array(n); for (let i = 0; i < n; i++) hzE[i] = tv[i] + f0;   // a simulation: the field it was made from
      }
      slide.classList.toggle('uw-no-truth', !hzE);
      const absE = []; if (hzE) for (let i = 0; i < n; i++) if ((ref ? ref(i) : true) && inside(i)) absE.push(Math.abs(hzE[i]));
      // one range for all the B0 maps, so they can be compared. It follows the field (the expected map when it is known,
      // else the phase-difference map), not the unwrapped map: unwrapping errors (whole steps of 1/ΔTE) would make it
      // jump as soon as a few percent of the voxels go wrong; here they saturate instead
      const autoP = Math.max(10, Math.round(percentile(absP, 0.98)));
      const autoE = hzE ? Math.max(10, Math.round(percentile(absE, 0.98))) : 0;
      // the steps slides: the output's range covers the brain (not the scalp or skull), with a little room:
      // 1.1 × the 99th percentile of |B0| over the brain, whatever the mask and unwrapping settings
      let autoO = autoP;
      if (pipe && f.mag) {
        const br = brainMask(z), v = [];
        for (let i = 0; i < n; i++) if (br[i] && isFinite(hzU[i])) v.push(Math.abs(hzU[i]));
        if (v.length) autoO = Math.max(10, Math.ceil(1.1 * percentile(v, 0.99)));
      }
      const limP = range('b0', hzE ? autoE : pipe ? autoO : autoP), limU = limP;
      paint('.uw-c-b0p', nx, ny, (i) => (inside(i) ? bwr(0.5 + hzP[i] / (2 * limP)) : BG));
      paint('.uw-c-b0u', nx, ny, (i) => (inside(i) ? bwr(0.5 + hzU[i] / (2 * limU)) : BG));
      setCbar('b0p', BWR, `−${limP} Hz`, '0', `${limP} Hz`, limP, true, 'b0');
      setCbar('b0u', BWR, `−${limU} Hz`, '0', `${limU} Hz`, limU, true, 'b0');
      paint('.uw-c-b0u2', nx, ny, (i) => (inside(i) ? bwr(0.5 + hzU[i] / (2 * limU)) : BG));   // the steps slides' comparison tab
      setCbar('b0u2', BWR, `−${limU} Hz`, '0', `${limU} Hz`, limU, true, 'b0');
      if (q('.uw-mv')) mvUpdate({ z, p1, p2, u1, u2, k, mask, m1, inside, hzU, limU });
      // where the two B0 maps differ: whole steps of 1/ΔTE (a 2π between the echoes), from a wrap in the phase
      // difference (the field went past ±1/(2ΔTE)) or from an unwrapping error; 0 everywhere else
      const step = Math.round(1 / dte);
      const limX = pipe ? range('b0x', step) : step;   // the steps slides: draggable and lockable, ±1/ΔTE by default
      paint('.uw-c-b0x', nx, ny, (i) => (inside(i) ? bwr(0.5 + (hzU[i] - hzP[i]) / (2 * limX)) : BG));
      setCbar('b0x', BWR, `−${limX} Hz`, '0', `${limX} Hz`, limX, pipe, 'b0x');
      if (hzE) {
        let nIn = 0, bad = 0;
        for (let i = 0; i < n; i++) if (inside(i)) { nIn++; if (Math.abs(hzU[i] - hzE[i]) > step / 2) bad++; }
        paint('.uw-c-b0e', nx, ny, (i) => (inside(i) ? bwr(0.5 + hzE[i] / (2 * limP)) : BG));
        paint('.uw-c-b0d', nx, ny, (i) => (inside(i) ? bwr(0.5 + (hzU[i] - hzE[i]) / (2 * step)) : BG));
        setCbar('b0e', BWR, `−${limP} Hz`, '0', `${limP} Hz`, limP, true, 'b0');
        setCbar('b0d', BWR, `−${step} Hz`, '0', `${step} Hz`, step, false);
        q('.uw-stats').insertAdjacentHTML('beforeend', `<br>B<sub>0</sub> off by more than ${Math.round(step / 2)} Hz in <b>${nIn ? ((100 * bad) / nIn).toFixed(1) : '0.0'} %</b> of the mask`);
      }
    }

    // ---------------------------------------------------------------- NIfTI files (real-data viewer)
    // role: 'phase' or 'mag' (from its button), or 'auto' (dropped / ?load=: one file is the phase; with two, the
    // phase is found by name, then by sign, since a magnitude has no negative values, then by order)
    let cur = { ph: null, mag: null };
    async function openFiles(list, isDefault, role = 'auto') {
      const files = [...list].filter((f) => VOLUME.test(f.name));
      if (!files.length) { q('.uw-stats').textContent = 'Open a NIfTI (.nii, .nii.gz) or MINC (.mnc, .mnc.gz) file.'; return; }
      q('.uw-stats').textContent = `Reading ${files.map((f) => f.name).join(', ')}…`;
      try {
        if (!mod) mod = await loadModule();
        const vols = await Promise.all(files.slice(0, role === 'auto' ? 32 : 1).map(async (f) => ({ name: f.name, ...(await readVolume(f.name, new Uint8Array(await f.arrayBuffer()))) })));
        if (role === 'mag') {
          if (!cur.ph) { q('.uw-stats').textContent = 'Load the phase first.'; return; }
          const [m] = vols, [nx, ny, nz] = cur.ph.dims;
          if (m.dims[0] !== nx || m.dims[1] !== ny || m.dims[2] !== nz) { q('.uw-stats').textContent = `${m.name} (${m.dims.slice(0, 3).join('×')}) does not match the phase (${nx}×${ny}×${nz}).`; return; }
          cur.mag = m;
        } else if (role === 'phase') {
          cur = { ph: vols[0], mag: null };   // a new phase: load its magnitude after it
        } else if (vols.length > 2) {
          // several files (e.g. one per echo or readout): phase by name, else by sign (a magnitude has no negative
          // values); each kind stacked as frames, in the order given, when their grids match
          const isPh = (v) => isPhase(v.name) || (!isMag(v.name) && v.data.some((x) => x < 0));
          const stack = (vs) => {
            if (!vs.length) return null;
            const [nx, ny, nz] = vs[0].dims, same = vs.filter((v) => v.dims[0] === nx && v.dims[1] === ny && v.dims[2] === nz);
            const nt = same.reduce((a, v) => a + v.dims[3], 0), data = new Float32Array(nx * ny * nz * nt);
            let o = 0; same.forEach((v) => { data.set(v.data, o); o += v.data.length; });
            return { name: `${same[0].name}${same.length > 1 ? ` … (${same.length} files)` : ''}`, dims: [nx, ny, nz, nt], pixdim: same[0].pixdim, data };
          };
          cur = { ph: stack(vols.filter(isPh)), mag: stack(vols.filter((v) => !isPh(v))) };
          if (!cur.ph) { q('.uw-stats').textContent = 'None of these files looks like phase.'; return; }
        } else {
          let ph = vols.find((v) => isPhase(v.name)) || vols.find((v) => !isMag(v.name)) || vols[0];
          if (vols.length === 2 && !vols.some((v) => isPhase(v.name) || isMag(v.name))) {
            const neg = vols.filter((v) => v.data.some((x) => x < 0));
            ph = neg.length === 1 ? neg[0] : vols[0];
          }
          cur = { ph, mag: vols.find((v) => v !== ph) || null };
        }
        loadVolumes(cur.ph, cur.mag);
        if (q('.uw-roles')) q('.uw-roles').innerHTML = `Phase: <b>${cur.ph.name}</b><br>Magnitude: ${cur.mag ? `<b>${cur.mag.name}</b>` : 'none (no mask)'}`;
        slide.classList.toggle('uw-own', !isDefault);
        run();
      } catch (e) {
        q('.uw-stats').textContent = `Could not read the file: ${e.message || e}`;
      }
    }
    function loadVolumes(ph, mag) {
      const [nx, ny, nz, nt] = ph.dims, notes = [];
      let lo = Infinity, hi = -Infinity;
      for (const v of ph.data) if (isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; }
      const phase = new Float32Array(ph.data.length);
      if (lo >= -Math.PI - 0.01 && hi <= Math.PI + 0.01) phase.set(ph.data);
      else {
        const s = (2 * Math.PI) / (hi - lo || 1);
        for (let i = 0; i < phase.length; i++) phase[i] = isFinite(ph.data[i]) ? (ph.data[i] - lo) * s - Math.PI : NaN;
        notes.push(`phase rescaled from [${+lo.toPrecision(4)}, ${+hi.toPrecision(4)}] to [−π, π)`);
      }
      let m = null, magNt = 1;
      if (mag && mag.dims[0] === nx && mag.dims[1] === ny && mag.dims[2] === nz) { m = mag.data; magNt = mag.dims[3]; }
      else if (mag) notes.push(`${mag.name} has other dimensions: not used`);
      file = { nx, ny, nz, nt, dx: ph.pixdim[0], dy: ph.pixdim[1], phase, mag: m, magNt,
        note: `${nx}×${ny}×${nz}${nt > 1 ? `×${nt}` : ''} voxels${notes.length ? `; ${notes.join('; ')}` : ''}` };
      const zs = q('.uw-z'), ts = q('.uw-t');
      zs.max = String(nz - 1); zs.value = '0';
      ts.max = String(nt - 1); ts.value = '0';
      q('.uw-z-row').hidden = nz < 2;
      q('.uw-t-row').hidden = nt < 2;
    }

    if (!sim) {
      const isCurrent = () => typeof Reveal !== 'undefined' && Reveal.getCurrentSlide() === slide;
      const hasFiles = (e) => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
      document.addEventListener('dragover', (e) => { if (isCurrent() && hasFiles(e)) { e.preventDefault(); slide.classList.add('uw-dropping'); } });
      document.addEventListener('dragleave', (e) => { if (!e.relatedTarget) slide.classList.remove('uw-dropping'); });
      document.addEventListener('drop', (e) => {
        slide.classList.remove('uw-dropping');
        if (!isCurrent() || !hasFiles(e)) return;
        e.preventDefault();
        openFiles(e.dataTransfer.files, false);
      });
      [['phase', '.uw-open-ph', '.uw-file-ph'], ['mag', '.uw-open-mag', '.uw-file-mag']].forEach(([role, btn, inp]) => {
        if (!q(btn)) return;   // a layout without file buttons
        q(btn).addEventListener('click', (e) => { e.currentTarget.blur(); q(inp).click(); });
        q(inp).addEventListener('change', (e) => { openFiles(e.target.files, false, role); e.target.value = ''; });
      });
      if (q('.uw-back')) q('.uw-back').addEventListener('click', (e) => { e.currentTarget.blur(); loadUrls(slide.dataset.default).catch((er) => { q('.uw-stats').textContent = String(er.message || er); }); });
    }

    // ---------------------------------------------------------------- the viewer tab: a mini qMRLab viewer
    // every image the protocol uses (input, steps, output) as layers; click one to show it, click the image to move
    // the cursor; the cursor table lists every layer's value there
    const mv = { sel: 'magnitude_echo-1', layers: [], cur: null };
    function mvUpdate({ z, p1, p2, u1, u2, k, mask, m1, inside, hzU, limU }) {
      const f = file, nx = f.nx, ny = f.ny, n = nx * ny, L = [];
      const magAt = (t) => f.mag.subarray((Math.min(t, f.magNt - 1) * f.nz + z) * n, (Math.min(t, f.magNt - 1) * f.nz + z + 1) * n);
      const masked = (a, keep) => { const o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = keep(i) ? a[i] : NaN; return o; };
      const magRange = (a) => [0, Math.max(percentile(Array.from(a).filter(isFinite), 0.99), 1e-12)];
      const absMax = (a) => { const v = []; for (const x of a) if (isFinite(x)) v.push(Math.abs(x)); return Math.max(percentile(v, 0.98), Math.PI); };
      if (f.mag) {
        L.push({ group: 'Input', name: 'magnitude_echo-1', data: magAt(0), map: 'gray', range: magRange(magAt(0)), unit: '' });
        if (f.magNt > 1) L.push({ group: 'Input', name: 'magnitude_echo-2', data: magAt(1), map: 'gray', range: magRange(magAt(1)), unit: '' });
      }
      L.push({ group: 'Input', name: 'phase_echo-1', data: p1, map: 'phase', range: [-Math.PI, Math.PI], unit: 'rad' });
      L.push({ group: 'Input', name: 'phase_echo-2', data: p2, map: 'phase', range: [-Math.PI, Math.PI], unit: 'rad' });
      if (mask) L.push({ group: 'Steps', name: 'mask', data: Float32Array.from(mask), map: 'gray', range: [0, 1], unit: '' });
      const dp = new Float32Array(n); for (let i = 0; i < n; i++) dp[i] = isFinite(p1[i]) && isFinite(p2[i]) ? wrap(p2[i] - p1[i]) : NaN;
      if (st.unwrap !== 'echo') L.push({ group: 'Steps', name: 'phase-diff', data: dp, map: 'phase', range: [-Math.PI, Math.PI], unit: 'rad' });
      if (st.unwrap === 'diff') {
        const u = masked(u2, (i) => m1[i]), lim = absMax(u);
        L.push({ group: 'Steps', name: 'unwrapped_phase-diff', data: u, map: 'bwr', range: [-lim, lim], unit: 'rad' });
      } else if (st.unwrap === 'echo') {
        const a = masked(u1, (i) => m1[i]), b = new Float32Array(n);
        for (let i = 0; i < n; i++) b[i] = m1[i] ? u2[i] - 2 * Math.PI * k : NaN;
        const lim = Math.max(absMax(a), absMax(b));
        L.push({ group: 'Steps', name: 'unwrapped_echo-1', data: a, map: 'bwr', range: [-lim, lim], unit: 'rad' });
        L.push({ group: 'Steps', name: 'unwrapped_echo-2', data: b, map: 'bwr', range: [-lim, lim], unit: 'rad' });
      }
      L.push({ group: 'Output', name: 'b0-map', data: masked(hzU, inside), map: 'bwr', range: [-limU, limU], unit: 'Hz' });
      mv.layers = L; mv.nx = nx; mv.ny = ny; mv.dx = f.dx; mv.dy = f.dy;
      if (!L.some((l) => l.name === mv.sel)) mv.sel = L[0].name;
      if (mv.cur && (mv.cur[0] >= nx || mv.cur[1] >= ny)) mv.cur = null;   // no cursor until the image is clicked
      mvDraw();
    }
    const mvFmt = (v) => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2));
    function mvList() {   // the layers, grouped as the protocol uses them, each with its value at the cursor
      const box = q('.uw-mv-layers'), i = mv.cur ? mv.cur[1] * mv.nx + mv.cur[0] : -1; let html = '', g = '';
      mv.layers.forEach((l) => {
        if (l.group !== g) { g = l.group; html += `<p class="mv-group">${g}</p>`; }
        const v = i >= 0 ? l.data[i] : NaN;
        html += `<button class="mv-layer${l.name === mv.sel ? ' sel' : ''}" data-name="${l.name}"><span class="mv-swatch mv-${l.map}"></span><span class="mv-name">${l.name}</span><span class="mv-val">${isFinite(v) ? mvFmt(v) : '–'}</span><span class="mv-unit">${l.unit}</span></button>`;
      });
      box.innerHTML = html;
      q('.uw-mv').classList.toggle('mv-nocur', !mv.cur);   // values and cursor line only once the image is clicked
      q('.uw-mv-xy').textContent = mv.cur ? `x ${mv.cur[0]}  y ${mv.cur[1]}${file && file.nz > 1 ? `  slice ${Number(q('.uw-z').value) + 1}` : ''}` : '';
    }
    function mvColour(l, v) {
      if (!isFinite(v)) return [0, 0, 0];
      const t = (v - l.range[0]) / (l.range[1] - l.range[0] || 1);
      if (l.map === 'gray') { const g = Math.round(Math.max(0, Math.min(1, t)) * 255); return [g, g, g]; }
      return (l.map === 'phase' ? pastel : bwr)(Math.max(0, Math.min(1, t)));
    }
    function mvDraw() {
      const l = mv.layers.find((x) => x.name === mv.sel); if (!l) return;
      const { nx, ny } = mv, cv = q('.uw-mv-canvas'), wrapEl = q('.uw-mv-view');
      const W = wrapEl.clientWidth, H = wrapEl.clientHeight; if (!W || !H) return;
      const dpr = window.devicePixelRatio || 1, s = Math.min(W / (nx * mv.dx), H / (ny * mv.dy));
      const w = Math.round(nx * mv.dx * s), h = Math.round(ny * mv.dy * s);
      cv.style.width = `${w}px`; cv.style.height = `${h}px`; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      const off = document.createElement('canvas'); off.width = nx; off.height = ny;
      const oc = off.getContext('2d'), img = oc.createImageData(nx, ny);
      for (let i = 0; i < nx * ny; i++) { const [R, G, B] = mvColour(l, l.data[i]); img.data[4 * i] = R; img.data[4 * i + 1] = G; img.data[4 * i + 2] = B; img.data[4 * i + 3] = 255; }
      oc.putImageData(img, 0, 0);
      const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.drawImage(off, 0, 0, cv.width, cv.height);
      if (mv.cur) {   // the crosshair, once the image has been clicked
        const [cx, cy] = mv.cur, px = ((cx + 0.5) / nx) * cv.width, py = ((cy + 0.5) / ny) * cv.height;
        ctx.strokeStyle = 'rgba(185, 242, 75, 0.85)'; ctx.lineWidth = dpr;   // the viewer's crosshair green
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, cv.height); ctx.moveTo(0, py); ctx.lineTo(cv.width, py); ctx.stroke();
      }
      const stops = l.map === 'gray' ? [[0, [0, 0, 0]], [1, [255, 255, 255]]] : l.map === 'phase' ? PASTEL : BWR;
      const lab = (v) => (l.unit === 'rad' ? piLabel(Math.abs(v)).replace(/^/, v < 0 ? '−' : '') : `${mvFmt(v)}${l.unit ? ` ${l.unit}` : ''}`);
      q('.uw-mv-cbar').innerHTML = `<i style="background:linear-gradient(to right, ${stops.map(([t, c]) => `rgb(${c.join(',')}) ${Math.round(t * 100)}%`).join(', ')})"></i><span>${lab(l.range[0])}</span><span>${lab(l.range[1])}</span>`;
      mvList();
    }
    if (q('.uw-mv')) {
      q('.uw-mv-layers').addEventListener('click', (e) => { const b = e.target.closest('.mv-layer'); if (!b) return; b.blur(); mv.sel = b.dataset.name; mvDraw(); });
      const pick = (e) => {
        const r = q('.uw-mv-canvas').getBoundingClientRect(); if (!mv.nx) return;
        const x = Math.floor(((e.clientX - r.left) / r.width) * mv.nx), y = Math.floor(((e.clientY - r.top) / r.height) * mv.ny);
        if (x >= 0 && y >= 0 && x < mv.nx && y < mv.ny) { mv.cur = [x, y]; mvDraw(); }
      };
      let down = false;
      q('.uw-mv-canvas').addEventListener('pointerdown', (e) => { down = true; pick(e); });
      window.addEventListener('pointerup', () => { down = false; });
      q('.uw-mv-canvas').addEventListener('pointermove', (e) => { if (down) pick(e); });
      slide.querySelectorAll('.ex-tabs [data-tab="view"]').forEach((b) => b.addEventListener('click', () => requestAnimationFrame(mvDraw)));
    }
    // a range you can drag (the steps slides: the output B0 map, and the unwrapped phase): left or right on the image or
    // its colour bar narrows or widens it, and it then stays, as with the lock; double-click gives it back to the data
    function dragRange(canvasSel, barKey, lockKey, round) {
      if (!pipe || !q(canvasSel)) return;
      const fig = q(canvasSel).closest('figure');
      let drag = null;
      fig.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.uw-lock')) return;
        const lim = Number(q(`.uw-cbar[data-for="${barKey}"]`).dataset.lim); if (!(lim > 0)) return;
        drag = { x: e.clientX, lim }; fig.setPointerCapture(e.pointerId); e.preventDefault();
      });
      fig.addEventListener('pointermove', (e) => {
        if (!drag) return;
        st.fixed[lockKey] = round(drag.lim * Math.exp((e.clientX - drag.x) / 120));
        requestAnimationFrame(run);
      });
      const end = () => { drag = null; };
      fig.addEventListener('pointerup', end); fig.addEventListener('pointercancel', end);
      fig.addEventListener('dblclick', (e) => { if (e.target.closest('.uw-lock')) return; st.fixed[lockKey] = null; run(); });
      fig.title = 'Drag left or right to change the range; double-click to reset it';
      fig.classList.add('uw-drag-range');
    }
    dragRange('.uw-c-b0u', 'b0u', 'b0', (v) => Math.max(1, Math.round(v)));   // Hz
    dragRange('.uw-c-b0x', 'b0x', 'b0x', (v) => Math.max(1, Math.round(v)));   // Hz
    dragRange('.uw-c-b0p', 'b0p', 'b0', (v) => Math.max(1, Math.round(v)));   // the comparison tab's two B0 maps share the output's range
    dragRange('.uw-c-b0u2', 'b0u2', 'b0', (v) => Math.max(1, Math.round(v)));
    dragRange('.uw-c-unw', 'unw', 'unw', (v) => Math.max(0.1, Math.round(v * 20) / 20));   // rad
    // tabs (the pipeline layout): one step of the processing at a time
    slide.querySelectorAll('.ex-tabs [data-tab]').forEach((b) => b.addEventListener('click', () => {
      b.blur();
      slide.querySelectorAll('.ex-tabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      slide.querySelectorAll('.ex-panel').forEach((pn) => { pn.hidden = pn.dataset.panel !== b.dataset.tab; });
      slide.dataset.tab = b.dataset.tab;
    }));
    const tabU = new URLSearchParams(location.search).get('tab');   // ?tab=<key>: open on that step
    if (tabU) { const b = slide.querySelector(`.ex-tabs [data-tab="${CSS.escape(tabU)}"]`); if (b) b.click(); }
    segToggle(slide, 'uwm', (v) => {
      st.mask = v; slide.classList.toggle('uw-mask-none', v === 'none'); slide.classList.toggle('uw-mask-file', v === 'file');
      if (v === 'file' && !maskVol && q('.uw-file-mask')) q('.uw-file-mask').click();   // no mask yet: pick one
      run();
    });
    // a mask file (NIfTI or MINC, the size of the phase): used as is, non-zero = inside
    if (q('.uw-open-mask')) {
      q('.uw-open-mask').addEventListener('click', (e) => { e.currentTarget.blur(); q('.uw-file-mask').click(); });
      q('.uw-file-mask').addEventListener('change', async (e) => {
        const f = e.target.files[0]; e.target.value = ''; if (!f) return;
        const msg = q('.uw-mask-name');
        try {
          if (!mod) mod = await loadModule();
          const v = await readVolume(f.name, new Uint8Array(await f.arrayBuffer()));
          if (!file || v.dims[0] !== file.nx || v.dims[1] !== file.ny || v.dims[2] !== file.nz) {
            msg.textContent = `${f.name}: ${v.dims.slice(0, 3).join('×')}, not ${file ? `${file.nx}×${file.ny}×${file.nz}` : 'the phase'}`; return;
          }
          maskVol = v; msg.textContent = f.name; run();
        } catch (er) { msg.textContent = `${f.name}: ${er.message || er}`; }
      });
    }
    // echo times (the protocol tab): TE1 and TE2, or ΔTE directly; ΔTE (.uw-dte) is what the B0 map uses
    const teSync = () => {
      const a = Number(q('.uw-te1').value), b = Number(q('.uw-te2').value);
      if (b > a) { q('.uw-dte').value = String(+(b - a).toFixed(4)); q('.uw-dte-v').textContent = `ΔTE = ${+(b - a).toFixed(2)} ms`; }
      else q('.uw-dte-v').textContent = 'TE₂ must be longer than TE₁';
    };
    if (q('.uw-te1')) {
      teSync();
      segToggle(slide, 'tem', (v) => { slide.classList.toggle('uw-te-delta', v === 'delta'); if (v === 'pair') teSync(); run(); });
      ['.uw-te1', '.uw-te2'].forEach((c) => {
        q(c).addEventListener('input', () => { teSync(); requestAnimationFrame(run); });
        q(c).addEventListener('keydown', (e) => e.stopPropagation());
      });
    }
    const setUnwrap = (v) => {
      st.unwrap = v; slide.classList.toggle('uw-diff', v === 'diff'); slide.classList.toggle('uw-unwrap-none', v === 'none');
      slide.querySelectorAll('[data-uwu]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.uwu === v)));
      const cap = q('.uw-c-b0u') && q('.uw-c-b0u').parentElement.querySelector('figcaption');
      const Bx = bs ? 'B<sub>1</sub>' : 'B<sub>0</sub>';
      if (cap && !pipe) cap.innerHTML = v === 'diff' ? `${Bx} from unwrapped Δφ` : `${Bx} from unwrapped phase`;
      const wc = q('.uw-c-wrap') && q('.uw-c-wrap').parentElement.querySelector('figcaption');
      if (wc) wc.textContent = v === 'diff' ? 'Wrapped Δφ' : 'Wrapped phase';
      run();
    };
    segToggle(slide, 'uwu', setUnwrap);
    if (!sim) setUnwrap(st.unwrap);
    ['.uw-te', '.uw-snr', '.uw-thr', '.uw-n', '.uw-z', '.uw-t', '.uw-dte', '.uw-g', '.uw-f0'].forEach((c) => {
      const el = q(c); if (!el) return;
      el.addEventListener('input', () => requestAnimationFrame(run));
      el.addEventListener('keydown', (e) => e.stopPropagation());   // arrow keys move the slider, not the slides
    });
    // load when the slide is shown (or is next to the current one)
    const maybe = () => {
      if (ready || typeof Reveal === 'undefined') return;
      const cur = Reveal.getIndices().h, me = Reveal.getIndices(slide).h;
      if (Math.abs(cur - me) <= 1) setup().catch((e) => { q('.uw-stats').textContent = `Could not load: ${e.message || e}`; });
    };
    if (typeof Reveal !== 'undefined') { Reveal.on('ready', maybe); Reveal.on('slidechanged', maybe); }
    maybe();
  }
})();
