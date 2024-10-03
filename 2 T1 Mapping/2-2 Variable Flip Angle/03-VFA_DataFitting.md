---
title: Data Fitting
subtitle: Variable Flip Angle
date: 2024-07-25
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  figure:
    template: Fig. %s
---

At first glance, one could be tempted to fit VFA data using a non-linear least squares fitting algorithm such as Levenberg-Marquardt with [Equation 2.5](#vfaEq1), which typically only has two free fitting variables (T<sub>1</sub> and <i>M</i><sub>0</sub>). Although this is a valid way of estimating T<sub>1</sub> from VFA data, it is rarely done in practice because a simple refactoring of [Equation 2.5](#vfaEq1) allows T<sub>1</sub> values to be estimated with a linear least square fitting algorithm, which substantially reduces the processing time. Without any approximations, [Equation 2.5](#vfaEq1) can be rearranged into the form <b>y</b> = m<b>x</b>+b {cite:p}`Gupta1977`:

```{math}
:label: vfaEq3
:enumerator:2.7
\begin{equation}
\frac{S_n}{ \text{sin}(\theta_n)} = e^{- \frac{TR}{T_1}} \frac{S_n}{ \text{tan}(\theta_n)} + C (1-e^{- \frac{TR}{T_1}})
\end{equation}
```

As the third term does not change between measurements (it is constant for each <i>θ<sub>n</sub></i>), it can be grouped into the constant for a simpler representation:

```{math}
:label: vfaEq4
:enumerator:2.8
\begin{equation}
\frac{S_n}{ \text{sin}(\theta_n)} = e^{- \frac{TR}{T_1}} \frac{S_n}{ \text{tan}(\theta_n)} + C
\end{equation}
```

With this rearranged form of [Equation 2.5](#vfaEq1), T<sub>1</sub> can be simply estimated from the slope of a linear regression calculated from <i>S<sub>n</sub></i>/sin(<i>θ<sub>n</sub></i>) and <i>S<sub>n</sub></i>/tan(<i>θ<sub>n</sub></i>) values:

```{math}
:label: vfaEq5
:enumerator:2.9
\begin{equation}
T_1 = - \frac{TR}{ \text{ln}(slope)}
\end{equation}
```

If data were acquired using only two flip angles – a very common VFA acquisition protocol – then the slope can be calculated using the elementary slope equation. [](#vfaPlot4) displays both Equations [](#vfaEq1) and [](#vfaEq4) plotted for a noisy dataset.

:::{figure} #figvfa5cell
:label: vfaPlot4
:enumerator: 2.10
Mean and standard deviation of the VFA signal plotted using the nonlinear form ([Equation 2.5](#vfaEq1) – blue) and linear form ([Equation 2.8](#vfaEq4) – red). Monte Carlo simulation details: SNR = 25, N = 1000. VFA simulation details: TR = 25 ms, T<sub>1</sub> = 900 ms.
:::

There are two important imaging protocol design considerations that should be taken into account when planning to use VFA: (1) how many and which flip angles to use to acquire VFA data, and (2) correcting inaccurate flip angles due to transmit RF field inhomogeneity. Most VFA experiments use the minimum number of required flip angles (two) to minimize acquisition time. For this case, it has been shown that the flip angle choice resulting in the best precision for VFA T<sub>1</sub> estimates for a sample with a single T<sub>1</sub> value (i.e. single tissue) are the two flip angles that result in 71% of the maximum possible steady-state signal (i.e. at the Ernst angle) {cite:p}`Deoni2003,Schabel2008`.

Time allowing, additional flip angles are often acquired at higher values and in between the two above, because greater signal differences between tissue T<sub>1</sub> values are present there (e.g. [](#vfaPlot1)). Also, for more than two flip angles, Equations [](#vfaEq1) and [](#vfaEq4) do not have the same noise weighting for each fitting point, which may bias linear least-square T<sub>1</sub> estimates at lower SNRs. Thus, it has been recommended that low SNR data should be fitted with either [Equation 2.5](#vfaEq1) using non-linear least-squares (slower fitting) or with a weighted linear least-squares form of [Equation 2.8](#vfaEq4) {cite:p}`Chang2008`.

Accurate knowledge of the flip angle values is very important to produce accurate T<sub>1</sub> maps. Because of how the RF field interacts with matter {cite:p}`Sled1998`, the excitation RF field (B<sub>1</sub><sup>+</sup>, or B<sub>1</sub> for short) of a loaded RF coil results in spatial variations in intensity/amplitude, unless RF shimming is available to counteract this effect (not common at clinical field strengths). For quantitative measurements like VFA which are sensitive to this parameter, the flip angle can be corrected (voxelwise) relative to the nominal value by multiplying it with a scaling factor (B<sub>1</sub>) from a B<sub>1</sub> map that is acquired during the same session:

```{math}
:label: vfaEq6
:enumerator:2.10
\begin{equation}
\theta_{corrected} = B_1 \theta_{nominal}
\end{equation}
```

B<sub>1</sub> in this context is normalized, meaning that it is unitless and has a value of 1 in voxels where the RF field has the expected amplitude (i.e. where the nominal flip angle is the actual flip angle). [](#vfaPlot5) displays fitted VFA T<sub>1</sub> values from a Monte Carlo dataset simulated using biased flip angle values, and fitted without/with B<sub>1</sub> correction.

:::{figure} #figvfa6cell
:label: vfaPlot5
:enumerator: 2.11
Mean and standard deviations of fitted VFA T1 values for a set of Monte Carlo simulations (SNR = 100, N = 1000), simulated using a wide range of biased flip angles and fitted without (blue) or with (red) B1 correction. Simulation parameters: TR = 25 ms, T1 = 900 ms, θnominal = 6° and 32° (optimized values for this TR/T1 combination). Notice how even after B1 correction, fitted T1 values at B1 values far from the nominal case (B1 = 1) exhibit larger variance, as the actual flip angles of the simulated signal deviate from the optimal values for this TR/T1 (Deoni et al. 2003).
:::

<p style="text-align:justify;">
[](#vfaPlot6) displays an example VFA dataset and a B<sub>1</sub> map in a healthy brain, along with the T<sub>1</sub> map estimated using a linear fit (Equations [](#vfaEq4) and [](#vfaEq5)).
</p>

:::{figure} #figvfa7cell
:label: vfaPlot6
:enumerator: 2.12
Example variable flip angle dataset and B<sub>1</sub> map of a healthy adult brain (left). The relevant VFA protocol parameters used were: TR = 15 ms, <i>θ<sub>nominal</sub></i> = 3° and 20°. The T<sub>1</sub> map (right) was fitted using a linear regression (Equations [](#vfaEq4) and [](#vfaEq5)).
:::


````{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated [](#vfaPlot4).
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
% All times are in milliseconds
% All flip angles are in degrees

params.EXC_FA = [1:4,5:5:90];

%% Calculate signals
%
% To see all the options available, run `help vfa_t1.analytical_solution`

params.TR = 0.025;
params.EXC_FA = [2:9,10:5:90];

% White matter
x.M0 = 1;
x.T1 = 0.900; % in milliseconds

Model = vfa_t1; 

Opt.SNR = 25;
Opt.TR = params.TR;
Opt.T1 = x.T1;

clear Model.Prot.VFAData.Mat(:,1) 
Model.Prot.VFAData.Mat = zeros(length(params.EXC_FA),2);
Model.Prot.VFAData.Mat(:,1) = params.EXC_FA';
Model.Prot.VFAData.Mat(:,2) = Opt.TR;

for jj = 1:1000
    [FitResult{jj}, noisyData{jj}] = Model.Sim_Single_Voxel_Curve(x,Opt,0); 
    fittedT1(jj) = FitResult{jj}.T1;
    noisyData_array(jj,:) = noisyData{jj}.VFAData;
    noisyData_array_div_sin(jj,:) = noisyData_array(jj,:) ./ sind(Model.Prot.VFAData.Mat(:,1))';
    noisyData_array_div_tan(jj,:) = noisyData_array(jj,:) ./ tand(Model.Prot.VFAData.Mat(:,1))';
end
        
for kk=1:length(params.EXC_FA)
    data_mean(kk) = mean(noisyData_array(:,kk));
    data_std(kk) = std(noisyData_array(:,kk));
    
    data_mean_div_sin(kk) = mean(noisyData_array_div_sin(:,kk));
    data_std_div_sin(kk) = std(noisyData_array_div_sin(:,kk));
    
    data_mean_div_tan(kk) = mean(noisyData_array_div_tan(:,kk));
    data_std_div_tan(kk) = std(noisyData_array_div_tan(:,kk));
end


%% Setup parameters
% All times are in milliseconds
% All flip angles are in degrees

params_highres.EXC_FA = [2:1:90];

%% Calculate signals
%
% To see all the options available, run `help vfa_t1.analytical_solution`

params_highres.TR = params.TR * 1000; % in milliseconds
    
% White matter
params_highres.T1 = x.T1*1000; % in milliseconds

signal_WM = vfa_t1.analytical_solution(params_highres);
signal_WM_div_sin = signal_WM ./ sind(params_highres.EXC_FA);
signal_WM_div_tan = signal_WM ./ tand(params_highres.EXC_FA);
```

````


````{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated [](#vfaPlot5).
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

params.TR = 0.025; % in seconds

% White matter
params.T1 = 0.900; % in seconds

% Calculate optimal flip angles for a two flip angle VFA experiment (for this T1 and TR)
% The will be the nominal flip angles (the flip angles assumed by the "user", before a 
% "realistic"B1 bias is applied)

nominal_EXC_FA = vfa_t1.find_two_optimal_flip_angles(params); % in degrees
disp('Nominal flip angles:')
disp(nominal_EXC_FA)

% Range of B1 values biasing the excitation flip angle away from their nominal values
B1Range = 0.1:0.1:2;

x.M0 = 1;
x.T1 = params.T1; % in seconds

Model = vfa_t1; 

Opt.SNR = 100;
Opt.TR = params.TR;
Opt.T1 = x.T1;

% Monte Carlo signal simulations
for ii = 1:1000
    for jj = 1:length(B1Range)
        B1 = B1Range(jj);
        actual_EXC_FA = B1 * nominal_EXC_FA;
 
        params.EXC_FA = actual_EXC_FA;

        clear Model.Prot.VFAData.Mat(:,1)
        Model.Prot.VFAData.Mat = zeros(length(params.EXC_FA),2);
        Model.Prot.VFAData.Mat(:,1) = params.EXC_FA';
        Model.Prot.VFAData.Mat(:,2) = Opt.TR;

        [FitResult{ii,jj}, noisyData{ii,jj}] = Model.Sim_Single_Voxel_Curve(x,Opt,0); 
        noisyData_array(ii,jj,:) = noisyData{ii,jj}.VFAData;
    end
end
%
Model = vfa_t1; 
    
FlipAngle = nominal_EXC_FA';
TR = params.TR .* ones(size(FlipAngle));

Model.Prot.VFAData.Mat = [FlipAngle TR];

data.VFAData(:,:,1,1) = noisyData_array(:,:,1);
data.VFAData(:,:,1,2) = noisyData_array(:,:,2);
data.Mask = repmat(ones(size(B1Range)),[size(noisyData_array,1),1]);

data.B1map = repmat(ones(size(B1Range)),[size(noisyData_array,1),1]);
FitResults_noB1Correction = FitData(data,Model,0);

data.B1map = repmat(B1Range,[size(noisyData_array,1),1]);
FitResults_withB1Correction = FitData(data,Model,0);

%%
%

mean_T1_noB1Correction = mean(FitResults_noB1Correction.T1);
mean_T1_withB1Correction = mean(FitResults_withB1Correction.T1);
std_T1_noB1Correction = std(FitResults_noB1Correction.T1);
std_T1_withB1Correction = std(FitResults_withB1Correction.T1);
```

````


````{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated [](#vfaPlot6).
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

%% MATLAB/OCTAVE CODE

% Load data into environment, and rotate mask to be aligned with IR data
load('data/vfa_dataset/VFAData.mat');
load('data/vfa_dataset/B1map.mat');
load('data/vfa_dataset/Mask.mat');

% Format qMRLab vfa_t1 model parameters, and load them into the Model object
Model = vfa_t1; 
FlipAngle = [    3;     20];
TR        = [0.015; 0.0150];

Model.Prot.VFAData.Mat = [FlipAngle, TR];

% Format data structure so that they may be fit by the model
data = struct();
data.VFAData= double(VFAData);
data.B1map= double(B1map);
data.Mask= double(Mask);

FitResults = FitData(data,Model,0); % The '0' flag is so that no wait bar is shown.

T1_map = imrotate(FitResults.T1.*Mask,-90);
T1_map(T1_map>5)=0;
T1_map = T1_map*1000; % Convert to ms

xAxis = [0:size(T1_map,2)-1];
yAxis = [0:size(T1_map,1)-1];

% Raw MRI data at different TI values
FA_03 = imrotate(squeeze(VFAData(:,:,:,1).*Mask),-90);
FA_20 = imrotate(squeeze(VFAData(:,:,:,2).*Mask),-90);
B1map = imrotate(squeeze(B1map.*Mask),-90);
```

````


```{admonition} References
:class: seealso

```{bibliography}
:filter: docname in docnames
```

```

