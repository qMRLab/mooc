---
title: Data Fitting
subtitle: Multiexponential T2 Mapping
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

To fit the data for multi-exponential _T_{sub}`2` mapping, [](#t2Eq5) can be rewritten to express the signal decay in terms of the initial amplitude (Si) for each tissue component. The multi-exponential _T_{sub}`2` signal decay is then given by :

```{math}
:label: t2Eq6
:enumerator:3.6
\begin{equation}
\textit{S}\left ( TE \right ) = \sum_{i=1}^{N}S_{i}e^{-TE/T_{2,i}}
\end{equation}
```


Where the term Si corresponds to the initial signal amplitude of the ith tissue component, and _T_{sub}`2,i`is the _T_{sub}`2` relaxation time of that component. 

For example, the multi-exponential signal from [](#t2Plot4) can be expressed as the combination of the signals from both myelin water (MW) and intra/extracellular water (IEW), as follows : 

```{math}
:label: t2Eq7
:enumerator:3.7
\begin{equation}
\textit{S}\left ( TE \right )_{MWI} = S_{MW}e^{-TE/T_{2,MW}}+S_{IEW}e^{-TE/T_{2,IEW}}
\end{equation}
```

[](#t2Plot5) presents an example of multi-exponential _T_{sub}`2` fitting applied to an image of the spinal cord. The figure shows the myelin water fraction (MWF) map, which highlights the distribution of myelin water across the spinal cord, as well as the _T_{sub}`2` maps for intra/extracellular water and myelin water. The multi-exponential fitting approach allows for the separation of these components, enhancing tissue characterization in complex structures compared to mono-exponential models. In the following section, we will explain why MWF imaging is a key application of multi-exponential _T_{sub}`2` mapping, and how it provides valuable insights into the microstructure of the spinal cord, highlighting its potential benefits for understanding and diagnosing neurological conditions.

:::{figure} #fig3p5cell
:label: t2Plot5
:enumerator: 3.6
Multi-exponential _T_{sub}`2` mapping example of the spinal cord. The left image displays multi-exponential (ME) T2w data acquired at different echo times (TE) used for the data fitting. The right image presents the resulting myelin water fraction (MWF) map and _T_{sub}`2` relaxation maps for myelin water (MW) and intra/extracellular water (IEW). 
:::



```{admonition} Click here to view the qMRLab (MATLAB/Octave) code that generated [](#t2Plot5).
:class: tip, dropdown

```matlab
%% Requirements
% qMRLab must be installed: git clone https://www.github.com/qMRLab/qMRLab.git
% The mooc chapter branch must be checked out: git checkout mooc-03-T2
% qMRLab must be added to the path inside the MATLAB session: startup

% Define the model 
Model = mwf;

% Load data into environment, and rotate mask to be aligned with IR data
data = struct;
load('../data/mwf/MET2data.mat');
load('../data/mwf/Mask.mat');
data.MET2data = double(MET2data);
data.Mask = double(Mask);

% Define fitting parameters
EchoTime  = [12.8000; 25.6000; 38.4000; 51.2000; 64.0000; 76.8000; 89.6000; 102.4000; 115.2000; 128.0000; 140.8000; 153.6000; 166.4000; 179.2000; 192.0000; 204.8000; 217.6000; 230.4000; 243.2000; 256.0000; 268.8000; 281.6000; 294.4000; 307.2000; 320.0000; 332.8000; 345.6000; 358.4000; 371.2000; 384.0000];
Model.Prot.SEdata.Mat = [ EchoTime ];

% MET2w MRI data at different TE values
ME_TE_1 = imrotate(squeeze(data.MET2data(:,:,:,1).*data.Mask),-90);
ME_TE_2 = imrotate(squeeze(data.MET2data(:,:,:,10).*data.Mask),-90);
ME_TE_3 = imrotate(squeeze(data.MET2data(:,:,:,20).*data.Mask),-90);
ME_TE_4 = imrotate(squeeze(data.MET2data(:,:,:,30).*data.Mask),-90);

% Fit the data
FitResults_mwf = FitData(data,Model,0);

MWF = imrotate(squeeze(FitResults_mwf.MWF.*data.Mask), -90);
T2MW = imrotate(squeeze(FitResults_mwf.T2MW.*data.Mask), -90);
T2IEW = imrotate(squeeze(FitResults_mwf.T2IEW.*data.Mask), -90);

%% Export

save("multiexpo_T2_image.mat", "ME_TE_1", "ME_TE_2", "ME_TE_3", "ME_TE_4", "EchoTime", "FitResults_mwf", "MWF", "T2MW", "T2IEW")


```

```
