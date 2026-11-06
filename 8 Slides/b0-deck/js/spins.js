/* Slide 7 (Figure 5.4): the spins behind the plotted FID, in the lab frame: each turns at the Larmor frequency
 * (85.2 Hz, the notebook's) plus its offset, as the FID oscillates. In red, a circle whose radius is the
 * demodulated amplitude: the length of the spins' weighted sum. The spins follow the figure's menu, with the notebook's
 * values (Figure-5-1-4.ipynb): T2 = 0.3 s over 1 s;
 *   Single species    one spin on resonance, weight 100
 *   Two species       plus one at +10 Hz, weight 10
 *   Multiple species  plus 100 spins of weight 1 from +5 to −4.9 Hz (steps of 0.1 Hz)
 * Spins are drawn the same length (their number is the point); line width shows weight. Starts paused at
 * t = 0; at 1× the 1 s of signal plays in 40 s (85 Hz is shown at about 2 turns a second), with a speed
 * slider from 0.25× to 4×. A line on the plot marks the time shown. */
(function () {
  'use strict';
  const T2 = 0.3, F0 = 2e-6 * 42.6e6, PLAY_S = 40, BLUE = '#636EFA', RED = '#EF553B';
  const CASES = {
    one: [{ df: 0, w: 100 }],
    two: [{ df: 0, w: 100 }, { df: 10, w: 10 }],
    many: [{ df: 0, w: 100 }, ...Array.from({ length: 100 }, (_, i) => ({ df: 0.1 * (50 - i), w: 1 }))],
  };

  function init() {
    const panel = document.querySelector('section[data-book="b0plot4"] .spins');
    if (!panel) return;
    const slide = panel.closest('section');
    const host = slide.querySelector('.fig-host');
    const cv = panel.querySelector('.spins-cv'), g = cv.getContext('2d');
    const play = panel.querySelector('.spins-play'), range = panel.querySelector('.spins-t'), label = panel.querySelector('.spins-time');
    const S = cv.width / 220;   // backing pixels per CSS pixel
    const speedIn = panel.querySelector('.spins-speed'), speedOut = panel.querySelector('.spins-speed-v');
    let speed = 1, t = 0, playing = false, last = 0, shownCase = '', shownT = -1;

    // Which menu entry the figure shows (traces 0–2, 3–5, 6–8).
    const caseOf = (plot) => {
      const v = (i) => plot && plot.data && plot.data[i] && plot.data[i].visible;
      return v(3) === true ? 'two' : v(6) === true ? 'many' : 'one';
    };

    function cursor(plot) {
      if (!plot || !plot._fullLayout || !plot._fullLayout.xaxis) return;
      let c = plot.querySelector(':scope > .spins-cursor');
      if (!c) { c = document.createElement('div'); c.className = 'spins-cursor'; plot.appendChild(c); }
      const xa = plot._fullLayout.xaxis, sz = plot._fullLayout._size;
      c.style.left = `${xa._offset + xa.l2p(t)}px`;
      c.style.top = `${sz.t}px`;
      c.style.height = `${sz.h}px`;
    }

    function arrow(x, y, ang, len, width, alpha) {
      const ex = x + len * Math.cos(ang), ey = y - len * Math.sin(ang), h = Math.max(5, 3 * width) * S;
      g.globalAlpha = alpha;
      g.strokeStyle = g.fillStyle = BLUE;
      g.lineWidth = width * S;
      if (width < 2) {   // the many light spins: a line and a dot, as their arrowheads would blur together
        g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); g.stroke();
        g.beginPath(); g.arc(ex, ey, 1.6 * S, 0, 2 * Math.PI); g.fill();
        g.globalAlpha = 1;
        return;
      }
      g.beginPath(); g.moveTo(x, y); g.lineTo(ex - 0.7 * h * Math.cos(ang), ey + 0.7 * h * Math.sin(ang)); g.stroke();
      g.beginPath(); g.moveTo(ex, ey);
      g.lineTo(ex - h * Math.cos(ang - 0.4), ey + h * Math.sin(ang - 0.4));
      g.lineTo(ex - h * Math.cos(ang + 0.4), ey + h * Math.sin(ang + 0.4));
      g.closePath(); g.fill();
      g.globalAlpha = 1;
    }

    function draw(name) {
      const W = cv.width, c = W / 2, R = 92 * S, env = Math.exp(-t / T2), spins = CASES[name];
      g.clearRect(0, 0, W, W);
      // axes of the rotating frame
      g.strokeStyle = '#c9d1db'; g.lineWidth = 1 * S;
      g.beginPath(); g.moveTo(c - R - 8 * S, c); g.lineTo(c + R + 8 * S, c); g.moveTo(c, c + R + 8 * S); g.lineTo(c, c - R - 8 * S); g.stroke();
      g.fillStyle = '#5d6b7c'; g.font = `${13 * S}px "Source Sans Pro", Helvetica, sans-serif`;
      g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText('x', c + R + 10 * S, c);
      g.textAlign = 'center'; g.textBaseline = 'bottom';
      g.fillText('y', c, c - R - 9 * S);
      // spins: the many thin ones first, the heavy one on top
      let sx = 0, sy = 0, sw = 0;
      [...spins].sort((a, b) => a.w - b.w).forEach((s) => {
        const ang = Math.PI / 2 + 2 * Math.PI * (F0 + s.df) * t;
        sx += s.w * Math.cos(ang); sy += s.w * Math.sin(ang); sw += s.w;
        const width = s.w >= 100 ? 3.5 : s.w >= 10 ? 2.2 : 1;
        arrow(c, c, ang, R * env, width, s.w >= 10 ? 1 : 0.45);
      });
      // demodulated amplitude
      const amp = (Math.hypot(sx, sy) / sw) * env;
      g.strokeStyle = RED; g.lineWidth = 2.5 * S;
      g.beginPath(); g.arc(c, c, Math.max(0.5, R * amp), 0, 2 * Math.PI); g.stroke();
    }

    function render(force) {
      const plot = host._plot, name = caseOf(plot);
      if (force || name !== shownCase || t !== shownT) { draw(name); shownCase = name; shownT = t; }
      cursor(plot);
      range.value = String(Math.round(t * 1000));
      label.textContent = `t = ${t.toFixed(3)} s`;
    }

    const setPlaying = (on) => { playing = on; play.textContent = on ? '❚❚ Pause' : '▶ Play'; };
    play.addEventListener('click', () => {
      if (!playing && t >= 1) t = 0;
      setPlaying(!playing);
      last = performance.now();
    });
    speedIn.addEventListener('input', () => {
      speed = 2 ** Number(speedIn.value);
      speedOut.textContent = `${speed}×`;
    });
    range.addEventListener('input', () => { setPlaying(false); t = Number(range.value) / 1000; render(); });

    const isCurrent = () => typeof Reveal === 'undefined' || !Reveal.getCurrentSlide || Reveal.getCurrentSlide() === slide;
    function tick(now) {
      if (isCurrent()) {
        if (playing) {
          t = Math.min(1, t + ((now - last) / 1000 / PLAY_S) * speed);
          if (t >= 1) setPlaying(false);
        }
        render();   // also follows the menu and a redrawn plot
      }
      last = now;
      requestAnimationFrame(tick);
    }
    render(true);
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
