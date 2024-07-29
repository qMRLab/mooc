---
title: Signal Modelling
subtitle: Quantitative Magnetization Transfer
date: 2024-07-25
authors:
  - name: Juan Velezquez-Reyes
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: false
  figure:
    template: Fig. %s
---

The magnetization transfer in a two-pool model is modelled by a set of coupled differential equations (Sled and Pike 2000):

```{figure} img/5eqs.png
:label: qmtEqs5
```

where the magnetization at time  𝑡 is given by M = [Mx,f, My,f, Mz,f, Mz,r] and Mx,f and My,f are the transverse magnetization for the free pool in the  𝑥 and  𝑦 direction, respectively. The longitudinal magnetization for the free and restricted pool is denoted by Mz,f and Mz,r. Due to the very short T2 of the restricted pool (on the order of microseconds), the transverse magnetization of this pool is not explicitly modelled.

The constants kf and kr represent the exchange rate of the longitudinal magnetization from the free pool to the restricted pool (kf) and from the restricted to the free pool (kr). The ratio of these quantities is constrained by the size of the restricted to the free-water pool, expressed as kf/kr = M0,r/M0,f. This ratio is called the pool size ratio  𝐹 defined as F = M0,r/M0,f. The precessional frequency ω1 is a measure of the power of the off-resonance radiofrequency pulse and ∆ is a frequency offset at which the magnetic B1+ field is applied. As shown in Figure 1, an on-resonance (∆ = 0) radiofrequency pulse is also part of the pulse sequence and is applied after the MT pulse. The relaxation time constants for the free and restricted pools are denoted by T1,f and T1,r for the longitudinal magnetization, and T2,f and T2,r for the transverse magnetization. Finally,  𝑊 is the saturation rate of the restricted pool, which is a function of the absorption lineshape  𝐺 that depends on the frequency offset and the transverse relaxation of the restricted pool (Figure 2).

```{figure} img/mtspgr_pulsesequence.png
:label: qmtFig1

Simplified pulse sequence diagram of a magnetization transfer spoiled gradient (MT-SPGR) experiment with an MT pulse followed by a spoiler gradient to destroy any transverse magnetization before the application of the on-resonance excitation pulse.
```

The absorption lineshape of the restricted pool that best characterizes the proton system depends on the environment. For simple systems such as agar gel phantoms, the Gaussian lineshape describes magnetization transfer effects well (Hankelman et al. 1993), while for more complicated and biologically relevant models, the super-Lorentzian lineshape is the best choice (Morrison et al. 1995).

```{figure} img/plot1.png
:label: qmtFig2

Gaussian, Lorentzian and super-Lorentzian absorption lineshapes plotted as a function of the frequency offset ∆ and T2,r.
```

In a standard qMT experiment, multiple measurements are required where the off-resonance radiofrequency pulse angle (MT angle) and offset frequency are changed for each measurement, and at least one measurement is acquired in the absence of an MT pulse. The acquired signal plotted as a function of the the offset frequency is known as the “Z-spectrum”, and Figure 3 shows the Z-spectrum simulated using different absorption lineshapes. The off-resonance MT pulse is modelled either as a continuous wave or as a pulsed irradiation scheme. In a continuous wave irradiation mode, long off-resonance pulses of constant saturation and fixed frequency offset are applied to generate well-defined MT states in the two pools (Henkelman et al. 2001). For more practical implementations, pulsed off-resonance irradiations are used with a spoiled gradient echo sequence (SPGR) to generate MT-weighted images at different saturation rates and frequency offsets (Sled and Pike 2000). In the qMT-SPGR sequence shown in Figure 1, the MT preparation pulse is applied, followed by a spoiler gradient to eliminate any residual transverse magnetization produced by the long MT pulses, and to destroy the MR signal from previous measurements. A signal equation for this type of pulsed MT experiment can be derived by approximating the pulse sequence to a series of stages described by a continuous wave off-resonance irradiation period, followed by free precession, and instant saturation of the free-water pool (Cabana et al. 2015; Sled and Pike 2000; Sled and Pike 2001). This pulse sequence decomposition allows for analytically solving the Bloch-McConnell equations at a steady-state, but it is also possible to numerically solve the Bloch equations to perform simulations that provide a more realistic approximation when the system has not been driven to a steady-state. A comparison between the Bloch simulations and the analytical solution is shown in Figure 4 for different numbers of preparation MT pulses. As can be seen, different frequency offsets and MT flip angles require different numbers of repetition times to reach the steady-state, which is of paramount importance since the analytical solution used for parameter estimation is derived assuming the steady-state. In terms of data acquisition optimization, the k-space periphery is sampled during the preparation pulses whereas the center of k-space, that contains the overall image contrast, is acquired once the steady-state is achieved.

```{figure} img/plot2.png
:label: qmtFig3

Z-spectrum simulated using different absorption lineshapes (Gaussian, Lorentzian, and super-Lorentzian).
```

```{figure} img/plot3.png
:label: qmtFig4

Z-spectrum simulated using Bloch simulations (dashed lines) for a number of MT pulses ranging from 1 to 600. Bloch simulations are compared with the Z-spectrum obtained from the analytical solution (solid lines).
```
