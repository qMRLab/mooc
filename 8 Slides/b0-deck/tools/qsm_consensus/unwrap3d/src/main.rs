// unwrap3d <phase.f32> <mask.u8> <nx> <ny> <nz> <n_intervals> <out.f32>: 3D region-merging unwrap of raw arrays
use regionmerge_unwrap::{unwrap, Dims, Options};
use std::fs;
fn main() {
    let a: Vec<String> = std::env::args().collect();
    let ph: Vec<f64> = fs::read(&a[1]).unwrap().chunks(4).map(|b| f32::from_le_bytes([b[0], b[1], b[2], b[3]]) as f64).collect();
    let mk: Vec<bool> = fs::read(&a[2]).unwrap().iter().map(|&b| b != 0).collect();
    let dims = Dims { nx: a[3].parse().unwrap(), ny: a[4].parse().unwrap(), nz: a[5].parse().unwrap() };
    let opts = Options { n_intervals: a[6].parse().unwrap(), ..Default::default() };
    let r = unwrap(&ph, dims, Some(&mk), None, &opts).unwrap();
    eprintln!("regions {} merges {}", r.n_regions, r.n_merges);
    let out: Vec<u8> = r.unwrapped.iter().flat_map(|&v| (v as f32).to_le_bytes()).collect();
    fs::write(&a[7], out).unwrap();
}
