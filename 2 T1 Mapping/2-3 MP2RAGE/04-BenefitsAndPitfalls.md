---
title: Benefits and Pitfalls
subtitle: MP2RAGE
date: 2024-07-25
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure 2.%s
  equation:
    template: Eq. 2.%s
---


This widespread availability and its turnkey acquisition/fitting procedures are a main contributing factor to the growing interest for including quantitative T<sub>1</sub> maps in clinical and neuroscience studies. T<sub>1</sub> values measured using MP2RAGE showed  high levels of reproducibility for the brain in an inter- and intra-site study at eight sites (same MRI hardware/software and at 7 T) of two subjects (Voelker et al. 2016). Not only does MP2RAGE have one of the fastest acquisition and post-processing times among quantitative T<sub>1</sub> mapping techniques, but it can accomplish this while acquiring very high resolution T<sub>1</sub> maps (1 mm isotropic at 3T and submillimeter at 7T, both in under 10 min (Fujimoto et al. 2014)), opening the doors to cortical studies which greatly benefit from the smaller voxel size (Waehnert et al. 2014; Beck et al. 2018; Haast et al. 2018).


Despite these benefits, MP2RAGE and similar dictionary-based techniques have certain limitations that are important to consider before deciding to incorporate them in a study. Good reproducibility of the quantitative T<sub>1</sub> map is dependent on using one pre-calculated dictionary. If two different dictionaries are used (e.g. cross-site with different MRI vendors), the differences in the dictionary interpolations will likely result in minor differences in T<sub>1</sub> estimates for the same data. Also, although the B1-sensitivity of the MP2RAGE T<sub>1</sub> maps can be reduced with proper protocol optimization, it can be substantial enough that further correction using a measured B<sub>1</sub> map should be done (Marques & Gruetter 2013; Haast et al. 2018). However B<sub>1</sub> mapping brings an additional potential source of error, so carefully selecting a B<sub>1</sub> mapping technique and accompanying post-processing method (e.g. filtering) should be done before integrating it in a T<sub>1</sub> mapping protocol (Boudreau et al. 2017). Lastly, the MP2RAGE equations (and thus, dictionaries) assume monoexponential longitudinal relaxation, and this has been shown to result in suboptimal estimates of the long T<sub>1</sub> component for a biexponential relaxation model (Rioux et al. 2016), an effect that becomes more important at higher fields.