# regionmerge-unwrap (vendored build)

Region-merging phase unwrapping, after Jenkinson M. *Fast, automated, N-dimensional phase-unwrapping algorithm.*
MRM 2003;49:193–197. Written clean-room from the paper only. The crate's `provenance/` folder records how: the
brief, the prompts, the decisions log and an independent similarity review against FSL's source, which found nothing
to rewrite.

- Source: `regionmerge-unwrap`, commit `37161c34068466b43bb47c2120d6202e990d7b66` ("Accept WebAssembly choices 20-24")
- Built with `wasm-pack build --target web --release` on 2026-11-05
- `regionmerge_unwrap_bg.wasm` SHA-256: `8633ae7fcc0413f899b22081a3a6f8e5f492474a6ce17218a54bebf104049e60`
- Licence: MIT (`LICENSE`)

API: `unwrap2d(phase: Float32Array, nx, ny, mask?: Uint8Array | null, n_intervals = 6)` → `{ unwrapped, labels, mask,
nRegions, fingerprint }`. See `regionmerge_unwrap.d.ts`.
