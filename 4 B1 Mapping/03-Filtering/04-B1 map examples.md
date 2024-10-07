---
title: B1 map examples
subtitle: Filtering
date: 2024-07-25
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

:::{attention}
:class: attentionDraft
:name: attentionDraft
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

Let’s revisit our initial B1 maps in [](filtPlot1) and see how they respond to the filters we’ve explored in the previous section. The double angle B1 maps were mostly impacted by noise and structural T1 patterns, AFI had some artifacts that were caused by Gibbs ringing in the raw images, and the Bloch-Siegert B1 map had an artifact caused by a phase pole at the end of a fringe line. [](filtPlot9) shows each of the B1 map and the filtered maps using the median, Gaussian, and spline filtering techniques.

:::{figure} #filtFig9cell
:label: filtPlot9
:enumerator: 4.22
Filtered B1 maps
:::

All three methods worked well with the double angle B1 map, and the outputs of the median and Gaussian are most similar. The top right corner of the spline-filtered double angle B1 map has higher intensity, likely due to an edge effect as discussed in the 1D example section. For AFI, median and gaussian filters removed most of the repeated variations, whereas spline-filtering didn’t at the medium filter strength. Lastly, for Bloch-Siegert, the median filter performed well at removing the noise and smoothing out the artifact, though some still remains. For the Gaussian and spline cases, there was a single pixel in the left that had very high value in the unfiltered images and this led to a spreading of high B1 values to nearby voxels, something that didn’t occur for the median filter case. If either of these filters were used in an automated pipeline without quality control, inaccurate B1 values would have been spread, which is undesireable.
