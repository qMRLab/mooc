/* Exercise slides: actions bound to slides, editable "measured" values, Solve/Reset buttons.
 *
 * Markup (see exercise-*.html):
 *   <div class="fragment" data-action="id">  runs action `id` when the fragment is shown (→ or a clicker),
 *                                           undoes it when hidden (←).
 *   <section data-auto="id">                 runs action `id` whenever the slide is shown.
 *   <button data-run="id">                   Solve: shows the action's fragment, or reruns it if already shown.
 *   <button data-reset="id">                 restores the slide's inputs to their defaults and reruns.
 *   <button data-preset='{"key": "value"}' data-run="id">  fills inputs, then runs.
 *   <input data-key="wm" value="624">        an editable value; Enter runs the slide's first data-run button.
 *   .result / .result-host                   where actions write their text / draw their figure.
 *
 * Exercise files register actions with T1Exercise.action(id, { run(ctx), undo(ctx) }).
 * Actions rerun whenever a book figure on their slide is redrawn (deck.js purges figures away
 * from the current slide), so overlays and results survive navigation. */
(function () {
  'use strict';

  const actions = {};
  const clone = (x) => JSON.parse(JSON.stringify(x));

  class InputError extends Error {}

  function action(id, def) {
    actions[id] = def;
  }

  // ---------------------------------------------------------------- context given to actions

  function context(slide, id) {
    const resultEl = slide.querySelector('.result');
    return {
      slide,
      id,
      // A positive number from input `key`; throws InputError naming the field.
      num(key, label) {
        const el = slide.querySelector(`[data-key="${key}"]`);
        const r = window.T1Solve.parsePositive(el ? el.value : '');
        if (!r.ok) throw new InputError(`${label}: ${r.error}`);
        return r.value;
      },
      list(key, label) {
        const el = slide.querySelector(`[data-key="${key}"]`);
        const r = window.T1Solve.parseList(el ? el.value : '');
        if (!r.ok) throw new InputError(`${label}: ${r.error}`);
        return r.value;
      },
      say(html) {
        if (!resultEl) return;
        resultEl.classList.remove('error');
        resultEl.innerHTML = html;
      },
      clear() {
        if (resultEl) { resultEl.classList.remove('error'); resultEl.innerHTML = ''; }
        slide.querySelectorAll('.result-host').forEach((h) => {
          if (h._plot) window.Plotly.purge(h._plot);
          h._plot = null;
          h.replaceChildren();
        });
      },
      // Draws a computed figure, scaled to fit, in the slide's .result-host (or `host`).
      plot(fig, host) {
        const target = host || slide.querySelector('.result-host');
        return window.T1Deck.drawFigure(target, fig);
      },
      // The book figure on this slide, once deck.js has drawn it (null until then).
      bookPlot() {
        const host = slide.querySelector('.fig-host[data-fig]');
        return host && host.dataset.state === 'mounted' ? host._plot : null;
      },
      // Redraws the book figure on this slide exactly as the book publishes it.
      restoreBookFigure() {
        const host = slide.querySelector('.fig-host[data-fig]');
        if (host && host.dataset.state === 'mounted') {
          window.T1Deck.drawFigure(host, clone(window.T1Figures[host.dataset.fig]));
        }
      },
    };
  }

  function showError(slide, err) {
    const el = slide.querySelector('.result');
    const msg = err instanceof InputError ? err.message : `Could not compute this: ${err.message}`;
    if (!(err instanceof InputError)) console.error('[t1-exercise]', err);
    if (el) {
      el.classList.add('error');
      el.textContent = msg;
    }
  }

  function run(slide, id) {
    const def = actions[id];
    if (!def) { showError(slide, new Error(`no action "${id}"`)); return; }
    try {
      const out = def.run(context(slide, id));
      if (out && typeof out.catch === 'function') out.catch((err) => showError(slide, err));
    } catch (err) {
      showError(slide, err);
    }
  }

  function undo(slide, id) {
    const def = actions[id];
    if (def && def.undo) def.undo(context(slide, id));
    else context(slide, id).clear();
  }

  // ---------------------------------------------------------------- which actions are active

  function activeActions(slide) {
    const ids = [];
    if (slide.dataset.auto) ids.push(...slide.dataset.auto.split(/\s+/));
    slide.querySelectorAll('.fragment[data-action].visible').forEach((f) => ids.push(f.dataset.action));
    return ids;
  }

  function refresh(slide) {
    if (slide) activeActions(slide).forEach((id) => run(slide, id));
  }

  // ---------------------------------------------------------------- buttons and inputs

  function onRun(button) {
    const slide = button.closest('section');
    const id = button.dataset.run;
    if (button.dataset.preset) {
      const preset = JSON.parse(button.dataset.preset);
      Object.entries(preset).forEach(([key, value]) => {
        const el = slide.querySelector(`[data-key="${key}"]`);
        if (el) el.value = value;
      });
    }
    const frag = slide.querySelector(`.fragment[data-action="${id}"]`);
    if (frag && !frag.classList.contains('visible')) {
      // Show the step through Reveal so → / ← stay in sync; fragmentshown then runs it.
      window.Reveal.navigateFragment(Number(frag.dataset.fragmentIndex));
    } else {
      run(slide, id);
    }
  }

  function onReset(button) {
    const slide = button.closest('section');
    slide.querySelectorAll('input[data-key]').forEach((el) => { el.value = el.defaultValue; });
    const id = button.dataset.reset;
    if (activeActions(slide).includes(id)) run(slide, id);
  }

  function wire() {
    document.addEventListener('click', (e) => {
      const runBtn = e.target.closest('button[data-run]');
      const resetBtn = e.target.closest('button[data-reset]');
      if (runBtn) onRun(runBtn);
      else if (resetBtn) onReset(resetBtn);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || !e.target.matches('input[data-key]')) return;
      const btn = e.target.closest('section').querySelector('button[data-run]');
      if (btn) { e.preventDefault(); onRun(btn); }
    });
    // A book figure was (re)drawn: put this slide's overlays and results back on it.
    document.addEventListener('figuremounted', (e) => {
      const slide = e.target.closest('section');
      if (slide === window.Reveal.getCurrentSlide()) refresh(slide);
    });
    window.Reveal.on('fragmentshown', (e) => {
      (e.fragments || [e.fragment]).forEach((f) => {
        if (f.dataset.action) run(f.closest('section'), f.dataset.action);
      });
    });
    window.Reveal.on('fragmenthidden', (e) => {
      (e.fragments || [e.fragment]).forEach((f) => {
        if (f.dataset.action) undo(f.closest('section'), f.dataset.action);
      });
    });
    window.Reveal.on('slidechanged', (e) => refresh(e.currentSlide));
    window.Reveal.on('ready', (e) => refresh(e.currentSlide));
    if (window.Reveal.isReady()) refresh(window.Reveal.getCurrentSlide());
  }

  // ---------------------------------------------------------------- figure helpers

  // A layout in the style of a book figure: its template, fonts, axes and legend, at its size.
  // `overrides` are merged on top (one level deep for objects).
  function bookLayout(label, overrides = {}) {
    const base = clone(window.T1Figures[label].layout);
    delete base.sliders;
    delete base.updatemenus;
    for (const [k, v] of Object.entries(overrides)) {
      base[k] = v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object'
        ? Object.assign({}, base[k], v)
        : v;
    }
    return base;
  }

  // Axis titles as the book draws them: Times New Roman 22 annotations outside the plot area.
  function axisTitles(x, y, opts = {}) {
    const font = { family: 'Times New Roman', size: 22 };
    return [
      { font, showarrow: false, text: x, x: 0.5, xref: 'paper', y: opts.xy ?? -0.18, yref: 'paper' },
      { font, showarrow: false, text: y, textangle: -90, x: opts.yx ?? -0.15, xref: 'paper', y: 0.5, yref: 'paper' },
    ];
  }

  // The plotly default colours the book's figures use, in trace order.
  const COLORS = ['#636efa', '#EF553B', '#00cc96', '#ab63fa', '#FFA15A'];

  // Number formatting for result text.
  const fmt = (x, digits = 0) => Number(x).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

  // Runs `fn` once qmrust is ready; shows a loading line meanwhile, and a fallback if it can't load.
  function withQmRust(ctx, fn, fallbackHtml) {
    const resultEl = ctx.slide.querySelector('.result');
    let settled = false;
    setTimeout(() => {
      if (!settled && resultEl && !resultEl.textContent) resultEl.textContent = 'Starting the qmrust engine…';
    }, 150);
    return window.QmRust.ready().then(
      () => { settled = true; return fn(); },
      (err) => {
        settled = true;
        console.error('[t1-exercise] qmrust:', err);
        ctx.slide.querySelectorAll('.result-host').forEach((h) => {
          h.innerHTML = '<div class="fig-fallback">Live simulation unavailable in this browser.</div>';
        });
        if (resultEl) resultEl.innerHTML = fallbackHtml || '';
      },
    );
  }

  window.T1Exercise = { action, InputError, bookLayout, axisTitles, COLORS, fmt, withQmRust, clone };

  if (window.Reveal) wire();
})();
