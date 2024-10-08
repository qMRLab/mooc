---
title: Multi-echo B0 Mapping
subtitle: Advanced B0 Mapping Methods
date: 2024-10-07
label: b0MultiEcho
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

Multi-echo field mapping (three or more echoes) makes use of more echo times than the dual-echo standard field map. With more time points, the field maps can be expected to be more accurate. All [benefits and pitfalls of dual echo _B_{sub}`0`](#b0DualEchoBenPit) mapping apply in multi-echo field mapping, with the added criteria that the later echoes should have enough signal to provide a benefit to the technique. As seen in the [dual echo B0 mapping section](#b0DualEcho), the phase generally evolves linearly with respect to time. Another way to look at _B_{sub}`0` field mapping is realizing that we are looking for how much the phase changes per unit time (i.e.: the slope).

```{math}
:label: b0Eq9
:enumerator:5.9
\begin{equation}
\phi\left( \textbf{r}\text{,}t \right)=\phi_{0}\left( \textbf{r}\right)+\gamma \Delta B_{0}\left( \textbf{r} \right)\cdot t
\end{equation}
```

There are many ways to perform multi-echo field mapping. The most straightforward way (after dual-echo) is to spatially unwrap the phase of all the echo times, then temporally unwrap the resulting data to remove any {math}`2n\pi` offsets between time points that could arise from spatial unwrapping. A linear fit can then be done to retrieve the field map. This technique requires the echo times between time points to be reasonably short so that temporal unwrapping can accurately unwrap the data ({math}`\Delta \phi < \pi `). [](#b0Plot15) shows two solutions that can be obtained from this processing (note the exact {math}`2\pi` difference at each timepoint). The difference could be explained from the choice of seed voxel used for unwrapping spatially. However, as the slope (change in phase over time) is the same for both solutions, an accurate field map can still be recovered even if the underlying phase maps have a {math}`2n\pi` offset. This is another advantage over phase difference algorithms.

:::{figure} #fig5p15cell
:label: b0Plot15
:enumerator: 5.15
Two different unwrapped solutions from unwrapping phase data of three echoes. A 2 offset is observed between both solutions.
:::

Another way to perform multi-echo field mapping is to have two echoes that are relatively close to avoid temporal phase wrapping and a later echo with sufficient SNR. The first two echoes can be treated as a dual-echo and the resulting field map can help temporally unwrap the 3rd echo. This 3rd echo can be used to get a better fit. This is shown in [](#b0PLot16).


:::{figure} #fig5p16cell
:label: b0Plot16
:enumerator: 5.16
Three-echo acquisition, where the first two echoes respect the [Nyquist criteria](https://en.wikipedia.org/wiki/Nyquist_frequency) and can be temporally unwrapped accurately, while the third echo has a much longer echo time. The first two echoes can be used to predict the number of wraps of the third echo. With all three echoes accurately unwrapped, a fit with three echoes can be computed.
:::

As mentioned in the [phase unwrapping section](#phaseUnwrapIntro), the standard deviation of the phase is inversely proportional to the SNR of the magnitude image of the field mapping acquisition. This means that longer echo times can have a detrimental impact on the field map if it is not accounted for. One way to address the issue is to weigh the contribution of the echoes by the SNR of the magnitude images.

More complex algorithms such as UMPIRE [24] exploit echo timings to only rely on temporal unwrapping to unwrap the phase images. A minimum of three echoes is necessary for this algorithm. With three echoes, the two echo time differences (ΔTE{sub}`1`=TE{sub}`2`-TE{sub}`1`, ΔTE{sub}`2`=TE{sub}`3`-TE{sub}`2`) are chosen to be slightly different. Doing this allows us to calculate the accrued phase during TE{sub}`2`-TE{sub}`1`= δTE which is chosen to be small and is therefore free of wraps. Using this, the wraps in the different echoes can be estimated and removed yielding unwrapped phase images which can be fit to calculate the field map. An advantage of the technique is that it allows us to select echo times that would normally be too long, as ΔTE{sub}`x` can be larger than {math}`\pi`. An important prerequisite of this algorithm is that the phase offset occurring during δTE should be less than  but greater than zero, such that a good estimate of the phase can still be calculated. [](#b0Plot17) shows an example of a single voxel being unwrapped using UMPIRE. As previously stated, the slope of the linear fit is proportional to the resulting field map. The traces can be toggled on and off by clicking the legend.

:::{figure} #fig5p17cell
:label: b0Plot17
:enumerator: 5.17
Three echo data unwrapped using the UMPIRE algorithm. Note that UMPIRE is able to unwrap phase data that varies by more than π. The different traces can be toggled on or off clicking the desired trace in the legend.
:::

Although UMPIRE has many advantages, it suffers from being susceptible to noise. [](#b0Plot18) uses the same phase data as the previous figure, but adds a slider that simulates a phase offset added to the second echo. 

:::{figure} #fig5p18cell
:label: b0Plot18
:enumerator: 5.18
Effect of noise using UMPIRE. A slider is provided to change the field offset of the second echo and to see its effect on the resulting unwrapped data and linear fit.
:::

Unwrappers, such as PRELUDE [20] are less susceptible to noise, but do not have the ability to resolve {math}`>\pi` phase offsets between timepoints and can take longer to unwrap the data. The SEGUE [21] algorithm performs similarly to PRELUDE but can be much faster. ROMEO [23] is also an algorithm that is quite fast and has been shown to perform better than PRELUDE and BEST PATH[22] with noise.
