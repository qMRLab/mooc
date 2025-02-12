---
title: Magnetic susceptibility
subtitle: Sources of B0 Inhomogeneities
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

Materials have a property called magnetic susceptibility () that reflects their ability to become magnetized in response to an external magnetic field [@Schenck1996-gu]. The change in magnetic field Bz (the subscript “z” is shown to make it explicit that we are referring to the component parallel to the _B_{sub}`0` field) is proportional to the magnetic susceptibility value, the magnetic field strength, and can be affected by the geometry and location of the tissues. It can be modeled as a convolution of the difference in magnetic susceptibility  with the component parallel to the magnetic field induced by a unit magnetic dipole ({math}`d=\frac{\left( 3\text{cos}^{2}\left( \theta \right)-1 \right)}{4\pi\left| \textbf{r} \right|^{3}}`) in spherical coordinates where {math}` \textbf{r} ` is the position vector and  is the angle with _B_{sub}`0` [@De_Rochefort2008-tb]. 

```{math}
:label: b0Eq2
:enumerator:5.2
\begin{equation}
\Delta B_{z}\left( \textbf{r} \right)=B_{0}\left( \Delta\chi \left( \textbf{r} \right) \otimes  d \left( \textbf{r} \right)\right) 
\end{equation}
```

The dipole kernel (d) is illustrated in [](#b0Plot2) along with the dipole kernel (D) in the k-space domain often used in QSM.

:::{figure} #b0Fig2jn
:label: b0Plot2
:enumerator: 5.2
Dipole kernel (d) in the image domain as well as in the k-space domain (D).
:::

When a subject is introduced in the scanner, it interacts with the _B_{sub}`0` field and distorts it. Therefore, a perfectly homogeneous field in an empty bore will usually have an inhomogeneous _B_{sub}`0` field once a patient is introduced. This is the reason why active shimming is required when a patient is introduced in the scanner. Although these inhomogeneities happen everywhere in the body, stronger field variations occur at the boundaries of strong susceptibility differences such as air (slightly paramagnetic: {math}`+\chi`) and water/tissue (diamagnetic: {math}`-\chi`). 

The following figure shows different susceptibility distributions in ppm for a homogeneous cylinder within a larger homogeneous cylinder placed in a homogeneous background (top) and a brain (bottom). The corresponding _B_{sub}`0` field maps are simulated at 7 T and shown in [](#b0Plot3). In the brain, the _B_{sub}`0` field inhomogeneities are dominated by air-tissue boundaries. On the right-hand panel, the slow varying spatial variations (also called background field) were removed to show the local field variations.

:::{figure} #b0Fig3jn
:label: b0Plot3
:enumerator: 5.3
Cylinder (top) and brain (bottom) of susceptibility distributions (left), simulated _B_{sub}`0` field map (middle) and the _B_{sub}`0` field map with the background field removed (right). An in-vivo susceptibility map was used for the brain and was surrounded with air. Note that this simplistic representation still shows the field map being dominated by air-tissue interfaces even though the spatial characteristics of the field are not perfectly representative of reality. An in-vivo field map can be seen in [](#b0Plot9).
:::

