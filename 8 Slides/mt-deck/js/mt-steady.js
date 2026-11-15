/* "Pulse after pulse, to a steady state" (Exercise 6-2, moved from the lecture): 80 TRs of the Karakuzu Siemens
 * MT-weighted protocol from equilibrium, for white matter, grey matter or a water phantom, with one TR zoomed in (a TR
 * slider, or a click on the top plot), the MT pulse's power, water's exchange vs T1 rates, and an optional MT-off overlay. */
(function () {
  'use strict';
  const { S, C, plot, seg, slider, throttle } = window.MT;
  const W = window.MTDeck.widget;
  const $ = (id) => document.getElementById(id);
  const KS = S.MTSAT_PROTOCOLS.karakuzuSiemens;
  const WM1 = { ...S.TISSUES.wm, R1f: 1 };   // healthy WM with T1 = 1 s, as in the lecture

  W('s-tr', (section) => {
    const NTR = 80;
    const elAll = $('tr-all'), elOne = $('tr-one');
    let tissue = 'wm', sel = 1, run = null;   // opens on TR 2, where exchange visibly drags water down after the pulse
    // water phantom: doped water, T1 = T2 = 1 s, no macromolecular pool (F = 0, so no exchange): only direct effects
    const tissues = { wm: WM1, gm: { ...S.TISSUES.gm }, water: { name: 'Water phantom', F: 0, kf: 0, R1f: 1, R1r: 1, T2f: 1, T2r: 12.3e-6 } };
    const seq = KS.mtw;
    // MT off: the same sequence without the MT pulse, its excitation at the same time in the TR (after the pulse's 10 ms)
    const seqOff = { ...seq, mt: null, ts: (seq.ts == null ? 3e-3 : seq.ts) + seq.mt.duration };
    let showOff = false, runOff = null;
    function compute() {
      run = S.trajectory(tissues[tissue], seq, NTR, { steps: 48, restSamples: 18 });
      runOff = S.trajectory(tissues[tissue], seqOff, NTR, { restSamples: 18 });
      const ss = S.steadyState(tissues[tissue], seq).beforeExcitation[0];
      const first = run.marks[0].beforeExcitation[0];
      const n95 = run.marks.findIndex((m) => Math.abs(m.beforeExcitation[0] - ss) <= 0.05 * Math.abs(first - ss));
      $("tr-n95").textContent = n95 < 0 ? `> ${NTR}` : `~${n95 + 1}`;
      run.ss = ss;
    }
    function drawAll() {
      const t = tissues[tissue];
      const sig = run.marks.map((m) => m.beforeExcitation[0]);
      const tSig = run.marks.map((m, k) => k * seq.tr + seq.mt.duration + 0.003);
      plot(elAll, [
        { x: run.t, y: run.mzf, mode: 'lines', line: { color: C.free, width: 1.6 }, hovertemplate: 'water Mz %{y:.3f}<extra></extra>' },
        ...(t.F > 0 ? [{ x: run.t, y: run.mzr.map((v) => v / t.F), mode: 'lines', line: { color: C.restr, width: 1.6 }, hovertemplate: 'macromolecules %{y:.3f}<extra></extra>' }] : []),
        { x: tSig, y: sig, mode: 'markers', marker: { color: C.ink, size: 5 }, hovertemplate: 'TR %{pointNumber}: water Mz at readout %{y:.3f}<extra></extra>' },
        ...(showOff ? [
          { x: runOff.t, y: runOff.mzf, mode: 'lines', line: { color: C.free, width: 1.6, dash: 'dash' }, opacity: 0.7, hovertemplate: 'MT off: water Mz %{y:.3f}<extra></extra>' },
          ...(t.F > 0 ? [{ x: runOff.t, y: runOff.mzr.map((v) => v / t.F), mode: 'lines', line: { color: C.restr, width: 1.6, dash: 'dash' }, opacity: 0.7, hovertemplate: 'MT off: macromolecules %{y:.3f}<extra></extra>' }] : []),
        ] : []),
      ], {
        xaxis: { title: { text: 'time (s)' } }, yaxis: { title: { text: 'Mz / M0' }, range: [0, 1.04] },
        margin: { l: 66, r: 16, t: 10, b: 50 },
        shapes: [
          { type: 'rect', x0: sel * seq.tr, x1: (sel + 1) * seq.tr, yref: 'paper', y0: 0, y1: 1, fillcolor: C.ink, opacity: 0.12, line: { width: 0 } },
          { type: 'line', xref: 'paper', x0: 0, x1: 1, y0: run.ss, y1: run.ss, line: { color: C.free, dash: 'dot', width: 1 } },
        ],
        annotations: [
          { xref: 'paper', x: 0.99, y: 0.97, yref: 'paper', text: `<span style="color:#1f5f99">■</span> water   ${t.F > 0 ? '<span style="color:#c2410c">■</span> macromolecules ÷ F   ' : ''}● readout${showOff ? '<br>dashed: MT off' : ''}`, align: 'right', yanchor: 'top', showarrow: false, xanchor: 'right', bgcolor: 'rgba(255,255,255,0.85)', font: { size: 14 } },
        ],
      });
    }
    function drawOne() {
      const t = tissues[tissue];
      // the selected TR, from its own start, finely sampled
      const start = run.marks[sel].before;
      const one = S.trajectory(t, seq, 1, { steps: 96, restSamples: 60, start });
      const ms = one.t.map((v) => v * 1000);
      const D = seq.mt.duration, env = S.envelope(seq.mt.shape, D, seq.mt.bandwidth);
      // water's two slow rates just after the MT pulse: the exchange drain, k_f (m_r - m_f), and T1 recovery, R1f (1 - m_f).
      // Early on the drain wins; at steady state water sits low enough that T1 recovery cancels it, so its curve is flat.
      const k = one.t.findIndex((v) => v >= seq.mt.duration + 1e-4), mf = one.mzf[k], mr = t.F > 0 ? one.mzr[k] / t.F : mf;
      const ex = t.kf * (mr - mf), rec = t.R1f * (1 - mf), f2 = (v) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(2)}`;
      const rateText = t.F > 0
        ? `water after the pulse: <span style="color:${C.restr}">exchange ${f2(ex)}/s</span> · T<sub>1</sub> recovery ${f2(rec)}/s · net <b>${f2(ex + rec)}/s</b>`
        : `water after the pulse: no macromolecules, no exchange · T<sub>1</sub> recovery ${f2(rec)}/s`;
      const off = showOff ? S.trajectory(t, seqOff, 1, { restSamples: 60, start: runOff.marks[sel].before }) : null;
      // with MT off overlaid, water and macromolecules share one range (both as fractions of their M0), so they compare directly
      let shared = null;
      if (off) {
        const vals = [...one.mzf, ...off.mzf, ...(t.F > 0 ? [...one.mzr, ...off.mzr].map((v) => v / t.F) : [])];
        const lo = Math.min(...vals), hi = Math.max(...vals), pad = 0.05 * (hi - lo || 0.01);
        shared = [lo - pad, hi + pad];
      }
      const pms = Array.from({ length: 201 }, (_, i) => (D * 1000 * i) / 200), pow = pms.map((v) => env(v / 1000) ** 2);
      plot(elOne, [
        { x: ms, y: one.mzf, mode: 'lines', line: { color: C.free, width: 3 }, hovertemplate: 'water %{y:.4f}<extra></extra>' },
        ...(t.F > 0 ? [{ x: ms, y: one.mzr.map((v) => v / t.F), mode: 'lines', line: { color: C.restr, width: 3 }, yaxis: 'y2', hovertemplate: 'macromolecules %{y:.4f}<extra></extra>' }] : []),
        ...(off ? [
          { x: off.t.map((v) => v * 1000), y: off.mzf, mode: 'lines', line: { color: C.free, width: 2.5, dash: 'dash' }, opacity: 0.7, hovertemplate: 'MT off: water %{y:.4f}<extra></extra>' },
          ...(t.F > 0 ? [{ x: off.t.map((v) => v * 1000), y: off.mzr.map((v) => v / t.F), mode: 'lines', line: { color: C.restr, width: 2.5, dash: 'dash' }, opacity: 0.7, yaxis: 'y2', hovertemplate: 'MT off: macromolecules %{y:.4f}<extra></extra>' }] : []),
        ] : []),
        // the MT pulse's power, ω1(t)² (it sets the saturation rate W): nearly nothing in its first and last ~2 ms, so
        // there the restricted pool keeps recovering (exchange with water, T1) until the power has built up
        { x: pms, y: pow, mode: 'lines', line: { width: 0 }, fill: 'tozeroy', fillcolor: `${C.restr}26`, yaxis: 'y3', hoverinfo: 'skip' },
      ], {
        xaxis: { title: { text: `time within TR ${sel + 1} (ms)` }, range: [0, 32] },
        yaxis: { title: { text: 'water Mz', font: { color: C.free } }, tickfont: { color: C.free }, ...(shared ? { range: shared } : {}) },
        yaxis2: { title: { text: 'macromol. Mz ÷ F', font: { color: C.restr } }, tickfont: { color: C.restr }, overlaying: 'y', side: 'right', showgrid: false, visible: t.F > 0, ...(shared ? { range: shared } : {}) },
        margin: { l: 66, r: 70, t: 30, b: 50 },
        yaxis3: { overlaying: 'y', range: [0, 1.15], visible: false, fixedrange: true },
        shapes: [{ type: 'line', x0: 13, x1: 13, yref: 'paper', y0: 0, y1: 1, line: { color: C.free, width: 1.5, dash: 'dot' } }],
        annotations: [{ xref: 'paper', yref: 'paper', x: 0, y: 1, xanchor: 'left', yanchor: 'bottom', yshift: 4, text: rateText, showarrow: false, font: { size: 14, color: C.free } },
          { x: off ? D * 500 + 1.4 : 0.4, y: off ? 0.55 : 0.06, yref: 'y3', xanchor: 'left', yanchor: 'bottom', text: 'MT pulse<br>power', align: 'left', showarrow: false, font: { color: C.restr, size: 13 } },
          { x: 13.4, y: off ? 0.55 : 0.02, yref: 'paper', xanchor: 'left', yanchor: 'bottom', text: 'excitation', showarrow: false, font: { color: C.free, size: 13 } }],
      });
    }
    function all() { compute(); drawAll(); drawOne(); }
    // the TR shown below: a slider (1 to 80), or a click on the top plot; both keep each other in step
    const redraw = throttle(() => { drawAll(); drawOne(); });
    const trSel = slider('tr-sel', (v) => v, (v) => { sel = v - 1; redraw(); });
    const choose = (n) => { sel = Math.max(0, Math.min(NTR - 1, n)); trSel.set(sel + 1); redraw(); };
    seg(section, 'tissue', (v) => { tissue = v; all(); });
    $('tr-off').addEventListener('change', (e) => { showOff = e.target.checked; drawAll(); drawOne(); });
    all();
    elAll.on('plotly_click', (ev) => {
      const t = ev.points && ev.points[0] && ev.points[0].x;
      if (t != null) choose(Math.floor(t / seq.tr));
    });
  });

})();
