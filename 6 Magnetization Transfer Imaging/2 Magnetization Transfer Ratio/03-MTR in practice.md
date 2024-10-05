---
title: MTR in practice
subtitle: Magnetization Transfer Ratio
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

Typically, MTR imaging protocols are implemented on the scanner by adding a relatively long (~5-10 ms) high amplitude off-resonance (~2kHz) preparation RF pulse prior to each TR of an existing imaging sequence. In the early days of MT, the MT pulse was a very long pulse (~10 seconds) prior to one imaging readout of saturation-recovery sequences, but this results in impractically long acquisition times and is very SAR prohibitive. Alternative approaches were explored (eg. 1-2-1 pulses), however now most MT-weighted sequences are done using steady-state sequences (eg SPGR) with a shorter preparation pulse (~10 milliseconds). Figure 1 illustrated this using a spoiled-gradient recalled echo (SPGR) sequence, with a Gaussian-shaped MT preparation pulse prior to the excitation pulse.

```{figure} img/sequence.png
:label: mtrFig1
:enumerator: 6.1  
Simplified pulse sequence diagram of an MTR imaging sequence. An off-resonance and high powered MT-preparation pulse is followed by a spoiler gradient to destroy any transverse magnetization prior the application of the imaging sequence, in this case a spoiled gradient recalled echo (SPGR).
```

Each MRI vendor optimizes their MT-weighted protocol parameters (eg MT shape, duration, frequency, and amplitude), and few of these details are typically shared with the end-user. Table 2 shares protocol parameters used by different MRI manufacturers as reported by two publications.

Table 2. Literature MTR protocol parameters


:::{table} Literature MTR protocol parameters
:label: tbl:areas-html
:enumerator: 6.1  

<table>
   <tr>
      <th colspan="1" align="center"></th>
      <th colspan="2" align="center">Brown 2013</th>
      <th colspan="2" align="center">Karakuzu 2022</th>
   </tr>
   <tr>
      <th colspan="1" align="center"></th>
      <th colspan="1" align="center">Siemens</th>
      <th colspan="1" align="center">Philips</th>
      <th colspan="1" align="center">GE</th>
      <th colspan="1" align="center">Siemmens</th>
   </tr>
   <tr>
      <td th colspan="1" align="left"><bold>FA (deg)</bold></td>
      <td th colspan="1" align="center">15</td>
      <td th colspan="1" align="center">15</td>
      <td th colspan="1" align="center">6</td>
      <td th colspan="1" align="center">6</td>
   </tr>
   <tr>
      <td th colspan="1" align="left"><bold>TR (ms)</bold></td>
      <td th colspan="1" align="center">30</td>
      <td th colspan="1" align="center">47</td>
      <td th colspan="1" align="center">32</td>
      <td th colspan="1" align="center">32</td>
   </tr>
   <tr>
      <td th colspan="1" align="left"><bold>TE (ms)</bold></td>
      <td th colspan="1" align="center">11</td>
      <td th colspan="1" align="center">8</td>
      <td th colspan="1" align="center">4</td>
      <td th colspan="1" align="center">4</td>
   </tr>
   <tr>
      <td th colspan="1" align="left"><bold>Offset (Hz)</bold></td>
      <td th colspan="1" align="center">1500</td>
      <td th colspan="1" align="center">1100</td>
      <td th colspan="1" align="center">1200</td>
      <td th colspan="1" align="center">1200</td>
   </tr>
   <tr>
      <td th colspan="1" align="left"><bold>MT pulse shape</bold></td>
      <td th colspan="1" align="center">Gaussian</td>
      <td th colspan="1" align="center">Sinc-Gaussian</td>
      <td th colspan="1" align="center">Fermi</td>
      <td th colspan="1" align="center">Gaussian</td>
   </tr>
   <tr>
      <td th colspan="1" align="left"><bold>MT pulse length (ms)</bold></td>
      <td th colspan="1" align="center">7.68</td>
      <td th colspan="1" align="center">15</td>
      <td th colspan="1" align="center">8</td>
      <td th colspan="1" align="center">10</td>
   </tr>
   <tr>
      <td th colspan="1" align="left"><bold>MT pulse angle (deg)</bold></td>
      <td th colspan="1" align="center">500</td>
      <td th colspan="1" align="center">620</td>
      <td th colspan="1" align="center">540</td>
      <td th colspan="1" align="center">540</td>
   </tr>
</table>
:::

These differences in protocol parameters can result in MTR values that vary greatly between vendors and sites, meaning that MTR can be challenging to compare unless great care in details are taken. Figure 2 shows MTR simulations using the fundamental qMT parameters for four different tissues (Table 3; healthy cortical grey matter, healthy white matter, NAWM, early white matter multiple sclerosis lesion, late white matter multiple sclerosis lesion) using the four MT-weighted SPGR protocols from Table 2.