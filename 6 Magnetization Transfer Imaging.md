---
title: Magnetization Transfer
date: 2024-10-07
label: mtMappingChapter
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

# Quantitative Magnetization Transfer


Magnetization Transfer (MT) has been extensively applied to study macromolecular biological tissue composition. The imaging contrast resides in the magnetization transfer between free-water protons and macromolecular proton compartments, through chemical exchange and dipolar interactions. In the two-pool tissue model, highly mobile protons are associated with the free-water pool while protons found in semisolid macromolecular sites are defined as the restricted pool [@Sled2018-zr]. A simple method for visualizing MT effects includes acquiring two images with and without an off-resonance MT pulse to calculate the MT ratio (MTR), which is the normalized difference of these two images [@Wolff1989-ag]. Despite its proven usefulness to study multiple sclerosis [@Zheng2018-ad], Alzheimer’s disease [@Fornari2012-va] and psychiatric disorders [@Chen2015-ch], the MTR is a semi-quantitative metric that depends critically on the imaging sequence parameters [@Seiberlich2020-wg]. Another semi-quantitative approach is the estimation of MT saturation (MTsat) by fitting the MT signal obtained from an MT-weighted (MTw), a proton density (PD) weighted and _T_{sub}`1`-weighted (T1w) contrast [@Helms2008-wf]. Quantitative MT (qMT) consists of fitting multiple images to a mathematical model to extract tissue-specific parameters related to physical quantities, such as pool sizes, magnetization exchange rates between pools, and _T_{sub}`1`, _T_{sub}`2` relaxation times of each pool. Compared to semi-quantitative approaches (MTR, MTsat), qMT has long acquisition protocols and sometimes needs additional measurements (eg. _B_{sub}`0`, _B_{sub}`1`, _T_{sub}`1`), and the complex models required to fit the quantitative maps makes it a challenging imaging technique.

In 2015, our lab published qMTLab [@Cabana2015-zg], an open-source software project seeking to unify three qMT methods in the same interface: qMT using spoiled gradient echo (qMT-SPGR), qMT using balanced steady-state free precession (qMT-bSSFP), and qMT using selective inversion recovery with fast spin echo (qMT-SIRFSE). qMTLab allowed users to simulate, evaluate, fit, and visualize qMT data with the possibility to share qMT protocols between researchers, allowing them to compare the performance of their methods [@Cabana2015-zg]. Since then, we have extended the project and renamed it to qMRLab, [@Karakuzu2020-ul], which in addition to qMT now provides over 20 quantitative techniques under one umbrella, such as relaxation and diffusion models, quantitative susceptibility mapping, _B_{sub}`0` and _B_{sub}`1` mapping. In addition, we created interactive tutorials (see the _T_{sub}`1` mapping chapters using the [inversion recovery](#irIntroduction), [variable flip angle](#vfaIntroduction), and [MP2RAGE](#mp2rageIntroduction) techniques) and blog posts for several qMRI techniques that were published under a creative commons license made it into a quantitative MRI book published by Elsevier [@Seiberlich2020-wg]. This blog post is a continuation of our qMRLab outreach initiative, where we will focus on qMT and the tools we provide in qMRLab for this class of techniques.

This section is an introduction to qMT (with a focus on qMT-SPGR), where we will cover signal modelling and data fitting.

## Signal Modelling


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

```{figure} 6 Magnetization Transfer Imaging/1 Quantitative Magnetization Transfer/img/mtspgr_pulsesequence.png
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

## Data Fitting


In qMT imaging, the biophysical model relates the parameters observed in the two-pool tissue model to physical quantities such as the fractional size of the pools, relaxation times and magnetization exchange rates of the free and restricted pool [@Sled2001-fz;@Sled2018-zr]. However, qMT experiments usually consist of long acquisition imaging protocols accompanied by complex data fitting. To this end, some software solutions have been proposed [@Karakuzu2020-ul;@Tabelow2019-td;@C-Wood2018-gd]. qMRLab is an open-source project for quantitative MR analysis that is an extension of qMTLab, a software for data simulation and analysis of three MT models: qMT-SPGR, qMT-bSSFP and qMT-SIRFSE. In addition to the quantitative MT methods, qMRLab also contains semi-quantitative MT models including the magnetization transfer ratio (MTR) and magnetization transfer saturation (MTsat).

The qMT-SPGR method in qMRLab contains three fitting models: Sled and Pike, Ramani, and Yarnykh and Yuan [@Sled2001-fz;@Ramani2002-pq;@Yarnykh2002-dq]. For the Sled and Pike model, the saturation fraction effect of the MT pulse on the free pool is pre-computed to accelerate the processing times. The MT effect of the pulse is approximated as an instantaneous fractional saturation of the longitudinal magnetization of the free pool, assuming the absence of chemical exchange processes [@Pike1996-wq;@Sled2001-fz]. To fit the model, additional parameters related to the pulse sequence are required, namely timing parameters, the absorption lineshape, and the characteristics of the MT pulse, such as the shape and the bandwidth or the time-bandwidth product. In [](#qmtFig5), the qMT-SPGR method is used to show a single voxel curve simulation for the same MT data fitted by three different models. The fitted parameters were the pool size ratio F, the magnetization transfer rate from the restricted to the free-water pool (_k_{sub}`r`), and the transverse relaxation time of the free-water (_T_{sub}`2,f`) and restricted (_T_{sub}`2,r`) pool.

```{figure} #qmtFig4jn
:label: qmtFig5
:enumerator: 6.5
Sled and Pike, Ramani, and Yarnykh and Yuan models to fit the MT data from a qMT-SPGR experiment.
```

In addition to acquiring the MT data, three more quantitative measurements are typically required for model correction purposes. The magnetic field _B_{sub}`0` inhomogeneity affects the actual off-resonance frequency experienced by the tissue at each voxel. In MT, _B_{sub}`0` maps are computed to correct for off-resonance frequency values of the MT pulse in the presence of magnetic field non-uniformity. Radiofrequency field _B_{sub}`1` inhomogeneity is another source of inaccuracies that depend on the operating frequency of the scanner, the pulse sequence, and the shape and electrical properties of the sample [@Sled1998-pz]. Therefore, _B_{sub}`1` maps are typically needed to correct the radiofrequency amplitude variations that affect the nominal values of the MT pulse flip angle and the excitation flip angle [@Boudreau2018-kv]. Longitudinal relaxation _T_{sub}`1` values vary naturally in biological tissue, but the choice of the _T_{sub}`1` mapping method, has also been shown to influence the variability of _T_{sub}`1` measurements [@Stikov2015-gb]. In the context of a qMT experiment, _T_{sub}`1` maps are acquired with an independent measurement of the apparent relaxation time _T_{sub}`1` (_T_{sub}`1, meas`). The _T_{sub}`1` map is related to the relaxation rate of the free pool (_R_{sub}`1,f`) as described by [](#qmtEq6), expressed in terms of  𝐹, _k_{sub}`f`, _R_{sub}`1,meas` and _R_{sub}`1,r`, where the relaxation rate of the restricted pool is arbitrarily set to 1 s{sup}`-1` because it is insensitive to this kind of MT experiments [@Sled2001-fz]. Multiple qMRI maps with a range of _B_{sub}`0` and _B_{sub}`1` inaccuracies, as well as _T_{sub}`1` maps with a variety of relaxation times, have been simulated to show the effect of the quality of these input maps on the qMT fitted parameters as shown in [](#qmtFig6).


```{math}
:label: qmtEq6
:enumerator:6.6
\begin{equation}
R_{1,f}=R_{1}^{meas}-\frac{k_{f}\left( R_{1,r}-R_{1}^{meas} \right)}{\left( R_{1,r}-R_{1}^{meas} \right)+\frac{k_{f}}{F}}
\end{equation}
```


```{figure} #qmtFig5jn
:label: qmtFig6
:enumerator: 6.6
Errors (%) in fitted parameters when input maps of different quality are used. A _B_{sub}`1` map of 0.9 means that the input has a 10% lower value than expected. The fitted parameters include the pool size ratio, F, the magnetization exchange rate, _k_{sub}`f`, the free pool _T_{sub}`2,f`, and the restricted pool _T_{sub}`2,r`. The errors were simulated for _B_{sub}`0`, _B_{sub}`1` and _T_{sub}`1` maps of different quality.
```

As described above in [](#qmtFig6), inaccurate MT pulse flip angles and excitation flip angles affect the fitted MT parameters, and there is an additional error source related to the _T_{sub}`1` mapping measurement. As shown in [@Boudreau2018-kv], using specific acquisitions protocols, _T_{sub}`1` values can be affected by _B_{sub}`1` field non-uniformities, such as the variable flip angle method, while the inversion recovery method is insensitive to these field inhomogeneities [@Stikov2015-gb].

[](#qmtFig8) displays an example human dataset with the input qMRI maps used to fit the qMT parameters F, _k_{sub}`f`, _T_{sub}`2,f`, _T_{sub}`2,r`.

```{figure} #qmtFig6jn
:label: qmtFig7
```

```{figure} #qmtFig7cell
:label: qmtFig8
:enumerator: 6.7
Example magnetization transfer spoiled gradient dataset showing qMRI maps used to fit the MT data (top), and the fitted parameters F, _k_{sub}`f`, _T_{sub}`2,f`, _T_{sub}`2,r` (bottom).
```

## Summary

In summary, the Bloch-McConnell equations, an analytical solution to the steady-state signal can be derived and fitted with one of the existing models that make different approximations to fit the qMT data for a different set of parameters. The Sled and Pike model [@Sled2001-fz] constrains the solution space by computing complementary _T_{sub}`1` maps, whose acquisition method influences the _B_{sub}`1` sensitivity of the fitted parameters [@Boudreau2018-kv]. This fitting model can be implemented with a continuous or a rectangular wave irradiation of the restricted pool [@Cabana2015-zg]. Ramani’s fitting model is an alternative approach that assumes a continuous wave irradiation scheme with the MT pulse on both free and restricted pools [@Ramani2002-pq]. Another fitting model was proposed by Yarnykh [@Yarnykh2002-dq] where an analytical solution to describe the magnetization is found when the direct saturation of the free pool is neglected.

In future blog posts, we will explore other MT methods, such as MTR [@Wolff1989-ag], MTsat [@Helms2008-wf] and qMT-bSSFP [@Bieri2007-uy;@Gloor2008-wb]. Additionally, we will also be looking at the effects of RF field inhomogeneity on the generated magnetization transfer maps.

# Magnetization Transfer Ratio



:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::


Conventional MRI techniques, such as those used for clinical diagnosis, can only directly measure hydrogen bonded to water molecules. Thus, a non-negligible proportion of body mass is not visible with clinical MRIs, such as non-hydrogen atoms (different resonance frequencies) and hydrogen atoms bonded to large molecules which restricts the motion of the atoms (rapid signal decay, _T_{sub}`2` ~ μs). The latter, called macromolecules, play an important role in the physiology of the body; for example, myelin in the white matter of the brain plays an important role in signal transmission, and is composed largely of macromolecules (lipids and proteins). Although the images acquired by clinical MRI machines can only be generated from signal from mobile hydrogen, these hydrogen atoms interact with nearby molecules and atoms via the electromagnetic fields they mutually generate. In the 70s and 80s, a cross-relaxation mechanism was discovered that sensitizes mobile protons to nearby targeted semi-solid molecules, such as myelin [@Edzes1977-yu;@Edzes1978-oj;@Wolff1989-ag]. With proper experimental design, a higher density of nearby macromolecules in the tissue results in a lower MRI signal. This class of MRI techniques is known as magnetization transfer (MT) imaging.

In the preceding chapter, we delved into the quantitative aspects of magnetization transfer (qMT) imaging, exploring the Bloch-McConnell model, signal modeling, and fitting techniques using qMRLab. Now, we shift our focus to the more accessible and widely used application of MT: magnetization transfer ratio (MTR). Although less quantitative than qMT, MTR is easier to set up and implement, making it popular choices in the MRI community interested in quantifying myelin loss.

In the simplest and most used MT imaging method, only two images are acquired (one with MT preparation, and one without), and a normalized difference between the two images is calculated. This quantity is known as the magnetization transfer ratio (MTR), and has been used extensively to infer information on myelin diseases and disorders, such as [multiple sclerosis](wiki:Multiple_sclerosis) (MS). The proportional relationship between MTR and myelin density has been established using post-mortem immunohistological studies in humans [@Schmierer2004-yr;@Schmierer2007-mb] and animals [@Merkler2005-ct;@Zaaraoui2008-bj]. MTR has also already been used in clinical drug trials for MS [@Maguire2013-vj;@Brown2016-wz]. Its widespread use is due to the fact that most scanners are equipped with the necessary software so that it can be added to an imaging protocol with the click of a button, and it is also a very quick measurement with a short acquisition time.

As summarized in the previous chapter, MR physicists have also developed other MT-related techniques that aim to extract quantitative physical information of tissues, using the mathematical models that describe the MT process. This sub-field is called quantitative MT, and the tissue properties that are typically measured are: the pool-size ratio _F_ (density of the macromolecular content’s (restricted pool) equilibrium magnetization divided by the the same value for the liquid content (free pool)), the exchange rate R, the longitudinal relaxation of the free pool _T_{sub}`1,f`, and the transverse relaxation of both the free and restricted pools (_T_{sub}`2,f` and _T_{sub}`2,r`). In contrast to MTR, quantitative MT techniques are not as widely used because of the long image acquisition times required that impedes clinical use. qMT also requires additional calibration measurements (_B_{sub}`0`, _B_{sub}`1`{sup}`+`, and _T_{sub}`1`), which can be challenging to measure accurately and thus contribute to additional propagation of errors to the measured qMT parameters [@Boudreau2018-kv;@Boudreau2018-jn]. Despite these challenges, a lot of research focuses on developing and using qMT techniques in smaller studies, because the measured qMT parameters are desensitized to effects that can bias MTR measurements (eg _T_{sub}`1`, _B_{sub}`1`{sup}`+`). Another semi-quantitative MT technique that was recently developed is the MT saturation (MTsat) technique, which is the focus of [another section](#mtsatIntro) of this book. 

## MTR in theory


:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::


The full mathematical description of the magnetization transfer two-pool exchange model was explained in the [qMT section](#qmtIntro). Although it’s these same equations that explain the signal differences between the two images acquired used to calculate MTR, in this section we’ll present a more conceptual explanation of the MT exchange process.

In its most basic form, MT is modeled as an exchange process between two “pools” of protons, those from “mobile” protons (eg, hydrogen in liquid water) named the “free” pool (those that are directly measured with conventional MRI), and those from “restricted” protons (i.e. macromolecules) named the “restricted” pool (these cannot be measured directly with conventional MRI). Macromolecular hydrogen cannot be measured directly because the restricted movement creates a more static local electromagnetic environment that doesn’t average out, and this results in a transverse relaxation _T_{sub}`2,r` (signal decay) that is too short to provide measurable signal (_T_{sub}`2,r` ~ μs << feasible TE). Another consequence of this short signal decay time is a broadening of the absorption lineshape in the frequency domain (eg. the range of “resonant” frequencies of that pool of protons). This is a known property of the Fourier Transform, and the phenomenon is isomorphic to the quantum mechanics uncertainty principle; as Δx⋅Δp ≥ constant in quantum mechanics means that if Δx increases Δp will decrease, we observe a similar relationship approximated to _T_{sub}`2`⋅FWHM of the frequencies = constant such that if _T_{sub}`2` decreases, the FWHM of the frequencies will increase. If _T_{sub}`2` is very very short (such as the case for macromolecules), the range of resonant frequencies will be very wide. MT leverages this property by selectively exciting restricted protons far from the mobile proton resonance frequency (applying a pulse off-resonance), but where the energy will be absorbed by some of the protons in the restricted pool. This is the initial preparation of the MT experiment that triggers the conditions needed for cross-relaxation between the unobservable molecules (restricted pool) and observable protons (free pool).

Conventionally, the two-pool exchange model is explained conceptually as a process of magnetization exchange, which is also how it’s described mathematically using the Bloch-McConnel equations. However, this conceptual model can be challenging to understand, particularly for people with physics backgrounds, because unlike energy and momentum, the total magnetization in a voxel is not a conserved physical property. This can be seen simply by observing the evolution of the total magnetization vector after an excitation pulse; the total magnetization vector is (mostly) conserved during the RF pulse, but then decays quickly to near 0 due to _T_{sub}`2` relaxation, and takes a long time to grow back to _M_{sub}`0` from _T_{sub}`1` relaxation. The vector is not constant. So, if magnetization is not a conserved property, how do we know if and how much of it is being exchanged?

As explained in more detail in [Appendix A](#mtrAppendixA), an MT experiment involves the conservation and transfer of energy between spin populations. The off-resonance RF pulse introduces extra energy into the restricted pool of protons, and the relaxation back to thermal equilibrium occurs through spin-lattice relaxation, where the "lattice" includes nearby free-pool protons. This energy exchange results in a reduction of net magnetization in the free pool and a corresponding decrease in observable MR signal. This process underlies the contrast observed in MT imaging, which reflects differences in tissue microstructure and composition.

Now that we have a better grasp of the magnetization exchange process, we can see how this applies for MTR. In MTR, we acquire one image with MT saturation (low signal where there is high macromolecular density), and one image without MT saturation (higher relative signal where there are macromolecules). The MTR signal is then simply calculated as a normalized difference in percentage, that is:


```{math}
:label: mtrEq1
:enumerator:6.7
\begin{equation}
\text{MTR} \left( \text{\%} \right) = \frac{S_{0}-S_{MT}}{S_{0}} \cdot 100
\end{equation}
```

What does this calculated MTR value mean? MTR is the reduction in the steady-state signal resulting from an MT-sensitizing pulse and the ensuing MT exchange that occurs. The higher the density of macromolecular content there is, the more reduction in MT-weighted signal will occur, resulting in a higher MTR value. Typically, MTR values in healthy white matter are higher than in grey matter, and MTR values where there is myelin loss are smaller relative to healthy tissue.

## MTR in practice


:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::


Typically, MTR imaging protocols are implemented on the scanner by adding a relatively long (~5-10 ms) high amplitude off-resonance (~2kHz) preparation RF pulse prior to each TR of an existing imaging sequence. In the early days of MT, the MT pulse was a very long pulse (~10 seconds) prior to one imaging readout of saturation-recovery sequences, but this results in impractically long acquisition times and is very SAR prohibitive. Alternative approaches were explored (eg. 1-2-1 pulses), however now most MT-weighted sequences are done using steady-state sequences (eg SPGR) with a shorter preparation pulse (~10 milliseconds). [](#mtrFig1) illustrated this using a spoiled-gradient recalled echo (SPGR) sequence, with a Gaussian-shaped MT preparation pulse prior to the excitation pulse.

```{figure} 6 Magnetization Transfer Imaging/2 Magnetization Transfer Ratio/img/sequence.png
:label: mtrFig1
:enumerator: 6.8 
Simplified pulse sequence diagram of an MTR imaging sequence. An off-resonance and high powered MT-preparation pulse is followed by a spoiler gradient to destroy any transverse magnetization prior the application of the imaging sequence, in this case a spoiled gradient recalled echo (SPGR).
```

Each MRI vendor optimizes their MT-weighted protocol parameters (eg MT shape, duration, frequency, and amplitude), and few of these details are typically shared with the end-user. [](#mtrTable2) shares protocol parameters used by different MRI manufacturers as reported by two publications.

:::{table} Literature MTR protocol parameters (sources: [@Brown2013-eg;@Karakuzu2022-af])
:label: mtrTable2
:enumerator: 6.2  

<table>
   <tr>
      <th colspan="1" align="center"></th>
      <th colspan="2" align="center">Brown 2013</th>
      <th colspan="2" align="center">Karakuzu 2022</th>
   </tr>
   <tr>
      <th colspan="1" align="center"></th>
      <th colspan="1" align="center">Siemens</th>
      <th colspan="1" align="center">Philips</th>
      <th colspan="1" align="center">GE</th>
      <th colspan="1" align="center">Siemens</th>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>FA (deg)</bold></td>
      <td colspan="1" align="center">15</td>
      <td colspan="1" align="center">15</td>
      <td colspan="1" align="center">6</td>
      <td colspan="1" align="center">6</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>TR (ms)</bold></td>
      <td colspan="1" align="center">30</td>
      <td colspan="1" align="center">47</td>
      <td colspan="1" align="center">32</td>
      <td colspan="1" align="center">32</td>
   </tr>
   <tr>
      <th th colspan="1" align="left"><bold>TE (ms)</bold></td>
      <td colspan="1" align="center">11</td>
      <td colspan="1" align="center">8</td>
      <td colspan="1" align="center">4</td>
      <td colspan="1" align="center">4</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>Offset (Hz)</bold></td>
      <td colspan="1" align="center">1500</td>
      <td colspan="1" align="center">1100</td>
      <td colspan="1" align="center">1200</td>
      <td colspan="1" align="center">1200</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>MT pulse shape</bold></td>
      <td colspan="1" align="center">Gaussian</td>
      <td colspan="1" align="center">Sinc-Gaussian</td>
      <td colspan="1" align="center">Fermi</td>
      <td colspan="1" align="center">Gaussian</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>MT pulse length (ms)</bold></td>
      <td colspan="1" align="center">7.68</td>
      <td colspan="1" align="center">15</td>
      <td colspan="1" align="center">8</td>
      <td colspan="1" align="center">10</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>MT pulse angle (deg)</bold></td>
      <td colspan="1" align="center">500</td>
      <td colspan="1" align="center">620</td>
      <td colspan="1" align="center">540</td>
      <td colspan="1" align="center">540</td>
   </tr>
</table>
:::

These differences in protocol parameters can result in MTR values that vary greatly between vendors and sites, meaning that MTR can be challenging to compare unless great care in details are taken. [](#mtrPlot1) shows MTR simulations using the fundamental qMT parameters for four different tissues ([](#qmtTable3); healthy cortical grey matter, healthy white matter, NAWM, early white matter multiple sclerosis lesion, late white matter multiple sclerosis lesion) using the four MT-weighted SPGR protocols from [](#mtrTable2).



:::{table} Quantitative MT parameters in healthy and diseased human tissue reported for a study at 1.5 T [@Sled2001-fz].
:label: qmtTable3
:enumerator: 6.3  
<table>
   <tr>
      <th colspan="1" align="center"></th>
      <th colspan="1" align="center">Healthy cortical GM</th>
      <th colspan="1" align="center">Healthy WM</th>
      <th colspan="1" align="center">NAWM</th>
      <th colspan="1" align="center">Early WM MS lesion</th>
      <th colspan="1" align="center">Late WM MS lesion</th>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>F</bold></td>
      <td colspan="1" align="center">0.072 ± 0.013</td>
      <td colspan="1" align="center">0.161 ± 0.025</td>
      <td colspan="1" align="center">0.15  ± 0.02</td>
      <td colspan="1" align="center">0.12 ± 0.02</td>
      <td colspan="1" align="center">0.094 ± 0.015</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>k<sub>f</sub></bold></td>
      <td colspan="1" align="center">2.4 ± 0.013</td>
      <td colspan="1" align="center">4.3 ± 1.0</td>
      <td colspan="1" align="center">4.9 ± 1.3</td>
      <td colspan="1" align="center">3.6 ± 0.8</td>
      <td colspan="1" align="center">2.7 ± 0.7</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>R<sub>1,f</sub> (s<sup>-1</sup>)</bold></td>
      <td colspan="1" align="center">0.93 ± 0.2</td>
      <td colspan="1" align="center">1.8 ± 0.3</td>
      <td colspan="1" align="center">1.78 ± 0.4</td>
      <td colspan="1" align="center">1.52 ± 0.2</td>
      <td colspan="1" align="center">1.26 ± 0.3</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>R<sub>1,r</sub> (s<sup>-1</sup>)</bold></td>
      <td colspan="1" align="center">1</td>
      <td colspan="1" align="center">1</td>
      <td colspan="1" align="center">1</td>
      <td colspan="1" align="center">1</td>
      <td colspan="1" align="center">1</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>T<sub>2,f</sub> (ms)</bold></td>
      <td colspan="1" align="center">56 ± 8</td>
      <td colspan="1" align="center">37 ± 8</td>
      <td colspan="1" align="center">38 ± 7</td>
      <td colspan="1" align="center">43 ± 6</td>
      <td colspan="1" align="center">52 ± 9</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>T<sub>2,r</sub> (μs)</bold></td>
      <td colspan="1" align="center">11.1 ± 8</td>
      <td colspan="1" align="center">12.3 ± 1.6</td>
      <td colspan="1" align="center">11.4 ± 1.4</td>
      <td colspan="1" align="center">10.3 ± 1.1</td>
      <td colspan="1" align="center">10.9 ± 1.4</td>
   </tr>
</table>
:::

:::{figure} #mtrFig1jn
:label: mtrPlot1
:enumerator:6.9
MTR values calculated from fundamental qMT tissue parameters for four different MTR imaging protocols.
:::

As demonstrated in the above simulations, one MTR value could have the same value for healthy tissue on one scanner as diseased tissue would have on another scanner. So for the most part, MTR is best used / compared within vendors at the very least, though some normalization techniques have been developed.

In addition to being very sensitive to protocol implementations, MTR values are also sensitive to other tissue properties. As seen in the qMT blog post, the parameter most closely related to macromolecular content is the pool-size ratio _F_. But, if some disease / symptom impacts _T_{sub}`1`  independently of underlying macromolecular content, MTR will also change. That is to say, MTR is sensitive to tissue’s _T_{sub}`1` value independently of the macromolecular content metric F, as shown in [](#mtrPlot2).

:::{figure} #mtrFig2jn
:label: mtrPlot2
:enumerator: 6.10
MTR value for (protocol?) and (tissue?) changes as a function of the underlying _T_{sub}`1` value (_T_{sub}`1,obs`obs or _T_{sub}`1,f`?).
:::

In addition to being sensitive to tissue properties, MTR is also sensitive to system properties such as _B_{sub}`1` (via MT pulse amplitude) and _B_{sub}`0` (via off-resonance frequency). In particular, _B_{sub}`1` can vary up to 30% the nominal value at 3T, and without correction this can introduce substantial errors. [](#mtrPlot3) illustrates how MTR can vary with different _B_{sub}`1` values.

:::{figure} #mtrFig3jn
:label: mtrPlot3
:enumerator: 6.11
MTR value for (protocol?) and (tissue?) changes as a function of the underlying _B_{sub}`1` value (_T_{sub}`1,obs`obs or _T_{sub}`1,f`?).
:::

Lastly, MTR is sensitive to protocol adjustments, which could be done by a scanner operator to accommodate issues during an imaging session. [](#mtrPlot4) demonstrates how MTR varies with TR adjustments.

:::{figure} #mtrFig4jn
:label: mtrPlot4
:enumerator: 6.12
MTR value for (protocol?) and (tissue?) changes as a function protocols TR value.
:::

:::{figure} #mtrFig5jn
:label: mtrPlot5
:enumerator: 6.13
Surface map
:::

## Parting thoughts

:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::


To sum up, our exploration of Magnetization Transfer Ratio (MTR) has highlighted its widespread utility within the field of MRI, in particular for myelin quantification applications. However, it's essential to emphasize that MTR, while immensely valuable, is not a truly quantitative metric. This point underscores the need for caution when comparing MTR values or conducting longitudinal studies, as various factors, including scanner upgrades (both in hardware and software), can potentially result in variations in MTR values for the same subject or samples.

In our next section, we'll shift our focus to MTsat, which is a promising semi-quantitative metric that rivals MTR for its ease of use and rapid acquisition times. MTsat aims to address some of the challenges associated with MTR, while still offering robust sensitivity to macromolecular content.

# Magnetization Transfer Saturation



:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::


Magnetization Transfer Saturation (MTsat) is a semi-quantitative MRI technique that offers unique insights into tissue microstructure. Built upon the spoiled gradient-recalled echo (SPGR) sequence, the MTsat protocol acquires images with and without an MT-preparation off-resonance pulse to acquire different contrast that varies with macromolecular density and _T_{sub}`1`.

The foundation of MTsat lies in a 2008 model by Helms and colleagues [@Helms2008-wf], which treats the off-resonance pulse as a second excitation pulse, allowing us to model the effects of MT analytically without the need of the complex Bloch-McConnel equations. Following some reasonable approximations and the acquisition of three distinct MRI images, this model allows for analytical computation of a parameter that models the % reduction in free-pool longitudinal magnetization due to a single off-resonance pulse, MTsat. 

This introduction provides a glimpse into the theoretical basis of MTsat, its practical applications, and sensitivity to variables like tissue _T_{sub}`1` and _B_{sub}`1`. By exploring the unique properties and potential of MTsat, we hope to give readers a better understanding of the advantages and limitations of this MRI technique in both research and clinical practice, as well as give a deeper conceptual understanding of what the MTsat value means.

MTsat, like MTR and many flavours of quantitative MT, is based on spoiled gradient recalled echo (SPGR) images [@Haase1986-kt;@Sekihara1987-bs;@Hargreaves2012-kj] preceded by an off-resonance RF pulse to provide magnetization transfer contrast [@Wolff1989-ag;@Henkelman1993-lt;@Sled2000-pc;@Sled2018-zr]. [](#mtsatFig1) presents a simplified diagram of this MT-prepared SPGR pulse sequence (imaging gradients are not shown). A standard SPGR sequence (low flip angle [~5-10°], short TR [~10-30ms], and a strong spoiler gradient) are preceded by a long (~10 ms) off-resonance (~1-5 kHz) pulse with a strong peak amplitude (the total pulse has an equivalent on-resonance flip angle of 200°-700°). A smooth shape (e.g. Gaussian or Fermi) is typically used for the off-resonance pulse in order to have a single off-resonance frequency (from Fourier analysis). A strong spoiler gradient is also added between the off-resonance MT-preparation pulse and the on-resonance excitation pulse in order to destroy residual transverse magnetization that may have been created by the off-resonance pulse. Images acquired without MT saturation are acquired using the same timing as this sequence, but with the off-resonance RF pulse either completely off or using a very large off-resonance frequency (e.g. ~30+ kHz).

```{figure} 6 Magnetization Transfer Imaging/3 Magnetization Transfer Saturation/img/sequence.png
:label: mtsatFig1
:enumerator: 6.14
Simplified pulse sequence diagram of an MTR imaging sequence. An off-resonance and high powered MT-preparation pulse is followed by a spoiler gradient to destroy any transverse magnetization prior the application of the imaging sequence, in this case a spoiled gradient recalled echo (SPGR).
```

In the initial MTsat paper [@Helms2008-wf;@Helms2010-kv], the main innovation stems from a new model of the MT-weighted SPGR sequence shown in [](#mtsatFig1). There, [@Helms2008-wf] proposed to interpret the effects of the MT-preparation pulse as a second excitation RF pulse of an unknown flip angle. That is to say, they modeled the reduction of the longitudinal magnetization of the free pool due to the MT pulse to be the same reduction caused by the flip angle rotation of a second instantaneous excitation RF pulse. [](#mtsatFig2) presents the Helms model, where to be consistent with the convention presented in mathematical derivations in [@Helms2008-wf;@Helms2010-kv], the order of the pulses are switched such that the readout excitation pulse comes first ({math}`\alpha_{1}`), and the excitation pulse modelling the effects of the MT pulse comes second ({math}`\alpha_{2}`). Note that, after a steady-state is reached, this order would not not impact the signal value during image readout. 

```{figure} 6 Magnetization Transfer Imaging/3 Magnetization Transfer Saturation/img/mtsat_model_sequence.png
:label: mtsatFig2
:enumerator: 6.15  
Pulse sequence model used in MTSat to approximate the effects occurring in the actual MT-weighted sequence ([](#mtsatFig1)), but as a dual-excitation sequence. Note that the defined TR is shifted so that the beginning of the TR occurs at the excitation pulse, instead of the MT pulse as per [](#mtsatFig1), which once a steady-state is established won’t impact the calculations.
```

## Theory



:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::


As has been derived in many introductory MRI physics textbooks, the steady-state signal equation for a standard SPGR pulse sequence (that is, one excitation flip angle per entire TR) has been shown to be:

```{math}
:label: mtsatEq1
:enumerator:6.8
\begin{equation}
S\left( \alpha,\text{TR} \right)=A\text{sin}\left( \alpha \right)\frac{1-\text{e}^{-R_{1}\cdot \text{TR}}}{1-\text{cos}\left( \alpha \right) \text{e}^{-R_{1}\text{TR}}}
\end{equation}
```

where A is some proportionality constant (e.g. gyromagnetic ratio, density, coil sensitivity, etc), ɑ is the excitation flip angle, _R_{sub}`1` = 1/_T_{sub}`1` (assuming a monoexponential longitudinal relaxation curve), and TR is the repetition time. Similarly, an analytical equation for the steady-state signal of a dual-excitation SPGR experiment ([](#mtsatFig2)) can be derived, and [@Helms2008-wf] demonstrated it to be:

```{math}
:label: mtsatEq2
:enumerator:6.9
\begin{equation}
S\left( \alpha_{1},\text{TR}_{1},\alpha_{2},\text{TR}_{2} \right)=A\text{sin}\left( \alpha _{1}\right)\frac{1-\text{e}^{-R_{1}\cdot \text{TR}}-\left( 1-\text{cos}\left( \alpha_{2} \right) \right)\cdot \left[ 1- \text{e}^{-R_{1}\text{TR}_{1}}\right]\cdot \text{e}^{-R_{1}\text{TR}_{2}}}{1-\text{cos}\left( \alpha_{1} \right)\text{cos}\left( \alpha_{2} \right) \text{e}^{-R_{1}\text{TR}}}
\end{equation}
```

where {math}`\alpha_{1}` is the imaging excitation flip angle, {math}`\alpha_{2}` is the excitation flip angle representing the MT saturation pulse, TR{sub}`1` is the time between {math}`\alpha_{1}` to {math}`\alpha_{2}`, TR{sub}`2` is the time between {math}`\alpha_{2}` and the following {math}`\alpha_{1}`, and TR = TR{sub}`1` + TR{sub}`2`. 

 [](#mtsatEq2) has three unknowns: _A_, _R_{sub}`1`, and {math}`\alpha_{2}`. Of these three, {math}`\alpha_{2}` is expected to be the most sensitive to macromolecular density via the MT effect, and as such is the parameter that we’d like to calculate or fit using this dual-excitation SPGR model for the MT-prepared SPGR pulse sequence. Although there would be some ways to acquire additional measurements (three unknowns, so at a minimum three measurements are needed) and apply a nonlinear fit to  [](#mtsatEq2) to extract {math}`\alpha_{2}`, this method has a long numerical processing time. To shorten the calculation of the parameter maps, [@Helms2008-wf;@Helms2010-kv] (Helms et al. 2008, 2010) proposed some reasonable assumptions that can be made to simplify  [](#mtsatEq2). The first proposed assumption is that _R_{sub}`1`TR << 1, which is true when using typical MT-weighted SPGR protocol parameters (TR ~ 0.01-0.05 s) and in the brain at clinical field strengths (_T_{sub}`1` ~ 1 s, thus _R_{sub}`1` ~ 1 s{sup}`-1`). The same approximation applies to TR{sub}`1` and TR{sub}`2`, which are shorter than TR. This leads to the removal of all exponential functions in  [](#mtsatEq2), as via the Taylor expansion of the exponential function, exp(x) ~ 1 + x when abs(x) << 1, and the removal of another term via R{sub}`1`TR{sub}`1`R{sub}`1`TR{sub}`2` ~ 0 when R{sub}`1`TR{sub}`1` and R{sub}`1`TR{sub}`2` are both << 1. The simplifications result in

```{math}
:label: mtsatEq3
:enumerator:6.10
\begin{equation}
S\left( \alpha_{1},\text{TR}_{1},\alpha_{2},\text{TR}_{2} \right)=A\text{sin}\left( \alpha _{1}\right)\frac{R_{1}\text{TR}-\left( 1-\text{cos}\left( \alpha_{2} \right) \right)\cdot R_{1}\cdot \text{TR}_{1}}{1-\text{cos}\left( \alpha_{1} \right)\text{cos}\left( \alpha_{2} \right)R_{1}\cdot \text{TR}_{1}}
\end{equation}
```

The second approximation is that {math}`\alpha_{2}` is small (less than 30 degrees), which is to say that the MT saturation is relatively small. This is expected to be true for the tissue properties of the brain (mostly, myelin), but care must be taken with the planned MT pulse parameters as the MT saturation increases with smaller offset frequency and high peak pulse amplitude. Later, we’ll calculate if this is a reasonable assumption for the calculated {math}`\alpha_{2}`. This assumption is integrated into [](#mtsatEq2) via the Taylor series expansion of the {math}`\text{cos} \left( \alpha_{2} \right)`, where {math}`\text{cos} \left( x \right) \approx 1-x^{2}/2` for small x (this relationship is true for x < 30 degrees or 0.5 radians). Introducing this approximation in [3] and with the additional simplifications {math}`\alpha_{2}^{2}`R{sub}`1`TR ~ 0 (from the assumptions above), this results in

```{math}
:label: mtsatEq4
:enumerator:6.11
\begin{equation}
S\left( \alpha_{1},\alpha_{2},\text{TR} \right)=A\text{sin}\left( \alpha _{1}\right)\frac{R_{1}\text{TR}}{1-\text{cos}\left( \alpha_{1} \right)+\text{cos}\left( \alpha_{1} \right) \left(\frac{\alpha^{2}_{2}}{2} R_{1}\cdot \text{TR}_{1} \right)} 
\end{equation}
```

Note how the signal no longer has a dependency on the individual TR{sub}`1` and TR{sub}`2` values, but only on the full TR. The final approximation is isomorphic to the previous one, but for the imaging excitation RF pulse, that is to say, that {math}`\alpha_{1}` is small (less than 30 degrees). This is a controllable approximation, as it is a controllable protocol parameter at the scanner. From this assumption,  {math}`\text{cos}\left( \alpha_{1} \right) \approx 1-\alpha_{1}^{2}/2`  and {math}`\text{sin}\left( \alpha_{1} \right) \approx \alpha_{1}` (from the Taylor series expansion), so introducing both of these into [](#mtsatEq4) and simplifying {math}` \approx \alpha_{1}^{2} \cdot R_{1} \cdot \text{TR} \approx 0` and  {math}` \approx \alpha_{1}^{2} \cdot \alpha_{2}^{2} \approx 0` leads to

```{math}
:label: mtsatEq5
:enumerator:6.5
\begin{equation}
S\left( \alpha_{1},\alpha_{2},\text{TR} \right)=A \alpha _{1}\frac{R_{1}\text{TR}}{\frac{\alpha^{2}_{1}}{2}+\frac{\alpha^{2}_{2}}{2} +R_{1}\cdot \text{TR}_{1} }
\end{equation}
```

The term {math}`\alpha_{2}^{2}/2` is the only term that includes an MT effect in [](#mtsatEq5), and thus will be defined as {math}`\delta \equiv \alpha_{2}^{2}/2`.

```{math}
:label: mtsatEq6
:enumerator:6.6
\begin{equation}
S\left( \alpha_{1},\alpha_{2},\text{TR} \right)=A \alpha _{1}\frac{R_{1}\text{TR}}{\frac{\alpha^{2}_{1}}{2}+\delta +R_{1}\cdot \text{TR}_{1} } 
\end{equation}
```

[](#mtsatFig3) demonstrates how {math}`\delta`, which represents MTsat as was defined in [@Helms2008-wf], is the fractional reduction in longitudinal magnetization after the MT pulse in the MTsat model illustrated in [](#mtsatFig2) relative to the Mz prior to the pulse. Conventionally, MTsat ({math}`\delta`) is reported in percentage, so {math}`\text{MTsat} = \delta \cdot 100` .

```{figure} 6 Magnetization Transfer Imaging/3 Magnetization Transfer Saturation/img/mtsat_trig.png
:label: mtsatFig3
:enumerator: 6.16
Demonstration through trigonometry of how following a small flip angle {math}`\alpha_{2}` (eg MT saturation), the value {math}`\delta \equiv \alpha_{2}^{2}/2` represents the fraction of the reduction in longitudinal magnetization due to the pulse (bigDelta) relative to the value prior to the pulse (Mz{sub}`before`).
```

Before jumping into how to measure MTsat, let's demonstrate some expected properties and values using known values from a simpler MTR experiment. From the MTR protocol in [@Brown2013-eg] of the MTR section, {math}`\alpha_{1}`=15 deg and TR = 0.03 s, so assuming a _T_{sub}`1` at 1.5T (field strength that Brown used) of 0.55 s in healthy WM, so R{sub}`1` = 1.8. First off, [](#mtsatFig3) with no MT pulse (thus {math}`\delta` = 0) should converge close to the well-known SPGR equation ([](#mtsatEq1)). Inputting the values in each equations, we get 0.0816A for [1], and 0.0815A, thus they are in close agreement. Next, we can get an estimated value of MTsat, using a known MTR value, the calculated S0 value (which we just did), and then solving [5] for {math}`\delta` using the MTR equation to bring everything together. Doing so is shown in [Appendix A](#mtsatAppendixA), from there and using our simulations in the MTR post with [@Brown2013-eg] for healthier WM (MTR = 46%), we get an MTsat value of 4.92% ({math}`\delta` = 0.0492), which is close to some reported MTsat values in the literature (Karakuzu et al. 2022). From there, and by definition of {math}`\delta`, the modeled {math}`\alpha_{2}` in [](#mtsatFig2) for this example is 18 degrees, confirming that earlier assumption that {math}`\alpha_{2}` < 30 degrees for that approximation.

In that example, we used a known _T_{sub}`1` value to extract MTsat using a two-measurement MTR experiment, but in practice this value is not known and varies per-pixel across tissues. Although we could use an additionally measured _T_{sub}`1` map to do this, this can be time consuming depending on the method used. (Helms et al. 2008, 2010) thus demonstrated that with one additional T1w measurement that uses no MT preparation pulse but has different {math}`\alpha_{1}`/TR than the MTon (MTw) and MToff (PDw) measurements used for MTR, that MTsat can be calculated analytically, and as a bonus a _T_{sub}`1` map is also calculated in the process. (This makes sense, as the VFA _T_{sub}`1` mapping sequence is often just two SPGR measurements with different {math}`\alpha` values). Thus, using this three measurement protocol (MTw/PDw/T1w, which we’ll call the MTsat protocol), MTsat and _T_{sub}`1` (1/R{sub}`1`) can be calculated analytically pixelwise using the following set of equations (derived from [](#mtsatEq5)):

```{math}
:label: mtsatEq7
:enumerator:6.7
\begin{equation}
MTsat=\left( A_{app}\cdot \frac{\alpha_{MT}}{S_{MT}}-1 \right)\cdot R_{1}\text{TR}_{\text{MT}}-\frac{\alpha_{MT}^{2}}{2}
\end{equation}
```

```{math}
:label: mtsatEq8
:enumerator:6.8
A_{app}=S_{PD}S_{T_{1}}\frac{\text{TR}_{\text{PD}}\frac{\alpha_{T_{1}}}{\alpha_{PD}}-\text{TR}_{T_{1}}\frac{\alpha_{PD}}{\alpha_{T_{1}}}}{\text{TR}_{\text{PD}}S_{T_{1}}\alpha_{T_{1}}-\text{TR}_{T_{1}}S_{PD}\alpha_{PD}}
```

```{math}
:label: mtsatEq9
:enumerator:6.9
R_{1}=\frac{1}{2}\cdot \frac{\frac{S_{T_{1}}\alpha_{T_{1}}}{\text{TR}_{T_{1}}}-\frac{S_{PD}\alpha_{PD}}{\text{TR}_{PD}}}{\frac{S_{PD}}{\alpha_{PD}}-\frac{S_{T_{1}}}{\alpha_{T_{1}}}}
```


Remember, like MTR, MTsat is calculated from the equations above following the acquisition of the protocol images; no numerical fitting to a model is required. So effectively, the processing time to produce MTsat maps is the same as MTR, which is nearly instantaneous. Also, unlike MTR, which represents the steady-state signal difference due to the MT effect, MTsat represents the fraction of the longitudinal magnetization saturation caused by a single MT pulse within a TR, after a steady-state is achieved. Conventionally, it is represented as a percentage %, so MTsat is typically reported as {math}`\delta \cdot 100`. Note that MTR and MTsat are not expected to have the same values in magnitude despite both being represented as %, as they represent different changes. A major benefit of MTsat is that it’s expected to have less _T_{sub}`1`-dependency than MTR, as _T_{sub}`1` (1/R{sub}`1`) is separately calculated and accounted for in the calculation of MTsat using the equations above. Although the MTsat metric is more robust against _T_{sub}`1` changes, it is inherently sensitive to the MT preparation pulse properties (due to what MTsat physically represents, which is the saturation due to the MT pulse), and thus MTsat is not truly considered a fully quantitative metric as its value will change depending on the chosen protocol parameters and is not solely specific to the tissue properties or the field properties. [](#mtsatProtocolTable)lists some MTsat protocol parameters that have been reported in the literature.

:::{table}  Some reported MTsat protocol parameters in the scientific literature (sources: [@Helms2008-wf;@Weiskopf2013-lp;@Campbell2018-hi;@Karakuzu2022-af;@York2022-fl])
:label: mtsatProtocolTable
:enumerator: 6.4 

<table>
   <tr>
      <th colspan="2" align="center"></th>
      <th colspan="1" align="center">Helms 2008</th>
      <th colspan="1" align="center">Weiskopf 2013</th>
      <th colspan="1" align="center">Campbell 2018</th>
      <th colspan="2" align="center">Karakuzu 2022</th>
      <th colspan="1" align="center">York 2022</th>

   </tr>
   <tr>
      <th colspan="2" align="center"></th>
      <th colspan="1" align="center">Siemens</th>
      <th colspan="1" align="center">Siemens</th>
      <th colspan="1" align="center">Siemens</th>
      <th colspan="1" align="center">GE</th>
      <th colspan="1" align="center">Siemens</th>
      <th colspan="1" align="center">Siemens</th>
   </tr>
   <tr>
      <th colspan="1" rowspan="3" align="left"><bold>T1w</bold></td>
      <th colspan="1" rowspan="1"align="center">FA</td>
      <td colspan="1" align="center">15</td>
      <td colspan="1" align="center">20</td>
      <td colspan="1" align="center">15</td>
      <td colspan="1" align="center">20</td>
      <td colspan="1" align="center">20</td>
      <td colspan="1" align="center">18</td>
   </tr>
   <tr>
      <th colspan="1" align="center"><bold>TR (ms)</bold></td>
      <td colspan="1" align="center">11</td>
      <td colspan="1" align="center">18.7</td>
      <td colspan="1" align="center">11</td>
      <td colspan="1" align="center">18</td>
      <td colspan="1" align="center">18</td>
      <td colspan="1" align="center">15</td>
   </tr>
   <tr>
      <th colspan="1" align="center"><bold>TE (ms)</bold></td>
      <td colspan="1" align="center">4.92</td>
      <td colspan="1" align="center">2.2–14.7</td>
      <td colspan="1" align="center">-</td>
      <td colspan="1" align="center">4</td>
      <td colspan="1" align="center">4</td>
      <td colspan="1" align="center">1.54/4.55/8.49</td>
   </tr>
   <tr>
      <th colspan="1" rowspan="3" align="left"><bold>PDw</bold></td>
      <th colspan="1" rowspan="1"align="center">FA</td>
      <td colspan="1" align="center">5</td>
      <td colspan="1" align="center">6</td>
      <td colspan="1" align="center">5</td>
      <td colspan="1" align="center">6</td>
      <td colspan="1" align="center">6</td>
      <td colspan="1" align="center">5</td>
   </tr>
   <tr>
      <th colspan="1" align="center"><bold>TR (ms)</bold></td>
      <td colspan="1" align="center">25</td>
      <td colspan="1" align="center">23.7</td>
      <td colspan="1" align="center">30</td>
      <td colspan="1" align="center">32</td>
      <td colspan="1" align="center">32</td>
      <td colspan="1" align="center">30</td>
   </tr>
   <tr>
      <th colspan="1" align="center"><bold>TE (ms)</bold></td>
      <td colspan="1" align="center">4.92</td>
      <td colspan="1" align="center">2.2–14.7</td>
      <td colspan="1" align="center">-</td>
      <td colspan="1" align="center">4</td>
      <td colspan="1" align="center">4</td>
      <td colspan="1" align="center">1.54/4.55/8.49</td>
   </tr>
      <th colspan="1" rowspan="7" align="left"><bold>MTw</bold></td>
      <th colspan="1" rowspan="1"align="center">FA</td>
      <td colspan="1" align="center">5</td>
      <td colspan="1" align="center">6</td>
      <td colspan="1" align="center">5</td>
      <td colspan="1" align="center">6</td>
      <td colspan="1" align="center">6</td>
      <td colspan="1" align="center">5</td>
   </tr>
   <tr>
      <th colspan="1" align="center"><bold>TR (ms)</bold></td>
      <td colspan="1" align="center">25</td>
      <td colspan="1" align="center">23.7</td>
      <td colspan="1" align="center">30</td>
      <td colspan="1" align="center">32</td>
      <td colspan="1" align="center">32</td>
      <td colspan="1" align="center">30</td>
   </tr>
   <tr>
      <th colspan="1" align="center"><bold>TE (ms)</bold></td>
      <td colspan="1" align="center">4.92</td>
      <td colspan="1" align="center">2.2–14.7</td>
      <td colspan="1" align="center">-</td>
      <td colspan="1" align="center">4</td>
      <td colspan="1" align="center">4</td>
      <td colspan="1" align="center">1.54/4.55/8.49</td>
   </tr>
   <tr>
      <th colspan="1" align="center"><bold>Offset (Hz)</bold></td>
      <td colspan="1" align="center">2200</td>
      <td colspan="1" align="center">2000</td>
      <td colspan="1" align="center">2200</td>
      <td colspan="1" align="center">1200</td>
      <td colspan="1" align="center">1200</td>
      <td colspan="1" align="center">1200</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>MT pulse shape</bold></td>
      <td colspan="1" align="center">Gaussian</td>
      <td colspan="1" align="center">Gaussian</td>
      <td colspan="1" align="center">-</td>
      <td colspan="1" align="center">Fermi</td>
      <td colspan="1" align="center">Gaussian</td>
      <td colspan="1" align="center">Gaussian</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>MT pulse length (ms)</bold></td>
      <td colspan="1" align="center">12.8</td>
      <td colspan="1" align="center">4</td>
      <td colspan="1" align="center">-</td>
      <td colspan="1" align="center">8</td>
      <td colspan="1" align="center">10</td>
      <td colspan="1" align="center">9.984</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>MT pulse angle (deg)</bold></td>
      <td colspan="1" align="center">540</td>
      <td colspan="1" align="center">220</td>
      <td colspan="1" align="center">540</td>
      <td colspan="1" align="center">540</td>
      <td colspan="1" align="center">540</td>
      <td colspan="1" align="center">500</td>
   </tr>
</table>
:::

## Simulations


:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

In line with our previous MTR blog post, we employ the qMRLab qMT simulations to model MTsat measurements and subsequently calculate MTsat values from [](#mtsatEq7), [](#mtsatEq8), and [](#mtsatEq9). [](#qmtParamsTable2) lists the essential tissue parameters used for the simulations. [](#mtsatPlot1) plots the MTsat values that have been calculated for each protocol outlined in [](#mtsatProtocolTable), while also incorporating the relevant tissue parameters found in [](#qmtParamsTable2).

:::{table} Quantitative MT parameters in healthy and diseased human tissue reported for a study at 1.5 T [@Sled2001-fz]. 
:label: qmtParamsTable2
:enumerator: 6.5
<table>
   <tr>
      <th colspan="1" align="center"></th>
      <th colspan="1" align="center">Healthy cortical GM</th>
      <th colspan="1" align="center">Healthy WM</th>
      <th colspan="1" align="center">NAWM</th>
      <th colspan="1" align="center">Early WM MS lesion</th>
      <th colspan="1" align="center">Late WM MS lesion</th>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>F</bold></td>
      <td colspan="1" align="center">0.072 ± 0.013</td>
      <td colspan="1" align="center">0.161 ± 0.025</td>
      <td colspan="1" align="center">0.15  ± 0.02</td>
      <td colspan="1" align="center">0.12 ± 0.02</td>
      <td colspan="1" align="center">0.094 ± 0.015</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>k<sub>f</sub></bold></td>
      <td colspan="1" align="center">2.4 ± 0.013</td>
      <td colspan="1" align="center">4.3 ± 1.0</td>
      <td colspan="1" align="center">4.9 ± 1.3</td>
      <td colspan="1" align="center">3.6 ± 0.8</td>
      <td colspan="1" align="center">2.7 ± 0.7</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>R<sub>1,f</sub> (s<sup>-1</sup>)</bold></td>
      <td colspan="1" align="center">0.93 ± 0.2</td>
      <td colspan="1" align="center">1.8 ± 0.3</td>
      <td colspan="1" align="center">1.78 ± 0.4</td>
      <td colspan="1" align="center">1.52 ± 0.2</td>
      <td colspan="1" align="center">1.26 ± 0.3</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>R<sub>1,r</sub> (s<sup>-1</sup>)</bold></td>
      <td colspan="1" align="center">1</td>
      <td colspan="1" align="center">1</td>
      <td colspan="1" align="center">1</td>
      <td colspan="1" align="center">1</td>
      <td colspan="1" align="center">1</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>T<sub>2,f</sub> (ms)</bold></td>
      <td colspan="1" align="center">56 ± 8</td>
      <td colspan="1" align="center">37 ± 8</td>
      <td colspan="1" align="center">38 ± 7</td>
      <td colspan="1" align="center">43 ± 6</td>
      <td colspan="1" align="center">52 ± 9</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>T<sub>2,r</sub> (μs)</bold></td>
      <td colspan="1" align="center">11.1 ± 8</td>
      <td colspan="1" align="center">12.3 ± 1.6</td>
      <td colspan="1" align="center">11.4 ± 1.4</td>
      <td colspan="1" align="center">10.3 ± 1.1</td>
      <td colspan="1" align="center">10.9 ± 1.4</td>
   </tr>
</table>
:::

:::{figure} #mtsatFig1jn
:label: mtsatPlot1
:enumerator: 6.17
MTsat values calculated from fundamental qMT tissue parameters for four different MTR imaging protocols.
:::

It's worth noting that MTsat values show a relatively wider range in values across protocols and tissue types (1% to 7%) when compared against our similar simulations for MTR (30%-60%). Additionally, note the change in order of magnitude of the values between MTsat (~5%) and MTR (~50%). As is demonstrated in the simulations above, MTsat values can be quite similar in both healthy and diseased tissues if different imaging protocols are used. So, for practical purposes, it's recommended to use and compare MTsat values that were measured using a consistent imaging protocol (which, due to some proprietary pulse sequence designs, means that consistency will be best when using the same MRI vendor and version for the study). Nevertheless, some normalization techniques have been developed to make MTsat more useful in broader contexts.

To assess the relationship between MTsat and _T_{sub}`1`, we conducted simulations by varying _T_{sub}`1` values as inputs for a specific protocol. In [](#mtsatPlot2), we present the resulting data, which includes calculated MTR (based on MT-on and PDw measurements), MTsat, and _T_{sub}`1,meas` values. As observed previously, MTR exhibits a high sensitivity to alterations in the tissue _T_{sub}`1` values. Notably, the calculated _T_{sub}`1` values closely mirror the input _T_{sub}`1` values, evident in the identity line on the graph. MTsat shows minimal sensitivity to changes in _T_{sub}`1`, as even a ±30% variation in _T_{sub}`1` values corresponds to only around a ±2% fluctuation in MTsat values.

:::{figure} #mtsatFig2jn
:label: mtsatPlot2
:enumerator: 6.18
MTR/_T_{sub}`1,meas`/MTsat vs _T_{sub}`1` values
:::

Similarly, we can investigate the sensitivity of MTsat to _B_{sub}`1`, which varies substantially in the scanner at magnetic field strengths of 3T and above. In the human brain, _B_{sub}`1` typically fluctuates the nominal flip angles within a range of -30% to 10% (Boudreau et al. 2017). [](#mtsatPlot3) displays the calculated MTR, MTsat, and _T_{sub}`1` values using a range of _B_{sub}`1` values +-30% to both the excitation and MT pulses. All three parameters demonstrate high sensitivity to changes in _B_{sub}`1`. Notably, while _T_{sub}`1` is relatively insensitive to minor magnetic field variations, the calculated _T_{sub}`1` values may deviate from accuracy. In contrast, the calculated MTsat inherently reflects the actual saturation induced by the MT pulse, which is directly proportional to _B_{sub}`1`. This relationship is expected since lower _B_{sub}`1` values result in lower true MTsat values, which is particularly relevant when attempting to use MTsat as a biomarker for myelin content. To address this issue, an empirical equation [@Weiskopf2013-lp] has been introduced to estimate the MTsat value that would have been measured if _B_{sub}`1` values had been uniform across the brain, although it's essential to emphasize that this is not a representation of the actual MTsat values the tissue experiences, but a means to standardize MTsat even in the presence of inhomogeneous _B_{sub}`1` maps if/when RF transmit shimming isn’t done.

:::{figure} #mtsatFig3jn
:label: mtsatPlot3
:enumerator: 6.19
MTR/_T_{sub}`1,meas`/MTsat vs _B_{sub}`1` values. Click button to compare values with or without _B_{sub}`1`-correction
:::

# Appendix A



:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

In reality, what *is* conserved and transferred during an MT experiment, is energy, and this energy is exhibited as non-zero magnetization under the correct conditions. [](#mtrFig7) illustrates this. As is known from MR theory, the net magnetization of a population of spins at thermal equilibrium is a result of an excess (on the order of 10 ppm at 3T) of spins in the low energy level (spins aligned with the magnetic field) relative to the high energy level (spins anti-parallel to the magnetic field), with the energy level splitting (a) being due the nuclear Zeeman effect and for the free pool, has an difference E of {math}`\gamma h B_{0}` (i.e. the energy corresponding to the resonance frequency, {math}`h` being the Planck constant). By applying an off-resonance frequency RF pulse (Δ), we can selectively transfer energy from the electromagnetic field to the restricted pool system such that some spins will jump from the low energy level to the high energy level (RF pumping, b), leaving the free pool undisturbed. This excess in energy that is now in the restricted pool spin population will then redistribute itself through several physical processes to reach a new system-wide equilibrium, such as energy transfer into heat through collisions, or spin exchange free pool spins through dipolar coupling or chemical exchange ([Figure 6A-1a](#mtrFig7)). This energy transferred to the free pool is represented by a slight reduction in the net magnetization of the free pool, which manifests as a decrease in the observed MR signal. This signal reduction occurs because the energy absorbed by the restricted pool (via the off-resonance RF pulse) results in fewer spins in the low-energy state in the free pool, thus reducing its longitudinal magnetization. Over time, the system will reach a new equilibrium state, where the magnetization of both the restricted and free pools reflects this redistributed energy.

In [Figure 6A-1c](#mtrFig7) (right), the new equilibrium state of the magnetization is shown, highlighting how the energy transfer process affects the magnetization of the free pool and, consequently, the overall MR signal. This phenomenon is central to magnetization transfer (MT) imaging, where the contrast in images is derived from the differences in energy transfer between different tissue types. The degree of MT contrast is influenced by factors such as the efficiency of energy transfer processes and the specific properties of the tissue, including the concentration and exchange rates of the restricted pool.

Ultimately, the conservation of energy and its transfer between different spin populations is what underlies the observable effects in MT imaging, allowing it to be used as a tool to probe tissue microstructure and composition.

```{figure} 6 Magnetization Transfer Imaging/2 Magnetization Transfer Ratio/img/energylevels.png
:label: mtrFig7
:enumerator: 6A-1  
Thesis figure
```

# Appendix B


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

# Appendix C


:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

So far we’ve explored a lot of the practical properties of MTsat, but have yet to explore what this parameter represents in reality. We begin this discussion by looking at how [@Helms2008-wf] interpreted MTsat:

(figure or quote)

Thus, MTsat is interpreted as being the saturation (i.e. reduction in longitudinal magnetization) occurring from the pulse substituting the MT pulse ([](#mtsatFig2)) occurring within a single TR, after steady-state has been reached. A reminder: MTR, in contrast, is a steady-state image difference metric (not “within” a TR).

## Simulating MTSat through qMRLab

To assess the validity of this MTsat interpretation, we employ Bloch simulations via qMRLab. These simulations should allow us to visualize the “MTSat value” both as it approaches and after reaching steady-state by quantifying the difference in longitudinal magnetization before and after the MT pulse. The main question we have is: can we find the MT saturation (δ) value directly using Bloch simulations, and how close does it approach the calculated MT saturation value from a three-measurement experiment (equations 7-9)?

Using some high-school geometry, we see how we can calculate MTsat (delta) from this difference, assuming (as Helms did) that the MT saturation causes a flip of a specific angle.

```{figure} 6 Magnetization Transfer Imaging/3 Magnetization Transfer Saturation/img/mtsat_trig.png
:label: mtsatFigA1
:enumerator: 6A.1
Demonstration through trigonometry of how following a small flip angle alpha2 (eg MT saturation), the value {math}`\delta \equiv \alpha_{2}^{2}/2` represents the fraction of the reduction in longitudinal magnetization due to the pulse (bigDelta) relative to the value prior to the pulse (Mz{sub}`before`).
```

### Simulation 1: Revisiting MTsat Theory

In our first simulation, we use the qMRLab qMT-SPGR module to simulate steady-state signals from an MTsat experiment on healthy white matter tissues. We utilize tissue parameters from [@Sled2001-fz] and an MTsat protocol derived from [@Karakuzu2022-af]. 

:::{dropdown} Code

```matlab

clear all, close all, clc
 
%% Load protocol
 
fname = 'configs/mtsat-protocols.json';
fid = fopen(fname);
raw = fread(fid,inf);
str = char(raw');
fclose(fid);
val = loadjson(str);
 
protocols = val.karakuzu2022.siemens1
 
%% Load tissues
 
fname = 'configs/tissues.json';
fid = fopen(fname);
raw = fread(fid,inf);
str = char(raw');
fclose(fid);
val = loadjson(str);
 
tissue = val.sled2001.healthywhitematter;
 
%% T1 range
 
T1_true = 1
 
%% qMT-SPGR experiment
 
MTsats = zeros(1,length(T1_true))
MTRs = zeros(1,length(T1_true))
T1s = zeros(1,length(T1_true))
 
 
protocol = protocols.pdw
 
fa = protocol.fa
tr = protocol.tr/1000
te = protocol.te/1000
offset = protocol.offset
mt_shape = protocol.mtshape
mt_duration = protocol.mtduration/1000
mt_angle = protocol.mtangle
 
Model = qmt_spgr;
Model.Prot.MTdata.Mat = [mt_angle, offset];
Model.Prot.TimingTable.Mat(5) = tr ;
Model.Prot.TimingTable.Mat(1) = mt_duration;
Model.Prot.TimingTable.Mat(4) = Model.Prot.TimingTable.Mat(5) - (Model.Prot.TimingTable.Mat(1) + Model.Prot.TimingTable.Mat(2) + Model.Prot.TimingTable.Mat(3)) ;
Model.options.Readpulsealpha = fa;
Model.options.MT_Pulse_Shape = mt_shape
 
params = tissue{1}
x = struct;
x.F = params.F.mean;
x.kr = params.kf.mean / x.F;
x.R1f = 1/T1_true;
x.R1r = 1;
x.T2f = params.T2f.mean/1000;
x.T2r = params.T2r.mean/(10^6);
 
Opt.SNR = 1000;
Opt.Method = 'Bloch sim';
Opt.ResetMz = false;
 
[FitResult, Smodel] = Model.Sim_Single_Voxel_Curve(x,Opt); % NOTE: this uses a modified version of the qmt_spgr.m file where the additional output is included. Not all version of qMRLab has this; if yours doesn't, go to the file and add the additional function output accordingly.
 
%% Cleanup
 
%Smodel is the normalized MT-SPGR value, that is, the signal with the MT
%pulse on divided by the signal from the same sequence with the MT pulse
%off. Since in the MTsat experiment, the PD-weighted pulse sequence is the
%latter case above, we then define:
 
Signal_MT = Smodel;
Signal_PDw = 1;
 
%% Find scaling value for T1w signal
 
 
% Get PDw/T1w ratio from analytical
 
PDw_Model = vfa_t1;
 
params.EXC_FA = protocols.pdw.fa;
params.T1 = T1_true; % Could improve by caclulating T1meas from qMT values
params.TR = protocols.pdw.tr/1000; % ms
 
PDw_anal = vfa_t1.analytical_solution(params);
 
T1w_Model = vfa_t1;
 
paramsT1w.EXC_FA = protocols.t1w.fa;
paramsT1w.T1 = T1_true; % ms
paramsT1w.TR = protocols.t1w.tr/1000; % ms
 
T1w_anal = vfa_t1.analytical_solution(paramsT1w);
 
T1wPDw_ratio = T1w_anal/PDw_anal
 
%% Cleanup
 
% Since Signal_PDw = 1, then it's clear that 
 
Signal_T1w = T1wPDw_ratio
 
%% Calculate MTsat from signals
 
Model = mt_sat;
FlipAngle =  protocols.pdw.fa;
TR =  protocols.pdw.tr/1000;
Model.Prot.MTw.Mat = [ FlipAngle TR ];
FlipAngle = protocols.t1w.fa;
TR =  protocols.t1w.tr/1000;
Model.Prot.T1w.Mat = [ FlipAngle TR];
FlipAngle =  protocols.pdw.fa;
TR =  protocols.pdw.tr/1000;
Model.Prot.PDw.Mat = [ FlipAngle TR];
 
data = struct();
data.MTw=Signal_MT;
data.T1w=Signal_T1w;
data.PDw=Signal_PDw;
FitResults = FitData(data,Model,0);
MTsats = FitResults.MTSAT
MTRs = FitResults.MTR
T1s = FitResults.T1

```

:::


:::{dropdown} Output
:open:

```matlab

MTsats =

    5.3428


MTRs =

   58.9758


T1s =

    1.0100


```

:::

Our results closely align with expectations (_T_{sub}`1` fitted ~= _T_{sub}`1` input, MTR ~58, MTsat ~5%). Converting the MTsat value to ɑ2 (see [#mtsatFig3]), we find that the MTSat value corresponds to an equivalent excitation pulse of approximately 18.7 degrees. Through Helms' interpretation, we infer that the MT pulse should be reducing the longitudinal magnetization by roughly 0.05 (ie Mz_after pulse - Mz_before pulse = 0.05).

### Simulation 2: Challenging MTSat Model Assumptions

Using the qMRLab Bloch simulations, we can calculate the difference in longitudinal magnetization before and after the MT pulse, and see if this corresponds to the MTsat value calculated above.

Let’s do that.

:::{dropdown} Code

Some modifications of the qMRLab code are needed to output the before/after magnetizations into a file. 

```matlab

clear all, close all, clc
 
%% Load Mz before and after for each TR
 
load('sim2.mat')
 
%% Plot Mz before and after for each TR
 
figure()
plot(Mz_before, 'r')
hold on
plot(Mz_after, 'b')
legend('Mz_{before}', 'Mz_{after}')
 
figure()
plot(Mz_before(end-10+1:end), 'r')
hold on
plot(Mz_after(end-10+1:end), 'b')
legend('Mz_{before}', 'Mz_{after}')
 
figure()
plot(1-Mz_after./Mz_before)
legend('1-Mz_{after}/Mz_{before}')
 
figure()
plot((1-Mz_after./Mz_before)*100)
legend('1-Mz_{after}/Mz_{before}')

```

:::

:::{figure} #mtsatFigB1jn
:label: mtsatAppendixPlotB1
:::

From these simulations, we find that there is a 0.314% reduction in longitudinal magnetization before/after the MT pulse after a steady state is achieved, which is an order of magnitude smaller than the MTsat value we calculated earlier for this protocol and tissue parameters (~5%). Either the MTsat theory is wrong, or we’re missing something. Revisiting the pulse sequence ([#mtsatFig1]) and the MTsat model ([#mtsatFig2]), we notice that while the MTsat model assumes instant excitation for both pulses, in reality the MT pulse is relatively long (~10 ms, [#mtsatProtocolTable]). So, while there is a decoupling between MT saturation and relaxation in the MTsat model ([#mtsatFig2]), in reality (and in our simulations) there is relaxation occurring during the MT pulse, and we didn’t account for that in the above simulation.

### Simulation 3: _T_{sub}`1` Correction During MT Pulse

In our third simulation, we account for the _T_{sub}`1` relaxation during the MT pulse. To simplify the calculations, and like Helms did, we’ll assume a decoupling between the MTsaturation and relaxation and calculate the _T_{sub}`1` relaxation recovery independently for the duration of the MT pulse. We’ll then remove this contribution from the Mzafter-Mzbefore we calculated earlier (0.314%).

:::{dropdown} Code

Some modifications of the qMRLab code are needed to output the before/after magnetizations into a file. 

```matlab


clear all, close all, clc
 
%% Load Mz before and after for each TR
 
load('sim2.mat')
 
%% Plot Mz before and after for each TR
 
figure()
 
figure()
plot((1-Mz_after./Mz_before)*100)
hold on
plot((1-(Mz_after-delta_Mz_T1relax)./Mz_before)*100)
 
legend('MTsat before T1 correction', 'MTsat after T1 correction')
 
figure()
plot((1-(Mz_after-delta_Mz_T1relax)./Mz_before)*100)
legend('1-Mz_{after}/Mz_{before}')

```

:::


:::{figure} #mtsatFigB2jn
:label: mtsatAppendixPlotB2
:::

Upon excluding the _T_{sub}`1` contribution, the disparity Δ in Mz values prior to and following the MT pulse increased to 2.1%, which is to say, that the MT contribution of this pulse leads to a reduction of Mz by 2.1%. This outcome aligns with the expected behavior, as _T_{sub}`1` relaxation perpetually seeks to increase longitudinal magnetization towards its equilibrium value, which inversely impacts Δ. Consequently, the Δ we just calculated within a given TR is now closer to the initial MTsat calculation based on simulated measurements (2.1% compared to 5.34%). Nevertheless, it is apparent that some critical element eludes our simulations since we’ve only calculated only half of the anticipated value using our Bloch simulations.

### Considering Exchange and Relaxation after the MT Pulse

Once again, let’s compare the actual pulse sequence ([](#mtsatFig1)) and the Helms model ([](#mtsatFig2). In the MTsat model, all of the magnetization exchange contribution is concentrated into the second instantaneous excitation-saturation pulse {math}`\alpha^{2}`. In the actual pulse sequence and in our Bloch simulations ([](#mtsatFig1)), there is exchange during the MT pulse (which we’ve calculated above), but also when the MT pulse is off (because the longitudinal free and restricted magnetizations are not at equilibrium - see Bloch-McConnell equations in our qMT blog post). So, it’s likely that the contribution of MT when the off-resonance pulse is off also needs to be accounted for, if we want to calculate the MTsat value directly within a TR in Bloch simulations. This additional MT exchange between the restricted and free pool likely causes a reduction in longitudinal free relaxation which is encapsulated in the MTsat value (which makes sense, from the diagrams of the two-pool model of MT).

### Simulation 3: MT contribution after the off-resonance pulse

To calculate this second contribution, we will calculate the difference in Mz between the end of the MT pulse and the end of TR (just prior to the next MT pulse), and just like we did earlier, we’ll also subtract the _T_{sub}`1` component (assuming that MT and _T_{sub}`1` are decoupled during this time). Note that MTsat is the reduction in magnetization relative to its value prior to the MT pulse, so we need to normalize this contribution by the initial Mz (the same one we used for the MT pulse contribution, at the start of TR). Appendix C extends the diagram from Figure 8 to include the MT contribution after the MT pulse, and although more complex, it demonstrates the need for the note in the previous sentence.

:::{dropdown} Code

Some modifications of the qMRLab code are needed to output the before/after magnetizations into a file. 

```matlab

clear all, close all, clc
 
%% Load Mz before and after for each TR
 
load('sim2.mat')
 
%% Plot Mz before and after for each TR
 
figure()
 
figure()
plot((1-(Mz_after-delta_Mz_T1relax)./Mz_before)*100)
 
hold on
plot((1-(M0_remainingTR_free-delta_Mz_T1relax_remaining)./Mz_before)*100)
plot((1-(Mz_after-delta_Mz_T1relax)./Mz_before)*100+(1-(M0_remainingTR_free-delta_Mz_T1relax_remaining)./Mz_before)*100)
 
legend('MTsat contribution from MT pulse event', 'MTsat contribution from cross-relaxation event', 'Total MTsat for TR')

```

:::

:::{figure} #mtsatFigB3jn
:label: mtsatAppendixPlotB3
:::

These simulations show through Bloch simulations that the sum of the MT contribution during and after the off-resonance pulse (with the _T_{sub}`1` relaxation component removed) leads to a reduction in longitudinal magnetization of 5.49%, very close to the 5.34% that was calculated using the Helms model of MTsat in [](#mtsatEq7), [](#mtsatEq8), and [](#mtsatEq9). A slight overestimate still remains, but this difference is likely impossible to consolidate, as there will always be a difference between the actual MT exchange (where both MT and _T_{sub}`1` are counteracting each other at all times) and the modeled MTsat exchange (where instantaneous pulses are assumed, so the MT and _T_{sub}`1` contribution are completely separated in this theory).These simulations should however show that the MTsat contribution is not restricted to only the difference in Mz resulting after the effects of the MT pulse, but also to the cross-relaxation occurring between pools in the absence of the MT pulse.

### Interpreting MTSat

In conclusion, our reevaluation of MTSat suggests that it does not model solely the fractional saturation due to the MT pulse within a single TR, as conventionally understood. Instead, MTsat appears to represent the fractional saturation arising from the entire MT contribution during a TR, that is to say, both the MT pulse and the subsequent MT exchange between the two pools that takes place after following the off-resonance pulse. This subtle reinterpretation may challenge existing interpretations, as a greater contribution results from the exchange after the MT preparation pulse due to cross-relaxation caused by the perturbing MT pulse. This analysis highlights the power of open-source qMRI tools like qMRLab in fostering deeper understanding within the field.

Through a meticulous examination of MTSat, we encourage the scientific community to engage in further discussions and research, potentially leading to more refined models and insights into this crucial aspect of MRI physics in modelling tissue components that are difficult to measure directly, such as the semi-solid myelin sheets.