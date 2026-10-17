// Headless walk-through of every slide of the T1 deck and the exercise pages, offline, at two viewport sizes.
// Exercise slides are stepped through every fragment, so every Solve/Run action executes.
// Usage: npm run smoke   (screenshots are written to tests/screenshots/)
'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const DECK = path.resolve(__dirname, '..');
const EXERCISES = [1, 2, 3, 4, 6].map((n) => `exercise-${n}.html`);
// The central page that links the exercise decks (not linked from the book or the T1 deck).
const HUB = 'exercises.html';
const SHOTS = path.join(__dirname, 'screenshots');
const SIZES = [[1280, 720], [1920, 1080]];

async function openDeck(browser, file, width, height, initScript) {
  const page = await browser.newPage({ viewport: { width, height } });
  if (initScript) await page.addInitScript(initScript);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => errors.push(`failed to load ${r.url()}`));
  await page.route(/^https?:\/\//, (route) => {
    errors.push(`network request: ${route.request().url()}`);
    return route.abort();
  });
  await page.goto('file://' + path.join(DECK, file));
  await page.waitForFunction(() => window.T1Deck && window.T1Deck.ready, null, { timeout: 20000 });
  return { page, errors };
}

async function checkSlides(page, label, { stepFragments = false } = {}) {
  const problems = [];
  const total = await page.evaluate(() => Reveal.getTotalSlides());
  for (let i = 0; i < total; i++) {
    await page.evaluate((n) => Reveal.slide(n), i);
    await page.waitForTimeout(500);
    if (stepFragments) {
      // Show every step on the slide (each may run a Solve), then let live computations finish.
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
        overflow = Math.max(overflow, b.bottom - sb.bottom, b.right - sb.right);
      });
      return {
        title: ((s.querySelector('h1,h2') || {}).textContent || '(untitled)').trim(),
        link: !!s.querySelector(':scope > a.book-link'),
        figs: [...s.querySelectorAll('.fig-host')].map((h) => ({
          name: h.dataset.fig,
          state: h.dataset.state || 'none',
          // Drawn means a real plot that fills a sensible part of the slide, not just an empty SVG.
          drawn: !!h.querySelector('.main-svg') && (h.querySelector('.fig-frame') || { offsetHeight: 0 }).offsetHeight > 300,
        })),
        overflow: Math.round(overflow),
        errors: [...s.querySelectorAll('.result.error')].map((e) => e.textContent),
        // Equations wider than their column spill into the neighbouring figure. KaTeX's own box keeps the
        // column width while its content overflows, so measure the rendered pieces.
        wideMath: [...s.querySelectorAll('.katex-display')].filter((d) => {
          const col = d.closest('.ex-text, .ex-cols > div, section').getBoundingClientRect();
          const right = Math.max(...[...d.querySelectorAll('.katex-html .base')].map((e) => e.getBoundingClientRect().right));
          return d.offsetParent && right > col.right + 2;
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
    if (r.overflow > 2) problems.push(`${tag}: content overflows the slide by ${r.overflow}px`);
    if (r.flatScripts) problems.push(`${tag}: ${r.flatScripts} sub/superscripts render as plain text`);
    for (const e of r.errors) problems.push(`${tag}: shows an error: ${e}`);
    if (r.wideMath) problems.push(`${tag}: ${r.wideMath} equation(s) wider than their column`);
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

// The book's sliders must still respond when the figure is scaled inside the slide.
async function checkSliderDrag(page, label) {
  const idx = await page.evaluate(() => Reveal.getSlides().findIndex((s) => s.querySelector('[data-fig="irPlot2"]')));
  if (idx < 0) return [];
  await page.evaluate((n) => Reveal.slide(n), idx);
  await page.waitForTimeout(600);
  const visibleTrace = () => page.evaluate(() => {
    const gd = Reveal.getCurrentSlide().querySelector('.js-plotly-plot');
    return gd.data.findIndex((t) => t.visible === true);
  });
  const before = await visibleTrace();
  const rail = page.locator('section.present .slider-rail-rect').first();
  const b = await rail.boundingBox();
  await page.mouse.click(b.x + b.width * 0.8, b.y + b.height / 2);
  await page.waitForTimeout(500);
  const after = await visibleTrace();
  return after !== before ? [] : [`${label}: clicking the Figure 2.3 slider did not change the visible curve`];
}

const slideWith = (page, selector) =>
  page.evaluate((sel) => Reveal.getSlides().findIndex((s) => s.querySelector(sel) || s.matches(sel)), selector);
const resultText = (page) => page.evaluate(() => Reveal.getCurrentSlide().querySelector('.result').textContent);

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

// Steps, typing values, Enter and Reset on Exercise 1b; ← undoing a step; presets on Exercise 4c.
async function checkInputs(browser) {
  const problems = [];
  const traces = (page) => page.evaluate(() => Reveal.getCurrentSlide().querySelector('.result-host .js-plotly-plot').data.length);
  const { page, errors } = await openDeck(browser, 'exercise-1.html', 1280, 720);
  problems.push(...(await checkShared(page, 'ex1-wm', '610', '624')));
  await page.evaluate((n) => Reveal.slide(n), await slideWith(page, '[data-action="ex1-fit"]'));
  await page.waitForTimeout(400);
  // Step 1 plots the readings only; step 2 adds the fit.
  await page.locator('section.present button[data-run="ex1-fit"][data-step="1"]').click();
  await page.waitForTimeout(300);
  if ((await traces(page)) !== 1 || /k =/.test(await resultText(page))) problems.push('ex1 step 1: expected the readings alone, without a fit');
  await page.locator('section.present button[data-run="ex1-fit"][data-step="2"]').click();
  await page.waitForTimeout(300);
  if ((await traces(page)) !== 2 || !/k = 0\.693/.test(await resultText(page))) problems.push(`ex1 step 2: unexpected result "${await resultText(page)}"`);
  // ← goes back one step: the fit disappears again.
  await page.evaluate(() => Reveal.prevFragment());
  await page.waitForTimeout(300);
  if ((await traces(page)) !== 1) problems.push('ex1: going back a step did not remove the fit');
  await page.evaluate(() => Reveal.nextFragment());
  await page.waitForTimeout(300);
  // Arrow keys typed into an input must not change slide; Enter redraws with the edited value.
  const before = await page.evaluate(() => Reveal.getIndices().h);
  await page.locator('section.present input[data-key="wm"]').fill('700');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  if ((await page.evaluate(() => Reveal.getIndices().h)) !== before) problems.push('ex1: an arrow key typed in an input changed the slide');
  if (/k = 0\.693/.test(await resultText(page))) problems.push('ex1: Enter did not re-solve with the edited value');
  await page.locator('section.present input[data-key="wm"]').fill('abc');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  if (!(await page.evaluate(() => Reveal.getCurrentSlide().querySelector('.result.error')))) problems.push('ex1: invalid input did not show an error');
  await page.locator('section.present button[data-reset="ex1-fit"]').click();
  await page.waitForTimeout(300);
  const wm = await page.locator('section.present input[data-key="wm"]').inputValue();
  if (wm !== '624' || !/k = 0\.693/.test(await resultText(page))) problems.push(`ex1 Reset: value ${wm}, result "${await resultText(page)}"`);
  problems.push(...errors.map((e) => `ex1 inputs: ${e}`));
  await page.close();

  const ex2 = await openDeck(browser, 'exercise-2.html', 1280, 720);
  problems.push(...(await checkShared(ex2.page, 'ex2-gm', '14', '15')));
  problems.push(...ex2.errors.map((e) => `ex2 inputs: ${e}`));
  await ex2.page.close();

  const ex4 = await openDeck(browser, 'exercise-4.html', 1280, 720);
  await ex4.page.evaluate((n) => Reveal.slide(n), await slideWith(ex4.page, '[data-auto="ex4-proposed"]'));
  await ex4.page.waitForFunction(() => /Human/.test(Reveal.getCurrentSlide().querySelector('.result').textContent), null, { timeout: 5000 });
  if (/New/.test(await resultText(ex4.page))) problems.push('ex4c: the new protocol shows before its step');
  await ex4.page.locator('section.present input[data-key="tr"]').fill('3000');
  await ex4.page.locator('section.present button', { hasText: 'Proposed' }).click();
  await ex4.page.locator('section.present button[data-step="1"]').click();
  await ex4.page.waitForTimeout(400);
  const tr = await ex4.page.locator('section.present input[data-key="tr"]').inputValue();
  if (tr !== '5000') problems.push(`ex4 preset: TR is ${tr}, expected 5000`);
  if (!/New/.test(await resultText(ex4.page))) problems.push('ex4c step 1: no row for the new protocol');
  problems.push(...ex4.errors.map((e) => `ex4 inputs: ${e}`));
  await ex4.page.close();
  return problems;
}

// Exercise 3a: opened directly by its link, the notebook code runs; edited code reruns; bad code shows its line.
async function checkCodeSlide(browser) {
  const problems = [];
  const { page, errors } = await openDeck(browser, 'exercise-3.html#/1', 1280, 720);
  const legend = () => page.evaluate(() => {
    const gd = Reveal.getCurrentSlide().querySelector('.result-host .js-plotly-plot');
    return gd ? gd.data.map((t) => t.name).join(' | ') : '';
  });
  await page.waitForFunction(() => Reveal.getCurrentSlide().querySelector('.result-host .main-svg'), null, { timeout: 5000 }).catch(() => {});
  if (!/0\.90 s/.test(await legend())) problems.push(`ex3a deep link: the book's values were not drawn ("${await legend()}")`);
  const code = page.locator('section.present textarea[data-key="code"]');
  await code.fill((await code.inputValue()).replace('0.900', '0.650').replace('1.500', '1.200'));
  await code.press('Control+Enter');
  await page.waitForTimeout(500);
  if (!/0\.65 s/.test(await legend()) || !/1\.20 s/.test(await legend())) problems.push(`ex3a Run: edited values not drawn ("${await legend()}")`);
  await code.fill('params.T1 = abc;');
  await page.locator('section.present button[data-run="ex3-curves"]:not([data-step])').click();
  await page.waitForTimeout(300);
  if (!/Line 1/.test(await resultText(page))) problems.push(`ex3a: bad code did not report its line ("${await resultText(page)}")`);
  await page.locator('section.present button[data-reset="ex3-curves"]').click();
  await page.waitForTimeout(500);
  if (!/0\.90 s/.test(await legend())) problems.push('ex3a Reset: the book values were not restored');
  problems.push(...errors.map((e) => `ex3a: ${e}`));
  await page.close();
  return problems;
}

// Live qmrust results must appear within about a second of reaching the slide.
async function checkLiveSpeed(browser) {
  const problems = [];
  for (const [file, selector] of [['exercise-3.html', '[data-auto="ex3-longtr"]'], ['exercise-4.html', '[data-auto="ex4-mc"]']]) {
    const { page, errors } = await openDeck(browser, file, 1280, 720);
    await page.evaluate(() => QmRust.ready());
    const idx = await slideWith(page, selector);
    const ms = await page.evaluate(async (n) => {
      const t0 = performance.now();
      Reveal.slide(n);
      while (!Reveal.getCurrentSlide().querySelector('.result-host .main-svg')) await new Promise((r) => setTimeout(r, 10));
      return performance.now() - t0;
    }, idx);
    if (ms > 1000) problems.push(`${file}: live result took ${Math.round(ms)} ms`);
    problems.push(...errors.map((e) => `${file} speed: ${e}`));
    await page.close();
  }
  return problems;
}

// Without the WebAssembly engine, live slides show a fallback card instead of breaking.
async function checkQmRustFallback(browser) {
  const block = () => Object.defineProperty(window, 'QMRUST_WASM_B64', { get: () => undefined, set: () => {}, configurable: false });
  const { page } = await openDeck(browser, 'exercise-4.html', 1280, 720, block);
  await page.evaluate((n) => Reveal.slide(n), await slideWith(page, '[data-auto="ex4-mc"]'));
  await page.waitForTimeout(800);
  const ok = await page.evaluate(() => /unavailable/.test(Reveal.getCurrentSlide().querySelector('.result-host').textContent));
  await page.close();
  return ok ? [] : ['exercise-4: no fallback card when the qmrust engine is missing'];
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
      problems.push(...(await checkSliderDrag(page, label)));
      problems.push(...(await checkRapidNavigation(page, label)));
      problems.push(...errors.map((e) => `${label}: ${e}`));
      // The solutions have their own book page: the T1 deck itself must not link to them.
      const leaks = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => /exercise/.test(h) && !/qmrlab\.org/.test(h)));
      if (leaks.length) problems.push(`${label}: the T1 deck links to the solutions: ${leaks.join(', ')}`);
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
    problems.push(...(await checkCodeSlide(browser)));
    problems.push(...(await checkLiveSpeed(browser)));
    problems.push(...(await checkQmRustFallback(browser)));
  } finally {
    await browser.close();
  }
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log(`smoke: OK at ${SIZES.map((s) => s.join('x')).join(' and ')}`);
})();
