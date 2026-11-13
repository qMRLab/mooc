// The two-pool simulator (js/mt-sim.js) against the chapter's qMRLab results and the dataset. Run with `npm test`.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const S = require('../js/mt-sim.js');

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (± ${tol})`);
// Healthy WM (Sled 2001) with T1 = 1 s, as in the chapter's Appendix C simulations.
const WM1 = { F: 0.161, kf: 4.3, R1f: 1, R1r: 1, T2f: 0.037, T2r: 12.3e-6 };
const KS = S.MTSAT_PROTOCOLS.karakuzuSiemens;

test('Appendix C, Simulation 1: MTR, MTsat and T1 as qMRLab (58.98 %, 5.34 %, 1.01 s)', () => {
  const n = S.normalizedSignal(WM1, KS.mtw);
  near(100 * (1 - n), 58.98, 1.2, 'MTR');
  // the chapter's pipeline: PDw = 1 and T1w from the one-pool SPGR equation with T1 = 1 s
  const h = S.helms({ sMT: n, sPD: 1, sT1: S.spgr(1, 20, 0.018) / S.spgr(1, 6, 0.032), aMT: 6, aPD: 6, aT1: 20, trMT: 0.032, trPD: 0.032, trT1: 0.018 });
  near(h.mtsat, 5.34, 0.3, 'MTsat');
  near(h.T1, 1.01, 0.005, 'T1');
});

test('Appendix C, Simulation 2: net Mz drop across the MT pulse in the steady state (0.314 %)', () => {
  const ss = S.steadyState(WM1, KS.mtw);
  near(100 * (1 - ss.afterPulse[0] / ss.z[0]), 0.314, 0.02, 'drop');
});

test('Figure 6.9: MTR of five tissues for four vendor protocols, within 1.3 points of qMRLab', () => {
  // the chapter's data file (06-MT-02-MTR/fig_1.mat), in %
  const qmrlab = {
    brownSiemens: [28.8, 36.1, 35.6, 31.9, 29.5], brownPhilips: [37.7, 44.0, 43.6, 40.2, 37.7],
    karakuzuSiemens: [43.5, 46.7, 46.3, 43.3, 41.8], karakuzuGE: [49.4, 52.0, 52.0, 49.0, 47.4],
  };
  const tissues = ['gm', 'wm', 'nawm', 'early', 'late'];
  for (const [p, vals] of Object.entries(qmrlab)) {
    tissues.forEach((t, i) => near(S.mtr(S.TISSUES[t], S.MTR_PROTOCOLS[p]), vals[i], 1.3, `${p} ${t}`));
  }
});

test('the TR budget closes, and its MT losses match Helms\' MTsat from the same images', () => {
  const b = S.budget(WM1, KS.mtw);
  near(b.closure, 0, 1e-5, 'closure');
  near(100 * b.netDropDuringPulse, 0.318, 0.01, 'net drop');
  const loss = -100 * (b.exPulse + b.exAfter + b.direct);
  const sMT = S.signal(WM1, KS.mtw), sPD = S.signal(WM1, { ...KS.mtw, mt: null });
  const a = 6 * Math.PI / 180, R1 = S.r1Observed(WM1);
  const helms = 100 * (R1 * 0.032 + a * a / 2) * (sPD / sMT - 1);
  near(loss, helms, 0.5, 'MT loss vs Helms');
  assert.ok(-b.exAfter > -b.exPulse, 'more exchange loss after the pulse than during it');
});

test('pulse stepping: no spurious direct saturation at any offset (aliasing of the sampled pulse)', () => {
  const t = { ...S.TISSUES.wm, R1f: 1.1 };
  const offs = Array.from({ length: 30 }, (_, i) => 10 ** (Math.log10(250) + i * (Math.log10(40000) - Math.log10(250)) / 29));
  for (const [shape, duration, angle] of [['gausshann', 0.01024, 426], ['gaussian', 0.01, 540], ['fermi', 0.008, 540]]) {
    const seq = (o) => ({ tr: 0.03, flipAngle: 7, mt: { shape, duration, angle, offset: o } });
    for (const o of offs) near(S.normalizedSignal(t, seq(o), { steps: 32 }), S.normalizedSignal(t, seq(o), { steps: 2048 }), 4e-3, `${shape} at ${o.toFixed(0)} Hz`);
  }
});

test('no restricted pool, no exchange; Eq. 6.6 inverts the apparent R1', () => {
  const water = { ...WM1, F: 0 };
  const r = S.cwEvolution(water, { w1: 2 * Math.PI * 100, offset: 2000, on: 1, off: 3, n: 40 });
  // after the RF (t = 1 s), water alone recovers with R1f only: 1 - (1 - Mz(1 s)) e^(-R1f · 3 s)
  near(r.mzf[40], 1 - (1 - r.mzf[10]) * Math.exp(-WM1.R1f * 3), 1e-4, 'water recovers with T1 only');
  near(S.r1fFromMeasured(S.r1Observed(S.TISSUES.wm), 0.161, 4.3, 1), 1.8, 1e-6, 'R1f');
});

test('the dataset: qMRLab\'s fitted parameters reproduce the measured MT data', () => {
  global.window = {};
  require(path.join(__dirname, '..', 'js', 'data', 'brain.js'));
  const B = global.window.MTBrain;
  const vox = [];
  for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) if (B.mask[y][x] === '1') vox.push([y, x]);
  assert.equal(vox.length, 4101);
  const errs = [];
  for (let k = 0; k < 120; k++) {
    const [y, x] = vox[(k * 7919) % vox.length];
    const p = { F: B.F[y][x], kf: B.kf[y][x], T2f: B.T2f[y][x] / 1e3, T2r: B.T2r[y][x] / 1e6 };
    const m = S.qmtForward(p, { protocol: S.QMT_PROTOCOL, R1meas: B.R1[y][x], b1: B.B1[y][x], b0: B.B0[y][x] });
    m.forEach((v, i) => errs.push(v - B.mt[i][y][x]));
  }
  errs.sort((a, b) => a - b);
  near(errs[Math.floor(errs.length / 2)], 0, 0.005, 'median error (bias)');
  const abs = errs.map(Math.abs).sort((a, b) => a - b);
  assert.ok(abs[Math.floor(abs.length / 2)] < 0.02, `median absolute error ${abs[Math.floor(abs.length / 2)]}`);
});

test('fitQMT recovers the parameters of noiseless data', () => {
  const truth = { F: 0.2, kf: 2, T2f: 0.025, T2r: 12e-6 };
  const opts = { protocol: S.QMT_PROTOCOL, R1meas: 1.05, b1: 0.95, b0: 10 };
  const f = S.fitQMT(S.qmtForward(truth, opts), { ...opts, start: { F: 0.12, kf: 3, T2f: 0.04, T2r: 15e-6 }, maxIter: 80 });
  for (const k of Object.keys(truth)) near(f[k] / truth[k], 1, 0.03, k);
});
