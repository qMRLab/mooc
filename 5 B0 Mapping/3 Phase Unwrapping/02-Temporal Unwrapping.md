---
title: Temporal Unwrapping
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


Temporal unwrapping uses multiple time points (>=2) to unwrap the image. By acquiring phase data that vary by at most {math}`-\pi` to {math}`+\pi`, the difference between 2 echoes (using complex difference) yields an unwrapped image free of wraps. Eq. 1 describes the field offset ({math}`\Delta f_{0}`) experienced during {math}`\Delta`TE in the presence of field inhomogeneities.


```{math}
:label: b0Eq8
:enumerator:5.8
\begin{equation}
\Delta f_{0}\left( \textbf{r} \right)=\frac{\gamma}{2\pi}\Delta B_{0}\left( \textbf{r}\text{,}\Delta \text{TE} \right)=\frac{1}{2\pi}\frac{\Delta\phi\left( \textbf{r}\text{,}\Delta \text{TE} \right)}{\Delta \text{TE} }
\end{equation}
```


If we assume a maximum field offset {math}`\Delta f_{0,max}` of 1 ppm at 3T (~127 MHz), we can calculate a maximum field offset ({math}`\Delta f_{0,max}`) of 1 µT or 127 Hz. The [Nyquist criteria](https://en.wikipedia.org/wiki/Nyquist_frequency) can be used to calculate the maximum echo time difference (TE) required to satisfy the no-wrapping requirement in the phase difference image ({math}`\Delta \text{TE} = \left( \Delta f_{0,max} \right)^{-1}`). [](#b0Table1) shows TE for multiple field strength assuming inhomogeneities of 1 ppm. As shown, the echo spacing is _B_{sub}`0` dependent, as higher field offsets are observed at higher field strengths.

```{list-table}  Maximum echo time required to respect the Nyquist criteria for different field strengths for ΔB0 of 1 ppm.
:header-rows: 1
:label: b0Table1
:enumerator:5.1
* - B0 (T)
  - deltaTE (ms)
* - 0.064
  - 183.39
* - 0.1
  - 117.37
* - 0.3
  - 39.12
* - 1.5
  - 7.82
* - 3
  - 3.91
* - 7
  - 1.68
```

If a longer TE is selected, or if the inhomogeneities are bigger than originally anticipated in some parts of the image, the phase difference image could also have wraps, and spatial unwrapping would be necessary.

Temporal unwrapping can also be performed without phase difference. [](#b0Plot10) shows the phase of a voxel acquired at four echo times in blue. Note that the last echo time is wrapped (i.e.: the phase rotated by more than {math}`2\pi` and “wrapped” to the positive side). With the assumption that phase does not vary by more than {math}`2\pi`, we can unwrap the phase by, in this case, subtracting {math}`2\pi` from the acquired phase to recover the true phase (in red). A linear fit is shown in green. Note that the slope would represent the field map value.

:::{figure} #fig5p10cell
:label: b0Plot10
:enumerator: 5.10
Four phase voxels acquired at different echo times (blue). The phase is unwrapped temporally and plotted, which in this case changes the phase of the 4th echo (red). A linear fit is also shown (green).
:::

