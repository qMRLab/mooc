---
title: Theory
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

MTsat, like MTR and many flavours of quantitative MT, is based on spoiled gradient recalled echo (SPGR) images (Haase et al. 1986; Sekihara 1987; Hargreaves 2012) preceded by an off-resonance RF pulse to provide magnetization transfer contrast (Wolff and Balaban 1989; Henkelman et al. 1993; J. G. Sled and Pike 2000; John G. Sled 2018). Figure 1 presents a simplified diagram of this MT-prepared SPGR pulse sequence (imaging gradients are not shown). A standard SPGR sequence (low flip angle [~5-10°], short TR [~10-30ms], and a strong spoiler gradient) are preceded by a long (~10 ms) off-resonance (~1-5 kHz) pulse with a strong peak amplitude (the total pulse has an equivalent on-resonance flip angle of 200°-700°). A smooth shape (e.g. Gaussian or Fermi) is typically used for the off-resonance pulse in order to have a single off-resonance frequency (from Fourier analysis). A strong spoiler gradient is also added between the off-resonance MT-preparation pulse and the on-resonance excitation pulse in order to destroy residual transverse magnetization that may have been created by the off-resonance pulse. Images acquired without MT saturation are acquired using the same timing as this sequence, but with the off-resonance RF pulse either completely off or using a very large off-resonance frequency (e.g. ~30+ kHz).

```{math}
:label: mtrEq1
:enumerator:6.1
\begin{equation}
S\left( \alpha,\text{TR} \right)=A\text{sin}\left( \alpha \right)\frac{1-\text{e}^{-R_{1}\cdot \text{TR}}}{1-\text{cos}\left( \alpha \right) \text{e}^{-R_{1}\text{TR}}}
\end{equation}
```

where A is some proportionality constant (e.g. gyromagnetic ratio, density, coil sensitivity, etc), ɑ is the excitation flip angle, R1 = 1/T1 (assuming a monoexponential longitudinal relaxation curve), and TR is the repetition time. Similarly, an analytical equation for the steady-state signal of a dual-excitation SPGR experiment (Figure 2) can be derived, and (Helms et al. 2008) demonstrated it to be:

```{math}
:label: mtrEq2
:enumerator:6.2
\begin{equation}
S\left( \alpha_{1},\text{TR}_{1},\alpha_{2},\text{TR}_{2} \right)=A\text{sin}\left( \alpha _{1}\right)\frac{1-\text{e}^{-R_{1}\cdot \text{TR}}-\left( 1-\text{cos}\left( \alpha_{2} \right) \right)\cdot \left[ 1- \text{e}^{-R_{1}\text{TR}_{1}}\right]\cdot \text{e}^{-R_{1}\text{TR}_{2}}}{1-\text{cos}\left( \alpha_{1} \right)\text{cos}\left( \alpha_{2} \right) \text{e}^{-R_{1}\text{TR}}}
\end{equation}
```

where alpha 1 is the imaging excitation flip angle, alpha 2 is the excitation flip angle representing the MT saturation pulse, TR1 is the time between alpha1 to alpha2, TR2 is the time between alpha2 and the following alpha 1, and TR = TR1 + TR2. 

Equation 2 has three unknowns: A, R1, and alpha2. Of these three, alpha2 is expected to be the most sensitive to macromolecular density via the MT effect, and as such is the parameter that we’d like to calculate or fit using this dual-excitation SPGR model for the MT-prepared SPGR pulse sequence. Although there would be some ways to acquire additional measurements (three unknowns, so at a minimum three measurements are needed) and apply a nonlinear fit to Equation 2 to extract alpha2, this method has a long numerical processing time. To shorten the calculation of the parameter maps, (Helms et al. 2008, 2010) proposed some reasonable assumptions that can be made to simplify Equation 2. The first proposed assumption is that R1*TR << 1, which is true when using typical MT-weighted SPGR protocol parameters (TR ~ 0.01-0.05 s) and in the brain at clinical field strengths (T1 ~ 1 s, thus R1 ~ 1 s-1). The same approximation applies to TR1 and TR2, which are shorter than TR. This leads to the removal of all exponential functions in Equation 2, as via the Taylor expansion of the exponential function, exp(x) ~ 1 + x when abs(x) << 1, and the removal of another term via R1TR1 * R1TR2 ~ 0 when R1TR1 and R1TR2 are both << 1. The simplifications result in

```{math}
:label: mtrEq3
:enumerator:6.3
\begin{equation}
S\left( \alpha_{1},\text{TR}_{1},\alpha_{2},\text{TR}_{2} \right)=A\text{sin}\left( \alpha _{1}\right)\frac{R_{1}\text{TR}-\left( 1-\text{cos}\left( \alpha_{2} \right) \right)\cdot R_{1}\cdot \text{TR}_{1}}{1-\text{cos}\left( \alpha_{1} \right)\text{cos}\left( \alpha_{2} \right)R_{1}\cdot \text{TR}_{1}}
\end{equation}
```

The second approximation is that alpha2 is small (less than 30 degrees), which is to say that the MT saturation is relatively small. This is expected to be true for the tissue properties of the brain (mostly, myelin), but care must be taken with the planned MT pulse parameters as the MT saturation increases with smaller offset frequency and high peak pulse amplitude. Later, we’ll calculate if this is a reasonable assumption for the calculated alpha2. This assumption is integrated into Equation 2 via the Taylor series expansion of the cos(alpha2), where cos(x) ~ 1-x2/2 for small x (this relationship is true for x < 30 degrees or 0.5 radians). Introducing this approximation in [3] and with the additional simplifications alpha22 * R1*TR ~ 0 (from the assumptions above), this results in

```{math}
:label: mtrEq4
:enumerator:6.4
\begin{equation}
S\left( \alpha_{1},\alpha_{2},\text{TR} \right)=A\text{sin}\left( \alpha _{1}\right)\frac{R_{1}\text{TR}}{1-\text{cos}\left( \alpha_{1} \right)+\text{cos}\left( \alpha_{1} \right) \left(\frac{\alpha^{2}_{2}}{2} R_{1}\cdot \text{TR}_{1} \right)} 
\end{equation}
```

Note how the signal no longer has a dependency on the individual TR1 and TR2 values, but only on the full TR. The final approximation is isomorphic to the previous one, but for the imaging excitation RF pulse, that is to say, that alpha1 is small (less than 30 degrees). This is a controllable approximation, as it is a controllable protocol parameter at the scanner. From this assumption,  cos(alpha1) ~ 1-alpha12/2 and sin(alpha1) ~ alpha1 (from the Taylor series expansion), so introducing both of these into [4] and simplifying alpha12 * R1*TR ~ 0 and alpha12*alpha22 ~ 0 leads to

```{math}
:label: mtrEq5
:enumerator:6.5
\begin{equation}
S\left( \alpha_{1},\alpha_{2},\text{TR} \right)=A \alpha _{1}\frac{R_{1}\text{TR}}{\frac{\alpha^{2}_{1}}{2}+\frac{\alpha^{2}_{2}}{2} +R_{1}\cdot \text{TR}_{1} }
\end{equation}
```

The term alpha2^2/2 is the only term that includes an MT effect in equation 5, and thus will be defined as delta = alpha2^2/2.

```{math}
:label: mtrEq5
:enumerator:6.5
\begin{equation}
S\left( \alpha_{1},\alpha_{2},\text{TR} \right)=A \alpha _{1}\frac{R_{1}\text{TR}}{\frac{\alpha^{2}_{1}}{2}+\delta +R_{1}\cdot \text{TR}_{1} } 
\end{equation}
```

Figure 3 demonstrates how delta, which represents MTsat as was defined in (Helms et al. 2008), is the fractional reduction in longitudinal magnetization after the MT pulse in the MTsat model illustrated in Figure 2 relative to the Mz prior to the pulse. Conventionally, MTsat (delta) is reported in percentage, so MTsat = delta * 100.

```{figure} img/mtsat_trig.png
:label: mtsatFig3
:enumerator: 6.3
Demonstration through trigonometry of how following a small flip angle alpha2 (eg MT saturation), the value delta = alpha2^2/2 represents the fraction of the reduction in longitudinal magnetization due to the pulse (bigDelta) relative to the value prior to the pulse (Mzbefore).
```

Before jumping into how to measure MTsat, let's demonstrate some expected properties and values using known values from a simpler MTR experiment. From the MTR protocol in (Brown, Narayanan, and Arnold 2013) of the MTR blog post, 1=15 deg and TR = 0.03 s, so assuming a T1 at 1.5T (field strength that Brown used) of 0.55 s in healthy WM, so R1 = 1.8. First off, Eq. 5 with no MT pulse (thus delta = 0) should converge close to the well-known SPGR equation [1]. Inputting the values in each equations, we get 0.0816*A for [1], and 0.0815*A, thus they are in close agreement. Next, we can get an estimated value of MTsat, using a known MTR value, the calculated S0 value (which we just did), and then solving [5] for delta using the MTR equation to bring everything together. Doing so is shown in [Appendix 6A](#mtsatAppendixA), from there and using our simulations in the MTR post with Brown2013 for healthier WM (MTR = 46%), we get an MTsat value of 4.92% (delta = 0.0492), which is close to some reported MTsat values in the literature (Karakuzu et al. 2022). From there, and by definition of delta, the modeled alpha2 in Figure 2 for this example is 18 degrees, confirming that earlier assumption that alpha2 < 30 degrees for that approximation.

In that example, we used a known T1 value to extract MTsat using a two-measurement MTR experiment, but in practice this value is not known and varies per-pixel across tissues. Although we could use an additionally measured T1 map to do this, this can be time consuming depending on the method used. (Helms et al. 2008, 2010) thus demonstrated that with one additional T1w measurement that uses no MT preparation pulse but has different alpha1/TR than the MTon (MTw) and MToff (PDw) measurements used for MTR, that MTsat can be calculated analytically, and as a bonus a T1 map is also calculated in the process. (This makes sense, as the VFA T1 mapping sequence is often just two SPGR measurements with different alpha values). Thus, using this three measurement protocol (MTw/PDw/T1w, which we’ll call the MTsat protocol), MTsat and T1 (1/R1) can be calculated analytically pixelwise using the following set of equations (derived from Eq. 5):

```{math}
:label: mtrEq6
:enumerator:6.6
\begin{equation}
MTsat=\left( A_{app}\cdot \frac{\alpha_{MT}}{S_{MT}}-1 \right)\cdot R_{1}\text{TR}_{\text{MT}}-\frac{\alpha_{MT}^{2}}{2}
\end{equation}
```

```{math}
:label: mtrEq7
:enumerator:6.7
A_{app}=S_{PD}S_{T_{1}}\frac{\text{TR}_{\text{PD}}\frac{\alpha_{T_{1}}}{\alpha_{PD}}-\text{TR}_{T_{1}}\frac{\alpha_{PD}}{\alpha_{T_{1}}}}{\text{TR}_{\text{PD}}S_{T_{1}}\alpha_{T_{1}}-\text{TR}_{T_{1}}S_{PD}\alpha_{PD}}
```

```{math}
:label: mtrEq8
:enumerator:6.8
R_{1}=\frac{1}{2}\cdot \frac{\frac{S_{T_{1}}\alpha_{T_{1}}}{\text{TR}_{T_{1}}}-\frac{S_{PD}\alpha_{PD}}{\text{TR}_{PD}}}{\frac{S_{PD}}{\alpha_{PD}}-\frac{S_{T_{1}}}{\alpha_{T_{1}}}}
```


Remember, like MTR, MTsat is calculated from the equations above following the acquisition of the protocol images; no numerical fitting to a model is required. So effectively, the processing time to produce MTsat maps is the same as MTR, which is nearly instantaneous. Also, unlike MTR, which represents the steady-state signal difference due to the MT effect, MTsat represents the fraction of the longitudinal magnetization saturation caused by a single MT pulse within a TR, after a steady-state is achieved. Conventionally, it is represented as a percentage %, so MTsat is typically reported as delta * 100. Note that MTR and MTsat are not expected to have the same values in magnitude despite both being represented as %, as they represent different changes. A major benefit of MTsat is that it’s expected to have less T1-dependency than MTR, as T1 (1/R1) is separately calculated and accounted for in the calculation of MTsat using the equations above. Although the MTsat metric is more robust against T1 changes, it is inherently sensitive to the MT preparation pulse properties (due to what MTsat physically represents, which is the saturation due to the MT pulse), and thus MTsat is not truly considered a fully quantitative metric as its value will change depending on the chosen protocol parameters and is not solely specific to the tissue properties or the field properties. Table 1 lists some MTsat protocol parameters that have been reported in the literature.

:::{table}  Some reported MTsat protocol parameters in the scientific literature.
:label: mtsatProtocolTable
:enumerator: 6.3 

<table>
   <tr>
      <th colspan="3" align="center"></th>
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
      <th colspan="1" rowspan="2" align="left"><bold>T1w</bold></td>
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