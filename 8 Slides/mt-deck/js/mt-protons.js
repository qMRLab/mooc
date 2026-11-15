/* Slide "Mobile and restricted protons": two canvases. Top: water molecules tumbling and diffusing freely. Bottom: a lipid
 * bilayer (the macromolecules of myelin): the same hydrogens, locked in place, only vibrating. Hydrogen is drawn the
 * same way in both (H_FILL), so the protons read as the same particles in two environments. Drawn only while shown. */
(function () {
  'use strict';
  const H_FILL = '#ffffff', H_LINE = '#1d2733';          // hydrogen, the same in both panels
  const O_FILL = 'rgb(52,125,196)', C_FILL = 'rgb(150,116,82)', HEAD = 'rgb(242,223,196)', HEAD_LINE = 'rgba(120,90,60,0.45)';
  const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-12)) * Math.cos(6.283 * rand());

  function setup(cv) {
    const w = cv.clientWidth || 860, h = cv.clientHeight || 270, k = 2;
    cv.width = w * k; cv.height = h * k;
    const ctx = cv.getContext('2d'); ctx.setTransform(k, 0, 0, k, 0, 0);
    return { ctx, w, h };
  }
  function atom(ctx, x, y, r, fill, line, lw = 1.2) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fillStyle = fill; ctx.fill();
    if (line) { ctx.lineWidth = lw; ctx.strokeStyle = line; ctx.stroke(); }
  }
  function bond(ctx, x1, y1, x2, y2, col = 'rgba(29,39,51,0.45)', lw = 2.2) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke();
  }
  function chip(ctx, x, y, text, col) {
    ctx.font = `600 15px ${FONT}`;
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.roundRect(x, y, tw + 20, 28, 8); ctx.fill();
    ctx.fillStyle = col; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(text, x + 10, y + 14.5);
  }

  window.MTDeck.widget('s-protons', () => {
    const top = setup(document.getElementById('pr-water'));
    const bot = setup(document.getElementById('pr-lipid'));

    // ------------------------------------------------ water: Brownian translation and fast, random tumbling
    const RO = 10, RH = 6, DOH = 15, HALF = (104.5 / 2) * Math.PI / 180;
    const waters = Array.from({ length: Math.round((top.w * top.h) / 4200) }, () => ({
      x: rand() * top.w, y: rand() * top.h, vx: 0, vy: 0, a: rand() * 6.283, va: (rand() - 0.5) * 16,
    }));
    function stepWater(dt) {
      for (const m of waters) {
        m.vx += (-m.vx * 2 + 160 * gauss()) * dt; m.vy += (-m.vy * 2 + 160 * gauss()) * dt;
        m.va += (-m.va * 1.5 + 40 * gauss()) * dt;
        m.x += m.vx * dt; m.y += m.vy * dt; m.a += m.va * dt;
        const pad = 20;
        if (m.x < -pad) m.x += top.w + 2 * pad; if (m.x > top.w + pad) m.x -= top.w + 2 * pad;
        if (m.y < -pad) m.y += top.h + 2 * pad; if (m.y > top.h + pad) m.y -= top.h + 2 * pad;
      }
    }
    function drawWater() {
      const { ctx, w, h } = top;
      ctx.fillStyle = '#e7f1fa'; ctx.fillRect(0, 0, w, h);
      for (const m of waters) {
        const hs = [m.a + HALF, m.a - HALF].map((t) => [m.x + DOH * Math.cos(t), m.y + DOH * Math.sin(t)]);
        for (const [hx, hy] of hs) bond(ctx, m.x, m.y, hx, hy);
        atom(ctx, m.x, m.y, RO, O_FILL);
        for (const [hx, hy] of hs) atom(ctx, hx, hy, RH, H_FILL, H_LINE);
      }
      chip(ctx, 12, 12, 'Water: free to tumble and move', O_FILL);
    }

    // ------------------------------------------------ lipid bilayer: two leaflets of chains, heads out, tails in
    // (vertical space: 44 px for the label at the top, then the bilayer centred in the rest)
    const TOPPAD = 44, NC = 5, SPX = 56, ZIG = 4.5, RC = 7, RHL = 5, DXH = 12, RHEAD = 12;
    const span = bot.h - TOPPAD - 8, mid = TOPPAD + span / 2, headOff = span / 2 - RHEAD - 1;
    const DY = (headOff - 26) / (NC - 1);
    const lipids = [];
    for (let leaf = 0; leaf < 2; leaf++) {
      for (let x = SPX / 2; x < bot.w + SPX; x += SPX) lipids.push({ leaf, x, ph: Array.from({ length: NC + 1 }, () => rand() * 6.283) });
    }
    function drawLipid(time) {
      const { ctx, w, h } = bot;
      ctx.fillStyle = '#fbf1e6'; ctx.fillRect(0, 0, w, h);
      for (const l of lipids) {
        const dir = l.leaf ? 1 : -1;   // leaflet 0 above the middle (head at the top), 1 below
        const j = (i, s) => (reduce ? 0 : 0.7 * Math.sin(time * 7 + l.ph[i] + s));   // thermal vibration, in place
        const pts = [];
        for (let i = NC - 1; i >= 0; i--) pts.push([l.x + (i % 2 ? ZIG : -ZIG) + j(i, 0), mid + dir * (7 + i * DY) + j(i, 1.3)]);
        const head = [l.x + j(NC, 0), mid + dir * headOff + j(NC, 2)];
        bond(ctx, head[0], head[1], pts[0][0], pts[0][1]);
        for (let i = 0; i < NC - 1; i++) bond(ctx, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
        for (const [cx, cy] of pts) for (const s of [-1, 1]) bond(ctx, cx, cy, cx + s * DXH, cy - dir * 3, 'rgba(29,39,51,0.35)', 1.6);
        atom(ctx, head[0], head[1], RHEAD, HEAD, HEAD_LINE);
        for (const [cx, cy] of pts) atom(ctx, cx, cy, RC, C_FILL);
        for (const [cx, cy] of pts) for (const s of [-1, 1]) atom(ctx, cx + s * DXH, cy - dir * 3, RHL, H_FILL, H_LINE);
      }
      chip(ctx, 12, 10, 'Macromolecules (lipids of myelin): locked in place', C_FILL);
    }

    // ------------------------------------------------ loop
    let raf = null, last = null;
    function frame(now) {
      const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      if (dt > 0) stepWater(dt);
      drawWater(); drawLipid(now / 1000);
      raf = requestAnimationFrame(frame);
    }
    for (let i = 0; i < 30; i++) stepWater(1 / 30);
    drawWater(); drawLipid(0);
    if (reduce) return undefined;
    return {
      show() { if (!raf) { last = null; raf = requestAnimationFrame(frame); } },
      hide() { if (raf) cancelAnimationFrame(raf); raf = null; },
    };
  });
})();
