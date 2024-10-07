---
title: Signal Modelling
subtitle: MP2RAGE
date: 2024-07-25
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

Prior to considering the full signal equations, we will first introduce the equation for the MP2RAGE parameter (_S_{sub}`MP2RAGE`) that is calculated in addition to the T<sub>1</sub> map. For complex data (magnitude and phase, or real and imaginary), the MP2RAGE signal (_S_{sub}`MP2RAGE`) is calculated from the images acquired at two TIs (_S_{sub}`GRE,TI1` and _S_{sub}`GRE,TI2`) using the following expression (Marques et al. 2010):

```{math}
:label: mp2rageEq1
:enumerator:2.11
\begin{equation}
S_{\text{MP2RAGE}}=\text{real}\left( \frac{S_{\text{GRE}_{\text{TI}_{1}}}^{\ast}S_{\text{GRE}_{\text{TI}_{2}}}^{\ast}}{\left| S_{\text{GRE}_{\text{TI}_{1}}} \right|^{2}+ \left| S_{\text{GRE}_{\text{TI}_{2}}} \right|^{2}} \right)
\end{equation}
```

This value is bounded between [-0.5, 0.5], and helps reduce some B<sub>0</sub> inhomogeneity effects using the phase data. For real data, or magnitude data with polarity restoration, this metric is instead calculated as:

```{math}
:label: mp2rageEq2
:enumerator:2.12
\begin{equation}
S_{\text{MP2RAGE}}=\text{real}\left( \frac{S_{\text{GRE}_{\text{TI}_{1}}}^{\ast}S_{\text{GRE}_{\text{TI}_{2}}}^{\ast}}{S_{\text{GRE}_{\text{TI}_{1}}}^{2}+ S_{\text{GRE}_{\text{TI}_{2}}}^{2}} \right)
\end{equation}
```


Because MP2RAGE is a hybrid of pulse sequences used for inversion recovery and VFA, the resulting signal equations are more complex. Typically, a steady state is not achieved during the short train of GRE imaging blocks, so the signal at the center of k-space for each readout (which defines the contrast weighting) will depend on the number of phase-encoding steps. For simplicity, the equations presented here assume that the 3D phase-encoding dimension is fully sampled (no partial Fourier or parallel imaging acceleration). For this case (see appendix of (Marques et al. 2010) for derivation details), the signal equations are:


```{math}
:label: mp2rageEq3
:enumerator:2.13
\begin{equation}
\begin{split}
S_{\text{GRE}_{\text{TI}_{1}}}=&B_{1}^{-}e^{-\text{TE}/T_{2}^{\ast }}M_{0}\text{sin}\left( \theta_{1} \right) \\
&\times \Bigg[ \left( \frac{-\text{eff}m_{z,ss}}{M_{0}}\text{EA}+\left( 1-\text{EA} \right) \right)\left( \text{cos}\left( \theta_{1} \right) \text{ER} \right)^{n/2-1}\\
&\quad\quad+\left( 1-\text{ER} \right) \frac{1-\left( \text{cos}\left( \theta_{1} \right)\text{ER} \right)^{n/2-1}}{1-\text{cos}\left( \theta_{1} \right)\text{ER}} \Bigg] 
\end{split}
\end{equation}
```

```{math}
:label: mp2rageEq4
:enumerator:2.14
\begin{equation}
\begin{split}
S_{\text{GRE}_{\text{TI}_{2}}}=&B_{1}^{-}e^{-\text{TE}/T_{2}^{\ast }}M_{0}\text{sin}\left( \theta_{2} \right) \\
&\times \Bigg[\frac{ \frac{m_{z,ss}}{M_{0}}\text{EA}+\left( 1-\text{EC} \right)}{\text{EC}\left( \text{cos}\left( \theta_{2} \right)\text{ER} \right)^{n/2}}-\left( 1-\text{ER} \right)\frac{\left( \text{cos}\left( \theta_{2} \right)\text{ER} \right)^{-n/2}-1 }{1-\text{cos}\left( \theta_{2} \right)\text{ER} } \Bigg] 
\end{split}
\end{equation}
```

where _B_{sub}`1`{sup}`-` is the receive field sensitivity, “eff” is the adiabatic inversion pulse efficiency, ER = exp(-TR/_T_{sub}`1`), EA = exp(-TA/_T_{sub}`1`), EB = exp(-TB/_T_{sub}`1`), EC = exp(-TC/T<sub>1</sub>). The variables TA, TB, and TC are the three different delay times (TA: time between inversion pulse and beginning of the GRE{sub}`1` block, TB: time between the end of GRE{sub}`1` and beginning of GRE{sub}`2`, TC: time between the end of GRE{sub}`2` and the end of the TR). If no k-space acceleration is used (e.g. no partial Fourier or parallel imaging acceleration), then these values are TA = TI{sub}`1` - (n/2)TR, TB = TI{sub}`2` - (TI{sub}`1` + nTR), and TC = TR{sub}`MP2RAGE` - (TI{sub}`1` + (n/2)TR), where n is the number of voxels acquired in the 3D phase encode direction varied within each GRE block. The value m{sub}`1z,ss is the steady-state longitudinal magnetization prior to the inversion pulse, and is given by:


```{math}
:label: mp2rageEq5
:enumerator:2.15
\begin{equation}
m_{z,ss}\frac{M_{0}\left[ \beta\left( \text{cos}\left( \theta_{2} \right)\text{ER} \right)^{n}+\left( 1-\text{ER} \right)\frac{1-\left( \text{cos}\left( \theta_{2} \right)\text{ER} \right)^{n}}{1-\text{cos}\left( \theta_{2} \right)\text{ER} } \right]\text{EC+}\left( 1- \text{EC}\right)}{1+\text{eff}\left( \text{cos}\left( \theta_{1} \right) \text{cos}\left( \theta_{2} \right) \right)^{n}e^{-TR_{\text{MP2RAGE}}/T_{1}}}
\end{equation}
```

```{math}
:label: mp2rageEq6
:enumerator:2.16
\begin{equation}
\beta=\bigg( \left( 1-\text{EA} \right) \left( \text{cos}\left( \theta_{1}\right)\text{ER}  \right)^{n}+\left( 1-\text{ER} \right)\frac{1-\left( \text{cos}\left( \theta_{1}\right)\text{ER}  \right)^{n}}{1-\text{cos}\left( \theta_{1}\right)\text{ER}  }\bigg)\text{EB}+\left( 1-\text{EB} \right)
\end{equation}
```

From Equations [2.13](#mp2rageEq3), [2.14](#mp2rageEq4), [2.15](#mp2rageEq5), and [2.13](#mp2rageEq6), it is evident that the MP2RAGE parameter _S_{sub}`MP2RAGE` (Equations [2.11](#mp2rageEq1), [2.12](#mp2rageEq2)) cancels out the effects of receive field sensitivity, _T_{sub}`2`{sup}`*`, and _M_{sub}`0`. The signal sensitivity related to the transmit field (B{sub}`1`{sup}`+`), hidden in Equations [2.13](#mp2rageEq3), [2.13](#mp2rageEq4), [2.15](#mp2rageEq5), and [2.13](#mp2rageEq6) within the flip angle values _θ_{sub}`1` and _θ_{sub}`1`, can also be reduced by careful pulse sequence protocol design (Marques et al. 2010), but not entirely eliminated (Marques & Gruetter 2013).