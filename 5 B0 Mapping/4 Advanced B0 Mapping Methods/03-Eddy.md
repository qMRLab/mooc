---
title: Reducing eddy currents
subtitle: Advanced B0 Mapping Methods
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

Up to this point we have assumed that the phase changes linearly with time. However, this is not always the case. Eddy currents can be generated inside the ROI when gradients are changed rapidly. These decaying eddy currents create a spatially and temporally varying field that can therefore be different depending on the echo time. Since it is not constant, they do not cancel out when computing a phase difference. Longer TRs can help to minimize eddy currents and avoid the issue. For smaller TRs, it is possible to acquire the same acquisition twice with the frequency, phase and slice encoding directions reversed. This has the effect of reversing the eddy currents polarity. The field map for each acquisition can be computed and then averaged to minimize their effect.