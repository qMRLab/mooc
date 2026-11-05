# volread (vendored build)

Reads NIfTI, MINC1 and MINC2 volumes (optionally gzipped) in the browser, returning the voxel grid scaled to real
units, x fastest, then y, z, frames. A thin wrapper (`tools/volread/`) around the parser of the qMRLab NIfTI
viewer (github.com/qmrlab/viewer, MIT). Used by Exercise 5-2 for MINC files; NIfTI is read by `js/nifti-lite.js`.

- Built with `wasm-pack build --target web --release` on 2026-11-05 from `tools/volread/`
- The viewer: local working tree at commit `2c8709e` **plus uncommitted changes** (its MINC reader, `src/minc.rs`,
  is not committed yet). Pin `tools/volread/Cargo.toml` to a viewer commit once that work is pushed.
- `volread_bg.wasm` SHA-256: `b902950df9709779bfebcd513c0f29f1bbc37bbd83db1ad1cee2ecc226794315`
- Licence: MIT (`LICENSE`)
