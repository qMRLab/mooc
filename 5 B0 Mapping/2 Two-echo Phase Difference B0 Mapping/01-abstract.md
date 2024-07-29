---
title: Abstract
subtitle: 2-echo B0 mapping
date: 2024-07-25
authors:
  - name:  Alexandre Dastous
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: false
  figure:
    template: Fig. %s
---

B0 mapping consists in computing a map of the B0 field from the expected field for every voxel. These B0 maps can be used to perform prospective B0 shimming to minimize B0 inhomogeneities [1], they can be used to retrospectively correct for geometric distortions (FSL FUGUE [13], [14]) (e.g.: for EPI), or to perform retrospective correction for k-space readout trajectory (e.g.: for spiral readout). Moreover, they can be used for retrospective recovery of enhanced signal decay [15], [16], they are also vital to quantitative susceptibility mapping (QSM) where the goal is to map the susceptibility of the subject and T2* mapping.

One of the most simple and widely adopted techniques used to perform B0 mapping is the 2 echo phase difference technique. This technique is quicker and simpler than most other alternatives. Before we dive into the technique, some simple spin foundation is explained.