/* Lecture slide "T2-weighted imaging vs T2 mapping": a spin echo image simulated from T1, T2 and PD maps of one brain
 * slice (js/phantom/brainT2w.js, from tools/prep_t2w_phantom.py), S = PD (1 − e^(−TR/T1)) e^(−TE/T2), with sliders
 * for TR and TE that start at the recommended T2-weighted values, and a window slider: the signal shown as white
 * (PD = 1 is full signal). Hover gives each pixel's T1, T2, PD and signal. Beside it, the book's Figure 3.1,
 * opened on TE = 128 ms. */
(function () {
  'use strict';
  const slide = document.querySelector('section.t2w-proto'), P = window.BrainT2w;
  if (!slide || !P || !window.Plotly || !window.Reveal) return;
  const INK = '#1d2733', FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const u16 = (b64) => new Uint16Array(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer);
  const pd = u16(P.pd), t1 = u16(P.t1), t2 = u16(P.t2), { w, h } = P;
  const rows = (f) => Array.from({ length: h }, (_, i) => Array.from({ length: w }, (_, j) => f(i * w + j)));
  const info = rows((p) => (pd[p] ? [t1[p], t2[p], pd[p] / 1000] : null));
  const host = slide.querySelector('.t2w-sim'), tr = slide.querySelector('[data-tr]'), te = slide.querySelector('[data-te]');
  const win = slide.querySelector('[data-win]');
  const label = slide.querySelector('[data-show="weighting"]');

  // The usual names for each corner of (TR, TE).
  function weighting(TR, TE) {
    const longTR = TR >= 2500, shortTR = TR <= 1000, longTE = TE >= 70, shortTE = TE <= 30;
    if (longTR && longTE) return ['T<sub>2</sub>-weighted', 'hl'];
    if (longTR && shortTE) return ['proton-density-weighted', ''];
    if (shortTR && shortTE) return ['T<sub>1</sub>-weighted', ''];
    if (shortTR && longTE) return ['mixed T<sub>1</sub> and T<sub>2</sub>: poor contrast', 'caution'];
    return ['in between', ''];
  }

  function draw() {
    const TR = +tr.value, TE = +te.value, top = +win.value, sig = new Float32Array(w * h);
    for (let p = 0; p < w * h; p++) {
      if (pd[p]) sig[p] = pd[p] / 1000 * (1 - Math.exp(-TR / t1[p])) * Math.exp(-TE / t2[p]);
    }
    slide.querySelector('[data-show="win"]').textContent = top.toFixed(2);
    slide.querySelector('[data-show="tr"]').textContent = TR;
    slide.querySelector('[data-show="te"]').textContent = TE;
    const [name, cls] = weighting(TR, TE);
    label.innerHTML = `<b class="${cls}">${name}</b>`;
    window.Plotly.react(host, [{
      type: 'heatmap', z: rows((p) => (pd[p] ? sig[p] : null)), customdata: info, zmin: 0, zmax: top,
      colorscale: [[0, '#000'], [1, '#fff']], showscale: false, hoverongaps: false,
      hovertemplate: 'T<sub>1</sub> = %{customdata[0]} ms · T<sub>2</sub> = %{customdata[1]} ms · PD = %{customdata[2]:.2f}<br>signal = %{z:.3f}<extra></extra>',
    }], {
      width: 280, height: 280, margin: { l: 0, r: 0, t: 0, b: 0 }, dragmode: false,
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: '#000',
      xaxis: { visible: false, range: [-0.5, w - 0.5], fixedrange: true },
      yaxis: { visible: false, range: [-0.5, h - 0.5], scaleanchor: 'x', fixedrange: true },  // row 0 at the bottom, as in Figure 3.1
      font: { family: FONT, size: 14, color: INK },
      hoverlabel: { bgcolor: '#fff', bordercolor: INK, font: { size: 15, color: INK } },
    }, { displayModeBar: false, scrollZoom: false });
  }
  // A spin echo needs TR longer than TE: whichever slider moves, the other gives way.
  tr.addEventListener('input', () => { if (+te.value > +tr.value - 5) te.value = Math.max(+te.min, +tr.value - 5); draw(); });
  te.addEventListener('input', () => { if (+tr.value < +te.value + 5) tr.value = +te.value + 10; draw(); });
  win.addEventListener('input', draw);
  for (const s of [tr, te, win]) s.addEventListener('change', () => s.blur());
  slide.querySelector('[data-t2w-reset]').addEventListener('click', (e) => {
    e.currentTarget.blur(); for (const s of [tr, te, win]) s.value = s.defaultValue; draw();
  });
  // The book's Figure 3.1 opens on TE = 256 ms; on this slide it opens on 128 ms (its traces: 12.8, 128, 256 and
  // 384 ms, then the T2 map). The deck redraws book figures as slides come and go, so this runs at every mount.
  const figHost = slide.querySelector('.t2map-fig');
  const at128 = () => { if (figHost._plot) window.Plotly.update(figHost._plot, { visible: [false, true, false, false, true] }, { 'updatemenus[0].active': 1 }); };
  figHost.addEventListener('figuremounted', at128);
  if (figHost.dataset.state === 'mounted') at128();

  let shown = false;
  const show = () => { if (!shown) { shown = true; draw(); } };
  window.Reveal.on('slidechanged', (e) => { if (e.currentSlide === slide) show(); });
  window.Reveal.on('ready', (e) => { if (e.currentSlide === slide) show(); });
  if (window.Reveal.isReady() && window.Reveal.getCurrentSlide() === slide) show();
})();
