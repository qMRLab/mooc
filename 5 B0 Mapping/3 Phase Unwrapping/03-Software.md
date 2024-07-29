---
title: Software
subtitle: Phase Unwrapping
date: 2024-07-25
authors:
  - name:  Alexandre Dastous
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: false
  figure:
    template: Fig. %s
---

Laplacian unwrapping can be very robust even with highly wrapped images but does so at the expense of accuracy. It typically unwraps with an error of low spatial variability. This can be a perfectly reasonable unwrapping technique for some applications such as QSM where the background field (low spatial variability) is subsequently removed. However, in applications such as shimming or qMRI where the accuracy is important, Laplacian unwrapping is not recommended.

Other unwrapping algorithms and softwares are listed below.

PRELUDE: Spatial unwrapping technique using region growing algorithm [20].
SEGUE: Spatial unwrapping technique based on similar principles to Prelude with optimizations to improve the speed [21].
BEST PATH: 3D unwrapping algorithm using spatial information to assess the quality of the phase data and unwrap high quality regions first. [22]
ROMEO: Unwrapping technique using temporal and spatial information to guide the path of unwrapping [23].
UMPIRE:Temporal unwrapping technique using unevenly spaced echoes to accurately unwrap phase images. This technique requires three or more echoes [24].