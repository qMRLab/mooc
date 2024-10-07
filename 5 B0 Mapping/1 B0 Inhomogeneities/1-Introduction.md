---
title: Introduction
subtitle: B0 Inhomogeneities
date: 2024-07-25
authors:
  - name:  Alexandre Dastous
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

The main magnetic field, also called the B0 field, plays a crucial role in MRI. It dictates the precessional frequency of the spins and sets-up the bulk magnetization, which plays an important role in the image signal-to-noise ratio. Moreover, the radio frequency coils, tuned to the B0 field, are responsible for flipping the spins in the transverse plane and for acquiring the signal. However, imaging reconstruction techniques assume a perfectly homogeneous B0 field to reconstruct the signal from k-space data. An inhomogeneous B0 field can lead to image artifacts such as signal loss, distortions [1], poor fat saturation [2] and many other image artifacts. In extreme cases, it can completely hinder the ability to create an image. B0 inhomogeneities are also problematic for MR spectroscopy (MRS), because they widen the spectral linewidth.

When a subject is introduced in the scanner, the static B0 field can be rendered more homogeneous through a technique called active shimming. Active shimming sends the appropriate amount of current through specific gradient and shim coils, in order to generate a magnetic field that will compensate for the existing (inhomogeneous) magnetic field. This procedure requires precise and accurate mapping of the B0 field. B0 maps show the difference between the current field and the expected field, and are typically displayed in units of magnetic field strength (Tesla [T]), precessional frequency (Hertz [Hz]) or in parts per million (ppm). [](#b0Eq1) can be used to convert from the different units. 

```{math}
:label: b0Eq1
:enumerator:5.1
\begin{equation}
\frac{f-f_{0}}{f_{0}}\ast10^{6}=\frac{\Delta f}{f_{0}}\ast10^{6}=\frac{B-B_{0}}{B_{0}}\ast10^{6}=\frac{\Delta B}{B_{0}}\ast10^{6}=\delta_{ppm}
\end{equation}
```

where f, f0 and f represent the actual precessional frequency, the [Larmor frequency](https://en.wikipedia.org/wiki/Larmor_precession) and the difference between current and the [Larmor frequency](https://en.wikipedia.org/wiki/Larmor_precession) (f-f0=f) respectively. B, B0 and B all have similar interpretations as  f, f0 and f but are in units of field strength (T). The relationship between frequency and field strength can be found using the well known [Larmor equation](https://en.wikipedia.org/wiki/Larmor_precession) (f=B2). ppm is the field offset in ppm.

[](#fig5p1cell) shows typical brain magnitude, phase, and B0 field map images of a brain in a 3 T scanner.

:::{figure} #fig5p1cell
:label: b0Plot1
:enumerator: 5.1
Magnitude image of the reconstructed MRI signal acquired at 3 T (A), the phase in radians (B), and a computed field map in Hz (C), 𝜇T (D) and ppm (E). The dropdown can be used to select between the different images.
:::
