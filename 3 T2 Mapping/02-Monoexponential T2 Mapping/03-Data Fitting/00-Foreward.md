---
title: Data Fitting
subtitle: Monoexponential T2 Mapping
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

The T2 signal decay for the mono-exponential model is described mathematically as : 

```{math}
:label: t2Eq2
:enumerator:3.2
\begin{equation}
\textit{S}\left ( TE \right ) = S_{0}e^{-TE/T_{2}}
\end{equation}
```

where S0 is the signal intensity immediately following the excitation pulse (Dortch, 2020; Milford et al., 2015). 

In practice, B1 inhomogeneities and RF pulse imperfections can influence the T2 signal decay curve and result in inaccurate T2 estimations. This may cause refocusing pulses to deviate from the ideal 180 degrees, generating additional echoes known as stimulated or spurious echoes. These unwanted echoes can contaminate the signal decay, resulting in erroneous T2 estimations (McPhee & Wilman, 2018). To account for these stimulated echoes, some studies have shown that T2 fitting accuracy can be improved either by using only even-numbered echoes (Focke et al., 2011; Kim et al., 2009), or by discarding the first echo (Biasiolli et al., 2013; Milford et al., 2015). 