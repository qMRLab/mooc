// Structural checks of the MT deck and its exercises: book links, scripts, widgets, the book's pages and deployment.
// Run with `npm test`.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DECK = path.resolve(__dirname, '..');
const BOOK = path.resolve(DECK, '..', '..');
const deck = require('../js/deck.js');
const read = (f) => fs.readFileSync(path.join(DECK, f), 'utf8');
const html = read('index.html');
const all = (text, re) => [...text.matchAll(re)].map((m) => m[1]);
const EXERCISES = [1, 2, 3].map((n) => `exercise-6-${n}.html`);

test('book links point at the chapter with the book’s numbering', () => {
  assert.deepEqual(deck.bookLink('qmtfig3'), {
    href: 'https://qmrlab.org/mooc/magnetization-transfer-imaging#qmtfig3',
    text: 'Figure 6.3 · Quantitative MT',
  });
  assert.deepEqual(deck.bookLink('top'), { href: 'https://qmrlab.org/mooc/magnetization-transfer-imaging', text: 'Magnetization Transfer' });
  assert.throws(() => deck.bookLink('nope'), /Unknown book label/);
});

// 20 to 25 is the target; 26 while the two-tanks and myelin slides (5, 6) are drafts.
test('the lecture has 20 to 26 slides, each with a known book anchor (but the title)', () => {
  const sections = (html.match(/<section\b/g) || []).length;
  assert.ok(sections >= 20 && sections <= 26, `${sections} slides`);
  const books = all(html, /data-book="([^"]+)"/g);
  assert.equal(books.length, sections - 1, 'each <section> but the title slide needs data-book');
  for (const label of books) assert.ok(deck.LABELS[label], `no LABELS entry for "${label}"`);
});

test('every script and stylesheet exists, on every page', () => {
  for (const f of ['index.html', 'exercises.html', ...EXERCISES]) {
    const t = read(f);
    for (const src of [...all(t, /<script src="([^"?]+)/g), ...all(t, /<link rel="stylesheet" href="([^"]+)"/g)]) {
      assert.ok(fs.existsSync(path.join(DECK, src)), `${f}: missing ${src}`);
    }
  }
});

test('every widget registered in a script has its slide, and every slide id is unique', () => {
  const pages = { 'index.html': ['js/mt-widgets.js', 'js/mt-tanks.js', 'js/mt-myelin.js'], 'exercise-6-1.html': ['js/ex61.js'], 'exercise-6-2.html': ['js/ex62.js'], 'exercise-6-3.html': ['js/ex63.js'] };
  for (const [page, scripts] of Object.entries(pages)) for (const script of scripts) {
    const ids = all(read(page), /<section id="([^"]+)"/g);
    assert.equal(new Set(ids).size, ids.length, `${page}: duplicate slide ids`);
    for (const id of all(read(script), /(?:W|widget)\('([^']+)'/g)) assert.ok(ids.includes(id), `${script} registers ${id}, which ${page} does not have`);
    // every element a script looks up by id exists on its page
    for (const id of all(read(script), /(?:\$|getElementById)\('([a-z0-9-]+)'\)/g)) assert.ok(read(page).includes(`id="${id}"`), `${script}: no #${id} in ${page}`);
  }
});

test('exercises: the hub links the three decks; the decks carry noindex and the home link; the lecture badges link them', () => {
  const hub = read('exercises.html');
  for (const f of EXERCISES) {
    assert.ok(hub.includes(`href="${f}"`), `exercises.html has no link to ${f}`);
    const t = read(f);
    assert.match(t, /name="robots" content="noindex"/, `${f} must carry noindex`);
    assert.match(t, /data-home="exercises\.html"/, `${f} needs data-home`);
    assert.match(html, new RegExp(`class="pause-badge" href="${f.replace('.', '\\.')}" target="_blank"`), `index.html has no badge for ${f}`);
  }
  assert.match(hub, /name="robots" content="noindex"/);
});

test('the book embeds the deck and its exercises, lists them under Slides, excludes the sources and deploys the deck', () => {
  const md = fs.readFileSync(path.join(BOOK, '8 Slides', '6 - Magnetization Transfer Imaging.md'), 'utf8');
  assert.match(md, /<iframe class="reveal-frame" src="\/mooc\/slides\/mt\/index\.html"/);
  const ex = fs.readFileSync(path.join(BOOK, '8 Slides', '6 - Magnetization Transfer Exercises.md'), 'utf8');
  assert.match(ex, /<iframe class="reveal-frame" src="\/mooc\/slides\/mt\/exercises\.html"/);
  const toc = fs.readFileSync(path.join(BOOK, 'myst.yml'), 'utf8').split('\n').map((l) => l.trim());
  const at = toc.indexOf('- file: 8 Slides/6 - Magnetization Transfer Imaging.md');
  assert.ok(at > 0, 'myst.yml does not list the MT slides');
  assert.equal(toc[at + 1], '- file: 8 Slides/6 - Magnetization Transfer Exercises.md');
  assert.ok(toc.includes('- 8 Slides/mt-deck/**'), 'myst.yml must exclude the deck sources');
  const deploy = fs.readFileSync(path.join(BOOK, '.github', 'workflows', 'deploy.yml'), 'utf8');
  const copy = deploy.split('\n').find((l) => /slides\/mt\/$/.test(l.trim()) && /cp -R/.test(l));
  assert.ok(copy, 'the deploy workflow must copy the deck to /slides/mt/');
  for (const f of ['index.html', 'exercises.html', 'exercise-\\*.html', 'mt.css', 'exercise.css', 'js', 'img', 'vendor']) assert.match(copy, new RegExp(`(^| )${f}( |$)`), `deploy copy misses ${f}`);
});

test('the data files are current: brain.js has the slice, fit-errors.js the three cases', () => {
  const ctx = {};
  global.window = ctx;
  require(path.join(DECK, 'js', 'data', 'brain.js'));
  require(path.join(DECK, 'js', 'data', 'fit-errors.js'));
  const B = ctx.MTBrain;
  assert.equal(B.mt.length, 10);
  for (const k of ['F', 'kf', 'T2f', 'T2r', 'R1', 'B0', 'B1', 'S0']) assert.equal(B[k].length, B.h, `${k} rows`);
  assert.deepEqual(Object.keys(ctx.MTFitErrors.cases).sort(), ['B0', 'B1', 'T1']);
});
