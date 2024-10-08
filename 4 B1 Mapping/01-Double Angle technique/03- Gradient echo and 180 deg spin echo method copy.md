---
title: Gradient echo and 180 degree spin echo method
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

This pulse sequence uses a 180 degree spin-echo refocusing pulse and acquires two images using an excitation pulse α and 2α. It assumes that there is full signal recovery (long TR), and because it refocuses _T_{sub}`2`{sup}`*`, it eliminates signal variability caused by _B_{sub}`0` in the resulting _B_{sub}`1` map (Insko and Bolinger 1993). Alternatively, a gradient echo could be used?

Assuming an an refocusing pulse is used (i.e. isn’t dependent on _B_{sub}`1`), we can develop the equation for a gradient echo and spin echo case.

```{math}
:label: daEq1
:enumerator:4.1
\begin{equation}
M_{\alpha}=M_{0}\text{sin}\left( \alpha \right)\text{e}^{\left( -\frac{TE}{T_{2}} \right)}
\end{equation}
```


```{math}
:label: daEq2
:enumerator:4.2
\begin{equation}
M_{2\alpha}=M_{0}\text{sin}\left( 2\alpha \right)\text{e}^{\left( -\frac{TE}{T_{2}} \right)}
\end{equation}
```



Thus


```{math}
:label: daEq3
:enumerator:4.3
\begin{equation}
\frac{M_{\alpha}}{\text{sin}\left(\alpha \right)}=\frac{M_{2\alpha}}{\text{sin}\left(2\alpha \right)}
\end{equation}
```

and

```{math}
:label: daEq4
:enumerator:4.4
\begin{equation}
\frac{M_{2\alpha}}{M_{\alpha}}=\frac{\text{sin}\left(2\alpha \right)}{\text{sin}\left(\alpha \right)}
\end{equation}
```

Using a well known trigonometry identity (see [Appendix A](#daAppendixA) for derivation),


```{math}
:label: daEq5
:enumerator:4.5
\begin{equation}
\text{sin}\left( 2\alpha \right)=2\text{sin}\left( \alpha \right)\text{cos}\left( \alpha \right)
\end{equation}
```

We can simplify [](#daEq5),

```{math}
:label: daEq6
:enumerator:4.6
\begin{equation}
\frac{M_{2\alpha}}{M_{\alpha}}=\frac{2\text{sin}\left( \alpha \right)\text{cos}\left( \alpha \right)}{\text{sin}\left(\alpha \right)}
\end{equation}
```

```{math}
:label: daEq7
:enumerator:4.7
\begin{equation}
\frac{M_{2\alpha}}{M_{\alpha}}=2\text{cos}\left( \alpha \right)
\end{equation}
```

And the true flip angle can be calculated from the ratio of these two magnetizations / signals / images:


```{math}
:label: daEq8
:enumerator:4.8
\begin{equation}
\alpha=\text{arcos}\left( \frac{M_{2\alpha}}{2M_{\alpha}} \right)
\end{equation}
```

Knowing that alpha = _B_{sub}`1` alpha_nominal, _B_{sub}`1` is thus:


```{math}
:label: daEq9
:enumerator:4.9
\begin{equation}
B_{1}=\frac{\text{arcos}\left( \frac{M_{2\alpha}}{2M_{\alpha}} \right)}{\alpha_{nominal}}
\end{equation}
```

:::{figure} #daFig1cell
:label: daPlot1
:enumerator: 4.2
_B_{sub}`1` computed from analytical GRE equations for DA sequence
:::

This equation is also used for alpha-180 spin echo pulses, however it assumes no dependency on of the refocusing pulse on _B_{sub}`1`. [](#daPlot2) explores this using Bloch simulations

:::{figure} #daFig2cell
:label: daPlot2
:enumerator: 4.3
_B_{sub}`1` computed from bloch simulations for ideal spin echo and refocusing pulse where FA = 180*_B_{sub}`1`
:::


:::{figure} #daFig3cell
:label: daPlot3
:enumerator: 4.4
_B_{sub}`1` computed from bloch simulations for spin echo with refocusing pulse where FA = 180*_B_{sub}`1`,, and composite pulse 90x-180y-90x where each 90 and 180 are also multiplied by _B_{sub}`1`.
:::


