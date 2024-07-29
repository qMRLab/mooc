---
title: Abstract
subtitle: Monoexponential T2 Mapping
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

The simplest technique for performing T2-mapping involves the acquisition of multiple images using a single-echo sequence with different echo times (TE). This set of data can then be used to fit the T2 from the decaying signal curve (Milford et al., 2015). However, this method is typically not employed in-vivo due to its prohibitively long acquisition times. 

Multi-spin echo (MSE) sequences, based on the Carr-Purcell-Meiboom-Gill (CPMG) pulse train (Carr & Purcell, 1954; Meiboom & Gill, 1958), employ multiple 180-degree refocusing pulses to generate multiple echoes within a single acquisition (Figure 2) (Fatemi et al., 2020; Milford et al., 2015). This substantially reduces the scan time relative to acquiring multiple echos using separate single-SE acquisitions, making MSE the sequence of choice in clinical settings. 
The original Carr-Purcell method, which involves applying a 90-degree pulse followed by a series of 180-degree pulses along the same axis (e.g., x-axis), was designed to mitigate diffusion effects by preventing phase accumulation. However, this approach can lead to the accumulation of imperfections in the 180-degree pulses, resulting in a faster than expected loss of transverse magnetization (Mxy) and inaccurate T2 measurements (Brown et al., 2014). The Meiboom-Gill improvement addresses this issue by applying the initial 90-degree pulse along one axis (e.g., x-axis) and the subsequent 180-degree pulses along a perpendicular axis (e.g., y-axis). This phase cycling distributes errors such that they average out over time, producing a more stable and accurate echo train (Brown et al., 2014).

```{figure} img/t2_sequence.png
:label: t2Fig1

Simplified illustration of a multi-spin echo sequence for T2 mapping based on the Carr-Purcell-Meiboom-Gill method.
```

To fit the data using the mono-exponential model, homogeneity within each voxel is assumed implicitly, implying a consistent T2 decay time across the tissue. This results in a single fitted T2 value for each voxel in the image. Although it is widely used, the mono-exponential model has been shown to be insufficient for proper estimation of tissue T2 relaxation times, given that the signal in a voxel often arises from multiple tissue components with different T2 values (Graham et al., 1996). In section 3.3, we will cover the multi-exponential method and discuss its use in applications such as myelin water fraction (MWF) imaging.