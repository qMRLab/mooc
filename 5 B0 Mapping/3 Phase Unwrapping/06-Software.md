---
title: Software
subtitle: Phase Unwrapping
date: 2024-10-07
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

Laplacian unwrapping can be very robust even with highly wrapped images but does so at the expense of accuracy. It typically unwraps with an error of low spatial variability. This can be a perfectly reasonable unwrapping technique for some applications such as QSM where the background field (low spatial variability) is subsequently removed. However, in applications such as shimming or qMRI where the accuracy is important, Laplacian unwrapping is not recommended.

Other unwrapping algorithms and softwares are listed below.

PRELUDE: Spatial unwrapping technique using region growing algorithm [@Jenkinson2003-vy].
SEGUE: Spatial unwrapping technique based on similar principles to Prelude with optimizations to improve the speed [@Karsa2019-rd].
BEST PATH: 3D unwrapping algorithm using spatial information to assess the quality of the phase data and unwrap high quality regions first. [@Abdul-Rahman2007-pv]
ROMEO: Unwrapping technique using temporal and spatial information to guide the path of unwrapping [@Dymerska2021-kq].
UMPIRE:Temporal unwrapping technique using unevenly spaced echoes to accurately unwrap phase images. This technique requires three or more echoes [@Robinson2014-tp].
