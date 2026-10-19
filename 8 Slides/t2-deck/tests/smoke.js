// Headless walk-through of every slide of the T2 deck, offline, at two viewport sizes.
// Usage: npm run smoke   (screenshots are written to tests/screenshots/)
'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const DECK = path.resolve(__dirname, '..');
const SHOTS = path.join(__dirname, 'screenshots');
const SIZES = [[1280, 720], [1920, 1080]];

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

async function checkSlides(page, label) {
  const problems = [];
  const total = await page.evaluate(() => Reveal.getTotalSlides());
  for (let i = 0; i < total; i++) {
    await page.evaluate((n) => Reveal.slide(n), i);
    // Let the slide transition finish, so screenshots show the settled slide.
    await page.waitForTimeout(1000);
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
      // Text must stay clear of the book link in the bottom-left corner.
      const link = s.querySelector(':scope > a.book-link');
      let overLink = 0;
      if (link) {
        const lb = box(link);
        s.querySelectorAll('p,li,.eq,.card').forEach((el) => {
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
        // Equations wider than the slide: KaTeX's box keeps its width while its content overflows.
        wideMath: [...s.querySelectorAll('.katex-display')].filter((d) => {
          const right = Math.max(...[...d.querySelectorAll('.katex-html .base')].map((e) => e.getBoundingClientRect().right));
          return d.offsetParent && right > sb.right - 20;
        }).length,
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
    if (r.overLink > 2) problems.push(`${tag}: content runs into the book link by ${r.overLink}px`);
    if (r.flatScripts) problems.push(`${tag}: ${r.flatScripts} sub/superscripts render as plain text`);
    if (r.wideMath) problems.push(`${tag}: ${r.wideMath} equation(s) wider than the slide`);
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
