---
title: Gradient echo and 180 degree spin echo method
subtitle: Double Angle technique
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

This pulse sequence uses a 180 degree spin-echo refocusing pulse and acquires two images using an excitation pulse α and 2α. It assumes that there is full signal recovery (long TR), and because it refocuses T2*, it eliminates signal variability caused by B0 in the resulting B1 map (Insko and Bolinger 1993). Alternatively, a gradient echo could be used?

Assuming an an refocusing pulse is used (i.e. isn’t dependent on B1), we can develop the equation for a gradient echo and spin echo case.

M=M0sin()e-TET2
(1)


M2=M0sin(2)e-TET2
(2)



Thus


Msin()=M2sin(2)
(3)

and

M2M=sin(2)sin()
(3)


Using a well known trigonometry identity (see Appendix A for derivation),


sin(2)=2sin()cos()
(4)

We can simplify Eq. 3,

M2M=2sin()cos()sin()
(5)


M2M=2cos()
(6)

And the true flip angle can be calculated from the ratio of these two magnetizations / signals / images:

=arcos(M22M)
(7)

Knowing that alpha = B1 alpha_nominal, B1 is thus:

B1=arcos(M22M)nominal
(7)


:::{figure} #daFig1cell
:label: daPlot1
:enumerator: 4.2
B1 computed from analytical GRE equations for DA sequence
:::

This equation is also used for alpha-180 spin echo pulses, however it assumes no dependency on of the refocusing pulse on B1. Figure 3 explores this using Bloch simulations

:::{figure} #daFig2cell
:label: daPlot2
:enumerator: 4.3
B1 computed from bloch simulations for ideal spin echo and refocusing pulse where FA = 180*B1
:::


:::{figure} #daFig3cell
:label: daPlot3
:enumerator: 4.4
B1 computed from bloch simulations for spin echo with refocusing pulse where FA = 180*B1,, and composite pulse 90x-180y-90x where each 90 and 180 are also multiplied by B1.
:::


