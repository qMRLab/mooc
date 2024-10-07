---
title: Benefits and pitfalls of multi-exponential T2 mapping
subtitle: Multiexponential T2 Mapping
date: 2024-07-25
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

The primary advantage of multi-exponential T2 mapping lies in its improved accuracy in depicting the T2 relaxation of complex tissue microstructure. By considering each voxel as multi-compartmental with multiple tissues each having distinct T2 relaxation times, multiexponential T2 mapping has proven to be more accurate for capturing the T2 relaxation of complex, heterogeneous tissues. As we saw in the previous sections, this makes multi-exponential T2 mapping particularly advantageous in applications such as myelin water fraction imaging, where it is crucial to distinguish the fraction of water attributed to myelin to better understand demyelinating diseases such as MS (Alonso-Ortiz et al., 2015). 

However, acquiring multi-exponential T2 mapping comes with its challenges. First, the increased complexity of multi-exponential mapping compared to mono-exponential models results in longer acquisition times (Kumar et al., 2012). Additionally, multi-exponential methods are also sensitive to noise (Dula et al., 2009), which can make accurate fittings challenging. 

In conclusion, the choice of mono-exponential versus multi-exponential will depend on the specific clinical or research application as well as the complexity of the tissues being studied. While mono-exponential T2 mapping offers simplicity and efficiency, multi-exponential T2 mapping provides a comprehensive and accurate characterization of tissue properties, particularly in heterogeneous or pathological tissues. 
