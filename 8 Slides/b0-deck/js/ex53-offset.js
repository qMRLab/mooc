/* Exercise 5-3: a wrong imaging frequency (f0) in a dual-echo field map of a uniform phantom (the chapter's exercise 3).
 *   #fo-sim  the phantom's map for any f0 error and ΔTE, and the offset the map shows against the true one (a sawtooth).
 *   #fo-fix  f0 200 Hz too low, ΔTE = 5 ms (the map reads 0 Hz): as is, after a spatial unwrap (region growing from the
 *            centre), or with a 3rd echo 1 ms after the 1st (the short pair gives the number of turns of the long one). */
(function () {
  'use strict';
  const N = 64, R = 26, TE1 = 4, SNR = 30, LIM = 250;   // grid, phantom radius (px), first echo (ms), SNR, colour range (Hz)
  const inside = (i, j) => (i - N / 2 + 0.5) ** 2 + (j - N / 2 + 0.5) ** 2 <= R * R;
  const wrap = (p) => p - 2 * Math.PI * Math.round(p / (2 * Math.PI));

  // seeded noise: the same every time, so a slider changes only what it changes
  let s = 2024;
  const rand = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  const NOISE = [0, 1, 2, 3, 4, 5].map(() => Array.from({ length: N }, () => Array.from({ length: N }, gauss)));

  // phase difference between echoes at TE a and TE b (ms) for offset f (Hz), with noise; echo k uses noise arrays 2k, 2k+1
  function dphi(f, a, ka, b, kb, i, j) {
    const sg = 1 / SNR;
    const xa = Math.cos(2 * Math.PI * f * a * 1e-3) + sg * NOISE[2 * ka][i][j], ya = Math.sin(2 * Math.PI * f * a * 1e-3) + sg * NOISE[2 * ka + 1][i][j];
    const xb = Math.cos(2 * Math.PI * f * b * 1e-3) + sg * NOISE[2 * kb][i][j], yb = Math.sin(2 * Math.PI * f * b * 1e-3) + sg * NOISE[2 * kb + 1][i][j];
    return Math.atan2(yb * xa - xb * ya, xb * xa + yb * ya);
  }
  function dualEcho(f, d) {   // the field map, in Hz (null outside the phantom)
    return Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (inside(i, j) ? dphi(f, TE1, 0, TE1 + d, 1, i, j) / (2 * Math.PI * d * 1e-3) : null)));
  }
  function stats(map) {
    let sum = 0, n = 0, pos = 0, neg = 0;
    map.forEach((r) => r.forEach((v) => { if (v == null) return; sum += v; n++; if (v > 0) pos++; else if (v < 0) neg++; }));
    return { mean: sum / n, pos: (100 * pos) / n, neg: (100 * neg) / n };
  }
  const imgLayout = (w, h) => ({ width: w, height: h, margin: { l: 4, r: 4, t: 8, b: 4 }, paper_bgcolor: '#fff', plot_bgcolor: '#e9edf1',
    xaxis: { visible: false, scaleanchor: 'y', constrain: 'domain', fixedrange: true }, yaxis: { visible: false, constrain: 'domain', fixedrange: true } });
  const heat = (z) => ({ type: 'heatmap', z, colorscale: BWR, zmin: -LIM, zmax: LIM, hoverongaps: false, colorbar: { title: { text: 'Hz' }, thickness: 12, len: 0.8 }, hovertemplate: '%{z:.0f} Hz<extra></extra>' });
  const sign = (v) => { const r = Math.round(v); return r === 0 ? '0' : `${r > 0 ? '+' : ''}${r}`; };

  // ---------------------------------------------------------------- (c) any f0 error
  (function sim() {
    const slide = document.getElementById('fo-sim'); if (!slide) return;
    const q = (c) => slide.querySelector(c);
    const f = q('.fo-f'), te = q('.fo-te');
    [f, te].forEach(keepSlider);
    let drawn = false;
    function draw() {
      const F = Number(f.value), d = Number(te.value), lim = 1000 / (2 * d);
      q('.fo-f-read').textContent = `${F} Hz`; q('.fo-te-read').textContent = `${d} ms`;
      const map = dualEcho(F, d), st = stats(map);
      const turns = F * d * 1e-3;
      q('.fo-true').textContent = `${sign(F)} Hz (${(F / 42.577).toFixed(2)} µT)`;
      q('.fo-turn').textContent = `${(360 * turns).toFixed(0)}° (${turns.toFixed(2)} turn${Math.abs(turns) === 1 ? '' : 's'})`;
      const mean = q('.fo-mean'); mean.textContent = `${sign(st.mean)} Hz`; mean.classList.toggle('warn', Math.abs(st.mean - F) > 5);
      q('.fo-split').textContent = `${st.pos.toFixed(0)} % / ${st.neg.toFixed(0)} %`;
      // the sawtooth: what a voxel reads (noise-free) against the true offset
      const xs = [], ys = [];
      for (let x = -300; x <= 300; x += 1) { xs.push(x); ys.push(wrap(2 * Math.PI * x * d * 1e-3) / (2 * Math.PI * d * 1e-3)); }
      for (let k = ys.length - 1; k > 0; k--) if (Math.abs(ys[k] - ys[k - 1]) > lim) { xs.splice(k, 0, null); ys.splice(k, 0, null); }
      const shown = wrap(2 * Math.PI * F * d * 1e-3) / (2 * Math.PI * d * 1e-3);
      const saw = [
        { x: [-300, 300], y: [-300, 300], mode: 'lines', line: { color: '#b8c0ca', dash: 'dash', width: 1.5 }, hoverinfo: 'skip', name: 'true' },
        { x: xs, y: ys, mode: 'lines', line: { color: '#1f5f99', width: 2.5 }, hoverinfo: 'skip', name: 'map' },
        { x: [F], y: [shown], mode: 'markers', marker: { size: 13, color: '#c0392b' }, hovertemplate: 'true %{x} Hz → map %{y:.0f} Hz<extra></extra>' },
      ];
      const sawLayout = { width: 360, height: 340, margin: { l: 56, r: 10, t: 10, b: 46 }, showlegend: false, paper_bgcolor: '#fff', plot_bgcolor: '#fff',
        xaxis: { range: [-300, 300], title: { text: 'true offset (Hz)' }, zeroline: false, fixedrange: true, gridcolor: '#eef1f4' },
        yaxis: { range: [-300, 300], title: { text: 'map shows (Hz)' }, zeroline: false, fixedrange: true, gridcolor: '#eef1f4' },
        shapes: [{ type: 'rect', x0: -lim, x1: lim, y0: -300, y1: 300, fillcolor: '#e6f4e8', line: { width: 0 }, layer: 'below' }] };
      const cfg = { displayModeBar: false };
      (drawn ? Plotly.react : Plotly.newPlot)(q('.fo-map'), [heat(map)], imgLayout(330, 340), cfg);
      (drawn ? Plotly.react : Plotly.newPlot)(q('.fo-saw'), saw, sawLayout, cfg);
      drawn = true;
    }
    [f, te].forEach((el) => el.addEventListener('input', draw));
    slide.querySelectorAll('[data-fo]').forEach((b) => b.addEventListener('click', () => { b.blur(); f.value = b.dataset.fo; te.value = 5; draw(); }));
    onShow(slide, draw);
  })();

  // ---------------------------------------------------------------- (d) catching it
  (function fix() {
    const slide = document.getElementById('fo-fix'); if (!slide) return;
    const q = (c) => slide.querySelector(c);
    const F = 200, D = 5;
    // spatial unwrapping of the phase difference: region growing from the centre, each voxel moved by 2πk to match its parent
    function spatial() {
      const ph = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (inside(i, j) ? dphi(F, TE1, 0, TE1 + D, 1, i, j) : null)));
      const done = ph.map((r) => r.map(() => false)), c = N / 2, queue = [[c, c]];
      done[c][c] = true;
      while (queue.length) {
        const [i, j] = queue.shift();
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([di, dj]) => {
          const a = i + di, b = j + dj;
          if (a < 0 || b < 0 || a >= N || b >= N || done[a][b] || ph[a][b] == null) return;
          ph[a][b] = ph[i][j] + wrap(ph[a][b] - ph[i][j]); done[a][b] = true; queue.push([a, b]);
        });
      }
      return ph.map((r) => r.map((v) => (v == null ? null : v / (2 * Math.PI * D * 1e-3))));
    }
    // a 3rd echo 1 ms after the 1st: the short pair (no wraps up to ±500 Hz) gives the turns of the long pair
    function thirdEcho() {
      return Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => {
        if (!inside(i, j)) return null;
        const short = dphi(F, TE1, 0, TE1 + 1, 2, i, j), long = dphi(F, TE1, 0, TE1 + D, 1, i, j);
        const predicted = (short * D) / 1;   // the phase the long pair should have turned
        return (long + 2 * Math.PI * Math.round((predicted - long) / (2 * Math.PI))) / (2 * Math.PI * D * 1e-3);
      }));
    }
    const MAPS = { two: () => dualEcho(F, D), spatial, third: thirdEcho };
    let drawn = false;
    function draw(which) {
      const map = MAPS[which](), st = stats(map);
      const m = q('.fx-mean'); m.textContent = `${sign(st.mean)} Hz`; m.classList.toggle('warn', Math.abs(st.mean - F) > 5); m.classList.toggle('ok', Math.abs(st.mean - F) <= 5);
      (drawn ? Plotly.react : Plotly.newPlot)(q('.fx-map'), [heat(map)], imgLayout(420, 430), { displayModeBar: false });
      drawn = true;
    }
    segToggle(slide, 'fx', draw);
    onShow(slide, () => draw('two'));
  })();
})();
