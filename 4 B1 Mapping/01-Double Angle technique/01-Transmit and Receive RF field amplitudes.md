---
title: Transmit and Receive RF field amplitudes
subtitle: Double Angle technique
date: 2024-07-25
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
:class: attentionDraft
:name: attentionDraft
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

In an MRI experiment, magnetic field amplitude of the radiofrequency field (B1) is an an important physical parameter that is a product of the interaction between RF coil design and the position (volume and relative position to the coil) and properties (electromagnetic permittivity ε and permeability μ) of the object being imaged. In any MRI experiments, two B1 fields appear: the transmit RF field amplitude B1+ and the receive RF field amplitude B1-. The latter, B1-, is often referred to in terms of the receive RF coil sensitivities and this is due to the principle of reciprocity (Hoult and Richards 1976; Hoult 2000) property of RF antennas. In terms of an MRI image, B1- is simply a multiplication factor that varies spatially but doesn’t change between pulse sequences if the subject remains motionless, and techniques to “flatten” images by estimating this field numerically have been developed (Sled et al. 1998). Additionally, many quantitative MRI techniques calculate the ratio of images, which eliminates this B1- component from the resulting image.

B1+, however, impacts the resulting MRI images in a much more complex way and is not a simple multiplication factor. B1+ directly perturbs the system of spins by introducing energy in the system, which practically we quantify as the flip angle of an RF pulse. Two different B1+ values will not have the same impact on voxel for different pulse sequences, as spin dynamics and steady-state conditions will vary. For example, let’s say you acquire a saturation recovery image and also a short TR steady-state gradient echo. For an actual flip angle  = FA*B1, the magnetization after TE will be M0*sin(FA*B1)*exp(-TE/T2) and M0*sin(FA*B1)*(1-exp(-TR/T1))*(1-cos(FA*B1)*exp(-TR/T1))-1. Thus, not only does B1+ not appear as a simple multiplication factor, a change of B1 will not impact this voxel for both sequences by the same ratio. Thus, knowledge of B1+ through B1 mapping can help us retroactively understand the dynamics of the spins accurately, and can play the role of a calibration factor for many quantitative MRI techniques (e.g. VFA, T2/T2*, qMT, etc). In addition, B1 mapping can also map the electromagnetic properties, but this won’t be discussed in this chapter.

In this chapter, we’ll be discussing a simple but widely used class of methods for B1 mapping, the double angle method. For the sake of simplicity, and for consistency with the quantitative MRI literature, we’ll define B1 = B1+ and will explicitly state B1- when referring to the receive field.
