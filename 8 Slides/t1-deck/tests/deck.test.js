// Structural checks: book links, script tags and figures. Run with `npm test`.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DECK = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(DECK, 'index.html'), 'utf8');
const deck = require('../js/deck.js');

const all = (re) => [...html.matchAll(re)].map((m) => m[1]);
const bookLabels = all(/data-book="([^"]+)"/g);
const figLabels = all(/data-fig="([^"]+)"/g);
const scripts = all(/<script src="([^"]+)"/g);

// Trace and control counts of the figures as published by the book (checked 2026-10-13).
const PUBLISHED = {
  irPlot1: { traces: 3, sliders: 0, menus: 0 },
  irPlot2: { traces: 40, sliders: 1, menus: 0 },
  irPlot3: { traces: 213, sliders: 1, menus: 0 },
  irPlot4: { traces: 5, sliders: 0, menus: 1 },
  irPlot5: { traces: 164, sliders: 1, menus: 0 },
  vfaPlot1: { traces: 120, sliders: 1, menus: 0 },
  vfaPlot2: { traces: 30, sliders: 1, menus: 0 },
  vfaPlot3: { traces: 36, sliders: 1, menus: 0 },
  vfaPlot4: { traces: 4, sliders: 0, menus: 0 },
  vfaPlot5: { traces: 2, sliders: 0, menus: 0 },
  vfaPlot6: { traces: 4, sliders: 0, menus: 1 },
  mp2rageplot1: { traces: 1, sliders: 0, menus: 0 },
  mp2rageplot2: { traces: 4, sliders: 0, menus: 1 },
};

function loadFigure(label) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(DECK, 'js', 'figures', `${label}.js`), 'utf8'), ctx);
  return ctx.window.T1Figures[label];
}

test('book links point at the chapter with the book’s numbering', () => {
  assert.deepEqual(deck.bookLink('irplot1'), {
    href: 'https://qmrlab.org/mooc/t1-mapping#irplot1',
    text: 'Figure 2.2 · Inversion Recovery',
  });
  assert.deepEqual(deck.bookLink('top'), { href: 'https://qmrlab.org/mooc/t1-mapping', text: 'T1 Mapping' });
  assert.equal(deck.bookLink('irintroduction').text, 'Inversion Recovery');
  assert.throws(() => deck.bookLink('nope'), /Unknown book label/);
});

test('every slide has a known book anchor', () => {
  const sections = html.match(/<section\b/g).length;
  assert.equal(bookLabels.length, sections, 'each <section> needs data-book');
  for (const label of bookLabels) assert.ok(deck.LABELS[label], `no LABELS entry for "${label}"`);
});

test('every script tag points at a file', () => {
  for (const src of scripts) assert.ok(fs.existsSync(path.join(DECK, src)), `missing ${src}`);
});

test('each figure on a slide is loaded and used once', () => {
  assert.equal(new Set(figLabels).size, figLabels.length, 'a figure appears on two slides');
  for (const label of figLabels) {
    assert.ok(scripts.includes(`js/figures/${label}.js`), `no script tag for ${label}`);
  }
});

test('stored figures match what the book publishes', () => {
  for (const [label, want] of Object.entries(PUBLISHED)) {
    const fig = loadFigure(label);
    assert.ok(fig && Array.isArray(fig.data) && fig.layout, `${label} is not a Plotly figure`);
    assert.equal(fig.data.length, want.traces, `${label} traces`);
    assert.equal((fig.layout.sliders || []).length, want.sliders, `${label} sliders`);
    assert.equal((fig.layout.updatemenus || []).length, want.menus, `${label} menus`);
    assert.ok(fig.layout.width > 0 && fig.layout.height > 0, `${label} has no fixed size`);
  }
});

test('figures are scaled uniformly to fit the slide', () => {
  assert.equal(deck.fitScale(600, 350, 1200, 600), 600 / 350);
  assert.equal(deck.fitScale(600, 350, 900, 1000), 1.5);
});

test('figures stay mounted only near the current slide', () => {
  assert.ok(deck.shouldMount(5, 5) && deck.shouldMount(5, 4) && deck.shouldMount(5, 6));
  assert.ok(!deck.shouldMount(5, 7) && !deck.shouldMount(5, 3));
});

// ---------------------------------------------------------------- exercise pages

const EXERCISES = [1, 2, 3, 4, 6].map((n) => `exercise-${n}.html`);

function page(file) {
  const text = fs.readFileSync(path.join(DECK, file), 'utf8');
  const grab = (re) => [...text.matchAll(re)].map((m) => m[1]);
  return {
    text,
    sections: (text.match(/<section\b/g) || []).length,
    books: grab(/data-book="([^"]+)"/g),
    figs: grab(/data-fig="([^"]+)"/g),
    scripts: grab(/<script src="([^"]+)"/g),
    // Every action id the markup refers to, from fragments, auto-run slides and buttons.
    used: [
      ...grab(/data-action="([^"]+)"/g),
      ...grab(/data-auto="([^"]+)"/g).flatMap((s) => s.split(/\s+/)),
      ...grab(/data-run="([^"]+)"/g),
      ...grab(/data-reset="([^"]+)"/g),
    ],
  };
}

// The solutions have their own book page (below the T1 deck in the TOC): exercises.html links them, the T1 deck does not.
test('exercises.html links every exercise page; the T1 deck links none', () => {
  const hub = fs.readFileSync(path.join(DECK, 'exercises.html'), 'utf8');
  for (const file of EXERCISES) {
    assert.ok(hub.includes(`href="${file}"`), `exercises.html has no link to ${file}`);
    assert.ok(!html.includes(file), `index.html mentions ${file}`);
  }
  assert.ok(!html.includes('exercises.html'), 'index.html mentions exercises.html');
});

test('the book embeds exercises.html on its own page, listed just below the T1 deck', () => {
  const book = path.resolve(DECK, '..', '..');
  const md = fs.readFileSync(path.join(book, '8 Slides', '2 - T1 Mapping Exercises.md'), 'utf8');
  assert.match(md, /<iframe class="reveal-frame" src="\/mooc\/slides\/t1\/exercises\.html"/);
  const toc = fs.readFileSync(path.join(book, 'myst.yml'), 'utf8').split('\n').map((l) => l.trim());
  const at = toc.indexOf('- file: 8 Slides/2 - T1 Mapping.md');
  assert.ok(at >= 0, 'myst.yml does not list the T1 deck');
  assert.equal(toc[at + 1], '- file: 8 Slides/2 - T1 Mapping Exercises.md');
});

for (const file of EXERCISES) {
  test(`${file}: slides, scripts and actions are wired`, () => {
    const p = page(file);
    assert.equal(p.books.length, p.sections, 'each <section> needs data-book');
    for (const label of p.books) assert.ok(deck.LABELS[label], `no LABELS entry for "${label}"`);
    for (const src of p.scripts) assert.ok(fs.existsSync(path.join(DECK, src)), `missing ${src}`);
    for (const label of p.figs) assert.ok(p.scripts.includes(`js/figures/${label}.js`), `no script tag for ${label}`);

    const n = file.match(/\d/)[0];
    const order = ['js/deck.js', 'js/solve.js', 'js/exercise.js', `js/ex${n}.js`];
    const at = order.map((s) => p.scripts.indexOf(s));
    assert.ok(at.every((i) => i >= 0), `${file} must load ${order.join(', ')}`);
    assert.deepEqual([...at].sort((a, b) => a - b), at, `${file} loads ${order.join(', ')} out of order`);

    const registered = new Set([...fs.readFileSync(path.join(DECK, 'js', `ex${n}.js`), 'utf8').matchAll(/action\('([^']+)'/g)].map((m) => m[1]));
    for (const id of p.used) assert.ok(registered.has(id), `${file} uses action "${id}" but js/ex${n}.js does not register it`);

    if (p.scripts.includes('js/qmrust.js')) {
      const q = p.scripts.indexOf('js/qmrust.js');
      assert.ok(p.scripts.indexOf('vendor/qmrust/qmrust_wasm.js') < q && p.scripts.indexOf('vendor/qmrust/qmrust_wasm_b64.js') < q,
        'the qmrust engine files must load before js/qmrust.js');
    }
  });
}
