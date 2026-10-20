// Headless walk-through of every slide of the T2 deck and the exercise pages, offline, at two viewport sizes.
// Exercise slides are stepped through every fragment, so every step of every action executes.
// Usage: npm run smoke   (screenshots are written to tests/screenshots/)
'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const DECK = path.resolve(__dirname, '..');
const SHOTS = path.join(__dirname, 'screenshots');
const SIZES = [[1280, 720], [1920, 1080]];
const EXERCISES = [1, 2, 3, 4].map((n) => `exercise-${n}.html`);
// The central page that links the exercise decks (not linked from the T2 deck).
const HUB = 'exercises.html';

async function openDeck(browser, file, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => errors.push(`failed to load ${r.url()}`));
  await page.route(/^https?:\/\//, (route) => {
    errors.push(`network request: ${route.request().url()}`);
    return route.abort();
  });
  await page.goto('file://' + path.join(DECK, file));
  await page.waitForFunction(() => window.T2Deck && window.T2Deck.ready, null, { timeout: 20000 });
  return { page, errors };
}

async function checkSlides(page, label, { stepFragments = false } = {}) {
  const problems = [];
  const total = await page.evaluate(() => Reveal.getTotalSlides());
  for (let i = 0; i < total; i++) {
    await page.evaluate((n) => Reveal.slide(n), i);
    // Let the slide transition finish, so screenshots show the settled slide.
    await page.waitForTimeout(1000);
    if (stepFragments) {
      // Show every step on the slide (each may redraw a figure), then let the drawing finish.
      while (await page.evaluate(() => Reveal.availableFragments().next)) {
        await page.evaluate(() => Reveal.nextFragment());
        await page.waitForTimeout(250);
      }
      await page.waitForTimeout(400);
    }
    const r = await page.evaluate(() => {
      const s = Reveal.getCurrentSlide();
      const box = (el) => el.getBoundingClientRect();
      const sb = box(s);
      // Anything drawn below the slide's bottom edge (or past its right edge) overflows.
      let overflow = 0;
      s.querySelectorAll('h1,h2,h3,p,li,img,.eq,.card,.fig-frame,table,.btn-row,.answer').forEach((el) => {
        const b = box(el);
        // On an exercise slide, the text column must not spill into the figure beside it.
        const col = el.closest('.ex-text');
        const right = col ? box(col).right : sb.right;
        overflow = Math.max(overflow, b.bottom - sb.bottom, b.right - right);
      });
      // Text must stay clear of the book link in the bottom-left corner.
      const link = s.querySelector(':scope > a.book-link');
      let overLink = 0;
      if (link) {
        const lb = box(link);
        s.querySelectorAll('p,li,.eq,.card,.answer,table').forEach((el) => {
          const b = box(el);
          if (b.left < lb.right && b.right > lb.left) overLink = Math.max(overLink, b.bottom - lb.top);
        });
      }
      return {
        title: ((s.querySelector('h1,h2') || {}).textContent || '(untitled)').trim(),
        link: !!link,
        figs: [...s.querySelectorAll('.fig-host')].map((h) => ({
          name: h.dataset.fig,
          state: h.dataset.state || 'none',
          // Drawn means a real plot that fills a sensible part of the slide, not just an empty SVG.
          drawn: !!h.querySelector('.main-svg') && (h.querySelector('.fig-frame') || { offsetHeight: 0 }).offsetHeight > 300,
        })),
        overflow: Math.round(overflow),
        overLink: Math.round(overLink),
        errors: [...s.querySelectorAll('.result.error')].map((e) => e.textContent),
        // Equations wider than the slide, or than their column on an exercise slide (they would spill into
        // the figure). KaTeX's box keeps its width while its content overflows, so measure the rendered pieces.
        wideMath: [...s.querySelectorAll('.katex-display')].filter((d) => {
          const right = Math.max(...[...d.querySelectorAll('.katex-html .base')].map((e) => e.getBoundingClientRect().right));
          const col = d.closest('.ex-text');
          return d.offsetParent && right > (col ? col.getBoundingClientRect().right + 2 : sb.right - 20);
        }).length,
        // Computed figures: every result area must hold a drawn plot once its steps have run.
        results: [...s.querySelectorAll('.result-host')].map((h) => !!h.querySelector('.main-svg') && h.querySelector('.fig-frame').offsetHeight > 300),
        // Subscripts and superscripts must render as such (reveal's reset flattens them).
        flatScripts: [...s.querySelectorAll('sub, sup')].filter((e) => {
          const va = getComputedStyle(e).verticalAlign;
          return va !== (e.tagName === 'SUB' ? 'sub' : 'super');
        }).length,
      };
    });
    const tag = `${label} slide ${i + 1} "${r.title}"`;
    if (!r.link) problems.push(`${tag}: no book link`);
    for (const f of r.figs) if (f.state !== 'mounted' || !f.drawn) problems.push(`${tag}: figure ${f.name} is ${f.state}`);
    if (r.overflow > 2) problems.push(`${tag}: content overflows the slide (or its column) by ${r.overflow}px`);
    if (r.overLink > 2) problems.push(`${tag}: content runs into the book link by ${r.overLink}px`);
    if (r.flatScripts) problems.push(`${tag}: ${r.flatScripts} sub/superscripts render as plain text`);
    if (r.wideMath) problems.push(`${tag}: ${r.wideMath} equation(s) wider than the slide or their column`);
    for (const e of r.errors) problems.push(`${tag}: shows an error: ${e}`);
    if (r.results.some((ok) => !ok)) problems.push(`${tag}: a computed figure was not drawn`);
    await page.screenshot({ path: path.join(SHOTS, `${label}-${String(i + 1).padStart(2, '0')}.png`) });
  }
  return problems;
}

// Holding an arrow key: figures must mount and purge cleanly.
async function checkRapidNavigation(page, label) {
  const total = await page.evaluate(() => Reveal.getTotalSlides());
  await page.evaluate(async (n) => {
    for (let round = 0; round < 2; round++) {
      for (let i = 0; i < n; i++) { Reveal.slide(i); await new Promise((r) => setTimeout(r, 5)); }
      for (let i = n - 1; i >= 0; i--) { Reveal.slide(i); await new Promise((r) => setTimeout(r, 5)); }
    }
  }, total);
  await page.waitForTimeout(600);
  const mounted = await page.evaluate(() => document.querySelectorAll('.fig-host[data-state="mounted"]').length);
  return mounted <= 3 ? [] : [`${label}: ${mounted} figures mounted after rapid navigation (expected at most 3)`];
}

const goToFigure = async (page, fig) => {
  const idx = await page.evaluate((f) => Reveal.getSlides().findIndex((s) => s.querySelector(`[data-fig="${f}"]`)), fig);
  await page.evaluate((n) => Reveal.slide(n), idx);
  await page.waitForTimeout(600);
};
const visibleTraces = (page) => page.evaluate(() => {
  const gd = Reveal.getCurrentSlide().querySelector('.js-plotly-plot');
  return gd.data.map((t, i) => (t.visible === false ? null : i)).filter((i) => i !== null).join();
});

// The book's sliders and buttons must still respond when the figure is scaled inside the slide.
async function checkControls(page, label) {
  const problems = [];
  // Figure 3.5: a click on the slider rail changes the MW/IEW mix, so the multi-exponential curve changes.
  await goToFigure(page, 't2Plot4');
  const curve = () => page.evaluate(() => {
    const gd = Reveal.getCurrentSlide().querySelector('.js-plotly-plot');
    return JSON.stringify(gd.data[2].y.slice(0, 20));
  });
  const before = await curve();
  const rail = page.locator('section.present .slider-rail-rect').first();
  const b = await rail.boundingBox();
  await page.mouse.click(b.x + b.width * 0.8, b.y + b.height / 2);
  await page.waitForTimeout(500);
  if ((await curve()) === before) problems.push(`${label}: clicking the Figure 3.5 slider did not change the curve`);

  // Figure 3.3: choosing T2* in the menu hides the T2 curves.
  await goToFigure(page, 't2Plot2');
  const shown = await visibleTraces(page);
  await page.locator('section.present .updatemenu-header-group').first().click();
  await page.waitForTimeout(300);
  await page.locator('section.present .updatemenu-dropdown-button').filter({ hasText: /^T2\*$/ }).first().click();
  await page.waitForTimeout(500);
  if ((await visibleTraces(page)) === shown) problems.push(`${label}: choosing T2* in the Figure 3.3 menu did not change the curves`);
  return problems;
}

const slideWith = (page, selector) =>
  page.evaluate((sel) => Reveal.getSlides().findIndex((s) => s.querySelector(sel) || s.matches(sel)), selector);
const resultText = (page) => page.evaluate(() => Reveal.getCurrentSlide().querySelector('.result').textContent);
const plotTraces = (page, sel) => page.evaluate((q) => Reveal.getCurrentSlide().querySelector(q).data.length, sel);

// A reading typed on part a fills the later slides' copies (inputs and answer text); clearing it restores
// their defaults. `key` is the data-share name, `fallback` the default the later copies hold.
async function checkShared(page, key, typed, fallback) {
  const problems = [];
  const values = () => page.evaluate((k) => [...document.querySelectorAll(`[data-share="${k}"]`)].map((el) => el.value ?? el.textContent), key);
  await page.evaluate((n) => Reveal.slide(n), await slideWith(page, `input[data-share="${key}"]`));
  await page.locator(`section.present input[data-share="${key}"]`).fill(typed);
  if ((await values()).join() !== [typed, typed, typed].join()) problems.push(`${key} shared readings: ${(await values()).join()}`);
  await page.locator(`section.present input[data-share="${key}"]`).fill('');
  if ((await values()).join() !== ['', fallback, fallback].join()) problems.push(`${key} cleared readings: ${(await values()).join()}`);
  return problems;
}

// Steps on a book figure (Exercise 1a), shared readings (Exercise 2), and typing values, Enter, an invalid
// value, Reset and ← undoing a step on a computed figure (Exercise 3).
async function checkInputs(browser) {
  const problems = [];
  const ex1 = await openDeck(browser, 'exercise-1.html', 1280, 720);
  await ex1.page.evaluate((n) => Reveal.slide(n), await slideWith(ex1.page, '[data-auto="ex1-t2"]'));
  await ex1.page.waitForTimeout(600);
  const book = 'section.present .fig-host .js-plotly-plot';
  if ((await plotTraces(ex1.page, book)) !== 4) problems.push('ex1a: the slide does not open on the book figure alone');
  await ex1.page.locator('section.present button[data-run="ex1-t2"][data-step="2"]').click();
  await ex1.page.waitForTimeout(500);
  if ((await plotTraces(ex1.page, book)) !== 6 || !/103 ms/.test(await resultText(ex1.page))) problems.push(`ex1a step 2: "${await resultText(ex1.page)}"`);
  await ex1.page.evaluate(() => Reveal.prevFragment());
  await ex1.page.waitForTimeout(400);
  if ((await plotTraces(ex1.page, book)) !== 5) problems.push('ex1a: going back a step did not remove the maximum');
  problems.push(...ex1.errors.map((e) => `ex1 inputs: ${e}`));
  await ex1.page.close();

  const ex2 = await openDeck(browser, 'exercise-2.html', 1280, 720);
  problems.push(...(await checkShared(ex2.page, 'ex2-mw63', '20', '19')));
  problems.push(...(await checkShared(ex2.page, 'ex2-iew90', '275', '280')));
  problems.push(...ex2.errors.map((e) => `ex2 inputs: ${e}`));
  await ex2.page.close();

  const { page, errors } = await openDeck(browser, 'exercise-3.html', 1280, 720);
  const computed = 'section.present .result-host .js-plotly-plot';
  await page.evaluate((n) => Reveal.slide(n), await slideWith(page, '[data-action="ex3-mwf"]'));
  await page.waitForTimeout(400);
  await page.locator('section.present button[data-run="ex3-mwf"][data-step="1"]').click();
  await page.waitForTimeout(300);
  if ((await plotTraces(page, computed)) !== 1 || !/25%/.test(await resultText(page))) problems.push(`ex3 step 1: "${await resultText(page)}"`);
  await page.locator('section.present button[data-run="ex3-mwf"][data-step="2"]').click();
  await page.waitForTimeout(300);
  if ((await plotTraces(page, computed)) !== 3) problems.push('ex3 step 2: the curve was not added');
  await page.evaluate(() => Reveal.prevFragment());
  await page.waitForTimeout(300);
  if ((await plotTraces(page, computed)) !== 1) problems.push('ex3: going back a step did not remove the curve');
  // Arrow keys typed into an input must not change slide; Enter redraws with the edited value.
  const before = await page.evaluate(() => Reveal.getIndices().h);
  await page.locator('section.present input[data-key="t2mw"]').fill('20');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  if ((await page.evaluate(() => Reveal.getIndices().h)) !== before) problems.push('ex3: an arrow key typed in an input changed the slide');
  if (!/26%/.test(await resultText(page))) problems.push(`ex3: Enter did not redraw with T2,MW = 20 ms ("${await resultText(page)}")`);
  await page.locator('section.present input[data-key="tes"]').fill('25, abc');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  if (!(await page.evaluate(() => Reveal.getCurrentSlide().querySelector('.result.error')))) problems.push('ex3: invalid input did not show an error');
  await page.locator('section.present button[data-reset="ex3-mwf"]').click();
  await page.waitForTimeout(300);
  const t2mw = await page.locator('section.present input[data-key="t2mw"]').inputValue();
  if (t2mw !== '19' || !/25%/.test(await resultText(page))) problems.push(`ex3 Reset: value ${t2mw}, result "${await resultText(page)}"`);
  problems.push(...errors.map((e) => `ex3 inputs: ${e}`));
  await page.close();
  return problems;
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const problems = [];
  try {
    for (const [w, h] of SIZES) {
      const label = `${w}x${h}`;
      const { page, errors } = await openDeck(browser, 'index.html', w, h);
      problems.push(...(await checkSlides(page, label)));
      problems.push(...(await checkControls(page, label)));
      problems.push(...(await checkRapidNavigation(page, label)));
      problems.push(...errors.map((e) => `${label}: ${e}`));
      // The solutions have their own book page: the T2 deck itself must not link to them.
      const leaks = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => /exercise/.test(h) && !/qmrlab\.org/.test(h)));
      if (leaks.length) problems.push(`${label}: the T2 deck links to the solutions: ${leaks.join(', ')}`);
      await page.close();
      const hub = await openDeck(browser, HUB, w, h);
      problems.push(...(await checkSlides(hub.page, `exercises-${label}`)));
      const listed = await hub.page.evaluate(() => [...document.querySelectorAll('.exercise-list a')].map((a) => a.getAttribute('href')));
      if (listed.join() !== EXERCISES.join()) problems.push(`${label}: exercises.html lists ${listed.join(', ')}`);
      problems.push(...hub.errors.map((e) => `exercises-${label}: ${e}`));
      await hub.page.close();
      for (const file of EXERCISES) {
        const tag = `${file.replace('.html', '')}-${label}`;
        const ex = await openDeck(browser, file, w, h);
        problems.push(...(await checkSlides(ex.page, tag, { stepFragments: true })));
        problems.push(...ex.errors.map((e) => `${tag}: ${e}`));
        await ex.page.close();
      }
    }
    problems.push(...(await checkInputs(browser)));
  } finally {
    await browser.close();
  }
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log(`smoke: OK at ${SIZES.map((s) => s.join('x')).join(' and ')}`);
})();
