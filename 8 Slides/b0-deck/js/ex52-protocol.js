/* Exercise 5-2: choose a dual-echo protocol for a real field.
 *   #read-field  the book's Figure 5.1 field map (3 T, Hz); click voxels to find the largest offset.
 *   #pr-scan     a dual-echo GRE simulated on that field: complex noise on both echoes, T2* decay; the map, its error,
 *                the RMS error in the brain and the voxels that wrap. Keeps the best (lowest error) settings per SNR.
 *   #pr-real     the measured map of the lecture's slide 2 (ΔTE = 2.24 ms). */
(function () {
  'use strict';
  const fig = window.B0Figures && window.B0Figures.b0Fig1jn; if (!fig) return;
  const MAG = fig.data[0].z, HZ = fig.data[2].z, NY = MAG.length, NX = MAG[0].length;
  const T2S = 45;   // ms

  // Brain mask: magnitude above 15 % of its 99th percentile, holes filled (flood the background from the edges).
  const flat = MAG.flat().slice().sort((a, b) => a - b), p99 = flat[Math.floor(0.99 * flat.length)], thr = 0.15 * p99;
  const outside = MAG.map((r) => r.map(() => false));
  const stack = [];
  for (let i = 0; i < NY; i++) for (let j = 0; j < NX; j++) if ((i === 0 || j === 0 || i === NY - 1 || j === NX - 1) && MAG[i][j] <= thr) { outside[i][j] = true; stack.push([i, j]); }
  while (stack.length) {
    const [i, j] = stack.pop();
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([di, dj]) => {
      const a = i + di, b = j + dj;
      if (a >= 0 && b >= 0 && a < NY && b < NX && !outside[a][b] && MAG[a][b] <= thr) { outside[a][b] = true; stack.push([a, b]); }
    });
  }
  const MASK = outside.map((r) => r.map((o) => !o));
  const inBrain = MAG.flat().filter((_, k) => MASK[Math.floor(k / NX)][k % NX]).sort((a, b) => a - b);
  const MREF = inBrain[Math.floor(inBrain.length / 2)];   // median brain magnitude: SNR is defined on it, at TE = 0

  const masked = (A) => A.map((r, i) => r.map((v, j) => (MASK[i][j] ? v : null)));
  const imgLayout = (w, h, title) => ({
    width: w, height: h, margin: { l: 4, r: 4, t: title ? 30 : 4, b: 4 }, title: title ? { text: title, font: { size: 15 }, x: 0.5 } : undefined,
    xaxis: { visible: false, scaleanchor: 'y', constrain: 'domain', fixedrange: true }, yaxis: { visible: false, constrain: 'domain', fixedrange: true },
    paper_bgcolor: '#fff', plot_bgcolor: '#e9edf1',
  });
  const heat = (z, lim, unit, extra) => Object.assign({ type: 'heatmap', z, colorscale: BWR, zmin: -lim, zmax: lim, hoverongaps: false,
    colorbar: { title: { text: unit }, thickness: 12, len: 0.75 }, hovertemplate: `%{z:.0f} ${unit}<extra></extra>` }, extra || {});

  // ---------------------------------------------------------------- (a) read the field
  (function readField() {
    const slide = document.getElementById('read-field'); if (!slide) return;
    const host = slide.querySelector('.rd-map');
    let best = 0;
    onShow(slide, () => {
      Plotly.newPlot(host, [heat(masked(HZ), 80, 'Hz')], imgLayout(520, 520), { displayModeBar: false });
      host.on('plotly_click', (ev) => {
        const p = ev.points && ev.points[0]; if (!p || p.z == null) return;
        slide.querySelector('.rd-click').textContent = `${p.z > 0 ? '+' : ''}${p.z.toFixed(0)} Hz`;
        if (Math.abs(p.z) > best) { best = Math.abs(p.z); slide.querySelector('.rd-max').textContent = `${best.toFixed(0)} Hz`; }
      });
    });
  })();

  // ---------------------------------------------------------------- (c) scan it
  (function scan() {
    const slide = document.getElementById('pr-scan'); if (!slide) return;
    const q = (c) => slide.querySelector(c);
    const te1 = q('.pr-te1'), dte = q('.pr-dte'), snr = q('.pr-snr');
    [te1, dte, snr].forEach(keepSlider);
    // the same noise every time (seeded), so moving a slider changes only what the slider changes
    let s = 12345;
    const rand = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
    const N = [0, 1, 2, 3].map(() => MAG.map((r) => r.map(() => gauss())));
    const best = {};   // per SNR: { rmse, te1, dte }
    let drawn = false;

    function draw() {
      const t1 = Number(te1.value), d = Number(dte.value), S = Number(snr.value), t2 = t1 + d;
      q('.pr-te1-read').textContent = `${t1} ms`; q('.pr-dte-read').textContent = `${d} ms`; q('.pr-snr-read').textContent = S;
      const sigma = MREF / S, lim = 1000 / (2 * d);
      let se = 0, n = 0, wraps = 0;
      const meas = [], err = [];
      for (let i = 0; i < NY; i++) {
        const mr = [], er = [];
        for (let j = 0; j < NX; j++) {
          const f = HZ[i][j], m = MAG[i][j];
          const a1 = m * Math.exp(-t1 / T2S), p1 = 2 * Math.PI * f * t1 * 1e-3;
          const a2 = m * Math.exp(-t2 / T2S), p2 = 2 * Math.PI * f * t2 * 1e-3;
          const x1 = a1 * Math.cos(p1) + sigma * N[0][i][j], y1 = a1 * Math.sin(p1) + sigma * N[1][i][j];
          const x2 = a2 * Math.cos(p2) + sigma * N[2][i][j], y2 = a2 * Math.sin(p2) + sigma * N[3][i][j];
          const dphi = Math.atan2(y2 * x1 - x2 * y1, x2 * x1 + y2 * y1);   // angle of S2 · conj(S1)
          const fm = dphi / (2 * Math.PI * d * 1e-3);
          if (MASK[i][j]) {
            mr.push(fm); er.push(fm - f); se += (fm - f) ** 2; n++;
            if (Math.abs(f) > lim) wraps++;
          } else { mr.push(null); er.push(null); }
        }
        meas.push(mr); err.push(er);
      }
      const rmse = Math.sqrt(se / n);
      q('.pr-rmse').textContent = `${rmse.toFixed(1)} Hz`;
      const w = q('.pr-wrap'); w.textContent = `${((100 * wraps) / n).toFixed(1)} %`; w.classList.toggle('warn', wraps > 0);
      q('.pr-lim').textContent = `±${lim.toFixed(0)} Hz`;
      const b = best[S];
      if (!b || rmse < b.rmse) best[S] = { rmse, t1, d };
      const bb = best[S];
      q('.pr-best tbody').innerHTML = `<tr><td colspan="3"><b>Your best so far, at SNR ${S}</b></td></tr><tr><td><b>${bb.rmse.toFixed(1)} Hz</b> RMS</td><td>TE<sub>1</sub> = ${bb.t1} ms</td><td>ΔTE = ${bb.d} ms</td></tr>`;
      const cfg = { displayModeBar: false };
      const L1 = imgLayout(330, 360, 'Your field map'), L2 = imgLayout(330, 360, 'Error');
      if (!drawn) {
        Plotly.newPlot(q('.pr-meas'), [heat(meas, 80, 'Hz')], L1, cfg);
        Plotly.newPlot(q('.pr-err'), [heat(err, 40, 'Hz')], L2, cfg);
        drawn = true;
      } else {
        Plotly.react(q('.pr-meas'), [heat(meas, 80, 'Hz')], L1, cfg);
        Plotly.react(q('.pr-err'), [heat(err, 40, 'Hz')], L2, cfg);
      }
    }
    let pending = 0;
    const schedule = () => { cancelAnimationFrame(pending); pending = requestAnimationFrame(draw); };
    [te1, dte, snr].forEach((el) => el.addEventListener('input', schedule));
    onShow(slide, draw);
  })();

  // ---------------------------------------------------------------- (d) a real protocol
  (function real() {
    const slide = document.getElementById('pr-real'); if (!slide) return;
    const st = window.B0Figures.b0MapStikov; if (!st) return;
    onShow(slide, () => Plotly.newPlot(slide.querySelector('.st-map'), st.data, st.layout, { displayModeBar: false }));
  })();
})();
