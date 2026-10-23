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

// ---------------------------------------------------------------- exercise pages

const EXERCISES = [1, 2, 3, 4].map((n) => `exercise-${n}.html`);

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

// The solutions have their own book page (below the T2 deck in the TOC): exercises.html links them, the T2 deck does not.
test('exercises.html links every exercise page; the T2 deck links none', () => {
  const hub = fs.readFileSync(path.join(DECK, 'exercises.html'), 'utf8');
  for (const file of EXERCISES) {
    assert.ok(hub.includes(`href="${file}"`), `exercises.html has no link to ${file}`);
    assert.ok(!html.includes(file), `index.html mentions ${file}`);
  }
  assert.ok(!html.includes('exercises.html'), 'index.html mentions exercises.html');
});

// The worked solutions to Exercises 1–4 keep their book page (out of the TOC) and their deployment.
test('the book keeps the page for exercises.html, and deploys it', () => {
  const book = path.resolve(DECK, '..', '..');
  const md = fs.readFileSync(path.join(book, '8 Slides', '3 - T2 Mapping Exercises.md'), 'utf8');
  assert.match(md, /<iframe class="reveal-frame" src="\/mooc\/slides\/t2\/exercises\.html"/);
  const deploy = fs.readFileSync(path.join(book, '.github', 'workflows', 'deploy.yml'), 'utf8');
  const copy = deploy.split('\n').find((l) => /slides\/t2\/$/.test(l.trim()) && /cp -R/.test(l));
  assert.ok(copy && /exercises\.html/.test(copy) && /exercise-\*\.html/.test(copy), 'the deploy workflow must copy the exercise pages to /slides/t2/');
});

// ---------------------------------------------------------------- Exercises 2-1 and 2-2 (interactive)

const EX2 = ['exercises-2.html', 'exercise-2-1.html', 'exercise-2-2.html'];

test('the book embeds exercises-2.html on its own page, listed just below the T2 deck, and deploys it', () => {
  const book = path.resolve(DECK, '..', '..');
  const md = fs.readFileSync(path.join(book, '8 Slides', '3 - T2 Mapping Exercises 2.md'), 'utf8');
  assert.match(md, /<iframe class="reveal-frame" src="\/mooc\/slides\/t2\/exercises-2\.html"/);
  const toc = fs.readFileSync(path.join(book, 'myst.yml'), 'utf8').split('\n').map((l) => l.trim());
  const at = toc.indexOf('- file: 8 Slides/3 - T2 Mapping.md');
  assert.equal(toc[at + 1], '- file: 8 Slides/3 - T2 Mapping Exercises 2.md');
  assert.ok(!toc.includes('- file: 8 Slides/3 - T2 Mapping Exercises.md'), 'the Exercises 1–4 page is out of the TOC');
  const deploy = fs.readFileSync(path.join(book, '.github', 'workflows', 'deploy.yml'), 'utf8');
  const copy = deploy.split('\n').find((l) => /slides\/t2\/$/.test(l.trim()) && /cp -R/.test(l));
  assert.ok(copy && /exercises-2\.html/.test(copy) && /exercise-\*\.html/.test(copy), 'the deploy workflow must copy exercises-2.html and the exercise pages');
});

test('Exercises 2-1 and 2-2: pages link each other, load their scripts, and label every slide', () => {
  const hub = fs.readFileSync(path.join(DECK, 'exercises-2.html'), 'utf8');
  for (const f of ['exercise-2-1.html', 'exercise-2-2.html']) assert.ok(hub.includes(`href="${f}"`), `exercises-2.html has no link to ${f}`);
  for (const f of EX2) {
    const p = page(f);
    assert.ok(p.sections > 0, `${f} has no slides`);
    assert.equal(p.books.length, p.sections, `${f}: each <section> needs data-book`);
    for (const label of p.books) assert.ok(deck.LABELS[label], `${f}: no LABELS entry for "${label}"`);
    for (const src of p.scripts) assert.ok(fs.existsSync(path.join(DECK, src)), `${f}: missing ${src}`);
    assert.ok(p.scripts.includes('js/exn.js'), `${f} must load js/exn.js`);
    assert.ok(/name="robots" content="noindex"/.test(p.text), `${f} must carry noindex`);
  }
  for (const f of EX2) assert.ok(!html.includes(f), `index.html mentions ${f}`);
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

    const source = fs.readFileSync(path.join(DECK, 'js', `ex${n}.js`), 'utf8');
    const registered = new Set([...source.matchAll(/action\('([^']+)'/g), ...source.matchAll(/Action\('([^']+)'/g)].map((m) => m[1]));
    for (const id of p.used) assert.ok(registered.has(id), `${file} uses action "${id}" but js/ex${n}.js does not register it`);
    // Figures used only for their style (bookLayout) must be loaded too.
    for (const [, label] of source.matchAll(/bookLayout\('([^']+)'/g)) {
      assert.ok(p.scripts.includes(`js/figures/${label}.js`), `${file} styles a plot after ${label} but does not load it`);
    }
  });
}
