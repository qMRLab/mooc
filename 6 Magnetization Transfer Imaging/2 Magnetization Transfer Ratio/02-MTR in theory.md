---
title: MTR in theory
subtitle: Magnetization Transfer Ratio
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

:::{attention}
:class: attentionDraft
:name: attentionDraft
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::


The full mathematical description of the magnetization transfer two-pool exchange model was explained in Chapter 6.1 that focuses on qMT. Although it’s these same equations that explain the signal differences between the two images acquired used to calculate MTR, in this section we’ll present a more conceptual explanation of the MT exchange process.

In its most basic form, MT is modeled as an exchange process between two “pools” of protons, those from “mobile” protons (eg, hydrogen in liquid water) named the “free” pool (those that are directly measured with conventional MRI), and those from “restricted” protons (i.e. macromolecules) named the “restricted” pool (these cannot be measured directly with conventional MRI). Macromolecular hydrogen cannot be measured directly because the restricted movement creates a more static local electromagnetic environment that doesn’t average out, and this results in a transverse relaxation T2r (signal decay) that is too short to provide measurable signal (T2r ~ μs << feasible TE). Another consequence of this short signal decay time is a broadening of the absorption lineshape in the frequency domain (eg. the range of “resonant” frequencies of that pool of protons). This is a known property of the Fourier Transform, and the phenomenon is isomorphic to the quantum mechanics uncertainty principle; as Δx⋅Δp ≥ constant in quantum mechanics means that if Δx increases Δp will decrease, we observe a similar relationship approximated to T2⋅FWHM of the frequencies = constant such that if T2 decreases, the FWHM of the frequencies will increase. If T2 is very very short (such as the case for macromolecules), the range of resonant frequencies will be very wide. MT leverages this property by selectively exciting restricted protons far from the mobile proton resonance frequency (applying a pulse off-resonance), but where the energy will be absorbed by some of the protons in the restricted pool. This is the initial preparation of the MT experiment that triggers the conditions needed for cross-relaxation between the unobservable molecules (restricted pool) and observable protons (free pool).

Conventionally, the two-pool exchange model is explained conceptually as a process of magnetization exchange, which is also how it’s described mathematically using the Bloch-McConnel equations. However, this conceptual model can be challenging to understand, particularly for people with physics backgrounds, because unlike energy and momentum, the total magnetization in a voxel is not a conserved physical property. This can be seen simply by observing the evolution of the total magnetization vector after an excitation pulse; the total magnetization vector is (mostly) conserved during the RF pulse, but then decays quickly to near 0 due to T2 relaxation, and takes a long time to grow back to M0 from T1 relaxation. The vector is not constant. So, if magnetization is not a conserved property, how do we know if and how much of it is being exchanged?

As explained in more detail in Appendix A, an MT experiment involves the conservation and transfer of energy between spin populations. The off-resonance RF pulse introduces extra energy into the restricted pool of protons, and the relaxation back to thermal equilibrium occurs through spin-lattice relaxation, where the "lattice" includes nearby free-pool protons. This energy exchange results in a reduction of net magnetization in the free pool and a corresponding decrease in observable MR signal. This process underlies the contrast observed in MT imaging, which reflects differences in tissue microstructure and composition.

Now that we have a better grasp of the magnetization exchange process, we can see how this applies for MTR. In MTR, we acquire one image with MT saturation (low signal where there is high macromolecular density), and one image without MT saturation (higher relative signal where there are macromolecules). The MTR signal is then simply calculated as a normalized difference in percentage, that is:


```{math}
:label: mtrEq1
:enumerator:6.1
\begin{equation}

\text{MTR} \left( \text{\%} \right) = \frac{S_{0}-S_{MT}}{S_{0}} \cdot 100

\end{equation}
```

What does this calculated MTR value mean? MTR is the reduction in the steady-state signal resulting from an MT-sensitizing pulse and the ensuing MT exchange that occurs. The higher the density of macromolecular content there is, the more reduction in MT-weighted signal will occur, resulting in a higher MTR value. Typically, MTR values in healthy white matter are higher than in grey matter, and MTR values where there is myelin loss are smaller relative to healthy tissue.
