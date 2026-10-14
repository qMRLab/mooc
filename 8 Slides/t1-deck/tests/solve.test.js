// The maths behind the exercise solutions. Run with `npm test`.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const solve = require('../js/solve.js');

const near = (actual, expected, tol, what) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${what}: ${actual} is not within ${tol} of ${expected}`);

test('null time is proportional to T1, with slope ln 2 (Ex. 1b)', () => {
  const t1 = [900, 1500, 4000];
  const fit = solve.fitThroughOrigin(t1, [624, 1040, 2773]);
  near(fit.k, Math.LN2, 0.002, 'slope');
  assert.ok(fit.r2 > 0.9999, `r² ${fit.r2}`);
  t1.forEach((t) => near(solve.irNullLongTR(t), t * Math.LN2, 1e-9, `null for ${t}`));
});

test('general-equation null comes earlier than the long-TR null (Ex. 3c)', () => {
  near(solve.irNullGeneral(650, 3000), 444.2, 0.1, 'WM 1.5 T, TR 3 s');
  near(solve.irNullGeneral(650, 1e9), solve.irNullLongTR(650), 1e-6, 'infinite TR');
});

test('Eq. 2.3 matches the book’s Figure 2.2 curve', () => {
  near(solve.irLongTR(0, 900), -1, 1e-12, 'TI = 0');
  near(solve.irLongTR(900 * Math.LN2, 900), 0, 1e-12, 'at the null');
});

test('WM and GM magnitudes cross near 800 ms and differ most near 1150 ms (Ex. 1c–d)', () => {
  near(solve.irMagnitudeCrossing(900, 1500), 797, 2, 'crossing');
  near(solve.irMaxContrastTI(900, 1500), 1149, 1, 'max contrast');
  near(solve.irMaxContrastTI(1500, 900), 1149, 1, 'order of tissues does not matter');
});

test('Ernst angles for the three tissue/TR pairs (Ex. 2b)', () => {
  near(solve.ernst(15, 900), 10.43, 0.01, 'WM');
  near(solve.ernst(50, 1500), 14.71, 0.01, 'GM');
  near(solve.ernst(140, 4000), 15.07, 0.01, 'CSF');
});

test('SPGR signal peaks at the Ernst angle', () => {
  const e = solve.ernst(30, 900);
  assert.ok(solve.spgr(e, 30, 900) > solve.spgr(e - 1, 30, 900));
  assert.ok(solve.spgr(e, 30, 900) > solve.spgr(e + 1, 30, 900));
});

test('Deoni pair: both angles give 71% of the Ernst signal (Ex. 2c)', () => {
  for (const [tr, t1] of [[15, 900], [50, 1500], [140, 4000]]) {
    const { low, high } = solve.deoniPair(tr, t1);
    const peak = solve.spgr(solve.ernst(tr, t1), tr, t1);
    near(solve.spgr(low, tr, t1) / peak, 0.71, 1e-6, `low angle, TR ${tr}`);
    near(solve.spgr(high, tr, t1) / peak, 0.71, 1e-6, `high angle, TR ${tr}`);
    assert.ok(low < solve.ernst(tr, t1) && high > solve.ernst(tr, t1));
  }
  const wm = solve.deoniPair(15, 900);
  near(wm.low, 4.4, 0.05, 'WM low');
  near(wm.high, 24.7, 0.05, 'WM high');
});

test('best WM/GM SPGR contrast at TR = 30 ms is about 22° (Ex. 2d)', () => {
  near(solve.spgrMaxContrastAngle(30, 900, 1500), 22.4, 0.1, 'angle');
});

test('inputs are validated without throwing', () => {
  assert.deepEqual(solve.parsePositive('624'), { ok: true, value: 624 });
  assert.equal(solve.parsePositive('').ok, false);
  assert.equal(solve.parsePositive('-3').ok, false);
  assert.equal(solve.parsePositive('abc').ok, false);
  assert.deepEqual(solve.parseList('100, 300 600;900'), { ok: true, value: [100, 300, 600, 900] });
  assert.equal(solve.parseList('100, x').ok, false);
  assert.equal(solve.parseList('').ok, false);
  assert.equal(solve.fitThroughOrigin([], []).ok, false);
  assert.equal(solve.fitThroughOrigin([0, 0], [1, 2]).ok, false);
});
