/* Two-pool magnetization transfer (MT) simulator for the MT slides: the Bloch-McConnell equations of the chapter
 * (Eqs. 6.1-6.5) applied to an MT-prepared spoiled gradient echo (MT-SPGR), in the browser and in Node (tests).
 *
 * Model (Henkelman 1993; Sled & Pike 2000, 2001; the same as qMRLab's qMT-SPGR "Bloch sim"):
 * - free pool (water): Mx, My, Mz,f with T1,f, T2,f; full Bloch equations during the off-resonance MT pulse;
 * - restricted pool (macromolecules): Mz,r only; its T2,r (~10 µs) is so short that the pulse only saturates it,
 *   at the rate W(t) = π ω1(t)² G(Δ, T2,r), G the absorption lineshape (super-Lorentzian by default);
 * - exchange kf (free -> restricted) and kr = kf / F (restricted -> free), F = M0,r / M0,f (pool size ratio).
 * Each TR: MT pulse (Tmt) -> spoiler and wait (Ts) -> excitation α (instantaneous, free pool only; spoiled after) ->
 * the rest of the TR. Transverse magnetization is zero at the start of each pulse (ideal spoiling), so one TR maps
 * the longitudinal state (Mz,f, Mz,r) affinely onto the next: z' = A z + b. The steady state is z = (I - A)⁻¹ b,
 * exact and immediate; the approach to it is the iteration of the same map.
 *
 * Units: seconds, rad/s, offsets in Hz, angles in degrees at the API. M0,f = 1, so M0,r = F.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MTSim = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TWO_PI = 2 * Math.PI;
  const DEG = Math.PI / 180;

  // ------------------------------------------------------------------ lineshapes G(Δ) [s], ∫G dω = 1

  function gaussianG(offsetHz, T2) {
    const x = TWO_PI * offsetHz * T2;
    return (T2 / Math.sqrt(TWO_PI)) * Math.exp(-0.5 * x * x);
  }

  function lorentzianG(offsetHz, T2) {
    const x = TWO_PI * offsetHz * T2;
    return T2 / Math.PI / (1 + x * x);
  }

  // Super-Lorentzian: G = ∫₀¹ √(2/π) T2/|3u²-1| exp(-2 (2πΔT2/(3u²-1))²) du (u = cos θ, θ the angle to B0).
  // The integrand vanishes at the magic angle (u = 1/√3) for Δ ≠ 0 but is sharply peaked near it, so the two sides
  // are integrated on grids that cluster there. G diverges (logarithmically) as Δ -> 0; below `cutoffHz` it is
  // continued smoothly from its values above (as qMRLab does with a spline), which only matters for plots.
  const SL_N = 400;
  function superLorentzianRaw(offsetHz, T2) {
    const u0 = 1 / Math.sqrt(3);
    const a = TWO_PI * Math.abs(offsetHz) * T2;
    const f = (u) => {
      const d = 3 * u * u - 1;
      if (d === 0) return 0;
      const r = a / d;
      return (T2 / Math.abs(d)) * Math.exp(-2 * r * r);
    };
    // substitution u = u0 ∓ (u0 - lo) s², clustering points at u0 (s in [0, 1])
    let sum = 0;
    for (const [lo, hi] of [[0, u0], [u0, 1]]) {
      const L = hi - lo;
      const toward = lo === 0 ? 1 : -1; // approach u0 from below or above
      for (let i = 0; i < SL_N; i++) {
        const s = (i + 0.5) / SL_N;
        const u = lo === 0 ? u0 - L * s * s : u0 + L * s * s;
        sum += f(u) * 2 * L * s / SL_N;
      }
      void toward;
    }
    return Math.sqrt(2 / Math.PI) * sum;
  }

  const SL_CUTOFF = 1000; // Hz
  function superLorentzianG(offsetHz, T2) {
    const d = Math.abs(offsetHz);
    if (d >= SL_CUTOFF) return superLorentzianRaw(d, T2);
    // Below the cutoff: a quadratic in Δ through G(cutoff) with matching slope, flat at Δ = 0.
    const h = 10;
    const g1 = superLorentzianRaw(SL_CUTOFF, T2);
    const slope = (superLorentzianRaw(SL_CUTOFF + h, T2) - superLorentzianRaw(SL_CUTOFF - h, T2)) / (2 * h);
    const c = -slope / (2 * SL_CUTOFF); // G = g0 - c Δ²  with  G'(cutoff) = slope
    const g0 = g1 + c * SL_CUTOFF * SL_CUTOFF;
    return g0 - c * d * d;
  }

  const LINESHAPES = { superlorentzian: superLorentzianG, gaussian: gaussianG, lorentzian: lorentzianG };

  // Cache: lineshape values recur (same offset and T2,r for every TR and voxel).
  const gCache = new Map();
  function lineshape(name, offsetHz, T2) {
    const key = `${name}|${offsetHz}|${T2}`;
    let g = gCache.get(key);
    if (g === undefined) {
      g = (LINESHAPES[name] || superLorentzianG)(offsetHz, T2);
      if (gCache.size > 20000) gCache.clear();
      gCache.set(key, g);
    }
    return g;
  }

  // ------------------------------------------------------------------ MT pulse envelopes s(t), t in [0, T]

  // `bandwidth` (Hz): the frequency FWHM of the Gaussian part (qMRLab's default, 200 Hz).
  function envelope(shape, T, bandwidth = 200) {
    const sigma = (2 * Math.sqrt(2 * Math.LN2)) / (TWO_PI * bandwidth); // time-domain σ of a Gaussian with that FWHM
    switch (shape) {
      case 'hard': return () => 1;
      case 'gaussian': return (t) => Math.exp(-0.5 * ((t - T / 2) / sigma) ** 2);
      case 'gausshann': return (t) => Math.exp(-0.5 * ((t - T / 2) / sigma) ** 2) * (0.5 - 0.5 * Math.cos((TWO_PI * t) / T));
      case 'fermi': { // flat top with soft edges (GE): plateau ±T/4, edge time constant T/25. These two widths are
        // not reported; they are set so that the chapter's Figure 6.9 (qMRLab) values are reproduced for the GE protocol.
        const w = 0.25 * T, a = 0.04 * T;
        return (t) => 1 / (1 + Math.exp((Math.abs(t - T / 2) - w) / a));
      }
      case 'sincgauss': { // sinc (one lobe each side) times Gaussian
        return (t) => {
          const x = (t - T / 2) / (T / 4);
          const sinc = x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
          return sinc * Math.exp(-0.5 * ((t - T / 2) / sigma) ** 2);
        };
      }
      default: throw new Error(`Unknown MT pulse shape "${shape}"`);
    }
  }

  /* Number of piecewise-constant steps for a pulse of duration T at an offset (Hz), at least nMin. Holding ω1 constant
   * over steps of dt adds copies of the pulse's spectrum at multiples of 1/dt; one landing on the water resonance
   * (at the offset, in the pulse's frame) would saturate water directly, which the real, smooth pulse does not. So dt
   * is chosen to put the offset midway between two copies (offset·dt = m + ½), as far from both as possible. */
  function stepsFor(T, offsetHz, nMin = 48) {
    const x = Math.abs(offsetHz) * T;       // offset in cycles per pulse
    if (x <= nMin / 2) return nMin;          // the offset is below half the sampling rate already
    const m = Math.floor(x / nMin - 0.5);
    return Math.max(nMin, Math.round(x / (m + 0.5)));
  }

  // ω1(t) samples (rad/s) at the midpoints of n steps, scaled so that ∫ω1 dt = the pulse's flip angle.
  function pulseSamples(pulse, n) {
    const { shape = 'gaussian', duration, angle, bandwidth } = pulse;
    const s = envelope(shape, duration, bandwidth);
    const dt = duration / n;
    const v = new Float64Array(n);
    let area = 0;
    for (let i = 0; i < n; i++) { v[i] = s((i + 0.5) * dt); area += v[i] * dt; }
    const k = (angle * DEG) / area;
    for (let i = 0; i < n; i++) v[i] *= k;
    return { w1: v, dt };
  }

  // ------------------------------------------------------------------ small dense linear algebra

  function matMul(A, B, n) {
    const C = new Float64Array(n * n);
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < n; k++) {
        const a = A[i * n + k];
        if (a === 0) continue;
        for (let j = 0; j < n; j++) C[i * n + j] += a * B[k * n + j];
      }
    }
    return C;
  }

  function identity(n) {
    const I = new Float64Array(n * n);
    for (let i = 0; i < n; i++) I[i * n + i] = 1;
    return I;
  }

  function solve(A, b, n) { // Gaussian elimination with partial pivoting; A (n×n) and b are copied
    const M = Float64Array.from(A), x = Float64Array.from(b);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r * n + c]) > Math.abs(M[p * n + c])) p = r;
      if (p !== c) {
        for (let j = 0; j < n; j++) { const t = M[c * n + j]; M[c * n + j] = M[p * n + j]; M[p * n + j] = t; }
        const t = x[c]; x[c] = x[p]; x[p] = t;
      }
      for (let r = c + 1; r < n; r++) {
        const f = M[r * n + c] / M[c * n + c];
        if (f === 0) continue;
        for (let j = c; j < n; j++) M[r * n + j] -= f * M[c * n + j];
        x[r] -= f * x[c];
      }
    }
    for (let r = n - 1; r >= 0; r--) {
      let s = x[r];
      for (let j = r + 1; j < n; j++) s -= M[r * n + j] * x[j];
      x[r] = s / M[r * n + r];
    }
    return x;
  }

  // exp(A) for a small matrix: scaling and squaring with a degree-8 Taylor series (ample for the norms here).
  function expm(A, n) {
    let norm = 0;
    for (let i = 0; i < n; i++) {
      let row = 0;
      for (let j = 0; j < n; j++) row += Math.abs(A[i * n + j]);
      norm = Math.max(norm, row);
    }
    const s = Math.max(0, Math.ceil(Math.log2(norm / 0.5)));
    const scale = 2 ** -s;
    const X = A.map((v) => v * scale);
    let term = identity(n), E = identity(n);
    for (let k = 1; k <= 8; k++) {
      term = matMul(term, X, n).map((v) => v / k);
      for (let i = 0; i < n * n; i++) E[i] += term[i];
    }
    for (let i = 0; i < s; i++) E = matMul(E, E, n);
    return E;
  }

  // ------------------------------------------------------------------ the tissue's generator matrices

  // State (augmented, homogeneous): [Mx, My, Mzf, Mzr, 1]. dM/dt = L M.
  function generator(t, w1, offsetHz, W) {
    const { R1f, R1r, T2f, F } = t;
    const kf = F > 0 ? t.kf : 0; // no restricted pool, no exchange
    const kr = F > 0 ? kf / F : 0;
    const dw = TWO_PI * offsetHz; // free-pool offset in the frame of the MT pulse
    const L = new Float64Array(25);
    // dMx = -Mx/T2f + Δω My
    L[0] = -1 / T2f; L[1] = dw;
    // dMy = -Δω Mx - My/T2f + ω1 Mzf
    L[5] = -dw; L[6] = -1 / T2f; L[7] = w1;
    // dMzf = -ω1 My - (R1f + kf) Mzf + kr Mzr + R1f M0f
    L[11] = -w1; L[12] = -(R1f + kf); L[13] = kr; L[14] = R1f;
    // dMzr = kf Mzf - (R1r + kr + W) Mzr + R1r M0r
    L[17] = F > 0 ? kf : 0; L[18] = -(R1r + kr + W); L[19] = R1r * F;
    return L;
  }

  // Longitudinal-only relaxation and exchange over time τ (no RF): a 3×3 affine map on [Mzf, Mzr, 1].
  function relaxZ(t, tau) {
    const { R1f, R1r, F } = t;
    const kf = F > 0 ? t.kf : 0;
    const kr = F > 0 ? kf / F : 0;
    const L = new Float64Array([
      -(R1f + kf), kr, R1f,
      F > 0 ? kf : 0, -(R1r + kr), R1r * F,
      0, 0, 0,
    ]);
    return expm(L.map((v) => v * tau), 3);
  }

  // Propagator of the MT pulse on the augmented 5-vector, piecewise constant ω1 over `steps` steps.
  function pulsePropagator(t, pulse, offsetHz, nMin = 48, lineshapeName = 'superlorentzian') {
    const steps = stepsFor(pulse.duration, offsetHz, nMin);
    const { w1, dt } = pulseSamples(pulse, steps);
    const G = lineshape(lineshapeName, offsetHz, t.T2r);
    let P = identity(5);
    for (let i = 0; i < steps; i++) {
      const W = Math.PI * w1[i] * w1[i] * G;
      const step = expm(generator(t, w1[i], offsetHz, W).map((v) => v * dt), 5);
      P = matMul(step, P, 5);
    }
    return P;
  }

  // ------------------------------------------------------------------ one TR as a map, and its steady state

  /* seq: { tr, flipAngle (deg), mt: null | { shape, duration, angle (deg), offset (Hz), bandwidth }, ts (s, pulse end
   *        -> excitation; default 3 ms as in qMRLab), b1 (scales every RF amplitude; default 1) }
   * Returns the 3×3 affine maps of the TR's segments on z = [Mzf, Mzr, 1], starting just before the MT pulse. */
  function trSegments(tissue, seq, opts = {}) {
    const b1 = seq.b1 == null ? 1 : seq.b1;
    const mt = seq.mt && seq.mt.angle > 0 ? seq.mt : null;
    const tmt = mt ? mt.duration : 0;
    const ts = seq.ts == null ? 3e-3 : seq.ts;
    const rest = seq.tr - tmt - ts;
    if (rest < 0) throw new Error('TR is shorter than the MT pulse plus Ts');
    let pulse = identity(3);
    if (mt) {
      const P = pulsePropagator(tissue, { ...mt, angle: mt.angle * b1 }, mt.offset, opts.steps || 48, opts.lineshape);
      // z-part of the 5×5 propagator, transverse = 0 at the start; transverse at the end is spoiled
      pulse = new Float64Array([P[12], P[13], P[14], P[17], P[18], P[19], 0, 0, 1]);
    }
    const a = seq.flipAngle * DEG * b1;
    const excite = new Float64Array([Math.cos(a), 0, 0, 0, 1, 0, 0, 0, 1]);
    return { pulse, wait: relaxZ(tissue, ts), excite, rest: relaxZ(tissue, rest), sinA: Math.sin(a) };
  }

  function apply3(M, z) {
    return [M[0] * z[0] + M[1] * z[1] + M[2], M[3] * z[0] + M[4] * z[1] + M[5]];
  }

  // Steady state just before the MT pulse, with the signal (∝ Mzf just before excitation × sin α).
  function steadyState(tissue, seq, opts) {
    const s = trSegments(tissue, seq, opts);
    const T = matMul(s.rest, matMul(s.excite, matMul(s.wait, s.pulse, 3), 3), 3);
    // z = A z + b  ->  (I - A) z = b
    const z = solve([1 - T[0], -T[1], -T[3], 1 - T[4]], [T[2], T[5]], 2);
    const afterPulse = apply3(s.pulse, z);
    const beforeExc = apply3(s.wait, afterPulse);
    return { z: [z[0], z[1]], afterPulse, beforeExcitation: beforeExc, signal: beforeExc[0] * s.sinA, segments: s };
  }

  function signal(tissue, seq, opts) { return steadyState(tissue, seq, opts).signal; }

  // MT-on signal normalized by the same sequence with the MT pulse off (what qMRLab calls Smodel, MTdata).
  function normalizedSignal(tissue, seq, opts) {
    return signal(tissue, seq, opts) / signal(tissue, { ...seq, mt: null }, opts);
  }

  // Mz of both pools through TRs, from equilibrium or from a given start: samples within each TR for plots.
  // Returns { t, mzf, mzr, mx? } arrays and per-TR markers (before pulse, after pulse, before excitation).
  function trajectory(tissue, seq, nTR, opts = {}) {
    const b1 = seq.b1 == null ? 1 : seq.b1;
    const mt = seq.mt && seq.mt.angle > 0 ? seq.mt : null;
    const steps = mt ? stepsFor(mt.duration, mt.offset, opts.steps || 64) : 0;
    const perRest = opts.restSamples || 24;
    const s = trSegments(tissue, seq, opts);
    let z = opts.start ? opts.start.slice() : [1, tissue.F];
    const t = [], mzf = [], mzr = [], marks = [];
    let clock = 0;
    const push = (tt, zz) => { t.push(tt); mzf.push(zz[0]); mzr.push(zz[1]); };
    const ts = seq.ts == null ? 3e-3 : seq.ts;
    const rest = seq.tr - (mt ? mt.duration : 0) - ts;
    const restStep = relaxZ(tissue, rest / perRest);
    const waitStep = relaxZ(tissue, ts / 6);
    let pulseSteps = null;
    if (mt) {
      const { w1, dt } = pulseSamples({ ...mt, angle: mt.angle * b1 }, steps);
      const G = lineshape(opts.lineshape || 'superlorentzian', mt.offset, tissue.T2r);
      pulseSteps = { dt, list: Array.from(w1, (w) => expm(generator(tissue, w, mt.offset, Math.PI * w * w * G).map((v) => v * dt), 5)) };
    }
    for (let n = 0; n < nTR; n++) {
      const mark = { tr: n, before: z.slice() };
      push(clock, z);
      if (pulseSteps) {
        let v = [0, 0, z[0], z[1], 1];
        for (const P of pulseSteps.list) {
          const nv = [0, 0, 0, 0, 0];
          for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) nv[i] += P[i * 5 + j] * v[j];
          v = nv;
          clock += pulseSteps.dt;
          push(clock, [v[2], v[3]]);
        }
        z = [v[2], v[3]];
      }
      mark.afterPulse = z.slice();
      for (let i = 0; i < 6; i++) { z = apply3(waitStep, z); clock += ts / 6; push(clock, z); }
      mark.beforeExcitation = z.slice();
      mark.signal = z[0] * s.sinA;
      z = apply3(s.excite, z);
      push(clock, z);
      for (let i = 0; i < perRest; i++) { z = apply3(restStep, z); clock += rest / perRest; push(clock, z); }
      marks.push(mark);
    }
    return { t, mzf, mzr, marks };
  }

  /* Where the free pool's longitudinal magnetization goes during one steady-state TR, term by term
   * (dMzf/dt = R1f(1 - Mzf) [T1 recovery] - ω1 My [direct saturation of water by the pulse] + (kr Mzr - kf Mzf)
   * [exchange with the restricted pool]), integrated during the MT pulse and over the rest of the TR, plus the
   * excitation's loss. All as fractions of Mzf just before the MT pulse (the convention of MTsat's δ); they sum to 0. */
  function budget(tissue, seq, opts = {}) {
    const ss = steadyState(tissue, seq, opts);
    const b1 = seq.b1 == null ? 1 : seq.b1;
    const mt = seq.mt && seq.mt.angle > 0 ? seq.mt : null;
    const { R1f, F } = tissue;
    const kf = F > 0 ? tissue.kf : 0;
    const kr = F > 0 ? kf / F : 0;
    const z0 = ss.z[0];
    const out = { t1Pulse: 0, exPulse: 0, direct: 0, t1After: 0, exAfter: 0, excitation: 0 };
    let v = [0, 0, ss.z[0], ss.z[1], 1];
    if (mt) {
      const steps = stepsFor(mt.duration, mt.offset, opts.steps || 256);
      const { w1, dt } = pulseSamples({ ...mt, angle: mt.angle * b1 }, steps);
      const G = lineshape(opts.lineshape || 'superlorentzian', mt.offset, tissue.T2r);
      for (let i = 0; i < steps; i++) {
        const P = expm(generator(tissue, w1[i], mt.offset, Math.PI * w1[i] * w1[i] * G).map((x) => x * dt), 5);
        const nv = [0, 0, 0, 0, 0];
        for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) nv[r] += P[r * 5 + c] * v[c];
        // trapezoid on the step's end points
        const term = (s) => ({ t1: R1f * (1 - s[2]), ex: kr * s[3] - kf * s[2], dir: -w1[i] * s[1] });
        const a = term(v), b = term(nv);
        out.t1Pulse += 0.5 * (a.t1 + b.t1) * dt;
        out.exPulse += 0.5 * (a.ex + b.ex) * dt;
        out.direct += 0.5 * (a.dir + b.dir) * dt;
        v = nv;
      }
    }
    // after the pulse: z only (spoiled); integrate the wait, the excitation, then the rest
    const ts = seq.ts == null ? 3e-3 : seq.ts;
    const rest = seq.tr - (mt ? mt.duration : 0) - ts;
    let z = [v[2], v[3]];
    const freeRun = (tau, n) => {
      const step = relaxZ(tissue, tau / n);
      for (let i = 0; i < n; i++) {
        const nz = apply3(step, z);
        out.t1After += 0.5 * (R1f * (1 - z[0]) + R1f * (1 - nz[0])) * (tau / n);
        out.exAfter += 0.5 * ((kr * z[1] - kf * z[0]) + (kr * nz[1] - kf * nz[0])) * (tau / n);
        z = nz;
      }
    };
    freeRun(ts, 64);
    const a = seq.flipAngle * DEG * b1;
    out.excitation = -(1 - Math.cos(a)) * z[0];
    z = [z[0] * Math.cos(a), z[1]];
    freeRun(rest, 256);
    for (const k of Object.keys(out)) out[k] /= z0;
    out.closure = out.t1Pulse + out.exPulse + out.direct + out.t1After + out.exAfter + out.excitation; // ≈ 0
    out.netDropDuringPulse = (z0 - ss.afterPulse[0]) / z0;
    return out;
  }


  /* Continuous-wave irradiation (constant ω1 at one offset) from equilibrium for `on` seconds, then RF off for `off`
   * seconds: Mz of both pools sampled `n` times over the whole run (transverse magnetization included while on). */
  function cwEvolution(tissue, { w1, offset, on, off = 0, n = 200, lineshape: shape = 'superlorentzian' }) {
    const G = lineshape(shape, offset, tissue.T2r);
    const total = on + off, dt = total / n;
    const Pon = expm(generator(tissue, w1, offset, Math.PI * w1 * w1 * G).map((x) => x * dt), 5);
    const Poff = expm(generator(tissue, 0, offset, 0).map((x) => x * dt), 5);
    let v = [0, 0, 1, tissue.F, 1];
    const t = [0], mzf = [1], mzr = [tissue.F];
    for (let i = 1; i <= n; i++) {
      const P = i * dt <= on + 1e-12 ? Pon : Poff;
      const nv = [0, 0, 0, 0, 0];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) nv[r] += P[r * 5 + c] * v[c];
      v = nv;
      t.push(i * dt); mzf.push(v[2]); mzr.push(v[3]);
    }
    return { t, mzf, mzr };
  }


  /* qMT fit (Levenberg-Marquardt) of F, kf, T2f, T2r to normalized MT-SPGR data, as qMRLab's qMT-SPGR fit does,
   * but with this simulator as the forward model. R1f comes from the measured R1 through Eq. 6.6 (R1r = 1 s⁻¹);
   * the assumed B1 scales both pulses and the assumed B0 (Hz) shifts every offset. Parameters are fitted in log space
   * (positive), from `start` (default: a typical white matter voxel). Returns the parameters and the sum of squares. */
  const FIT_KEYS = ['F', 'kf', 'T2f', 'T2r'];
  function qmtForward(p, { protocol, R1meas, b1 = 1, b0 = 0, steps = 32 }) {
    const t = { F: p.F, kf: p.kf, T2f: p.T2f, T2r: p.T2r, R1r: 1, R1f: r1fFromMeasured(R1meas, p.F, p.kf, 1) };
    return protocol.map((seq) => normalizedSignal(t, { ...seq, b1, mt: { ...seq.mt, offset: seq.mt.offset + b0 } }, { steps }));
  }
  function fitQMT(data, opts) {
    const start = Object.assign({ F: 0.15, kf: 3, T2f: 0.03, T2r: 12e-6 }, opts.start || {});
    let x = FIT_KEYS.map((k) => Math.log(start[k]));
    const toP = (v) => Object.fromEntries(FIT_KEYS.map((k, i) => [k, Math.exp(v[i])]));
    const resid = (v) => { const m = qmtForward(toP(v), opts); return m.map((mi, i) => mi - data[i]); };
    const ss = (r) => r.reduce((a, b) => a + b * b, 0);
    let r = resid(x), cost = ss(r), lambda = 1e-2;
    const n = x.length, h = 1e-4;
    for (let it = 0; it < (opts.maxIter || 40); it++) {
      const J = [];
      for (let j = 0; j < n; j++) {
        const xp = x.slice(); xp[j] += h;
        const rp = resid(xp);
        J.push(rp.map((v, i) => (v - r[i]) / h));
      }
      // (JᵀJ + λ diag) δ = -Jᵀ r
      const A = new Float64Array(n * n), g = new Float64Array(n);
      for (let a = 0; a < n; a++) {
        for (let b = 0; b < n; b++) { let sum = 0; for (let i = 0; i < r.length; i++) sum += J[a][i] * J[b][i]; A[a * n + b] = sum; }
        let sg = 0; for (let i = 0; i < r.length; i++) sg += J[a][i] * r[i]; g[a] = -sg;
      }
      let improved = false;
      for (let tries = 0; tries < 8 && !improved; tries++) {
        const M = Float64Array.from(A);
        for (let a = 0; a < n; a++) M[a * n + a] += lambda * (A[a * n + a] + 1e-9);
        const d = solve(M, g, n);
        const xn = x.map((v, i) => v + Math.max(-1, Math.min(1, d[i])));
        const rn = resid(xn), cn = ss(rn);
        if (cn < cost) { x = xn; r = rn; improved = cost - cn < 1e-12 * cost ? 'flat' : true; cost = cn; lambda = Math.max(lambda / 3, 1e-6); }
        else lambda *= 4;
      }
      if (!improved || improved === 'flat') break;
    }
    return { ...toP(x), sse: cost, model: qmtForward(toP(x), opts) };
  }

  // ------------------------------------------------------------------ derived metrics

  function mtr(tissue, seq, opts) { return 100 * (1 - normalizedSignal(tissue, seq, opts)); }

  /* MTsat and R1 from three SPGR images (Helms 2008, the chapter's Eqs. 6.7-6.9; small-angle forms).
   * Angles in degrees (nominal; pass b1-scaled ones for a B1-corrected T1), TR in s. */
  function helms({ sMT, sPD, sT1, aMT, aPD, aT1, trMT, trPD, trT1 }) {
    const am = aMT * DEG, ap = aPD * DEG, at = aT1 * DEG;
    const R1 = 0.5 * ((sT1 * at) / trT1 - (sPD * ap) / trPD) / (sPD / ap - sT1 / at);
    const A = (sPD * sT1 * ((trPD * at) / ap - (trT1 * ap) / at)) / (trPD * sT1 * at - trT1 * sPD * ap);
    const delta = ((A * am) / sMT - 1) * R1 * trMT - (am * am) / 2;
    return { R1, T1: 1 / R1, A, mtsat: 100 * delta, delta };
  }

  // Empirical B1 correction of MTsat (Weiskopf 2013; Helms 2008): MTsat(1 - λ) / (1 - λ B1), λ = 0.4.
  function correctMTsatB1(mtsat, b1, lambda = 0.4) { return (mtsat * (1 - lambda)) / (1 - lambda * b1); }

  // SPGR steady state without MT (the chapter's Eq. 6.8), M0 = 1.
  function spgr(T1, aDeg, tr) {
    const a = aDeg * DEG, E = Math.exp(-tr / T1);
    return (Math.sin(a) * (1 - E)) / (1 - Math.cos(a) * E);
  }

  /* The full MTsat experiment on the two-pool model: MTw, PDw and T1w simulated (each in its own steady state),
   * then Eqs. 6.7-6.9. protocol: { mtw: seq, pdw: seq, t1w: seq } (seq as above; pdw and t1w without mt).
   * Returns the signals, MTR (from MTw and PDw), the Helms T1 and MTsat. */
  function mtsatExperiment(tissue, protocol, opts = {}) {
    const b1 = opts.b1 == null ? 1 : opts.b1;
    const run = (seq) => signal(tissue, { ...seq, b1 }, opts);
    const sMT = run(protocol.mtw), sPD = run({ ...protocol.pdw, mt: null }), sT1 = run({ ...protocol.t1w, mt: null });
    const aScale = opts.b1Known ? b1 : 1; // true: angles corrected with a (perfect) B1 map
    const h = helms({
      sMT, sPD, sT1,
      aMT: protocol.mtw.flipAngle * aScale, aPD: protocol.pdw.flipAngle * aScale, aT1: protocol.t1w.flipAngle * aScale,
      trMT: protocol.mtw.tr, trPD: protocol.pdw.tr, trT1: protocol.t1w.tr,
    });
    return { sMT, sPD, sT1, mtr: 100 * (1 - sMT / sPD), T1: h.T1, mtsat: h.mtsat, A: h.A };
  }

  // Apparent (measured, single-exponential) R1 of the two-pool system: the slower eigenvalue of the z-dynamics
  // (what an inversion recovery would fit), and its inverse, the chapter's Eq. 6.6: R1,f from R1,meas.
  function r1Observed(tissue) {
    const { R1f, R1r, F, kf } = tissue;
    const kr = F > 0 ? kf / F : 0;
    const a = R1f + kf, d = R1r + kr, b = kr, c = kf;
    const tr = a + d, det = a * d - b * c;
    return (tr - Math.sqrt(tr * tr - 4 * det)) / 2;
  }
  function r1fFromMeasured(R1meas, F, kf, R1r = 1) {
    return R1meas - (kf * (R1r - R1meas)) / (R1r - R1meas + kf / F);
  }

  // ------------------------------------------------------------------ protocols and tissues of the chapter

  const TISSUES = { // Sled & Pike 2001 at 1.5 T (Table 6.3); kf in s⁻¹, T2 in s
    gm: { name: 'Cortical GM', F: 0.072, kf: 2.4, R1f: 0.93, R1r: 1, T2f: 0.056, T2r: 11.1e-6 },
    wm: { name: 'Healthy WM', F: 0.161, kf: 4.3, R1f: 1.8, R1r: 1, T2f: 0.037, T2r: 12.3e-6 },
    nawm: { name: 'NAWM', F: 0.15, kf: 4.9, R1f: 1.78, R1r: 1, T2f: 0.038, T2r: 11.4e-6 },
    early: { name: 'Early MS lesion', F: 0.12, kf: 3.6, R1f: 1.52, R1r: 1, T2f: 0.043, T2r: 10.3e-6 },
    late: { name: 'Late MS lesion', F: 0.094, kf: 2.7, R1f: 1.26, R1r: 1, T2f: 0.052, T2r: 10.9e-6 },
  };

  const mtSPGR = (fa, trMs, offset, shape, durMs, angle) => ({
    tr: trMs / 1000, flipAngle: fa, mt: { shape, duration: durMs / 1000, angle, offset },
  });
  const MTR_PROTOCOLS = { // Table 6.2
    brownSiemens: { name: 'Brown 2013 · Siemens', ...mtSPGR(15, 30, 1500, 'gaussian', 7.68, 500) },
    brownPhilips: { name: 'Brown 2013 · Philips', ...mtSPGR(15, 47, 1100, 'sincgauss', 15, 620) },
    karakuzuGE: { name: 'Karakuzu 2022 · GE', ...mtSPGR(6, 32, 1200, 'fermi', 8, 540) },
    karakuzuSiemens: { name: 'Karakuzu 2022 · Siemens', ...mtSPGR(6, 32, 1200, 'gaussian', 10, 540) },
  };
  const spgrOnly = (fa, trMs) => ({ tr: trMs / 1000, flipAngle: fa, mt: null });
  const MTSAT_PROTOCOLS = { // Table 6.4 (Campbell 2018 reports no pulse shape or duration: Helms' are used)
    helms2008: { name: 'Helms 2008', mtw: mtSPGR(5, 25, 2200, 'gaussian', 12.8, 540), pdw: spgrOnly(5, 25), t1w: spgrOnly(15, 11) },
    weiskopf2013: { name: 'Weiskopf 2013', mtw: mtSPGR(6, 23.7, 2000, 'gaussian', 4, 220), pdw: spgrOnly(6, 23.7), t1w: spgrOnly(20, 18.7) },
    campbell2018: { name: 'Campbell 2018', mtw: mtSPGR(5, 30, 2200, 'gaussian', 12.8, 540), pdw: spgrOnly(5, 30), t1w: spgrOnly(15, 11) },
    karakuzuGE: { name: 'Karakuzu 2022 · GE', mtw: mtSPGR(6, 32, 1200, 'fermi', 8, 540), pdw: spgrOnly(6, 32), t1w: spgrOnly(20, 18) },
    karakuzuSiemens: { name: 'Karakuzu 2022 · Siemens', mtw: mtSPGR(6, 32, 1200, 'gaussian', 10, 540), pdw: spgrOnly(6, 32), t1w: spgrOnly(20, 18) },
    york2022: { name: 'York 2022', mtw: mtSPGR(5, 30, 1200, 'gaussian', 9.984, 500), pdw: spgrOnly(5, 30), t1w: spgrOnly(18, 15) },
  };

  // qMRLab's default qMT-SPGR protocol (the 2013 dataset's): 7°, TR 25 ms, Gauss-Hann 10.24 ms MT pulse,
  // 142° and 426° at 5 offsets, in the data's order.
  const QMT_OFFSETS = [443, 1088, 2732, 6862, 17235];
  const QMT_ANGLES = [142, 426];
  const QMT_PROTOCOL = QMT_OFFSETS.flatMap((offset) => QMT_ANGLES.map((angle) => ({
    tr: 0.025, flipAngle: 7, mt: { shape: 'gausshann', duration: 0.01024, angle, offset },
  })));

  return {
    lineshape, gaussianG, lorentzianG, superLorentzianG, superLorentzianRaw, envelope, pulseSamples,
    expm, matMul, solve, stepsFor, generator, cwEvolution, pulsePropagator, trSegments, steadyState, signal, normalizedSignal, trajectory,
    budget, qmtForward, fitQMT, mtr, helms, correctMTsatB1, spgr, mtsatExperiment, r1Observed, r1fFromMeasured,
    TISSUES, MTR_PROTOCOLS, MTSAT_PROTOCOLS, QMT_PROTOCOL, QMT_OFFSETS, QMT_ANGLES,
  };
});
