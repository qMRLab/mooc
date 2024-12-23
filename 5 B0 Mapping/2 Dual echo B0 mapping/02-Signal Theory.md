---
title: Signal Theory
subtitle: Dual echo B0 mapping
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

In the ideal case, spins rotate at the [Larmor frequency](https://en.wikipedia.org/wiki/Larmor_precession), shown in blue in [](#b0Plot6). In the presence of field inhomogeneities, the frequency of the spins (shown in red) is different and is proportional to the field inhomogeneities. Both the laboratory and rotating frame of reference are shown. Importantly, note that the [Larmor frequency](https://en.wikipedia.org/wiki/Larmor_precession) phase appears stationary in the rotating frame of reference. 

:::{figure} #b0Fig6jn
:label: b0Plot6
:enumerator: 5.6
Two spins rotating (one at the Larmor frequency ({math}`f_{0}`), one at a lower frequency). A view of the spins in the transverse plane (left) and of their phase (right) is shown. A dropdown is available to select between the laboratory frame and the rotating frame of reference.
:::

The phase ({math}`\phi`) evolution follows the following equation (not considering transient effects such as [eddy currents](https://en.wikipedia.org/wiki/Eddy_current)) in the rotating frame of reference.

```{math}
:label: b0Eq3
:enumerator:5.3
\begin{equation}
\phi\left(\textbf{r},t \right) = \phi_{0}\left( \textbf{r} \right)+\gamma\Delta B_{0}\left( \textbf{r} \right)\cdot t
\end{equation}
```

where x,y,z are the coordinate locations, t is time,  is the gyromagnetic ratio, _B_{sub}`0` is the _B_{sub}`0` field offset (Tesla) and {math}`\phi_{0}` is an initial constant phase offset (e.g.: coil induced, material induced through local conductivity/permittivity). We can observe phase evolution through time in [](#b0Plot7) by looking at phase data acquired in the brain at progressively longer echo times. The phase at a single voxel changes linearly (not considering transient effects). Note that the sharp variations forming vertical lines in the previous figure are called phase wraps and occur because the phase is defined over - to . Phase-wrapping effects will be discussed in more detail in the following section. Wraps can also occur spatially as sharp variations as seen in the following figure. Note that the longer the echo times, the more wraps there are.

:::{figure} #b0Fig7jn
:label: b0Plot7
:enumerator: 5.7
Phase shown at different echo times. The slider can be used to show the phase that would be acquired at different echo times.
:::

MRI manufacturers do not all output phase data by default. It should be possible to toggle the output of phase data on all MRI systems. It can also be computed from real/imaginary data using [](#b0Eq4).

```{math}
:label: b0Eq4
:enumerator:5.4
\begin{equation}
\angle \left( \text{real}+i\text{ imaginary} \right) =\text{arctan2}\left( \text{imaginary, real} \right)
\end{equation}
```

where {math}`\angle` is the phase operator. 

As phase changes linearly with time (t) and with the field offset (_B_{sub}`0`), it is possible to acquire two phase images at two different echo times and compute _B_{sub}`0`(x,y,z).


```{math}
:label: b0Eq5
:enumerator:5.5
\begin{equation}
\Delta B_{0}\left( \textbf{r} \right)=\frac{\phi\left( \textbf{r}, \text{TE}_{2} \right)-\phi\left( \textbf{r}, \text{TE}_{1} \right)}{\gamma\cdot \left( \text{TE}_{2}-\text{TE}_{1}  \right)}=\frac{\Delta\phi\left( \textbf{r}\text{,}\Delta \text{TE}\right)}{\gamma\Delta\text{TE}}
\end{equation}
```

where TE{sub}`1` and TE{sub}`2` are the echo times, and  TE = TE{sub}`2`- TE{sub}`1`. To compute the phase offset {math}`\Delta \phi`, phase subtraction is necessary. The complex difference can be used to keep the phase between {math}`-\pi` to {math}`+\pi`, although other phase difference techniques are also possible.

```{math}
:label: b0Eq6
:enumerator:5.6
\begin{equation}
\Delta\phi\left( \textbf{r},\Delta\text{TE} \right)=\angle \left( \text{e}^{i\phi\left( \textbf{r}\text{,TE}_{2} \right)} \right)\cdot \left( \text{e}^{-i\phi\left( \textbf{r}\text{,TE}_{1} \right)} \right)
\end{equation}
```

In some sequences, the phase images are exported as a single phase difference image {math}`\Delta \phi \left( x,y,z, \Delta \text{TE} \right)`.
