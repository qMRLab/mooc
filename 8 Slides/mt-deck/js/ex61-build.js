/* Exercise 6-1, slide "Predict, then watch": a predict-first quiz (as the B1 deck's Exercise 4-3) that builds the two-pool
 * model up in three stages, each question checked by a short simulation shown as tanks and a time course:
 *   1 · one pool (water): an on-resonance 90° pulse tips all of Mz, then T1 recovery; an off-resonance pulse barely dips it
 *       (direct saturation through water's narrow Lorentzian line).
 *   2 · two pools, no exchange: the same off-resonance pulse saturates the macromolecules (broad super-Lorentzian line)
 *       almost fully, water only by direct saturation; each recovers with its own T1.
 *   3 · two pools + exchange: exchange alone from three starting states (slow motion: it evens the levels out in tens of
 *       ms), then the off-resonance pulse, whose saturation exchange passes on to water: the MT effect.
 * The questions live in the slide's <ol class="hq-data">: <li data-scn="scenario" data-stage="1|2|3" data-a="key"
 * data-opts="key:label|key:label"> with a <span class="q"> (question) and a <span class="w"> (why). Before an answer the
 * figure shows the starting state; the answer plays the scenario. Longitudinal Bloch–McConnell, continuous-wave RF during
 * the pulse (W from the simulator's lineshapes), R1f = R1r = 1 s⁻¹, healthy WM pool size and exchange (Sled & Pike 2001). */
(function () {
  'use strict';
  const { S, C } = window.MT;
  const $ = (id) => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';

  // tissue and pulse
  const F = 0.161, KF = 4.3, R1F = 1, R1R = 1, T2F = 0.037, T2R = 12.3e-6;
  // off-resonance pulses at 1.5 kHz: a long one (3 µT, 5 s) that reaches steady state, and a short strong one (8 µT, 20 ms)
  // that saturates the macromolecules before water can respond
  const OFF = 1500;
  const rates = (b1) => { const w1 = 2 * Math.PI * 42.577 * b1; return { wr: Math.PI * w1 * w1 * S.lineshape('superlorentzian', OFF, T2R), wf: Math.PI * w1 * w1 * S.lorentzianG(OFF, T2F) }; };
  const LONG = { kind: 'off', t: 1, dur: 5, label: 'long off-resonance pulse (5 s)', ...rates(3) };
  const SHORT = { kind: 'off', t: 0.05, dur: 0.02, label: 'short pulse (20 ms)', ...rates(8) };

  // scenarios: duration T (s), playback speed, start levels h0 = [h_f, h_r], pulses ({ t, kind: 'on' 90° hard pulse |
  // 'off' CW pulse of dur s at the rates wr, wf }), pools, exchange
  const SCN = {
    onres: { T: 6, speed: 1, h0: [1, 1], two: false, kf: 0, pulses: [{ t: 1, kind: 'on', label: 'on-resonance 90°' }] },
    offres: { T: 10, speed: 1, h0: [1, 1], two: false, kf: 0, pulses: [LONG] },
    noex: { T: 10, speed: 1, h0: [1, 1], two: true, kf: 0, pulses: [LONG] },
    exA: { T: 0.5, speed: 0.1, h0: [1, 0.2], two: true, kf: KF, noT1: true, pulses: [] },     // no relaxation: exchange alone
    exA2: { T: 0.5, speed: 0.1, h0: [0.2, 1], two: true, kf: KF, noT1: true, pulses: [] },
    exB: { T: 0.5, speed: 0.1, h0: [1, 1], two: true, kf: KF, pulses: [] },
    exC: { T: 0.5, speed: 0.1, h0: [0.3, 0.3], two: true, kf: KF, pulses: [] },
    exD: { T: 10, speed: 1, h0: [1, 1], two: true, kf: KF, pulses: [LONG] },
    exE: { T: 0.5, speed: 0.1, h0: [1, 1], two: true, kf: KF, pulses: [SHORT] },
  };

  // longitudinal two-pool equations, small explicit steps (dt ≪ 1/(k_r + W_r)); 500 samples per scenario
  function simulate(key) {
    const c = SCN[key], dt = 1e-5 * Math.max(1, Math.round(c.T)), every = Math.max(1, Math.round(c.T / 500 / dt)), kr = c.kf / F, out = [];
    let [hf, hr] = c.h0;
    const r1f = c.noT1 ? 0 : R1F, r1r = c.noT1 ? 0 : R1R;
    for (let i = 0, t = 0; t <= c.T + 1e-9; i++, t = i * dt) {
      for (const p of c.pulses) if (p.kind === 'on' && Math.abs(t - p.t) < dt / 2) hf *= Math.cos(Math.PI / 2);
      const on = c.pulses.find((p) => p.kind === 'off' && t >= p.t && t < p.t + p.dur);
      if (i % every === 0) out.push([t, hf, c.two ? hr : NaN]);
      const dF = r1f * (1 - hf) - c.kf * hf + c.kf * hr - (on ? on.wf : 0) * hf;
      const dR = c.two ? r1r * (1 - hr) + kr * hf - kr * hr - (on ? on.wr : 0) * hr : 0;
      hf += dt * dF; hr += dt * dR;
    }
    c.ds = every * dt;
    return out;
  }
  const TRACES = Object.fromEntries(Object.keys(SCN).map((k) => [k, simulate(k)]));

  window.MTDeck.widget('s-build', (section) => {
    const items = [...section.querySelectorAll('.hq-data > li')].map((li) => ({
      scn: li.dataset.scn, stage: li.dataset.stage, a: li.dataset.a, q: li.querySelector('.q').innerHTML, w: li.querySelector('.w').innerHTML,
      opts: li.dataset.opts.split('|').map((s) => { const i = s.indexOf(':'); return [s.slice(0, i), s.slice(i + 1)]; }),
    }));
    const st = { k: 0, answered: null, right: 0, done: 0 };
    let t = 0, playing = false, dash = 0, raf = null, last = null;
    const cur = () => items[Math.min(st.k, items.length - 1)];
    const key = () => cur().scn;
    const at = (tt) => { const tr = TRACES[key()]; return tr[Math.max(0, Math.min(tr.length - 1, Math.round(tt / SCN[key()].ds)))]; };
    const pulseAt = (tt) => SCN[key()].pulses.find((p) => (p.kind === 'off' ? tt >= p.t && tt < p.t + Math.max(p.dur, 0.004) : tt >= p.t && tt < p.t + 0.35));

    // ------------------------------------------------------------ tanks (SVG)
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 360 330'); svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
    $('bd-tanks').appendChild(svg);
    const mk = (tag, attrs = {}, text) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (text != null) e.textContent = text; svg.appendChild(e); return e; };
    const set = (e, attrs) => { for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); };
    const TOP = 70, BOT = 270, HS = 190, FX = 20, FW = 160, RX = 275, RW = Math.max(26, FW * F);
    const yOf = (h) => BOT - 3 - h * HS;
    const pipe = mk('rect', { x: FX + FW, y: BOT - 22, width: RX - FX - FW, height: 12, fill: '#f7fafc', stroke: C.muted, 'stroke-width': 1.5 });
    const flow = mk('line', { x1: FX + FW + 5, x2: RX - 5, y1: BOT - 16, y2: BOT - 16, stroke: C.ex, 'stroke-width': 5, 'stroke-dasharray': '8 8', 'stroke-linecap': 'round' });
    const pipeLab = mk('text', { x: (FX + FW + RX) / 2, y: BOT - 30, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: C.ex }, 'exchange');
    const closed = mk('text', { x: (FX + FW + RX) / 2, y: BOT - 30, 'text-anchor': 'middle', 'font-size': 12, fill: C.muted }, 'no exchange');
    function tank(x, w, color, label) {
      const g = {};
      g.glass = mk('rect', { x, y: TOP, width: w, height: BOT - TOP, fill: '#f7fafc' });
      g.water = mk('rect', { x: x + 3, width: w - 6, fill: color, opacity: 0.82 });
      g.full = mk('line', { x1: x + 3, x2: x + w - 3, y1: yOf(1), y2: yOf(1), stroke: C.muted, 'stroke-width': 1.2, 'stroke-dasharray': '5 5' });
      g.wall = mk('path', { d: `M ${x} ${TOP} L ${x} ${BOT} L ${x + w} ${BOT} L ${x + w} ${TOP}`, fill: 'none', stroke: C.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
      g.label = mk('text', { x: x + w / 2, y: TOP - 18, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: color }, label);
      g.val = mk('text', { x: x + w / 2, y: BOT + 24, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: color }, '');
      return g;
    }
    const tf = tank(FX, FW, C.free, 'Water'), tr = tank(RX, RW, C.restr, 'Macromolecules');
    mk('text', { x: FX + FW - 6, y: yOf(1) - 6, 'text-anchor': 'end', 'font-size': 12, fill: C.muted }, 'full = M₀');
    const rfLab = mk('text', { x: 180, y: 18, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: '#c92a2a' }, '');
    const show = (els, on) => els.forEach((e) => { e.style.display = on ? '' : 'none'; });

    function renderTanks() {
      const c = SCN[key()], [, hf, hr] = at(t), p = st.answered ? pulseAt(t) : null;
      set(tf.water, { y: yOf(hf), height: BOT - 3 - yOf(hf) }); tf.val.textContent = hf.toFixed(2);
      show(Object.values(tr), c.two);
      if (c.two) { set(tr.water, { y: yOf(hr), height: BOT - 3 - yOf(hr) }); tr.val.textContent = hr.toFixed(2); }
      show([pipe], c.two); show([flow, pipeLab], c.two && c.kf > 0); show([closed], c.two && c.kf === 0);
      if (c.two && c.kf > 0) set(flow, { opacity: Math.min(1, Math.abs(c.kf * (hf - hr)) * 2), 'stroke-dashoffset': -dash });
      rfLab.textContent = p ? `⚡ ${p.label}` : '';
    }

    // ------------------------------------------------------------ time course (canvas)
    const cv = $('bd-plot'), ctx = cv.getContext('2d');
    const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    function sizeCanvas() { cv.width = Math.max(1, cv.offsetWidth * 2); cv.height = Math.max(1, cv.offsetHeight * 2); ctx.setTransform(2, 0, 0, 2, 0, 0); }
    function drawPlot() {
      const c = SCN[key()], w = cv.offsetWidth, h = cv.offsetHeight, l = 44, r = 26, tp = 30, b = 30;
      const X = (tt) => l + (tt / c.T) * (w - l - r), Y = (v) => tp + (1 - v) * (h - tp - b);
      ctx.clearRect(0, 0, w, h);
      ctx.font = `13px ${FONT}`;
      for (const p of c.pulses) {
        ctx.fillStyle = '#c92a2a'; ctx.textAlign = 'left';
        if (p.kind === 'off') {
          ctx.globalAlpha = 0.12; ctx.fillRect(X(p.t), tp, Math.max(3, X(p.t + p.dur) - X(p.t)), h - tp - b); ctx.globalAlpha = 1;
          ctx.fillText(p.label, X(p.t) + 4, tp - 8);
        } else {
          ctx.strokeStyle = '#c92a2a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(X(p.t), tp); ctx.lineTo(X(p.t), h - b); ctx.stroke();
          ctx.fillText(p.label, X(p.t) + 4, tp - 8);
        }
      }
      ctx.strokeStyle = C.rule; ctx.lineWidth = 1; ctx.fillStyle = C.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (const v of [0, 0.5, 1]) { ctx.beginPath(); ctx.moveTo(l, Y(v)); ctx.lineTo(w - r, Y(v)); ctx.stroke(); ctx.fillText(v.toFixed(1), l - 6, Y(v)); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      if (c.T <= 1) for (let k = 0; k <= c.T + 1e-9; k += 0.1) ctx.fillText(`${Math.round(k * 1000)} ms`, X(k), h - 8);
      else for (let k = 0; k <= c.T; k += 2) ctx.fillText(`${k} s`, X(k), h - 8);
      if (c.noT1) { ctx.textAlign = 'left'; ctx.fillStyle = C.muted; ctx.font = `700 13px ${FONT}`; ctx.fillText('no relaxation (T₁ off)', l + 4, tp - 8); ctx.font = `13px ${FONT}`; ctx.textAlign = 'center'; }
      if (c.speed < 1) { ctx.textAlign = 'right'; ctx.fillStyle = C.ex; ctx.font = `700 13px ${FONT}`; ctx.fillText(`slow motion ×${Math.round(1 / c.speed)}`, w - r, tp - 8); ctx.font = `13px ${FONT}`; ctx.textAlign = 'center'; }
      ctx.save(); ctx.fillStyle = C.muted; ctx.translate(12, (tp + h - b) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('Mz / M₀', 0, 0); ctx.restore();
      if (!st.answered) {   // before the answer: the starting levels only
        ctx.fillStyle = C.muted; ctx.font = `italic 15px ${FONT}`; ctx.textAlign = 'center';
        ctx.fillText('Predict first: your answer plays it', (l + w - r) / 2, (tp + h - b) / 2 + 40);
        ctx.font = `13px ${FONT}`;
      }
      const pts = TRACES[key()].filter(([tt]) => tt <= t + 1e-9);
      for (const [i, col, on] of [[2, C.restr, c.two], [1, C.free, true]]) {
        if (!on) continue;
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath();
        pts.forEach((p, k) => (k ? ctx.lineTo(X(p[0]), Y(p[i])) : ctx.moveTo(X(p[0]), Y(p[i]))));
        ctx.stroke();
        if (pts.length === 1) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(0), Y(pts[0][i]), 4.5, 0, 6.283); ctx.fill(); }
      }
    }

    // ------------------------------------------------------------ the quiz card
    const box = section.querySelector('.hq-btns'), next = section.querySelector('.hq-next'), tabs = [...section.querySelectorAll('[data-stage-go]')];
    const label = (it, k) => (it.opts.find(([x]) => x === k) || [k, k])[1];
    function draw() {
      const done = st.k >= items.length, it = cur();
      section.querySelector('.hq-count').textContent = done ? 'All done' : `Question ${st.k + 1} of ${items.length}`;
      section.querySelector('.hq-score').textContent = `${st.right} / ${st.done} right`;
      section.querySelector('.hq-q').innerHTML = done ? `You got <b>${st.right} out of ${items.length}</b>. Next: the full plumbing, with all the knobs.` : it.q;
      box.innerHTML = done ? '' : it.opts.map(([k, l]) => `<button class="bs-btn" data-hq="${k}"${st.answered ? ' disabled' : ''}>${l}</button>`).join('');
      if (st.answered) box.querySelectorAll('[data-hq]').forEach((b) => { b.classList.toggle('hq-pick', b.dataset.hq === st.answered); b.classList.toggle('hq-good', b.dataset.hq === it.a); });
      const ok = st.answered === it.a, fb = section.querySelector('.hq-fb'), why = section.querySelector('.hq-why');
      fb.hidden = done || !st.answered; fb.className = `hq-fb ${ok ? 'hq-right' : 'hq-wrong'}`;
      fb.innerHTML = st.answered ? (ok ? `✓ Right: ${label(it, it.a)}` : `✗ Answer: ${label(it, it.a)}`) : '';
      why.hidden = done || !st.answered; why.innerHTML = st.answered ? it.w : '';
      next.hidden = !done && !st.answered;
      next.textContent = done ? 'Start again' : st.k === items.length - 1 ? 'See the score' : 'Next question';
      tabs.forEach((b) => b.setAttribute('aria-pressed', String(!done && b.dataset.stageGo === it.stage)));
      $('bd-replay').hidden = !st.answered;
    }
    function setup() { t = 0; playing = false; renderTanks(); drawPlot(); draw(); }
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-hq]'); if (!b || st.answered) return;
      b.blur(); st.answered = b.dataset.hq; st.done++; if (st.answered === cur().a) st.right++;
      t = 0; playing = true; draw();
    });
    next.addEventListener('click', () => {
      next.blur();
      if (st.k >= items.length) { st.k = 0; st.right = 0; st.done = 0; } else st.k++;
      st.answered = null; setup();
    });
    tabs.forEach((b) => b.addEventListener('click', () => {
      b.blur(); st.k = items.findIndex((it) => it.stage === b.dataset.stageGo); st.answered = null; setup();
    }));
    $('bd-replay').addEventListener('click', (e) => { e.currentTarget.blur(); t = 0; playing = true; });

    // ------------------------------------------------------------ loop, only while the slide is shown
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function frame(now) {
      const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      const c = SCN[key()];
      if (playing) { t = reduce ? c.T : Math.min(c.T, t + dt * c.speed); if (t >= c.T) playing = false; }
      if (c.two && c.kf > 0 && !reduce) { const [, hf, hr] = at(t); dash += Math.sign(hf - hr) * Math.min(1, Math.abs(hf - hr) * 4) * 60 * dt; }
      renderTanks(); drawPlot();
      raf = requestAnimationFrame(frame);
    }
    setup();
    return {
      show() { if (raf) return; sizeCanvas(); last = null; drawPlot(); raf = requestAnimationFrame(frame); },
      hide() { if (raf) cancelAnimationFrame(raf); raf = null; },
    };
  });
})();
