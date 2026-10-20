/* The maths behind the exercise solutions. Times in ms.
 * Pure functions only: exported for Node tests, and as window.T2Solve in the browser. */
(function (root, factory) {
  const solve = factory();
  if (typeof module === 'object' && module.exports) module.exports = solve;
  else root.T2Solve = solve;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------------------------------------------------------------- mono-exponential decay

  // Eq. 3.1 / 3.2 with S0 = 1: the curves of Figures 3.3 and 3.5.
  function decay(te, t2) {
    return Math.exp(-te / t2);
  }

  // TE at which the signal has dropped by `drop` (0.5 for 50%): e^(−TE/T2) = 1 − drop.
  function teForDrop(t2, drop) {
    return -t2 * Math.log(1 - drop);
  }

  // TE that maximizes e^(−TE/T2a) − e^(−TE/T2b): setting the derivative to zero.
  function maxContrastTE(t2a, t2b) {
    return (t2a * t2b * Math.log(t2a / t2b)) / (t2a - t2b);
  }

  // |e^(−TE/T2a) − e^(−TE/T2b)|: the contrast between two tissues on a T2- (or T2*-) weighted image.
  function contrast(te, t2a, t2b) {
    return Math.abs(decay(te, t2a) - decay(te, t2b));
  }

  // First x at which a sampled, decreasing curve falls to `level`, by linear interpolation
  // between samples (how a reading by hovering on the book figure is made). NaN if it never does.
  function crossing(xs, ys, level) {
    for (let i = 1; i < xs.length; i++) {
      if (ys[i - 1] >= level && ys[i] <= level) {
        const f = ys[i - 1] === ys[i] ? 0 : (ys[i - 1] - level) / (ys[i - 1] - ys[i]);
        return xs[i - 1] + f * (xs[i] - xs[i - 1]);
      }
    }
    return NaN;
  }

  // Least-squares fit of Eq. 3.2, S = S0 e^(−TE/T2), with S0 and T2 free. For each T2 the best S0
  // is linear; T2 itself comes from a golden-section search on the remaining 1-D problem.
  function fitMono(tes, ys, lo = 0.1, hi = 5000) {
    const best = (t2) => {
      const e = tes.map((t) => decay(t, t2));
      const s0 = e.reduce((s, v, i) => s + v * ys[i], 0) / e.reduce((s, v) => s + v * v, 0);
      return { s0, sse: e.reduce((s, v, i) => s + (s0 * v - ys[i]) ** 2, 0) };
    };
    // Search on log T2, so short and long T2 values are found equally well.
    const g = (Math.sqrt(5) - 1) / 2;
    let a = Math.log(lo);
    let b = Math.log(hi);
    for (let i = 0; i < 100; i++) {
      const x1 = b - g * (b - a);
      const x2 = a + g * (b - a);
      if (best(Math.exp(x1)).sse < best(Math.exp(x2)).sse) b = x2;
      else a = x1;
    }
    const t2 = Math.exp((a + b) / 2);
    return Object.assign({ t2 }, best(t2));
  }

  // ---------------------------------------------------------------- multi-exponential

  // Eq. 3.5 with two compartments: a fraction `fmw` of myelin water, the rest intra/extracellular water.
  function biexp(te, t2mw, t2iew, fmw) {
    return fmw * decay(te, t2mw) + (1 - fmw) * decay(te, t2iew);
  }

  // Eq. 3.8: the share of the signal at TE that comes from myelin water.
  function mwf(te, t2mw, t2iew, fmw = 0.5) {
    const mw = fmw * decay(te, t2mw);
    return mw / (mw + (1 - fmw) * decay(te, t2iew));
  }

  // ---------------------------------------------------------------- noise and SNR

  // SNR at TE when the SNR at TE = 0 is snr0: the noise stays the same, the signal decays.
  function snrAt(te, t2, snr0) {
    return snr0 * decay(te, t2);
  }

  // Longest TE at which the SNR is still at least snrMin.
  function maxUsefulTE(t2, snr0, snrMin) {
    return t2 * Math.log(snr0 / snrMin);
  }

  // Seeded uniform random numbers (mulberry32), so a slide shows the same noise every time.
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Standard normal numbers (Box–Muller).
  function gaussian(seed) {
    const u = rng(seed);
    return () => Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u());
  }

  // As in the notebook of Figure 3.4: the decay at each TE plus Gaussian noise of SD 1/snr0
  // (the noise is set relative to the signal at TE = 0), repeated `trials` times. The measured SNR
  // at each TE is the mean signal over the noise SD.
  function simulateSNR(tes, t2, snr0, trials, seed = 1) {
    const randn = gaussian(seed);
    const sigma = 1 / snr0;
    return tes.map((te) => {
      const s = decay(te, t2);
      let sum = 0;
      let sum2 = 0;
      for (let k = 0; k < trials; k++) {
        const v = s + sigma * randn();
        sum += v;
        sum2 += v * v;
      }
      const mean = sum / trials;
      const sd = Math.sqrt(Math.max(0, sum2 / trials - mean * mean) * (trials / (trials - 1)));
      return { te, signal: s, mean, sd, snr: mean / sd, truth: snrAt(te, t2, snr0) };
    });
  }

  // ---------------------------------------------------------------- inputs

  function parsePositive(text) {
    const s = String(text).trim();
    const value = Number(s);
    if (s === '' || !Number.isFinite(value) || value <= 0) return { ok: false, error: `“${s}” is not a positive number.` };
    return { ok: true, value };
  }

  // "25, 50 75;100" → [25, 50, 75, 100]
  function parseList(text) {
    const parts = String(text).split(/[\s,;]+/).filter(Boolean);
    if (!parts.length) return { ok: false, error: 'Enter at least one value.' };
    const value = [];
    for (const p of parts) {
      const r = parsePositive(p);
      if (!r.ok) return r;
      value.push(r.value);
    }
    return { ok: true, value };
  }

  return {
    decay, teForDrop, maxContrastTE, contrast, crossing, fitMono,
    biexp, mwf,
    snrAt, maxUsefulTE, rng, gaussian, simulateSNR,
    parsePositive, parseList,
  };
});
