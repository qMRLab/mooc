#!/usr/bin/env python3
"""Write js/phantom/brainT2w.js: T1, T2 and PD maps of one axial brain slice, for the lecture slide that simulates a
T2-weighted spin echo image.

Anatomy: the 2D axial tissue-label slice of KomaMRI's brain phantom (KomaMRIBase/src/datatypes/phantom/brain2D.mat,
https://github.com/JuliaHealth/KomaMRI.jl, MIT license), itself from the BrainWeb digital brain phantoms
(Aubert-Broche et al., NeuroImage 2006; Cocosco et al., NeuroImage 1997; https://brainweb.bic.mni.mcgill.ca).
Tissue values: our choice for 3 T, below, with sources. The 0.5 mm labels are turned into T1, T2 and PD maps, then
averaged over 2 x 2 pixels (1 mm), which also gives some partial volume at the boundaries.

Usage (from the t2-deck folder):
    python3 -I tools/prep_t2w_phantom.py
"""
import base64
import io
import json
import urllib.request
from pathlib import Path

import numpy as np
import scipy.io as sio

DECK = Path(__file__).resolve().parents[1]
OUT = DECK / "js" / "phantom" / "brainT2w.js"
KOMA = "3110ce13377e5b9fa6d7385aa18647c7ea617a1d"  # KomaMRI.jl commit
URL = f"https://raw.githubusercontent.com/JuliaHealth/KomaMRI.jl/{KOMA}/KomaMRIBase/src/datatypes/phantom/brain2D.mat"

# label: (tissue, PD, T1 ms, T2 ms) at 3 T. WM, GM: Stanisz et al., MRM 2005. Fat, muscle, marrow: Gold et al., AJR 2004.
# CSF: about 4 s and 2 s (e.g. Lu et al., JMRI 2005). Skull: no signal. Vessels: dark, as flowing blood is in spin echo.
# Skin, dura: rough values. Proton densities are relative to CSF.
TISSUES = {
    23: ("CSF", 1.00, 4000, 2000),
    46: ("GM", 0.80, 1820, 99),
    70: ("WM", 0.69, 1084, 69),
    93: ("fat", 0.90, 371, 133),
    116: ("muscle", 0.75, 1420, 32),
    139: ("skin/muscle", 0.75, 1200, 40),
    162: ("skull", 0.00, 0, 0),
    185: ("vessels", 0.00, 0, 0),
    209: ("fat", 0.90, 371, 133),
    232: ("dura", 0.70, 1000, 80),
    255: ("marrow", 0.85, 365, 50),
}


def b64(a):
    return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()


def main():
    with urllib.request.urlopen(URL) as r:
        labels = sio.loadmat(io.BytesIO(r.read()))["axial"]
    pd, t1, t2 = (np.zeros(labels.shape) for _ in range(3))
    for label, (_, p, a, b) in TISSUES.items():
        sel = labels == label
        pd[sel], t1[sel], t2[sel] = p, a, b

    # 2 x 2 averages (1 mm). Average the relaxation *rates*, weighted by PD, so a boundary pixel decays like its mix.
    def down(a):
        h, w = (a.shape[0] // 2) * 2, (a.shape[1] // 2) * 2
        return a[:h, :w].reshape(h // 2, 2, w // 2, 2).mean(axis=(1, 3))
    pd1 = down(pd)
    rate = lambda t: np.where(t > 0, 1 / np.maximum(t, 1e-9), 0)
    with np.errstate(invalid="ignore", divide="ignore"):
        r1 = down(pd * rate(t1)) / pd1
        r2 = down(pd * rate(t2)) / pd1
    t1m = np.where(pd1 > 0, 1 / np.maximum(r1, 1e-9), 0)
    t2m = np.where(pd1 > 0, 1 / np.maximum(r2, 1e-9), 0)
    # crop to the head, with a small margin
    rows, cols = np.where(pd1 > 0)
    sl = (slice(max(rows.min() - 3, 0), rows.max() + 4), slice(max(cols.min() - 3, 0), cols.max() + 4))
    pd1, t1m, t2m = pd1[sl], t1m[sl], t2m[sl]
    h, w = pd1.shape

    data = {
        "w": int(w), "h": int(h), "mm": 1.0,
        "pd": b64(np.round(pd1 * 1000).astype(np.uint16)),   # PD x 1000, uint16 [row][col]
        "t1": b64(np.round(t1m).astype(np.uint16)),          # ms
        "t2": b64(np.round(t2m).astype(np.uint16)),          # ms
        "tissues": {str(k): v[0] for k, v in TISSUES.items()},
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        "// T1, T2 and PD maps of one axial brain slice at 3 T, written by tools/prep_t2w_phantom.py. Do not edit.\n"
        "// Anatomy: KomaMRI's brain phantom (MIT license, https://github.com/JuliaHealth/KomaMRI.jl), from the BrainWeb\n"
        "// digital brain phantoms (Aubert-Broche et al. 2006; https://brainweb.bic.mni.mcgill.ca). Tissue values: see the script.\n"
        f"window.BrainT2w = {json.dumps(data)};\n"
    )
    print(f"{OUT.relative_to(DECK)}  {OUT.stat().st_size / 1024:.0f} KB  ({h} x {w} pixels)")


if __name__ == "__main__":
    main()
