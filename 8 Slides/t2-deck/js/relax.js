/* Lecture slide "T2 and T2*": after a 90° pulse, the magnetization (seen in the rotating frame, so it does not precess)
 * shrinks with T2. With field
 * inhomogeneities on, it is a fan of spins at slightly different frequencies (red faster, blue slower, as in the
 * exercises' fan): they spread out, and their sum shrinks faster, with T2*. Below, the signal |Mxy| against time,
 * with the T2 curve dashed for comparison. The fan is Lorentzian, so the sum decays exactly as e^(−t/T2*).
 * The same 3D view as the exercises' Bloch sphere (js/exn.js), drawn here so the lecture deck needs no exercise code. */
(function () {
  'use strict';
  const slide = document.querySelector('section.relax-demo');
  if (!slide) return;

  const T2 = 100, T2P = 30, T2S = 1 / (1 / T2 + 1 / T2P);  // ms; T2* = 23 ms
  const TMAX = 250, DUR = 9000;                             // ms shown, and ms of animation for them
  const N = 24, GAMMA = 1 / (2 * Math.PI * T2P);             // spins drawn; Lorentzian half-width (kHz), so T2' = 30 ms
  const INK = '#1d2733', MUTED = '#5b6776', AXIS = '#9aa5b1', M_COLOUR = '#1f5f99', T2_COLOUR = '#1f5f99', T2S_COLOUR = '#c0392b';
  const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

  // Offsets: Lorentzian quantiles, leaving out the far tails so every drawn spin stays in view as it spreads.
  const spins = Array.from({ length: N }, (_, i) => {
    const q = 0.04 + 0.92 * (i + 0.5) / N, c = Math.tan(Math.PI * (q - 0.5));
    return { dw: 2 * Math.PI * GAMMA * c, c };
  });
  const edge = Math.max(...spins.map((s) => Math.abs(s.c)));
  const colour = (c) => {  // blue (slower) through grey to red (faster)
    const f = Math.min(1, Math.abs(c) / edge), mix = (a, b) => a.map((x, k) => Math.round(x + (b[k] - x) * f));
    return `rgb(${(c < 0 ? mix([150, 158, 168], [33, 102, 172]) : mix([150, 158, 168], [178, 24, 43])).join(',')})`;
  };

  const view = slide.querySelector('canvas.relax-3d'), g = view.getContext('2d');
  const plot = slide.querySelector('canvas.relax-sig'), pg = plot.getContext('2d');
  const toggle = slide.querySelector('[data-inhom]'), play = slide.querySelector('[data-relax-play]');
  const readout = slide.querySelector('.relax-readout');
  let az = -0.6, el = 0.5, t = 0, running = false, start = null, inhom = false;

  function proj(v) {
    const W = view.width, H = view.height, R = 0.38 * Math.min(W, H);
    const x1 = v[0] * Math.cos(az) - v[1] * Math.sin(az), y1 = v[0] * Math.sin(az) + v[1] * Math.cos(az);
    return [W / 2 + R * x1, H / 2 + 0.05 * H - R * (v[2] * Math.cos(el) + y1 * Math.sin(el))];
  }
  function line(a, b, col, width, dash) {
    const p = proj(a), q = proj(b);
    g.strokeStyle = col; g.lineWidth = width; g.setLineDash(dash || []);
    g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); g.setLineDash([]);
  }
  function arrow(v, col, width, head) {
    line([0, 0, 0], v, col, width);
    const p = proj(v), o = proj([0, 0, 0]), a = Math.atan2(p[1] - o[1], p[0] - o[0]), h = Math.min(head, 0.45 * Math.hypot(p[0] - o[0], p[1] - o[1]));
    if (h < 4) return;
    g.fillStyle = col; g.beginPath(); g.moveTo(p[0], p[1]);
    g.lineTo(p[0] - h * Math.cos(a - 0.4), p[1] - h * Math.sin(a - 0.4)); g.lineTo(p[0] - h * Math.cos(a + 0.4), p[1] - h * Math.sin(a + 0.4));
    g.closePath(); g.fill();
  }
  function label(v, text, col, bold) {
    const p = proj(v);
    g.fillStyle = col; g.font = `${bold ? '700 ' : ''}30px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, p[0], p[1]);
  }

  const net = (tt) => Math.exp(-tt / (inhom ? T2S : T2));  // |Mxy|: the sum of a Lorentzian fan decays as e^(−t/T2')

  function draw3d() {
    g.clearRect(0, 0, view.width, view.height);
    g.strokeStyle = '#d8dee6'; g.lineWidth = 2; g.beginPath();
    for (let i = 0; i <= 96; i++) { const a = i / 96 * 2 * Math.PI, p = proj([Math.cos(a), Math.sin(a), 0]); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
    g.stroke();
    for (const [v, name] of [[[1.2, 0, 0], 'x'], [[0, 1.2, 0], 'y'], [[0, 0, 1.2], 'z']]) {
      line([-v[0], -v[1], -v[2]].map((c) => (v[2] ? 0 : c)), v, AXIS, 2);
      label(v.map((c) => c * 1.12), name, MUTED);
    }
    const e2 = Math.exp(-t / T2);
    if (inhom) {  // each spin turns at its own speed, and shrinks with T2
      for (const s of spins) {
        const a = s.dw * t, v = [e2 * Math.cos(a), e2 * Math.sin(a), 0], p = proj(v);
        line([0, 0, 0], v, colour(s.c), 3);
        g.fillStyle = colour(s.c); g.beginPath(); g.arc(p[0], p[1], 6, 0, 2 * Math.PI); g.fill();
      }
    }
    const m = net(t), mv = [m, 0, 0];  // the sum stays along x
    arrow(mv, inhom ? INK : M_COLOUR, 8, 24);
    if (m > 0.08) label([1.15 * mv[0], 1.15 * mv[1], 0.1], 'M', INK, true);
  }

  function drawPlot() {
    const W = plot.width, H = plot.height, L = 70, Rm = 24, T = 20, B = 56;
    const x = (tt) => L + (W - L - Rm) * tt / TMAX, y = (v) => T + (H - T - B) * (1 - v);
    pg.clearRect(0, 0, W, H);
    pg.strokeStyle = '#d8dee6'; pg.lineWidth = 2;
    pg.beginPath(); pg.moveTo(L, T); pg.lineTo(L, y(0)); pg.lineTo(W - Rm, y(0)); pg.stroke();
    pg.fillStyle = MUTED; pg.font = `24px ${FONT}`; pg.textAlign = 'center'; pg.textBaseline = 'top';
    for (let k = 0; k <= TMAX; k += 50) { pg.fillText(String(k), x(k), y(0) + 8); }
    pg.fillText('time (ms)', (L + W - Rm) / 2, H - 26);
    pg.save(); pg.translate(22, (T + y(0)) / 2); pg.rotate(-Math.PI / 2); pg.textBaseline = 'middle'; pg.fillText('|Mxy|', 0, 0); pg.restore();
    const curve = (tc, tEnd, col, width, dash) => {
      pg.strokeStyle = col; pg.lineWidth = width; pg.setLineDash(dash || []); pg.beginPath();
      for (let k = 0; k <= 200; k++) { const tt = tEnd * k / 200, X = x(tt), Y = y(Math.exp(-tt / tc)); k ? pg.lineTo(X, Y) : pg.moveTo(X, Y); }
      pg.stroke(); pg.setLineDash([]);
    };
    const tag = (text, tt, v, col) => { pg.fillStyle = col; pg.font = `700 26px ${FONT}`; pg.textAlign = 'left'; pg.textBaseline = 'bottom'; pg.fillText(text, x(tt) + 8, y(v) - 6); };
    if (inhom) { curve(T2, TMAX, T2_COLOUR, 2.5, [10, 8]); tag('T₂', 120, Math.exp(-120 / T2), T2_COLOUR); }
    curve(inhom ? T2S : T2, t, inhom ? T2S_COLOUR : T2_COLOUR, 4);
    if (t > 30) tag(inhom ? 'T₂*' : 'T₂', inhom ? 22 : 120, Math.exp(-(inhom ? 22 : 120) / (inhom ? T2S : T2)), inhom ? T2S_COLOUR : T2_COLOUR);
    pg.strokeStyle = INK; pg.lineWidth = 2; pg.beginPath(); pg.moveTo(x(t), T); pg.lineTo(x(t), y(0)); pg.stroke();  // now
  }

  function draw() {
    draw3d(); drawPlot();
    if (readout) readout.innerHTML = `<i>t</i> = ${Math.round(t)} ms · |M<sub>xy</sub>| = ${net(t).toFixed(2)}`;
  }
  function frame(now) {
    if (!running) return;
    if (start === null) start = now;
    t = Math.min(TMAX, TMAX * (now - start) / DUR);
    draw();
    if (t < TMAX) requestAnimationFrame(frame); else { running = false; play.textContent = '▶ Play again'; }
  }
  function reset() { running = false; start = null; t = 0; play.textContent = '▶ Play'; draw(); }
  play.addEventListener('click', (e) => {
    e.currentTarget.blur();
    reset(); running = true; play.textContent = '▶ Playing…'; requestAnimationFrame(frame);
  });
  toggle.addEventListener('change', () => { toggle.blur(); inhom = toggle.checked; reset(); });

  // Drag to turn the view; keep the gesture away from Reveal's swipe navigation.
  let drag = null;
  view.style.touchAction = 'none';
  view.addEventListener('pointerdown', (e) => { drag = [e.clientX, e.clientY, az, el]; view.setPointerCapture(e.pointerId); e.stopPropagation(); });
  view.addEventListener('pointermove', (e) => {
    if (!drag) return;
    az = drag[2] + (e.clientX - drag[0]) * 0.01; el = Math.max(-1.5, Math.min(1.5, drag[3] + (e.clientY - drag[1]) * 0.01));
    if (!running) draw();
  });
  view.addEventListener('pointerup', () => { drag = null; });
  if (window.Reveal) window.Reveal.on('slidechanged', (e) => { if (e.previousSlide === slide) reset(); });

  inhom = toggle.checked;
  draw();
})();
