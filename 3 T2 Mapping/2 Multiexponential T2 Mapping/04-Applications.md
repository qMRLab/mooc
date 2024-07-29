---
title: Applications
subtitle: Multiexponential T2 Mapping
date: 2024-07-25
authors:
  - name:  Samuelle Stonge
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: false
  figure:
    template: Fig. %s
---

### Myelin water fraction (MWF) imaging

Myelin water fraction (MWF) imaging is an example of an application for which multi-exponential T2 mapping demonstrated relevance (Kumar et al., 2012; Mackay et al., 1994), given that myelin quantification could help identify potential biomarkers for diseases such as multiple sclerosis (MS). Although MWF technically does not directly measure myelin but rather quantifies the amount of total water trapped between the myelin sheath, it is argued that myelin can be conceptualized as water since it constitutes its primary composition (Alonso-Ortiz et al., 2015). 

Conventional T2-weighted images often display hyperintense lesions in MS patients. Unfortunately, these hyperintensities lack specificity for the disease and can be indistinguishable from other biological phenomena such as inflammation, edema and axonal loss (Alonso-Ortiz et al., 2015; J. Lee et al., 2021). MWF holds promise as a potential biomarker for identifying early microstructural changes in myelin, which could improve our understanding of demyelinating diseases such as MS, facilitating both early diagnosis and monitoring of disease progression. 

As described by eq. (9), MWF represents the proportion of the MRI signal attributed to myelin water relative to the total water content in the brain. This total water content includes myelin water (MW) and intra/extracellular water (IEW), also referred to as axonal water (J. Lee et al., 2021). 

```{figure} img/eq9.png
:label: t2eq9
```

Direct imaging of myelin itself is challenging due to its very short T2 relaxation times, which are too rapid for conventional MRI techniques to measure effectively. Instead, an alternative is to use image myelin-associated water (MW), which has slightly longer T2 relaxation times, typically around 20 ms (J. Lee et al., 2021). While these times are still short, they are measurable with standard spin-echo MRI sequences. Myelin Water Fraction (MWF) imaging takes advantage of this to differentiate and quantify the signal from myelin-associated water, providing a more feasible approach to studying myelin. 


### T2* and quantitative susceptibility mapping (QSM) 

Quantitative susceptibility mapping (QSM) is another quantitative MRI technique, which measures variations in tissue magnetic susceptibility (Ruetten et al., 2019; Wang & Liu, 2015). By assessing the differences in magnetic susceptibility among various tissues, QSM imaging can accurately quantify paramagnetic substances like iron, calcium and oxygen, as well as diamagnetic substances such as myelin (Ruetten et al., 2019). The ability to measure these substances has considerable clinical potential, as they provide valuable insights into tissue physiology and integrity. For instance, alterations in iron levels have been linked to neurodegenerative diseases like multiple sclerosis (Stephenson et al., 2014) and Parkinson’s disease (Chen et al., 2019), making QSM a promising technique for identifying biomarkers for these neurodegenerative disorders and emphasizing its importance in clinical research.

In MRI, the acquired signal is a complex signal, comprising both magnitude and phase components. While traditional contrasts such as T1, T2 and T2* only exploit the magnitude of the MRI signal, the phase component holds valuable information about tissue magnetic susceptibility. This is fundamental for QSM imaging. 

As we have covered in 3.2.3.1, T2* accounts for both tissue T2 relaxation times as well as the relaxation due to magnetic field inhomogeneities, characterized by T2’. These inhomogeneities induce signal dephasing in MRI. Since differences in magnetic susceptibility between tissues are a primary cause of these inhomogeneities, phase information is crucial for measuring tissue susceptibility (Ruetten et al., 2019). In QSM, the combination of both magnitude and phase data from T2* acquisitions enables the quantification and spatial mapping of magnetic susceptibility within tissues (Shmueli, 2020). 

