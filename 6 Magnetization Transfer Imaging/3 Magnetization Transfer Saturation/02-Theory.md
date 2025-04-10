---
title: Theory
subtitle: Magnetization Transfer Saturation
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


As has been derived in many introductory MRI physics textbooks, the steady-state signal equation for a standard SPGR pulse sequence (that is, one excitation flip angle per entire TR) has been shown to be:

```{math}
:label: mtsatEq1
:enumerator:6.8
\begin{equation}
S\left( \alpha,\text{TR} \right)=A\text{sin}\left( \alpha \right)\frac{1-\text{e}^{-R_{1}\cdot \text{TR}}}{1-\text{cos}\left( \alpha \right) \text{e}^{-R_{1}\text{TR}}}
\end{equation}
```

where A is some proportionality constant (e.g. gyromagnetic ratio, density, coil sensitivity, etc), ɑ is the excitation flip angle, _R_{sub}`1` = 1/_T_{sub}`1` (assuming a monoexponential longitudinal relaxation curve), and TR is the repetition time. Similarly, an analytical equation for the steady-state signal of a dual-excitation SPGR experiment ([](#mtsatFig2)) can be derived, and [@Helms2008-wf] demonstrated it to be:

```{math}
:label: mtsatEq2
:enumerator:6.9
\begin{equation}
S\left( \alpha_{1},\text{TR}_{1},\alpha_{2},\text{TR}_{2} \right)=A\text{sin}\left( \alpha _{1}\right)\frac{1-\text{e}^{-R_{1}\cdot \text{TR}}-\left( 1-\text{cos}\left( \alpha_{2} \right) \right)\cdot \left[ 1- \text{e}^{-R_{1}\text{TR}_{1}}\right]\cdot \text{e}^{-R_{1}\text{TR}_{2}}}{1-\text{cos}\left( \alpha_{1} \right)\text{cos}\left( \alpha_{2} \right) \text{e}^{-R_{1}\text{TR}}}
\end{equation}
```

where {math}`\alpha_{1}` is the imaging excitation flip angle, {math}`\alpha_{2}` is the excitation flip angle representing the MT saturation pulse, TR{sub}`1` is the time between {math}`\alpha_{1}` to {math}`\alpha_{2}`, TR{sub}`2` is the time between {math}`\alpha_{2}` and the following {math}`\alpha_{1}`, and TR = TR{sub}`1` + TR{sub}`2`. 

 [](#mtsatEq2) has three unknowns: _A_, _R_{sub}`1`, and {math}`\alpha_{2}`. Of these three, {math}`\alpha_{2}` is expected to be the most sensitive to macromolecular density via the MT effect, and as such is the parameter that we’d like to calculate or fit using this dual-excitation SPGR model for the MT-prepared SPGR pulse sequence. Although there would be some ways to acquire additional measurements (three unknowns, so at a minimum three measurements are needed) and apply a nonlinear fit to  [](#mtsatEq2) to extract {math}`\alpha_{2}`, this method has a long numerical processing time. To shorten the calculation of the parameter maps, [@Helms2008-wf;@Helms2010-kv] (Helms et al. 2008, 2010) proposed some reasonable assumptions that can be made to simplify  [](#mtsatEq2). The first proposed assumption is that _R_{sub}`1`TR << 1, which is true when using typical MT-weighted SPGR protocol parameters (TR ~ 0.01-0.05 s) and in the brain at clinical field strengths (_T_{sub}`1` ~ 1 s, thus _R_{sub}`1` ~ 1 s{sup}`-1`). The same approximation applies to TR{sub}`1` and TR{sub}`2`, which are shorter than TR. This leads to the removal of all exponential functions in  [](#mtsatEq2), as via the Taylor expansion of the exponential function, exp(x) ~ 1 + x when abs(x) << 1, and the removal of another term via R{sub}`1`TR{sub}`1`R{sub}`1`TR{sub}`2` ~ 0 when R{sub}`1`TR{sub}`1` and R{sub}`1`TR{sub}`2` are both << 1. The simplifications result in

```{math}
:label: mtsatEq3
:enumerator:6.10
\begin{equation}
S\left( \alpha_{1},\text{TR}_{1},\alpha_{2},\text{TR}_{2} \right)=A\text{sin}\left( \alpha _{1}\right)\frac{R_{1}\text{TR}-\left( 1-\text{cos}\left( \alpha_{2} \right) \right)\cdot R_{1}\cdot \text{TR}_{1}}{1-\text{cos}\left( \alpha_{1} \right)\text{cos}\left( \alpha_{2} \right)R_{1}\cdot \text{TR}_{1}}
\end{equation}
```

The second approximation is that {math}`\alpha_{2}` is small (less than 30 degrees), which is to say that the MT saturation is relatively small. This is expected to be true for the tissue properties of the brain (mostly, myelin), but care must be taken with the planned MT pulse parameters as the MT saturation increases with smaller offset frequency and high peak pulse amplitude. Later, we’ll calculate if this is a reasonable assumption for the calculated {math}`\alpha_{2}`. This assumption is integrated into [](#mtsatEq2) via the Taylor series expansion of the {math}`\text{cos} \left( \alpha_{2} \right)`, where {math}`\text{cos} \left( x \right) \approx 1-x^{2}/2` for small x (this relationship is true for x < 30 degrees or 0.5 radians). Introducing this approximation in [3] and with the additional simplifications {math}`\alpha_{2}^{2}`R{sub}`1`TR ~ 0 (from the assumptions above), this results in

```{math}
:label: mtsatEq4
:enumerator:6.11
\begin{equation}
S\left( \alpha_{1},\alpha_{2},\text{TR} \right)=A\text{sin}\left( \alpha _{1}\right)\frac{R_{1}\text{TR}}{1-\text{cos}\left( \alpha_{1} \right)+\text{cos}\left( \alpha_{1} \right) \left(\frac{\alpha^{2}_{2}}{2} R_{1}\cdot \text{TR}_{1} \right)} 
\end{equation}
```

Note how the signal no longer has a dependency on the individual TR{sub}`1` and TR{sub}`2` values, but only on the full TR. The final approximation is isomorphic to the previous one, but for the imaging excitation RF pulse, that is to say, that {math}`\alpha_{1}` is small (less than 30 degrees). This is a controllable approximation, as it is a controllable protocol parameter at the scanner. From this assumption,  {math}`\text{cos}\left( \alpha_{1} \right) \approx 1-\alpha_{1}^{2}/2`  and {math}`\text{sin}\left( \alpha_{1} \right) \approx \alpha_{1}` (from the Taylor series expansion), so introducing both of these into [](#mtsatEq4) and simplifying {math}` \approx \alpha_{1}^{2} \cdot R_{1} \cdot \text{TR} \approx 0` and  {math}` \approx \alpha_{1}^{2} \cdot \alpha_{2}^{2} \approx 0` leads to

```{math}
:label: mtsatEq5
:enumerator:6.5
\begin{equation}
S\left( \alpha_{1},\alpha_{2},\text{TR} \right)=A \alpha _{1}\frac{R_{1}\text{TR}}{\frac{\alpha^{2}_{1}}{2}+\frac{\alpha^{2}_{2}}{2} +R_{1}\cdot \text{TR}_{1} }
\end{equation}
```

The term {math}`\alpha_{2}^{2}/2` is the only term that includes an MT effect in [](#mtsatEq5), and thus will be defined as {math}`\delta \equiv \alpha_{2}^{2}/2`.

```{math}
:label: mtsatEq6
:enumerator:6.6
\begin{equation}
S\left( \alpha_{1},\alpha_{2},\text{TR} \right)=A \alpha _{1}\frac{R_{1}\text{TR}}{\frac{\alpha^{2}_{1}}{2}+\delta +R_{1}\cdot \text{TR}_{1} } 
\end{equation}
```

[](#mtsatFig3) demonstrates how {math}`\delta`, which represents MTsat as was defined in [@Helms2008-wf], is the fractional reduction in longitudinal magnetization after the MT pulse in the MTsat model illustrated in [](#mtsatFig2) relative to the Mz prior to the pulse. Conventionally, MTsat ({math}`\delta`) is reported in percentage, so {math}`\text{MTsat} = \delta \cdot 100` .

```{figure} img/mtsat_trig.png
:label: mtsatFig3
:enumerator: 6.16
Demonstration through trigonometry of how following a small flip angle {math}`\alpha_{2}` (eg MT saturation), the value {math}`\delta \equiv \alpha_{2}^{2}/2` represents the fraction of the reduction in longitudinal magnetization due to the pulse (bigDelta) relative to the value prior to the pulse (Mz{sub}`before`).
```

Before jumping into how to measure MTsat, let's demonstrate some expected properties and values using known values from a simpler MTR experiment. From the MTR protocol in [@Brown2013-eg] of the MTR section, {math}`\alpha_{1}`=15 deg and TR = 0.03 s, so assuming a _T_{sub}`1` at 1.5T (field strength that Brown used) of 0.55 s in healthy WM, so R{sub}`1` = 1.8. First off, [](#mtsatFig3) with no MT pulse (thus {math}`\delta` = 0) should converge close to the well-known SPGR equation ([](#mtsatEq1)). Inputting the values in each equations, we get 0.0816A for [1], and 0.0815A, thus they are in close agreement. Next, we can get an estimated value of MTsat, using a known MTR value, the calculated S0 value (which we just did), and then solving [5] for {math}`\delta` using the MTR equation to bring everything together. Doing so is shown in [Appendix A](#mtsatAppendixA), from there and using our simulations in the MTR post with [@Brown2013-eg] for healthier WM (MTR = 46%), we get an MTsat value of 4.92% ({math}`\delta` = 0.0492), which is close to some reported MTsat values in the literature (Karakuzu et al. 2022). From there, and by definition of {math}`\delta`, the modeled {math}`\alpha_{2}` in [](#mtsatFig2) for this example is 18 degrees, confirming that earlier assumption that {math}`\alpha_{2}` < 30 degrees for that approximation.

In that example, we used a known _T_{sub}`1` value to extract MTsat using a two-measurement MTR experiment, but in practice this value is not known and varies per-pixel across tissues. Although we could use an additionally measured _T_{sub}`1` map to do this, this can be time consuming depending on the method used. (Helms et al. 2008, 2010) thus demonstrated that with one additional T1w measurement that uses no MT preparation pulse but has different {math}`\alpha_{1}`/TR than the MTon (MTw) and MToff (PDw) measurements used for MTR, that MTsat can be calculated analytically, and as a bonus a _T_{sub}`1` map is also calculated in the process. (This makes sense, as the VFA _T_{sub}`1` mapping sequence is often just two SPGR measurements with different {math}`\alpha` values). Thus, using this three measurement protocol (MTw/PDw/T1w, which we’ll call the MTsat protocol), MTsat and _T_{sub}`1` (1/R{sub}`1`) can be calculated analytically pixelwise using the following set of equations (derived from [](#mtsatEq5)):

```{math}
:label: mtsatEq7
:enumerator:6.7
\begin{equation}
MTsat=\left( A_{app}\cdot \frac{\alpha_{MT}}{S_{MT}}-1 \right)\cdot R_{1}\text{TR}_{\text{MT}}-\frac{\alpha_{MT}^{2}}{2}
\end{equation}
```

```{math}
:label: mtsatEq8
:enumerator:6.8
A_{app}=S_{PD}S_{T_{1}}\frac{\text{TR}_{\text{PD}}\frac{\alpha_{T_{1}}}{\alpha_{PD}}-\text{TR}_{T_{1}}\frac{\alpha_{PD}}{\alpha_{T_{1}}}}{\text{TR}_{\text{PD}}S_{T_{1}}\alpha_{T_{1}}-\text{TR}_{T_{1}}S_{PD}\alpha_{PD}}
```

```{math}
:label: mtsatEq9
:enumerator:6.9
R_{1}=\frac{1}{2}\cdot \frac{\frac{S_{T_{1}}\alpha_{T_{1}}}{\text{TR}_{T_{1}}}-\frac{S_{PD}\alpha_{PD}}{\text{TR}_{PD}}}{\frac{S_{PD}}{\alpha_{PD}}-\frac{S_{T_{1}}}{\alpha_{T_{1}}}}
```


Remember, like MTR, MTsat is calculated from the equations above following the acquisition of the protocol images; no numerical fitting to a model is required. So effectively, the processing time to produce MTsat maps is the same as MTR, which is nearly instantaneous. Also, unlike MTR, which represents the steady-state signal difference due to the MT effect, MTsat represents the fraction of the longitudinal magnetization saturation caused by a single MT pulse within a TR, after a steady-state is achieved. Conventionally, it is represented as a percentage %, so MTsat is typically reported as {math}`\delta \cdot 100`. Note that MTR and MTsat are not expected to have the same values in magnitude despite both being represented as %, as they represent different changes. A major benefit of MTsat is that it’s expected to have less _T_{sub}`1`-dependency than MTR, as _T_{sub}`1` (1/R{sub}`1`) is separately calculated and accounted for in the calculation of MTsat using the equations above. Although the MTsat metric is more robust against _T_{sub}`1` changes, it is inherently sensitive to the MT preparation pulse properties (due to what MTsat physically represents, which is the saturation due to the MT pulse), and thus MTsat is not truly considered a fully quantitative metric as its value will change depending on the chosen protocol parameters and is not solely specific to the tissue properties or the field properties. [](#mtsatProtocolTable)lists some MTsat protocol parameters that have been reported in the literature.

:::{table}  Some reported MTsat protocol parameters in the scientific literature (sources: [@Helms2008-wf;@Weiskopf2013-lp;@Campbell2018-hi;@Karakuzu2022-af;@York2022-fl])
:label: mtsatProtocolTable
:enumerator: 6.4 

<table>
   <tr>
      <th colspan="2" align="center"></th>
      <th colspan="1" align="center">Helms 2008</th>
      <th colspan="1" align="center">Weiskopf 2013</th>
      <th colspan="1" align="center">Campbell 2018</th>
      <th colspan="2" align="center">Karakuzu 2022</th>
      <th colspan="1" align="center">York 2022</th>

   </tr>
   <tr>
      <th colspan="2" align="center"></th>
      <th colspan="1" align="center">Siemens</th>
      <th colspan="1" align="center">Siemens</th>
      <th colspan="1" align="center">Siemens</th>
      <th colspan="1" align="center">GE</th>
      <th colspan="1" align="center">Siemens</th>
      <th colspan="1" align="center">Siemens</th>
   </tr>
   <tr>
      <th colspan="1" rowspan="3" align="left"><bold>T1w</bold></td>
      <th colspan="1" rowspan="1"align="center">FA</td>
      <td colspan="1" align="center">15</td>
      <td colspan="1" align="center">20</td>
      <td colspan="1" align="center">15</td>
      <td colspan="1" align="center">20</td>
      <td colspan="1" align="center">20</td>
      <td colspan="1" align="center">18</td>
   </tr>
   <tr>
      <th colspan="1" align="center"><bold>TR (ms)</bold></td>
      <td colspan="1" align="center">11</td>
      <td colspan="1" align="center">18.7</td>
      <td colspan="1" align="center">11</td>
      <td colspan="1" align="center">18</td>
      <td colspan="1" align="center">18</td>
      <td colspan="1" align="center">15</td>
   </tr>
   <tr>
      <th colspan="1" align="center"><bold>TE (ms)</bold></td>
      <td colspan="1" align="center">4.92</td>
      <td colspan="1" align="center">2.2–14.7</td>
      <td colspan="1" align="center">-</td>
      <td colspan="1" align="center">4</td>
      <td colspan="1" align="center">4</td>
      <td colspan="1" align="center">1.54/4.55/8.49</td>
   </tr>
   <tr>
      <th colspan="1" rowspan="3" align="left"><bold>PDw</bold></td>
      <th colspan="1" rowspan="1"align="center">FA</td>
      <td colspan="1" align="center">5</td>
      <td colspan="1" align="center">6</td>
      <td colspan="1" align="center">5</td>
      <td colspan="1" align="center">6</td>
      <td colspan="1" align="center">6</td>
      <td colspan="1" align="center">5</td>
   </tr>
   <tr>
      <th colspan="1" align="center"><bold>TR (ms)</bold></td>
      <td colspan="1" align="center">25</td>
      <td colspan="1" align="center">23.7</td>
      <td colspan="1" align="center">30</td>
      <td colspan="1" align="center">32</td>
      <td colspan="1" align="center">32</td>
      <td colspan="1" align="center">30</td>
   </tr>
   <tr>
      <th colspan="1" align="center"><bold>TE (ms)</bold></td>
      <td colspan="1" align="center">4.92</td>
      <td colspan="1" align="center">2.2–14.7</td>
      <td colspan="1" align="center">-</td>
      <td colspan="1" align="center">4</td>
      <td colspan="1" align="center">4</td>
      <td colspan="1" align="center">1.54/4.55/8.49</td>
   </tr>
      <th colspan="1" rowspan="7" align="left"><bold>MTw</bold></td>
      <th colspan="1" rowspan="1"align="center">FA</td>
      <td colspan="1" align="center">5</td>
      <td colspan="1" align="center">6</td>
      <td colspan="1" align="center">5</td>
      <td colspan="1" align="center">6</td>
      <td colspan="1" align="center">6</td>
      <td colspan="1" align="center">5</td>
   </tr>
   <tr>
      <th colspan="1" align="center"><bold>TR (ms)</bold></td>
      <td colspan="1" align="center">25</td>
      <td colspan="1" align="center">23.7</td>
      <td colspan="1" align="center">30</td>
      <td colspan="1" align="center">32</td>
      <td colspan="1" align="center">32</td>
      <td colspan="1" align="center">30</td>
   </tr>
   <tr>
      <th colspan="1" align="center"><bold>TE (ms)</bold></td>
      <td colspan="1" align="center">4.92</td>
      <td colspan="1" align="center">2.2–14.7</td>
      <td colspan="1" align="center">-</td>
      <td colspan="1" align="center">4</td>
      <td colspan="1" align="center">4</td>
      <td colspan="1" align="center">1.54/4.55/8.49</td>
   </tr>
   <tr>
      <th colspan="1" align="center"><bold>Offset (Hz)</bold></td>
      <td colspan="1" align="center">2200</td>
      <td colspan="1" align="center">2000</td>
      <td colspan="1" align="center">2200</td>
      <td colspan="1" align="center">1200</td>
      <td colspan="1" align="center">1200</td>
      <td colspan="1" align="center">1200</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>MT pulse shape</bold></td>
      <td colspan="1" align="center">Gaussian</td>
      <td colspan="1" align="center">Gaussian</td>
      <td colspan="1" align="center">-</td>
      <td colspan="1" align="center">Fermi</td>
      <td colspan="1" align="center">Gaussian</td>
      <td colspan="1" align="center">Gaussian</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>MT pulse length (ms)</bold></td>
      <td colspan="1" align="center">12.8</td>
      <td colspan="1" align="center">4</td>
      <td colspan="1" align="center">-</td>
      <td colspan="1" align="center">8</td>
      <td colspan="1" align="center">10</td>
      <td colspan="1" align="center">9.984</td>
   </tr>
   <tr>
      <th colspan="1" align="left"><bold>MT pulse angle (deg)</bold></td>
      <td colspan="1" align="center">540</td>
      <td colspan="1" align="center">220</td>
      <td colspan="1" align="center">540</td>
      <td colspan="1" align="center">540</td>
      <td colspan="1" align="center">540</td>
      <td colspan="1" align="center">500</td>
   </tr>
</table>
:::