/* Exercise 6-3: MTsat by hand (a) from three two-pool-simulated SPGR signals (js/mt-sim.js), the approximations against
 * the simulation's truth (b), then MTsat of a real voxel and the MTR / MTsat maps of the chapter's slice (c). */
(function () {
  'use strict';
  const { S, C, plot, seg, brain, brainHeat, brainAxes } = window.MT;
  const W = window.MTDeck.widget;
  const $ = (id) => document.getElementById(id);
  const DEG = Math.PI / 180;

  // (a, b): healthy WM as in the chapter's Appendix C (T1 = 1 s), Karakuzu 2022 Siemens protocol
  const tissue = { ...S.TISSUES.wm, R1f: 1 };
  const P = S.MTSAT_PROTOCOLS.karakuzuSiemens;
  const SCALE = 10000;
  const round1 = (v) => Math.round(v * SCALE * 10) / 10;   // the signals as shown (one decimal)
  const sig = { MT: round1(S.signal(tissue, P.mtw)), PD: round1(S.signal(tissue, { ...P.pdw, mt: null })), T1: round1(S.signal(tissue, { ...P.t1w, mt: null })) };
  const h = S.helms({ sMT: sig.MT, sPD: sig.PD, sT1: sig.T1, aMT: P.mtw.flipAngle, aPD: P.pdw.flipAngle, aT1: P.t1w.flipAngle, trMT: P.mtw.tr, trPD: P.pdw.tr, trT1: P.t1w.tr });
  const mtrVal = 100 * (1 - sig.MT / sig.PD);
  $('ex63-r1').dataset.answer = h.R1;
  $('ex63-A').dataset.answer = h.A;
  $('ex63-mts').dataset.answer = h.mtsat;
  $('ex63-mtr').dataset.answer = mtrVal;

  W('ex63-a', () => {
    const row = (name, s, seq) => `<tr><td>${name}</td><td>${seq.flipAngle}°</td><td>${(seq.tr * 1000).toFixed(0)} ms</td><td>${seq.mt ? `${seq.mt.angle}° at ${(seq.mt.offset / 1000).toFixed(1)} kHz` : '–'}</td><td><b>${s.toFixed(1)}</b></td></tr>`;
    $('ex63-sig').innerHTML = '<tr><th>Image</th><th>α</th><th>TR</th><th>MT pulse</th><th>Signal</th></tr>' +
      row('MTw', sig.MT, P.mtw) + row('PDw', sig.PD, P.pdw) + row('T<sub>1</sub>w', sig.T1, P.t1w);
    const a = (d) => (d * DEG).toFixed(5);
    $('ex63-a-ans').innerHTML = `<p>α<sub>PD</sub> = α<sub>MT</sub> = ${a(6)} rad, α<sub>T1</sub> = ${a(20)} rad.</p>
      <p>R<sub>1</sub> = <b>${h.R1.toFixed(3)} s⁻¹</b> (T<sub>1</sub> = ${h.T1.toFixed(3)} s) · A = <b>${h.A.toFixed(0)}</b> · MTsat = <b>${h.mtsat.toFixed(2)} %</b></p>`;
  });

  W('ex63-b', () => {
    const trueT1 = 1 / S.r1Observed(tissue);
    const b = S.budget(tissue, P.mtw);
    const loss = -100 * (b.exPulse + b.exAfter + b.direct);
    const box = $('ex63-cmp');
    const fill = () => {
      box.innerHTML = '<tr><th></th><th>From the images</th><th>Truth (simulation)</th></tr>' +
        `<tr><td>T<sub>1</sub></td><td class="you">${h.T1.toFixed(2)} s</td><td>${trueT1.toFixed(2)} s</td></tr>` +
        `<tr><td>MTsat vs MT loss per TR</td><td class="you">${h.mtsat.toFixed(2)} %</td><td>${loss.toFixed(2)} %</td></tr>` +
        `<tr><td>MTR</td><td class="you">${mtrVal.toFixed(1)} %</td><td>–</td></tr>`;
    };
    fill();
    plot($('ex63-plot-b'), [{
      type: 'bar', x: ['T₁ (s)', 'MTsat (%)', 'MTR ÷ 10 (%)'], y: [h.T1, h.mtsat, mtrVal / 10], name: 'from the images', marker: { color: C.mtsat },
      text: [h.T1.toFixed(2), h.mtsat.toFixed(2), (mtrVal).toFixed(1)], textposition: 'outside', hoverinfo: 'skip',
    }, {
      type: 'bar', x: ['T₁ (s)', 'MTsat (%)', 'MTR ÷ 10 (%)'], y: [trueT1, loss, null], name: 'truth', marker: { color: '#c9d3de' },
      text: [trueT1.toFixed(2), loss.toFixed(2), ''], textposition: 'outside', hoverinfo: 'skip',
    }], { barmode: 'group', showlegend: true, legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: 1.08, font: { size: 15 } }, yaxis: { range: [0, 7.5] }, margin: { l: 50, r: 20, t: 40, b: 50 } });
  });

  // (c): the real slice
  W('ex63-c', (section) => {
    if (!brain) return;
    const B = brain.B, K = brain.idx(1, 1), TR = 0.025;
    const n = (y, x) => B.mt[K][y][x];
    const mtsat = (y, x) => { const a = 7 * DEG * B.B1[y][x]; return 100 * (B.R1[y][x] * TR + (a * a) / 2) * (1 / n(y, x) - 1); };
    const mtr = (y, x) => 100 * (1 - n(y, x));
    let vox = brain.preset('wm'), shown = false, corr = false;
    function voxel() {
      const [y, x] = vox;
      $('ex63-vox').innerHTML = `<tr><td>S<sub>MT</sub> / S<sub>0</sub></td><td><b>${n(y, x).toFixed(3)}</b></td></tr><tr><td>T<sub>1</sub></td><td><b>${(1 / B.R1[y][x]).toFixed(3)} s</b></td></tr><tr><td>B<sub>1</sub></td><td><b>${B.B1[y][x].toFixed(3)}</b></td></tr>`;
      const box = $('ex63-vmts');
      // the answer from the values as shown
      const nn = Number(n(y, x).toFixed(3)), R1 = 1 / Number((1 / B.R1[y][x]).toFixed(3)), a = 7 * DEG * Number(B.B1[y][x].toFixed(3));
      box.dataset.answer = 100 * (R1 * TR + (a * a) / 2) * (1 / nn - 1);
      box.querySelector('.ask-fb').textContent = '';
    }
    const ratio = (f) => brain.median(brain.voxels.filter(([y, x]) => brain.wmLike(y, x)).map(([y, x]) => f(y, x))) / brain.median(brain.voxels.filter(([y, x]) => brain.gmLike(y, x)).map(([y, x]) => f(y, x)));
    const mtsatShown = (y, x) => (corr ? S.correctMTsatB1(mtsat(y, x), B.B1[y][x]) : mtsat(y, x));
    const sorted = brain.voxels.map(([y, x]) => mtsat(y, x)).filter(Number.isFinite).sort((a, b) => a - b);
    const sMax = Math.ceil(sorted[Math.floor(0.98 * (sorted.length - 1))] * 2) / 2;
    function draw() {
      const marker = { type: 'scatter', x: [vox[1]], y: [vox[0]], mode: 'markers', marker: { symbol: 'circle-open', size: 14, color: '#ff2d55', line: { width: 3 } }, hoverinfo: 'skip' };
      const ax = (dom, a) => ({ domain: dom, visible: false, fixedrange: true, anchor: a });
      const ay = (a) => ({ visible: false, autorange: 'reversed', scaleanchor: a, scaleratio: 1, fixedrange: true, anchor: a });
      if (!shown) {
        plot($('ex63-plot-c'), [brainHeat(brain.grid((y, x) => B.S0 ? B.S0[y][x] : B.F[y][x]), { colorscale: [[0, '#000'], [1, '#fff']], zmin: 0, zmax: 1, showscale: false, hovertemplate: 'click to pick this voxel<extra></extra>' }), marker], brainAxes());
        return;
      }
      plot($('ex63-plot-c'), [
        brainHeat(brain.grid(mtr), { zmin: 0, zmax: 60, xaxis: 'x', yaxis: 'y', colorbar: { title: { text: 'MTR (%)', side: 'right' }, x: 0.41, thickness: 12, len: 0.8 }, hovertemplate: 'MTR %{z:.1f} %<extra></extra>' }),
        brainHeat(brain.grid(mtsatShown), { zmin: 0, zmax: sMax, xaxis: 'x2', yaxis: 'y2', colorbar: { title: { text: 'MTsat (%)', side: 'right' }, x: 1.0, thickness: 12, len: 0.8 }, hovertemplate: 'MTsat %{z:.2f} %<extra></extra>' }),
        { ...marker }, { ...marker, xaxis: 'x2', yaxis: 'y2' },
      ], {
        xaxis: ax([0, 0.4], 'y'), yaxis: ay('x'), xaxis2: ax([0.55, 0.95], 'y2'), yaxis2: ay('x2'),
        margin: { l: 4, r: 50, t: 30, b: 4 }, plot_bgcolor: 'rgba(0,0,0,0)',
        annotations: [
          { xref: 'paper', yref: 'paper', x: 0.2, y: 1.05, text: `<b>MTR</b> · WM/GM ${ratio(mtr).toFixed(2)}`, showarrow: false, font: { size: 16, color: C.mtr } },
          { xref: 'paper', yref: 'paper', x: 0.76, y: 1.05, text: `<b>MTsat${corr ? ' (B₁-corr.)' : ''}</b> · WM/GM ${ratio(mtsatShown).toFixed(2)}`, showarrow: false, font: { size: 16, color: C.mtsat } },
        ],
      });
    }
    const pick = (ev) => {
      const p = ev.points && ev.points[0];
      if (!p) return;
      const y = Math.round(p.y), x = Math.round(p.x);
      if (!brain.inMask(y, x)) return;
      vox = [y, x]; voxel(); draw();
    };
    const box = section.querySelector('[data-ctl="contrast"]');
    box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      b.blur();
      box.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const rM = ratio(mtr), rS = ratio(mtsat);
      const right = rS > rM ? 'mtsat' : 'mtr';
      $('ex63-contrast-fb').innerHTML = `${b.dataset.v === right ? '✓ Right' : '✗ Not this time'}: white/grey matter ratio ${rM.toFixed(2)} in MTR, <b>${rS.toFixed(2)}</b> in MTsat. Grey matter's longer T<sub>1</sub> raises its MTR and narrows the gap; MTsat removes that.`;
      shown = true; $('ex63-corr').hidden = false; draw();
    }));
    seg(section, 'corr', (v) => { corr = v === '1'; draw(); });
    voxel(); draw();
    $('ex63-plot-c').on('plotly_click', pick);   // after the first plot: Plotly adds .on() to the element
  });
})();
