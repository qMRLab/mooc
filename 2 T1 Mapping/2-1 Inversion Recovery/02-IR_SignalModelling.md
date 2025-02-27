---
title: Signal Modelling
subtitle: Inversion Recovery
date: 2024-10-07
label: irSignalModelling
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


```{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated [](#irPlot2).
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

```