---
title: T1 Mapping
date: 2024-10-07
label: t1MappingChapter
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


(irIntroduction)=
# Inversion Recovery _T_{sub}`1` Mapping

Widely considered the gold standard for [_T_{sub}`1`](wiki:Spin–lattice_relaxation) mapping, the [inversion recovery](wiki:Inversion_recovery) technique estimates [_T_{sub}`1`](wiki:Spin–lattice_relaxation) values by fitting the signal recovery curve acquired at different delays after an inversion pulse (180°). In a typical [inversion recovery](wiki:Inversion_recovery) experiment ([](#irFig1)), the [magnetization](wiki:Magnetization) at thermal equilibrium is inverted using a 180° RF pulse. After the longitudinal [magnetization](wiki:Magnetization) recovers through [spin-lattice relaxation](wiki:Spin–lattice_relaxation) for predetermined delay (inversion time, TI), a 90° excitation pulse is applied, followed by a readout imaging sequence (typically a [spin-echo](wiki:Spin_echo) or [gradient-echo](wiki:MRI_pulse_sequence#Gradient_echo) readout) to create a snapshot of the longitudinal [magnetization](wiki:Magnetization) state at that TI.

[Inversion recovery](wiki:Inversion_recovery) was first developed for [NMR](wiki:Nuclear_magnetic_resonance) in the 1940s [@Hahn1949;@Drain1949], and the first [_T_{sub}`1`](wiki:Spin–lattice_relaxation) map was acquired using a saturation-recovery technique (90° as a preparation pulse instead of 180°) by [@Pykett1978]. Some distinct advantages of inversion recovery are its large dynamic range of signal change and an insensitivity to pulse sequence parameter imperfections [@Stikov2015]. Despite its proven robustness at measuring [_T_{sub}`1`](wiki:Spin–lattice_relaxation), inversion recovery is scarcely used in practice, because conventional implementations require repetition times (TRs) on the order of 2 to 5 [_T_{sub}`1`](wiki:Spin–lattice_relaxation) [@Steen1994], making it challenging to acquire whole-organ [_T_{sub}`1`](wiki:Spin–lattice_relaxation) maps in a clinically feasible time. Nonetheless, it is continuously used as a reference measurement during the development of new techniques, or when comparing different [_T_{sub}`1`](wiki:Spin–lattice_relaxation) mapping techniques, and several variations of the [inversion recovery](wiki:Inversion_recovery) technique have been developed, making it practical for some applications [@Messroghli2004;@Piechnik2010].

```{figure} 2 T1 Mapping/2-1 Inversion Recovery/img/ir_pulsesequences.png
:label: irFig1
:enumerator: 2.1
Pulse sequence of an inversion recovery experiment.
```

## Signal Modelling

The steady-state longitudinal magnetization of an [inversion recovery](wiki:Inversion_recovery) experiment can be derived from the [Bloch equations](wiki:Bloch_equations) for the pulse sequence {{math}`\theta_{180}` – TI – {math}`\theta_{180}` – (TR-TI)}, and is given by:

```{math}
:label: irEq1
:enumerator:2.1
\begin{equation}
M_{z}(TI) = M_0 \frac{1-\text{cos}(\theta_{180})e^{- \frac{TR}{T_1}} -[1-\text{cos}(\theta_{180})]e^{- \frac{TI}{T_1}}}{1 - \text{cos}(\theta_{180}) \text{cos}(\theta_{90}) e^{- \frac{TR}{T_1}}}
\end{equation}
```

where {math}`M_{z}` is the longitudinal magnetization prior to the {math}`\theta_{90}` pulse. If the in-phase [real](wiki:Complex_number) signal is desired, it can be calculated by multiplying [](#irEq1) by {math}`k \text{sin}\left( \theta_{90} \right ) e^{-TE/T_{2}}`, where {math}`k` is a constant. This general equation can be simplified by grouping together the constants for each measurements regardless of their values (i.e. at each TI, same TE and {math}`\theta_{90}` are used) and assuming an ideal inversion pulse:

```{math}
:label: irEq2
:enumerator:2.2
\begin{equation}
M_z(TI) = C(1-2e^{- \frac{TI}{T_1}} + e^{- \frac{TR}{T_1}})
\end{equation}
```

where the first three terms and the denominator of [](#irEq1) have been grouped together into the constant {math}`C`. If the experiment is designed such that TR is long enough to allow for full relaxation of the magnetization (TR > 5 _T_{sub}`1`), we can do an additional approximation by dropping the last term in [](#irEq2):

```{math}
:label: irEq3
:enumerator:2.3
\begin{equation}
M_z(TI) = C(1-2e^{- \frac{TI}{T_1}})
\end{equation}
```

The simplicity of the signal model described by [](#irEq3), both in its equation and experimental implementation, has made it the most widely used equation to describe the signal evolution in an inversion recovery _T_{sub}`1` mapping experiment. The magnetization curves are plotted in [](#irPlot1) for approximate _T_{sub}`1` values of three different tissues in the brain. Note that in many practical implementations, magnitude-only images are acquired, so the signal measured would be proportional to the absolute value of [](#irEq3).

:::{figure} #irFig2jn
:label: irPlot1
:enumerator: 2.2
Inversion recovery curves ([](#irEq2)) for three different _T_{sub}`1` values, approximating the main types of tissue in the brain.
:::

Practically, [](#irEq1) is the better choice for simulating the signal of an [inversion recovery](wiki:Inversion_recovery) experiment, as the TRs are often chosen to be greater than 5 _T_{sub}`1` of the tissue-of-interest, which rarely coincides with the longest _T_{sub}`1` present (e.g. TR may be sufficiently long for white matter, but not for CSF which could also be present in the volume). [](#irEq3) also assumes ideal inversion pulses, which is rarely the case due to slice profile effects. [](#irPlot2) displays the [inversion recovery](wiki:Inversion_recovery) signal magnitude (complete relaxation normalized to 1) of an experiment with TR = 5 s and _T_{sub}`1` values ranging between 250 ms to 5 s, calculated using both equations.

:::{figure} #irFig3jn
:label: irPlot2
:enumerator: 2.3
Signal recovery curves simulated using [](#irEq3) (solid) and [](#irEq1) (dotted) with a TR = 5 s for _T_{sub}`1` values ranging between 0.25 to 5 s.
:::


````{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated [](#irPlot1).
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

params.TR = 5.0;
params.TI = linspace(0.001, params.TR, 1000);
            
params.TE = 0.004;
params.T2 = 0.040;
            
params.EXC_FA = 90;  % Excitation flip angle
params.INV_FA = 180; % Inversion flip angle

params.signalConstant = 1;

%% Calculate signals
%
% The option 'GRE-IR' selects the analytical equations for the
% gradient echo readout inversion recovery experiment The option
% '4' is a flag that selects the long TR approximation of the 
% analytical solution (TR>>T1), Eq. 3 of the blog post.
%
% To see all the options available, run:
% `help inversion_recovery.analytical_solution`

% White matter
params.T1 = 0.900; % in seconds

signal_WM = inversion_recovery.analytical_solution(params, 'GRE-IR', 4);

% Grey matter
params.T1 = 1.500;  % in seconds
signal_GM = inversion_recovery.analytical_solution(params, 'GRE-IR', 4);

% CSF
params.T1 = 4.000;  % in seconds
signal_CSF = inversion_recovery.analytical_solution(params, 'GRE-IR', 4);
```

````


````{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated [](#irPlot2).
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

params.TR = 5.0;
params.TI = linspace(0.001, params.TR, 1000);
            
params.TE = 0.004;
params.T2 = 0.040;
            
params.EXC_FA = 90;  % Excitation flip angle
params.INV_FA = 180; % Inversion flip angle

params.signalConstant = 1;

T1_range = 0.25:0.25:5; % in seconds

%% Calculate signals
%
% The option 'GRE-IR' selects the analytical equations for the
% gradient echo readout inversion recovery experiment. The option
% '1' is a flag that selects full analytical solution equation 
% (no approximation), Eq. 1 of the blog post. The option '4' is a
% flag that selects the long TR approximation of the analytical 
% solution (TR>>T1), Eq. 3 of the blog post.
%
% To see all the options available, run:
% `help inversion_recovery.analytical_solution`

for ii = 1:length(T1_range)
    params.T1 = T1_range(ii);
    
    signal_T1_Eq1{ii} = inversion_recovery.analytical_solution(params, 'GRE-IR', 1);

    signal_T1_Eq3{ii} = inversion_recovery.analytical_solution(params, 'GRE-IR', 4);
end
```

````

## Data Fitting


Several factors impact the choice of the [inversion recovery](wiki:Inversion_recovery) fitting algorithm.  If only magnitude images are available, then a polarity-inversion is often implemented to restore the non-exponential magnitude curves ([](#irPlot2)) into the [exponential](wiki:Exponential_function) form ([](#irPlot1)). This process is sensitive to noise due to the [Rician](wiki:Rice_distribution) noise creating a non-zero level at the signal null. If phase data is also available, then a phase term must be added to the fitting equation {cite:p}`Barral2010-qm`. [Equation 2.3](#irEq3) must only be used to fit data for the long TR regime (TR > 5 _T_{sub}`1`), which in practice is rarely satisfied for all tissues in subjects.

Early implementations of [inversion recovery](wiki:Inversion_recovery) fitting algorithms were designed around the computational power available at the time. These included the “null method” {cite:p}`Pykett1983`, assuming that each _T_{sub}`1` value has unique zero-crossings (see [](#irPlot1)), and linear fitting of a rearranged version of [Equation 2.3](#irEq3) on a semi-log plot {cite:p}`Fukushima1981`. Nowadays, a [non-linear least-squares](wiki:Non-linear_least_squares) fitting algorithm (e.g. [Levenberg-Marquardt](wiki:Levenberg–Marquardt_algorithm)) is more appropriate, and can be applied to either approximate or general forms of the signal model ([Equation 2.3](#irEq3) or [Equation 2.1](#irEq1)). More recent work {cite:p}`Barral2010-qm` demonstrated that _T_{sub}`1` maps can also be fitted much faster (up to 75 times compared to [Levenberg-Marquardt](wiki:Levenberg–Marquardt_algorithm)) to fit  [Equation 2.1](#irEq1) – without a precision penalty – by using a reduced-dimension [non-linear least-squares](wiki:Non-linear_least_squares) (RD-NLS) algorithm. It was demonstrated that the following simplified 5-parameter equation can be sufficient for accurate _T_{sub}`1` mapping:

```{math}
:label: irEq4
:enumerator:2.4
\begin{equation}
S(TI) = a + be^{- \frac{TI}{T_1}}
\end{equation}
```

where {math}`a` and {math}`b` are complex values. If magnitude-only data is available, a 3-parameter model can be sufficient by taking the absolute value of [Equation 2.4](#irEq4).  While the RD-NLS algorithms are too complex to be presented here (the reader is referred to the paper, {cite:p}`Barral2010-qm`),  the code for these algorithms [was released open-source](https://web.archive.org/web/20150620030019/http://www-mrsrl.stanford.edu/~jbarral/t1map.html) along with the original publication, and is also available as a [qMRLab](https://github.com/qMRLab/qMRLab) _T_{sub}`1` mapping model. One important thing to note about [Equation 2.4](#irEq4) is that it is general – no assumption is made about TR – and is thus as robust as [Equation 2.1](#irEq1) as long as all pulse sequence parameters other than TI are kept constant between each measurement. [](#irPlot3) compares simulated data ([Equation 2.1](#irEq1)) using a range of TRs (1.5 _T_{sub}`1` to 5 _T_{sub}`1`) fitted using either RD-NLS & [Equation 2.4](#irEq4) or a [Levenberg-Marquardt](wiki:Levenberg–Marquardt_algorithm) fit of [Equation 2.2](#irEq2).


:::{figure} #irFig4jn
:label: irPlot3
:enumerator: 2.4
Fitting comparison of simulated data (blue markers) with _T_{sub}`1` = 1 s and TR = 1.5 to 5 s, using fitted using RD-NLS & [Equation 2.4](#irEq4) (green) and [Levenberg-Marquardt](wiki:Levenberg–Marquardt_algorithm) & [Equation 2.2](#irEq2) (orange, long TR approximation).
:::


[](#irPlot4) displays an example brain dataset from an inversion recovery experiment, along with the _T_{sub}`1` map fitted using the RD-NLS technique.


:::{figure} #irFig5jn
:label: irPlot4
:enumerator: 2.5
Example inversion recovery dataset of a healthy adult brain (left). Inversion times used to acquire this magnitude image dataset were 30 ms, 530 ms, 1030 ms, and 1530 ms, and the TR used was 1550 ms. The _T_{sub}`1` map (right) was fitted using a RD-NLS algorithm.
:::


````{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated [](#irPlot3).
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

params.TI = 50:50:1500;
TR_range = 1500:50:5000;

params.EXC_FA = 90;
params.INV_FA = 180;

params.T1 = 1000;

%% Calculate signals
%
% The option 'GRE-IR' selects the analytical equations for the gradient echo readout inversion recovery experiment
% The option '1' is a flag that selects full analytical solution equation (no approximation), Eq. 1 of the blog post.
%
% To see all the options available, run `help inversion_recovery.analytical_solution`

for ii = 1:length(TR_range)
    params.TR = TR_range(ii);
    Mz_analytical(ii,:) = inversion_recovery.analytical_solution(params, 'GRE-IR', 1);
end

%% Fit data using Levenberg-Marquardt with the long TR approximation equation
%
% The option '4' is a flag that selects the long TR approximation of the analytical solution (TR>>T1), Eq. 3 of the blog post.
%
% To see all the options available, run `help inversion_recovery.fit_lm`


for ii=1:length(TR_range)
    fitOutput_lm{ii} = inversion_recovery.fit_lm(Mz_analytical(ii,:), params, 4);
    T1_lm(ii) = fitOutput_lm{ii}.T1;
end

%% Fit data using the RDLS method (Barral), Eq. 4 of the blog post.
%

% Create a qMRLab inversion recovery model object and load protocol values
irObj = inversion_recovery();
irObj.Prot.IRData.Mat = params.TI';

for ii=1:length(TR_range)

    data.IRData = Mz_analytical(ii,:);

    fitOutput_barral{ii} = irObj.fit(data);

    T1_barral(ii) = fitOutput_barral{ii}.T1;

end
```

````


````{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated [](#irPlot4).
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
load('data/ir_dataset/IRData.mat');
load('data/ir_dataset/IRMask.mat');

IRData = data;
Mask = imrotate(Mask,180);
clear data

% Format qMRLab inversion_recovery model parameters, and load them into the Model object
Model = inversion_recovery; 
TI = [30; 530; 1030; 1530];
Model.Prot.IRData.Mat = [TI];

% Format data structure so that they may be fit by the model
data = struct();
data.IRData= double(IRData);
data.Mask= double(Mask);

FitResults = FitData(data,Model,0); % The '0' flag is so that no wait bar is shown.

% Code used to re-orient the images to make pretty figures, and to assign variables with the axis lengths.

T1_map = imrotate(FitResults.T1.*Mask,-90);
xAxis = [0:size(T1_map,2)-1];
yAxis = [0:size(T1_map,1)-1];

% Raw MRI data at different TI values
TI_0030 = imrotate(squeeze(IRData(:,:,:,1).*Mask),-90);
TI_0530 = imrotate(squeeze(IRData(:,:,:,2).*Mask),-90);
TI_1030 = imrotate(squeeze(IRData(:,:,:,3).*Mask),-90);
TI_1530 = imrotate(squeeze(IRData(:,:,:,4).*Mask),-90);
```

````

## Benefits and Pitfalls



The conventional [inversion recovery](wiki:Inversion_recovery) experiment is considered the gold standard _T_{sub}`1` mapping technique for several reasons: 
* A typical protocol has a long TR value and a sufficient number of inversion times for stable fitting (typically 5 or more) covering the range [0, TR]. 
* It offers a wide dynamic range of signals ([up to {math}`-kM_{0}`, {math}`kM_{0}`]), allowing a number of inversion times where high SNR is available to sample the signal recovery curve {cite:p}`Fukushima1981`. 
* _T_{sub}`1` maps produced by [inversion recovery](wiki:Inversion_recovery) are largely insensitive to inaccuracies in excitation flip angles and imperfect spoiling {cite:p}`Stikov2015`, as all parameters except TI are constant for each measurement and only a single acquisition is performed (at TI) during each TR. 

One important protocol design consideration is to avoid acquiring at inversion times where the signal for _T_{sub}`1` values of the tissue-of-interest is nulled, as the magnitude images at this TI time will be dominated by [Rician](wiki:Rice_distribution) noise which can negatively impact the fit under low SNR circumstances ([](#irPlot5)). Inversion recovery can also often be acquired using commonly available standard pulse sequences available on most MRI scanners by setting up a customized acquisition protocol, and does not require any additional calibration measurements. For an example, please visit the interactive preprint of the ISMRM Reproducible Research Group 2020 Challenge on inversion recovery _T_{sub}`1` mapping {cite:p}`Boudreau2023`. 


:::{figure} #irFig6jn
:label: irPlot5
:enumerator: 2.6
[Monte Carlo](wiki:Monte_Carlo_method) simulations (mean and standard deviation (STD), blue markers) and fitted _T_{sub}`1` values (mean and STD, red and green respectively) generated for a _T_{sub}`1` value of 900 ms and 5 TI values linearly spaced across the TR (ranging from 1 to 5 s). A bump in _T_{sub}`1` STD occurs near TR = 3000 ms, which coincides with the TR where the second TI is located near a null point for this _T_{sub}`1` value.
:::


Despite a widely acknowledged robustness for measuring accurate _T_{sub}`1` maps, inversion recovery is not often used in studies. An important drawback of this technique is the need for long TR values, generally on the order of a few _T_{sub}`1` for general models (e.g. Equations [](#irEq1) and [](#irEq4)), and up to 5 _T_{sub}`1` for long TR approximated models ([Equation 2.3](#irEq3)). It takes about to 10-25 minutes to acquire a single-slice _T_{sub}`1` map using the inversion recovery technique, as only one TI is acquired per TR  (2-5 s) and conventional cartesian gradient readout imaging acquires one phase encode line per excitation (for a total of ~100-200 phase encode lines). The long acquisition time makes it challenging to acquire whole-organ _T_{sub}`1` maps in clinically feasible protocol times. Nonetheless, it is useful as a reference measurement for comparisons against other _T_{sub}`1` mapping methods, or to acquire a single-slice _T_{sub}`1` map of a tissue to get _T_{sub}`1` estimates for optimization of other pulse sequences.


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

## Other Saturation-Recovery T1 Mapping techniques

Several variations of the [inversion recovery](wiki:Inversion_recovery) pulse sequence were developed to overcome challenges like those specified above. Amongst them, the Look-Locker technique {cite:p}`Look1970` stands out as one of the most widely used in practice. Instead of a single 90° acquisition per TR, a periodic train of small excitation pulses {math}`\theta` are applied after the inversion pulse, {{math}`\theta_{180}` – 𝛕 – {math}`\theta` – 𝛕 – {math}`\theta` – ...}, where  𝛕 = TR/n and n is the number of sampling acquisitions. This pulse sequence samples the inversion time relaxation curve much more efficiently than conventional [inversion recovery](wiki:Inversion_recovery), but at a cost of lower SNR. However, because the magnetization state of each TI measurement depends on the previous series of {math}`\theta` excitation, it has higher sensitivity to _B_{sub}`1`-inhomogeneities and imperfect spoiling compared to [inversion recovery](wiki:Inversion_recovery) {cite:p}`Gai2013,Stikov2015`. Nonetheless, Look-Locker is widely used for rapid _T_{sub}`1` mapping applications, and variants like MOLLI (Modified Look-Locker Inversion recovery) and ShMOLLI (Shortened MOLLI) are widely used for cardiac _T_{sub}`1` mapping {cite:p}`Messroghli2004,Piechnik2010`.

Another [inversion recovery](wiki:Inversion_recovery) variant that’s worth mentioning is saturation recovery, in which the inversion pulse is replaced with a saturation pulse: {{math}`\theta_{90}` – TI – {math}`\theta_{90}`}. This technique was used to acquire the very first _T_{sub}`1` map {cite:p}`Pykett1978`. Unlike [inversion recovery](wiki:Inversion_recovery), this pulse sequence does not need a long TR to recover to its initial condition; every {math}`\theta_{90}` pulse resets the longitudinal magnetization to the same initial state. However, to properly sample the recovery curve, TIs still need to reach the order of ~_T_{sub}`1`, the dynamic range of signal potential is cut in half ([0, {math}`M_{0}`]), and the short TIs (which have the fastest acquisition times) have the lowest SNRs.

(vfaIntroduction)=
# Variable Flip Angle _T_{sub}`1` Mapping

Variable flip angle (VFA) [_T_{sub}`1`](wiki:Spin–lattice_relaxation) mapping {cite:p}`Christensen1974,Fram1987,Gupta1977`, also known as Driven Equilibrium Single Pulse Observation of [_T_{sub}`1`](wiki:Spin–lattice_relaxation) (DESPOT1) {cite:p}`Homer1985,Deoni2003`, is a rapid quantitative [_T_{sub}`1`](wiki:Spin–lattice_relaxation) measurement technique that is widely used to acquire 3D [_T_{sub}`1`](wiki:Spin–lattice_relaxation) maps (e.g. whole-brain) in a clinically feasible time. VFA estimates [_T_{sub}`1`](wiki:Spin–lattice_relaxation) values by acquiring multiple spoiled [gradient echo](wiki:Gradient_echo) acquisitions, each with different excitation flip angles ({math}`\theta_{n}` for n = 1, 2, .., N and {math}`\theta_{i}` ≠ {math}`\theta_{j}`). The steady-state signal of this pulse sequence ([](#vfaFig1)) uses very short TRs (on the order of magnitude of 10 ms) and is very sensitive to [_T_{sub}`1`](wiki:Spin–lattice_relaxation) for a wide range of flip angles.

VFA is a technique that originates from the NMR field, and was adopted because of its time efficiency and the ability to acquire accurate [_T_{sub}`1`](wiki:Spin–lattice_relaxation) values simultaneously for a wide range of values {cite:p}`Christensen1974,Gupta1977`. For imaging applications, VFA also benefits from an increase in SNR because it can be acquired using a 3D acquisition instead of multislice, which also helps to reduce slice profile effects. One important drawback of VFA for [_T_{sub}`1`](wiki:Spin–lattice_relaxation) mapping is that the signal is very sensitive to inaccuracies in the flip angle value, thus impacting the [_T_{sub}`1`](wiki:Spin–lattice_relaxation) estimates.  In practice, the nominal flip angle (i.e. the value set at the scanner) is different than the actual flip angle experienced by the spins (e.g. at 3.0 T, variations of up to ±30%), an issue that increases with field strength. VFA typically requires the acquisition of another quantitative map, the transmit RF amplitude (_B_{sub}`1`{sup}`+`, or _B_{sub}`1` for short), to calibrate the nominal flip angle to its actual value because of _B_{sub}`1` inhomogeneities that occur in most loaded [MRI coils](wiki:Radiofrequency_coil) {cite:p}`Sled1998`. The need to acquire an additional _B_{sub}`1` map reduces the time savings offered by VFA over saturation-recovery techniques, and inaccuracies/imprecisions of the _B_{sub}`1` map are also propagated into the VFA [_T_{sub}`1`](wiki:Spin–lattice_relaxation) map {cite:p}`Boudreau2017,Lee2017`.

```{figure} 2 T1 Mapping/2-2 Variable Flip Angle/img/vfa_pulsesequence.png
:label: vfaFig1
:enumerator: 2.7
Simplified pulse sequence diagram of a variable flip angle (VFA) pulse sequence with a gradient echo readout. TR: repetition time, {math}`\theta_{n}`: excitation flip angle for the nth measurement, IMG: image acquisition (k-space readout), SPOIL: spoiler gradient.
```

## Signal Modelling

The steady-state longitudinal magnetization of an ideal variable flip angle experiment can be analytically solved from the [Bloch equations](wiki:Bloch_equations) for the spoiled [gradient echo](wiki:Gradient_echo) pulse sequence {{math}`\theta_{n}`–TR}:

```{math}
:label: vfaEq1
:enumerator:2.5
\begin{equation}
M_{z}(\theta_n) = M_0 \frac{1-e^{- \frac{TR}{T_1}}}{1-\text{cos}(\theta_n) e^{- \frac{TR}{T_1}}} \text{sin}(\theta_n)
\end{equation}
```

where _M_{sub}`z` is the longitudinal magnetization, _M_{sub}`0` is the magnetization at thermal equilibrium, TR is the pulse sequence repetition time ([](#vfaFig1)), and {math}`\theta_{n}` is the excitation flip angle. The _M_{sub}`z` curves of different [_T_{sub}`1`](wiki:Spin–lattice_relaxation) values for a range of {math}`\theta_{n}` and TR values are shown in [](#vfaPlot1).

:::{figure} #vfaFig2jn
:label: vfaPlot1
:enumerator: 2.8
Variable flip angle technique signal curves ([](#vfaEq1)) for three different [_T_{sub}`1`](wiki:Spin–lattice_relaxation) values, approximating the main types of tissue in the brain at 3T.
:::


From [](#vfaPlot1), it is clearly seen that the flip angle at which the steady-state signal is maximized is dependent on the [_T_{sub}`1`](wiki:Spin–lattice_relaxation) and TR values. This flip angle is a well known quantity, called the [Ernst angle](Ernst_angle) {cite:p}`Ernst1966`, which can be solved analytically from [](#vfaEq1) using properties of calculus:

```{math}
:label: vfaEq2
:enumerator:2.6
\begin{equation}
\theta_{Ernst} = \text{acos}(e^{- \frac{TR}{T_1}})
\end{equation}
```

The [closed-form solution](wiki:Closed-form_expression) ([](#vfaEq1)) makes several assumptions which in practice may not always hold true if care is not taken. Mainly, it is assumed that the longitudinal magnetization has reached a steady state after a large number of TRs, and that the transverse magnetization is perfectly spoiled at the end of each TR. Bloch simulations – a numerical approach at solving the [Bloch equations](wiki:Bloch_equations) for a set of spins at each time point –  provide a more realistic estimate of the signal if the number of repetition times is small (i.e. a steady-state is not achieved). As can be seen from [](#vfaPlot2), the number of repetitions required to reach a steady state not only depends on [_T_{sub}`1`](wiki:Spin–lattice_relaxation), but also on the flip angle; flip angles near the Ernst angle need more TRs to reach a steady state. Preparation pulses or an outward-in [k-space](wiki:K-space_in_magnetic_resonance_imaging) acquisition pattern are typically sufficient to reach a steady state by the time that the center of [k-space](wiki:K-space_in_magnetic_resonance_imaging) is acquired, which is where most of the image contrast resides.

:::{figure} #vfaFig3jn
:label: vfaPlot2
:enumerator: 2.9
Signal curves simulated using Bloch simulations (orange) for a number of repetitions ranging from 1 to 150, plotted against the ideal case ([](#vfaEq1) – blue). Simulation details:  TR = 25 ms, _T_{sub}`1` = 900 ms, 100 spins. Ideal spoiling was used for this set of Bloch simulations (transverse magnetization was set to 0 at the end of each TR).
:::

Sufficient spoiling is likely the most challenging parameter to control for in a VFA experiment. A combination of both gradient spoiling and RF phase spoiling {cite:p}`Handbook2004,Zur1991` are typically recommended ([](#vfaPlot3)). It has also been shown that the use of very strong  gradients, introduces diffusion effects (not considered in [](#vfaPlot3)), further improving the spoiling efficacy in the VFA pulse sequence {cite:p}`Yarnykh2010`.


:::{figure} #vfaFig4jn
:label: vfaPlot3
:enumerator: 2.10
Signal curves estimated using Bloch simulations for three categories of signal spoiling: (1) ideal spoiling (blue), gradient & RF Spoiling (orange), and no spoiling (green). Simulations details: TR = 25 ms, _T_{sub}`1` = 900 ms, T{sub}`2` = 100 ms, TE = 5 ms, 100 spins. For the ideal spoiling case, the transverse magnetization is set to zero at the end of each TR. For the gradient & RF spoiling case, each spin is rotated by different increments of phase (2𝜋 / # of spins) to simulate complete decoherence from gradient spoiling, and the RF phase of the excitation pulse is  {math}`\Phi_{n}=\Phi_{n-1}+n\Phi_{0}=1/2\Phi_{0}\left( n^{2}+n+2 \right)` {cite:p}`Handbook2004` with {math}`\Phi_{0}` = 117° {cite:p}`Zur1991` after each TR.
:::



````{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated [](#vfaPlot1).
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

TR_range = 5:5:200;

params.EXC_FA = 1:90;

%% Calculate signals
%
% To see all the options available, run `help vfa_t1.analytical_solution`

for ii = 1:length(TR_range)
    params.TR = TR_range(ii);
    
    % White matter
    params.T1 = 900; % in milliseconds

    signal_WM(ii,:) = vfa_t1.analytical_solution(params);

    % Grey matter
    params.T1 = 1500;  % in milliseconds
    signal_GM(ii,:) = vfa_t1.analytical_solution(params);

    % CSF
    params.T1 = 4000;  % in milliseconds
    signal_CSF(ii,:) = vfa_t1.analytical_solution(params);
end


```


````



````{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated [](#vfaPlot2).
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

% White matter
params.T1 = 900; % in milliseconds
params.T2 = 10000;
params.TR = 25;
params.TE = 5;
params.EXC_FA = 1:90;
Nex_range = 1:1:150;

%% Calculate signals
%
% To see all the options available, run `help vfa_t1.analytical_solution`

for ii = 1:length(Nex_range)
    params.Nex = Nex_range(ii);
    
    signal_analytical(ii,:) = vfa_t1.analytical_solution(params);

    [~, complex_signal] = vfa_t1.bloch_sim(params);
    signal_blochsim(ii,:) = abs(complex(complex_signal));
end


```


````



````{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated [](#vfaPlot3).
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

% White matter
params.T1 = 900; % in milliseconds
params.T2 = 100;
params.TR = 25;
params.TE = 5;
params.EXC_FA = 1:90;
Nex_range = [1:9, 10:10:100];

%% Calculate signals
%
% To see all the options available, run `help vfa_t1.analytical_solution`

for ii = 1:length(Nex_range)
    params.Nex = Nex_range(ii);
    
    params.crushFlag = 1;
    
    [~, complex_signal] = vfa_t1.bloch_sim(params);
    signal_ideal_spoil(ii,:) = abs(complex_signal);
    
    
    params.inc = 117;
    params.partialDephasing = 1;
    params.partialDephasingFlag = 1;
    params.crushFlag = 0;
    
    [~, complex_signal] = vfa_t1.bloch_sim(params);
    signal_optimal_crush_and_rf_spoil(ii,:) = abs(complex_signal);
    
    params.inc = 0;
    params.partialDephasing = 0;

    [~, complex_signal] = vfa_t1.bloch_sim(params);
    signal_no_gradient_and_rf_spoil(ii,:) = abs(complex_signal);
end
```

````

(vfaDataFitting)=
## Data Fitting


At first glance, one could be tempted to fit VFA data using a [non-linear least squares](wiki:Non-linear_least_squares) fitting algorithm such as Levenberg-Marquardt with [](#vfaEq1), which typically only has two free fitting variables ([_T_{sub}`1`](wiki:Spin–lattice_relaxation) and _M_{sub}`0`). Although this is a valid way of estimating [_T_{sub}`1`](wiki:Spin–lattice_relaxation) from VFA data, it is rarely done in practice because a simple refactoring of [](#vfaEq1) allows [_T_{sub}`1`](wiki:Spin–lattice_relaxation) values to be estimated with a [linear least square](wiki:Linear_least_squares) fitting algorithm, which substantially reduces the processing time. Without any approximations, [](#vfaEq1) can be rearranged into the form {math}`\textbf{y}=m\textbf{x}+b`  {cite:p}`Gupta1977`:

```{math}
:label: vfaEq3
:enumerator:2.7
\begin{equation}
\frac{S_n}{ \text{sin}(\theta_n)} = e^{- \frac{TR}{T_1}} \frac{S_n}{ \text{tan}(\theta_n)} + C (1-e^{- \frac{TR}{T_1}})
\end{equation}
```

As the third term does not change between measurements (it is constant for each {math}`\theta_{n}`), it can be grouped into the constant for a simpler representation:

```{math}
:label: vfaEq4
:enumerator:2.8
\begin{equation}
\frac{S_n}{ \text{sin}(\theta_n)} = e^{- \frac{TR}{T_1}} \frac{S_n}{ \text{tan}(\theta_n)} + C
\end{equation}
```

With this rearranged form of [](#vfaEq1), [_T_{sub}`1`](wiki:Spin–lattice_relaxation) can be simply estimated from the slope of a linear regression calculated from  {math}`S_{n}/\text{sin}\left( \theta_{n}\right)` and {math}`S_{n}/\text{tan}\left( \theta_{n}\right)` values:

```{math}
:label: vfaEq5
:enumerator:2.9
\begin{equation}
T_1 = - \frac{TR}{ \text{ln}(slope)}
\end{equation}
```

If data were acquired using only two flip angles – a very common VFA acquisition protocol – then the slope can be calculated using the elementary slope equation. [](#vfaPlot4) displays both Equations [](#vfaEq1) and [](#vfaEq4) plotted for a noisy dataset.

:::{figure} #vfaFig5jn
:label: vfaPlot4
:enumerator: 2.11
Mean and standard deviation of the VFA signal plotted using the nonlinear form ([](#vfaEq1) – blue) and linear form ([](#vfaEq4) – red). Monte Carlo simulation details: SNR = 25, N = 1000. VFA simulation details: TR = 25 ms, _T_{sub}`1` = 900 ms.
:::

There are two important imaging protocol design considerations that should be taken into account when planning to use VFA: (1) how many and which flip angles to use to acquire VFA data, and (2) correcting inaccurate flip angles due to transmit RF field inhomogeneity. Most VFA experiments use the minimum number of required flip angles (two) to minimize acquisition time. For this case, it has been shown that the flip angle choice resulting in the best precision for VFA [_T_{sub}`1`](wiki:Spin–lattice_relaxation) estimates for a sample with a single [_T_{sub}`1`](wiki:Spin–lattice_relaxation) value (i.e. single tissue) are the two flip angles that result in 71% of the maximum possible steady-state signal (i.e. at the [Ernst angle](wiki:Ernst_angle)) {cite:p}`Deoni2003,Schabel2008`.

Time allowing, additional flip angles are often acquired at higher values and in between the two above, because greater signal differences between tissue [_T_{sub}`1`](wiki:Spin–lattice_relaxation) values are present there (e.g. [](#vfaPlot1)). Also, for more than two flip angles, Equations [](#vfaEq1) and [](#vfaEq4) do not have the same noise weighting for each fitting point, which may bias [linear least-square](wiki:Linear_least_squares) [_T_{sub}`1`](wiki:Spin–lattice_relaxation) estimates at lower SNRs. Thus, it has been recommended that low SNR data should be fitted with either [](#vfaEq1) using [non-linear least-squares](wiki:Non-linear_least_squares) (slower fitting) or with a weighted [linear least-square](wiki:Linear_least_squares) form of [](#vfaEq4) {cite:p}`Chang2008`.

Accurate knowledge of the flip angle values is very important to produce accurate [_T_{sub}`1`](wiki:Spin–lattice_relaxation) maps. Because of how the RF field interacts with matter {cite:p}`Sled1998`, the excitation RF field (_B_{sub}`1`{sup}`+`, or _B_{sub}`1` for short) of a loaded RF coil results in spatial variations in intensity/amplitude, unless RF shimming is available to counteract this effect (not common at clinical field strengths). For quantitative measurements like VFA which are sensitive to this parameter, the flip angle can be corrected (voxelwise) relative to the nominal value by multiplying it with a scaling factor (_B_{sub}`1`) from a _B_{sub}`1` map that is acquired during the same session:

```{math}
:label: vfaEq6
:enumerator:2.10
\begin{equation}
\theta_{corrected} = B_1 \theta_{nominal}
\end{equation}
```

_B_{sub}`1` in this context is normalized, meaning that it is unitless and has a value of 1 in voxels where the RF field has the expected amplitude (i.e. where the nominal flip angle is the actual flip angle). [](#vfaPlot5) displays fitted VFA [_T_{sub}`1`](wiki:Spin–lattice_relaxation) values from a [Monte Carlo](wiki:Monte_Carlo_method) dataset simulated using biased flip angle values, and fitted without/with _B_{sub}`1` correction.

:::{figure} #vfaFig6jn
:label: vfaPlot5
:enumerator: 2.11
Mean and standard deviations of fitted VFA [_T_{sub}`1`](wiki:Spin–lattice_relaxation) values for a set of [Monte Carlo](wiki:Monte_Carlo_method) simulations (SNR = 100, N = 1000), simulated using a wide range of biased flip angles and fitted without (blue) or with (red) _B_{sub}`1` correction. Simulation parameters: TR = 25 ms, _T_{sub}`1` = 900 ms, {math}`\theta_{nominal}` = 6° and 32° (optimized values for this TR/_T_{sub}`1` combination). Notice how even after _B_{sub}`1` correction, fitted [_T_{sub}`1`](wiki:Spin–lattice_relaxation) values at _B_{sub}`1` values far from the nominal case (_B_{sub}`1` = 1) exhibit larger variance, as the actual flip angles of the simulated signal deviate from the optimal values for this TR/_T_{sub}`1` (Deoni et al. 2003).
:::

[](#vfaPlot6) displays an example VFA dataset and a _B_{sub}`1` map in a healthy brain, along with the _T_{sub}`1` map estimated using a linear fit (Equations [](#vfaEq4) and [](#vfaEq5)).

:::{figure} #vfaFig7jn
:label: vfaPlot6
:enumerator: 2.12
Example variable flip angle dataset and _B_{sub}`1` map of a healthy adult brain (left). The relevant VFA protocol parameters used were: TR = 15 ms,  {math}`\theta_{nominal}` = 3° and 20°. The _T_{sub}`1` map (right) was fitted using a linear regression (Equations [](#vfaEq4) and [](#vfaEq5)).
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

## Benefits and Pitfalls


It has been well reported in recent years that the accuracy of VFA [_T_{sub}`1`](wiki:Spin–lattice_relaxation) estimates is very sensitive to pulse sequence implementations {cite:p}`Baudrexel2017,Lutti2013,Stikov2015`, and as such is less robust than the gold standard inversion recovery technique. In particular, the signal bias resulting from insufficient spoiling can result in inaccurate [_T_{sub}`1`](wiki:Spin–lattice_relaxation) estimates of up to 30% relative to inversion recovery estimated values {cite:p}`Stikov2015`. VFA [_T_{sub}`1`](wiki:Spin–lattice_relaxation) map accuracy and precision is also strongly dependent on the quality of the measured _B_{sub}`1` map {cite:p}`Lee2017`, which can vary substantially between implementations {cite:p}`Boudreau2017`. Modern rapid _B_{sub}`1` mapping pulse sequences are not as widely available as VFA, resulting in some groups attempting alternative ways of removing the bias from the [_T_{sub}`1`](wiki:Spin–lattice_relaxation) maps like generating an artificial _B_{sub}`1` map through the use of image processing techniques {cite:p}`Liberman2013` or omitting _B_{sub}`1` correction altogether {cite:p}`Yuan2012`. The latter is not recommended, because most MRI scanners have default pulse sequences that, with careful protocol settings, can provide _B_{sub}`1` maps of sufficient quality very rapidly {cite:p}`Boudreau2017,Samson2006,Wang2005`.

Despite some drawbacks, VFA is still one of the most widely used [_T_{sub}`1`](wiki:Spin–lattice_relaxation) mapping methods in research. Its rapid acquisition time, rapid image processing time, and widespread availability makes it a great candidate for use in other quantitative imaging acquisition protocols like quantitative magnetization transfer imaging {cite:p}`Cercignani2005,Yarnykh2002` and dynamic contrast enhanced imaging {cite:p}`Li2018,Sung2013`.

(mp2rageIntroduction)=
# MP2RAGE


Dictionary-based MRI techniques capable of generating _T_{sub}`1` maps are increasing in popularity, due to their growing availability on clinical scanners, rapid scan times, and fast post-processing computation time, thus making quantitative _T_{sub}`1` mapping accessible for clinical applications. Generally speaking, dictionary-based quantitative MRI techniques use numerical dictionaries—databases of pre-calculated signal values simulated for a wide range of tissue and protocol combinations—during the image reconstruction or post-processing stages. Popular examples of dictionary-based techniques that have been applied to _T_{sub}`1` mapping are MR Fingerprinting (MRF) [@Ma2013-bc], certain flavours of compressed sensing (CS) [@Doneva2010-mq;@Li2012-hx], and Magnetization Prepared 2 Rapid Acquisition Gradient Echoes (MP2RAGE) [@Marques2010-mo]. Dictionary-based techniques can usually be classified into one of two categories: techniques that use information redundancy from parametric data to assist in accelerated imaging (e.g. CS, MRF), or those that use dictionaries to estimate quantitative maps using the MR images after reconstruction. Because MP2RAGE is a technique implemented primarily for _T_{sub}`1` mapping, and it is becoming increasingly available as a standard pulse sequence on many MRI systems, the remainder of this section will focus solely on this technique. However, many concepts discussed are shared by other dictionary-based techniques.

MP2RAGE is an extension of the conventional MPRAGE pulse sequence widely used in clinical studies [@Haase1989-vk;@Mugler1990-li]. A simplified version of the MP2RAGE pulse sequence is shown in [](#mp2rageFig1). MP2RAGE can be seen as a hybrid between the inversion recovery and VFA pulse sequences: a 180° inversion pulse is used to prepare the magnetization for _T_{sub}`1` sensitivity at the beginning of each TR{sub}`MP2RAGE`, and then two images are acquired at different inversion times using gradient recalled echo (GRE) imaging blocks with low flip angles and short repetition times (TR). During a given GRE imaging block, each excitation pulse is followed by a constant in-plane (“y”) phase encode weighting (varied for each TR{sub}`MP2RAGE`), but with different 3D (“z”) phase encoding gradients (varied at each TR). The center of k-space for the 3D phase encoding direction is acquired at the TI for each GRE imaging block. The main motivation for developing the MP2RAGE pulse sequence was to provide a metric similar to MPRAGE, but with self-bias correction of the static (_B_{sub}`0`) and receive (_B_{sub}`1`{sup}`-`) magnetic fields, and a first order correction of the transmit magnetic field (_B_{sub}`1`{sup}`+`). However, because two images at different TIs are acquired (unlike MPRAGE, which only acquires data at a single TI), information about the _T_{sub}`1` values can also be inferred, thus making it possible to generate quantitative _T_{sub}`1` maps using this data.


```{figure} 2 T1 Mapping/2-3 MP2RAGE/img/mp2rage_pulsesequence.png
:label: mp2rageFig1
:enumerator: 2.13
Simplified diagram of an MP2RAGE pulse sequence. TR: repetition time between successive gradient echo readouts, TR{sub}`MP2RAGE`: repetition time between successive adiabatic 180° inversion pulses, TI{sub}`1` and TI{sub}`2`: inversion times, {math}`\theta_{1}` and {math}`\theta_{2}`: excitation flip angles. The imaging readout events occur within each TR using a constant in-plane phase encode (“y”) gradient set for each TR{sub}`MP2RAGE`, but varying 3D phase encode (“z”) gradients between each successive TR.
```

## Signal Modelling


Prior to considering the full signal equations, we will first introduce the equation for the MP2RAGE parameter (_S_{sub}`MP2RAGE`) that is calculated in addition to the _T_{sub}`1` map. For complex data (magnitude and phase, or real and imaginary), the MP2RAGE signal (_S_{sub}`MP2RAGE`) is calculated from the images acquired at two TIs (_S_{sub}`GRE,TI1` and _S_{sub}`GRE,TI2`) using the following expression [@Marques2010-mo]:

```{math}
:label: mp2rageEq1
:enumerator:2.11
\begin{equation}
S_{\text{MP2RAGE}}=\text{real}\left( \frac{S_{\text{GRE}_{\text{TI}_{1}}}^{\ast}S_{\text{GRE}_{\text{TI}_{2}}}^{\ast}}{\left| S_{\text{GRE}_{\text{TI}_{1}}} \right|^{2}+ \left| S_{\text{GRE}_{\text{TI}_{2}}} \right|^{2}} \right)
\end{equation}
```

This value is bounded between [-0.5, 0.5], and helps reduce some _B_{sub}`0` inhomogeneity effects using the phase data. For real data, or magnitude data with polarity restoration, this metric is instead calculated as:

```{math}
:label: mp2rageEq2
:enumerator:2.12
\begin{equation}
S_{\text{MP2RAGE}}=\text{real}\left( \frac{S_{\text{GRE}_{\text{TI}_{1}}}^{\ast}S_{\text{GRE}_{\text{TI}_{2}}}^{\ast}}{S_{\text{GRE}_{\text{TI}_{1}}}^{2}+ S_{\text{GRE}_{\text{TI}_{2}}}^{2}} \right)
\end{equation}
```


Because MP2RAGE is a hybrid of pulse sequences used for inversion recovery and VFA, the resulting signal equations are more complex. Typically, a steady state is not achieved during the short train of GRE imaging blocks, so the signal at the center of k-space for each readout (which defines the contrast weighting) will depend on the number of phase-encoding steps. For simplicity, the equations presented here assume that the 3D phase-encoding dimension is fully sampled (no partial Fourier or parallel imaging acceleration). For this case (see appendix of [@Marques2010-mo] for derivation details), the signal equations are:


```{math}
:label: mp2rageEq3
:enumerator:2.13
\begin{equation}
\begin{split}
S_{\text{GRE}_{\text{TI}_{1}}}=&B_{1}^{-}e^{-\text{TE}/T_{2}^{\ast }}M_{0}\text{sin}\left( \theta_{1} \right) \\
&\times \Bigg[ \left( \frac{-\text{eff}m_{z,ss}}{M_{0}}\text{EA}+\left( 1-\text{EA} \right) \right)\left( \text{cos}\left( \theta_{1} \right) \text{ER} \right)^{n/2-1}\\
&\quad\quad+\left( 1-\text{ER} \right) \frac{1-\left( \text{cos}\left( \theta_{1} \right)\text{ER} \right)^{n/2-1}}{1-\text{cos}\left( \theta_{1} \right)\text{ER}} \Bigg] 
\end{split}
\end{equation}
```

```{math}
:label: mp2rageEq4
:enumerator:2.14
\begin{equation}
\begin{split}
S_{\text{GRE}_{\text{TI}_{2}}}=&B_{1}^{-}e^{-\text{TE}/T_{2}^{\ast }}M_{0}\text{sin}\left( \theta_{2} \right) \\
&\times \Bigg[\frac{ \frac{m_{z,ss}}{M_{0}}\text{EA}+\left( 1-\text{EC} \right)}{\text{EC}\left( \text{cos}\left( \theta_{2} \right)\text{ER} \right)^{n/2}}-\left( 1-\text{ER} \right)\frac{\left( \text{cos}\left( \theta_{2} \right)\text{ER} \right)^{-n/2}-1 }{1-\text{cos}\left( \theta_{2} \right)\text{ER} } \Bigg] 
\end{split}
\end{equation}
```

where _B_{sub}`1`{sup}`-` is the receive field sensitivity, “eff” is the adiabatic inversion pulse efficiency, ER=exp(-TR/_T_{sub}`1`), EA=exp(-TA/_T_{sub}`1`), EB=exp(-TB/_T_{sub}`1`), EC=exp(-TC/_T_{sub}`1`). The variables TA, TB, and TC are the three different delay times (TA: time between inversion pulse and beginning of the GRE{sub}`1` block, TB: time between the end of GRE{sub}`1` and beginning of GRE{sub}`2`, TC: time between the end of GRE{sub}`2` and the end of the TR). If no k-space acceleration is used (e.g. no partial Fourier or parallel imaging acceleration), then these values are TA = TI{sub}`1` - (n/2)TR, TB = TI{sub}`2` - (TI{sub}`1` + nTR), and TC = TR{sub}`MP2RAGE` - (TI{sub}`1` + (n/2)TR), where n is the number of voxels acquired in the 3D phase encode direction varied within each GRE block. The value m{sub}`z,ss` is the steady-state longitudinal magnetization prior to the inversion pulse, and is given by:


```{math}
:label: mp2rageEq5
:enumerator:2.15
\begin{equation}
m_{z,ss}\frac{M_{0}\left[ \beta\left( \text{cos}\left( \theta_{2} \right)\text{ER} \right)^{n}+\left( 1-\text{ER} \right)\frac{1-\left( \text{cos}\left( \theta_{2} \right)\text{ER} \right)^{n}}{1-\text{cos}\left( \theta_{2} \right)\text{ER} } \right]\text{EC+}\left( 1- \text{EC}\right)}{1+\text{eff}\left( \text{cos}\left( \theta_{1} \right) \text{cos}\left( \theta_{2} \right) \right)^{n}e^{-TR_{\text{MP2RAGE}}/T_{1}}}
\end{equation}
```

```{math}
:label: mp2rageEq6
:enumerator:2.16
\begin{equation}
\beta=\bigg( \left( 1-\text{EA} \right) \left( \text{cos}\left( \theta_{1}\right)\text{ER}  \right)^{n}+\left( 1-\text{ER} \right)\frac{1-\left( \text{cos}\left( \theta_{1}\right)\text{ER}  \right)^{n}}{1-\text{cos}\left( \theta_{1}\right)\text{ER}  }\bigg)\text{EB}+\left( 1-\text{EB} \right)
\end{equation}
```

From Equations [2.13](#mp2rageEq3), [2.14](#mp2rageEq4), [2.15](#mp2rageEq5), and [2.16](#mp2rageEq6), it is evident that the MP2RAGE parameter _S_{sub}`MP2RAGE` (Equations [2.11](#mp2rageEq1), [2.12](#mp2rageEq2)) cancels out the effects of receive field sensitivity, _T_{sub}`2`{sup}`*`, and _M_{sub}`0`. The signal sensitivity related to the transmit field (_B_{sub}`1`{sup}`+`), hidden in Equations [2.13](#mp2rageEq3), [2.14](#mp2rageEq4), [2.15](#mp2rageEq5), and [2.16](#mp2rageEq6) within the flip angle values {math}`\theta_{1}` and {math}`\theta_{2}`, can also be reduced by careful pulse sequence protocol design [@Marques2010-mo], but not entirely eliminated [@Marques2013-ab].

## Data Fitting


Dictionary-based techniques such as MP2RAGE do not typically use conventional minimization algorithms (e.g. [Levenberg-Marquardt](wiki:Levenberg–Marquardt_algorithm) to fit signal equations to observed data. Instead, the MP2RAGE technique uses pre-calculated signal values for a wide range of parameter values (e.g. _T_{sub}`1`), and then interpolation is done within this dictionary of values to estimate the _T_{sub}`1` value that matches the observed signal. This approach results in rapid post-processing times because the dictionaries can be simulated/generated prior to scanning and interpolating between these values is much faster than most fitting algorithms. This means that the quantitative image can be produced and displayed directly on the MRI scanner console rather than needing to be fitted offline.

```{figure} #mp2rageFig2jn
:label: mp2rageplot1
:enumerator: 2.14
_T_{sub}`1` lookup table as a function of _T_{sub}`1` and _S_{sub}`MP2RAGE` value. Inversion times used to acquire this magnitude image dataset were 800 ms and 2700 ms, the flip angles were 4° and 5° (respectively),  TR{sub}`MP2RAGE` = 6000 ms, and TR = 6.7 ms. The code that was used were shared open sourced by the authors of the original MP2RAGE paper [@Marques2017-ws].
```

To produce _T_{sub}`1` maps with good accuracy and precision using dictionary-based interpolation methods, it is important that the signal curves are unique for each parameter value. MP2RAGE can produce good _T_{sub}`1` maps by using a dictionary with only dimensions (_T_{sub}`1`, _S_{sub}`MP2RAGE`), since _S_{sub}`MP2RAGE` is unique for each _T_{sub}`1` value for a given protocol [@Marques2010-mo]. However, as was noted above, _S_{sub}`MP2RAGE` is also sensitive to _B_{sub}`1` because of {math}`\theta_{1}` and {math}`\theta_{2}` in  Equations [2.13](#mp2rageEq3), [2.14](#mp2rageEq4), [2.15](#mp2rageEq5), and [2.16](#mp2rageEq3). The  _B_{sub}`1`-sensitivity can be reduced substantially with careful MP2RAGE protocol optimization [@Marques2010-mo], and further improved by including _B_{sub}`1` as one of the dictionary dimensions [_T_{sub}`1`, _B_{sub}`1`, _S_{sub}`MP2RAGE`] ([](#mp2rageplot1)).  This requires an additional acquisition of a _B_{sub}`1` map [@Marques2013-ab], which lengthens the scan time. 


```{figure} #mp2rageFig3jn
:label: mp2rageplot2
:enumerator: 2.15
Example MP2RAGE dataset of a healthy adult brain at 7T and _T_{sub}`1` map. Inversion times used to acquire this magnitude image dataset were 800 ms and 2700 ms, the flip angles were 4° and 5° (respectively),  TR{sub}`MP2RAGE` = 6000 ms, and TR = 6.7 ms. The dataset and code that was used were shared open sourced by the authors of the original MP2RAGE paper [@Marques2017-ws].
```

The MP2RAGE pulse sequence is increasingly being distributed by MRI vendors, thus typically a data fitting package is also available to reconstruct the _T_{sub}`1` maps online. Alternatively, several open source packages to create _T_{sub}`1` maps from MP2RAGE data are available online [@Marques2017-ws;@De_Hollander2017-cv], and for new users these are recommended—as opposed to programming one from scratch—as there are many potential pitfalls (e.g. adjusting the equations to handle partial Fourier or parallel imaging acceleration).

## Benefits and Pitfalls



This widespread availability and its turnkey acquisition/fitting procedures are a main contributing factor to the growing interest for including quantitative _T_{sub}`1` maps in clinical and neuroscience studies. _T_{sub}`1` values measured using MP2RAGE showed  high levels of reproducibility for the brain in an inter- and intra-site study at eight sites (same MRI hardware/software and at 7 T) of two subjects [@Voelker2016-qs]. Not only does MP2RAGE have one of the fastest acquisition and post-processing times among quantitative _T_{sub}`1` mapping techniques, but it can accomplish this while acquiring very high resolution _T_{sub}`1` maps (1 mm isotropic at 3T and submillimeter at 7T, both in under 10 min [@Fujimoto2014-fv]), opening the doors to cortical studies which greatly benefit from the smaller voxel size [@Waehnert2014-co;@Beck2018-qh;@Haast2018-fp].


Despite these benefits, MP2RAGE and similar dictionary-based techniques have certain limitations that are important to consider before deciding to incorporate them in a study. Good reproducibility of the quantitative _T_{sub}`1` map is dependent on using one pre-calculated dictionary. If two different dictionaries are used (e.g. cross-site with different MRI vendors), the differences in the dictionary interpolations will likely result in minor differences in _T_{sub}`1` estimates for the same data. Also, although the _B_{sub}`1`-sensitivity of the MP2RAGE _T_{sub}`1` maps can be reduced with proper protocol optimization, it can be substantial enough that further correction using a measured _B_{sub}`1` map should be done [@Marques2013-ab;@Haast2018-fp]. However _B_{sub}`1` mapping brings an additional potential source of error, so carefully selecting a _B_{sub}`1` mapping technique and accompanying post-processing method (e.g. filtering) should be done before integrating it in a _T_{sub}`1` mapping protocol [@Boudreau2017-tu]. Lastly, the MP2RAGE equations (and thus, dictionaries) assume monoexponential longitudinal relaxation, and this has been shown to result in suboptimal estimates of the long _T_{sub}`1` component for a biexponential relaxation model [@Rioux2016-va], an effect that becomes more important at higher fields.