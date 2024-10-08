---
title: Introduction
subtitle: _T_{sub}`2` Mapping
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

_T_{sub}`2` relaxation, also known as the transverse or spin-spin relaxation, is characterized by the dephasing of spins, leading to a reduction of the total magnetization in the x-y plane. In practical terms, the _T_{sub}`2` value represents the upper limit of the signal decay time under ideal imaging conditions. In practice, magnetic field inhomogeneities cause the transverse magnetization to decay faster than what is captured by _T_{sub}`2` relaxation. These inhomogeneities can be macroscopic, caused by factors such as metallic implants or air-tissue interfaces, or microscopic, resulting from differences in magnetic susceptibility between tissues (Chavhan et al., 2009; Cohen-Adad, 2014). When considering this phenomenon, we refer to the transverse relaxation as _T_{sub}`2`{sup}`*`. 

_T_{sub}`2` mapping, a quantitative magnetic resonance imaging method, offers images of _T_{sub}`2` relaxation times (called _T_{sub}`2` maps) providing valuable insights into tissue composition. Given that _T_{sub}`2` relaxation is sensitive to specific microstructural changes associated with diseases, such as iron accumulation, myelination and inflammation (Dortch, 2020), it is considered a promising modality for clinical and research applications. Commonly used _T_{sub}`2`-mapping techniques are split into two categories: the mono-exponential methods, which consider that the voxel’s signal arises from a single tissue compartment, and multi-exponential methods, where various tissues that contribute to a single voxel’s signal are considered. Recently, novel techniques for _T_{sub}`2` mapping have emerged beyond the conventional techniques that were developed for NMR, such as MR fingerprinting (Ma et al., 2013), a fast relaxation mapping technique that uses a single image acquisition to quantify multiple parameters (Hamilton et al., 2017). 

In the following sections, we will introduce the current state-of-the-art signal modeling and data fitting theory for both mono-exponential and multi-exponential _T_{sub}`2` mapping, as well as the benefits and pitfalls of both approaches. An overview of some common applications of _T_{sub}`2` mapping (e.g., myelin water fraction (MWF) imaging) will also be presented. We will also cover the fundamentals of _T_{sub}`2`{sup}`*` mapping and explore how its signal decay curve can differ from that of _T_{sub}`2` relaxation. 
