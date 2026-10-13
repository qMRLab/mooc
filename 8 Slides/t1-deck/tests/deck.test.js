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
