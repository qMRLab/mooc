---
title: Introduction
subtitle: Phase Unwrapping
date: 2024-10-07
label: phaseUnwrapIntro
authors:
  - name:  Alexandre D'Astous
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

Phase unwrapping stems from the fact that phase can only be measured over the range of {math}`-\pi` to {math}`+\pi`. If the measured phase crosses from {math}`-\pi` to {math}`+\pi`, a “wrap” is observed as a {math}`2\pi` jump where in reality, the phase was smoothly varying. In the context of MRI, phase wrapping occurs when measuring phase data that varies by more than {math}`2\pi`  within the region of interest. In reality, the number of rotations that a spin can have done is not limited to a single revolution. To accurately recover the true phase information, unwrapping is necessary.

There are two main families of unwrapping techniques. Temporal unwrapping techniques use temporal information from different phase time points and the assumption that the difference between time points is smoothly varying (offset less than ) to correct for phase jumps that can occur in time. Spatial unwrapping uses spatial information and relies on the fact that neighboring voxels should be smoothly varying to identify and correct for {math}`2\pi`  jumps. 