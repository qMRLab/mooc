---
title: Benefits and Pitfalls
subtitle: Variable Flip Angle
date: 2024-07-25
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

It has been well reported in recent years that the accuracy of VFA [T<sub>1</sub>](wiki:Spin–lattice_relaxation) estimates is very sensitive to pulse sequence implementations {cite:p}`Baudrexel2017,Lutti2013,Stikov2015`, and as such is less robust than the gold standard inversion recovery technique. In particular, the signal bias resulting from insufficient spoiling can result in inaccurate [T<sub>1</sub>](wiki:Spin–lattice_relaxation) estimates of up to 30% relative to inversion recovery estimated values {cite:p}`Stikov2015`. VFA [T<sub>1</sub>](wiki:Spin–lattice_relaxation) map accuracy and precision is also strongly dependent on the quality of the measured B<sub>1</sub> map {cite:p}`Lee2017`, which can vary substantially between implementations {cite:p}`Boudreau2017`. Modern rapid B<sub>1</sub> mapping pulse sequences are not as widely available as VFA, resulting in some groups attempting alternative ways of removing the bias from the [T<sub>1</sub>](wiki:Spin–lattice_relaxation) maps like generating an artificial B<sub>1</sub> map through the use of image processing techniques {cite:p}`Liberman2013` or omitting B<sub>1</sub> correction altogether {cite:p}`Yuan2012`. The latter is not recommended, because most MRI scanners have default pulse sequences that, with careful protocol settings, can provide B<sub>1</sub> maps of sufficient quality very rapidly {cite:p}`Boudreau2017,Samson2006,Wang2005`.

Despite some drawbacks, VFA is still one of the most widely used [T<sub>1</sub>](wiki:Spin–lattice_relaxation) mapping methods in research. Its rapid acquisition time, rapid image processing time, and widespread availability makes it a great candidate for use in other quantitative imaging acquisition protocols like quantitative magnetization transfer imaging {cite:p}`Cercignani2005,Yarnykh2002` and dynamic contrast enhanced imaging {cite:p}`Li2018,Sung2013`.