"""QSM consensus example data (Zenodo 7795492, CC BY 4.0), Siemens MONOPOLAR_5E DICOMs → a two-echo pair for the
unwrapping viewer: echoes a and b, complex-averaged to 2 mm in-plane, every 4th slice from slice 8, int16 + scl_slope."""
import sys, glob, numpy as np, nibabel as nib, pydicom
from scipy import ndimage as ndi
src, out, ea, eb = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
vols = {}
for f in glob.glob(src + '/*'):
    h = pydicom.dcmread(f, force=True)
    if 'TransferSyntaxUID' not in h.file_meta:   # these files have no meta header: take the encoding pydicom detected
        h.file_meta.TransferSyntaxUID = pydicom.uid.ImplicitVRLittleEndian if h.is_implicit_VR else pydicom.uid.ExplicitVRLittleEndian
    kind, te = h.ImageType[2], round(float(h.EchoTime), 2)
    n = np.cross(np.array(h.ImageOrientationPatient[:3], float), np.array(h.ImageOrientationPatient[3:], float))
    pos = float(np.dot(n, np.array(h.ImagePositionPatient, float)))
    a = h.pixel_array.astype(np.float32) * float(getattr(h, 'RescaleSlope', 1)) + float(getattr(h, 'RescaleIntercept', 0))
    vols.setdefault((kind, te), []).append((pos, a))
TE = sorted({k[1] for k in vols})
def stack(kind, te): return np.stack([a for _, a in sorted(vols[(kind, te)], key=lambda x: x[0])], -1)   # rows, cols, slices
P = [stack('P', TE[e]) * np.pi / 4096 for e in (ea, eb)]; M = [stack('M', TE[e]) for e in (ea, eb)]
print('TE', TE, 'shape', P[0].shape, 'phase range', P[0].min().round(3), P[0].max().round(3))
k = P[0].shape[2] // 2; m = M[0][:, :, k]; bg = m < np.percentile(m, 10)
d = np.abs(np.angle(np.exp(1j * np.diff(P[0][:, :, k], axis=0))))
print('background: mag median', np.median(m[bg]).round(1), 'brain-ish mag p90', np.percentile(m, 90).round(1), 'phase |neighbour diff| bg', d[bg[1:] & bg[:-1]].mean().round(2), '(noise → ~1.57)')
zs = list(range(8, P[0].shape[2] - 8, 4))
def ds(a): r, c = a.shape[0] // 2 * 2, a.shape[1] // 2 * 2; a = a[:r, :c]; return a.reshape(r // 2, 2, c // 2, 2, *a.shape[2:]).mean((1, 3))
S = [ds(M[i][:, :, zs] * np.exp(1j * P[i][:, :, zs])) for i in (0, 1)]
ph = np.stack([np.angle(s) for s in S], -1).transpose(1, 0, 2, 3); mg = np.stack([np.abs(s) for s in S], -1).transpose(1, 0, 2, 3)   # x = column, y = row (row 0 at the top)
dte = TE[eb] - TE[ea]; print(f'echoes {ea+1},{eb+1}: ΔTE {dte:.2f} ms, limit ±{1000/(2*dte):.0f} Hz, out shape {ph.shape}')
aff = np.diag([2, 2, 4, 1.0]); tag = f'e{ea+1}{eb+1}'
def save(a, name, slope):
    img = nib.Nifti1Image(np.round(a / slope).astype(np.int16), aff); img.header.set_slope_inter(slope, 0); nib.save(img, f'{out}/{name}')
save(ph, f'qsmcons_siemens_{tag}_phase.nii.gz', 1e-3); save(mg, f'qsmcons_siemens_{tag}_mag.nii.gz', float(mg.max() / 30000))
