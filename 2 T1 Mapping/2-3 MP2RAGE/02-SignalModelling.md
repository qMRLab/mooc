---
title: Signal Modelling
subtitle: MP2RAGE
date: 2024-07-25
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: false
  figure:
    template: Fig. %s
---

Prior to considering the full signal equations, we will first introduce the equation for the MP2RAGE parameter (<i>S</i><sub>MP2RAGE</sub>) that is calculated in addition to the T<sub>1</sub> map. For complex data (magnitude and phase, or real and imaginary), the MP2RAGE signal (<i>S</i><sub>MP2RAGE</sub>) is calculated from the images acquired at two TIs (<i>S</i><sub>GRE,TI1</sub> and <i>S</i><sub>GRE,TI2</sub>) using the following expression (Marques et al. 2010):

```{figure} img/equation1.png
:label: mp2ragefig1
```

This value is bounded between [-0.5, 0.5], and helps reduce some B<sub>0</sub> inhomogeneity effects using the phase data. For real data, or magnitude data with polarity restoration, this metric is instead calculated as:


```{figure} img/equation2.png
:label: mp2ragefig2
```

Because MP2RAGE is a hybrid of pulse sequences used for inversion recovery and VFA, the resulting signal equations are more complex. Typically, a steady state is not achieved during the short train of GRE imaging blocks, so the signal at the center of k-space for each readout (which defines the contrast weighting) will depend on the number of phase-encoding steps. For simplicity, the equations presented here assume that the 3D phase-encoding dimension is fully sampled (no partial Fourier or parallel imaging acceleration). For this case (see appendix of (Marques et al. 2010) for derivation details), the signal equations are:


```{figure} img/equation3.png
:label: mp2ragefig3
```

```{figure} img/equation4.png
:label: mp2ragefig14
```

where B<sub>1</sub><sup>-</sup> is the receive field sensitivity, “eff” is the adiabatic inversion pulse efficiency, ER = exp(-TR/T<sub>1</sub>), EA = exp(-TA/T<sub>1</sub>), EB = exp(-TB/T<sub>1</sub>), EC = exp(-TC/T<sub>1</sub>). The variables TA, TB, and TC are the three different delay times (TA: time between inversion pulse and beginning of the GRE<sub>1</sub> block, TB: time between the end of GRE<sub>1</sub> and beginning of GRE<sub>2</sub>, TC: time between the end of GRE<sub>2</sub> and the end of the TR). If no k-space acceleration is used (e.g. no partial Fourier or parallel imaging acceleration), then these values are TA = TI<sub>1</sub> - (n/2)TR, TB = TI<sub>2</sub> - (TI<sub>1</sub> + nTR), and TC = TR<sub>MP2RAGE</sub> - (TI<sub>2</sub> + (n/2)TR), where n is the number of voxels acquired in the 3D phase encode direction varied within each GRE block. The value m<sub>z,ss</sub> is the steady-state longitudinal magnetization prior to the inversion pulse, and is given by:


```{figure} img/equation5.png
:label: mp2ragefig5
```


```{figure} img/equation6.png
:label: mp2ragefig6
```

From Eqs. (3–6), it is evident that the MP2RAGE parameter <i>S</i><sub>MP2RAGE</sub> (Eqs. (1.11) and (1.12)) cancels out the effects of receive field sensitivity, T<sub>2</sub><sup>*</sup>, and M<sub>0</sub>. The signal sensitivity related to the transmit field (B<sub>1</sub><sup>+</sup>), hidden in Eqs. (3–6) within the flip angle values <i>θ<sub>1</sub></i> and <i>θ<sub>2</sub></i>, can also be reduced by careful pulse sequence protocol design (Marques et al. 2010), but not entirely eliminated (Marques & Gruetter 2013).