---
title: Data Fitting
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

To fit the data for multi-exponential T2 mapping, equation (6) can be rewritten to express the signal decay in terms of the initial amplitude (Si) for each tissue component. The multi-exponential T2 signal decay is then given by :

```{figure} img/eq7.png
:label: t2eq7
```

Where the term Si corresponds to the initial signal amplitude of the ith tissue component, and T2i is the T2 relaxation time of that component. 

For example, the multi-exponential signal from Figure 5 can be expressed as the combination of the signals from both myelin water (MW) and intra/extracellular water (IEW), as follows :


```{figure} img/eq8.png
:label: t2eq8
```

Figure 6 presents an example of a multi-exponential T2 data fitting applied to an image of the spinal cord. The figure shows the myelin water fraction (MWF) map, which highlights the distribution of myelin water across the spinal cord, as well as the T2 maps for intra/extracellular water and myelin water. The multi-exponential fitting approach allows for the separation of these components, enhancing tissue characterization in complex structures compared to mono-exponential models. In the following section, we will explain why MWF imaging is a key application of multi-exponential T2 mapping, and how it provides valuable insights into the microstructure of the spinal cord, highlighting its potential benefits for understanding and diagnosing neurological conditions.  

```{figure} img/plot2.png
:label: mexplot2

Multi-exponential T2 mapping example of the spinal cord. The left image displays multi-exponential (ME) T2w data acquired at different echo times (TE) used for the data fitting. The right image presents the resulting myelin water fraction (MWF) map and T2 relaxation maps for myelin water (MW) and intra/extracellular water (IEW). 
```