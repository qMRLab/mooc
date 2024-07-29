---
title: Introduction
subtitle: B0 Inhomogeneities
date: 2024-07-25
authors:
  - name:  Alexandre Dastous
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: false
  figure:
    template: Fig. %s
---

The main magnetic field, also called the B0 field, plays a crucial role in MRI. It dictates the precessional frequency of the spins and sets-up the bulk magnetization which plays an important role in the signal-to-noise ratio that can be expected from an image. Moreover, the radio frequency coils, tuned to the B0 field, are responsible for flipping the spins in the transverse plane and for acquiring the signal. However, imaging techniques assume a perfectly homogeneous B0 field to reconstruct the signal k-space data into images through the inverse Fourier transform. An inhomogeneous B0 field can lead to image artifacts such as signal loss, distortions [1], poor fat saturation [2] and many other image artifacts. In extreme cases, it can completely hinder the ability to image. B0 inhomogeneities are also problematic for MRS since it widens the spectral linewidth.

When a subject is introduced in the scanner, the static B0 field can be rendered more homogeneous through a technique called active shimming, which consists in sending the appropriate amount of current through specific gradient and shim coils, in order to generate a magnetic field that will compensate for the existing (inhomogeneous) magnetic field. This procedure requires precise and accurate mapping of the B0 field. B0 maps show the difference between the current field and the expected field, and are typically displayed in units of magnetic field strength (Tesla [T]), precessional frequency (Hertz [Hz]) or in parts per million (ppm). The following figure shows typical brain magnitude, phase, and B0 field map images of a brain in a 3 T scanner.


```{figure} img/fig1.png
:label: b0intFig1

Magnitude image of the reconstructed MRI signal acquired at 3 T (A), the phase in radians (B), and a computed field map in Hz (C), 𝜇T (D) and ppm (E). The dropdown can be used to select between the different images.
```