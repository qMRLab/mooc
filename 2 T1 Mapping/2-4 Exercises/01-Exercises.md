---
title: Exercises
subtitle: MP2RAGE
date: 2024-10-07
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  figure:
    template: Fig. %s
---

```{exercise}
:label: t1Problem1
:enumerator: 1.1
**Problem 1 ⭑**
:  **a.** Using the Plotly figure in the inversion recovery section that displays the signal curves for white matter, gray matter, and CSF, determine the inversion times that null the signal from each of these tissues.
:  **b.** In practice, you may not have this type of interactive figure at the scanner. Using the three values nulling inversion time values above, can you find an easy way to approximate the nulling time for any arbitrary T1 value?
:  **c.** Assuming that the images acquired at the MRI scanner displays magnitude-only images, at approximately which inversion time will the white matter and grey matter have the lowest contrast?
:  **d.** Which inversion time would result in the best contrast between white matter and grey matter?

<img src="https://github.githubassets.com/images/icons/emoji/octocat.png" height="20px">[Discuss on GitHub](https://github.com/qMRLab/mooc/discussions/4)
```

**Problem 2 ⭑**
:  **a.** Using the Plotly figure in the VFA section that displays the signal curves for white matter, gray matter, and CSF, determine the Ernst angle for the following: white matter and a TR of 15 ms, gray matter for a TR of 50 ms, and CSF for a TR of 140 ms.
:  **b.** Calculate the Ernst angle for these tissues and TRs with Equation 2 of that section. Are they in agreement with the values you estimated with the interactive figure?
:  **c.** It’s been shown (Deoni, Rutt, and Peters 2003) that the optimal flip angles for a two-measurement VFA T1 mapping imaging protocol are located at approximately 70% of the Ernst angle. Find the optimal flip angles to image each tissue above using their respective TRs.
:  **d.** For a TR of 30 ms, which flip angle would result in the best contrast between white matter and grey matter in an SPGR image?

**Problem 3 ⭑**
:  **a.** The IR signal curves for WM/GM/CSF in Figure 2 were simulated for 3T T1 tissue values. Using Binder and the notebook that was used to generate that blog post, regenerate that figure for T1 values at 1.5 T (WM ~ 650 ms and GM ~ 1200 ms as reported by (Wright et al. 2008)). Assume the CSF value does not change. 
:  **b.** An IR T1 mapping pulse sequence that a previous student developed and is available at the MRI scanner has a fixed TR of 3 seconds. Could you use a data analysis pipeline that only has the long-TR IR T1 fitting option available to map T1 in WM, at 1.5T and/or 3T? Show this visually via simulations.
:  **c.** Are there any inversion times you should avoid using when designing an IR T1 mapping protocol at 1.5T when using this TR? If so, demonstrate why and which one(s) using modified code from one of these notebook figures.

**Problem 4 ⭑⭑**
:  **a.** Imagine you’re a graduate student in a lab that recently transitioned from human imaging to animal imaging (specifically, mouse models of multiple sclerosis). Because there has never been MRI data acquired in your lab in mouse, your advisor asks you to acquire T1 maps of some healthy mice to get the an estimate of T1 values in white matter so that you can use this value to optimize other pulse sequence protocols (eg protocol parameters for T1-weighted images, optimal flip angle for spoiled gradient angle SNR, etc). You do some literature search and find a paper that measured T1 in mice (Kuo et al. 2005), but using a different pulse sequence.
:  
:  Using qMRLab, determine if the IR imaging protocol (TR = 1000 ms , TI = [100, 300, 600, 900] ms) you used for your previous human study at 1.5 T (where WM has a T1 of ~600ms) would yield good results if applied to mice (at 9.4 T, (Kuo et al. 2005) reports a WM T1 of ~1700 ms). Assume an SNR of 100. Explain how you’ve reached your conclusion.
:  **b.** If the human T1 mapping 1.5T protocol is not appropriate to image mice at 9.4T, explain via written arguments why this might be the case. Use simulation figures to support your arguments. 
:  **c.** Propose a new protocol that might yield more precise and/or accurate T1 maps. Why did you make those changes? How did you determine the improvement?

**Problem 5 ⭑⭑**
:  Find an open-source tool besides qMRLab that also has a VFA (also known as DESPOT1) fitting feature. Using simulated signal (with noise) and the qMRLab demo VFA human brain dataset, compare and contrast the T1 maps fitted using qMRLab and the other software chosen. Provide insights on the usability of both software, the reproducibility of the VFA T1 map using these data, and a comparison of both code (only API and the fitting algorithm for VFA). If you were to write your own VFA fitting software, what would do similar to either (or both) of these software packages. What would you do differently?

**Problem 6 ⭑⭑⭑**
:  **a.** You receive an email from a collaborator in your city asking for help with a T1 dataset they acquired on their new 3T scanner. They tried fitting the data with qMRLab already, but are getting T1 values in the brain that are beyond the expected values (eg, WM: 2000ms, GM, 5000 ms). They send you their acquired data.
:  
:  Fit a T1 map using their data and plot a few voxel signal curves.
:  **b.** Luckily, you own a standardized quantitative MRI NIST phantom with known T1 values, and are able to go to your collaborators scanner to acquire a dataset using their protocol. Here is data you acquired for a region of the phantom with a known T1 value (900 ms +- 5ms) close to the expected WM values. Plot that data, and simulate the expected signal curve for this T1 value
:  **c.** Comparing the human and phantom data and the simulated curves, what do you notice? What do you think may be the problem?
:  **d.** Test your proposed problem with some of your simulation code.
:  **e.** What would you propose to your collaborator? Is a new data acquisition protocol required, or can you provide some post-processing corrections prior to fitting the  data?

**Problem 7 ⭑⭑⭑**
:  You are currently in charge of a longitudinal study that uses VFA to acquire T1 maps. After an MRI scanner software upgrade, your T1 maps suddenly changed values substantially. Here is one of your old (good) datasets (link), and one of your new (bad) datasets. Using qMRLab, find what you suspect the problem is. Do you think a post-processing correction can be applied, or would an adjustment to the imaging protocol and new data acquisitions be needed ?

**Problem 8 ⭑⭑⭑**
:  In this module, we presented methodology on how to fit data acquired using a SPGR pulse sequence for a fixed TR and varying the flip angle (VFA). One could also suggest to fix the flip angle and acquire data by varying TR and then fit for T1 (let’s call this VTR). Explore this idea analytically and numerically. What would be some advantages and disadvantages to VTR? Would you need as many, or more acquisition? Is VTR sensitive to B1?

**Problem 9 ⭑⭑⭑**
:  In this module, we presented methodology on how to fit data acquired using an inversion recovery pulse sequence for a fixed TR and inversion time. As with the previous question, explore the idea of fixing the inversion time and varying TR to fit T1 maps.

