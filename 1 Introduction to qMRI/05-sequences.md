---
title: Two MRI sequences and two qMRI measurements
subtitle: Coming full circle back
date: 2024-10-07
authors:
  - name: Agah Karakuzu
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  figure:
    template: Fig. %s
---


### Coming full circle back to two measurements with two pulse sequences

> "The Court concluded that MRI machines rely on the tissue NMR relaxations that were claimed in the patent as a method for detecting cancer, and that MRI machines use these [_T_{sub}`1` and _T_{sub}`2` values] to control pixel brightness..." (GE vs Fonar 1996, U.S. Fed. Cir.)

Although going from values to brightness and back again is a `🐓&🥚` problem, GE could have stood a better chance by defending that the pixel brightness can be used to obtain _T_{sub}`1` and _T_{sub}`2` values, but _T_{sub}`1` and _T_{sub}`2` values cannot be directly utilized to obtain pixel brightness by MRI machines. Indeed, _T_{sub}`1`-weighted and _T_{sub}`2`-weighted contrasts are primarily determined based on the contribution of _T_{sub}`1` and _T_{sub}`2` (or neither). Nevertheless, to adjust those contributions, MRI machines use pulse sequences and parameters. This section will introduce two essential sequences, `spin-echo` and `gradient-echo` to show how contrasts are determined (`conventional MRI`) and the values are calculated (qMRI).

#### Spin Echo and _T_{sub}`2` mapping

In their seminal article titled “atomic memory”, Brewer and Hahn introduce the spin-echo (Hahn, 1949) by tapping into an intellectual conflict between the 2nd law of thermodynamics and the time reversal symmetry (Brewer and Hahn, 1984). The discussion is illustrated in [](#intFig15) to portray the paradoxical nature of the discussions on the physical phenomenon giving rise to a spin-echo. This is yet another effect exploited by the MRI, without necessarily having a complete understanding of the underlying “hidden order” effect emerging from the microscale interactions. For further reading on the conflict between the time symmetry and the entropy, the reader is referred to a recent blog post (Siegel, 2019).

::: {seealso}
In 2016, MRM Highlights published an [interview with](https://www.ismrm.org/MRM/mrm_highlights_magazine.pdf) [Erwin Hahn](https://en.wikipedia.org/wiki/Erwin_Hahn) before he passed away the same year. His transformative genius offers many insights, not only about MRI.
:::


```{figure} ./img/int_fig15.jpg
:label: intFig15
:align: center

The second law of the thermodynamics (Boltzmann) vs the time reversal symmetry (Loschmidt) and the relation of this conflict to spin-echo (Hahn). The pancake analogy is followed in [](#intFig16) for completeness.
```

Following an excitation pulse, the spin pool goes towards disorderliness and the transverse magnetization decays (the pancake batter expands, [](#intFig15)). In their article, Brewer and Hahn discuss resurfacing of an ordered state out of this increasing entropy by reversing the phase order of the spins (the cooked pancake contracts). By retaining the pancake analogy, [](#intFig16) simulates a spin-echo (SE) pulse sequence and shows the spin evolution at certain time points. At the point (B), a 90°excitation pulse rotates the net magnetization to transfer plane, and after some time, the spins dephase (C, arrows fanning out in the x-y spin scatter plot) as the FID disappears. The “refocusing pulse” rotates the net magnetization by 180°in the transverse plane (D) and reverses the phase order of the spins, analogous to flipping the pancake ([](#intFig16)). After a period equal to the duration between the 90°and 180°RF pulses, a spin echo is formed (F). The time elapses between the center of the excitation pulse and the peak of the echo signal is termed the echo time (TE).

```{figure} ./img/int_fig16.jpg
:label: intFig16
:align: center

The spin evolution diagram of a `spin-echo` sequence is shown (A) before the excitation, (B) at the peak of the excitation pulse, (C) one millisecond after the 90°pulse, (D) at the peak of the refocusing pulse, (E) one millisecond after the 180°pulse, (F) at the echo time (TE) and (G) following the echo.
```

```{math}
:label: int1seq
S = M_{0}*(1-e^{\frac{-TR}{T1}})*e^{\frac{-TE}{T2}} 				\frac{\sin\theta}{1-\cos\theta*e^{\frac{-TR}{T1}}}
```

Equation [](#int1seq) shows the signal representation of a standard SE acquisition. Given that the brightness of the image pixels is determined by the magnitude of the signal S, the relevant contribution of _T_{sub}`1` and _T_{sub}`2` to the image contrast can be adjusted by changing the TR and TE. For TE → 0 (i.e. short TE), the last term of the equation converges to identity, reducing the _T_{sub}`2` contribution. If this is coiled with a long TR (TR → `inf`), the exponential in the second term of the equation converges to zero, reducing the _T_{sub}`1` contribution. Therefore when the TE is short and the TR is long, the contribution to image contrast comes from the density of the spins, i.e. proton density. On the other hand, to increase the _T_{sub}`2`-weighting by keeping TR the same (long), the TE must be increased (the importance of the last term increases). [](#intFig17) exemplifies this by showing the same image across 6 echoes, where substances with longer _T_{sub}`2` (e.g., eyes and the cerebrospinal fluid (CSF)) appear gradually brighter compared to the other structures in the image as the TE increases.

```{figure} ./img/int_fig17.jpg
:label: intFig17
:align: center

An example _T_{sub}`2` map, estimated by fitting voxel-wise brightness values (red plus signs) across `32 echo times` to the exponential decay (blue line) defined by Equation [](#int1seq). The top row shows how conventional image contrast changes from proton-density to _T_{sub}`2`-weighted as the TE increases from 12ms to 380ms.
```

Since the signal representation is known for the basic SE acquisition, the signal (the voxel brightness) can be sampled at several TE’s and fitted to the exponential decay defined by the last term of the equation to calculate _T_{sub}`2`, namely _T_{sub}`2` mapping. The second term of the equation will not be taken into account, as the TR will be kept constant across the samples. [](#intFig17) shows a _T_{sub}`2` mapping example, where an axial image of the human brain was collected across 32 TE’s ranging from 12 to 380ms.

So far we looked at how an echo forms out of a 90-180° pulse pair, and created a _T_{sub}`2` map based on its signal representation. Although the images created using SE convey good soft-tissue contrast and are robust against motion artifacts, they often come at the cost of long acquisition time (TR ranges from half to a few seconds) and high RF energy deposition. 

#### Gradient Echo and _T_{sub}`1` mapping

Fortunately, MRI offers yet another way to generate echoes by taking advantage of the FID following a single RF pulse. The reversal effect needed for echoing the signal is achieved by dephasing and rephasing the spins with the use of a bipolar gradient ([](#intFig18)). Therefore, this method is named the gradient echo (GRE).

```{figure} ./img/int_fig18.png
:label: intFig18
:align: center

The formation of gradient echo by playing a bipolar gradient followed by a 20°RF pulse.
```

Unlike SE-based sequences, GRE sequences allow for shorter TE (a few milliseconds) and TR (10-50 milliseconds), resulting in faster acquisitions. In conventional imaging, one of the most popular GRE sequences is the spoiled gradient-echo (SPGR) sequence (Haase et al., 1986), as it allows large volumetric coverage within clinically feasible scan durations. SPGR is also widely used as a basis for various qMRI methods, because it provides a simple signal representation:


```{math}
:label: int2seq
S = M_{0}\frac{\sin\theta *(1-e^{\frac{-TR}{T1}})}{1-\cos\theta*e^{\frac{-TR}{T1}}}e^{\frac{-TE}{T2^*}}
```

Unlike the SE signal representation (Equation [](#int1seq)), Equation [](#int2seq) does not include a term explaining the decay of the transverse magnetization by _T_{sub}`2`. Instead, the last term of the SPGR signal representation indicates that the TE governs the signal contribution of {math}`T_{2}^{*}` – the effective _T_{sub}`2`. As the GRE is restored from the FID ([](#intFig18)), the resulting echo is susceptible to slight variations in the main magnetic field. These variations may originate from the hardware-related imperfections of the B0, or from the field disruptions induced by adjacent substances with distinct magnetization levels, such as the air-tissue interfaces around the nasal cavity. As a result, _T_{sub}`2` weighting cannot be achieved with SPGR. Instead, the second term of the Equation 2.5 indicates that the SPGR sequence is primarily _T_{sub}`1`- weighted, which can be controlled by changing the flip angle (FA) of the excitation pulse ({math}`\theta`) or the TR.

After a number of GRE excitation pulses, the longitudinal magnetization reaches a dynamic equilibrium, i.e. steady-state. When the steady state is reached, the spin system looks static to the observations at a macro-scale, whereas the underlying spin interactions carry on by balancing out each other. This is similar to a person walking up (_T_{sub}`1` recovery) an escalator that is going down (the excitation pulse). When this equilibrium is accounted for by the Equation [](#int2seq), the FA that maximizes the signal for a fixed TR is given by:

```{math}
:label: int3seq
\theta_E = \arccos(e^{\frac{-TR}{T1}})
```

where {math}`\theta_E` is known as the Ernst Angle (Ernst and Anderson, 1966). [](#intFig18) shows this relationship by simulating an SPGR signal across multiple FA at a fixed TR of 30ms for a substance with _T_{sub}`1`=800ms. It can be seen that the signal is maximized around an FA of 15°, as given by the Equation [](#int3seq) for these settings ([](#intFig19)).

```{figure} ./img/int_fig19.png
:label: intFig19
:align: center

Spoiled gradient-echo (SPGR) signal is simulated for excitation flip angle (FA) ranging from 0 to 90°. With the repetition time set to 30ms, the Ernst Angle ({math}`\theta_E`) is calculated at 16°for a spin system with _T_{sub}`1` of 800ms (Equation [](#int3seq)). The simulated signal agrees with the calculation, indicating that the signal is the highest when the FA is around 16°(green line).
```

However, this relationship is valid under the assumption that the transverse magnetization is zero. Therefore, any residual transverse magnetization during the readout violates the steady-state conditions of the signal representation given by Equation [](#int3seq). To avoid this, the entire spin system is dephased at the end of each TR by using a spoiler gradient, hence the name the “spoiled” GRE. In real-world pulse sequence implementations, the gradient spoiling is coupled with RF spoiling by phase cycling the excitation from TR to TR at predetermined increments (Zur et al., 1991). [](#intFig20) displays Bloch simulation results, indicating the critical role of selecting the spoiler gradient area (a), enabling RF spoiling (b) and the selection of a proper phase increment value in disrupting the residual transverse magnetization. The effect of spoiling efficiency becomes particularly important when multiple SPGR acquisitions are performed at different flip angles to calculate a _T_{sub}`1` map, namely variable flip angle (VFA) method (Fram et al., 1987). This is simply because when the observed data deviates from the expected signal representation ([](#intFig20)), the fitted parameters become inaccurate. A more theoretical explanation of the VFA _T_{sub}`1` mapping method, its accuracy aspects and limitations are explained in the _T_{sub}`1` mapping chapter of this MOOC.

```{figure} ./img/int_fig20.jpg
:label: intFig20
:align: center

The influence of spoiling on SPGR signal is simulated for (a) the spoiling gradient area ranging from 0 to 10 (cyc/voxel), (b) enabling/disabling RF spoiling at 117° quadratic phase increment and (c) different phase increment values ranging from 0 to 180°.
```

[](#intFig21) shows an example _T_{sub}`1` mapping application using the SPGR sequence in a phantom with known values. The acquisitions were performed at two flip angles of 20° (a) and 6° (b), and TR=32ms. Both images show the center of a plate accommodating 14 spheres with _T_{sub}`1` values ranging from 0.1 to 1.99 seconds in clockwise ascending order (R1 to R10). In agreement with the Equation 2.4, the image acquired at the higher FA shows superior _T_{sub}`1` contrast (a), as the pixel brightness varies inversely with the reference _T_{sub}`1` values (d). On the other hand, spheres in the lower FA image show similar brightness (b), in proportion with the spin density of the spheres. From this image pair, a _T_{sub}`1` map (c) was estimated using a linear fit as described in (Mathieu), exhibiting good accuracy across the reference values.

```{figure} ./img/int_fig21.jpg
:label: intFig21
:align: center

Variable flip angle (VFA) using SPGR sequence. a) _T_{sub}`1`-weighted and b) PD- weighted images of ISMRM/NIST system phantom acquired at 18 and 32ms, respectively. c) _T_{sub}`1` map estimated by fitting images (a) and (b) to the relaxational component of the Equation 2.5. d) The comparison of the estimated and reference _T_{sub}`1` values.
```

In this section, we covered two fundamental pulse sequences: SE and SPGR. Starting from spin-level interactions, we looked at the signal representations of each sequence and how acquisition parameters are associated with the contrast characteristics of the resulting con- ventional images. By doing so, we analyzed how pixel brightness emerges from two values, _T_{sub}`2` and _T_{sub}`1`. Then using the same signal representations, `we came full circle back` (in case you were wondering what it meant) to these values from the pixel brightness by applying two fundamental qMRI methods, multi-echo SE for _T_{sub}`2` and VFA for _T_{sub}`1` mapping. A more entertaining summary of the SE and GRE sequences is unintentionally delivered by two indie rock albums ([](#intFig22)).

```{figure} ./img/int_fig22.jpg
:label: intFig22
:align: center

Two (slightly modified) album covers by the [Artic Monkeys](https://en.wikipedia.org/wiki/Arctic_Monkeys) and [the Districts](https://en.wikipedia.org/wiki/The_Districts) summarizing spin-echo (SE) and spoiled gradient-echo (SPGR) sequences.
```