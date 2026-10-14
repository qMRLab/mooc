// The qmrust engine and its IR helpers, run against the real vendored WebAssembly. Run with `npm test`.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DECK = path.resolve(__dirname, '..');
// The vendored files declare browser globals (`var wasm_bindgen`, `var QMRUST_WASM_B64`); run them as such.
for (const file of ['qmrust_wasm.js', 'qmrust_wasm_b64.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(DECK, 'vendor', 'qmrust', file), 'utf8'), { filename: file });
}
const QmRust = require('../js/qmrust.js');

const near = (actual, expected, tol, what) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${what}: ${actual} is not within ${tol} of ${expected}`);

test('engine loads once and reports the IR model', async () => {
  const a = QmRust.ready();
  assert.equal(QmRust.ready(), a, 'ready() is memoized');
  await a;
  assert.ok(QmRust.models().includes('inversion_recovery'));
});

test('signal: long-TR and general equations, signed and magnitude', async () => {
  await QmRust.ready();
  const tis = [0, 900 * Math.LN2, 5000];
  const s = QmRust.signal({ t1: 900, tr: 1e6, tis, model: 'longTR', magnitude: false });
  near(s[0], -1, 1e-9, 'TI 0');
  near(s[1], 0, 1e-5, 'null (TIs are sent to qmrust rounded to 1 µs)');
  const g = QmRust.signal({ t1: 650, tr: 3000, tis: [444.2, 100], model: 'general', magnitude: true });
  near(g[0], 0, 2e-4, 'general null at 444 ms');
  assert.ok(g[1] > 0, 'magnitude is positive');
});

test('fit recovers T1 from noise-free data; long-TR fit is biased at TR 3 s (Ex. 3b)', async () => {
  await QmRust.ready();
  const tis = Array.from({ length: 30 }, (_, i) => 50 + 50 * i);
  for (const [t1, longTrBias] of [[650, -1.66], [900, -5.82]]) {
    const signal = QmRust.signal({ t1, tr: 3000, tis, model: 'general', magnitude: true });
    near(QmRust.fit({ tis, signal, model: 'general', magnitude: true }).t1, t1, 0.5, `general fit, T1 ${t1}`);
    const lt = QmRust.fit({ tis, signal, model: 'longTR', magnitude: true }).t1;
    near((lt / t1 - 1) * 100, longTrBias, 0.1, `long-TR bias %, T1 ${t1}`);
  }
});

test('Monte Carlo: human protocol on human vs mouse WM (Ex. 4a)', async () => {
  await QmRust.ready();
  const protocol = { tr: 1000, tis: [100, 300, 600, 900], snr: 100, trials: 500, seed: 1 };
  const human = QmRust.monteCarlo({ ...protocol, t1: 600 });
  const mouse = QmRust.monteCarlo({ ...protocol, t1: 1700 });
  near(human.mean, 600, 30, 'human mean');
  near(mouse.mean, 1700, 60, 'mouse mean');
  assert.ok(mouse.cv > 2 * human.cv, `mouse CV ${mouse.cv} vs human ${human.cv}`);
  assert.equal(human.signalMean.length, 4);
  const again = QmRust.monteCarlo({ ...protocol, t1: 600 });
  assert.equal(again.mean, human.mean, 'same seed, same result');
});

test('Monte Carlo: the proposed mouse protocol is more precise (Ex. 4c)', async () => {
  await QmRust.ready();
  const old = QmRust.monteCarlo({ t1: 1700, tr: 1000, tis: [100, 300, 600, 900], snr: 100, trials: 500, seed: 1 });
  const proposed = QmRust.monteCarlo({ t1: 1700, tr: 5000, tis: [100, 1000, 2000, 4000], snr: 100, trials: 500, seed: 1 });
  assert.ok(proposed.cv < old.cv / 3, `proposed CV ${proposed.cv} vs ${old.cv}`);
});

test('curve samples a dense TI grid', async () => {
  await QmRust.ready();
  const c = QmRust.curve({ t1: 900, tr: 1e6, tiMax: 5000, n: 101, model: 'longTR', magnitude: false });
  assert.equal(c.ti.length, 101);
  assert.equal(c.ti[0], 0);
  assert.equal(c.ti[100], 5000);
  near(c.s[0], -1, 1e-9, 'start');
});

test('bad input is rejected with a message, not a crash', async () => {
  await QmRust.ready();
  assert.throws(() => QmRust.signal({ t1: -1, tr: 3000, tis: [100] }), /T₁/);
  assert.throws(() => QmRust.monteCarlo({ t1: 900, tr: 3000, tis: [100, 200], snr: 50 }), /at least 3/);
  assert.throws(() => QmRust.monteCarlo({ t1: 900, tr: 1000, tis: [100, 500, 1200], snr: 50 }), /shorter than TR/);
});
