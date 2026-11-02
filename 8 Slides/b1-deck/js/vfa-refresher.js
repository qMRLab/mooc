/* VFA refresher (Exercise 4-5, #vfa-refresher). One SPGR signal curve, S/A = (1 − E1) sin θ / (1 − E1 cos θ), E1 = e^(−TR/T1),
 * and the classic two-angle choice: the two angles whose signal is 0.71 × the Ernst-angle signal, one each side of the Ernst
 * angle acos(E1) (Deoni 2003). Left: the curve and the two points; right: the same two points in the linearized form,
 * S/sin θ against S/tan θ, on the line of slope E1 and intercept A(1 − E1). Fixed example: T1 = 1000 ms, TR = 15 ms.
 * #vfa-b1in, the same with a B1 slider (.vr-b1): the voxel gets B1·θn, so both points slide along the true curve and the true
 * line (faint rings: where they are at B1 = 1). */
(function () {
  'use strict';
  if (!window.Plotly) return;
  ['vfa-refresher', 'vfa-b1in', 'vfa-predict-a'].forEach((id) => { const sl = document.getElementById(id); if (sl) setup(sl); });
  function setup(slide) {
  const q = (c) => slide.querySelector(c), TR = 15, T1 = 1000, D2R = Math.PI / 180, F = 0.71, b1In = q('.vr-b1'), withB1 = !!b1In || slide.hasAttribute('data-vr-b1');
  const CURVE = '#1f5f99', PT = '#d2691e', GUIDE = '#c9d1da';
  const FONT = { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', size: 14, color: INK };
  const spgr = (a, e) => { const s = a * D2R; return ((1 - e) * Math.sin(s)) / (1 - e * Math.cos(s)); };
  function solve(lo, hi, target, e) {   // bisection: S is monotonic on each side of the Ernst angle
    const up = spgr(hi, e) > spgr(lo, e);
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if ((spgr(m, e) < target) === up) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  const axis = (title, extra) => Object.assign({ title: { text: title }, gridcolor: '#eef1f4', zeroline: false, fixedrange: true }, extra);
  const layout = (x, y, extra) => Object.assign({ width: 560, height: b1In ? 300 : 330, margin: { l: 64, r: 16, t: 12, b: 52 }, font: FONT, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
    xaxis: x, yaxis: y, showlegend: false, dragmode: false }, extra);
  const CFG = { displayModeBar: false, staticPlot: true };
  function draw() {
    const e = Math.exp(-TR / T1), b1 = b1In ? Number(b1In.value) : 1;
    if (b1In) q('.vr-b1-read').textContent = b1.toFixed(2);
    const ernst = Math.acos(e) / D2R, sE = spgr(ernst, e), target = F * sE;
    const nom = [solve(0.01, ernst, target, e), solve(ernst, 90, target, e)], pts = nom.map((a) => b1 * a);
    const xmax = 45;
    const FA = Array.from({ length: 400 }, (_, i) => 0.05 + (i * (xmax - 0.05)) / 399);
    const lab = pts.map((a, i) => withB1 ? `B₁θ${i ? '₂' : '₁'} = ${a.toFixed(1)}°` : `θ${i ? '₂' : '₁'} = ${a.toFixed(1)}°`);
    const X = (a) => spgr(a, e) / Math.tan(a * D2R), Y = (a) => spgr(a, e) / Math.sin(a * D2R);
    const ghost = (xs, ys) => (b1In ? [{ x: xs, y: ys, mode: 'markers', marker: { size: 12, color: 'rgba(0,0,0,0)', line: { color: PT, width: 1.5 } }, opacity: 0.45, hoverinfo: 'skip', cliponaxis: false }] : []);
    // left: the signal curve
    Plotly.react(q('.vr-plot-s'), [
      { x: [0, xmax], y: [target, target], mode: 'lines', line: { color: GUIDE, width: 1.5, dash: 'dot' }, hoverinfo: 'skip' },
      { x: [ernst, ernst], y: [0, sE], mode: 'lines', line: { color: GUIDE, width: 1.5, dash: 'dot' }, hoverinfo: 'skip' },
      { x: FA, y: FA.map((a) => spgr(a, e)), mode: 'lines', line: { color: CURVE, width: 3 }, hoverinfo: 'skip' },
      { x: [ernst], y: [sE], mode: 'markers+text', text: [`Ernst ${ernst.toFixed(1)}°`], textposition: 'top center', textfont: { size: 13, color: CURVE },
        marker: { size: 9, color: '#fff', line: { color: CURVE, width: 2.5 } }, hoverinfo: 'skip', cliponaxis: false },
      ...ghost(nom, nom.map((a) => spgr(a, e))),
      { x: pts, y: pts.map((a) => spgr(a, e)), mode: 'markers+text', text: lab, textposition: ['bottom right', 'top right'], textfont: { size: 14, color: PT },
        marker: { size: 12, color: PT }, hoverinfo: 'skip', cliponaxis: false },
    ], layout(axis(withB1 ? 'actual flip angle B₁θₙ (°)' : 'flip angle θ (°)', { range: [0, xmax] }), axis('signal, S / A', { range: [0, sE * 1.25], tickformat: '.2f' }), {
      annotations: [{ x: xmax, y: target, xanchor: 'right', yanchor: 'bottom', text: '0.71 × max', showarrow: false, font: { size: 12, color: '#7b8794' } }],
    }), CFG);
    // right: the linearized form, S/tanθ on x, S/sinθ on y
    Plotly.react(q('.vr-plot-l'), [
      { x: [0, 1], y: [1 - e, 1], mode: 'lines', line: { color: CURVE, width: 3 }, hoverinfo: 'skip' },
      ...ghost(nom.map(X), nom.map(Y)),
      { x: pts.map(X), y: pts.map(Y), mode: 'markers+text', text: lab, textposition: ['bottom right', 'bottom right'], textfont: { size: 14, color: PT },
        marker: { size: 12, color: PT }, hoverinfo: 'skip', cliponaxis: false },
    ], layout(axis(withB1 ? 'S / tan(B₁θₙ)' : 'S / tan θ', { range: [0, 1.05] }), axis(withB1 ? 'S / sin(B₁θₙ)' : 'S / sin θ', { range: [Math.max(0, 1 - e - 0.02), 1.02], tickformat: '.2f' }), {
      annotations: [{ x: 0.5, y: 1 - e / 2, xref: 'x', yref: 'y', text: `slope = E<sub>1</sub> = ${e.toFixed(3)}`, showarrow: false, xanchor: 'left', yanchor: 'top', xshift: 14, yshift: -6, font: { size: 13, color: CURVE } }],
    }), CFG);
  }
  if (b1In) { b1In.addEventListener('input', draw); keepSlider(b1In); }
  onShow(slide, draw);
  }
})();
