---
title: Signal Modelling
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

The steady-state longitudinal magnetization of an ideal variable flip angle experiment can be analytically solved from the Bloch equations for the spoiled gradient echo pulse sequence {<i>θ<sub>n</sub></i>–TR}:

\begin{equation}\tag{1}
M_{z}(\theta_n) = M_0 \frac{1-e^{- \frac{TR}{T_1}}}{1-\text{cos}(\theta_n) e^{- \frac{TR}{T_1}}} \text{sin}(\theta_n)
\end{equation}

where <i>M<sub>z</sub></i> is the longitudinal magnetization, <i>M</i><sub>0</sub> is the magnetization at thermal equilibrium, TR is the pulse sequence repetition time (Figure 1), and <i>θ<sub>n</sub></i> is the excitation flip angle. The <i>M<sub>z</sub></i> curves of different T<sub>1</sub> values for a range of <i>θ<sub>n</sub></i> and TR values are shown in Figure 2.

:::{figure} #figvfa2cell
:label: vfaPlot1
Example inversion recovery dataset of a healthy adult brain (left). Inversion times used to acquire this magnitude image dataset were 30 ms, 530 ms, 1030 ms, and 1530 ms, and the TR used was 1550 ms. The T<sub>1</sub> map (right) was fitted using a RD-NLS algorithm.
:::


From Figure 2, it is clearly seen that the flip angle at which the steady-state signal is maximized is dependent on the T<sub>1</sub> and TR values. This flip angle is a well known quantity, called the Ernst angle {cite:p}`Ernst1966`, which can be solved analytically from Equation 1 using properties of calculus:


\begin{equation}\tag{2}
\theta_{Ernst} = \text{acos}(e^{- \frac{TR}{T_1}})
\end{equation}

The closed-form solution (Equation 1) makes several assumptions which in practice may not always hold true if care is not taken. Mainly, it is assumed that the longitudinal magnetization has reached a steady state after a large number of TRs, and that the transverse magnetization is perfectly spoiled at the end of each TR. Bloch simulations – a numerical approach at solving the Bloch <i>equations</i> for a set of spins at each time point –  provide a more realistic estimate of the signal if the number of repetition times is small (i.e. a steady-state is not achieved). As can be seen from Figure 3, the number of repetitions required to reach a steady state not only depends on T<sub>1</sub>, but also on the flip angle; flip angles near the Ernst angle need more TRs to reach a steady state. Preparation pulses or an outward-in k-space acquisition pattern are typically sufficient to reach a steady state by the time that the center of k-space is acquired, which is where most of the image contrast resides.

:::{figure} #figvfa3cell
:label: vfaPlot2
Example inversion recovery dataset of a healthy adult brain (left). Inversion times used to acquire this magnitude image dataset were 30 ms, 530 ms, 1030 ms, and 1530 ms, and the TR used was 1550 ms. The T<sub>1</sub> map (right) was fitted using a RD-NLS algorithm.
:::


Signal curves simulated using Bloch simulations (orange) for a number of repetitions ranging from 1 to 150, plotted against the ideal case (Equation 1 – blue). Simulation details:  TR = 25 ms, T<sub>1</sub> = 900 ms, 100 spins. Ideal spoiling was used for this set of Bloch simulations (transverse magnetization was set to 0 at the end of each TR).

Sufficient spoiling is likely the most challenging parameter to control for in a VFA experiment. A combination of both gradient spoiling and RF phase spoiling {cite:p}`Handbook2004,Zur1991` are typically recommended (Figure 4). It has also been shown that the use of very strong  gradients, introduces diffusion effects (not considered in Figure 4), further improving the spoiling efficacy in the VFA pulse sequence {cite:p}`Yarnykh2010`.


:::{figure} #figvfa4cell
:label: vfaPlot3
Signal curves estimated using Bloch simulations for three categories of signal spoiling: (1) ideal spoiling (blue), gradient & RF Spoiling (orange), and no spoiling (green). Simulations details: TR = 25 ms, T<sub>1</sub> = 900 ms, T<sub>e</sub> = 100 ms, TE = 5 ms, 100 spins. For the ideal spoiling case, the transverse magnetization is set to zero at the end of each TR. For the gradient & RF spoiling case, each spin is rotated by different increments of phase (2𝜋 / # of spins) to simulate complete decoherence from gradient spoiling, and the RF phase of the excitation pulse is  ɸ<sub><i>n</i></sub> = ɸ<sub><i>n</i>-1</sub> + <i>n</i>ɸ<sub>0</sub> = ½ ɸ<sub>0</sub>(<i>n</i><sup>2</sup> + <i>n</i> + 2) {cite:p}`Handbook2004` with ɸ<sub>0</sub> = 117° {cite:p}`Zur1991` after each TR.
:::



````{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated Figure 1.
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



````{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated Figure 3.
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



````{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated Figure 4.
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

```{admonition} References
:class: seealso

```{bibliography}
:filter: docname in docnames
```

```