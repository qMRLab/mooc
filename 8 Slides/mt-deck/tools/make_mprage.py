#!/usr/bin/env python3
"""Write img/mprage.png: one axial slice of the 2013 Stikov 3 T session's MPRAGE (series 75, `MPRAGE ADNI_iPAT2`,
1 mm isotropic), for the "two timescales" slide: anterior up, cropped square to the head, intensities clipped at the
99.5th percentile. The NIfTI's affine is the identity (the MINC orientation was lost in the conversion), so the
orientation is set by eye: the volume's y index runs from anterior (0) to posterior.

Usage (from the mt-deck folder):
    python3 -I tools/make_mprage.py [--raw path/to/stikov_nikola_20131017_113942] [--slice 90]
"""
import argparse
from pathlib import Path

import nibabel as nib
import numpy as np
from PIL import Image

SUBJECT = "stikov_nikola_20131017_113942"
DEFAULT_RAW = Path.home() / "neuropoly/mooc/problems/FLAIR" / SUBJECT
OUT = Path(__file__).resolve().parent.parent / "img" / "mprage.png"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", default=str(DEFAULT_RAW))
    ap.add_argument("--slice", type=int, default=90, help="axial slice index (inferior to superior)")
    ap.add_argument("--size", type=int, default=560, help="output width and height in pixels")
    args = ap.parse_args()

    img = nib.load(Path(args.raw) / f"{SUBJECT}_75_mri.nii.gz")
    vol = np.asarray(img.dataobj, dtype=float)
    # rows = the y index (anterior at the top), columns = the x index reversed
    sl = vol[:, :, args.slice].T[:, ::-1]
    sl = np.clip(sl / np.percentile(vol, 99.5), 0, 1)

    # square crop around the head (pixels above 8 % of the maximum), with a small margin
    rows, cols = np.nonzero(sl > 0.08)
    cy, cx = (rows.min() + rows.max()) / 2, (cols.min() + cols.max()) / 2
    half = int(max(rows.max() - rows.min(), cols.max() - cols.min()) / 2 + 6)
    y0, x0 = int(round(cy)) - half, int(round(cx)) - half
    pad = np.pad(sl, half)
    crop = pad[y0 + half:y0 + 3 * half, x0 + half:x0 + 3 * half]

    out = Image.fromarray((crop * 255).astype(np.uint8)).resize((args.size, args.size), Image.LANCZOS)
    out.save(OUT, optimize=True)
    print(f"wrote {OUT} ({args.size} px, slice {args.slice})")


if __name__ == "__main__":
    main()
