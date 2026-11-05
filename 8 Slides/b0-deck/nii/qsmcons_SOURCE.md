# qsmcons_siemens_e12_*: a QSM scan (Exercise 5-2, slide d)

- **Data:** Chan K-S, Marques JP, Spincemaille P, Wang Y. *Recommended implementation of quantitative susceptibility
  mapping for clinical research in the brain: a consensus of the ISMRM Electro-Magnetic Tissue Properties Study Group*,
  example data. Zenodo, doi:10.5281/zenodo.7795492 (file `QSM_Consensus_Paper_Example_DICOM_Code_v0.2.1.zip`,
  `QSM_CONSENSUS_DATA/SIEMENS/MONOPOLAR_5E/GRE`: 3 T Siemens Prisma, 5 echoes, TE 5.25, 11.08, 16.91, 22.74, 28.57 ms,
  magnitude and phase DICOMs as reconstructed by the scanner, background not masked).
- **License:** CC BY 4.0, https://creativecommons.org/licenses/by/4.0/
- **Changes** (`tools/qsm_consensus/make_pair.py <GRE dir> <out> 0 1`): only echoes 1 and 2 (ΔTE 5.83 ms); phase
  ±4096 → ±π; the complex signal averaged to 2 × 2 mm in-plane; every 4th slice from slice 8 (4 mm apart, 32 slices);
  stored as int16 with scl_slope (phase in radians, magnitude rescaled).
