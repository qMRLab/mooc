---
title: Introduction
subtitle: MP2RAGE
date: 2024-10-07
label: mp2rageIntroduction
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

Dictionary-based MRI techniques capable of generating _T_{sub}`1` maps are increasing in popularity, due to their growing availability on clinical scanners, rapid scan times, and fast post-processing computation time, thus making quantitative _T_{sub}`1` mapping accessible for clinical applications. Generally speaking, dictionary-based quantitative MRI techniques use numerical dictionaries—databases of pre-calculated signal values simulated for a wide range of tissue and protocol combinations—during the image reconstruction or post-processing stages. Popular examples of dictionary-based techniques that have been applied to _T_{sub}`1` mapping are MR Fingerprinting (MRF) [@Ma2013-bc], certain flavours of compressed sensing (CS) [@Doneva2010-mq;@Li2012-hx], and Magnetization Prepared 2 Rapid Acquisition Gradient Echoes (MP2RAGE) [@Marques2010-mo]. Dictionary-based techniques can usually be classified into one of two categories: techniques that use information redundancy from parametric data to assist in accelerated imaging (e.g. CS, MRF), or those that use dictionaries to estimate quantitative maps using the MR images after reconstruction. Because MP2RAGE is a technique implemented primarily for _T_{sub}`1` mapping, and it is becoming increasingly available as a standard pulse sequence on many MRI systems, the remainder of this section will focus solely on this technique. However, many concepts discussed are shared by other dictionary-based techniques.

MP2RAGE is an extension of the conventional MPRAGE pulse sequence widely used in clinical studies [@Haase1989-vk;@Mugler1990-li]. A simplified version of the MP2RAGE pulse sequence is shown in [](#mp2rageFig1). MP2RAGE can be seen as a hybrid between the inversion recovery and VFA pulse sequences: a 180° inversion pulse is used to prepare the magnetization for _T_{sub}`1` sensitivity at the beginning of each TR{sub}`MP2RAGE`, and then two images are acquired at different inversion times using gradient recalled echo (GRE) imaging blocks with low flip angles and short repetition times (TR). During a given GRE imaging block, each excitation pulse is followed by a constant in-plane (“y”) phase encode weighting (varied for each TR{sub}`MP2RAGE`), but with different 3D (“z”) phase encoding gradients (varied at each TR). The center of k-space for the 3D phase encoding direction is acquired at the TI for each GRE imaging block. The main motivation for developing the MP2RAGE pulse sequence was to provide a metric similar to MPRAGE, but with self-bias correction of the static (_B_{sub}`0`) and receive (_B_{sub}`1`{sup}`-`) magnetic fields, and a first order correction of the transmit magnetic field (_B_{sub}`1`{sup}`+`). However, because two images at different TIs are acquired (unlike MPRAGE, which only acquires data at a single TI), information about the _T_{sub}`1` values can also be inferred, thus making it possible to generate quantitative _T_{sub}`1` maps using this data.


```{figure} img/mp2rage_pulsesequence.png
:label: mp2rageFig1
:enumerator: 2.13
Simplified diagram of an MP2RAGE pulse sequence. TR: repetition time between successive gradient echo readouts, TR{sub}`MP2RAGE`: repetition time between successive adiabatic 180° inversion pulses, TI{sub}`1` and TI{sub}`2`: inversion times, {math}`\theta_{1}` and {math}`\theta_{2}`: excitation flip angles. The imaging readout events occur within each TR using a constant in-plane phase encode (“y”) gradient set for each TR{sub}`MP2RAGE`, but varying 3D phase encode (“z”) gradients between each successive TR.
```
