---
title: Conclusion
subtitle: Advanced _B_{sub}`0` Mapping Methods
date: 2024-10-07
authors:
  - name:  Alexandre D'Astous
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: false
  figure:
    template: Fig. %s
---

_B_{sub}`0` mapping is important for a variety of use cases such as shimming, QSM, and k-space trajectory correction. _B_{sub}`0` maps can be computed with the phase of a simple dual-echo gradient echo sequence, although other sequences can be used. Multi-echo field mapping is a great option compared to dual-echo field mapping when increased accuracy is desired. Different parameters can be used and optimized depending on the different requirements and depending on the use case. Depending on the acquired parameters, phase unwrapping might be necessary to remove phase wraps. Many different algorithms and techniques can be used to unwrap the data and ultimately compute the _B_{sub}`0` field map.