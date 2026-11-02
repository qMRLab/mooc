/* Bloch–Siegert exercise slides (#bs-a … #bs-d). The physics is in bs-core.js; the spin drawing below is the
 * T2 lab's (GBM-MRI T2 deck, js/exn.js: blochSlide's proj/line/arrow/label, speedColour), made reusable:
 * an orthographic sphere you turn by dragging, M in blue, B1 in orange, axes ±x ±y z. */
(function () {
  'use strict';
  const BS = window.BS;
  const B1_COLOUR = '#e8770e', M_COLOUR = '#1f5f99', AXIS = '#9aa5b1', MUTED = '#5b6776', FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const DEG = 180 / Math.PI;

  function speedColour(c) {   // c in [−1, 1]: blue (slower) through grey (on resonance) to red (faster)
    const mix = (a, b, f) => a.map((x, i) => Math.round(x + (b[i] - x) * f));
    return `rgb(${(c < 0 ? mix([150, 158, 168], [33, 102, 172], -c) : mix([150, 158, 168], [178, 24, 43], c)).join(',')})`;
  }

  // ---- the sphere ----
  function makeSphere(canvas, { prime = false } = {}) {
    const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height, R = 0.36 * Math.min(W, H), FS = Math.round(0.046 * W);
    let az = -0.6, el = 0.45, scene = { arrows: [], trails: [], spins: [] };
    function proj(v) {
      const x1 = v[0] * Math.cos(az) - v[1] * Math.sin(az), y1 = v[0] * Math.sin(az) + v[1] * Math.cos(az);
      return [W / 2 + R * x1, H / 2 + 0.04 * H - R * (v[2] * Math.cos(el) + y1 * Math.sin(el))];
    }
    function line(a, b, colour, width, dash) {
      const p = proj(a), q = proj(b);
      g.strokeStyle = colour; g.lineWidth = width; g.setLineDash(dash || []);
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); g.setLineDash([]);
    }
    function arrow(v, colour, width) {
      if (Math.hypot(v[0], v[1], v[2]) < 0.02) return;
      line([0, 0, 0], v, colour, width);
      const p = proj(v), o = proj([0, 0, 0]), ang = Math.atan2(p[1] - o[1], p[0] - o[0]), h = 0.033 * W;
      g.fillStyle = colour; g.beginPath(); g.moveTo(p[0], p[1]);
      g.lineTo(p[0] - h * Math.cos(ang - 0.4), p[1] - h * Math.sin(ang - 0.4));
      g.lineTo(p[0] - h * Math.cos(ang + 0.4), p[1] - h * Math.sin(ang + 0.4)); g.closePath(); g.fill();
    }
    function label(v, text, colour, bold) {   // "B_eff" draws eff as a subscript
      const p = proj(v), [base, sub] = text.split('_'), f = `${bold ? '700 ' : ''}${FS}px ${FONT}`, fs = `${bold ? '700 ' : ''}${Math.round(0.7 * FS)}px ${FONT}`;
      g.fillStyle = colour; g.textBaseline = 'middle';
      if (!sub) { g.font = f; g.textAlign = 'center'; g.fillText(text, p[0], p[1]); return; }
      g.font = f; const wb = g.measureText(base).width; g.font = fs; const ws = g.measureText(sub).width;
      g.textAlign = 'left'; g.font = f; g.fillText(base, p[0] - (wb + ws) / 2, p[1]);
      g.font = fs; g.fillText(sub, p[0] - (wb + ws) / 2 + wb, p[1] + 0.3 * FS);
    }
    function draw(sc) {
      if (sc) scene = sc;
      g.clearRect(0, 0, W, H);
      g.strokeStyle = '#d8dee6'; g.lineWidth = 2; g.beginPath();
      for (let i = 0; i <= 96; i++) { const a = (i / 96) * 2 * Math.PI, p = proj([Math.cos(a), Math.sin(a), 0]); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
      g.stroke();
      const p = prime ? '′' : '';
      for (const [nx, ny, name] of [[1, 0, '+x'], [-1, 0, '−x'], [0, 1, '+y'], [0, -1, '−y']]) {
        line([0, 0, 0], [1.2 * nx, 1.2 * ny, 0], AXIS, 2);
        label([1.36 * nx, 1.36 * ny, 0], name + p, MUTED);
      }
      line([0, 0, -1.2], [0, 0, 1.2], AXIS, 2);
      label([0, 0, 1.34], 'z', MUTED);
      for (const tr of scene.trails || []) {
        if (tr.pts.length < 2) continue;
        g.strokeStyle = tr.colour; g.lineWidth = tr.width || 3; g.beginPath();
        tr.pts.forEach((v, k) => { const q = proj(v); k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); });
        g.stroke();
      }
      for (const sp of scene.spins || []) {
        line([0, 0, 0], sp.v, sp.colour, 4);
        const q = proj(sp.v); g.fillStyle = sp.colour; g.beginPath(); g.arc(q[0], q[1], 0.011 * W, 0, 2 * Math.PI); g.fill();
      }
      for (const a of scene.arrows || []) {
        if (a.shadow) { line([0, 0, 0], [a.v[0], a.v[1], 0], '#b8c2cc', 3, [10, 8]); line([a.v[0], a.v[1], 0], a.v, '#b8c2cc', 2, [4, 6]); }
        if (a.dash) line([0, 0, 0], a.v, a.colour, a.width, a.dash); else arrow(a.v, a.colour, a.width);
        if (a.label) { const n = Math.hypot(...a.v) || 1, k = (n + 0.16) / n; label(a.labelAt || [k * a.v[0], k * a.v[1], k * a.v[2] + 0.05], a.label, a.colour, true); }   // labelAt: to move a label clear of another
      }
    }
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
    return { draw };
  }

  // ---- playback: the 8 ms pulse, slowed down, with a scrubber ----
  const SPEEDS = { slow: 24000, normal: 8000, fast: 2000 };   // ms of playback for the whole pulse
  function makePlayer(host, onFrame) {
    host.innerHTML = `<button class="bs-btn bs-go">▶ Play</button>
      <div class="seg" role="group" aria-label="Playback speed"><button data-speed="slow" aria-pressed="false">slow</button><button data-speed="normal" aria-pressed="true">normal</button><button data-speed="fast" aria-pressed="false">fast</button></div>
      <input class="bs-scrub" type="range" min="0" max="1000" step="1" value="0" aria-label="Time in the pulse"><span class="bs-time">t = 0 ms</span>`;
    const go = host.querySelector('.bs-go'), scrub = host.querySelector('.bs-scrub'), time = host.querySelector('.bs-time');
    let speed = 'normal', raf = null, t0 = 0, f0 = 0;
    const show = (f) => { scrub.value = Math.round(1000 * f); time.textContent = `t = ${(f * BS.PULSE.T * 1e3).toFixed(2)} ms`; onFrame(f); };
    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; go.textContent = '▶ Play'; }
    function frame(now) {
      const f = Math.max(0, Math.min(1, f0 + (now - t0) / SPEEDS[speed]));
      show(f);
      if (f < 1) raf = requestAnimationFrame(frame); else stop();
    }
    function play() {
      if (raf) { stop(); return; }
      f0 = Number(scrub.value) / 1000; if (f0 >= 1) f0 = 0;
      t0 = performance.now(); go.textContent = '❚❚ Pause'; raf = requestAnimationFrame(frame);
    }
    go.addEventListener('click', (e) => { e.currentTarget.blur(); play(); });
    scrub.addEventListener('input', () => { stop(); show(Number(scrub.value) / 1000); });
    scrub.addEventListener('keydown', (e) => e.stopPropagation());
    host.querySelectorAll('[data-speed]').forEach((b) => b.addEventListener('click', () => {
      host.querySelectorAll('[data-speed]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      speed = b.dataset.speed;
      if (raf) { f0 = Number(scrub.value) / 1000; t0 = performance.now(); }
    }));
    if (window.Reveal) window.Reveal.on('slidechanged', stop);
    return { show, stop, rewind: () => { stop(); show(0); } };
  }

  const PLOT_FONT = { family: FONT, size: 14, color: INK };
  function plot(host, traces, layout, w, h) {
    Plotly.react(host, traces, {
      width: w, height: h, margin: { l: 58, r: 52, t: 10, b: 42 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: PLOT_FONT,
      showlegend: true, legend: { orientation: 'h', x: 0, y: 1.02, yanchor: 'bottom', font: { size: 13 } }, ...layout,
    }, { displayModeBar: false, scrollZoom: false, responsive: false });
  }
  const tMs = (r) => Array.from(r.t, (x) => x * 1e3);
  const idx = (r, f) => Math.max(0, Math.min(r.n - 1, Math.round(f * (r.n - 1))));   // rAF time can precede t0
  const tail = (arr, k, n, step = 1) => { const out = []; for (let i = Math.max(0, k - n); i <= k; i += step) out.push(arr[i]); return out; };
  const b1Arrow = (r, k, len = 1.15) => { const a = r.D * r.t[k]; return [len * r.env[k] * Math.cos(a), len * r.env[k] * Math.sin(a), 0]; };

  // ---- one sphere, three frames (slides (a) and (b)): the lab (the Larmor-frame vector turned at f0, drawn as LAB_TURNS turns
  // over the pulse, far slower than real), the Larmor frame (= receive) or the RF frame (= transmit: B1 still on x, the offset along z) ----
  const LAB_TURNS = 48;
  const FRAME_CAPS = { lab: 'Fixed to the scanner · f<sub>0</sub> drawn far slower than real', lar: 'Turns at f<sub>0</sub>, with the spins on resonance: what the receiver sees', rf: 'Turns at f<sub>RF</sub>, with the RF: B<sub>1</sub> stands still' };
  const labOf = (r) => r.lar.map((v, i) => BS.rotZ(v, (2 * Math.PI * LAB_TURNS * r.t[i]) / BS.PULSE.T));
  // ref: an optional dashed arrow (where M started), drawn in the Larmor and RF frames
  function drawFrame(sphere, r, lab, k, frame, ref) {
    const b1lab = r.env[k] > 0.15 ? 'B₁' : '', dashed = ref ? [{ v: ref, colour: '#b8c2cc', width: 3, dash: [8, 8] }] : [];
    if (frame === 'lab') {
      const a = (2 * Math.PI * LAB_TURNS * r.t[k]) / BS.PULSE.T;
      sphere.draw({
        trails: [{ pts: tail(lab, k, r.n, 1), colour: 'rgba(31, 95, 153, 0.45)' }],
        arrows: [{ v: [0, 0, 1.25], colour: INK, width: 5, label: 'B₀' }, { v: BS.rotZ(b1Arrow(r, k, 0.7), a), colour: B1_COLOUR, width: 6, label: b1lab }, { v: lab[k], colour: M_COLOUR, width: 9, label: 'M', shadow: true }],
      });
    } else if (frame === 'rf') {   // field (ω1(t), 0, δ − Δ), drawn to one scale: the peak field fills 1.15
      const w1 = r.w1max * r.env[k], oz = r.d - r.D, sc = 1.15 / Math.hypot(r.w1max, oz), arrows = dashed.concat([{ v: [w1 * sc, 0, 0], colour: B1_COLOUR, width: 6, label: b1lab }]);
      if (oz) arrows.push({ v: [0, 0, oz * sc], colour: INK, width: 5, label: 'ΔB₀', labelAt: [-0.2, -0.2, oz * sc * 0.92] }, { v: [w1 * sc, 0, oz * sc], colour: '#b2182b', width: 5, label: 'B_eff' });
      arrows.push({ v: r.rf[k], colour: M_COLOUR, width: 9, label: 'M', shadow: true });
      sphere.draw({ trails: [{ pts: tail(r.rf, k, r.n, 2), colour: 'rgba(31, 95, 153, 0.45)' }], arrows });
    } else {
      sphere.draw({
        trails: [{ pts: tail(r.lar, k, r.n, 2), colour: 'rgba(31, 95, 153, 0.45)' }],
        arrows: dashed.concat([{ v: b1Arrow(r, k), colour: B1_COLOUR, width: 6, label: b1lab }, { v: r.lar[k], colour: M_COLOUR, width: 9, label: 'M', shadow: true }]),
      });
    }
  }
  // the tabs on top of the sphere: colour the view, change its caption, then redraw
  function frameTabs(slide, onPick) {
    segToggle(slide, 'frame', (v) => { slide.querySelector('.fr-view').dataset.fr = v; slide.querySelector('.bs-cap').innerHTML = FRAME_CAPS[v]; onPick(v); });
  }

  // ---------------- (a) off resonance on M along z ----------------
  (function () {
    const slide = document.getElementById('bs-a'); if (!slide) return;
    const sphere = makeSphere(slide.querySelector('canvas')), host = slide.querySelector('.a-plot'), readout = slide.querySelector('.a-readout');
    const B1 = 0.1;
    const nominal = (shape) => { slide.querySelector('.a-nominal').textContent = `${Math.round(BS.W1_PER_G * B1 * BS.ints(shape).b * DEG)}°`; };
    nominal('fermi');
    let r, tilt, lab, frame = 'lar', shape = 'fermi', offNow = 0;   // shape: the pulse envelope (bs-core SHAPES)
    function compute(off) {
      offNow = off;
      r = BS.simulate({ b1: B1, offHz: off, m0: [0, 0, 1], shape });
      lab = labOf(r);
      tilt = r.lar.map((v) => Math.acos(Math.max(-1, Math.min(1, v[2]))) * DEG);
      const tm = tMs(r);
      plot(host, [
        { x: tm, y: Array.from(r.env, (e) => 100 * e), name: 'B₁ envelope (% of peak)', yaxis: 'y2', line: { color: B1_COLOUR, width: 1.5 }, fill: 'tozeroy', fillcolor: 'rgba(232,119,14,0.10)', hoverinfo: 'skip' },
        { x: tm, y: tilt, name: 'M, angle from z', line: { color: M_COLOUR, width: 2.2 }, hovertemplate: '%{x:.2f} ms: %{y:.2f}°<extra></extra>' },
        { x: [0], y: [0], mode: 'markers', marker: { color: INK, size: 9 }, showlegend: false, hoverinfo: 'skip' },
      ], {
        xaxis: { title: { text: 't (ms)', standoff: 4 }, range: [0, 8], fixedrange: true, zeroline: false },
        yaxis: { title: { text: 'angle from z (°)', standoff: 4 }, range: [0, 185], fixedrange: true, zeroline: false, dtick: 45 },
        yaxis2: { overlaying: 'y', side: 'right', range: [0, 125], tickvals: [0, 50, 100], ticktext: ['0%', '50%', '100%'], showgrid: false, fixedrange: true, tickfont: { color: B1_COLOUR, size: 12 } },   // the envelope peaks at 80 % of the height, below the top of the M curves
      }, 560, 250);
    }
    const player = makePlayer(slide.querySelector('.bs-play'), (f) => {
      const k = idx(r, f);
      const maxT = Math.max(...tilt.slice(0, k + 1));
      Plotly.restyle(host, { x: [[r.t[k] * 1e3]], y: [[tilt[k]]] }, [2]);
      drawFrame(sphere, r, lab, k, frame);
      readout.innerHTML = `M is <b>${tilt[k].toFixed(tilt[k] < 1 ? 2 : 1)}°</b> from z (largest so far: ${maxT.toFixed(1)}°)`
        + (f >= 1 ? ` · it ends <b>${tilt[r.n - 1].toFixed(tilt[r.n - 1] < 1 ? 2 : 1)}°</b> from z` : '');
    });
    segToggle(slide, 'off', (v) => { compute(Number(v)); player.rewind(); });
    segToggle(slide, 'shape', (v) => { shape = v; nominal(v); compute(offNow); player.rewind(); });
    frameTabs(slide, (v) => { frame = v; player.show(Number(slide.querySelector('.bs-scrub').value) / 1000); });
    onShow(slide, () => { compute(0); player.rewind(); });   // starts on resonance, in the Larmor (receive) frame
  })();

  // ---------------- (b) transverse M: one sphere, three frames, as on (a) ----------------
  (function () {
    const slide = document.getElementById('bs-b'); if (!slide) return;
    const sphere = makeSphere(slide.querySelector('canvas')), host = slide.querySelector('.b-plot'), readout = slide.querySelector('.b-readout');
    const B1 = 0.1, M0 = [0, 1, 0];
    let r, lab, phi, pred, frame = 'lar', shape = 'fermi', offNow = 0;
    const FRAME_NAME = { lab: 'the lab', lar: 'the Larmor frame', rf: 'the RF frame' };
    function compute(off) {
      offNow = off;
      r = BS.simulate({ b1: B1, offHz: off, m0: M0, shape });
      lab = labOf(r);
      drawPlot();
    }
    // the phase of M's transverse component in the frame shown: its angle from that frame's x axis (M starts along +y, at 90°),
    // continuous while |M_xy| is there; where M passes through z (|M_xy| → 0) the phase is undefined, so the line breaks (null)
    // instead of drawing a jump. It is computed in the Larmor frame (unwrapped within each stretch, restarting at the plain
    // angle, −180°…180°, after a break: on resonance that gives +90° / −90°, M along +y / −y), then each frame adds its own turn
    // about z: −360°·Δ·t in the RF frame, +360°·f0·t in the lab (f0 drawn as LAB_TURNS turns, as on the sphere). The first-order
    // line gets the same turn.
    function phaseOf(arr) {
      const out = new Array(arr.length); let last = null;
      for (let k = 0; k < arr.length; k++) {
        const v = arr[k];
        if (Math.hypot(v[0], v[1]) < 0.03) { out[k] = null; continue; }
        let a = Math.atan2(v[1], v[0]) * DEG;
        if (last != null) a += 360 * Math.round((last - a) / 360);
        out[k] = last = a;
        if (k + 1 < arr.length && Math.hypot(arr[k + 1][0], arr[k + 1][1]) < 0.03) last = null;   // a break follows: restart there
      }
      return out;
    }
    function drawPlot() {
      const tm = tMs(r), off = offNow;
      const shift = (k) => (frame === 'rf' ? -360 * off * r.t[k] : frame === 'lab' ? (360 * LAB_TURNS * r.t[k]) / BS.PULSE.T : 0);
      phi = phaseOf(r.lar).map((p, k) => (p == null ? null : p + shift(k)));
      pred = Array.from(r.pred, (p, k) => 90 + p * DEG + shift(k));
      // shown as an image would: in radians, wrapped to −π…π; where it wraps, the line breaks instead of jumping
      const wrapRad = (arr) => { let prev = null; return arr.map((v) => {
        if (v == null) { prev = null; return null; }
        const w = Math.atan2(Math.sin(v / DEG), Math.cos(v / DEG)), jump = prev != null && Math.abs(w - prev) > Math.PI; prev = w;
        return jump ? null : w;
      }); };
      phi = wrapRad(phi); pred = wrapRad(pred);
      plot(host, [
        { x: tm, y: Array.from(r.env, (e) => 100 * e), name: 'B₁ envelope (% of peak)', yaxis: 'y2', line: { color: B1_COLOUR, width: 1.5 }, fill: 'tozeroy', fillcolor: 'rgba(232,119,14,0.10)', hoverinfo: 'skip' },
        { x: tm, y: pred, name: 'first order: −∫ω₁²/2Δω dt' + (frame === 'lar' ? '' : ', in this frame'), line: { color: INK, width: 1.6, dash: 'dash' }, connectgaps: false, hovertemplate: '%{x:.2f} ms: %{y:.2f} rad<extra></extra>' },
        { x: [], y: [], name: 'phase of M_xy (exact)', line: { color: M_COLOUR, width: 2.4 }, connectgaps: false, hovertemplate: '%{x:.2f} ms: %{y:.2f} rad<extra></extra>' },
      ], {
        xaxis: { title: { text: 't (ms)', standoff: 4 }, range: [0, 8], fixedrange: true, zeroline: false },
        margin: { l: 74, r: 52, t: 10, b: 42 },   // room for the −π/2 ticks and the axis title
        yaxis: { title: { text: `phase, ${{ lab: 'lab', lar: 'Larmor frame', rf: 'RF frame' }[frame]} (rad)`, standoff: 4 }, range: [-Math.PI - 0.2, Math.PI + 0.2], tickvals: [-Math.PI, -Math.PI / 2, 0, Math.PI / 2, Math.PI], ticktext: ['−π', '−π/2', '0', 'π/2', 'π'], tickfont: { family: '"Times New Roman", Times, serif', size: 15 }, fixedrange: true, zeroline: true, zerolinecolor: '#d8dee6' },
        yaxis2: { overlaying: 'y', side: 'right', range: [0, 125], tickvals: [0, 50, 100], ticktext: ['0%', '50%', '100%'], showgrid: false, fixedrange: true, tickfont: { color: B1_COLOUR, size: 12 } },   // the envelope peaks at 80 % of the height, below the top of the M curves
      }, 560, 250);
    }
    const player = makePlayer(slide.querySelector('.bs-play'), (f) => {
      const k = idx(r, f), tm = tMs(r);
      Plotly.restyle(host, { x: [tm.slice(0, k + 1)], y: [phi.slice(0, k + 1)] }, [2]);
      drawFrame(sphere, r, lab, k, frame, M0);
      readout.innerHTML = `phase of M<sub>xy</sub> in ${FRAME_NAME[frame]}: ${phi[k] == null ? '<b>undefined</b> (M<sub>xy</sub> ≈ 0)' : `<b>${phi[k].toFixed(2)} rad</b>`} · first order ${pred[k] == null ? '–' : pred[k].toFixed(2) + ' rad'} · |M<sub>xy</sub>| = ${Math.hypot(r.lar[k][0], r.lar[k][1]).toFixed(3)}`;
    });
    segToggle(slide, 'off', (v) => { compute(Number(v)); player.rewind(); });
    segToggle(slide, 'shape', (v) => { shape = v; compute(offNow); player.rewind(); });
    frameTabs(slide, (v) => { frame = v; drawPlot(); player.show(Number(slide.querySelector('.bs-scrub').value) / 1000); });
    onShow(slide, () => { compute(0); player.rewind(); });   // as on (a): on resonance, in the Larmor (receive) frame
  })();

  // ---------------- (c) φ vs B1 and offset ----------------
  (function () {
    const slide = document.getElementById('bs-c'); if (!slide) return;
    const sphere = makeSphere(slide.querySelector('canvas')), host = slide.querySelector('.c-plot'), readout = slide.querySelector('.c-readout');
    const b1In = slide.querySelector('.c-b1'), offIn = slide.querySelector('.c-off'), lawBtn = slide.querySelector('.c-law');
    // points per offset and pulse shape ('off|shape' → [[B1 in G, signed φ_BS in °], …]); colour = the offset (red above resonance, blue
    // below, darker further out), marker = the shape (K_BS depends on it); run speed: seconds on screen for the 8 ms pulse
    const st = { off: 4000, shape: 'fermi', speed: 2.5, pts: new Map(), law: false };
    const SHAPE = { fermi: ['Fermi', 'circle'], hard: ['hard', 'square'], gauss: ['Gaussian', 'diamond'], gausshann: ['Gauss–Hann', 'triangle-up'] };
    const mix = (a, b, f) => `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * f)).join(',')})`;
    const colour = (off) => { const f = Math.min(1, Math.abs(off) / 8000); return off > 0 ? mix([244, 165, 130], [103, 0, 31], f) : mix([146, 197, 222], [5, 48, 97], f); };
    const kHz = (off) => `${off > 0 ? '+' : off < 0 ? '−' : ''}${(Math.abs(off) / 1000).toFixed(Math.abs(off) % 1000 ? 2 : 0)} kHz`;
    let anim = null, last = null, view = 'lar';   // view: the frame shown (not 'frame', the name of the animation step below); last: the last run { r, lab, k }, to redraw it when the frame changes
    const showB1 = () => { slide.querySelector('.c-b1-read').textContent = `= ${(100 * Number(b1In.value)).toFixed(1)} µT`; };   // the sliders work in gauss, shown in µT
    const showOff = () => { slide.querySelector('.c-off-read').textContent = `= ${kHz(st.off)}`; slide.querySelectorAll('[data-coff]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.coff) === st.off))); };
    function drawPlot() {
      const tr = [];
      const keys = [...st.pts.keys()].map((k) => { const [o, sh] = k.split('|'); return { k, off: Number(o), sh }; }).sort((a, b) => a.off - b.off || a.sh.localeCompare(b.sh));
      for (const { k, off, sh } of keys) {
        const p = st.pts.get(k).slice().sort((a, b) => a[0] - b[0]), name = `${kHz(off)} · ${SHAPE[sh][0]}`;
        tr.push({ x: p.map((q) => 100 * q[0]), y: p.map((q) => q[1]), mode: 'markers', name, marker: { color: colour(off), size: 9, symbol: SHAPE[sh][1] },
          hovertemplate: `${name}, B₁ %{x:.1f} µT: %{y:.1f}°<extra></extra>`, showlegend: true });
        if (st.law) {   // −K_BS·B1²: K_BS has the offset's sign, the spin is pushed away from the RF
          const xs = Array.from({ length: 51 }, (_, i) => (0.25 * i) / 50);
          tr.push({ x: xs.map((b) => 100 * b), y: xs.map((b) => -BS.kbs(off, sh) * b * b * DEG), mode: 'lines', line: { color: colour(off), width: 1.4, dash: 'dash' }, showlegend: false, hoverinfo: 'skip' });
        }
      }
      plot(host, tr, {
        xaxis: { title: { text: 'peak B₁ (µT)', standoff: 4 }, range: [0, 26], fixedrange: true, zeroline: false },
        yaxis: { title: { text: 'φ<sub>BS</sub> (°)', standoff: 4 }, fixedrange: true, zeroline: true, zerolinecolor: '#9aa5b1' },
      }, 560, 255);
    }
    function addPoint(b1, off) {
      const r = BS.simulate({ b1, offHz: off, shape: st.shape }), key = `${off}|${st.shape}`;
      const phi = r.phase[r.n - 1] * DEG, law = -BS.kbs(off, st.shape) * b1 * b1 * DEG;
      st.pts.set(key, (st.pts.get(key) || []).filter((q) => Math.abs(q[0] - b1) > 1e-9).concat([[b1, phi]]));
      readout.innerHTML = `B₁ ${(100 * b1).toFixed(1)} µT, ${kHz(off)}, ${SHAPE[st.shape][0]}: φ<sub>BS</sub> = <b>${phi.toFixed(1)}°</b> · −K<sub>BS</sub>B<sub>1</sub>² = ${law.toFixed(1)}° · |M<sub>xy</sub>| at the end ${Math.hypot(r.lar[r.n - 1][0], r.lar[r.n - 1][1]).toFixed(3)}`;
      return r;
    }
    const onRes = () => { const b1 = Number(b1In.value); readout.innerHTML = `On resonance there is no Bloch–Siegert shift: the pulse just tips M, by ${Math.round(BS.W1_PER_G * b1 * BS.ints(st.shape).b * DEG)}° at ${(100 * b1).toFixed(1)} µT. Pick an offset.`; };
    function run() {
      if (anim) cancelAnimationFrame(anim);
      if (st.off === 0) { onRes(); return; }
      const b1 = Number(b1In.value), r = addPoint(b1, st.off), t0 = performance.now();
      last = { r, lab: labOf(r), k: 0 };
      const frame = (now) => {
        const f = Math.min(1, (now - t0) / (1000 * st.speed)), k = idx(r, f);
        last.k = k; drawFrame(sphere, r, last.lab, k, view, [0, 1, 0]);
        if (f < 1) anim = requestAnimationFrame(frame); else { anim = null; drawPlot(); }
      };
      anim = requestAnimationFrame(frame);
    }
    b1In.addEventListener('input', showB1); keepSlider(b1In);
    offIn.addEventListener('input', () => { st.off = Number(offIn.value); showOff(); }); keepSlider(offIn);
    slide.querySelectorAll('[data-coff]').forEach((b) => b.addEventListener('click', () => { b.blur(); st.off = Number(b.dataset.coff); offIn.value = st.off; showOff(); }));
    slide.querySelector('.c-run').addEventListener('click', (e) => { e.currentTarget.blur(); run(); });
    slide.querySelector('.c-sweep').addEventListener('click', (e) => {
      e.currentTarget.blur();
      if (st.off === 0) { onRes(); return; }
      for (let b = 0.025; b <= 0.2501; b += 0.025) addPoint(Math.round(b * 1000) / 1000, st.off);
      drawPlot();
    });
    slide.querySelector('.c-clear').addEventListener('click', (e) => { e.currentTarget.blur(); st.pts = new Map(); readout.innerHTML = ''; drawPlot(); });
    lawBtn.addEventListener('click', (e) => { e.currentTarget.blur(); st.law = !st.law; lawBtn.setAttribute('aria-pressed', String(st.law)); drawPlot(); });
    segToggle(slide, 'cshape', (v) => { st.shape = v; });
    segToggle(slide, 'cspeed', (v) => { st.speed = Number(v); });
    frameTabs(slide, (v) => { view = v; if (last) drawFrame(sphere, last.r, last.lab, last.k, view, [0, 1, 0]); });
    showB1(); showOff();
    onShow(slide, () => { drawPlot(); sphere.draw({ arrows: [{ v: [0, 1, 0], colour: M_COLOUR, width: 9, label: 'M' }] }); });
  })();

  // ---------------- (d) ± offsets with a fan of B0 offsets ----------------
  (function () {
    const slide = document.getElementById('bs-d'); if (!slide) return;
    const sphere = makeSphere(slide.querySelector('canvas')), host = slide.querySelector('.d-plot'), readout = slide.querySelector('.d-readout');
    const b1In = slide.querySelector('.d-b1'), NS = 11, OFF = 4000;
    const st = { spread: 50, runs: {} };
    let anim = null;
    const offsets = () => Array.from({ length: NS }, (_, i) => (st.spread * (2 * i - (NS - 1))) / (NS - 1));
    const showB1 = () => { slide.querySelector('.d-b1-read').textContent = `= ${(100 * Number(b1In.value)).toFixed(1)} µT`; };   // the sliders work in gauss, shown in µT
    function drawPlot() {
      const tr = [], ds = offsets(), P = st.runs['+'], M = st.runs['-'];
      if (P) tr.push({ x: ds, y: P.map((p) => p * DEG), mode: 'markers', name: 'φ₊ (pulse at +4 kHz)', marker: { color: '#2e8b3a', size: 9 }, hovertemplate: '%{x:.0f} Hz: %{y:.1f}°<extra></extra>' });
      if (M) tr.push({ x: ds, y: M.map((p) => p * DEG), mode: 'markers', name: 'φ₋ (pulse at −4 kHz)', marker: { color: '#7b3fa0', size: 9 }, hovertemplate: '%{x:.0f} Hz: %{y:.1f}°<extra></extra>' });
      if (P && M) {
        const b1 = Number(b1In.value), half = ds.map((_, i) => ((M[i] - P[i]) / 2) * DEG);
        tr.push({ x: ds, y: half, mode: 'markers+lines', name: '(φ₋ − φ₊)/2', marker: { color: INK, size: 9, symbol: 'square' }, line: { color: INK, width: 1 }, hovertemplate: '%{x:.0f} Hz: %{y:.3f}°<extra></extra>' });
        tr.push({ x: [-110, 110], y: [BS.kbs(OFF) * b1 * b1 * DEG, BS.kbs(OFF) * b1 * b1 * DEG], mode: 'lines', name: 'K<sub>BS</sub>·B₁²', line: { color: INK, width: 1.4, dash: 'dash' }, hoverinfo: 'skip' });
        const mean = half.reduce((a, b) => a + b, 0) / half.length / DEG, est = Math.sqrt(mean / BS.kbs(OFF));
        const spreadPct = (100 * (Math.max(...half) - Math.min(...half))) / Math.abs(mean * DEG);
        readout.innerHTML = `(φ₋ − φ₊)/2 = <b>${(mean * DEG).toFixed(2)}°</b> for every spin (spread ${spreadPct.toFixed(2)} %) → B₁ = √(Δφ/2K<sub>BS</sub>) = <b>${(100 * est).toFixed(2)} µT</b> (true ${(100 * b1).toFixed(2)} µT)`;
      } else readout.innerHTML = P || M ? 'Now the other acquisition.' : '';
      plot(host, tr, {
        xaxis: { title: { text: 'spin’s B₀ offset (Hz)', standoff: 4 }, range: [-110, 110], fixedrange: true, zeroline: false },
        yaxis: { title: { text: 'phase after the pulse (°)', standoff: 4 }, fixedrange: true, zeroline: true, zerolinecolor: '#d8dee6' },
      }, 560, 255);
    }
    function run(sign) {
      if (anim) cancelAnimationFrame(anim);
      const b1 = Number(b1In.value), ds = offsets();
      const rs = ds.map((d) => BS.simulate({ b1, offHz: sign * OFF, dHz: d, m0: [0, 1, 0] }));
      // the phase each spin ends with: start (+y, 90°) plus what it gained
      st.runs[sign > 0 ? '+' : '-'] = rs.map((r) => Math.PI / 2 + r.phase[r.n - 1]);
      slide.querySelector('.d-which').textContent = `pulse at ${sign > 0 ? '+' : '−'}4 kHz`;
      const t0 = performance.now(), cols = ds.map((d) => speedColour(st.spread ? d / st.spread : 0));
      const frame = (now) => {
        const f = Math.min(1, (now - t0) / 5000), k = idx(rs[0], f);
        const spins = rs.map((r, i) => ({ v: r.lar[k], colour: cols[i] }));
        const net = [0, 1, 2].map((c) => spins.reduce((a, s) => a + s.v[c], 0) / spins.length);
        sphere.draw({ spins, arrows: [{ v: b1Arrow(rs[0], k), colour: B1_COLOUR, width: 6 }, { v: net, colour: INK, width: 8, label: 'M' }] });
        if (f < 1) anim = requestAnimationFrame(frame); else { anim = null; drawPlot(); }
      };
      anim = requestAnimationFrame(frame);
    }
    function reset() { st.runs = {}; slide.querySelector('.d-which').textContent = 'no pulse yet'; sphere.draw({ spins: offsets().map((d) => ({ v: [0, 1, 0], colour: speedColour(st.spread ? d / st.spread : 0) })), arrows: [] }); drawPlot(); }
    b1In.addEventListener('input', () => { showB1(); });
    b1In.addEventListener('change', reset);
    keepSlider(b1In);
    segToggle(slide, 'spread', (v) => { st.spread = Number(v); reset(); });
    slide.querySelector('.d-plus').addEventListener('click', (e) => { e.currentTarget.blur(); run(1); });
    slide.querySelector('.d-minus').addEventListener('click', (e) => { e.currentTarget.blur(); run(-1); });
    showB1();
    onShow(slide, reset);
  })();
})();
