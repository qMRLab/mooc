---
title: Signal Modelling
subtitle: Multiexponential T2 Mapping
date: 2024-07-25
authors:
  - name:  Samuelle Stonge
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: false
  figure:
    template: Fig. %s
---

For multiexponential T2 mapping, the transverse magnetization (Mxy) acquired at different echo times (TE) can be modeled as a sum of exponential decays :

```{figure} img/eq6.png
:label: t2eq6
```

where each term of the summation represents the contribution of the ith tissue component to the overall transverse magnetization decay (Collewet et al., 2022; Dortch, 2020). 

[](#mexplot1) presents a single-voxel simulation of T2 relaxation curves of myelin water (MW) and intra/extracellular water (IEW) using mono-exponential T2 fitting, compared to a multi-exponential fitting comprising both MW and IEW. In this example, we see that using a multi-exponential model rather than mono-exponential for complex tissues like myelin enables a more precise quantification of the T2 relaxation within each voxel. 

```{figure} img/plot1.png
:label: mexplot1

Comparison of mono-exponential and multi-exponential T2 fitting. This figure contrasts mono-exponential and multi-exponential fitting approaches for a single voxel containing myelin water (MW) and intra/extracellular water (IEW). The green and orange curves represent mono-exponential fittings for MW and IEW, respectively. The dotted purple curve illustrates the multi-exponential fitting, which combines both MW and IEW components. 
```



