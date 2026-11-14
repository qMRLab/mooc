/* Slide "Two tanks, one pipe": the longitudinal two-pool equations as plumbing. Water level = Mz/M0 of each pool, tank
 * width = pool size (the macromolecule tank is F as wide), a faucet + drain on each tank = T1 relaxation, one pipe at the
 * bottom flowing with the height difference = exchange (k_r = k_f/F comes out of the widths), an RF valve on the narrow
 * tank = saturation W_r, a small valve on the water tank = direct saturation W_f. Continuous-wave RF; W from the
 * simulator's lineshapes (super-Lorentzian, T2,r = 12.3 µs; Lorentzian, T2,f = 37 ms). Animated while the slide is shown. */
(function () {
  'use strict';
  const { S, C, slider } = window.MT;
  const $ = (id) => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const TWO_PI = 2 * Math.PI, GAMMA = 42.577, T2R = 12.3e-6, T2F = 0.037, R1R = 1;
  const COL = { free: C.free, restr: C.restr, ex: C.ex, rf: '#c92a2a', direct: C.direct, glass: '#f7fafc', surface: '#ffffff', ink: C.ink, muted: C.muted, rule: C.rule };

  window.MTDeck.widget('s-tanks', (section) => {
    const offFromSlider = (v) => 300 * Math.pow(20000 / 300, v);
    const P = {};
    let gCache = { off: null, g: 0 };
    const sB1 = slider('tk-b1', (v) => `${v.toFixed(2)} µT`, update);
    const sOff = slider('tk-off', (v) => { const o = offFromSlider(v); return o >= 1000 ? `${(o / 1000).toFixed(o < 10000 ? 2 : 1)} kHz` : `${o.toFixed(0)} Hz`; }, update);
    const sF = slider('tk-F', (v) => `${(100 * v).toFixed(1)} %`, update);
    const sK = slider('tk-kf', (v) => `${v.toFixed(1)} s⁻¹`, update);
    const sT1 = slider('tk-t1', (v) => `${v.toFixed(2)} s`, update);

    function readParams() {
      P.b1 = sB1.get(); P.off = offFromSlider(sOff.get()); P.F = sF.get(); P.kf = sK.get(); P.R1f = 1 / sT1.get();
      if (gCache.off !== P.off) gCache = { off: P.off, g: S.lineshape('superlorentzian', P.off, T2R) };
      const w1 = TWO_PI * GAMMA * P.b1;
      P.Wr = Math.PI * w1 * w1 * gCache.g;
      P.Wf = Math.PI * w1 * w1 * S.lorentzianG(P.off, T2F);
      P.has = P.F > 1e-6;
      P.kr = P.has ? P.kf / P.F : 0;
      const ss = steady(true);
      $('tk-ss').innerHTML = P.b1 > 0
        ? `RF left on: water settles at <b>${ss[0].toFixed(2)}</b>, MTR <b>${(100 * (1 - ss[0])).toFixed(0)} %</b>.<br><span class="tk-w">W<sub>r</sub> = ${P.Wr.toFixed(P.Wr < 10 ? 2 : 1)} s⁻¹, W<sub>f</sub> = ${P.Wf.toFixed(P.Wf < 0.1 ? 3 : 2)} s⁻¹</span>`
        : 'Set B<sub>1</sub> above 0 to saturate anything.';
    }
    const kfEff = () => (P.has ? P.kf : 0);
    function steady(rf) {
      const kf = kfEff(), Wf = rf ? P.Wf : 0, Wr = rf ? P.Wr : 0;
      if (!P.has) return [P.R1f / (P.R1f + Wf), 1];
      const a11 = P.R1f + kf + Wf, a12 = -kf, a21 = -P.kr, a22 = R1R + P.kr + Wr, det = a11 * a22 - a12 * a21;
      return [(P.R1f * a22 - a12 * R1R) / det, (a11 * R1R - a21 * P.R1f) / det];
    }

    // state; backward Euler (stable for the narrow tank's fast k_r)
    const st = { hf: 1, hr: 1, t: 0, mode: 'pulse', ps: 1, pe: 5, dash: 0 };
    const rfOn = () => P.b1 > 0 && (st.mode === 'on' || (st.mode === 'pulse' && st.t >= st.ps && st.t < st.pe));
    function step(dt) {
      const rf = rfOn(), kf = kfEff(), Wf = rf ? P.Wf : 0, Wr = rf ? P.Wr : 0;
      if (!P.has) { st.hf = (st.hf + dt * P.R1f) / (1 + dt * (P.R1f + Wf)); return; }
      const m11 = 1 + dt * (P.R1f + kf + Wf), m12 = -dt * kf, m21 = -dt * P.kr, m22 = 1 + dt * (R1R + P.kr + Wr);
      const b1 = st.hf + dt * P.R1f, b2 = st.hr + dt * R1R, det = m11 * m22 - m12 * m21;
      st.hf = (b1 * m22 - m12 * b2) / det;
      st.hr = (m11 * b2 - m21 * b1) / det;
    }

    // ------------------------------------------------------------ scene
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 680 430'); svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
    $('tk-scene').appendChild(svg);
    const mk = (tag, attrs = {}, parent = svg, text) => {
      const e = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      if (text != null) e.textContent = text;
      parent.appendChild(e);
      return e;
    };
    const set = (e, attrs) => { for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); };
    const TOP = 84, BOT = 324, HS = 200, FX = 70, FW = 270, RX = 470, PY = 300, PH = 12, FLOOR = 428;
    const yOf = (h) => BOT - 3 - h * HS;

    const defs = mk('defs');
    const grad = mk('linearGradient', { id: 'tk-fade', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    mk('stop', { offset: '0%', 'stop-color': '#fff', 'stop-opacity': 1 }, grad);
    mk('stop', { offset: '100%', 'stop-color': '#fff', 'stop-opacity': 0 }, grad);
    const mask = mk('mask', { id: 'tk-fall', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 680, height: 430 }, defs);
    mk('rect', { x: 0, y: 0, width: 680, height: 330, fill: '#fff' }, mask);
    mk('rect', { x: 0, y: 330, width: 680, height: 100, fill: 'url(#tk-fade)' }, mask);
    const gStreams = mk('g', { mask: 'url(#tk-fall)' }), gPipes = mk('g'), gTanks = mk('g'), gLabels = mk('g', { 'font-size': 14, 'font-family': 'var(--font)' });
    const streamRect = (color) => mk('rect', { fill: color, opacity: 0.85, rx: 1 }, gStreams);
    const pipeRect = () => mk('rect', { fill: COL.glass, stroke: COL.muted, 'stroke-width': 1.5 }, gPipes);
    function faucet() {
      const g = mk('g', {}, gPipes);
      return {
        g,
        line: mk('rect', { height: 9, fill: COL.glass, stroke: COL.muted, 'stroke-width': 1.5 }, g),
        spout: mk('rect', { width: 12, height: 18, fill: COL.glass, stroke: COL.muted, 'stroke-width': 1.5 }, g),
        handle: mk('rect', { width: 16, height: 5, rx: 2, fill: COL.muted }, g),
        stem: mk('rect', { width: 3, height: 8, fill: COL.muted }, g),
      };
    }
    const fau = { f: faucet(), r: faucet() };
    const fallIn = { f: streamRect(COL.free), r: streamRect(COL.restr) };
    const drainPipe = { f: pipeRect(), r: pipeRect() };
    const fallOut = { f: streamRect(COL.free), r: streamRect(COL.restr) };
    const rfPipe = pipeRect(), rfFall = streamRect(COL.rf);
    const leakPipe = pipeRect(), leakFall = streamRect(COL.direct);
    const valve = mk('path', { stroke: COL.rf, 'stroke-width': 2 }, gPipes);
    const leakValve = mk('path', { stroke: COL.direct, 'stroke-width': 2 }, gPipes);
    const pipe = mk('rect', { y: PY, height: PH, fill: COL.glass, stroke: COL.muted, 'stroke-width': 1.5 }, gPipes);
    const pipeFlow = mk('line', { y1: PY + PH / 2, y2: PY + PH / 2, stroke: COL.ex, 'stroke-width': 5, 'stroke-dasharray': '9 9', 'stroke-linecap': 'round' }, gPipes);
    function tank(color) {
      const g = mk('g', {}, gTanks);
      return {
        g,
        glass: mk('rect', { y: TOP, height: BOT - TOP, fill: COL.glass }, g),
        water: mk('rect', { fill: color, opacity: 0.82 }, g),
        surf: mk('line', { stroke: color, 'stroke-width': 2.5 }, g),
        full: mk('line', { stroke: COL.muted, 'stroke-width': 1.2, 'stroke-dasharray': '5 5' }, g),
        wall: mk('path', { fill: 'none', stroke: COL.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, g),
      };
    }
    const tk = { f: tank(COL.free), r: tank(COL.restr) };
    const bolt = mk('path', { d: 'M 0 0 l -13 22 l 11 0 l -13 25', fill: 'none', stroke: COL.rf, 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    const L = (attrs, text) => mk('text', { fill: COL.muted, ...attrs }, gLabels, text);
    L({ x: FX + FW / 2, y: 22, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700, fill: COL.free }, 'Water (free pool)');
    const titleR = L({ y: 22, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700, fill: COL.restr }, 'Macromolecules');
    const noneR = L({ y: 210, 'text-anchor': 'middle', 'font-size': 15 }, '(none: F = 0)');
    const fullF = L({ x: FX + FW - 8, 'text-anchor': 'end', 'font-size': 13 }, 'full = M₀');
    const lbFauF = L({ 'font-size': 13 }, 'T₁ refill'), lbFauR = L({ 'font-size': 13 }, 'T₁ refill');
    const lbDrF = L({ 'font-size': 13 }, 'T₁ drain'), lbDrR = L({ 'font-size': 13, 'text-anchor': 'end' }, 'T₁ drain');
    const lbPipe = L({ 'text-anchor': 'middle', 'font-size': 14, fill: COL.ex, 'font-weight': 700 }, 'exchange');
    const lbPipeV = L({ 'text-anchor': 'middle', 'font-size': 13, fill: COL.ex }, '');
    const lbRF = L({ 'text-anchor': 'middle', 'font-size': 14, fill: COL.rf, 'font-weight': 700 }, 'RF');
    L({ x: FX - 22, y: PY - 10, 'text-anchor': 'middle', 'font-size': 12, fill: COL.direct, 'font-weight': 700 }, 'direct');
    [0, 0.5, 1].forEach((h) => L({ x: FX - 40, y: yOf(h) + 4, 'text-anchor': 'end', 'font-size': 12 }, h.toFixed(1)));

    const wpx = (q) => (q < 0.003 ? 0 : Math.min(20, Math.max(1.4, 8 * q)));
    function vstream(rect, cx, y0, y1, q) {
      const w = wpx(q);
      set(rect, { x: cx - w / 2, y: y0, width: w, height: Math.max(0, y1 - y0), visibility: w ? 'visible' : 'hidden' });
    }
    const show = (e, on) => { e.style.display = on ? '' : 'none'; };

    function render() {
      const has = P.has, RW = Math.max(12, FW * P.F), rf = rfOn(), kf = kfEff();
      const cf = FX + FW / 2, cr = RX + RW / 2;
      for (const [k, x, w, h] of [['f', FX, FW, st.hf], ['r', RX, RW, st.hr]]) {
        const t = tk[k], y = yOf(h);
        show(t.g, k === 'f' || has);
        set(t.glass, { x, width: w });
        set(t.water, { x: x + 3, width: w - 6, y, height: BOT - 3 - y });
        set(t.surf, { x1: x + 3, x2: x + w - 3, y1: y, y2: y });
        set(t.full, { x1: x + 3, x2: x + w - 3, y1: yOf(1), y2: yOf(1) });
        set(t.wall, { d: `M ${x} ${TOP} L ${x} ${BOT} L ${x + w} ${BOT} L ${x + w} ${TOP}` });
      }
      set(fullF, { y: yOf(1) - 6 });
      set(titleR, { x: has ? cr : RX + 50 }); titleR.style.opacity = has ? 1 : 0.45;
      set(noneR, { x: RX + 50 }); show(noneR, !has);
      for (const [k, cx, on] of [['f', cf, true], ['r', cr, has]]) {
        const f = fau[k];
        show(f.g, on);
        set(f.line, { x: cx - 40, y: 46, width: 40 }); set(f.spout, { x: cx - 6, y: 46 });
        set(f.handle, { x: cx - 30, y: 33 }); set(f.stem, { x: cx - 23.5, y: 38 });
      }
      vstream(fallIn.f, cf, 64, yOf(st.hf), P.R1f);
      vstream(fallIn.r, cr, 64, yOf(st.hr), has ? R1R * P.F : 0);
      set(lbFauF, { x: cf + 14, y: 60 }); set(lbFauR, { x: cr + 14, y: 60 }); show(lbFauR, has);
      for (const [k, cx, h, R1, A, on] of [['f', cf, st.hf, P.R1f, 1, true], ['r', cr, st.hr, R1R, P.F, has]]) {
        set(drainPipe[k], { x: cx - 6, y: BOT, width: 12, height: 18, visibility: on ? 'visible' : 'hidden' });
        vstream(fallOut[k], cx, BOT + 18, FLOOR, on ? R1 * A * h : 0);
      }
      set(lbDrF, { x: cf + 14, y: BOT + 30 }); set(lbDrR, { x: cr - 12, y: BOT + 30 }); show(lbDrR, has);
      [pipe, pipeFlow, lbPipe, lbPipeV, rfPipe, valve, lbRF].forEach((e) => show(e, has));
      const q = has ? kf * (st.hf - st.hr) : 0;
      set(pipe, { x: FX + FW, width: RX - FX - FW });
      set(pipeFlow, { x1: FX + FW + 6, x2: RX - 6, 'stroke-dashoffset': -st.dash, opacity: Math.min(1, Math.abs(q) * 3) });
      const mid = (FX + FW + RX) / 2;
      set(lbPipe, { x: mid, y: PY - 26 }); set(lbPipeV, { x: mid, y: PY - 10 });
      lbPipeV.textContent = has && kf === 0 ? 'closed (k_f = 0)' : Math.abs(q) < 0.005 ? 'no net flow' : `${q > 0 ? '→' : '←'} ${Math.abs(q).toFixed(2)} /s`;
      const vx = RX + RW;
      set(rfPipe, { x: vx, y: PY, width: 44, height: PH });
      set(valve, { d: `M ${vx + 16} ${PY - 4} L ${vx + 28} ${PY + PH + 4} L ${vx + 28} ${PY - 4} L ${vx + 16} ${PY + PH + 4} Z`, fill: rf ? COL.rf : COL.surface });
      vstream(rfFall, vx + 38, PY + PH, FLOOR, has && rf ? P.Wr * P.F * st.hr : 0);
      set(lbRF, { x: vx + 22, y: PY - 12 });
      set(bolt, { transform: `translate(${(has ? vx : RX + 100) + 30} ${TOP - 4})`, visibility: rf ? 'visible' : 'hidden' });
      set(leakPipe, { x: FX - 44, y: PY, width: 44, height: PH });
      set(leakValve, { d: `M ${FX - 28} ${PY - 4} L ${FX - 16} ${PY + PH + 4} L ${FX - 16} ${PY - 4} L ${FX - 28} ${PY + PH + 4} Z`, fill: rf ? COL.direct : COL.surface });
      vstream(leakFall, FX - 38, PY + PH, FLOOR, rf ? P.Wf * st.hf : 0);
      const left = st.mode === 'pulse' && st.t < st.pe ? (st.t < st.ps ? ` · starts in ${(st.ps - st.t).toFixed(1)} s` : ` · ${(st.pe - st.t).toFixed(1)} s left`) : '';
      $('tk-read').innerHTML = `<span class="tk-free">water <b id="tk-hf">${st.hf.toFixed(2)}</b></span>`
        + (has ? `<span class="tk-restr">macromolecules <b>${st.hr.toFixed(2)}</b></span>` : '')
        + `<span class="tk-rf${rf ? ' on' : ''}">RF ${rf ? 'on' : 'off'}${left}</span>`;
    }

    // ------------------------------------------------------------ strip chart (canvas)
    const cv = $('tk-plot'), ctx = cv.getContext('2d');
    const hist = [], WIN = 12;
    let lastSample = -1;
    function sample() {
      if (st.t - lastSample < 0.02) return;
      lastSample = st.t;
      hist.push([st.t, st.hf, P.has ? st.hr : NaN, rfOn()]);
      while (hist.length && hist[0][0] < st.t - WIN - 0.5) hist.shift();
    }
    function sizeCanvas() {
      cv.width = Math.max(1, cv.offsetWidth * 2); cv.height = Math.max(1, cv.offsetHeight * 2);
      ctx.setTransform(2, 0, 0, 2, 0, 0);
    }
    function drawPlot() {
      const w = cv.offsetWidth, h = cv.offsetHeight, l = 40, r = 10, t = 10, b = 24;
      ctx.clearRect(0, 0, w, h);
      const t1 = Math.max(WIN, st.t);
      const X = (tt) => l + (tt - (t1 - WIN)) / WIN * (w - l - r), Y = (v) => t + (1 - v) * (h - t - b);
      ctx.fillStyle = COL.rf; ctx.globalAlpha = 0.12;
      let s = null;
      for (const p of hist) { if (p[3] && s === null) s = p[0]; if (!p[3] && s !== null) { ctx.fillRect(X(s), t, X(p[0]) - X(s), h - t - b); s = null; } }
      if (s !== null) ctx.fillRect(X(s), t, X(st.t) - X(s), h - t - b);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = COL.rule; ctx.lineWidth = 1; ctx.fillStyle = COL.muted; ctx.font = '13px "Helvetica Neue", Helvetica, Arial, sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (const v of [0, 0.5, 1]) { ctx.beginPath(); ctx.moveTo(l, Y(v)); ctx.lineTo(w - r, Y(v)); ctx.stroke(); ctx.fillText(v.toFixed(1), l - 6, Y(v)); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      for (let k = 0; k <= WIN; k += 2) ctx.fillText(k === WIN ? 'now' : `−${WIN - k} s`, X(t1 - WIN + k), h - 5);
      for (const [i, col] of [[2, COL.restr], [1, COL.free]]) {
        ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath();
        let pen = false;
        for (const p of hist) { const v = p[i]; if (Number.isNaN(v)) { pen = false; continue; } if (pen) ctx.lineTo(X(p[0]), Y(v)); else { ctx.moveTo(X(p[0]), Y(v)); pen = true; } }
        ctx.stroke();
      }
      if (rfOn()) {
        const ss = steady(true)[0];
        ctx.setLineDash([5, 5]); ctx.strokeStyle = COL.free; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(l, Y(ss)); ctx.lineTo(w - r, Y(ss)); ctx.stroke(); ctx.setLineDash([]);
      }
    }

    // ------------------------------------------------------------ controls
    const rfBox = section.querySelector('.seg[data-ctl="tk-rf"]');
    const setRF = (v) => rfBox.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    rfBox.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      b.blur(); st.mode = b.dataset.v; setRF(st.mode);
      if (st.mode === 'pulse') { st.ps = st.t; st.pe = st.t + 4; }
    }));
    const PRESETS = { wm: { 'tk-F': 0.161, 'tk-kf': 4.3, 'tk-t1': 1, 'tk-b1': 2.3, 'tk-off': 0.4515 }, nokf: { 'tk-kf': 0 }, water: { 'tk-F': 0 } };
    const sliders = { 'tk-F': sF, 'tk-kf': sK, 'tk-t1': sT1, 'tk-b1': sB1, 'tk-off': sOff };
    section.querySelectorAll('[data-tk-preset]').forEach((b) => b.addEventListener('click', () => {
      b.blur();
      const p = b.dataset.tkPreset;
      if (p === 'nokf' && sF.get() === 0) sF.set(0.161);
      if (p === 'water') sK.set(4.3);
      for (const [id, v] of Object.entries(PRESETS[p])) sliders[id].set(v);
      update();
    }));
    $('tk-refill').addEventListener('click', (e) => { e.currentTarget.blur(); st.hf = 1; st.hr = 1; render(); });

    function update() { readParams(); render(); drawPlot(); }

    // ------------------------------------------------------------ loop, only while the slide is shown
    let raf = null, last = null;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function frame(now) {
      const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      if (dt > 0) {
        const n = Math.max(1, Math.ceil(dt / 0.002));
        for (let i = 0; i < n; i++) { step(dt / n); st.t += dt / n; sample(); }
        if (st.mode === 'pulse' && st.t >= st.pe) { st.mode = 'off'; setRF('off'); }
        if (!reduce) st.dash += kfEff() * (st.hf - st.hr) * 60 * dt;
      }
      render(); drawPlot();
      raf = requestAnimationFrame(frame);
    }
    readParams(); render();
    return {
      show() {
        if (raf) return;
        sizeCanvas(); last = null;
        // every visit starts with a fresh 4 s pulse, 1 s in
        if (st.mode !== 'on') { st.mode = 'pulse'; st.ps = st.t + 1; st.pe = st.t + 5; setRF('pulse'); }
        raf = requestAnimationFrame(frame);
      },
      hide() { if (raf) cancelAnimationFrame(raf); raf = null; },
    };
  });
})();
