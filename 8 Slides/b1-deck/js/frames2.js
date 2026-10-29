/* Frames of reference slide (#frames), real units: the same B0 + B1 seen from the laboratory, the Larmor frame and the
 * frame turning with the RF. Drawing as in the T2 lab (GBM-MRI T2 deck, js/exn.js) and bs.js: orthographic view,
 * right-handed rotations (counter-clockwise seen from +z). Fields are γ̄B in Hz, drawn to true proportion within each view
 * (the unit circle is the largest field that view can show); a frame turning at f_F sees the z field reduced to f0 − f_F.
 * Time is slowed down by a factor the viewer sets; anything turning too fast to animate is drawn as the path it sweeps.
 * No magnetization. */
(function () {
  'use strict';
  const slide = document.getElementById('frames'); if (!slide) return;
  const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif', MUTED = '#5b6776', DEG = 180 / Math.PI, TAU = 2 * Math.PI;
  const GAMMA_BAR = 42.577e6;   // Hz/T
  const COL = { b0: '#33414e', b1: '#e8770e', b1m: '#d9a066', tot: '#b2182b' };
  const FAST = 3;      // turns per second on screen above which a rotation is drawn as a blur
  const TRAIL = 1.5;   // seconds on screen kept in the tip trail of the total field
  const OFF_MAX = 1e6; // RF offset slider: offset = OFF_MAX · s³, s in [−1, 1] (fine near resonance, reaches 1 MHz)
  const st = { f0: 127.7e6, off: 4e3, b1: 10e-6, pol: 'circ', others: true, rate: 0, t: 0, p0: 0, pRF: 0, playing: false };
  const fRF = () => st.f0 + st.off, f1 = () => GAMMA_BAR * st.b1;
  st.rate = 0.5 / st.f0;   // real seconds per second on screen: B0 precession at half a turn per second
  const FRAMES = [
    { key: 'lab', colour: '#7d8894', ax: ['x', 'y'], rate: () => 0, angle: () => 0, zLabel: 'B₀', totLabel: 'B' },
    { key: 'lar', colour: '#7b3fa0', ax: ['x_L', 'y_L'], rate: () => st.f0, angle: () => st.p0, zLabel: '', totLabel: 'B_eff' },
    { key: 'rf', colour: '#2e8b3a', ax: ['x_RF', 'y_RF'], rate: fRF, angle: () => st.pRF, zLabel: 'ΔB₀', totLabel: 'B_eff' },
  ];
  const view = { az: -0.6, el: 0.42 };
  const fast = (f) => Math.abs(f * st.rate) > FAST;

  // ---- number formatting ----
  const sup = (n) => String(n).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
  function hz(f, sign) {
    const a = Math.abs(f), s = f < 0 ? '−' : sign && f > 0 ? '+' : '';
    if (a < 0.005) return '0 Hz';
    if (a >= 1e6) return `${s}${(a / 1e6).toFixed(a >= 1e8 ? 1 : 2)} MHz`;
    if (a >= 1e3) return `${s}${(a / 1e3).toFixed(2)} kHz`;
    return `${s}${a.toFixed(a >= 100 ? 0 : 1)} Hz`;
  }
  function sec(t) {
    const u = [[1, 's'], [1e-3, 'ms'], [1e-6, 'µs'], [1e-9, 'ns'], [1e-12, 'ps']].find(([k]) => t >= k) || [1e-12, 'ps'];
    return `${(t / u[0]).toFixed(t / u[0] >= 100 ? 0 : t / u[0] >= 10 ? 1 : 2)} ${u[1]}`;
  }
  const sci = (x) => { const e = Math.floor(Math.log10(x)), m = x / 10 ** e; return `${m.toFixed(1)} × 10${sup(e)}`; };

  // ---- one view ----
  function makeView(canvas, F) {
    const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height, R = 0.34 * Math.min(W, H), FS = Math.round(0.044 * W);
    const hist = [];
    function proj(v) {
      const x1 = v[0] * Math.cos(view.az) - v[1] * Math.sin(view.az), y1 = v[0] * Math.sin(view.az) + v[1] * Math.cos(view.az);
      return [W / 2 + R * x1, H / 2 + 0.05 * H - R * (v[2] * Math.cos(view.el) + y1 * Math.sin(view.el))];
    }
    function line(a, b, colour, width, dash) {
      const p = proj(a), q = proj(b);
      g.strokeStyle = colour; g.lineWidth = width; g.setLineDash(dash || []);
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); g.setLineDash([]);
    }
    function path(pts, colour, width, dash, fill) {
      g.strokeStyle = colour; g.lineWidth = width; g.setLineDash(dash || []); g.beginPath();
      pts.forEach((v, k) => { const q = proj(v); k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); });
      if (fill) { g.fillStyle = fill; g.fill(); }
      g.stroke(); g.setLineDash([]);
    }
    function arrow(v, colour, width, dash) {
      if (Math.hypot(v[0], v[1], v[2]) < 0.02) return;
      line([0, 0, 0], v, colour, width, dash);
      const p = proj(v), o = proj([0, 0, 0]), ang = Math.atan2(p[1] - o[1], p[0] - o[0]), h = 0.03 * W;
      g.fillStyle = colour; g.beginPath(); g.moveTo(p[0], p[1]);
      g.lineTo(p[0] - h * Math.cos(ang - 0.4), p[1] - h * Math.sin(ang - 0.4));
      g.lineTo(p[0] - h * Math.cos(ang + 0.4), p[1] - h * Math.sin(ang + 0.4)); g.closePath(); g.fill();
    }
    function label(v, text, colour, bold, scale = 1, dx = 0) {   // "x_RF" draws RF as a subscript; dx nudges it sideways (px)
      const p = proj(v); p[0] += dx; const [base, sub] = text.split('_'), w = bold ? '700 ' : '';
      const f = `${w}${Math.round(scale * FS)}px ${FONT}`, fs = `${w}${Math.round(0.7 * scale * FS)}px ${FONT}`;
      g.fillStyle = colour; g.textBaseline = 'middle';
      if (!sub) { g.font = f; g.textAlign = 'center'; g.fillText(text, p[0], p[1]); return; }
      g.font = f; const wb = g.measureText(base).width; g.font = fs; const ws = g.measureText(sub).width;
      g.textAlign = 'left'; g.font = f; g.fillText(base, p[0] - (wb + ws) / 2, p[1]);
      g.font = fs; g.fillText(sub, p[0] - (wb + ws) / 2 + wb, p[1] + 0.3 * scale * FS);
    }
    const dir = (a, r = 1, z = 0) => [r * Math.cos(a), r * Math.sin(a), z];
    const ring = (c, r, z = 0) => Array.from({ length: 97 }, (_, i) => { const a = (i / 96) * TAU; return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), z]; });

    function draw(fresh) {
      const a = F.angle(), z = st.f0 - F.rate(), lin = st.pol === 'lin';
      const amp = lin ? f1() / 2 : f1(), coilMax = f1();
      const S = 1 / (Math.hypot(z, coilMax) || 1);   // unit circle = the largest total field this view can show
      // B1 parts: angle in this frame, rate in this frame, and whether that rate is too fast to animate
      const parts = [{ ang: st.pRF - a, rate: fRF() - F.rate(), colour: COL.b1, name: lin ? 'B₁⁺' : 'B₁' }];
      if (lin) parts.push({ ang: -st.pRF - a, rate: -fRF() - F.rate(), colour: COL.b1m, name: 'B₁⁻' });
      parts.forEach((p) => { p.fast = fast(p.rate); p.v = dir(p.ang, S * amp); });
      const slow = parts.filter((p) => !p.fast), blur = parts.filter((p) => p.fast);
      const slowSum = slow.reduce((s, p) => [s[0] + p.v[0], s[1] + p.v[1], 0], [0, 0, 0]);
      const coil = parts.reduce((s, p) => [s[0] + p.v[0], s[1] + p.v[1], 0], [0, 0, 0]);
      const zv = [0, 0, S * z], tot = [slowSum[0], slowSum[1], zv[2]];   // the total field, averaged over anything too fast to draw
      if (fresh) { if (blur.length) hist.length = 0; else hist.push([st.t / st.rate, [coil[0] / S, coil[1] / S, z]]); }
      const now = st.t / st.rate;
      while (hist.length && hist[0][0] < now - TRAIL) hist.shift();

      g.clearRect(0, 0, W, H);
      path(ring([0, 0], 1), '#e3e8ee', 2);
      line([0, 0, -1.2], [0, 0, 1.2], '#9aa5b1', 2); label([0, 0, 1.32], 'z', MUTED);
      line(dir(Math.PI, 1.2), dir(0, 1.2), F.colour, 2.5); line(dir(-Math.PI / 2, 1.2), dir(Math.PI / 2, 1.2), F.colour, 2.5);
      label(dir(0, 1.36), F.ax[0], F.colour, true); label(dir(Math.PI / 2, 1.36), F.ax[1], F.colour, true);
      // the other frames' x axes, turning (a blur ring when too fast)
      if (st.others) for (const G of FRAMES) {
        if (G === F) continue;
        if (fast(G.rate() - F.rate())) { path(ring([0, 0], 1.12), G.colour, 1.5, [3, 7]); label(dir(G.key === 'rf' ? -0.55 : -1.05, 1.3), G.ax[0], G.colour, false, 0.75); continue; }
        const b = G.angle() - a;
        line([0, 0, 0], dir(b, 1.12), G.colour, 2.5, [9, 7]); label(dir(b, 1.26), G.ax[0], G.colour, true, 0.85);
      }
      // trail of the total field's tip (only while everything can be animated)
      for (let i = 1; i < hist.length; i++) {
        const p = proj(hist[i - 1][1].map((x) => S * x)), q = proj(hist[i][1].map((x) => S * x));
        g.strokeStyle = `rgba(178, 24, 43, ${0.45 * (1 - (now - hist[i][0]) / TRAIL)})`; g.lineWidth = 3;
        g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke();
      }
      // what the fast parts sweep: one fast part → a ring about the slow ones; B1⁺ and B1⁻ both fast in the lab → a line
      // along x; both fast in a turning frame → a disc
      const r = S * amp;
      if (blur.length === 1 && r > 0.01) {
        path(ring(slowSum, r), 'rgba(232, 119, 14, 0.55)', 4);
        if (Math.abs(zv[2]) > 0.01) path(ring(slowSum, r, zv[2]), 'rgba(178, 24, 43, 0.4)', 3);
      } else if (blur.length === 2 && r > 0.01) {
        if (F.key === 'lab') { line([-2 * r, 0, 0], [2 * r, 0, 0], 'rgba(232, 119, 14, 0.55)', 6); line([-2 * r, 0, zv[2]], [2 * r, 0, zv[2]], 'rgba(178, 24, 43, 0.4)', 4); }
        else path(ring([0, 0], 2 * r), 'rgba(232, 119, 14, 0.5)', 3, null, 'rgba(232, 119, 14, 0.12)');
      }
      // fields: total underneath, then the parts
      const near = (u, v) => Math.hypot(u[0] - v[0], u[1] - v[1], u[2] - v[2]) < 0.04;
      arrow(tot, 'rgba(178, 24, 43, 0.55)', 11);
      if (Math.abs(zv[2]) >= 0.02) arrow(zv, COL.b0, 5);
      if (lin && !blur.length) { arrow(parts[0].v, COL.b1, 3, [7, 6]); arrow(parts[1].v, COL.b1m, 3, [7, 6]); arrow(coil, COL.b1, 5.5); }
      else for (const p of slow) arrow(p.v, p.colour, lin ? 4 : 5.5);
      const tag = (v, text, colour, dx = 0) => { const n = Math.hypot(...v); if (n < 0.03) return; const k = (n + 0.14) / n; label([k * v[0], k * v[1], k * v[2] + 0.04], text, colour, true, 0.9, dx); };
      const close = Math.hypot(tot[0] - zv[0], tot[1] - zv[1], tot[2] - zv[2]) < 0.4;
      if (Math.abs(zv[2]) >= 0.02) tag(zv, F.zLabel, COL.b0, close && !near(tot, zv) ? -0.055 * W : 0);
      if (lin && !blur.length) { tag(coil, 'B₁', COL.b1); if (!near(parts[0].v, coil)) tag(parts[0].v, 'B₁⁺', COL.b1); if (!near(parts[1].v, coil)) tag(parts[1].v, 'B₁⁻', COL.b1m); }
      else for (const p of slow) tag(p.v, p.name, p.colour);
      if (!near(tot, zv) && !slow.some((p) => near(tot, p.v))) tag(tot, F.totLabel, COL.tot, close ? 0.055 * W : 0);
      // the scale of this view
      g.font = `${Math.round(0.8 * FS)}px ${FONT}`; g.fillStyle = MUTED; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      if (Math.hypot(z, coilMax) > 0) g.fillText(`circle = ${hz(1 / S)}`, 0.03 * W, H - 0.03 * H);
      return { blur, z, amp };
    }
    return { draw, clear: () => { hist.length = 0; } };
  }

  const views = FRAMES.map((F) => makeView(slide.querySelector(`canvas[data-frame="${F.key}"]`), F));
  function drawAll(fresh) { const info = views.map((v) => v.draw(fresh)); readouts(info); }

  // ---- readouts under the views ----
  function readouts(info) {
    const lin = st.pol === 'lin', d = st.f0 - fRF(), fp = lin ? f1() / 2 : f1(), on = Math.abs(d) < 0.005;
    const q = (k) => slide.querySelector(`.fr-read[data-frame="${k}"]`);
    const blurNote = (i) => (info[i].blur.length ? ` <span class="fr-blur">(${info[i].blur.map((p) => p.name).join(', ')}: too fast to draw, shown as the path swept)</span>` : '');
    q('lab').innerHTML = `Frame fixed. B<sub>0</sub> along z: f<sub>0</sub> = ${hz(st.f0)}. `
      + (lin ? `B<sub>1</sub> swings along x at ${hz(fRF())}.` : `B<sub>1</sub> turns at f<sub>RF</sub> = ${hz(fRF())}.`)
      + (f1() > 0 ? ` B<sub>1</sub> is ${sci(f1() / st.f0)} of B<sub>0</sub>.` : '') + blurNote(0);
    q('lar').innerHTML = `Frame turns at f<sub>0</sub>, so B<sub>0</sub> is gone. `
      + `B<sub>1</sub>${lin ? '<sup>+</sup>' : ''} turns at f<sub>RF</sub> − f<sub>0</sub> = ${hz(-d, 1)}${on ? ': it stands still' : ''}`
      + (lin ? `, B<sub>1</sub><sup>−</sup> at ${hz(-fRF() - st.f0, 1)}.` : '.') + blurNote(1);
    const th = Math.atan2(fp, d) * DEG, feff = Math.hypot(fp, d);
    q('rf').innerHTML = `Frame turns at f<sub>RF</sub>. Left on z: f<sub>0</sub> − f<sub>RF</sub> = ${hz(d, 1)}${on ? ' (on resonance)' : ''}. `
      + `B<sub>1</sub>${lin ? '<sup>+</sup>' : ''} stands still on x<sub>RF</sub>${lin ? `, B<sub>1</sub><sup>−</sup> turns at ${hz(-2 * fRF(), 1)}` : ''}. `
      + `B<sub>eff</sub>: ${th.toFixed(th < 10 || th > 170 ? 1 : 0)}° from z, ${hz(feff)}.` + blurNote(2);
    slide.querySelector('.fr-time').textContent = `t = ${sec(st.t)}`;
  }

  // ---- controls ----
  const ctl = (cls) => slide.querySelector(`.${cls}`), out = (cls, html) => { ctl(`${cls}-read`).innerHTML = html; };
  const changed = () => { views.forEach((v) => v.clear()); drawAll(false); };
  function bind(cls, toState, show) {
    const el = ctl(cls);
    el.addEventListener('input', () => { toState(Number(el.value)); show(); changed(); });
    el.addEventListener('keydown', (e) => e.stopPropagation());
    show();
    return el;
  }
  bind('fr-f0', (v) => { st.f0 = v * 1e6; }, () => out('fr-f0', `${(st.f0 / 1e6).toFixed(1)} MHz (${(st.f0 / GAMMA_BAR).toFixed(2)} T)`));
  const showOff = () => out('fr-off', hz(st.off, 1));
  const offEl = bind('fr-off', (s) => { st.off = OFF_MAX * s ** 3; }, showOff);
  const setOff = (hzVal) => { st.off = hzVal; offEl.value = Math.cbrt(hzVal / OFF_MAX); showOff(); changed(); };
  offEl.value = Math.cbrt(st.off / OFF_MAX);
  slide.querySelectorAll('[data-froff]').forEach((b) => b.addEventListener('click', () => { b.blur(); setOff(Number(b.dataset.froff)); }));
  bind('fr-b1', (v) => { st.b1 = v * 1e-6; }, () => out('fr-b1', `${(st.b1 * 1e6).toFixed(1)} µT (f<sub>1</sub> = ${hz(f1())})`));
  const showRate = () => out('fr-rate', `1 s = ${sec(st.rate)}`);
  const rateEl = bind('fr-rate', (v) => { st.rate = 10 ** v; }, showRate);
  const setRate = (r) => { st.rate = r; rateEl.value = Math.log10(r); showRate(); changed(); };
  rateEl.value = Math.log10(st.rate); showRate();
  // presets: B0 precession, or the RF frame's B_eff, at half a turn per second
  ctl('fr-watch0').addEventListener('click', (e) => { e.currentTarget.blur(); setRate(0.5 / st.f0); });
  ctl('fr-watchoff').addEventListener('click', (e) => {
    e.currentTarget.blur(); const fe = Math.hypot(st.off, st.pol === 'lin' ? f1() / 2 : f1()); if (fe > 0) setRate(0.5 / fe);
  });
  segToggle(slide, 'pol', (v) => { st.pol = v; changed(); });
  const others = ctl('fr-others');
  others.addEventListener('click', () => { st.others = !st.others; others.setAttribute('aria-pressed', String(st.others)); others.blur(); drawAll(false); });

  // ---- time: phases are integrated (and wrapped) so that a slider moved mid-run does not make anything jump ----
  const go = ctl('fr-go');
  let raf = null, last = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000) * st.rate; last = now;
    st.t += dt; st.p0 = (st.p0 + TAU * st.f0 * dt) % TAU; st.pRF = (st.pRF + TAU * fRF() * dt) % TAU;
    drawAll(true);
    raf = requestAnimationFrame(frame);
  }
  function play() { if (raf) return; last = performance.now(); raf = requestAnimationFrame(frame); go.textContent = '❚❚ Pause'; st.playing = true; }
  function pause() { if (raf) cancelAnimationFrame(raf); raf = null; go.textContent = '▶ Play'; st.playing = false; }
  go.addEventListener('click', (e) => { e.currentTarget.blur(); st.playing ? pause() : play(); });
  ctl('fr-reset').addEventListener('click', (e) => { e.currentTarget.blur(); st.t = st.p0 = st.pRF = 0; changed(); });

  // ---- drag any view to turn all three ----
  slide.querySelectorAll('canvas').forEach((c) => {
    let drag = null;
    c.style.touchAction = 'none';
    c.addEventListener('pointerdown', (e) => { drag = [e.clientX, e.clientY, view.az, view.el]; c.setPointerCapture(e.pointerId); e.stopPropagation(); });
    c.addEventListener('pointermove', (e) => {
      if (!drag) return;
      view.az = drag[2] + (e.clientX - drag[0]) * 0.01;
      view.el = Math.max(-1.5, Math.min(1.5, drag[3] + (e.clientY - drag[1]) * 0.01));
      if (!raf) drawAll(false);
    });
    c.addEventListener('pointerup', () => { drag = null; });
    for (const type of ['touchstart', 'touchmove']) c.addEventListener(type, (e) => e.stopPropagation());
  });

  onShow(slide, () => { drawAll(false); play(); });
  Reveal.on('slidechanged', (e) => { if (e.currentSlide === slide) play(); else pause(); });
})();
