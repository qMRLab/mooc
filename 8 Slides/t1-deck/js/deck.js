/* Deck runtime: Reveal setup, KaTeX, links back to the book, and the book's Plotly figures.
 * Pure helpers are exported for Node tests; start() runs in the browser. */
(function (root, factory) {
  const deck = factory();
  if (typeof module === 'object' && module.exports) module.exports = deck;
  else {
    root.T1Deck = deck;
    deck.start();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const BOOK_BASE = 'https://qmrlab.org/mooc/t1-mapping';
  const SECTIONS = { top: 'T1 Mapping', ir: 'Inversion Recovery', vfa: 'Variable Flip Angle', mp2rage: 'MP2RAGE' };

  // Book anchor -> [label shown on the slide, chapter section]. Numbers are the book's own.
  const LABELS = {
    top: [null, 'top'],
    introduction: ['Introduction', 'top'],
    exercises: ['Exercises', 'top'],
    irintroduction: [null, 'ir'],
    irfig1: ['Figure 2.1', 'ir'],
    ireq1: ['Eq. 2.1', 'ir'],
    ireq2: ['Eq. 2.2', 'ir'],
    ireq3: ['Eq. 2.3', 'ir'],
    ireq4: ['Eq. 2.4', 'ir'],
    irplot1: ['Figure 2.2', 'ir'],
    irplot2: ['Figure 2.3', 'ir'],
    irplot3: ['Figure 2.4', 'ir'],
    irplot4: ['Figure 2.5', 'ir'],
    irplot5: ['Figure 2.6', 'ir'],
    'data-fitting': ['Data Fitting', 'ir'],
    'benefits-and-pitfalls': ['Benefits and Pitfalls', 'ir'],
    'other-saturation-recovery-t1-mapping-techniques': ['Other Saturation-Recovery Techniques', 'ir'],
    vfaintroduction: [null, 'vfa'],
    vfafig1: ['Figure 2.7', 'vfa'],
    vfaeq1: ['Eq. 2.5', 'vfa'],
    vfaeq2: ['Eq. 2.6', 'vfa'],
    vfaeq3: ['Eq. 2.7', 'vfa'],
    vfaeq4: ['Eq. 2.8', 'vfa'],
    vfaeq5: ['Eq. 2.9', 'vfa'],
    vfaeq6: ['Eq. 2.10', 'vfa'],
    vfaplot1: ['Figure 2.8', 'vfa'],
    vfaplot2: ['Figure 2.9', 'vfa'],
    vfaplot3: ['Figure 2.10', 'vfa'],
    vfaplot4: ['Figure 2.11', 'vfa'],
    vfaplot5: ['Figure 2.11', 'vfa'],
    vfaplot6: ['Figure 2.12', 'vfa'],
    vfadatafitting: ['Data Fitting', 'vfa'],
    'benefits-and-pitfalls-1': ['Benefits and Pitfalls', 'vfa'],
    mp2rageintroduction: [null, 'mp2rage'],
    mp2ragefig1: ['Figure 2.13', 'mp2rage'],
    mp2rageeq1: ['Eq. 2.11', 'mp2rage'],
    mp2rageeq2: ['Eq. 2.12', 'mp2rage'],
    mp2rageeq3: ['Eq. 2.13', 'mp2rage'],
    mp2rageeq4: ['Eq. 2.14', 'mp2rage'],
    mp2rageeq5: ['Eq. 2.15', 'mp2rage'],
    mp2rageeq6: ['Eq. 2.16', 'mp2rage'],
    mp2rageplot1: ['Figure 2.14', 'mp2rage'],
    mp2rageplot2: ['Figure 2.15', 'mp2rage'],
    'data-fitting-1': ['Data Fitting', 'mp2rage'],
    'benefits-and-pitfalls-2': ['Benefits and Pitfalls', 'mp2rage'],
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
    if (host._plot) window.Plotly.purge(host._plot);
    host.replaceChildren();
    const w = fig.layout.width;
    const h = fig.layout.height;
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
    const config = Object.assign({ displayModeBar: false, showLink: false }, fig.config || {}, { responsive: false });
    window.Plotly.newPlot(plot, fig.data, fig.layout, config);
    host._plot = plot;
    return plot;
  }

  function mountFigure(host) {
    if (host.dataset.state) return;
    const label = host.dataset.fig;
    try {
      const stored = window.T1Figures && window.T1Figures[label];
      if (!stored) throw new Error(`figure "${label}" is not loaded`);
      drawFigure(host, JSON.parse(JSON.stringify(stored)));
      host.dataset.state = 'mounted';
      // Lets the exercise slides re-apply their overlays whenever a book figure is (re)drawn.
      host.dispatchEvent(new CustomEvent('figuremounted', { bubbles: true }));
    } catch (err) {
      console.error(`[t1-deck] ${label}:`, err);
      host.replaceChildren(fallbackCard(host));
      host.dataset.state = 'failed';
    }
  }

  function unmountFigure(host) {
    if (!host.dataset.state) return;
    if (host._plot) window.Plotly.purge(host._plot);
    host._plot = null;
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
