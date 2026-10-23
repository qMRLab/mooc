#!/usr/bin/env python3
"""Prepare Exercise 2-4's data, once: one slice of a multi-echo spin echo scan of sheep brain, and a T2 distribution per
pixel. The result is published in the qMRLab/mooc-data release that tools/fetch_mwf_data.py downloads at build time.

Source: Murguia et al., "Data for 'Impact of Tissue Sample Preparation Methods on Myelin-Sensitive Quantitative MR
Imaging'", University of Michigan Deep Blue Data, https://doi.org/10.7302/dp7t-c323 (CC BY-NC 4.0). Sample S1 (B4AS1),
fresh, slice 3 of 5: 128 x 128, 0.27 mm pixels, 2 mm thick, 104 echoes 5 ms apart (TE = 5 ... 520 ms), 7 T.

Changes made here: magnitude only, one slice, cropped to the tissue, and a T2 distribution fitted to each pixel. The fit is non-negative least squares on an extended phase graph (EPG) basis, with
the refocusing angle fitted per pixel (it is below 180° at 7 T, which makes echo 2 brighter than echo 1 in places; a
plain exponential basis would turn that into a spurious short-T2 peak), a constant offset for the magnitude noise floor
(without it, the floor shows up as a long-T2 blip), and mild Tikhonov smoothing chosen so that the misfit grows by at
most 2% over the unsmoothed fit.

Usage (from the t2-deck folder; data.mat is sheep_data_paper/fresh_thawed/B4AS1/fresh/data.mat from the zip):
    python3 -I tools/prep_mwf_sheep.py path/to/data.mat

Writes data/mwf-sheep-2-4/: NIfTI files, the fit settings (fit.json), a README and the license notice. Zip that folder
and publish it in qMRLab/mooc-data (see tools/fetch_mwf_data.py for the address and checksum the build expects).
"""
import json
import sys
from pathlib import Path

import nibabel as nib
import numpy as np
import scipy.io as sio
from scipy import ndimage
from scipy.optimize import nnls

DECK = Path(__file__).resolve().parents[1]
RELEASE = DECK / "data" / "mwf-sheep-2-4"
SOURCE = {
    "dataset": 'Murguia A, Swanson SD, Scheven U, Jacobson A, Nielsen J-F, Fessler JA, Seraji-Bozorgzad N (2025). Data for '
               '"Impact of Tissue Sample Preparation Methods on Myelin-Sensitive Quantitative MR Imaging" [Data set]. '
               'University of Michigan - Deep Blue Data. https://doi.org/10.7302/dp7t-c323',
    "paper": "Murguia A, et al. Impact of tissue sample preparation methods on myelin-sensitive quantitative MR imaging. "
             "Magn Reson Med. 2025. https://doi.org/10.1002/mrm.30623",
    "license": "CC BY-NC 4.0, https://creativecommons.org/licenses/by-nc/4.0/",
}
CHANGES = ("one slice (3 of 5) of sample S1 (B4AS1), fresh; magnitude of the multi-echo spin echo images only; cropped to "
           "the tissue; T2 distributions, refocusing angles and noise floors fitted per pixel (NNLS on an EPG basis)")
SLICE = 2                                    # the middle of the five slices
ESP = 5.0                                    # ms between echoes (the first echo is at 5 ms)
T1 = 1500.0                                  # ms, for the EPG basis (it barely matters here)
T2 = np.logspace(np.log10(5), np.log10(1000), 60)   # the distribution's T2 values, ms
ANGLES = np.arange(110, 181, 5)              # refocusing angles tried, degrees


def epg_decay(n_echoes, alpha_deg, esp, t2, t1):
    """Echo amplitudes of a CPMG train with refocusing angle alpha (the standard EPG recursion, as in DECAES)."""
    a = np.radians(alpha_deg)
    c2, s2, s, c = np.cos(a / 2) ** 2, np.sin(a / 2) ** 2, np.sin(a), np.cos(a)
    e2, e1 = np.exp(-esp / 2 / t2), np.exp(-esp / 2 / t1)
    n = n_echoes + 2
    fp, fm, z = np.zeros(n), np.zeros(n), np.zeros(n)
    fp[0] = 1.0
    out = np.empty(n_echoes)
    for k in range(n_echoes):
        for _ in range(2):  # relax and dephase for esp/2, then refocus (once), then again
            fp, fm, z = fp * e2, fm * e2, z * e1
            fp = np.concatenate([[0.0], fp[:-1]]); fm = np.concatenate([fm[1:], [0.0]]); fp[0] = fm[0]
            if _ == 0:
                fp, fm, z = c2 * fp + s2 * fm + s * z, s2 * fp + c2 * fm - s * z, -0.5 * s * fp + 0.5 * s * fm + c * z
        out[k] = fp[0]
    return out


def write_release(img, mask, spec, alpha, floor, te, esp):
    """The modified data in NIfTI, with a README and the license notice, ready to publish."""
    RELEASE.mkdir(parents=True, exist_ok=True)
    px = 35.0 / 128  # mm: 3.5 cm field of view over 128 pixels
    affine = np.diag([px, px, 2.0, 1.0])
    save = lambda a, name: nib.save(nib.Nifti1Image(a.astype(np.float32), affine), RELEASE / name)
    save(img[:, :, None, :], "echoes.nii.gz")
    save(mask[:, :, None], "mask.nii.gz")
    save(spec[:, :, None, :], "t2_distributions.nii.gz")
    save(alpha[:, :, None], "refocusing_angle_deg.nii.gz")
    save(floor[:, :, None], "noise_floor.nii.gz")
    np.savetxt(RELEASE / "te_ms.txt", te, fmt="%g")
    np.savetxt(RELEASE / "t2_ms.txt", T2, fmt="%.3f")
    (RELEASE / "fit.json").write_text(json.dumps({
        "model": "NNLS on an EPG (CPMG) basis plus a constant offset; refocusing angle chosen per pixel by least misfit; "
                 "Tikhonov smoothing, the most that keeps the misfit within 2% of the unsmoothed fit",
        "esp_ms": esp, "t1_ms": T1, "refocusing_angles_deg": [int(a) for a in ANGLES], "t2_ms": "t2_ms.txt",
    }, indent=2) + "\n")
    (RELEASE / "README.md").write_text(f"""# Sheep brain multi-echo spin echo slice, with T2 distributions (qMRLab mOOC, T2 Exercise 2-4)

Modified from:

> {SOURCE["dataset"]}

Related paper: {SOURCE["paper"]}

License: {SOURCE["license"]}. This modified version is shared under the same license (attribution, non-commercial use only).
The original creators do not endorse this version or its use.

## Changes from the original

{CHANGES}. Made with `tools/prep_mwf_sheep.py` in https://github.com/qMRLab/mooc (8 Slides/t2-deck).

## Files

| File | Contents |
|---|---|
| `echoes.nii.gz` | Magnitude, {img.shape[0]} x {img.shape[1]} x 1 x {img.shape[2]} echoes, {px:.3f} x {px:.3f} x 2 mm, 7 T |
| `te_ms.txt` | Echo times, ms ({esp:g} ms apart: {te[0]:g} to {te[-1]:g} ms) |
| `mask.nii.gz` | The tissue (1) |
| `t2_distributions.nii.gz` | Per pixel, the amplitude at each T2 in `t2_ms.txt` (60 values, 5 to 1000 ms, log spaced) |
| `refocusing_angle_deg.nii.gz` | Per pixel, the fitted refocusing angle, degrees |
| `noise_floor.nii.gz` | Per pixel, the fitted constant offset (the magnitude noise floor), same units as the echoes |
| `fit.json` | The fit settings: echo spacing, T1 of the EPG basis, refocusing angles tried, smoothing rule |

The T2 distributions are non-negative least-squares fits on an extended phase graph basis (T1 = {T1:g} ms) plus a
constant offset for the noise floor, with the refocusing angle chosen per pixel from {ANGLES[0]} to {ANGLES[-1]} degrees and
mild Tikhonov smoothing (the misfit grows by at most 2%). They are for teaching, not for quantitative use.
""")
    (RELEASE / "LICENSE.txt").write_text(f"""This dataset is a modified version of:

{SOURCE["dataset"]}

licensed under Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0):
https://creativecommons.org/licenses/by-nc/4.0/

Changes: {CHANGES}.

This modified version is also licensed under CC BY-NC 4.0. You may share and adapt it for non-commercial purposes,
provided you give appropriate credit to the original creators, link to the license, and indicate any changes.
""")


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    d = sio.loadmat(sys.argv[1], squeeze_me=True, struct_as_record=False, variable_names=["data"])["data"]
    img = np.abs(d.mese.image[:, :, SLICE, :]).astype(np.float64)
    ne = img.shape[-1]
    te = ESP * np.arange(1, ne + 1)

    # Tissue: bright on echo 1, holes filled, the largest piece; crop to it with a small margin.
    e1 = img[:, :, 0]
    mask = ndimage.binary_fill_holes(e1 > 0.25 * np.percentile(e1, 99.5))
    lab, n = ndimage.label(mask)
    mask = lab == (np.argmax(np.bincount(lab.ravel())[1:]) + 1)
    rows, cols = np.where(mask)
    r0, r1, c0, c1 = max(rows.min() - 2, 0), rows.max() + 3, max(cols.min() - 2, 0), cols.max() + 3
    img, mask = img[r0:r1, c0:c1], mask[r0:r1, c0:c1]
    h, w = mask.shape

    sig = img
    bases = {a: np.stack([epg_decay(ne, a, ESP, t2, T1) for t2 in T2], axis=1) for a in ANGLES}
    spec = np.zeros((h, w, len(T2)))
    alpha = np.zeros((h, w))
    floor = np.zeros((h, w))
    bases = {a: np.hstack([b, np.ones((ne, 1))]) for a, b in bases.items()}  # last column: the noise floor
    mus = np.logspace(-8, 0, 33)
    nt = len(T2)
    smooth = np.hstack([np.eye(nt), np.zeros((nt, 1))])  # smooth the distribution, not the floor
    for i, j in zip(*np.where(mask)):
        s = sig[i, j]
        scale = s.max()
        y = s / scale
        res = {a: nnls(bases[a], y) for a in ANGLES}
        best = min(ANGLES, key=lambda a: res[a][1])
        A, chi0 = bases[best], res[best][1] ** 2
        x = res[best][0]
        for mu in mus:  # the most smoothing that keeps the misfit within 2% of the best
            xm, _ = nnls(np.vstack([A, np.sqrt(mu) * smooth]), np.concatenate([y, np.zeros(nt)]))
            if np.sum((A @ xm - y) ** 2) > 1.02 * chi0:
                break
            x = xm
        spec[i, j] = x[:nt] * scale
        floor[i, j] = x[nt] * scale
        alpha[i, j] = best

    write_release(img, mask, spec, alpha, floor, te, ESP)
    print(f"{RELEASE.relative_to(DECK)}/  ({h} x {w} pixels, {int(mask.sum())} in the tissue)")


if __name__ == "__main__":
    main()
