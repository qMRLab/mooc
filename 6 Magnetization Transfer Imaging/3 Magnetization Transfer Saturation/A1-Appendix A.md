---
title: Theory
subtitle: Magnetization Transfer Saturation
date: 2024-07-25
name: mtsatAppendixA
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: false
  figure:
    template: Fig. %s
---

:::{attention}
:class: attentionDraft
:name: attentionDraft
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

## Derivation

From the MTR protocol in Brown 2013 of the MTR blog post, 1=15 deg and TR = 0.03 s, so assuming a T1 at 1.5T (field strength that Brown used) of 0.55 s in healthy WM, so R1 = 1.8, we can calculate the signal from [5] of an experiment with no MT pulse (alpha2 = 0).


```{math}
:label: mtrEqA1
:enumerator:6A.1
\begin{equation}
S_{0}=0.087\frac{1.8\cdot 0.03}{\frac{0.087^{2}}{2}+0+1.8\cdot 0.03}A \\
S_{0}=0.0815A
\end{equation}
```


For an MT-weighted image, we get an equation as we don’t know alpha2,

```{math}
:label: mtrEqA2
:enumerator:6A.2
\begin{equation}
S_{MT}=0.087\frac{1.8\cdot 0.03}{\frac{0.087^{2}}{2}+\frac{\alpha_{2}^{2}}{2}+1.8\cdot 0.03}A \\
S_{MT}=\frac{0.0047}{0.0578+\frac{\alpha_{2}^{2}}{2}}A 
\end{equation}
```

To simplify (and for reasons seen later), let’s define  δ=22/2 ,



```{math}
:label: mtrEqA3
:enumerator:6A.3
\begin{equation}
S_{MT}=\frac{0.0047}{0.0578+\delta}A 
\end{equation}
```


We’d like to calculate the contribution from the MT pulse, δ. We can do this by using the measured MTR value for this protocol, which we simulated for in the previous blog post and found to be ~0.46. We can now use the MTR equation and substitute the S0 and SMT, and the solve for δ.

```{math}
:label: mtrEqA4
:enumerator:6A.4
\begin{equation}
\text{MTR}=\frac{S_{0}-S_{MT}}{S_{0}}\cdot 100 \\
46=\frac{0.024A-S_{MT}}{0.024A}\cdot 100 \text{, (from 6A1)} \\
S_{MT}=0.044A\text{, (refactor)} \\
\frac{0.0047}{0.0578+\delta}A=0.044A\text{, (from 6A3)} \\
\frac{0.0047}{0.0578+\delta}=0.044\text{, (A cancels out)} \\
\delta=\frac{0.044}{0.0047}-0.0578\text{, (refactor)} \\
\delta=0.049
\end{equation}
```

