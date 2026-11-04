// Interactive figures for the B0 chapter, embedded with MyST's {anywidget}
// directive. Each figure runs its notebook's Python in the browser with
// Pyodide (numpy only) and draws it with plotly.js, so it works on the static
// site with no Python server. The directive's JSON body picks the figure:
//
//   :::{anywidget} ./5 B0 Mapping/widgets/b0-figures.mjs
//   :css: ./5 B0 Mapping/widgets/b0-figures.css
//   {"figure": "kspace-epi"}
//   :::
//
//   kspace-epi        Figure 5.5   (from Notebooks/Figure-5-1-5.ipynb)
//   phase-unwrapping  Figure 5.12  (from Notebooks/Figure-5-3-3.ipynb, was a Dash app)
//
// The Python below is the notebooks' maths, kept in sync by hand.

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PLOTLY_URL = "https://cdn.jsdelivr.net/npm/plotly.js-dist-min@2.35.2/plotly.min.js";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

// One Pyodide per page, shared by every widget.
function getPyodide() {
  if (!globalThis.__moocPyodide) {
    globalThis.__moocPyodide = (async () => {
      const { loadPyodide } = await import(/* @vite-ignore */ PYODIDE_BASE + "pyodide.mjs");
      const pyodide = await loadPyodide({ indexURL: PYODIDE_BASE });
      await pyodide.loadPackage("numpy");
      return pyodide;
    })().catch((err) => {
      globalThis.__moocPyodide = undefined; // allow a retry
      throw err;
    });
  }
  return globalThis.__moocPyodide;
}

// plotly.js ships as a UMD bundle (jsdelivr's "+esm" conversion of it fails to
// parse), so load it with a script tag. Hide any AMD loader while it runs so
// the bundle sets window.Plotly instead of registering an AMD module.
function getPlotly() {
  if (globalThis.Plotly?.newPlot) return Promise.resolve(globalThis.Plotly);
  if (!globalThis.__moocPlotly) {
    globalThis.__moocPlotly = new Promise((resolve, reject) => {
      const amd = globalThis.define;
      globalThis.define = undefined;
      const script = document.createElement("script");
      script.src = PLOTLY_URL;
      script.async = true;
      const restore = () => { if (amd !== undefined) globalThis.define = amd; };
      script.onload = () => {
        restore();
        globalThis.Plotly?.newPlot ? resolve(globalThis.Plotly) : reject(new Error("plotly.js did not load"));
      };
      script.onerror = () => {
        restore();
        globalThis.__moocPlotly = undefined; // allow a retry
        reject(new Error("could not download plotly.js"));
      };
      document.head.appendChild(script);
    });
  }
  return globalThis.__moocPlotly;
}

// MyST renders anywidgets inside a shadow root, but plotly.js writes its CSS
// (layer stacking, legend, hover) into <style id="plotly.js-style-global"> in
// the main document, which does not reach into the shadow root. Copy it in.
function adoptPlotlyStyles(el) {
  const root = el.getRootNode();
  if (root === document || root.querySelector?.("style[data-plotly-copy]")) return;
  const global = document.getElementById("plotly.js-style-global");
  if (!global?.sheet) return;
  const style = document.createElement("style");
  style.dataset.plotlyCopy = "";
  style.textContent = [...global.sheet.cssRules].map((r) => r.cssText).join("\n");
  root.appendChild(style);
}

// Python plotly's default look, so these match the other notebook figures
// (which also stay light when the site is in dark mode).
const THEME = {
  paper_bgcolor: "#ffffff",
  plot_bgcolor: "#E5ECF6",
  font: { color: "#2a3f5f" },
  colorway: ["#636efa", "#EF553B", "#00cc96"],
  autosize: true,
  xaxis: { gridcolor: "white", zeroline: false },
  yaxis: { gridcolor: "white", zeroline: false },
};

function themed(layout) {
  return {
    ...THEME,
    ...layout,
    xaxis: { ...THEME.xaxis, ...layout.xaxis },
    yaxis: { ...THEME.yaxis, ...layout.yaxis },
  };
}

const PLOT_CONFIG = { displayModeBar: false, responsive: true };

function escapeHtml(s) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

// Builds the shared frame of a figure (stage, status line, controls slot and
// the "Python code" disclosure), then waits until the figure is near the
// screen before downloading Pyodide (~10 MB) and running the Python.
function mountFigure(host, { stageClass, python, label, onReady }) {
  // Append, don't overwrite: MyST has already put the widget's stylesheet in host.
  const el = document.createElement("div");
  el.className = "b0w-root";
  host.appendChild(el);
  el.innerHTML = `
    <div class="b0w-stage ${stageClass}" role="group" aria-label="${label}">
      <p class="b0w-status" role="status">Waiting to load…</p>
    </div>
    <div class="b0w-controls" hidden></div>
    <details class="b0w-code">
      <summary>Python code (runs in your browser with Pyodide)</summary>
      <pre><code>${escapeHtml(python)}</code></pre>
    </details>`;
  const stage = el.querySelector(".b0w-stage");
  const controls = el.querySelector(".b0w-controls");
  const status = el.querySelector(".b0w-status");

  let disposed = false;
  let cleanup = () => {};

  const start = async () => {
    try {
      status.textContent = "Loading Python (Pyodide) and numpy…";
      const [pyodide, Plotly] = await Promise.all([getPyodide(), getPlotly()]);
      status.textContent = "Running Python…";
      const data = JSON.parse(await pyodide.runPythonAsync(python));
      if (disposed) return;
      status.remove();
      cleanup = (await onReady({ el, stage, controls, Plotly, data })) ?? cleanup;
      adoptPlotlyStyles(el);
      controls.hidden = false;
    } catch (err) {
      console.error(`${label}:`, err);
      status.textContent = `Could not load this figure (${err?.message ?? err}). Reload the page to try again.`;
      status.classList.add("b0w-error");
    }
  };

  let io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        start();
      }
    }, { rootMargin: "600px 0px" });
    io.observe(el);
  } else {
    start();
  }

  return () => {
    disposed = true;
    io?.disconnect();
    cleanup();
    el.remove();
  };
}

// ---------------------------------------------------------------------------
// Figure 5.5: k-space trajectory of an EPI readout, with and without a
// parasitic phase-encoding gradient (from Figure-5-1-5.ipynb).
// ---------------------------------------------------------------------------

const KSPACE_PYTHON = `import json
import numpy as np

GYRO_BAR_RATIO_H = 42.6e6  # [Hz/T]

def calc_dk(gx, gy, dt):
    dkx = GYRO_BAR_RATIO_H * gx * dt
    dky = GYRO_BAR_RATIO_H * gy * dt
    return (dkx, dky)

gy_bad = 100e-6

end_time = 0.0912
n_times = 913
t = np.linspace(0, end_time, n_times)
dt = end_time / n_times
nx = 64
k = np.zeros([n_times, 2])
k_distorted = np.zeros([n_times, 2])
for it in range(1, n_times):

    if it <= 20:
        gx = -40e-3
        gy = -40e-3
    else:
        n_steps = 138
        i = (it - 20) % n_steps
        if i <= 0:
            gx = 0
            gy = 25e-3
        elif i <= nx:
            gx = 25e-3
            gy = 0
        elif i <= nx + 5:
            gx = 0
            gy = 25e-3
        elif i <= (2*nx) + 5:
            gx = -25e-3
            gy = 0
        elif i <= n_steps:
            gx = 0
            gy = 25e-3

    dkx, dky = calc_dk(gx, gy, dt)
    kx = k[it - 1, 0] + dkx
    ky = k[it - 1, 1] + dky
    k[it, :] = [kx, ky]
    dkx, dky = calc_dk(gx, gy + gy_bad, dt)
    kx = k_distorted[it - 1, 0] + dkx
    ky = k_distorted[it - 1, 1] + dky
    k_distorted[it, :] = [kx, ky]

json.dumps(dict(
    t_ms=(t * 1e3).round(3).tolist(),
    k=k.round(2).T.tolist(),
    k_distorted=k_distorted.round(2).T.tolist(),
))
`;

const KSPACE_PLAY_MS = 8000; // full trajectory in ~8 s, like the original animation

function renderKspace(host) {
  return mountFigure(host, {
    stageClass: "b0w-stage-kspace",
    python: KSPACE_PYTHON,
    label: "Figure 5.5, k-space trajectory of an EPI readout",
    onReady: async ({ stage, controls, Plotly, data }) => {
      const [kx, ky] = data.k;
      const [dx, dy] = data.k_distorted;
      const n = kx.length;

      const plot = document.createElement("div");
      plot.className = "b0w-plot";
      stage.appendChild(plot);

      const layout = themed({
        title: { text: "K-space Trajectory", x: 0.5 },
        margin: { l: 30, r: 30, t: 50, b: 30 },
        showlegend: true,
        legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.02, yanchor: "top" },
        xaxis: { range: [-3500, 3500], showticklabels: false, fixedrange: true },
        yaxis: { range: [-3700, 3700], showticklabels: false, fixedrange: true },
      });
      const trace = (x, y, color, name) => ({
        type: "scatter", mode: "lines", x, y, name, line: { color },
        hoverinfo: "skip",
      });
      await Plotly.newPlot(plot, [
        trace(kx, ky, "#636EFA", "Theoretical trajectory"),
        trace(dx, dy, "#fa6363", "Inhomogeneous trajectory"),
      ], layout, PLOT_CONFIG);

      controls.innerHTML = `
        <button type="button" class="b0w-play">Play</button>
        <input class="b0w-range" type="range" min="2" max="${n}" value="${n}"
               aria-label="Time point along the readout">
        <span class="b0w-time" aria-live="off"></span>`;
      const playBtn = controls.querySelector(".b0w-play");
      const range = controls.querySelector(".b0w-range");
      const time = controls.querySelector(".b0w-time");

      let shown = n;
      const show = (count) => {
        count = Math.max(2, Math.min(n, Math.round(count)));
        if (count === shown) return;
        shown = count;
        range.value = String(count);
        time.textContent = `t = ${data.t_ms[count - 1].toFixed(1)} ms`;
        Plotly.restyle(plot, {
          x: [kx.slice(0, count), dx.slice(0, count)],
          y: [ky.slice(0, count), dy.slice(0, count)],
        });
      };
      time.textContent = `t = ${data.t_ms[n - 1].toFixed(1)} ms`;

      let raf = 0;
      let last = 0;
      let progress = 0;
      const stop = () => {
        cancelAnimationFrame(raf);
        raf = 0;
        playBtn.textContent = "Play";
      };
      const tick = (now) => {
        progress += ((now - last) / KSPACE_PLAY_MS) * n;
        last = now;
        show(progress);
        if (shown >= n) stop();
        else raf = requestAnimationFrame(tick);
      };
      playBtn.addEventListener("click", () => {
        if (raf) return stop();
        progress = shown >= n ? 2 : shown; // replay from the start once finished
        show(progress);
        last = performance.now();
        playBtn.textContent = "Pause";
        raf = requestAnimationFrame(tick);
      });
      range.addEventListener("input", () => {
        stop();
        show(Number(range.value));
      });

      return () => {
        cancelAnimationFrame(raf);
        Plotly.purge(plot);
      };
    },
  });
}

// ---------------------------------------------------------------------------
// Figure 5.12: wrapped vs. unwrapped phase as a before/after slider
// (from Figure-5-3-3.ipynb, which was a Dash app).
// ---------------------------------------------------------------------------

const PHASE_PYTHON = `import json
import math
import numpy as np

PI_UNICODE = "\\U0001D70B"

t = np.linspace(0, 3, 1001)
y_unwrapped = t + t**2 - 3 * t**3 + t**4
y_wrapped = np.mod(y_unwrapped, 2 * math.pi)

y_delta = y_unwrapped.max() - y_unwrapped.min()
min_y = y_unwrapped.min() - 2 * math.pi - y_delta * 0.05
max_y = y_unwrapped.max() + 2 * math.pi + y_delta * 0.05

yaxis = dict(
    range=[min_y, max_y], title=dict(text="rad"), fixedrange=True,
    tickmode="array",
    tickvals=[-2*math.pi, -math.pi, 0, math.pi, 2*math.pi, 3*math.pi, 4*math.pi, 5*math.pi],
    ticktext=[f"-2{PI_UNICODE}", f"-{PI_UNICODE}", "0", f"{PI_UNICODE}",
              f"2{PI_UNICODE}", f"3{PI_UNICODE}", f"4{PI_UNICODE}", f"5{PI_UNICODE}"],
)
xaxis = dict(fixedrange=True)

def line(y, name):
    return dict(type="scatter", mode="lines", x=t.tolist(), y=y.tolist(), name=name)

wrapped = dict(
    data=[line(y_wrapped, "Wrapped")],
    layout=dict(title=dict(text="Wrapped", x=0.25), showlegend=True,
                legend=dict(x=0.03, y=0.95), xaxis=xaxis, yaxis=yaxis),
)
unwrapped = dict(
    data=[line(y_unwrapped, "Solution 1"),
          line(y_unwrapped + 2 * math.pi, "Solution 2"),
          line(y_unwrapped - 2 * math.pi, "Solution 3")],
    layout=dict(title=dict(text="Unwrapped", x=0.75), showlegend=True,
                legend=dict(x=0.85, y=0.95), xaxis=xaxis, yaxis=yaxis),
)

json.dumps(dict(wrapped=wrapped, unwrapped=unwrapped))
`;

function renderPhaseUnwrapping(host) {
  return mountFigure(host, {
    stageClass: "b0w-stage-split",
    python: PHASE_PYTHON,
    label: "Figure 5.12, wrapped and unwrapped phase compared with a slider",
    onReady: async ({ stage, controls, Plotly, data }) => {
      stage.insertAdjacentHTML("beforeend", `
        <div class="b0w-plot b0w-layer b0w-after"></div>
        <div class="b0w-plot b0w-layer b0w-before"></div>
        <div class="b0w-handle"><span class="b0w-knob" aria-hidden="true">&#x2194;</span></div>`);
      const before = stage.querySelector(".b0w-before");
      const after = stage.querySelector(".b0w-after");
      const handle = stage.querySelector(".b0w-handle");

      // Both layers need identical margins so the curves line up, and an
      // opaque paper because the wrapped layer is clipped over the other.
      const extra = { margin: { l: 70, r: 30, t: 50, b: 45 }, hovermode: "x unified" };
      await Plotly.newPlot(after, data.unwrapped.data, themed({ ...data.unwrapped.layout, ...extra }), PLOT_CONFIG);
      await Plotly.newPlot(before, data.wrapped.data, themed({ ...data.wrapped.layout, ...extra }), PLOT_CONFIG);

      controls.innerHTML = `
        <span>Wrapped</span>
        <input class="b0w-range" type="range" min="0" max="100" value="50"
               aria-label="Divider position: left shows wrapped phase, right shows unwrapped solutions">
        <span>Unwrapped</span>`;
      const range = controls.querySelector(".b0w-range");

      const setSplit = (pct) => {
        pct = Math.min(100, Math.max(0, pct));
        before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
        handle.style.left = `${pct}%`;
        range.value = String(Math.round(pct));
      };
      setSplit(50);

      const pctFromEvent = (e) => {
        const rect = stage.getBoundingClientRect();
        return ((e.clientX - rect.left) / rect.width) * 100;
      };
      handle.addEventListener("pointerdown", (e) => {
        handle.setPointerCapture(e.pointerId);
        handle.classList.add("b0w-dragging");
        e.preventDefault();
      });
      handle.addEventListener("pointermove", (e) => {
        if (handle.hasPointerCapture(e.pointerId)) setSplit(pctFromEvent(e));
      });
      const endDrag = (e) => {
        if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
        handle.classList.remove("b0w-dragging");
      };
      handle.addEventListener("pointerup", endDrag);
      handle.addEventListener("pointercancel", endDrag);
      range.addEventListener("input", () => setSplit(Number(range.value)));

      return () => {
        Plotly.purge(before);
        Plotly.purge(after);
      };
    },
  });
}

// ---------------------------------------------------------------------------

const FIGURES = {
  "kspace-epi": renderKspace,
  "phase-unwrapping": renderPhaseUnwrapping,
};

function render({ model, el }) {
  const name = model?.get?.("figure") ?? model?.figure;
  const draw = FIGURES[name];
  if (!draw) {
    el.textContent = `Unknown figure "${name}". Expected one of: ${Object.keys(FIGURES).join(", ")}.`;
    return;
  }
  return draw(el);
}

export default { render };
