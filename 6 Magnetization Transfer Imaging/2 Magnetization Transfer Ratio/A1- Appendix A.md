---
title: Appendix A
subtitle: Magnetization Transfer Ratio
date: 2024-10-07
label: mtrAppendixA
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

In reality, what *is* conserved and transferred during an MT experiment, is energy, and this energy is exhibited as non-zero magnetization under the correct conditions. [](#mtrFig7) illustrates this. As is known from MR theory, the net magnetization of a population of spins at thermal equilibrium is a result of an excess (on the order of 10 ppm at 3T) of spins in the low energy level (spins aligned with the magnetic field) relative to the high energy level (spins anti-parallel to the magnetic field), with the energy level splitting (a) being due the nuclear Zeeman effect and for the free pool, has an difference E of {math}`\gamma h B_{0}` (i.e. the energy corresponding to the resonance frequency, {math}`h` being the Planck constant). By applying an off-resonance frequency RF pulse (Δ), we can selectively transfer energy from the electromagnetic field to the restricted pool system such that some spins will jump from the low energy level to the high energy level (RF pumping, b), leaving the free pool undisturbed. This excess in energy that is now in the restricted pool spin population will then redistribute itself through several physical processes to reach a new system-wide equilibrium, such as energy transfer into heat through collisions, or spin exchange free pool spins through dipolar coupling or chemical exchange ([Figure 6A-1a](#mtrFig7)). This energy transferred to the free pool is represented by a slight reduction in the net magnetization of the free pool, which manifests as a decrease in the observed MR signal. This signal reduction occurs because the energy absorbed by the restricted pool (via the off-resonance RF pulse) results in fewer spins in the low-energy state in the free pool, thus reducing its longitudinal magnetization. Over time, the system will reach a new equilibrium state, where the magnetization of both the restricted and free pools reflects this redistributed energy.

In [Figure 6A-1c](#mtrFig7) (right), the new equilibrium state of the magnetization is shown, highlighting how the energy transfer process affects the magnetization of the free pool and, consequently, the overall MR signal. This phenomenon is central to magnetization transfer (MT) imaging, where the contrast in images is derived from the differences in energy transfer between different tissue types. The degree of MT contrast is influenced by factors such as the efficiency of energy transfer processes and the specific properties of the tissue, including the concentration and exchange rates of the restricted pool.

Ultimately, the conservation of energy and its transfer between different spin populations is what underlies the observable effects in MT imaging, allowing it to be used as a tool to probe tissue microstructure and composition.

```{figure} img/energylevels.png
:label: mtrFig7
:enumerator: 6A-1  
Thesis figure
```
