/* A small NIfTI reader for the slides: NIfTI-1 and NIfTI-2 single files (.nii, .nii.gz), either byte order.
 * NiftiLite.read(Uint8Array) → Promise<{ dims: [nx, ny, nz, nt], pixdim: [dx, dy, dz], data: Float32Array }>.
 * The data are scaled by scl_slope / scl_inter (slope 0 means no scaling) and stored x fastest, then y, z, t.
 * Supported types: uint8, int8, int16, uint16, int32, uint32, float32, float64. Gzip is undone with the browser's
 * DecompressionStream. Headers only (.hdr/.img pairs) and complex or RGB data are rejected with a message.
 * Written for the B0 deck; the file handling follows the qMRLab NIfTI viewer (github.com/qmrlab/viewer). */
window.NiftiLite = (function () {
  'use strict';
  async function gunzip(bytes) {
    if (typeof DecompressionStream === 'undefined') throw new Error('this browser cannot read .gz files; unzip it first');
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  const TYPES = {   // datatype code → [bytes per voxel, DataView getter]
    2: [1, 'getUint8'], 256: [1, 'getInt8'], 4: [2, 'getInt16'], 512: [2, 'getUint16'],
    8: [4, 'getInt32'], 768: [4, 'getUint32'], 16: [4, 'getFloat32'], 64: [8, 'getFloat64'],
  };
  async function read(input) {
    let bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = await gunzip(bytes);
    if (bytes.length < 348) throw new Error('too short to be a NIfTI file');
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let le = true, size = dv.getInt32(0, true);
    if (size !== 348 && size !== 540) { le = false; size = dv.getInt32(0, false); }
    if (size !== 348 && size !== 540) throw new Error('not a NIfTI file (header size)');
    const v2 = size === 540, magic = String.fromCharCode(...bytes.slice(v2 ? 4 : 344, v2 ? 7 : 347));
    if (magic === 'ni1' || magic === 'ni2') throw new Error('a .hdr/.img pair: open a single-file .nii instead');
    let dims = [], pixdim = [], type, offset, slope, inter;
    if (v2) {
      type = dv.getInt16(12, le);
      for (let i = 0; i < 8; i++) dims.push(Number(dv.getBigInt64(16 + 8 * i, le)));
      for (let i = 0; i < 8; i++) pixdim.push(dv.getFloat64(104 + 8 * i, le));
      offset = Number(dv.getBigInt64(168, le)); slope = dv.getFloat64(176, le); inter = dv.getFloat64(184, le);
    } else {
      type = dv.getInt16(70, le);
      for (let i = 0; i < 8; i++) dims.push(dv.getInt16(40 + 2 * i, le));
      for (let i = 0; i < 8; i++) pixdim.push(dv.getFloat32(76 + 4 * i, le));
      offset = Math.max(352, Math.round(dv.getFloat32(108, le))); slope = dv.getFloat32(112, le); inter = dv.getFloat32(116, le);
    }
    const t = TYPES[type];
    if (!t) throw new Error(`NIfTI data type ${type} is not supported (complex or RGB?)`);
    const nd = Math.max(1, Math.min(7, dims[0])), d = [1, 1, 1, 1];
    for (let i = 0; i < Math.min(nd, 4); i++) d[i] = Math.max(1, dims[i + 1]);
    for (let i = 5; i <= nd; i++) d[3] *= Math.max(1, dims[i]);   // extra dimensions are folded into the 4th
    const n = d[0] * d[1] * d[2] * d[3], [bpv, get] = t;
    if (offset + n * bpv > bytes.length) throw new Error('the file is shorter than its header says');
    if (!slope || !isFinite(slope)) { slope = 1; inter = 0; }
    if (!isFinite(inter)) inter = 0;
    const data = new Float32Array(n);
    for (let i = 0, o = offset; i < n; i++, o += bpv) data[i] = dv[get](o, le) * slope + inter;
    return { dims: d, pixdim: [pixdim[1] || 1, pixdim[2] || 1, pixdim[3] || 1], data };
  }
  return { read };
})();
