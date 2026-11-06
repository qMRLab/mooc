"""QSM consensus example data (Zenodo 7795492, CC BY 4.0), Siemens MONOPOLAR_5E DICOMs → a B0 field map for the
shimming exercise: echoes 1 and 2 complex-averaged to 2 mm isotropic, a brain mask (magnitude threshold, 3D erosion,
largest piece, grown back), the phase difference unwrapped in 3D (the course's region-merging unwrapper, via unwrap3d),
in Hz; saved with its RAS affine (scanner coordinates, mm) as int16 NIfTIs."""
import sys, glob, subprocess, numpy as np, nibabel as nib, pydicom
from scipy import ndimage as ndi
src, out, unwrap3d = sys.argv[1:4]
vols, geo = {}, {}
for f in glob.glob(src + '/*'):
    h = pydicom.dcmread(f, force=True)
    if 'TransferSyntaxUID' not in h.file_meta:
        h.file_meta.TransferSyntaxUID = pydicom.uid.ImplicitVRLittleEndian if h.is_implicit_VR else pydicom.uid.ExplicitVRLittleEndian
    kind, te = h.ImageType[2], round(float(h.EchoTime), 2)
    iop = np.array(h.ImageOrientationPatient, float); ipp = np.array(h.ImagePositionPatient, float)
    nrm = np.cross(iop[:3], iop[3:]); pos = float(nrm @ ipp)
    a = h.pixel_array.astype(np.float32) * float(getattr(h, 'RescaleSlope', 1)) + float(getattr(h, 'RescaleIntercept', 0))
    vols.setdefault((kind, te), []).append((pos, ipp, a))
    geo = dict(iop=iop, ps=[float(v) for v in h.PixelSpacing])
TE = sorted({k[1] for k in vols}); print('TE', TE)
def stack(kind, te):
    s = sorted(vols[(kind, te)], key=lambda x: x[0]); return np.stack([a for *_, a in s], -1), [p for _, p, _ in s]
M1, ipps = stack('M', TE[0]); P1, _ = stack('P', TE[0]); M2, _ = stack('M', TE[1]); P2, _ = stack('P', TE[1])
S1 = M1 * np.exp(1j * P1 * np.pi / 4096); S2 = M2 * np.exp(1j * P2 * np.pi / 4096)
R, C, K = M1.shape; print('rows, cols, slices', R, C, K, 'pixel', geo['ps'])
def ds(a):  # 2×2×2 average (rows, cols, slices)
    r, c, k = a.shape[0] // 2 * 2, a.shape[1] // 2 * 2, a.shape[2] // 2 * 2; a = a[:r, :c, :k]
    return a.reshape(r // 2, 2, c // 2, 2, k // 2, 2).mean((1, 3, 5))
s1, s2 = ds(S1), ds(S2); mag = np.abs(s1); dphi = np.angle(s2 * np.conj(s1))
# the brain: magnitude above 20 % of its range, eroded by 2 voxels (3D), largest piece, dilated back by 1, holes filled slice by slice
lo, hi = np.percentile(mag, [2, 98]); a = mag >= lo + 0.2 * (hi - lo)
st = ndi.generate_binary_structure(3, 1)
core = ndi.binary_erosion(a, st, iterations=2); lab, nl = ndi.label(core, st)
big = np.argmax(np.bincount(lab.ravel())[1:]) + 1
brain = ndi.binary_dilation(lab == big, st, iterations=1) & a
brain = np.stack([ndi.binary_fill_holes(brain[:, :, k]) for k in range(brain.shape[2])], -1)   # per slice: the ventricles are in
print('brain voxels', int(brain.sum()))
# unwrap Δφ in 3D inside the brain; array order for the unwrapper: x fastest (cols), then rows, then slices
r2, c2, k2 = dphi.shape
xyz = lambda v: np.ascontiguousarray(v.transpose(2, 0, 1))   # (slices, rows, cols) in C order = cols fastest
xyz(dphi).astype('<f4').tofile(out + '/dphi.f32'); xyz(brain).astype(np.uint8).tofile(out + '/mask.u8')
subprocess.run([unwrap3d, out + '/dphi.f32', out + '/mask.u8', str(c2), str(r2), str(k2), '6', out + '/unw.f32'], check=True)
unw = np.fromfile(out + '/unw.f32', '<f4').reshape(k2, r2, c2).transpose(1, 2, 0)
k0 = np.round(np.median(unw[brain]) / (2 * np.pi)); unw = unw - 2 * np.pi * k0
dte = (TE[1] - TE[0]) / 1000; hz = unw / (2 * np.pi * dte); hz[~brain] = 0
print('field in brain p1/p50/p99 Hz', np.percentile(hz[brain], [1, 50, 99]).round(1), 'wrapped |Δφ| would cap at', round(1 / (2 * dte)))
# the affine: voxel (col i, row j, slice k) of the 2 mm grid → RAS mm (DICOM is LPS)
row_dir, col_dir = geo['iop'][:3], geo['iop'][3:]   # IOP: direction of increasing column index, then of increasing row index
dr, dc = geo['ps']                                   # PixelSpacing: [between rows, between columns]
p0 = ipps[0]; dk = (ipps[-1] - ipps[0]) / (len(ipps) - 1)
A = np.eye(4)
A[:3, 0] = row_dir * dc * 2; A[:3, 1] = col_dir * dr * 2; A[:3, 2] = dk * 2
A[:3, 3] = p0 + row_dir * dc * 0.5 + col_dir * dr * 0.5 + dk * 0.5   # the centre of the first 2×2×2 block
A = np.diag([-1, -1, 1, 1]) @ A                                        # LPS → RAS
print('affine (RAS)\n', np.round(A, 3))
fl = lambda v: v.transpose(1, 0, 2)                                    # (cols, rows, slices) = NIfTI x, y, z
def save(a, name, slope, dtype=np.int16):
    img = nib.Nifti1Image(np.round(a / slope).astype(dtype), A); img.header.set_slope_inter(slope, 0); nib.save(img, f'{out}/{name}')
save(fl(hz), 'qsmcons_siemens_field.nii.gz', 0.02); save(fl(mag), 'qsmcons_siemens_field_mag.nii.gz', float(mag.max() / 30000))
nib.save(nib.Nifti1Image(fl(brain).astype(np.uint8), A), f'{out}/qsmcons_siemens_field_brain.nii.gz')
np.save(out + '/A.npy', A)
