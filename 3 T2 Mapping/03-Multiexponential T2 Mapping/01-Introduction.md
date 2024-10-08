---
title: Introduction
subtitle: Multiexponential T2 Mapping
date: 2024-10-07
authors:
  - name:  Samuelle St-Onge
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

By using the mono-exponential curve described in the previous sections, we use a single compartment tissue model. This means that we assume that all tissue components contained in a voxel have the same _T_{sub}`2` relaxation time. However, in practice, the assumption of _T_{sub}`2` decay uniformity within a voxel can result in inaccurate fittings, as a voxel may contain different tissue compartments with different _T_{sub}`2` times. For example, a voxel at a tissue boundary inside the brain can contain both cerebrospinal fluid and gray matter, a phenomenon which is also commonly referred to as the partial volume effect. In such cases, it would be preferable to compartmentalize different tissues inside a single voxel: this is made possible with multi-exponential _T_{sub}`2` mapping, where we consider the _T_{sub}`2` relaxation contribution of each tissue compartment within a voxel. The multi-exponential _T_{sub}`2` mapping method, which will be described in this section, can be useful in many applications, such as myelin water fraction imaging which will be explained further in section 3.3.4. 