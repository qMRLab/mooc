---
title: Benefits and Pitfalls
subtitle: MP2RAGE
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


This widespread availability and its turnkey acquisition/fitting procedures are a main contributing factor to the growing interest for including quantitative _T_{sub}`1` maps in clinical and neuroscience studies. _T_{sub}`1` values measured using MP2RAGE showed  high levels of reproducibility for the brain in an inter- and intra-site study at eight sites (same MRI hardware/software and at 7 T) of two subjects [@Voelker2016-qs]. Not only does MP2RAGE have one of the fastest acquisition and post-processing times among quantitative _T_{sub}`1` mapping techniques, but it can accomplish this while acquiring very high resolution _T_{sub}`1` maps (1 mm isotropic at 3T and submillimeter at 7T, both in under 10 min [@Fujimoto2014-fv]), opening the doors to cortical studies which greatly benefit from the smaller voxel size [@Waehnert2014-co;@Beck2018-qh;@Haast2018-fp].


Despite these benefits, MP2RAGE and similar dictionary-based techniques have certain limitations that are important to consider before deciding to incorporate them in a study. Good reproducibility of the quantitative _T_{sub}`1` map is dependent on using one pre-calculated dictionary. If two different dictionaries are used (e.g. cross-site with different MRI vendors), the differences in the dictionary interpolations will likely result in minor differences in _T_{sub}`1` estimates for the same data. Also, although the _B_{sub}`1`-sensitivity of the MP2RAGE _T_{sub}`1` maps can be reduced with proper protocol optimization, it can be substantial enough that further correction using a measured _B_{sub}`1` map should be done [@Marques2013-ab;@Haast2018-fp]. However _B_{sub}`1` mapping brings an additional potential source of error, so carefully selecting a _B_{sub}`1` mapping technique and accompanying post-processing method (e.g. filtering) should be done before integrating it in a _T_{sub}`1` mapping protocol [@Boudreau2017-tu]. Lastly, the MP2RAGE equations (and thus, dictionaries) assume monoexponential longitudinal relaxation, and this has been shown to result in suboptimal estimates of the long _T_{sub}`1` component for a biexponential relaxation model [@Rioux2016-va], an effect that becomes more important at higher fields.