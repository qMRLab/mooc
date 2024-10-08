---
title: Introduction
subtitle: Dual echo _B_{sub}`0` mapping
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

_B_{sub}`0` mapping estimates the _B_{sub}`0` field from the expected field for every voxel. These _B_{sub}`0` maps can be used to perform prospective _B_{sub}`0` shimming to minimize _B_{sub}`0` inhomogeneities [1], they can be used to retrospectively correct for geometric distortions (FSL FUGUE [13], [14]) (e.g.: for EPI), or to perform retrospective correction for k-space readout trajectory (e.g.: for spiral readout). Moreover, they can be used for retrospective recovery of enhanced signal decay [15], [16], for _T_{sub}`2`{sup}`*` mapping and they are also vital to quantitative susceptibility mapping (QSM) where the goal is to map the susceptibility of the subject.

One of the most simple and widely adopted techniques used to perform _B_{sub}`0` mapping is the 2-echo phase difference technique. This technique is faster and simpler than most other alternatives. Before we dive into the technique, let's dip our toes in some theory.