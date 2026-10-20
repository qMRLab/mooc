// The maths behind the exercise solutions. Run with `npm test`.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const solve = require('../js/solve.js');

const near = (actual, expected, tol, what) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${what}: ${actual} is not within ${tol} of ${expected}`);

// The book's published figures, as the exercise pages load them.
function figure(label) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'figures', `${label}.js`), 'utf8'), ctx);
  return ctx.window.T2Figures[label];
}

test('Figure 3.3 is Eq. 3.1 with the T2 and T2* values of its legend', () => {
  const fig = figure('t2Plot2');
  [109.77, 96.07, 67.63, 48.48].forEach((t2, i) => {
    const t = fig.data[i];
    t.x.forEach((te, k) => near(t.y[k], solve.decay(te, t2), 1e-6, `trace ${i} at ${te} ms`));
  });
});

test('best WM/GM contrast: TE ≈ 103 ms for T2, 57 ms for T2* (Ex. 1a–b)', () => {
  const t2 = solve.maxContrastTE(109.77, 96.07);
  const t2s = solve.maxContrastTE(67.63, 48.48);
  near(t2, 102.6, 0.1, 'T2');
  near(t2s, 57.0, 0.1, 'T2*');
  // It is a maximum, and the formula is symmetric in the two tissues.
  for (const d of [-5, 5]) assert.ok(solve.contrast(t2 + d, 109.77, 96.07) < solve.contrast(t2, 109.77, 96.07));
  near(solve.maxContrastTE(96.07, 109.77), t2, 1e-9, 'symmetric');
  near(solve.contrast(t2, 109.77, 96.07), 0.049, 0.001, 'T2 peak contrast');
  near(solve.contrast(t2s, 67.63, 48.48), 0.122, 0.001, 'T2* peak contrast');
});

test('of Figure 3.1’s TEs, 128 ms gives 97% of the best contrast (Ex. 1c)', () => {
  const peak = solve.contrast(solve.maxContrastTE(109.77, 96.07), 109.77, 96.07);
  const share = [12.8, 128, 256, 384].map((te) => solve.contrast(te, 109.77, 96.07) / peak);
  near(share[1], 0.97, 0.005, '128 ms');
  assert.equal(share.indexOf(Math.max(...share)), 1);
});

test('drops of 50%, 63% and 90% happen at 0.69, 0.99 and 2.3 T2 (Ex. 2a–b)', () => {
  near(solve.teForDrop(100, 0.5), 100 * Math.LN2, 1e-9, '50%');
  near(solve.teForDrop(100, 1 - Math.exp(-1)), 100, 1e-9, '1/e');
  near(solve.teForDrop(100, 0.9), 100 * Math.LN10, 1e-9, '90%');
});

test('readings off Figure 3.5: MW 13/19/44 ms, IEW 84/121/280 ms, T2 19 and 121 ms (Ex. 2a–c)', () => {
  const [mw, iew] = figure('t2Plot4').data;
  const read = (t, level) => solve.crossing(t.x, t.y, level);
  near(read(mw, 0.5), 13.2, 0.2, 'MW 50%');
  near(read(mw, 0.37), 18.9, 0.2, 'MW 63%');
  near(read(mw, 0.1), 43.8, 0.3, 'MW 90%');
  near(read(iew, 0.5), 84.1, 0.3, 'IEW 50%');
  near(read(iew, 0.37), 120.7, 0.3, 'IEW 63%');
  near(read(iew, 0.1), 279.5, 0.5, 'IEW 90%');
  near(read(mw, Math.exp(-1)), 19.0, 0.2, 'MW T2');
  near(read(iew, Math.exp(-1)), 121.4, 0.3, 'IEW T2');
  assert.ok(Number.isNaN(read(iew, 0.01)), 'a level the curve never reaches');
});

test('a mono-exponential fit recovers a mono-exponential exactly', () => {
  const tes = Array.from({ length: 32 }, (_, i) => 10 * (i + 1));
  const fit = solve.fitMono(tes, tes.map((te) => 0.8 * solve.decay(te, 70)));
  near(fit.t2, 70, 1e-4, 'T2');
  near(fit.s0, 0.8, 1e-6, 'S0');
});

test('the mono-exponential T2 of a 50/50 MW/IEW voxel is about 78 ms, closer to IEW (Ex. 2d)', () => {
  const [mw, iew] = figure('t2Plot4').data;
  const mix = mw.y.map((v, i) => 0.5 * v + 0.5 * iew.y[i]);
  const fit = solve.fitMono(mw.x, mix);
  near(fit.t2, 77.9, 0.1, 'T2');
  near(fit.s0, 0.81, 0.01, 'S0');
  assert.ok(Math.abs(fit.t2 - 121.4) < Math.abs(fit.t2 - 19.0), 'closer to IEW');
  // With the early echoes left out, the fit sees almost only IEW.
  const late = mw.x.map((te, i) => [te, mix[i]]).filter(([te]) => te >= 50);
  near(solve.fitMono(late.map((p) => p[0]), late.map((p) => p[1])).t2, 115, 1, 'TE ≥ 50 ms');
  near(solve.biexp(0, 19, 121, 0.5), 1, 1e-12, 'mix at TE = 0');
});

test('Eq. 3.8 falls from 50% at TE = 0 to almost nothing by 200 ms (Ex. 3)', () => {
  const at = (te) => 100 * solve.mwf(te, 19, 121);
  near(at(0), 50, 1e-9, 'TE 0');
  near(at(25), 24.8, 0.1, 'TE 25');
  near(at(50), 9.8, 0.1, 'TE 50');
  near(at(75), 3.5, 0.05, 'TE 75');
  near(at(100), 1.18, 0.02, 'TE 100');
  near(at(200), 0.014, 0.001, 'TE 200');
  near(at(300), 0.00017, 0.00001, 'TE 300');
  near(100 * solve.mwf(0, 19, 121, 0.2), 20, 1e-9, 'another MW fraction at TE 0');
});

test('SNR at the four TEs: 89, 31, 9.5, 3.0 for T2 = 109 ms; 65, 1.4, ~0, ~0 for T2* = 30 ms (Ex. 4a–b)', () => {
  const tes = [12.8, 128, 256, 384];
  [88.9, 30.9, 9.55, 2.95].forEach((v, i) => near(solve.snrAt(tes[i], 109, 100), v, 0.05, `T2 at ${tes[i]}`));
  [65.3, 1.40, 0.02].forEach((v, i) => near(solve.snrAt(tes[i], 30, 100), v, 0.05, `T2* at ${tes[i]}`));
});

test('the Monte Carlo SNR matches the formula, and is repeatable for a seed (Ex. 4a–b)', () => {
  const tes = [12.8, 128, 256, 384];
  const a = solve.simulateSNR(tes, 109, 100, 4000, 1);
  a.forEach((r) => {
    near(r.sd, 0.01, 0.0005, `noise SD at ${r.te}`);
    near(r.snr, r.truth, 0.05 * r.truth + 0.1, `SNR at ${r.te}`);
  });
  assert.deepEqual(solve.simulateSNR(tes, 109, 100, 100, 7), solve.simulateSNR(tes, 109, 100, 100, 7));
  // Gaussian numbers: mean 0, SD 1.
  const g = solve.gaussian(3);
  const xs = Array.from({ length: 20000 }, g);
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
  near(mean, 0, 0.03, 'mean');
  near(Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length), 1, 0.03, 'SD');
});

test('longest useful TE at SNR 5: about 330 ms for T2 = 109 ms, 90 ms for T2* = 30 ms (Ex. 4c)', () => {
  near(solve.maxUsefulTE(109, 100, 5), 326.5, 0.1, 'T2');
  near(solve.maxUsefulTE(30, 100, 5), 89.9, 0.1, 'T2*');
  near(solve.snrAt(solve.maxUsefulTE(109, 100, 5), 109, 100), 5, 1e-9, 'SNR at the limit');
  // Four times the averages doubles SNR0 and adds T2 ln 2.
  near(solve.maxUsefulTE(109, 200, 5) - solve.maxUsefulTE(109, 100, 5), 109 * Math.LN2, 1e-9, 'gain');
});

test('inputs: positive numbers and lists', () => {
  assert.deepEqual(solve.parsePositive(' 19 '), { ok: true, value: 19 });
  assert.equal(solve.parsePositive('abc').ok, false);
  assert.equal(solve.parsePositive('0').ok, false);
  assert.deepEqual(solve.parseList('25, 50 75;100'), { ok: true, value: [25, 50, 75, 100] });
  assert.equal(solve.parseList('').ok, false);
  assert.equal(solve.parseList('25, -1').ok, false);
});
