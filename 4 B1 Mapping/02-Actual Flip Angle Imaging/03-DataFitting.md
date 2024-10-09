---
title: Data Fitting
subtitle: B1 AFI
date: 2024-10-07
authors:
  - name: Juan Velezquez-Reyes
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

The ratio of [](#afiEq1) and [](#afiEq2), gives rise to [](#afiEq3) that depends on the parameters _T_{sub}`1`, TR{sub}`1`, TR{sub}`2` and the excitation flip angle ({math}`\theta`).

```{math}
:label: afiEq3
:enumerator:4.12
\begin{equation}
r=\frac{S_{2}}{S_{1}}=\frac{1-e^{\frac{-\text{TR}_{1}}{_{T_{1}}}}+\left( 1-e^{\frac{-\text{TR}_{2}}{_{T_{1}}}}\right)e^{\frac{-\text{TR}_{1}}{_{T_{1}}}}\text{cos}\left( \theta \right) }{1-e^{\frac{-\text{TR}_{2}}{_{T_{1}}}}+\left( 1-e^{\frac{-\text{TR}_{1}}{_{T_{1}}}}\right)e^{\frac{-\text{TR}_{2}}{_{T_{1}}}}\text{cos}\left( \theta \right)}
\end{equation}
```

[](#afiEq3) can be simplified if the Taylor series expansion of the exponential function is used, followed by a first-order approximation to its terms. For this expansion, short TR{sub}`1` and TR{sub}`2` (TR{sub}`1` < _T_{sub}`1` and TR{sub}`2` < _T_{sub}`1`) are assumed to approximate the signal intensities ratio ([](#afiEq4)) where n = TR{sub}`2`/TR{sub}`1`.

```{math}
:label: afiEq4
:enumerator:4.13
\begin{equation}
r \approx \frac{1+n\text{cos}\left( \theta \right)}{n+\text{cos}\left( \theta \right)}
\end{equation}
```


Finally, a measure of the actual flip-angle ({math}`\theta`) can be achieved by solving [](#afiEq4) to obtain [](#afiEq5), which only depends on the signal intensities ratio (r = S{sub}`2`/S{sub}`1`) and the parameters TR{sub}`1` and TR{sub}`2`.

```{math}
:label: afiEq5
:enumerator:4.14
\begin{equation}
\theta \approx\text{arcos}\left( \frac{rn-1}{n-r} \right)
\end{equation}
```

The actual flip-angle is estimated using an approximation ([](#afiEq4)) of a complete analytical solution ([](#afiEq3)), and the nature of this approximation makes it worthwhile to assess the accuracy of the signal intensities ratio between both equations. Next, a set of simulations are displayed to analyze how the choice of r is affected by _T_{sub}`1`, TR{sub}`1` and TR{sub}`2`. First, the effect of the relaxation time _T_{sub}`1` is simulated in [](#afiPlot4) for both the approximation and the complete analytical solution.

```{figure} #afiFig4cell
:label: afiPlot4
:enumerator: 4.9
Effect of the relaxation time _T_{sub}`1` on the ratio r. Signal intensities ratio is plotted as a function of the flip angle for the complete analytical solution ([](#afiEq3) - blue) and the first-order approximation ([](#afiEq4) - orange). AFI simulation details: TR{sub}`1` = 20 ms, TR{sub}`2` = 100 ms and variable _T_{sub}`1`.
```

The signal ratio r is highly insensitive to the relaxation time _T_{sub}`1`, except for the low _T_{sub}`1` values and large flip angles (>70°). This shows that the Taylor expansion is a good approximation to the signal ratio r because it is possible to get rid of the inverse quadratic _T_{sub}`1` dependance by taking the first-order terms of the expansion.

The effect of the TR{sub}`1` parameter on the signal ratio is shown in [](#afiPlot5). To assess the influence of the repetition time, we fix n=5 and vary the parameter TR{sub}`1` in accordance to the relation n = TR{sub}`2`/TR{sub}`1`. As TR{sub}`1` increases (> 50 ms), the approximated ratio r slightly deviates from the analytical approach. Although the deviation is slight only at high flip angles, a good signal ratio approximation can be achieved for a wide range of flip angles and repetition times.

```{figure} #afiFig5cell
:label: afiPlot5
:enumerator: 4.10
Effect of the repetition time TR{sub}`1` on the ratio r. Signal intensities ratio is plotted as a function of the flip angle for the complete analytical solution ([](#afiEq3) - blue) and the first-order approximation ([](#afiEq4) - orange). AFI simulation details: Variable TR{sub}`1` ranging from 10 to 60 ms, fixed ratio n = 5 and _T_{sub}`1` = 900 ms.
```

Finally, the effect of the parameter n on the signal ratio r ([](#afiPlot6)) does not seem to significantly affect the signal ratio between the approximated equation and the analytical approach. However, the parameter n has a major impact on the sensitivity of the AFI method to variations in the flip angle. [](#afiPlot6) shows that the increase of the parameter n (= TR{sub}`2`/TR{sub}`1`) allows for improvement of the dynamic range of flip angles measurements. These simulations have shown that an optimal implementation of the AFI method requires a careful selection of sequence parameters.

```{figure} #afiFig6cell
:label: afiPlot6
:enumerator: 4.11
Effect of n (TR{sub}`2` to TR{sub}`1` ratio) on the ratio r. The signal intensities ratio is plotted as a function of the flip angle for the complete analytical solution ([](#afiEq3) - blue) and the first-order approximation ([](#afiEq4) - orange). AFI simulation details: Variable n ranging from 2 to 6, fixed TR{sub}`1` = 20 ms and _T_{sub}`1` = 900 ms.
```

[](#afiPlot7) displays an example AFI dataset and its corresponding field _B_{sub}`1` map in a healthy human brain. Although not clearly visible, both AFI images present a small Gibbs ringing artifact that is propagated and amplified due to the AFI calculation consisting of the division of both images [@Boudreau2017-ik]. The ringing artifact is clearly seen in the unfiltered/raw _B_{sub}`1` field map shown in [](#afiPlot7) (right).

```{figure} #afiFig7cell
:label: afiPlot7
:enumerator: 4.12
Example actual flip-angle imaging dataset (left) and a resulting raw _B_{sub}`1` map of a healthy adult brain (right). The relevant VFA protocol parameters used were: TR{sub}`1` = 20 ms, TR{sub}`2` = 100 ms and {math}`\theta_{nominal}` = 60°. The _B_{sub}`1` map (right) was fitted using the approximate r ratio ([](#afiEq5)).
```

The ringing artifact shown in [](#afiPlot7) can be attenuated by implementing a smoothing process. [](#afiPlot8) shows the raw (left) and the filtered (right) _B_{sub}`1` map where a median filter was used to smooth the field map.

```{figure} #afiFig8cell
:label: afiPlot8
:enumerator: 4.13
Raw (left) and filtered (right) _B_{sub}`1` map. A median filter of size 7x7x7 pixels was used to attenuate the Gibbs ringing artifact.
```


