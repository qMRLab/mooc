/* The two Bloch–Siegert acquisitions (Exercise 4-4, #bs-phase), measured at +4 kHz and −4 kHz (bs-phase-data.js), masked to
 * the brain. Two questions, each with its images: (1) magnitude (grey): if the pulse tips the on-resonance spins' M_z, from
 * which z axis is that measured? The same in all three frames, which all turn about z. (2) phase (blue −π, white 0, red +π):
 * M_xy's angle from the x axis of which frame? The receive frame, set by the receiver demodulating at f0 (the Larmor frame
 * of the on-resonance spins). */
(function () {
  'use strict';
  const slide = document.getElementById('bs-phase'), D = window.BS_PHASE; if (!slide || !D || !window.Plotly) return;
  const bytes = (b64) => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const NR = D.rows, NC = D.cols, M = bytes(D.mask), toRad = (v) => (v / 255) * 2 * Math.PI - Math.PI, toMag = (v) => v / 255;
  let r0 = NR, r1 = 0, c0 = NC, c1 = 0;
  for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) if (M[i * NC + j]) { r0 = Math.min(r0, i); r1 = Math.max(r1, i); c0 = Math.min(c0, j); c1 = Math.max(c1, j); }
  r0 = Math.max(0, r0 - 2); r1 = Math.min(NR - 1, r1 + 2); c0 = Math.max(0, c0 - 2); c1 = Math.min(NC - 1, c1 + 2);
  const grid = (u8, f) => Array.from({ length: r1 - r0 + 1 }, (_, i) => Array.from({ length: c1 - c0 + 1 }, (_, j) => { const k = (i + r0) * NC + j + c0; return M[k] ? f(u8[k]) : null; }));
  const PH = { pos: grid(bytes(D.pos), toRad), neg: grid(bytes(D.neg), toRad) }, MG = { pos: grid(bytes(D.magPos), toMag), neg: grid(bytes(D.magNeg), toMag) };
  const inBrain = MG.pos.flat().concat(MG.neg.flat()).filter((v) => v != null).sort((a, b) => a - b), MAGTOP = inBrain[Math.floor(0.98 * (inBrain.length - 1))];   // one grey scale, the brightest 2 % saturate
  const W = 270, H = Math.round((W * (r1 - r0 + 1)) / (c1 - c0 + 1));
  // phase: blue −π, white 0, red +π, grey outside the brain so white (phase 0) stands out, the π ticks in a serif font (the deck's
  // sans-serif draws π like an upside-down U); magnitude: grey, white outside the brain
  function show(host, z, bar, kind) {
    const ph = kind === 'phase';
    Plotly.react(host, [{ type: 'heatmap', z, x0: c0, y0: r0, colorscale: ph ? CMAPS.rdbu : CMAPS.gray, zmin: ph ? -Math.PI : 0, zmax: ph ? Math.PI : MAGTOP, hoverongaps: false,
      hovertemplate: ph ? '%{z:.2f} rad<extra></extra>' : '%{z:.2f}<extra></extra>', showscale: bar && ph,
      colorbar: bar && ph ? { thickness: 10, len: 0.7, tickvals: [-Math.PI, 0, Math.PI], ticktext: ['−π', '0', 'π'], tickfont: { size: 16, family: '"Times New Roman", Times, serif' }, outlinewidth: 0 } : undefined }], {
      width: W + (bar ? 46 : 0), height: H, margin: { l: 2, r: bar ? 46 : 2, t: 2, b: 2 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: ph ? '#e6eaee' : '#ffffff',
      xaxis: { visible: false, range: [c0 - 0.5, c1 + 0.5], fixedrange: true }, yaxis: { visible: false, range: [r1 + 0.5, r0 - 0.5], scaleanchor: 'x', fixedrange: true },
    }, { displayModeBar: false, responsive: false });
  }
  let kindNow = 'mag', shown = false;
  function images(kind) {
    kindNow = kind; if (!shown) return;
    const Z = kind === 'phase' ? PH : MG;
    show(slide.querySelector('[data-key="pos"]'), Z.pos, false, kind); show(slide.querySelector('[data-key="neg"]'), Z.neg, true, kind);
    slide.querySelectorAll('.bp-kind').forEach((e) => { e.textContent = kind === 'phase' ? 'phase' : 'magnitude'; });
    slide.querySelector('.bp-unit').innerHTML = kind === 'phase' ? 'Phase in radians. Besides the Bloch–Siegert shift, both phases hold the excitation, receive-coil and B<sub>0</sub> phases: these cancel in the difference of the two (see the summary).' : 'Magnitude, both on one grey scale.';
  }
  onShow(slide, () => { shown = true; images(kindNow); });

  // two questions, one after the other: the flip angle's z axis (the same in all three frames), then the phase's x axis
  const steps = [...slide.querySelectorAll('.bp-step')], count = slide.querySelector('.bp-count');
  const WORD = { same: 'the same z in all three', rx: 'the receive frame' };
  function go(n) {
    steps.forEach((st, k) => {
      st.hidden = k !== n;
      st.querySelectorAll('[data-bp]').forEach((x) => { x.disabled = false; x.classList.remove('bp-good', 'bp-bad'); });
      st.querySelector('.bp-fb').hidden = true; st.querySelector('.bp-why').hidden = true;
    });
    count.textContent = `Question ${n + 1} of ${steps.length}`;
    images(steps[n].dataset.images || 'phase');
  }
  steps.forEach((st, n) => {
    const btns = [...st.querySelectorAll('[data-bp]')], key = st.dataset.answer, fb = st.querySelector('.bp-fb');
    btns.forEach((b) => b.addEventListener('click', () => {
      b.blur(); if (btns.some((x) => x.disabled)) return;
      const ok = b.dataset.bp === key;
      btns.forEach((x) => { x.disabled = true; x.classList.toggle('bp-good', x.dataset.bp === key); x.classList.toggle('bp-bad', x === b && !ok); });
      fb.hidden = false; fb.className = `bp-fb ${ok ? 'bp-right' : 'bp-wrong'}`; fb.textContent = ok ? `✓ Right: ${WORD[key]}` : `✗ It’s ${WORD[key]}`;
      st.querySelector('.bp-why').hidden = false;
      if (n === steps.length - 1) st.querySelector('.bp-next').textContent = ok ? 'Next slide →' : 'Start again';   // last question: right → on to the next slide
    }));
    st.querySelector('.bp-next').addEventListener('click', (e) => {
      e.currentTarget.blur();
      if (n === steps.length - 1 && e.currentTarget.textContent.startsWith('Next slide')) { Reveal.next(); return; }
      go((n + 1) % steps.length);
    });
  });
  go(0);
})();
