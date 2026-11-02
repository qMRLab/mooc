/* Make the three B1 maps agree (Exercise 4-6, #filt-match). DA (the chapter's TSE double angle), AFI and BS, all on the same
 * slice (b1-flaws-data.js, through window.B1FLAWS). Each gets its own filter (none / median / Gaussian) and window width
 * w (odd, 3–15 px), applied inside the brain only: the median of the in-brain pixels of the w × w window, or a Gaussian of
 * σ = w/4 truncated to the window and normalised over the in-brain pixels (as on the later slides). Shown: the filtered maps
 * (0.7–1.3) and each one's difference from the mean of the three (±10 %). Score: the spread between the three,
 * √(mean over voxels and methods of (B1 − mean)²) ÷ mean B1, in %; 6.3 % unfiltered, about 1.7 % at best with this data
 * (large medians; BS reads ~2.4 % higher on average, which no filter removes). */
(function () {
  'use strict';
  const slide = document.getElementById('filt-match'), F = window.B1FLAWS; if (!slide || !F) return;
  const q = (c) => slide.querySelector(c), NR = F.NR, NC = F.NC, M = ['da', 'afi', 'bs'];
  const RAW = { da: F.b1('da_tse'), afi: F.b1('afi'), bs: F.b1('bs') };
  const IN = Array.from({ length: NR * NC }, (_, k) => M.every((m) => !Number.isNaN(RAW[m][k])));
  const st = { da: { kind: 'none', w: 7 }, afi: { kind: 'none', w: 7 }, bs: { kind: 'none', w: 7 }, best: null };
  const cache = {};
  function filt(m) {
    const { kind, w } = st[m], key = `${m}|${kind}|${w}`; if (cache[key]) return cache[key];
    const b = RAW[m], out = b.slice(); if (kind === 'none') return (cache[key] = out);
    const h = (w - 1) / 2, s = w / 4, buf = [];
    for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) {
      const k = i * NC + j; if (!IN[k]) { out[k] = NaN; continue; }
      if (kind === 'median') {
        buf.length = 0;
        for (let a = Math.max(0, i - h); a <= Math.min(NR - 1, i + h); a++) for (let c = Math.max(0, j - h); c <= Math.min(NC - 1, j + h); c++) { const kk = a * NC + c; if (IN[kk]) buf.push(b[kk]); }
        buf.sort((x, y) => x - y); const n = buf.length; out[k] = n % 2 ? buf[(n - 1) / 2] : (buf[n / 2 - 1] + buf[n / 2]) / 2;
      } else {
        let sw = 0, sv = 0;
        for (let a = Math.max(0, i - h); a <= Math.min(NR - 1, i + h); a++) for (let c = Math.max(0, j - h); c <= Math.min(NC - 1, j + h); c++) {
          const kk = a * NC + c; if (!IN[kk]) continue; const wt = Math.exp(-((a - i) ** 2 + (c - j) ** 2) / (2 * s * s)); sw += wt; sv += wt * b[kk]; }
        out[k] = sv / sw;
      }
    }
    return (cache[key] = out);
  }
  function draw() {
    const f = {}; M.forEach((m) => { f[m] = filt(m).map((v, k) => (IN[k] ? v : NaN)); });
    const mean = f.da.map((v, k) => (IN[k] ? (f.da[k] + f.afi[k] + f.bs[k]) / 3 : NaN));
    let ss = 0, sm = 0, n = 0;
    for (let k = 0; k < NR * NC; k++) { if (!IN[k]) continue; M.forEach((m) => { ss += (f[m][k] - mean[k]) ** 2; }); sm += mean[k]; n++; }
    const spread = (100 * Math.sqrt(ss / (3 * n))) / (sm / n);
    M.forEach((m) => {
      F.draw(q(`canvas[data-fm="${m}"]`), f[m], 0.7, 1.3);
      F.draw(q(`canvas[data-fd="${m}"]`), f[m].map((v, k) => (IN[k] ? v / mean[k] - 1 : NaN)), -0.1, 0.1);
      const c = q(`.fm-ctl[data-m="${m}"]`);
      c.querySelectorAll('[data-fk]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fk === st[m].kind)));
      c.querySelector('.fm-w-read').textContent = st[m].kind === 'none' ? '–' : `${st[m].w} px`;
      c.querySelector('.fm-w').disabled = st[m].kind === 'none';
    });
    if (st.best == null || spread < st.best) st.best = spread;
    q('.fm-score').textContent = `${spread.toFixed(1)} %`; q('.fm-best').textContent = `best so far ${st.best.toFixed(1)} %`;
  }
  M.forEach((m) => {
    const c = q(`.fm-ctl[data-m="${m}"]`), wIn = c.querySelector('.fm-w');
    c.querySelectorAll('[data-fk]').forEach((b) => b.addEventListener('click', () => { b.blur(); st[m].kind = b.dataset.fk; draw(); }));
    wIn.addEventListener('input', () => { st[m].w = 2 * Number(wIn.value) + 1; draw(); }); keepSlider(wIn);
  });
  q('.fm-reset').addEventListener('click', (e) => { e.currentTarget.blur(); M.forEach((m) => { st[m].kind = 'none'; }); draw(); });
  onShow(slide, draw);
})();
