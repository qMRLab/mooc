---
title: Abstract
subtitle: Inversion Recovery
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

## Inversion Recovery T_1 Mapping

Widely considered the gold standard for [T_1](wiki:Spin–lattice_relaxation) mapping, the [inversion recovery](wiki:Inversion_recovery)technique estimates [T_1](wiki:Spin–lattice_relaxation) values by fitting the signal recovery curve acquired at different delays after an inversion pulse (180°). In a typical inversion recovery experiment ([](#irFig1)), the magnetization at thermal equilibrium is inverted using a 180° RF pulse. After the longitudinal magnetization recovers through spin-lattice relaxation for predetermined delay (`inversion time`, TI), a 90° excitation pulse is applied, followed by a readout imaging sequence (typically a spin-echo or gradient-echo readout) to create a snapshot of the longitudinal magnetization state at that TI.

Inversion recovery was first developed for NMR in the 1940s [@Hahn1949;@Drain1949], and the first [T_1](wiki:Spin–lattice_relaxation) map was acquired using a saturation-recovery technique (90° as a preparation pulse instead of 180°) by [@Pykett1978]. Some distinct advantages of inversion recovery are its large dynamic range of signal change and an insensitivity to pulse sequence parameter imperfections [@Stikov2015]. Despite its proven robustness at measuring [T_1](wiki:Spin–lattice_relaxation), inversion recovery is scarcely used in practice, because conventional implementations require repetition times (TRs) on the order of 2 to 5 [T_1](wiki:Spin–lattice_relaxation) [@Steen1994], making it challenging to acquire whole-organ [T_1](wiki:Spin–lattice_relaxation) maps in a clinically feasible time. Nonetheless, it is continuously used as a reference measurement during the development of new techniques, or when comparing different [T_1](wiki:Spin–lattice_relaxation) mapping techniques, and several variations of the inversion recovery technique have been developed, making it practical for some applications [@Messroghli2004;@Piechnik2010].

```{figure} img/ir_pulsesequences.svg
:label: irFig1
:enumerator: 1.1  
Pulse sequence of an inversion recovery experiment.
```