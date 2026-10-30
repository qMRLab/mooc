/* High or low B1? (#guess) The two double-angle images (60°, 120°, long TR) of the brain slice (fl-data.js:
 * measured DAM B1, WM/GM/CSF fractions with the PD/T2 guesses of #fl, TE 5 ms), seen through a messy receive array:
 * seven small loops of different sizes and gains, pressed against the head, so the receive field (0.5–4.5 × its brain
 * mean) is more extreme than a real array's. No B1 map. "Start": 5 points, one at a time in random order, 5 s each;
 * answer B1+ > 1 or < 1 (green / red label), score at the end. Click a pixel to read its value in both images;
 * "Reveal" adds the B1 map (with data-reveal-at-end on the slide, its button only shows once the quiz is over). Receive: quasi-static loops as on #mo / #fl-rx (two antiparallel wires, |B1−| = |B⊥|/2,
 * root-sum-of-squares, here with a gain per coil), normalized to its mean in the brain. S = s·PD·|sin(αB1)|. */
(function () {
  'use strict';
  const slide = document.getElementById('guess'); const D = window.FLASH_BRAIN; if (!slide || !D) return;
  const NR = D.grid.rows, NC = D.grid.cols, N = NR * NC, PIX = D.grid.mm * 1e-3, DEG = Math.PI / 180;
  const bytes = (b64) => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const SEG = bytes(D.seg), WM = bytes(D.wm), GM = bytes(D.gm), CSF = bytes(D.csf);
  const B1 = Array.from(new Uint16Array(bytes(D.b1).buffer), (v) => (v === 65535 ? NaN : v / 20000));
  const PD = { wm: 0.69 * Math.exp(-5 / 70), gm: 0.8 * Math.exp(-5 / 90), csf: Math.exp(-5 / 1000) };   // PD·e^(−TE/T2), #fl's guesses
  // [angle around the head centre (°, 0 = patient left / screen right, 90 = anterior), gap to the head (mm), loop width (cm), gain]
  const COILS = [[100, 0, 4, 2.0], [160, 0, 3, 1.2], [215, 0, 4, 2.5], [290, 2, 6, 0.5], [340, 0, 3, 1.6], [40, 4, 5, 0.7], [250, 0, 3, 1.0]];
  const POINTS = [['A', 30, 39], ['B', 65, 51], ['C', 104, 54], ['D', 85, 29], ['E', 46, 17]];   // label, row, column (picked where B1 is smooth, ≤ 0.86 or ≥ 1.12)
  const TIME = 5000, PAUSE = 1600, GREEN = '#2e8b3a', RED = '#c0392b', ASK = '#a50021';   // ASK: the point being asked, dark red to stand out on grey

  // grid pixel (i, j) → lab (u right, v up = anterior), metres; coils on rays from the head centre, just outside the head
  const U = (j) => (j - (NC - 1) / 2) * PIX, V = (i) => ((NR - 1) / 2 - i) * PIX;
  const inHead = (u, v) => { const i = Math.round((NR - 1) / 2 - v / PIX), j = Math.round(u / PIX + (NC - 1) / 2); return i >= 0 && i < NR && j >= 0 && j < NC && SEG[i * NC + j] > 0; };
  let cu = 0, cv = 0, nh = 0;
  for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) if (SEG[i * NC + j]) { cu += U(j); cv += V(i); nh++; }
  cu /= nh; cv /= nh;
  const wires = COILS.map(([phi, gap, L, g]) => {
    const p = phi * DEG; let u = cu, v = cv;
    while (inHead(u, v) || Math.hypot(u - cu, v - cv) < 0.05) { u += Math.cos(p) * 5e-4; v += Math.sin(p) * 5e-4; }
    const d = gap / 1000 + 0.004; u += Math.cos(p) * d; v += Math.sin(p) * d;   // + the wire radius and a little air
    const tu = -Math.sin(p), tv = Math.cos(p), l = L / 100;
    return { g, w: [[u + tu * l / 2, v + tv * l / 2, 1], [u - tu * l / 2, v - tv * l / 2, -1]] };
  });
  function sens(u, v) {
    let s2 = 0;
    for (const c of wires) {
      let bx = 0, by = 0;
      for (const [px, py, sg] of c.w) { const dx = u - px, dy = v - py, f = sg / Math.max(dx * dx + dy * dy, 9e-6); bx -= dy * f; by += dx * f; }
      s2 += c.g * c.g * (bx * bx + by * by);
    }
    return Math.sqrt(s2) / 2;
  }

  // images on the brain, cropped to it (plus a 2-voxel border)
  const brain = (k) => WM[k] + GM[k] + CSF[k] > 50 && !Number.isNaN(B1[k]);
  const S = new Float64Array(N), A60 = new Float64Array(N), A120 = new Float64Array(N);
  let sum = 0, n = 0, r0 = NR, r1 = 0, c0 = NC, c1 = 0;
  for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) {
    const k = i * NC + j; if (!brain(k)) continue;
    S[k] = sens(U(j), V(i)); sum += S[k]; n++;
    r0 = Math.min(r0, i); r1 = Math.max(r1, i); c0 = Math.min(c0, j); c1 = Math.max(c1, j);
  }
  const all = [];
  for (let k = 0; k < N; k++) if (brain(k)) {
    S[k] /= sum / n;
    const pd = (WM[k] * PD.wm + GM[k] * PD.gm + CSF[k] * PD.csf) / 100;
    A60[k] = S[k] * pd * Math.abs(Math.sin(60 * DEG * B1[k])); A120[k] = S[k] * pd * Math.abs(Math.sin(120 * DEG * B1[k]));
    all.push(A60[k], A120[k]);
  }
  all.sort((a, b) => a - b);
  const ZMAX = all[Math.floor(0.98 * (all.length - 1))];   // one grey scale for both images, 1 = its top; the hottest 2 % saturate
  r0 = Math.max(0, r0 - 2); r1 = Math.min(NR - 1, r1 + 2); c0 = Math.max(0, c0 - 2); c1 = Math.min(NC - 1, c1 + 2);
  const CR = r1 - r0 + 1, CC = c1 - c0 + 1, IW = 300, IH = Math.round((IW * CR) / CC);
  const grid = (a) => Array.from({ length: CR }, (_, i) => Array.from({ length: CC }, (_, j) => { const k = (i + r0) * NC + j + c0; return brain(k) ? a[k] : null; }));
  const Z60 = grid(A60.map((v) => v / ZMAX)), Z120 = grid(A120.map((v) => v / ZMAX)), ZB1 = grid(B1);
  const pts = POINTS.map(([lab, i, j]) => ({ lab, i, j, k: i * NC + j }));
  const st = { revealed: false, pick: null, phase: 'idle', order: [], k: 0, t0: 0, res: [] };   // phase: idle, ask, feedback, done

  // which points to mark: the one being asked (big), then coloured by the answer; after the game or with Reveal, all
  function shown() {
    const col = (p) => { const r = st.res.find((x) => x.lab === p.lab); return r ? (r.ok ? GREEN : RED) : ASK; };
    if (st.phase === 'ask' || st.phase === 'feedback') { const p = pts[st.order[st.k]]; return [{ p, c: st.phase === 'ask' ? ASK : col(p), size: 18 }]; }
    if (st.phase === 'done' || st.revealed) return pts.map((p) => ({ p, c: col(p), size: 11 }));
    return [];
  }
  const hosts = {}; slide.querySelectorAll('.map-host').forEach((h) => { hosts[h.dataset.key] = h; });
  [hosts.i60, hosts.i120].forEach((h) => { h.style.height = `${IH}px`; });
  function panel(host, z, cs, zmin, zmax, w, h, bar) {
    const tr = [{ type: 'heatmap', x0: c0, dx: 1, y0: r0, dy: 1, z, colorscale: cs, zmin, zmax, hoverinfo: 'none', hoverongaps: false,
      showscale: !!bar, colorbar: bar ? { thickness: 10, len: 0.8, tickfont: { size: 11 }, outlinewidth: 0 } : undefined }];
    const m = shown();
    if (m.length) tr.push({ x: m.map((o) => o.p.j), y: m.map((o) => o.p.i), mode: 'markers+text', text: m.map((o) => o.p.lab), textposition: 'middle right', hoverinfo: 'none',
      textfont: { size: 15, color: m.map((o) => o.c), family: '"Helvetica Neue", Helvetica, Arial, sans-serif' }, marker: { size: m.map((o) => o.size), color: 'rgba(0,0,0,0)', line: { color: m.map((o) => o.c), width: 3.5 } } });
    if (st.pick) tr.push({ x: [st.pick[1]], y: [st.pick[0]], mode: 'markers', hoverinfo: 'none', marker: { size: 13, symbol: 'cross-thin', line: { color: '#2fa8e0', width: 2.5 } } });
    Plotly.react(host, tr, {
      width: w, height: h, margin: { l: 2, r: bar ? 40 : 2, t: 2, b: 2 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', showlegend: false,
      xaxis: { visible: false, range: [c0 - 0.5, c1 + 0.5], fixedrange: true }, yaxis: { visible: false, range: [r1 + 0.5, r0 - 0.5], scaleanchor: 'x', fixedrange: true },
      dragmode: false, hovermode: 'closest',
    }, { displayModeBar: false, scrollZoom: false, responsive: false });
    if (!host._gsClick) {
      host._gsClick = true;
      host.on('plotly_click', (e) => { const p = e.points && e.points[0]; if (!p) return; const i = Math.round(p.y), j = Math.round(p.x); if (brain(i * NC + j)) { st.pick = [i, j]; draw(); } });
    }
  }
  const q = (c) => slide.querySelector(c), f = (v) => v.toFixed(2);
  function draw() {
    panel(hosts.i60, Z60, CMAPS.gray, 0, 1, IW, IH);
    panel(hosts.i120, Z120, CMAPS.gray, 0, 1, IW, IH);
    q('.gs-b1wrap').hidden = !st.revealed;
    if (st.revealed) panel(hosts.b1, ZB1, CMAPS.rdbu, 0.7, 1.3, 180, Math.round((138 * CR) / CC) + 4, true);
    const read = (k, what) => `${what}: <b>60° image ${f(A60[k] / ZMAX)}</b> · <b>120° image ${f(A120[k] / ZMAX)}</b>` + (st.revealed ? ` · B<sub>1</sub><sup>+</sup> ${f(B1[k])} (receive ${f(S[k])})` : '');
    const cur = st.phase === 'ask' || st.phase === 'feedback' ? pts[st.order[st.k]] : null;   // the point being asked: its values, no click needed
    q('.gs-pt').innerHTML = cur ? read(cur.k, `Point ${cur.lab}`) : '';
    if (q('.gs-vals')) {   // the exercise deck: the asked point's values in boxes, blank until Start
      q('.gs-vlab').textContent = cur ? cur.lab : '–';
      q('.gs-v60').textContent = cur ? f(A60[cur.k] / ZMAX) : '–';
      q('.gs-v120').textContent = cur ? f(A120[cur.k] / ZMAX) : '–';
    }
    if (st.pick) q('.gs-pix').innerHTML = read(st.pick[0] * NC + st.pick[1], 'Clicked pixel');
    const rv = q('.gs-reveal'); rv.setAttribute('aria-pressed', String(st.revealed));
    if (slide.hasAttribute('data-reveal-at-end')) rv.hidden = st.phase !== 'done';   // the exercise deck: the map only after the quiz
    rv.innerHTML = st.revealed ? 'Hide the B<sub>1</sub> map' : 'Reveal the B<sub>1</sub> map';
    q('.gs-start').textContent = st.phase === 'idle' ? 'Start' : 'Start again';
    slide.querySelectorAll('[data-gsa]').forEach((b) => { b.disabled = st.phase !== 'ask'; });
    q('.gs-results').innerHTML = st.res.map((r) => `<tr><td><b>${r.lab}</b></td><td>${r.guess ? `you: B<sub>1</sub><sup>+</sup> ${r.guess === 'hi' ? '&gt;' : '&lt;'} 1` : 'no answer'}</td>` +
      `<td><span class="gs-tag" style="background:${r.ok ? GREEN : RED}">${r.ok ? 'right' : 'wrong'}</span></td><td>B<sub>1</sub><sup>+</sup> = ${f(r.b1)}</td><td>${r.guess ? `${(r.t / 1000).toFixed(1)} s` : ''}</td><td><b>${r.pts}</b></td></tr>`).join('');
    const right = st.res.filter((r) => r.ok).length;
    const total = st.res.reduce((a, r) => a + r.pts, 0), mean = st.res.length ? st.res.reduce((a, r) => a + r.t, 0) / st.res.length / 1000 : 0;
    q('.gs-status').textContent = st.phase === 'done' ? `Score: ${total} points · ${Math.round((100 * right) / pts.length)} % right · ${mean.toFixed(1)} s per point` : st.phase === 'idle' ? '' : `Point ${st.k + 1} of ${pts.length}`;
  }

  // the game: each point for TIME ms, then the green / red label for PAUSE ms
  let tick = null, next = null;
  const fb = q('.gs-fb'), bar = q('.gs-timer > div');
  function ask() {
    st.phase = 'ask'; st.t0 = performance.now(); fb.textContent = ''; fb.className = 'gs-fb'; bar.style.width = '100%'; draw();
    tick = setInterval(() => {
      const left = Math.max(0, TIME - (performance.now() - st.t0));
      bar.style.width = `${(100 * left) / TIME}%`;
      if (left === 0) answer(null);
    }, 50);
  }
  function answer(guess) {
    if (st.phase !== 'ask') return;
    clearInterval(tick);
    const p = pts[st.order[st.k]], b = B1[p.k], ok = guess !== null && (guess === 'hi') === (b > 1);
    const t = Math.min(TIME, performance.now() - st.t0);   // answer time; a right answer scores 1000 at once, down to 500 at the 5 s limit
    st.res.push({ lab: p.lab, guess, ok, b1: b, t, pts: ok ? Math.round(1000 * (1 - t / (2 * TIME))) : 0 }); st.phase = 'feedback';
    fb.className = `gs-fb ${ok ? 'gs-right' : 'gs-wrong'}`;
    fb.innerHTML = `${ok ? '✓ Right' : guess === null ? '✗ Time’s up' : '✗ Wrong'}: B<sub>1</sub><sup>+</sup> = ${f(b)} at ${p.lab}`;
    draw();
    next = setTimeout(() => { if (++st.k < pts.length) ask(); else { st.phase = 'done'; bar.style.width = '0%'; draw(); } }, PAUSE);
  }
  q('.gs-start').addEventListener('click', (e) => {
    e.currentTarget.blur(); clearInterval(tick); clearTimeout(next);
    st.order = pts.map((_, k) => k);
    if (!slide.hasAttribute('data-in-order')) for (let k = st.order.length - 1; k > 0; k--) { const m = Math.floor(Math.random() * (k + 1)); [st.order[k], st.order[m]] = [st.order[m], st.order[k]]; }   // the exercise deck asks A to E in order
    st.k = 0; st.res = [];
    if (slide.hasAttribute('data-reveal-at-end')) st.revealed = false;
    ask();
  });
  slide.querySelectorAll('[data-gsa]').forEach((b) => b.addEventListener('click', () => { b.blur(); answer(b.dataset.gsa); }));
  q('.gs-reveal').addEventListener('click', (e) => { e.currentTarget.blur(); st.revealed = !st.revealed; draw(); });
  onShow(slide, draw);
})();
