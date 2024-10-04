---
title: Introduction to filters and smoothing
subtitle: Filtering
date: 2024-07-25
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: false
  figure:
    template: Fig. %s
---
There are two main ways that field maps are smoothened in practice: filters and fitting. The study of filters is typically presented in a signal processing context, however its basic principles (in particular, convolutions) are observed in many other fields of study, in particular physics.

We’ll begin by providing a very brief overview of some key filtering properties, then move on to some illustrative 1D examples related to MRI situations in the next section before finally returning to their applications in actual B1 maps.

Filtering is presented as a convolution process to produce an output that is smoother, meaning less sharp edges. A convolution is the multiplication of a kernel (a predetermined function or property, such as the mean, median, Gaussian function, etc) that is shifted at each point of the signal or image, and the summed value of this multiplication is assigned to the time or spatial point where it was applied. Figure 2 illustrates this for the mean using a three-position mean as a kernel:


Figure 2. Convolution using the mean

In the context of MRI, the mean is not the best choice for a filter, as it is sensitive to high values relative to the base signal. The median is a better choice, which we’ll demonstrate in the next section.
In terms of equations, the convolution is shown using the symbol ∗, such that analytically it is represented as:

(fg)(t)= -f(u)g(t-u)du
(1)

where f(t) is the signal of interest and g(t) is the kernel. Not every kernel will lead to smoothing (reduction of high frequencies) of the signal of interest when convolved, however the Gaussian distribution is one such smoothing function:


f(x)=122e-(x-x0)222
(2)

where x0 is the center position of the distribution, and  is a measure of the width. The convolution using this function with a 9-point sample for different widths is shown in Figure 3.
Figure 3. Convolution using a Gaussian kernel

One property of the convolution is that the convolution of two functions is the multiplication of the Fourier Transforms of each function following by an inverse Fourier transform:

(fg)(t)= F-1(F(k)G(k))
(1)

Although convolutions can be computed this way and may me more conceptually clear, particularly the role of the kernel, practically this ends up being slower than the convolution method when using only a small number of samples for the kernel.

As for “smoothing” the signal using fitting, splines are simply a piecewise fit of your signal to some function with a continuity condition set at different points throughout the signal. Typically this is done using polynomials, such as a third-order polynomial: ax3 + bx2 +cx1 + dx0. There are a lot of different algorithms and ways to do this, which is out of scope for this work.