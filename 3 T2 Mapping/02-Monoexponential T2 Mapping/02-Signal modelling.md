---
title: Signal modelling
subtitle: Monoexponential _T_{sub}`2` Mapping
date: 2024-10-07
authors:
  - name:  Samuelle St-Onge
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: true
  figure:
    template: Figure %s
  equation:
    template: Eq. %s
---


The decay of the transverse magnetization (Mxy) is exponential and can be derived from the transverse component of the Bloch equations: 

```{math}
:label: t2Eq1
:enumerator:3.1
\begin{equation}
\textit{M}_{xy}\left ( TE \right ) = Mz\left ( 0^{-} \right )e^{-TE/T_{2}}
\end{equation}
```

where Mz(0-) is the longitudinal magnetization immediately preceding the 90 degree excitation pulse. By using this equation, we make the assumption that the measured signal is proportional to the transverse magnetization (Mxy), and that Mz(0-) remains constant regardless of echo time (TE) (Dortch, 2020). 

[](#t2Plot2) shows transverse relaxation curves for _T_{sub}`2` and _T_{sub}`2`{sup}`*` values for white matter and gray matter, using the relaxation times from Siemonsen et al. (2008). 



:::{figure} #fig3p2cell
:label: t2Plot2
:enumerator: 3.3
Transverse relaxation decay curves for _T_{sub}`2` and _T_{sub}`2`{sup}`*` values in white matter and gray matter. The _T_{sub}`2` and _T_{sub}`2`{sup}`*` constants were taken from Siemonsen et al. (2008).
:::



In NMR physics, it has been shown that _T_{sub}`2` relaxation times must be equal to or shorter than 2 _T_{sub}`1` (Levitt, 2008); however, it has been demonstrated that _T_{sub}`2` can exceed _T_{sub}`1` in very rare cases (Traficante, 1991). In living organisms however, _T_{sub}`2` is always shorter than _T_{sub}`1`. 


```{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated [](#t2Plot2).
:class: tip, dropdown

```matlab
%% Requirements
% qMRLab must be installed: git clone https://www.github.com/qMRLab/qMRLab.git
% The mooc chapter branch must be checked out: git checkout mooc-03-T2
% qMRLab must be added to the path inside the MATLAB session: startup

%% T2 and T2* decay curves
% Script to display T2 and T2* relaxometry curves for different tissues

% Simulation parameters
params.TE = linspace(0, 300, 100); % Echo times (in ms)

% Define T2 values for different tissues
params.T2_WM = 109.77; % T2 of white matter (in ms)
params.T2_GM = 96.07; % T2 of gray matter (in ms)

% Define T2* values for different tissues
params.T2star_WM = 67.63; % T2* of white matter (in ms)
params.T2star_GM = 48.48; % T2* of gray matter (in ms)

% Generate T2 and T2* decay signals
signal_WM_T2 = exp(-params.TE / params.T2_WM);
signal_GM_T2 = exp(-params.TE / params.T2_GM);
signal_WM_T2star = exp(-params.TE / params.T2star_WM);
signal_GM_T2star = exp(-params.TE / params.T2star_GM);

% Plot the T2 and T2* signals
figure;
hold on;
plot(params.TE, signal_WM_T2, '-b', 'DisplayName', 'T2 = 109.77 ms (white matter)');
plot(params.TE, signal_GM_T2, '-r', 'DisplayName', 'T2 = 96.07 ms (gray matter)');
plot(params.TE, signal_WM_T2star, '--b', 'DisplayName', 'T2* = 67.63 ms (white matter)');
plot(params.TE, signal_GM_T2star, '--r', 'DisplayName', 'T2* = 48.48 ms (gray matter)');
xlabel('Echo Time - TE (ms)');
ylabel('Transverse Magnetization (Mxy)');
legend();
title('T2 and T2* Decay Signals');

%% Export

TE = squeeze(params.TE)
save("t2_and_t2star_curvs.mat", "signal_WM_T2", "signal_GM_T2", "signal_WM_T2star", "signal_GM_T2star", "params")

```

```
