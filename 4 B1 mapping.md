---
title: B1 Mapping
date: 2024-10-07
label: b1MappingChapter
authors:
  - name: Mathieu Boudreau and Juan Velezquez-Reyes
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: false
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

# Double Angle techniques

## Transmit and Receive RF field amplitudes


:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

In an MRI experiment, magnetic field amplitude of the radiofrequency field (_B_{sub}`1`) is an an important physical parameter that is a product of the interaction between RF coil design and the subject's position (volume and relative position to the coil) and physical properties (electromagnetic permittivity ε and permeability μ). In any MRI experiments, two _B_{sub}`1` fields appear: the transmit RF field amplitude _B_{sub}`1`{sup}`+` and the receive RF field amplitude _B_{sub}`1`{sup}`-`. The latter, _B_{sub}`1`{sup}`-`, is often referred to in terms of the receive RF coil sensitivities and this is due to the principle of reciprocity [@Hoult1976-xz;@Hoult2000-ug] property of RF antennas. In terms of an MRI image, _B_{sub}`1`{sup}`-` is simply a multiplication factor that varies spatially but doesn’t change between pulse sequences if the subject remains motionless, and techniques to “flatten” images by estimating this field numerically have been developed [@Sled1998-fr]. Additionally, many quantitative MRI techniques calculate the ratio of images, which eliminates this _B_{sub}`1`{sup}`-` component from the resulting image.

_B_{sub}`1`{sup}`+`, however, impacts the resulting MRI images in a much more complex way and is not a simple multiplication factor. _B_{sub}`1`{sup}`+` directly perturbs the system of spins by introducing energy in the system, which practically we quantify as the flip angle of an RF pulse. Two different _B_{sub}`1`{sup}`+` values will not have the same impact on voxel for different pulse sequences, as spin dynamics and steady-state conditions will vary. For example, let’s say you acquire a saturation recovery image and also a short TR steady-state gradient echo. For an actual flip angle  = {math}`\alpha \cdot B_{1}`, the magnetization after TE will be {math}`M_{z}\text{sin}\left( \alpha \cdot B_{1} \right)\text{exp}\left(-\text{TE}/T_{2}   \right)` and {math}`M_z` prior to the RF pulse is given by [](#vfaEq1). Thus, not only does _B_{sub}`1`{sup}`+` not appear as a simple multiplication factor, a change of _B_{sub}`1` will not impact this voxel for both sequences by the same ratio. Thus, knowledge of _B_{sub}`1`{sup}`+` through _B_{sub}`1` mapping can help us retroactively understand the dynamics of the spins accurately, and can play the role of a calibration factor for many quantitative MRI techniques (e.g. VFA, _T_{sub}`2`/_T_{sub}`2`{sup}`*`, qMT, etc). In addition, _B_{sub}`1` mapping can also map the electromagnetic properties, but this won’t be discussed in this chapter.

In this chapter, we’ll be discussing a simple but widely used class of methods for _B_{sub}`1` mapping, the double angle method. For the sake of simplicity, and for consistency with the quantitative MRI literature, we’ll define _B_{sub}`1` = _B_{sub}`1`{sup}`+` and will explicitly state _B_{sub}`1`{sup}`-` when referring to the receive field.

## Double Angle method(s)


:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

The Double Angle method (DA or DAM) is a class of _B_{sub}`1` mapping techniques where two RF pulses at flip angles α and 2α are applied to a pulse sequence, and the ratio of the images are compared to expected output to produce a _B_{sub}`1` map. Several main pulse sequences ([](#daFig1)) have been called the double angle method in the literature, and both have their own equations describing the relationship between the expected images and _B_{sub}`1`. In this chapter, we’ll mostly explore there the α-180 method ([](#daFig1)]), and then briefly explain the other method and its similarities/differences.

```{figure} 4 B1 Mapping/01-Double Angle technique/img/daPulseSequences.png
:label: daFig1
:enumerator: 4.1
Pulse sequences for double angle methods. A) Double angle method using a gradiend echo. B) Double angle method using a 180 degree refocusing pulse. C) Double angle method using a {math}`2\alpha` refocusing pulse, acquired with two values {math}`\alpha_{1}` and {math}`\alpha_{2}` such that {math}`\alpha_{2}=2\alpha_{1}`. 
```

## Gradient echo and 180 degree spin echo methods


:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

This pulse sequence uses a 180 degree spin-echo refocusing pulse and acquires two images using an excitation pulse {math}`\alpha` and {math}`2\alpha`. It assumes that there is full signal recovery (long TR), and because it refocuses _T_{sub}`2`{sup}`*`, it eliminates signal variability caused by _B_{sub}`0` in the resulting _B_{sub}`1` map [@Insko1993-ik]. Alternatively, a gradient echo could be used?

Assuming a refocusing pulse is used (i.e. isn’t dependent on _B_{sub}`1`), we can develop the equation for a gradient echo and spin echo case.

```{math}
:label: daEq1
:enumerator:4.1
\begin{equation}
M_{\alpha}=M_{0}\text{sin}\left( \alpha \right)\text{e}^{\left( -\frac{TE}{T_{2}} \right)}
\end{equation}
```


```{math}
:label: daEq2
:enumerator:4.2
\begin{equation}
M_{2\alpha}=M_{0}\text{sin}\left( 2\alpha \right)\text{e}^{\left( -\frac{TE}{T_{2}} \right)}
\end{equation}
```



Thus


```{math}
:label: daEq3
:enumerator:4.3
\begin{equation}
\frac{M_{\alpha}}{\text{sin}\left(\alpha \right)}=\frac{M_{2\alpha}}{\text{sin}\left(2\alpha \right)}
\end{equation}
```

and

```{math}
:label: daEq4
:enumerator:4.4
\begin{equation}
\frac{M_{2\alpha}}{M_{\alpha}}=\frac{\text{sin}\left(2\alpha \right)}{\text{sin}\left(\alpha \right)}
\end{equation}
```

Using a well known trigonometry identity (see [Appendix A](#daAppendixA) for derivation),


```{math}
:label: daEq5
:enumerator:4.5
\begin{equation}
\text{sin}\left( 2\alpha \right)=2\text{sin}\left( \alpha \right)\text{cos}\left( \alpha \right)
\end{equation}
```

We can simplify [](#daEq5),

```{math}
:label: daEq6
:enumerator:4.6
\begin{equation}
\frac{M_{2\alpha}}{M_{\alpha}}=\frac{2\text{sin}\left( \alpha \right)\text{cos}\left( \alpha \right)}{\text{sin}\left(\alpha \right)}
\end{equation}
```

```{math}
:label: daEq7
:enumerator:4.7
\begin{equation}
\frac{M_{2\alpha}}{M_{\alpha}}=2\text{cos}\left( \alpha \right)
\end{equation}
```

And the true flip angle can be calculated from the ratio of these two magnetizations / signals / images:


```{math}
:label: daEq8
:enumerator:4.8
\begin{equation}
\alpha=\text{arcos}\left( \frac{M_{2\alpha}}{2M_{\alpha}} \right)
\end{equation}
```

Knowing that {math}`\alpha = B_{1}` alpha_nominal, _B_{sub}`1` is thus:


```{math}
:label: daEq9
:enumerator:4.9
\begin{equation}
B_{1}=\frac{\text{arcos}\left( \frac{M_{2\alpha}}{2M_{\alpha}} \right)}{\alpha_{nominal}}
\end{equation}
```

:::{figure} #daFig1jn
:label: daPlot1
:enumerator: 4.2
_B_{sub}`1` computed from analytical GRE equations for DA sequence
:::

This equation is also used for {math}`\alpha`-180 spin echo pulses, however it assumes no dependency on of the refocusing pulse on _B_{sub}`1`. [](#daPlot2) explores this using Bloch simulations

:::{figure} #daFig2jn
:label: daPlot2
:enumerator: 4.3
_B_{sub}`1` computed from bloch simulations for ideal spin echo and refocusing pulse where FA = 180*_B_{sub}`1`
:::


:::{figure} #daFig3jn
:label: daPlot3
:enumerator: 4.4
_B_{sub}`1` computed from bloch simulations for spin echo with refocusing pulse where FA = 180*_B_{sub}`1`, and composite pulse 90{sub}`x`-180{sub}`y`-90{sub}`x` where each 90 and 180 are also multiplied by _B_{sub}`1`.
:::

# Actual Flip Angle Imaging

Transmit radiofrequency field maps (_B_{sub}`1`{sup}`+`, or _B_{sub}`1` for short) are used in diverse applications in MRI including: the study of electrical properties in tissues in vivo [@Sled1998-pz;@Katscher2009-lk], specific absorption rate (SAR) calculations [@Ibrahim2001-yj], the calibration of quantitative _T_{sub}`1` [@Deoni2007-se;@Boudreau2017-ik] and _T_{sub}`2` [@Sled2000-pc] maps, better parameter estimation from magnetization transfer measurements [@Ropele2005-pm;@Boudreau2018-kv], _B_{sub}`1` shimming to improve image quality at whole-body ultra high fields [@van-den-Bergen2007-dh], or quality control of RF coils [@Yarnykh2007-bv]. Several _B_{sub}`1` mapping techniques have been developed, and they can be broadly divided as magnitude-based and phase-based methods. The double angle method (DAM) is a saturation-recovery magnitude-based method that takes the ratio of the signal intensity of two magnitude images measured with different excitation flip angles [@Insko1993-ik;@Stollberger1996-kh]. The Bloch-Siegert shift technique is a rapid phase-based method that encodes the _B_{sub}`1` information into phase signal [@Sacolick2010-ga]. The actual flip-angle imaging (AFI) is a magnitude-based _B_{sub}`1` mapping method that consists of a 3D acquisition that benefits from good anatomical coverage. In addition, this technique allows the acquisitions of whole-body (~7 min) and brain (~3 min) _B_{sub}`1` maps leading to a feasible implementation in clinics [@Yarnykh2007-bv]. On the other hand, the AFI pulse sequence has certain constraints that need to be considered for this _B_{sub}`1` mapping method to be widely deployed. Some of the limitations include the use of spoiler gradients that can give rise to prohibitive SAR values [@Sacolick2010-ga], and the pulse sequence modifications on the MRI machine to implement the AFI method.

In this section, we will focus on presenting details about the AFI _B_{sub}`1` mapping method. We will cover signal modeling, data fitting, the benefits and the pitfalls of the technique. The figures are generated using the qMRLab module for this method.

## Signal Modelling


The pulse sequence of the AFI method ([](#afiFigPS)) is composed of two identical RF pulses and two different delays (TR{sub}`1` < TR{sub}`2`). After each RF pulse, the signal intensity is acquired followed by a spoiler to destroy the residual transverse magnetization next to the following RF pulse. This method implements a pulsed steady-state signal with a gradient-echo acquisition, thus preventing the use of long repetition times [@Yarnykh2007-bv]. It has been demonstrated that if the delays TR{sub}`1` and TR{sub}`2` are sufficiently short (e.g. TR{sub}`1`/TR{sub}`2` = 20 ms/100 ms), and the transverse magnetization is completely spoiled, the ratio of signal intensities (r = S{sub}`2`/S{sub}`1`) depends on the flip angle of applied pulses and is highly insensitive to _T_{sub}`1` [@Yarnykh2007-bv].

```{figure} 4 B1 Mapping/02-Actual Flip Angle Imaging/img/afi_pulsesequence.png
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

Mz{sub}`1,2` is the longitudinal magnetization of both pulses, M0 is the magnetization at thermal equilibrium, TR{sub}`1` is the delay time after the first pulse, TR{sub}`2` is the delay time after the second identical pulse ([](#afiPlot1)), and {math}`\theta` is the excitation flip angle. The steady-state longitudinal magnetization Mz curves for different _T_{sub}`1` values for a range of {math}`\theta_{n}` and TR values are shown in [](#afiPlot1).

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

## Data Fitting



The ratio of [](#afiEq1) and [](#afiEq2), gives rise to [](#afiEq3) that depends on the parameters _T_{sub}`1`, TR{sub}`1`, TR{sub}`2` and the excitation flip angle ({math}`\theta`).

```{math}
:label: afiEq3
:enumerator:4.12
\begin{equation}
r=\frac{S_{2}}{S_{1}}=\frac{1-e^{\frac{-\text{TR}_{1}}{_{T_{1}}}}+\left( 1-e^{\frac{-\text{TR}_{2}}{_{T_{1}}}}\right)e^{\frac{-\text{TR}_{1}}{_{T_{1}}}}\text{cos}\left( \theta \right) }{1-e^{\frac{-\text{TR}_{2}}{_{T_{1}}}}+\left( 1-e^{\frac{-\text{TR}_{1}}{_{T_{1}}}}\right)e^{\frac{-\text{TR}_{2}}{_{T_{1}}}}\text{cos}\left( \theta \right)}
\end{equation}
```

[](#afiEq3) can be simplified if the Taylor series expansion of the exponential function is used, followed by a first-order approximation to its terms. For this expansion, short TR{sub}`1` and TR{sub}`2` (TR{sub}`1` < _T_{sub}`1` and TR{sub}`2` < _T_{sub}`1`) are assumed to approximate the signal intensities ratio ([](#afiEq4)) where n = TR{sub}`2`/TR{sub}`1`.

```{math}
:label: afiEq4
:enumerator:4.13
\begin{equation}
r \approx \frac{1+n\text{cos}\left( \theta \right)}{n+\text{cos}\left( \theta \right)}
\end{equation}
```


Finally, a measure of the actual flip-angle ({math}`\theta`) can be achieved by solving [](#afiEq4) to obtain [](#afiEq5), which only depends on the signal intensities ratio (r = S{sub}`2`/S{sub}`1`) and the parameters TR{sub}`1` and TR{sub}`2`.

```{math}
:label: afiEq5
:enumerator:4.14
\begin{equation}
\theta \approx\text{arcos}\left( \frac{rn-1}{n-r} \right)
\end{equation}
```

The actual flip-angle is estimated using an approximation ([](#afiEq4)) of a complete analytical solution ([](#afiEq3)), and the nature of this approximation makes it worthwhile to assess the accuracy of the signal intensities ratio between both equations. Next, a set of simulations are displayed to analyze how the choice of r is affected by _T_{sub}`1`, TR{sub}`1` and TR{sub}`2`. First, the effect of the relaxation time _T_{sub}`1` is simulated in [](#afiPlot4) for both the approximation and the complete analytical solution.

```{figure} #afiFig4jn
:label: afiPlot4
:enumerator: 4.9
Effect of the relaxation time _T_{sub}`1` on the ratio r. Signal intensities ratio is plotted as a function of the flip angle for the complete analytical solution ([](#afiEq3) - blue) and the first-order approximation ([](#afiEq4) - orange). AFI simulation details: TR{sub}`1` = 20 ms, TR{sub}`2` = 100 ms and variable _T_{sub}`1`.
```

The signal ratio r is highly insensitive to the relaxation time _T_{sub}`1`, except for the low _T_{sub}`1` values and large flip angles (>70°). This shows that the Taylor expansion is a good approximation to the signal ratio r because it is possible to get rid of the inverse quadratic _T_{sub}`1` dependance by taking the first-order terms of the expansion.

The effect of the TR{sub}`1` parameter on the signal ratio is shown in [](#afiPlot5). To assess the influence of the repetition time, we fix n=5 and vary the parameter TR{sub}`1` in accordance to the relation n = TR{sub}`2`/TR{sub}`1`. As TR{sub}`1` increases (> 50 ms), the approximated ratio r slightly deviates from the analytical approach. Although the deviation is slight only at high flip angles, a good signal ratio approximation can be achieved for a wide range of flip angles and repetition times.

```{figure} #afiFig5jn
:label: afiPlot5
:enumerator: 4.10
Effect of the repetition time TR{sub}`1` on the ratio r. Signal intensities ratio is plotted as a function of the flip angle for the complete analytical solution ([](#afiEq3) - blue) and the first-order approximation ([](#afiEq4) - orange). AFI simulation details: Variable TR{sub}`1` ranging from 10 to 60 ms, fixed ratio n = 5 and _T_{sub}`1` = 900 ms.
```

Finally, the effect of the parameter n on the signal ratio r ([](#afiPlot6)) does not seem to significantly affect the signal ratio between the approximated equation and the analytical approach. However, the parameter n has a major impact on the sensitivity of the AFI method to variations in the flip angle. [](#afiPlot6) shows that the increase of the parameter n (= TR{sub}`2`/TR{sub}`1`) allows for improvement of the dynamic range of flip angles measurements. These simulations have shown that an optimal implementation of the AFI method requires a careful selection of sequence parameters.

```{figure} #afiFig6jn
:label: afiPlot6
:enumerator: 4.11
Effect of n (TR{sub}`2` to TR{sub}`1` ratio) on the ratio r. The signal intensities ratio is plotted as a function of the flip angle for the complete analytical solution ([](#afiEq3) - blue) and the first-order approximation ([](#afiEq4) - orange). AFI simulation details: Variable n ranging from 2 to 6, fixed TR{sub}`1` = 20 ms and _T_{sub}`1` = 900 ms.
```

[](#afiPlot7) displays an example AFI dataset and its corresponding field _B_{sub}`1` map in a healthy human brain. Although not clearly visible, both AFI images present a small Gibbs ringing artifact that is propagated and amplified due to the AFI calculation consisting of the division of both images [@Boudreau2017-ik]. The ringing artifact is clearly seen in the unfiltered/raw _B_{sub}`1` field map shown in [](#afiPlot7) (right).

```{figure} #afiFig7jn
:label: afiPlot7
:enumerator: 4.12
Example actual flip-angle imaging dataset (left) and a resulting raw _B_{sub}`1` map of a healthy adult brain (right). The relevant VFA protocol parameters used were: TR{sub}`1` = 20 ms, TR{sub}`2` = 100 ms and {math}`\theta_{nominal}` = 60°. The _B_{sub}`1` map (right) was fitted using the approximate r ratio ([](#afiEq5)).
```

The ringing artifact shown in [](#afiPlot7) can be attenuated by implementing a smoothing process. [](#afiPlot8) shows the raw (left) and the filtered (right) _B_{sub}`1` map where a median filter was used to smooth the field map.

```{figure} #afiFig8jn
:label: afiPlot8
:enumerator: 4.13
Raw (left) and filtered (right) _B_{sub}`1` map. A median filter of size 7x7x7 pixels was used to attenuate the Gibbs ringing artifact.
```


## Benefits and Pitfalls

_B_{sub}`1` mapping is of interest for diverse MRI applications, and several mapping techniques have been developed. The DAM method consists of acquiring two scans at two different flip angles. To avoid the dependence of the signal on _T_{sub}`1`, long repetition times are required to allow the recovery of the longitudinal magnetization between pulses [@Yarnykh2007-bv;@Insko1993-ik]. The AFI method overcomes this practical limitation by repeating the pulse sequence at a fast rate to achieve a pulsed state of magnetization and shorter time delays between pulses. In addition, due to scan-time constraints, _B_{sub}`1` mapping methods are often implemented in 2D [@Chavez2012-tw]. However, the accuracy of the measurements of 2D _B_{sub}`1` mapping techniques is compromised by the slice profile effects due to the problem of nonuniform excitation across slices [@Yarnykh2007-bv;@Chavez2012-tw]. The AFI method on the other hand, adresses this issue using a fast 3D implementation leading to scans with an excellent anatomical coverage in clinically feasible times, with an increase in signal-to-noise ratio compared to 2D multislice acquisitions.

The performance of the AFI method is based on the following assumptions. First, the two images acquired at different times should be registered to avoid motion effects. It is also assumed that the signal is insensitive to the main magnetic field non-uniformities and chemical shift effects that are canceled out when taking the signal ratio r [@Yarnykh2007-bv]. Despite some clear advantages over other _B_{sub}`1` mapping techniques, the application of spoiler gradients to mitigate the _T_{sub}`1` dependence can be a limitation due to significant levels of RF power depositions [@Sacolick2010-ga]. Furthermore, it is necessary to adapt the AFI pulse sequence to different scanner manufacturers, and programming experience is required to bring this technique into the clinic.

# Filtering


:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

The behaviour of electromagnetic fields produced by RF antennas are bound by the laws of physics. The [Maxwell equations](wiki:Maxwell%27s_equations) impose many limitations on how these fields can not only vary spatially and temporally, but how the electric and magnetic fields are linked. While propagating magnetic fields interface of boundary between materials can be discontinuous (a result of Maxwell’s equations), it’s been shown in the context of MRI and tissues that the magnetic field amplitudes are expected to be smoothly varying when using clinical MRIs [@Sled1998-pz;@Sled1998-fr]. At ultra-high fields, standing wave artifacts can lead to more _B_{sub}`1` variations and even signal nulls, however the field amplitude nonetheless varies continuously [@Ugurbil2018-qr;@Vaughan2001-ok;@Yang2002-jf]. Thus, for both _B_{sub}`1`{sup}`+` and _B_{sub}`1`{sup}`-`, their amplitude is expected to be a smoothly varying multiplicative field, and at clinical field strength it’s also expected to be a slowly or low frequency varying field.

In practice, measured _B_{sub}`1`{sup}`+` maps are rarely perfectly smooth over the anatomy-of-interest being imaged. [](#filtPlot1) shows a comparison of measured _B_{sub}`1` maps in the brain produced by three methods: double angle, actual flip angle imaging (AFI), and Bloch-Siegert shift.

:::{figure} #filtFig1jn
:label: filtPlot1
:enumerator: 4.14
Example _B_{sub}`1` maps (right column) along with their raw acquired data (left and middle columns) for three different _B_{sub}`1` mapping techniques: double angle (top row), actual flip angle imaging (AFI; middle row), and Bloch-Siegert shift (bottom row).
:::

The overall “shape” of the _B_{sub}`1` map is the same for all three maps, and this nonuniformity pattern is expected due to the elliptical shape of the brain and its electromagnetic properties [@Sled1998-pz]. We see in the _B_{sub}`1` maps of [](#filtPlot1) that there is some noise, some distinguishable anatomical structures (caused by _T_{sub}`1` sensitivity and/or k-space propagation susceptibility effects), and in one case (AFI) an artifact caused by Gibbs ringing in the acquired images. All of these variations are not present in the actual _B_{sub}`1`{sup}`+` field that the spins experience during a pulse sequence, and so using this “raw” _B_{sub}`1` map to calibration flip angles or RF power for other quantitative MRI techniques (eg. variable flip angle _T_{sub}`1` mapping, quantitative magnetization transfer) risks introducing errors during the correction.

Although not a perfect solution, researchers often smoothen their _B_{sub}`1` maps [@Yarnykh2007-ul;@Lutti2010-bt;@Boudreau2017-ik] in an effort to mitigate the error propagation from the _B_{sub}`1`{sup}`+` map noise and artifacts prior to use for other techniques. This chapter will discuss some common ways this _B_{sub}`1` map smoothing is achieved, show some examples of their benefits and weaknesses, and discuss some best practices.

## Filters and smoothing

:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

There are two main ways that field maps are smoothened in practice: filters and fitting. The study of filters is typically presented in a signal processing context, however its basic principles (in particular, convolutions) are observed in many other fields of study, in particular physics.

We’ll begin by providing a very brief overview of some key filtering properties, then move on to some illustrative 1D examples related to MRI situations before finally returning to their applications in actual _B_{sub}`1` maps.

Filtering is presented as a convolution process to produce an output that is smoother, meaning less sharp edges. A convolution is the multiplication of a kernel (a predetermined function or property, such as the mean, median, Gaussian function, etc) that is shifted at each point of the signal or image, and the summed value of this multiplication is assigned to the time or spatial point where it was applied. [](#filtPlot3) illustrates this for the mean using a three-position mean as a kernel:


:::{figure} #filtFig2jn
:label: filtPlot2
:enumerator: 4.15
Convolution using the mean
:::

In the context of MRI, the mean is not the best choice for a filter, as it is sensitive to high values relative to the base signal. The median is a better choice, which we’ll demonstrate in the next section.
In terms of equations, the convolution is shown using the symbol {math}`\otimes`, such that analytically it is represented as:

```{math}
:label: filtEq1
:enumerator:4.15
\begin{equation}
\left( f \otimes g \right)\left( t \right) =\int_{-\infty }^{\infty }f\left( u \right)g\left( t-u \right)du
\end{equation}
```

where {math}`f\left( t \right)` is the signal of interest and {math}`g\left( t \right)` is the kernel. Not every kernel will lead to smoothing (reduction of high frequencies) of the signal of interest when convolved, however the Gaussian distribution is one such smoothing function:

```{math}
:label: filtEq2
:enumerator:4.16
\begin{equation}
g\left( x \right)=\frac{1}{\sqrt{2\pi\sigma^{2}}}\text{e}^{-\frac{\left( x-x_{o} \right)^{2}}{2\sigma^{2}}}
\end{equation}
```


where {math}`x_{0}` is the center position of the distribution, and {math}`\sigma` is a measure of the width. The convolution using this function with a 9-point sample for different widths is shown in [](#filtPlot3).

:::{figure} #filtFig3jn
:label: filtPlot3
:enumerator: 4.16
Convolution using a Gaussian kernel
:::

One property of the convolution is that the convolution of two functions is the multiplication of the [Fourier transforms](Fourier_transform) of each function following by an [inverse Fourier transform](https://en.wikipedia.org/wiki/Fourier_inversion_theorem):


```{math}
:label: filtEq3
:enumerator:4.17
\begin{equation}
\left( f\otimes g \right)\left( t \right)=\mathcal{F}^{-1}\left( \mathcal{F}\left( k \right) \cdot \mathcal{G}\left( k \right) \right)
\end{equation}
```


Although convolutions can be computed this way and may me more conceptually clear, particularly the role of the kernel, practically this ends up being slower than the convolution method when using only a small number of samples for the kernel.

As for “smoothing” the signal using fitting, splines are simply a piecewise fit of your signal to some function with a continuity condition set at different points throughout the signal. Typically this is done using polynomials, such as a third-order polynomial: {math}`\text{a}x^{3} + \text{b}x^{2} +\text{c}x^{1} + \text{d}x^{0}`. There are a lot of different algorithms and ways to do this, which is out of scope for this work.

## B1 map examples


:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

Let’s revisit our initial _B_{sub}`1` maps in [](#filtPlot1) and see how they respond to the filters we’ve explored in the previous section. The double angle _B_{sub}`1` maps were mostly impacted by noise and structural _T_{sub}`1` patterns, AFI had some artifacts that were caused by Gibbs ringing in the raw images, and the Bloch-Siegert _B_{sub}`1` map had an artifact caused by a phase pole at the end of a fringe line. [](#filtPlot9) shows each of the _B_{sub}`1` map and the filtered maps using the median, Gaussian, and spline filtering techniques.

:::{figure} #filtFig9jn
:label: filtPlot9
:enumerator: 4.22
Filtered _B_{sub}`1` maps
:::

All three methods worked well with the double angle _B_{sub}`1` map, and the outputs of the median and Gaussian are most similar. The top right corner of the spline-filtered double angle _B_{sub}`1` map has higher intensity, likely due to an edge effect as discussed in the [1D example section](#filt1D). For AFI, median and gaussian filters removed most of the repeated variations, whereas spline-filtering didn’t at the medium filter strength. Lastly, for Bloch-Siegert, the median filter performed well at removing the noise and smoothing out the artifact, though some still remains. For the Gaussian and spline cases, there was a single pixel in the left that had very high value in the unfiltered images and this led to a spreading of high _B_{sub}`1` values to nearby voxels, something that didn’t occur for the median filter case. If either of these filters were used in an automated pipeline without quality control, inaccurate _B_{sub}`1` values would have been spread, which is undesireable.

## Recommendations, benefits, and pitfalls


:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

Overall, median, Gaussian, and spline filters perform at smoothing noisy _B_{sub}`1` maps. If image artifacts exists in the _B_{sub}`1` maps, then the choice of filter could impact the output _B_{sub}`1` map.  In all our _B_{sub}`1` map examples ([](#filtPlot9)), a 5x5 voxel median filter would have performed sufficiently all while avoiding spreading errors. This may be a relatively safe filter to try first for clinical use in the brain at clinical field strengths. In other field strengths or anatomies, or if different artifacts exist, this may not always be the case. Good care should always be applied when selecting a filter; know why you are using it, what its potential drawbacks are, and look for error spreading in the output _B_{sub}`1` map. 

If your filtered _B_{sub}`1` map is intended for use at boundary edges, such as grey matter, extra precautions should be taken when applying filters and doing quality control. Know how your filters handle edges, and if needed choose to mirror or extrapolate _B_{sub}`1` values beyond the masked region of interest. Quality control is important, as there can be substantial edge artifacts when using filters. 


Finally, remember that using the unfiltered _B_{sub}`1` map is also a choice, and many researchers use these. It’s important to report if you filtered or not your _B_{sub}`1` maps when reporting them in your research.

# Appendix A


:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

```{math}
:label: daEqA1
:enumerator:
\begin{equation}
\begin{split}
\text{e}^{i2\alpha} &= \text{e}^{i\left( \alpha+\alpha \right)} \\
&= \text{e}^{i\alpha+i\alpha} \\
&= \text{e}^{i\alpha}\text{e}^{i\alpha} \\
&= \left( \text{cos}\left( \alpha \right)+i\text{sin}\left( \alpha \right) \right)\left( \text{cos}\left( \alpha \right)+i\text{sin}\left( \alpha \right) \right) \\
&= \text{cos}\left( \alpha \right)\text{cos}\left( \alpha \right)+i\text{cos}\left( \alpha \right)\text{sin}\left( \alpha \right)+i\text{sin}\left( \alpha \right)\text{cos}\left( \alpha \right)+i^{2}\text{sin}\left( \alpha \right)\text{sin}\left( \alpha \right)\\
&= \text{cos}\left( \alpha \right)\text{cos}\left( \alpha \right)+i\text{cos}\left( \alpha \right)\text{sin}\left( \alpha \right)+i\text{sin}\left( \alpha \right)\text{cos}\left( \alpha \right)+\left( -1 \right)\text{sin}\left( \alpha \right)\text{sin}\left( \alpha \right)\\
&= \text{cos}\left( \alpha \right)\text{cos}\left( \alpha \right)+i\text{cos}\left( \alpha \right)\text{sin}\left( \alpha \right)+i\text{sin}\left( \alpha \right)\text{cos}\left( \alpha \right)-\text{sin}\left( \alpha \right)\text{sin}\left( \alpha \right)\\
&= \text{cos}^{2}\left( \alpha \right)+i\text{cos}\left( \alpha \right)\text{sin}\left( \alpha \right)+i\text{sin}\left( \alpha \right)\text{cos}\left( \alpha \right)-\text{sin}^{2}\left( \alpha \right)\\
&= \left( \text{cos}^{2}\left( \alpha \right)-\text{sin}^{2}\left( \alpha \right)\right)+i\left( \text{cos}\left( \alpha \right)\text{sin}\left( \alpha \right) +\text{sin}\left( \alpha \right)\text{cos}\left( \alpha \right) \right)\\
&= \left( \text{cos}^{2}\left( \alpha \right)-\text{sin}^{2}\left( \alpha \right)\right)+i\left( \text{sin}\left( \alpha \right) \text{cos}\left( \alpha \right)+\text{sin}\left( \alpha \right)\text{cos}\left( \alpha \right) \right)\\
\text{e}^{i2\alpha} &= \left( \text{cos}^{2}\left( \alpha \right)-\text{sin}^{2}\left( \alpha \right)\right)+i\left( 2\text{sin}\left( \alpha \right) \text{cos}\left( \alpha \right) \right)\\
\text{cos}\left( 2\alpha \right)+i\text{sin}\left( 2\alpha \right) &= \left( \text{cos}^{2}\left( \alpha \right)-\text{sin}^{2}\left( \alpha \right)\right)+i\left( 2\text{sin}\left( \alpha \right) \text{cos}\left( \alpha \right) \right)\\
\end{split} \\ \\
\text{For }z \in \mathbb{C} \text{ and }q \in \mathbb{C}\text{,}\\
\text{if }z=q \\ 
\text{then }\text{Re}\left( z \right)=\text{Re}\left( q \right) \\
\text{ and }\text{Im}\left( z \right)=\text{Im}\left( q \right) \\
\text{thus,} \\ \\
\begin{split}
\text{Im}\left( \text{cos}\left( 2\alpha \right)+i\text{sin}\left( 2\alpha \right) \right) &= \text{Im}\left( \left( \text{cos}^{2}\left( \alpha \right)-\text{sin}^{2}\left( \alpha \right)\right)+i\left( 2\text{sin}\left( \alpha \right) \text{cos}\left( \alpha \right) \right) \right)\\
\text{sin}\left( 2\alpha \right) &= 2\text{sin}\left( \alpha \right) \text{cos}\left( \alpha \right) \\
\end{split}\\
Q.E.D.
\end{equation}
```
