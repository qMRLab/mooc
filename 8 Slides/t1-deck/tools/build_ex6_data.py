#!/usr/bin/env python3
"""Build js/data/ex6.js: the inversion recovery data for Exercise 6, from the ISMRM 2020 T1 mapping challenge.

Human brain (subject 01) and NIST phantom (serial 46), both acquired at USC on the same GE Signa HDxt 3T
with the same protocol: 2D spin-echo IR, TR 2550 ms, TI 50, 400, 1100, 2500 ms, magnitude.
Source: https://osf.io/ywc9g (challenge data), ROI and sphere masks from the challenge analysis.

Ten TIs from the real four: each voxel of the real data is fitted (|a + b e^(-TI/T1)|, polarity restored,
as qMRLab's inversion_recovery), then its signal is simulated at 10 TIs equispaced from 50 to TR - 50 ms,
with Rician noise at the level of the real images' background. With 10 TIs the reversed order is visible
in the curves themselves.

The exercise's "collaborator" sent the images in the wrong order: the header lists the TIs in increasing
order, but the images are in decreasing TI order. This script stores them that way (as delivered).

Everything is stored in display orientation (row 0 at the top), cropped to the object, voxel-major
(the 4 images of voxel 0, then voxel 1, ...), which is the layout qmrust's fit_volume expects.

Usage (from the t1-deck folder; needs numpy and nibabel):
    python3 -I tools/build_ex6_data.py [--human PATH] [--rois PATH] [--nist PATH] [--spheres PATH]
"""
import argparse
import base64
import json
from pathlib import Path

import nibabel as nib
import numpy as np

DECK = Path(__file__).resolve().parents[1]
HOME = Path.home()
OSF = HOME / "neuropoly/courses/GBM-MRI/lab1/external_resources/osf-ywc9g"
CHALLENGE = HOME / "neuropoly/projects/t1_challenge_llm_reproducibility/repo_t1_challenge_llm_reproducibility"
DEFAULTS = {
    "human": OSF / "brain/20200128_mrel_usc_human/20200128_mrel_usc_GE3T_MR1_human_subject01.nii.gz",
    "rois": OSF / "t1_maps/brain/20200128_mrel_usc_human/20200128_mrel_usc_GE3T_MR1_human_subject01_rois.nii.gz",
    "nist": HOME / "neuropoly/mooc/problems/20200204_mrel_usc_NIST/20200204_mrel_usc_GE3T_MR1_NIST_Magnitude.nii.gz",
    "spheres": CHALLENGE / "roi_masks/20200204_mrel_usc_NIST/20200204_mrel_usc_GE3T_MR1_NIST_Magnitude_T1map_modifheader_mask.nii.gz",
}
TIS_ACQUIRED = np.array([50, 400, 1100, 2500.0])  # the real data
TR = 2550
TIS = [int(round(t)) for t in np.linspace(50, TR - 50, 10)]  # the exercise's protocol
SEED = 1
# NIST system phantom reference T1 (ms, 20 °C), serial numbers 43 and up (challenge analysis, nist.py).
NIST_T1 = [1883.97, 1330.16, 987.27, 690.08, 484.97, 341.58, 240.86, 174.95, 121.08, 85.75, 60.21, 42.89, 30.40, 21.44]
ROI_NAMES = ["Genu (WM)", "Splenium (WM)", "Deep GM", "Cortical GM"]


def load(path):
    return np.squeeze(np.asarray(nib.load(str(path)).dataobj))


def display(a):
    """Display orientation used for these files: rotate the voxel grid 90° (anterior up)."""
    return np.rot90(a, axes=(0, 1))


def crop_box(mask, margin=6, min_count=8):
    """Bounding box of the object, ignoring rows/columns with only a few stray (noise) voxels."""
    rows = np.nonzero(mask.sum(1) >= min_count)[0]
    cols = np.nonzero(mask.sum(0) >= min_count)[0]
    r0, r1 = max(rows.min() - margin, 0), min(rows.max() + margin + 1, mask.shape[0])
    c0, c1 = max(cols.min() - margin, 0), min(cols.max() + margin + 1, mask.shape[1])
    return slice(r0, r1), slice(c0, c1)


def fit_ir(y, tis, grid=np.geomspace(30, 8000, 800)):
    """Grid search over T1 of |a + b exp(-TI/T1)| with polarity restoration (the first p samples negated).
    y: (voxels, TIs), TIs increasing. Returns a, b, T1 per voxel."""
    n = y.shape[1]
    best = np.full(len(y), np.inf)
    out = np.zeros((len(y), 3))
    for t1 in grid:
        A = np.stack([np.ones(n), np.exp(-tis / t1)], 1)
        for p in range(n + 1):
            ys = y * np.where(np.arange(n) < p, -1.0, 1.0)
            coef, *_ = np.linalg.lstsq(A, ys.T, rcond=None)
            res = ((A @ coef - ys.T) ** 2).sum(0)
            better = res < best
            best[better] = res[better]
            out[better] = np.c_[coef[0][better], coef[1][better], np.full(better.sum(), t1)]
    return out.T


def synthesize(img, signal, rng):
    """10-TI images from the 4 acquired ones: fitted signal in the object, Rician noise everywhere."""
    sigma = img[..., -1][~signal].mean() / np.sqrt(np.pi / 2)  # background is Rayleigh: mean = sigma sqrt(pi/2)
    clean = np.zeros(img.shape[:2] + (len(TIS),))
    a, b, t1 = fit_ir(img[signal].astype(float), TIS_ACQUIRED)
    tis = np.array(TIS, float)
    clean[signal] = np.abs(a[:, None] + b[:, None] * np.exp(-tis[None, :] / t1[:, None]))
    noisy = np.hypot(clean + sigma * rng.standard_normal(clean.shape), sigma * rng.standard_normal(clean.shape))
    return np.clip(np.round(noisy), 0, 32767), sigma


def b64(array, dtype):
    return base64.b64encode(np.ascontiguousarray(array, dtype=dtype).tobytes()).decode("ascii")


def pack(images, labels, label_key, rng):
    """images: (x, y, 4) acquired, in TI order. Returns the JSON-ready dict, cropped, with the 10 synthesized
    images in the delivered (reversed) order."""
    img = display(images)
    lab = display(labels).astype(np.uint8)
    signal = img[..., -1] > 0.1 * np.percentile(img[..., -1], 99)  # object mask from the TI = 2500 ms image
    rs, cs = crop_box(signal)
    img, lab, signal = img[rs, cs], lab[rs, cs], signal[rs, cs]
    assert lab.max() > 0, "the crop lost the labels"
    img, sigma = synthesize(img, signal, rng)
    delivered = img[..., ::-1]  # what the collaborator sent: images in reverse TI order
    ny, nx = signal.shape
    return {
        "nx": int(nx), "ny": int(ny), "noise": round(float(sigma), 1),
        "data": b64(delivered.reshape(-1, len(TIS)), "<i2"),
        "mask": b64(signal, "u1"),
        label_key: b64(lab, "u1"),
    }


def main():
    ap = argparse.ArgumentParser()
    for key, path in DEFAULTS.items():
        ap.add_argument(f"--{key}", type=Path, default=path)
    args = ap.parse_args()

    rng = np.random.default_rng(SEED)
    human = pack(load(args.human).astype(np.int16), load(args.rois), "rois", rng)
    human["roiNames"] = ROI_NAMES
    spheres = load(args.spheres)
    spheres = np.where(spheres <= len(NIST_T1), spheres, 0)  # drop the extra non-sphere label
    nist = pack(load(args.nist).astype(np.int16), spheres, "spheres", rng)
    nist.update({"reference": NIST_T1, "serial": 46, "temperature": 20.9})

    payload = {
        "source": "ISMRM 2020 T1 mapping challenge (osf.io/ywc9g): USC, GE Signa HDxt 3T, 2D SE-IR; "
                  "10 TIs simulated from voxelwise fits of the acquired 4",
        "tisAcquired": TIS_ACQUIRED.astype(int).tolist(),
        "tr": TR,
        "tisHeader": TIS,
        "deliveredOrder": TIS[::-1],
        "human": human,
        "nist": nist,
    }
    out = DECK / "js" / "data" / "ex6.js"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        "/* Generated by tools/build_ex6_data.py. Do not edit by hand. */\n"
        "window.T1ExerciseData = window.T1ExerciseData || {};\n"
        f"window.T1ExerciseData.ex6 = {json.dumps(payload, separators=(',', ':'))};\n",
        encoding="utf-8",
    )
    print(f"wrote {out.relative_to(DECK)} ({out.stat().st_size / 1e6:.2f} MB): "
          f"human {human['nx']}×{human['ny']}, NIST {nist['nx']}×{nist['ny']}")


if __name__ == "__main__":
    main()
