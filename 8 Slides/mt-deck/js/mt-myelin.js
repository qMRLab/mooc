/* Slide "Where it happens: myelin": a cartoon of myelin lamellae (lipid bilayers with thin water layers). Off-resonance
 * RF saturates only the rigid membrane protons; water that touches a membrane swaps saturation with it (a flip-flop:
 * saturation is conserved) and carries it away; everything recovers with T1 after the RF. A 22 s loop on a 1280 × 720
 * canvas, drawn only while the slide is shown. Rates and diffusion are slowed for the eye (see the notes). */
(function () {
  'use strict';
  window.MTDeck.widget('s-myelin', () => {
  const cv = document.getElementById('my-cv'), ctx = cv.getContext('2d');
  const W = 1280, H = 720, LOOP = 30;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

  // ---------------------------------------------------------------- palette (fixed illustration look)
  const COL = {
    extra: '#e4f0fa', gap: '#d9eaf8', axon: '#e8f1ea', band: 'rgba(242, 226, 202, 0.55)',
    head: [242, 223, 196], tail: [201, 178, 147], sat: [240, 120, 50],
    water: [52, 125, 196], waterH: [214, 40, 40], waterSat: [235, 100, 30], waterHSat: [176, 58, 12],
    ink: '#1d2a36', muted: '#5d6b79', rf: '#d6336c', spark: '#ffb703',
  };
  const PALE = [236, 228, 236];
  // blue -> pale -> orange, so half-saturated molecules read as faded rather than brown
  const mix3 = (a, b, t) => (t < 0.5 ? mix(a, PALE, 2 * t) : mix(PALE, b, 2 * t - 1));
  const mix = (a, b, t) => `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // ---------------------------------------------------------------- geometry: three lamellae (bilayers), water between
  const YC = [238, 378, 518], HALF = 34, SP = 15;
  const wave = (i, x) => 5 * Math.sin(x * 0.011 + i * 1.7);
  const surf = (i, side, x) => YC[i] + (side < 0 ? -HALF : HALF) + wave(i, x);
  // water regions: 0 outside the sheath, 1-2 between lamellae, 3 the axon
  function bounds(r, x) {
    const top = r === 0 ? 4 : surf(r - 1, 1, x) + 9;
    const bot = r === 3 ? H - 4 : surf(r, -1, x) - 9;
    return [top, bot];
  }

  // lipids: rows[i][side] (side 0 = outer leaflet facing up, 1 = inner leaflet facing down)
  const rows = YC.map((_, i) => [0, 1].map((side) => {
    const out = [];
    for (let x = 6; x < W; x += SP) out.push({ x: x + (side ? SP / 2 : 0), s: 0, ph: rand() * 6.28, bend: (rand() - 0.5) * 0.5 });
    return out;
  }));
  const lipidAt = (i, side, x) => { const row = rows[i][side]; const k = Math.round((x - 6 - (side ? SP / 2 : 0)) / SP); return row[Math.max(0, Math.min(row.length - 1, k))]; };

  // water molecules
  const waters = [];
  function addWaters(r, n) {
    for (let k = 0; k < n; k++) {
      const x = 10 + rand() * (W - 20), [a, b] = bounds(r, x);
      waters.push({ r, x, y: a + rand() * (b - a), vx: 0, vy: 0, a: rand() * 6.28, va: 0, s: 0 });
    }
  }
  addWaters(0, 150); addWaters(1, 72); addWaters(2, 72); addWaters(3, 120);

  const sparks = [];
  const trace = [];

  // ---------------------------------------------------------------- script
  // A short RF pulse, as in a real MT-prepared sequence: it saturates the membrane faster than exchange can respond, so most
  // of the transfer to water happens after the pulse and the water signal keeps dropping once the RF is off.
  const RF_ON = 5, RF_OFF = 6;
  const CAPS = [
    [0, 3.2, 'Myelin: a membrane wrapped dozens of times around the axon, with thin water layers in between.'],
    [3.2, 5, 'Water tumbles freely. The membrane’s protons are locked in place.'],
    [5, 6, 'A short off-resonance RF pulse saturates only the rigid membrane protons.'],
    [6, 8.5, 'RF off, exchange goes on: the membrane hands its saturation to the water, and the signal keeps dropping.'],
    [8.5, 21, 'Then membrane and water recover together, both with T₁.'],
    [21, 30, 'More membrane surface, more hand-overs: that is why white matter shows strong MT.'],
  ];
  // W: RF saturation rate of the membrane; kEx: hand-over rate per contact; R1w, R1m: recovery (the same order for both pools); D: diffusion.
  const P = { W: 10, kEx: 5, R1w: 0.12, R1m: 0.12, direct: 0.015, D: 60 };

  let t = 0, playing = !reduce, lastSample = -1;
  // Hold the simulation for HOLD s each time a new caption has faded in, so it can be read before the next step plays.
  const HOLD = 5, HOLDS = CAPS.map(([a]) => a + 0.35);
  let holdLeft = 0;
  const rfLevel = (tt) => Math.max(0, Math.min(1, Math.min((tt - RF_ON) / 0.4, (RF_OFF - tt) / 0.4)));
  const rfOn = (tt) => tt >= RF_ON && tt < RF_OFF;

  function reset() {
    t = 0; lastSample = -1; trace.length = 0; sparks.length = 0; holdLeft = 0;
    for (const w of waters) w.s = 0;
    for (const m of rows) for (const row of m) for (const l of row) l.s = 0;
  }

  // ---------------------------------------------------------------- simulation
  const gauss = () => { let u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283 * v); };
  function step(dt) {
    const on = rfOn(t);
    // lipids: RF saturation and recovery
    for (const m of rows) for (const row of m) for (const l of row) {
      if (on) l.s += P.W * (1 - l.s) * dt;
      l.s *= Math.exp(-P.R1m * dt);
    }
    for (const w of waters) {
      // Brownian motion with fast tumbling
      w.vx = w.vx * 0.92 + gauss() * P.D; w.vy = w.vy * 0.92 + gauss() * P.D;
      w.x += w.vx * dt; w.y += w.vy * dt;
      w.va = w.va * 0.9 + gauss() * 2.2; w.a += w.va * dt * 6;
      if (w.x < 6) { w.x = 6; w.vx = Math.abs(w.vx); }
      if (w.x > W - 6) { w.x = W - 6; w.vx = -Math.abs(w.vx); }
      const [a, b] = bounds(w.r, w.x);
      if (w.y < a) { w.y = a; w.vy = Math.abs(w.vy); }
      if (w.y > b) { w.y = b; w.vy = -Math.abs(w.vy); }
      // exchange with the membrane it touches: spins swap (a flip-flop), saturation is conserved
      let l = null, cy = 0;
      if (w.r > 0 && w.y - a < 8) { l = lipidAt(w.r - 1, 1, w.x); cy = a - 6; }
      else if (w.r < 3 && b - w.y < 8) { l = lipidAt(w.r, 0, w.x); cy = b + 6; }
      if (l && rand() < P.kEx * dt) {
        const d = l.s - w.s;
        if (Math.abs(d) > 0.02) {
          const ws = w.s; w.s = l.s; l.s = ws;
          // sparks mark only membrane → water hand-overs (the MT effect); the reverse swaps after the RF are left unmarked
          if (d > 0.25) sparks.push({ x: w.x, y: cy, age: 0, dir: 1 });
        }
      }
      if (on) w.s += P.direct * (1 - w.s) * dt;
      w.s *= Math.exp(-P.R1w * dt);
    }
    for (const sp of sparks) sp.age += dt;
    while (sparks.length && sparks[0].age > 0.5) sparks.shift();
    if (t - lastSample >= 0.1) { lastSample = t; trace.push([t, signal(), rfOn(t)]); }
  }
  function signal() { let s = 0; for (const w of waters) s += w.s; return 1 - s / waters.length; }
  function memSat() { let s = 0, n = 0; for (const m of rows) for (const row of m) for (const l of row) { s += l.s; n++; } return s / n; }

  // ---------------------------------------------------------------- drawing
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function card(x, y, w, h, r = 12) {
    ctx.save(); ctx.shadowColor = 'rgba(20, 40, 60, 0.18)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 3;
    roundRect(x, y, w, h, r); ctx.fillStyle = 'rgba(255,255,255,0.94)'; ctx.fill(); ctx.restore();
  }
  function chip(x, y, text, color = COL.ink) {
    ctx.font = `600 15px ${FONT}`; const w = ctx.measureText(text).width + 18;
    roundRect(x, y - 13, w, 26, 13); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
    ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.fillText(text, x + 9, y + 1);
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#eef6fc'); g.addColorStop(0.3, COL.extra); g.addColorStop(0.72, COL.gap); g.addColorStop(0.76, COL.axon); g.addColorStop(1, '#e2ece3');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function drawMembranes(time) {
    for (let i = 0; i < YC.length; i++) {
      // bilayer body
      ctx.beginPath();
      for (let x = 0; x <= W; x += 16) ctx.lineTo(x, surf(i, -1, x));
      for (let x = W; x >= 0; x -= 16) ctx.lineTo(x, surf(i, 1, x));
      ctx.closePath(); ctx.fillStyle = COL.band; ctx.fill();
      for (let side = 0; side < 2; side++) {
        const dirIn = side === 0 ? 1 : -1; // tails point toward the bilayer centre
        for (const l of rows[i][side]) {
          const hy = surf(i, side === 0 ? -1 : 1, l.x), jig = reduce ? 0 : 0.6 * Math.sin(time * 2 + l.ph);
          // two tails
          ctx.strokeStyle = mix(COL.tail, COL.sat, l.s * 0.85); ctx.lineWidth = 2.1; ctx.lineCap = 'round';
          for (const off of [-2.6, 2.6]) {
            ctx.beginPath(); ctx.moveTo(l.x + off, hy + dirIn * 5);
            ctx.bezierCurveTo(l.x + off + l.bend * 6, hy + dirIn * 13, l.x + off - l.bend * 6 + jig, hy + dirIn * 20, l.x + off + jig, hy + dirIn * 27);
            ctx.stroke();
          }
          // glow and head
          if (l.s > 0.15) { ctx.beginPath(); ctx.arc(l.x, hy, 11, 0, 6.283); ctx.fillStyle = `rgba(240, 120, 50, ${0.28 * l.s})`; ctx.fill(); }
          ctx.beginPath(); ctx.arc(l.x, hy, 6.4, 0, 6.283); ctx.fillStyle = mix(COL.head, COL.sat, l.s);
          ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(120, 90, 60, 0.35)'; ctx.stroke();
        }
      }
    }
  }

  function drawWaters() {
    for (const w of waters) {
      const ca = Math.cos(w.a), sa = Math.sin(w.a);
      const hCol = mix3(COL.waterH, COL.waterHSat, w.s);
      for (const ang of [0.92, -0.92]) {
        const hx = w.x + 6.2 * (ca * Math.cos(ang) - sa * Math.sin(ang)), hy = w.y + 6.2 * (sa * Math.cos(ang) + ca * Math.sin(ang));
        ctx.beginPath(); ctx.arc(hx, hy, 3.5, 0, 6.283); ctx.fillStyle = hCol; ctx.fill();
      }
      if (w.s > 0.2) { ctx.beginPath(); ctx.arc(w.x, w.y, 9.5, 0, 6.283); ctx.fillStyle = `rgba(235, 100, 30, ${0.18 * w.s})`; ctx.fill(); }
      ctx.beginPath(); ctx.arc(w.x, w.y, 5.3, 0, 6.283); ctx.fillStyle = mix3(COL.water, COL.waterSat, w.s); ctx.fill();
      ctx.beginPath(); ctx.arc(w.x - 1.6, w.y - 1.8, 1.5, 0, 6.283); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
    }
  }

  function drawSparks() {
    for (const sp of sparks) {
      const k = sp.age / 0.5, a = 1 - k, r = 5 + 9 * k;
      ctx.strokeStyle = `rgba(255, 183, 3, ${a})`; ctx.lineWidth = 2.2;
      for (let j = 0; j < 4; j++) {
        const th = j * Math.PI / 2 + k * 1.2;
        ctx.beginPath(); ctx.moveTo(sp.x + Math.cos(th) * r * 0.45, sp.y + Math.sin(th) * r * 0.45); ctx.lineTo(sp.x + Math.cos(th) * r, sp.y + Math.sin(th) * r); ctx.stroke();
      }
    }
  }

  function drawRF(time) {
    const lv = rfLevel(t); if (lv <= 0) return;
    ctx.save(); ctx.globalAlpha = 0.22 * lv; ctx.strokeStyle = COL.rf; ctx.lineWidth = 2.5;
    for (const [y0, amp, k] of [[120, 10, 0.03], [310, 7, 0.036], [450, 7, 0.033], [610, 10, 0.028]]) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 6) ctx.lineTo(x, y0 + amp * Math.sin(x * k - time * 9));
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = lv; chip(560, 160, '〰 off-resonance RF', COL.rf); ctx.globalAlpha = 1;
  }

  function drawInset() {
    const x = 18, y = 16, w = 236, h = 168;
    card(x, y, w, h);
    const cx = x + 84, cy = y + 96;
    ctx.beginPath(); ctx.arc(cx, cy, 64, 0, 6.283); ctx.fillStyle = '#f3e7d4'; ctx.fill();
    for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.arc(cx, cy, 40 + k * 3.3, 0, 6.283); ctx.strokeStyle = 'rgba(176, 140, 100, 0.85)'; ctx.lineWidth = 1.6; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(cx, cy, 37, 0, 6.283); ctx.fillStyle = COL.axon; ctx.fill();
    ctx.fillStyle = COL.muted; ctx.font = `600 12px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('axon', cx, cy);
    // zoom box on the sheath
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2; ctx.strokeRect(cx - 8, cy - 66, 16, 30);
    ctx.textAlign = 'left'; ctx.fillStyle = COL.ink; ctx.font = `700 14px ${FONT}`;
    ctx.fillText('Axon in', x + 158, y + 70); ctx.fillText('cross-section', x + 158 - 8, y + 88);
    ctx.font = `500 12px ${FONT}`; ctx.fillStyle = COL.muted; ctx.fillText('box: the view', x + 152, y + 112); ctx.fillText('(~×1 000 000)', x + 150, y + 128);
    ctx.textAlign = 'left';
  }

  function drawScale() {
    const x = 1252, y0 = YC[0], y1 = YC[1];
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.moveTo(x - 6, y0); ctx.lineTo(x + 6, y0); ctx.moveTo(x - 6, y1); ctx.lineTo(x + 6, y1); ctx.stroke();
    ctx.save(); ctx.translate(x - 12, (y0 + y1) / 2); ctx.rotate(-Math.PI / 2);
    ctx.font = `600 13px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = COL.ink; ctx.fillText('≈ 17 nm', 0, 0); ctx.restore();
  }

  function drawHUD() {
    const x = 960, y = 16, w = 304, h = 150;
    card(x, y, w, h);
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.font = `700 15px ${FONT}`; ctx.fillStyle = COL.ink; ctx.fillText('Water signal', x + 16, y + 28);
    const sig = signal();
    ctx.font = `700 15px ${FONT}`; ctx.textAlign = 'right'; ctx.fillStyle = `rgb(${COL.water.join(',')})`; ctx.fillText(`${Math.round(100 * sig)} %`, x + w - 16, y + 28); ctx.textAlign = 'left';
    // sparkline over the loop
    const px = x + 16, py = y + 40, pw = w - 32, ph = 62;
    const X = (tt) => px + (tt / LOOP) * pw, Y = (v) => py + (1 - v) * ph;
    ctx.fillStyle = 'rgba(214, 51, 108, 0.12)'; ctx.fillRect(X(RF_ON), py, X(RF_OFF) - X(RF_ON), ph);
    ctx.strokeStyle = '#e1e7ee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, Y(1)); ctx.lineTo(px + pw, Y(1)); ctx.moveTo(px, Y(0)); ctx.lineTo(px + pw, Y(0)); ctx.stroke();
    ctx.strokeStyle = `rgb(${COL.water.join(',')})`; ctx.lineWidth = 2.5; ctx.beginPath();
    const V = (v) => Y(Math.max(0, (v - 0.5) / 0.5));   // 50–100 % over the full height
    trace.forEach(([tt, v], k) => (k ? ctx.lineTo(X(tt), V(v)) : ctx.moveTo(X(tt), V(v))));
    ctx.stroke();
    ctx.font = `500 11px ${FONT}`; ctx.fillStyle = COL.muted; ctx.textAlign = 'right'; ctx.fillText('scale 50–100 %', px + pw, py + ph + 12); ctx.textAlign = 'left';
    ctx.fillStyle = COL.rf; ctx.fillText('RF on', X(RF_ON) + 4, py + ph - 5);
    // membrane saturation bar
    const ms = memSat(), by = y + 128;
    ctx.font = `600 12px ${FONT}`; ctx.fillStyle = COL.ink; ctx.fillText('Membrane saturation', x + 16, by);
    roundRect(x + 150, by - 10, 138, 12, 6); ctx.fillStyle = '#eef1f4'; ctx.fill();
    if (ms > 0.005) { roundRect(x + 150, by - 10, Math.max(12, 138 * ms), 12, 6); ctx.fillStyle = mix(COL.head, COL.sat, 1); ctx.fill(); }
  }

  function drawLabels() {
    chip(270, 40, 'water outside the sheath', '#255d8f');
    chip(16, YC[0] + 1, 'lipid bilayer', '#8a5a2b');
    chip(16, (YC[0] + YC[1]) / 2 + 2, 'water layer', '#255d8f');
    chip(16, YC[1] + 1, 'lipid bilayer', '#8a5a2b');
    chip(16, YC[2] + 1, 'lipid bilayer', '#8a5a2b');
    chip(16, 590, 'axon', '#2f6b3a');
  }

  function drawCaption() {
    const cap = CAPS.find(([a, b]) => t >= a && t < b) || CAPS[CAPS.length - 1];
    const fade = Math.min(1, (t - cap[0]) / 0.35, (cap[1] - t) / 0.35 + (cap === CAPS[CAPS.length - 1] ? 1 : 0));
    ctx.font = `600 21px ${FONT}`;
    const tw = ctx.measureText(cap[2]).width + 44, x = (W - tw) / 2, y = H - 74;
    ctx.globalAlpha = Math.max(0, fade);
    card(x, y, tw, 48, 24);
    ctx.fillStyle = COL.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(cap[2], W / 2, y + 25);
    if (holdLeft > 0) { ctx.fillStyle = 'rgba(31, 95, 153, 0.45)'; roundRect(x + 24, y + 42, (tw - 48) * (holdLeft / HOLD), 3, 1.5); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }

  function draw(time) {
    drawBackground();
    drawMembranes(time);
    drawWaters();
    drawSparks();
    drawRF(time);
    drawLabels();
    drawScale();
    drawInset();
    drawHUD();
    drawCaption();
  }


  // ---------------------------------------------------------------- canvas and loop (fixed 1.5× resolution: the slide is 1280 × 720)
  cv.width = 1920; cv.height = 1080; ctx.setTransform(1.5, 0, 0, 1.5, 0, 0);
  const playBtn = document.getElementById('my-play');
  const setPlaying = (p) => { playing = p; playBtn.textContent = p ? '❚❚ Pause' : '▶ Play'; };
  playBtn.addEventListener('click', () => { playBtn.blur(); setPlaying(!playing); });
  document.getElementById('my-restart').addEventListener('click', (e) => { e.currentTarget.blur(); reset(); setPlaying(true); });
  let raf = null, last = null;
  function frame(now) {
    const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    if (playing && dt > 0) {
      if (holdLeft > 0) holdLeft = Math.max(0, holdLeft - dt);
      else {
        const t0 = t;
        step(dt); t += dt;
        if (HOLDS.some((h) => t0 < h && t >= h)) holdLeft = HOLD;
        if (t >= LOOP) reset();
      }
    }
    draw(now / 1000);
    raf = requestAnimationFrame(frame);
  }
  if (reduce) { while (t < 8.5) { step(1 / 30); t += 1 / 30; } }
  setPlaying(playing);
  draw(0);
  return {
    show() { if (!raf) { last = null; raf = requestAnimationFrame(frame); } },
    hide() { if (raf) cancelAnimationFrame(raf); raf = null; },
  };
  });
})();
