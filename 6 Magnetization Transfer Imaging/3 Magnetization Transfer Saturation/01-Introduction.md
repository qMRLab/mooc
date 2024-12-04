---
title: Introduction
subtitle: Magnetization Transfer Saturation
date: 2024-10-07
label: mtsatIntro
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


Magnetization Transfer Saturation (MTsat) is a semi-quantitative MRI technique that offers unique insights into tissue microstructure. Built upon the spoiled gradient-recalled echo (SPGR) sequence, the MTsat protocol acquires images with and without an MT-preparation off-resonance pulse to acquire different contrast that varies with macromolecular density and _T_{sub}`1`.

The foundation of MTsat lies in a 2008 model by Helms and colleagues [@Helms2008-wf], which treats the off-resonance pulse as a second excitation pulse, allowing us to model the effects of MT analytically without the need of the complex Bloch-McConnel equations. Following some reasonable approximations and the acquisition of three distinct MRI images, this model allows for analytical computation of a parameter that models the % reduction in free-pool longitudinal magnetization due to a single off-resonance pulse, MTsat. 

This introduction provides a glimpse into the theoretical basis of MTsat, its practical applications, and sensitivity to variables like tissue _T_{sub}`1` and _B_{sub}`1`. By exploring the unique properties and potential of MTsat, we hope to give readers a better understanding of the advantages and limitations of this MRI technique in both research and clinical practice, as well as give a deeper conceptual understanding of what the MTsat value means.

MTsat, like MTR and many flavours of quantitative MT, is based on spoiled gradient recalled echo (SPGR) images [@Haase1986-kt;@Sekihara1987-bs;@Hargreaves2012-kj] preceded by an off-resonance RF pulse to provide magnetization transfer contrast [@Wolff1989-ag;@Henkelman1993-lt;@Sled2000-pc;@Sled2018-zr]. [](#mtsatFig1) presents a simplified diagram of this MT-prepared SPGR pulse sequence (imaging gradients are not shown). A standard SPGR sequence (low flip angle [~5-10°], short TR [~10-30ms], and a strong spoiler gradient) are preceded by a long (~10 ms) off-resonance (~1-5 kHz) pulse with a strong peak amplitude (the total pulse has an equivalent on-resonance flip angle of 200°-700°). A smooth shape (e.g. Gaussian or Fermi) is typically used for the off-resonance pulse in order to have a single off-resonance frequency (from Fourier analysis). A strong spoiler gradient is also added between the off-resonance MT-preparation pulse and the on-resonance excitation pulse in order to destroy residual transverse magnetization that may have been created by the off-resonance pulse. Images acquired without MT saturation are acquired using the same timing as this sequence, but with the off-resonance RF pulse either completely off or using a very large off-resonance frequency (e.g. ~30+ kHz).

```{figure} img/sequence.png
:label: mtsatFig1
:enumerator: 6.14
Simplified pulse sequence diagram of an MTR imaging sequence. An off-resonance and high powered MT-preparation pulse is followed by a spoiler gradient to destroy any transverse magnetization prior the application of the imaging sequence, in this case a spoiled gradient recalled echo (SPGR).
```

In the initial MTsat paper [@Helms2008-wf;@Helms2010-kv], the main innovation stems from a new model of the MT-weighted SPGR sequence shown in [](#mtsatFig1). There, [@Helms2008-wf] proposed to interpret the effects of the MT-preparation pulse as a second excitation RF pulse of an unknown flip angle. That is to say, they modeled the reduction of the longitudinal magnetization of the free pool due to the MT pulse to be the same reduction caused by the flip angle rotation of a second instantaneous excitation RF pulse. [](#mtsatFig2) presents the Helms model, where to be consistent with the convention presented in mathematical derivations in [@Helms2008-wf;@Helms2010-kv], the order of the pulses are switched such that the readout excitation pulse comes first ({math}`\alpha_{1}`), and the excitation pulse modelling the effects of the MT pulse comes second ({math}`\alpha_{2}`). Note that, after a steady-state is reached, this order would not not impact the signal value during image readout. 

```{figure} img/mtsat_model_sequence.png
:label: mtsatFig2
:enumerator: 6.15  
Pulse sequence model used in MTSat to approximate the effects occurring in the actual MT-weighted sequence ([](#mtsatFig1)), but as a dual-excitation sequence. Note that the defined TR is shifted so that the beginning of the TR occurs at the excitation pulse, instead of the MT pulse as per [](#mtsatFig1), which once a steady-state is established won’t impact the calculations.
```
