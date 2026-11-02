/* A multiple-choice quiz, one question at a time (Exercise 4-4, #bs-b-quiz). A slide with class "mc-quiz" holds its questions
 * in an <ol class="mc-data">: each <li data-a="k"> has a <span class="q"> (the question), its options as <span class="o">
 * (k = the right one, from 0) and a <span class="w"> (why). Buttons are made for the options; after an answer, right / wrong,
 * the explanation and "Next"; at the end, the score (x / n), "Next slide →" and "Start again". */
(function () {
  'use strict';
  document.querySelectorAll('section.mc-quiz').forEach((slide) => {
    const q = (c) => slide.querySelector(c);
    const items = [...slide.querySelectorAll('.mc-data > li')].map((li) => ({
      a: Number(li.dataset.a), q: li.querySelector('.q').innerHTML, o: [...li.querySelectorAll('.o')].map((e) => e.innerHTML), w: li.querySelector('.w').innerHTML,
    }));
    const opts = q('.mc-opts'), next = q('.mc-next'), again = q('.mc-again'), st = { k: 0, ans: null, right: 0 };
    function draw() {
      const done = st.k >= items.length, it = items[Math.min(st.k, items.length - 1)];
      q('.mc-count').textContent = done ? 'All done' : `Question ${st.k + 1} of ${items.length}`;
      q('.mc-score').textContent = `${st.right} / ${done ? items.length : st.k + (st.ans != null ? 1 : 0)} right`;
      q('.mc-q').innerHTML = done ? `You got <b>${st.right} out of ${items.length}</b>. Now check the predictions on the next slide.` : it.q;
      opts.innerHTML = done ? '' : it.o.map((o, i) => `<button class="bs-btn${st.ans == null ? '' : i === it.a ? ' mc-good' : i === st.ans ? ' mc-bad' : ''}" data-i="${i}"${st.ans == null ? '' : ' disabled'}>${o}</button>`).join('');
      const fb = q('.mc-fb'), ok = st.ans === it.a;
      fb.hidden = done || st.ans == null; fb.className = `mc-fb ${ok ? 'mc-right' : 'mc-wrong'}`; fb.textContent = ok ? '✓ Right' : '✗ Not quite';
      q('.mc-why').hidden = done || st.ans == null; q('.mc-why').innerHTML = st.ans == null ? '' : it.w;
      next.hidden = !done && st.ans == null;
      next.textContent = done ? 'Next slide →' : st.k === items.length - 1 ? 'See the score' : 'Next question';
      next.classList.toggle('mc-go', done); if (again) again.hidden = !done;   // at the end: on to the next slide, or start again
    }
    opts.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || st.ans != null) return;
      b.blur(); st.ans = Number(b.dataset.i); if (st.ans === items[st.k].a) st.right++; draw();
    });
    next.addEventListener('click', () => { next.blur(); if (st.k >= items.length) { Reveal.next(); return; } st.k++; st.ans = null; draw(); });
    if (again) again.addEventListener('click', () => { again.blur(); st.k = 0; st.right = 0; st.ans = null; draw(); });
    draw();
  });
})();
