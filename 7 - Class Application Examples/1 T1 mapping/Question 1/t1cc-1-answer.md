---
title: Question 1 - Answer
date: 2025-02-12
label: zzzflairt1cc1answer
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  headings: false
---

:::{table}
:label: question1Table
<table>
   <tr>
      <th colspan="1" align="center"></th>
      <th colspan="1" align="center">Proton density weighted</th>
      <th colspan="1" align="center">T1 weighted</th>
      <th colspan="1" align="center">T2 weighted</th>

   </tr>
   <tr>
      <th colspan="1" align="left"><bold>Echo Time (TE)</bold></td>
      <td colspan="1" align="center">Medium</td>
      <td colspan="1" align="center">Short</td>
      <td colspan="1" align="center">Long</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>Repetition time (TR)</bold></td>
      <td colspan="1" align="center">Medium</td>
      <td colspan="1" align="center">Short</td>
      <td colspan="1" align="center">Long</td>
   </tr>
</table>
:::

T1-weighted images are optimized for greater T1 contrast between tissues-of-interest, while T2-weighted images are optimized for greater T2 contrast between tissues-of-interest.

Revisiting [](#vfaPlot1) and [](#t2Plot2), can you explain out why the T1w parameters were chosen to be [TR = 1 s, TE = 15 ms] and not [TR = 5s, TE = 150 ms]? Why was T2w protocol parameters [TR = 5s, TE = 150 ms] instead of [TR = 1 s, TE = 15 ms]?

```{embed} #irPlot1
```

```{embed} #t2Plot2
```

A common trick is to remember that white-matter is white in T1-weighted images, and water is bright in T2-weighted images. Here are those images again:

```{embed} #flairPlot2
```

```{embed} #flairPlot1
```
