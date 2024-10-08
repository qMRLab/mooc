---
title: Reducing eddy currents
subtitle: Advanced B0 Mapping Methods
date: 2024-10-07
label: b0Eddy
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

Up to this point we have assumed that the phase changes linearly with time. However, this is not always the case. [Eddy currents](https://en.wikipedia.org/wiki/Eddy_current) can be generated inside the ROI when gradients are changed rapidly. These decaying [eddy currents](https://en.wikipedia.org/wiki/Eddy_current) create a spatially and temporally varying field that can therefore be different depending on the echo time. As the [eddy currents](https://en.wikipedia.org/wiki/Eddy_current) are not constant, they do not cancel out when computing a phase difference. Longer TRs can help minimize [eddy currents](https://en.wikipedia.org/wiki/Eddy_current) and avoid the issue. For smaller TRs, it is possible to acquire the same acquisition twice with the frequency, phase and slice encoding directions reversed. This has the effect of reversing the [eddy currents](https://en.wikipedia.org/wiki/Eddy_current) polarity. The field map for each acquisition can be computed and then averaged to minimize their effect.