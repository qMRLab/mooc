/* Build a B1 map from the ratio (#build): the real double-angle pair (dam-data.js: clt_tse_60 and clt_tse_120,
 * TR 1.55 s), on one grey scale. Pick a range of the ratio r = S120/S60 (two-handle slider over the brain's histogram):
 * every brain pixel in that range lights up in both images; give that set one B1 value ("band"). Your map: each pixel
 * takes the B1 of the band its ratio falls in (later bands win on overlaps); optionally, the gaps between bands are
 * filled by linear interpolation in r between the band centres; optionally smoothed afterwards by a Gaussian (σ in mm,
 * normalized over the pixels that have a value, so the brain's edge isn't pulled down). The real map is arccos(r/2)/60° (= b1_clt_tse).
 * Head and brain masks from fl-data.js; the few brain voxels with a real B1 < 0.3 (noise) are left out. */
(function () {
  'use strict';
  const slide = document.getElementById('build'); const D = window.DAM_TSE, F = window.FLASH_BRAIN; if (!slide || !D || !F) return;
  const NR = D.grid.rows, NC = D.grid.cols, N = NR * NC;
  const bytes = (b64) => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const S60 = new Uint16Array(bytes(D.s60).buffer), S120 = new Uint16Array(bytes(D.s120).buffer);
  const SEG = bytes(F.seg), WM = bytes(F.wm), GM = bytes(F.gm), CSF = bytes(F.csf);
  const head = (k) => SEG[k] > 0;
  const RAT = new Float64Array(N).fill(NaN), REAL = new Float64Array(N).fill(NaN);
  for (let k = 0; k < N; k++) if (WM[k] + GM[k] + CSF[k] > 50 && S60[k] > 0) {
    const r = S120[k] / S60[k], b = Math.acos(Math.max(-1, Math.min(1, r / 2))) / (Math.PI / 3);
    if (b >= 0.3) { RAT[k] = r; REAL[k] = b; }   // a few noisy voxels have S120 ≥ 2·S60 (B1 = 0): left out
  }
  const brain = (k) => !Number.isNaN(RAT[k]);
  const all = []; for (let k = 0; k < N; k++) if (head(k)) all.push(S60[k], S120[k]);
  all.sort((a, b) => a - b);
  const TOP = all[Math.floor(0.98 * (all.length - 1))];   // one grey scale for both images, 1 = its top
  let r0 = NR, r1 = 0, c0 = NC, c1 = 0, NB = 0;
  for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) { const k = i * NC + j; if (brain(k)) NB++; if (head(k)) { r0 = Math.min(r0, i); r1 = Math.max(r1, i); c0 = Math.min(c0, j); c1 = Math.max(c1, j); } }
  r0 = Math.max(0, r0 - 2); r1 = Math.min(NR - 1, r1 + 2); c0 = Math.max(0, c0 - 2); c1 = Math.min(NC - 1, c1 + 2);
  const CR = r1 - r0 + 1, CC = c1 - c0 + 1, IW = 200, IH = Math.round((IW * CR) / CC);
  const grid = (f) => Array.from({ length: CR }, (_, i) => Array.from({ length: CC }, (_, j) => f((i + r0) * NC + j + c0)));
  const Z60 = grid((k) => S60[k] / TOP), Z120 = grid((k) => S120[k] / TOP);
  const RMAX = 2, st = { lo: 0.98, hi: 1.02, b1: 1, fill: false, smooth: 0, bands: [], view: 'yours', pick: null };

  // the map from the bands
  function lookup(r) {
    for (let n = st.bands.length - 1; n >= 0; n--) { const b = st.bands[n]; if (r >= b.lo && r <= b.hi) return b.b1; }
    if (!st.fill || !st.bands.length) return NaN;
    const c = st.bands.map((b) => [(b.lo + b.hi) / 2, b.b1]).sort((x, y) => x[0] - y[0]);
    if (r <= c[0][0]) return c[0][1];
    if (r >= c[c.length - 1][0]) return c[c.length - 1][1];
    for (let n = 1; n < c.length; n++) if (r <= c[n][0]) { const [xa, ya] = c[n - 1], [xb, yb] = c[n]; return xb > xa ? ya + ((r - xa) / (xb - xa)) * (yb - ya) : yb; }
    return NaN;
  }
  function gauss(M, sig) {   // separable Gaussian over the pixels that have a value (normalized convolution); σ in pixels
    const R = Math.ceil(3 * sig), w = Array.from({ length: 2 * R + 1 }, (_, n) => Math.exp(-((n - R) ** 2) / (2 * sig * sig)));
    const pass = (src, wt, horiz) => {
      const out = new Float64Array(N), ow = new Float64Array(N);
      for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) {
        let a = 0, b = 0;
        for (let n = -R; n <= R; n++) {
          const ii = horiz ? i : i + n, jj = horiz ? j + n : j; if (ii < 0 || ii >= NR || jj < 0 || jj >= NC) continue;
          const k = ii * NC + jj; a += w[n + R] * src[k]; b += w[n + R] * wt[k];
        }
        out[i * NC + j] = a; ow[i * NC + j] = b;
      }
      return [out, ow];
    };
    const v = new Float64Array(N), m = new Float64Array(N);
    for (let k = 0; k < N; k++) if (!Number.isNaN(M[k])) { v[k] = M[k]; m[k] = 1; }
    const [v1, m1] = pass(v, m, true), [v2, m2] = pass(v1, m1, false);
    const out = new Float64Array(N).fill(NaN);
    for (let k = 0; k < N; k++) if (!Number.isNaN(M[k]) && m2[k] > 0) out[k] = v2[k] / m2[k];
    return out;
  }
  const yours = () => {
    const M = new Float64Array(N).fill(NaN); for (let k = 0; k < N; k++) if (brain(k)) M[k] = lookup(RAT[k]);
    return st.smooth > 0 ? gauss(M, st.smooth / D.grid.mm) : M;
  };
  const inSel = (k) => brain(k) && RAT[k] >= st.lo && RAT[k] <= st.hi;

  // colours for the band strips (rdbu, 0.6–1.4, as the map)
  const RD = CMAPS.rdbu.map(([t, c]) => [t, ...c.match(/\d+/g).map(Number)]);
  const rdbu = (v) => {
    const t = Math.max(0, Math.min(1, (v - 0.6) / 0.8)); let n = 1; while (n < RD.length - 1 && RD[n][0] < t) n++;
    const [t0, ...a] = RD[n - 1], [t1, ...b] = RD[n], u = (t - t0) / (t1 - t0); return `rgb(${a.map((x, i) => Math.round(x + u * (b[i] - x))).join(',')})`;
  };

  // histogram of the brain's ratios, with the selection shaded and the bands as strips underneath
  const cv = slide.querySelector('.bd-hist'), cx = cv.getContext('2d'), HB = 100, HIST = new Float64Array(HB);
  for (let k = 0; k < N; k++) if (brain(k)) HIST[Math.min(HB - 1, Math.floor((RAT[k] / RMAX) * HB))]++;
  const HMAX = Math.max(...HIST);
  function drawHist() {
    const W = cv.width, H = cv.height, PH = H - 30, X = (r) => (r / RMAX) * W;
    cx.clearRect(0, 0, W, H);
    cx.fillStyle = 'rgba(232,119,14,0.18)'; cx.fillRect(X(st.lo), 0, Math.max(2, X(st.hi) - X(st.lo)), PH);
    for (let n = 0; n < HB; n++) {
      const r = ((n + 0.5) / HB) * RMAX, h = (HIST[n] / HMAX) * (PH - 4);
      cx.fillStyle = r >= st.lo && r <= st.hi ? '#e8770e' : '#9aa5b1'; cx.fillRect((n / HB) * W + 0.5, PH - h, W / HB - 1, h);
    }
    st.bands.forEach((b) => { cx.fillStyle = rdbu(b.b1); cx.fillRect(X(b.lo), PH + 3, Math.max(3, X(b.hi) - X(b.lo)), 9); });
    cx.fillStyle = INK; cx.font = '13px "Helvetica Neue", Helvetica, Arial, sans-serif'; cx.textAlign = 'center';
    [0, 0.5, 1, 1.5, 2].forEach((r) => cx.fillText(String(r), Math.min(W - 8, Math.max(8, X(r))), H - 2));
  }

  const hosts = {}; slide.querySelectorAll('.map-host').forEach((h) => { hosts[h.dataset.key] = h; h.style.width = `${IW}px`; h.style.height = `${IH}px`; });
  hosts.map.style.width = `${IW + 46}px`;
  function panel(host, z, cs, zmin, zmax, bar, sel) {
    const tr = [{ type: 'heatmap', x0: c0, dx: 1, y0: r0, dy: 1, z, colorscale: cs, zmin, zmax, hoverinfo: 'none', hoverongaps: false,
      showscale: !!bar, colorbar: bar ? { thickness: 10, len: 0.85, tickfont: { size: 11 }, outlinewidth: 0, ...bar } : undefined }];
    if (sel) tr.push({ type: 'heatmap', x0: c0, dx: 1, y0: r0, dy: 1, z: sel, colorscale: [[0, '#e8770e'], [1, '#e8770e']], zmin: 0, zmax: 1, opacity: 0.6, showscale: false, hoverinfo: 'none', hoverongaps: false });
    if (st.pick) tr.push({ x: [st.pick[1]], y: [st.pick[0]], mode: 'markers', hoverinfo: 'none', marker: { size: 13, symbol: 'cross-thin', line: { color: '#2fa8e0', width: 2.5 } } });
    Plotly.react(host, tr, {
      width: bar ? IW + 46 : IW, height: IH, margin: { l: 1, r: bar ? 46 : 1, t: 1, b: 1 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', showlegend: false,
      xaxis: { visible: false, range: [c0 - 0.5, c1 + 0.5], fixedrange: true }, yaxis: { visible: false, range: [r1 + 0.5, r0 - 0.5], scaleanchor: 'x', fixedrange: true },
      dragmode: false, hovermode: 'closest',
    }, { displayModeBar: false, scrollZoom: false, responsive: false });
    if (!host._bdClick) {
      host._bdClick = true;
      host.on('plotly_click', (e) => { const p = e.points && e.points[0]; if (!p) return; const i = Math.round(p.y), j = Math.round(p.x); if (head(i * NC + j)) { st.pick = [i, j]; draw(); } });
    }
  }
  const q = (c) => slide.querySelector(c), f = (v) => v.toFixed(2);
  const pc = (v) => `${(100 * v).toFixed(1).replace('-', '−')} %`;
  function drawImages() {
    let n = 0;
    const SEL = grid((k) => { const s = inSel(k); if (s) n++; return s ? 1 : null; });   // a new array each time: Plotly.react skips arrays it has already seen
    panel(hosts.i60, Z60, CMAPS.gray, 0, 1, null, SEL);
    panel(hosts.i120, Z120, CMAPS.gray, 0, 1, null, SEL);
    q('.bd-sel').innerHTML = `S<sub>120</sub>/S<sub>60</sub> from <b>${f(st.lo)}</b> to <b>${f(st.hi)}</b>: ${n} pixels (${(100 * n / NB).toFixed(1)} % of the brain)`;
    drawHist();
  }
  function draw() {
    drawImages();
    const Y = yours();
    if (st.view === 'yours') panel(hosts.map, grid((k) => (Number.isNaN(Y[k]) ? null : Y[k])), CMAPS.rdbu, 0.6, 1.4, {});
    else if (st.view === 'real') panel(hosts.map, grid((k) => (Number.isNaN(REAL[k]) ? null : REAL[k])), CMAPS.rdbu, 0.6, 1.4, {});
    else panel(hosts.map, grid((k) => (Number.isNaN(Y[k]) || Number.isNaN(REAL[k]) ? null : 100 * (Y[k] / REAL[k] - 1))), CMAPS.rdbu, -20, 20, { ticksuffix: ' %' });
    q('.bd-maptitle').innerHTML = { yours: 'Your B<sub>1</sub> map', real: 'The real B<sub>1</sub> map', diff: '% difference, yours vs real' }[st.view];
    q('.bd-pix').innerHTML = st.pick
      ? (() => { const k = st.pick[0] * NC + st.pick[1]; return `This pixel: <b>60° ${f(S60[k] / TOP)}</b> · <b>120° ${f(S120[k] / TOP)}</b> · ratio <b>${S60[k] ? f(S120[k] / S60[k]) : '–'}</b>` + (st.view !== 'yours' && brain(k) ? ` · real B<sub>1</sub> ${f(REAL[k])}` : ''); })()
      : 'Click a pixel to read it in both images.';
    const list = q('.bd-list'); list.innerHTML = '';
    st.bands.forEach((b, n) => {
      const el = document.createElement('button'); el.className = 'bs-btn ff-chip'; el.title = 'Remove this band';
      el.innerHTML = `<span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${rdbu(b.b1)};margin:0 4px 0 0"></span>${f(b.lo)}–${f(b.hi)} → ${f(b.b1)} <span aria-hidden="true">×</span>`;
      el.addEventListener('click', () => { st.bands.splice(n, 1); draw(); });
      list.appendChild(el);
    });
    let n = 0, e2 = 0, bias = 0;
    for (let k = 0; k < N; k++) if (!Number.isNaN(Y[k])) { const e = Y[k] / REAL[k] - 1; n++; e2 += e * e; bias += e; }
    q('.bd-cov').textContent = `${(100 * n / NB).toFixed(0)} %`;
    q('.bd-rms').textContent = n ? pc(Math.sqrt(e2 / n)) : '–';
    q('.bd-bias').textContent = n ? pc(bias / n) : '–';
  }

  // the two-handle ratio slider (two stacked range inputs) and the B1 to give the selection
  const lo = q('.bd-lo'), hi = q('.bd-hi'), b1 = q('.bd-b1');
  let pend = false;
  const soon = () => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; drawImages(); }); };
  lo.addEventListener('input', () => { st.lo = Math.min(Number(lo.value), st.hi); lo.value = String(st.lo); soon(); });
  hi.addEventListener('input', () => { st.hi = Math.max(Number(hi.value), st.lo); hi.value = String(st.hi); soon(); });
  [lo, hi, b1].forEach(keepSlider);
  const showB1 = () => { q('.bd-b1-read').textContent = f(st.b1); };
  b1.addEventListener('input', () => { st.b1 = Number(b1.value); showB1(); }); showB1();
  q('.bd-set').addEventListener('click', (e) => { e.currentTarget.blur(); st.bands.push({ lo: st.lo, hi: st.hi, b1: st.b1 }); draw(); });
  q('.bd-undo').addEventListener('click', (e) => { e.currentTarget.blur(); st.bands.pop(); draw(); });
  q('.bd-clear').addEventListener('click', (e) => { e.currentTarget.blur(); st.bands = []; draw(); });
  const sm = q('.bd-smooth'), smOut = q('.bd-smooth-read');
  const showSm = () => { smOut.textContent = st.smooth > 0 ? `σ ${st.smooth.toFixed(1)} mm` : 'off'; };
  sm.addEventListener('input', () => { st.smooth = Number(sm.value); showSm(); draw(); }); keepSlider(sm); showSm();
  const fb = q('.bd-fill');
  fb.addEventListener('click', () => { st.fill = !st.fill; fb.setAttribute('aria-pressed', String(st.fill)); fb.blur(); draw(); });
  segToggle(slide, 'bdview', (v) => { st.view = v; draw(); });
  onShow(slide, draw);
})();
