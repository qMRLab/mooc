/* Bloch–Siegert exercise: the physics. An off-resonance Fermi pulse acting on spins, solved exactly.
 *
 * Conventions follow the T2 lab (GBM-MRI T2 deck, js/exn.js): rotations are right-handed about the field,
 * dM/dt = Ω × M with Ω = γB in rad/s, and the Larmor frame turns with the on-resonance spins. In that frame the
 * RF, Δ above resonance, is a B1 vector turning at +Δ about z; a spin δ off resonance has Ω_z = δ.
 * In the frame turning with the RF the field is static apart from its envelope: Ω_eff = (ω1(t), 0, δ − Δ). Each
 * step is an exact rotation about Ω_eff (the envelope changes slowly), and the Larmor-frame vector is that one
 * turned back by +Δt about z. Relaxation is neglected over the 8 ms pulse. */
(function (root) {
  'use strict';
  const GAMMA_BAR = 4257.7;          // Hz/G
  const W1_PER_G = 2 * Math.PI * GAMMA_BAR;   // rad/s per gauss
  const PULSE = { T: 8e-3, t0: 2.85e-3, a: 0.25e-3 };   // K_BS = 74.0 rad/G² at 4 kHz (Sacolick 2010: 74.01). Fermi: 1 / (1 + exp((|t − T/2| − t0) / a))
  const DT = 5e-6;

  const fermi = (t) => 1 / (1 + Math.exp((Math.abs(t - PULSE.T / 2) - PULSE.t0) / PULSE.a));

  // Right-handed rotation of v by angle a about the unit axis n (Rodrigues).
  function rotate(v, n, a) {
    const c = Math.cos(a), s = Math.sin(a), d = n[0] * v[0] + n[1] * v[1] + n[2] * v[2];
    return [
      v[0] * c + (n[1] * v[2] - n[2] * v[1]) * s + n[0] * d * (1 - c),
      v[1] * c + (n[2] * v[0] - n[0] * v[2]) * s + n[1] * d * (1 - c),
      v[2] * c + (n[0] * v[1] - n[1] * v[0]) * s + n[2] * d * (1 - c),
    ];
  }
  const rotZ = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];

  // ∫ b(t)² dt and ∫ b(t) dt of the normalised envelope (midpoint rule on the simulation grid).
  const N = Math.round(PULSE.T / DT);
  let INT_B2 = 0, INT_B = 0;
  for (let k = 0; k < N; k++) { const b = fermi((k + 0.5) * DT); INT_B2 += b * b * DT; INT_B += b * DT; }
  // K_BS in rad/G² for an offset in Hz: φ_BS = ∫ ω1² / (2 ω_off) dt = K_BS · B1².
  const kbs = (offHz) => (W1_PER_G * W1_PER_G * INT_B2) / (2 * 2 * Math.PI * offHz);

  /* One pulse. b1 in gauss (peak), offHz = RF offset Δ/2π, dHz = the spin's own offset δ/2π, m0 its start.
   * Returns per step k (k = 0 … N, t = k·DT): Larmor-frame M, RF-frame M, the envelope, the unwrapped transverse
   * phase in the Larmor frame (relative to the start) and the first-order prediction ∫ ω1²/2Δ dt (sign included). */
  function simulate({ b1, offHz, dHz = 0, m0 = [0, 1, 0] }) {
    const D = 2 * Math.PI * offHz, d = 2 * Math.PI * dHz, w1max = W1_PER_G * b1;
    const t = new Float64Array(N + 1), env = new Float64Array(N + 1), phase = new Float64Array(N + 1), pred = new Float64Array(N + 1);
    const lar = [m0.slice()], rf = [m0.slice()];
    let m = m0.slice(), ang = Math.atan2(m0[1], m0[0]), unwrapped = 0, p = 0;
    for (let k = 0; k < N; k++) {
      const tm = (k + 0.5) * DT, w1 = w1max * fermi(tm), oz = d - D, mag = Math.hypot(w1, oz);
      if (mag > 0) m = rotate(m, [w1 / mag, 0, oz / mag], mag * DT);
      const L = rotZ(m, D * (k + 1) * DT);
      const a = Math.atan2(L[1], L[0]);
      let da = a - ang; da -= 2 * Math.PI * Math.round(da / (2 * Math.PI));
      if (Math.hypot(L[0], L[1]) > 1e-6) { unwrapped += da; ang = a; }
      p += (D !== 0 ? -(w1 * w1) / (2 * (D - d)) : 0) * DT;   // first order: the spin shifts away from the RF
      t[k + 1] = (k + 1) * DT; env[k + 1] = fermi((k + 1) * DT); phase[k + 1] = unwrapped; pred[k + 1] = p;
      lar.push(L); rf.push(m.slice());
    }
    env[0] = fermi(0);
    return { t, env, phase, pred, lar, rf, w1max, D, d, n: N + 1 };
  }

  root.BS = { GAMMA_BAR, W1_PER_G, PULSE, DT, N, INT_B, INT_B2, fermi, rotate, rotZ, kbs, simulate };
  if (typeof module !== 'undefined') module.exports = root.BS;
})(typeof window !== 'undefined' ? window : globalThis);
