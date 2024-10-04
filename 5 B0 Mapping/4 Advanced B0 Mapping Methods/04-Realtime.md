---
title: Realtime B0 Mapping
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
Specific applications impose constraints that can make field mapping protocols different. One such application is to acquire field maps as close to real-time as possible to characterize the effect of respiration on the field through time. The constraint is therefore to acquire a field map in much less time than a respiration cycle. To save some time, the association of the field with time can be done by acquiring slices one at a time. A 2D scan is therefore preferable in this case, as the slice timing can be associated with the field of the slice rather than using the volume time and the entire volume. An EPI can be used to acquire a field map much faster than a standard gradient-echo. However, as mentioned previously, the distortions might not make this a suitable solution. A 2D dual-echo gradient-echo can be used with minimum TR. Short TEs and RF pulses are also preferable to again reduce the TEs and the TR.