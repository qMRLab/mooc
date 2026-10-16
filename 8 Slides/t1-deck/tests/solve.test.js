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

// The Octave cell from the IR blog notebook that generated the data for Figure 2.2 (cell 11).
const NOTEBOOK_CELL = `params.TR = 5.0;
params.TI = linspace(0.001, params.TR, 1000);

params.TE = 0.004;
params.T2 = 0.040;

params.EXC_FA = 90;  % Excitation flip angle
params.INV_FA = 180; % Inversion flip angle

params.signalConstant = 1;

% White matter
params.T1 = 0.900; % in seconds
signal_WM = inversion_recovery.analytical_solution(params, 'GRE-IR', 4);

% Grey matter
params.T1 = 1.500;  % in seconds
signal_GM = inversion_recovery.analytical_solution(params, 'GRE-IR', 4);

% CSF
params.T1 = 4.000;  % in seconds
signal_CSF = inversion_recovery.analytical_solution(params, 'GRE-IR', 4);`;

test('the notebook cell is read into curves (Ex. 3a)', () => {
  const r = solve.parseIrCode(NOTEBOOK_CELL);
  assert.equal(r.ok, true, r.error);
  assert.deepEqual(r.ti, { start: 0.001, stop: 5, n: 1000 });
  assert.deepEqual(r.curves.map((c) => [c.name, c.t1, c.tr, c.longTR, c.constant]), [
    ['WM', 0.9, 5, true, 1], ['GM', 1.5, 5, true, 1], ['CSF', 4, 5, true, 1],
  ]);
});

test('edited values, option 1 and extra curves are read; bad code is reported by line', () => {
  const edited = NOTEBOOK_CELL.replace('0.900', '0.650').replace('1.500', '1.2').replace(/'GRE-IR', 4\);\s*$/, "'GRE-IR', 1);")
    + '\nparams.T1 = 2.0;\nsignal_X = inversion_recovery.analytical_solution(params, \'GRE-IR\', 4);';
  const r = solve.parseIrCode(edited);
  assert.equal(r.ok, true, r.error);
  assert.deepEqual(r.curves.map((c) => [c.name, c.t1, c.longTR]), [['WM', 0.65, true], ['GM', 1.2, true], ['CSF', 4, false], ['X', 2, true]]);
  assert.match(solve.parseIrCode('params.T1 = abc;').error, /line 1/i);
  assert.match(solve.parseIrCode('params.T1 = 0.9;\nsignal_WM = inversion_recovery.analytical_solution(params, \'GRE-IR\', 2);').error, /option 2/);
  assert.match(solve.parseIrCode('params.TR = 5;\nsignal_WM = inversion_recovery.analytical_solution(params, \'GRE-IR\', 4);').error, /T1/);
  assert.match(solve.parseIrCode('% nothing here').error, /analytical_solution/);
  assert.match(solve.parseIrCode('plot(x)').error, /line 1/i);
});
