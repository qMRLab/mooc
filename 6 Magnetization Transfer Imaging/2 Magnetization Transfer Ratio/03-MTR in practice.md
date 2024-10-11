---
title: MTR in practice
subtitle: Magnetization Transfer Ratio
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


Typically, MTR imaging protocols are implemented on the scanner by adding a relatively long (~5-10 ms) high amplitude off-resonance (~2kHz) preparation RF pulse prior to each TR of an existing imaging sequence. In the early days of MT, the MT pulse was a very long pulse (~10 seconds) prior to one imaging readout of saturation-recovery sequences, but this results in impractically long acquisition times and is very SAR prohibitive. Alternative approaches were explored (eg. 1-2-1 pulses), however now most MT-weighted sequences are done using steady-state sequences (eg SPGR) with a shorter preparation pulse (~10 milliseconds). [](#mtrFig1) illustrated this using a spoiled-gradient recalled echo (SPGR) sequence, with a Gaussian-shaped MT preparation pulse prior to the excitation pulse.

```{figure} img/sequence.png
:label: mtrFig1
:enumerator: 6.8 
Simplified pulse sequence diagram of an MTR imaging sequence. An off-resonance and high powered MT-preparation pulse is followed by a spoiler gradient to destroy any transverse magnetization prior the application of the imaging sequence, in this case a spoiled gradient recalled echo (SPGR).
```

Each MRI vendor optimizes their MT-weighted protocol parameters (eg MT shape, duration, frequency, and amplitude), and few of these details are typically shared with the end-user. [](#mtrTable2) shares protocol parameters used by different MRI manufacturers as reported by two publications.

:::{table} Literature MTR protocol parameters (sources: [@Brown2013-eg;@Karakuzu2022-af])
:label: mtrTable2
:enumerator: 6.2  

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
      <th colspan="1" align="center">Siemens</th>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>FA (deg)</bold></td>
      <td colspan="1" align="center">15</td>
      <td colspan="1" align="center">15</td>
      <td colspan="1" align="center">6</td>
      <td colspan="1" align="center">6</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>TR (ms)</bold></td>
      <td colspan="1" align="center">30</td>
      <td colspan="1" align="center">47</td>
      <td colspan="1" align="center">32</td>
      <td colspan="1" align="center">32</td>
   </tr>
   <tr>
      <th th colspan="1" align="left"><bold>TE (ms)</bold></td>
      <td colspan="1" align="center">11</td>
      <td colspan="1" align="center">8</td>
      <td colspan="1" align="center">4</td>
      <td colspan="1" align="center">4</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>Offset (Hz)</bold></td>
      <td colspan="1" align="center">1500</td>
      <td colspan="1" align="center">1100</td>
      <td colspan="1" align="center">1200</td>
      <td colspan="1" align="center">1200</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>MT pulse shape</bold></td>
      <td colspan="1" align="center">Gaussian</td>
      <td colspan="1" align="center">Sinc-Gaussian</td>
      <td colspan="1" align="center">Fermi</td>
      <td colspan="1" align="center">Gaussian</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>MT pulse length (ms)</bold></td>
      <td colspan="1" align="center">7.68</td>
      <td colspan="1" align="center">15</td>
      <td colspan="1" align="center">8</td>
      <td colspan="1" align="center">10</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>MT pulse angle (deg)</bold></td>
      <td colspan="1" align="center">500</td>
      <td colspan="1" align="center">620</td>
      <td colspan="1" align="center">540</td>
      <td colspan="1" align="center">540</td>
   </tr>
</table>
:::

These differences in protocol parameters can result in MTR values that vary greatly between vendors and sites, meaning that MTR can be challenging to compare unless great care in details are taken. [](#mtrPlot1) shows MTR simulations using the fundamental qMT parameters for four different tissues ([](#qmtTable3); healthy cortical grey matter, healthy white matter, NAWM, early white matter multiple sclerosis lesion, late white matter multiple sclerosis lesion) using the four MT-weighted SPGR protocols from [](#mtrTable2).



:::{table} Quantitative MT parameters in healthy and diseased human tissue reported for a study at 1.5 T [@Sled2001-fz].
:label: qmtTable3
:enumerator: 6.2  
<table>
   <tr>
      <th colspan="1" align="center"></th>
      <th colspan="1" align="center">Healthy cortical GM</th>
      <th colspan="1" align="center">Healthy WM</th>
      <th colspan="1" align="center">NAWM</th>
      <th colspan="1" align="center">Early WM MS lesion</th>
      <th colspan="1" align="center">Late WM MS lesion</th>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>F</bold></td>
      <td colspan="1" align="center">0.072 ± 0.013</td>
      <td colspan="1" align="center">0.161 ± 0.025</td>
      <td colspan="1" align="center">0.15  ± 0.02</td>
      <td colspan="1" align="center">0.12 ± 0.02</td>
      <td colspan="1" align="center">0.094 ± 0.015</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>k<sub>f</sub></bold></td>
      <td colspan="1" align="center">2.4 ± 0.013</td>
      <td colspan="1" align="center">4.3 ± 1.0</td>
      <td colspan="1" align="center">4.9 ± 1.3</td>
      <td colspan="1" align="center">3.6 ± 0.8</td>
      <td colspan="1" align="center">2.7 ± 0.7</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>R<sub>1,f</sub> (s<sup>-1</sup>)</bold></td>
      <td colspan="1" align="center">0.93 ± 0.2</td>
      <td colspan="1" align="center">1.8 ± 0.3</td>
      <td colspan="1" align="center">1.78 ± 0.4</td>
      <td colspan="1" align="center">1.52 ± 0.2</td>
      <td colspan="1" align="center">1.26 ± 0.3</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>R<sub>1,r</sub> (s<sup>-1</sup>)</bold></td>
      <td colspan="1" align="center">1</td>
      <td colspan="1" align="center">1</td>
      <td colspan="1" align="center">1</td>
      <td colspan="1" align="center">1</td>
      <td colspan="1" align="center">1</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>T<sub>2,f</sub> (ms)</bold></td>
      <td colspan="1" align="center">56 ± 8</td>
      <td colspan="1" align="center">37 ± 8</td>
      <td colspan="1" align="center">38 ± 7</td>
      <td colspan="1" align="center">43 ± 6</td>
      <td colspan="1" align="center">52 ± 9</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>T<sub>2,r</sub> (μs)</bold></td>
      <td colspan="1" align="center">11.1 ± 8</td>
      <td colspan="1" align="center">12.3 ± 1.6</td>
      <td colspan="1" align="center">11.4 ± 1.4</td>
      <td colspan="1" align="center">10.3 ± 1.1</td>
      <td colspan="1" align="center">10.9 ± 1.4</td>
   </tr>
</table>
:::

:::{figure} #mtrFig1jn
:label: mtrPlot1
:enumerator:6.9
MTR values calculated from fundamental qMT tissue parameters for four different MTR imaging protocols.
:::

As demonstrated in the above simulations, one MTR value could have the same value for healthy tissue on one scanner as diseased tissue would have on another scanner. So for the most part, MTR is best used / compared within vendors at the very least, though some normalization techniques have been developed.

In addition to being very sensitive to protocol implementations, MTR values are also sensitive to other tissue properties. As seen in the qMT blog post, the parameter most closely related to macromolecular content is the pool-size ratio _F_. But, if some disease / symptom impacts _T_{sub}`1`  independently of underlying macromolecular content, MTR will also change. That is to say, MTR is sensitive to tissue’s _T_{sub}`1` value independently of the macromolecular content metric F, as shown in [](#mtrPlot2).

:::{figure} #mtrFig2jn
:label: mtrPlot2
:enumerator: 6.10
MTR value for (protocol?) and (tissue?) changes as a function of the underlying _T_{sub}`1` value (_T_{sub}`1,obs`obs or _T_{sub}`1,f`?).
:::

In addition to being sensitive to tissue properties, MTR is also sensitive to system properties such as _B_{sub}`1` (via MT pulse amplitude) and _B_{sub}`0` (via off-resonance frequency). In particular, _B_{sub}`1` can vary up to 30% the nominal value at 3T, and without correction this can introduce substantial  [](#mtrPlot3) illustrates how MTR can vary with different _B_{sub}`1` values.

:::{figure} #mtrFig3jn
:label: mtrPlot3
:enumerator: 6.11
MTR value for (protocol?) and (tissue?) changes as a function of the underlying _B_{sub}`1` value (_T_{sub}`1,obs`obs or _T_{sub}`1,f`?).
:::

Lastly, MTR is sensitive to protocol adjustments, which could be done by a scanner operator to accommodate issues during an imaging session. [](#mtrPlot4) demonstrates how MTR varies with TR adjustments.

:::{figure} #mtrFig4jn
:label: mtrPlot4
:enumerator: 6.12
MTR value for (protocol?) and (tissue?) changes as a function protocols TR value.
:::

:::{figure} #mtrFig5jn
:label: mtrPlot5
:enumerator: 6.13
Surface map
:::
