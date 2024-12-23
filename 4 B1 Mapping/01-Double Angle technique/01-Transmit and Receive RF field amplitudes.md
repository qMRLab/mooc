---
title: Transmit and Receive RF field amplitudes
subtitle: Double Angle technique
date: 2024-10-07
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

In an MRI experiment, magnetic field amplitude of the radiofrequency field (_B_{sub}`1`) is an an important physical parameter that is a product of the interaction between RF coil design and the subject's position (volume and relative position to the coil) and physical properties (electromagnetic permittivity ε and permeability μ). In any MRI experiments, two _B_{sub}`1` fields appear: the transmit RF field amplitude _B_{sub}`1`{sup}`+` and the receive RF field amplitude _B_{sub}`1`{sup}`-`. The latter, _B_{sub}`1`{sup}`-`, is often referred to in terms of the receive RF coil sensitivities and this is due to the principle of reciprocity [@Hoult1976-xz;@Hoult2000-ug] property of RF antennas. In terms of an MRI image, _B_{sub}`1`{sup}`-` is simply a multiplication factor that varies spatially but doesn’t change between pulse sequences if the subject remains motionless, and techniques to “flatten” images by estimating this field numerically have been developed [@Sled1998-fr]. Additionally, many quantitative MRI techniques calculate the ratio of images, which eliminates this _B_{sub}`1`{sup}`-` component from the resulting image.

_B_{sub}`1`{sup}`+`, however, impacts the resulting MRI images in a much more complex way and is not a simple multiplication factor. _B_{sub}`1`{sup}`+` directly perturbs the system of spins by introducing energy in the system, which practically we quantify as the flip angle of an RF pulse. Two different _B_{sub}`1`{sup}`+` values will not have the same impact on voxel for different pulse sequences, as spin dynamics and steady-state conditions will vary. For example, let’s say you acquire a saturation recovery image and also a short TR steady-state gradient echo. For an actual flip angle  = {math}`\alpha \cdot B_{1}`, the magnetization after TE will be {math}`M_{z}\text{sin}\left( \alpha \cdot B_{1} \right)\text{exp}\left(-\text{TE}/T_{2}   \right)` and {math}`M_z` prior to the RF pulse is given by [](#vfaEq1). Thus, not only does _B_{sub}`1`{sup}`+` not appear as a simple multiplication factor, a change of _B_{sub}`1` will not impact this voxel for both sequences by the same ratio. Thus, knowledge of _B_{sub}`1`{sup}`+` through _B_{sub}`1` mapping can help us retroactively understand the dynamics of the spins accurately, and can play the role of a calibration factor for many quantitative MRI techniques (e.g. VFA, _T_{sub}`2`/_T_{sub}`2`{sup}`*`, qMT, etc). In addition, _B_{sub}`1` mapping can also map the electromagnetic properties, but this won’t be discussed in this chapter.

In this chapter, we’ll be discussing a simple but widely used class of methods for _B_{sub}`1` mapping, the double angle method. For the sake of simplicity, and for consistency with the quantitative MRI literature, we’ll define _B_{sub}`1` = _B_{sub}`1`{sup}`+` and will explicitly state _B_{sub}`1`{sup}`-` when referring to the receive field.
