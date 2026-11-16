/* Exercise 6-3, slide "The qMT images": the 10 MT-weighted images laid out like a Z-spectrum (a row per MT angle, the
 * offset increasing to the right), next to the MT-off image; raw, or divided by MT off. Predict-first questions in a card
 * (<ol class="hq-data">: <li data-a data-opts data-view="raw|norm"> with .q and .w), as in Exercise 6-1. Data:
 * js/data/brain.js; the raw MT-weighted images = the normalized MT data x the MT-off image (arbitrary units). */
(function () {
  'use strict';
  const { S, C, seg, brain } = window.MT;
  const $ = (id) => document.getElementById(id);
  if (!brain) return;
  const B = brain.B, OFF = S.QMT_OFFSETS, ANG = S.QMT_ANGLES;
  const COL = [C.a142, C.a426];
  const fmtOff = (o) => (o >= 1000 ? `${(o / 1000).toFixed(o < 10000 ? 1 : 0)} kHz` : `${o} Hz`);

  window.MTDeck.widget('s-raw', (section) => {
    let view = 'raw';
    const cv = $('rw-cv'), ctx = cv.getContext('2d');
    const W = 760, H = 384;
    cv.width = W * 2; cv.height = H * 2; ctx.setTransform(2, 0, 0, 2, 0, 0);
    const TW = 104, TH = 130, GX = 8, X1 = 160, Y0 = 44, GY = 34;   // MT-off image on the left, then a 2 x 5 grid
    let vmax = 0;
    for (const [y, x] of brain.voxels) vmax = Math.max(vmax, B.S0[y][x]);
    const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

    function image(px, py, w, h, val, max) {
      const sx = w / B.w, sy = h / B.h;
      ctx.fillStyle = '#000'; ctx.fillRect(px, py, w, h);
      for (const [y, x] of brain.voxels) {
        const g = Math.round(255 * Math.max(0, Math.min(1, val(y, x) / max)));
        ctx.fillStyle = `rgb(${g},${g},${g})`; ctx.fillRect(px + x * sx, py + y * sy, Math.ceil(sx), Math.ceil(sy));
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const norm = view === 'norm', max = norm ? 1 : vmax;
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      // MT off, on the left
      const oy = Y0 + (TH + GY) / 2;
      image(12, oy, TW, TH, (y, x) => (norm ? 1 : B.S0[y][x]), max);
      ctx.font = `700 13px ${FONT}`; ctx.fillStyle = '#1d2733'; ctx.fillText('MT off', 12 + TW / 2, oy - 8);
      if (norm) { ctx.font = `12px ${FONT}`; ctx.fillStyle = '#6b7785'; ctx.fillText('÷ itself = 1', 12 + TW / 2, oy + TH + 16); }
      // offsets along the top, angles down the side
      ctx.font = `600 12px ${FONT}`; ctx.fillStyle = '#4e5966';
      OFF.forEach((o, oi) => ctx.fillText(fmtOff(o), X1 + oi * (TW + GX) + TW / 2, Y0 - 10));
      ctx.fillText('MT pulse offset →', X1 + 2.5 * (TW + GX) - GX / 2, 14);
      ANG.forEach((a, ai) => {
        const py = Y0 + ai * (TH + GY);
        ctx.save(); ctx.translate(X1 - 12, py + TH / 2); ctx.rotate(-Math.PI / 2);
        ctx.font = `700 13px ${FONT}`; ctx.fillStyle = COL[ai]; ctx.fillText(`${a}°`, 0, 0); ctx.restore();
        OFF.forEach((o, oi) => image(X1 + oi * (TW + GX), py, TW, TH, (y, x) => (norm ? B.mt[brain.idx(oi, ai)][y][x] : B.mt[brain.idx(oi, ai)][y][x] * B.S0[y][x]), max));
      });
      ctx.font = `12px ${FONT}`; ctx.fillStyle = '#6b7785'; ctx.textAlign = 'left';
      ctx.fillText(norm ? 'Each MT image ÷ MT off. Grey scale: 0 (black) to 1 (white).' : 'Raw signal, one grey scale for all 11 images (arbitrary units).', X1, Y0 + 2 * (TH + GY) - GY + 22);
    }
    const setView = (v) => { view = v; section.querySelectorAll('[data-ctl="rw-view"] button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v))); draw(); };
    seg(section, 'rw-view', (v) => setView(v));

    // ---------------------------------------------------------------- the questions
    const items = [...section.querySelectorAll('.hq-data > li')].map((li) => ({
      a: li.dataset.a, view: li.dataset.view, q: li.querySelector('.q').innerHTML, w: li.querySelector('.w').innerHTML,
      opts: li.dataset.opts.split('|').map((s) => { const i = s.indexOf(':'); return [s.slice(0, i), s.slice(i + 1)]; }),
    }));
    const st = { k: 0, answered: null, right: 0, done: 0 };
    const box = section.querySelector('.hq-btns'), next = section.querySelector('.hq-next');
    function drawQuiz() {
      const done = st.k >= items.length, it = items[Math.min(st.k, items.length - 1)];
      section.querySelector('.hq-count').textContent = done ? 'All done' : `Question ${st.k + 1} of ${items.length}`;
      section.querySelector('.hq-score').textContent = `${st.right} / ${st.done} right`;
      section.querySelector('.hq-q').innerHTML = done ? `You got <b>${st.right} out of ${items.length}</b>.` : it.q;
      box.innerHTML = done ? '' : it.opts.map(([k, l]) => `<button class="bs-btn" data-hq="${k}"${st.answered ? ' disabled' : ''}>${l}</button>`).join('');
      if (st.answered) box.querySelectorAll('[data-hq]').forEach((b) => { b.classList.toggle('hq-pick', b.dataset.hq === st.answered); b.classList.toggle('hq-good', b.dataset.hq === it.a); });
      const ok = st.answered === it.a, fb = section.querySelector('.hq-fb'), why = section.querySelector('.hq-why');
      const label = (k) => (it.opts.find(([x]) => x === k) || [k, k])[1];
      fb.hidden = done || !st.answered; fb.className = `hq-fb ${ok ? 'hq-right' : 'hq-wrong'}`;
      fb.innerHTML = st.answered ? (ok ? '✓ Right' : `✗ Answer: ${label(it.a)}`) : '';
      why.hidden = done || !st.answered; why.innerHTML = st.answered ? it.w : '';
      next.hidden = !done && !st.answered;
      next.textContent = done ? 'Start again' : st.k === items.length - 1 ? 'See the score' : 'Next question';
    }
    function setQuestion() { const it = items[Math.min(st.k, items.length - 1)]; if (st.k < items.length && it.view) setView(it.view); drawQuiz(); }
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-hq]'); if (!b || st.answered) return;
      b.blur(); st.answered = b.dataset.hq; st.done++; if (st.answered === items[st.k].a) st.right++;
      drawQuiz();
    });
    next.addEventListener('click', () => {
      next.blur();
      if (st.k >= items.length) { st.k = 0; st.right = 0; st.done = 0; } else st.k++;
      st.answered = null; setQuestion();
    });
    setQuestion();
    return { show() { draw(); } };
  });
})();
