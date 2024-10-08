---
title: Problematic phase map properties
subtitle: Phase Unwrapping
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
Phase maps sometimes have wraps that are not possible to unwrap with traditional phase unwrapping techniques. One example is shown in [](#b0Plot14). Phase singularities, also called poles or open ended fringe lines, hinder the abilities of unwrappers to get an accurate unwrapped phase. As can be seen in the following figure, there are two points where the phase is ambiguous. When unwrapping spatially, if two points are selected arbitrarily in the ROI, one would expect that all possible paths linking both points to cross the same number of wraps. Otherwise, crossing a different number of wraps results in ambiguous phase values. Counting wraps can be done by counting the sharp phase transitions where - to  (black to white) results in +1 wrap and  to - (white to black) results -1 wrap. However, phase singularities create paths that have a different number of wrap crossings, resulting in ambiguous phase values. [](#b0Plot14) is used as an example to illustrate the above statements. When unwrapping from point A to B, the left path crosses no wraps and would therefore expect the phase to go from 34 to -34, however, the right path crosses a wrap and would therefore expect to go from 34 to -34+2. This is problematic as the phase becomes ambiguous. Phase singularities are usually a result of a poor coil combination process. There are some techniques to mitigate the issue, but the main solution is to correctly combine the coil maps to avoid the singularities altogether.


:::{figure} #fig5p14cell
:label: b0Plot14
:enumerator: 5.14
Synthetic phase data showing two phase singularities. The red paths show two different paths a region growing algorithm could use to go from point A to point B. The left path does not cross a phase wrap whereas the right path crosses a phase wrap. This yields an ambiguous phase result. 
:::
