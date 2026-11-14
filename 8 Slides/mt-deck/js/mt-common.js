/* Shared pieces of the MT slides and exercises (load after js/mt-sim.js and js/data/brain.js):
 * the colours, a Plotly wrapper with the deck's look, segmented buttons and sliders, a throttle for live
 * recomputation, and access to the real qMT slice (window.MTBrain). */
(function (root) {
  'use strict';
  const S = root.MTSim;

  // One colour per physical thing, the same on every slide.
  const C = {
    free: '#1f5f99',       // water, free pool
    restr: '#c2410c',      // macromolecules, restricted pool
    ex: '#2b8a3e',         // exchange
    direct: '#d4a106',     // direct saturation of water
    t1: '#8a96a3',         // T1 recovery
    exc: '#3d4a57',        // excitation
    mtr: '#9c36b5',        // MTR
    mtsat: '#0c8599',      // MTsat
    ink: '#1d2733', muted: '#5b6776', grid: '#e6ebf0', rule: '#d8dee6', panel: '#f2f5f8',
    a142: '#4dabf7', a426: '#1c3d6e',   // the two MT powers of the dataset
  };
  const TISSUE_COLORS = { gm: '#94a3b8', wm: '#1c3d6e', nawm: '#4c7cb5', early: '#f08c00', late: '#c92a2a' };
  const PROTOCOL_COLORS = ['#1f5f99', '#e8590c', '#2b8a3e', '#ae3ec9', '#0c8599', '#c92a2a'];
  const VIRIDIS = [[0, '#440154'], [0.13, '#482878'], [0.25, '#3e4989'], [0.38, '#31688e'], [0.5, '#26828e'], [0.63, '#1f9e89'], [0.75, '#35b779'], [0.88, '#6ece58'], [1, '#fde725']];
  const BWR = [[0, '#053061'], [0.2, '#2166ac'], [0.4, '#92c5de'], [0.5, '#ffffff'], [0.6, '#f4a582'], [0.8, '#b2182b'], [1, '#67001f']];
  const GRAY = [[0, '#000000'], [1, '#ffffff']];
  const FONT = 'Source Sans 3, Source Sans Pro, Helvetica Neue, Arial, sans-serif';

  function axis(extra) {
    return Object.assign({ gridcolor: C.grid, zerolinecolor: C.rule, linecolor: C.rule, ticks: 'outside', tickcolor: C.rule, automargin: true, title: { font: { size: 17 } }, tickfont: { size: 14 } }, extra || {});
  }
  function layout(extra) {
    const base = {
      font: { family: FONT, size: 15, color: C.ink },
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: '#ffffff',
      margin: { l: 70, r: 20, t: 20, b: 60 },
      showlegend: false,
      hoverlabel: { font: { family: FONT, size: 14 } },
      xaxis: axis(), yaxis: axis(),
    };
    const out = Object.assign({}, base, extra || {});
    for (const k of Object.keys(out)) if (/^[xy]axis\d*$/.test(k)) out[k] = axis(out[k]);
    return out;
  }
  const CONFIG = { displayModeBar: false, showLink: false, responsive: false, scrollZoom: false };
  function plot(el, data, lay) {
    const L = layout(lay);
    if (!L.width) L.width = el.clientWidth || 600;
    if (!L.height) L.height = el.clientHeight || 400;
    return root.Plotly.react(el, data, L, CONFIG);
  }

  // Segmented buttons: <div class="seg" data-ctl="name"><button data-v="..."> ... ; calls onPick(value) on click.
  function seg(scope, name, onPick) {
    const box = scope.querySelector(`.seg[data-ctl="${name}"]`);
    if (!box) throw new Error(`no .seg[data-ctl="${name}"]`);
    const buttons = [...box.querySelectorAll('button[data-v]')];
    buttons.forEach((b) => b.addEventListener('click', () => {
      b.blur();
      buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      onPick(b.dataset.v);
    }));
    return () => (buttons.find((b) => b.getAttribute('aria-pressed') === 'true') || buttons[0]).dataset.v;
  }

  const keepKeys = (el) => el.addEventListener('keydown', (e) => e.stopPropagation());   // arrows move the slider, not the slides
  // A range input with an <output> next to it (id + "-v"): fmt(value) is shown; onInput(value) on every move.
  function slider(id, fmt, onInput) {
    const el = document.getElementById(id), out = document.getElementById(`${id}-v`);
    keepKeys(el);
    const show = () => { if (out) out.innerHTML = fmt(Number(el.value)); };
    el.addEventListener('input', () => { show(); if (onInput) onInput(Number(el.value)); });
    show();
    return { el, get: () => Number(el.value), set: (v) => { el.value = v; show(); } };
  }

  // Run fn at most once per frame, with the latest request (for sliders driving simulations).
  function throttle(fn) {
    let queued = false;
    return () => {
      if (queued) return;
      queued = true;
      (root.requestAnimationFrame || setTimeout)(() => { queued = false; fn(); });
    };
  }

  const fmt = {
    hz: (v) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)} kHz` : `${Math.round(v)} Hz`),
    pct: (v, d = 1) => `${v.toFixed(d)} %`,
    s: (v) => `${v.toFixed(2)} s`,
  };

  // ------------------------------------------------------------------ the real slice

  const B = root.MTBrain || null;
  const brain = B && (() => {
    const voxels = [];
    for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) if (B.mask[y][x] === '1') voxels.push([y, x]);
    const inMask = (y, x) => y >= 0 && x >= 0 && y < B.h && x < B.w && B.mask[y][x] === '1';
    // The voxel's qMRLab fit as simulator tissue (R1f from the measured R1 with Eq. 6.6).
    function tissue(y, x) {
      const F = B.F[y][x], kf = B.kf[y][x];
      return { F, kf, R1r: 1, R1f: S.r1fFromMeasured(B.R1[y][x], F, kf, 1), T2f: B.T2f[y][x] / 1e3, T2r: B.T2r[y][x] / 1e6 };
    }
    // Normalized MT-SPGR signal of a voxel for a qMT-protocol-like sequence at any offset and angle (its B0 and B1 applied).
    function model(y, x, offset, angle, t = tissue(y, x)) {
      const seq = { tr: 0.025, flipAngle: 7, b1: B.B1[y][x], mt: { shape: 'gausshann', duration: 0.01024, angle, offset: offset + B.B0[y][x] } };
      return S.normalizedSignal(t, seq, { steps: 48 });
    }
    // Index into the 10 measurements: offset index (0-4) and angle index (0: 142°, 1: 426°).
    const idx = (oi, ai) => oi * 2 + ai;
    const wmLike = (y, x) => B.F[y][x] > 0.18;
    const gmLike = (y, x) => B.F[y][x] > 0.05 && B.F[y][x] < 0.1;
    function median(vals) {
      const v = vals.filter(Number.isFinite).sort((a, b) => a - b);
      return v.length ? v[Math.floor(v.length / 2)] : NaN;
    }
    // A z-grid for a Plotly heatmap from a function of (y, x) (null outside the mask).
    function grid(f) {
      const z = [];
      for (let y = 0; y < B.h; y++) {
        const row = [];
        for (let x = 0; x < B.w; x++) row.push(B.mask[y][x] === '1' ? f(y, x) : null);
        z.push(row);
      }
      return z;
    }
    // Presets: a voxel of each tissue, chosen by fitted F (closest to the class median, near the slice's middle).
    function preset(kind) {
      const want = { wm: 0.22, gm: 0.075, csf: 0.03 }[kind];
      let best = null, bestScore = Infinity;
      for (const [y, x] of voxels) {
        const dc = Math.hypot((y - B.h / 2) / B.h, (x - B.w / 2) / B.w);
        const s = Math.abs(B.F[y][x] - want) / want + 0.6 * dc + (B.resnorm[y][x] || 0) * 20;
        if (s < bestScore) { bestScore = s; best = [y, x]; }
      }
      return best;
    }
    return { B, voxels, inMask, tissue, model, idx, wmLike, gmLike, median, grid, preset };
  })();

  // A brain image trace: the slice is shown radiological-style, anterior up (rows top to bottom).
  function brainHeat(z, opts = {}) {
    return Object.assign({
      type: 'heatmap', z, colorscale: VIRIDIS, hoverongaps: false, xgap: 0, ygap: 0,
      colorbar: { thickness: 14, len: 0.8, outlinewidth: 0, tickfont: { size: 13 } },
    }, opts);
  }
  function brainAxes(extra) {
    const ax = { visible: false, showgrid: false, zeroline: false, constrain: 'domain', fixedrange: true };
    return Object.assign({
      xaxis: Object.assign({}, ax),
      yaxis: Object.assign({}, ax, { autorange: 'reversed', scaleanchor: 'x', scaleratio: 1 }),
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { l: 4, r: 4, t: 4, b: 4 },
    }, extra || {});
  }

  root.MT = { S, C, TISSUE_COLORS, PROTOCOL_COLORS, VIRIDIS, BWR, GRAY, layout, axis, plot, seg, slider, keepKeys, throttle, fmt, brain, brainHeat, brainAxes, CONFIG };
})(typeof window !== 'undefined' ? window : globalThis);
