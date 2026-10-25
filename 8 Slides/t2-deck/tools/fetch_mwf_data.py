#!/usr/bin/env python3
"""Fetch Exercise 2-4's data from qMRLab/mooc-data and write js/data/mwfData.js, which the slides load.

The data (one slice of human brain at 3 T, with a T2 distribution per pixel and the authors' MWF map, made by
tools/prep_mwf_calipr.py) is CC BY 4.0. At a few MB it is kept out of the repository: the book's deploy workflow runs
this script before copying the deck. The zip is checked against its SHA-256 before use. js/data/ and data/ are
git-ignored.

Usage (from the t2-deck folder):
    python3 -I tools/fetch_mwf_data.py            # download if needed, then write js/data/mwfData.js
    python3 -I tools/fetch_mwf_data.py --force    # download again
"""
import base64
import hashlib
import io
import json
import shutil
import sys
import urllib.request
import zipfile
from pathlib import Path

import nibabel as nib
import numpy as np

DECK = Path(__file__).resolve().parents[1]
URL = "https://github.com/qMRLab/mooc-data/releases/download/v1.4/03-T2-04-MWF-human.zip"
SHA256 = "772279314d488c2486bd9790e2cccb12d7b0df4615cc1d929d74ddaa556dbd34"
NAME = "mwf-human-2-4"               # the folder inside the zip
RELEASE = DECK / "data" / NAME
OUT = DECK / "js" / "data" / "mwfData.js"
START = (118, 70)                    # the pixel the slide starts on: white matter in the splenium of the corpus callosum


def fetch(force=False):
    if RELEASE.exists() and not force:
        return
    with urllib.request.urlopen(URL) as r:
        blob = r.read()
    digest = hashlib.sha256(blob).hexdigest()
    if digest != SHA256:
        sys.exit(f"{URL}: SHA-256 {digest}, expected {SHA256}. Nothing was written.")
    with zipfile.ZipFile(io.BytesIO(blob)) as z:
        names = z.namelist()
        if any(not n.startswith(NAME + "/") or ".." in Path(n).parts for n in names):
            sys.exit(f"{URL}: unexpected paths in the zip. Nothing was written.")
        shutil.rmtree(RELEASE, ignore_errors=True)
        z.extractall(RELEASE.parent)


def b64(a):
    return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()


def build():
    load = lambda name: np.asarray(nib.load(RELEASE / name).dataobj, dtype=np.float64)
    img = load("echoes.nii.gz")[:, :, 0, :]
    mask = load("mask.nii.gz")[:, :, 0] > 0
    spec = load("t2_distributions.nii.gz")[:, :, 0, :]
    alpha = load("refocusing_angle_deg.nii.gz")[:, :, 0]
    floor = load("noise_floor.nii.gz")[:, :, 0]
    published = load("published_mwf.nii.gz")[:, :, 0]
    t2 = np.loadtxt(RELEASE / "t2_ms.txt")
    fit = json.loads((RELEASE / "fit.json").read_text())
    h, w, ne = img.shape

    # Echoes as 8-bit on a square-root scale (finer steps for the weak late echoes); distributions as 8-bit of each
    # pixel's peak. Plenty for the slides, and a few MB instead of the full-precision data.
    smax = np.percentile(img[mask, 0], 99.5)
    q = np.round(255 * np.sqrt(np.clip(img / smax, 0, 1))).astype(np.uint8)
    peak = spec.max(axis=2)
    spec_q = np.where(peak[..., None] > 0, np.round(255 * spec / np.maximum(peak[..., None], 1e-12)), 0).astype(np.uint8)

    data = {
        "source": "Dvorak et al. 2023, Zenodo, doi:10.5281/zenodo.8049179 (CC BY 4.0); volunteer 2, brain scan 1, slice 22; cropped, 8-bit",
        "w": int(w), "h": int(h), "ne": int(ne), "esp": float(fit["esp_ms"]), "t1": float(fit["t1_ms"]),
        "t2": [round(float(t), 3) for t in t2],
        "echoes": b64(q),                                  # uint8 [row][col][echo]; signal = (q/255)^2 * smax
        "smax": float(smax),
        "mask": b64(mask.astype(np.uint8)),                # uint8 [row][col]
        "spec": b64(spec_q),                               # uint8 [row][col][t2]; amplitude = spec/255 * peak
        "peak": b64(peak.astype(np.float32)),              # float32 [row][col]
        "alpha": b64(np.round(alpha).astype(np.uint8)),    # refocusing angle, degrees
        "floor": b64(floor.astype(np.float32)),            # float32 [row][col]: the fitted noise floor
        "published": b64(np.round(250 * np.clip(published, 0, 1)).astype(np.uint8)),  # the authors' MWF x 250
        "start": list(START),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        "// Exercise 2-4's data, written by tools/fetch_mwf_data.py from qMRLab/mooc-data. Do not edit.\n"
        "// Human brain, multi-echo spin echo at 3 T: Dvorak et al., CALIPR Framework Myelin Water Imaging Supporting Data,\n"
        "// Zenodo, https://doi.org/10.5281/zenodo.8049179, CC BY 4.0. Changed: one slice, cropped, 8-bit, T2 fits added.\n"
        f"window.MWFData = {json.dumps(data)};\n"
    )
    print(f"{OUT.relative_to(DECK)}  {OUT.stat().st_size / 1024:.0f} KB  ({h} x {w} pixels, {int(mask.sum())} in the tissue)")


if __name__ == "__main__":
    fetch(force="--force" in sys.argv[1:])
    build()
