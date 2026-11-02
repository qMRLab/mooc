/* Shared VFA / AFI simulation for Exercise 4-5 (vfa-place.js, vfa-noise.js). Angles in degrees, times in ms.
 * model: SPGR signal / A, S = sin θ (1 − E1)/(1 − E1 cos θ), θ = B1·α, E1 = e^(−TR/T1).
 * fit: least squares on A, T1, B1 (A in closed form for each B1, T1, or fixed at o.a if given): a grid over B1 (linear) and
 *   T1 (log), then Nelder–Mead in (B1, ln T1), within [b1lo, b1hi] and [t1lo, t1hi]. With b1lo = b1hi, B1 is fixed (a B1 map).
 * evenAngles(n): n angles evenly spaced from 3° to 90°, rounded to whole degrees (#vfa-noise-check, and #vfa-fit's default).
 * afi: the two AFI signals / A for TR1, TR2 (Yarnykh 2007, ideal spoiling), and afiB1: B1 from their ratio,
 *   cos θ = (r n − 1)/(n − r), r = S2/S1, n = TR2/TR1 (TRs ≪ T1).
 * rng / gauss: a small seeded generator and a normal draw. */
window.VFASIM = (function () {
  'use strict';
  const DEG = Math.PI / 180;
  const model = (al, b1, t1, tr) => { const th = al * DEG * b1, e = Math.exp(-tr / t1); return Math.abs(Math.sin(th)) * (1 - e) / (1 - e * Math.cos(th)); };
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

  function fit(al, y, tr, o) {   // → { b1, t1, a }
    const b1lo = o.b1lo, b1hi = o.b1hi, t1lo = o.t1lo || 100, t1hi = o.t1hi || 10000, n = al.length, m = new Array(n);
    const cost = (b, t) => {
      let sy = 0, ss = 0; for (let i = 0; i < n; i++) { m[i] = model(al[i], b, t, tr); sy += m[i] * y[i]; ss += m[i] * m[i]; }
      const a = o.a != null ? o.a : ss > 0 ? Math.max(0, sy / ss) : 0; let e = 0; for (let i = 0; i < n; i++) e += (y[i] - a * m[i]) ** 2; return [e, a];
    };
    const NB = b1hi > b1lo ? 26 : 1, NT = 36; let bb = b1lo, bt = 1000, be = Infinity;
    for (let i = 0; i < NB; i++) { const b = NB > 1 ? b1lo + (b1hi - b1lo) * i / (NB - 1) : b1lo;
      for (let j = 0; j < NT; j++) { const t = t1lo * (t1hi / t1lo) ** (j / (NT - 1)), e = cost(b, t)[0]; if (e < be) { be = e; bb = b; bt = t; } } }
    const LT0 = Math.log(t1lo), LT1 = Math.log(t1hi);
    if (NB === 1) {   // B1 fixed: golden-section on ln T1 around the grid minimum
      const step = (LT1 - LT0) / (NT - 1); let lo = Math.max(LT0, Math.log(bt) - step), hi = Math.min(LT1, Math.log(bt) + step);
      const g = (Math.sqrt(5) - 1) / 2; let c = hi - g * (hi - lo), d = lo + g * (hi - lo), fc = cost(bb, Math.exp(c))[0], fd = cost(bb, Math.exp(d))[0];
      for (let k = 0; k < 60; k++) { if (fc < fd) { hi = d; d = c; fd = fc; c = hi - g * (hi - lo); fc = cost(bb, Math.exp(c))[0]; } else { lo = c; c = d; fc = fd; d = lo + g * (hi - lo); fd = cost(bb, Math.exp(d))[0]; } }
      const t = Math.exp((lo + hi) / 2); return { b1: bb, t1: t, a: cost(bb, t)[1] };
    }
    const clamp = (p) => [Math.min(b1hi, Math.max(b1lo, p[0])), Math.min(LT1, Math.max(LT0, p[1]))];
    const pt = (p) => { p = clamp(p); return { p, v: cost(p[0], Math.exp(p[1]))[0] }; };
    const S = [pt([bb, Math.log(bt)]), pt([bb + 0.02, Math.log(bt)]), pt([bb, Math.log(bt) + 0.07])];
    const along = (c, w, k) => pt([c[0] + k * (w[0] - c[0]), c[1] + k * (w[1] - c[1])]);
    for (let k = 0; k < 150; k++) {
      S.sort((a, b) => a.v - b.v);
      const c = [(S[0].p[0] + S[1].p[0]) / 2, (S[0].p[1] + S[1].p[1]) / 2], w = S[2].p, r = along(c, w, -1);
      if (r.v < S[0].v) { const e = along(c, w, -2); S[2] = e.v < r.v ? e : r; }
      else if (r.v < S[1].v) S[2] = r;
      else { const h = along(c, w, 0.5); if (h.v < S[2].v) S[2] = h; else for (let i = 1; i < 3; i++) S[i] = along(S[0].p, S[i].p, 0.5); }
    }
    S.sort((a, b) => a.v - b.v);
    const b = S[0].p[0], t = Math.exp(S[0].p[1]); return { b1: b, t1: t, a: cost(b, t)[1] };
  }

  function afi(al, b1, t1, tr1, tr2) {
    const th = al * DEG * b1, c = Math.cos(th), s = Math.sin(th), e1 = Math.exp(-tr1 / t1), e2 = Math.exp(-tr2 / t1), d = 1 - e1 * e2 * c * c;
    return [s * (1 - e2 + (1 - e1) * e2 * c) / d, s * (1 - e1 + (1 - e2) * e1 * c) / d];
  }
  function afiB1(s1, s2, al, n) { const r = s2 / s1, c = Math.max(-1, Math.min(1, (r * n - 1) / (n - r))); return Math.acos(c) / DEG / al; }

  const evenAngles = (n) => Array.from({ length: n }, (_, i) => Math.round(3 + (87 * i) / Math.max(1, n - 1)));

  return { DEG, model, rng, gauss, fit, afi, afiB1, evenAngles };
})();
