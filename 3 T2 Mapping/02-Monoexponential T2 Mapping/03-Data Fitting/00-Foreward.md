---
title: Data Fitting
subtitle: Monoexponential T2 Mapping
date: 2024-10-07
authors:
  - name:  Samuelle St-Onge
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

The _T_{sub}`2` signal decay for the mono-exponential model is described mathematically as : 

```{math}
:label: t2Eq2
:enumerator:3.2
\begin{equation}
\textit{S}\left ( TE \right ) = S_{0}e^{-TE/T_{2}}
\end{equation}
```

where S0 is the signal intensity immediately following the excitation pulse [@Dortch2020-nq;@Milford2015-ef]. 

In practice, _B_{sub}`1` inhomogeneities and RF pulse imperfections can influence the _T_{sub}`2` signal decay curve and result in inaccurate _T_{sub}`2` estimations. This may cause refocusing pulses to deviate from the ideal 180 degrees, generating additional echoes known as stimulated or spurious echoes. These unwanted echoes can contaminate the signal decay, resulting in erroneous _T_{sub}`2` estimations [@McPhee2018-wd]. To account for these stimulated echoes, some studies have shown that _T_{sub}`2` fitting accuracy can be improved either by using only even-numbered echoes [@Focke2011-xh;@Kim2009-yf], or by discarding the first echo [@Biasiolli2013-vy;@Milford2015-ef]. 