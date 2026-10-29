/* Frames of reference, part 2 (#frames-pulse): one spin on resonance, no relaxation, starting along +y, and a rectangular RF pulse of set
 * duration along ±x or ±y of the transmit frame, seen in the Larmor frame (= the receive frame, demodulated at f0) and in
 * the transmit RF frame (turning at f_RF = f0 + Δ). Same controls idea as the T2 lab's Exercise 2-1 controls slide
 * (arrow keys → ±x, ±y), and its drawing (GBM-MRI T2 deck, js/exn.js). Conventions as bs-core.js: right-handed rotations,
 * in the RF frame Ω = 2π(f1 cos φ, f1 sin φ, −Δ), and the Larmor-frame M is the RF-frame one turned by +2πΔt about z. */
(function () {
  'use strict';
  const slide = document.getElementById('frames-pulse'); if (!slide) return;
  const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif', MUTED = '#5b6776', AXIS = '#9aa5b1', DEG = 180 / Math.PI, TAU = 2 * Math.PI;
  const GAMMA_BAR = 42.577e6;   // Hz/T
  const COL = { m: '#1f5f99', b1: '#e8770e', b0: '#33414e', eff: '#b2182b' };
  const FAST = 3;        // turns per second on screen above which B1 is drawn as the ring it sweeps
  const OFF_MAX = 20e3;  // offset slider: Δ = OFF_MAX · s³ (fine near resonance)
  const TRAIL_MAX = 6000;
  const PHASES = { px: [0, '+x'], mx: [Math.PI, '−x'], py: [Math.PI / 2, '+y'], my: [-Math.PI / 2, '−y'] };
  const st = { env: 'rect', off: 4e3, b1: 10e-6, dur: 0.587e-3, rate: 0, m: [0, 1, 0], th: 0, act: null, trailL: [], trailR: [], log: '' };
  const f1 = () => GAMMA_BAR * st.b1;
  const fEff = () => Math.hypot(f1(), st.off);
  st.rate = 0.5 / fEff();
  const view = { az: -0.6, el: 0.42 };
  // Fermi envelope from bs-core.js (8 ms, as in Sacolick et al. 2010): b(t) in [0, 1] over the pulse
  const FERMI_T = BS.PULSE.T, REAL_SCREEN = 3;   // the realistic pulse plays over 3 s on screen
  const envAt = (a, t) => (a && a.kind === 'pulse' ? (a.fermi ? BS.fermi(t) : 1) : 0);
  const rateNow = () => (st.act && st.act.rate) || st.rate;

  function rotate(v, n, a) {   // right-handed rotation of v by a about the unit axis n (Rodrigues)
    const c = Math.cos(a), s = Math.sin(a), d = n[0] * v[0] + n[1] * v[1] + n[2] * v[2];
    return [v[0] * c + (n[1] * v[2] - n[2] * v[1]) * s + n[0] * d * (1 - c),
      v[1] * c + (n[2] * v[0] - n[0] * v[2]) * s + n[1] * d * (1 - c),
      v[2] * c + (n[0] * v[1] - n[1] * v[0]) * s + n[2] * d * (1 - c)];
  }
  const rotZ = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];
  const larmor = (m, th) => rotZ(m, th);

  // ---- number formatting ----
  function hz(f, sign) {
    const a = Math.abs(f), s = f < 0 ? '−' : sign && f > 0 ? '+' : '';
    if (a < 0.05) return '0 Hz';
    if (a >= 1e3) return `${s}${(a / 1e3).toFixed(2)} kHz`;
    return `${s}${a.toFixed(a >= 100 ? 0 : 1)} Hz`;
  }
  function sec(t) {
    const u = [[1, 's'], [1e-3, 'ms'], [1e-6, 'µs']].find(([k]) => t >= k) || [1e-6, 'µs'];
    return `${(t / u[0]).toFixed(t / u[0] >= 100 ? 0 : 2)} ${u[1]}`;
  }

  // ---- a view ----
  function makeView(canvas, prime) {
    const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height, R = 0.34 * Math.min(W, H), FS = Math.round(0.044 * W);
    function proj(v) {
      const x1 = v[0] * Math.cos(view.az) - v[1] * Math.sin(view.az), y1 = v[0] * Math.sin(view.az) + v[1] * Math.cos(view.az);
      return [W / 2 + R * x1, H / 2 + 0.05 * H - R * (v[2] * Math.cos(view.el) + y1 * Math.sin(view.el))];
    }
    function line(a, b, colour, width, dash) {
      const p = proj(a), q = proj(b);
      g.strokeStyle = colour; g.lineWidth = width; g.setLineDash(dash || []);
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); g.setLineDash([]);
    }
    function path(pts, colour, width) {
      if (pts.length < 2) return;
      g.strokeStyle = colour; g.lineWidth = width; g.beginPath();
      pts.forEach((v, k) => { const q = proj(v); k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); });
      g.stroke();
    }
    function arrow(v, colour, width) {
      if (Math.hypot(v[0], v[1], v[2]) < 0.02) return;
      line([0, 0, 0], v, colour, width);
      const p = proj(v), o = proj([0, 0, 0]), ang = Math.atan2(p[1] - o[1], p[0] - o[0]), h = 0.033 * W;
      g.fillStyle = colour; g.beginPath(); g.moveTo(p[0], p[1]);
      g.lineTo(p[0] - h * Math.cos(ang - 0.4), p[1] - h * Math.sin(ang - 0.4));
      g.lineTo(p[0] - h * Math.cos(ang + 0.4), p[1] - h * Math.sin(ang + 0.4)); g.closePath(); g.fill();
    }
    function label(v, text, colour, bold, dx = 0) {   // "B_eff" draws eff as a subscript
      const p = proj(v); p[0] += dx; const [base, sub] = text.split('_'), w = bold ? '700 ' : '';
      const f = `${w}${FS}px ${FONT}`, fs = `${w}${Math.round(0.7 * FS)}px ${FONT}`;
      g.fillStyle = colour; g.textBaseline = 'middle';
      if (!sub) { g.font = f; g.textAlign = 'center'; g.fillText(text, p[0], p[1]); return; }
      g.font = f; const wb = g.measureText(base).width; g.font = fs; const ws = g.measureText(sub).width;
      g.textAlign = 'left'; g.font = f; g.fillText(base, p[0] - (wb + ws) / 2, p[1]);
      g.font = fs; g.fillText(sub, p[0] - (wb + ws) / 2 + wb, p[1] + 0.3 * FS);
    }
    const tag = (v, text, colour, dx) => { const n = Math.hypot(...v) || 1, k = (n + 0.16) / n; label([k * v[0], k * v[1], k * v[2] + 0.05], text, colour, true, dx); };
    function draw({ m, trail, arrows, ring }) {
      g.clearRect(0, 0, W, H);
      g.strokeStyle = '#d8dee6'; g.lineWidth = 2; g.beginPath();
      for (let i = 0; i <= 96; i++) { const a = (i / 96) * TAU, p = proj([Math.cos(a), Math.sin(a), 0]); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
      g.stroke();
      for (const [nx, ny, name] of [[1, 0, '+x'], [-1, 0, '−x'], [0, 1, '+y'], [0, -1, '−y']]) {
        line([0, 0, 0], [1.2 * nx, 1.2 * ny, 0], AXIS, 2); label([1.36 * nx, 1.36 * ny, 0], name + prime, MUTED);
      }
      line([0, 0, -1.2], [0, 0, 1.2], AXIS, 2); label([0, 0, 1.34], 'z', MUTED);
      path(trail, 'rgba(31, 95, 153, 0.5)', 3);
      if (ring) {   // B1 turning too fast to animate: the ring it sweeps
        g.strokeStyle = 'rgba(232, 119, 14, 0.55)'; g.lineWidth = 4; g.beginPath();
        for (let i = 0; i <= 96; i++) { const a = (i / 96) * TAU, p = proj([ring * Math.cos(a), ring * Math.sin(a), 0]); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
        g.stroke();
      }
      for (const a of arrows) { arrow(a.v, a.colour, a.width); if (a.label) tag(a.v, a.label, a.colour, a.dx || 0); }
      line([0, 0, 0], [m[0], m[1], 0], '#b8c2cc', 3, [10, 8]); line([m[0], m[1], 0], m, '#b8c2cc', 2, [4, 6]);
      arrow(m, COL.m, 9); tag(m, 'M', COL.m);
    }
    return { draw };
  }
  const vL = makeView(slide.querySelector('canvas[data-frame="lar"]'), '');
  const vR = makeView(slide.querySelector('canvas[data-frame="rf"]'), '′');

  // ---- physics: advance real time dt within the current action ----
  // Each step is an exact rotation about B_eff at the step's midpoint envelope (≤ 0.05 rad per step). Along the way the
  // receive-frame phase of M is unwrapped, so the phase a pulse adds can be read off at the end.
  function advance(dt) {
    const a = st.act, on = a && a.kind === 'pulse', w1max = on ? TAU * f1() : 0, oz = -TAU * st.off;
    const n = Math.max(1, Math.min(20000, Math.ceil((Math.hypot(w1max, oz) * dt) / 0.05)));
    const h = dt / n, keep = Math.max(1, Math.floor(n / 60)), t0 = a ? a.done : 0;
    for (let k = 0; k < n; k++) {
      const w1 = w1max * envAt(a, t0 + (k + 0.5) * h), ax = on ? [w1 * Math.cos(a.phase), w1 * Math.sin(a.phase), oz] : [0, 0, oz], mag = Math.hypot(...ax);
      if (mag > 0) st.m = rotate(st.m, ax.map((x) => x / mag), mag * h);
      st.th = (st.th + TAU * st.off * h) % TAU;
      const L = larmor(st.m, st.th);
      if (a && Math.hypot(L[0], L[1]) > 1e-3) {
        const p = Math.atan2(L[1], L[0]);
        if (a.lastP !== undefined) { let dp = p - a.lastP; dp -= TAU * Math.round(dp / TAU); a.dphi += dp; }
        a.lastP = p;
      }
      if (k % keep === keep - 1 || k === n - 1) { st.trailR.push(st.m.slice()); st.trailL.push(L); }
    }
    if (st.trailR.length > TRAIL_MAX) { st.trailR.splice(0, st.trailR.length - TRAIL_MAX); st.trailL.splice(0, st.trailL.length - TRAIL_MAX); }
    if (a) a.done += dt;
  }

  // ---- drawing both views and the readouts ----
  const ph = (v) => (Math.hypot(v[0], v[1]) > 1e-3 ? `${(Math.atan2(v[1], v[0]) * DEG).toFixed(0).replace(/^-0$/, '0').replace('-', '−')}°` : '–');
  function render() {
    const a = st.act, on = a && a.kind === 'pulse', mL = larmor(st.m, st.th), d = st.off;
    const fastB1 = Math.abs(d * rateNow()) > FAST, e = on ? envAt(a, a.done) : 0, f1n = f1() * e;
    // Larmor frame: B1 turning at Δ (a ring if too fast); no field left on z for this spin
    const arrowsL = [];
    if (on && !fastB1) { const b = a.phase + st.th; arrowsL.push({ v: [1.15 * e * Math.cos(b), 1.15 * e * Math.sin(b), 0], colour: COL.b1, width: 6, label: e > 0.15 ? 'B₁' : '' }); }
    vL.draw({ m: mL, trail: st.trailL, arrows: arrowsL, ring: on && fastB1 ? 1.15 * e : 0 });
    // RF frame: −Δ left on z, B1 fixed on its axis while on, and their sum B_eff; one scale, B_eff (or ΔB0) at 1.2
    const arrowsR = [], fe = Math.hypot(f1n, d), S = fe > 0 ? 1.2 / fe : 0;
    if (Math.abs(d) * S >= 0.02) arrowsR.push({ v: [0, 0, -d * S], colour: COL.b0, width: 5, label: 'ΔB₀', dx: on ? -0.05 * 680 : 0 });
    if (on) {
      const b = [f1n * S * Math.cos(a.phase), f1n * S * Math.sin(a.phase), 0];
      arrowsR.push({ v: b, colour: COL.b1, width: 5.5, label: 'B₁' });
      if (Math.abs(d) * S >= 0.02 && f1n * S >= 0.02) arrowsR.unshift({ v: [b[0], b[1], -d * S], colour: 'rgba(178, 24, 43, 0.6)', width: 10, label: 'B_eff', dx: 0.05 * 680 });
    }
    vR.draw({ m: st.m, trail: st.trailR, arrows: arrowsR });
    const signed = (x) => x.toFixed(2).replace(/^-0\.00$/, '0.00').replace('-', '−');
    const mxy = (v) => Math.hypot(v[0], v[1]).toFixed(2);
    slide.querySelector('.fp-read[data-frame="lar"]').innerHTML = `M: phase ${ph(mL)}, |M<sub>xy</sub>| = ${mxy(mL)}, M<sub>z</sub> = ${signed(mL[2])}.<br>`
      + (on ? `B<sub>1</sub> turns at f<sub>RF</sub> − f<sub>0</sub> = ${hz(d, 1)}${fastB1 ? ' (too fast to draw: its ring)' : ''}.` : 'RF off: this spin stands still here.');
    const th = Math.atan2(f1n, -d) * DEG;
    slide.querySelector('.fp-read[data-frame="rf"]').innerHTML = `M: phase ${ph(st.m)}, |M<sub>xy</sub>| = ${mxy(st.m)}, M<sub>z</sub> = ${signed(st.m[2])}.<br>`
      + (on ? `M turns about B<sub>eff</sub> (${th.toFixed(0)}° from z) at ${hz(fe)}.` : `RF off: M turns about z at f<sub>0</sub> − f<sub>RF</sub> = ${hz(-d, 1)}.`);
    slide.querySelector('.fp-status').innerHTML = a
      ? `${a.kind === 'pulse' ? `${a.fermi ? 'Fermi pulse' : 'Pulse'} along ${a.name}′` : 'Waiting, RF off'}: ${sec(a.done)} of ${sec(a.T)}`
        + (a.rate ? ' <span class="fp-muted">(a blur at this speed; the end values are exact)</span>' : '')
      : st.log;
  }

  // ---- actions, played back slowed down ----
  let raf = null, last = 0;
  function frame(now) {
    const a = st.act; if (!a) { raf = null; return; }
    const dt = Math.min(a.T - a.done, Math.min(0.1, (now - last) / 1000) * rateNow()); last = now;
    advance(dt);
    if (a.done >= a.T - 1e-12) finish();
    render();
    raf = st.act ? requestAnimationFrame(frame) : null;
  }
  function finish() {
    const a = st.act; if (!a) return;
    if (a.done < a.T) advance(a.T - a.done);
    const deg = (x) => `${x >= 0.005 ? '+' : ''}${x.toFixed(2).replace('-', '−')}°`;
    const intB = a.fermi ? BS.INT_B : a.T, intB2 = a.fermi ? BS.INT_B2 : a.T;
    const moved = a.lastP !== undefined ? ` Receive phase moved <b>${deg(a.dphi * DEG)}</b>` : '';
    st.log = a.kind === 'pulse'
      ? `Last: ${a.fermi ? 'Fermi' : 'rectangular'} pulse along ${a.name}′, ${sec(a.T)} (${(360 * f1() * intB).toFixed(0)}° on resonance).${moved}`
        + (moved && Math.abs(st.off) > 0.05 ? ` (first order, −f<sub>1</sub>²∫b²dt/2Δ: ${deg((-360 * f1() ** 2 * intB2) / (2 * st.off))}).` : moved ? '.' : '')
      : `Last: waited ${sec(a.T)}.${moved ? `${moved}.` : ''}`;
    st.act = null;
  }
  function start(kind, key, rate) {
    if (st.act) finish();
    const fermi = kind === 'pulse' && st.env === 'fermi';
    st.act = kind === 'pulse' ? { kind, fermi, phase: PHASES[key][0], name: PHASES[key][1], T: fermi ? FERMI_T : st.dur, done: 0, dphi: 0, rate }
      : { kind, T: st.dur, done: 0, dphi: 0 };
    const L = larmor(st.m, st.th); if (Math.hypot(L[0], L[1]) > 1e-3) st.act.lastP = Math.atan2(L[1], L[0]);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    render();
  }
  slide.querySelectorAll('[data-fp-pulse]').forEach((b) => b.addEventListener('click', () => { b.blur(); start('pulse', b.dataset.fpPulse); }));
  slide.querySelector('.fp-wait').addEventListener('click', (e) => { e.currentTarget.blur(); start('wait'); });
  slide.querySelector('.fp-finish').addEventListener('click', (e) => { e.currentTarget.blur(); finish(); render(); });
  slide.querySelector('.fp-reset').addEventListener('click', (e) => {
    e.currentTarget.blur(); st.act = null; st.m = [0, 1, 0]; st.th = 0; st.trailL = []; st.trailR = []; st.log = ''; render();
  });
  // arrow keys fire pulses on this slide, as in the T2 lab (→ +x, ← −x, ↑ +y, ↓ −y)
  const KEYS = { ArrowRight: 'px', ArrowLeft: 'mx', ArrowUp: 'py', ArrowDown: 'my' };
  window.addEventListener('keydown', (e) => {
    if (Reveal.getCurrentSlide() !== slide || !KEYS[e.key] || e.target.tagName === 'INPUT') return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!e.repeat) start('pulse', KEYS[e.key]);
  }, true);

  // ---- controls ----
  const ctl = (cls) => slide.querySelector(`.${cls}`), out = (cls, html) => { ctl(`${cls}-read`).innerHTML = html; };
  function bind(cls, toState, show) {
    const el = ctl(cls);
    el.addEventListener('input', () => { toState(Number(el.value)); show(); render(); });
    el.addEventListener('keydown', (e) => e.stopPropagation());
    return el;
  }
  const showOff = () => out('fp-off', hz(st.off, 1));
  const offEl = bind('fp-off', (s) => { st.off = OFF_MAX * s ** 3; }, showOff);
  offEl.value = Math.cbrt(st.off / OFF_MAX); showOff();
  slide.querySelectorAll('[data-fp-off]').forEach((b) => b.addEventListener('click', () => {
    b.blur(); st.off = Number(b.dataset.fpOff); offEl.value = Math.cbrt(st.off / OFF_MAX); showOff(); render();
  }));
  const showB1 = () => { out('fp-b1', `${(st.b1 * 1e6).toFixed(1)} µT (f<sub>1</sub> = ${hz(f1())})`); showDur(); };
  const showDur = () => out('fp-dur', st.env === 'fermi' ? `${sec(st.dur)} waits; pulses 8 ms (${(360 * f1() * BS.INT_B).toFixed(0)}°)`
    : `${sec(st.dur)} (${(360 * f1() * st.dur).toFixed(0)}° on resonance)`);
  bind('fp-b1', (v) => { st.b1 = v * 1e-6; }, showB1); showB1();
  const durEl = bind('fp-dur', (v) => { st.dur = 10 ** v; }, showDur);
  durEl.value = Math.log10(st.dur); showDur();
  ctl('fp-90').addEventListener('click', (e) => { e.currentTarget.blur(); if (f1() > 0) { st.dur = 0.25 / f1(); durEl.value = Math.log10(st.dur); showDur(); } });
  const setEnv = (v) => { st.env = v; slide.querySelectorAll('[data-fpenv]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.fpenv === v))); showDur(); };
  segToggle(slide, 'fpenv', setEnv);
  // realistic: the Bloch–Siegert pulse of Sacolick et al. (Fermi, 8 ms, 10 µT peak, ±4 kHz) from M along +y, played over 3 s
  ctl('fp-real').addEventListener('click', (e) => {
    e.currentTarget.blur();
    st.act = null; st.m = [0, 1, 0]; st.th = 0; st.trailL = []; st.trailR = [];
    setEnv('fermi');
    st.b1 = 10e-6; ctl('fp-b1').value = 10; showB1();
    st.off = st.off < 0 ? -4000 : 4000; offEl.value = Math.cbrt(st.off / OFF_MAX); showOff();
    start('pulse', 'px', FERMI_T / REAL_SCREEN);
  });
  const showRate = () => out('fp-rate', `1 s = ${sec(st.rate)}`);
  const rateEl = bind('fp-rate', (v) => { st.rate = 10 ** v; }, showRate);
  rateEl.value = Math.log10(st.rate); showRate();
  ctl('fp-auto').addEventListener('click', (e) => { e.currentTarget.blur(); st.rate = 0.5 / Math.max(fEff(), 1); rateEl.value = Math.log10(st.rate); showRate(); render(); });

  // ---- drag either view to turn both ----
  slide.querySelectorAll('canvas').forEach((c) => {
    let drag = null;
    c.style.touchAction = 'none';
    c.addEventListener('pointerdown', (e) => { drag = [e.clientX, e.clientY, view.az, view.el]; c.setPointerCapture(e.pointerId); e.stopPropagation(); });
    c.addEventListener('pointermove', (e) => {
      if (!drag) return;
      view.az = drag[2] + (e.clientX - drag[0]) * 0.01;
      view.el = Math.max(-1.5, Math.min(1.5, drag[3] + (e.clientY - drag[1]) * 0.01));
      if (!raf) render();
    });
    c.addEventListener('pointerup', () => { drag = null; });
    for (const type of ['touchstart', 'touchmove']) c.addEventListener(type, (e) => e.stopPropagation());
  });

  onShow(slide, render);
  Reveal.on('slidechanged', (e) => { if (e.currentSlide !== slide && st.act) { finish(); render(); } });
})();
