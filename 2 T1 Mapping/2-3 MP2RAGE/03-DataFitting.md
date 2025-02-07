---
title: Data Fitting
subtitle: MP2RAGE
date: 2024-10-07
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

Dictionary-based techniques such as MP2RAGE do not typically use conventional minimization algorithms (e.g. [Levenberg-Marquardt](wiki:Levenberg–Marquardt_algorithm) to fit signal equations to observed data. Instead, the MP2RAGE technique uses pre-calculated signal values for a wide range of parameter values (e.g. _T_{sub}`1`), and then interpolation is done within this dictionary of values to estimate the _T_{sub}`1` value that matches the observed signal. This approach results in rapid post-processing times because the dictionaries can be simulated/generated prior to scanning and interpolating between these values is much faster than most fitting algorithms. This means that the quantitative image can be produced and displayed directly on the MRI scanner console rather than needing to be fitted offline.

```{figure} #mp2rageFig2jn
:label: mp2rageplot1
:enumerator: 2.14
_T_{sub}`1` lookup table as a function of _T_{sub}`1` and _S_{sub}`MP2RAGE` value. Inversion times used to acquire this magnitude image dataset were 800 ms and 2700 ms, the flip angles were 4° and 5° (respectively),  TR{sub}`MP2RAGE` = 6000 ms, and TR = 6.7 ms. The code that was used were shared open sourced by the authors of the original MP2RAGE paper [@Marques2017-ws].
```

To produce _T_{sub}`1` maps with good accuracy and precision using dictionary-based interpolation methods, it is important that the signal curves are unique for each parameter value. MP2RAGE can produce good _T_{sub}`1` maps by using a dictionary with only dimensions (_T_{sub}`1`, _S_{sub}`MP2RAGE`), since _S_{sub}`MP2RAGE` is unique for each _T_{sub}`1` value for a given protocol [@Marques2010-mo]. However, as was noted above, _S_{sub}`MP2RAGE` is also sensitive to _B_{sub}`1` because of {math}`\theta_{1}` and {math}`\theta_{2}` in  Equations [2.13](#mp2rageEq3), [2.14](#mp2rageEq4), [2.15](#mp2rageEq5), and [2.16](#mp2rageEq3). The  _B_{sub}`1`-sensitivity can be reduced substantially with careful MP2RAGE protocol optimization [@Marques2010-mo], and further improved by including _B_{sub}`1` as one of the dictionary dimensions [_T_{sub}`1`, _B_{sub}`1`, _S_{sub}`MP2RAGE`] ([](#mp2rageplot1)).  This requires an additional acquisition of a _B_{sub}`1` map [@Marques2013-ab], which lengthens the scan time. 


```{figure} #mp2rageFig3jn
:label: mp2rageplot2
:enumerator: 2.15
Example MP2RAGE dataset of a healthy adult brain at 7T and _T_{sub}`1` map. Inversion times used to acquire this magnitude image dataset were 800 ms and 2700 ms, the flip angles were 4° and 5° (respectively),  TR{sub}`MP2RAGE` = 6000 ms, and TR = 6.7 ms. The dataset and code that was used were shared open sourced by the authors of the original MP2RAGE paper [@Marques2017-ws].
```

The MP2RAGE pulse sequence is increasingly being distributed by MRI vendors, thus typically a data fitting package is also available to reconstruct the _T_{sub}`1` maps online. Alternatively, several open source packages to create _T_{sub}`1` maps from MP2RAGE data are available online [@Marques2017-ws;@De_Hollander2017-cv], and for new users these are recommended—as opposed to programming one from scratch—as there are many potential pitfalls (e.g. adjusting the equations to handle partial Fourier or parallel imaging acceleration).