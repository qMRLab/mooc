/* Exercise 5-1 (a), "Double-echo B0 mapping in a single voxel": its parts, one per tab.
 *   Part 1, Single spin: the transverse magnetization of one spin seen from above (B0 towards the viewer), in the frame
 *   rotating at the scanner's frequency. A positive offset precesses clockwise, as dM/dt = γ M × B gives for protons
 *   (γ > 0). The 90° excitation is along +x (B1 along +x), which tips M from +z to +y: so M starts along +y.
 *   The phase is relative to the receive coil's reference, along +y (counter-clockwise positive), so it starts at 0:
 *   φ(TE) = −360° Δf TE.
 *   "Acquire" leaves a grey ghost of the arrow and adds its values to the list drawn right of the circle.
 *   Part 2, Water + Fat: the same, for a voxel with a fat fraction F (slider): water (1 − F) and fat (F) at −3.4 ppm
 *   from water, drawn tip to tail or as two spins from the centre, with a dotted circle where fat can be. Their sum,
 *   the signal, is what is measured (ghosts, list, questions): it is not drawn live, only flashed in black when
 *   acquired (with the parallelogram, as two spins), before it stays as the grey ghost.
 *   Part 3, Choosing ΔTE: the Water + Fat setup, with questions on echoes where water and fat are in phase.
 *   All parts are built by build(panel, fat); their markup is the same apart from the fat row and the questions.
 *   An arc from +y (phase 0) shows the phase, wrapped to ±180°, with its value: of the spin (Part 1), or of the last
 *   measurement (Part 2, as the signal is not drawn live).
 *   The SVG is drawn at about 0.6 of its viewBox, so its text sizes are set large. */
(function () {
  'use strict';
  const GAMMA_BAR = 42.577;   // MHz/T: 1 ppm = 42.577 × B0 Hz
  const PHI0 = Math.PI / 2;   // after a 90° pulse along +x, M lies along +y (screen angle); its phase there is 0
  const FAT_PPM = -3.4;       // fat − water chemical shift
  const WATER_ARC = '#4f86bf';
  const slide = document.getElementById('new-a'); if (!slide) return;
  const wrap = (p) => p - 2 * Math.PI * Math.round(p / (2 * Math.PI));
  // the signal (water + fat) at t ms, for a field offset hz and fat fraction F at B tesla: [x, y] in the frame where
  // +y is the receive phase 0 (so x = −sin, y = cos of the phase), and its phase in rad
  function signal(t, hz, B, F) {
    const pw = -2 * Math.PI * hz * t * 1e-3, pf = -2 * Math.PI * (hz + FAT_PPM * GAMMA_BAR * B) * t * 1e-3;
    const re = (1 - F) * Math.cos(pw) + F * Math.cos(pf), im = (1 - F) * Math.sin(pw) + F * Math.sin(pf);
    return { mag: Math.hypot(re, im), phase: Math.atan2(im, re), pw, pf };
  }

  build(slide.querySelector('.ex-panel[data-panel="1"]'), false);   // Part 1: single spin
  build(slide.querySelector('.ex-panel[data-panel="2"]'), true);    // Part 2: water + fat
  build(slide.querySelector('.ex-panel[data-panel="3"]'), true);    // Part 3: choosing ΔTE (water + fat)

  function build(panel, fat) {
    if (!panel) return;
    const q = (c) => panel.querySelector(c);
    const te = q('.sv-te'), teNum = q('.sv-te-num'), off = q('.sv-off'), offNum = q('.sv-off-num'), b0 = q('.sv-b0'), b0Num = q('.sv-b0-num');
    [te, teNum, off, offNum, b0, b0Num].forEach(keepSlider);
    const ff = q('.sv-ff'), ffNum = q('.sv-ff-num');
    if (fat) [ff, ffNum].forEach(keepSlider);
    const st = { te: 0, b0: 3, F: fat ? Number(ff.value) / 100 : 0, unit: 'hz', phase: 'deg', ppm: 50 / (GAMMA_BAR * 3), hz: 50, shots: [] };
    const R = 180;

    // the diagram
    const svg = q('.sv-svg');
    svgEl('circle', { r: R, fill: 'none', stroke: '#d8dee6', 'stroke-width': 1.5 }, svg);
    svgEl('line', { x1: -R - 18, y1: 0, x2: R + 18, y2: 0, stroke: '#c3cbd5', 'stroke-width': 1.2 }, svg);
    svgEl('line', { x1: 0, y1: R + 18, x2: 0, y2: -R - 18, stroke: '#c3cbd5', 'stroke-width': 1.2 }, svg);
    svgEl('text', { x: R + 22, y: 8, 'font-size': 26, fill: '#5b6776' }, svg).textContent = 'x';
    svgEl('text', { x: -28, y: -R - 6, 'font-size': 26, fill: '#5b6776' }, svg).textContent = 'y';
    // B0 out of the screen, towards the viewer
    const b0g = svgEl('g', { transform: `translate(${-R - 22}, ${-R - 18})` }, svg);
    svgEl('circle', { r: 13, fill: '#fff', stroke: INK, 'stroke-width': 2.4 }, b0g);
    svgEl('circle', { r: 4, fill: INK }, b0g);
    svgEl('text', { x: 20, y: 8, 'font-size': 22, fill: INK }, b0g).innerHTML = 'B<tspan baseline-shift="sub" font-size="15">0</tspan>';
    const ghosts = svgEl('g', {}, svg);
    const ARC = 0.3, arcCol = fat ? '#7a8a9c' : WATER_ARC;
    const arc = svgEl('path', { fill: 'none', stroke: arcCol, 'stroke-width': 2.5 }, svg);
    const arcHead = svgEl('path', { fill: arcCol }, svg);
    const arcTxt = svgEl('text', { 'font-size': 21, 'font-weight': 700, fill: arcCol, 'text-anchor': 'middle', stroke: '#fff', 'stroke-width': 6, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }, svg);
    const trail = svgEl('path', { fill: 'none', stroke: '#9aa5b1', 'stroke-width': 2, 'stroke-dasharray': '4 4' }, svg);
    // the arrows: one spin (Part 1), or water and fat tip to tail and the signal they add up to (Part 2)
    const WATER = '#1f5f99', FATC = '#e5867c', SIG = '#2b2f36';
    const mkArrow = (color, w) => ({ line: svgEl('line', { x1: 0, y1: 0, stroke: color, 'stroke-width': w, 'stroke-linecap': 'round' }, svg), head: svgEl('path', { fill: color }, svg) });
    const fatRing = fat ? svgEl('circle', { fill: 'none', stroke: '#e5867c', 'stroke-width': 2, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round', opacity: 0.8 }, svg) : null;
    const para = fat ? [0, 1].map(() => svgEl('line', { stroke: SIG, 'stroke-width': 2, 'stroke-dasharray': '6 5', opacity: 0.5 }, svg)) : [];
    const sigArrow = fat ? mkArrow(SIG, 4) : null, wArrow = mkArrow(WATER, 6), fArrow = fat ? mkArrow(FATC, 6) : null;
    // the signal: below water and fat when tip to tail (it closes their triangle), on top as two spins
    const layerSignal = () => {
      if (st.view === 'sep') { svg.insertBefore(sigArrow.line, hub); svg.insertBefore(sigArrow.head, hub); }
      else { svg.insertBefore(sigArrow.head, wArrow.line); svg.insertBefore(sigArrow.line, sigArrow.head); }
    };
    const hub = svgEl('circle', { r: 6, fill: fat ? SIG : WATER }, svg);
    svg.appendChild(arcTxt);   // the phase value on top of the arrows, with a white halo
    if (fat) {   // which arrow is which
      [['water', WATER], ['fat', FATC], ['measured (sum)', '#9aa5b1']].forEach(([w, c], i) => {
        const g = svgEl('g', { transform: `translate(${R + 80 + i * 130}, ${R + 20})` }, svg);
        svgEl('line', { x1: 0, y1: -8, x2: 30, y2: -8, stroke: c, 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
        svgEl('text', { x: 40, y: 0, 'font-size': 22, fill: c }, g).textContent = w;
      });
    }
    // the measurements, listed right of the circle
    const LX = R + 80, COL = [0, 40, 170, 300, 385];   // #, TE, offset, |M|, phase
    const list = svgEl('g', { 'font-size': 24, fill: INK, style: 'font-variant-numeric: tabular-nums' }, svg);
    const MAXROWS = 8;

    const tip = (phi, r) => [r * Math.cos(phi), -r * Math.sin(phi)];   // math angle → screen (y up)
    // an arrow from (x0, y0) to (x1, y1), in units of R, screen y down; the head shrinks for short arrows
    const setArrow = (a, x0, y0, x1, y1) => {
      const X0 = x0 * R, Y0 = y0 * R, X1 = x1 * R, Y1 = y1 * R, L = Math.hypot(X1 - X0, Y1 - Y0);
      a.line.style.display = a.head.style.display = L < 2 ? 'none' : '';
      if (L < 2) return;
      const size = Math.min(26, L * 0.45), ux = (X1 - X0) / L, uy = (Y1 - Y0) / L, bx = X1 - ux * size, by = Y1 - uy * size;
      a.line.setAttribute('x1', X0); a.line.setAttribute('y1', Y0);
      a.line.setAttribute('x2', X1 - ux * size * 0.6); a.line.setAttribute('y2', Y1 - uy * size * 0.6);
      a.head.setAttribute('d', `M${X1},${Y1} L${bx - (uy * size) / 2},${by + (ux * size) / 2} L${bx + (uy * size) / 2},${by - (ux * size) / 2} Z`);
    };
    const toXY = (phase, r) => [-r * Math.sin(phase), -r * Math.cos(phase)];   // receive phase (0 along +y, CCW +) → screen
    // the phase arc: from +y to phase p (rad, in ±π), radius ARC × R, with a small head and the value beside it
    function drawArc(p) {
      const show = p !== null && Math.abs(p) > 0.02;
      [arc, arcHead, arcTxt].forEach((e) => { e.style.display = show ? '' : 'none'; });
      if (!show) return;
      const r = ARC * R, [x0, y0] = toXY(0, ARC), [x1, y1] = toXY(p, ARC);
      arc.setAttribute('d', `M${x0 * R},${y0 * R} A${r},${r} 0 0 ${p > 0 ? 0 : 1} ${x1 * R},${y1 * R}`);
      // head: a small triangle at the end, pointing along the arc
      const tx = -Math.cos(p) * Math.sign(p), ty = Math.sin(p) * Math.sign(p), nx = -ty, ny = tx, h = 13;
      const ex = x1 * R, ey = y1 * R;
      arcHead.setAttribute('d', `M${ex + tx * 4},${ey + ty * 4} L${ex - tx * h + nx * h * 0.45},${ey - ty * h + ny * h * 0.45} L${ex - tx * h - nx * h * 0.45},${ey - ty * h - ny * h * 0.45} Z`);
      const [lx, ly] = toXY(p / 2, ARC + 0.22);
      arcTxt.setAttribute('x', lx * R); arcTxt.setAttribute('y', ly * R + 7);
      arcTxt.textContent = fmtPhase(p);
    }
    const fmtPhase = (p) => (st.phase === 'deg' ? `${((p * 180) / Math.PI).toFixed(1)}°` : `${p.toFixed(3)} rad`);   // p in (−π, π]
    const hzNow = () => (st.unit === 'hz' ? st.hz : st.ppm * GAMMA_BAR * st.b0);
    const ppmNow = () => hzNow() / (GAMMA_BAR * st.b0);

    function setOffsetSlider() {
      if (st.unit === 'hz') { off.min = offNum.min = -250; off.max = offNum.max = 250; off.step = offNum.step = 1; off.value = st.hz; }
      else { off.min = offNum.min = -2; off.max = offNum.max = 2; off.step = offNum.step = 0.01; off.value = st.ppm; }
      q('.sv-off-unit').textContent = st.unit === 'hz' ? 'Hz' : 'ppm';
    }
    function draw() {
      const t = st.te, B = st.b0, f = hzNow(), ppm = ppmNow();
      // the boxes show the values, except the one being typed in
      if (document.activeElement !== teNum) teNum.value = t.toFixed(2);
      if (document.activeElement !== b0Num) b0Num.value = B.toFixed(2);
      if (document.activeElement !== offNum) offNum.value = st.unit === 'hz' ? String(+st.hz.toFixed(1)) : String(+st.ppm.toFixed(3));
      if (fat && document.activeElement !== ffNum) ffNum.value = String(Math.round(st.F * 100));
      const sg = signal(t, f, B, st.F), phi = PHI0 + sg.pw;   // water starts along +y, clockwise for a positive offset
      drawArc(fat ? (st.shots.length ? st.shots[st.shots.length - 1].phase : null) : wrap(sg.pw));
      const [wx, wy] = toXY(sg.pw, 1 - st.F);
      setArrow(wArrow, 0, 0, wx, wy);
      if (fat) {
        const [fx, fy] = toXY(sg.pf, st.F), [sx, sy] = toXY(sg.phase, sg.mag);
        const sep = st.view === 'sep';   // two spins from the centre, or fat from water's tip
        setArrow(fArrow, sep ? 0 : wx, sep ? 0 : wy, sep ? fx : wx + fx, sep ? fy : wy + fy);
        setArrow(sigArrow, 0, 0, sx, sy);
        layerSignal();
        // where the fat can be: a dotted circle of radius F, round water's tip (tip to tail) or the centre (two spins)
        fatRing.setAttribute('cx', sep ? 0 : wx * R); fatRing.setAttribute('cy', sep ? 0 : wy * R); fatRing.setAttribute('r', st.F * R);
        [[wx, wy], [fx, fy]].forEach(([ax, ay], k) => {   // the parallelogram: each spin's tip to the sum's
          Object.entries({ x1: ax * R, y1: ay * R, x2: sx * R, y2: sy * R }).forEach(([a, v]) => para[k].setAttribute(a, v));
          para[k].style.display = sep && st.flash ? '' : 'none';
        });
        if (!st.flash) sigArrow.line.style.display = sigArrow.head.style.display = 'none';   // only shown when acquired
        trail.setAttribute('d', '');
        return;
      }
      // the path the spin took: a spiral, slightly inwards for each turn so the turns stay visible
      const acc = phi - PHI0, turns = Math.abs(acc) / (2 * Math.PI), n = Math.max(2, Math.ceil(Math.abs(acc) / 0.05));
      const pts = [];
      const shrink = Math.min(0.09, 0.6 / Math.max(turns, 1));   // inwards per turn, so even many turns fit inside the circle
      for (let i = 0; i <= n; i++) { const a = (acc * i) / n, r = R * (0.9 - shrink * (Math.abs(a) / (2 * Math.PI))); const [px, py] = tip(PHI0 + a, r); pts.push(`${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`); }
      trail.setAttribute('d', Math.abs(acc) > 0.02 ? pts.join('') : '');
    }
    function drawGhosts() {
      ghosts.innerHTML = '';
      st.shots.forEach((s, i) => {
        const [x, y] = toXY(s.phase, s.mag), [lx, ly] = toXY(s.phase, s.mag + 26 / R);
        const g = { line: svgEl('line', { stroke: '#9aa5b1', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.55 }, ghosts), head: svgEl('path', { fill: '#9aa5b1', opacity: 0.55 }, ghosts) };
        setArrow(g, 0, 0, x, y);
        svgEl('text', { x: lx * R, y: ly * R + 8, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 700, fill: '#7a8a9c' }, ghosts).textContent = i + 1;
      });
    }
    function drawTable() {
      list.innerHTML = '';
      const row = (y, cells, attrs) => cells.forEach((c, j) => { svgEl('text', { x: LX + COL[j], y, ...(attrs[j] || {}) }, list).textContent = c; });
      const grey = { fill: '#7a8a9c', 'font-size': 21 };
      row(-R + 30, ['#', 'TE', 'Freq. offset', '|M|', 'Phase'], [grey, grey, grey, grey, grey]);
      // the phase unit, a two-button switch above the Phase column
      const sw = svgEl('g', { transform: `translate(${LX + COL[4] - 4}, ${-R - 8})`, style: 'cursor:pointer', 'font-size': 18 }, list);
      [['deg', 'deg', 0], ['rad', 'rad', 52]].forEach(([u, label, x]) => {
        const on = st.phase === u, b = svgEl('g', { role: 'button', 'aria-pressed': String(on), 'aria-label': `Phase in ${u === 'deg' ? 'degrees' : 'radians'}` }, sw);
        // rounded on the outer side only: the left button's left corners, the right button's right corners
        const w = 52, h = 26, y = -18, r = 6, L = x === 0;
        const d = L ? `M${x + r},${y} H${x + w} V${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`
          : `M${x},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x} Z`;
        svgEl('path', { d, fill: on ? '#e9eef5' : '#fff', stroke: '#c9d1db', 'stroke-width': 1.5 }, b);
        svgEl('text', { x: x + 26, y: 1, 'text-anchor': 'middle', fill: on ? INK : '#7a8a9c', 'font-weight': on ? 700 : 400 }, b).textContent = label;
        b.addEventListener('click', () => { st.phase = u; drawTable(); draw(); });
      });
      svgEl('line', { x1: LX, x2: LX + COL[4] + 120, y1: -R + 41, y2: -R + 41, stroke: '#d8dee6', 'stroke-width': 1.5 }, list);
      const first = Math.max(0, st.shots.length - MAXROWS);   // the latest ones, if there are many
      st.shots.slice(first).forEach((s, k) => {
        const i = first + k;
        row(-R + 74 + 33 * k, [String(i + 1), `${s.te.toFixed(2)} ms`, `${s.f > 0 ? '+' : ''}${s.f.toFixed(0)} Hz`, s.mag.toFixed(2), fmtPhase(s.phase)],
          [{ fill: '#7a8a9c', 'font-weight': 700 }, {}, {}, {}, { 'font-weight': 700 }]);
      });
    }

    q('.sv-acq').addEventListener('click', (e) => {
      e.currentTarget.blur();
      const t = st.te, f = hzNow(), sg = signal(t, f, st.b0, st.F);
      st.shots.push({ te: t, f, mag: sg.mag, phase: sg.phase });
      draw();
      if (fat) {   // what is recorded is the sum: show it for a moment, then it stays as the ghost
        st.flash = true; draw(); clearTimeout(st.flashT);
        st.flashT = setTimeout(() => { st.flash = false; draw(); }, 1000);
      }
      drawGhosts(); drawTable();
    });
    q('.sv-clear').addEventListener('click', (e) => { e.currentTarget.blur(); st.shots = []; drawGhosts(); drawTable(); draw(); });
    // TE: the slider for sweeping, the box for exact values (typed, or its arrows in 0.01 ms steps); the box wins
    te.addEventListener('input', () => { st.te = Number(te.value); draw(); });
    teNum.addEventListener('input', () => {
      const v = Number(teNum.value); if (teNum.value === '' || !Number.isFinite(v)) return;
      st.te = Math.max(0, Math.min(60, v)); te.value = st.te; draw();
    });
    teNum.addEventListener('change', () => { teNum.value = st.te.toFixed(2); });
    b0.addEventListener('input', () => { st.b0 = Number(b0.value); draw(); calc(); });
    off.addEventListener('input', () => { if (st.unit === 'hz') st.hz = Number(off.value); else st.ppm = Number(off.value); draw(); });
    // a box next to each slider for exact values: typing moves the slider; the box keeps its value (the slider snaps to its steps)
    const typed = (box, lo, hi, set) => {
      box.addEventListener('input', () => {
        const v = Number(box.value); if (box.value === '' || !Number.isFinite(v)) return;
        set(Math.max(lo(), Math.min(hi(), v))); draw(); calc();
      });
      box.addEventListener('change', () => { box.blur(); draw(); });
    };
    typed(offNum, () => Number(off.min), () => Number(off.max), (v) => { if (st.unit === 'hz') st.hz = v; else st.ppm = v; off.value = v; });
    typed(b0Num, () => 0.05, () => 7, (v) => { st.b0 = v; b0.value = v; });
    if (fat) {
      ff.addEventListener('input', () => { st.F = Number(ff.value) / 100; draw(); });
      st.view = 'sum';
      segToggle(panel, 'svv', (v) => { st.view = v; draw(); });
      typed(ffNum, () => 0, () => 100, (v) => { st.F = v / 100; ff.value = v; });
    }
    segToggle(panel, 'svu', (u) => {
      // keep the same field offset in the new unit
      if (u === 'ppm') st.ppm = Math.max(-2, Math.min(2, st.hz / (GAMMA_BAR * st.b0)));
      else st.hz = Math.max(-250, Math.min(250, Math.round(st.ppm * GAMMA_BAR * st.b0 * 10) / 10));
      st.unit = u; setOffsetSlider(); draw();
    });

    // the calculator: the lecture's dual-echo equation, ΔB0 [T] = (φ2 − φ1) / (γ ΔTE), γ = 2π × 42.577 MHz/T;
    // also shown as a frequency (γ̄ΔB0, Hz) or as ppm of B0.
    // As the equation needs, the phases are in radians and ΔTE in seconds (students convert); nothing is unwrapped.
    st.out = 'ut'; let calcShown = false;
    function calc() {
      if (!calcShown) return;
      const p1 = q('.sv-p1').value, p2 = q('.sv-p2').value, d = q('.sv-dte').value, out = q('.sv-calc-out');
      if (p1 === '' || p2 === '' || d === '' || !(Number(d) > 0)) { out.textContent = 'Fill in both phases and a ΔTE above 0.'; return; }
      const dphi = Number(p2) - Number(p1);
      const hz = dphi / (2 * Math.PI * Number(d)), B = st.b0;   // γ̄ΔB0 = Δφ / (2π ΔTE)
      const sg = hz > 0 ? '+' : '';   // µT: Δf / γ̄; ppm: ΔB0 / B0 × 10⁶
      out.innerHTML = st.out === 'ut' ? `ΔB<sub>0</sub> = <b>${sg}${(hz / GAMMA_BAR).toFixed(3)} µT</b>`
        : st.out === 'hz' ? `γ̄ΔB<sub>0</sub> = <b>${sg}${hz.toFixed(1)} Hz</b>`
        : `ΔB<sub>0</sub> = <b>${sg}${(hz / (GAMMA_BAR * B)).toFixed(3)} ppm</b> <span style="color:var(--muted)">at ${B.toFixed(2)} T</span>`;
    }
    q('.sv-calc-go').addEventListener('click', (e) => { e.currentTarget.blur(); calcShown = true; calc(); });
    ['.sv-p1', '.sv-p2', '.sv-dte'].forEach((c) => { keepSlider(q(c)); q(c).addEventListener('keydown', (e) => { if (e.key === 'Enter') { calcShown = true; calc(); } }); });
    segToggle(panel, 'svb', (u) => { st.out = u; calc(); });

    // The questions (pages: data-page; boxes .sv-q at the field data-b0, with fat fraction data-ff, 0 in Part 1), with
    // this simulation's sign (clockwise for a positive offset), on the signal. The echoes: data-te1 / data-te2 in ms
    // (default 2 and 4), or "ip1" / "ip2" for the first and second time water and fat are back in phase (n / |Δf_fat|).
    //   data-kind="te": that in-phase TE (data-n = 1 or 2), in ms, within 0.02 ms.
    //   data-kind="dphi": Δφ = φ(TE2) − φ(TE1) in degrees for the case's offset (data-ppm), wrapped to ±180°;
    //       answers 360° apart are the same phase, so both are accepted, within 1°.
    //   data-kind="ut": the ΔB0 measured from that Δφ with the lecture's equation, Δφ / (γ ΔTE), in µT, within 0.02 µT.
    segToggle(panel, 'qp', (n) => panel.querySelectorAll('.sv-page').forEach((pg) => { pg.hidden = pg.dataset.page !== n; }));
    const z = (x, d) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);   // no "−0.00"
    const deg = (x) => `${((x * 180) / Math.PI).toFixed(1)}°`;
    panel.querySelectorAll('.sv-q').forEach((box) => {
      const B = Number(box.dataset.b0), F = Number(box.dataset.ff || 0), inputs = [...box.querySelectorAll('.sv-a')], go = box.querySelector('.sv-submit');
      const fatHz = Math.abs(FAT_PPM * GAMMA_BAR * B), ipTE = (n) => (1000 * n) / fatHz;   // ms
      const echo = (v, d) => (v === undefined ? d : v.startsWith('ip') ? ipTE(Number(v.slice(2))) : Number(v));
      const TE1 = echo(box.dataset.te1, 2), TE2 = echo(box.dataset.te2, 4), DTE = (TE2 - TE1) / 1000;
      go.addEventListener('click', () => {
        go.blur();
        const parts = [], kind0 = inputs[0].dataset.kind;
        inputs.forEach((inp) => {
          const kind = inp.dataset.kind, ppm = Number(inp.dataset.ppm || 0), hz = ppm * GAMMA_BAR * B;
          const p1 = signal(TE1, hz, B, F).phase, p2 = signal(TE2, hz, B, F).phase, dphi = (wrap(p2 - p1) * 180) / Math.PI, rad = (dphi * Math.PI) / 180;
          const want = kind === 'te' ? ipTE(Number(inp.dataset.n)) : kind === 'ut' ? rad / (2 * Math.PI * DTE) / GAMMA_BAR : dphi;
          const fb = inp.nextElementSibling.nextElementSibling, v = inp.value;
          if (v === '' || !Number.isFinite(Number(v))) { fb.className = 'ask-fb'; fb.textContent = 'Type a number first.'; }
          else {
            const ok = kind === 'te' ? Math.abs(Number(v) - want) <= 0.02 : kind === 'ut' ? Math.abs(Number(v) - want) <= 0.02 : Math.abs(wrap(((Number(v) - want) * Math.PI) / 180)) <= Math.PI / 180;
            fb.className = `ask-fb ${ok ? 'right' : 'wrong'}`;
            fb.textContent = ok ? '✓' : kind === 'te' ? `✗ ${want.toFixed(2)} ms` : kind === 'ut' ? `✗ ${z(want, 2)} µT` : `✗ ${z(want, 1)}°`;
          }
          const t1 = `${TE1.toFixed(2).replace(/\.00$/, '')} ms`, t2 = `${TE2.toFixed(2).replace(/\.00$/, '')} ms`;
          if (kind === 'te') { if (inp.dataset.n === '1') parts.push(`At ${B} T fat is −${Math.abs(FAT_PPM)} ppm × ${(GAMMA_BAR * B).toFixed(1)} Hz/ppm = −${fatHz.toFixed(1)} Hz from water, so it turns once relative to water every 1 / ${fatHz.toFixed(1)} Hz = <b>${ipTE(1).toFixed(2)} ms</b>, and again at <b>${ipTE(2).toFixed(2)} ms</b>.`); }
          else if (kind === 'ut') parts.push(`${ppm} ppm: ${z(rad, 3)} rad / (γ × ${+(DTE.toFixed(6))} s) = <b>${z(want, 2)} µT</b>${F ? ` (water alone: ${z(-ppm * B, 2)})` : ''}.`);
          else if (F) parts.push(`${ppm} ppm: φ = ${deg(p1)} at ${t1}, ${deg(p2)} at ${t2}, so Δφ = <b>${z(dphi, 1)}°</b>.`);
          else parts.push(ppm ? `At ${B} T, ${ppm} ppm = ${hz.toFixed(1)} Hz, so Δφ = −360° × ${hz.toFixed(1)} Hz × ${+(DTE.toFixed(6))} s = <b>${dphi.toFixed(1)}°</b>, clockwise.` : 'At 0 ppm the spin does not move: Δφ = 0.');
        });
        const why = box.querySelector('.sv-why'); why.hidden = false;
        why.innerHTML = (kind0 === 'ut' ? `ΔB<sub>0</sub> = Δφ / (γ ΔTE), γ = 2.675 × 10<sup>8</sup> rad/s/T.${F ? '<br>' : ' '}` : '') + parts.join(F ? '<br>' : ' ');
        // in-phase echoes (Choosing ΔTE): the point of the part, highlighted
        if (kind0 === 'ut' && F && String(box.dataset.te1).startsWith('ip')) {
          why.innerHTML += `<span class="sv-hl">The 0.5 ppm voxel gives the same ΔB<sub>0</sub> as water alone (${z(-0.5 * B, 2)} µT): with water and fat in phase at both echoes, fat no longer adds a false field.</span>`;
        }
      });
      inputs.forEach((inp) => { keepSlider(inp); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go.click(); }); });
    });
    setOffsetSlider(); draw(); drawTable();
  }
})();
