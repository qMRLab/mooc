---
title: Benefits and Pitfalls
subtitle: Dual echo B0 mapping
date: 2024-10-07
authors:
  - name:  Alexandre D'Astous
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

When acquiring a field mapping sequence, many parameters will affect the resulting images. A minimum of two phase images is required to compute B0 field maps, as the initial phase 0(x,y,z) is generally not known and non-zero. Multi-echo field mapping with more than two echoes will be discussed in section 4.3. 

These phase maps can be acquired by many sequences. The general principle includes the use of sequences that cause accumulation of phase. This can be done using GRE sequences or using spin-echo sequences with asymmetric echoes (e.g.: first echo at the spin echo and second echo shifted by 1-2 ms to create an accumulation of phase caused by B0 inhomogeneities). The sequence parameters are chosen such that the data does not suffer much from distortions and other artifacts caused by B0 inhomogeneities. High bandwidth, thin slices and multi-shot sequences are therefore preferred [17]. This means EPI sequences are generally not used for field mapping because of their sensitivity to B0 inhomogeneities. 

When acquiring multiple echoes, the readout direction of the even echoes can be chosen to either be in the same direction (monopolar) as the odd echoes or in opposite directions (bipolar). Using opposite directions can slightly reduce TE, but doing so can cause a slight misregistration between the even and odd echoes and we therefore recommend using readouts in the same direction. 

The standard deviation of the phase (σphase) is inversely proportional to the SNR of the magnitude image (SNRmag) [18].

```{math}
:label: b0Eq7
:enumerator:5.7
\begin{equation}
\sigma_{phase}=\frac{1}{\text{SNR}_{mag}}
\end{equation}
```

A high SNR image will therefore provide a more reliable phase image. With this in mind, the main parameters to choose are the echo times. The first echo time is usually chosen to be quite fast to maximize SNR and minimize phase wraps. The choice of the second echo time is then chosen according to many factors. i) Fat has ~3.35 ppm frequency offset from water. This can cause errors in the fieldmap measurement, where a chemical shift is mistaken for a field shift near and within fatty tissues. TE can be chosen so that fat and water are in phase and reduce this problem (~2.34ms at 3T). Note that different fat components have different chemical shifts. These values are given as first estimates. ii) Longer TE maximizes the difference between the phase measurements and can provide a better estimate if SNR is still sufficient. iii) Shorter TE minimizes the number of wraps and therefore reduces errors due to unwrapping. If the field offset is known, a maximum TE can be calculated to yield no phase wrapping.

As echoes are usually acquired in rapid successions to avoid phase wrapping, rapid gradient switching is required which leads to [eddy currents](https://en.wikipedia.org/wiki/Eddy_current) that can impact the acquired phase data. To mitigate the issue, a single echo per RF pulse can be acquired. A dual-echo sequence would have twice the number of RF pulses (alternating between acquiring both echoes) but allows slower gradient switching and removes [eddy currents](https://en.wikipedia.org/wiki/Eddy_current) effects from the gradient work of the first echo on the second echo. However, this technique requires longer scan time.

As seen in this chapter, phase wrapping can be an issue, as phase is defined over 2. The next section deals with this problem.