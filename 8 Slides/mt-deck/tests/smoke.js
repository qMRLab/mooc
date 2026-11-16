// Headless walk-through of every slide of the MT deck, the exercise hub and the five exercises, offline (file://),
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
const PAGES = ['index.html', 'exercises.html', 'exercise-6-1.html', 'exercise-6-2.html', 'exercise-6-3.html', 'exercise-6-4.html', 'exercise-6-5.html'];

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
    await go(page, 's-scales'); await page.waitForTimeout(800);
    if (!(await page.evaluate(() => document.querySelectorAll('#sc-zoom line').length === 2))) out.push('slide 2: no zoom lines');
    await go(page, 's-protons'); await page.waitForTimeout(800);
    await go(page, 's-fidgrid'); await page.waitForTimeout(1200);
    await go(page, 's-bm'); await page.waitForTimeout(600);
    await page.click('#s-bm [data-v="both"]'); await page.click('#bm-play'); await page.waitForTimeout(1500);
    if (!/%/.test(await page.locator('#bm-tanks').innerHTML())) out.push('slide 6: no tank levels');
    await go(page, 's-onoff'); await page.waitForTimeout(800);
    await page.click('#s-onoff [data-v="ratio"]'); await page.waitForTimeout(600);
    if (!(await page.evaluate(() => document.querySelectorAll('#oo-off .hm, #oo-on .hm, #oo-off image, #oo-on image').length >= 2))) out.push('slide 7: missing MT off / MT on images');
    await go(page, 's-mtrintro'); await page.waitForTimeout(800);
    if (!/%/.test(await text(page, 'mi-wm'))) out.push('slide 10: no MTR medians');
    await go(page, 's-mtsatintro'); await page.waitForTimeout(500);
    if (!(await page.evaluate(() => [...document.querySelectorAll('#s-mtsatintro img')].every((i) => i.complete && i.naturalWidth > 0)))) out.push('slide 12: a sequence figure did not load');
    await go(page, 's-mtsatproto'); await page.waitForTimeout(500);
    if (!(await page.evaluate(() => document.querySelectorAll('#s-mtsatproto .mp-eq .katex').length === 4))) out.push('slide 13: the MTR, R1, A and MTsat equations did not render');
    if (!(await page.evaluate(() => ['mp-mtr', 'mp-t1', 'mp-mtsat'].every((id) => document.querySelector(`#${id} .hm, #${id} image`))))) out.push('slide 13: an output map is missing');
    await go(page, 's-qmtintro'); await page.waitForTimeout(400);
    if (!(await page.evaluate(() => { const i = document.querySelector('#s-qmtintro img'); return i && i.complete && i.naturalWidth > 0; }))) out.push('slide 15: the qMTLab paper image did not load');
    await go(page, 's-qmtproto'); await page.waitForTimeout(800);
    if (!(await page.evaluate(() => document.querySelectorAll('#qp-plot .scatterlayer .trace').length === 4))) out.push('slide 16: the Z-spectrum needs 2 model lines and 2 sets of measured points');
    await go(page, 's-qmtfit'); await page.waitForTimeout(600);
    if (!(await page.evaluate(() => [...document.querySelectorAll('#s-qmtfit img')].every((i) => i.complete && i.naturalWidth > 0)))) out.push('slide 17: the qMRLab logo or options screenshot did not load');
    await go(page, 's-qmtout'); await page.waitForTimeout(800);
    if (!(await page.evaluate(() => ['qo-F', 'qo-kf', 'qo-T2f', 'qo-T2r'].every((id) => document.querySelector(`#${id} .hm, #${id} image`))))) out.push('slide 18: a qMT map is missing');
    if (!(await page.evaluate(() => [...document.querySelectorAll('#s-gratio img')].every((i) => i.complete && i.naturalWidth > 0)))) out.push('slide 21: a g-ratio figure did not load');
    await go(page, 's-myelin'); await page.waitForTimeout(1500);
    await page.click('#my-restart'); await page.waitForTimeout(500);
    return out;
  },
  async 'exercise-6-1.html'(page) {
    const out = [];
    await go(page, 's-build'); await page.waitForTimeout(500);
    await page.click('#s-build .hq-btns [data-hq="zero"]'); await page.waitForTimeout(300);
    if (!(await page.evaluate(() => document.querySelector('#bd-tanks svg') && /Right/.test(document.querySelector('#s-build .hq-fb').textContent)))) out.push('6-1: the quiz did not mark the right answer');
    await page.click('#s-build [data-stage-go="3"]'); await page.waitForTimeout(300);
    if (!/exchange/i.test(await page.evaluate(() => document.querySelector('#s-build .hq-q').textContent))) out.push('6-1: the stage tabs do not jump to stage 3');
    await go(page, 's-tanks'); await page.waitForTimeout(500);
    await page.click('#s-tanks [data-ctl="tk-rf"] [data-v="on"]'); await page.waitForTimeout(2500);
    if (!(Number(await text(page, 'tk-hf')) < 0.8)) out.push('6-1: the RF does not lower the water tank');
    return out;
  },
  async 'exercise-6-2.html'(page) {
    const out = [];
    await go(page, 's-q62'); await page.waitForFunction(() => document.getElementById('q62-mtr-ask').dataset.answer, null, { timeout: 30000 });
    await page.fill('#q62-mtr-ask input', '21'); await page.click('#q62-mtr-ask .ask-go'); await page.waitForTimeout(800);
    if (!(await page.evaluate(() => /Right/.test(document.querySelector('#q62-mtr-ask .ask-fb').textContent) && document.querySelector('#q62-mtr-hist .main-svg')))) out.push('6-2: the F-halved question did not check or reveal its maps');
    await go(page, 's-q62b'); await page.waitForFunction(() => document.getElementById('q62b-mtsat-ask').dataset.answer, null, { timeout: 40000 });
    await page.click('#q62b-mtsat-ask [data-pick="hi"]'); await page.waitForTimeout(800);
    if (!(await page.evaluate(() => /Right/.test(document.querySelector('#q62b-mtsat-ask .ask-fb').textContent) && document.querySelector('#q62b-mtsat-hist .main-svg')))) out.push('6-2: the protocol question did not mark MTsat higher or reveal its maps');
    await go(page, 's-q62c'); await page.waitForFunction(() => document.getElementById('q62c-mtsat-ask').dataset.answer, null, { timeout: 40000 });
    await page.click('#q62c-mtsat-ask [data-pick="hi"]'); await page.waitForTimeout(800);
    if (!(await page.evaluate(() => /Right/.test(document.querySelector('#q62c-mtsat-ask .ask-fb').textContent)))) out.push('6-2: the B1 question did not mark MTsat higher');
    return out;
  },
  async 'exercise-6-3.html'(page) {
    const out = [];
    await go(page, 's-realz'); await page.waitForTimeout(800);
    await page.click('#s-realz [data-preset="gm"]'); await page.waitForTimeout(800);
    if (!/F/.test(await text(page, 'realz-table'))) out.push('6-3: real Z-spectra, no parameter table');
    await go(page, 's-zspec'); await page.waitForTimeout(800);
    await setRange(page, 'z-F', 0); await page.waitForTimeout(800);
    if (!(await page.evaluate(() => document.querySelectorAll('#z-plot .scatterlayer .trace').length >= 6))) out.push('6-3: the live Z-spectrum did not draw');
    await go(page, 'ex63-a'); await page.waitForTimeout(600);
    const e0 = Number(await text(page, 'ex63-sse'));
    for (const [id, v] of [['ex63-F', 0.22], ['ex63-kf', 1.8], ['ex63-T2f', 21], ['ex63-T2r', 12]]) await setRange(page, id, v);
    await page.waitForTimeout(500);
    if (!(Number(await text(page, 'ex63-sse')) < e0)) out.push('6-3 (a): moving towards the fit does not lower the error');
    await page.click('#ex63-submit');
    await go(page, 'ex63-b'); await page.waitForTimeout(600);
    await page.click('#ex63-fit'); await page.waitForFunction(() => !document.getElementById('ex63-fit').disabled, null, { timeout: 20000 });
    if (!/Computer/.test(await text(page, 'ex63-table')) || /–/.test((await page.locator('#ex63-table tr:nth-child(2) td:nth-child(3)').innerText()))) out.push('6-3 (b): no computer fit in the table');
    await page.click('#ex63-valley'); await page.waitForTimeout(3000);
    await go(page, 'ex63-c'); await page.waitForTimeout(600);
    await page.click('#ex63-c [data-v="higher"]'); await page.waitForTimeout(4000);
    if (!/Error in F/.test(await text(page, 'ex63-table-c'))) out.push('6-3 (c): no refit with the wrong B1');
    return out;
  },
  async 'exercise-6-4.html'(page) {
    const out = [];
    await go(page, 'ex64-a'); await page.waitForTimeout(500);
    const ans = await page.evaluate(() => Number(document.getElementById('ex64-a1').dataset.answer));
    await page.fill('#ex64-a1 input', ans.toFixed(1)); await page.click('#ex64-a1 .ask-go');
    if (!/Right/.test(await page.locator('#ex64-a1 .ask-fb').innerText())) out.push('6-4 (a): the right MTR is not accepted');
    await go(page, 'ex64-b'); await page.waitForTimeout(500);
    await page.fill('#ex64-b1 input', '50'); await page.click('#ex64-b1 .ask-go');
    if (!/Not quite/.test(await page.locator('#ex64-b1 .ask-fb').innerText())) out.push('6-4 (b): a wrong MTR is accepted');
    return out;
  },
  async 'exercise-6-5.html'(page) {
    const out = [];
    await go(page, 'ex65-a'); await page.waitForTimeout(500);
    const ans = await page.evaluate(() => Number(document.getElementById('ex65-mts').dataset.answer));
    await page.fill('#ex65-mts input', ans.toFixed(2)); await page.click('#ex65-mts .ask-go');
    if (!/Right/.test(await page.locator('#ex65-mts .ask-fb').innerText())) out.push('6-5 (a): the right MTsat is not accepted');
    await go(page, 'ex65-c'); await page.waitForTimeout(600);
    await page.click('#ex65-c [data-v="mtsat"]'); await page.waitForTimeout(800);
    if (!/ratio/.test(await text(page, 'ex65-contrast-fb'))) out.push('6-5 (c): no contrast feedback');
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
