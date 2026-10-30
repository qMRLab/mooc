/* Helpers shared by the exercise decks' slide scripts (guess.js, build.js, arrows.js): colours, the segmented buttons,
 * run-once-when-shown, and sliders that keep the arrow keys. Copied from brainstorm.html's inline script, which keeps its own. */
const INK = '#1d2733';
const CMAPS = {
  rdbu: [[0, 'rgb(5,48,97)'], [0.1, 'rgb(33,102,172)'], [0.2, 'rgb(67,147,195)'], [0.3, 'rgb(146,197,222)'], [0.4, 'rgb(209,229,240)'], [0.5, 'rgb(247,247,247)'], [0.6, 'rgb(253,219,199)'], [0.7, 'rgb(244,165,130)'], [0.8, 'rgb(214,96,77)'], [0.9, 'rgb(178,24,43)'], [1, 'rgb(103,0,31)']],  // blue = low, red = high
  viridis: [[0, '#440154'], [0.25, '#3b528b'], [0.5, '#21918c'], [0.75, '#5ec962'], [1, '#fde725']],
  gray: [[0, '#000000'], [1, '#ffffff']],
  jet: [[0, '#00007f'], [0.125, '#0000ff'], [0.375, '#00ffff'], [0.625, '#ffff00'], [0.875, '#ff0000'], [1, '#7f0000']],
};

function segToggle(root, attr, onPick) {
  root.querySelectorAll(`[data-${attr}]`).forEach((b) => b.addEventListener('click', () => {
    root.querySelectorAll(`[data-${attr}]`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    onPick(b.dataset[attr]);
  }));
}
function onShow(slide, fn) {
  let done = false;
  const go = () => { if (!done) { done = true; fn(); } };
  if (Reveal.isReady() && Reveal.getCurrentSlide() === slide) go();
  Reveal.on('ready', (e) => { if (e.currentSlide === slide) go(); });
  Reveal.on('slidechanged', (e) => { if (e.currentSlide === slide) go(); });
}
const keepSlider = (el) => el.addEventListener('keydown', (e) => e.stopPropagation());   // arrow keys move the slider, not the slides
