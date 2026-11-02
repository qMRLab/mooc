/* AFI in steady state, one magnetization vector (Exercise 4-3). Each slide with class "afi-spin" and data-tr="TR1,TR2"
 * (ms) plays the sequence slowed down: pulse 1 (α·B1 about +x′, tipping M from +z towards +y′), readout (the transverse
 * part is locked in as S1), ideal spoiling, recovery over TR1 (Mz locked just before the next pulse), pulse 2, readout S2,
 * spoiling, recovery over TR2 (Mz locked), and again. M starts in the steady state of Eqs. 4.10–4.11 (exact, signed),
 * T1 = 900 ms (or from an optional .as-t1 slider), α = 60°, TE ≈ 0. The pulses and spoilers are instantaneous in real time; on screen they take a moment.
 * In this steady state M is small (M_z ≈ 0.1–0.2 M0), so the drawing is zoomed, by one factor over the whole B1 slider (for the
 * current T1), so that moving B1 shows the true change in size: the largest M_z over that range reaches 0.85 of
 * the circle, and the canvas says by how much. The panel shows the locked values, r = S2/S1 (signed and as magnitude images give it), and the B1 that the AFI formula
 * θ = arccos((r n − 1)/(n − r)) returns from the magnitude ratio. The sphere drawing is the T2 lab's, as in bs.js. */
(function () {
  'use strict';
  const T1 = 900, ALPHA = 60, D2R = Math.PI / 180, MS_PER_S = 25;   // recovery plays at 25 ms of real time per second
  const STEP = { pulse: 0.8, read: 0.6, spoil: 0.5 };   // seconds on screen
  const M_COLOUR = '#1f5f99', C1 = '#e8770e', C2 = '#2e8b3a', AXIS = '#9aa5b1', MUTED = '#5b6776', FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

  function makeSphere(canvas) {
    const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height, R = 0.36 * Math.min(W, H), FS = Math.round(0.042 * W);
    let az = -0.6, el = 0.4, scene = null;
    const proj = (v) => {
      const x1 = v[0] * Math.cos(az) - v[1] * Math.sin(az), y1 = v[0] * Math.sin(az) + v[1] * Math.cos(az);
      return [W / 2 + R * x1, H / 2 + 0.04 * H - R * (v[2] * Math.cos(el) + y1 * Math.sin(el))];
    };
    const line = (a, b, colour, width, dash) => {
      const p = proj(a), q = proj(b);
      g.strokeStyle = colour; g.lineWidth = width; g.setLineDash(dash || []);
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); g.setLineDash([]);
    };
    const arrow = (v, colour, width, dash) => {
      if (Math.hypot(v[0], v[1], v[2]) < 0.02) return;
      line([0, 0, 0], v, colour, width, dash);
      const p = proj(v), o = proj([0, 0, 0]), ang = Math.atan2(p[1] - o[1], p[0] - o[0]), h = 0.03 * W;
      g.fillStyle = colour; g.beginPath(); g.moveTo(p[0], p[1]);
      g.lineTo(p[0] - h * Math.cos(ang - 0.4), p[1] - h * Math.sin(ang - 0.4));
      g.lineTo(p[0] - h * Math.cos(ang + 0.4), p[1] - h * Math.sin(ang + 0.4)); g.closePath(); g.fill();
    };
    const label = (v, text, colour, bold, align = 'center') => {
      const p = proj(v); g.fillStyle = colour; g.textBaseline = 'middle'; g.textAlign = align;
      g.font = `${bold ? '700 ' : ''}${FS}px ${FONT}`; g.fillText(text, p[0], p[1]);
    };
    function draw(sc) {
      if (sc) scene = sc;
      g.clearRect(0, 0, W, H);
      g.strokeStyle = '#d8dee6'; g.lineWidth = 2; g.beginPath();
      for (let i = 0; i <= 96; i++) { const a = (i / 96) * 2 * Math.PI, p = proj([Math.cos(a), Math.sin(a), 0]); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
      g.stroke();
      for (const [nx, ny, name] of [[1, 0, "+x′"], [-1, 0, "−x′"], [0, 1, "+y′"], [0, -1, "−y′"]]) {
        line([0, 0, 0], [1.2 * nx, 1.2 * ny, 0], AXIS, 2);
        label([1.36 * nx, 1.36 * ny, 0], name, MUTED);
      }
      line([0, 0, -1.2], [0, 0, 1.2], AXIS, 2);
      label([0, 0, 1.32], 'z', MUTED);
      if (!scene) return;
      const Z = scene.zoom, zs = (v) => v.map((x) => x * Z);
      label([0, 0, 1.55], `zoomed ×${Z.toFixed(1)}: the circle is ${(1 / Z).toFixed(2)} M₀`, MUTED, false);
      // locked values: Mz just before each pulse (marks on z), the transverse part at each readout (arrows along ±y′)
      // the most recently locked of each pair is drawn last, on top (with TR1 = TR2 the two coincide)
      const top = (last) => (last === 0 ? [1, 0] : [0, 1]);
      for (const k of top(scene.lastMz)) {
        const c = k ? C2 : C1, mz = scene.mz[k];
        if (mz != null) {
          const zm = Z * mz;
          line([-0.13, 0, zm], [0.13, 0, zm], c, 5); line([0, -0.13, zm], [0, 0.13, zm], c, 5);
          label([0.2, -0.2, zm], `M${k ? '₂' : '₁'}`, c, true, 'left');
        }
      }
      for (const k of top(scene.lastS)) {
        const c = k ? C2 : C1, s = scene.s[k];
        if (s != null) { const zs1 = Z * s; arrow([0, zs1, 0], c, 6, [12, 8]); label([0.16, zs1 + (zs1 < 0 ? -0.12 : 0.12), 0.06], `S${k ? '₂' : '₁'}`, c, true); }
      }
      if (scene.spoil) label([0, 0, -1.42], 'spoiler', MUTED, true);
      arrow(zs(scene.m), M_COLOUR, 7);
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
    return { draw };
  }

  // the steady state: Mz just before pulse 1 (after TR2) and pulse 2 (after TR1), signed
  function steady(th, tr1, tr2, t1) {
    const E1 = Math.exp(-tr1 / t1), E2 = Math.exp(-tr2 / t1), c = Math.cos(th * D2R);
    const m1 = (1 - E2 + (1 - E1) * E2 * c) / (1 - E1 * E2 * c * c);
    return [m1, 1 - (1 - m1 * c) * E1];
  }

  // one AFI cycle on a time axis, drawn into the .as-strip element: the timeline strip (pulse, readout, spoiler, recovery),
  // drawn like the chapter's AFI diagram, and above it the pulse sequence; segments: [kind, which pulse (0 / 1), seconds on screen]
  function timeline(strip, TR1, TR2, withCursor) {
    const SEG = [['pulse', 0, STEP.pulse], ['read', 0, STEP.read], ['spoil', 0, STEP.spoil], ['wait', 0, TR1 / MS_PER_S],
      ['pulse', 1, STEP.pulse], ['read', 1, STEP.read], ['spoil', 1, STEP.spoil], ['wait', 1, TR2 / MS_PER_S]];
    const CYCLE = SEG.reduce((a, s) => a + s[2], 0);

    strip.innerHTML = SEG.map(([kind, k, d]) => `<div class="as-seg as-${kind}${k ? ' two' : ''}" style="flex:${d}">${kind === 'pulse' ? 'α' : kind === 'read' ? `S${k ? '₂' : '₁'}` : kind === 'spoil' ? '' : 'recovery'}</div>`).join('');
    // above it, the pulse sequence on the same time axis (not to scale: pulse, readout and spoiler take a moment on screen):
    // the RF pulse (sinc), the readout window and the spoiler gradient, segment for segment; one cursor runs through both
    const seq = document.createElement('div'), wrap = document.createElement('div');
    seq.className = 'as-seq'; wrap.className = 'as-time';
    strip.before(wrap); wrap.append(seq, strip);
    const BASE = 50, sinc = Array.from({ length: 81 }, (_, j) => { const u = (j - 40) / 40 * 3 * Math.PI; return `${10 + j} ${(BASE - 40 * (u ? Math.sin(u) / u : 1)).toFixed(1)}`; }).join(' L ');
    const shape = (kind, k) => kind === 'pulse' ? `<path d="M 0 ${BASE} L 10 ${BASE} L ${sinc} L 100 ${BASE}" class="sq-rf"/>`
      : kind === 'read' ? `<path d="M 0 ${BASE} L 10 ${BASE}"/><rect x="10" y="20" width="80" height="${BASE - 20}" class="sq-adc${k ? ' two' : ''}"/><path d="M 90 ${BASE} L 100 ${BASE}"/>`
      : kind === 'spoil' ? `<path d="M 0 ${BASE} L 8 ${BASE} L 24 16 L 76 16 L 92 ${BASE} L 100 ${BASE}" class="sq-gr"/>`
      : `<path d="M 0 ${BASE} L 100 ${BASE}"/>`;
    const lab = (kind, k) => kind === 'pulse' ? '<span class="sq-lab sq-a">α</span>' : kind === 'read' ? `<span class="sq-lab sq-r${k ? ' two' : ''}">readout</span>` : kind === 'spoil' ? '<span class="sq-lab sq-s">spoiler</span>' : '';
    seq.innerHTML = SEG.map(([kind, k, d]) => `<div class="as-sq" style="flex:${d}"><svg viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">${shape(kind, k)}</svg>${lab(kind, k)}</div>`).join('');
    // below the strip: TR1 and TR2, each from the start of its pulse to the start of the next
    const half = (k) => SEG.filter((g) => g[1] === k).reduce((a, g) => a + g[2], 0);
    wrap.insertAdjacentHTML('beforeend', `<div class="as-trs">${[0, 1].map((k) => `<div class="as-tr" style="flex:${half(k)}"><span>TR${k ? '₂' : '₁'} = ${k ? TR2 : TR1} ms</span></div>`).join('')}</div>${withCursor ? '<div class="as-cursor"></div>' : ''}`);
    return { SEG, CYCLE, cursor: wrap.querySelector('.as-cursor') };
  }

  document.querySelectorAll('section.afi-spin').forEach((slide) => {
    const [TR1, TR2] = slide.dataset.tr.split(',').map(Number), n = TR2 / TR1;
    const sphere = makeSphere(slide.querySelector('canvas.as-sphere'));
    const q = (c) => slide.querySelector(c);
    const st = { b1: 1, t1: T1, playing: true, t: 0, mz: [null, null], s: [null, null], lastMz: 1, lastS: 1 };
    const { SEG, CYCLE, cursor } = timeline(q('.as-strip'), TR1, TR2, true);

    function frame() {
      const th = ALPHA * st.b1, [m1, m2] = steady(th, TR1, TR2, st.t1), M = [m1, m2], s = th * D2R;
      let t = st.t % CYCLE, i = 0;
      while (t > SEG[i][2]) { t -= SEG[i][2]; i++; }
      const [kind, k, d] = SEG[i], f = t / d, mz0 = M[k];
      let m, spoil = false;
      if (kind === 'pulse') m = [0, mz0 * Math.sin(s * f), mz0 * Math.cos(s * f)];
      else if (kind === 'read') { m = [0, mz0 * Math.sin(s), mz0 * Math.cos(s)]; st.s[k] = mz0 * Math.sin(s); st.lastS = k; }
      else if (kind === 'spoil') { m = [0, mz0 * Math.sin(s) * (1 - f), mz0 * Math.cos(s)]; spoil = true; }
      else {
        const tr = k ? TR2 : TR1, z = 1 - (1 - mz0 * Math.cos(s)) * Math.exp(-(f * tr) / st.t1);
        m = [0, 0, z];
        if (f > 0.98) { st.mz[k ? 0 : 1] = M[k ? 0 : 1]; st.lastMz = k ? 0 : 1; }   // just before the next pulse
      }
      sphere.draw({ m, mz: st.mz, s: st.s, lastMz: st.lastMz, lastS: st.lastS, spoil, zoom: st.zoom });
      cursor.style.left = `${(100 * (st.t % CYCLE)) / CYCLE}%`;
    }
    function panel() {
      const th = ALPHA * st.b1, [m1, m2] = steady(th, TR1, TR2, st.t1), s1 = m1 * Math.sin(th * D2R), s2 = m2 * Math.sin(th * D2R);
      const f = (v) => v.toFixed(3), bar = (el, v) => { el.style.width = `${Math.abs(v) * 50}%`; el.style.left = v < 0 ? `${50 - Math.abs(v) * 50}%` : '50%'; };
      q('.as-b1-read').textContent = `${st.b1.toFixed(2)} (flip angle ${th.toFixed(0)}°)`;
      q('.as-m1').textContent = f(m1); q('.as-m2').textContent = f(m2);
      q('.as-s1').textContent = f(s1); q('.as-s2').textContent = f(s2);
      bar(q('.as-bar1'), s1); bar(q('.as-bar2'), s2);
      const r = s2 / s1, rm = Math.abs(s2) / Math.abs(s1);
      q('.as-r').textContent = `${f(r)}${r < 0 ? '  (magnitude images: ' + f(rm) + ')' : ''}`;
      const est = q('.as-est');
      if (est) {
        if (n === 1) est.textContent = '– (n = 1: no information)';
        else { const c = Math.max(-1, Math.min(1, (rm * n - 1) / (n - rm))); est.textContent = (Math.acos(c) / D2R / ALPHA).toFixed(2); }
      }
    }

    let last = null, raf = null;
    function loop(now) {
      if (last != null && st.playing) st.t += (now - last) / 1000;
      last = now; frame(); raf = requestAnimationFrame(loop);
    }
    const start = () => { if (raf == null) { last = null; raf = requestAnimationFrame(loop); } };
    const stop = () => { if (raf != null) cancelAnimationFrame(raf); raf = null; };
    const b1In = q('.as-b1');
    // one zoom for the whole B1 range (it only changes with T1): the largest |Mz| over the slider's range fills 0.85 of the circle
    const setZoom = () => {
      const lo = Number(b1In.min), hi = Number(b1In.max); let big = 0;
      for (let j = 0; j <= 100; j++) { const [a, b] = steady(ALPHA * (lo + ((hi - lo) * j) / 100), TR1, TR2, st.t1); big = Math.max(big, Math.abs(a), Math.abs(b)); }
      st.zoom = 0.85 / big;
    };
    setZoom();
    b1In.addEventListener('input', () => { st.b1 = Number(b1In.value); st.mz = [null, null]; st.s = [null, null]; panel(); });   // the locks fill in again
    b1In.addEventListener('keydown', (e) => e.stopPropagation());   // arrow keys move the slider, not the slides
    const t1In = q('.as-t1');
    if (t1In) {
      const t1Read = () => { q('.as-t1-read').textContent = `${st.t1} ms`; };
      t1In.addEventListener('input', () => { st.t1 = Number(t1In.value); setZoom(); st.mz = [null, null]; st.s = [null, null]; t1Read(); panel(); });
      t1In.addEventListener('keydown', (e) => e.stopPropagation());
      t1Read();
    }
    const play = q('.as-play');
    play.addEventListener('click', () => { st.playing = !st.playing; play.textContent = st.playing ? 'Pause' : 'Play'; play.blur(); });
    panel(); frame();
    Reveal.on('slidechanged', (e) => { if (e.currentSlide === slide) start(); else stop(); });
    Reveal.on('ready', (e) => { if (e.currentSlide === slide) start(); });
    if (Reveal.isReady() && Reveal.getCurrentSlide() === slide) start();
  });
  // the same diagram, still: slides with class afi-seq and data-tr="TR1,TR2" (no sphere, no cursor)
  document.querySelectorAll('section.afi-seq').forEach((slide) => {
    const [TR1, TR2] = slide.dataset.tr.split(',').map(Number);
    timeline(slide.querySelector('.as-strip'), TR1, TR2, false);
  });
})();
