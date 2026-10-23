// Inverse standard normal CDF (Acklam's approximation), for an evenly sampled Gaussian spread of frequencies.
function normInv(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.3577518672690, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const tail = (q) => (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  if (p < 0.02425) return tail(Math.sqrt(-2 * Math.log(p)));
  if (p > 1 - 0.02425) return -tail(Math.sqrt(-2 * Math.log(1 - p)));
  const r = p - 0.5, t = r * r;
  return (((((a[0] * t + a[1]) * t + a[2]) * t + a[3]) * t + a[4]) * t + a[5]) * r / (((((b[0] * t + b[1]) * t + b[2]) * t + b[3]) * t + b[4]) * t + 1);
}

/* Problem N: navigation. Full-height zones at the left and right edges (a grey bar and an arrow on hover)
 * replace Reveal's corner arrows, which sat on the slide number. */
(function () {
  'use strict';
  if (!window.Reveal) return;
  const zone = (cls, label, arrow, go) => {
    const b = document.createElement('button');
    b.className = `nav-zone ${cls}`; b.setAttribute('aria-label', label); b.textContent = arrow;
    b.addEventListener('click', (e) => { e.currentTarget.blur(); go(); });
    document.body.appendChild(b);
    return b;
  };
  const prev = zone('prev', 'Previous slide', '‹', () => window.Reveal.prev());
  const next = zone('next', 'Next slide', '›', () => window.Reveal.next());
  const update = () => {
    const { h } = window.Reveal.getIndices();
    prev.hidden = h === 0;
    next.hidden = h === window.Reveal.getTotalSlides() - 1;
  };
  window.Reveal.on('ready', update);
  window.Reveal.on('slidechanged', update);
  if (window.Reveal.isReady()) update();
})();

/* Problem N, part 1: the controls. One on-resonance spin, no relaxation.
 * Holding an arrow key turns on B1 along ±x or ±y (drawn in orange) and the magnetization rotates around it. */
(function () {
  'use strict';

  const RATE = Math.PI / 2;  // rad per second while a key is held: a 90° rotation takes 1 s
  const KEYS = { ArrowRight: [1, 0, '+x'], ArrowLeft: [-1, 0, '−x'], ArrowUp: [0, 1, '+y'], ArrowDown: [0, -1, '−y'] };
  const B1_COLOUR = '#e8770e', B1_COLOR_TEXT = '#c25f00', M_COLOUR = '#1f5f99', AXIS = '#9aa5b1', INK = '#1d2733';

  if (!document.querySelector('canvas.bloch')) return;  // not on this page
  const slide = document.querySelector('canvas.bloch').closest('section');
  const canvas = slide.querySelector('canvas.bloch'), g = canvas.getContext('2d');
  let m = [0, 0, 1], held = null, last = null;
  let trail = [], turned = 0;  // the tip's path (cleared by Reset), and the angle turned during the current hold
  const readout = slide.querySelector('.tut-readout');
  let az = -0.6, el = 0.45;

  // Right-hand rotation of v by angle a about the unit axis n = (nx, ny, 0).
  function rotate(v, nx, ny, a) {
    const c = Math.cos(a), s = Math.sin(a), d = nx * v[0] + ny * v[1];
    return [
      v[0] * c + ny * v[2] * s + nx * d * (1 - c),
      v[1] * c - nx * v[2] * s + ny * d * (1 - c),
      v[2] * c + (nx * v[1] - ny * v[0]) * s,
    ];
  }

  // Orthographic view: turn about z by az, tilt by el. Screen y points up.
  function proj(v) {
    const W = canvas.width, H = canvas.height, R = 0.36 * Math.min(W, H);
    const x1 = v[0] * Math.cos(az) - v[1] * Math.sin(az), y1 = v[0] * Math.sin(az) + v[1] * Math.cos(az);
    const sy = v[2] * Math.cos(el) + y1 * Math.sin(el);
    return [W / 2 + R * x1, H / 2 + 0.04 * H - R * sy];
  }

  function line(a, b, colour, width, dash) {
    const p = proj(a), q = proj(b);
    g.strokeStyle = colour; g.lineWidth = width; g.setLineDash(dash || []);
    g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); g.setLineDash([]);
  }
  function arrow(v, colour, width) {
    line([0, 0, 0], v, colour, width);
    const p = proj(v), o = proj([0, 0, 0]), ang = Math.atan2(p[1] - o[1], p[0] - o[0]), h = 26;
    g.fillStyle = colour; g.beginPath(); g.moveTo(p[0], p[1]);
    g.lineTo(p[0] - h * Math.cos(ang - 0.4), p[1] - h * Math.sin(ang - 0.4));
    g.lineTo(p[0] - h * Math.cos(ang + 0.4), p[1] - h * Math.sin(ang + 0.4)); g.closePath(); g.fill();
  }
  function label(v, text, colour, bold) {
    const p = proj(v);
    g.fillStyle = colour; g.font = `${bold ? '700 ' : ''}34px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, p[0], p[1]);
  }

  function draw() {
    g.clearRect(0, 0, canvas.width, canvas.height);
    // transverse circle
    g.strokeStyle = '#d8dee6'; g.lineWidth = 2; g.beginPath();
    for (let i = 0; i <= 96; i++) { const a = i / 96 * 2 * Math.PI, p = proj([Math.cos(a), Math.sin(a), 0]); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
    g.stroke();
    // axes; the one carrying B1 turns orange
    const b1 = held && KEYS[held];
    for (const [nx, ny, name] of Object.values(KEYS)) {
      const on = b1 && b1[0] === nx && b1[1] === ny;
      line([0, 0, 0], [1.2 * nx, 1.2 * ny, 0], on ? B1_COLOUR : AXIS, on ? 8 : 2);
      label([1.36 * nx, 1.36 * ny, 0], name, on ? B1_COLOUR : '#5b6776', on);
    }
    line([0, 0, -1.2], [0, 0, 1.2], AXIS, 2);
    label([0, 0, 1.34], 'z', '#5b6776');
    if (b1) label([0.95 * b1[0], 0.95 * b1[1], 0.22], 'B₁', B1_COLOUR, true);
    // the tip's path: a circle when M is perpendicular to B1, a cone's rim otherwise
    if (trail.length > 1) {
      g.strokeStyle = 'rgba(31, 95, 153, 0.45)'; g.lineWidth = 3; g.beginPath();
      trail.forEach((v, k) => { const q = proj(v); k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); });
      g.stroke();
    }
    // magnetization, with its shadow on the transverse plane
    line([0, 0, 0], [m[0], m[1], 0], '#b8c2cc', 3, [10, 8]);
    line([m[0], m[1], 0], m, '#b8c2cc', 2, [4, 6]);
    arrow(m, M_COLOUR, 9);
    label([1.12 * m[0], 1.12 * m[1], 1.12 * m[2] + 0.06], 'M', INK, true);
  }

  function tick(now) {
    if (!held) { last = null; return; }
    if (last !== null) {
      const [nx, ny] = KEYS[held];
      const da = RATE * Math.min((now - last) / 1000, 0.1);
      m = rotate(m, nx, ny, da);
      const n = Math.hypot(m[0], m[1], m[2]); m = m.map((c) => c / n);  // keep |M| = 1 against round-off
      turned += da; trail.push(m.slice()); if (trail.length > 2000) trail.shift();
      showTurn();
    }
    last = now;
    draw();
    requestAnimationFrame(tick);
  }

  const onThisSlide = () => window.Reveal && window.Reveal.getCurrentSlide() === slide;
  function showTurn() {
    if (!readout) return;
    const tilt = Math.acos(Math.max(-1, Math.min(1, m[2]))) * 180 / Math.PI;
    readout.innerHTML = held ? `Rotating about <b style="color:${B1_COLOR_TEXT}">${KEYS[held][2]}</b>: ${Math.round(turned * 180 / Math.PI)}°`
      : `M is ${Math.round(tilt)}° from +z.`;
  }
  function press(key) { if (held === key) return; held = key; last = null; turned = 0; if (!trail.length) trail.push(m.slice()); showTurn(); draw(); requestAnimationFrame(tick); }
  function release(key) {
    if (key && held !== key) return;
    if (held && readout) readout.innerHTML = `Turned <b>${Math.round(turned * 180 / Math.PI)}°</b> about ${KEYS[held][2]}. M is now ${Math.round(Math.acos(Math.max(-1, Math.min(1, m[2]))) * 180 / Math.PI)}° from +z.`;
    held = null; draw();
  }

  // Capture phase, so Reveal never sees the arrow keys on this slide.
  window.addEventListener('keydown', (e) => {
    if (!(e.key in KEYS) || !onThisSlide()) return;
    e.preventDefault(); e.stopPropagation();
    if (!e.repeat) press(e.key);
  }, true);
  window.addEventListener('keyup', (e) => {
    if (!(e.key in KEYS) || !onThisSlide()) return;
    e.preventDefault(); e.stopPropagation();
    release(e.key);
  }, true);
  window.addEventListener('blur', () => release());
  if (window.Reveal) window.Reveal.on('slidechanged', () => release());

  slide.querySelector('[data-tutorial-reset]').addEventListener('click', (e) => { e.currentTarget.blur(); m = [0, 0, 1]; trail = []; turned = 0; showTurn(); draw(); });

  // Drag to turn the view; keep the gesture away from Reveal's swipe navigation.
  let drag = null;
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', (e) => { drag = [e.clientX, e.clientY, az, el]; canvas.setPointerCapture(e.pointerId); e.stopPropagation(); });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    az = drag[2] + (e.clientX - drag[0]) * 0.01;
    el = Math.max(-1.5, Math.min(1.5, drag[3] + (e.clientY - drag[1]) * 0.01));
    draw();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  for (const type of ['touchstart', 'touchmove']) canvas.addEventListener(type, (e) => e.stopPropagation());

  showTurn(); draw();
})();

/* Problem N, the echo game. Part 1 uses it with free timing (opts.free: pulses fire when pressed, and markers show
 * the spin and stimulated echoes they will make). Part 2 uses it on the beat: the game (with its T2 fit), then again
 * with B1 inhomogeneity, without crushers, with them, with a stronger error, and a sandbox.
 * Fixed settings: T2 = 80 ms, T1 infinite, an even fan of spins drifting ±60° by each 180°. Each game sets its
 * excitation and refocusing angles (opts.exc, opts.flip): 90° and 180° when B1 is right. With opts.crush, crushers
 * around each refocusing pulse spoil what it tips into the plane from magnetization that was never transverse.
 * Pulses are instantaneous in scan time; the clock pauses while the 3D view animates each one. */
function makeEchoGame(slide, fitSlide, opts) {
  'use strict';

  const BOX = 2.5, ANIM = 0.25, PRE = 12, DT = 0.02;  // ms; ANIM: s per pulse
  let NSPIN = 385, DRAW_EVERY = 16;  // spins simulated, and every DRAW_EVERY-th drawn (25 of them); more for the Lorentzian fan
  // The settings (ms, degrees; RATE: ms of scan per second; SPREAD_DEG: the edge spins' drift in τ). Fixed for the
  // game slides; the sandbox passes opts.settings(), read again at each reset.
  let TAU = 10, NSLOT = 10, T2 = 80, T1 = Infinity, EXC = opts.exc, FLIP = opts.flip, CRUSH = !!opts.crush;
  let RATE = 6, SPREAD_DEG = 60, FAN = 'even', END, SPREAD;
  function applySettings() {
    if (opts.settings) ({ TAU, NSLOT, T2, T1, EXC, FLIP, CRUSH, RATE, SPREAD_DEG, FAN } = { TAU, NSLOT, T2, T1, EXC, FLIP, CRUSH, RATE, SPREAD_DEG, FAN, ...opts.settings() });
    if (fanSel) { if (fanSel.dataset.ready) FAN = fanSel.value; else { fanSel.value = FAN; fanSel.dataset.ready = '1'; } }  // starts on the slide's own fan
    // the Lorentzian fan's long tails need more spins for its signal to follow e^(−t/T2′) closely
    [NSPIN, DRAW_EVERY] = FAN === 'lorentz' ? [1537, 64] : [385, 16];
    END = opts.free ? opts.end : 2 * NSLOT * TAU + 12;
    SPREAD = SPREAD_DEG * Math.PI / 180 / TAU;
  }
  const KEYS = { ArrowRight: [0, '→', '+x'], ArrowUp: [90, '↑', '+y'], ArrowLeft: [180, '←', '−x'], ArrowDown: [270, '↓', '−y'] };
  const C = { ink: '#1d2733', muted: '#5b6776', rule: '#d8dee6', exc: '#1f5f99', ref: '#c0392b', echo: '#2e8b3a', sig: '#1f5f99' };
  const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const WIN = 100, NOWF = 0.15;  // the time panels show 100 ms, with "now" 15% from the left

  const seqC = slide.querySelector('canvas.game-seq'), sigC = slide.querySelector('canvas.game-sig'), spC = slide.querySelector('canvas.game-3d');
  const status = slide.querySelector('.game-status'), viewSel = slide.querySelector('select.game-view');
  const fanSel = slide.querySelector('select.game-fan');  // even or Gaussian spread of frequencies, where the slide offers it
  let results = null;  // { te: [], m: [], hit: [] } from the last finished game

  function rotAxis(v, phaseDeg, ang) {
    const p = phaseDeg * Math.PI / 180, nx = Math.cos(p), ny = Math.sin(p);
    const c = Math.cos(ang), s = Math.sin(ang), d = nx * v[0] + ny * v[1];
    return [v[0] * c + ny * v[2] * s + nx * d * (1 - c), v[1] * c - nx * v[2] * s + ny * d * (1 - c), v[2] * c + (nx * v[1] - ny * v[0]) * s];
  }
  function rotZ(v, th) { const c = Math.cos(th), s = Math.sin(th); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]; }

  // Each spin's frequency offset, in units of SPREAD, by its rank i among NSPIN.
  //  even: evenly spaced in [−1, 1] (a box: the signal decays as a sinc, with ripples).
  //  gauss: normal quantiles with σ = 0.71 (the signal decays as a Gaussian, about as fast as the box).
  //  lorentz: Cauchy quantiles with half-width ½ (the signal decays as an exponential, e^(−t/T2′) with
  //    T2′ = 2/SPREAD, about as fast as the box; this is the spread behind T2*: 1/T2* = 1/T2 + 1/T2′).
  function fanOffset(i) {
    const q = (i + 0.5) / NSPIN;
    if (FAN === 'gauss') return Math.SQRT1_2 * normInv(q);
    if (FAN === 'lorentz') return 0.5 * Math.tan(Math.PI * (q - 0.5));
    return 2 * i / (NSPIN - 1) - 1;
  }

  // ---- simulation ----
  let S;
  function reset() {
    applySettings();
    S = {
      t: -PRE, running: false, anim: null,
      // Each spin is split in two (the Bloch equations are linear): v has been transverse at some point (echoes,
      // stimulated echoes); u has only ever been longitudinal (before the excitation, its leftover, T1 recovery).
      // even fan: offsets evenly spaced in [−1, 1]; Gaussian: normal quantiles with σ = 0.71, which falls to 37% about when the even fan does
      spins: Array.from({ length: NSPIN }, (_, i) => ({ w: SPREAD * fanOffset(i), v: [0, 0, 0], u: [0, 0, 1] })),
      ref: [0, 0, 1],  // the on-resonance spin's direction, for the colours
      pulses: [{ t: 0, phase: 0, angle: EXC, lab: '+x', exc: true, pending: true }],
      slots: opts.free ? [] : Array.from({ length: NSLOT }, (_, k) => ({ t: (2 * k + 1) * TAU, hit: null, missed: false })),
      echoes: opts.free ? [] : Array.from({ length: NSLOT }, (_, k) => ({ t: 2 * (k + 1) * TAU, m: null })),
      marks: [],  // free timing: the echoes the pulses so far will make
      hist: [],
    };
    say('');
  }
  function sumMxy() {
    let x = 0, y = 0;
    for (const sp of S.spins) { x += sp.v[0]; y += sp.v[1]; }
    return Math.hypot(x, y) / S.spins.length;
  }
  function step(dt) {
    const t0 = S.t, E2 = Math.exp(-dt / T2), E1 = Math.exp(-dt / T1);
    for (const sp of S.spins) {
      const v = rotZ(sp.v, sp.w * dt);
      sp.v = [v[0] * E2, v[1] * E2, v[2] * E1];
      sp.u = [0, 0, 1 - (1 - sp.u[2]) * E1];  // u is purely longitudinal between pulses
    }
    S.t += dt;
    S.hist.push([S.t, sumMxy()]);
    for (const e of S.echoes) if (e.m === null && t0 < e.t && S.t >= e.t) e.m = S.hist[S.hist.length - 1][1];
    for (const sl of S.slots) if (!sl.hit && !sl.missed && S.t >= sl.t + BOX) { sl.missed = true; say('Missed!', C.muted); }
    if (S.t >= END) finish();
  }
  function finish() {
    S.running = false;
    if (opts.free) { say(opts.done, C.ink); return; }
    results = {
      te: S.echoes.map((e) => e.t), m: S.echoes.map((e) => e.m), hit: S.slots.map((sl) => !!sl.hit),
      pulses: S.slots.map((sl, k) => ({
        pulse: k + 1, beat_ms: sl.t,
        ...(sl.hit
          ? { key: sl.hit.key, axis: sl.hit.lab, phase_deg: sl.hit.phase, angle_deg: sl.hit.angle, pressed_ms: +sl.hit.pressT.toFixed(3),
              offset_ms: +(sl.hit.pressT - sl.t).toFixed(3), in_box: sl.hit.inBox, fired_ms: +sl.hit.t.toFixed(3) }
          : { missed: true }),
      })),
      finished: new Date().toISOString(),
    };
    say(opts.done, C.ink);
    if (opts.sandbox) showSandboxFits();
  }
  // Rotate every spin (and the reference) by `ang` about the pulse axis.
  function rotateAll(p, ang) {
    for (const sp of S.spins) { sp.v = rotAxis(sp.v, p.phase, ang); sp.u = rotAxis(sp.u, p.phase, ang); }
    S.ref = rotAxis(S.ref, p.phase, ang);
  }
  function startPulse(p, replay) {
    p.pending = false;
    S.anim = { p, f: 0, replay: replay || 0 };
    if (opts.free) S.marks = predictEchoes();
  }

  // Free timing: every echo the pulses so far will make, from their times, angles and axes. Each part of the signal
  // is followed through every pulse (the extended phase graph): a pulse of angle α refocuses it (like a 180°, share
  // sin²(α/2)), leaves it alone (like a 0°, cos²(α/2)) or tips it to or from z (like a 90°: ½ sin α into z, sin α
  // back out, cos α stays). The shares carry a phase set by the pulse axis, so echoes that meet can add or cancel.
  // An echo forms when a part's dephasing comes back to zero before the next pulse; it is a stimulated echo if it spent
  // time along z after being transverse. Relaxation: T2 while transverse, T1 while along z.
  function predictEchoes() {
    const ps = S.pulses.filter((p) => !p.pending).sort((a, b) => a.t - b.t), out = [];
    const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
    const cis = (x, r = 1) => [r * Math.cos(x), r * Math.sin(x)];
    // q: +1 (F+), −1 (F−) or 0 (Z) after pulse j; W: dephasing so far; amp: complex amplitude
    const follow = (j, q, W, amp, trans, stim) => {
      const tj = ps[j].t, tn = j + 1 < ps.length ? ps[j + 1].t : END;
      if (q !== 0 && j > 0) {
        const te = tj - W / q;
        if (te > tj + 1e-6 && te <= tn + 1e-6) {
          const a = amp.map((x) => x * Math.exp(-(te - tj) / T2));
          out.push({ t: te, c: q > 0 ? a : [a[0], -a[1]], stim });  // the signal is F+; an F− part shows as its conjugate
        }
      }
      if (j + 1 >= ps.length) return;
      const dt = tn - tj, decay = Math.exp(-dt / (q === 0 ? T1 : T2)), a = ps[j + 1].angle * Math.PI / 180, f = ps[j + 1].phase * Math.PI / 180;
      const c2 = Math.cos(a / 2) ** 2, s2 = Math.sin(a / 2) ** 2, sa = Math.sin(a);
      const next = q === 1 ? [[1, [c2, 0]], [-1, cis(-2 * f, s2)], [0, mul([0, -0.5], cis(-f, sa))]]
        : q === -1 ? [[-1, [c2, 0]], [1, cis(2 * f, s2)], [0, mul([0, 0.5], cis(f, sa))]]
          : [[1, mul([0, -1], cis(f, sa))], [-1, mul([0, 1], cis(-f, sa))], [0, [Math.cos(a), 0]]];
      for (const [q2, k] of next) {
        if (Math.hypot(k[0], k[1]) < 1e-9) continue;
        follow(j + 1, q2, W + q * dt, mul(amp, k).map((x) => x * decay), trans || q2 !== 0, stim || (trans && q2 === 0));
      }
    };
    const e = EXC * Math.PI / 180, f0 = ps[0].phase * Math.PI / 180;
    follow(0, 1, 0, mul([0, -1], cis(f0, Math.sin(e))), true, false);  // what the excitation tipped into the plane
    follow(0, 0, 0, [Math.cos(e), 0], false, false);                    // and what it left along z
    out.sort((a, b) => a.t - b.t);
    const merged = [];
    for (const x of out) {
      const m = merged[merged.length - 1];
      if (m && x.t - m.t < 0.3) { m.c = [m.c[0] + x.c[0], m.c[1] + x.c[1]]; m.se = m.se || !x.stim; m.ste = m.ste || x.stim; }
      else merged.push({ t: x.t, c: x.c, se: !x.stim, ste: x.stim });
    }
    return merged.map((m) => ({ ...m, amp: Math.hypot(m.c[0], m.c[1]) })).filter((m) => m.amp >= 0.01);
  }

  function animate(frac) {  // advance the current pulse's rotation by frac of its angle; the clock stays put
    const a = S.anim, f1 = Math.min(a.f + frac, 1);
    rotateAll(a.p, (f1 - a.f) * a.p.angle * Math.PI / 180);
    a.f = f1;
    if (f1 >= 1) {
      // Whatever the pulse tipped from u into the transverse plane joins v, except after a refocusing pulse with
      // crushers: magnetization that was longitudinal before the pulse only sees the second lobe, and is spoiled.
      // Echo magnetization parked along z earlier is in v, so it still comes back as stimulated echoes.
      const keep = a.p.exc || !CRUSH;
      for (const sp of S.spins) {
        if (keep) sp.v = [sp.v[0] + sp.u[0], sp.v[1] + sp.u[1], sp.v[2]];
        sp.u = [0, 0, sp.u[2]];
      }
      if (a.replay) for (const sp of S.spins) sp.v = rotZ(sp.v, sp.w * a.replay);
      S.anim = null;
    }
  }
  function advance(ms) {
    while (ms > 1e-9 && S.running && !S.anim) {
      const q = S.pulses.find((p) => p.pending);
      let d = Math.min(DT, ms);
      if (q && S.t < q.t) d = Math.min(d, q.t - S.t);
      step(d); ms -= d;
      if (q && S.running && S.t >= q.t - 1e-9) startPulse(q);
    }
  }
  function press(key) {
    if (!S.running) return;
    if (opts.free) {  // free timing: the pulse fires the moment the key is pressed
      if (S.pulses[0].pending || S.t < 0) return;
      if (S.pulses.filter((p) => !p.exc).length >= opts.maxPulses) { say(`That’s all ${opts.maxPulses === 1 ? 'the pulse' : `${opts.maxPulses} pulses`} for this slide.`, C.muted); return; }
      const k = KEYS[key], p = { t: S.t, phase: k[0], angle: FLIP, lab: k[2], sym: k[1], key, pending: true };
      if (S.anim) animate(1);
      S.pulses.push(p); startPulse(p);
      say(`${FLIP}° about ${k[2]} at <i>t</i> = ${S.t.toFixed(1)} ms`, C.ink);
      return;
    }
    const k = KEYS[key], slot = S.slots.find((sl) => !sl.hit && !sl.missed && S.t >= sl.t - TAU && S.t < sl.t + BOX);
    if (!slot) return;
    const d = S.t - slot.t, inBox = Math.abs(d) <= BOX;
    const p = { t: inBox ? slot.t : S.t, phase: k[0], angle: FLIP, lab: k[2], sym: k[1], key, pressT: S.t, inBox, pending: true };
    if (S.anim) animate(1);  // finish any pulse still turning before this one
    S.pulses.push(p); slot.hit = p;
    if (inBox && d < 0) { /* early, inside the box: fires when the clock reaches the beat */ }
    else if (inBox) { for (const sp of S.spins) sp.v = rotZ(sp.v, -sp.w * d); startPulse(p, d); }  // late: rewind to the beat, pulse, replay
    else startPulse(p);  // early, outside the box: fires now
    say(inBox ? 'Perfect!' : `Early by ${Math.abs(d).toFixed(1)} ms`, inBox ? C.echo : C.ref);
  }
  function say(html, colour) { status.innerHTML = html; status.style.color = colour || C.ink; }

  // ---- drawing ----
  const tx = (t, W) => W * NOWF + (t - S.t) * W / WIN;
  function ctx(c, w) { const g = c.getContext('2d'), k = c.width / w; g.setTransform(k, 0, 0, k, 0, 0); g.clearRect(0, 0, w, c.height / k); return [g, w, c.height / k]; }
  function text(g, s, x, y, colour, size, align, bold) { g.fillStyle = colour; g.font = `${bold ? '700 ' : ''}${size}px ${FONT}`; g.textAlign = align || 'center'; g.fillText(s, x, y); }
  function nowLine(g, W, H) { g.strokeStyle = C.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(W * NOWF, 0); g.lineTo(W * NOWF, H); g.stroke(); g.lineWidth = 1; }

  function drawSeq() {
    const [g, W, H] = ctx(seqC, 760), yb = 100, bw = BOX * W / WIN;
    g.strokeStyle = '#999'; g.beginPath(); g.moveTo(0, yb); g.lineTo(W, yb); g.stroke();
    for (const sl of S.slots) {
      const x = tx(sl.t, W);
      if (x < -40 || x > W + 40) continue;
      if (!sl.hit && !sl.missed) {
        g.fillStyle = 'rgba(192,57,43,0.07)'; g.fillRect(x - bw, 12, 2 * bw, H - 18);
        g.setLineDash([5, 4]); g.strokeStyle = C.ref; g.lineWidth = 2; g.strokeRect(x - bw, yb + 12, 2 * bw, 36); g.setLineDash([]); g.lineWidth = 1;
        text(g, '?', x, yb + 37, '#999', 20);
      } else if (sl.missed) text(g, 'missed', x, yb + 36, '#bbb', 13);
    }
    for (const e of S.marks) {  // free timing: SE (green), STE (purple), both (amber); height and label give the size
      const x = tx(e.t, W), h = 16 + 56 * Math.min(1, e.amp), col = e.se && e.ste ? '#b9770e' : e.ste ? '#8e44ad' : C.echo;
      g.strokeStyle = col; g.lineWidth = 2; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(x, yb); g.lineTo(x, yb - h); g.stroke(); g.setLineDash([]); g.lineWidth = 1;
      text(g, `${e.se && e.ste ? 'SE+STE' : e.ste ? 'STE' : 'SE'} ${Math.round(100 * e.amp)}%`, x, yb - h - 5, col, 12, 'center', true);
    }
    for (const p of S.pulses) {
      const x = tx(p.t, W), h = p.exc ? 42 : 72;
      g.fillStyle = p.exc ? C.exc : C.ref; g.fillRect(x - 3, yb - h, 6, h);
      text(g, `${p.angle}° ${p.lab}`, x, yb - h - 7, C.ink, 13, 'center', true);
      if (!p.exc && opts.free) text(g, p.sym, x, yb + 30, C.ink, 20);
      else if (!p.exc) {
        g.fillStyle = '#e8f3e8'; g.strokeStyle = C.echo; g.lineWidth = 2; g.fillRect(x - bw, yb + 12, 2 * bw, 36); g.strokeRect(x - bw, yb + 12, 2 * bw, 36); g.lineWidth = 1;
        text(g, p.sym, x, yb + 37, C.ink, 20);
      }
    }
    for (const e of S.echoes) {
      const x = tx(e.t, W);
      g.strokeStyle = C.echo; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x, yb - 24); g.lineTo(x, yb); g.stroke(); g.setLineDash([]);
      text(g, 'ACQ', x, yb - 29, C.echo, 12);
    }
    if (CRUSH) {  // crusher gradient lobes on either side of each refocusing pulse, on their own row
      const gb = H - 10, gh = 14, lobe = (t0, t1) => {
        const x0 = tx(t0, W), x1 = tx(t1, W), r = 0.4 * W / WIN;
        g.beginPath(); g.moveTo(x0, gb); g.lineTo(x0 + r, gb - gh); g.lineTo(x1 - r, gb - gh); g.lineTo(x1, gb); g.closePath(); g.fill();
      };
      g.strokeStyle = '#999'; g.beginPath(); g.moveTo(0, gb); g.lineTo(W, gb); g.stroke();
      text(g, 'G', 4, gb - 3, C.muted, 12, 'left');
      g.fillStyle = '#7f8c99';
      for (const sl of S.slots) { const t = sl.hit ? sl.hit.t : sl.t; lobe(t - 3.6, t - 0.8); lobe(t + 0.8, t + 3.6); }
    }
    nowLine(g, W, H);
  }
  function drawSig() {
    const [g, W, H] = ctx(sigC, 760), y = (m) => H - 18 - m * (H - 36);
    g.strokeStyle = C.rule; g.beginPath(); g.moveTo(0, y(0)); g.lineTo(W, y(0)); g.stroke();
    text(g, '1', 5, y(1) + 5, C.muted, 13, 'left'); text(g, '0', 5, y(0) - 4, C.muted, 13, 'left');
    if (opts.sandbox) {  // the sandbox shows the true T2 envelope, e^(−t/T2), dashed
      g.strokeStyle = C.echo; g.setLineDash([6, 4]); g.beginPath(); let on = false;
      for (let t = 0; t <= END + WIN; t += 1) { const X = tx(t, W); if (X < 0) continue; const Y = y(Math.exp(-t / T2)); on ? g.lineTo(X, Y) : g.moveTo(X, Y); on = true; }
      g.stroke(); g.setLineDash([]);
    }
    g.strokeStyle = C.sig; g.lineWidth = 2.5; g.beginPath(); let first = true;
    for (const [t, m] of S.hist) { const X = tx(t, W); if (X < -5) continue; first ? g.moveTo(X, y(m)) : g.lineTo(X, y(m)); first = false; }
    g.stroke(); g.lineWidth = 1;
    for (const e of S.echoes) {
      const X = tx(e.t, W);
      if (e.m !== null) { g.fillStyle = C.ink; g.beginPath(); g.arc(X, y(e.m), 4, 0, 7); g.fill(); }  // the acquired point
    }
    text(g, 'time →', W - 4, H - 4, C.muted, 12, 'right');
    nowLine(g, W, H);
  }

  // 3D view: orthographic, drag to rotate. "3dxy" flattens the spins onto the transverse plane; "2d" looks down z.
  let az = -0.6, el = 0.45, drag = null;
  function proj(v, cx, cy, R) {
    // 2d: looking down z; zx: looking along y, so x across and z up (where pulses about ±y tip the spins)
    const view = viewSel.value, a = view === '2d' || view === 'zx' ? 0 : az, e = view === '2d' ? Math.PI / 2 : view === 'zx' ? 0 : el;
    if (view === '3dxy' || view === '2d') v = [v[0], v[1], 0];
    const x1 = v[0] * Math.cos(a) - v[1] * Math.sin(a), y1 = v[0] * Math.sin(a) + v[1] * Math.cos(a);
    return [cx + R * x1, cy - R * (v[2] * Math.cos(e) + y1 * Math.sin(e)), y1 * Math.cos(e) - v[2] * Math.sin(e)];
  }
  // Black only exactly in phase with the on-resonance spin; light to dark red (ahead) or blue (behind) further off.
  function spinColour(dev) {
    if (Math.abs(dev) < 0.03) return 'rgb(0,0,0)';
    const a = Math.min(Math.abs(dev) / Math.min(Math.PI, SPREAD * TAU), 1);
    const [l, d] = dev > 0 ? [[250, 165, 165], [140, 0, 0]] : [[165, 190, 250], [0, 25, 140]];
    return `rgb(${l.map((c, i) => Math.round(c + (d[i] - c) * a)).join(',')})`;
  }
  function drawSpins() {
    const [g, W, H] = ctx(spC, 380), cx = W / 2, cy = H / 2 + 8, R = 140;
    g.strokeStyle = C.rule; g.beginPath();
    for (let i = 0; i <= 72; i++) { const a = i / 72 * 2 * Math.PI, p = proj([Math.cos(a), Math.sin(a), 0], cx, cy, R); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
    g.stroke();
    const axes = [[[1, 0, 0], '+x →'], [[-1, 0, 0], '−x ←'], [[0, 1, 0], '+y ↑'], [[0, -1, 0], '−y ↓']];
    if (viewSel.value === '3d' || viewSel.value === 'zx') axes.push([[0, 0, 1], 'z'], [[0, 0, -1], '−z']);
    const o = proj([0, 0, 0], cx, cy, R);
    for (const [v, lab] of axes) {
      const p = proj(v.map((c) => c * 1.15), cx, cy, R);
      g.strokeStyle = '#ccc'; g.beginPath(); g.moveTo(o[0], o[1]); g.lineTo(p[0], p[1]); g.stroke();
      text(g, lab, p[0], p[1], C.muted, 13);
    }
    const refPh = Math.atan2(S.ref[1], S.ref[0]);
    const items = S.spins.filter((sp, i) => i % DRAW_EVERY === 0).map((sp) => {
      const m = [sp.v[0] + sp.u[0], sp.v[1] + sp.u[1], sp.v[2] + sp.u[2]];
      let dev = Math.atan2(m[1], m[0]) - refPh; dev = Math.atan2(Math.sin(dev), Math.cos(dev));
      if (Math.hypot(m[0], m[1]) < 0.01) dev = 0;
      return { v: m, col: spinColour(dev), d: proj(m, cx, cy, R)[2] };
    }).sort((a, b) => b.d - a.d);
    for (const it of items) {
      const p = proj(it.v, cx, cy, R);
      g.strokeStyle = it.col; g.lineWidth = 2.5; g.beginPath(); g.moveTo(o[0], o[1]); g.lineTo(p[0], p[1]); g.stroke(); g.lineWidth = 1;
      g.fillStyle = it.col; g.beginPath(); g.arc(p[0], p[1], 3, 0, 7); g.fill();
    }
    let sx = 0, sy = 0; for (const sp of S.spins) { sx += sp.v[0] + sp.u[0]; sy += sp.v[1] + sp.u[1]; }
    const p = proj([sx / NSPIN, sy / NSPIN, 0], cx, cy, R);
    g.strokeStyle = '#000'; g.lineWidth = 5; g.beginPath(); g.moveTo(o[0], o[1]); g.lineTo(p[0], p[1]); g.stroke(); g.lineWidth = 1;
    text(g, 'ΣMxy', p[0] + 6, p[1] - 6, '#000', 12, 'left');
    text(g, `t = ${Math.max(S.t, 0).toFixed(1)} ms`, 8, 16, C.muted, 12, 'left');
  }
  function draw() { drawSeq(); drawSig(); drawSpins(); }

  // ---- loop and input ----
  let last = null, looping = false;
  function frame(now) {
    const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.05);
    last = now;
    if (S.running) {
      const q = S.pulses.find((p) => p.pending);
      if (!S.anim && q && S.t >= q.t - 1e-9) startPulse(q);
      if (S.anim) animate(dt / ANIM); else advance(RATE * dt);
    }
    draw();
    if (S.running || S.anim || drag) requestAnimationFrame(frame); else { looping = false; last = null; }
  }
  function loop() { if (!looping) { looping = true; last = null; requestAnimationFrame(frame); } }
  function play() { reset(); S.running = true; loop(); }
  function playAuto() {  // free timing: the pulses of opts.auto fire on their own, about +y
    reset();
    for (const t of opts.auto) S.pulses.push({ t, phase: 90, angle: FLIP, lab: '+y', sym: '↑', key: 'auto', pending: true });
    S.running = true; loop();
    say(`Pulses on their own at ${opts.auto.join(', ')} ms`, C.ink);
  }

  const on = (s) => window.Reveal && window.Reveal.getCurrentSlide() === s;
  window.addEventListener('keydown', (e) => {
    if (!on(slide)) return;
    if (e.key in KEYS) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) press(e.key); }
    else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); play(); }
    else if (e.key === 'v' || e.key === 'V') { viewSel.selectedIndex = (viewSel.selectedIndex + 1) % viewSel.options.length; draw(); }
  }, true);
  slide.querySelector('[data-game-play]').addEventListener('click', (e) => { e.currentTarget.blur(); play(); });
  const autoBtn = slide.querySelector('[data-game-auto]');
  if (autoBtn) autoBtn.addEventListener('click', (e) => { e.currentTarget.blur(); playAuto(); });
  viewSel.addEventListener('change', () => { viewSel.blur(); draw(); });
  // a new fan shows at once while idle (keeping a finished game's results), otherwise from the next Play
  if (fanSel) fanSel.addEventListener('change', () => { fanSel.blur(); if (!S.running && !results) { reset(); draw(); } });
  spC.addEventListener('pointerdown', (e) => { drag = [e.clientX, e.clientY, az, el]; spC.setPointerCapture(e.pointerId); e.stopPropagation(); loop(); });
  spC.addEventListener('pointermove', (e) => {
    if (!drag) return;
    az = drag[2] + (e.clientX - drag[0]) * 0.01;
    el = Math.max(-1.5, Math.min(1.5, drag[3] + (e.clientY - drag[1]) * 0.01));
  });
  spC.addEventListener('pointerup', () => { drag = null; });
  for (const type of ['touchstart', 'touchmove']) spC.addEventListener(type, (e) => e.stopPropagation());
  if (window.Reveal) window.Reveal.on('slidechanged', (e) => {
    if (e.currentSlide !== slide && S.running) { reset(); draw(); }  // leaving mid-game abandons it
    if (fitSlide && e.currentSlide === fitSlide) { mode = null; const h = fitSlide.querySelector('.fit-hint'); if (h) h.hidden = true; const b = fitSlide.querySelector('[data-fit-run]'); b.textContent = 'Fit'; showFit(); }
  });

  // ---- slide 5: fit S0·e^(−TE/T2) to the echo amplitudes ----
  // Least squares on the amplitudes (not their logs), so a missed, near-zero echo is just a low point.
  function fitT2(te, m) {
    const sse = (t2) => {
      const e = te.map((t) => Math.exp(-t / t2)), s0 = e.reduce((a, x, i) => a + x * m[i], 0) / e.reduce((a, x) => a + x * x, 0);
      return { s0, err: e.reduce((a, x, i) => a + (s0 * x - m[i]) ** 2, 0) };
    };
    let best = 1, bestErr = Infinity;
    for (let t2 = 1; t2 <= 2000; t2 *= 1.01) { const r = sse(t2).err; if (r < bestErr) { bestErr = r; best = t2; } }
    let lo = best / 1.01, hi = best * 1.01;  // golden-section refinement
    for (let i = 0; i < 60; i++) { const a = lo + 0.382 * (hi - lo), b = lo + 0.618 * (hi - lo); if (sse(a).err < sse(b).err) hi = b; else lo = a; }
    const t2 = (lo + hi) / 2;
    return { t2, s0: sse(t2).s0 };
  }
  // Everything needed to reproduce and check a run: the fixed settings, each pulse as pressed, the measurements
  // at full precision, and both fits. Saved as JSON.
  function exportRun() {
    if (!results) return;
    const { te, m } = results, all = fitT2(te, m);
    const run = {
      deck: 'Exercise 2-2 · T2 Mapping', slide: opts.name, exported: new Date().toISOString(), finished: results.finished,
      settings: {
        tau_ms: TAU, echo_spacing_ms: 2 * TAU, n_echoes: NSLOT, T2_ms: T2, T1_ms: T1 === Infinity ? 'Infinity' : T1,
        excitation_deg: EXC, excitation_axis: '+x', refocusing_deg: FLIP, crushers: CRUSH,
        spins: NSPIN, fan: FAN === 'gauss' ? 'Gaussian' : 'even', fan_deg_at_tau: SPREAD_DEG, box_ms: BOX, speed_ms_per_s: RATE,
        signal: '|mean Mxy| over the spins, at each echo time', fit: 'S0·exp(-TE/T2), least squares on the amplitudes',
      },
      pulses: results.pulses,
      measurements: te.map((t, k) => ({ echo: k + 1, te_ms: t, signal: m[k] })),
      fits: {
        all_echoes: { T2_ms: all.t2, S0: all.s0, diff_ms: all.t2 - T2 },
        ...Object.fromEntries(Object.entries({ without_echo_1: 'skip1', even_echoes: 'even', odd_echoes: 'odd' }).map(([name, key]) => {
          const ks = te.map((_, k) => k).filter(FITS[key].pick), g = fitT2(ks.map((k) => te[k]), ks.map((k) => m[k]));
          return [name, { echoes: ks.map((k) => k + 1), T2_ms: g.t2, S0: g.s0, diff_ms: g.t2 - T2 }];
        })),
      },
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' }));
    a.download = `exercise-2-2-${opts.name}-${results.finished.replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // The fit to all echoes, and fits to a subset, offered once the first fit is shown (buttons data-fit-extra="<key>").
  // One fit is shown at a time; the echoes it leaves out are greyed.
  const FITS = {
    all: { label: 'all echoes', pick: () => true, color: '#ff7f0e' },
    skip1: { label: 'without echo 1', pick: (k) => k >= 1, color: '#9467bd' },
    even: { label: 'even echoes (2, 4, …, 10)', short: 'even echoes', pick: (k) => k % 2 === 1, color: '#8c564b' },
    odd: { label: 'odd echoes (1, 3, …, 9)', short: 'odd echoes', pick: (k) => k % 2 === 0, color: '#17becf' },
  };
  let mode = null;  // null until Fit is pressed, then the key of the fit shown

  // The echoes first; the fit, the fitted T2 and the difference only once Fit is pressed.
  function showFit() {
    const out = fitSlide.querySelector('.fit-result'), host = fitSlide.querySelector('.fit-host');
    const btn = fitSlide.querySelector('[data-fit-run]'), extraBtns = fitSlide.querySelectorAll('[data-fit-extra]');
    extraBtns.forEach((b) => { b.hidden = !mode; b.disabled = b.dataset.fitExtra === mode; });
    const hintBtn = fitSlide.querySelector('[data-fit-hint]');
    if (hintBtn) hintBtn.hidden = !mode;
    const exportBtn = fitSlide.querySelector('[data-fit-export]');
    if (exportBtn) exportBtn.disabled = !results;
    if (!results) {
      out.innerHTML = '<p>Play the game on the previous slide first.</p>';
      btn.disabled = true;
      if (host._plot) window.Plotly.purge(host._plot);
      host._plot = null; host.replaceChildren();
      return;
    }
    btn.disabled = mode === 'all';
    if (mode && extraBtns.length) btn.textContent = 'Fit all echoes';
    const { te, m, hit } = results, hits = `<p class="muted small">${hit.filter(Boolean).length} of ${NSLOT} pulses hit.</p>`;
    const fit = mode && FITS[mode], used = te.map((_, k) => !fit || fit.pick(k));
    const ks = te.map((_, k) => k), pts = (keep) => ks.filter((k) => used[k] === keep);
    const data = [
      { x: pts(true).map((k) => te[k]), y: pts(true).map((k) => m[k]), mode: 'markers', name: 'Measurements', marker: { size: 12, color: C.sig }, hovertemplate: 'TE %{x} ms: %{y:.3f}<extra></extra>' },
    ];
    if (pts(false).length) data.push({ x: pts(false).map((k) => te[k]), y: pts(false).map((k) => m[k]), mode: 'markers', name: 'Left out of the fit', marker: { size: 12, color: '#c8ced6' }, hovertemplate: 'TE %{x} ms: %{y:.3f} (not fitted)<extra></extra>' });
    // A train that does not decay pushes the fit to the end of its search range: say so rather than print that bound.
    const t2Text = (t2) => (t2 > 1000 ? '> 1000' : t2.toFixed(1));
    const vsTrue = (t2) => { if (t2 > 1000) return '<b>—</b> (no decay to fit)'; const d = t2 - T2, sign = d >= 0 ? '+' : '−'; return `<b>${sign}${Math.abs(d).toFixed(1)} ms</b> (${sign}${Math.abs(100 * d / T2).toFixed(1)}%)`; };
    if (!fit) out.innerHTML = '<p>Your ten measurements. Press <b>Fit</b> to fit <i>S</i><sub>0</sub>·e<sup>−TE/<i>T</i><sub>2</sub></sup>.</p>' + hits;
    else {
      const g = fitT2(pts(true).map((k) => te[k]), pts(true).map((k) => m[k])), named = extraBtns.length ? `, ${fit.label}` : '';
      out.innerHTML = `<p>Fitted <i>T</i><sub>2</sub>${named}</p><p class="big">${t2Text(g.t2)} ms</p>`
        + `<p>True <i>T</i><sub>2</sub>: ${T2} ms<br>Difference: ${vsTrue(g.t2)}</p>` + hits;
      const tt = Array.from({ length: 221 }, (_, k) => k);
      data.unshift(
        { x: tt, y: tt.map((t) => Math.exp(-t / T2)), mode: 'lines', name: `True decay (T2 = ${T2} ms)`, line: { color: C.echo, dash: 'dash', width: 2 }, hoverinfo: 'skip' },
        { x: tt, y: tt.map((t) => g.s0 * Math.exp(-t / g.t2)), mode: 'lines', name: `Fit${extraBtns.length ? `, ${fit.short || fit.label}` : ''} (T2 = ${t2Text(g.t2)} ms)`, line: { color: fit.color, width: 3 }, hoverinfo: 'skip' },
      );
    }
    const font = { family: 'Times New Roman', size: 18, color: '#333' };
    window.T2Deck.drawFigure(host, {
      data,
      layout: {
        width: 640, height: 460, margin: { l: 80, r: 20, t: 20, b: 70 }, font, showlegend: true,
        legend: { x: 0.36, y: 0.97, font }, plot_bgcolor: '#fff', paper_bgcolor: '#fff',
        xaxis: { title: { text: 'Echo time – TE (ms)', font: { ...font, size: 22 } }, range: [0, 215], zeroline: false, showline: true, mirror: true, linecolor: '#444' },
        yaxis: { title: { text: 'Signal |ΣM<sub>xy</sub>|', font: { ...font, size: 22 } }, range: [0, 1.05], zeroline: false, showline: true, mirror: true, linecolor: '#444' },
      },
    });
  }



  if (fitSlide) {
    fitSlide.querySelector('[data-fit-run]').addEventListener('click', (e) => { e.currentTarget.blur(); mode = 'all'; showFit(); });
    const hint = fitSlide.querySelector('[data-fit-hint]');
    if (hint) hint.addEventListener('click', (e) => { e.currentTarget.blur(); fitSlide.querySelector('.fit-hint').hidden = false; });
    const exp = fitSlide.querySelector('[data-fit-export]');
    if (exp) exp.addEventListener('click', (e) => { e.currentTarget.blur(); exportRun(); });
    fitSlide.querySelectorAll('[data-fit-extra]').forEach((b) => b.addEventListener('click', (e) => {
      e.currentTarget.blur();
      mode = b.dataset.fitExtra;
      showFit();
    }));
    fitSlide.querySelector('[data-fit-again]').addEventListener('click', (e) => {
      e.currentTarget.blur();
      results = null; reset(); draw();
      window.Reveal.slide(window.Reveal.getIndices(slide).h);
    });
  }

  reset(); draw();
  if (fitSlide) showFit();  // the fit slide says to play first until a game is done

  // Sandbox: the four fits in one line once a run ends, and Export.
  function showSandboxFits() {
    const out = slide.querySelector('.sandbox-results'), exp = slide.querySelector('[data-fit-export]');
    if (exp) exp.disabled = !results;
    if (!out) return;
    if (!results) {  // until a run ends, a few experiments to try
      out.innerHTML = '<b>Try:</b> CP (→) against CPMG (↑) at 170°, 160° and 140° · crushers on and off at 80°/160° · '
        + 'no refocusing pulses with the Lorentzian fan: does the fit match 1/<i>T</i><sub>2</sub>* = 1/<i>T</i><sub>2</sub> + 1/<i>T</i><sub>2</sub>′?';
      return;
    }
    const { te, m } = results, ks = te.map((_, k) => k);
    const t2 = (key) => { const sel = ks.filter(FITS[key].pick), g = fitT2(sel.map((k) => te[k]), sel.map((k) => m[k])).t2; return g > 1000 ? '> 1000' : g.toFixed(1); };
    out.innerHTML = `Fitted <i>T</i><sub>2</sub> (true ${T2} ms): all echoes <b>${t2('all')}</b> · without echo 1 <b>${t2('skip1')}</b>`
      + ` · even echoes <b>${t2('even')}</b> · odd echoes <b>${t2('odd')}</b> ms`;
  }
  if (opts.sandbox) {
    const exp = slide.querySelector('[data-fit-export]');
    if (exp) exp.addEventListener('click', (e) => { e.currentTarget.blur(); exportRun(); });
  }

  // test hook (Playwright): drive the game without real time
  return {
    preview() { if (!S.running) { results = null; reset(); draw(); if (opts.sandbox) showSandboxFits(); } },
    get state() { return S; }, get results() { return results; }, press, fitT2,
    play() { reset(); S.running = true; },
    get marks() { return S.marks; },
    auto() { reset(); for (const t of opts.auto) S.pulses.push({ t, phase: 90, angle: FLIP, lab: '+y', sym: '↑', key: 'auto', pending: true }); S.running = true; },
    run(ms) { while (ms > 1e-9 && S.running) { const q = S.pulses.find((p) => p.pending); if (!S.anim && q && S.t >= q.t - 1e-9) startPulse(q); if (S.anim) animate(1); else { const d = Math.min(DT, ms); advance(d); ms -= d; } } },
  };
}

// One game per slide that has one (Problem N is split over two pages).
const echoGame = (cls, fitCls, opts) => {
  const slide = document.querySelector(`section.${cls}`);
  return slide ? makeEchoGame(slide, fitCls ? document.querySelector(`section.${fitCls}`) : null, opts) : null;
};

// Part 1: free timing. T2 = 80 ms, T1 = 1000 ms, a wide Gaussian fan so that each echo is narrow and they stand apart.
const PART1 = { TAU: 10, T2: 80, T1: 1000, SPREAD_DEG: 430, FAN: 'gauss', RATE: 6, CRUSH: false };
window.ProblemNSpinEcho = echoGame('lab-se', null,
  { name: 'spin-echo', free: true, exc: 90, flip: 180, maxPulses: 1, end: 90, settings: () => ({ ...PART1, SPREAD_DEG: 45, FAN: 'even' }), done: 'Done. Press Play to try again.' });
// (the spin echo slide fans out slowly, an even fan reaching ±45° by 10 ms, so it can be followed)
window.ProblemNStimEcho = echoGame('lab-ste', null,
  { name: 'stimulated-echo', free: true, exc: 90, flip: 90, maxPulses: 2, end: 150, settings: () => ({ ...PART1, FLIP: 90, SPREAD_DEG: 200, RATE: 4 }), done: 'Done. Press Play to try again.' });
// (slower here, ±200° by 10 ms at 4 ms of scan per second: still fast enough that echoes 10 ms apart stand apart)
window.ProblemNImperfect = (() => {
  const slide = document.querySelector('section.lab-imp');
  if (!slide) return null;
  const slider = slide.querySelector('[data-set="flip"]');
  const G = echoGame('lab-imp', null,
    { name: 'imperfect-180', free: true, exc: 90, flip: 160, maxPulses: 2, end: 150, settings: () => ({ ...PART1, FLIP: +slider.value }), done: 'Done. Press Play to try again.' });
  // The three parts of a refocusing pulse of angle α acting on transverse signal
  const show = () => {
    const a = +slider.value * Math.PI / 180, parts = { refocus: Math.sin(a / 2) ** 2, none: Math.cos(a / 2) ** 2, toz: Math.sin(a) / 2 };
    slide.querySelector('[data-show="flip"]').textContent = slider.value;
    for (const [k, v] of Object.entries(parts)) {
      slide.querySelector(`[data-bar="${k}"]`).style.width = `${100 * v}%`;
      slide.querySelector(`[data-pct="${k}"]`).textContent = `${Math.round(100 * v)}%`;
    }
    G.preview();
  };
  slider.addEventListener('input', show);
  slider.addEventListener('change', () => { slider.blur(); show(); });
  show();
  return G;
})();
window.ProblemNEvenSpacing = echoGame('lab-even', null,
  { name: 'even-spacing', free: true, exc: 90, flip: 120, maxPulses: 3, end: 110, auto: [10, 30, 50], settings: () => ({ ...PART1, FLIP: 120 }), done: 'Done. Press Play to try again.' });

// Part 2: on the beat
window.ProblemNGame = echoGame('echo-game', 'echo-fit',
  { name: 'perfect', exc: 90, flip: 180, done: 'Done: next slide for the T<sub>2</sub> fit.' });
// B1 inhomogeneity: every flip angle is 89% of what was asked for
window.ProblemNGameB1NoCrush = echoGame('echo-game-b1nc', 'echo-fit-b1nc',
  { name: 'b1-no-crushers', exc: 80, flip: 160, done: 'Done: next slide for the T<sub>2</sub> fit.' });
// ... and with crushers around each refocusing pulse
window.ProblemNGameB1 = echoGame('echo-game-b1', 'echo-fit-b1',
  { name: 'b1', exc: 80, flip: 160, crush: true, done: 'Done: next slide for the T<sub>2</sub> fit.' });
// A stronger B1 error: every flip angle is two thirds of what was asked for, with crushers
window.ProblemNGameB1Strong = echoGame('echo-game-b1s', 'echo-fit-b1s',
  { name: 'b1-60-120', exc: 60, flip: 120, crush: true, done: 'Done: next slide for the T<sub>2</sub> fit.' });

// The sandbox: every setting from the controls on its slide, applied at each Play
(function () {
  const slide = document.querySelector('section.echo-sandbox');
  if (!slide) return;
  const val = (name) => slide.querySelector(`[data-set="${name}"]`);
  const num = (name, lo, hi, dflt) => { const x = parseFloat(val(name).value); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : dflt; };
  const settings = () => ({
    EXC: num('exc', 1, 180, 90), FLIP: num('flip', 1, 360, 180), CRUSH: val('crush').checked,
    T2: num('t2', 1, 5000, 80), T1: val('t1inf').checked ? Infinity : num('t1', 1, 20000, 1000),
    TAU: num('tau', 2, 50, 10), NSLOT: Math.round(num('n', 2, 20, 10)),
    SPREAD_DEG: num('spread', 0, 720, 60), FAN: val('fan').value, RATE: num('rate', 1, 30, 6),
  });
  const G = makeEchoGame(slide, null, { name: 'sandbox', exc: 90, flip: 180, sandbox: true, settings, done: 'Done.' });
  const sync = () => {
    val('t1').disabled = val('t1inf').checked;
    slide.querySelector('[data-show="spread"]').textContent = val('spread').value;
    slide.querySelector('[data-show="rate"]').textContent = val('rate').value;
  };
  slide.querySelectorAll('[data-set]').forEach((el) => {
    el.addEventListener('input', () => { sync(); G.preview(); });
    el.addEventListener('change', () => { el.blur(); sync(); G.preview(); });
  });
  sync(); G.preview();
  window.ProblemNSandbox = G;
})();
