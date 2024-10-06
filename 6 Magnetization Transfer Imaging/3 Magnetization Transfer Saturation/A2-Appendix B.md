---
title: Appendix B
subtitle: Magnetization Transfer Saturation
date: 2024-07-25
name: mtsatAppendixA
authors:
  - name: Mathieu Boudreau
    affiliations:
      - NeuroPoly Lab, Polytechnique Montreal, Quebec, Canada
numbering:
  heading_2: false
  figure:
    template: Fig. %s
---

:::{attention}
:class: attentionDraft
:name: attentionDraft
This content of this section is still a work-in-progress and has not been proofread and/or reviewed.
:::

So far we’ve explored a lot of the practical properties of MTsat, but have yet to explore what this parameter represents in reality. We begin this discussion by looking at how (Helms et al. 2008) interpreted MTsat:

(figure or quote)

Thus, MTsat is interpreted as being the saturation (i.e. reduction in longitudinal magnetization) occurring from the pulse substituting the MT pulse (Figure 2) occurring within a single TR, after steady-state has been reached. A reminder: MTR, in contrast, is a steady-state image difference metric (not “within” a TR).

## Simulating MTSat through qMRLab

To assess the validity of this MTsat interpretation, we employ Bloch simulations via qMRLab. These simulations should allow us to visualize the “MTSat value” both as it approaches and after reaching steady-state by quantifying the difference in longitudinal magnetization before and after the MT pulse. The main question we have is: can we find the MT saturation (δ) value directly using Bloch simulations, and how close does it approach the calculated MT saturation value from a three-measurement experiment (equations 7-9)?

Using some high-school geometry, we see how we can calculate MTsat (delta) from this difference, assuming (as Helms did) that the MT saturation causes a flip of a specific angle.

```{figure} img/mtsat_trig.png
:label: mtsatFigA1
:enumerator: 6A.1
Demonstration through trigonometry of how following a small flip angle alpha2 (eg MT saturation), the value delta = alpha2^2/2 represents the fraction of the reduction in longitudinal magnetization due to the pulse (bigDelta) relative to the value prior to the pulse (Mzbefore).
```

## Simulation 1: Revisiting MTsat Theory

In our first simulation, we use the qMRLab qMT-SPGR module to simulate steady-state signals from an MTsat experiment on healthy white matter tissues. We utilize tissue parameters from Sled (2011) and an MTsat protocol derived from Karakuzu (2022). 

:::{dropdown} Code
:closed:

```matlab

clear all, close all, clc
 
%% Load protocol
 
fname = 'configs/mtsat-protocols.json';
fid = fopen(fname);
raw = fread(fid,inf);
str = char(raw');
fclose(fid);
val = loadjson(str);
 
protocols = val.karakuzu2022.siemens1
 
%% Load tissues
 
fname = 'configs/tissues.json';
fid = fopen(fname);
raw = fread(fid,inf);
str = char(raw');
fclose(fid);
val = loadjson(str);
 
tissue = val.sled2001.healthywhitematter;
 
%% T1 range
 
T1_true = 1
 
%% qMT-SPGR experiment
 
MTsats = zeros(1,length(T1_true))
MTRs = zeros(1,length(T1_true))
T1s = zeros(1,length(T1_true))
 
 
protocol = protocols.pdw
 
fa = protocol.fa
tr = protocol.tr/1000
te = protocol.te/1000
offset = protocol.offset
mt_shape = protocol.mtshape
mt_duration = protocol.mtduration/1000
mt_angle = protocol.mtangle
 
Model = qmt_spgr;
Model.Prot.MTdata.Mat = [mt_angle, offset];
Model.Prot.TimingTable.Mat(5) = tr ;
Model.Prot.TimingTable.Mat(1) = mt_duration;
Model.Prot.TimingTable.Mat(4) = Model.Prot.TimingTable.Mat(5) - (Model.Prot.TimingTable.Mat(1) + Model.Prot.TimingTable.Mat(2) + Model.Prot.TimingTable.Mat(3)) ;
Model.options.Readpulsealpha = fa;
Model.options.MT_Pulse_Shape = mt_shape
 
params = tissue{1}
x = struct;
x.F = params.F.mean;
x.kr = params.kf.mean / x.F;
x.R1f = 1/T1_true;
x.R1r = 1;
x.T2f = params.T2f.mean/1000;
x.T2r = params.T2r.mean/(10^6);
 
Opt.SNR = 1000;
Opt.Method = 'Bloch sim';
Opt.ResetMz = false;
 
[FitResult, Smodel] = Model.Sim_Single_Voxel_Curve(x,Opt); % NOTE: this uses a modified version of the qmt_spgr.m file where the additional output is included. Not all version of qMRLab has this; if yours doesn't, go to the file and add the additional function output accordingly.
 
%% Cleanup
 
%Smodel is the normalized MT-SPGR value, that is, the signal with the MT
%pulse on divided by the signal from the same sequence with the MT pulse
%off. Since in the MTsat experiment, the PD-weighted pulse sequence is the
%latter case above, we then define:
 
Signal_MT = Smodel;
Signal_PDw = 1;
 
%% Find scaling value for T1w signal
 
 
% Get PDw/T1w ratio from analytical
 
PDw_Model = vfa_t1;
 
params.EXC_FA = protocols.pdw.fa;
params.T1 = T1_true; % Could improve by caclulating T1meas from qMT values
params.TR = protocols.pdw.tr/1000; % ms
 
PDw_anal = vfa_t1.analytical_solution(params);
 
T1w_Model = vfa_t1;
 
paramsT1w.EXC_FA = protocols.t1w.fa;
paramsT1w.T1 = T1_true; % ms
paramsT1w.TR = protocols.t1w.tr/1000; % ms
 
T1w_anal = vfa_t1.analytical_solution(paramsT1w);
 
T1wPDw_ratio = T1w_anal/PDw_anal
 
%% Cleanup
 
% Since Signal_PDw = 1, then it's clear that 
 
Signal_T1w = T1wPDw_ratio
 
%% Calculate MTsat from signals
 
Model = mt_sat;
FlipAngle =  protocols.pdw.fa;
TR =  protocols.pdw.tr/1000;
Model.Prot.MTw.Mat = [ FlipAngle TR ];
FlipAngle = protocols.t1w.fa;
TR =  protocols.t1w.tr/1000;
Model.Prot.T1w.Mat = [ FlipAngle TR];
FlipAngle =  protocols.pdw.fa;
TR =  protocols.pdw.tr/1000;
Model.Prot.PDw.Mat = [ FlipAngle TR];
 
data = struct();
data.MTw=Signal_MT;
data.T1w=Signal_T1w;
data.PDw=Signal_PDw;
FitResults = FitData(data,Model,0);
MTsats = FitResults.MTSAT
MTRs = FitResults.MTR
T1s = FitResults.T1

```

:::


:::{dropdown} Output
:open:

```matlab

MTsats =

    5.3428


MTRs =

   58.9758


T1s =

    1.0100


```

:::

Our results closely align with expectations (T1 fitted ~= T1 input, MTR ~58, MTsat ~5%). Converting the MTsat value to ɑ2 (see Figure 8), we find that the MTSat value corresponds to an equivalent excitation pulse of approximately 18.7 degrees. Through Helms' interpretation, we infer that the MT pulse should be reducing the longitudinal magnetization by roughly 0.05 (ie Mz_after pulse - Mz_before pulse = 0.05).

## Simulation 2: Challenging MTSat Model Assumptions

Using the qMRLab Bloch simulations, we can calculate the difference in longitudinal magnetization before and after the MT pulse, and see if this corresponds to the MTsat value calculated above.

Let’s do that.

