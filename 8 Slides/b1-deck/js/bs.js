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
        if (a.label) { const n = Math.hypot(...a.v) || 1, k = (n + 0.16) / n; label([k * a.v[0], k * a.v[1], k * a.v[2] + 0.05], a.label, a.colour, true); }
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

  // ---------------- (a) off resonance on M along z ----------------
  (function () {
    const slide = document.getElementById('bs-a'); if (!slide) return;
    const sphere = makeSphere(slide.querySelector('canvas')), host = slide.querySelector('.a-plot'), readout = slide.querySelector('.a-readout');
    const B1 = 0.1;
    slide.querySelector('.a-nominal').textContent = `${Math.round(BS.W1_PER_G * B1 * BS.INT_B * DEG)}°`;
    let r, tilt;
    function compute(off) {
      r = BS.simulate({ b1: B1, offHz: off, m0: [0, 0, 1] });
      tilt = r.lar.map((v) => Math.acos(Math.max(-1, Math.min(1, v[2]))) * DEG);
      const tm = tMs(r);
      plot(host, [
        { x: tm, y: Array.from(r.env, (e) => 100 * e), name: 'B₁ envelope (% of peak)', yaxis: 'y2', line: { color: B1_COLOUR, width: 1.5 }, fill: 'tozeroy', fillcolor: 'rgba(232,119,14,0.10)', hoverinfo: 'skip' },
        { x: tm, y: tilt, name: 'M, angle from z', line: { color: M_COLOUR, width: 2.2 }, hovertemplate: '%{x:.2f} ms: %{y:.2f}°<extra></extra>' },
        { x: [0], y: [0], mode: 'markers', marker: { color: INK, size: 9 }, showlegend: false, hoverinfo: 'skip' },
      ], {
        xaxis: { title: { text: 't (ms)', standoff: 4 }, range: [0, 8], fixedrange: true, zeroline: false },
        yaxis: { title: { text: 'angle from z (°)', standoff: 4 }, range: [0, 185], fixedrange: true, zeroline: false, dtick: 45 },
        yaxis2: { overlaying: 'y', side: 'right', range: [0, 105], showgrid: false, fixedrange: true, ticksuffix: '%', tickfont: { color: B1_COLOUR, size: 12 } },
      }, 560, 250);
    }
    const player = makePlayer(slide.querySelector('.bs-play'), (f) => {
      const k = idx(r, f);
      const maxT = Math.max(...tilt.slice(0, k + 1));
      Plotly.restyle(host, { x: [[r.t[k] * 1e3]], y: [[tilt[k]]] }, [2]);
      sphere.draw({
        trails: [{ pts: tail(r.lar, k, r.n, 2), colour: 'rgba(31, 95, 153, 0.45)' }],
        arrows: [{ v: b1Arrow(r, k), colour: B1_COLOUR, width: 6, label: r.env[k] > 0.15 ? 'B₁' : '' }, { v: r.lar[k], colour: M_COLOUR, width: 9, label: 'M', shadow: true }],
      });
      readout.innerHTML = `M is <b>${tilt[k].toFixed(tilt[k] < 1 ? 2 : 1)}°</b> from z (largest so far: ${maxT.toFixed(1)}°)`
        + (f >= 1 ? ` · it ends <b>${tilt[r.n - 1].toFixed(tilt[r.n - 1] < 1 ? 2 : 1)}°</b> from z` : '');
    });
    segToggle(slide, 'off', (v) => { compute(Number(v)); player.rewind(); });
    onShow(slide, () => { compute(4000); player.rewind(); });
  })();

  // ---------------- (b) transverse M, two frames ----------------
  (function () {
    const slide = document.getElementById('bs-b'); if (!slide) return;
    const [cRf, cLar] = slide.querySelectorAll('canvas');
    const sRf = makeSphere(cRf, { prime: true }), sLar = makeSphere(cLar), host = slide.querySelector('.b-plot');
    const r = BS.simulate({ b1: 0.1, offHz: 4000, m0: [0, 1, 0] });
    const tm = tMs(r), phi = Array.from(r.phase, (p) => p * DEG), pred = Array.from(r.pred, (p) => p * DEG);
    function drawPlot() {
      plot(host, [
        { x: tm, y: Array.from(r.env, (e) => 100 * e), name: 'B₁ envelope (% of peak)', yaxis: 'y2', line: { color: B1_COLOUR, width: 1.5 }, fill: 'tozeroy', fillcolor: 'rgba(232,119,14,0.10)', hoverinfo: 'skip' },
        { x: tm, y: pred, name: 'first order: −∫ω₁²/2Δω dt', line: { color: INK, width: 1.6, dash: 'dash' }, hovertemplate: '%{x:.2f} ms: %{y:.2f}°<extra></extra>' },
        { x: [], y: [], name: 'phase of M (exact)', line: { color: M_COLOUR, width: 2.4 }, hovertemplate: '%{x:.2f} ms: %{y:.2f}°<extra></extra>' },
      ], {
        xaxis: { title: { text: 't (ms)', standoff: 4 }, range: [0, 8], fixedrange: true, zeroline: false },
        yaxis: { title: { text: 'phase (°)', standoff: 4 }, range: [-48, 6], fixedrange: true, zeroline: true, zerolinecolor: '#d8dee6', dtick: 10 },
        yaxis2: { overlaying: 'y', side: 'right', range: [0, 105], showgrid: false, fixedrange: true, ticksuffix: '%', tickfont: { color: B1_COLOUR, size: 12 } },
        legend: { orientation: 'h', x: 0.01, y: 0.02, yanchor: 'bottom', bgcolor: 'rgba(255,255,255,0.8)', font: { size: 13 } },
      }, 1150, 200);
    }
    const player = makePlayer(slide.querySelector('.bs-play'), (f) => {
      const k = idx(r, f), w1 = r.w1max * r.env[k], oz = r.d - r.D, mag = Math.hypot(w1, oz);
      const beff = [1.2 * w1 / mag, 0, 1.2 * oz / mag];
      Plotly.restyle(host, { x: [tm.slice(0, k + 1)], y: [phi.slice(0, k + 1)] }, [2]);
      sRf.draw({
        trails: [{ pts: tail(r.rf, k, 260), colour: 'rgba(31, 95, 153, 0.45)' }],
        arrows: [{ v: beff, colour: B1_COLOUR, width: 6, label: 'B_eff' }, { v: r.rf[k], colour: M_COLOUR, width: 9, label: 'M' }],
      });
      sLar.draw({
        trails: [{ pts: tail(r.lar, k, r.n, 2), colour: 'rgba(31, 95, 153, 0.55)' }],
        arrows: [{ v: [0, 1, 0], colour: '#b8c2cc', width: 3, dash: [8, 8] }, { v: b1Arrow(r, k), colour: B1_COLOUR, width: 6, label: r.env[k] > 0.15 ? 'B₁' : '' },
          { v: r.lar[k], colour: M_COLOUR, width: 9, label: 'M' }],
      });
      slide.querySelector('.b-phi').textContent = `${phi[k].toFixed(2)}°`;
      slide.querySelector('.b-pred').textContent = `${pred[k].toFixed(2)}°`;
      slide.querySelector('.b-mxy').textContent = Math.hypot(r.lar[k][0], r.lar[k][1]).toFixed(3);
    });
    onShow(slide, () => { drawPlot(); player.rewind(); });
  })();

  // ---------------- (c) φ vs B1 and offset ----------------
  (function () {
    const slide = document.getElementById('bs-c'); if (!slide) return;
    const sphere = makeSphere(slide.querySelector('canvas')), host = slide.querySelector('.c-plot'), readout = slide.querySelector('.c-readout');
    const b1In = slide.querySelector('.c-b1'), lawBtn = slide.querySelector('.c-law');
    const OFFS = { 2000: '#c0392b', 4000: '#1f5f99', 8000: '#2e8b3a' };
    const st = { off: 4000, pts: { 2000: [], 4000: [], 8000: [] }, law: false };
    let anim = null;
    const showB1 = () => { slide.querySelector('.c-b1-read').textContent = `= ${Number(b1In.value).toFixed(3)} G`; };
    function drawPlot() {
      const tr = [];
      for (const off of [2000, 4000, 8000]) {
        const p = st.pts[off].slice().sort((a, b) => a[0] - b[0]);
        tr.push({ x: p.map((q) => q[0]), y: p.map((q) => q[1]), mode: 'markers', name: `${off / 1000} kHz`, marker: { color: OFFS[off], size: 9 },
          hovertemplate: `${off / 1000} kHz, B₁ %{x:.3f} G: %{y:.1f}°<extra></extra>`, showlegend: true });
        if (st.law) {
          const xs = Array.from({ length: 51 }, (_, i) => (0.25 * i) / 50);
          tr.push({ x: xs, y: xs.map((b) => BS.kbs(off) * b * b * DEG), mode: 'lines', line: { color: OFFS[off], width: 1.4, dash: 'dash' }, showlegend: false, hoverinfo: 'skip' });
        }
      }
      plot(host, tr, {
        xaxis: { title: { text: 'peak B₁ (G)', standoff: 4 }, range: [0, 0.26], fixedrange: true, zeroline: false },
        yaxis: { title: { text: '|φ<sub>BS</sub>| (°)', standoff: 4 }, rangemode: 'tozero', fixedrange: true, zeroline: false },
      }, 560, 255);
    }
    function addPoint(b1, off) {
      const r = BS.simulate({ b1, offHz: off });
      const phi = Math.abs(r.phase[r.n - 1]) * DEG, law = BS.kbs(off) * b1 * b1 * DEG;
      st.pts[off] = st.pts[off].filter((q) => Math.abs(q[0] - b1) > 1e-9).concat([[b1, phi]]);
      readout.innerHTML = `B₁ ${b1.toFixed(3)} G, ${off / 1000} kHz: |φ<sub>BS</sub>| = <b>${phi.toFixed(1)}°</b> · K<sub>BS</sub>B<sub>1</sub>² = ${law.toFixed(1)}° · |M<sub>xy</sub>| at the end ${Math.hypot(r.lar[r.n - 1][0], r.lar[r.n - 1][1]).toFixed(3)}`;
      return r;
    }
    function run() {
      if (anim) cancelAnimationFrame(anim);
      const b1 = Number(b1In.value), r = addPoint(b1, st.off), t0 = performance.now();
      const frame = (now) => {
        const f = Math.min(1, (now - t0) / 2500), k = idx(r, f);
        sphere.draw({
          trails: [{ pts: tail(r.lar, k, r.n, 2), colour: 'rgba(31, 95, 153, 0.55)' }],
          arrows: [{ v: [0, 1, 0], colour: '#b8c2cc', width: 3, dash: [8, 8] }, { v: b1Arrow(r, k), colour: B1_COLOUR, width: 6 }, { v: r.lar[k], colour: M_COLOUR, width: 9, label: 'M' }],
        });
        if (f < 1) anim = requestAnimationFrame(frame); else { anim = null; drawPlot(); }
      };
      anim = requestAnimationFrame(frame);
    }
    b1In.addEventListener('input', showB1);
    keepSlider(b1In);
    segToggle(slide, 'coff', (v) => { st.off = Number(v); });
    slide.querySelector('.c-run').addEventListener('click', (e) => { e.currentTarget.blur(); run(); });
    slide.querySelector('.c-sweep').addEventListener('click', (e) => {
      e.currentTarget.blur();
      for (let b = 0.025; b <= 0.2501; b += 0.025) addPoint(Math.round(b * 1000) / 1000, st.off);
      drawPlot();
    });
    slide.querySelector('.c-clear').addEventListener('click', (e) => { e.currentTarget.blur(); st.pts = { 2000: [], 4000: [], 8000: [] }; readout.innerHTML = ''; drawPlot(); });
    lawBtn.addEventListener('click', (e) => { e.currentTarget.blur(); st.law = !st.law; lawBtn.setAttribute('aria-pressed', String(st.law)); drawPlot(); });
    showB1();
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
    const showB1 = () => { slide.querySelector('.d-b1-read').textContent = `= ${Number(b1In.value).toFixed(3)} G`; };
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
        readout.innerHTML = `(φ₋ − φ₊)/2 = <b>${(mean * DEG).toFixed(2)}°</b> for every spin (spread ${spreadPct.toFixed(2)} %) → B₁ = √(Δφ/2K<sub>BS</sub>) = <b>${est.toFixed(4)} G</b> (true ${b1.toFixed(4)} G)`;
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
