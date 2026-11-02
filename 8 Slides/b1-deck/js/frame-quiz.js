/* Which frame is it? (Exercise 4-4, #bs-frames): a quiz on frames of reference, from on resonance in the Larmor frame to a
 * pulse far off resonance and the counter-rotating half of a linear drive. Two kinds of question alternate: values → pick
 * the animation (three small spheres), and animation → pick the values (one sphere, three text options). One at a time,
 * with the explanation after each answer and a score (x / n) at the end.
 * Conventions as in bs-core.js and the T2 lab: right-handed rotation about the field (counter-clockwise seen from +z), the
 * Larmor frame turns with the on-resonance spins, and the RF frame with the RF: there the field is (f1, 0, δ − Δ) for an RF
 * Δ above resonance and a spin δ above it; the Larmor-frame vector is the RF-frame one turned by +2πΔt about z. Rectangular
 * pulses, exact rotations, no relaxation. Anything at f0 (127.7 MHz at 3 T) is drawn far slower than real. */
(function () {
  'use strict';
  const slide = document.getElementById('bs-frames'); if (!slide) return;
  const TAU = 2 * Math.PI, FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const COL = { m: '#1f5f99', b1: '#e8770e', b1b: '#c9a27a', eff: '#b2182b', z: '#33414e', axis: '#9aa5b1', ring: '#d8dee6' };
  const F1 = 425.8;   // Hz, B1 = 10 µT
  const LOOP = 3, HOLD = 1;   // seconds on screen: the motion, then a pause at the end

  // ---- vectors ----
  function rot(v, n, a) {   // right-handed rotation of v by a about the unit axis n (Rodrigues)
    const c = Math.cos(a), s = Math.sin(a), d = n[0] * v[0] + n[1] * v[1] + n[2] * v[2];
    return [v[0] * c + (n[1] * v[2] - n[2] * v[1]) * s + n[0] * d * (1 - c),
      v[1] * c + (n[2] * v[0] - n[0] * v[2]) * s + n[1] * d * (1 - c),
      v[2] * c + (n[0] * v[1] - n[1] * v[0]) * s + n[2] * d * (1 - c)];
  }
  const rotZ = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];
  const len = (v) => Math.hypot(v[0], v[1], v[2]), unit = (v) => { const l = len(v); return v.map((x) => x / l); };
  const Z = [0, 0, 1], X = [1, 0, 0], Y = [0, 1, 0];

  // ---- scenes: u in [0, 1] (the fraction of the pulse) → { m, f: [{ v, c, lab }] } ----
  // A rectangular pulse in the RF frame: field (f1, 0, d − off) Hz for tau s; M turns about it. 0.85 = the longest arrow.
  function rfFrame({ f1 = F1, off, d = 0, tau, m0 = Z }) {
    const W = [f1, 0, d - off], w = len(W), n = unit(W), s = 0.85 / w;
    return (u) => {
      const f = [{ v: [f1 * s, 0, 0], c: COL.b1, lab: 'B₁' }];
      if (W[2]) f.push({ v: [0, 0, W[2] * s], c: COL.z, lab: 'ΔB₀' }, { v: W.map((x) => x * s), c: COL.eff, lab: 'B_eff' });
      return { m: rot(m0, n, TAU * w * tau * u), f };
    };
  }
  // The same pulse in the Larmor frame: the RF frame turns at +off there, and so does B1.
  function larmor({ f1 = F1, off, d = 0, tau, m0 = Z }) {
    const inRF = rfFrame({ f1, off, d, tau, m0 }), s = 0.85 / Math.max(f1, Math.abs(d));
    return (u) => {
      const a = TAU * off * tau * u, f = [{ v: rotZ([f1 * s, 0, 0], a), c: COL.b1, lab: 'B₁' }];
      if (d) f.push({ v: [0, 0, d * s], c: COL.z, lab: 'ΔB₀' });
      return { m: rotZ(inRF(u).m, a), f };
    };
  }
  // The lab: the Larmor frame turned at f0 (drawn as `turns` turns over the pulse), with B0 along z.
  function lab(opts, turns = 5) {
    const inL = larmor(opts);
    return (u) => {
      const a = TAU * turns * u, l = inL(u);
      return { m: rotZ(l.m, a), f: [{ v: [0, 0, 1.12], c: COL.z, lab: 'B₀' }, { v: rotZ(l.f[0].v.map((x) => x * 0.55), a), c: COL.b1, lab: 'B₁' }] };
    };
  }
  const tip90 = 1 / (4 * F1);   // s: 90° on resonance
  const ON_RES_1MS = TAU * F1 * 1e-3;   // rad: what 10 µT for 1 ms does on resonance (153°), for the distractors that ignore the offset
  const fieldsOnly = (fn) => (u) => ({ m: null, f: fn(u) });

  // the frame turning with the counter-rotating half of a linear drive (question 8), not to scale: ½B1 on x, 2f0 along z
  const CR = [{ v: [0.18, 0, 0], c: COL.b1b, lab: '½B₁' }, { v: [0, 0, 0.88], c: COL.z, lab: '2B₀' }, { v: [0.003, 0, 0.88], c: COL.eff, lab: '' }];

  // ---- the questions ----
  const Q = [
    { kind: 'pick', ask: 'Which one is M in the <b>Larmor frame</b>?',
      vals: 'On resonance · B<sub>1</sub> = 10 µT along x′ for 0.59 ms: a 90° pulse · M starts along z',
      opts: [lab({ off: 0, tau: tip90 }), larmor({ off: 0, tau: tip90 }), (u) => ({ m: rot(Z, Y, (Math.PI / 2) * u), f: [{ v: [0.85, 0, 0], c: COL.b1, lab: 'B₁' }] })],
      a: 1, why: 'In the Larmor frame the spins on resonance stand still, so the only field left is B<sub>1</sub>, fixed along x′: M turns about it, from z to −y′. A tips too, but spins about z at f<sub>0</sub> at the same time: that’s the lab. C turns about y′, not about the field.' },
    { kind: 'name', ask: 'Which frame is this?', vals: 'On resonance · the same pulse (10 µT for 0.59 ms: 90°) · M starts along z',
      show: lab({ off: 0, tau: tip90 }), opts: ['The laboratory frame', 'The Larmor frame', 'The RF frame'],
      a: 0, why: 'M tips and spins about B<sub>0</sub> at once: the lab (f<sub>0</sub> drawn far slower than real). On resonance the Larmor and RF frames are the same frame, and in it M only tips (question 1).' },
    { kind: 'name', ask: 'RF off, M in the transverse plane, seen in the Larmor frame. Which spin is this?', vals: 'No pulse · 10 ms · M starts along +y′',
      show: (u) => ({ m: rotZ(Y, TAU * u), f: [] }), opts: ['A spin 100 Hz <b>above</b> resonance', 'A spin 100 Hz <b>below</b> resonance', 'A spin on resonance'],
      a: 0, why: 'Counter-clockwise seen from +z, one turn in 10 ms: a spin 100 Hz above resonance gets ahead of the Larmor frame. Below resonance it would fall behind (clockwise); on resonance it would stand still.' },
    { kind: 'pick', ask: 'Which one is M in the <b>RF frame</b>?',
      vals: 'RF 1 kHz above resonance · B<sub>1</sub> = 10 µT for 1 ms (153° if it were on resonance) · M starts along z',
      opts: [(u) => ({ m: rot(Z, X, ON_RES_1MS * u), f: rfFrame({ off: 1000, tau: 1e-3 })(u).f }), rfFrame({ off: 1000, tau: 1e-3 }), (u) => ({ m: Z, f: rfFrame({ off: 1000, tau: 1e-3 })(u).f })],
      a: 1, why: 'Off resonance, the RF frame keeps a field along z: 1 kHz is 23.5 µT (1 kHz ÷ 42.58 MHz/T), pointing down. With B<sub>1</sub> (10 µT along x′) it makes B<sub>eff</sub>, 23° from −z, and M turns about B<sub>eff</sub> on a cone. A ignores the offset; C ignores B<sub>1</sub>.' },
    { kind: 'name', ask: 'M in the RF frame, B<sub>1</sub> = 10 µT. How far off resonance is the RF?', vals: '10 µT for 1 ms (153° if it were on resonance) · M starts along z',
      show: rfFrame({ off: 4000, tau: 1e-3 }), opts: ['On resonance', '1 kHz above', '4 kHz above'],
      a: 2, why: 'The cone hugs z: B<sub>eff</sub> is only 6° from −z, so the field along z is about 10 × B<sub>1</sub>: 94 µT, which is 4 kHz. At 1 kHz (23.5 µT) the tilt is 23° (question 4); on resonance B<sub>eff</sub> is B<sub>1</sub> itself and M tips all the way.' },
    { kind: 'pick', ask: 'Which one is M in the <b>Larmor frame</b>?',
      vals: 'RF 4 kHz above resonance · B<sub>1</sub> = 10 µT for 1 ms (153° if it were on resonance) · M starts along z',
      opts: [(u) => ({ m: rot(Z, X, ON_RES_1MS * u), f: larmor({ off: 4000, tau: 1e-3 })(u).f }), (u) => ({ m: rotZ(rot(Z, X, (Math.PI / 4) * Math.min(1, 4 * u)), TAU * 4 * u), f: larmor({ off: 4000, tau: 1e-3 })(u).f }), larmor({ off: 4000, tau: 1e-3 })],
      a: 2, why: 'M never gets more than 12° from z: in the Larmor frame B<sub>1</sub> turns at 4 kHz and keeps changing direction before M can follow (the narrow cone of question 5, turned by the frame’s 4 kHz). That’s how a Bloch–Siegert pulse leaves M almost where it was.' },
    { kind: 'pick', ask: 'A linear coil drives B<sub>1</sub> along x only. Which one shows its field in the <b>Larmor frame</b>?',
      vals: 'Linear drive, on resonance · B<sub>1</sub> = 10 µT, back and forth along x · no M shown',
      opts: [fieldsOnly((u) => [{ v: [0.85 * Math.cos(TAU * 6 * u), 0, 0], c: COL.b1, lab: 'B₁' }]),
        fieldsOnly(() => [{ v: [0.85, 0, 0], c: COL.b1, lab: 'B₁' }]),
        fieldsOnly((u) => [{ v: [0.42, 0, 0], c: COL.b1, lab: '½B₁' }, { v: rotZ([0.42, 0, 0], -TAU * 6 * u), c: COL.b1b, lab: '½B₁' }])],
      a: 2, why: 'B<sub>1</sub> cos(2πf<sub>0</sub>t) along x is two halves turning opposite ways at f<sub>0</sub>. In the Larmor frame the co-rotating half stands still on x′ and tips M; the other turns backwards at 2f<sub>0</sub> (255 MHz at 3 T, drawn far slower). A is the linear field without changing frame; B forgets the second half.' },
    { kind: 'pick', ask: 'Only the <b>counter-rotating half</b>, seen from the frame that turns with it. What does M do?',
      vals: '½B<sub>1</sub> = 5 µT for 1.17 ms (90° if it were on resonance) · this frame turns at 2f<sub>0</sub> relative to the spins, so it sees a field 2B<sub>0</sub> = 6 T along z (not to scale) · M starts along z',
      opts: [(u) => ({ m: rot(Z, X, (Math.PI / 2) * u), f: CR }), (u) => ({ m: rot(Z, X, (Math.PI / 4) * u), f: CR }), () => ({ m: Z, f: CR })],
      a: 2, why: 'For the spins, this half is 255 MHz off resonance: like question 6, but 64 000 × further. Next to 6 T, 5 µT tilts B<sub>eff</sub> by less than 10<sup>−6</sup> rad, so M doesn’t move: only the co-rotating half tips M, and a linear coil wastes half its power. What this half leaves is a tiny frequency shift, the one Bloch and Siegert described in 1940.' },
  ];

  // ---- drawing ----
  const view = { az: -0.6, el: 0.4 };
  function draw(canvas, scene, u) {
    const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height, R = 0.39 * W, FS = Math.round(0.05 * W);
    const P = (v) => { const x1 = v[0] * Math.cos(view.az) - v[1] * Math.sin(view.az), y1 = v[0] * Math.sin(view.az) + v[1] * Math.cos(view.az);
      return [W / 2 + R * x1, H / 2 + 0.05 * H - R * (v[2] * Math.cos(view.el) + y1 * Math.sin(view.el))]; };
    const line = (a, b, c, w, dash) => { g.beginPath(); g.setLineDash(dash || []); g.strokeStyle = c; g.lineWidth = w; const p = P(a), q = P(b); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); g.setLineDash([]); };
    const arrow = (v, c, w, lab) => {
      if (len(v) < 1e-3) return;
      const o = P([0, 0, 0]), p = P(v), dx = p[0] - o[0], dy = p[1] - o[1], l = Math.hypot(dx, dy);
      g.strokeStyle = c; g.fillStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(o[0], o[1]);
      if (l < 2) return;
      const ux = dx / l, uy = dy / l, h = Math.min(0.06 * W, 0.45 * l);
      g.lineTo(p[0] - ux * h * 0.8, p[1] - uy * h * 0.8); g.stroke();
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] - ux * h - uy * h * 0.45, p[1] - uy * h + ux * h * 0.45); g.lineTo(p[0] - ux * h + uy * h * 0.45, p[1] - uy * h - ux * h * 0.45); g.closePath(); g.fill();
      if (lab) {   // "B_eff" → B with a small "eff"; z-field labels go left of the tip, clear of B_eff's
        const [main, sub] = lab.split('_'), left = lab === 'ΔB₀' || lab === '2B₀';
        g.font = `700 ${FS}px ${FONT}`; const w = g.measureText(main).width;
        g.font = `700 ${Math.round(FS * 0.7)}px ${FONT}`; const ws = sub ? g.measureText(sub).width : 0;
        const x0 = left ? p[0] - 8 - w - ws : p[0] + 6;
        g.font = `700 ${FS}px ${FONT}`; g.fillText(main, x0, p[1] - 6);
        if (sub) { g.font = `700 ${Math.round(FS * 0.7)}px ${FONT}`; g.fillText(sub, x0 + w, p[1] - 6 + FS * 0.3); }
      }
    };
    g.clearRect(0, 0, W, H);
    // equator, axes
    g.beginPath(); g.strokeStyle = COL.ring; g.lineWidth = 2;
    for (let k = 0; k <= 72; k++) { const p = P([Math.cos((TAU * k) / 72), Math.sin((TAU * k) / 72), 0]); if (k) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }
    g.stroke();
    [[X, 'x'], [Y, 'y'], [Z, 'z']].forEach(([a, n]) => {
      line(a.map((x) => -x * (n === 'z' ? 0.95 : 1.1)), a.map((x) => x * (n === 'z' ? 1.1 : 1.1)), COL.axis, 1.5);
      const p = P(a.map((x) => x * (n === 'z' ? 1.1 : 1.18))); g.fillStyle = '#5b6776'; g.font = `${FS}px ${FONT}`; g.fillText(n, p[0] - (n === 'z' ? FS * 1.1 : FS * 0.3), p[1] + FS * 0.35);   // z on the left of the axis, clear of M's label
    });
    const s = scene(u);
    // M's trail so far
    if (s.m) {
      g.beginPath(); g.strokeStyle = 'rgba(31,95,153,0.45)'; g.lineWidth = 2.5;
      const N = Math.max(1, Math.round(160 * u));
      for (let k = 0; k <= N; k++) { const p = P(scene((u * k) / N).m); if (k) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }
      g.stroke();
    }
    s.f.forEach((f) => arrow(f.v, f.c, 0.012 * W, f.lab));
    if (s.m) arrow(s.m, COL.m, 0.018 * W, 'M');
  }

  // ---- the quiz ----
  const q = (c) => slide.querySelector(c);
  const many = [...slide.querySelectorAll('.fq-opt canvas')], one = q('.fq-one canvas');
  const pickBtns = [...slide.querySelectorAll('.fq-opt button')], nameBtns = [...slide.querySelectorAll('.fq-names button')], next = q('.fq-next');
  const st = { k: 0, ans: null, right: 0, t0: performance.now() };
  function render() {
    const done = st.k >= Q.length, it = Q[Math.min(st.k, Q.length - 1)];
    q('.fq-count').textContent = done ? 'All done' : `Question ${st.k + 1} of ${Q.length}`;
    q('.fq-score').textContent = `${st.right} / ${done ? Q.length : st.k + (st.ans != null ? 1 : 0)} right`;
    q('.fq-q').innerHTML = done ? `You got <b>${st.right} out of ${Q.length}</b>.` : it.ask;
    q('.fq-vals').innerHTML = done ? '' : it.vals; q('.fq-vals').hidden = done;
    q('.fq-opts').hidden = done || it.kind !== 'pick'; q('.fq-one').hidden = done || it.kind !== 'name';
    const mark = (b, k) => { b.disabled = st.ans != null; b.classList.toggle('fq-good', st.ans != null && k === it.a); b.classList.toggle('fq-bad', st.ans === k && k !== it.a); };
    pickBtns.forEach((b, k) => { mark(b, k); b.closest('.fq-opt').classList.toggle('fq-good', st.ans != null && k === it.a); b.closest('.fq-opt').classList.toggle('fq-bad', st.ans === k && k !== it.a); });
    nameBtns.forEach((b, k) => { b.innerHTML = it.kind === 'name' ? it.opts[k] : ''; mark(b, k); });
    const fb = q('.fq-fb'), ok = st.ans === it.a;
    fb.hidden = done || st.ans == null; fb.className = `fq-fb ${ok ? 'fq-right' : 'fq-wrong'}`;
    fb.textContent = st.ans == null ? '' : ok ? '✓ Right' : `✗ It’s ${it.kind === 'pick' ? 'ABC'[it.a] : 'the other one'}`;
    if (st.ans != null && !ok && it.kind === 'name') fb.innerHTML = `✗ It’s: ${it.opts[it.a]}`;
    q('.fq-why').hidden = done || st.ans == null; q('.fq-why').innerHTML = st.ans == null ? '' : it.why;
    next.hidden = !done && st.ans == null;
    next.textContent = done ? 'Start again' : st.k === Q.length - 1 ? 'See the score' : 'Next question';
    st.t0 = performance.now();
  }
  function answer(k) { if (st.ans != null || st.k >= Q.length) return; st.ans = k; if (k === Q[st.k].a) st.right++; render(); }
  pickBtns.forEach((b, k) => b.addEventListener('click', () => { b.blur(); answer(k); }));
  many.forEach((c, k) => c.addEventListener('click', () => answer(k)));
  nameBtns.forEach((b, k) => b.addEventListener('click', () => { b.blur(); answer(k); }));
  next.addEventListener('click', () => { next.blur(); if (st.k >= Q.length) { st.k = 0; st.right = 0; } else st.k++; st.ans = null; render(); });

  // animation: LOOP s of motion, HOLD s at the end, again
  let raf = null;
  function frame(now) {
    const it = Q[st.k];
    if (it) {
      const t = ((now - st.t0) / 1000) % (LOOP + HOLD), u = Math.min(1, t / LOOP);
      if (it.kind === 'pick') many.forEach((c, k) => draw(c, it.opts[k], u)); else draw(one, it.show, u);
    }
    raf = requestAnimationFrame(frame);
  }
  const start = () => { if (raf == null) raf = requestAnimationFrame(frame); };
  const stop = () => { if (raf != null) cancelAnimationFrame(raf); raf = null; };
  Reveal.on('slidechanged', (e) => { if (e.currentSlide === slide) start(); else stop(); });
  Reveal.on('ready', (e) => { if (e.currentSlide === slide) start(); });
  if (Reveal.isReady() && Reveal.getCurrentSlide() === slide) start();
  render();
})();
