/* Exercise slides: step-by-step answers, editable "measured" values, Solve/Reset buttons.
 *
 * An action draws a slide's answer up to a *step*. Each click (→, a clicker, or a step button) shows
 * one more fragment of that action, and the action redraws itself at the new step, so an answer
 * builds up as data → result → explanation. Going back (←) redraws at the lower step.
 *
 * Markup (see exercise-*.html):
 *   <div class="fragment" data-action="id">  one step of action `id`; the n-th visible one is step n.
 *                                           It may hold content (e.g. an answer box) or be an empty .step.
 *   <section data-auto="id">                 also draws action `id` at step 0 whenever the slide is shown.
 *   <button data-run="id" data-step="2">     goes to step 2 (showing steps 1–2), or redraws if already there.
 *   <button data-reset="id">                 restores the slide's inputs to their defaults and redraws.
 *   <button data-preset='{"key": "value"}' data-run="id">  fills inputs, then runs.
 *   <input data-key="wm" value="624">        an editable value; Enter redraws (or takes the first step).
 *   <input data-share="k">                   a value that also fills every other [data-share="k"] (later slides, answers).
 *   .result / .result-host                   where actions write their text / draw their figure.
 *
 * Exercise files register actions with T2Exercise.action(id, { run(ctx), undo(ctx) }); ctx.step is the
 * current step. Actions also redraw whenever a book figure on their slide is redrawn (deck.js purges
 * figures away from the current slide), so overlays and results survive navigation. */
(function () {
  'use strict';

  const actions = {};
  const clone = (x) => JSON.parse(JSON.stringify(x));

  class InputError extends Error {}

  function action(id, def) {
    actions[id] = def;
  }

  // ---------------------------------------------------------------- context given to actions

  function context(slide, id, step = 0) {
    const resultEl = slide.querySelector('.result');
    return {
      slide,
      id,
      step,
      // A positive number from input `key`; throws InputError naming the field.
      num(key, label) {
        const el = slide.querySelector(`[data-key="${key}"]`);
        const r = window.T2Solve.parsePositive(el ? el.value : '');
        if (!r.ok) throw new InputError(`${label}: ${r.error}`);
        return r.value;
      },
      list(key, label) {
        const el = slide.querySelector(`[data-key="${key}"]`);
        const r = window.T2Solve.parseList(el ? el.value : '');
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
          h._plotSize = null;
          h.replaceChildren();
        });
      },
      // Draws a computed figure, scaled to fit, in the slide's .result-host (or `host`).
      plot(fig, host) {
        const target = host || slide.querySelector('.result-host');
        return window.T2Deck.drawFigure(target, fig);
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
          window.T2Deck.drawFigure(host, clone(window.T2Figures[host.dataset.fig]));
        }
      },
    };
  }

  function showError(slide, err) {
    const el = slide.querySelector('.result');
    const msg = err instanceof InputError ? err.message : `Could not compute this: ${err.message}`;
    if (!(err instanceof InputError)) console.error('[t2-exercise]', err);
    if (el) {
      el.classList.add('error');
      el.textContent = msg;
    }
  }

  function run(slide, id, step) {
    const def = actions[id];
    if (!def) { showError(slide, new Error(`no action "${id}"`)); return; }
    try {
      const out = def.run(context(slide, id, step));
      if (out && typeof out.catch === 'function') out.catch((err) => showError(slide, err));
    } catch (err) {
      showError(slide, err);
    }
  }

  function undo(slide, id) {
    const def = actions[id];
    if (def && def.undo) def.undo(context(slide, id, 0));
    else context(slide, id, 0).clear();
  }

  // ---------------------------------------------------------------- steps

  const stepsOf = (slide, id) => [...slide.querySelectorAll(`.fragment[data-action="${id}"]`)];
  const isAuto = (slide, id) => (slide.dataset.auto || '').split(/\s+/).includes(id);

  // How far action `id` has got on this slide: the number of its fragments now showing.
  function stepOf(slide, id) {
    return stepsOf(slide, id).filter((f) => f.classList.contains('visible')).length;
  }

  // Draws action `id` at its current step, or undoes it if it has no step showing and isn't automatic.
  function render(slide, id) {
    const step = stepOf(slide, id);
    if (step === 0 && !isAuto(slide, id)) undo(slide, id);
    else run(slide, id, step);
  }

  function activeActions(slide) {
    const ids = (slide.dataset.auto || '').split(/\s+/).filter(Boolean);
    slide.querySelectorAll('.fragment[data-action].visible').forEach((f) => ids.push(f.dataset.action));
    return [...new Set(ids)];
  }

  function refresh(slide) {
    if (slide) activeActions(slide).forEach((id) => render(slide, id));
  }

  // Shows action `id` up to `step` through Reveal, so → / ← stay in sync (fragment events then redraw).
  function goToStep(slide, id, step) {
    const target = stepsOf(slide, id)[step - 1];
    if (target && !target.classList.contains('visible')) {
      window.Reveal.navigateFragment(Number(target.dataset.fragmentIndex));
    } else {
      render(slide, id);
    }
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
    // A step button goes to its step. A plain button (Run, a preset) redraws the current step, or takes
    // the first step when nothing is showing yet and the action isn't drawn automatically.
    const step = button.dataset.step ? Number(button.dataset.step) : stepOf(slide, id);
    if (step > 0) goToStep(slide, id, step);
    else if (isAuto(slide, id) || !stepsOf(slide, id).length) render(slide, id);
    else goToStep(slide, id, 1);
  }

  function onReset(button) {
    const slide = button.closest('section');
    slide.querySelectorAll('input[data-key]').forEach((el) => { el.value = el.defaultValue; });
    const id = button.dataset.reset;
    if (activeActions(slide).includes(id)) render(slide, id);
  }

  // A value typed in an input[data-share="k"] fills every other [data-share="k"] in the page: inputs on
  // later slides, and spans in answer text. Clearing the box puts each copy back to its own default.
  function onShare(src) {
    const value = src.value.trim();
    document.querySelectorAll(`[data-share="${src.dataset.share}"]`).forEach((el) => {
      if (el === src) return;
      if (el.matches('input')) el.value = value || el.defaultValue;
      else {
        if (!('default' in el.dataset)) el.dataset.default = el.textContent;
        el.textContent = value || el.dataset.default;
      }
    });
  }

  function onFragments(e) {
    const touched = new Map();
    (e.fragments || [e.fragment]).forEach((f) => {
      if (f.dataset.action) touched.set(`${f.dataset.action}`, f.closest('section'));
    });
    touched.forEach((slide, id) => render(slide, id));
  }

  function wire() {
    document.addEventListener('click', (e) => {
      const runBtn = e.target.closest('button[data-run]');
      const resetBtn = e.target.closest('button[data-reset]');
      if (runBtn) onRun(runBtn);
      else if (resetBtn) onReset(resetBtn);
    });
    document.addEventListener('input', (e) => {
      if (e.target.matches('input[data-share]')) onShare(e.target);
    });
    document.addEventListener('keydown', (e) => {
      // Enter in a value box redraws the slide (or takes the first step).
      if (e.key !== 'Enter' || !e.target.matches('input[data-key]')) return;
      const btn = e.target.closest('section').querySelector('button[data-run]');
      if (!btn) return;
      e.preventDefault();
      const slide = btn.closest('section');
      const id = btn.dataset.run;
      if (stepOf(slide, id) || isAuto(slide, id)) render(slide, id);
      else onRun(btn);
    });
    // A book figure was (re)drawn: put this slide's overlays and results back on it.
    document.addEventListener('figuremounted', (e) => {
      const slide = e.target.closest('section');
      if (slide === window.Reveal.getCurrentSlide()) refresh(slide);
    });
    window.Reveal.on('fragmentshown', onFragments);
    window.Reveal.on('fragmenthidden', onFragments);
    window.Reveal.on('slidechanged', (e) => refresh(e.currentSlide));
    // The exercise's own script (js/exN.js) loads after this one: refresh only once every script has run.
    const start = () => {
      window.Reveal.on('ready', (e) => refresh(e.currentSlide));
      if (window.Reveal.isReady()) refresh(window.Reveal.getCurrentSlide());
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  }

  // ---------------------------------------------------------------- figure helpers

  // A layout in the style of a book figure: its template, fonts, axes and legend, at its size.
  // `overrides` are merged on top (one level deep for objects).
  function bookLayout(label, overrides = {}) {
    const base = clone(window.T2Figures[label].layout);
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

  // The colours the T2 chapter's figures use (matplotlib's default cycle), in trace order.
  const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];

  // Number formatting for result text.
  const fmt = (x, digits = 0) => Number(x).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

  window.T2Exercise = { action, InputError, bookLayout, axisTitles, COLORS, fmt, clone };

  if (window.Reveal) wire();
})();
