---
title: Abstract
subtitle: Magnetization Transfer Saturation
date: 2024-07-25
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: false
  figure:
    template: Fig. %s
---

Magnetization Transfer Saturation (MTsat) is a semi-quantitative MRI technique that offers unique insights into tissue microstructure. Built upon the spoiled gradient-recalled echo (SPGR) sequence, the MTsat protocol acquires images with and without an MT-preparation off-resonance pulse to acquire different contrast that varies with macromolecular density and T1.

The foundation of MTsat lies in a 2008 model by Helms and colleagues (Helms et al. 2008), which treats the off-resonance pulse as a second excitation pulse, allowing us to model the effects of MT analytically without the need of the complex Bloch-McConnel equations. Following some reasonable approximations and the acquisition of three distinct MRI images, this model allows for analytical computation of a parameter that models the % reduction in free-pool longitudinal magnetization due to a single off-resonance pulse, MTsat. 

This introduction provides a glimpse into the theoretical basis of MTsat, its practical applications, and sensitivity to variables like tissue T1 and B1. By exploring the unique properties and potential of MTsat, we hope to give readers a better understanding of the advantages and limitations of this MRI technique in both research and clinical practice, as well as give a deeper conceptual understanding of what the MTsat value means.
