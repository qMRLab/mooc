---
title: Types of unwrapping
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

Phase unwrapping stems from the fact that phase can only be measured over the range of - to . If the measured phase crosses from - to , a “wrap” is observed as a 2 jump where in reality, the phase was smoothly varying. In the context of MRI, phase wrapping occurs when measuring phase data that varies by more than 2 within the region of interest. In reality, the number of rotations that a spin can have done is not limited to a single revolution. To accurately recover the true phase information, unwrapping is necessary.

There are two main families of unwrapping techniques. Temporal unwrapping techniques use temporal information from different phase time points and the assumption that the difference between time points is smoothly varying (offset less than ) to correct for phase jumps that can occur in time. Spatial unwrapping uses spatial information and relies on the fact that neighboring voxels should be smoothly varying to identify and correct for 2 jumps. 

### Temporal Unwrapping

Temporal unwrapping uses multiple time points (>=2) to unwrap the image. By acquiring phase data that vary by at most - to , the difference between 2 echoes (using complex difference) yields an unwrapped image free of wraps. 

If we assume a maximum field offset f0,max of 1 ppm at 3T (~127 MHz), we can calculate a maximum field offset (f0,max) of 1 µT or 127 Hz. The Nyquist criteria can be used to calculate the maximum echo time difference (TE) required to satisfy the no-wrapping requirement in the phase difference image (TE=1 2f0,max). In this case, the maximum TE is 3.91 ms. The echo spacing is B0 dependent since higher field offsets are observed at higher field strengths.

If a longer TE is selected or if the inhomogeneities are bigger than originally anticipated in some parts of the image, the phase difference image could also have wraps, and spatial unwrapping would be necessary.

Temporal unwrapping can also be performed without phase difference. The following figure shows the phase of a voxel acquired at four echo times in blue. Note that the last echo time is wrapped (i.e.: the phase rotated by more than 2 and “wrapped” to the positive side). With the assumption that phase does not vary by more than 2, we can unwrap the phase by, in this case, subtracting 2 from the acquired phase to recover the true phase (in red). A linear fit is shown in green. Note that the slope would represent the field map value.


```{figure} img/plot1.png
:label: b0PunwFig1

Four phase voxels acquired at different echo times (blue). The phase is unwrapped temporally and plotted which, in this case, changes the phase of the 4th echo (red). A linear fit is also shown (green).
```

### Spatial Unwrapping

Spatial unwrapping uses the spatial characteristics of images to unwrap the data. The wrapped image should vary smoothly. It typically uses region region-growing algorithm which identifies and rectifies where there are offsets of  greater than 2. An example of a 1D signal of a linearly evolving phase is shown below to illustrate the phase that we would want to recover from the wrapped phase that would be acquired through space.

```{figure} img/plot2.png
:label: b0PunwFig2

1D example of a wrapped phase (blue) with the true phase (red)
```

A more complex example is shown below where phase varies spatially in a non-linear fashion. Different phase solutions can be expected when unwrapping is performed that vary by 2n. Its cause and potential solution is described in the following section.



```{figure} img/plot3.png
:label: b0PunwFig3

A more complex example of a signal wrapped and unwrapped. Note that three possibilities are possible when unwrapping depending on which part of the signal is selected to be the true phase. The slider can be moved left to right to show the wrapped and unwrapped data.
```

A common issue with spatial unwrapping which stems from region growing algorithms is that the region of interest needs to be defined in a single region or there can be a 2n offset between regions. Moreover, region growing algorithms usually require thresholding so that noise is not unwrapped.

```{figure} img/plot4.png
:label: b0PunwFig4

2D wrapped and unwrapped simulated data.
```

A 2D example of wrapped and unwrapped simulated data is shown. The concept can be expanded to 3D data as well. Note that more wraps result in higher field inhomogeneity.

