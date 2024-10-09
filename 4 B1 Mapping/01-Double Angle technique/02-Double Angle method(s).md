---
title: Double Angle method(s)
subtitle: Double Angle technique
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

The Double Angle method (DA or DAM) is a class of _B_{sub}`1` mapping technique swherein two RF pulses at flip angles α and 2α are applied to a pulse sequence, and the ratio of the images are compared to expected output to produce a _B_{sub}`1` map. Several main pulse sequences ([](#daFig1)]) have been called the double angle method in the literature, and both have their own equations describing the relationship between the expected images and _B_{sub}`1`. In this chapter, we’ll mostly explore there the α-180 method ([](#daFig1)]), and then briefly explain the other method and its similarities/differences.

```{figure} img/daPulseSequences.png
:label: daFig1
:enumerator: 4.1
Pulse sequences for double angle methods. A) Double angle method using a gradiend echo. B) Double angle method using a 180 degree refocusing pulse. C) Double angle method using a {math}`2\alpha` refocusing pulse, acquired with two values {math}`\alpha_{1}` and {math}`\alpha_{2}` such that {math}`\alpha_{2}=2\alpha_{1}`. 
```