---
title: Signal Modelling
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

The decay of the transverse magnetization (Mxy) is exponential and can be derived from the transverse component of the Bloch equations: 

```{figure} img/eq1.png
:label: t2eq1
```
where Mz(0-) is the longitudinal magnetization immediately preceding the 90 degree excitation pulse. By using this equation, we make the assumption that the measured signal is proportional to the transverse magnetization (Mxy), and that Mz(0-) remains constant regardless of echo time (TE) (Dortch, 2020).

Figure 3 shows transverse relaxation curves for T2 and T2* values for white matter and gray matter, using the relaxation times from Siemonsen et al. (2008). 


```{figure} img/plot1.png
:label: t2Plot1

Transverse relaxation decay curves for T2 and T2* values of the white matter and gray matter. The T2 and T2* constants were taken from Siemonsen et al. (2008).
```

In NMR physics, it’s been shown that T2 relaxation times must be equal to or shorter than 2T1 (Levitt, 2008); however, it has been demonstrated that T2 can exceed T1 in very rare cases (Traficante, 1991). In living organisms however, T2 is always shorter than T1. 