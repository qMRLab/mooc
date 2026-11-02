/* Is AFI as easy as DAM? (Exercise 4-3, #afi-ratio). The ratio of the two images against B1 (0.5–1.5): AFI's
 * r = S2/S1 = (1 + n cos θ)/(n + cos θ), θ = 60°·B1, n = TR2/TR1 (TRs ≪ T1, Yarnykh 2007), from the .ar-n slider, and DAM's
 * S(120°)/S(60°) = 2 cos θ (long TR) for comparison. DAM crosses 1 at B1 = 1 (the two images are equal there, so "which is
 * brighter?" gives the answer); AFI's value at B1 = 1 is (1 + n/2)/(n + 1/2), not 1 (and with n = 1 it is 1 for every B1). */
(function () {
  'use strict';
  const slide = document.getElementById('afi-ratio'); if (!slide || !window.Plotly) return;
  const q = (c) => slide.querySelector(c), host = q('.ar-plot'), nIn = q('.ar-n'), D2R = Math.PI / 180;
  const B = Array.from({ length: 201 }, (_, i) => 0.5 + i / 200);
  const afi = (b, n) => { const c = Math.cos(60 * b * D2R); return (1 + n * c) / (n + c); };
  const dam = (b) => 2 * Math.cos(60 * b * D2R);
  const AFI = '#1f5f99', DAM = '#9aa5b1', FONT = { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', size: 14, color: INK };
  function draw() {
    const n = Number(nIn.value), r1 = afi(1, n);
    q('.ar-n-read').textContent = n.toFixed(1);
    slide.querySelectorAll('.ar-r1').forEach((e) => { e.textContent = r1.toFixed(2); });
    slide.querySelectorAll('.ar-pct').forEach((e) => { e.textContent = `${Math.round(100 * r1)} %`; });
    const one = n === 1;   // TR2 = TR1: the ratio is 1 everywhere, the 'not 1' bullet would contradict itself
    q('.ar-afi').hidden = one; q('.ar-same').hidden = one; q('.ar-afi1').hidden = !one;
    Plotly.react(host, [
      { x: [0.5, 1.5], y: [1, 1], mode: 'lines', line: { color: '#c9d1da', width: 1.5, dash: 'dot' }, hoverinfo: 'skip', showlegend: false },
      { x: B, y: B.map(dam), mode: 'lines', name: 'DAM: S(120°) / S(60°)', line: { color: DAM, width: 3, dash: 'dash' }, hoverinfo: 'skip' },
      { x: B, y: B.map((b) => afi(b, n)), mode: 'lines', name: `AFI: S₂ / S₁ (TR₂ = ${n.toFixed(1)} × TR₁)`, line: { color: AFI, width: 4 }, hoverinfo: 'skip' },
      { x: [1, 1], y: [1, r1], mode: 'markers+text', text: ['1.00', r1.toFixed(2)], textposition: ['top right', 'bottom left'], textfont: { size: 15, color: [DAM, AFI] },
        marker: { size: 12, color: ['#fff', AFI], line: { color: [DAM, AFI], width: 3 } }, hoverinfo: 'skip', showlegend: false },
    ], {
      width: 640, height: 440, margin: { l: 64, r: 16, t: 10, b: 56 }, font: FONT, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      xaxis: { title: { text: 'B₁' }, range: [0.5, 1.5], dtick: 0.25, gridcolor: '#eef1f4', zeroline: false, fixedrange: true },
      yaxis: { title: { text: 'ratio of the two images' }, range: [0, 1.8], tickvals: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75], gridcolor: '#eef1f4', zeroline: false, fixedrange: true },
      shapes: [{ type: 'line', x0: 1, x1: 1, y0: 0, y1: 1.8, line: { color: '#c9d1da', width: 1.5, dash: 'dot' } }],
      legend: { x: 0.98, xanchor: 'right', y: 0.98, bgcolor: 'rgba(255,255,255,0.85)' }, dragmode: false,
    }, { displayModeBar: false, staticPlot: true });
  }
  nIn.addEventListener('input', draw); keepSlider(nIn);
  onShow(slide, draw);
})();
