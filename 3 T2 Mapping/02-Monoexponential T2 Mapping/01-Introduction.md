---
title: Introduction
subtitle: Monoexponential T2 mapping
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

The simplest technique for performing _T_{sub}`2`-mapping involves the acquisition of multiple images using a single-echo sequence with different echo times (TE). This set of data can then be used to fit the _T_{sub}`2` from the decaying signal curve [@Milford2015-ef]. However, this method is typically not employed in-vivo due to its prohibitively long acquisition times. 

Multi-spin echo (MSE) sequences, based on the Carr-Purcell-Meiboom-Gill (CPMG) pulse train [@Carr1954-dd;@Meiboom1958-ur], employ multiple 180-degree refocusing pulses to generate multiple echoes within a single acquisition ([](#t2seq)) [@Fatemi2020-tm;@Milford2015-ef]. This substantially reduces the scan time relative to acquiring multiple echoes using separate single-SE acquisitions, making MSE the sequence of choice in clinical settings. 

The original Carr-Purcell method, which involves applying a 90-degree pulse followed by a series of 180-degree pulses along the same axis (e.g., x-axis), was designed to mitigate diffusion effects by preventing phase accumulation. However, this approach can lead to the accumulation of imperfections in the 180-degree pulses, resulting in a faster than expected loss of transverse magnetization (Mxy) and inaccurate _T_{sub}`2` measurements [@Brown2014-bj]. The Meiboom-Gill improvement addresses this issue by applying the initial 90-degree pulse along one axis (e.g., x-axis) and the subsequent 180-degree pulses along a perpendicular axis (e.g., y-axis). This phase cycling distributes errors such that they average out over time, producing a more stable and accurate echo train [@Brown2014-bj].


```{figure} img/t2_sequence.png
:label: t2seq
:enumerator: 3.2
Simplified illustration of a multi-spin echo sequence for _T_{sub}`2` mapping based on the Carr-Purcell-Meiboom-Gill method
```

To fit the data using the mono-exponential model, homogeneity within each voxel is assumed implicitly, implying a consistent _T_{sub}`2` decay time across the tissue. This results in a single fitted _T_{sub}`2` value for each voxel in the image. Although it is widely used, the mono-exponential model has been shown to be insufficient for proper estimation of tissue _T_{sub}`2` relaxation times, given that the signal in a voxel often arises from multiple tissue components with different _T_{sub}`2` values [@Graham1996-sr]. In [a later section of this chapter](#t2Multiexpo), we will cover the multi-exponential method and discuss its use in applications such as myelin water fraction (MWF) imaging. 
