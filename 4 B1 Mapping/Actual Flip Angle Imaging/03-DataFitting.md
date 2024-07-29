---
title: Data Fitting
subtitle: B1 AFI
date: 2024-07-25
authors:
  - name: Juan Velezquez-Reyes
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: false
  figure:
    template: Fig. %s
---

The ratio of Equations 1 and 2, gives rise to Equation 3 that depends on the parameters T1, TR1, TR2 and the excitation flip angle (θ).

```{figure} img/equation3.png
:label: afiEq3
```

Equation 3 can be simplified if the Taylor series expansion of the exponential function is used, followed by a first-order approximation to its terms. For this expansion, short TR1 and TR2 (TR1 < T1 and TR2 < T1) are assumed to approximate the signal intensities ratio (Equation 4) where n = TR2/TR1.

```{figure} img/equation4.png
:label: afiEq4
```

Finally, a measure of the actual flip-angle (θ) can be achieved by solving Equation 4 to obtain Equation 5, which only depends on the signal intensities ratio (r = S2/S1) and the parameters TR1 and TR2.

```{figure} img/equation5.png
:label: afiEq5
```
The actual flip-angle is estimated using an approximation (Equation 4) of a complete analytical solution (Equation 3), and the nature of this approximation makes it worthwhile to assess the accuracy of the signal intensities ratio between both equations. Next, a set of simulations are displayed to analyze how the choice of r is affected by T1, TR1 and TR2. First, the effect of the relaxation time T1 is simulated in Figure 5 for both the approximation and the complete analytical solution.

```{figure} img/plot4.png
:label: afiPlot4

Effect of the relaxation time T1 on the ratio r. Signal intensities ratio is plotted as a function of the flip angle for the complete analytical solution (Equation 3 - blue) and the first-order approximation (Equation 4 - orange). AFI simulation details: TR1 = 20 ms, TR2 = 100 ms and variable T1.
```

The signal ratio r is highly insensitive to the relaxation time T1, except for the low T1 values and large flip angles (>70°). This shows that the Taylor expansion is a good approximation to the signal ratio r because it is possible to get rid of the inverse quadratic T1 dependance by taking the first-order terms of the expansion.

The effect of the TR1 parameter on the signal ratio is shown in Figure 6. To assess the influence of the repetition time, we fix n=5 and vary the parameter TR1 in accordance to the relation n = TR2/TR1. As TR1 increases (> 50 ms), the approximated ratio r slightly deviates from the analytical approach. Although the deviation is slight only at high flip angles, a good signal ratio approximation can be achieved for a wide range of flip angles and repetition times.

```{figure} img/plot5.png
:label: afiPlot5

Effect of the repetition time TR1 on the ratio r. Signal intensities ratio is plotted as a function of the flip angle for the complete analytical solution (Equation 3 - blue) and the first-order approximation (Equation 4 - orange). AFI simulation details: Variable TR1 ranging from 10 to 60 ms, fixed ratio n = 5 and T1 = 900 ms.
```

Finally, the effect of the parameter n on the signal ratio r (Figure 7) does not seem to significantly affect the signal ratio between the approximated equation and the analytical approach. However, the parameter n has a major impact on the sensitivity of the AFI method to variations in the flip angle. Figure 7 shows that the increase of the parameter n (= TR2/TR1) allows for improvement of the dynamic range of flip angles measurements. These simulations have shown that an optimal implementation of the AFI method requires a careful selection of sequence parameters.

```{figure} img/plot6.png
:label: afiPlot6

Effect of n (TR2 to TR1 ratio) on the ratio r. The signal intensities ratio is plotted as a function of the flip angle for the complete analytical solution (Equation 3 - blue) and the first-order approximation (Equation 4 - orange). AFI simulation details: Variable n ranging from 2 to 6, fixed TR1 = 20 ms and T1 = 900 ms.
```

Figure 8 displays an example AFI dataset and its corresponding field B1 map in a healthy human brain. Although not clearly visible, both AFI images present a small Gibbs ringing artifact that is propagated and amplified due to the AFI calculation consisting of the division of both images (Boudreau et al. 2017). The ringing artifact is clearly seen in the unfiltered/raw B1 field map shown in Figure 8 (right).

```{figure} img/plot7.png
:label: afiPlot7

Example actual flip-angle imaging dataset (left) and a resulting raw B1 map of a healthy adult brain (right). The relevant VFA protocol parameters used were: TR1 = 20 ms, TR2 = 100 ms and θnominal = 60°. The B1 map (right) was fitted using the approximate r ratio (Equation 5).
```

The ringing artifact shown in Figure 8 can be attenuated by implementing a smoothing process. Figure 9 shows the raw (left) and the filtered (right) B1 map where a median filter was used to smooth the field map.

```{figure} img/plot8.png
:label: afiPlot8

Raw (left) and filtered (right) B1 map. A median filter of size 7x7x7 pixels was used to attenuate the Gibbs ringing artifact.
```


