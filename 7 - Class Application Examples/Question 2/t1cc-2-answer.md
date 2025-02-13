---
title: Question 1 - Answer
date: 2025-02-12
label: zzzflairt1cc2answer
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  headings: false
---

The periventricular lesions are expected to be due to inflammation that leads to odeoma, which results in an increase in water content (increasing T2) but too early for permanent dammage of the underlying structures (T1 will change, but not dramatically).

Let's assume that the periventricular lesions have T2 is close to the ventricular T2, but that lesion T1 values remain close to their healthy values. Given what the radiologist requested from you,

>the radiologist asks for your help in designing an imaging protocol that can better differentiate between the hyperintense CSF in the ventricles and the hyperintense periventricular lesions.

we want to design a pulse sequence that will provide better contrast between the periventricular lesions and the ventricles. Here's a summary table of some expected parameters:

:::{table}
:label: question2Table
<table>
   <tr>
      <th colspan="1" align="center"></th>
      <th colspan="1" align="center">Healthy WM</th>
      <th colspan="1" align="center">Ventricles</th>
      <th colspan="1" align="center">Periventricular lesion</th>

   </tr>
   <tr>
      <th colspan="1" align="left"><bold>T1</bold></td>
      <td colspan="1" align="center">Short</td>
      <td colspan="1" align="center">Long</td>
      <td colspan="1" align="center">Short</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>T2</bold></td>
      <td colspan="1" align="center">Short</td>
      <td colspan="1" align="center">Long</td>
      <td colspan="1" align="center">Long</td>
   </tr>
</table>
:::

After some reflection, it should become clear why periventricular lesions are difficult to be observed with simple T1w and T2w images. In T1w images, the lesions have similar signal values to the nearby WM, and in T2w images they have similar signal values to the nearby ventricles. As lesions predominently exhibit an increase in water content, we'll want to design a sequence that has some T2-weighting, but with increase contrast between the lesion and ventricles.

