---
title: Benefits and Pitfalls
subtitle: Inversion Recovery
date: 2024-07-25
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure 2.%s
  equation:
    template: Eq. 2.%s
---

The conventional [inversion recovery](wiki:Inversion_recovery) experiment is considered the gold standard T<sub>1</sub> mapping technique for several reasons: 
* A typical protocol has a long TR value and a sufficient number of inversion times for stable fitting (typically 5 or more) covering the range [0, TR]. 
* It offers a wide dynamic range of signals ([up to `-kM0`, `kM0`]), allowing a number of inversion times where high SNR is available to sample the signal recovery curve {cite:p}`Fukushima1981`. 
* T<sub>1</sub> maps produced by [inversion recovery](wiki:Inversion_recovery) are largely insensitive to inaccuracies in excitation flip angles and imperfect spoiling {cite:p}`Stikov2015`, as all parameters except TI are constant for each measurement and only a single acquisition is performed (at TI) during each TR. 

One important protocol design consideration is to avoid acquiring at inversion times where the signal for T<sub>1</sub> values of the tissue-of-interest is nulled, as the magnitude images at this TI time will be dominated by [Rician](wiki:Rice_distribution) noise which can negatively impact the fit under low SNR circumstances ([](#irPlot5)). Inversion recovery can also often be acquired using commonly available standard pulse sequences available on most MRI scanners by setting up a customized acquisition protocol, and does not require any additional calibration measurements. For an example, please visit the interactive preprint of the ISMRM Reproducible Research Group 2020 Challenge on inversion recovery T1 mapping {cite:p}`Boudreau2023`. 


:::{figure} #fig2p6cell
:label: irPlot5
:enumerator: 2.6
[Monte Carlo](wiki:Monte_Carlo_method) simulations (mean and standard deviation (STD), blue markers) and fitted T<sub>1</sub> values (mean and STD, red and green respectively) generated for a T<sub>1</sub> value of 900 ms and 5 TI values linearly spaced across the TR (ranging from 1 to 5 s). A bump in T<sub>1</sub> STD occurs near TR = 3000 ms, which coincides with the TR where the second TI is located near a null point for this T<sub>1</sub> value.
:::


Despite a widely acknowledged robustness for measuring accurate T<sub>1</sub> maps, inversion recovery is not often used in studies. An important drawback of this technique is the need for long TR values, generally on the order of a few T<sub>1</sub> for general models (e.g. Equations [](#irEq1) and [](#irEq4)), and up to 5T<sub>1</sub> for long TR approximated models ([Equation 2.3](#irEq3)). It takes about to 10-25 minutes to acquire a single-slice T<sub>1</sub> map using the inversion recovery technique, as only one TI is acquired per TR  (2-5 s) and conventional cartesian gradient readout imaging acquires one phase encode line per excitation (for a total of ~100-200 phase encode lines). The long acquisition time makes it challenging to acquire whole-organ T<sub>1</sub> maps in clinically feasible protocol times. Nonetheless, it is useful as a reference measurement for comparisons against other T<sub>1</sub> mapping methods, or to acquire a single-slice T<sub>1</sub> map of a tissue to get T<sub>1</sub> estimates for optimization of other pulse sequences.


````{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated [](#irPlot5).
:class: tip, dropdown

```octave
% Verbosity level 0 overrides the disp function and supresses warnings.
% Once executed, they cannot be restored in this session
% (kernel needs to be restarted or a new notebook opened.)
VERBOSITY_LEVEL = 0;

if VERBOSITY_LEVEL==0
    % This hack was used to supress outputs from external tools
    % in the Jupyter Book.
    function disp(x)
    end
    warning('off','all')
end

try
    cd qMRLab
catch
    try
        cd ../../../qMRLab
    catch
        cd ../qMRLab
    end
end

startup
clear all

%% Setup parameters
% All times are in seconds
% All flip angles are in degrees

TR_range = 1000:100:5000; % in seconds

x = struct;
x.T1 = 900; % in seconds

Opt.SNR = 25;
Opt.M0 = 1;
Opt.FAexcite = 90; % Excitation flip angle
Opt.FAinv = 180;   % Inversion flip angle

%% Monte Carlo data simulation
% Simulate noisy signal data 1,000 time, fit the data, then calculate the means and standard deviations of the data and fitted T1
% Data is calculated by calculating the a and b values of Eq. 4 from the full analytical equations (Eq. 1)

Model = inversion_recovery; 

for ii = 1:length(TR_range)
    Opt.TR = TR_range(ii);
    Opt.T1 = x.T1;
    TI_lowres(ii,:) = linspace(0.05, Opt.TR, 6)';
    Model.Prot.IRData.Mat = [TI_lowres(ii,:)];
    [ra,rb] = Model.ComputeRaRb(x,Opt);
    x.rb = rb;
    x.ra = ra;
    for jj = 1:1000
        [FitResult{ii,jj}, noisyData{ii,jj}] = Model.Sim_Single_Voxel_Curve(x,Opt,0); 
        fittedT1(ii,jj) = FitResult{ii,jj}.T1;
        noisyData_array(ii,jj,:) = noisyData{ii,jj}.IRData;
    end
        
    for kk=1:length(TI_lowres(ii,:))
        data_mean(ii,kk) = mean(noisyData_array(ii,:,kk));
        data_std(ii,kk) = std(noisyData_array(ii,:,kk));
    end
    
    T1_mean(ii) = mean(fittedT1(ii,:));
    T1_std(ii) = std(fittedT1(ii,:));
end

%% Calculate the noiseless data at a higher TI resolution to plot the ideal signal curve.
%

for ii = 1:length(TR_range)
    TI_highres(ii,:) = linspace(0.05, TR_range(ii), 500);
    Model.Prot.IRData.Mat = [TI_highres(ii,:)];
    Opt.TR = TR_range(ii);
    Opt.T1 = x.T1;
    [ra,rb] = Model.ComputeRaRb(x,Opt);
    x.rb = rb;
    x.ra = ra;

    data_noiseless(ii,:) = Model.equation(x);
end
```

````


````{admonition} References
:class: seealso


```{bibliography}
:filter: docname in docnames
```


````

