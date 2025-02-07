---
title: Introduction
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

Transmit radiofrequency field maps (_B_{sub}`1`{sup}`+`, or _B_{sub}`1` for short) are used in diverse applications in MRI including: the study of electrical properties in tissues in vivo [@Sled1998-pz;@Katscher2009-lk], specific absorption rate (SAR) calculations [@Ibrahim2001-yj], the calibration of quantitative _T_{sub}`1` [@Deoni2007-se;@Boudreau2017-ik] and _T_{sub}`2` [@Sled2000-pc] maps, better parameter estimation from magnetization transfer measurements [@Ropele2005-pm;@Boudreau2018-kv], _B_{sub}`1` shimming to improve image quality at whole-body ultra high fields [@van-den-Bergen2007-dh], or quality control of RF coils [@Yarnykh2007-bv]. Several _B_{sub}`1` mapping techniques have been developed, and they can be broadly divided as magnitude-based and phase-based methods. The double angle method (DAM) is a saturation-recovery magnitude-based method that takes the ratio of the signal intensity of two magnitude images measured with different excitation flip angles [@Insko1993-ik;@Stollberger1996-kh]. The Bloch-Siegert shift technique is a rapid phase-based method that encodes the _B_{sub}`1` information into phase signal [@Sacolick2010-ga]. The actual flip-angle imaging (AFI) is a magnitude-based _B_{sub}`1` mapping method that consists of a 3D acquisition that benefits from good anatomical coverage. In addition, this technique allows the acquisitions of whole-body (~7 min) and brain (~3 min) _B_{sub}`1` maps leading to a feasible implementation in clinics [@Yarnykh2007-bv]. On the other hand, the AFI pulse sequence has certain constraints that need to be considered for this _B_{sub}`1` mapping method to be widely deployed. Some of the limitations include the use of spoiler gradients that can give rise to prohibitive SAR values [@Sacolick2010-ga], and the pulse sequence modifications on the MRI machine to implement the AFI method.

In this section, we will focus on presenting details about the AFI _B_{sub}`1` mapping method. We will cover signal modeling, data fitting, the benefits and the pitfalls of the technique. The figures are generated using the qMRLab module for this method.