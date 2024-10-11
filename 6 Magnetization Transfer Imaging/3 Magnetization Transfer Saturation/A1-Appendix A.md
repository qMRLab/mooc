---
title: Appendix A
subtitle: Magnetization Transfer Saturation
date: 2024-10-07
name: mtsatAppendixA
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

:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

## Derivation

From the MTR protocol in [@Brown2013-eg] of the MTR section, {math}`\alpha_{1}`=15 deg and TR = 0.03 s, so assuming a _T_{sub}`1` at 1.5T (field strength that Brown used) of 0.55 s in healthy WM, so _R_{sub}`1` = 1.8, we can calculate the signal from [](#mtsatEq6) of an experiment with no MT pulse ({math}`\alpha_{2}` = 0).



```{math}
:label: mtrEqA1
:enumerated: false
\begin{equation}
\\
S_{0}=0.087\frac{\left(1.8\cdot 0.03\right)}{\frac{0.087^{2}}{2}+0+1.8\cdot 0.03}A
\end{equation}
```


```{math}
:label: mtrEqA2
:enumerator:6A.1
\begin{equation}
S_{0}=0.0815A
\end{equation}
```


For an MT-weighted image, we get an equation as we don’t know {math}`\alpha_{2}`,

```{math}
:label: mtrEqA3
:enumerated: false
\begin{equation}
S_{MT}=0.087\frac{\left(1.8\cdot 0.03\right)}{\frac{0.087^{2}}{2}+\frac{\alpha_{2}^{2}}{2}+1.8\cdot 0.03}A
\end{equation}
```

```{math}
:label: mtrEqA4
:enumerator:6A.2
\begin{equation}
S_{MT}=\frac{0.0047}{0.0578+\frac{\alpha_{2}^{2}}{2}}A 
\end{equation}
```


To simplify (and for reasons seen later), let’s define {math}`\delta=\alpha_{2}^{2}/2`,



```{math}
:label: mtrEqA5
:enumerator:6A.3
\begin{equation}
S_{MT}=\frac{0.0047}{0.0578+\delta}A 
\end{equation}
```


We’d like to calculate the contribution from the MT pulse, δ. We can do this by using the measured MTR value for this protocol, which we simulated for in the previous blog post and found to be ~0.46. We can now use the MTR equation and substitute the _S_{sub}`0` and _S_{sub}`MT`, and the solve for δ.

```{math}
:label: mtrEqA6
:enumerated: false
\begin{equation}
\text{MTR}=\frac{\left(S_{0}-S_{MT}\right)}{S_{0}}\cdot 100
\end{equation}
```

```{math}
:label: mtrEqA7
:enumerated: false
\begin{equation}
46=\frac{\left(0.0815A-S_{MT}\right)}{0.0815A}\cdot 100 \text{, (from 6A1)}
\end{equation}
```
```{math}
:label: mtrEqA8
:enumerated: false
\begin{equation}
S_{MT}=0.044A\text{, (refactor)} \\
\end{equation}
```
```{math}
:label: mtrEq9
:enumerated: false
\begin{equation}
\left(\frac{0.0047}{0.0578+\delta}\right)A=0.044A\text{, (from 6A3)}
\end{equation}
```
```{math}
:label: mtrEqA10
:enumerated: false
\begin{equation}
\frac{\left(0.0047\right)}{\left(0.0578+\delta\right)}=0.044\text{, (A cancels out)}
\end{equation}
```
```{math}
:label: mtrEqA11
:enumerated: false
\begin{equation}
\delta=\left(\frac{0.0047}{0.044}\right)-0.0578\text{, (refactor)}
\end{equation}
```
```{math}
:label: mtrEqA12
:enumerator:6A.4
\begin{equation}
\delta=0.049
\end{equation}
```
