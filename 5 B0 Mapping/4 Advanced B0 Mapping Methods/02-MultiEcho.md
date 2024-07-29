---
title: Multi-echo B0 Mapping
subtitle: Advanced B0 Mapping Methods
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

Multi-echo field mapping (three or more echoes) makes use of more echo times than the dual-echo standard field map. With more time points, field-map can be expected to be more accurate. All benefits and pitfalls of section 4.2 apply in multi-echo field mapping as well with the added criteria that the later echoes should have enough signal to provide a benefit to the technique. As seen in section 4.2, the phase generally evolves linearly with respect to time. Another way to look at B0 field mapping is realizing that we are looking for how much the phase changes per unit of time (i.e.: the slope).

(x,y,z,t)=0(x,y,z) +B0(x,y,z݀) ᐧ t

There are many ways to perform multi-echo field mapping. The most straightforward way (after dual-echo) is to spatially unwrap the phase of all the echo times, then temporally unwrap the resulting data to remove any 2n offset between time points that could arise from spatial unwrapping. A linear fit can then be done to retrieve the field map. This technique requires the echo times between time points to be reasonably short so that temporal unwrapping can accurately unwrap the data (<). Figure 1 shows two solutions that can be obtained from this processing (note the exact 2 difference at each timepoint). The difference could be explained from the choice of seed voxel used for unwrapping spatially. However, since the slope (change in phase over time) is the same for both solutions, an accurate field map can still be recovered even if the underlying phase maps have a 2n offset. This is another advantage over phase difference algorithms.

```{figure} img/plot1.png
:label: b0AdvFig1

Two different unwrapped solutions from unwrapping phase data of three echoes. A 2 offset is observed between both solutions.
```

Another way to perform multi-echo field mapping is to have two echoes that are relatively close to avoid temporal phase wrapping and a later echo with sufficient SNR. The first two echoes can be treated as a dual-echo and the resulting field map can help temporally unwrap the 3rd echo. This 3rd echo can be used to get a better fit.

```{figure} img/plot2.png
:label: b0AdvFig2

Three echo acquisition where the first two echoes respect the Nyquist criteria and can be temporally unwrapped accurately while the third echo has a much longer echo time. The first two echoes can be used to predict the number of wraps of the third echo. With all three echoes accurately unwrapped, a fit with three echoes can be computed.
```

As mentioned in chapter 4.3, the standard deviation of the phase is inversely proportional to the SNR of the magnitude image of the field mapping acquisition. This means that longer echo times can have a detrimental impact on the field map if it is not accounted for. One way to address the issue is to weigh the contribution of the echoes by the SNR of the magnitude images.

More complex algorithms such as UMPIRE [24] exploit echo timings to only rely on temporal unwrapping to unwrap the phase images. A minimum of three echoes is necessary for this algorithm. With three echoes, the two echo time differences (TE1=TE2-TE1, TE2=TE3-TE2) are chosen to be slightly different. Doing this allows to calculate the accrued phase during TE2-TE1=TE  which is chosen to be small and is therefore free of wraps. Using this, the wraps in the different echoes can be estimated and removed yielding unwrapped phase images which can be fit to calculate the field map. An advantage of the technique is that it allows one to select echo times that would normally be too long since TEx can be larger than . An important prerequisite of this algorithm is that the phase offset occurring during TE be less than  but greater than zero such that a good estimate of the phase can still be calculated. The following figure shows an example of a single voxel being unwrapped using UMPIRE. As previously stated, the slope of the linear fit is proportional to the resulting field map. The traces can be toggled on and off by clicking the legend.


```{figure} img/plot3.png
:label: b0AdvFig3

Three echo data unwrapped using the UMPIRE algorithm. Note that UMPIRE is able to unwrap phase data that varies by more than . The different traces can be toggled on or off clicking the desired trace in the legend.
```

Although UMPIRE has many advantages, it suffers from being susceptible to noise. The following figure uses the same phase data as the previous figure but adds a slider that simulates a phase offset added to the second echo. 

```{figure} img/plot4.png
:label: b0AdvFig4

Effect of noise using UMPIRE. A slider is provided to change the field offset of the second echo and see its effect on the resulting unwrapped data and linear fit.
```

Other unwrappers are less susceptible to noise such as PRELUDE [20] but it does not have the ability to resolve > phase offsets between timepoints and can take longer to unwrap the data. The SEGUE [21] algorithm performs similarly to PRELUDE but can be much faster. ROMEO [23] is also an algorithm that is quite fast and has been shown to perform better than PRELUDE and BEST PATH[22] with noise.