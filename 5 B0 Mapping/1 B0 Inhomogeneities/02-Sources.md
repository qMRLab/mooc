---
title: Sources
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

### Hardware

Although scanner manufacturers try to make magnets that are as homogeneous as possible, they are not perfect. The manufacturing process requires many kilometers of superconducting wire to be wound to create the main magnet and can lead to inhomogeneities due to manufacturing tolerances. Moreover, large metal objects near the scanner can interact with the field created by the scanner and impact the resulting field within the scanner. This is a more important problem with higher field strength. During the installation process, the empty bore is homogenized in a process called passive shimming. During this process, small ferromagnetic pieces are introduced in the scanner at optimized locations to produce a field that counteracts the inhomogeneities. Hardware inhomogeneities are relatively small at less than 1 ppm [3].

Specialized equipment such as field probes [4] (e.g.: Skope Magnetic Resonance Technologies, LLC) can be used to evaluate the B0 field of the scanner while it is being installed. This equipment can also be used after installation because it can be more precise than B0 field maps and offers much better field temporal resolution, allowing the ability to observe eddy currents created from gradient switching.

During an imaging session, heating of the different components and of the main magnet can lead to temperature-dependent changes in the B0 field. These can be observed by a frequency drift in the field. As an example, a ~0.4Hz/min has been observed in MRS at 3T but depends on multiple factors [5]. Modern scanners usually have systems in place to evaluate and correct for this drift [6].

### Magnetic Susceptibility

Materials have a property called magnetic susceptibility () that reflects how they distort and interact with magnetic fields [7]. The change in magnetic field Bz (the subscript “z” is shown to make it explicit that we are referring to the component parallel to the B0 field) is proportional to the magnetic susceptibility value, the magnetic field strength, and can be affected by the geometry and location of the tissues. It can be modeled as a convolution of the change in magnetic susceptibility  with the component parallel to the magnetic field induced by a unit magnetic dipole (d=(3cos2()-1)4r3) in spherical coordinates where r is the position vector and  is the angle with B0 [8].

Bz(r)=B0((r)d(r))

When a subject is introduced in the scanner, it interacts with the B0 field and distorts it. Therefore, a perfectly homogeneous field in an empty bore will usually have an inhomogeneous B0 field once a patient is introduced. This is the reason why active shimming is required when a patient is introduced in the scanner. Although these inhomogeneities happen everywhere in the body, stronger field variations occur at the boundaries of strong susceptibility differences such as air (slightly paramagnetic: +) and water/tissue (diamagnetic: -). 

The following figure shows different susceptibility distributions (for a homogeneous cylinder within an otherwise homogeneous cylinder within a homogeneous backgrounds distribution, and a brain) and the corresponding B0 field map simulated at 7 T. In the brain, the B0 field inhomogeneities are dominated by air-tissue boundaries. On the right-hand panel, the slow varying spatial variations (also called background field) were removed to show the local variations.

```{figure} img/fig2.png
:label: b0intFig2

Cylinder (top) and brain (bottom) of susceptibility distributions (left), simulated B0 field map (middle) and the B0 field map with the background field removed (right). An in-vivo susceptibility map was used for the brain and was surrounded by a bone interface, a tissue interface and the rest of the FOV was filled with air. Note that this simplistic representation still shows the field map being dominated by air-tissue interfaces even though the spatial characteristics of the field are not perfectly representative of reality. This dataset was introduced in this publication [9] and is publicly available [10], [11]. An in-vivo field map can be seen in section 4.2.
```




