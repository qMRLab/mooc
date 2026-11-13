// Headless walk-through of every slide of the MT deck, the exercise hub and the three exercises, offline (file://),
// at two viewport sizes, failing on any script error. It also drives the main interactions: sliders, presets, voxel
// clicks, the exercises' answer boxes and fits.
// Usage: npm run smoke   (screenshots are written to tests/screenshots/)
'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const DECK = path.resolve(__dirname, '..');
const SHOTS = path.join(__dirname, 'screenshots');
const SIZES = [[1280, 720], [1920, 1080]];
const PAGES = ['index.html', 'exercises.html', 'exercise-6-1.html', 'exercise-6-2.html', 'exercise-6-3.html'];

async function open(browser, file, w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`file://${path.join(DECK, file)}`);
  await page.waitForFunction(() => window.Reveal && window.Reveal.isReady(), null, { timeout: 30000 });
  return { page, errors };
}

const go = (page, id) => page.evaluate((s) => Reveal.slide(Reveal.getSlides().indexOf(document.getElementById(s))), id);
const setRange = (page, id, v) => page.evaluate(([i, val]) => { const el = document.getElementById(i); el.value = val; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); }, [id, v]);
const text = (page, id) => page.evaluate((i) => document.getElementById(i).textContent, id);

// Interactions, per page: return a list of problems.
const DRIVE = {
  async 'index.html'(page) {
    const out = [];
    await go(page, 's-lines'); await page.waitForTimeout(500);
    const r0 = await text(page, 'lines-ratio');
    await setRange(page, 'lines-offset', 4); await page.waitForTimeout(300);
    if ((await text(page, 'lines-ratio')) === r0) out.push('slide 3: the offset slider does not change the ratio');
    await go(page, 's-tanks'); await page.waitForTimeout(500);
    await page.click('#s-tanks [data-ctl="tk-rf"] [data-v="on"]'); await page.waitForTimeout(2500);
    if (!(Number(await text(page, 'tk-hf')) < 0.8)) out.push('slide 5: the RF does not lower the water tank');
    await go(page, 's-myelin'); await page.waitForTimeout(1500);
    await page.click('#my-restart'); await page.waitForTimeout(500);
    await go(page, 's-zspec'); await page.waitForTimeout(800);
    await setRange(page, 'z-F', 0); await page.waitForTimeout(800);
    await go(page, 's-realz'); await page.waitForTimeout(800);
    await page.click('#s-realz [data-preset="gm"]'); await page.waitForTimeout(800);
    if (!/F/.test(await text(page, 'realz-table'))) out.push('slide 12: no parameter table');
    await go(page, 's-mtrconf'); await page.waitForTimeout(600);
    const m0 = await text(page, 'mc-mtr');
    await setRange(page, 'mc-t1', 1.5); await page.waitForTimeout(400);
    if ((await text(page, 'mc-mtr')) === m0) out.push('slide 18: the T1 slider does not change MTR');
    await go(page, 's-budget'); await page.waitForTimeout(600);
    if (!/%/.test(await text(page, 'bud-nums'))) out.push('slide 23: no budget numbers');
    return out;
  },
  async 'exercise-6-1.html'(page) {
    const out = [];
    await go(page, 'ex61-a'); await page.waitForTimeout(600);
    const e0 = Number(await text(page, 'ex61-sse'));
    for (const [id, v] of [['ex61-F', 0.22], ['ex61-kf', 1.8], ['ex61-T2f', 21], ['ex61-T2r', 12]]) await setRange(page, id, v);
    await page.waitForTimeout(500);
    if (!(Number(await text(page, 'ex61-sse')) < e0)) out.push('6-1 (a): moving towards the fit does not lower the error');
    await page.click('#ex61-submit');
    await go(page, 'ex61-b'); await page.waitForTimeout(600);
    await page.click('#ex61-fit'); await page.waitForFunction(() => !document.getElementById('ex61-fit').disabled, null, { timeout: 20000 });
    if (!/Computer/.test(await text(page, 'ex61-table')) || /–/.test((await page.locator('#ex61-table tr:nth-child(2) td:nth-child(3)').innerText()))) out.push('6-1 (b): no computer fit in the table');
    await page.click('#ex61-valley'); await page.waitForTimeout(3000);
    await go(page, 'ex61-c'); await page.waitForTimeout(600);
    await page.click('#ex61-c [data-v="higher"]'); await page.waitForTimeout(4000);
    if (!/Error in F/.test(await text(page, 'ex61-table-c'))) out.push('6-1 (c): no refit with the wrong B1');
    return out;
  },
  async 'exercise-6-2.html'(page) {
    const out = [];
    await go(page, 'ex62-a'); await page.waitForTimeout(500);
    const ans = await page.evaluate(() => Number(document.getElementById('ex62-a1').dataset.answer));
    await page.fill('#ex62-a1 input', ans.toFixed(1)); await page.click('#ex62-a1 .ask-go');
    if (!/Right/.test(await page.locator('#ex62-a1 .ask-fb').innerText())) out.push('6-2 (a): the right MTR is not accepted');
    await go(page, 'ex62-b'); await page.waitForTimeout(500);
    await page.fill('#ex62-b1 input', '50'); await page.click('#ex62-b1 .ask-go');
    if (!/Not quite/.test(await page.locator('#ex62-b1 .ask-fb').innerText())) out.push('6-2 (b): a wrong MTR is accepted');
    return out;
  },
  async 'exercise-6-3.html'(page) {
    const out = [];
    await go(page, 'ex63-a'); await page.waitForTimeout(500);
    const ans = await page.evaluate(() => Number(document.getElementById('ex63-mts').dataset.answer));
    await page.fill('#ex63-mts input', ans.toFixed(2)); await page.click('#ex63-mts .ask-go');
    if (!/Right/.test(await page.locator('#ex63-mts .ask-fb').innerText())) out.push('6-3 (a): the right MTsat is not accepted');
    await go(page, 'ex63-c'); await page.waitForTimeout(600);
    await page.click('#ex63-c [data-v="mtsat"]'); await page.waitForTimeout(800);
    if (!/ratio/.test(await text(page, 'ex63-contrast-fb'))) out.push('6-3 (c): no contrast feedback');
    return out;
  },
};

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const problems = [];
  for (const [w, h] of SIZES) {
    for (const file of PAGES) {
      const { page, errors } = await open(browser, file, w, h);
      const n = await page.evaluate(() => Reveal.getTotalSlides());
      const tag = `${file.replace('.html', '')}-${w}x${h}`;
      for (let i = 0; i < n; i++) {
        await page.evaluate((k) => Reveal.slide(k, 0, 999), i);
        await page.waitForTimeout(900);
        await page.screenshot({ path: path.join(SHOTS, `${tag}-${String(i + 1).padStart(2, '0')}.png`) });
      }
      if (w === 1280 && DRIVE[file]) problems.push(...(await DRIVE[file](page)));
      problems.push(...errors.map((e) => `${tag}: ${e}`));
      await page.close();
      console.log(`${tag}: ${n} slides`);
    }
  }
  await browser.close();
  if (problems.length) { console.error(`\n${problems.length} problem(s):\n- ${problems.join('\n- ')}`); process.exit(1); }
  console.log(`\nall pages fine; screenshots in ${path.relative(process.cwd(), SHOTS)}`);
})().catch((e) => { console.error(e); process.exit(1); });
