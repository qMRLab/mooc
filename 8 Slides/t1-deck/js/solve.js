/* The maths behind the exercise solutions. Times in ms, angles in degrees.
 * Pure functions only: exported for Node tests, and as window.T1Solve in the browser. */
(function (root, factory) {
  const solve = factory();
  if (typeof module === 'object' && module.exports) module.exports = solve;
  else root.T1Solve = solve;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const RAD = Math.PI / 180;

  // ---------------------------------------------------------------- inversion recovery

  // Eq. 2.3 (long-TR approximation, ideal inversion), with C = 1: the curves of Figure 2.2.
  function irLongTR(ti, t1) {
    return 1 - 2 * Math.exp(-ti / t1);
  }

  // Zero of Eq. 2.3: TI = T1 ln 2.
  function irNullLongTR(t1) {
    return t1 * Math.LN2;
  }

  // Zero of the general equation (Eq. 2.1 with ideal pulses): 1 − 2e^(−TI/T1) + e^(−TR/T1) = 0.
  function irNullGeneral(t1, tr) {
    return t1 * Math.log(2 / (1 + Math.exp(-tr / t1)));
  }

  // TI where |Mz| of two tissues is equal, between their nulls: e^(−TI/T1a) + e^(−TI/T1b) = 1.
  function irMagnitudeCrossing(t1a, t1b) {
    let lo = Math.min(irNullLongTR(t1a), irNullLongTR(t1b));
    let hi = Math.max(irNullLongTR(t1a), irNullLongTR(t1b));
    const f = (ti) => Math.exp(-ti / t1a) + Math.exp(-ti / t1b) - 1;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (f(lo) * f(mid) <= 0) hi = mid;
      else lo = mid;
    }
    return (lo + hi) / 2;
  }

  // TI that maximizes Mz(a) − Mz(b) for Eq. 2.3: d/dTI [e^(−TI/T1b) − e^(−TI/T1a)] = 0.
  function irMaxContrastTI(t1a, t1b) {
    return (t1a * t1b * Math.log(t1b / t1a)) / (t1b - t1a);
  }

  // ---------------------------------------------------------------- spoiled gradient echo

  // Eq. 2.6: the Ernst angle.
  function ernst(tr, t1) {
    return Math.acos(Math.exp(-tr / t1)) / RAD;
  }

  // Eq. 2.5 with M0 = 1: steady-state SPGR signal.
  function spgr(theta, tr, t1) {
    const e = Math.exp(-tr / t1);
    const a = theta * RAD;
    return (Math.sin(a) * (1 - e)) / (1 - Math.cos(a) * e);
  }

  // Deoni, Rutt & Peters (2003): the two angles whose signal is a fraction f (≈ 0.71) of the
  // Ernst signal. Closed form from solving spgr(θ) = f · spgr(θE) for cos θ.
  function deoniPair(tr, t1, f = 0.71) {
    const e = Math.exp(-tr / t1);
    const d = 1 - e * e * (1 - f * f);
    const r = (1 - e * e) * Math.sqrt(1 - f * f);
    return { low: Math.acos((f * f * e + r) / d) / RAD, high: Math.acos((f * f * e - r) / d) / RAD };
  }

  // Angle that maximizes spgr(·, T1a) − spgr(·, T1b), found by golden-section search on (0°, 90°).
  function spgrMaxContrastAngle(tr, t1a, t1b) {
    const g = (Math.sqrt(5) - 1) / 2;
    const c = (a) => -Math.abs(spgr(a, tr, t1a) - spgr(a, tr, t1b));
    let lo = 0.01;
    let hi = 90;
    for (let i = 0; i < 80; i++) {
      const x1 = hi - g * (hi - lo);
      const x2 = lo + g * (hi - lo);
      if (c(x1) < c(x2)) hi = x2;
      else lo = x1;
    }
    return (lo + hi) / 2;
  }

  // ---------------------------------------------------------------- fitting and inputs

  // Least squares for y = k·x (a line through the origin).
  function fitThroughOrigin(xs, ys) {
    if (!xs.length || xs.length !== ys.length) return { ok: false, error: 'Enter a value for each tissue.' };
    const sxx = xs.reduce((s, x) => s + x * x, 0);
    if (!(sxx > 0)) return { ok: false, error: 'The T₁ values must not all be zero.' };
    const k = xs.reduce((s, x, i) => s + x * ys[i], 0) / sxx;
    const mean = ys.reduce((s, y) => s + y, 0) / ys.length;
    const ssRes = ys.reduce((s, y, i) => s + (y - k * xs[i]) ** 2, 0);
    const ssTot = ys.reduce((s, y) => s + (y - mean) ** 2, 0);
    return { ok: true, k, r2: ssTot > 0 ? 1 - ssRes / ssTot : 1 };
  }

  function parsePositive(text) {
    const s = String(text).trim();
    const value = Number(s);
    if (s === '' || !Number.isFinite(value) || value <= 0) return { ok: false, error: `“${s}” is not a positive number.` };
    return { ok: true, value };
  }

  // "100, 300 600;900" → [100, 300, 600, 900]
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
    irLongTR, irNullLongTR, irNullGeneral, irMagnitudeCrossing, irMaxContrastTI,
    ernst, spgr, deoniPair, spgrMaxContrastAngle,
    fitThroughOrigin, parsePositive, parseList,
  };
});
