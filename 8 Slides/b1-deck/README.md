# B1 Mapping slides (work in progress)

Slides for the [B1 Mapping chapter](https://qmrlab.org/mooc/b1-mapping) of the qMRLab mOOC: a lecture deck (`index.html`, draft) and a deck of interactive exercises (`exercises.html`). Same static-folder format as the T1 and T2 decks, but the exercises fetch a WebAssembly module, so serve the folder over HTTP (`python3 -m http.server`) rather than opening it from `file://`.

## Exercises (`exercises.html`)

- **Why is B1 not uniform?** B1+ in the Sled & Pike (1998) elliptic phantom at 1.5 or 3 T, with a resistivity slider: the paper's exact Mathieu-function solution, solved live in the browser (`js/sledpike.wasm`, source in `sledpike-rs/`).
- **Orientation:** the same phantom turned inside a fixed circularly polarized coil (3 T).
- **Inter-scan motion and DAM:** place 4–6 receive loops, move the head between the α and 2α scans, register perfectly, and see the receive-coil bias that registration cannot remove (Balbastre et al., MRM 2022).
- **Brain-tuned and MPRAGE head models** (`js/mprage-b1-data-v2.js`: a 128 × 88 slice of tissue labels and solved B1+ maps; `js/b1map-data.js`: a measured B1 map, from the 2013 Stikov 3 T dataset).
- **Frames of reference:** the same B0 + B1 in the laboratory, Larmor and RF frames, in real units (MHz, kHz, µT) drawn to true proportion within each view, with a slow-down control; then one spin and a pulse along ±x′/±y′ of the transmit frame, seen in the receive (Larmor) frame and the transmit frame, with a rectangular or 8 ms Fermi envelope and a "realistic Bloch–Siegert pulse" button.
- **Bloch–Siegert, parts (a)–(d):** an off-resonance Fermi pulse on M along z and in the transverse plane, φ_BS = K_BS·B1², and why the ±4 kHz acquisitions cancel B0 (`js/bs-core.js`: exact Bloch simulation; `js/bs.js`: the T2 lab's sphere drawing). K_BS = 74.0 rad/G² at 4 kHz, as in Sacolick et al. 2010.

## The B1+ solver

`sledpike-rs/` is the Rust source of `js/sledpike.wasm`. Build with

```
cargo build --release --lib --target wasm32-unknown-unknown
cp target/wasm32-unknown-unknown/release/sledpike.wasm ../js/
```

`cargo run --release --bin check` prints the Table I statistics to compare with the paper; `--bin rotcheck` checks the rotated-phantom and motion maps.
