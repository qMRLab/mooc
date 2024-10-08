---
title: Benefits and Pitfalls
subtitle: Monoexponential T2 Mapping
date: 2024-10-07
authors:
  - name:  Samuelle Stonge
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

The main benefit of mono-exponential _T_{sub}`2` mapping is its simplicity and straightforward implementation, making it a convenient and efficient method for _T_{sub}`2` fitting. Additionally, as mentioned previously, the use of multi-echo spin echo (MESE) sequences significantly reduces the acquisition time, further enhancing its practicality (Fatemi et al., 2020, (Milford et al., 2015). 

Despite these advantages, mono-exponential methods have certain drawbacks. First, by assuming a single _T_{sub}`2` relaxation constant per voxel, the mono-exponential method tends to over-simplify the tissue microstructure, potentially leading to inaccurate _T_{sub}`2` estimations. This limitation can be particularly problematic when studying tissues that have a complex microstructure, where a single voxel may contain components with different _T_{sub}`2` relaxation times. Furthermore, it has been shown that MESE sequences are sensitive to imperfections in the radiofrequency pulses. For instance, factors such as _B_{sub}`1` inhomogeneities and reduced flip angles have been shown to overestimate _T_{sub}`2` times when using mono-exponential methods. (Fatemi et al., 2020). 