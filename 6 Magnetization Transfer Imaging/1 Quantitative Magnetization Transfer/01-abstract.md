---
title: Introduction
subtitle: Quantitative Magnetization Transfer
date: 2024-10-07
label: qmtIntro
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

Magnetization Transfer (MT) has been extensively applied to study macromolecular biological tissue composition. The imaging contrast resides in the magnetization transfer between free-water protons and macromolecular proton compartments, through chemical exchange and dipolar interactions. In the two-pool tissue model, highly mobile protons are associated with the free-water pool while protons found in semisolid macromolecular sites are defined as the restricted pool [@Sled2018-zr]. A simple method for visualizing MT effects includes acquiring two images with and without an off-resonance MT pulse to calculate the MT ratio (MTR), which is the normalized difference of these two images [@Wolff1989-ag]. Despite its proven usefulness to study multiple sclerosis [@Zheng2018-ad], Alzheimer’s disease [@Fornari2012-va] and psychiatric disorders [@Chen2015-ch], the MTR is a semi-quantitative metric that depends critically on the imaging sequence parameters [@Seiberlich2020-wg]. Another semi-quantitative approach is the estimation of MT saturation (MTsat) by fitting the MT signal obtained from an MT-weighted (MTw), a proton density (PD) weighted and _T_{sub}`1`-weighted (T1w) contrast [@Helms2008-wf]. Quantitative MT (qMT) consists of fitting multiple images to a mathematical model to extract tissue-specific parameters related to physical quantities, such as pool sizes, magnetization exchange rates between pools, and _T_{sub}`1`, _T_{sub}`2` relaxation times of each pool. Compared to semi-quantitative approaches (MTR, MTsat), qMT has long acquisition protocols and sometimes needs additional measurements (eg. _B_{sub}`0`, _B_{sub}`1`, _T_{sub}`1`), and the complex models required to fit the quantitative maps makes it a challenging imaging technique.

In 2015, our lab published qMTLab [@Cabana2015-zg], an open-source software project seeking to unify three qMT methods in the same interface: qMT using spoiled gradient echo (qMT-SPGR), qMT using balanced steady-state free precession (qMT-bSSFP), and qMT using selective inversion recovery with fast spin echo (qMT-SIRFSE). qMTLab allowed users to simulate, evaluate, fit, and visualize qMT data with the possibility to share qMT protocols between researchers, allowing them to compare the performance of their methods [@Cabana2015-zg]. Since then, we have extended the project and renamed it to qMRLab, [@Karakuzu2020-ul], which in addition to qMT now provides over 20 quantitative techniques under one umbrella, such as relaxation and diffusion models, quantitative susceptibility mapping, _B_{sub}`0` and _B_{sub}`1` mapping. In addition, we created interactive tutorials (see the _T_{sub}`1` mapping chapters using the [inversion recovery](#irIntroduction), [variable flip angle](#vfaIntroduction), and [MP2RAGE](#mp2rageIntroduction) techniques) and blog posts for several qMRI techniques that were published under a creative commons license made it into a quantitative MRI book published by Elsevier [@Seiberlich2020-wg]. This blog post is a continuation of our qMRLab outreach initiative, where we will focus on qMT and the tools we provide in qMRLab for this class of techniques.

This chapter is an introduction to qMT (with a focus on qMT-SPGR), where we will cover signal modelling and data fitting.