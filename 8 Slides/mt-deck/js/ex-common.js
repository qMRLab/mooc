/* Shared pieces of the MT exercises (load after js/mt-common.js), as in the B0 exercises' js/ex-common.js:
 *   .ask boxes      <div class="ask" data-answer="54" data-tol="0.05" data-unit=" %"> with an <input type="number">, an .ask-go
 *                   button and an .ask-fb line. Check compares with the answer (relative tolerance data-tol, or absolute
 *                   data-abs); data-explain (HTML) is shown after any check. A script may set the answer later
 *                   (box.dataset.answer) when it is computed in the page.
 *   .show-ans       toggles the .ans block in the same parent.
 *   home link       a page whose <body> has data-home gets a link back to it on every slide. */
(function () {
  'use strict';
  const keep = window.MT.keepKeys;

  function checkAsk(box) {
    const input = box.querySelector('input'), fb = box.querySelector('.ask-fb');
    const v = Number(input.value), a = Number(box.dataset.answer);
    if (input.value === '' || !Number.isFinite(v)) { fb.className = 'ask-fb'; fb.textContent = 'Type a number first.'; return null; }
    const tol = box.dataset.abs ? Number(box.dataset.abs) : Math.abs(a) * Number(box.dataset.tol || 0.05);
    const ok = Math.abs(v - a) <= tol;
    const shown = box.dataset.shown || (Math.abs(a) >= 100 ? a.toFixed(0) : Math.abs(a) >= 10 ? a.toFixed(1) : a.toPrecision(3));
    fb.className = `ask-fb ${ok ? 'right' : 'wrong'}`;
    fb.innerHTML = (ok ? '✓ Right' : `✗ Not quite: ${shown}${box.dataset.unit || ''}`) + (box.dataset.explain ? ` <span style="font-weight:400;color:var(--ink)">${box.dataset.explain}</span>` : '');
    box.dispatchEvent(new CustomEvent('checked', { detail: { ok, value: v } }));
    return ok;
  }

  document.querySelectorAll('.ask').forEach((box) => {
    const input = box.querySelector('input'), go = box.querySelector('.ask-go');
    if (!go || !input) return;
    keep(input);
    go.addEventListener('click', () => { go.blur(); checkAsk(box); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkAsk(box); });
  });

  document.querySelectorAll('.show-ans').forEach((b) => {
    const ans = b.parentElement.querySelector('.ans');
    b.addEventListener('click', () => {
      b.blur();
      const open = ans.hidden;
      ans.hidden = !open;
      b.textContent = open ? (b.dataset.hide || 'Hide the answer') : (b.dataset.show || 'Show the answer');
    });
  });

  const home = document.body.dataset.home;
  if (home) {
    document.querySelectorAll('.reveal .slides > section').forEach((s) => {
      const a = document.createElement('a');
      a.className = 'home-link'; a.href = home; a.textContent = '⌂ All exercises';
      s.appendChild(a);
    });
  }

  window.MTEx = { checkAsk };
})();
