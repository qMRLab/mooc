---
title: Data Fitting
subtitle: Monoexponential T2 Mapping
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

### T2

The T2 signal decay for the mono-exponential model is described mathematically as : 


```{figure} img/eq2.png
:label: t2eq2
```

where S0 is the signal intensity immediately following the excitation pulse (Dortch, 2020; Milford et al., 2015). 

In practice, B1 inhomogeneities and RF pulse imperfections can influence the T2 signal decay curve and result in inaccurate T2 estimations. This may cause refocusing pulses to deviate from the ideal 180 degrees, generating additional echoes known as stimulated or spurious echoes. These unwanted echoes can contaminate the signal decay, resulting in erroneous T2 estimations (McPhee & Wilman, 2018). To account for these stimulated echoes, some studies have shown that T2 fitting accuracy can be improved either by using only even-numbered echoes (Focke et al., 2011; Kim et al., 2009), or by discarding the first echo (Biasiolli et al., 2013; Milford et al., 2015).

### T2*

Until now, we have considered that the transverse signal (Mxy) decays exponentially with the echo time divided by the T2 constant (see equation 3). However, in practice, other factors such as B0 inhomogeneities can cause a more rapid loss of the transverse signal; this results in a faster transverse decay, which is referred to as T2* relaxation (see Figure 2). 

The relation between T2 and T2*  is described as follows (Brown et al., 2014) : 

```{figure} img/eq3.png
:label: t2eq3
```

Where T2′ quantifies the portion of relaxation which is due to magnetic field inhomogeneities. Some studies suggest that T2′ mapping, which can be performed by removing the T2 relaxation effect from T2*, could offer valuable insights for brain disease diagnosis, notably by quantifying blood oxygenation levels (D. Lee et al., 2014) and to predict infarct growth in acute stroke patients (Siemonsen, Fitting, et al., 2008). 

The T2* decay can then be calculated using the same methods as T2, where equation (3) can be rewritten as follows : 

```{figure} img/eq4.png
:label: t2eq4
```

Unlike T2 mapping, which uses spin echo type sequences, T2* mapping is performed using gradient echo sequences (GRE), as they are sensitive to magnetic field inhomogeneities (Cohen-Adad, 2014; Markl & Leupold, 2012). Nonetheless, there are specialized sequences such as the spin and gradient echo (SAGE) sequence (Stokes et al., 2014) that enable the simultaneous acquisition of both T2 and T2*.

### Noise

In MRI, noise in the data can make it harder to accurately fit the T2 decay curve, which is problematic given the necessity for highly precise T2 values in clinical contexts. This issue is particularly pronounced when using pixel-wise T2 mapping, as the signal-to-noise (SNR) is much lower compared to region-of-interest (ROI) T2 mapping approaches (Sandino et al., 2015). Figure 4 shows how varying the level of noise in the acquired data can influence the fitting of the T2 relaxation curve and the resulting T2 constant. As observed in this figure, a low SNR can have a considerable impact on the T2 fitting process. 

```{figure} img/plot2.png
:label: t2Plot2

Impact of noise on T2 relaxometry fitting. The figure shows a single voxel fitting with a true T2 relaxation time of 109 ms. As the noise level increases, the accuracy of the T2 fitting decreases, leading to deviations in the estimated T2 relaxation time from the true value. This demonstrates how higher noise levels can adversely affect the reliability of T2 measurements and may result in inaccurate representations of tissue relaxation properties.
```

The number of echoes used in T2 relaxometry is influenced by several factors, including the need for adequate spacing between echoes, the potential risk of heating the sample, and the challenges associated with processing data from samples with low signal-to-noise ratios. Therefore, selecting an optimal number of echoes is crucial for achieving accurate and reliable results while addressing these constraints (Shrager et al., 1998). The Cramer-Rao lower-bound (CRLB) method is a statistical tool that can be used in the context of T2 relaxometry to estimate the smallest possible variance, known as the lower bound, of an unbiased estimator given the noise present in the data (Cavassila et al., 2001). Using the lower bounds, the optimal number of echoes needed to accurately fit the T2 decay curve can be determined, ensuring more robust T2 mapping (Jones et al., 1996). In their work, Shrager et al. (1998) introduced another method for optimizing the selection of echo time points to improve the accuracy of T2 value estimates based on a predetermined range of expected T2 values. Their approach demonstrated superior accuracy compared to conventional methods that use uniformly-spaced echo times, suggesting that these methods are not optimal for T2 curve fitting accuracy. 
