---
title: Recommendatios, benefits, and pitfalls
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

Overall, median, Gaussian, and spline filters perform at smoothing noisy B1 maps. If image artifacts exists in the B1 maps, then the choice of filter could impact the output B1 map.  In all our B1 map examples (Figure 9), a 5x5 voxel median filter would have performed sufficiently all while avoiding spreading errors, this it appears that this may be a relatively safe filter to try first for clinical use in the brain at clinical field strengths. In other field strengths or anatomies, or if different artifacts exist, this may not always be the case. Good care should always be applied when selecting a filter; know why you are using it, what its potential drawbacks are, and look for error spreading in the output B1 map. 

If your filtered B1 map is intended for use at boundary edges, such as grey matter, extra precautions should be taken when applying filters and doing quality control. Know how your filters handle edges, and if needed choose to mirror or extrapolate B1 values beyond the masked region of interest. Quality control is important, as there can be substantial edge artifacts when using filters. 


Finally, remember that using the unfiltered B1 map is also a choice, and many researchers use these. It’s important to report if you filtered or not your B1 maps when reporting them in your research.
