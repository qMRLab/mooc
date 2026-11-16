/* Exercise 6-3: a live Z-spectrum with F, k_f, T2,r and T2,f sliders (moved here from the lecture), and "Pick your voxels":
 * an image of the dataset and the measured Z-spectrum of the voxels clicked, a white matter one and a grey matter one. */
(function () {
  'use strict';
  const { S, C, plot, slider, throttle, brain } = window.MT;
  const W = window.MTDeck.widget;
  const $ = (id) => document.getElementById(id);
  const logspace = (a, b, n) => Array.from({ length: n }, (_, i) => 10 ** (Math.log10(a) + ((Math.log10(b) - Math.log10(a)) * i) / (n - 1)));

  // ------------------------------------------------------------------ pick your voxels: an image, its measured Z-spectrum
  // One image at a time (MT off, or one of the 10 MT images divided by MT off), chosen in a dropdown; clicking a voxel plots
  // its 10 measured points (no model, no fitted values). The task: a white matter voxel, then a grey matter one, judged by
  // the voxel's qMRLab F (WM above 18 %, GM 5-10 %), which stays hidden. The picks go to the fit slides (window.MTEx63).
  W('s-pick', (section) => {
    if (!brain) return;
    const B = brain.B, OFF = S.QMT_OFFSETS, ANG = S.QMT_ANGLES, COL = [C.a142, C.a426];
    const cv = $('pk-cv'), ctx = cv.getContext('2d'), sel = $('pk-img'), elPlot = $('pk-plot');
    const W2 = 320, H2 = 400;
    cv.width = W2 * 2; cv.height = H2 * 2; ctx.setTransform(2, 0, 0, 2, 0, 0);
    const fmtOff = (o) => (o >= 1000 ? `${(o / 1000).toFixed(o < 10000 ? 1 : 0)} kHz` : `${o} Hz`);
    sel.innerHTML = '<option value="-1">MT off</option>' + OFF.flatMap((o, oi) => ANG.map((a, ai) => `<option value="${brain.idx(oi, ai)}">${a}° · ${fmtOff(o)} (÷ MT off)</option>`)).join('');
    sel.value = String(brain.idx(1, 1));
    window.MT.keepKeys(sel);
    let vmax = 0;
    for (const [y, x] of brain.voxels) vmax = Math.max(vmax, B.S0[y][x]);
    const picks = { wm: null, gm: null };
    let task = 'wm', last = null;
    const kind = ([y, x]) => { const F = B.F[y][x]; return F > 0.18 ? 'wm' : F >= 0.05 && F <= 0.1 ? 'gm' : F > 0.1 ? 'mixed' : 'csf'; };
    function drawImage() {
      const k = Number(sel.value), sx = W2 / B.w, sy = H2 / B.h;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W2, H2);
      for (const [y, x] of brain.voxels) {
        const v = k < 0 ? B.S0[y][x] / vmax : B.mt[k][y][x];
        const g = Math.round(255 * Math.max(0, Math.min(1, v)));
        ctx.fillStyle = `rgb(${g},${g},${g})`; ctx.fillRect(x * sx, y * sy, Math.ceil(sx), Math.ceil(sy));
      }
      const ring = (v, col, label) => { if (!v) return; ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc((v[1] + 0.5) * sx, (v[0] + 0.5) * sy, 7, 0, 6.283); ctx.stroke(); ctx.fillStyle = col; ctx.font = '700 12px "Helvetica Neue", Helvetica, Arial, sans-serif'; ctx.fillText(label, (v[1] + 0.5) * sx + 10, (v[0] + 0.5) * sy - 8); };
      if (last && last !== picks.wm && last !== picks.gm) ring(last, '#ffd43b', '?');
      ring(picks.wm, '#ff2d55', 'WM'); ring(picks.gm, '#20c997', 'GM');
    }
    function drawPlot() {
      const tr = [];
      const add = (v, name, hollow) => { if (!v) return; ANG.forEach((a, ai) => tr.push({ x: OFF, y: OFF.map((o, oi) => B.mt[brain.idx(oi, ai)][v[0]][v[1]]), mode: 'lines+markers', name: `${name} ${a}°`, line: { color: COL[ai], width: 1.5, dash: hollow ? 'dot' : 'solid' }, marker: { color: hollow ? '#fff' : COL[ai], size: 12, line: { color: COL[ai], width: 2.5 } }, hovertemplate: `${name} ${a}°: %{y:.3f}<extra></extra>` })); };
      add(picks.wm, 'WM', false); add(picks.gm, 'GM', true);
      if (last && last !== picks.wm && last !== picks.gm) add(last, 'clicked', true);
      plot(elPlot, tr, {
        xaxis: { type: 'log', title: { text: 'MT pulse offset' }, range: [Math.log10(300), Math.log10(25000)], tickvals: [300, 1000, 3000, 10000], ticktext: ['300 Hz', '1 kHz', '3 kHz', '10 kHz'] },
        yaxis: { title: { text: 'S<sub>MT</sub> / S<sub>MT off</sub>' }, range: [0, 1.04] },
        showlegend: tr.length > 0, legend: { x: 0.02, y: 0.02, yanchor: 'bottom', bgcolor: 'rgba(255,255,255,0.85)', font: { size: 13 }, entrywidth: 110 },
        margin: { l: 70, r: 16, t: 10, b: 56 },
      });
    }
    function prompt() {
      const t = $('pk-task');
      if (task === 'wm') t.innerHTML = '<b>1.</b> Click a <b style="color:#ff2d55">white matter</b> voxel.';
      else if (task === 'gm') t.innerHTML = '<b>2.</b> Now click a <b style="color:#20c997">grey matter</b> voxel.';
      else t.innerHTML = '✓ Both picked. They are the voxels of the next slides. Compare their Z-spectra: which one dips deeper, and why?';
    }
    cv.addEventListener('click', (e) => {
      const r = cv.getBoundingClientRect();
      const y = Math.floor((e.clientY - r.top) * (H2 / r.height) / (H2 / B.h)), x = Math.floor((e.clientX - r.left) * (W2 / r.width) / (W2 / B.w));
      if (!brain.inMask(y, x)) return;
      const v = [y, x], k = kind(v), fb = $('pk-fb');
      last = v;
      if (task === 'wm' || task === 'gm') {
        if (k === task) {
          picks[task] = v; if (window.MTEx63) window.MTEx63.setPick(task, v);
          fb.className = 'pk-fb right'; fb.textContent = task === 'wm' ? '✓ White matter: it dips the most.' : '✓ Grey matter: it dips less than white matter.';
          task = task === 'wm' ? 'gm' : 'done';
        } else {
          fb.className = 'pk-fb wrong';
          const what = { wm: 'more like white matter', gm: 'more like grey matter', mixed: 'like a mix of tissues (a partial-volume voxel)', csf: 'like it holds a lot of CSF: it hardly dips' }[k];
          fb.textContent = `✗ That voxel looks ${what}. Look at its points, then try another one.`;
        }
      }
      prompt(); drawImage(); drawPlot();
    });
    sel.addEventListener('change', drawImage);
    $('pk-reset').addEventListener('click', (e) => { e.currentTarget.blur(); picks.wm = null; picks.gm = null; last = null; task = 'wm'; $('pk-fb').textContent = ''; prompt(); drawImage(); drawPlot(); });
    prompt(); drawImage(); drawPlot();
  });

  // ------------------------------------------------------------------ the Z-spectrum, live
  W('s-zspec', (section) => {
    const el = $('z-plot');
    const xs = logspace(250, 40000, 22);
    const angles = [142, 426];
    const seq = (offset, angle) => ({ tr: 0.025, flipAngle: 7, mt: { shape: 'gausshann', duration: 0.01024, angle, offset } });
    const draw = throttle(() => {
      const t = { F: zF.get(), kf: zkf.get(), R1f: 1, R1r: 1, T2f: zt2f.get() / 1000, T2r: zt2r.get() * 1e-6 };
      const water = { ...t, F: 0 };
      const traces = [];
      angles.forEach((a, k) => {
        const col = k ? C.a426 : C.a142;
        traces.push({ x: xs, y: xs.map((o) => S.normalizedSignal(water, seq(o, a), { steps: 40 })), mode: 'lines', line: { color: col, width: 2, dash: 'dash' }, hovertemplate: `water alone, ${a}°: %{y:.3f}<extra></extra>` });
        traces.push({ x: xs, y: xs.map((o) => S.normalizedSignal(t, seq(o, a), { steps: 40 })), mode: 'lines', line: { color: col, width: 3.5, shape: 'spline' }, hovertemplate: `${a}°: %{y:.3f}<extra></extra>` });
        traces.push({ x: S.QMT_OFFSETS, y: S.QMT_OFFSETS.map((o) => S.normalizedSignal(t, seq(o, a), { steps: 40 })), mode: 'markers', marker: { color: '#fff', size: 10, line: { color: col, width: 2.5 } }, hoverinfo: 'skip' });
      });
      plot(el, traces, {
        xaxis: { type: 'log', title: { text: 'MT pulse offset' }, range: [Math.log10(250), Math.log10(40000)], tickvals: [300, 1000, 3000, 10000, 30000], ticktext: ['300 Hz', '1 kHz', '3 kHz', '10 kHz', '30 kHz'] },
        yaxis: { title: { text: 'S<sub>MT</sub> / S<sub>0</sub>' }, range: [0, 1.04] },
        annotations: [
          { x: Math.log10(18000), y: 0.12, text: '<b>142°</b>', showarrow: false, font: { color: C.a142, size: 17 } },
          { x: Math.log10(18000), y: 0.05, text: '<b>426°</b>', showarrow: false, font: { color: C.a426, size: 17 } },
          { x: Math.log10(18000), y: 0.19, text: 'MT pulse', showarrow: false, font: { color: C.muted, size: 14 } },
        ],
        margin: { l: 70, r: 20, t: 16, b: 60 },
      });
    });
    const zF = slider('z-F', (v) => `${(100 * v).toFixed(1)} %`, draw);
    const zkf = slider('z-kf', (v) => `${v.toFixed(1)} s⁻¹`, draw);
    const zt2r = slider('z-t2r', (v) => `${v.toFixed(1)} µs`, draw);
    const zt2f = slider('z-t2f', (v) => `${v.toFixed(0)} ms`, draw);
    const setT = (t) => { zF.set(t.F); zkf.set(t.kf); zt2r.set(t.T2r * 1e6); zt2f.set(t.T2f * 1000); draw(); };
    $('z-reset').addEventListener('click', (e) => { e.target.blur(); setT(S.TISSUES.wm); });
    $('z-gm').addEventListener('click', (e) => { e.target.blur(); setT(S.TISSUES.gm); });
    draw();
  });
})();
