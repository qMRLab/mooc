---
title: Signal Modelling
subtitle: 2-echo B0 mapping
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

In the ideal case, spins rotate at the Larmor frequency, shown in blue in the following figure. In the presence of field inhomogeneities, the frequency of the spins (shown in red) is different and is proportional to the field inhomogeneities. Both the laboratory and rotating frame of reference are shown. Importantly, note that the Larmor frequency phase appears stationary in the rotating frame of reference. 

```{figure} img/plot1.png
:label: b0demFig1

Two spins rotating (one at the Larmor frequency (f0), one at a lower frequency). A view of the spins in the transverse plane (left) and of their phase (right) is shown. A dropdown is available to select between the laboratory frame and the rotating frame of reference.
```

The phase () evolution follows the following equation (not considering transient effects such as eddy currents) in the rotating frame of reference.

```{figure} img/eq1.png
:label: b0demEq1
```

Where x,y,z are the coordinate locations, t is time,  is the gyromagnetic ratio, B0 is the B0 field offset (T) and 0 is an initial constant phase offset (e.g.: coil induced, material induced through local conductivity/permittivity, and other). We can observe phase evolution through time in the following figure by looking at phase data acquired in the brain at progressively longer echo times. The phase at a single voxel changes linearly (not considering transient effects). Note that the sharp variations forming vertical lines in the previous figure are called phase wraps and occur because the phase is defined over - to . Phase-wrapping effects will be discussed in more detail in the following chapter. Wraps can also occur spatially as sharp variations as seen in the following figure. Note that the longer the echo times, the more there are wraps.

```{figure} img/plot2.png
:label: b0demFig2

Phase shown at different echo times. The slider can be used to show the phase that would be acquired at different echo times.
```

Since phase changes linearly with time (t) and with the field offset (B0), it is possible to acquire two phase images at two different echo times and compute B0(x,y,z).

```{figure} img/eq2.png
:label: b0demEq2
```

Where TE1 and TE2 are the echo times,  TE is TE2- TE1. To compute the phase offset , phase subtraction is necessary. To do so, the complex difference can be used to keep the phase between - to , although other phase difference techniques are also possible.

```{figure} img/eq3.png
:label: b0demEq3
```

Where ∠ is the phase operator. In some sequences, the phase images are exported as a single phase difference image (x,y,z, TE).

### Single species/frequency material

To build intuition about field maps, let us imagine a sample at a constant offset frequency from f0 . Note that this simplistic representation of the field typically does not occur due to how the susceptibilities of the region to image interact with one another to create the B0 field offset (see Chapter 4.1), but is shown as such for learning purposes. The sample is shown as the circle in the following figure. Since the frequency is not at the Larmor frequency, phase accumulation is observed at the different echo times and a phase difference map can be computed. The B0 field map is then calculated using the echo times. Note that if TE is too long, the phase could make more than a half revolution between the two echo times resulting in an erroneous B0 field estimation. In practice, such a field (constant offset) could easily be corrected by adjusting the transmit and receive frequency of the scanner.

```{figure} img/plot3.png
:label: b0demFig3

Different images of a homogeneous cylinder field offset showing a simulated phase at two echo times, the calculated phase difference image and the computed B0 field map.
```

### Multiple species

A brain dataset is used to show a concrete example of a field map that could be acquired in practice. The following figure shows two phase images where phase accumulation is shown due to frequency offsets that vary spatially. As mentioned previously, phase wraps are visible where phase transitions from - to  and will be discussed in more detail in the next chapter. The phase difference and B0 field maps are also shown. Note that taking the phase difference eliminates the wraps in this example, however, there could be residual wraps when the field is more inhomogeneous. 

```{figure} img/plot4.png
:label: b0demFig4

Two phase images, a phase difference and a B0 field map. Phase wraps are visible where the phase transitions from - to 
```


