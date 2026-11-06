/* Interactive figures of the B0 deck that are not stored notebook outputs (load after js/deck.js):
 *   kspace    Figure 5.5, EPI k-space trajectory with a parasitic phase-encoding gradient (Figure-5-1-5.ipynb)
 *   unwrap    Figure 5.12, wrapped vs unwrapped phase as a before/after slider (Figure-5-3-3.ipynb)
 *   dte       Table 5.1 as a calculator: the largest ΔTE whose phase difference cannot wrap
 * The maths is the notebooks', in JavaScript; the book runs the same Python with Pyodide
 * (5 B0 Mapping/widgets/b0-figures.mjs). Each widget is drawn while its slide is current or adjacent. */
(function () {
  'use strict';
  const Plotly = window.Plotly;
  const PI = '𝜋';
  const LOOK = {
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#E5ECF6',
    font: { color: '#2a3f5f', family: '"Open Sans", verdana, arial, sans-serif', size: 12 },
  };
  const AXIS = { gridcolor: 'white', zeroline: false, fixedrange: true };
  const CONFIG = { displayModeBar: false, responsive: false };

  // A box of the given pixel size, scaled as a whole to fit the host (like the book figures).
  function scaledBox(host, w, h) {
    host.replaceChildren();
    const k = window.B0Deck.fitScale(w, h, host.clientWidth, host.clientHeight);
    const frame = document.createElement('div');
    frame.className = 'fig-frame';
    frame.style.width = `${w * k}px`;
    frame.style.height = `${h * k}px`;
    const box = document.createElement('div');
    box.className = 'fig-plot';
    box.style.width = `${w}px`;
    box.style.height = `${h}px`;
    box.style.transform = `scale(${k})`;
    frame.appendChild(box);
    host.appendChild(frame);
    return box;
  }

  // ------------------------------------------------------------ Figure 5.5

  function kspaceData() {
    const GYRO = 42.6e6; // Hz/T
    const gyBad = 100e-6;
    const endTime = 0.0912;
    const n = 913;
    const dt = endTime / n;
    const nx = 64;
    const kx = [0], ky = [0], dx = [0], dy = [0], tms = [0];
    for (let it = 1; it < n; it++) {
      let gx = 0, gy = 0;
      if (it <= 20) { gx = -40e-3; gy = -40e-3; }
      else {
        const i = (it - 20) % 138;
        if (i <= 0) { gx = 0; gy = 25e-3; }
        else if (i <= nx) { gx = 25e-3; gy = 0; }
        else if (i <= nx + 5) { gx = 0; gy = 25e-3; }
        else if (i <= 2 * nx + 5) { gx = -25e-3; gy = 0; }
        else { gx = 0; gy = 25e-3; }
      }
      kx.push(kx[it - 1] + GYRO * gx * dt);
      ky.push(ky[it - 1] + GYRO * gy * dt);
      dx.push(dx[it - 1] + GYRO * gx * dt);
      dy.push(dy[it - 1] + GYRO * (gy + gyBad) * dt);
      tms.push((it * endTime) / (n - 1) * 1e3);
    }
    return { kx, ky, dx, dy, tms, n };
  }

  function mountKspace(host, controls) {
    const d = kspaceData();
    const plot = scaledBox(host, 700, 600);
    const line = (x, y, color, name) => ({ type: 'scatter', mode: 'lines', x, y, name, line: { color }, hoverinfo: 'skip' });
    Plotly.newPlot(plot, [line(d.kx, d.ky, '#636EFA', 'Theoretical trajectory'), line(d.dx, d.dy, '#fa6363', 'Inhomogeneous trajectory')], {
      ...LOOK,
      width: 700, height: 600,
      title: { text: 'K-space Trajectory', x: 0.5 },
      margin: { l: 30, r: 30, t: 60, b: 30 },
      legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.02, yanchor: 'top' },
      xaxis: { ...AXIS, range: [-3500, 3500], showticklabels: false },
      yaxis: { ...AXIS, range: [-3700, 3700], showticklabels: false },
    }, CONFIG);

    controls.innerHTML = `
      <button type="button" class="w-play">Play</button>
      <input class="w-range" type="range" min="1" max="${d.n}" value="1" aria-label="Time along the readout">
      <span class="w-time"></span>`;
    const play = controls.querySelector('.w-play');
    const range = controls.querySelector('.w-range');
    const time = controls.querySelector('.w-time');
    let shown = d.n;   // drawn in full, then cut back to t = 0 by show(1)
    const show = (count) => {
      count = Math.max(1, Math.min(d.n, Math.round(count)));
      range.value = String(count);
      time.textContent = `t = ${d.tms[count - 1].toFixed(1)} ms`;
      if (count === shown) return;
      shown = count;
      Plotly.restyle(plot, { x: [d.kx.slice(0, count), d.dx.slice(0, count)], y: [d.ky.slice(0, count), d.dy.slice(0, count)] });
    };
    show(1);
    let raf = 0, last = 0, progress = 0;
    const stop = () => { cancelAnimationFrame(raf); raf = 0; play.textContent = 'Play'; };
    const tick = (now) => {
      progress += ((now - last) / 8000) * d.n;
      last = now;
      show(progress);
      if (shown >= d.n) stop(); else raf = requestAnimationFrame(tick);
    };
    play.onclick = () => {
      if (raf) return stop();
      progress = shown >= d.n ? 1 : shown;
      show(progress);
      last = performance.now();
      play.textContent = 'Pause';
      raf = requestAnimationFrame(tick);
    };
    range.oninput = () => { stop(); show(Number(range.value)); };
    return () => { stop(); Plotly.purge(plot); controls.replaceChildren(); };
  }

  // ------------------------------------------------------------ Figure 5.12

  function mountUnwrap(host, controls) {
    const W = 800, H = 460;
    const n = 1001;
    const t = Array.from({ length: n }, (_, i) => (3 * i) / (n - 1));
    const yu = t.map((v) => v + v ** 2 - 3 * v ** 3 + v ** 4);
    const yw = yu.map((v) => ((v % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
    const lo = Math.min(...yu), hi = Math.max(...yu), span = hi - lo;
    const yaxis = {
      ...AXIS,
      range: [lo - 2 * Math.PI - span * 0.05, hi + 2 * Math.PI + span * 0.05],
      title: { text: 'rad' },
      tickmode: 'array',
      tickvals: [-2, -1, 0, 1, 2, 3, 4, 5].map((m) => m * Math.PI),
      ticktext: [`-2${PI}`, `-${PI}`, '0', PI, `2${PI}`, `3${PI}`, `4${PI}`, `5${PI}`],
    };
    const base = { ...LOOK, width: W, height: H, margin: { l: 70, r: 30, t: 50, b: 45 }, hovermode: 'x unified', xaxis: AXIS, yaxis, showlegend: true, colorway: ['#636efa', '#EF553B', '#00cc96'] };
    const line = (y, name) => ({ type: 'scatter', mode: 'lines', x: t, y, name });

    const box = scaledBox(host, W, H);
    box.classList.add('w-split');
    box.innerHTML = '<div class="w-layer w-after"></div><div class="w-layer w-before"></div><div class="w-handle"><span class="w-knob" aria-hidden="true">↔</span></div>';
    const after = box.querySelector('.w-after');
    const before = box.querySelector('.w-before');
    const handle = box.querySelector('.w-handle');
    Plotly.newPlot(after, [line(yu, 'Solution 1'), line(yu.map((v) => v + 2 * Math.PI), 'Solution 2'), line(yu.map((v) => v - 2 * Math.PI), 'Solution 3')],
      { ...base, title: { text: 'Unwrapped', x: 0.75 }, legend: { x: 0.85, y: 0.95 } }, CONFIG);
    Plotly.newPlot(before, [line(yw, 'Wrapped')], { ...base, title: { text: 'Wrapped', x: 0.25 }, legend: { x: 0.03, y: 0.95 } }, CONFIG);

    controls.innerHTML = '<span>Wrapped</span><input class="w-range" type="range" min="0" max="100" value="50" aria-label="Divider position"><span>Unwrapped</span>';
    const range = controls.querySelector('.w-range');
    const split = (pct) => {
      pct = Math.min(100, Math.max(0, pct));
      before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      handle.style.left = `${pct}%`;
      range.value = String(Math.round(pct));
    };
    split(50);
    range.oninput = () => split(Number(range.value));
    handle.addEventListener('pointerdown', (e) => { handle.setPointerCapture(e.pointerId); e.preventDefault(); e.stopPropagation(); });
    handle.addEventListener('pointermove', (e) => {
      if (!handle.hasPointerCapture(e.pointerId)) return;
      const r = box.getBoundingClientRect();
      split(((e.clientX - r.left) / r.width) * 100);
    });
    handle.addEventListener('pointerup', (e) => handle.releasePointerCapture(e.pointerId));
    return () => { Plotly.purge(after); Plotly.purge(before); controls.replaceChildren(); };
  }

  // ------------------------------------------------------------ Table 5.1 as a calculator

  // |Δφ| = 2π·Δf·ΔTE must stay below π for ±Δf, so ΔTE < 1 / (2·Δf); Δf = γ̄·B0·ppm (Table 5.1 uses 1 ppm).
  function mountDte(root) {
    const GAMMA_BAR = 42.58e6; // Hz/T
    const fields = root.querySelectorAll('[data-b0]');
    const ppm = root.querySelector('.dte-ppm');
    const ppmOut = root.querySelector('.dte-ppm-out');
    const dfOut = root.querySelector('.dte-df');
    const dteOut = root.querySelector('.dte-out');
    let b0 = 3;
    const update = () => {
      const df = GAMMA_BAR * b0 * Number(ppm.value) * 1e-6;
      ppmOut.textContent = Number(ppm.value).toFixed(1);
      dfOut.textContent = df >= 100 ? df.toFixed(0) : df.toFixed(1);
      const ms = 1e3 / (2 * df);
      dteOut.textContent = ms >= 100 ? ms.toFixed(0) : ms >= 10 ? ms.toFixed(1) : ms.toFixed(2);
    };
    fields.forEach((b) => b.addEventListener('click', () => {
      b0 = Number(b.dataset.b0);
      fields.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      update();
    }));
    ppm.addEventListener('input', update);
    update();
  }

  // ------------------------------------------------------------ wiring

  const MOUNT = { kspace: mountKspace, unwrap: mountUnwrap };
  document.querySelectorAll('.w-host[data-widget]').forEach((host) => {
    const section = host.closest('section');
    const controls = section.querySelector(`.w-controls[data-for="${host.dataset.widget}"]`);
    let cleanup = null;
    section.addEventListener('deck:near', () => {
      if (cleanup) return;
      try { cleanup = MOUNT[host.dataset.widget](host, controls); }
      catch (err) { console.error(`[b0-deck] ${host.dataset.widget}:`, err); }
    });
    section.addEventListener('deck:far', () => { if (cleanup) { cleanup(); cleanup = null; host.replaceChildren(); } });
  });
  document.querySelectorAll('.dte-calc').forEach(mountDte);
})();
