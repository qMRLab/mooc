---
title: Spatial Unwrapping
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

Spatial unwrapping uses the spatial characteristics of images to unwrap the data. The wrapped image should vary smoothly. Spatial unwrapping typically uses a  region-growing algorithm which identifies and rectifies where there are offsets greater than {math}`2\pi`. An example of a 1D signal of a linearly evolving phase is shown in [](#b0Plot11) to illustrate the phase that we would want to recover from the wrapped phase that would be acquired through space.

:::{figure} #fig5p11cell
:label: b0Plot11
:enumerator: 5.11
1D example of a wrapped phase (blue) with the true phase (red)
:::

A more complex example is shown in [](#b0Plot12) where phase varies spatially in a non-linear fashion. When the signal is unwrapped, different solutions are expected. These solutions vary by {math}`2n\pi`. Its cause and potential remedy are described in the following section.


:::{figure} #fig5p12cell
:label: b0Plot12
:enumerator: 5.12
A more complex example of a signal wrapped and unwrapped. Note that three possibilities are possible when unwrapping, depending on which part of the signal is selected to be the true phase. The slider can be moved left to right to show the wrapped and unwrapped data.
:::

A common issue with spatial unwrapping which stems from region growing algorithms is that the region of interest needs to be defined in a single region, or there can be a {math}`2n\pi` offset between regions. Moreover, region growing algorithms usually require thresholding so that noise is not unwrapped.

A 2D example of wrapped and unwrapped simulated data is shown in [](#b0Plot13). The concept can be expanded to 3D data as well. Note that more wraps result in higher field inhomogeneity.

:::{figure} #fig5p13cell
:label: b0Plot13
:enumerator: 5.13
2D wrapped and unwrapped simulated data.
:::

