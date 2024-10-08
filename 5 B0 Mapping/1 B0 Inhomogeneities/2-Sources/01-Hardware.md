---
title: Hardware
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

Although scanner manufacturers try to make magnets that are as homogeneous as possible, they are far from perfect. The manufacturing process requires many kilometers of superconducting wire to be wound to create the main magnet and can lead to inhomogeneities due to manufacturing tolerances. Moreover, large metal objects near the scanner can interact with the field created by the scanner and impact the resulting field within the scanner. This is a more important problem with higher field strength. During the installation process, the empty bore is homogenized in a process called passive shimming. During this process, small ferromagnetic pieces are introduced in the scanner at optimized locations to produce a field that counteracts the inhomogeneities. Hardware inhomogeneities are relatively small (less than 1 ppm [3]).

Specialized equipment such as field probes [4] (e.g.: Skope Magnetic Resonance Technologies, LLC) can be used to evaluate the _B_{sub}`0` field of the scanner while it is being installed. This equipment can also be used after installation because it is more precise than _B_{sub}`0` field maps and offers better field temporal resolution, allowing the ability to observe [eddy currents](https://en.wikipedia.org/wiki/Eddy_current) created from gradient switching.

During an imaging session, heating of the different components and of the main magnet can lead to temperature-dependent changes in the _B_{sub}`0` field. These can be observed by a frequency drift in the field. As an example, a ~0.4Hz/min has been observed in MRS at 3T but depends on multiple factors [5]. Modern scanners usually have systems in place to evaluate and correct for this drift [6].