---
title: Introduction
subtitle: Magnetization Transfer Ratio
date: 2024-10-07
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
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::


Conventional MRI techniques, such as those used for clinical diagnosis, can only directly measure hydrogen bonded to water molecules. Thus, a non-negligible proportion of body mass is not visible with clinical MRIs, such as non-hydrogen atoms (different resonance frequencies) and hydrogen atoms bonded to large molecules which restricts the motion of the atoms (rapid signal decay, T2 ~ μs). The latter, called macromolecules, play an important role in the physiology of the body; for example, myelin in the white matter of the brain plays an important role in signal transmission, and is composed largely of macromolecules (lipids and proteins). Although the images acquired by clinical MRI machines can only be generated from signal from mobile hydrogen, these do interact with nearby molecules and atoms via the electromagnetic fields they mutually generate, and in the 70s and 80s a cross-relaxation mechanism was discovered that sensitizes mobile protons to nearby targeted semi-solid molecules, such as myelin (H. T. Edzes and Samulski 1977; Hommo T. Edzes and Samulski 1978; Wolff and Balaban 1989). With proper experimental design, a higher density of nearby macromolecules in the tissue results in a lower MRI signal. This class of MRI techniques is known as magnetization transfer (MT) imaging.
In the preceding chapter, we delved into the quantitative aspects of magnetization transfer (qMT) imaging, exploring the Bloch-McConnell model, signal modeling, and fitting techniques using qMRLab. Now, we shift our focus to the more accessible and widely used application of MT: magnetization transfer ratio (MTR). Although less quantitative than qMT, MTR is easier to set up and implement, making it popular choices in the MRI community interested in quantifying myelin loss.
In the simplest and most used MT imaging method, only two images are acquired (one with MT preparation, and one without), and a normalized difference between the two images is calculated. This quantity is known as the magnetization transfer ratio (MTR), and has been used extensively to infer information on myelin diseases and disorders, such as multiple sclerosis. The proportional relationship between MTR and myelin density has been established using post-mortem immunohistological studies in humans (Schmierer et al. 2004, 2007) and animals (Merkler et al. 2005; Zaaraoui et al. 2008). MTR has also already been used in clinical drug trials for MS (Maguire et al. 2013; Brown et al. 2016). Its widespread use is due to the fact that most scanners are equipped with the necessary software so that it can be added to an imaging protocol with the click of a button, and it is also a very quick measurement with a short acquisition time.

Table 1  MTR values in human brain vs vendor vs field strength

As summarized in the previous chapter, MR physicists have also developed other MT-related techniques that aim to extract quantitative physical information of tissues, using the mathematical models that describe the MT process. This sub-field is called quantitative MT, and the tissue properties that are typically measured are: the pool-size ratio F (density of the macromolecular content’s (restricted pool) equilibrium magnetization divided by the the same value for the liquid content (free pool)), the exchange rate R, the longitudinal relaxation of the free pool T1f, and the transverse relaxation of both the free and restricted pools (T2f and T2r). In contrast to MTR, quantitative MT techniques are not as widely used because of the long image acquisition times required that impedes clinical use. qMT also requires additional calibration measurements (B0, B1+, and T1), which can be challenging to measure accurately and thus contribute to additional propagation of errors to the measured qMT parameters (Boudreau, Stikov, and Pike 2018; Boudreau and Pike 2018). Despite these challenges, a lot of research focuses on developing and using qMT techniques in smaller studies, because the measured qMT parameters are desensitized to effects that can bias MTR measurements (eg T1, B1+). Another semi-quantitative MT technique that was recently developed is the MT saturation (MTsat) technique, which will be the focus of the third chapter in the Magnetization Transfer section of this book. 