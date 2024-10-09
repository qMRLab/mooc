---
title: Single Frequency Population
subtitle: Dual echo B0 mapping
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

To build intuition about field maps, let us imagine a sample at a constant offset frequency from {math}`f_{0}` . Note that this simplistic representation of the field typically does not occur due to how the susceptibilities of the neighboring regions interact with one another to create the _B_{sub}`0` field offset (see the [_B_{sub}`0` inhomogeneity section](#b0InhomoIntro), but is shown as such for learning purposes. The sample is shown as a circle in [](#b0Plot8). As the frequency is not at the [Larmor frequency](https://en.wikipedia.org/wiki/Larmor_precession), phase accumulation is observed at the different echo times and a phase difference map can be computed. The _B_{sub}`0` field map is then calculated using the echo times. Note that if {math}`\Delta`TE is too long, the phase could make more than a half revolution between the two echo times resulting in an erroneous _B_{sub}`0` field estimation. This is because phase is defined over {math}`-\pi` to {math}`+\pi` and the sampled points should respect the [Nyquist criteria](https://en.wikipedia.org/wiki/Nyquist_frequency). In practice, this example field (constant offset) could easily be corrected by adjusting the transmit and receive frequency of the scanner.

:::{figure} #fig5p8cell
:label: b0Plot8
:enumerator: 5.8
Different images of a homogeneous cylinder field offset showing a simulated phase at two echo times, the calculated phase difference image and the computed _B_{sub}`0` field map.
:::