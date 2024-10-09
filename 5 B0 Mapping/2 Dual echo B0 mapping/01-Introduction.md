---
title: Introduction
subtitle: Dual echo B0 mapping
date: 2024-10-07
label: b0DualEcho
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

_B_{sub}`0` mapping estimates the _B_{sub}`0` field from the expected field for every voxel. These _B_{sub}`0` maps can be used to perform prospective _B_{sub}`0` shimming to minimize _B_{sub}`0` inhomogeneities [@Jezzard1995-qd], they can be used to retrospectively correct for geometric distortions (FSL FUGUE [@Jenkinson2012-np;@Smith2004-av]) (e.g.: for EPI), or to perform retrospective correction for k-space readout trajectory (e.g.: for spiral readout). Moreover, they can be used for retrospective recovery of enhanced signal decay [@An2002-ys;@Alonso-Ortiz2017-yo], for _T_{sub}`2`{sup}`*` mapping and they are also vital to quantitative susceptibility mapping (QSM) where the goal is to map the susceptibility of the subject.

One of the most simple and widely adopted techniques used to perform _B_{sub}`0` mapping is the 2-echo phase difference technique. This technique is faster and simpler than most other alternatives. Before we dive into the technique, let's dip our toes in some theory.