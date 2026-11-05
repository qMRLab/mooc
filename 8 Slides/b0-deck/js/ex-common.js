/* Shared pieces of the B0 exercises (load after js/common.js):
 *   .ask boxes        <div class="ask" data-answer="54" data-tol="0.06" data-unit="°"> with an <input type="number">,
 *                     a .ask-go button and a .ask-fb line: Check compares with the answer (relative tolerance data-tol,
 *                     or absolute with data-abs) and says right / wrong; data-explain (HTML) is shown after any check.
 *   .show-ans buttons toggle the .ans block that follows them in the same parent (data-show / data-hide labels).
 *   BWR               blue - white - red, white at 0, as in the lecture deck.
 *   svgEl()           an SVG element with attributes. */
const BWR = [[0, '#053061'], [0.2, '#2166ac'], [0.4, '#92c5de'], [0.5, '#ffffff'], [0.6, '#f4a582'], [0.8, '#b2182b'], [1, '#67001f']];
const SVGNS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs, parent) {
  const el = document.createElementNS(SVGNS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
  if (parent) parent.appendChild(el);
  return el;
}

document.querySelectorAll('.ask').forEach((box) => {
  const input = box.querySelector('input'), go = box.querySelector('.ask-go'), fb = box.querySelector('.ask-fb');
  if (!go) return;   // a box styled as .ask but checked by its own script
  keepSlider(input);
  const check = () => {
    const v = Number(input.value), a = Number(box.dataset.answer);
    if (input.value === '' || !Number.isFinite(v)) { fb.className = 'ask-fb'; fb.textContent = 'Type a number first.'; return; }
    const tol = box.dataset.abs ? Number(box.dataset.abs) : Math.abs(a) * Number(box.dataset.tol || 0.05);
    const ok = Math.abs(v - a) <= tol;
    fb.className = `ask-fb ${ok ? 'right' : 'wrong'}`;
    fb.innerHTML = (ok ? '✓ Right' : `✗ Not quite: ${box.dataset.shown || a}${box.dataset.unit || ''}`) + (box.dataset.explain ? ` <span style="font-weight:400;color:var(--ink)">${box.dataset.explain}</span>` : '');
  };
  go.addEventListener('click', () => { go.blur(); check(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
});

document.querySelectorAll('.show-ans').forEach((b) => {
  const ans = b.parentElement.querySelector('.ans') || b.closest('div').nextElementSibling;
  b.addEventListener('click', () => {
    b.blur();
    const open = ans.hidden;
    ans.hidden = !open;
    b.setAttribute('aria-pressed', String(open));
    b.textContent = open ? (b.dataset.hide || 'Hide the answer') : (b.dataset.show || 'Show the answer');
  });
});

// Tabs: a .ex-tabs row of [data-tab] buttons shows the .ex-panel with the same data-panel in its slide.
// The panel shown fires 'tabshown' (detail: the tab's key) on the slide, for scripts that draw on demand.
document.querySelectorAll('.ex-tabs').forEach((bar) => {
  const slide = bar.closest('section');
  bar.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
    b.blur();
    bar.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    slide.querySelectorAll('.ex-panel').forEach((p) => { p.hidden = p.dataset.panel !== b.dataset.tab; });
    slide.dispatchEvent(new CustomEvent('tabshown', { detail: b.dataset.tab }));
  }));
});
