//! A volume reader for the browser: the qMRLab viewer's parser (NIfTI, MINC1, MINC2, optionally gzipped), returning
//! the voxel grid itself. Values are scaled to real units; the data are x fastest, then y, z, frames (echoes).
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct RawVolume {
    dims: Vec<u32>,
    pixdim: Vec<f64>,
    data: Vec<f32>,
}

#[wasm_bindgen]
impl RawVolume {
    /// [nx, ny, nz, nt]
    #[wasm_bindgen(getter)]
    pub fn dims(&self) -> Vec<u32> {
        self.dims.clone()
    }
    /// Voxel sizes [dx, dy, dz] (mm).
    #[wasm_bindgen(getter)]
    pub fn pixdim(&self) -> Vec<f64> {
        self.pixdim.clone()
    }
    /// All frames, x fastest.
    #[wasm_bindgen(getter)]
    pub fn data(&self) -> Vec<f32> {
        self.data.clone()
    }
}

/// Reads a NIfTI or MINC file (bytes as read from disk). Throws an Error with the reader's message.
#[wasm_bindgen(js_name = readVolume)]
pub fn read_volume(bytes: &[u8]) -> Result<RawVolume, JsValue> {
    let v = labview::parse(bytes).map_err(|e| JsValue::from(js_sys_error(&e)))?;
    Ok(RawVolume {
        dims: vec![v.dims[0] as u32, v.dims[1] as u32, v.dims[2] as u32, v.nt as u32],
        pixdim: v.info.pixdim.to_vec(),
        data: v.data,
    })
}

fn js_sys_error(msg: &str) -> JsValue {
    JsValue::from_str(msg)
}
