/* Deck runtime: Reveal setup, KaTeX, links back to the book, and the book's Plotly figures.
 * Pure helpers are exported for Node tests; start() runs in the browser. */
(function (root, factory) {
  const deck = factory();
  if (typeof module === 'object' && module.exports) module.exports = deck;
  else {
    root.T2Deck = deck;
    deck.start();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const BOOK_BASE = 'https://qmrlab.org/mooc/t2-mapping';
  const SECTIONS = { top: 'T2 Mapping', mono: 'Monoexponential T2 Mapping', multi: 'Multiexponential T2 Mapping' };

  // Book anchor -> [label shown on the slide, chapter section]. Numbers are the book's own.
  const LABELS = {
    top: [null, 'top'],
    introduction: ['Introduction', 'top'],
    't2-mapping-vs-t2-weighted-imaging': ['T2 Mapping vs T2-Weighted Imaging', 'top'],
    t2plot1: ['Figure 3.1', 'top'],
    exercises: ['Exercises', 'top'],
    'monoexponential-t2-mapping': [null, 'mono'],
    t2seq: ['Figure 3.2', 'mono'],
    'signal-modelling': ['Signal Modelling', 'mono'],
    t2eq1: ['Eq. 3.1', 'mono'],
    t2plot2: ['Figure 3.3', 'mono'],
    'data-fitting': ['Data Fitting', 'mono'],
    t2eq2: ['Eq. 3.2', 'mono'],
    t2t2star: ['T2*', 'mono'],
    t2eq3: ['Eq. 3.3', 'mono'],
    t2eq4: ['Eq. 3.4', 'mono'],
    noise: ['Noise', 'mono'],
    t2plot3: ['Figure 3.4', 'mono'],
    'benefits-and-pitfalls': ['Benefits and Pitfalls', 'mono'],
    t2multiexpo: [null, 'multi'],
    'signal-modelling-1': ['Signal Modelling', 'multi'],
    t2eq5: ['Eq. 3.5', 'multi'],
    t2plot4: ['Figure 3.5', 'multi'],
    'data-fitting-1': ['Data Fitting', 'multi'],
    t2eq6: ['Eq. 3.6', 'multi'],
    t2eq7: ['Eq. 3.7', 'multi'],
    t2plot5: ['Figure 3.7', 'multi'],
    'myelin-water-fraction-mwf-imaging': ['Myelin Water Fraction Imaging', 'multi'],
    t2eq8: ['Eq. 3.8', 'multi'],
    't2-and-quantitative-susceptibility-mapping-qsm': ['T2* and QSM', 'multi'],
    t2plot8: ['Figure 3.8', 'multi'],
    'benefits-and-pitfalls-of-multi-exponential-t2-mapping': ['Benefits and Pitfalls', 'multi'],
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

  // A figure is drawn while its slide is current or adjacent; others are purged to keep memory flat.
  function shouldMount(current, index) {
    return Math.abs(index - current) <= 1;
  }

  // Largest uniform scale that fits a figure of the book's pixel size into the available box.
  function fitScale(figW, figH, boxW, boxH) {
    return Math.min(boxW / figW, boxH / figH);
  }

  const deck = { BOOK_BASE, SECTIONS, LABELS, bookLink, shouldMount, fitScale, start, drawFigure, ready: false };

  // ---------------------------------------------------------------- browser only

  const PRINT = typeof location !== 'undefined' && /print-pdf/i.test(location.search);

  // A page whose <body> has data-home (the interactive exercises) links each slide to that page instead of the
  // book; an empty data-home (the starting page itself) gets no link.
  function addBookLink(section) {
    const home = document.body.dataset.home;
    if (home !== undefined) {
      if (!home) return;
      const a = document.createElement('a');
      a.className = 'home-link';
      a.href = home;
      a.textContent = '⌂ All exercises';
      section.appendChild(a);
      return;
    }
    const { href, text } = bookLink(section.dataset.book);
    const a = document.createElement('a');
    a.className = 'book-link';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = `📖 ${text}`;
    section.appendChild(a);
  }

  function fallbackCard(host) {
    const card = document.createElement('div');
    card.className = 'fig-fallback';
    card.append('This figure couldn’t load. ');
    const section = host.closest('section');
    if (section && section.dataset.book) {
      const a = document.createElement('a');
      a.href = bookLink(section.dataset.book).href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'See it in the book →';
      card.append(a);
    }
    return card;
  }

  // A Plotly figure is drawn at its own width and height, unchanged, then scaled as a whole
  // to fill the host. Fonts, margins and annotations keep the book's proportions.
  // Also used by the exercise slides for their computed figures. Returns the plot element.
  function drawFigure(host, fig) {
    const w = fig.layout.width;
    const h = fig.layout.height;
    const config = Object.assign({ displayModeBar: false, showLink: false }, fig.config || {}, { responsive: false });
    // Redrawing at the same size updates the plot in place: purging a plot mid-render breaks Plotly.
    if (host._plot && host._plot.isConnected && host._plotSize === `${w}x${h}`) {
      window.Plotly.react(host._plot, fig.data, fig.layout, config);
      return host._plot;
    }
    if (host._plot) window.Plotly.purge(host._plot);
    host.replaceChildren();
    const k = fitScale(w, h, host.clientWidth, host.clientHeight);
    const frame = document.createElement('div');
    frame.className = 'fig-frame';
    frame.style.width = `${w * k}px`;
    frame.style.height = `${h * k}px`;
    const plot = document.createElement('div');
    plot.className = 'fig-plot';
    plot.style.width = `${w}px`;
    plot.style.height = `${h}px`;
    plot.style.transform = `scale(${k})`;
    frame.appendChild(plot);
    host.appendChild(frame);
    window.Plotly.newPlot(plot, fig.data, fig.layout, config);
    host._plot = plot;
    host._plotSize = `${w}x${h}`;
    return plot;
  }

  function mountFigure(host) {
    if (host.dataset.state) return;
    const label = host.dataset.fig;
    try {
      const stored = window.T2Figures && window.T2Figures[label];
      if (!stored) throw new Error(`figure "${label}" is not loaded`);
      drawFigure(host, JSON.parse(JSON.stringify(stored)));
      host.dataset.state = 'mounted';
      // Lets the exercise slides re-apply their overlays whenever a book figure is (re)drawn.
      host.dispatchEvent(new CustomEvent('figuremounted', { bubbles: true }));
    } catch (err) {
      console.error(`[t2-deck] ${label}:`, err);
      host.replaceChildren(fallbackCard(host));
      host.dataset.state = 'failed';
    }
  }

  function unmountFigure(host) {
    if (!host.dataset.state) return;
    if (host._plot) window.Plotly.purge(host._plot);
    host._plot = null;
    host._plotSize = null;
    host.replaceChildren();
    delete host.dataset.state;
  }

  function syncFigures() {
    const slides = window.Reveal.getSlides();
    const current = slides.indexOf(window.Reveal.getCurrentSlide());
    slides.forEach((slide, i) => {
      slide.querySelectorAll('.fig-host').forEach((host) => {
        if (PRINT || shouldMount(current, i)) mountFigure(host);
        else unmountFigure(host);
      });
    });
  }

  // When embedded (e.g. in the book's Slides page), offer the deck in its own tab, at the current slide.
  // The link uses the deck's own address, so it is right wherever the deck is hosted.
  function addPopOutLink() {
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
  }

  function start() {
    addPopOutLink();
    document.querySelectorAll('.reveal .slides section[data-book]').forEach(addBookLink);
    window.renderMathInElement(document.querySelector('.reveal .slides'), {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\(', right: '\\)', display: false },
      ],
      throwOnError: false,
    });
    window.Reveal.initialize({
      width: 1280,
      height: 720,
      margin: 0.03,
      center: false,
      hash: true,
      slideNumber: 'c/t',
      transition: 'slide',
      plugins: [window.RevealNotes],
    }).then(() => {
      syncFigures();
      window.Reveal.on('slidechanged', syncFigures);
      deck.ready = true;
    });
  }

  return deck;
});
