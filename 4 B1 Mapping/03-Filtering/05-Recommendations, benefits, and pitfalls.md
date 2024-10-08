---
title: Recommendations, benefits, and pitfalls
subtitle: Filtering
date: 2024-10-07
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
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

Overall, median, Gaussian, and spline filters perform at smoothing noisy _B_{sub}`1` maps. If image artifacts exists in the _B_{sub}`1` maps, then the choice of filter could impact the output _B_{sub}`1` map.  In all our _B_{sub}`1` map examples ([](#filtPlot9)]), a 5x5 voxel median filter would have performed sufficiently all while avoiding spreading errors, this it appears that this may be a relatively safe filter to try first for clinical use in the brain at clinical field strengths. In other field strengths or anatomies, or if different artifacts exist, this may not always be the case. Good care should always be applied when selecting a filter; know why you are using it, what its potential drawbacks are, and look for error spreading in the output _B_{sub}`1` map. 

If your filtered _B_{sub}`1` map is intended for use at boundary edges, such as grey matter, extra precautions should be taken when applying filters and doing quality control. Know how your filters handle edges, and if needed choose to mirror or extrapolate _B_{sub}`1` values beyond the masked region of interest. Quality control is important, as there can be substantial edge artifacts when using filters. 


Finally, remember that using the unfiltered _B_{sub}`1` map is also a choice, and many researchers use these. It’s important to report if you filtered or not your _B_{sub}`1` maps when reporting them in your research.
