---
title: Introduction
subtitle: Filtering
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

The behaviour of electromagnetic fields produced by RF antennas are bound by the laws of physics. The Maxwell equations impose many limitations on how these fields can not only vary spatially and temporally, but how the electric and magnetic fields are linked. While propagating magnetic fields interface of boundary between materials can be discontinuous (a result of Maxwell’s equations), it’s been shown in the context of MRI and tissues that the magnetic field amplitudes are expected to be smoothly varying when using clinical MRIs (Sled and Pike 1998; Sled et al. 1998). At ultra-high fields, standing wave artifacts can lead to more B1 variations and even signal nulls, however the field amplitude nonetheless varies continuously (Uğurbil 2018; Vaughan et al. 2001; Yang et al. 2002). Thus, for both B1+ and B1-, their amplitude is expected to be a smoothly varying multiplicative field, and at clinical field strength it’s also expected to be a slowly or low frequency varying field.

In practice, measured B1+ maps are rarely perfectly smooth over the anatomy-of-interest being imaged. Figure 1 shows a comparison of measured B1 maps in the brain produced by three methods: double angle, actual flip angle imaging (AFI), and Bloch-Siegert shift.

:::{figure} #filtFig1cell
:label: filtPlot1
:enumerator: 4.1
Example B1 maps (right column) along with their raw acquired data (left and middle columns) for three different B1 mapping techniques: double angle (top row), actual flip angle imaging (AFI; middle row), and Bloch-Siegert shift (bottom row).
:::

The overall “shape” of the B1 map is the same for all three maps, and this nonuniformity pattern is expected due to the elliptical shape of the brain and its electromagnetic properties (Sled and Pike 1998). We see in the B1 maps of Figure 1 that there is some noise, some distinguishable anatomical structures (caused by T1 sensitivity and/or k-space propagation susceptibility effects), and in one case (AFI) an artifact caused by Gibbs ringing in the acquired images. All of these variations are not present in the actual B1+ field that the spins experience during a pulse sequence, and so using this “raw” B1 map to calibration flip angles or RF power for other quantitative MRI techniques (eg. variable flip angle T1 mapping, quantitative magnetization transfer) risks introducing errors during the correction.

Although not a perfect solution, researchers often smoothen their B1 maps (Yarnykh 2007; Lutti et al. 2010; Boudreau et al. 2017) in an effort to mitigate the error propagation from the B1+ map noise and artifacts prior to use for other techniques. This chapter will discuss some common ways this B1 map smoothing is achieved, show some examples of their benefits and weaknesses, and discuss some best practices.