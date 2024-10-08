---
title: Noise
subtitle: Monoexponential T2 Mapping
date: 2024-10-07
authors:
  - name:  Samuelle Stonge
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---
In MRI, noise in the data can make it harder to accurately fit the _T_{sub}`2` decay curve, which is problematic given the necessity for highly precise _T_{sub}`2` values in clinical contexts. This issue is particularly pronounced when using pixel-wise _T_{sub}`2` mapping, as the signal-to-noise (SNR) is much lower compared to region-of-interest (ROI) _T_{sub}`2` mapping approaches (Sandino et al., 2015). [](#t2Plot3) shows how varying the level of noise in the acquired data can influence the fitting of the _T_{sub}`2` relaxation curve and the resulting _T_{sub}`2` constant. As observed in this figure, a low SNR can have a considerable impact on the _T_{sub}`2` fitting process. 



:::{figure} #fig3p3cell
:label: t2Plot3
:enumerator: 3.4
 Impact of noise on _T_{sub}`2` relaxometry fitting. The figure shows a single voxel fit with a true _T_{sub}`2` relaxation time of 109 ms. As the noise level increases, the accuracy of the _T_{sub}`2` fitting decreases, leading to deviations in the estimated _T_{sub}`2` relaxation time from the true value. This demonstrates how higher noise levels can adversely affect the reliability of _T_{sub}`2` measurements and may result in inaccurate representations of tissue relaxation properties.
:::



The number of echoes used in _T_{sub}`2` relaxometry is influenced by several factors, including the need for adequate spacing between echoes, the potential risk of heating the sample, and the challenges associated with processing data from samples with low signal-to-noise ratios. Therefore, selecting an optimal number of echoes is crucial for achieving accurate and reliable results while addressing these constraints (Shrager et al., 1998). The Cramer-Rao lower-bound (CRLB) method is a statistical tool that can be used in the context of _T_{sub}`2` relaxometry to estimate the smallest possible variance, known as the lower bound, of an unbiased estimator given the noise present in the data (Cavassila et al., 2001). Using the lower bounds, the optimal number of echoes needed to accurately fit the _T_{sub}`2` decay curve can be determined, ensuring more robust _T_{sub}`2` mapping (Jones et al., 1996). In their work, Shrager et al. (1998) introduced another method for optimizing the selection of echo time points to improve the accuracy of _T_{sub}`2` value estimates based on a predetermined range of expected _T_{sub}`2` values. Their approach demonstrated superior accuracy compared to conventional methods that use uniformly-spaced echo times, suggesting that these methods are not optimal for _T_{sub}`2` curve fitting accuracy. 


```{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated [](#t2Plot4).
:class: tip, dropdown

```matlab
%% Requirements
% qMRLab must be installed: git clone https://www.github.com/qMRLab/qMRLab.git
% The mooc chapter branch must be checked out: git checkout mooc-03-T2
% qMRLab must be added to the path inside the MATLAB session: startup
%% T2 and T2* decay curves

close all
clear all
clc

% Define model
Model = mono_t2;

params.TE = linspace(0, 300, 100); % Echo times (in ms)

% Define signal parameters for different tissues
x = struct;
x.M0 = 1000;
x.T2 = 109; % (in ms)

% Define the signal-to-noise ratio 
Opt1.SNR = 10;
Opt2.SNR = 50;
Opt3.SNR = 90;
Opt4.SNR = 130;

% Run the simulation for T2 and T2* decay curves
[FitResult_SNR10, data_SNR10] = Model.Sim_Single_Voxel_Curve(x, Opt1);
[FitResult_SNR50, data_SNR50] = Model.Sim_Single_Voxel_Curve(x, Opt2);
[FitResult_SNR90, data_SNR90] = Model.Sim_Single_Voxel_Curve(x, Opt3);
[FitResult_SNR130, data_SNR130] = Model.Sim_Single_Voxel_Curve(x, Opt4);

% T2 constants
T2_SNR10 = FitResult_SNR10.T2;
T2_SNR50 = FitResult_SNR50.T2;
T2_SNR90 = FitResult_SNR90.T2;
T2_SNR130 = FitResult_SNR130.T2;

% T2 decay curves
signal_SNR10 = FitResult_SNR10.M0/1000 * exp(-params.TE / FitResult_SNR10.T2);
signal_SNR50 = FitResult_SNR50.M0/1000 * exp(-params.TE / FitResult_SNR50.T2);
signal_SNR90 = FitResult_SNR90.M0/1000 * exp(-params.TE / FitResult_SNR90.T2);
signal_SNR130 = FitResult_SNR130.M0/1000 * exp(-params.TE / FitResult_SNR130.T2);

% Noisy data points
EchoTimes  = [12.8000; 25.6000; 38.4000; 51.2000; 64.0000; 76.8000; 89.6000; 102.4000; 115.2000; 128.0000; 140.8000; 153.6000; 166.4000; 179.2000; 192.0000; 204.8000; 217.6000; 230.4000; 243.2000; 256.0000; 268.8000; 281.6000; 294.4000; 307.2000; 320.0000; 332.8000; 345.6000; 358.4000; 371.2000; 384.0000];
SEdata_SNR10 = data_SNR10.SEdata/1000;
SEdata_SNR50 = data_SNR50.SEdata/1000;
SEdata_SNR90 = data_SNR90.SEdata/1000;
SEdata_SNR130 = data_SNR130.SEdata/1000;

%% Export

disp(EchoTimes)
disp(params.TE)

save("t2_noise_simulation.mat", "params", "signal_SNR10", "signal_SNR50", "signal_SNR90", "signal_SNR130", "T2_SNR10", "T2_SNR50", "T2_SNR90", "T2_SNR130", "SEdata_SNR10", "SEdata_SNR50", "SEdata_SNR90", "SEdata_SNR130", "EchoTimes")

```

```
