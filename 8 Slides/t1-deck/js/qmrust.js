/* qmrust (the Rust/WebAssembly port of qMRLab) for the exercise slides: loads the vendored engine
 * and wraps its inversion recovery model. Times are in ms here; qmrust works in seconds.
 * Needs vendor/qmrust/qmrust_wasm.js and qmrust_wasm_b64.js loaded first (globals wasm_bindgen and
 * QMRUST_WASM_B64). Exported for Node tests, and as window.QmRust in the browser. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QmRust = api;
})(typeof self !== 'undefined' ? self : globalThis, function (root) {
  'use strict';

  let loading = null;

  function decodeBase64(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  // Instantiates the engine once; every caller shares the same promise.
  function ready() {
    if (!loading) {
      loading = Promise.resolve().then(() => {
        const wb = root.wasm_bindgen || (typeof wasm_bindgen !== 'undefined' ? wasm_bindgen : undefined);
        const b64 = root.QMRUST_WASM_B64 || (typeof QMRUST_WASM_B64 !== 'undefined' ? QMRUST_WASM_B64 : undefined);
        if (!wb || !b64) throw new Error('The qmrust engine files are not loaded.');
        return wb({ module_or_path: decodeBase64(b64) }).then(() => wb);
      });
    }
    return loading;
  }

  function engine() {
    const wb = root.wasm_bindgen || (typeof wasm_bindgen !== 'undefined' ? wasm_bindgen : undefined);
    if (!wb || !wb.forward) throw new Error('qmrust is not ready yet.');
    return wb;
  }

  // ---------------------------------------------------------------- checks

  function positive(value, name) {
    if (!(Number.isFinite(value) && value > 0)) throw new Error(`${name} must be a positive number.`);
    return value;
  }

  function checkTimes(tis, tr) {
    if (!Array.isArray(tis) || !tis.length) throw new Error('Enter at least one inversion time.');
    tis.forEach((t) => {
      if (!(Number.isFinite(t) && t >= 0)) throw new Error(`Inversion time “${t}” is not valid.`);
    });
    if (tr !== undefined && tis.some((t) => t >= tr)) throw new Error('Every TI must be shorter than TR.');
  }

  // ---------------------------------------------------------------- recipes

  // Seconds with at most 6 decimals: whole-ms protocols stay short and exact in YAML and JSON.
  const sec = (ms) => Number((ms / 1000).toFixed(6));

  // A qmrust recipe: the model, fit options and the TI list as the protocol.
  function recipe(tis, magnitude, model) {
    return 'model: inversion_recovery\n' +
      `method: ${magnitude ? 'magnitude' : 'complex'}\n` +
      (model === 'longTR' ? 'fit_model: long_tr_lm\n' : '') +
      `inversion_times: [${tis.map(sec).join(', ')}]\n`;
  }

  // The a/b parameterization qmrust fits (S = a + b·e^(−TI/T1)), with C = 1 and ideal pulses.
  // General equation (Eq. 2.1): a = 1 + e^(−TR/T1). Long-TR approximation (Eq. 2.3): a = 1.
  function ab(t1, tr, model) {
    return { a: model === 'longTR' ? 1 : 1 + Math.exp(-tr / t1), b: -2 };
  }

  // qmrust only accepts increasing TIs; callers may list them in any order.
  function ascending(tis) {
    return tis.map((t, i) => i).sort((i, j) => tis[i] - tis[j]);
  }

  // ---------------------------------------------------------------- IR helpers

  // Noise-free signal at each TI, in the order given.
  function signal({ t1, tr, tis, model = 'general', magnitude = true }) {
    positive(t1, 'T₁');
    if (model !== 'longTR') positive(tr, 'TR');
    checkTimes(tis);
    const order = ascending(tis);
    const { a, b } = ab(t1, tr, model);
    // The IR protocol needs at least 3 TIs; pad short lists with later TIs and drop their values.
    const protocol = order.map((i) => tis[i]);
    while (protocol.length < 3) protocol.push(protocol[protocol.length - 1] + 1);
    const cfg = recipe(protocol, magnitude);
    const out = JSON.parse(engine().forward(cfg, new Float64Array([sec(t1), a, b]), '', ''));
    const values = new Array(tis.length);
    order.forEach((i, k) => { values[i] = out[k].value; });
    return values;
  }

  // Fits T1 (ms) to one voxel. qmrust returns [T1 (s), b, a, residual(, polarity index)].
  function fit({ tis, signal: values, model = 'general', magnitude = true }) {
    checkTimes(tis);
    if (!Array.isArray(values) || values.length !== tis.length) throw new Error('One signal value is needed per TI.');
    const order = ascending(tis);
    const meas = JSON.stringify(order.map((i) => ({ params: { InversionTime: sec(tis[i]) }, value: values[i] })));
    const r = engine().fit_voxel(recipe(order.map((i) => tis[i]), magnitude, model), meas, '', '');
    return { t1: r[0] * 1000, b: r[1], a: r[2], residual: r[3] };
  }

  // Noisy repetitions (Rician noise, SNR relative to M0 = 1), each fitted by qmrust.
  function monteCarlo({ t1, tr, tis, snr, trials = 500, seed = 1, model = 'general' }) {
    positive(t1, 'T₁');
    positive(tr, 'TR');
    positive(snr, 'SNR');
    checkTimes(tis, tr);
    if (tis.length < 3) throw new Error('A fit needs at least 3 inversion times.');
    const sorted = ascending(tis).map((i) => tis[i]);
    const { a, b } = ab(t1, tr, 'general');
    const cfg = recipe(sorted, true, model) +
      'sim:\n' +
      `  params: { T1: ${sec(t1)}, a: ${a}, b: ${b} }\n` +
      `  noise: { type: rician, snr: ${snr} }\n` +
      `  trials: ${Math.round(trials)}\n` +
      `  seed: ${Math.round(seed)}\n`;
    const r = JSON.parse(engine().sim('single-voxel', cfg));
    const s = r.stats.find((x) => x.name === 'T1');
    const mean = s.mean * 1000;
    const std = s.std * 1000;
    return {
      tis: sorted,
      mean, std,
      bias: (mean / t1 - 1) * 100,
      cv: (std / t1) * 100,
      signalMean: r.signal_mean, // in the order of `tis` (ascending)
      signalStd: r.signal_std,
      trials: r.trials,
    };
  }

  // Fits every voxel in `mask` of an nx × ny slice. `data` is voxel-major: the TIs of voxel 0 (in the order
  // of `tis`), then voxel 1, and so on — the layout qmrust's fit_volume reads. Returns T1 in ms per voxel,
  // NaN outside the mask or where the fit fails.
  function fitVolume({ tis, data, nx, ny, mask, model = 'general', magnitude = true }) {
    checkTimes(tis);
    const n = nx * ny;
    if (data.length !== n * tis.length || mask.length !== n) throw new Error('Data and mask size do not match the slice.');
    // qmrust needs increasing TIs: reorder each voxel's samples to match.
    const nt = tis.length;
    const order = ascending(tis);
    const sorted = new Float64Array(data.length);
    for (let v = 0; v < n; v++) order.forEach((i, k) => { sorted[v * nt + k] = data[v * nt + i]; });
    const ids = JSON.stringify(order.map((i) => ({ InversionTime: sec(tis[i]) })));
    const maps = engine().fit_volume(recipe(order.map((i) => tis[i]), magnitude, model), sorted,
      new Uint32Array([nx, ny, 1, nt]), ids, Uint8Array.from(mask), '', '');
    const t1 = maps instanceof Map ? maps.get('T1') : maps.T1;
    return Float64Array.from(t1, (s, v) => (mask[v] && Number.isFinite(s) && s > 0 ? s * 1000 : NaN));
  }

  // Dense curve for drawing, on a whole-ms grid from 0 to tiMax.
  function curve({ t1, tr, tiMax, n = 200, model = 'general', magnitude = true }) {
    const ti = Array.from({ length: n }, (_, i) => Math.round((tiMax * i) / (n - 1)));
    return { ti, s: signal({ t1, tr, tis: ti, model, magnitude }) };
  }

  function models() {
    return Array.from(JSON.parse(JSON.stringify(engine().list_models())));
  }

  return { ready, signal, fit, fitVolume, monteCarlo, curve, models };
});
