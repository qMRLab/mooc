/* Exercise 2-4: one slice of human brain, multi-echo spin echo at 3 T (js/data/mwfData.js, written by
 * tools/fetch_mwf_data.py from the release tools/prep_mwf_calipr.py makes). The slider picks the echo shown; a click picks a pixel, and the plots show its T2
 * distribution, and its echoes with the decay that distribution predicts (an EPG train at the pixel's fitted
 * refocusing angle, plus its fitted noise floor, as in the fit). The next slide takes that pixel: two rectangles on its
 * T2 distribution, MW and IEW, set the T2 ranges, and "Generate MWF map" computes MWF = S_MW / (S_MW + S_IEW) at every
 * pixel from the areas of each pixel's distribution inside them (the book's Eq. 3.8 at TE = 0), beside the authors'
 * own MWF map of the same slice. */
(function () {
  'use strict';
  const D = window.MWFData, slide = document.querySelector('section.t2-pixel');
  if (!D || !slide || !window.Plotly) return;

  const INK = '#1d2733', MUTED = '#5b6776', LINE = '#1f5f99', FIT = '#c0392b';
  const bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const echoes = bytes(D.echoes), mask = bytes(D.mask), spec = bytes(D.spec), alpha = bytes(D.alpha), published = bytes(D.published);
  const peak = new Float32Array(bytes(D.peak).buffer), floor = new Float32Array(bytes(D.floor).buffer);
  const { w, h, ne } = D, at = (i, j) => i * w + j;
  const te = Array.from({ length: ne }, (_, k) => D.esp * (k + 1));
  const TICKS = [5, 10, 20, 50, 100, 200, 500, 1000, 2000];
  const signal = (i, j, k) => (echoes[at(i, j) * ne + k] / 255) ** 2 * D.smax;

  // Echo amplitudes of a CPMG train with refocusing angle alpha (the recursion used for the fit).
  function epgDecay(alphaDeg, t2) {
    const a = alphaDeg * Math.PI / 180, c2 = Math.cos(a / 2) ** 2, s2 = Math.sin(a / 2) ** 2, s = Math.sin(a), c = Math.cos(a);
    const e2 = Math.exp(-D.esp / 2 / t2), e1 = Math.exp(-D.esp / 2 / D.t1), n = ne + 2;
    let fp = new Float64Array(n), fm = new Float64Array(n), z = new Float64Array(n);
    fp[0] = 1;
    const out = new Float64Array(ne);
    const relaxShift = () => {
      const p = new Float64Array(n), m = new Float64Array(n);
      for (let k = 0; k < n; k++) { z[k] *= e1; if (k + 1 < n) p[k + 1] = fp[k] * e2; if (k > 0) m[k - 1] = fm[k] * e2; }
      p[0] = m[0]; fp = p; fm = m;
    };
    for (let e = 0; e < ne; e++) {
      relaxShift();
      for (let k = 0; k < n; k++) {
        const P = fp[k], M = fm[k], Z = z[k];
        fp[k] = c2 * P + s2 * M + s * Z; fm[k] = s2 * P + c2 * M - s * Z; z[k] = -0.5 * s * P + 0.5 * s * M + c * Z;
      }
      relaxShift();
      out[e] = fp[0];
    }
    return out;
  }

  // ---- the image: one echo, each echo with its own grey scale (the late echoes are much darker) ----
  const canvas = slide.querySelector('canvas.echo-image'), g = canvas.getContext('2d');
  const slider = slide.querySelector('[data-echo]'), echoLabel = slide.querySelector('[data-show="echo"]');
  const SCALE = Math.floor(Math.min(canvas.width / w, canvas.height / h));
  const ox = Math.round((canvas.width - SCALE * w) / 2), oy = Math.round((canvas.height - SCALE * h) / 2);
  const frame = document.createElement('canvas'); frame.width = w; frame.height = h;
  const fg = frame.getContext('2d'), pixels = fg.createImageData(w, h);
  const top = Array.from({ length: ne }, (_, k) => {  // a bright pixel of echo k, for its grey scale
    const v = []; for (let p = 0; p < w * h; p++) if (mask[p]) v.push(echoes[p * ne + k]);
    v.sort((a, b) => a - b); return Math.max(1, v[Math.floor(0.995 * (v.length - 1))]);
  });
  let pick = D.start.slice();
  slider.max = ne;

  function drawImage() {
    const k = +slider.value - 1;
    for (let p = 0; p < w * h; p++) {
      const v = Math.min(255, Math.round(255 * echoes[p * ne + k] / top[k]));
      pixels.data.set([v, v, v, 255], 4 * p);
    }
    fg.putImageData(pixels, 0, 0);
    g.fillStyle = '#000'; g.fillRect(0, 0, canvas.width, canvas.height);
    g.imageSmoothingEnabled = false;
    g.drawImage(frame, ox, oy, SCALE * w, SCALE * h);
    // the picked pixel: a box around it and a cross hair
    const x = ox + SCALE * (pick[1] + 0.5), y = oy + SCALE * (pick[0] + 0.5);
    g.strokeStyle = '#f2b705'; g.lineWidth = 3;
    g.strokeRect(x - SCALE, y - SCALE, 2 * SCALE, 2 * SCALE);
    g.beginPath(); g.moveTo(x - 4 * SCALE, y); g.lineTo(x - 1.6 * SCALE, y); g.moveTo(x + 1.6 * SCALE, y); g.lineTo(x + 4 * SCALE, y);
    g.moveTo(x, y - 4 * SCALE); g.lineTo(x, y - 1.6 * SCALE); g.moveTo(x, y + 1.6 * SCALE); g.lineTo(x, y + 4 * SCALE); g.stroke();
    echoLabel.textContent = `${k + 1} of ${ne} · TE = ${te[k]} ms`;
  }

  // ---- the plots: the T2 distribution, and the echoes with the decay it predicts ----
  const host = slide.querySelector('.t2-plots');
  function drawPlots() {
    const [i, j] = pick, p = at(i, j), k = +slider.value - 1;
    const amp = D.t2.map((_, n) => spec[p * D.t2.length + n] / 255 * peak[p]);
    const fit = new Float64Array(ne).fill(floor[p]);  // the fitted noise floor, plus each T2's decay
    D.t2.forEach((t2, n) => { if (amp[n] > 0) epgDecay(alpha[p], t2).forEach((v, e) => { fit[e] += amp[n] * v; }); });
    const meas = te.map((_, e) => signal(i, j, e));
    window.Plotly.react(host, [
      { x: D.t2, y: amp, type: 'scatter', mode: 'lines', fill: 'tozeroy', line: { color: LINE, width: 2.5, shape: 'spline' },
        fillcolor: 'rgba(31, 95, 153, 0.18)', hovertemplate: 'T<sub>2</sub> = %{x:.0f} ms<extra></extra>', xaxis: 'x', yaxis: 'y' },
      { x: te, y: meas, type: 'scatter', mode: 'markers', marker: { color: INK, size: 5 }, name: 'echoes',
        hovertemplate: 'TE = %{x} ms<extra></extra>', xaxis: 'x2', yaxis: 'y2' },
      { x: te, y: Array.from(fit), type: 'scatter', mode: 'lines', line: { color: FIT, width: 2 }, name: 'from the distribution',
        hoverinfo: 'skip', xaxis: 'x2', yaxis: 'y2' },
      { x: [te[k]], y: [meas[k]], type: 'scatter', mode: 'markers', marker: { color: '#f2b705', size: 13, line: { color: INK, width: 1.5 } },
        hoverinfo: 'skip', showlegend: false, xaxis: 'x2', yaxis: 'y2' },
    ], {
      width: 600, height: 540, margin: { l: 60, r: 20, t: 30, b: 50 }, showlegend: false,
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', size: 15, color: INK },
      grid: { rows: 2, columns: 1, pattern: 'independent', roworder: 'top to bottom', ygap: 0.42 },
      xaxis: { type: 'log', range: [Math.log10(D.t2[0]), Math.log10(D.t2[D.t2.length - 1])], title: { text: 'T<sub>2</sub> (ms)' }, fixedrange: true,
        tickvals: TICKS, gridcolor: '#e6eaef' },
      yaxis: { title: { text: 'amplitude' }, showticklabels: false, rangemode: 'tozero', fixedrange: true, gridcolor: '#e6eaef' },
      xaxis2: { title: { text: 'TE (ms)' }, range: [0, te[ne - 1] + 5], fixedrange: true, gridcolor: '#e6eaef' },
      yaxis2: { title: { text: 'signal' }, showticklabels: false, rangemode: 'tozero', fixedrange: true, gridcolor: '#e6eaef' },
      annotations: [
        { text: '<b>T<sub>2</sub> distribution</b>', xref: 'x domain', yref: 'y domain', x: 0, y: 1.12, showarrow: false, xanchor: 'left', font: { size: 16 } },
        { text: '<b>Echoes</b> · <span style="color:' + FIT + '">decay from the distribution</span>', xref: 'x2 domain', yref: 'y2 domain', x: 0, y: 1.12,
          showarrow: false, xanchor: 'left', font: { size: 16 } },
      ],
      hoverlabel: { bgcolor: '#fff', bordercolor: INK, font: { size: 15, color: INK } },
    }, { displayModeBar: false, scrollZoom: false });
  }

  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * canvas.width / r.width, y = (e.clientY - r.top) * canvas.height / r.height;
    const j = Math.floor((x - ox) / SCALE), i = Math.floor((y - oy) / SCALE);
    if (i < 0 || j < 0 || i >= h || j >= w || !mask[at(i, j)]) return;
    pick = [i, j]; drawImage(); drawPlots();
  });
  slider.addEventListener('input', () => { drawImage(); drawPlots(); });
  slider.addEventListener('change', () => slider.blur());

  // ---- the next slide: MW and IEW ranges on the saved pixel's distribution, then an MWF map ----
  const mapSlide = document.querySelector('section.mwf-map');
  const distHost = mapSlide && mapSlide.querySelector('.mwf-dist'), mapHost = mapSlide && mapSlide.querySelector('.mwf-map-host');
  const RANGES = [{ name: 'MW', lo: 30, hi: 50, fill: 'rgba(204, 121, 167, 0.28)', edge: '#a8538a' },
    { name: 'IEW', lo: 150, hi: 400, fill: 'rgba(230, 159, 0, 0.25)', edge: '#b9770e' }];
  const lg = Math.log10, T2MIN = D.t2[0], T2MAX = D.t2[D.t2.length - 1];
  const rangeShapes = () => RANGES.map((r) => ({
    type: 'rect', xref: 'x', yref: 'paper', x0: r.lo, x1: r.hi, y0: 0, y1: 1, fillcolor: r.fill, line: { color: r.edge, width: 2 }, layer: 'below',
  }));
  const ms = (x) => (x < 10 ? x.toFixed(1) : Math.round(x));
  // Each rectangle's name and its ends in ms, above it.
  const rangeLabels = () => RANGES.map((r) => ({
    text: `<b>${r.name}</b> ${ms(r.lo)}–${ms(r.hi)} ms`, x: (lg(r.lo) + lg(r.hi)) / 2, xref: 'x', y: 1.02, yref: 'paper', yanchor: 'bottom',
    showarrow: false, font: { size: 15, color: r.edge },
  }));
  function drawDist() {
    const p = at(pick[0], pick[1]);
    const amp = D.t2.map((_, n) => spec[p * D.t2.length + n] / 255 * peak[p]);
    window.Plotly.react(distHost, [
      { x: D.t2, y: amp, type: 'scatter', mode: 'lines', fill: 'tozeroy', line: { color: LINE, width: 2.5, shape: 'spline' },
        fillcolor: 'rgba(31, 95, 153, 0.18)', hovertemplate: 'T<sub>2</sub> = %{x:.0f} ms<extra></extra>' },
    ], {
      width: 600, height: 350, margin: { l: 60, r: 20, t: 40, b: 55 }, showlegend: false,
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', size: 15, color: INK },
      xaxis: { type: 'log', range: [lg(T2MIN), lg(T2MAX)], title: { text: 'T<sub>2</sub> (ms)' }, fixedrange: true,
        tickvals: TICKS, gridcolor: '#e6eaef' },
      yaxis: { title: { text: 'amplitude' }, showticklabels: false, rangemode: 'tozero', fixedrange: true, gridcolor: '#e6eaef' },
      shapes: rangeShapes(), annotations: rangeLabels(), dragmode: false,
      hoverlabel: { bgcolor: '#fff', bordercolor: INK, font: { size: 15, color: INK } },
    }, { displayModeBar: false, scrollZoom: false, edits: { shapePosition: true } });
  }
  // A dragged or stretched rectangle: keep it the full height, inside the axis, with its ends in order.
  function onRelayout(ev) {
    let moved = false;
    RANGES.forEach((r, k) => {
      const x0 = ev[`shapes[${k}].x0`], x1 = ev[`shapes[${k}].x1`];
      if (x0 === undefined && x1 === undefined) return;
      const a = x0 === undefined ? r.lo : x0, b = x1 === undefined ? r.hi : x1;
      r.lo = Math.max(T2MIN, Math.min(a, b)); r.hi = Math.min(T2MAX, Math.max(a, b)); moved = true;
    });
    if (moved) window.Plotly.relayout(distHost, { shapes: rangeShapes(), annotations: rangeLabels() });
    showRanges();
  }
  function showRanges(ranges = RANGES) {
    mapSlide.querySelector('[data-show="ranges"]').innerHTML = ranges.map((r) => `<b style="color:${r.edge}">${r.name}</b>: ${ms(r.lo)}–${ms(r.hi)} ms`).join(' · ');
  }
  // Plotly reports a rectangle's new position only when it is dropped; meanwhile, read the ends off the rectangles
  // drawn on screen, so the values above the plot follow the drag.
  function showDragging() {
    const fl = distHost._fullLayout, box = distHost.querySelector('.nsewdrag');
    const paths = distHost.querySelectorAll('.layer-below .shapelayer path');
    if (!fl || !box || paths.length !== RANGES.length) return;
    const b = box.getBoundingClientRect(), k = b.width / fl.xaxis._length, t2 = (px) => 10 ** fl.xaxis.p2l((px - b.left) / k);
    showRanges(RANGES.map((r, n) => {
      const q = paths[n].getBoundingClientRect();
      return { ...r, lo: Math.max(T2MIN, t2(q.left)), hi: Math.min(T2MAX, t2(q.right)) };
    }));
  }
  // The map's colour scale is fixed (0 to 30% MWF), so maps made with different windows, and the authors' map, can be
  // compared by eye; the saved pixel's MWF is shown as a number, with the previous map's value and the authors' beside it.
  // Three tabs: your map, the published map, and the difference (yours minus published, in MWF points, ±15).
  const MWF_TOP = 0.3, DIFF_TOP = 0.15, pct = (v) => `${Math.round(100 * v)}%`;
  const theirs = Array.from({ length: h }, (_, i) => Array.from({ length: w }, (_, j) => (mask[at(i, j)] ? published[at(i, j)] / 250 : null)));
  const tabs = mapSlide ? [...mapSlide.querySelectorAll('[data-view]')] : [];
  let prev = null, mine = null, fluid = null, view = 'mine', lastScore = null;
  // The mean difference from the published map over the brain, in MWF points; a pixel with no MWF of its own (fluid)
  // counts as 0, so ranges that leave tissue outside both rectangles do not get an easy score.
  function meanDiff() {
    let sum = 0, n = 0;
    for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) {
      if (!mask[at(i, j)]) continue;
      sum += Math.abs((mine[i][j] ?? 0) - theirs[i][j]); n++;
    }
    return sum / n;
  }
  function generate() {
    const inR = RANGES.map((r) => D.t2.map((t) => t >= r.lo && t <= r.hi));
    // Pixels with most of their signal outside both windows (fluid, T2 of a second or more) have no meaningful MWF:
    // they are greyed out, rather than showing a tiny MW over an even tinier IEW.
    prev = mine; mine = []; fluid = [];
    for (let i = 0; i < h; i++) {
      const row = [], frow = [];
      for (let j = 0; j < w; j++) {
        const p = at(i, j);
        let mw = 0, iew = 0, all = 0;
        if (mask[p]) {
          for (let n = 0; n < D.t2.length; n++) { const v = spec[p * D.t2.length + n]; all += v; if (inR[0][n]) mw += v; if (inR[1][n]) iew += v; }
        }
        const isFluid = mask[p] && (mw + iew) < 0.5 * all;
        row.push(!mask[p] || isFluid || mw + iew === 0 ? null : mw / (mw + iew));
        frow.push(isFluid ? 1 : null);
      }
      mine.push(row); fluid.push(frow);
    }
    const score = meanDiff(), f1 = (v) => `${(100 * v).toFixed(1)}%`;
    mapSlide.querySelector('.mwf-score').innerHTML = `Mean difference from the published map: <b>${f1(score)}</b>`
      + (lastScore === null ? '' : ` <span class="muted">(previous map: ${f1(lastScore)})</span>`);
    lastScore = score;
    view = 'mine';
    for (const t of tabs) t.disabled = false;
    drawMap();
  }
  // The picked pixel's MWF: in this map, in the previous one (to compare windows), and in the published map.
  function showReadout() {
    const [i, j] = pick, v = mine[i][j], before = prev && prev[i][j], ref = theirs[i][j];
    mapSlide.querySelector('.mwf-readout').innerHTML = (v === null ? 'Your pixel: mostly outside both windows'
      : `Your pixel: MWF = <b>${pct(v)}</b>${before === null || before === undefined ? '' : ` <span class="muted">(previous map: ${pct(before)})</span>`}`)
      + (ref === null ? '' : ` · published: <b>${pct(ref)}</b>`);
  }
  function drawMap() {
    showReadout();
    for (const t of tabs) t.setAttribute('aria-selected', String(t.dataset.view === view));
    mapSlide.querySelector('.mwf-diff-note').hidden = view !== 'diff';
    mapHost.classList.add('drawn');
    const hint = mapHost.querySelector('p'); if (hint) hint.remove();
    // The saved pixel: outlined (one voxel is only a few screen pixels), with red ticks pointing at it, and named in its hover.
    const [pi, pj] = pick, RED = view === 'diff' ? INK : '#e8000b';  // dark on the red-blue difference map
    const z = view === 'theirs' ? theirs
      : view === 'diff' ? mine.map((row, i) => row.map((v, j) => (v === null || theirs[i][j] === null ? null : v - theirs[i][j]))) : mine;
    const scale = view === 'diff'
      ? { zmin: -DIFF_TOP, zmax: DIFF_TOP, colorscale: [[0, '#2166ac'], [0.5, '#f7f7f7'], [1, '#b2182b']],
        hovertemplate: 'difference = %{z:+.0%}%{text}<extra></extra>',
        colorbar: { title: { text: 'difference' }, thickness: 16, len: 0.8, tickformat: '+.0%' } }
      : { zmin: 0, zmax: MWF_TOP, colorscale: 'Viridis', hovertemplate: 'MWF = %{z:.0%}%{text}<extra></extra>',
        colorbar: { title: { text: 'MWF' }, thickness: 16, len: 0.8, tickformat: '.0%' } };
    const tag = z.map((row, i) => row.map((_, j) => (i === pi && j === pj ? ' · your pixel' : '')));
    const tick = (x0, y0, x1, y1) => ({ type: 'line', x0: pj + x0, y0: pi + y0, x1: pj + x1, y1: pi + y1, line: { color: RED, width: 3 } });
    window.Plotly.react(mapHost, [
      ...(view === 'theirs' ? [] : [{ type: 'heatmap', z: fluid, zmin: 0, zmax: 1, colorscale: [[0, '#c3cbd4'], [1, '#c3cbd4']], showscale: false,
        hoverongaps: false, hovertemplate: 'mostly outside both windows (fluid)<extra></extra>' }]),
      { type: 'heatmap', z, text: tag, hoverongaps: false, ...scale },
    ], {
      shapes: [{ type: 'rect', x0: pj - 0.5, x1: pj + 0.5, y0: pi - 0.5, y1: pi + 0.5, line: { color: RED, width: 1.5 } },
        tick(-7, 0, -2, 0), tick(2, 0, 7, 0), tick(0, -7, 0, -2), tick(0, 2, 0, 7)],
      width: 440, height: 310, margin: { l: 10, r: 10, t: 10, b: 10 }, showlegend: false,
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', dragmode: false,
      xaxis: { visible: false, range: [-0.5, w - 0.5], fixedrange: true },
      yaxis: { visible: false, range: [h - 0.5, -0.5], scaleanchor: 'x', fixedrange: true },
      font: { family: '"Helvetica Neue", Helvetica, Arial, sans-serif', size: 14, color: INK },
      hoverlabel: { bgcolor: '#fff', bordercolor: INK, font: { size: 16, color: INK } },
    }, { displayModeBar: false, scrollZoom: false });
  }
  if (mapSlide) {
    mapSlide.querySelector('[data-generate]').addEventListener('click', (e) => { e.currentTarget.blur(); generate(); });
    for (const t of tabs) t.addEventListener('click', (e) => { e.currentTarget.blur(); view = t.dataset.view; drawMap(); });
    // A click on the map picks that pixel: its distribution on the left, its values in the readout, and the marker.
    let clickReady = false;
    const onMapClick = (ev) => {
      const pt = ev.points && ev.points[0];
      if (!pt) return;
      const i = Math.round(pt.y), j = Math.round(pt.x);
      if (i < 0 || j < 0 || i >= h || j >= w || !mask[at(i, j)]) return;
      pick = [i, j]; drawDist(); drawMap();
      if (shown) { drawImage(); drawPlots(); }
    };
    const armClick = () => { if (!clickReady && mapHost.on) { clickReady = true; mapHost.on('plotly_click', onMapClick); } };
    mapSlide.querySelector('[data-generate]').addEventListener('click', armClick);
  }

  let shown = false, mapReady = false;
  const show = () => { if (shown) return; shown = true; drawImage(); drawPlots(); };
  const showMap = () => {  // the pixel saved on the previous slide
    drawDist(); showRanges();
    if (!mapReady) {
      mapReady = true; distHost.on('plotly_relayout', onRelayout);
      // Plotly drags on a cover over the page, so follow the pointer on the window while a press that began here lasts.
      let dragging = false;
      distHost.addEventListener('pointerdown', () => { dragging = true; }, true);
      window.addEventListener('pointermove', () => { if (dragging) requestAnimationFrame(showDragging); });
      window.addEventListener('pointerup', () => { dragging = false; });
    }
  };
  if (window.Reveal) {
    const enter = (s) => { if (s === slide) show(); if (mapSlide && s === mapSlide) showMap(); };
    window.Reveal.on('slidechanged', (e) => enter(e.currentSlide));
    window.Reveal.on('ready', (e) => enter(e.currentSlide));
    if (window.Reveal.isReady()) enter(window.Reveal.getCurrentSlide());
  }
  window.MWFPixel = { select: (i, j) => { pick = [i, j]; drawImage(); drawPlots(); }, get pick() { return pick.slice(); } };
})();
