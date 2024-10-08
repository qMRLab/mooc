---
title: Filters and smoothing
subtitle: Filtering
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

:::{attention}
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

There are two main ways that field maps are smoothened in practice: filters and fitting. The study of filters is typically presented in a signal processing context, however its basic principles (in particular, convolutions) are observed in many other fields of study, in particular physics.

We’ll begin by providing a very brief overview of some key filtering properties, then move on to some illustrative 1D examples related to MRI situations in the next section before finally returning to their applications in actual B1 maps.

Filtering is presented as a convolution process to produce an output that is smoother, meaning less sharp edges. A convolution is the multiplication of a kernel (a predetermined function or property, such as the mean, median, Gaussian function, etc) that is shifted at each point of the signal or image, and the summed value of this multiplication is assigned to the time or spatial point where it was applied. [](#filtPlot3) illustrates this for the mean using a three-position mean as a kernel:


:::{figure} #filtFig2cell
:label: filtPlot2
:enumerator: 4.15
Convolution using the mean
:::

In the context of MRI, the mean is not the best choice for a filter, as it is sensitive to high values relative to the base signal. The median is a better choice, which we’ll demonstrate in the next section.
In terms of equations, the convolution is shown using the symbol ∗, such that analytically it is represented as:

```{math}
:label: filtEq1
:enumerator:4.15
\begin{equation}
\left( f \otimes g \right)=\int_{-\infty }^{\infty }f\left( u \right)g\left( t-u \right)du
\end{equation}
```

where f(t) is the signal of interest and g(t) is the kernel. Not every kernel will lead to smoothing (reduction of high frequencies) of the signal of interest when convolved, however the Gaussian distribution is one such smoothing function:

```{math}
:label: filtEq2
:enumerator:4.16
\begin{equation}
f\left( x \right)=\frac{1}{\sqrt{2\pi\sigma^{2}}}\text{e}^{-\frac{\left( x-x_{o} \right)^{2}}{2\sigma^{2}}}
\end{equation}
```


where x0 is the center position of the distribution, and  is a measure of the width. The convolution using this function with a 9-point sample for different widths is shown in [](#filtPlot3).

:::{figure} #filtFig3cell
:label: filtPlot3
:enumerator: 4.16
Convolution using a Gaussian kernel
:::

One property of the convolution is that the convolution of two functions is the multiplication of the Fourier Transforms of each function following by an inverse Fourier transform:


```{math}
:label: filtEq3
:enumerator:4.17
\begin{equation}
\left( f\otimes g \right)\left( t \right)=\mathcal{F}^{-1}\left( \mathcal{F}\left( k \right) \cdot \mathcal{G}\left( k \right) \right)
\end{equation}
```


Although convolutions can be computed this way and may me more conceptually clear, particularly the role of the kernel, practically this ends up being slower than the convolution method when using only a small number of samples for the kernel.

As for “smoothing” the signal using fitting, splines are simply a piecewise fit of your signal to some function with a continuity condition set at different points throughout the signal. Typically this is done using polynomials, such as a third-order polynomial: ax3 + bx2 +cx1 + dx0. There are a lot of different algorithms and ways to do this, which is out of scope for this work.
