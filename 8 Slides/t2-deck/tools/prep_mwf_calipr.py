#!/usr/bin/env python3
"""Prepare Exercise 2-4's data, once: one axial slice of a human brain multi-echo spin echo scan at 3 T, a T2
distribution per pixel, and the authors' own MWF map of the same slice. The result is published in the
qMRLab/mooc-data release that tools/fetch_mwf_data.py downloads at build time.

Source: Dvorak AV, et al., "CALIPR Framework Myelin Water Imaging Supporting Data", Zenodo,
https://doi.org/10.5281/zenodo.8049179 (CC BY 4.0), from Dvorak et al., Sci Adv 2023;9:eadh9853. Healthy volunteer 2,
first brain scan: 3D multi-echo spin echo (CALIPR), Philips 3 T, 56 echoes 6 ms apart (TE = 6 ... 336 ms), TR = 1252 ms,
acquired at 1.7 mm and reconstructed at 1 mm. The authors' MWF map (their regularized NNLS, MW = T2 below 40 ms) is
given in the volunteer's T1-weighted space; it is resampled here onto the echo images' grid with the two NIfTI headers.

Changes made here: one slice, cropped to the brain, and a T2 distribution fitted to each pixel, as for the sheep data
(tools/prep_mwf_sheep.py): non-negative least squares on an extended phase graph (EPG) basis, with the refocusing angle
fitted per pixel and then smoothed over the brain (an 11 x 11 median), a constant offset for the magnitude noise floor, and mild Tikhonov smoothing (the misfit grows by at
most 2%).

Usage (from the t2-deck folder; the downloads go in the folder given, which should be a new, empty one):
    python3 -I tools/prep_mwf_calipr.py path/to/download/folder

Writes data/mwf-human-2-4/: NIfTI files, the fit settings (fit.json), a README and the license notice. Zip that folder
and publish it in qMRLab/mooc-data (see tools/fetch_mwf_data.py for the address and checksum the build expects).
"""
import gzip
import hashlib
import importlib.util
import json
import sys
import urllib.request
from pathlib import Path

import nibabel as nib
import numpy as np
from nibabel.processing import resample_from_to
from scipy import ndimage
from scipy.optimize import nnls

DECK = Path(__file__).resolve().parents[1]
RELEASE = DECK / "data" / "mwf-human-2-4"
ZENODO = "https://zenodo.org/records/8049179/files/"
FILES = {
    "echoes": "calipr_repro_c02_brain_calipr_1.nii.gz",
    "mwf": "calipr_repro_c02_brain_calipr_1_DK2_MWF_t1wWarpedMasked.nii.gz",
}
SOURCE = {
    "dataset": "Dvorak AV (2023). CALIPR Framework Myelin Water Imaging Supporting Data [Data set]. Zenodo. "
               "https://doi.org/10.5281/zenodo.8049179",
    "paper": "Dvorak AV, Kumar D, Zhang J, et al. The CALIPR framework for highly accelerated myelin water imaging with "
             "improved precision and sensitivity. Sci Adv. 2023;9:eadh9853. https://doi.org/10.1126/sciadv.adh9853",
    "license": "CC BY 4.0, https://creativecommons.org/licenses/by/4.0/",
}
CHANGES = ("one axial slice (22 of 100) of healthy volunteer 2's first brain scan; cropped to the brain; the authors' MWF "
           "map (DK2) resampled from T1-weighted space onto the echo images' grid; T2 distributions, refocusing angles "
           "and noise floors fitted per pixel (NNLS on an EPG basis)")
SLICE = 22                                   # through the genu and splenium of the corpus callosum
ESP = 6.0                                    # ms between echoes (the first echo is at 6 ms)
T1 = 1000.0                                  # ms, for the EPG basis (it barely matters here)
T2 = np.logspace(np.log10(4), np.log10(2000), 60)   # the distribution's T2 values, ms
ANGLES = np.arange(110, 181, 5)              # refocusing angles tried, degrees

# The sheep script's EPG recursion, so both datasets are fitted the same way.
_spec = importlib.util.spec_from_file_location("prep_mwf_sheep", Path(__file__).with_name("prep_mwf_sheep.py"))
_sheep = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_sheep)
epg_decay = _sheep.epg_decay


def download(folder):
    """The two files from Zenodo, checked against the md5 Zenodo lists."""
    with urllib.request.urlopen("https://zenodo.org/api/records/8049179") as r:
        listed = {f["key"]: f["checksum"].removeprefix("md5:") for f in json.load(r)["files"]}
    paths = {}
    for key, name in FILES.items():
        path = folder / name
        if not path.exists():
            urllib.request.urlretrieve(ZENODO + name + "?download=1", path)
        digest = hashlib.md5(path.read_bytes()).hexdigest()
        if digest != listed[name]:
            sys.exit(f"{name}: md5 {digest}, expected {listed[name]}. Delete it and run again.")
        paths[key] = path
    return paths


def load_echoes(path):
    """The echo images are gzipped twice on Zenodo."""
    raw = path.read_bytes()
    while raw[:2] == b"\x1f\x8b":
        raw = gzip.decompress(raw)
    return nib.Nifti1Image.from_bytes(raw)


def write_release(img, mask, spec, alpha, floor, mwf, te):
    """The modified data in NIfTI, with a README and the license notice, ready to publish."""
    RELEASE.mkdir(parents=True, exist_ok=True)
    affine = np.diag([1.0, 1.0, 1.0, 1.0])
    save = lambda a, name: nib.save(nib.Nifti1Image(a.astype(np.float32), affine), RELEASE / name)
    save(img[:, :, None, :], "echoes.nii.gz")
    save(mask[:, :, None], "mask.nii.gz")
    save(spec[:, :, None, :], "t2_distributions.nii.gz")
    save(alpha[:, :, None], "refocusing_angle_deg.nii.gz")
    save(floor[:, :, None], "noise_floor.nii.gz")
    save(mwf[:, :, None], "published_mwf.nii.gz")
    np.savetxt(RELEASE / "te_ms.txt", te, fmt="%g")
    np.savetxt(RELEASE / "t2_ms.txt", T2, fmt="%.3f")
    (RELEASE / "fit.json").write_text(json.dumps({
        "model": "NNLS on an EPG (CPMG) basis plus a constant offset; refocusing angle chosen per pixel by least misfit, "
                 "then median-filtered over 11 x 11 pixels; "
                 "Tikhonov smoothing, the most that keeps the misfit within 2% of the unsmoothed fit",
        "esp_ms": ESP, "t1_ms": T1, "refocusing_angles_deg": [int(a) for a in ANGLES], "t2_ms": "t2_ms.txt",
        "published_mwf": "the authors' MWF (DK2): regularized NNLS, myelin water = T2 below 40 ms, IEW = 40 to 200 ms",
    }, indent=2) + "\n")
    (RELEASE / "README.md").write_text(f"""# Human brain multi-echo spin echo slice at 3 T, with T2 distributions and the published MWF (qMRLab mOOC, T2 Exercise 2-4)

Modified from:

> {SOURCE["dataset"]}

Related paper: {SOURCE["paper"]}

License: {SOURCE["license"]}. This modified version is shared under the same license. The original creators do not
endorse this version or its use.

## Changes from the original

{CHANGES}. Made with `tools/prep_mwf_calipr.py` in https://github.com/qMRLab/mooc (8 Slides/t2-deck).

## Files

| File | Contents |
|---|---|
| `echoes.nii.gz` | Magnitude, {img.shape[0]} x {img.shape[1]} x 1 x {img.shape[2]} echoes, 1 mm pixels (acquired at 1.7 mm), 3 T; row 0 is anterior |
| `te_ms.txt` | Echo times, ms ({ESP:g} ms apart: {te[0]:g} to {te[-1]:g} ms) |
| `mask.nii.gz` | The brain (1) |
| `published_mwf.nii.gz` | The authors' MWF map (0 to 1), resampled onto this grid |
| `t2_distributions.nii.gz` | Per pixel, the amplitude at each T2 in `t2_ms.txt` (60 values, 4 to 2000 ms, log spaced) |
| `refocusing_angle_deg.nii.gz` | Per pixel, the fitted refocusing angle, degrees |
| `noise_floor.nii.gz` | Per pixel, the fitted constant offset (the magnitude noise floor), same units as the echoes |
| `fit.json` | The fit settings: echo spacing, T1 of the EPG basis, refocusing angles tried, smoothing rule |

The T2 distributions are non-negative least-squares fits on an extended phase graph basis (T1 = {T1:g} ms) plus a
constant offset for the noise floor, with the refocusing angle chosen per pixel from {ANGLES[0]} to {ANGLES[-1]} degrees, then smoothed (an 11 x 11 median), and
mild Tikhonov smoothing (the misfit grows by at most 2%). They are for teaching, not for quantitative use; the
published MWF map is the authors' own analysis.
""")
    (RELEASE / "LICENSE.txt").write_text(f"""This dataset is a modified version of:

{SOURCE["dataset"]}

licensed under Creative Commons Attribution 4.0 International (CC BY 4.0):
https://creativecommons.org/licenses/by/4.0/

Changes: {CHANGES}.

This modified version is also licensed under CC BY 4.0. You may share and adapt it, provided you give appropriate
credit to the original creators, link to the license, and indicate any changes.
""")


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    folder = Path(sys.argv[1]).resolve()
    folder.mkdir(parents=True, exist_ok=True)
    paths = download(folder)
    echoes = load_echoes(paths["echoes"])
    first = nib.Nifti1Image(np.asarray(echoes.dataobj[..., 0], dtype=np.float32), echoes.affine)
    mwf = resample_from_to(nib.load(paths["mwf"]), first, order=1).get_fdata()[:, :, SLICE]
    # Axial slice, turned so that row 0 is anterior and the image reads as usual (left on the right).
    img = np.rot90(np.asarray(echoes.dataobj[:, :, SLICE, :], dtype=np.float64))
    mwf = np.rot90(mwf)
    ne = img.shape[-1]
    te = ESP * np.arange(1, ne + 1)

    # Brain: where the authors' (brain-masked) map is defined, holes filled, the largest piece; crop with a margin.
    mask = ndimage.binary_fill_holes(mwf > 0)
    lab, _ = ndimage.label(mask)
    mask = lab == (np.argmax(np.bincount(lab.ravel())[1:]) + 1)
    rows, cols = np.where(mask)
    r0, r1, c0, c1 = max(rows.min() - 2, 0), rows.max() + 3, max(cols.min() - 2, 0), cols.max() + 3
    img, mask, mwf = img[r0:r1, c0:c1], mask[r0:r1, c0:c1], np.clip(mwf[r0:r1, c0:c1], 0, 1) * mask[r0:r1, c0:c1]
    h, w = mask.shape

    bases = {a: np.hstack([np.stack([epg_decay(ne, a, ESP, t2, T1) for t2 in T2], axis=1), np.ones((ne, 1))])
             for a in ANGLES}  # last column: the noise floor
    # The refocusing angle varies smoothly over the brain (it follows B1), but one pixel's echoes are too noisy to pin it
    # down: a wrong angle shows up as a spurious peak at the shortest T2. So, as the authors do, fit an angle per pixel,
    # smooth that map (a median over 11 x 11 pixels of brain), then fit each distribution with the smoothed angle.
    nt = len(T2)
    unit = lambda i, j: img[i, j] / max(img[i, j].max(), 1e-12)
    raw = np.full((h, w), np.nan)
    for i, j in zip(*np.where(mask)):
        y = unit(i, j)
        raw[i, j] = min(ANGLES, key=lambda a: nnls(bases[a], y)[1])
    smoothed = ndimage.generic_filter(raw, np.nanmedian, size=11, mode="nearest")
    alpha = np.where(mask, ANGLES[np.abs(ANGLES[None, None, :] - np.nan_to_num(smoothed)[..., None]).argmin(-1)], 0)

    spec, floor = np.zeros((h, w, nt)), np.zeros((h, w))
    mus = np.logspace(-8, 0, 33)
    smooth = np.hstack([np.eye(nt), np.zeros((nt, 1))])  # smooth the distribution, not the floor
    for n, (i, j) in enumerate(zip(*np.where(mask))):
        scale = img[i, j].max()
        if scale <= 0:
            continue
        y = img[i, j] / scale
        A = bases[alpha[i, j]]
        x, r = nnls(A, y)
        chi0 = r ** 2
        for mu in mus:  # the most smoothing that keeps the misfit within 2% of the unsmoothed fit
            xm, _ = nnls(np.vstack([A, np.sqrt(mu) * smooth]), np.concatenate([y, np.zeros(nt)]))
            if np.sum((A @ xm - y) ** 2) > 1.02 * chi0:
                break
            x = xm
        spec[i, j] = x[:nt] * scale
        floor[i, j] = x[nt] * scale
        if n % 5000 == 0:
            print(f"  {n} / {int(mask.sum())} pixels", flush=True)

    write_release(img, mask, spec, alpha, floor, mwf, te)
    print(f"{RELEASE.relative_to(DECK)}/  ({h} x {w} pixels, {int(mask.sum())} in the brain)")


if __name__ == "__main__":
    main()
