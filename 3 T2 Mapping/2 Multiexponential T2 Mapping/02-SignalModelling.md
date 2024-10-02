---
title: Signal Modelling
subtitle: Multiexponential T2 Mapping
date: 2024-07-25
authors:
  - name:  Samuelle Stonge
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: false
  figure:
    template: Fig. %s
---
For multiexponential T2 mapping, the transverse magnetization (Mxy) acquired at different echo times (TE) can be modeled as a sum of exponential decays :


\begin{equation}\label{eq:1}
 \textit{M}_{xy}\left ( TE \right ) = \sum_{i=1}^{N}M_{z,i}\left ( 0^-{} \right )e^{-TE/T_{2,i}}
\end{equation}


where each term of the summation represents the contribution of the ith tissue component to the overall transverse magnetization decay (Collewet et al., 2022; Dortch, 2020). 

Figure 5 presents a single-voxel simulation of T2 relaxation curves of myelin water (MW) and intra/extracellular water (IEW) using mono-exponential T2 fitting, compared to a multi-exponential fitting for both MW and IEW. In this example, we see that using a multi-exponential model rather than mono-exponential for complex tissues like myelin enables more precise quantification of the T2 relaxation time within each voxel. 

:::{figure} #fig3p4cell
:label: t2Plot3
Comparison of mono-exponential and multi-exponential T2 fitting. This figure contrasts mono-exponential and multi-exponential fitting approaches for a single voxel containing myelin water (MW) and intra/extracellular water (IEW). The green and orange curves represent mono-exponential fittings for MW and IEW, respectively. The dotted purple curve illustrates the multi-exponential fitting, which combines both MW and IEW components. 
:::


```{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated Figure 1.
:class: tip, dropdown

```matlab
%% Requirements
% qMRLab must be installed: git clone https://www.github.com/qMRLab/qMRLab.git
% The mooc chapter branch must be checked out: git checkout mooc-03-T2
% qMRLab must be added to the path inside the MATLAB session: startup

close all
clear all

Model = mwf

% Define initial MWF and T2 times of myelin water and intra- and extracellular water
x = struct;
x.MWF = 50;
x.T2MW = 20;
x.T2IEW = 120;


% Define echo times
params.TE = linspace(0, 300, 100);

% Set simulation options
Opt.SNR = 120;
Opt.T2Spectrumvariance_Myelin = 5;
Opt.T2Spectrumvariance_IEIntraExtracellularWater = 20;

% Run simulation
figure('Name','Single Voxel Curve Simulation');
FitResult = Model.Sim_Single_Voxel_Curve(x,Opt);

% T2 relaxation curves for myelin water and intra/extracellular water
% (using a mono-exponential curve)
signal_mono_MW = exp(-params.TE / FitResult.T2MW);
signal_mono_IEW = exp(-params.TE / FitResult.T2IEW);

% T2 relaxation curve for multi-expo model
signal_multi_MWF = (FitResult.MWF/100)*signal_mono_MW + (1 - FitResult.MWF/100)*signal_mono_IEW;

%% Export

TE = squeeze(params.TE)
save("multiexpo_T2_curves.mat", "signal_mono_MW", "signal_mono_IEW", "signal_multi_MWF", "TE", "FitResult", "params", "x", "Opt")

```

```
