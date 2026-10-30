/* When embedded (e.g. in the book's Slides pages), offer the deck in its own tab, at the current slide, as the T1 and
 * T2 decks do (their js/deck.js). The link uses the deck's own address, so it is right wherever the deck is hosted. */
(function () {
  'use strict';
  if (window.self === window.top) return;
  const a = document.createElement('a');
  a.className = 'pop-out';
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = 'Open in new tab ↗';
  // Inside an iframe Reveal does not write the slide to the URL, so build '#/h/v' from its indices.
  const update = () => {
    const base = window.location.href.split('#')[0];
    const idx = window.Reveal && window.Reveal.isReady() ? window.Reveal.getIndices() : { h: 0 };
    a.href = idx.h || idx.v ? `${base}#/${idx.h}${idx.v ? `/${idx.v}` : ''}` : base;
  };
  update();
  ['pointerdown', 'focus', 'click'].forEach((type) => a.addEventListener(type, update));
  document.querySelector('.reveal').appendChild(a);
})();
