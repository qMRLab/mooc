/* Lecture slide "Why map T2?": the book's Figure 3.1 data, its T2-weighted image at TE = 12.8 ms beside its T2 map,
 * with hover values: a signal in arbitrary units on one side, T2 in ms on the other. Drawn the first time the slide
 * is shown, from js/figures/t2Plot1.js (traces 0 and 4). The T2 map follows the ISMRM recommendation for relaxometry
 * maps (Fuderer et al., Magn Reson Med 2025;93:490, doi:10.1002/mrm.30290): the log-processed Navia colour map
 * (Crameri, Scientific Colour Maps, doi:10.5281/zenodo.1243862), a colour bar, and black for invalid values. */
(function () {
  'use strict';
  const slide = document.querySelector('section.t2w-vs-map'), fig = window.T2Figures && window.T2Figures.t2Plot1;
  if (!slide || !fig || !window.Plotly || !window.Reveal) return;
  const INK = '#1d2733', FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const t2w = fig.data[0], map = fig.data[4];
  const head = Math.max(...t2w.z.flat()) * 0.05;  // outside the head: no hover on either image
  const masked = (z) => z.map((row, i) => row.map((v, j) => (t2w.z[i][j] > head ? v : null)));
  const layout = () => ({  // the same plot area for both, so the two images match in size
    width: 380, height: 330, margin: { l: 4, r: 70, t: 4, b: 4 }, dragmode: false,
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: '#000',
    xaxis: { visible: false, range: [0, t2w.z[0].length - 1], fixedrange: true },
    yaxis: { visible: false, range: [0, t2w.z.length - 1], scaleanchor: 'x', fixedrange: true },
    font: { family: FONT, size: 14, color: INK },
    hoverlabel: { bgcolor: '#fff', bordercolor: INK, font: { size: 16, color: INK } },
  });
  const config = { displayModeBar: false, scrollZoom: false };

  // Navia, 256 colours; the first is replaced by black, the colour for invalid values.
  const NAVIA = '03132704152904162b04172c04182e041930051a32051b34051c36051d38051e3a05203c05213e05224005234205244405254605264806284a06294c062a4e062b50062c52062e54062f5606305806315a07325c07345e073560073662073764073966083a68083b6a083c6b083e6d093f6f0940710a41730a43740b44760b45780b46790c487b0d497d0d4a7e0e4c800e4d810f4e82104f8410518511528612538713548813568914578a15588b16598c175a8d175c8d185d8e195e8e1a5f8f1b608f1b61901c62901d63901e64911e65911f6691206791206891216991226a91226b91236c91246c91246d91256e90266f90266f9027709027718f28718f28728f29738f2a738e2a748e2b758e2b758d2c768d2c768d2d778c2d788c2e788c2f798b2f798b307a8b307a8a317b8a317c8a327c89327d89337d89347e88347e88357f88357f873680873680863781863781863882853983853983853a84843a84843b85843c85833c86833d86823d87823e88823f88813f8981408981408a80418a80428b7f428c7f438c7f448d7e448d7e458e7d468f7d478f7d47907c48917c49917b49927b4a937a4b937a4c947a4c95794d95794e96784f9778509877509877519976529a76539b75549b75559c74569d74579e73579f7358a07259a0725aa1715ba2715ca3705da4705ea56f5fa66f60a76e62a86e63a96d64aa6d65ab6c66ac6c67ad6b69ae6b6aaf6a6bb06a6db1696eb26970b36971b46973b56874b66876b76878b96879ba687bbb687dbc687fbd6881bf6883c06885c16987c26989c36a8cc56a8ec66b90c76c93c86d95ca6e98cb6f9acc709ccd729fce73a2cf74a4d176a7d278a9d379acd47baed57db1d67fb3d781b5d883b8d985bada87bcdb89bfdc8bc1dc8dc3dd90c5de92c7df94c9e096cbe098cde19bcfe29dd1e39fd3e3a1d5e4a3d7e5a5d8e5a8dae6aadce7acdde7aedfe8b0e0e8b2e2e9b4e3eab6e5eab8e6ebbae8ebbce9ecbeeaedbfebedc1edeec3eeeec5efefc6f0efc8f1f0caf3f0cbf4f1cdf5f1cff6f2d0f7f2d2f8f3d3f9f3d5faf3d6fbf4d7fcf4d9'.match(/.{6}/g).map((h) => '#' + h);
  NAVIA[0] = '#000000';
  // The log-like remap of Fuderer et al.: linear up to upLev/e, logarithmic above it, so short and long T2 get similar
  // colour resolution. Returns the colour shown at each of 256 steps from loLev to upLev.
  function logRemap(table, loLev, upLev) {
    const n = table.length, a = Math.exp(-1) * upLev, m = Math.max(a, loLev);
    const b = (a < loLev ? 1 / n : (a - loLev) / (2 * a - loLev) + 1 / n) + 1e-7;
    const logPortion = 1 / (Math.log(m) - Math.log(upLev));
    return table.map((_, g) => {
      if (g === 0) return table[0];
      const x = (g + 1) * (upLev - loLev) / n + loLev;
      let f = 0;
      if (x > m) f = n * ((Math.log(m) - Math.log(x)) * logPortion * (1 - b) + b);
      else if (loLev < a && x > loLev) f = n * ((x - loLev) / (a - loLev) * (b - 1 / n)) + 1;
      else f = 1;
      return table[Math.min(n, 1 + Math.floor(f)) - 1];
    });
  }
  const LO = 80, HI = 140;  // ms: brackets brain tissue (about 89 to 118 ms here), so Navia's shades go to WM vs GM; fluid saturates
  const remapped = logRemap(NAVIA, LO, HI);
  const naviaScale = remapped.map((c, k) => [k / (remapped.length - 1), c]);
  // As in the recommendation: invalid (0) values sit below the range (black); values just above 0 but below the
  // range are lifted to its first valid colour, so they do not read as invalid.
  const eps = (HI - LO) / NAVIA.length;
  const clip = (v) => (v === null ? null : v < eps ? LO - eps : v < LO + eps ? LO + 1.5 * eps : v);
  const draw = () => {
    if (slide.dataset.drawn) return;
    slide.dataset.drawn = '1';
    window.Plotly.newPlot(slide.querySelector('.t2w-plot'), [{
      type: 'heatmap', z: masked(t2w.z), colorscale: t2w.colorscale, showscale: false, hoverongaps: false,
      hovertemplate: 'signal = %{z:.0f} (arbitrary units)<extra></extra>',
    }], layout(), config);
    window.Plotly.newPlot(slide.querySelector('.t2map-plot'), [{
      type: 'heatmap', z: masked(map.z).map((row) => row.map(clip)), customdata: masked(map.z),
      colorscale: naviaScale, zmin: LO, zmax: HI, hoverongaps: false,
      hovertemplate: 'T<sub>2</sub> = %{customdata:.0f} ms<extra></extra>',
      colorbar: { title: { text: 'T<sub>2</sub> (ms)' }, thickness: 14, len: 0.9 },
    }], layout(), config);
  };
  window.Reveal.on('slidechanged', (e) => { if (e.currentSlide === slide) draw(); });
  window.Reveal.on('ready', (e) => { if (e.currentSlide === slide) draw(); });
  if (window.Reveal.isReady() && window.Reveal.getCurrentSlide() === slide) draw();
})();
