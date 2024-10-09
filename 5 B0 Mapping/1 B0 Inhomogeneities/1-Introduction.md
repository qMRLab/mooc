---
title: Introduction
subtitle: B0 Inhomogeneities
date: 2024-10-07
label: b0InhomoIntro
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

The main magnetic field, also called the _B_{sub}`0` field, plays a crucial role in MRI. It dictates the precessional frequency of the spins and sets-up the bulk magnetization, which plays an important role in the image signal-to-noise ratio. Moreover, the radio frequency coils, tuned to the _B_{sub}`0` field, are responsible for flipping the spins in the transverse plane and for acquiring the signal. However, imaging reconstruction techniques assume a perfectly homogeneous _B_{sub}`0` field to reconstruct the signal from k-space data. An inhomogeneous _B_{sub}`0` field can lead to image artifacts such as signal loss, distortions [Jezzard1995-qd], poor fat saturation [2] and many other image artifacts. In extreme cases, it can completely hinder the ability to create an image. _B_{sub}`0` inhomogeneities are also problematic for MR spectroscopy (MRS), because they widen the spectral linewidth.

When a subject is introduced in the scanner, the static _B_{sub}`0` field can be rendered more homogeneous through a technique called active shimming. Active shimming sends the appropriate amount of current through specific gradient and shim coils, in order to generate a magnetic field that will compensate for the existing (inhomogeneous) magnetic field. This procedure requires precise and accurate mapping of the _B_{sub}`0` field. _B_{sub}`0` maps show the difference between the current field and the expected field, and are typically displayed in units of magnetic field strength (Tesla [T]), precessional frequency (Hertz [Hz]) or in parts per million (ppm). [](#b0Eq1) can be used to convert from the different units. 

```{math}
:label: b0Eq1
:enumerator:5.1
\begin{equation}
\frac{f-f_{0}}{f_{0}}\ast10^{6}=\frac{\Delta f}{f_{0}}\ast10^{6}=\frac{B-B_{0}}{B_{0}}\ast10^{6}=\frac{\Delta B}{B_{0}}\ast10^{6}=\delta_{ppm}
\end{equation}
```

where {math}`f`, {math}`f_{0}` and {math}`\Delta f` represent the actual precessional frequency, the [Larmor frequency](https://en.wikipedia.org/wiki/Larmor_precession) and the difference between current and the [Larmor frequency](https://en.wikipedia.org/wiki/Larmor_precession) ({math}`f-f_{0}=\Delta f`) respectively. _B_, _B_{sub}_0_ and Δ _B_ all have similar interpretations as {math}`f`, {math}`f_{0}` and {math}`\Delta f` but are in units of field strength (T). The relationship between frequency and field strength can be found using the well known [Larmor equation](https://en.wikipedia.org/wiki/Larmor_precession) ({math}`f=\gamma B / 2\pi`). {math}`\delta_{ppm}` is the field offset in ppm.

[](#b0Plot1) shows typical brain magnitude, phase, and B0 field map images of a brain in a 3 T scanner.

:::{figure} #fig5p1cell
:label: b0Plot1
:enumerator: 5.1
Magnitude image of the reconstructed MRI signal acquired at 3 T (A), the phase in radians (B), and a computed field map in Hz (C), 𝜇T (D) and ppm (E). The dropdown can be used to select between the different images.
:::
