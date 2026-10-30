/* The α = 60° and 2α = 120° magnetization vectors (or any other pair, from data-angles="a1,a2" on root), tipped from +z
 * towards the right by 60°·B1 and 120°·B1 (B1 slider 0.5–1.5). The signal is each vector's horizontal (transverse) component, sin θ, drawn as a bar right below on the same
 * scale (1 = the full magnetization). Ghosts: the vectors at B1 = 1. Used on #guess-why (why the quiz can be aced) and
 * #build (to read off the ratio S120/S60 for a B1), and on #rule-other with 45° and 135°. root holds the svg, the .gw-b1
 * slider and the readouts. */
function arrowsDiagram(root, id) {
  'use strict';
  if (!root) return;
  const svg = root.querySelector('svg'), NS = 'http://www.w3.org/2000/svg', DEG = Math.PI / 180;
  const OX = 170, OY = 215, R = 185, BAR = [420, 462];   // origin, radius, bar rows (y)
  const ANG = (root.dataset.angles || '60,120').split(',').map(Number), COLS = ['#e8770e', '#1f5f99'];
  const el = (tag, at, parent = svg) => { const e = document.createElementNS(NS, tag); Object.entries(at).forEach(([k, v]) => e.setAttribute(k, v)); parent.appendChild(e); return e; };
  const tip = (th, r = R) => [OX + r * Math.sin(th * DEG), OY - r * Math.cos(th * DEG)];
  const ink = INK, muted = '#9aa5b1';

  // static: axes, unit circle, the bar scale
  el('defs', {}).innerHTML = ['ink', 0, 1].map((k) => `<marker id="${id}-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${k === 'ink' ? ink : COLS[k]}"/></marker>`).join('');
  el('path', { d: `M ${OX} ${OY - R} A ${R} ${R} 0 0 1 ${OX} ${OY + R}`, fill: 'none', stroke: '#d8dee6', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' });
  el('line', { x1: OX, y1: OY + R + 6, x2: OX, y2: OY - R - 24, stroke: ink, 'stroke-width': 1.5, 'marker-end': `url(#${id}-ink)` });
  el('line', { x1: OX - 20, y1: OY, x2: OX + R + 40, y2: OY, stroke: ink, 'stroke-width': 1.5, 'marker-end': `url(#${id}-ink)` });
  el('text', { x: OX + 8, y: OY - R - 16, 'font-size': 16 }).textContent = 'z (M₀)';
  el('text', { x: OX - 26, y: OY - 4, 'font-size': 15, 'text-anchor': 'end' }).textContent = 'transverse';
  el('text', { x: OX - 26, y: OY + 14, 'font-size': 13, 'text-anchor': 'end', fill: '#5b6773' }).textContent = '= signal';
  const x1 = OX + R, s1 = Math.sin(ANG[0] * DEG), s2 = Math.sin(ANG[1] * DEG);
  el('line', { x1: OX, y1: BAR[0] - 22, x2: OX, y2: BAR[1] + 14, stroke: ink, 'stroke-width': 1.5 });
  el('line', { x1, y1: BAR[0] - 22, x2: x1, y2: BAR[1] + 14, stroke: ink, 'stroke-width': 1, 'stroke-dasharray': '3 3' });
  el('text', { x: x1, y: BAR[1] + 32, 'font-size': 13, 'text-anchor': 'middle' }).textContent = '1';
  if (Math.abs(s1 - s2) < 0.005) {   // the two images agree at B1 = 1 (60° and 120°): mark that level
    const xr = OX + R * s1;
    el('line', { x1: xr, y1: BAR[0] - 22, x2: xr, y2: BAR[1] + 14, stroke: muted, 'stroke-width': 1, 'stroke-dasharray': '2 4' });
    el('text', { x: xr, y: BAR[0] - 28, 'font-size': 13, 'text-anchor': 'middle', fill: '#5b6773' }).textContent = `${s1.toFixed(2)} (both, at B₁ = 1)`;
  }
  el('text', { x: OX, y: BAR[1] + 32, 'font-size': 13, 'text-anchor': 'middle' }).textContent = '0';
  // ghosts at B1 = 1
  ANG.forEach((a, k) => { const [x, y] = tip(a); el('line', { x1: OX, y1: OY, x2: x, y2: y, stroke: COLS[k], 'stroke-width': 2, 'stroke-dasharray': '4 5', opacity: 0.45 }); });

  // dynamic
  const g = el('g', {});
  function draw(b1) {
    g.replaceChildren();
    ANG.forEach((a, k) => {
      const th = a * b1, [x, y] = tip(th), s = Math.sin(th * DEG), c = COLS[k], yb = BAR[k];
      el('path', { d: `M ${OX} ${OY - 46} A 46 46 0 ${th > 180 ? 1 : 0} 1 ${tip(th, 46).join(' ')}`, fill: 'none', stroke: c, 'stroke-width': 2 }, g);
      el('line', { x1: x, y1: y, x2: x, y2: yb, stroke: c, 'stroke-width': 1.2, 'stroke-dasharray': '3 4', opacity: 0.8 }, g);
      el('line', { x1: OX, y1: OY, x2: x, y2: y, stroke: c, 'stroke-width': 4, 'marker-end': `url(#${id}-${k})` }, g);
      let [lx, ly] = tip(th, R + 26), anchor = th > 165 ? 'middle' : 'start';
      if (th < 25) { [lx, ly] = tip(th, R * 0.72); lx += 14; }   // near z: beside the arrow, clear of the z label
      else if (Math.abs(th - 90) < 12) { [lx, ly] = tip(th, R * 0.55); ly -= 16; anchor = 'middle'; }   // near the transverse axis: above the arrow
      el('text', { x: lx, y: ly + 5, 'font-size': 16, 'font-weight': 700, fill: c, 'text-anchor': anchor }, g).textContent = `${a}° × B₁ = ${th.toFixed(0)}°`;
      el('rect', { x: OX, y: yb - 12, width: Math.max(0, R * s), height: 24, fill: c, opacity: 0.85, rx: 2 }, g);
      el('text', { x: OX - 10, y: yb + 5, 'font-size': 15, 'font-weight': 700, fill: c, 'text-anchor': 'end' }, g).textContent = `${a}° image`;
      el('text', { x: OX + R * s + 8, y: yb + 5, 'font-size': 15, fill: ink }, g).textContent = s.toFixed(2);
    });
    const s60 = Math.abs(Math.sin(ANG[0] * b1 * DEG)), s120 = Math.abs(Math.sin(ANG[1] * b1 * DEG)), q = (c) => root.querySelector(c);
    q('.gw-b1-read').textContent = b1.toFixed(2);
    q('.gw-s60').textContent = `${(ANG[0] * b1).toFixed(0)}° → ${s60.toFixed(3)}`;
    q('.gw-s120').textContent = `${(ANG[1] * b1).toFixed(0)}° → ${s120.toFixed(3)}`;
    q('.gw-who').textContent = Math.abs(s60 - s120) < 0.005 ? 'equal' : s60 > s120 ? `the ${ANG[0]}° image` : `the ${ANG[1]}° image`;
    const rt = q('.gw-ratio'); if (rt) rt.textContent = (s120 / s60).toFixed(2);
  }
  const sl = root.querySelector('.gw-b1');
  sl.addEventListener('input', () => draw(Number(sl.value))); keepSlider(sl);
  const why = root.querySelector('.gw-why'), btn = root.querySelector('.gw-show');
  if (btn) btn.addEventListener('click', () => { why.hidden = !why.hidden; btn.setAttribute('aria-pressed', String(!why.hidden)); btn.textContent = why.hidden ? 'Show the rule' : 'Hide the rule'; btn.blur(); });
  draw(1);
}
arrowsDiagram(document.getElementById('guess-why'), 'gw');
arrowsDiagram(document.querySelector('#build .bd-arrows'), 'bdw');
arrowsDiagram(document.getElementById('rule-other'), 'ro');
