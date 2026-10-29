//! Checks for the rotated-ellipse (lab-fixed coil) evaluation.
use sledpike::{map_rot, model, motion_maps};

fn main() {
    let f3 = 42.577e6 * 3.0;
    let pts = [(0.03, 0.02), (-0.05, 0.04), (0.08, -0.01), (0.0005, 0.0005), (-0.02, -0.06)];
    let m = model(2.0, f3, 80.0, 0.10, 0.075, 12);

    // 1. theta = 0 reproduces the paper's (39)
    let mut e0: f64 = 0.0;
    for (x, y) in pts {
        let (a, b) = (m.bplus(x, y), m.bplus_lab(0.0, x, y));
        e0 = e0.max((a - b).abs() / a.abs());
    }
    println!("theta=0 vs bplus: max rel diff {e0:.2e}");

    // 2. static limit: each coil gives its own uniform unit field
    let ms = model(1e9, 1e3, 1.0, 0.10, 0.075, 12);
    let [(xx, xy), (yx, yy)] = ms.coil_fields(0.03, -0.02);
    println!("static x coil ({:.6}, {:.2e})  y coil ({:.2e}, {:.6})", xx.abs(), xy.abs(), yx.abs(), yy.abs());

    // 3. lab-frame |B+| vs |B+| of the unrotated ellipse at the rotated point
    let mut er: f64 = 0.0;
    for th_deg in [15.0_f64, 30.0, 45.0, 60.0, 90.0, 137.0] {
        let th = th_deg.to_radians();
        for (gx, gy) in pts {
            let (x, y) = (gx * th.cos() + gy * th.sin(), -gx * th.sin() + gy * th.cos());
            if (x / 0.10f64).powi(2) + (y / 0.075f64).powi(2) >= 1.0 {
                continue;
            }
            let (a, b) = (m.bplus(x, y).abs(), m.bplus_lab(th, gx, gy).abs());
            er = er.max((a - b).abs() / a);
        }
    }
    println!("rotated |B+| vs unrotated at rotated point: max rel diff {er:.2e}");

    // 4. map statistics vs angle (3 T, rho = 2)
    for th_deg in [0.0_f64, 30.0, 45.0, 90.0] {
        let (_, nx, _, st) = map_rot(2.0, f3, 80.0, 0.10, 0.075, th_deg.to_radians(), 1e-3, 12, 2e-3);
        println!("theta={th_deg:>4} SD={:.3}% min={:.3} max={:.3} ({nx}x{nx})", 100.0 * st[1], st[2], st[3]);
    }

    // 5. inter-scan motion: transmit field after perfect registration equals position 1 (CP coil)
    for (th_deg, tx, ty) in [(0.0_f64, 0.0, 0.0), (18.0, 0.008, -0.005), (-30.0, 0.03, 0.03)] {
        let (m, nx, ny) = motion_maps(2.0, f3, 80.0, 0.10, 0.075, th_deg.to_radians(), tx, ty, 2e-3, 12, 2e-3);
        let (a, b) = m.split_at(nx * ny);
        let d = a.iter().zip(b).filter(|(u, _)| u.is_finite()).map(|(u, v)| (u - v).abs()).fold(0.0, f64::max);
        println!("motion theta={th_deg} t=({tx},{ty}): max |B1+ registered − B1+ pos 1| = {d:.2e}");
    }
}
