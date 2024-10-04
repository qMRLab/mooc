---
title: Data Fitting
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

:::{attention}
:class: attentionDraft
:name: attentionDraft
Figures have not yet been updated with their interactive versions.
:::

In qMT imaging, the biophysical model relates the parameters observed in the two-pool tissue model to physical quantities such as the fractional size of the pools, relaxation times and magnetization exchange rates of the free and restricted pool (Sled and Pike 2001; Sled 2018). However, qMT experiments usually consist of long acquisition imaging protocols accompanied by complex data fitting. To this end, some software solutions have been proposed (Karakuzu et al. 2020; Tabelow et al. 2019; Wood 2018). qMRLab is an open-source project for quantitative MR analysis that is an extension of qMTLab, a software for data simulation and analysis of three MT models: qMT-SPGR, qMT-bSSFP and qMT-SIRFSE. In addition to the quantitative MT methods, qMRLab also contains semi-quantitative MT models including the magnetization transfer ratio (MTR) and magnetization transfer saturation (MTsat).

The qMT-SPGR method in qMRLab contains three fitting models: Sled and Pike, Ramani, and Yarnykh and Yuan (Sled and Pike 2001; Ramani et al. 2002; Yarnykh 2002). For the Sled and Pike model, the saturation fraction effect of the MT pulse on the free pool is pre-computed to accelerate the processing times. The MT effect of the pulse is approximated as an instantaneous fractional saturation of the longitudinal magnetization of the free pool, assuming the absence of chemical exchange processes (Pike 1996; Sled and Pike 2001). To fit the model, additional parameters related to the pulse sequence are required, namely timing parameters, the absorption lineshape, and the characteristics of the MT pulse, such as the shape and the bandwidth or the time-bandwidth product. In Figure 5, the qMT-SPGR method is used to show a single voxel curve simulation for the same MT data fitted by three different models. The fitted parameters were the pool size ratio F, the magnetization transfer rate from the restricted to the free-water pool (kr), and the transverse relaxation time of the free-water (T2,f) and restricted (T2,r) pool.

```{figure} img/plot4.png
:label: qmtFig5

Sled and Pike, Ramani, and Yarnykh and Yuan models to fit the MT data from a qMT-SPGR experiment.
```

In addition to acquiring the MT data, three more quantitative measurements are typically required for model correction purposes. The magnetic field B0 inhomogeneity affects the actual off-resonance frequency experienced by the tissue at each voxel. In MT, B0 maps are computed to correct for off-resonance frequency values of the MT pulse in the presence of magnetic field non-uniformity. Radiofrequency field B1 inhomogeneity is another source of inaccuracies that depend on the operating frequency of the scanner, the pulse sequence, and the shape and electrical properties of the sample (Sled and Pike 1998). Therefore, B1 maps are typically needed to correct the radiofrequency amplitude variations that affect the nominal values of the MT pulse flip angle and the excitation flip angle (Boudreau et al. 2018c). Longitudinal relaxation T1 values vary naturally in biological tissue, but the choice of the T1 mapping method, has also been shown to influence the variability of T1 measurements (Stikov et al. 2015). In the context of a qMT experiment, T1 maps are acquired with an independent measurement of the apparent relaxation time T1 (T1meas). The T1 map is related to the relaxation rate of the free pool (R1,f) as described by equation 6, expressed in terms of  𝐹, kf, R1meas and R1,r, where the relaxation rate of the restricted pool is arbitrarily set to 1 s-1 because it is insensitive to this kind of MT experiments (Sled and Pike 2001). Multiple qMRI maps with a range of B0 and B1 inaccuracies, as well as T1 maps with a variety of relaxation times, have been simulated to show the effect of the quality of these input maps on the qMT fitted parameters as shown in Figure 6.

```{figure} img/eq6.png
:label: qmtEq6
```


```{figure} img/plot5.png
:label: qmtFig6

Errors (%) in fitted parameters when input maps of different quality are used. A B1 map of 0.9 means that the input has a 10% lower value than expected. The fitted parameters include the pool size ratio, F, the magnetization exchange rate, kf, the free pool T2,f, and the restricted pool T2,r. The errors were simulated for B0, B1 and T1 maps of different quality.
```

As described above in Figure 6, inaccurate MT pulse flip angles and excitation flip angles affect the fitted MT parameters, and there is an additional error source related to the T1 mapping measurement. As Boudreau et al. (2018c) have shown, using specific acquisitions protocols, T1 values can be affected by B1 field non-uniformities, such as the variable flip angle method, while the inversion recovery method is insensitive to these field inhomogeneities (Stikov et al. 2015).

Figure 7 displays an example human dataset with the input qMRI maps used to fit the qMT parameters F, kf, T2,f, T2,r.

```{figure} img/plot6.png
:label: qmtFig7

Example magnetization transfer spoiled gradient dataset showing qMRI maps used to fit the MT data (top), and the fitted parameters F, kf, T2,f, T2,r (bottom).
```

