---
title: Signal Modelling
subtitle: Quantitative Magnetization Transfer
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

The magnetization transfer in a two-pool model is modelled by a set of coupled differential equations [@Sled2000-pc]:

```{math}
:label: qmtEq1
:enumerator:6.1
\begin{equation}
\frac{d M_{x,f}}{dt}=-\frac{M_{x,f}}{T_{2,f}}+\Delta M_{y,f}-\text{Im}\left( \omega_{1} \right)M_{z,f}
\end{equation}
```

```{math}
:label: qmtEq2
:enumerator:6.2
\begin{equation}
\frac{d M_{y,f}}{dt}=-\frac{M_{y,f}}{T_{2,f}}+\Delta M_{x,f}-\text{Re}\left( \omega_{1} \right)M_{z,f}
\end{equation}
```

```{math}
:label: qmtEq3
:enumerator:6.3
\begin{equation}
\frac{d M_{z,f}}{dt}=-\frac{\left( M_{0,f}-M_{z,f} \right)}{T_{1,f}}+k_{r}M_{z,r}+\text{Im}\left( \omega_{1} \right)M_{x,f}-\text{Re}\left( \omega_{1} \right)M_{y,f}
\end{equation}
```

```{math}
:label: qmtEq4
:enumerator:6.4
\begin{equation}
\frac{d M_{z,r}}{dt}=-\frac{\left( M_{0,r}-M_{z,r} \right)}{T_{1,r}}-k_{r}M_{z,r}+k_{f}M_{z,f}+WM_{z,r}
\end{equation}
```

```{math}
:label: qmtEq5
:enumerator:6.5
\begin{equation}
W=\pi\omega_{1}^{2}G\left(\Delta,T_{2,r}  \right)
\end{equation}
```

where the magnetization at time _t_ is given by {math}`\textbf{M}\left( t \right)=\left[ M_{x,f}, M_{y,f}, M_{z,f}, M_{z,r} \right]` and {math}`M_{x,f}` and {math}`M_{y,f}` are the transverse magnetization for the free pool in the x and 𝑦 direction, respectively. The longitudinal magnetization for the free and restricted pool is denoted by {math}`M_{z,f}` and {math}`M_{z,r}`. Due to the very short _T_{sub}`2` of the restricted pool (on the order of microseconds), the transverse magnetization of this pool is not explicitly modelled.

The constants _k_{sub}`f` and _k_{sub}`r` represent the exchange rate of the longitudinal magnetization from the free pool to the restricted pool (_k_{sub}`f`) and from the restricted to the free pool (_k_{sub}`r`). The ratio of these quantities is constrained by the size of the restricted to the free-water pool, expressed as {math}`k_{f}/k_{r}=M_{0,r}/M_{0,f}`. This ratio is called the pool size ratio _F_ defined as {math}`F=M_{0,r}/M_{0,f}`. The precessional frequency {math}`\omega_{1}` is a measure of the power of the off-resonance radiofrequency pulse and ∆ is a frequency offset at which the magnetic _B_{sub}`1`{sup}`+` field is applied. As shown in [](#qmtFig1), an on-resonance (∆ = 0) radiofrequency pulse is also part of the pulse sequence and is applied after the MT pulse. The relaxation time constants for the free and restricted pools are denoted by _T_{sub}`1,f` and _T_{sub}`1,r` for the longitudinal magnetization, and _T_{sub}`2,f` and _T_{sub}`2,r` for the transverse magnetization. Finally,  𝑊 is the saturation rate of the restricted pool, which is a function of the absorption lineshape  𝐺 that depends on the frequency offset and the transverse relaxation of the restricted pool ([](#qmtFig2)).

```{figure} img/mtspgr_pulsesequence.png
:label: qmtFig1
:enumerator: 6.1
Simplified pulse sequence diagram of a magnetization transfer spoiled gradient (MT-SPGR) experiment with an MT pulse followed by a spoiler gradient to destroy any transverse magnetization before the application of the on-resonance excitation pulse.
```

The absorption lineshape of the restricted pool that best characterizes the proton system depends on the environment. For simple systems such as agar gel phantoms, the Gaussian lineshape describes magnetization transfer effects well [@Henkelman1993-lt], while for more complicated and biologically relevant models, the super-Lorentzian lineshape is the best choice [@Morrison1995-qz].

```{figure} #qmtFig1jn
:label: qmtFig2
:enumerator: 6.2
Gaussian, Lorentzian and super-Lorentzian absorption lineshapes plotted as a function of the frequency offset ∆ and _T_{sub}`2,r`.
```

In a standard qMT experiment, multiple measurements are required where the off-resonance radiofrequency pulse angle (MT angle) and offset frequency are changed for each measurement, and at least one measurement is acquired in the absence of an MT pulse. The acquired signal plotted as a function of the offset frequency is known as the “Z-spectrum”, and [](#qmtFig3) shows the Z-spectrum simulated using different absorption lineshapes. The off-resonance MT pulse is modelled either as a continuous wave or as a pulsed irradiation scheme. In a continuous wave irradiation mode, long off-resonance pulses of constant saturation and fixed frequency offset are applied to generate well-defined MT states in the two pools [@Henkelman2001-nb]. For more practical implementations, pulsed off-resonance irradiations are used with a spoiled gradient echo sequence (SPGR) to generate MT-weighted images at different saturation rates and frequency offsets [@Sled2000-pc]. In the qMT-SPGR sequence shown in [](#qmtFig1), the MT preparation pulse is applied, followed by a spoiler gradient to eliminate any residual transverse magnetization produced by the long MT pulses, and to destroy the MR signal from previous measurements. A signal equation for this type of pulsed MT experiment can be derived by approximating the pulse sequence to a series of stages described by a continuous wave off-resonance irradiation period, followed by free precession, and instant saturation of the free-water pool [@Cabana2015-zg;@Sled2000-pc;@Sled2001-fz]. This pulse sequence decomposition allows for analytically solving the Bloch-McConnell equations at a steady-state, but it is also possible to numerically solve the Bloch equations to perform simulations that provide a more realistic approximation when the system has not been driven to a steady-state. A comparison between the Bloch simulations and the analytical solution is shown in [](#qmtFig4) for different numbers of preparation MT pulses. As can be seen, different frequency offsets and MT flip angles require different numbers of repetition times to reach the steady-state, which is of paramount importance since the analytical solution used for parameter estimation is derived assuming the steady-state. In terms of data acquisition optimization, the k-space periphery is sampled during the preparation pulses whereas the center of k-space, that contains the overall image contrast, is acquired once the steady-state is achieved.

```{figure} #qmtFig2jn
:label: qmtFig3
:enumerator: 6.3
Z-spectrum simulated using different absorption lineshapes (Gaussian, Lorentzian, and super-Lorentzian).
```

```{figure} #qmtFig3jn
:label: qmtFig4
:enumerator: 6.4
Z-spectrum simulated using Bloch simulations (dashed lines) for a number of MT pulses ranging from 1 to 600. Bloch simulations are compared with the Z-spectrum obtained from the analytical solution (solid lines).
```
