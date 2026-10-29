//! Native check: print B+ at fixed points and Table I statistics, to compare with the Python reference.
use sledpike::{map, model};
use std::time::Instant;

fn main() {
    let pts = [(0.03, 0.02), (-0.05, 0.04), (0.08, -0.01), (0.0005, 0.0005), (-0.02, -0.06)];
    for rho in [1.0, 2.0, 4.0] {
        let m = model(rho, 64e6, 80.0, 0.10, 0.075, 12);
        for (x, y) in pts {
            let b = m.bplus(x, y);
            println!("pt rho={rho} x={x} y={y} re={:.12e} im={:.12e}", b.re, b.im);
        }
    }
    for freq in [63.6e6, 63.87e6, 127.73e6] {
        for rho in [1.0, 2.0, 4.0] {
            let t = Instant::now();
            let (_, nx, ny, st) = map(rho, freq, 80.0, 0.10, 0.075, 0.5e-3, 12, 2e-3);
            println!("table f={:.2}MHz rho={rho} SD={:.2}% min={:.3} max={:.3} ({nx}x{ny}, {:.0} ms)", freq / 1e6, 100.0 * st[1], st[2], st[3], t.elapsed().as_secs_f64() * 1e3);
        }
    }
}
