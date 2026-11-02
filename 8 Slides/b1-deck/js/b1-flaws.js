/* Unfiltered B1 maps and their raw images (Exercise 4-6, #flaws and #flaws-why), from b1-flaws-data.js. Every
 * <canvas data-img="da.a1"> (method: da / afi / bs; image: a1 / a2 / b1) is drawn at the data's 128 x 88 pixels and scaled
 * by CSS. Grey for magnitudes, blue–white–red for phases (−π…π) and for B1 (0.7…1.3, white at 1, red high). On #flaws,
 * clicking an image shows it larger in .fl-zoom, with the value under the pointer. window.B1FLAWS: the maps and the painter, for
 * filt-match.js. */
(function () {
  'use strict';
  const D = window.B1_FLAWS; if (!D) return;
  const NR = D.rows, NC = D.cols, B1LO = 0.7, B1HI = 1.3;
  const bytes = (b64) => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const IMG = {};
  ['da', 'afi', 'bs'].forEach((m) => {
    const b = bytes(D[m].b1);
    IMG[m] = { a1: bytes(D[m].a1), a2: bytes(D[m].a2), b1: Array.from(new Uint16Array(b.buffer, b.byteOffset, NR * NC), (v) => (v === 65535 ? NaN : v / 20000)), phase: m === 'bs' };
  });
  // blue–white–red lookup (common.js CMAPS.rdbu: blue low, red high), 256 entries
  const LUT = (() => {
    const st = CMAPS.rdbu.map(([t, c]) => [t, c.match(/\d+/g).map(Number)]), out = [];
    for (let i = 0; i < 256; i++) {
      const t = i / 255; let k = 0; while (k < st.length - 2 && st[k + 1][0] < t) k++;
      const [t0, c0] = st[k], [t1, c1] = st[k + 1], f = (t - t0) / (t1 - t0);
      out.push(c0.map((v, j) => Math.round(v + f * (c1[j] - v))));
    }
    return out;
  })();
  function paint(cv, key) {
    const [m, which] = key.split('.'), im = IMG[m]; if (!im) return;
    cv.width = NC; cv.height = NR;
    const ctx = cv.getContext('2d'), id = ctx.createImageData(NC, NR), px = id.data;
    for (let k = 0; k < NR * NC; k++) {
      let r, g, b, a = 255;
      if (which === 'b1') {
        const v = im.b1[k];
        if (Number.isNaN(v)) { r = g = b = 255; a = 0; }
        else { [r, g, b] = LUT[Math.max(0, Math.min(255, Math.round(((v - B1LO) / (B1HI - B1LO)) * 255)))]; }
      } else if (im.phase) { [r, g, b] = LUT[im[which][k]]; }
      else { r = g = b = im[which][k]; }
      px[4 * k] = r; px[4 * k + 1] = g; px[4 * k + 2] = b; px[4 * k + 3] = a;
    }
    ctx.putImageData(id, 0, 0);
  }
  document.querySelectorAll('canvas[data-img]').forEach((cv) => paint(cv, cv.dataset.img));
  // for #filt-match: any NR x NC array of values (NaN = transparent) on the same blue–white–red scale, lo…hi
  window.B1FLAWS = {
    NR, NC, b1: (m) => (m === 'da_tse' ? (() => { const b = bytes(D.da_tse.b1); return Array.from(new Uint16Array(b.buffer, b.byteOffset, NR * NC), (v) => (v === 65535 ? NaN : v / 20000)); })() : IMG[m].b1.slice()),
    draw(cv, vals, lo, hi) {
      cv.width = NC; cv.height = NR; const ctx = cv.getContext('2d'), id = ctx.createImageData(NC, NR), px = id.data;
      for (let k = 0; k < NR * NC; k++) {
        const v = vals[k]; if (Number.isNaN(v)) { px[4 * k + 3] = 0; continue; }
        const c = LUT[Math.max(0, Math.min(255, Math.round(((v - lo) / (hi - lo)) * 255)))]; px[4 * k] = c[0]; px[4 * k + 1] = c[1]; px[4 * k + 2] = c[2]; px[4 * k + 3] = 255;
      }
      ctx.putImageData(id, 0, 0);
    },
  };

  // #flaws: click an image to see it larger, with the value under the pointer
  const slide = document.getElementById('flaws'); if (!slide) return;
  const zc = slide.querySelector('.fl-zoom canvas'), zt = slide.querySelector('.fl-zoom-title'), zv = slide.querySelector('.fl-zoom-val');
  let cur = null;
  function pick(cv) {
    slide.querySelectorAll('canvas[data-img]').forEach((c) => c.classList.toggle('fl-on', c === cv));
    cur = cv.dataset.img; paint(zc, cur); zt.innerHTML = cv.dataset.label || ''; zv.textContent = 'Point at the image to read a value.';
  }
  slide.querySelectorAll('.fl-grid canvas[data-img]').forEach((cv) => cv.addEventListener('click', () => pick(cv)));
  zc.addEventListener('pointermove', (e) => {
    if (!cur) return;
    const b = zc.getBoundingClientRect(), j = Math.floor(((e.clientX - b.left) / b.width) * NC), i = Math.floor(((e.clientY - b.top) / b.height) * NR);
    if (i < 0 || j < 0 || i >= NR || j >= NC) return;
    const [m, which] = cur.split('.'), im = IMG[m], k = i * NC + j;
    if (which === 'b1') zv.textContent = Number.isNaN(im.b1[k]) ? 'outside the brain' : `B₁ = ${im.b1[k].toFixed(2)}`;
    else if (im.phase) zv.textContent = `phase = ${((im[which][k] / 255) * 2 * Math.PI - Math.PI).toFixed(2)} rad`;
    else zv.textContent = `signal = ${im[which][k]} (of 255)`;
  });
  pick(slide.querySelector('canvas[data-img="da.b1"]'));
})();
