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

// Trace and control counts of the figures as published by the book (checked 2026-10-19).
// Figure 3.6 (t2Plot7) has no published output, and there is no t2Plot6.
const PUBLISHED = {
  t2Plot1: { traces: 5, sliders: 0, menus: 1 },
  t2Plot2: { traces: 4, sliders: 0, menus: 1 },
  t2Plot3: { traces: 8, sliders: 0, menus: 1 },
  t2Plot4: { traces: 3, sliders: 1, menus: 0 },
  t2Plot5: { traces: 7, sliders: 0, menus: 2 },
  t2Plot8: { traces: 2, sliders: 0, menus: 0 },
};

function loadFigure(label) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(DECK, 'js', 'figures', `${label}.js`), 'utf8'), ctx);
  return ctx.window.T2Figures[label];
}

test('book links point at the chapter with the book’s numbering', () => {
  assert.deepEqual(deck.bookLink('t2plot2'), {
    href: 'https://qmrlab.org/mooc/t2-mapping#t2plot2',
    text: 'Figure 3.3 · Monoexponential T2 Mapping',
  });
  assert.deepEqual(deck.bookLink('top'), { href: 'https://qmrlab.org/mooc/t2-mapping', text: 'T2 Mapping' });
  assert.equal(deck.bookLink('t2multiexpo').text, 'Multiexponential T2 Mapping');
  assert.equal(deck.bookLink('t2plot5').text, 'Figure 3.7 · Multiexponential T2 Mapping');
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

test('each published figure is on exactly one slide and loaded', () => {
  assert.equal(new Set(figLabels).size, figLabels.length, 'a figure appears on two slides');
  assert.deepEqual([...figLabels].sort(), Object.keys(PUBLISHED).sort(), 'every published figure needs a slide');
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

test('the book embeds the deck on its own page, listed just below the T1 slides', () => {
  const book = path.resolve(DECK, '..', '..');
  const md = fs.readFileSync(path.join(book, '8 Slides', '3 - T2 Mapping.md'), 'utf8');
  assert.match(md, /<iframe class="reveal-frame" src="\/mooc\/slides\/t2\/index\.html"/);
  const yml = fs.readFileSync(path.join(book, 'myst.yml'), 'utf8');
  const toc = yml.split('\n').map((l) => l.trim());
  const at = toc.indexOf('- file: 8 Slides/2 - T1 Mapping Exercises.md');
  assert.ok(at >= 0, 'myst.yml does not list the T1 exercises page');
  assert.equal(toc[at + 1], '- file: 8 Slides/3 - T2 Mapping.md');
  assert.ok(toc.includes('- 8 Slides/t2-deck/**'), 'myst.yml must exclude the deck sources');
  const deploy = fs.readFileSync(path.join(book, '.github', 'workflows', 'deploy.yml'), 'utf8');
  assert.match(deploy, /_build\/html\/slides\/t2/, 'the deploy workflow must copy the deck to /slides/t2/');
});
