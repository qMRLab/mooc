/* Exercise 5-1: the chapter's clock exercise as a game, the rates that fit two glances, and the phase of a spin as a clock hand.
 *   #clock-game   two clocks (minute hand only) at two glances; five rounds, fast / slow / can't tell, points for speed.
 *   #clock-alias  every clock rate that puts the hand where it was seen, against the 0.5-1.5x prior.
 *   #spin-dial    phase gained between two echoes (a spiral, one ring per turn) and what the phase difference shows. */
(function () {
  'use strict';
  const PRIOR = [0.5, 1.5];
  const mod = (a, n) => ((a % n) + n) % n;

  // ---------------------------------------------------------------- a clock face with only a minute hand
  function clock(svg) {
    const R = 115;
    svgEl('circle', { r: R, fill: '#fff', stroke: INK, 'stroke-width': 3 }, svg);
    for (let m = 0; m < 60; m++) {
      const a = (m / 60) * 2 * Math.PI, long = m % 5 === 0;
      svgEl('line', { x1: (R - (long ? 14 : 6)) * Math.sin(a), y1: -(R - (long ? 14 : 6)) * Math.cos(a), x2: R * Math.sin(a), y2: -R * Math.cos(a), stroke: INK, 'stroke-width': long ? 2.5 : 1 }, svg);
    }
    [12, 3, 6, 9].forEach((h) => {
      const a = (h / 12) * 2 * Math.PI;
      const t = svgEl('text', { x: (R - 32) * Math.sin(a), y: -(R - 32) * Math.cos(a) + 7, 'text-anchor': 'middle', 'font-size': 20, fill: INK }, svg);
      t.textContent = h;
    });
    const ghost = svgEl('line', { x1: 0, y1: 0, x2: 0, y2: -92, stroke: '#8a95a3', 'stroke-width': 3, 'stroke-dasharray': '7 5', 'stroke-linecap': 'round' }, svg);
    const hand = svgEl('line', { x1: 0, y1: 0, x2: 0, y2: -98, stroke: '#1f5f99', 'stroke-width': 6, 'stroke-linecap': 'round' }, svg);
    svgEl('circle', { r: 6, fill: '#1f5f99' }, svg);
    const turns = svgEl('text', { x: 0, y: 46, 'text-anchor': 'middle', 'font-size': 15, fill: '#c0392b', 'font-weight': 700 }, svg);
    const at = (el, min, len) => { const a = (min / 60) * 2 * Math.PI; el.setAttribute('x2', len * Math.sin(a)); el.setAttribute('y2', -len * Math.cos(a)); };
    let anim = 0;
    return {
      hand(min) { cancelAnimationFrame(anim); at(hand, min, 98); turns.textContent = ''; },
      ghost(min) { ghost.style.display = min == null ? 'none' : ''; if (min != null) at(ghost, min, 92); },
      // replay what the hand really did: from 0 to `total` minutes, counting full turns
      sweep(total, ms) {
        cancelAnimationFrame(anim);
        const t0 = performance.now();
        const step = (now) => {
          const f = Math.min(1, (now - t0) / ms), m = total * f;
          at(hand, m, 98);
          const n = Math.floor(m / 60), rest = Math.round(m - 60 * n);
          turns.textContent = n ? `${n} turn${n > 1 ? 's' : ''} + ${rest} min` : `${rest} min`;
          if (f < 1) anim = requestAnimationFrame(step);
        };
        anim = requestAnimationFrame(step);
      },
    };
  }

  // rates within the prior that put the hand at the seen position after dt minutes
  function fits(seen, dt, lo = PRIOR[0], hi = PRIOR[1]) {
    const out = [];
    for (let k = -3; k <= 10; k++) { const r = (seen + 60 * k) / dt; if (r >= lo - 1e-9 && r <= hi + 1e-9) out.push(r); }
    return out;
  }
  const verdict = (rs) => (rs.every((r) => r > 1) ? 'fast' : rs.every((r) => r < 1) ? 'slow' : 'cant');
  const WORDS = { fast: 'fast', slow: 'slow', cant: 'can’t tell' };
  const watch = (dt) => { const m = 9 * 60 + dt; return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };

  // ---------------------------------------------------------------- (a) the game
  (function game() {
    const slide = document.getElementById('clock-game'); if (!slide) return;
    const q = (c) => slide.querySelector(c);
    const c1 = clock(q('.ck-c1')), c2 = clock(q('.ck-c2'));
    const ROUNDS = [{ r: 1.4, dt: 10 }, { r: 0.7, dt: 20 }, { r: 1.5, dt: 30 }, { r: 0.6, dt: 50 }, { r: 1.4, dt: 75 }];
    const LIMIT = 10;   // seconds to answer
    const btns = [...slide.querySelectorAll('[data-ck]')];
    const st = { k: -1, t0: 0, raf: 0, answered: true, total: 0 };
    c1.hand(0); c1.ghost(null); c2.hand(0); c2.ghost(null);

    function show(k) {
      const { r, dt } = ROUNDS[k], seen = mod(r * dt, 60);
      q('.ck-t2').textContent = watch(dt);
      c1.hand(0); c2.hand(seen); c2.ghost(mod(dt, 60));
      q('.ck-status').textContent = `Round ${k + 1} of ${ROUNDS.length} · ${dt} min between glances`;
      q('.ck-fb').innerHTML = '';
      btns.forEach((b) => { b.disabled = false; b.classList.remove('good', 'bad'); });
      st.answered = false; st.t0 = performance.now();
      const bar = q('.ck-timer div');
      const tick = (now) => {
        const s = (now - st.t0) / 1000; bar.style.width = `${Math.min(100, (s / LIMIT) * 100)}%`;
        if (st.answered) return;
        if (s >= LIMIT) { answer(null); return; }
        st.raf = requestAnimationFrame(tick);
      };
      st.raf = requestAnimationFrame(tick);
      q('.ck-start').hidden = true;
    }

    function answer(pick) {
      if (st.answered) return;
      st.answered = true; cancelAnimationFrame(st.raf);
      const { r, dt } = ROUNDS[st.k], seen = mod(r * dt, 60), cand = fits(seen, dt), truth = verdict(cand);
      const ok = pick === truth, secs = (performance.now() - st.t0) / 1000;
      const pts = ok ? Math.max(300, Math.round(1000 - 70 * secs)) : 0;
      st.total += pts;
      btns.forEach((b) => { b.disabled = true; if (b.dataset.ck === truth) b.classList.add('good'); else if (b.dataset.ck === pick) b.classList.add('bad'); });
      const moved = r * dt, turns = Math.floor(moved / 60);
      const nTurns = (x) => { const n = Math.floor((x * dt) / 60); return n === 0 ? 'no full turn' : n === 1 ? 'one full turn' : `${n} full turns`; };
      const why = truth === 'cant'
        ? `Both ${cand.map((x) => `${x.toFixed(1)}×`).join(' and ')} put the hand there: one with ${nTurns(cand[0])}, the other with ${nTurns(cand[cand.length - 1])}. It was really ${r}×.`
        : `The hand really moved ${Math.round(moved)} min${turns ? ` (${turns} full turn${turns > 1 ? 's' : ''} + ${Math.round(moved - 60 * turns)})` : ''} in ${dt}: ${r}× real speed. Within 0.5–1.5×, nothing else fits.`;
      q('.ck-fb').innerHTML = `${pick === null ? '<span class="warn">Time’s up.</span> ' : ok ? '<span class="ok">✓ Right.</span> ' : `<span class="warn">✗ It’s “${WORDS[truth]}”.</span> `}${why}`;
      c2.sweep(moved, 1800);
      const row = document.createElement('tr');
      row.innerHTML = `<td>Round ${st.k + 1}</td><td>${dt} min</td><td>${pick ? WORDS[pick] : '—'}</td><td>${ok ? '✓' : '✗'}</td><td><b>${pts}</b> pts</td>`;
      q('.ck-results tbody').appendChild(row);
      const last = st.k === ROUNDS.length - 1;
      const b = q('.ck-start'); b.hidden = false; b.textContent = last ? 'Play again' : 'Next round';
      q('.ck-status').textContent = last ? `Total: ${st.total} points` : `Round ${st.k + 1} of ${ROUNDS.length}: ${st.total} points so far`;
    }

    btns.forEach((b) => b.addEventListener('click', () => { b.blur(); answer(b.dataset.ck); }));
    q('.ck-start').addEventListener('click', (e) => {
      e.currentTarget.blur();
      if (st.k === ROUNDS.length - 1) { st.k = -1; st.total = 0; q('.ck-results tbody').innerHTML = ''; }
      st.k++; show(st.k);
    });
  })();

  // ---------------------------------------------------------------- (b) every rate that fits two glances
  (function aliasPlot() {
    const slide = document.getElementById('clock-alias'); if (!slide) return;
    const q = (c) => slide.querySelector(c);
    const host = q('.al-plot'), dt = q('.al-dt'), rr = q('.al-r');
    [dt, rr].forEach(keepSlider);
    let drawn = false;
    function draw() {
      const d = Number(dt.value), r = Number(rr.value), seen = mod(r * d, 60);
      q('.al-dt-read').textContent = `${d} min`; q('.al-r-read').textContent = `${r.toFixed(2)}×`;
      const all = fits(seen, d, 0, 3), inPrior = fits(seen, d);
      const shapes = [{ type: 'rect', xref: 'x', yref: 'paper', x0: PRIOR[0], x1: PRIOR[1], y0: 0, y1: 1, fillcolor: '#fff4d6', line: { width: 0 }, layer: 'below' },
        { type: 'line', xref: 'x', yref: 'paper', x0: 1, x1: 1, y0: 0, y1: 1, line: { color: '#8a95a3', dash: 'dash', width: 1.5 } }];
      all.forEach((x) => {
        const inside = x >= PRIOR[0] - 1e-9 && x <= PRIOR[1] + 1e-9, isTrue = Math.abs(x - r) < 1e-6;
        shapes.push({ type: 'line', xref: 'x', yref: 'paper', x0: x, x1: x, y0: 0.05, y1: 0.85, line: { color: isTrue ? '#1f5f99' : inside ? '#2e8b3a' : '#b8c0ca', width: isTrue ? 5 : 3 } });
      });
      const ann = [{ x: 1, y: 0.95, xref: 'x', yref: 'paper', text: 'real speed', showarrow: false, font: { size: 13, color: '#5b6776' } },
        { x: 1, y: 1.06, xref: 'x', yref: 'paper', text: 'the hint: 0.5–1.5×', showarrow: false, font: { size: 13, color: '#b07800' } },
        ...all.filter((x) => Math.abs(x - r) < 1e-6).map((x) => ({ x, y: 0.05, xref: 'x', yref: 'paper', text: 'true', showarrow: false, yanchor: 'top', font: { size: 13, color: '#1f5f99' } }))];
      const layout = { margin: { l: 20, r: 20, t: 40, b: 50 }, xaxis: { range: [0, 3], title: { text: 'clock rate (× real speed)' }, dtick: 0.5, fixedrange: true },
        yaxis: { visible: false, fixedrange: true, range: [0, 1] }, shapes, annotations: ann, showlegend: false, plot_bgcolor: '#fff', paper_bgcolor: '#fff' };
      (drawn ? Plotly.react : Plotly.newPlot)(host, [{ x: [0], y: [0], mode: 'markers', marker: { opacity: 0 }, hoverinfo: 'skip' }], layout, { displayModeBar: false });
      drawn = true;
      q('.al-fits').textContent = inPrior.map((x) => `${x.toFixed(2)}×`).join(', ');
      const v = verdict(inPrior), cell = q('.al-tell');
      cell.textContent = v === 'cant' ? 'No: both fast and slow fit' : `Yes: ${v}`;
      cell.classList.toggle('warn', v === 'cant'); cell.classList.toggle('ok', v !== 'cant');
    }
    [dt, rr].forEach((el) => el.addEventListener('input', draw));
    onShow(slide, draw);
  })();

  // ---------------------------------------------------------------- (c) the phase of a spin as a clock hand
  (function spinDial() {
    const slide = document.getElementById('spin-dial'); if (!slide) return;
    const q = (c) => slide.querySelector(c);
    const svg = q('.sd-dial'), f = q('.sd-f'), te = q('.sd-te');
    [f, te].forEach(keepSlider);
    const R = 150;
    svgEl('circle', { r: R, fill: 'none', stroke: '#d8dee6', 'stroke-width': 2 }, svg);
    [[0, '0°'], [90, '+90°'], [180, '±180°'], [-90, '−90°']].forEach(([a, l]) => {
      const t = (a * Math.PI) / 180, x = (R + 26) * Math.cos(t), y = -(R + 26) * Math.sin(t) + 5;
      svgEl('text', { x, y, 'text-anchor': 'middle', 'font-size': 14, fill: '#5b6776' }, svg).textContent = l;
    });
    svgEl('line', { x1: 0, y1: 0, x2: R, y2: 0, stroke: '#5b6776', 'stroke-width': 2, 'stroke-dasharray': '4 4' }, svg);
    const spiral = svgEl('path', { fill: 'none', stroke: '#9aa5b1', 'stroke-width': 3 }, svg);
    const tip = svgEl('circle', { r: 6, fill: '#9aa5b1' }, svg);
    const hand = svgEl('line', { x1: 0, y1: 0, stroke: '#1f5f99', 'stroke-width': 6, 'stroke-linecap': 'round' }, svg);
    svgEl('circle', { r: 7, fill: '#1f5f99' }, svg);
    const label = svgEl('text', { x: 0, y: 34, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#c0392b' }, svg);
    function draw() {
      const df = Number(f.value), dte = Number(te.value);
      q('.sd-f-read').textContent = `${df > 0 ? '+' : ''}${df} Hz`; q('.sd-te-read').textContent = `${dte} ms`;
      const gain = 360 * df * dte * 1e-3, meas = mod(gain + 180, 360) - 180, fm = meas / (360 * dte * 1e-3), lim = 1 / (2 * dte * 1e-3);
      const pts = [], n = Math.max(2, Math.ceil(Math.abs(gain) / 4));
      for (let i = 0; i <= n; i++) {
        const a = (gain * i) / n, r = 40 + (95 * Math.abs(a)) / Math.max(360, Math.abs(gain)), t = (a * Math.PI) / 180;
        pts.push(`${i ? 'L' : 'M'}${(r * Math.cos(t)).toFixed(1)},${(-r * Math.sin(t)).toFixed(1)}`);
      }
      spiral.setAttribute('d', pts.join(''));
      const tEnd = (gain * Math.PI) / 180, rEnd = 40 + 95 * (Math.abs(gain) / Math.max(360, Math.abs(gain)));
      tip.setAttribute('cx', rEnd * Math.cos(tEnd)); tip.setAttribute('cy', -rEnd * Math.sin(tEnd));
      const tm = (meas * Math.PI) / 180;
      hand.setAttribute('x2', (R - 4) * Math.cos(tm)); hand.setAttribute('y2', -(R - 4) * Math.sin(tm));
      const turns = Math.abs(gain) / 360, aliased = Math.abs(df) > lim + 1e-9;
      label.textContent = aliased ? 'aliased' : '';
      q('.sd-gain').textContent = `${gain.toFixed(0)}° (${turns.toFixed(2)} turn${turns >= 0.995 && turns < 1.005 ? '' : 's'})`;
      q('.sd-meas').textContent = `${meas.toFixed(0)}°`;
      const fmc = q('.sd-fmeas'); fmc.textContent = `${fm > 0 ? '+' : ''}${fm.toFixed(0)} Hz`; fmc.classList.toggle('warn', aliased);
      q('.sd-lim').textContent = `±${lim.toFixed(0)} Hz`;
    }
    [f, te].forEach((el) => el.addEventListener('input', draw));
    draw();
  })();
})();
