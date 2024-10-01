---
title: Signal Modelling
subtitle: Inversion Recovery
date: 2024-07-25
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  figure:
    template: Fig. %s
---

## Articles with code vs articles from code
The steady-state longitudinal magnetization of an inversion recovery experiment can be derived from the Bloch equations for the pulse sequence {θ<sub>180</sub> – TI – θ<sub>90</sub> – (TR-TI)}, and is given by:

\begin{equation}\label{eq:1}
M_{z}(TI) = M_0 \frac{1-\text{cos}(\theta_{180})e^{- \frac{TR}{T_1}} -[1-\text{cos}(\theta_{180})]e^{- \frac{TI}{T_1}}}{1 - \text{cos}(\theta_{180}) \text{cos}(\theta_{90}) e^{- \frac{TR}{T_1}}}
\end{equation}

where M<sub>z</sub> is the longitudinal magnetization prior to the θ<sub>90</sub> pulse. If the in-phase real signal is desired, it can be calculated by multiplying Eq. 1 by <i>k</i>sin(θ<sub>90</sub>)e<sup>-TE/T<sub>2</sub></sup>, where <i>k</i> is a constant. This general equation can be simplified by grouping together the constants for each measurements regardless of their values (i.e. at each TI, same TE and θ<sub>90</sub> are used) and assuming an ideal inversion pulse:

\begin{equation}\label{eq:2}
M_z(TI) = C(1-2e^{- \frac{TI}{T_1}} + e^{- \frac{TR}{T_1}})
\end{equation}

where the first three terms and the denominator of Eq. 1 have been grouped together into the constant C. If the experiment is designed such that TR is long enough to allow for full relaxation of the magnetization (TR > 5T<sub>1</sub>), we can do an additional approximation by dropping the last term in Eq. 2:

\begin{equation}\label{eq:3}
M_z(TI) = C(1-2e^{- \frac{TI}{T_1}})
\end{equation}

The simplicity of the signal model described by Eq. 3, both in its equation and experimental implementation, has made it the most widely used equation to describe the signal evolution in an inversion recovery T<sub>1</sub> mapping experiment. The magnetization curves are plotted in Figure 2 for approximate T<sub>1</sub> values of three different tissues in the brain. Note that in many practical implementations, magnitude-only images are acquired, so the signal measured would be proportional to the absolute value of Eq. 3.
