---
title: 1D examples
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

:::{attention}
:class: attentionDraft
:name: attentionDraft
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

Let’s explore how different filters and smoothing functions behave under different circumstances, in order to help provide you with some insights on how to decide which one may be the best choice for your B1 map. In Figure 4 we generated a 1D distribution to simulate a rectangular “object” with no sharp edges and no noise, which we’ll define as the “true signal”. Applying three different filters (Gaussian, Median, Spline) to this ideal signal, we can see how the filter and it’s width impacts the signal.


:::{figure} #filtFig4cell
:label: filtPlot4
:enumerator: 4.4
Convolution on the ideal function
:::


This illustrates that simply the act of applying the filter can have undesired effects on your image, such as altering the edges of your object. Thus, filtering a B1 map is always a balance between removing undesired properties while altering the image the least amount possible. In short, try not to overdo it. 
Let’s add some noise.


:::{figure} #filtFig5cell
:label: filtPlot5
:enumerator: 4.5
Ideal function + noise
:::


Here in Figure 5 we start to see a real benefit of the use of the filters. Although the edges still get impacted slightly, the main region of interest (the flat portion) gets substantially closer to the original signal using filters. However, there reaches a point where the noise is so high that filters simply can’t “find” the base signal anymore. Thus, only a reasonable amount of noise can be properly filtered out, and all three filter types work about as well as each other for this task.

What happens if there is a pixel or small region that has a very high signal relative to the nearby voxels? Will all our filters work well at restoring the true signal? Figure 6 demonstrates this.

:::{figure} #filtFig6cell
:label: filtPlot6
:enumerator: 4.6
Ideal function + delta
:::

If the filter strength is strong enough, the median filter works much better at this task than either the Gaussian filter or spline fitting. For the latter two, not only does the true signal amplitude not get resolved at that position, but there is spread of this “error” to nearby voxels. Thus, if using filters on B1 maps, take some care to avoid spreading of the values you’re trying to filter out, if your B1 mapping techniques is sensitive to high T1 values of the ventricles.

What happens at the interface of the brain, where the B1 signal abruptly drops to zero? Figure 7 illustrates this using a step-function boundary on the right side of our original signal:

:::{figure} #filtFig7cell
:label: filtPlot7
:enumerator: 4.7
Ideal function + step/sharp edge
:::

Here we see again that the median function works well if the filter strength is properly chosen. The Gaussian filter works well, but there is some loss of resolution at the boundary, meaning that in the context of a brain MRI B1 map, errors may be introduced into the grey matter voxels at the edge of the brain. There exists some strategies to mitigate this in the filtering algorithm, such using a brain mask and mirroring or extrapolating the signal at the boundary prior to filtering. As for the spline fitting, if these strategies are not applied, we see that there may be some artifacts introduced at the boundary (higher signal than the true signal) because spline-fitting polynomials have their limitations at very sharp interfaces due to their continuity conditions. Also, there are some artifacts introduced outside of this step function, such that if this is an interface between two tissues, both sides will be negatively impacted.

Figure 8 shows one last example, our original signal multiplied by a “comb” function (i.e. repeated pattern of the delta signal), which could be present in cases where there is Gibbs ringing in the image. Interpretation of the benefits and drawbacks for each filter for different filter strength here is left to the reader.

:::{figure} #filtFig8cell
:label: filtPlot8
:enumerator: 4.8
Ideal function + comb
:::
