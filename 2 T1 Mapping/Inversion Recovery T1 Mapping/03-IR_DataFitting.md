---
title: Data Fitting
subtitle: Inversion Recovery
date: 2024-07-25
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  figure:
    template: Fig. %s
---

Several factors impact the choice of the inversion recovery fitting algorithm.  If only magnitude images are available, then a polarity-inversion is often implemented to restore the non-exponential magnitude curves (Figure 3) into the exponential form (Figure 2). This process is sensitive to noise due to the Rician noise creating a non-zero level at the signal null. If phase data is also available, then a phase term must be added to the fitting equation {cite:p}`Barral2010-qm`. Equation 3 must only be used to fit data for the long TR regime (TR > 5T<sub>1</sub>), which in practice is rarely satisfied for all tissues in subjects.

Early implementations of inversion recovery fitting algorithms were designed around the computational power available at the time. These included the “null method” {cite:p}`Pykett1983`, assuming that each T<sub>1</sub> value has unique zero-crossings (see Figure 2), and linear fitting of a rearranged version of Eq. 3 on a semi-log plot {cite:p}`Fukushima1981`. Nowadays, a non-linear least-squares fitting algorithm (e.g. Levenberg-Marquardt) is more appropriate, and can be applied to either approximate or general forms of the signal model (Eq. 3 or Eq. 1). More recent work {cite:p}`Barral2010-qm` demonstrated that T<sub>1</sub> maps can also be fitted much faster (up to 75 times compared to Levenberg-Marquardt) to fit  Eq. 1 – without a precision penalty – by using a reduced-dimension non-linear least squares (RD-NLS) algorithm. It was demonstrated that the following simplified 5-parameter equation can be sufficient for accurate T<sub>1</sub> mapping:

\begin{equation}\label{eq:4}
S(TI) = a + be^{- \frac{TI}{T_1}}
\end{equation}

where <i>a</i> and <i>b</i> are complex values. If magnitude-only data is available, a 3-parameter model can be sufficient by taking the absolute value of Eq. 4.  While the RD-NLS algorithms are too complex to be presented here (the reader is referred to the paper, (Barral et al. 2010)),  the code for these algorithms [was released open-source](http://www-mrsrl.stanford.edu/~jbarral/t1map.html) along with the original publication, and is also available as a [qMRLab](https://github.com/qMRLab/qMRLab) T<sub>1</sub> mapping model. One important thing to note about Eq. 4 is that it is general – no assumption is made about TR – and is thus as robust as Eq. 1 as long as all pulse sequence parameters other than TI are kept constant between each measurement. Figure 4 compares simulated data (Eq. 1) using a range of TRs (1.5T<sub>1</sub> to 5T<sub>1</sub>) fitted using either RD-NLS & Eq. 4 or a Levenberg-Marquardt fit of Eq. 2.

:::{figure} #fig2p4cell
:label: irPlot3
Fitting comparison of simulated data (blue markers) with T1 = 1 s and TR = 1.5 to 5 s, using fitted using RD-NLS & Eq. 4 (green) and Levenberg-Marquardt & Eq. 2 (orange, long TR approximation).
:::

<p style="text-align:justify;">
Figure 5 displays an example brain dataset from an inversion recovery experiment, along with the T<sub>1</sub> map fitted using the RD-NLS technique.
</p>

:::{figure} #fig2p5cell
:label: irPlot4
Example inversion recovery dataset of a healthy adult brain (left). Inversion times used to acquire this magnitude image dataset were 30 ms, 530 ms, 1030 ms, and 1530 ms, and the TR used was 1550 ms. The T<sub>1</sub> map (right) was fitted using a RD-NLS algorithm.
:::


```{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated Figure 4.
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

```


```{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated Figure 5.
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

```