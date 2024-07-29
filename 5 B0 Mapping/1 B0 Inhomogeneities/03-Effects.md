---
title: Effects
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

### Effects on signal

To excite the spins in the transverse plane, a carrier frequency tuned at the Larmor frequency is used by the transmit coil. If the frequency of the spins does not match the excitation frequency, it results in a suboptimal tip of the spins in the transverse plane. If the frequency of the spins varies across the ROI, the flip angle is affected differently across the image [12].

When a signal is acquired, it is demodulated to remove the carrier frequency (Larmor frequency) from the signal. An example of a FID is shown in the following figure. If the acquired signal and demodulation frequency perfectly match, the T2 signal can be recovered. If the carrier frequency is different from the expected frequency (such as when there are inhomogeneities), the demodulation introduces low-frequency variations. A non-homogeneous sample is also shown featuring many isochromats. Alternatively, a homogeneous sample with a non-homogeneous B0 field could be simulated as well and would have a similar shape as the one with multiple species. In that case, the difference from the T2 curve would reflect T2' (1T2*=1T2+1T2') effects. During the relaxation process, spins precessing at different frequencies, due to the presence  of B0 inhomogeneities, will give rise to phase offsets between the spins within a voxel. This intravoxel phase dispersion leads to signal decay. 

FID curves with signal demodulation at Larmor frequency (single species), at two different frequencies (Larmor and offset frequency, two species) and at multiple frequencies (Larmor frequency and many other offset frequencies, multiple species). The resulting shape of the graphs depends on the relative amplitudes and frequencies.

```{figure} img/fig3.png
:label: b0intFig3

FID curves with signal demodulation at Larmor frequency (single species), at two different frequencies (Larmor and offset frequency, two species) and at multiple frequencies (Larmor frequency and many other offset frequencies, multiple species). The resulting shape of the graphs depends on the relative amplitudes and frequencies.
```

B0 inhomogeneities can lead to distorted k-space trajectories during the readout gradient. This effect is worse during further k-space traversal due to the compounding of the errors. When inhomogeneities are present, the frequency of the spins are altered. The one-to-one relationship between frequency and spatial location required to obtain accurate spatial correspondence is broken. This leads to geometric distortions. The following figure shows an animation of the filing of k-space of an EPI sequence using bi-polar readouts. A theoretical trajectory is shown as well as a trajectory where a constant gradient in the phase encoding direction has been added. One can observe the difference in trajectory.

```{figure} img/fig4.png
:label: b0intFig4

K-space trajectory of an EPI sequence using bi-polar readout gradients (blue). A constant gradient in the positive phase encoding direction is applied to simulate inhomogeneities (red). The trajectory with the parasite gradient deviates from the theoretical trajectory. All encoding gradients (G) are instantaneously applied at 40 mT/m. A parasit Gp, phase of 0.1mT/m (G/Gp, phase=0.25%) is added to simulate inhomogeneities. 64 encoding steps are used in both the frequency and phase encoding directions but only one in five phase encoding line is performed for visualization purposes.
```

Radiofrequency (RF) pulses can also be affected by an inhomogeneous B0 field. During slice selection for example, the RF pulse excites a range of frequencies that can be mapped to spatial locations by applying a linearly evolving magnetic field along the slice direction. For a perfectly transverse acquisition, the resulting B0 field can be expressed by (Gzz+ B0). If B0 inhomogeneities are present (Gzz+ B0 + B0 (X, Y, Z)), the excited slice profile can be distorted or offset from the expected location. When B0 inhomogeneities are very inhomogeneous, they can also disrupt frequency-selective RF pulses such as fat saturation pulses. There are also other effects such as ringing artifacts, blurring, and ghosting that can occur.

All of these effects can be minimized with B0 shimming. To do so, a map of the B0 field can be acquired. Along with shimming, B0 mapping is important for other techniques. B0 mapping using two echoes is the subject of the next section.