// Navigation for the T2 decks (the lecture deck and Exercises 2-1 to 2-4): load after js/deck.js.
/* Full-height zones at the left and right edges (a grey bar and an arrow on hover)
 * replace Reveal's corner arrows, which sat on the slide number. A page whose <body> has data-next-deck
 * goes on to that page from its last slide (the right zone, Space, Page Down or →). */
(function () {
  'use strict';
  if (!window.Reveal) return;
  const nextDeck = document.body.dataset.nextDeck;
  const atEnd = () => window.Reveal.getIndices().h === window.Reveal.getTotalSlides() - 1;
  const zone = (cls, label, arrow, go) => {
    const b = document.createElement('button');
    b.className = `nav-zone ${cls}`; b.setAttribute('aria-label', label); b.textContent = arrow;
    b.addEventListener('click', (e) => { e.currentTarget.blur(); go(); });
    document.body.appendChild(b);
    return b;
  };
  const prev = zone('prev', 'Previous slide', '‹', () => window.Reveal.prev());
  const next = zone('next', 'Next slide', '›', () => (nextDeck && atEnd() ? window.location.assign(nextDeck) : window.Reveal.next()));
  const update = () => {
    prev.hidden = window.Reveal.getIndices().h === 0;
    next.hidden = atEnd() && !nextDeck;
  };
  if (nextDeck) {
    document.addEventListener('keydown', (e) => {
      if (!atEnd() || e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input, select, textarea')) return;
      if (e.key !== ' ' && e.key !== 'PageDown' && e.key !== 'ArrowRight') return;
      if (e.key === 'ArrowRight' && window.Reveal.getCurrentSlide().querySelector('canvas')) return;  // the arrows play the game
      e.preventDefault();
      window.location.assign(nextDeck);
    });
  }
  window.Reveal.on('ready', update);
  window.Reveal.on('slidechanged', update);
  if (window.Reveal.isReady()) update();
})();
