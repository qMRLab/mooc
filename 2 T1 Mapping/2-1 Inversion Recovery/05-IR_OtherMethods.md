---
title: Other Saturation-Recovery T1 Mapping techniques
subtitle: Inversion Recovery
date: 2024-07-25
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: false
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---

Several variations of the [inversion recovery](wiki:Inversion_recovery) pulse sequence were developed to overcome challenges like those specified above. Amongst them, the Look-Locker technique {cite:p}`Look1970` stands out as one of the most widely used in practice. Instead of a single 90° acquisition per TR, a periodic train of small excitation pulses {math}`θ` are applied after the inversion pulse, {{math}`θ_{180}` – 𝛕 – {math}`θ` – 𝛕 – {math}`θ` – ...}, where  𝛕 = TR/n and n is the number of sampling acquisitions. This pulse sequence samples the inversion time relaxation curve much more efficiently than conventional [inversion recovery](wiki:Inversion_recovery), but at a cost of lower SNR. However, because the magnetization state of each TI measurement depends on the previous series of θ excitation, it has higher sensitivity to B<sub>1</sub>-inhomogeneities and imperfect spoiling compared to [inversion recovery](wiki:Inversion_recovery) {cite:p}`Gai2013,Stikov2015`. Nonetheless, Look-Locker is widely used for rapid {math}`T_{1}` mapping applications, and variants like MOLLI (Modified Look-Locker Inversion recovery) and ShMOLLI (Shortened MOLLI) are widely used for cardiac {math}`T_{1}` mapping {cite:p}`Messroghli2004,Piechnik2010`.

Another [inversion recovery](wiki:Inversion_recovery) variant that’s worth mentioning is saturation recovery, in which the inversion pulse is replaced with a saturation pulse: {{math}`θ_{90}` – TI – {math}`θ_{90}`}. This technique was used to acquire the very first{math}`T_{1}` map {cite:p}`Pykett1978`. Unlike [inversion recovery](wiki:Inversion_recovery), this pulse sequence does not need a long TR to recover to its initial condition; every {math}`θ_{90}` pulse resets the longitudinal magnetization to the same initial state. However, to properly sample the recovery curve, TIs still need to reach the order of ~{math}`T_{1}`, the dynamic range of signal potential is cut in half ([0, {math}`M_{0}`]), and the short TIs (which have the fastest acquisition times) have the lowest SNRs.