/* Slide "Decay ⇄ lineshape": a 2 × 2 grid. Middle column: the free-induction decays of water (exponential, T2 = 70 ms)
 * and of the restricted pool (super-Lorentzian decay, T2 = 12 µs: an average over orientations of Gaussian decays,
 * FID(t) = ∫₀¹ exp(-t²(3u²-1)²/(8T2²)) du). Right column: their Fourier transforms, the Lorentzian and the
 * super-Lorentzian, on the same symmetric log offset axis (±100 kHz, linear within ±0.1 Hz), so the widths compare directly. The super-Lorentzian is
 * computed from the sampled decay, G(Δ) = (1/π) ∫ FID(t) cos(2πΔt) dt (∫ G dω = 1); water's is the exact transform of
 * its exponential decay, the Lorentzian (sampling a 70 ms decay finely enough for ±100 kHz would take millions of points).
 * Same T2s as slide 2. The windows on the sampled decays keep the cut from ringing: water's decay is gone by the end,
 * so a cosine taper over the last 20 % is enough; the super-Lorentzian decay has a slow 1/t tail, and an end taper
 * leaves ripples ~1/(x_max T2) apart in the line, so it gets a Gaussian window, exp(-(x/300)²), which only rounds the
 * cusp (below ~200 Hz at 12 µs) and stays within 1 % of the exact line above that. */
(function () {
  'use strict';
  const { S, C, plot } = window.MT;
  const $ = (id) => document.getElementById(id);

  window.MTDeck.widget('s-fidgrid', () => {
    const T2F = 70e-3, T2R = 12e-6;
    // super-Lorentzian decay shape f(x), x = t/T2, u = cos θ, the u-grid log-spaced in the distance to the magic angle
    const U0 = 1 / Math.sqrt(3), UG = [], NU = 600, LR = Math.log(1e-6);
    for (const [L, sgn] of [[U0, -1], [1 - U0, 1]]) {
      for (let i = 0; i < NU; i++) { const r = Math.exp(LR * (1 - (i + 0.5) / NU)); UG.push([U0 + sgn * L * r, (L * r * -LR) / NU]); }
    }
    const fSL = (x) => { let s = 0; const k = x * x / 8; for (const [u, w] of UG) { const d = 3 * u * u - 1; s += w * Math.exp(-k * d * d); } return s; };
    const fL = (x) => Math.exp(-x);
    // decays sampled in x, times a window (water: end taper; super-Lorentzian: Gaussian, for its slow 1/t tail)
    function sampled(f, xmax, n, win) {
      const ys = [];
      for (let i = 0; i <= n; i++) { const x = (xmax * i) / n; ys.push(f(x) * win(x)); }
      return { ys, dx: xmax / n };
    }
    const endTaper = (xmax) => (x) => (x > 0.8 * xmax ? 0.5 * (1 + Math.cos(Math.PI * (x - 0.8 * xmax) / (0.2 * xmax))) : 1);
    function lineshape(dec, T2, d) {
      const { ys, dx } = dec, n = ys.length - 1, a = 2 * Math.PI * d * T2;
      let s = 0;
      for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 0.5 : 1) * ys[i] * Math.cos(a * i * dx);
      return (T2 * s * dx) / Math.PI;
    }
    // symmetric log offset axis ("symlog"): linear for |Δ| < LIN (0.1 Hz), log10 beyond, so both signs and 0 fit on one
    // axis; u = Δ/LIN inside, sign(Δ)(1 + log10(|Δ|/LIN)) outside. Same range for both lineshapes: ±100 kHz.
    const FMAX = 1e5, LIN = 0.1;
    const toU = (d) => (Math.abs(d) < LIN ? d / LIN : Math.sign(d) * (1 + Math.log10(Math.abs(d) / LIN)));
    const fromU = (u) => (Math.abs(u) < 1 ? u * LIN : Math.sign(u) * LIN * 10 ** (Math.abs(u) - 1));
    const UMAX = toU(FMAX);
    const US = Array.from({ length: 1201 }, (_, i) => -UMAX + (2 * UMAX * i) / 1200);
    const DS = US.map(fromU);
    const DEC = [-1e5, -1e4, -1e3, -100, -10, -1, -0.1, 0, 0.1, 1, 10, 100, 1e3, 1e4, 1e5];
    const tickText = (d) => (d === 0 ? '0' : `${d < 0 ? '−' : ''}${Math.abs(d) >= 1000 ? `${Math.abs(d) / 1000}k` : Math.abs(d)}`);
    const LABELLED = new Set([-1e5, -1e3, -10, 0, 10, 1e3, 1e5]);
    const fmtHz = (v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)} kHz` : `${v.toFixed(Math.abs(v) < 10 ? 1 : 0)} Hz`);
    const lin = (n, max) => Array.from({ length: n + 1 }, (_, i) => (max * i) / n);
    const margin = { l: 66, r: 14, t: 8, b: 52 };
    const font = { size: 14 };

    const rows = [
      { key: 'w', color: C.free, T2: T2F, f: fL, dec: sampled(fL, 12, 6000, endTaper(12)),
        tmax: 300, tunit: 1e-3, tlabel: 'ms', t2text: '70 ms', G: (d) => S.lorentzianG(Math.abs(d), T2F),
        gscale: 1e3, glabel: 'ms', note: 'exponential decay', marker: true, fnote: 'Lorentzian · ≈ 5 Hz wide' },
      { key: 'r', color: C.restr, T2: T2R, f: fSL, dec: sampled(fSL, 900, 18000, (x) => Math.exp(-((x / 300) ** 2))),
        tmax: 100, tunit: 1e-6, tlabel: 'µs', t2text: '12 µs', G: null,
        gscale: 1e6, glabel: 'µs', note: 'not exponential · T<sub>2</sub> = 12 µs', marker: false, fnote: 'super-Lorentzian · kHz wide' },
    ];
    for (const r of rows) {
      const ts = lin(400, r.tmax);
      const fid = ts.map((t) => r.f((t * r.tunit) / r.T2));
      const t2 = r.T2 / r.tunit;
      plot($(`fg-${r.key}t`), [
        { x: ts, y: fid, mode: 'lines', line: { color: r.color, width: 3.5 }, fill: 'tozeroy', fillcolor: `${r.color}1f`, hovertemplate: `t = %{x:.1f} ${r.tlabel}: %{y:.2f}<extra></extra>` },
      ], {
        xaxis: { title: { text: `time after the pulse (${r.tlabel})`, font }, range: [0, r.tmax] },
        yaxis: { title: { text: 'signal', font }, range: [0, 1.08], tickvals: [0, 0.5, 1] },
        margin,
        // T2 marked where the decay reaches 1/e (water); for the super-Lorentzian decay T2 is the lineshape's parameter, not a 1/e time
        shapes: r.marker ? [{ type: 'line', x0: t2, x1: t2, y0: 0, y1: r.f(1), line: { color: C.ink, width: 1.5, dash: 'dot' } }] : [],
        annotations: [
          ...(r.marker ? [{ x: t2, y: r.f(1), text: `T<sub>2</sub> = ${r.t2text}`, showarrow: false, xanchor: 'left', yanchor: 'bottom', xshift: 6, yshift: 4, font: { size: 15 } }] : []),
          { xref: 'paper', yref: 'paper', x: 0.97, y: 0.95, xanchor: 'right', yanchor: 'top', text: r.note, showarrow: false, font: { size: 15, color: C.muted } },
        ],
      });
      const ds = DS;
      const gs = ds.map((d) => (r.G ? r.G(d) : lineshape(r.dec, r.T2, Math.abs(d))) * r.gscale);
      plot($(`fg-${r.key}f`), [
        { x: US, y: gs, mode: 'lines', line: { color: r.color, width: 3.5 }, fill: 'tozeroy', fillcolor: `${r.color}1f`, hovertemplate: `Δ = %{customdata}: %{y:.3g} ${r.glabel}<extra></extra>`, customdata: ds.map(fmtHz) },
      ], {
        xaxis: { title: { text: 'offset from resonance, Δ (Hz)', font }, range: [-UMAX, UMAX], tickvals: DEC.map(toU), ticktext: DEC.map((d) => (LABELLED.has(d) ? tickText(d) : '')), tickfont: { size: 12 }, zeroline: false },
        shapes: [{ type: 'rect', x0: -1, x1: 1, yref: 'paper', y0: 0, y1: 1, fillcolor: 'rgba(29,39,51,0.05)', line: { width: 0 }, layer: 'below' }],
        yaxis: { title: { text: `lineshape G (${r.glabel})`, font }, range: [0, 1.08 * Math.max(...gs)] },
        margin: { ...margin, t: 28 },
        annotations: [
          // black arrow down onto the line at +1 kHz (an MT offset), the same on both rows
          { x: toU(1000), y: (r.G ? r.G(1000) : lineshape(r.dec, r.T2, 1000)) * r.gscale, showarrow: true, arrowhead: 2, arrowsize: 1.3, arrowwidth: 2.5, arrowcolor: '#000', ax: 0, ay: -46, text: '' },
          { xref: 'paper', yref: 'paper', x: 0.5, y: 1, xanchor: 'center', yanchor: 'bottom', yshift: 2, text: r.fnote, showarrow: false, font: { size: 15, color: C.muted } }],
      });
    }
  });
})();
