/* Exercise 6: a collaborator's IR data with the images in reverse TI order. Data from the ISMRM 2020 T1
 * mapping challenge, resampled to 10 TIs (js/data/ex6.js); every fit and simulation runs live in qmrust.
 * Each action draws its slide up to ctx.step: data first, then the result, then the explanation. */
(function () {
  'use strict';
  const { action, bookLayout, axisTitles, COLORS, fmt, withQmRust } = window.T1Exercise;
  const Q = window.QmRust;
  const D = window.T1ExerciseData.ex6;
  const TI = D.tisHeader; // what the header says: 10 TIs from 50 to 2500 ms, increasing
  const N = TI.length;
  const SPHERE = 3; // NIST sphere 3: reference T1 987 ms
  const CAUTION = '#b45309';
  const GRAY = [[0, 'rgb(0,0,0)'], [1, 'rgb(255,255,255)']];

  // ---------------------------------------------------------------- data

  const bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  function unpack(o) {
    const raw = new Int16Array(bytes(o.data).buffer);
    const n = o.nx * o.ny;
    // The fix: the same voxels with each voxel's samples in reverse order.
    const reordered = new Float64Array(raw.length);
    for (let v = 0; v < n; v++) for (let k = 0; k < N; k++) reordered[v * N + k] = raw[v * N + N - 1 - k];
    return { ...o, n, delivered: Float64Array.from(raw), reordered, mask: bytes(o.mask), labels: bytes(o.rois || o.spheres) };
  }
  const human = unpack(D.human);
  const nist = unpack(D.nist);

  // Image k of a slice, as rows (row 0 at the top).
  function image(s, k, data = s.delivered) {
    return Array.from({ length: s.ny }, (_, y) => Array.from({ length: s.nx }, (_, x) => data[(y * s.nx + x) * N + k]));
  }
  const toRows = (s, flat) => Array.from({ length: s.ny }, (_, y) => Array.from(flat.slice(y * s.nx, (y + 1) * s.nx), (v) => (Number.isFinite(v) ? v : null)));

  // Mean signal of a labelled region, per image.
  function regionMean(s, label, data = s.delivered) {
    const sum = new Array(N).fill(0);
    let count = 0;
    for (let v = 0; v < s.n; v++) {
      if (s.labels[v] !== label) continue;
      count++;
      for (let k = 0; k < N; k++) sum[k] += data[v * N + k];
    }
    return sum.map((x) => x / count);
  }
  const mean2 = (a, b) => a.map((x, i) => (x + b[i]) / 2);
  const wmMean = (data) => mean2(regionMean(human, 1, data), regionMean(human, 2, data));
  const gmMean = (data) => mean2(regionMean(human, 3, data), regionMean(human, 4, data));

  function median(values) {
    const v = values.filter(Number.isFinite).sort((a, b) => a - b);
    return v.length ? v[Math.floor(v.length / 2)] : NaN;
  }
  function centroid(s, label) {
    let x = 0, y = 0, c = 0;
    for (let v = 0; v < s.n; v++) if (s.labels[v] === label) { x += v % s.nx; y += Math.floor(v / s.nx); c++; }
    return [x / c, y / c];
  }

  // T1 maps are fitted once per slice and order, then reused (a brain slice takes a second or two).
  const maps = {};
  function t1Map(s, order) {
    const key = `${s === human ? 'human' : 'nist'}-${order}`;
    if (!maps[key]) maps[key] = Q.fitVolume({ tis: TI, data: s[order], nx: s.nx, ny: s.ny, mask: s.mask });
    return maps[key];
  }
  // Lets the "Fitting…" line paint before a long synchronous fit.
  const paint = () => new Promise((resolve) => setTimeout(resolve, 30));

  // ---------------------------------------------------------------- figures

  const blank = { showgrid: false, zeroline: false, showticklabels: false, ticks: '', showline: false };
  function imageLayout(s, overrides = {}) {
    return Object.assign({
      width: 560, height: 520, margin: { l: 10, r: 10, t: 30, b: 10 }, plot_bgcolor: 'white', paper_bgcolor: 'white',
      xaxis: { ...blank, domain: [0, 0.86], constrain: 'domain' },
      yaxis: { ...blank, autorange: 'reversed', scaleanchor: 'x' },
      showlegend: false,
      font: { family: 'Times New Roman', size: 14 },
    }, overrides);
  }
  function t1Heatmap(s, t1, zmax) {
    return {
      type: 'heatmap', z: toRows(s, t1), colorscale: 'Portland', zmin: 0, zmax, hoverongaps: false,
      colorbar: { title: { text: 'T<sub>1</sub> (ms)', side: 'top', font: { family: 'Times New Roman', size: 15 } }, thickness: 12, len: 0.9, x: 0.88 },
      hovertemplate: 'T<sub>1</sub> = %{z:.0f} ms<extra></extra>',
    };
  }
  // The four ROIs as labelled markers on a brain image.
  function roiMarkers() {
    const pts = [1, 2, 3, 4].map((r) => centroid(human, r));
    return {
      x: pts.map((p) => p[0]), y: pts.map((p) => p[1]), mode: 'markers+text', type: 'scatter',
      text: ['genu', 'splenium', 'deep GM', 'cortical GM'], textposition: 'top center',
      textfont: { color: 'white', family: 'Times New Roman', size: 14 },
      marker: { size: 11, color: 'rgba(0,0,0,0)', line: { color: 'white', width: 2 } }, hoverinfo: 'text',
    };
  }
  function roiTable(t1, label) {
    const rows = human.roiNames.map((name, i) => {
      const m = median(Array.from(t1).filter((_, v) => human.labels[v] === i + 1));
      return `<tr><td>${name}</td><td><b>${fmt(m)}</b></td></tr>`;
    });
    return `<table class="measure"><tr><th>ROI (${label})</th><th>Median <i>T</i><sub>1</sub> (ms)</th></tr>${rows.join('')}</table>`;
  }
  function signalLayout(overrides = {}) {
    return bookLayout('irPlot1', Object.assign({
      width: 580, height: 430,
      margin: { l: 90, r: 30, t: 10, b: 70 },
      annotations: axisTitles('Inversion Time – TI (ms), as in the header', 'Signal (normalized)', { xy: -0.16, yx: -0.15 }),
      xaxis: { range: [0, 2700], autorange: false, dtick: 500 },
      // Headroom above the data so the legend sits clear of it.
      yaxis: { range: [0, 1.5], autorange: false, tickvals: [0, 0.2, 0.4, 0.6, 0.8, 1] },
      legend: { x: 0.25, y: 0.99, font: { family: 'Times New Roman', size: 13 } },
      showlegend: true,
    }, overrides));
  }
  const normalize = (a) => { const m = Math.max(...a); return a.map((x) => x / m); };
  const points = (y, name, color, symbol = 'circle') => ({
    x: TI, y, mode: 'markers+lines', name, marker: { size: 11, color, symbol }, line: { color, width: 1, dash: 'dot' },
  });
  // Expected magnitude signal for the sphere's reference T1 (Eq. 2.2, TR of the protocol), by qmrust.
  const sphereT1 = () => nist.reference[SPHERE - 1];
  function simulated() {
    const c = Q.curve({ t1: sphereT1(), tr: D.tr, tiMax: 2700, n: 271, model: 'general', magnitude: true });
    const at = Q.signal({ t1: sphereT1(), tr: D.tr, tis: TI, model: 'general', magnitude: true });
    const scale = Math.max(...at);
    return { curve: { x: c.ti, y: c.s.map((v) => v / scale) }, at: at.map((v) => v / scale) };
  }
  const simTraces = (sim) => [
    { x: sim.curve.x, y: sim.curve.y, mode: 'lines', name: `Simulated, T<sub>1</sub> = ${fmt(sphereT1())} ms`, line: { color: 'black', width: 2 } },
    { x: TI, y: sim.at, mode: 'markers', showlegend: false, marker: { size: 11, color: 'white', line: { color: 'black', width: 2 } } },
  ];

  // ---------------------------------------------------------------- slides

  // a. Step 0: the images with their header TIs. Step 1: the T1 map and ROI medians. Step 2: answer (markup).
  action('ex6-map', {
    run(ctx) {
      return withQmRust(ctx, async () => {
        if (ctx.step < 1) {
          // A grid of COLS columns (top row first), with room for a title above each image.
          const COLS = 4;
          const rows = Math.ceil(N / COLS);
          const ks = [...TI.keys()];
          const xd = ks.map((k) => [(k % COLS) / COLS + 0.01, ((k % COLS) + 1) / COLS - 0.01]);
          const yd = ks.map((k) => { const r = Math.floor(k / COLS); return [1 - (r + 1) / rows + 0.01, 1 - r / rows - 0.06]; });
          const data = ks.map((k) => ({
            type: 'heatmap', z: image(human, k), colorscale: GRAY, showscale: false, hoverinfo: 'skip',
            xaxis: k ? `x${k + 1}` : 'x', yaxis: k ? `y${k + 1}` : 'y',
          }));
          const layout = imageLayout(human, { margin: { l: 5, r: 5, t: 5, b: 5 } });
          ks.forEach((k) => {
            const n = k ? k + 1 : '';
            layout[`xaxis${n}`] = { ...blank, domain: xd[k], anchor: `y${n}`, constrain: 'domain' };
            layout[`yaxis${n}`] = { ...blank, domain: yd[k], anchor: `x${n}`, autorange: 'reversed', scaleanchor: `x${n}`, constrain: 'domain' };
          });
          layout.annotations = ks.map((k) => ({
            text: `TI = ${TI[k]} ms`, showarrow: false, xref: 'paper', yref: 'paper', yanchor: 'bottom',
            x: (xd[k][0] + xd[k][1]) / 2, y: yd[k][1] + 0.003, font: { family: 'Times New Roman', size: 14 },
          }));
          ctx.plot({ data, layout });
          ctx.say(`The ${N} images they sent, with the TI their header gives for each.`);
          return;
        }
        if (!maps['human-delivered']) { ctx.say(`Fitting ${human.mask.reduce((a, b) => a + b, 0).toLocaleString('en-US')} voxels with qmrust…`); await paint(); }
        const t1 = t1Map(human, 'delivered');
        ctx.plot({ data: [t1Heatmap(human, t1, 5000), roiMarkers()], layout: imageLayout(human) });
        ctx.say(roiTable(t1, 'as delivered'));
      });
    },
  });

  // a. Step 0: ROI mean signals against the header TIs. Step 1: fitted curves. Step 2: answer (markup).
  action('ex6-curves', {
    run(ctx) {
      return withQmRust(ctx, () => {
        const wm = wmMean(human.delivered);
        const gm = gmMean(human.delivered);
        const data = [points(wm, 'WM (genu + splenium)', COLORS[0]), points(gm, 'GM (deep + cortical)', COLORS[1])];
        const lines = [];
        if (ctx.step >= 1) {
          [[wm, 'WM', COLORS[0]], [gm, 'GM', COLORS[1]]].forEach(([s, name, color]) => {
            const f = Q.fit({ tis: TI, signal: s, model: 'general' });
            const x = Array.from({ length: 271 }, (_, i) => i * 10);
            data.push({ x, y: x.map((ti) => Math.abs(f.a + f.b * Math.exp(-ti / f.t1))), mode: 'lines', name: `${name} fit: T<sub>1</sub> = ${fmt(f.t1)} ms`, line: { color, width: 2.5 } });
            lines.push(`${name}: <b>${fmt(f.t1)} ms</b>`);
          });
        }
        ctx.plot({
          data,
          layout: signalLayout({
            annotations: axisTitles('Inversion Time – TI (ms), as in the header', 'Signal (a.u.)', { xy: -0.16, yx: -0.15 }),
            yaxis: { autorange: true, rangemode: 'tozero' },
            legend: { x: 0.45, y: 0.95, font: { family: 'Times New Roman', size: 13 } },
          }),
        });
        ctx.say(lines.length ? `Fitted (general equation): ${lines.join(', ')}.` : 'Mean signal in the WM and GM ROIs.');
      });
    },
  });

  // b. Step 0: the phantom image with sphere 3 circled. Step 1: its signal. Step 2: the simulated curve.
  action('ex6-phantom', {
    run(ctx) {
      return withQmRust(ctx, () => {
        if (ctx.step < 1) {
          const [cx, cy] = centroid(nist, SPHERE);
          ctx.plot({
            data: [
              { type: 'heatmap', z: image(nist, N - 1), colorscale: GRAY, showscale: false, hoverinfo: 'skip' },
              { x: [cx], y: [cy], mode: 'markers+text', text: [`sphere ${SPHERE}`], textposition: 'top center',
                textfont: { color: '#f2b705', size: 16, family: 'Times New Roman' },
                marker: { size: 34, color: 'rgba(0,0,0,0)', line: { color: '#f2b705', width: 3 } } },
            ],
            layout: imageLayout(nist, { xaxis: { ...blank, constrain: 'domain' } }),
          });
          ctx.say(`NIST phantom, same scanner and protocol. Sphere ${SPHERE}: reference <i>T</i><sub>1</sub> = <b>${fmt(sphereT1())} ms</b>.`);
          return;
        }
        const data = [points(normalize(regionMean(nist, SPHERE)), `Phantom sphere ${SPHERE}, measured`, COLORS[2], 'square')];
        if (ctx.step >= 2) data.push(...simTraces(simulated()));
        ctx.plot({ data, layout: signalLayout() });
        ctx.say(ctx.step >= 2
          ? `Expected signal for <i>T</i><sub>1</sub> = ${fmt(sphereT1())} ms, TR = ${fmt(D.tr)} ms (Eq. 2.2, magnitude). Both normalized to their maximum.`
          : `Mean signal in sphere ${SPHERE}, against the header TIs.`);
      });
    },
  });

  // c. Step 0: human WM, phantom and simulation together. Step 1: what to notice. Step 2: hypothesis (markup).
  action('ex6-compare', {
    run(ctx) {
      return withQmRust(ctx, () => {
        const sim = simulated();
        const wm = normalize(wmMean(human.delivered));
        const sphere = normalize(regionMean(nist, SPHERE));
        // Where each dips: the simulation's null, and the lowest measured sample.
        const dip = (y) => TI[y.indexOf(Math.min(...y))];
        const [dipSim, dipWM, dipSphere] = [sim.at, wm, sphere].map(dip);
        const shapes = ctx.step >= 1
          ? [dipSim, dipSphere, dipWM].map((x, i) => ({ type: 'line', xref: 'x', yref: 'paper', x0: x, x1: x, y0: 0, y1: 1, line: { color: i ? CAUTION : 'black', dash: 'dash', width: 1.5 } }))
          : [];
        ctx.plot({
          data: [
            points(wm, 'Human WM, measured', COLORS[0]),
            points(sphere, `Phantom sphere ${SPHERE}, measured`, COLORS[2], 'square'),
            ...simTraces(sim),
          ],
          layout: signalLayout({ shapes }),
        });
        ctx.say(ctx.step >= 1
          ? `The simulation dips (its null) early, at <b>${fmt(dipSim)} ms</b>, then recovers. Both data sets <i>fall</i> from the shortest TI and dip late (phantom <b>${fmt(dipSphere)} ms</b>, WM <b>${fmt(dipWM)} ms</b>), then rise: the simulation's shape, read from right to left.`
          : 'Human WM, the phantom sphere and the simulation, each normalized to its maximum.');
      });
    },
  });

  // d. Step 0: phantom data and simulation. Step 1: the simulation in reverse TI order. Step 2: refit the spheres.
  action('ex6-test', {
    run(ctx) {
      return withQmRust(ctx, () => {
        const sim = simulated();
        const data = [points(normalize(regionMean(nist, SPHERE)), `Phantom sphere ${SPHERE}, measured`, COLORS[2], 'square'), ...simTraces(sim)];
        if (ctx.step >= 1) {
          data.push({ x: TI, y: [...sim.at].reverse(), mode: 'markers+lines', name: 'Simulated, TIs reversed',
            marker: { size: 16, color: CAUTION, symbol: 'x-thin', line: { color: CAUTION, width: 3 } }, line: { color: CAUTION, width: 1.5, dash: 'dash' } });
        }
        ctx.plot({ data, layout: signalLayout() });
        if (ctx.step < 2) {
          ctx.say(ctx.step >= 1
            ? 'Taken in reverse TI order, the simulated values follow the measured pattern. The remaining gaps come from the scanner’s imperfect inversion, which the fit’s free <i>a</i> and <i>b</i> absorb.'
            : 'The phantom sphere and its expected signal, as in part b.');
          return;
        }
        const rows = [1, 2, 3, 4, 5].map((sphere) => {
          const asSent = Q.fit({ tis: TI, signal: regionMean(nist, sphere), model: 'general' }).t1;
          const reversed = Q.fit({ tis: TI, signal: regionMean(nist, sphere, nist.reordered), model: 'general' }).t1;
          return `<tr${sphere === SPHERE ? ' style="font-weight:700"' : ''}><td>${sphere}</td><td>${fmt(nist.reference[sphere - 1])}</td><td>${fmt(asSent)}</td><td><b>${fmt(reversed)}</b></td></tr>`;
        });
        ctx.say(`<table class="measure"><tr><th>Sphere</th><th>Reference</th><th>Fit, as sent</th><th>Fit, reversed</th></tr>${rows.join('')}</table>`);
      });
    },
  });

  // e. Step 0: the collaborator's T1 map. Step 1: reordered and refitted. Step 2: proposal (markup).
  action('ex6-fix', {
    run(ctx) {
      return withQmRust(ctx, async () => {
        const order = ctx.step >= 1 ? 'reordered' : 'delivered';
        if (!maps[`human-${order}`]) { ctx.say('Fitting with qmrust…'); await paint(); }
        const t1 = t1Map(human, order);
        ctx.plot({ data: [t1Heatmap(human, t1, 5000), roiMarkers()], layout: imageLayout(human) });
        ctx.say(roiTable(t1, ctx.step >= 1 ? 'images reordered' : 'as delivered'));
      });
    },
  });
})();
