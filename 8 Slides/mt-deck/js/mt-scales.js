/* Slide "Two timescales": water's free-induction decay over 300 ms (T2 = 70 ms, top) next to an MPRAGE image, and its
 * first 0.1 ms zoomed in (bottom): a fast decay (T2 ≈ 12 µs) down to the slow part, next to an image that does not
 * exist. Who the fast part belongs to is left for the next slide. The zoom lines are drawn in an SVG over the grid, from the plots' axis geometry. */
(function () {
  'use strict';
  const { C, plot } = window.MT;
  const $ = (id) => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';

  window.MTDeck.widget('s-scales', () => {
    // one on-resonance FID with two components: a slow one (T2 = 70 ms, white matter at 3 T) and a fast one (T2 ≈ 12 µs,
    // a fraction A of the signal, A = F/(1+F) with F = 15 %). At the ms scale the fast part is a drop at t = 0; zoomed in,
    // the signal falls to the slow part's start, not to zero.
    const T2F = 70, T2R = 12e-3, ZOOM_MS = 0.1, A = 0.13;
    const ZOOM = '#d62828';   // the zoom: square, lines and the lower plot's frame
    const slow = (ms) => (1 - A) * Math.exp(-ms / T2F);
    const total = (ms) => slow(ms) + A * Math.exp(-ms / T2R);
    const lin = (n, max) => Array.from({ length: n + 1 }, (_, i) => (max * i) / n);
    const axisFont = { size: 14 };
    const common = (xTitle, xMax, color) => ({
      xaxis: { title: { text: xTitle, font: axisFont }, range: [0, xMax], linecolor: color, linewidth: 2, mirror: true },
      yaxis: { title: { text: 'signal', font: axisFont }, range: [0, 1.08], tickvals: [0, 0.5, 1], linecolor: color, linewidth: 2, mirror: true },
      margin: { l: 62, r: 14, t: 10, b: 50 },
      showlegend: false,
    });

    const ts = [0, ...lin(600, 300).slice(1)];
    const top = plot($('sc-ms'), [
      { x: ts, y: ts.map(total), mode: 'lines', line: { color: C.free, width: 3.5 }, fill: 'tozeroy', fillcolor: `${C.free}1f`, hoverinfo: 'skip' },
    ], {
      ...common('time after the pulse (ms)', 300, C.rule),
      shapes: [
        { type: 'line', x0: T2F, x1: T2F, y0: 0, y1: total(T2F), line: { color: C.ink, width: 1.5, dash: 'dot' } },
      ],
      annotations: [
        { x: T2F, y: total(T2F), text: `T<sub>2</sub> = ${T2F} ms`, showarrow: false, xanchor: 'right', yanchor: 'top', xshift: -10, yshift: -8, font: { size: 15, color: C.ink } },
      ],
    });

    const tu = lin(400, ZOOM_MS * 1000), us = (t) => t / 1000;
    const bottom = plot($('sc-us'), [
      // the slow part (dashed, barely decaying at this scale), then the whole signal: the orange band between is the fast part
      { x: tu, y: tu.map((t) => slow(us(t))), mode: 'lines', line: { color: C.free, width: 2.5, dash: 'dash' }, fill: 'tozeroy', fillcolor: `${C.free}1f`, hoverinfo: 'skip' },
      { x: tu, y: tu.map((t) => total(us(t))), mode: 'lines', line: { color: C.restr, width: 3.5 }, fill: 'tonexty', fillcolor: `${C.restr}40`, hoverinfo: 'skip' },
    ], {
      ...common('time after the pulse (µs)', ZOOM_MS * 1000, ZOOM),
      shapes: [{ type: 'line', x0: T2R * 1000, x1: T2R * 1000, y0: slow(T2R), y1: total(T2R), line: { color: C.ink, width: 1.5, dash: 'dot' } }],
      annotations: [
        { x: T2R * 1000, y: total(T2R), text: `T<sub>2</sub> ≈ ${T2R * 1000} µs`, showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 6, font: { size: 15, color: C.ink } },
        { x: 60, y: slow(us(60)), text: `slow part (T<sub>2</sub> = ${T2F} ms): still at its start`, showarrow: false, yanchor: 'top', yshift: -6, font: { size: 15, color: C.free } },
      ],
    });

    // zoom: a red rectangle on the start of the signal in the top plot (symbolic: the 0.1 ms zoomed in is far thinner than
    // a pixel), and lines from its lower corners to the upper corners of the lower plot's axes
    Promise.all([top, bottom]).then(() => {
      const svg = $('sc-zoom'), a = $('sc-ms'), b = $('sc-us');
      const fa = a._fullLayout, fb = b._fullLayout;
      const ax = (x) => a.offsetLeft + fa.xaxis._offset + fa.xaxis.l2p(x);
      const ay = (y) => a.offsetTop + fa.yaxis._offset + fa.yaxis.l2p(y);
      const sTop = ay(1.02), side = ay(0.85) - sTop, wide = side / 2, sLeft = ax(0) - 2, sBot = sTop + side;
      const bx0 = b.offsetLeft + fb.xaxis._offset, bx1 = bx0 + fb.xaxis._length, by = b.offsetTop + fb.yaxis._offset;
      const p = [[sLeft, sBot], [sLeft + wide, sBot], [bx1, by], [bx0, by]];
      const el = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return svg.appendChild(e); };
      svg.replaceChildren();
      for (const [s0, e0] of [[p[0], p[3]], [p[1], p[2]]]) {
        el('line', { x1: s0[0], y1: s0[1], x2: e0[0], y2: e0[1], stroke: ZOOM, 'stroke-width': 2, 'stroke-dasharray': '6 4', opacity: 0.85 });
      }
      el('rect', { x: sLeft, y: sTop, width: wide, height: side, fill: 'none', stroke: ZOOM, 'stroke-width': 3, rx: 2 });
    });
  });
})();
