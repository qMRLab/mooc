/* Deck runtime for the MT slides: Reveal setup, KaTeX, links back to the book and the live figures' hooks.
 * Adapted from the B0 deck's js/deck.js. The figures are computed in the page (js/mt-widgets.js, with the two-pool
 * simulator js/mt-sim.js and one slice of the chapter's qMT data, js/data/brain.js) instead of copied from the book.
 * Loadable in Node for the tests (no DOM: only the tables and helpers). */
(function (root) {
  'use strict';

  const BOOK_BASE = 'https://qmrlab.org/mooc/magnetization-transfer-imaging';
  const SECTIONS = {
    top: 'Magnetization Transfer',
    qmt: 'Quantitative MT',
    mtr: 'Magnetization Transfer Ratio',
    mtsat: 'MT Saturation',
    appA: 'Appendix A',
    appB: 'Appendix B',
    appC: 'Appendix C',
  };

  // Book anchor -> [label shown on the slide, chapter section]. Numbers are the book's own.
  const LABELS = {
    top: [null, 'top'],
    introduction: ['Introduction', 'top'],
    qmtintro: [null, 'qmt'],
    'signal-modelling': ['Signal Modelling', 'qmt'],
    qmteq1: ['Eqs. 6.1–6.5', 'qmt'],
    qmtfig1: ['Figure 6.1', 'qmt'],
    qmtfig2: ['Figure 6.2', 'qmt'],
    qmtfig3: ['Figure 6.3', 'qmt'],
    qmtfig4: ['Figure 6.4', 'qmt'],
    'data-fitting': ['Data Fitting', 'qmt'],
    qmtfig5: ['Figure 6.5', 'qmt'],
    qmtfig6: ['Figure 6.6', 'qmt'],
    qmteq6: ['Eq. 6.6', 'qmt'],
    qmtfig8: ['Figure 6.7', 'qmt'],
    summary: ['Summary', 'qmt'],
    'magnetization-transfer-ratio': [null, 'mtr'],
    'mtr-in-theory': ['MTR in theory', 'mtr'],
    mtreq1: ['Eq. 6.7', 'mtr'],
    'mtr-in-practice': ['MTR in practice', 'mtr'],
    mtrtable2: ['Table 6.2', 'mtr'],
    mtrplot1: ['Figure 6.9', 'mtr'],
    mtrplot2: ['Figure 6.10', 'mtr'],
    mtrplot3: ['Figure 6.11', 'mtr'],
    'parting-thoughts': ['Parting thoughts', 'mtr'],
    mtsatintro: [null, 'mtsat'],
    mtsatfig1: ['Figure 6.14', 'mtsat'],
    mtsatfig2: ['Figure 6.15', 'mtsat'],
    theory: ['Theory', 'mtsat'],
    mtsateq5: ['Eq. 6.12', 'mtsat'],
    mtsatfig3: ['Figure 6.16', 'mtsat'],
    mtsateq7: ['Eqs. 6.7–6.9 (MTsat)', 'mtsat'],
    mtsatprotocoltable: ['Table 6.4', 'mtsat'],
    mtsatplot1: ['Figure 6.17', 'mtsat'],
    mtsatplot2: ['Figure 6.18', 'mtsat'],
    mtsatplot3: ['Figure 6.19', 'mtsat'],
    mtrappendixa: [null, 'appA'],
    mtsatappendixa: [null, 'appB'],
    'appendix-c': [null, 'appC'],
    'interpreting-mtsat': ['Interpreting MTSat', 'appC'],
    exercises: ['Exercises', 'top'],
  };

  function bookLink(label) {
    const entry = LABELS[label];
    if (!entry) throw new Error(`Unknown book label "${label}"`);
    const [what, section] = entry;
    return {
      href: label === 'top' ? BOOK_BASE : `${BOOK_BASE}#${label}`,
      text: what ? `${what} · ${SECTIONS[section]}` : SECTIONS[section],
    };
  }

  const api = { bookLink, LABELS, BOOK_BASE };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }

  // ------------------------------------------------------------------ browser only

  const PRINT = /print-pdf/i.test(location.search);

  function addBookLink(section) {
    const { href, text } = bookLink(section.dataset.book);
    const a = document.createElement('a');
    a.className = 'book-link';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = `📖 ${text}`;
    section.appendChild(a);
  }

  // Widgets register with MTDeck.widget(slideId, init): init(section) runs once, the first time the slide is current or
  // next to it (or at load when printing); it may return { show(), hide() } for slides that animate.
  const widgets = [];
  function widget(id, init) { widgets.push({ id, init, started: false, handle: null }); }

  function syncSlides() {
    const slides = window.Reveal.getSlides();
    const current = window.Reveal.getCurrentSlide();
    const ci = slides.indexOf(current);
    widgets.forEach((w) => {
      const section = document.getElementById(w.id);
      if (!section) return;
      const i = slides.indexOf(section);
      const near = PRINT || Math.abs(i - ci) <= 1;
      if (near && !w.started) {
        w.started = true;
        try { w.handle = w.init(section) || null; } catch (err) { console.error(`[mt-deck] widget ${w.id}:`, err); }
      }
      if (w.handle) {
        if (section === current && w.handle.show) w.handle.show();
        if (section !== current && w.handle.hide) w.handle.hide();
      }
    });
  }

  // When embedded (the book's Slides page), offer the deck in its own tab, at the current slide.
  function addPopOutLink() {
    if (window.self === window.top) return;
    const a = document.createElement('a');
    a.className = 'pop-out';
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'Open in new tab ↗';
    const update = () => {
      const base = window.location.href.split('#')[0];
      const idx = window.Reveal && window.Reveal.isReady() ? window.Reveal.getIndices() : { h: 0 };
      a.href = idx.h || idx.v ? `${base}#/${idx.h}${idx.v ? `/${idx.v}` : ''}` : base;
    };
    update();
    ['pointerdown', 'focus', 'click'].forEach((type) => a.addEventListener(type, update));
    document.querySelector('.reveal').appendChild(a);
  }

  function renderMath(el) {
    if (!window.renderMathInElement) return;
    window.renderMathInElement(el, {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\(', right: '\\)', display: false }],
      throwOnError: false,
    });
  }

  function start() {
    addPopOutLink();
    document.querySelectorAll('.reveal .slides section[data-book]').forEach(addBookLink);
    renderMath(document.querySelector('.reveal .slides'));
    window.Reveal.initialize({
      width: 1280,
      height: 720,
      margin: 0.03,
      center: false,
      hash: true,
      slideNumber: 'c/t',
      transition: 'slide',
      plugins: window.RevealNotes ? [window.RevealNotes] : [],
    }).then(() => {
      syncSlides();
      window.Reveal.on('slidechanged', syncSlides);
    });
  }

  root.MTDeck = { ...api, widget, renderMath, PRINT };
  // Widgets register after this file loads; start once the DOM and every script are in.
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})(typeof window !== 'undefined' ? window : globalThis);
