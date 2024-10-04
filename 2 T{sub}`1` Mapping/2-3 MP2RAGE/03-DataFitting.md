---
title: Data Fitting
subtitle: MP2RAGE
date: 2024-07-25
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  figure:
    template: Fig. %s
---

Dictionary-based techniques such as MP2RAGE do not typically use conventional minimization algorithms (e.g. Levenberg-Marquardt) to fit signal equations to observed data. Instead, the MP2RAGE technique uses pre-calculated signal values for a wide range of parameter values (e.g. T<sub>1</sub>), and then interpolation is done within this dictionary of values to estimate the T<sub>1</sub> value that matches the observed signal. This approach results in rapid post-processing times because the dictionaries can be simulated/generated prior to scanning and interpolating between these values is much faster than most fitting algorithms. This means that the quantitative image can be produced and displayed directly on the MRI scanner console rather than needing to be fitted offline.

MP2RAGE is an extension of the conventional MPRAGE pulse sequence widely used in clinical studies (Haase et al. 1989; Mugler & Brookeman 1990). A simplified version of the MP2RAGE pulse sequence is shown in Figure 1. MP2RAGE can be seen as a hybrid between the inversion recovery and VFA pulse sequences: a 180° inversion pulse is used to prepare the magnetization for T<sub>1</sub> sensitivity at the beginning of each TRMP2RAGE, and then two images are acquired at different inversion times using gradient recalled echo (GRE) imaging blocks with low flip angles and short repetition times (TR). During a given GRE imaging block, each excitation pulse is followed by a constant in-plane (“y”) phase encode weighting (varied for each TRMP2RAGE), but with different 3D (“z”) phase encoding gradients (varied at each TR). The center of k-space for the 3D phase encoding direction is acquired at the TI for each GRE imaging block. The main motivation for developing the MP2RAGE pulse sequence was to provide a metric similar to MPRAGE, but with self-bias correction of the static (B<sub>0</sub>) and receive (B<sub>1</sub><sup>-</sup>) magnetic fields, and a first order correction of the transmit magnetic field (B<sub>1</sub><sup>+</sup>). However, because two images at different TIs are acquired (unlike MPRAGE, which only acquires data at a single TI), information about the T<sub>1</sub> values can also be inferred, thus making it possible to generate quantitative T<sub>1</sub> maps using this data.

```{figure} img/plot1.png
:label: mp2rageplot1

T<sub>1</sub> lookup table as a function of B<sub>1</sub> and <i>S</i><sub>MP2RAGE</sub> value. Inversion times used to acquire this magnitude image dataset were 800 ms and 2700 ms, the flip angles were 4° and 5° (respectively),  TR<sub>MP2RAGE</sub> = 6000 ms, and TR = 6.7 ms. The code that was used were shared open sourced by the authors of the original MP2RAGE paper (<a href="url">https://github.com/JosePMarques/MP2RAGE-related-scripts</a>).
```

To produce T<sub>1</sub> maps with good accuracy and precision using dictionary-based interpolation methods, it is important that the signal curves are unique for each parameter value. MP2RAGE can produce good T<sub>1</sub> maps by using a dictionary with only dimensions (T<sub>1</sub>, <i>S</i><sub>MP2RAGE</sub>), since <i>S</i><sub>MP2RAGE</sub> is unique for each T<sub>1</sub> value for a given protocol  (Marques et al. 2010). However, as was noted above, <i>S</i><sub>MP2RAGE</sub> is also sensitive to B<sub>1</sub> because of <i>θ<sub>1</sub></i> and <i>θ<sub>2</sub></i> in Eqs. (1.13–1.16). The  B<sub>1</sub>-sensitivity can be reduced substantially with careful MP2RAGE protocol optimization (Marques et al. 2010), and further improved by including B<sub>1</sub> as one of the dictionary dimensions [T<sub>1</sub>, B<sub>1</sub>, <i>S</i><sub>MP2RAGE</sub>] (Figure 1.15).  This requires an additional acquisition of a B<sub>1</sub> map (Marques & Gruetter 2013), which lengthens the scan time. 


```{figure} img/plot2.png
:label: mp2rageplot2

Example MP2RAGE dataset of a healthy adult brain at 7T and T<sub>1</sub> map. Inversion times used to acquire this magnitude image dataset were 800 ms and 2700 ms, the flip angles were 4° and 5° (respectively),  TR<sub>MP2RAGE</sub> = 6000 ms, and TR = 6.7 ms. The dataset and code that was used were shared open sourced by the authors of the original MP2RAGE paper (<a href="url">https://github.com/JosePMarques/MP2RAGE-related-scripts</a>).
```

The MP2RAGE pulse sequence is increasingly being distributed by MRI vendors, thus typically a data fitting package is also available to reconstruct the T<sub>1</sub> maps online. Alternatively, several open source packages to create T<sub>1</sub> maps from MP2RAGE data are available online (Marques 2017; de Hollander 2017), and for new users these are recommended—as opposed to programming one from scratch—as there are many potential pitfalls (e.g. adjusting the equations to handle partial Fourier or parallel imaging acceleration).