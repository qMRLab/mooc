/* Deck runtime for the B0 slides: Reveal setup, KaTeX, links back to the book, and the book's Plotly figures.
 * Adapted from the T2 deck's js/deck.js. Differences: each figure is its own script in js/figures/, loaded when
 * its slide is current or next to it, and the shared Plotly theme (js/figures/template.js) is put back here. */
(function () {
  'use strict';

  const BOOK_BASE = 'https://qmrlab.org/mooc/b0-mapping';
  const SECTIONS = {
    top: 'B0 Mapping',
    inhomo: 'B0 Inhomogeneities',
    dual: 'Dual Echo B0 Mapping',
    unwrap: 'Phase Unwrapping',
    adv: 'Advanced B0 Mapping Methods',
  };

  // Book anchor -> [label shown on the slide, chapter section]. Numbers are the book's own.
  const LABELS = {
    top: [null, 'top'],
    introduction: ['Introduction', 'top'],
    b0inhomointro: [null, 'inhomo'],
    b0plot1: ['Figure 5.1', 'inhomo'],
    sources: ['Sources', 'inhomo'],
    'magnetic-susceptibility': ['Magnetic Susceptibility', 'inhomo'],
    b0plot2: ['Figure 5.2', 'inhomo'],
    b0plot3: ['Figure 5.3', 'inhomo'],
    'effects-on-signal': ['Effects on Signal', 'inhomo'],
    b0plot4: ['Figure 5.4', 'inhomo'],
    b0plot5: ['Figure 5.5', 'inhomo'],
    b0dualecho: [null, 'dual'],
    'signal-theory': ['Signal Theory', 'dual'],
    b0plot6: ['Figure 5.6', 'dual'],
    b0plot7: ['Figure 5.7', 'dual'],
    b0plot8: ['Figure 5.8', 'dual'],
    b0plot9: ['Figure 5.9', 'dual'],
    b0dualechobenpit: ['Benefits and Pitfalls', 'dual'],
    phaseunwrapintro: [null, 'unwrap'],
    'temporal-unwrapping': ['Temporal Unwrapping', 'unwrap'],
    b0table1: ['Table 5.1', 'unwrap'],
    b0plot10: ['Figure 5.10', 'unwrap'],
    b0plot11: ['Figure 5.11', 'unwrap'],
    b0plot12: ['Figure 5.12', 'unwrap'],
    b0plot13: ['Figure 5.13', 'unwrap'],
    'phase-unwrapping-ambiguity': ['Phase Unwrapping Ambiguity', 'unwrap'],
    b0plot14: ['Figure 5.14', 'unwrap'],
    software: ['Software', 'unwrap'],
    b0multiecho: ['Multi-echo B0 Mapping', 'adv'],
    b0plot15: ['Figure 5.15', 'adv'],
    b0plot16: ['Figure 5.16', 'adv'],
    b0eddy: ['Reducing Eddy Currents', 'adv'],
    'realtime-b0-mapping': ['Realtime B0 Mapping', 'adv'],
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

  // ------------------------------------------------------------ book figures

  const loading = {};
  function loadFigure(label) {
    if (window.B0Figures && window.B0Figures[label]) return Promise.resolve(window.B0Figures[label]);
    if (!loading[label]) {
      loading[label] = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = `js/figures/${label}.js`;
        s.onload = () => (window.B0Figures && window.B0Figures[label] ? resolve(window.B0Figures[label]) : reject(new Error(`${label}.js did not define the figure`)));
        s.onerror = () => { delete loading[label]; reject(new Error(`could not load js/figures/${label}.js`)); };
        document.head.appendChild(s);
      });
    }
    return loading[label];
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

  // Largest uniform scale that fits a figure of the book's pixel size into the available box.
  function fitScale(figW, figH, boxW, boxH) {
    return Math.min(boxW / figW, boxH / figH);
  }

  // A figure is drawn at the book's width and height, then scaled as a whole to fill the host,
  // so fonts, margins and annotations keep the book's proportions. Returns the plot element.
  function drawFigure(host, fig) {
    const w = fig.layout.width;
    const h = fig.layout.height;
    const config = { displayModeBar: false, showLink: false, responsive: false };
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
    const p = window.Plotly.newPlot(plot, fig.data, fig.layout, config);
    if (fig.frames) p.then(() => window.Plotly.addFrames(plot, fig.frames));
    host._plot = plot;
    return plot;
  }

  function withTemplate(stored) {
    const fig = JSON.parse(JSON.stringify(stored));
    if (window.B0Template && !fig.layout.template) fig.layout.template = window.B0Template;
    return fig;
  }

  function mountFigure(host) {
    if (host.dataset.state) return;
    const label = host.dataset.fig;
    host.dataset.state = 'loading';
    Promise.all([loadFigure(label), loadTemplate()])
      .then(([stored]) => {
        if (host.dataset.state !== 'loading' || host.dataset.fig !== label) return;
        drawFigure(host, withTemplate(stored));
        host.dataset.state = 'mounted';
      })
      .catch((err) => {
        console.error(`[b0-deck] ${label}:`, err);
        host.replaceChildren(fallbackCard(host));
        host.dataset.state = 'failed';
      });
  }

  function unmountFigure(host) {
    if (!host.dataset.state) return;
    if (host._plot) window.Plotly.purge(host._plot);
    host._plot = null;
    host.replaceChildren();
    delete host.dataset.state;
  }

  // The Plotly theme shared by all the figures (stripped from each by tools/extract_book_figures.py).
  let templatePromise = null;
  function loadTemplate() {
    if (window.B0Template) return Promise.resolve();
    if (!templatePromise) {
      templatePromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'js/figures/template.js';
        s.onload = resolve;
        s.onerror = () => { templatePromise = null; reject(new Error('could not load js/figures/template.js')); };
        document.head.appendChild(s);
      });
    }
    return templatePromise;
  }

  // Tabs over one figure host: each button names the figure to show (data-show).
  function setupFigTabs(section) {
    section.querySelectorAll('.fig-tabs[data-for]').forEach((tabs) => {
      const host = section.querySelector(`.fig-host[data-tabs="${tabs.dataset.for}"]`);
      // An optional second row picks a dataset (data-set="n"): a view's figure for it is its data-show<n>, else data-show.
      const sets = section.querySelector(`.fig-tabs[data-sets-for="${tabs.dataset.for}"]`);
      const show = () => {
        const view = tabs.querySelector('button[aria-pressed="true"]');
        const set = sets && sets.querySelector('button[aria-pressed="true"]').dataset.set;
        const fig = (set && view.dataset[`show${set}`]) || view.dataset.show;
        if (host.dataset.fig === fig) return;
        unmountFigure(host);
        host.dataset.fig = fig;
        mountFigure(host);
      };
      [tabs, sets].forEach((row) => {
        if (!row) return;
        row.querySelectorAll('button').forEach((b) => {
          b.addEventListener('click', () => {
            row.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
            show();
          });
        });
      });
    });
  }

  // A figure is drawn while its slide is current or adjacent; others are purged to keep memory flat.
  function syncFigures() {
    const slides = window.Reveal.getSlides();
    const current = slides.indexOf(window.Reveal.getCurrentSlide());
    slides.forEach((slide, i) => {
      const near = PRINT || Math.abs(i - current) <= 1;
      slide.querySelectorAll('.fig-host[data-fig]').forEach((host) => (near ? mountFigure(host) : unmountFigure(host)));
      slide.dispatchEvent(new CustomEvent(near ? 'deck:near' : 'deck:far'));
    });
  }

  // When embedded (e.g. in the book's Slides page), offer the deck in its own tab, at the current slide.
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

  function start() {
    addPopOutLink();
    document.querySelectorAll('.reveal .slides section[data-book]').forEach(addBookLink);
    document.querySelectorAll('.reveal .slides section').forEach(setupFigTabs);
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
      plugins: window.RevealNotes ? [window.RevealNotes] : [],
    }).then(() => {
      syncFigures();
      window.Reveal.on('slidechanged', syncFigures);
    });
  }

  window.B0Deck = { bookLink, fitScale, drawFigure, LABELS };
  start();
})();
