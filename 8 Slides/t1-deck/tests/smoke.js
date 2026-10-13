// Headless walk-through of every slide, offline, at two viewport sizes.
// Usage: npm run smoke   (screenshots are written to tests/screenshots/)
'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const DECK = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(DECK, 'index.html');
const SHOTS = path.join(__dirname, 'screenshots');
const SIZES = [[1280, 720], [1920, 1080]];

async function openDeck(browser, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => errors.push(`failed to load ${r.url()}`));
  await page.route(/^https?:\/\//, (route) => {
    errors.push(`network request: ${route.request().url()}`);
    return route.abort();
  });
  await page.goto(URL);
  await page.waitForFunction(() => window.T1Deck && window.T1Deck.ready, null, { timeout: 20000 });
  return { page, errors };
}

async function checkSlides(page, label) {
  const problems = [];
  const total = await page.evaluate(() => Reveal.getTotalSlides());
  for (let i = 0; i < total; i++) {
    await page.evaluate((n) => Reveal.slide(n), i);
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const s = Reveal.getCurrentSlide();
      const box = (el) => el.getBoundingClientRect();
      const sb = box(s);
      // Anything drawn below the slide's bottom edge (or past its right edge) overflows.
      let overflow = 0;
      s.querySelectorAll('h1,h2,h3,p,li,img,.eq,.card,.fig-frame').forEach((el) => {
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

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const problems = [];
  try {
    for (const [w, h] of SIZES) {
      const label = `${w}x${h}`;
      const { page, errors } = await openDeck(browser, w, h);
      problems.push(...(await checkSlides(page, label)));
      problems.push(...(await checkSliderDrag(page, label)));
      problems.push(...(await checkRapidNavigation(page, label)));
      problems.push(...errors.map((e) => `${label}: ${e}`));
      await page.close();
    }
  } finally {
    await browser.close();
  }
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log(`smoke: OK at ${SIZES.map((s) => s.join('x')).join(' and ')}`);
})();
