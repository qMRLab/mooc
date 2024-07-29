---
title: Issues with unwrapping
subtitle: Phase Unwrapping
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


### Phase unwrapping ambiguity

There is ambiguity when unwrapping since many solutions are possible and a choice needs to be made as to which one is the true signal (see Figure 3). If the wrong one is selected, this creates a 2n offset from the true phase. When unwrapping a single phase volume, an educated guess can be made by calculating the average phase in the ROI and expect that to be close to 0 (we assume here that a good frequency shim was first performed in the ROI). n is chosen and the 2n offset is removed from the unwrapped phase map such that the average phase in the ROI is close to 0. Note that this is not a perfectly robust solution because phase is also affected by other factors such as the receive coil, RF pulse and eddy currents which could cause the average phase offset to deviate from 0. Fortunately, phase difference images are more reliably unwrapped since some of the phase offsets are constant in both phase images and are removed  when performing the phase difference resulting in a phase offset closer to 0. 

If multiple echoes are acquired, a combination of spatial and temporal unwrapping may be necessary. Multi-echo field mapping is discussed in the following section. Note that with appropriate selections of the echo times, the 2n offset ambiguity can be remedied. 

### Problematic phase map properties

Phase maps sometimes have wraps that are not possible to unwrap with traditional phase unwrapping techniques. One example is shown in the following figure. Phase singularities, also called poles or open ended fringe lines, hinder the abilities of unwrappers to get an accurate unwrapped phase. As can be seen in the following figure, there are two points where the phase is ambiguous. When unwrapping spatially, if two points are selected arbitrarily in the ROI, one would expect that all paths possible to link both points to cross the same number of wraps (- to  [black to white] resulting in +1 wrap while  to - [white to black] would result -1 wrap). However, phase singularities create paths that have a different number of wrap crossings, resulting in ambiguous phase values. Figure 5 is used as an example to illustrate the above statements. When unwrapping from point A to B, the left path would expect the phase to go from 34 to -34, however, the right path crosses a wrap and would therefore expect to go from 34 to -34+2. Phase singularities are usually a result of a poor coil combination process. There are some techniques to mitigate the issue, but the main solution is to correctly combine the coil maps to avoid the singularities altogether.

```{figure} img/plot5.png
:label: b0PunwFig5

Synthetic phase data showing two phase singularities. The red paths show two different paths a region growing algorithm could use to go from point A to point B. The left path does not cross a phase wrap whereas the right path crosses a phase wrap. This yields an ambiguous phase result. 
```




