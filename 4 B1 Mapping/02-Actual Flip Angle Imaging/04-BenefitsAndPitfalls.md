---
title: Benefits and Pitfalls
subtitle: B1 AFI
date: 2024-10-07
authors:
  - name: Juan Velezquez-Reyes
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

_B_{sub}`1` mapping is of interest for diverse MRI applications, and several mapping techniques have been developed. The DAM method consists of acquiring two scans at two different flip angles. To avoid the dependence of the signal on _T_{sub}`1`, long repetition times are required to allow the recovery of the longitudinal magnetization between pulses (Yarnykh 2007; Insko & Bolinger 1993). The AFI method overcomes this practical limitation by repeating the pulse sequence at a fast rate to achieve a pulsed state of magnetization and shorter time delays between pulses. In addition, due to scan-time constraints, _B_{sub}`1` mapping methods are often implemented in 2D (Chavez & Stanisz 2011). However, the accuracy of the measurements of 2D _B_{sub}`1` mapping techniques is compromised by the slice profile effects due to the problem of nonuniform excitation across slices (Yarnykh 2007; Chavez & Stanisz 2011). The AFI method on the other hand, adresses this issue using a fast 3D implementation leading to scans with an excellent anatomical coverage in clinically feasible times, with an increase in signal-to-noise ratio compared to 2D multislice acquisitions.

The performance of the AFI method is based on the following assumptions. First, the two images acquired at different times should be registered to avoid motion effects. It is also assumed that the signal is insensitive to the main magnetic field non-uniformities and chemical shift effects that are canceled out when taking the signal ratio r (Yarnykh 2007). Despite some clear advantages over other _B_{sub}`1` mapping techniques, the application of spoiler gradients to mitigate the _T_{sub}`1` dependence can be a limitation due to significant levels of RF power depositions (Sacolick et al. 2010). Furthermore, it is necessary to adapt the AFI pulse sequence to different scanner manufacturers, and programming experience is required to bring this technique into the clinic.