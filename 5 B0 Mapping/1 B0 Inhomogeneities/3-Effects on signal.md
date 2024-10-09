---
title: Effects on signal
subtitle: B0 Inhomogeneities
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
To excite the spins in the transverse plane, a carrier frequency tuned to the [Larmor frequency](https://en.wikipedia.org/wiki/Larmor_precession) is used by the transmit coil. If the frequency of the spins does not match the excitation frequency, it results in a suboptimal tip of the spins in the transverse plane. If the frequency of the spins varies across the ROI, the flip angle is affected differently across the image [@Wang2006-hh].

When a signal is acquired, it is demodulated to remove the carrier frequency ([Larmor frequency](https://en.wikipedia.org/wiki/Larmor_precession)) from the signal. An example of a FID is shown in [](#b0Plot4). The number of species represent the number of isochromats in the simulation. An isochromat represents an ensemble of spins with the same properties rotating at the same [Larmor frequency](https://en.wikipedia.org/wiki/Larmor_precession). For a single isochromat, if the acquired signal and demodulation frequency perfectly match, the _T_{sub}`2` signal can be recovered. If the carrier frequency is different from the expected frequency (such as when there are inhomogeneities), the demodulation introduces low-frequency variations. A non-homogeneous sample is also shown featuring many isochromats. Alternatively, a homogeneous sample with a non-homogeneous _B_{sub}`0` field could be simulated as well and would have a similar shape as the one with multiple species. In that case, the difference from the _T_{sub}`2` curve would reflect _T_{sub}`2`{sup}`*` ({math}`1/T_{2}^{*}=1/T_{2}+1/T_{2}^{'}`) effects. During the relaxation process, spins precessing at different frequencies, due to the presence  of _B_{sub}`0` inhomogeneities, will give rise to phase offsets between the spins within a voxel. This intravoxel phase dispersion leads to signal decay. 


:::{figure} #fig5p4cell
:label: b0Plot4
:enumerator: 5.4
FID curves with signal demodulation at [Larmor frequency](https://en.wikipedia.org/wiki/Larmor_precession) (single species), at two different frequencies ([Larmor](https://en.wikipedia.org/wiki/Larmor_precession) and offset frequency, two species) and at multiple frequencies ([Larmor frequency](https://en.wikipedia.org/wiki/Larmor_precession) and many other offset frequencies, multiple species). The resulting shape of the graphs depends on the relative amplitudes and frequencies.
:::

_B_{sub}`0` inhomogeneities can lead to distorted k-space trajectories during the readout gradient. This effect is worse during further k-space traversal due to the compounding of the errors. When inhomogeneities are present, the frequencies of the spins are altered. The one-to-one relationship between frequency and spatial location (required to obtain accurate spatial correspondence) is broken. This leads to geometric distortions. [](#b0Plot5) shows an animation of the filing of k-space of an EPI sequence using bi-polar readouts. A theoretical trajectory is shown as well as a trajectory where a constant parasite gradient in the phase encoding direction has been added. One can observe the trajectory differences.

:::{figure} #fig5p5cell
:label: b0Plot5
:enumerator: 5.5
 K-space trajectory of an EPI sequence using bi-polar readout gradients (blue). A constant gradient in the positive phase encoding direction is applied to simulate inhomogeneities (red). The trajectory with the parasite gradient deviates from the theoretical trajectory. All encoding gradients (G) are instantaneously applied at 40 mT/m. A parasit G{sub}`p,phase` of 0.1mT/m (G/G{sub}`p,phase`=0.25%) is added to simulate inhomogeneities. 64 encoding steps are used in both the frequency and phase encoding directions but only one in five phase encoding lines is shown for visualization purposes.
:::

Radiofrequency (RF) pulses can also be affected by an inhomogeneous _B_{sub}`0` field. During slice selection for example, the RF pulse excites a range of frequencies that can be mapped to spatial locations by applying a linearly evolving magnetic field along the slice direction. For a perfectly transverse acquisition, the resulting _B_{sub}`0` field can be expressed by ({math}`G_{z}z+ B_{0}`). If _B_{sub}`0` inhomogeneities are present ({math}`G_{z}z+ B_{0} +\Delta B_{0} (x,y,z)`), the excited slice profile can be distorted or offset from the expected location. When _B_{sub}`0` inhomogeneities are very inhomogeneous, they can also disrupt frequency-selective RF pulses such as fat saturation pulses. There are also other effects such as ringing artifacts, blurring, and ghosting that can occur.

All of these effects can be minimized with _B_{sub}`0` shimming. To do so, a map of the _B_{sub}`0` field can be acquired. In addition to shimming, _B_{sub}`0` mapping is important for other techniques that will be discussed later. The next section will show how to perform _B_{sub}`0` mapping using two echoes.