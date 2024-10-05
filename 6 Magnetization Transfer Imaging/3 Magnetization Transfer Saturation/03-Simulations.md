---
title: Simulations
subtitle: Magnetization Transfer Saturation
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

In line with our previous MTR blog post, we employ the qMRLab qMT simulations to model MTsat measurements and subsequently calculate MTsat values from equations 7-9. Table 2 lists the essential tissue parameters used for the simulations. Figure 4 plots the MTsat values that have been calculated for each protocol outlined in Table 1, while also incorporating the relevant tissue parameters found in Table 2.




:::{table} Quantitative MT parameters in healthy and diseased human tissue reported for a study at 1.5 T (Sled 2001). 
:label: qmtParamsTable2
:enumerator: 6.4
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
