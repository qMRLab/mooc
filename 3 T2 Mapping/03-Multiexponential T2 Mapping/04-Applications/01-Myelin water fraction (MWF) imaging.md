---
title: Myelin water fraction (MWF) imaging
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

Myelin water fraction (MWF) imaging demonstrates the clinical relevance of multi-exponential T2 mapping (Kumar et al., 2012; Mackay et al., 1994), given that myelin quantification could help identify potential biomarkers for diseases such as multiple sclerosis (MS). Although MWF technically does not directly measure myelin but rather quantifies the amount of total water trapped between the myelin sheaths, it is argued that myelin can be conceptualized as water, as it constitutes its primary composition (Alonso-Ortiz et al., 2015). 

Conventional T2-weighted images often display hyperintense lesions in MS patients. Unfortunately, these hyperintensities lack specificity for the disease and can be indistinguishable from other biological phenomena such as inflammation, edema and axonal loss (Alonso-Ortiz et al., 2015; J. Lee et al., 2021). MWF holds promise as a potential biomarker for identifying early microstructural changes in myelin, which could improve our understanding of demyelinating diseases such as MS, facilitating both early diagnosis and monitoring of disease progression. 

As described by eq. (9), MWF represents the proportion of the MRI signal attributed to myelin water relative to the total water content in the brain. This total water content includes myelin water (MW) and intra/extracellular water (IEW), also referred to as axonal water (J. Lee et al., 2021). 

\begin{equation}\label{eq:1}
\textit{MWF} = \frac{S_{MW}e^{-TE/T_{2,MW}}}{S_{MW}e^{-TE/T_{2,MW}} + S_{IEW}e^{-TE/T_{2,IEW}}}
\end{equation}

Direct imaging of myelin itself is challenging due to its very short T2 relaxation times. Instead, an alternative is to image myelin-associated water (MW), which has slightly longer T2 relaxation times, typically around 20 ms (J. Lee et al., 2021). While these times are still short, they are measurable with standard spin-echo MRI sequences. Myelin Water Fraction (MWF) imaging takes advantage of this to differentiate and quantify the signal from myelin-associated water, providing a more feasible approach to studying myelin. 