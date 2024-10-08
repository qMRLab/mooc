---
title: Introduction
subtitle: Dual echo B0 mapping
date: 2024-10-07
authors:
  - name:  Alexandre D'Astous
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

B0 mapping estimates the B0 field from the expected field for every voxel. These B0 maps can be used to perform prospective B0 shimming to minimize B0 inhomogeneities [1], they can be used to retrospectively correct for geometric distortions (FSL FUGUE [13], [14]) (e.g.: for EPI), or to perform retrospective correction for k-space readout trajectory (e.g.: for spiral readout). Moreover, they can be used for retrospective recovery of enhanced signal decay [15], [16], for T2* mapping and they are also vital to quantitative susceptibility mapping (QSM) where the goal is to map the susceptibility of the subject.

One of the most simple and widely adopted techniques used to perform B0 mapping is the 2-echo phase difference technique. This technique is faster and simpler than most other alternatives. Before we dive into the technique, let's dip our toes in some theory.