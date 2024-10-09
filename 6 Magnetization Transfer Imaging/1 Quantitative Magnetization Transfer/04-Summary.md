---
title: Summary
subtitle: Quantitative Magnetization Transfer
date: 2024-10-07
authors:
  - name: Juan Velezquez-Reyes
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

In summary, the Bloch-McConnell equations, an analytical solution to the steady-state signal can be derived and fitted with one of the existing models that make different approximations to fit the qMT data for a different set of parameters. The Sled and Pike model [@Sled2001-fz] constrains the solution space by computing complementary _T_{sub}`1` maps, whose acquisition method influences the _B_{sub}`1` sensitivity of the fitted parameters [@Boudreau2018-kv]. This fitting model can be implemented with a continuous or a rectangular wave irradiation of the restricted pool [@Cabana2015-zg]. Ramani’s fitting model is an alternative approach that assumes a continuous wave irradiation scheme with the MT pulse on both free and restricted pools [@Ramani2002-pq]. Another fitting model was proposed by Yarnykh [@Yarnykh2002-dq] where an analytical solution to describe the magnetization is found when the direct saturation of the free pool is neglected.

In future blog posts, we will explore other MT methods, such as MTR [@Wolff1989-ag], MTsat [@Helms2008-wf] and qMT-bSSFP [@Bieri2007-uy;@Gloor2008-wb]. Additionally, we will also be looking at the effects of RF field inhomogeneity on the generated magnetization transfer maps.