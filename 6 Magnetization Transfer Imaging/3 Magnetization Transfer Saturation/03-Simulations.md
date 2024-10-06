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

:::{figure} #mtsatFig1cell
:label: mtsatPlot1
MTsat values calculated from fundamental qMT tissue parameters for four different MTR imaging protocols.
:::

It's worth noting that MTsat values show a relatively wider range in values across protocols and tissue types (1% to 7%) when compared against our similar simulations for MTR (30%-60%). Additionally, note the change in order of magnitude of the values between MTsat (~5%) and MTR (~50%). As is demonstrated in the simulations above, MTsat values can be quite similar in both healthy and diseased tissues if different imaging protocols are used. So, for practical purposes, it's recommended to use and compare MTsat values that were measured using a consistent imaging protocol (which, due to some proprietary pulse sequence designs, means that consistency will be best when using the same MRI vendor and version for the study). Nevertheless, some normalization techniques have been developed to make MTsat more useful in broader contexts.

To assess the relationship between MTsat and T1, we conducted simulations by varying T1 values as inputs for a specific protocol. In Figure 5, we present the resulting data, which includes calculated MTR (based on MT-on and PDw measurements), MTsat, and T1meas values. As observed previously, MTR exhibits a high sensitivity to alterations in the tissue T1 values. Notably, the calculated T1 values closely mirror the input T1 values, evident in the identity line on the graph. MTsat shows minimal sensitivity to changes in T1, as even a ±30% variation in T1 values corresponds to only around a ±2% fluctuation in MTsat values.

:::{figure} #mtsatFig2cell
:label: mtsatPlot2
MTR//T1meas/MTsat vs T1 values
:::

Similarly, we can investigate the sensitivity of MTsat to B1, which varies substantially in the scanner at magnetic field strengths of 3T and above. In the human brain, B1 typically fluctuates the nominal flip angles within a range of -30% to 10% (Boudreau et al. 2017). Figure 5 displays the calculated MTR, MTsat, and T1 values using a range of B1 values +-30% to both the excitation and MT pulses. All three parameters demonstrate high sensitivity to changes in B1. Notably, while T1 is relatively insensitive to minor magnetic field variations, the calculated T1 values may deviate from accuracy. In contrast, the calculated MTsat inherently reflects the actual saturation induced by the MT pulse, which is directly proportional to B1. This relationship is expected since lower B1 values result in lower true MTsat values, which is particularly relevant when attempting to use MTsat as a biomarker for myelin content. To address this issue, an empirical equation (Weiskopf et al. 2013) has been introduced to estimate the MTsat value that would have been measured if B1 values had been uniform across the brain, although it's essential to emphasize that this is not a representation of the actual MTsat values the tissue experiences, but a means to standardize MTsat even in the presence of inhomogeneous B1 maps if/when RF transmit shimming isn’t done.

