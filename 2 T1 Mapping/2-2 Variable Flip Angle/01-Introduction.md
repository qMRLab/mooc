---
title: Abstract
subtitle: Variable Flip Angle
date: 2024-07-25
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: false
  figure:
    template: Fig. %s
---

## Variable Flip Angle T<sub>1</sub> Mapping

Variable flip angle (VFA) [T<sub>1</sub>](wiki:Spin–lattice_relaxation) mapping {cite:p}`Christensen1974,Fram1987,Gupta1977`, also known as Driven Equilibrium Single Pulse Observation of [T<sub>1</sub>](wiki:Spin–lattice_relaxation) (DESPOT1) {cite:p}`Homer1985,Deoni2003`, is a rapid quantitative [T<sub>1</sub>](wiki:Spin–lattice_relaxation) measurement technique that is widely used to acquire 3D [T<sub>1</sub>](wiki:Spin–lattice_relaxation) maps (e.g. whole-brain) in a clinically feasible time. VFA estimates [T<sub>1</sub>](wiki:Spin–lattice_relaxation) values by acquiring multiple spoiled [gradient echo](wiki:Gradient_echo) acquisitions, each with different excitation flip angles (<i>θ<sub>n</sub></i> for n = 1, 2, .., N and <i>θ<sub>i</sub></i> ≠ <i>θ<sub>j</sub></i>). The steady-state signal of this pulse sequence ([](#vfaFig1)) uses very short TRs (on the order of magnitude of 10 ms) and is very sensitive to [T<sub>1</sub>](wiki:Spin–lattice_relaxation) for a wide range of flip angles.

VFA is a technique that originates from the NMR field, and was adopted because of its time efficiency and the ability to acquire accurate [T<sub>1</sub>](wiki:Spin–lattice_relaxation) values simultaneously for a wide range of values {cite:p}`Christensen1974,Gupta1977`. For imaging applications, VFA also benefits from an increase in SNR because it can be acquired using a 3D acquisition instead of multislice, which also helps to reduce slice profile effects. One important drawback of VFA for [T<sub>1</sub>](wiki:Spin–lattice_relaxation) mapping is that the signal is very sensitive to inaccuracies in the flip angle value, thus impacting the [T<sub>1</sub>](wiki:Spin–lattice_relaxation) estimates.  In practice, the nominal flip angle (i.e. the value set at the scanner) is different than the actual flip angle experienced by the spins (e.g. at 3.0 T, variations of up to ±30%), an issue that increases with field strength. VFA typically requires the acquisition of another quantitative map, the transmit RF amplitude (B<sub>1</sub><sup>+</sup>, or B<sub>1</sub> for short), to calibrate the nominal flip angle to its actual value because of B<sub>1</sub> inhomogeneities that occur in most loaded [MRI coils](wiki:Radiofrequency_coil) {cite:p}`Sled1998`. The need to acquire an additional B<sub>1</sub> map reduces the time savings offered by VFA over saturation-recovery techniques, and inaccuracies/imprecisions of the B<sub>1</sub> map are also propagated into the VFA [T<sub>1</sub>](wiki:Spin–lattice_relaxation) map {cite:p}`Boudreau2017,Lee2017`.

```{figure} img/vfa_pulsesequence.png
:label: vfaFig1
:enumerator: 2.7
Simplified pulse sequence diagram of a variable flip angle (VFA) pulse sequence with a gradient echo readout. TR: repetition time, <i>θ<sub>n</sub></i>: excitation flip angle for the nth measurement, IMG: image acquisition (k-space readout), SPOIL: spoiler gradient.
```