---
title: T2* and quantitative susceptibility mapping (QSM)
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

Quantitative susceptibility mapping (QSM) is another quantitative MRI technique, which measures variations in tissue magnetic susceptibility (Ruetten et al., 2019; Wang & Liu, 2015). By assessing the differences in magnetic susceptibility between various tissues, QSM can accurately quantify paramagnetic substances like iron, calcium and oxygen, as well as diamagnetic substances such as myelin (Ruetten et al., 2019). The ability to measure these substances has considerable clinical potential, as they provide valuable insights into tissue physiology and integrity. For instance, alterations in iron levels have been linked to neurodegenerative diseases like multiple sclerosis (Stephenson et al., 2014) and Parkinson’s disease (Chen et al., 2019), making QSM a promising technique for identifying biomarkers for these neurodegenerative disorders and emphasizing their importance in clinical research. 

In MRI, the acquired signal is complex, consisting of a magnitude and phase component. While traditional contrasts such as T1, T2 and T2* only exploit the magnitude of the MRI signal, the phase component holds valuable information about tissue magnetic susceptibility. This is fundamental for QSM imaging. 

As we have covered in 3.2.3.1, T2* accounts for both T2 relaxation times and the relaxation due to magnetic field inhomogeneities, characterized by T2’. These inhomogeneities induce signal dephasing in MRI. As differences in magnetic susceptibility between tissues are a primary cause of these inhomogeneities, phase information is crucial for measuring tissue susceptibility (Ruetten et al., 2019). In QSM, the combination of both magnitude and phase data from T2* acquisitions enables the quantification and spatial mapping of magnetic susceptibility within tissues (Shmueli, 2020). 