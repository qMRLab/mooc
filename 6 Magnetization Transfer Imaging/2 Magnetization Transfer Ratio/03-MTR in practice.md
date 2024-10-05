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


:::{table} Area Comparisons (written in fancy HTML)
:label: tbl:areas-html

<table>
   <tr>
      <th colspan="1" align="center"></th>
      <th colspan="2" align="center">Brown 2013</th>
      <th colspan="2" align="center">Karakuzu 2022</th>
   </tr>
   <tr>
      <th align="right">Large Horizontal Area</th>
      <th align="right" style="background: -webkit-linear-gradient(20deg, #09009f, #E743D9); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Large Vertical Area</th>
      <th align="right">Smaller Square Area
      <th>
   </tr>
   <tr>
      <td>Albers Equal Area</td>
      <td align="right">7,498.7</td>
      <td align="right">10,847.3</td>
      <td align="right">35.8</td>
   </tr>
   <tr>
      <td>Web Mercator</td>
      <td align="right">13,410.0</td>
      <td align="right">18,271.4</td>
      <td align="right">63.0</td>
   </tr>
   <tr>
      <td>Difference</td>
      <td align="right" style="background-color: red;color: white">5,911.3</td>
      <td align="right">7,424.1</td>
      <td align="right">27.2</td>
   </tr>
   <tr>
      <td>
         <bold>Percent Difference</bold>
      </td>
      <td align="right" style="background-color: green;color: white">44%</td>
      <td align="right">41%</td>
      <td align="right">43%</td>
   </tr>
</table>
:::

Brown 2013
Krakuzu 2022


Siemens
Philips
GE
Siemens
FA
15
15
6
6
TR
30
47
32
32
TE
11
8
4
4
offset
1500
1100
1200
1200
MT shape
Gaussian
Sinc-Gaussian
Fermi
Gaussian
MT duration
7.68
15
8
10
MT angle
500
620
540
540

