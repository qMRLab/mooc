---
title: Signal Modelling
subtitle: B1 AFI
date: 2024-10-07
authors:
  - name: Juan Velezquez-Reyes
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

The pulse sequence of the AFI method ([](#afiFigPS)) is composed of two identical RF pulses and two different delays (TR{sub}`1` < TR{sub}`2`). After each RF pulse, the signal intensity is acquired followed by a spoiler to destroy the residual transverse magnetization next to the following RF pulse. This method implements a pulsed steady-state signal with a gradient-echo acquisition, thus preventing the use of long repetition times [@Yarnykh2007-bv]. It has been demonstrated that if the delays TR{sub}`1` and TR{sub}`2` are sufficiently short (e.g. TR{sub}`1`/TR{sub}`2` = 20 ms/100 ms), and the transverse magnetization is completely spoiled, the ratio of signal intensities (r = S{sub}`2`/S{sub}`1`) depends on the flip angle of applied pulses and is highly insensitive to _T_{sub}`1` [@Yarnykh2007-bv].

```{figure} img/afi_pulsesequence.png
:label: afiFigPS
:enumerator: 4.5
Simplified pulse sequence diagram of an actual flip-angle imaging (AFI) pulse sequence with a gradient echo readout. TR{sub}`1`: repetition time 1, TR{sub}`2`: repetition time 2, {math}`\theta`: excitation flip angle for the measurement, IMG: image acquisition (k-space readout), SPOIL: spoiler gradient.
```

The magnetization of an AFI experiment can be modeled under steady-state conditions by the implementation of a fast repetition of the sequence (TR{sub}`1` < TR{sub}`2` < _T_{sub}`1`). The solution of the [Bloch equations](wiki:Bloch_equations) for the AFI method is given by Equations 1 and 2 that represent the longitudinal magnetization before the application of the RF pulses:

```{math}
:label: afiEq1
:enumerator:4.10
\begin{equation}
M_{z1}=M_{0}\frac{1-e^{\frac{-\text{TR}_{2}}{_{T_{1}}}}+\left( 1- e^{\frac{-\text{TR}_{1}}{_{T_{1}}}}\right)e^{\frac{-\text{TR}_{2}}{_{T_{1}}}}\text{cos}\left( \theta \right)}{1-e^{\frac{-\text{TR}_{1}}{_{T_{1}}}}e^{\frac{-\text{TR}_{2}}{_{T_{1}}}}\text{cos}^{2}\left( \theta \right)}\text{sin}\left( \theta \right)
\end{equation}
```


```{math}
:label: afiEq2
:enumerator:4.11
\begin{equation}
M_{z2}=M_{0}\frac{1-e^{\frac{-\text{TR}_{1}}{_{T_{1}}}}+\left( 1- e^{\frac{-\text{TR}_{2}}{_{T_{1}}}}\right)e^{\frac{-\text{TR}_{1}}{_{T_{1}}}}\text{cos}\left( \theta \right)}{1-e^{\frac{-\text{TR}_{1}}{_{T_{1}}}}e^{\frac{-\text{TR}_{2}}{_{T_{1}}}}\text{cos}^{2}\left( \theta \right)}\text{sin}\left( \theta \right)
\end{equation}
```

Mz{sub}`1,2` is the longitudinal magnetization of both pulses, M0 is the magnetization at thermal equilibrium, TR{sub}`1` is the delay time after the first pulse, TR{sub}`2` is the delay time after the second identical pulse ([](#afiFig1)), and {math}`\theta` is the excitation flip angle. The steady-state longitudinal magnetization Mz curves for different _T_{sub}`1` values for a range of {math}`\theta_{n}` and TR values are shown in [](#afiPlot1).

```{figure} #afiFig1jn
:label: afiPlot1
:enumerator: 4.6
Longitudinal magnetization before the first radiofrequency pulse ([](#afiEq1), solid lines) and before the second identical pulse ([](#afiEq2), dashed lines) for three different _T_{sub}`1` values.
```

The analytical solution of the Bloch equations in a steady-state experiment ([](#afiEq1) and [](#afiEq2)) makes several assumptions leading to practical challenges. First, it is assumed that the longitudinal magnetization has reached a steady state after a sufficiently large number of repetition times (TR), and that the transverse magnetization is perfectly spoiled prior to each pulse. To explore these properties, a numerical approach known as Bloch simulations is used to estimate the signal from an MRI experiment given a set of sequence parameters. Here, the Bloch simulations allow us to estimate the magnetization using a different number of sequence repetitions, and look at a special case when the steady-state is not achieved (due to a small number of sequence repetitions). As can be seen in [](#afiPlot2), the number of repetitions required to reach a steady-state depends on _T_{sub}`1` and the flip angle.

```{figure} #afiFig2jn
:label: afiPlot2
:enumerator: 4.7
Signal 1 (blue) and Signal 2 (red) curves simulated using Bloch simulations (solid lines) for a number of repetitions ranging from 1 to 150, plotted against the ideal case ([](#afiEq1) and [](#afiEq2) – dashed lines). Simulation details: TR{sub}`1` = 20 ms, TR{sub}`2` = 100 ms, _T_{sub}`1` = 900 ms, 100 spins. Ideal spoiling was used for this set of Bloch simulations (transverse magnetization was set to 0 at the end of each TR{sub}`1,2`).
```

In practice, gradient and RF spoiling are important parameters to consider in an AFI experiment. A combination of both [@Zur1991-sj;@Bernstein2004-vl] is typically recommended, and [](#afiPlot3) shows how this better approximates the ideal spoiling case.

```{figure} #afiFig3jn
:label: afiPlot3
:enumerator: 4.8
Signal 1 curves estimated using Bloch simulations for three categories of signal spoiling: (1) ideal spoiling (blue), gradient & RF Spoiling (red), and no spoiling (orange). Simulation details: TR{sub}`1` = 20 ms, TR{sub}`2` = 100 ms, _T_{sub}`1` = 900 ms, _T_{sub}`2` = 100 ms, TE = 5 ms, 100 spins. For the ideal spoiling case, the transverse magnetization is set to zero at the end of each TR. For the gradient & RF spoiling case, each spin is rotated by different increments of phase (2𝜋 / # of spins) to simulate complete dephasing from gradient spoiling, and the RF phase of the excitation pulse is {math}`\Phi_{n}=\Phi_{n-1}+n\Phi_{0}= 1/2 \Phi_{0}\left( n^{2}+n+2 \right)` [@Bernstein2004-vl] with {math}`\Phi_{0}=39^{\circ}` [@Zur1991-sj] after each TR.
```
