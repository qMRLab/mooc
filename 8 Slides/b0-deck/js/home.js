/* A page whose <body> has data-home (the exercise decks) gets a link back to that page on every slide, as in the T2 decks. */
(function () {
  'use strict';
  const home = document.body.dataset.home; if (!home) return;
  document.querySelectorAll('.reveal .slides > section').forEach((s) => {
    const a = document.createElement('a');
    a.className = 'home-link'; a.href = home; a.textContent = '⌂ All exercises';
    s.appendChild(a);
  });
})();
