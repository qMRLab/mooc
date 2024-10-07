---
title: Phase unwrapping ambiguity
subtitle: Phase Unwrapping
date: 2024-07-25
authors:
  - name:  Alexandre Dastous
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---
There is ambiguity to unwrapping and a choice needs to be made regarding the true signal (see Figure 3). If the wrong one is selected, this creates a 2n offset from the true phase. When unwrapping a single phase volume, an educated guess can be made by calculating the average phase in the ROI and expect that to be close to 0 (we assume here that a good frequency shim was first performed in the ROI). n is chosen and the 2n offset is removed from the unwrapped phase map such that the average phase in the ROI is close to 0. Note that this is not a perfectly robust solution because phase is also affected by other factors such as the receive coil, RF pulse and [eddy currents](https://en.wikipedia.org/wiki/Eddy_current) which could cause the average phase offset to deviate from 0. Fortunately, phase difference images are more reliably unwrapped since some of the phase offsets are constant in both phase images and are removed  when performing the phase difference resulting in a phase offset closer to 0. 

If multiple echoes are acquired, a combination of spatial and temporal unwrapping may be necessary. Multi-echo field mapping is discussed in the following section. Note that with appropriate selections of the echo times, the 2n offset ambiguity can be remedied. 
