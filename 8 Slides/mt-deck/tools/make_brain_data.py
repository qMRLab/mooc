#!/usr/bin/env python3
"""Write js/data/brain.js: one axial slice of a healthy brain at 3 T with its qMT data and maps, for the MT slides.

Data: the 2013 Stikov 3 T session (the B0 and B1 decks' dataset), qMT-SPGR protocol of Boudreau, Stikov & Pike
(MRM 2018, doi:10.1002/mrm.26673), which is qMRLab's default qMT-SPGR protocol: 2D SPGR, 7°, TR 25 ms, one 5 mm
slice, 2 x 2 mm; Gauss-Hann MT pulse of 10.24 ms at 142° and 426°, offsets 443, 1088, 2732, 6862 and 17235 Hz.

- The normalized MT data (MT-on / MT-off, 10 points per voxel), the brain mask and the qMRLab qMT-SPGR fit
  (Sled & Pike model: F, kf, T2f, T2r) with its input maps (B0 in Hz, B1 relative, measured R1 in 1/s) are the
  book's: `06-MT-01-qMT.zip` of qMRLab/mooc-data (release v1.1), results/realData/*.mat, as used by the chapter's
  Figure 6.7. Downloaded to a temporary folder unless --book points to the extracted `realData` folder.
- The MT-off image (anatomy, for display only) is series 52 (`qmtspgr_uk`, dynamic 1 of 11) of the raw session,
  read from --raw (default: the B0 deck's path). Optional: without it the deck shows the F map instead.

The slice is cropped to the brain (plus a 2-voxel margin); values outside the mask are null. Numbers are rounded to
what the slides show.

Usage (from the mt-deck folder):
    python3 -I tools/make_brain_data.py [--book path/to/realData] [--raw path/to/stikov_nikola_20131017_113942]
"""
import argparse
import io
import json
import tempfile
import urllib.request
import zipfile
from pathlib import Path

import numpy as np
import scipy.io as sio

DECK = Path(__file__).resolve().parents[1]
OUT = DECK / "js" / "data" / "brain.js"
BOOK_ZIP = "https://github.com/qMRLab/mooc-data/releases/download/v1.1/06-MT-01-qMT.zip"
DEFAULT_RAW = Path.home() / "neuropoly/mooc/repos/mooc_b1_class/stikov_nikola_20131017_113942"
SUBJECT = "stikov_nikola_20131017_113942"
MARGIN = 2

MAPS = {  # name in the deck: (file, variable, scale, decimals)
    "F": ("FmapMAT.mat", "FmapMAT", 1, 4),
    "kf": ("kfmapMAT.mat", "kfmapMAT", 1, 3),
    "T2f": ("T2fmapMAT.mat", "T2f", 1e3, 2),   # ms
    "T2r": ("T2rmapMAT.mat", "T2r", 1e6, 2),   # µs
    "R1": ("r1mapMAT.mat", "r1mapMAT", 1, 3),   # measured R1, 1/s
    "B0": ("b0mapMAT.mat", "b0mapMAT", 1, 1),   # Hz
    "B1": ("b1mapMAT.mat", "b1mapMAT", 1, 3),
    "resnorm": ("resnormmapMAT.mat", "resnormmapMAT", 1, 5),
}


def book_folder(arg):
    if arg:
        return Path(arg), None
    tmp = tempfile.TemporaryDirectory()
    with urllib.request.urlopen(BOOK_ZIP) as r:
        zipfile.ZipFile(io.BytesIO(r.read())).extractall(tmp.name)
    hits = [p for p in Path(tmp.name).rglob("realData") if p.is_dir() and "__MACOSX" not in p.parts]
    if not hits:
        raise SystemExit("No results/realData folder in the book's zip.")
    return hits[0], tmp


def grid(a, mask, dec):
    out = []
    for row, mrow in zip(a, mask):
        out.append([round(float(v), dec) if m and np.isfinite(v) else None for v, m in zip(row, mrow)])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--book")
    ap.add_argument("--raw", default=str(DEFAULT_RAW))
    args = ap.parse_args()
    folder, tmp = book_folder(args.book)
    # The book's arrays (88 x 128) are the raw slice (128 x 88, rows anterior -> posterior) transposed and mirrored:
    # book = raw.T[:, ::-1]. Put them back on the raw grid, anterior up when row 0 is drawn at the top.
    orient = lambda a: np.ascontiguousarray(a[:, ::-1, ...].swapaxes(0, 1))
    load = lambda f, k: orient(np.asarray(sio.loadmat(folder / f)[k], dtype=float))
    mask = load("maskMAT.mat", "maskMAT") > 0
    ys, xs = np.where(mask)
    r0, r1 = max(ys.min() - MARGIN, 0), min(ys.max() + MARGIN + 1, mask.shape[0])
    c0, c1 = max(xs.min() - MARGIN, 0), min(xs.max() + MARGIN + 1, mask.shape[1])
    crop = lambda a: a[r0:r1, c0:c1]
    m = crop(mask)
    data = {"w": int(c1 - c0), "h": int(r1 - r0), "mask": ["".join("1" if v else "0" for v in row) for row in m]}
    mt = load("mtdataMAT.mat", "mtdataMAT")[:, :, 0, :]
    data["mt"] = [grid(crop(mt[:, :, i]), m, 3) for i in range(mt.shape[2])]
    for name, (f, k, scale, dec) in MAPS.items():
        data[name] = grid(crop(load(f, k)) * scale, m, dec)
    raw = Path(args.raw)
    s0_file = raw / f"{SUBJECT}_52d1_mri.mnc"
    if s0_file.exists():
        import nibabel as nib
        s0 = crop(np.asarray(nib.load(s0_file).dataobj, dtype=float)[0])  # already on the raw grid
        s0 = s0 / np.percentile(s0[m], 99)
        data["S0"] = [[round(float(v), 3) for v in row] for row in np.clip(s0, 0, 1.2)]
    else:
        print(f"(no raw MT-off image at {s0_file}; S0 left out)")
    data["protocol"] = {
        "offsets": [443, 1088, 2732, 6862, 17235], "angles": [142, 426], "order": "offset-major: (443,142), (443,426), ...",
        "tr": 0.025, "flipAngle": 7, "pulse": {"shape": "gausshann", "duration": 0.01024},
    }
    text = json.dumps(data, separators=(",", ":"), ensure_ascii=False)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        "// One slice of the 2013 Stikov 3 T qMT session, written by tools/make_brain_data.py. Do not edit.\n"
        f"window.MTBrain = {text};\n"
    )
    print(f"{OUT.relative_to(DECK)}  {data['w']}x{data['h']}  {m.sum()} voxels  {len(text) / 1024:.0f} KB")
    if tmp:
        tmp.cleanup()


if __name__ == "__main__":
    main()
