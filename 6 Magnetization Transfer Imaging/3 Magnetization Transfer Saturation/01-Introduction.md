---
title: Introduction
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

:::{attention}
:class: attentionDraft
:name: attentionDraft
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::


Magnetization Transfer Saturation (MTsat) is a semi-quantitative MRI technique that offers unique insights into tissue microstructure. Built upon the spoiled gradient-recalled echo (SPGR) sequence, the MTsat protocol acquires images with and without an MT-preparation off-resonance pulse to acquire different contrast that varies with macromolecular density and T1.

The foundation of MTsat lies in a 2008 model by Helms and colleagues (Helms et al. 2008), which treats the off-resonance pulse as a second excitation pulse, allowing us to model the effects of MT analytically without the need of the complex Bloch-McConnel equations. Following some reasonable approximations and the acquisition of three distinct MRI images, this model allows for analytical computation of a parameter that models the % reduction in free-pool longitudinal magnetization due to a single off-resonance pulse, MTsat. 

This introduction provides a glimpse into the theoretical basis of MTsat, its practical applications, and sensitivity to variables like tissue T1 and B1. By exploring the unique properties and potential of MTsat, we hope to give readers a better understanding of the advantages and limitations of this MRI technique in both research and clinical practice, as well as give a deeper conceptual understanding of what the MTsat value means.

```{figure} img/sequence.png
:label: mtsatFig1
:enumerator: 6.1  
Simplified pulse sequence diagram of an MTR imaging sequence. An off-resonance and high powered MT-preparation pulse is followed by a spoiler gradient to destroy any transverse magnetization prior the application of the imaging sequence, in this case a spoiled gradient recalled echo (SPGR).
```

In the initial MTsat paper (Helms et al. 2008, 2010), the main innovation stems from a new model of the MT-weighted SPGR sequence shown in Figure 1. There, (Helms et al. 2008) proposed to interpret the effects of the MT-preparation pulse as a second excitation RF pulse of an unknown flip angle. That is to say, they modeled the reduction of the longitudinal magnetization of the free pool due to the MT pulse to be the same reduction caused by the flip angle rotation of a second instantaneous excitation RF pulse. Figure 2 presents the Helms model, where to be consistent with the convention presented in mathematical derivations in (Helms et al. 2008, 2010), the order of the pulses are switched such that the readout excitation pulse comes first (alpha1), and the excitation pulse modelling the effects of the MT pulse comes second (alpha2). Note that, after a steady-state is reached, this order would not not impact the signal value during image readout. 

```{figure} img/mtsat_model_sequence.png
:label: mtsatFig2
:enumerator: 6.2  
Pulse sequence model used in MTSat to approximate the effects occurring in the actual MT-weighted sequence (Figure 1), but as a dual-excitation sequence. Note that the defined TR is shifted so that the beginning of the TR occurs at the excitation pulse, instead of the MT pulse as per Figure 1, which once a steady-state is established won’t impact the calculations.
```

As has been derived in many introductory MRI physics textbooks, the steady-state signal equation for a standard SPGR pulse sequence (that is, one excitation flip angle per entire TR) has been shown to be:
