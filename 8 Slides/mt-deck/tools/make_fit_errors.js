#!/usr/bin/env node
/* Write js/data/fit-errors.js: how wrong the qMT fit gets when an input map is wrong (slide 17; the book's Figure 6.6).
 *
 * Truth: the median qMRLab fit of the dataset's white matter (voxels with F > 0.18 in js/data/brain.js), simulated
 * without noise for its protocol with the true B1 = 1, B0 = 0 Hz and its measured R1. Each fit (js/mt-sim.js, fitQMT)
 * then assumes a wrong B1 (0.7-1.3), a wrong B0 (-60 to +60 Hz) or a wrong T1 (x 0.7-1.3), one at a time, and the
 * fitted F, kf, T2f and T2r are compared with the truth.
 *
 * Usage (from the mt-deck folder):  node tools/make_fit_errors.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const S = require('../js/mt-sim.js');

const DECK = path.resolve(__dirname, '..');
global.window = {};
require(path.join(DECK, 'js', 'data', 'brain.js'));
const B = global.window.MTBrain;

const med = (vals) => { const v = vals.slice().sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
const wm = [];
for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) if (B.mask[y][x] === '1' && B.F[y][x] > 0.18) wm.push([y, x]);
const truth = {
  F: med(wm.map(([y, x]) => B.F[y][x])), kf: med(wm.map(([y, x]) => B.kf[y][x])),
  T2f: med(wm.map(([y, x]) => B.T2f[y][x])) / 1e3, T2r: med(wm.map(([y, x]) => B.T2r[y][x])) / 1e6,
};
const R1 = med(wm.map(([y, x]) => B.R1[y][x]));
const base = { protocol: S.QMT_PROTOCOL, R1meas: R1, b1: 1, b0: 0, steps: 48 };
const data = S.qmtForward(truth, base);

const range = (a, b, n) => Array.from({ length: n }, (_, i) => +(a + ((b - a) * i) / (n - 1)).toFixed(4));
const cases = {
  B1: { x: range(0.7, 1.3, 13), opts: (v) => ({ b1: v }) },
  B0: { x: range(-60, 60, 13), opts: (v) => ({ b0: v }) },
  T1: { x: range(0.7, 1.3, 13), opts: (v) => ({ R1meas: R1 / v }) },
};
const out = { truth: { ...truth, R1 }, cases: {} };
for (const [name, c] of Object.entries(cases)) {
  const err = { F: [], kf: [], T2f: [], T2r: [] };
  for (const v of c.x) {
    const f = S.fitQMT(data, { ...base, ...c.opts(v), start: truth, maxIter: 60 });
    for (const k of Object.keys(err)) err[k].push(+(100 * (f[k] / truth[k] - 1)).toFixed(2));
    process.stdout.write('.');
  }
  out.cases[name] = { x: c.x, err };
}
const file = path.join(DECK, 'js', 'data', 'fit-errors.js');
fs.writeFileSync(file, `// qMT fit errors when an input map is wrong, written by tools/make_fit_errors.js. Do not edit.\nwindow.MTFitErrors = ${JSON.stringify(out)};\n`);
console.log(`\n${path.relative(DECK, file)}: truth F ${truth.F.toFixed(3)} kf ${truth.kf.toFixed(2)} T2f ${(truth.T2f * 1e3).toFixed(1)} ms T2r ${(truth.T2r * 1e6).toFixed(1)} µs, R1 ${R1.toFixed(2)}`);
for (const [n, c] of Object.entries(out.cases)) console.log(n, 'F', c.err.F.join(' '));
