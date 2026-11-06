# B0 Mapping slides (draft)

Lecture deck for the [B0 Mapping chapter](https://qmrlab.org/mooc/b0-mapping) of the qMRLab mOOC (`index.html`, 25 slides). Same static-folder format as the T2 and B1 decks: reveal.js, KaTeX and plotly.js are vendored in `vendor/`, `deck.css` is the shared deck style and `js/nav.js` adds the left and right click zones. Short slides, with the chapter's detail in the speaker notes (**S**); almost every slide carries the book's interactive figure and a 📖 link to it.

- `js/deck.js`: Reveal and KaTeX setup, the 📖 links (from each slide's `data-book` anchor), "Open in new tab" when embedded, and the book figures. Each figure is loaded from `js/figures/` when its slide is current or next to it, then drawn at the book's size and scaled to fit. Buttons in a `.fig-tabs` row swap the figure a host shows (Figures 5.8 and 5.9, which the book shows as two figures each).
- `js/figures/`: the chapter's Plotly figures, written by `tools/extract_book_figures.py` from the notebooks in `5 B0 Mapping/` (rounded to 4 significant digits, one shared theme in `template.js`; see the script). Rerun it after changing a notebook; `--check` tells whether the copies are current.
- `js/b0-widgets.js`: figures computed in the browser: Figure 5.5 (EPI k-space trajectory, Play and a time scrubber), Figure 5.12 (wrapped vs unwrapped phase, a before/after divider) and the ΔTE calculator (Table 5.1). The maths is the notebooks'; the book runs the same Python with Pyodide (`5 B0 Mapping/widgets/b0-figures.mjs`).
- `js/dipole-conv.js` and `js/dipoleConvData.js`: slide 5, the field of a susceptibility map as a convolution with the dipole kernel, computed voxel by voxel in 3D (kernel cut off at 10 voxels): one voxel, a sphere, and a sphere with an interface ⊥ or ‖ to B<sub>0</sub>. The data file holds the 48³ volumes.
- `js/spins.js`: slide 7, the spins behind Figure 5.4's FID in the transverse plane (following its menu), with the demodulated amplitude as a red circle and a time line on the plot.

The book shows the deck on `8 Slides/5 - B0 Mapping.md`, and the deploy workflow copies `index.html`, `deck.css`, `js/` and `vendor/` to `slides/b0/`. Serve the folder over HTTP to try it locally:

```
python3 -m http.server
```
