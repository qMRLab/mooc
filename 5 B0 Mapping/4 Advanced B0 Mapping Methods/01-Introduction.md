---
title: Introduction
subtitle: Advanced B0 Mapping Methods
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

Although dual-echo field mapping can be used for many applications, more advanced B0 mapping techniques are available depending on the use-case. Multi-echo field mapping, which makes use of more echoes, can be used to increase the accuracy of the computed field map. This can be useful for qMRI, shimming, or QSM, where the goal is to gather field information to map the susceptibility of the tissues. QSM is sensitive to small local variations, therefore a more accurate approach can be beneficial. This section also discusses fast B0 field mapping in the context of capturing B0 variations due to air differences generated by breathing. B0 maps can be affected by [eddy currents](https://en.wikipedia.org/wiki/Eddy_current) and a section is dedicated to their reduction.