/* Higher or lower? (Exercise 4-3, #afi-hl). A slide with class "hl-quiz" holds its questions in an <ol class="hq-data">:
 * each <li data-a="hi|lo|same"> has a <span class="q"> (the question) and a <span class="w"> (why). They are asked one at a
 * time in the .hq-card (an optional <span class="c"> says where to check a wrong answer; its .hq-go buttons, data-go = ±1, go
 * there, and a "Back to the quiz" button then shows until they return): three buttons (higher, lower, about the same), then right / wrong, the explanation and "Next";
 * at the end, the score (one number to compare, x / n). */
(function () {
  'use strict';
  const WORD = { hi: 'higher', lo: 'lower', same: 'about the same' };
  document.querySelectorAll('section.hl-quiz').forEach((slide) => {
    const q = (c) => slide.querySelector(c);
    const items = [...slide.querySelectorAll('.hq-data > li')].map((li) => ({ a: li.dataset.a, q: li.querySelector('.q').innerHTML, w: li.querySelector('.w').innerHTML, c: li.querySelector('.c')?.innerHTML || '' }));
    const st = { k: 0, answered: null, right: 0 };
    const btns = [...slide.querySelectorAll('[data-hq]')], next = q('.hq-next');
    function draw() {
      const done = st.k >= items.length, it = items[Math.min(st.k, items.length - 1)];
      q('.hq-count').textContent = done ? 'All done' : `Question ${st.k + 1} of ${items.length}`;
      q('.hq-score').textContent = `${st.right} / ${done ? items.length : st.k + (st.answered ? 1 : 0)} right`;
      q('.hq-q').innerHTML = done ? `You got <b>${st.right} out of ${items.length}</b>. Check them with the sliders on the next slide.` : it.q;
      btns.forEach((b) => {
        b.hidden = done; b.disabled = !!st.answered;
        b.classList.toggle('hq-pick', st.answered === b.dataset.hq);
        b.classList.toggle('hq-good', !!st.answered && b.dataset.hq === it.a);
      });
      const fb = q('.hq-fb'), ok = st.answered === it.a;
      fb.hidden = done || !st.answered;
      fb.className = `hq-fb ${ok ? 'hq-right' : 'hq-wrong'}`;
      fb.textContent = st.answered ? (ok ? `✓ Right: ${WORD[it.a]}` : `✗ It’s ${WORD[it.a]}`) : '';
      q('.hq-why').hidden = done || !st.answered;
      q('.hq-why').innerHTML = st.answered ? it.w : '';
      const chk = q('.hq-check');   // wrong answer: where to check it (state is kept when they leave the slide and come back)
      chk.hidden = done || !st.answered || ok || !it.c; chk.innerHTML = chk.hidden ? '' : it.c;
      next.hidden = !done && !st.answered;
      next.textContent = done ? 'Start again' : st.k === items.length - 1 ? 'See the score' : 'Next question';
    }
    btns.forEach((b) => b.addEventListener('click', () => {
      b.blur(); if (st.answered) return;
      st.answered = b.dataset.hq; if (st.answered === items[st.k].a) st.right++;
      draw();
    }));
    // the check buttons: go to the slide before / after, with a way back (the quiz keeps its state meanwhile)
    const idx = () => Reveal.getIndices(slide).h;
    const back = document.createElement('button');
    back.className = 'hq-back'; back.hidden = true; back.textContent = '← Back to the quiz';
    document.body.appendChild(back);
    q('.hq-check').addEventListener('click', (e) => {
      const b = e.target.closest('.hq-go'); if (!b) return;
      b.blur(); Reveal.slide(idx() + Number(b.dataset.go)); back.hidden = false;
    });
    back.addEventListener('click', () => { back.blur(); Reveal.slide(idx()); });
    Reveal.on('slidechanged', (e) => { if (e.currentSlide === slide) back.hidden = true; });   // until they're back on the quiz
    next.addEventListener('click', () => {
      next.blur();
      if (st.k >= items.length) { st.k = 0; st.right = 0; } else st.k++;
      st.answered = null; draw();
    });
    draw();
  });
})();
