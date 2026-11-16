/* Exercise 6-2, slides "Predict on a real brain": tabbed questions on MTsat-protocol data simulated, voxel by voxel, from
 * the human slice's qMT fit (js/data/brain.js: F, k_f, T2,f, T2,r, and R1,f from the measured R1 with Eq. 6.6). B1 and B0
 * are ignored (B1 = 1, offsets nominal). Each tab compares a case 1 with a case 2 (a tissue change, or another protocol)
 * and asks how MTR and MTsat change: as a number (the drop, in % of the original value) or as a choice (lower, about the
 * same, higher). Answering reveals that row: case 2's map, the % difference and the two histograms. Each simulated slice
 * is computed in chunks when first needed (a few seconds) and kept.
 *   s-q62 (numbers):  1 · the pool size F halves, at the same k_r (half the macromolecules: k_f halves too);
 *                     2 · exchange halves (k_f halves at the same F, so k_r halves too).
 *   s-q62b (choices): protocol 1 is Helms 2008; protocol 2 changes one thing: 1 · TR 25 → 40 ms; 2 · the MT flip angle
 *                     halves (540° → 270°); 3 · the MT offset doubles (2.2 → 4.4 kHz).
 *   s-q62c (choices): imperfections, Karakuzu Siemens: 1 · B1 = 0.8, nominal angles; 2 · B1 = 0.8, readout angles corrected with
 *                     a B1 map (the MT angle is not in the equations); 3 · B0 100 Hz off; 4 · T1 17 % shorter (IR vs VFA). */
(function () {
  'use strict';
  const { S, C, plot, brain, brainHeat, brainAxes, BWR } = window.MT;
  const $ = (id) => document.getElementById(id);
  const PR = S.MTSAT_PROTOCOLS;
  const SAME = 5;   // |change| below this (% of the value) counts as "about the same"

  const median = (a) => { const v = a.filter(Number.isFinite).sort((p, q) => p - q); return v[Math.floor(v.length / 2)]; };
  const pct = (a, p) => { const v = a.filter(Number.isFinite).sort((x, y) => x - y); return v[Math.floor(p * (v.length - 1))]; };
  const cache = {};   // simulated slices, by key: [[mtr, mtsat]] in voxel order

  function quiz({ id, prefix, mode, tabs, first }) {
    window.MTDeck.widget(id, (section) => {
      if (!brain) return;
      const B = brain.B, vox = brain.voxels;
      const tissue = (y, x) => {
        const F = B.F[y][x], kf = B.kf[y][x];
        return { F, kf, R1r: 1, R1f: S.r1fFromMeasured(B.R1[y][x], F, kf, 1), T2f: B.T2f[y][x] / 1e3, T2r: B.T2r[y][x] / 1e6, R1meas: B.R1[y][x] };
      };
      const el = (s) => $(`${prefix}-${s}`);
      let tab = first, started = false, busy = false;
      const gridOf = (vals) => { const g = brain.grid(() => null); vox.forEach(([y, x], i) => { g[y][x] = vals[i]; }); return g; };
      const cb = (unit) => ({ title: { text: unit, side: 'top', font: { size: 11 } }, thickness: 9, len: 0.85, outlinewidth: 0, tickfont: { size: 10 } });
      const mapLayout = () => brainAxes({ margin: { l: 2, r: 44, t: 2, b: 2, autoexpand: false } });
      const ROWS = [
        { key: 'mtr', i: 0, name: 'MTR', fmt: '.1f', dp: 1 },
        { key: 'mtsat', i: 1, name: 'MTsat', fmt: '.2f', dp: 2 },
      ];

      // a case = { key, protocol, change? }: simulate the slice in chunks, so the slide stays responsive
      function simulate(cs, done) {
        if (cache[cs.key]) { done(cache[cs.key]); return; }
        const out = [], status = el('status'), f = cs.change || ((t) => t);
        let k = 0;
        busy = true;
        (function chunk() {
          const end = Math.min(vox.length, k + 200);
          for (; k < end; k++) { const [y, x] = vox[k], r = S.mtsatExperiment(f(tissue(y, x)), cs.protocol, cs.opts || {}); out.push([r.mtr, r.mtsat]); }
          status.textContent = `Simulating the slice… ${Math.round((100 * k) / vox.length)} %`;
          if (k < vox.length) setTimeout(chunk, 0);
          else { status.textContent = ''; busy = false; cache[cs.key] = out; done(out); }
        })();
      }
      const data = () => [cache[tabs[tab].a.key], cache[tabs[tab].b.key]];

      function drawCase1() {
        const [a] = data();
        ROWS.forEach((row) => {
          const v = a.map((p) => p[row.i]);
          row.zmax = Math.ceil(pct(v, 0.98) * 2) / 2;
          plot(el(`${row.key}-base`), [brainHeat(gridOf(v), { zmin: 0, zmax: row.zmax, colorbar: cb('%'), hovertemplate: `${row.name} %{z:${row.fmt}} %<extra></extra>` })], mapLayout());
        });
      }

      // the answer of a row: the median change of case 2 against case 1, in % of case 1's value
      function change(row) {
        const [a, b] = data();
        return {
          d: median(a.map((p, i) => 100 * (b[i][row.i] - p[row.i]) / p[row.i])),
          m1: median(a.map((p) => p[row.i])), m2: median(b.map((p) => p[row.i])),
        };
      }

      function setTab(v) {
        tab = v;
        const t = tabs[v];
        section.querySelectorAll('[data-q-tab]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.qTab === v)));
        el('q').innerHTML = t.q;
        if (el('setup') && t.setup) el('setup').innerHTML = t.setup;
        section.querySelectorAll('.q62-a-label').forEach((e) => { e.innerHTML = t.a.label; });
        section.querySelectorAll('.q62-b-label').forEach((e) => { e.innerHTML = t.b.label; });
        section.querySelectorAll('.q62-hide').forEach((e) => e.classList.remove('q62-shown'));
        ROWS.forEach((row) => {
          const box = el(`${row.key}-ask`), fb = box.querySelector('.ask-fb');
          fb.textContent = ''; fb.className = 'ask-fb';
          if (mode === 'num') { box.querySelector('input').value = ''; box.querySelector('.ask-go').disabled = true; delete box.dataset.answer; }
          else { delete box.dataset.answer; box.querySelectorAll('[data-pick]').forEach((b) => { b.disabled = true; b.classList.remove('hq-pick', 'hq-good'); }); }
        });
        if (!started) return;
        simulate(t.a, () => { drawCase1(); simulate(t.b, () => { if (tab === v) ready(); }); });
      }
      function ready() {
        ROWS.forEach((row) => {
          const box = el(`${row.key}-ask`), c = change(row);
          const explain = `Median over the brain: ${row.name} ${c.m1.toFixed(row.dp)} → ${c.m2.toFixed(row.dp)} % (${c.d > 0 ? '+' : ''}${c.d.toFixed(1)} %).`;
          if (mode === 'num') {
            box.dataset.answer = -c.d; box.dataset.explain = explain; box.querySelector('.ask-go').disabled = false;
          } else {
            box.dataset.answer = Math.abs(c.d) < SAME ? 'same' : c.d > 0 ? 'hi' : 'lo'; box.dataset.explain = explain;
            box.querySelectorAll('[data-pick]').forEach((b) => { b.disabled = false; });
          }
        });
      }

      function reveal(row) {
        const [A, Bv] = data(), a = A.map((p) => p[row.i]), b = Bv.map((p) => p[row.i]);
        const diff = a.map((v, i) => 100 * (b[i] - v) / v), label = tabs[tab].b.label.replace(/<[^>]+>/g, ''), label1 = tabs[tab].a.label.replace(/<[^>]+>/g, '');
        section.querySelectorAll(`.q62-row-${row.key} .q62-hide`).forEach((e) => e.classList.add('q62-shown'));
        plot(el(`${row.key}-alt`), [brainHeat(gridOf(b), { zmin: 0, zmax: row.zmax, colorbar: cb('%'), hovertemplate: `${row.name} %{z:${row.fmt}} %<extra></extra>` })], mapLayout());
        plot(el(`${row.key}-diff`), [brainHeat(gridOf(diff), { zmin: -50, zmax: 50, colorscale: BWR, colorbar: cb('%'), hovertemplate: 'change %{z:.1f} %<extra></extra>' })], mapLayout());
        const bins = { start: 0, end: row.zmax * 1.15, size: row.zmax / 30 }, col = row.i ? '#0c8599' : '#9c36b5';
        plot(el(`${row.key}-hist`), [
          { type: 'histogram', x: a, xbins: bins, name: label1, marker: { color: 'rgba(107,119,133,0.55)' }, hovertemplate: `%{y} voxels<extra>${label1}</extra>` },
          { type: 'histogram', x: b, xbins: bins, name: label, marker: { color: col, opacity: 0.6 }, hovertemplate: `%{y} voxels<extra>${label}</extra>` },
        ], {
          barmode: 'overlay', showlegend: false, margin: { l: 34, r: 6, t: 4, b: 30 },
          xaxis: { title: { text: `${row.name} (%)`, font: { size: 11 }, standoff: 2 }, tickfont: { size: 10 }, range: [0, row.zmax * 1.15] },
          yaxis: { tickfont: { size: 10 }, title: { text: 'voxels', font: { size: 11 }, standoff: 2 } },
          annotations: [[label1, 'rgba(107,119,133,1)', 0.98], [label, col, 0.86]].map(([text, color, y]) => ({ text, x: 0.02, y, xref: 'paper', yref: 'paper', xanchor: 'left', showarrow: false, font: { size: 11, color } })),
          shapes: [median(a), median(b)].map((m, k) => ({ type: 'line', x0: m, x1: m, yref: 'paper', y0: 0, y1: 1, line: { color: k ? C.ink : C.muted, width: 1.5, dash: 'dot' } })),
        });
      }

      const WORD = { lo: 'lower', same: 'about the same', hi: 'higher' };
      ROWS.forEach((row) => {
        const box = el(`${row.key}-ask`);
        if (mode === 'num') { box.addEventListener('checked', () => reveal(row)); return; }
        box.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => {
          b.blur();
          const a = box.dataset.answer, ok = b.dataset.pick === a, fb = box.querySelector('.ask-fb');
          box.querySelectorAll('[data-pick]').forEach((x) => { x.disabled = true; x.classList.toggle('hq-pick', x === b); x.classList.toggle('hq-good', x.dataset.pick === a); });
          fb.className = `ask-fb ${ok ? 'right' : 'wrong'}`;
          fb.innerHTML = `${ok ? '✓ Right' : `✗ It’s ${WORD[a]}`} <span style="font-weight:400;color:var(--ink)">${box.dataset.explain}</span>`;
          reveal(row);
        }));
      });
      section.querySelectorAll('[data-q-tab]').forEach((b) => b.addEventListener('click', () => { b.blur(); if (!busy && b.dataset.qTab !== tab) setTab(b.dataset.qTab); }));

      setTab(first);
      return {
        show() {
          if (started) return;
          started = true;
          setTimeout(() => setTab(tab), 60);
        },
      };
    });
  }

  // ------------------------------------------------------------------ slide 2: how much, as a number
  const KS = { key: 'karakuzuSiemens', protocol: PR.karakuzuSiemens, label: 'Original' };
  quiz({
    id: 's-q62', prefix: 'q62', mode: 'num', first: 'half',
    tabs: {
      // half the macromolecules: F halves; k_r (exchange per macromolecular proton) is a property of the molecules and
      // stays, so k_f = F·k_r halves too
      half: {
        a: KS, b: { key: 'karakuzuSiemens|Fhalf', protocol: PR.karakuzuSiemens, change: (t) => ({ ...t, F: t.F / 2, kf: t.kf / 2 }), label: 'F halved' },
        q: 'If the pool size <b>F halves everywhere</b> (half the macromolecules, each exchanging as before), by how much do the values drop?',
      },
      // slower exchange: k_f halves, F unchanged, so k_r = k_f/F halves too
      exch: {
        a: KS, b: { key: 'karakuzuSiemens|kfhalf', protocol: PR.karakuzuSiemens, change: (t) => ({ ...t, kf: t.kf / 2 }), label: 'k<sub>f</sub> halved' },
        q: 'If <b>exchange halves everywhere</b> (k<sub>f</sub> halves; the pool size F is unchanged), by how much do the values drop?',
      },
    },
  });

  // ------------------------------------------------------------------ slide 3: protocol 1 vs protocol 2, as a choice
  // protocol 1 is Helms 2008 in every tab; protocol 2 changes one thing. table(mt, readout): one cell spans both protocols
  // when it holds one entry
  const H = PR.helms2008, H1 = { key: 'helms2008', protocol: H, label: 'Protocol 1' };
  const cells = (v) => (v.length === 1 ? `<td colspan="2" class="q62-same">${v[0]}</td>` : `<td>${v[0]}</td><td>${v[1]}</td>`);
  const table = (mt, ro) => `<table class="q62-prot"><tr><th></th><th>Protocol 1</th><th>Protocol 2</th></tr><tr><td>MT pulse</td>${cells(mt)}</tr><tr><td>MTw, PDw</td>${cells(ro)}</tr><tr><td>T<sub>1</sub>w</td>${cells(['15°, TR 11 ms'])}</tr></table>`;
  quiz({
    id: 's-q62b', prefix: 'q62b', mode: 'choice', first: 'tr',
    tabs: {
      tr: {
        a: H1, b: { key: 'helms2008|tr40', protocol: { ...H, mtw: { ...H.mtw, tr: 0.04 }, pdw: { ...H.pdw, tr: 0.04 } }, label: 'Protocol 2' },
        setup: table(['Gaussian, 540°, 12.8 ms, 2.2 kHz'], ['5°, TR <b>25 ms</b>', '5°, TR <b>40 ms</b>']),
        q: 'Same brain, protocol 2 instead of protocol 1: only the TR is longer. Will MTR be lower, about the same, or higher? And MTsat?',
      },
      fa: {
        a: H1, b: { key: 'helms2008|mt270', protocol: { ...H, mtw: { ...H.mtw, mt: { ...H.mtw.mt, angle: 270 } } }, label: 'Protocol 2' },
        setup: table(['Gaussian, <b>540°</b>, 12.8 ms, 2.2 kHz', 'Gaussian, <b>270°</b>, 12.8 ms, 2.2 kHz'], ['5°, TR 25 ms']),
        q: 'Protocol 2: the MT pulse’s flip angle halves (540° → 270°). Will MTR be lower, about the same, or higher? And MTsat?',
      },
      off: {
        a: H1, b: { key: 'helms2008|off4400', protocol: { ...H, mtw: { ...H.mtw, mt: { ...H.mtw.mt, offset: 4400 } } }, label: 'Protocol 2' },
        setup: table(['Gaussian, 540°, 12.8 ms, <b>2.2 kHz</b>', 'Gaussian, 540°, 12.8 ms, <b>4.4 kHz</b>'], ['5°, TR 25 ms']),
        q: 'Protocol 2: the MT pulse’s off-resonance frequency doubles (2.2 → 4.4 kHz). Will MTR be lower, about the same, or higher? And MTsat?',
      },
    },
  });

  // ------------------------------------------------------------------ slide 4: imperfections, as a choice
  // The Karakuzu Siemens protocol of slide 2, with one imperfection: the flip angles 20 % below nominal (B1 = 0.8, MT pulse
  // and readouts, MTsat still computed with the nominal angles); B0 off by 100 Hz (water 100 Hz up, so the 1.2 kHz MT pulse
  // sits 1.1 kHz from it); or a T1 17 % shorter (the dataset's WM T1, about 1000 ms, is in Stikov 2015's VFA range; IR read
  // about 830 ms), R1,f recomputed from the shorter measured T1 with Eq. 6.6.
  const K = PR.karakuzuSiemens, KN = { key: 'karakuzuSiemens', protocol: K, label: 'Nominal' };
  quiz({
    id: 's-q62c', prefix: 'q62c', mode: 'choice', first: 'b1',
    tabs: {
      b1: {
        a: KN, b: { key: 'karakuzuSiemens|b1-0.8', protocol: K, opts: { b1: 0.8 }, label: 'B<sub>1</sub> = 0.8' },
        setup: '<p class="q62-setup">Every pulse actually tips <b>20 % less</b> than the scanner was told (B<sub>1</sub> = 0.8): the readouts and the MT pulse. There is <b>no B<sub>1</sub> map</b>, so MTR and MTsat are computed as usual, with the nominal flip angles (6° and 20°).</p>',
        q: 'Will MTR be lower, about the same, or higher than with B<sub>1</sub> = 1? And MTsat?',
      },
      b1map: {
        a: KN, b: { key: 'karakuzuSiemens|b1-0.8-map', protocol: K, opts: { b1: 0.8, b1Known: true }, label: 'B<sub>1</sub> = 0.8, B<sub>1</sub> map' },
        setup: '<p class="q62-setup">The same B<sub>1</sub> = 0.8, but now we have a <b>B<sub>1</sub> map</b>: the readout flip angles in the MTsat equations are corrected (4.8° and 16° instead of 6° and 20°). The MT pulse’s angle cannot be: it is not in Helms’ equations.</p>',
        q: 'With the B<sub>1</sub> map, will MTR be lower, about the same, or higher than with B<sub>1</sub> = 1? And MTsat?',
      },
      b0: {
        a: KN, b: { key: 'karakuzuSiemens|b0+100', protocol: { ...K, mtw: { ...K.mtw, mt: { ...K.mtw.mt, offset: 1100 } } }, label: 'B<sub>0</sub> +100 Hz' },
        setup: '<p class="q62-setup">The water resonance is <b>100 Hz off</b> (B<sub>0</sub> inhomogeneity), towards the MT pulse: the 1.2 kHz pulse is really 1.1 kHz from water.</p>',
        q: 'Will MTR be lower, about the same, or higher than with B<sub>0</sub> on resonance? And MTsat?',
      },
      t1: {
        a: KN, b: { key: 'karakuzuSiemens|t1x0.83', protocol: K, change: (t) => ({ ...t, R1f: S.r1fFromMeasured(t.R1meas / 0.83, t.F, t.kf, 1) }), label: 'T<sub>1</sub> −17 %' },
        setup: '<p class="q62-setup">The T<sub>1</sub> map behind the simulation reads about <b>1000 ms</b> in white matter: the range of VFA in Stikov et al. 2015, where inversion recovery gave about <b>830 ms</b> (and Look-Locker about 650 ms). Suppose the tissue’s T<sub>1</sub> is really the IR one: <b>17 % shorter</b> everywhere.</p>',
        q: 'With the shorter T<sub>1</sub>, will MTR be lower, about the same, or higher? And MTsat?',
      },
    },
  });
})();
