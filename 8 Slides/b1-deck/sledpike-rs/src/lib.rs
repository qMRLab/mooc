//! Sled & Pike (1998) IEEE TMI 17(4):653–662: analytic B1+ inside a long lossy dielectric cylinder of
//! elliptic cross-section, excited by a circularly polarized coil (Section II-A).
//!
//! * Inside: Ez solves the Helmholtz equation (13) with complex k (15)–(16); in elliptic coordinates
//!   (6)–(12) it separates into Mathieu functions (17)–(18) with q = h²/4, h = l·k.
//! * Outside: quasi-static (k = 0), Ez = e^ξ cos η + Σ p_m e^{−mξ} cos mη (22), and the sine analogue (31).
//! * Interior expansions (28)/(34); coefficients from continuity of B_ξ and B_η at ξ0 (Appendix).
//! * The two linear coils combine in quadrature into B+ (39).
//!
//! Mathieu functions with complex q come from their Fourier coefficients: eigenvectors of the standard
//! recurrence matrix, found by Rayleigh-quotient inverse iteration started from the q = 0 pair (the
//! characteristic numbers k² are ≥ 8 apart, |q| < 1 here). Radial functions of the first kind use the
//! exact continuation Je_n(ξ) ∝ Σ A_k cosh kξ, Jo_n(ξ) ∝ Σ B_k sinh kξ; their normalisation cancels in
//! the solved coefficients. Only odd harmonics appear: a uniform field along y (x) gives Ez ∝ x (y).

use std::ops::{Add, AddAssign, Div, Mul, Neg, Sub};
use std::sync::Mutex;

pub const C0: f64 = 299_792_458.0;
pub const EPS0: f64 = 8.854_187_812_8e-12;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct C {
    pub re: f64,
    pub im: f64,
}

impl C {
    pub const ZERO: C = C { re: 0.0, im: 0.0 };
    pub const J: C = C { re: 0.0, im: 1.0 };
    pub fn new(re: f64, im: f64) -> C {
        C { re, im }
    }
    pub fn abs(self) -> f64 {
        self.re.hypot(self.im)
    }
    pub fn scale(self, s: f64) -> C {
        C::new(self.re * s, self.im * s)
    }
}
impl Add for C {
    type Output = C;
    fn add(self, o: C) -> C {
        C::new(self.re + o.re, self.im + o.im)
    }
}
impl AddAssign for C {
    fn add_assign(&mut self, o: C) {
        self.re += o.re;
        self.im += o.im;
    }
}
impl Sub for C {
    type Output = C;
    fn sub(self, o: C) -> C {
        C::new(self.re - o.re, self.im - o.im)
    }
}
impl Neg for C {
    type Output = C;
    fn neg(self) -> C {
        C::new(-self.re, -self.im)
    }
}
impl Mul for C {
    type Output = C;
    fn mul(self, o: C) -> C {
        C::new(self.re * o.re - self.im * o.im, self.re * o.im + self.im * o.re)
    }
}
impl Div for C {
    type Output = C;
    fn div(self, o: C) -> C {
        let d = o.re * o.re + o.im * o.im;
        C::new((self.re * o.re + self.im * o.im) / d, (self.im * o.re - self.re * o.im) / d)
    }
}

/// Odd-order Mathieu functions for complex q: harmonics k = 1, 3, 5, … and the coefficient matrix
/// `r[m * n + j]` (harmonic m of function j). `ce` selects cos-type (ce_{2r+1}) or sin-type (se_{2r+1}).
pub fn mathieu_odd(q: C, n: usize, ce: bool) -> (Vec<f64>, Vec<C>) {
    let k: Vec<f64> = (0..n).map(|i| (2 * i + 1) as f64).collect();
    let mut diag: Vec<C> = k.iter().map(|&x| C::new(x * x, 0.0)).collect();
    diag[0] = if ce { diag[0] + q } else { diag[0] - q };
    let apply = |v: &[C]| -> Vec<C> {
        (0..n)
            .map(|i| {
                let mut s = diag[i] * v[i];
                if i > 0 {
                    s += q * v[i - 1];
                }
                if i + 1 < n {
                    s += q * v[i + 1];
                }
                s
            })
            .collect()
    };
    let mut r = vec![C::ZERO; n * n];
    for t in 0..n {
        let mut v = vec![C::ZERO; n];
        v[t] = C::new(1.0, 0.0);
        // Start just off the unperturbed value (gaps between k² are ≥ 8): an exact hit would make the
        // first solve singular before the eigenvector has moved.
        let mut lam = diag[t] + C::new(0.37, 0.21);
        for _ in 0..100 {
            let w = solve_tridiag(&diag, q, lam, &v);
            if w.iter().any(|x| !x.re.is_finite() || !x.im.is_finite()) {
                break; // λ landed on the eigenvalue to machine precision: keep the last vector
            }
            let imax = (0..n).max_by(|&a, &b| w[a].abs().total_cmp(&w[b].abs())).unwrap();
            let piv = w[imax];
            v = w.iter().map(|&x| x / piv).collect();
            // Complex-symmetric Rayleigh quotient vᵀMv / vᵀv (no conjugation).
            let mv = apply(&v);
            let (mut num, mut den) = (C::ZERO, C::ZERO);
            for i in 0..n {
                num += v[i] * mv[i];
                den += v[i] * v[i];
            }
            let new = num / den;
            let done = (new - lam).abs() <= 1e-14 * new.abs();
            lam = new;
            if done {
                break;
            }
        }
        for m in 0..n {
            r[m * n + t] = v[m];
        }
    }
    (k, r)
}

/// Solve (T − λI) w = v for the tridiagonal T with the given diagonal and constant off-diagonal q.
fn solve_tridiag(diag: &[C], q: C, lam: C, v: &[C]) -> Vec<C> {
    let n = diag.len();
    let mut c = vec![C::ZERO; n];
    let mut d = vec![C::ZERO; n];
    let guard = |x: C| if x.abs() < 1e-300 { C::new(1e-300, 0.0) } else { x };
    let mut b = guard(diag[0] - lam);
    c[0] = q / b;
    d[0] = v[0] / b;
    for i in 1..n {
        b = guard(diag[i] - lam - q * c[i - 1]);
        c[i] = q / b;
        d[i] = (v[i] - q * d[i - 1]) / b;
    }
    let mut w = vec![C::ZERO; n];
    w[n - 1] = d[n - 1];
    for i in (0..n - 1).rev() {
        w[i] = d[i] - c[i] * w[i + 1];
    }
    w
}

/// Dense complex solve with partial pivoting (A is n×n row-major).
fn solve_dense(mut a: Vec<C>, mut b: Vec<C>, n: usize) -> Vec<C> {
    for col in 0..n {
        let p = (col..n).max_by(|&x, &y| a[x * n + col].abs().total_cmp(&a[y * n + col].abs())).unwrap();
        if p != col {
            for j in 0..n {
                a.swap(col * n + j, p * n + j);
            }
            b.swap(col, p);
        }
        let piv = a[col * n + col];
        for row in col + 1..n {
            let f = a[row * n + col] / piv;
            for j in col..n {
                let t = a[col * n + j];
                a[row * n + j] = a[row * n + j] - f * t;
            }
            let t = b[col];
            b[row] = b[row] - f * t;
        }
    }
    let mut x = vec![C::ZERO; n];
    for row in (0..n).rev() {
        let mut s = b[row];
        for j in row + 1..n {
            s = s - a[row * n + j] * x[j];
        }
        x[row] = s / a[row * n + row];
    }
    x
}

/// One linear coil: Mathieu basis plus solved interior coefficients.
pub struct Coil {
    pub ce: bool,
    pub k: Vec<f64>,
    pub r: Vec<C>,
    pub coef: Vec<C>,
}

pub fn solve_coil(q: C, xi0: f64, n: usize, ce: bool) -> Coil {
    let (k, r) = mathieu_odd(q, n, ce);
    // Radial functions at the boundary: J_j(ξ0) and J'_j(ξ0).
    let mut jv = vec![C::ZERO; n];
    let mut jp = vec![C::ZERO; n];
    for j in 0..n {
        for m in 0..n {
            let (f, fp) = if ce {
                ((k[m] * xi0).cosh(), k[m] * (k[m] * xi0).sinh())
            } else {
                ((k[m] * xi0).sinh(), k[m] * (k[m] * xi0).cosh())
            };
            jv[j] += r[m * n + j].scale(f);
            jp[j] += r[m * n + j].scale(fp);
        }
    }
    // Σ_j r[m,j] (k_m J_j + J'_j) c_j = 2 e^{ξ0} δ_{k_m,1}   (Appendix (57)–(59))
    let mut a = vec![C::ZERO; n * n];
    for m in 0..n {
        for j in 0..n {
            a[m * n + j] = r[m * n + j] * (jv[j].scale(k[m]) + jp[j]);
        }
    }
    let mut rhs = vec![C::ZERO; n];
    rhs[0] = C::new(2.0 * xi0.exp(), 0.0);
    let coef = solve_dense(a, rhs, n);
    Coil { ce, k, r, coef }
}

pub struct Model {
    pub l: f64,
    pub ycoil: Coil,
    pub xcoil: Coil,
}

pub fn model(rho: f64, freq: f64, eps_r: f64, rx: f64, ry: f64, n: usize) -> Model {
    let omega = 2.0 * std::f64::consts::PI * freq;
    let k0sq = (omega / C0).powi(2);
    let k2 = C::new(k0sq * eps_r, -k0sq / (omega * EPS0 * rho)); // k² from (15)–(16)
    let l = (rx * rx - ry * ry).sqrt();
    let xi0 = (ry / rx).atanh();
    let q = k2.scale(l * l / 4.0); // q = h²/4, h = l k
    Model { l, ycoil: solve_coil(q, xi0, n, true), xcoil: solve_coil(q, xi0, n, false) }
}

impl Model {
    /// Complex B+ at Cartesian (x, y), x along the major axis.
    pub fn bplus(&self, x: f64, y: f64) -> C {
        let l = self.l;
        let r1 = ((x - l).powi(2) + y * y).sqrt();
        let r2 = ((x + l).powi(2) + y * y).sqrt();
        let xi = ((r1 + r2) / (2.0 * l)).max(1.0).acosh(); // (11)
        let eta = if y >= 0.0 { 1.0 } else { -1.0 } * ((r2 - r1) / (2.0 * l)).clamp(-1.0, 1.0).acos(); // (12)
        let g = (0.5 * ((2.0 * xi).cosh() - (2.0 * eta).cos())).sqrt();
        let gg = 1.0 / g; // G (25)
        let ejalpha = C::new(xi.sinh() * eta.cos(), xi.cosh() * eta.sin()).scale(1.0 / g); // (38)

        let (bxi_y, beta_y) = self.ycoil.fields(xi, eta);
        let (bxi_x, beta_x) = self.xcoil.fields(xi, eta);
        let (bxi_y, beta_y, bxi_x, beta_x) = (bxi_y.scale(gg), beta_y.scale(gg), bxi_x.scale(gg), beta_x.scale(gg));
        // (39): B+ = ½ (B_ξx + jB_ηx − jB_ξy + B_ηy) e^{jα}
        (bxi_x + C::J * beta_x - C::J * bxi_y + beta_y).scale(0.5) * ejalpha
    }

    /// Cartesian (B_x, B_y) phasors of the x coil and of the y coil separately, ellipse frame.
    pub fn coil_fields(&self, x: f64, y: f64) -> [(C, C); 2] {
        let l = self.l;
        let r1 = ((x - l).powi(2) + y * y).sqrt();
        let r2 = ((x + l).powi(2) + y * y).sqrt();
        let xi = ((r1 + r2) / (2.0 * l)).max(1.0).acosh();
        let eta = if y >= 0.0 { 1.0 } else { -1.0 } * ((r2 - r1) / (2.0 * l)).clamp(-1.0, 1.0).acos();
        let g = (0.5 * ((2.0 * xi).cosh() - (2.0 * eta).cos())).sqrt();
        let (ca, sa) = (xi.sinh() * eta.cos() / g, xi.cosh() * eta.sin() / g); // cos α, sin α (38)
        let cart = |(bxi, beta): (C, C)| {
            let (bxi, beta) = (bxi.scale(1.0 / g), beta.scale(1.0 / g));
            (bxi.scale(ca) - beta.scale(sa), bxi.scale(sa) + beta.scale(ca))
        };
        [cart(self.xcoil.fields(xi, eta)), cart(self.ycoil.fields(xi, eta))]
    }

    /// Complex B+ at lab (X, Y) with the ellipse's major axis turned by `theta` from X. The quadrature
    /// coil stays fixed in the lab: its X and Y linear drives are decomposed onto the ellipse's own x and
    /// y coils, the fields rotated back to lab components, and B+ = ½ (B_X + jB_Y) of drive X − jY.
    pub fn bplus_lab(&self, theta: f64, gx: f64, gy: f64) -> C {
        let (c, s) = (theta.cos(), theta.sin());
        let (x, y) = (gx * c + gy * s, -gx * s + gy * c);
        let [(xx, xy), (yx, yy)] = self.coil_fields(x, y);
        // lab X drive = cos θ (x coil) − sin θ (y coil); lab Y drive = sin θ (x coil) + cos θ (y coil)
        let (dx_x, dx_y) = (xx.scale(c) - yx.scale(s), xy.scale(c) - yy.scale(s));
        let (dy_x, dy_y) = (xx.scale(s) + yx.scale(c), xy.scale(s) + yy.scale(c));
        // quadrature drive X − jY, in ellipse-frame components
        let (bx, by) = (dx_x - C::J * dy_x, dx_y - C::J * dy_y);
        // back to lab components
        let (lx, ly) = (bx.scale(c) - by.scale(s), bx.scale(s) + by.scale(c));
        (lx + C::J * ly).scale(0.5)
    }
}

impl Coil {
    /// (B_ξ, B_η) without the common factor G: (29)–(30) for the y coil, (35)–(36) for the x coil.
    fn fields(&self, xi: f64, eta: f64) -> (C, C) {
        let n = self.k.len();
        let (mut bxi, mut beta) = (C::ZERO, C::ZERO);
        for j in 0..n {
            let (mut rad, mut radp, mut ang, mut angp) = (C::ZERO, C::ZERO, C::ZERO, C::ZERO);
            for m in 0..n {
                let km = self.k[m];
                let rm = self.r[m * n + j];
                if self.ce {
                    rad += rm.scale((km * xi).cosh());
                    radp += rm.scale(km * (km * xi).sinh());
                    ang += rm.scale((km * eta).cos());
                    angp += rm.scale(-km * (km * eta).sin());
                } else {
                    rad += rm.scale((km * xi).sinh());
                    radp += rm.scale(km * (km * xi).cosh());
                    ang += rm.scale((km * eta).sin());
                    angp += rm.scale(km * (km * eta).cos());
                }
            }
            let c = self.coef[j];
            if self.ce {
                bxi = bxi - c * rad * angp; // B_ξy = −G Σ q Je Se'
                beta += c * radp * ang; //     B_ηy =  G Σ q Je' Se
            } else {
                bxi += c * rad * angp; //       B_ξx =  G Σ q Jo So'
                beta = beta - c * radp * ang; // B_ηx = −G Σ q Jo' So
            }
        }
        (bxi, beta)
    }
}

/// |B+| on the paper's Fig. 1 grid (x up, y to the left), normalised to its mean inside the ellipse
/// eroded by `erode` (NaN outside the ellipse). Returns (map row-major [nx][ny], nx, ny, [mean, sd, min, max]).
pub fn map(rho: f64, freq: f64, eps_r: f64, rx: f64, ry: f64, step: f64, n: usize, erode: f64) -> (Vec<f64>, usize, usize, [f64; 4]) {
    let md = model(rho, freq, eps_r, rx, ry, n);
    let nx = (2.0 * rx / step).round() as usize;
    let ny = (2.0 * ry / step).round() as usize;
    let mut out = vec![f64::NAN; nx * ny];
    let (mut s, mut s2, mut cnt) = (0.0, 0.0, 0.0);
    let mut eroded = vec![false; nx * ny];
    for i in 0..nx {
        let x = rx - (i as f64 + 0.5) * step; // top row = +x
        for j in 0..ny {
            let y = ry - (j as f64 + 0.5) * step; // left column = +y
            if (x / rx).powi(2) + (y / ry).powi(2) < 1.0 {
                let a = md.bplus(x, y).abs();
                out[i * ny + j] = a;
                if (x / (rx - erode)).powi(2) + (y / (ry - erode)).powi(2) < 1.0 {
                    eroded[i * ny + j] = true;
                    s += a;
                    s2 += a * a;
                    cnt += 1.0;
                }
            }
        }
    }
    let st = normalise(&mut out, &eroded, s, s2, cnt);
    (out, nx, ny, st)
}

/// Divide by the eroded-region mean; return [1, SD/mean, min, max] over the eroded region.
fn normalise(out: &mut [f64], eroded: &[bool], s: f64, s2: f64, cnt: f64) -> [f64; 4] {
    let mean = s / cnt;
    let sd = (s2 / cnt - mean * mean).max(0.0).sqrt() / mean;
    let (mut mn, mut mx) = (f64::INFINITY, f64::NEG_INFINITY);
    for (v, e) in out.iter_mut().zip(eroded.iter()) {
        if v.is_finite() {
            *v /= mean;
            if *e {
                mn = mn.min(*v);
                mx = mx.max(*v);
            }
        }
    }
    [1.0, sd, mn, mx]
}

/// |B+| with the ellipse turned by `theta` inside a fixed quadrature coil, on a square lab grid of side
/// 2·rx (X up, Y to the left, as in `map`). Same normalisation and eroded-region statistics.
pub fn map_rot(rho: f64, freq: f64, eps_r: f64, rx: f64, ry: f64, theta: f64, step: f64, n: usize, erode: f64) -> (Vec<f64>, usize, usize, [f64; 4]) {
    let md = model(rho, freq, eps_r, rx, ry, n);
    let nx = (2.0 * rx / step).round() as usize;
    let mut out = vec![f64::NAN; nx * nx];
    let mut eroded = vec![false; nx * nx];
    let (mut s, mut s2, mut cnt) = (0.0, 0.0, 0.0);
    let (c, sn) = (theta.cos(), theta.sin());
    for i in 0..nx {
        let gx = rx - (i as f64 + 0.5) * step;
        for j in 0..nx {
            let gy = rx - (j as f64 + 0.5) * step;
            let (x, y) = (gx * c + gy * sn, -gx * sn + gy * c);
            if (x / rx).powi(2) + (y / ry).powi(2) < 1.0 {
                let a = md.bplus_lab(theta, gx, gy).abs();
                out[i * nx + j] = a;
                if (x / (rx - erode)).powi(2) + (y / (ry - erode)).powi(2) < 1.0 {
                    eroded[i * nx + j] = true;
                    s += a;
                    s2 += a * a;
                    cnt += 1.0;
                }
            }
        }
    }
    let st = normalise(&mut out, &eroded, s, s2, cnt);
    (out, nx, nx, st)
}

/// Inter-scan motion, ellipse frame on the `map` grid (x up, y to the left; NaN outside). Position 1:
/// ellipse at the lab origin, axes aligned. Position 2: ellipse turned by `theta` and shifted by (tx, ty)
/// inside the same lab-fixed quadrature coil. Returns |B+| at position 1 followed by |B+| at position 2
/// sampled where each ellipse point went (perfect rigid registration), both divided by the position-1
/// mean over the eroded region; then nx, ny.
pub fn motion_maps(rho: f64, freq: f64, eps_r: f64, rx: f64, ry: f64, theta: f64, tx: f64, ty: f64, step: f64, n: usize, erode: f64) -> (Vec<f64>, usize, usize) {
    let md = model(rho, freq, eps_r, rx, ry, n);
    let nx = (2.0 * rx / step).round() as usize;
    let ny = (2.0 * ry / step).round() as usize;
    let mut out = vec![f64::NAN; 2 * nx * ny];
    let (mut s, mut cnt) = (0.0, 0.0);
    let (c, sn) = (theta.cos(), theta.sin());
    for i in 0..nx {
        let x = rx - (i as f64 + 0.5) * step;
        for j in 0..ny {
            let y = ry - (j as f64 + 0.5) * step;
            if (x / rx).powi(2) + (y / ry).powi(2) >= 1.0 {
                continue;
            }
            let a1 = md.bplus_lab(0.0, x, y).abs();
            // lab position of this ellipse point at position 2, then the field there with the ellipse at (theta, t)
            let (gx, gy) = (x * c - y * sn + tx, x * sn + y * c + ty);
            let a2 = md.bplus_lab(theta, gx - tx, gy - ty).abs();
            out[i * ny + j] = a1;
            out[nx * ny + i * ny + j] = a2;
            if (x / (rx - erode)).powi(2) + (y / (ry - erode)).powi(2) < 1.0 {
                s += a1;
                cnt += 1.0;
            }
        }
    }
    let mean = s / cnt;
    out.iter_mut().filter(|v| v.is_finite()).for_each(|v| *v /= mean);
    (out, nx, ny)
}

/// The x coil's and the y coil's fields separately, on the `map` grid (x up, y to the left; NaN outside):
/// per pixel 8 numbers, re/im of (B_x, B_y) of the x coil then of the y coil (ellipse frame = lab, θ = 0),
/// unnormalised. The quadrature drive of `bplus` is x coil − j·(y coil), B+ = ½ (B_x + jB_y).
pub fn fields_map(rho: f64, freq: f64, eps_r: f64, rx: f64, ry: f64, step: f64, n: usize) -> (Vec<f64>, usize, usize) {
    let md = model(rho, freq, eps_r, rx, ry, n);
    let nx = (2.0 * rx / step).round() as usize;
    let ny = (2.0 * ry / step).round() as usize;
    let mut out = vec![f64::NAN; 8 * nx * ny];
    for i in 0..nx {
        let x = rx - (i as f64 + 0.5) * step;
        for j in 0..ny {
            let y = ry - (j as f64 + 0.5) * step;
            if (x / rx).powi(2) + (y / ry).powi(2) >= 1.0 {
                continue;
            }
            let [(xx, xy), (yx, yy)] = md.coil_fields(x, y);
            let o = 8 * (i * ny + j);
            out[o..o + 8].copy_from_slice(&[xx.re, xx.im, xy.re, xy.im, yx.re, yx.im, yy.re, yy.im]);
        }
    }
    (out, nx, ny)
}

// ---- WebAssembly interface: plain exports, no bindings crate ----

struct Buf {
    map: Vec<f64>,
    nx: usize,
    ny: usize,
    stats: [f64; 4],
}

static BUF: Mutex<Buf> = Mutex::new(Buf { map: Vec::new(), nx: 0, ny: 0, stats: [0.0; 4] });

#[no_mangle]
pub extern "C" fn compute(rho: f64, freq: f64, eps_r: f64, rx: f64, ry: f64, step: f64, n_terms: u32, erode: f64) -> u32 {
    let (m, nx, ny, st) = map(rho, freq, eps_r, rx, ry, step, n_terms as usize, erode);
    let mut b = BUF.lock().unwrap();
    b.map = m;
    b.nx = nx;
    b.ny = ny;
    b.stats = st;
    (nx * ny) as u32
}

#[no_mangle]
pub extern "C" fn compute_rot(rho: f64, freq: f64, eps_r: f64, rx: f64, ry: f64, theta: f64, step: f64, n_terms: u32, erode: f64) -> u32 {
    let (m, nx, ny, st) = map_rot(rho, freq, eps_r, rx, ry, theta, step, n_terms as usize, erode);
    let mut b = BUF.lock().unwrap();
    b.map = m;
    b.nx = nx;
    b.ny = ny;
    b.stats = st;
    (nx * ny) as u32
}

#[no_mangle]
pub extern "C" fn compute_motion(rho: f64, freq: f64, eps_r: f64, rx: f64, ry: f64, theta: f64, tx: f64, ty: f64, step: f64, n_terms: u32, erode: f64) -> u32 {
    let (m, nx, ny) = motion_maps(rho, freq, eps_r, rx, ry, theta, tx, ty, step, n_terms as usize, erode);
    let mut b = BUF.lock().unwrap();
    b.map = m;
    b.nx = nx;
    b.ny = ny;
    b.stats = [0.0; 4];
    (nx * ny) as u32
}

#[no_mangle]
pub extern "C" fn compute_fields(rho: f64, freq: f64, eps_r: f64, rx: f64, ry: f64, step: f64, n_terms: u32) -> u32 {
    let (m, nx, ny) = fields_map(rho, freq, eps_r, rx, ry, step, n_terms as usize);
    let mut b = BUF.lock().unwrap();
    b.map = m;
    b.nx = nx;
    b.ny = ny;
    b.stats = [0.0; 4];
    (nx * ny) as u32
}

#[no_mangle]
pub extern "C" fn map_ptr() -> *const f64 {
    BUF.lock().unwrap().map.as_ptr()
}
#[no_mangle]
pub extern "C" fn map_nx() -> u32 {
    BUF.lock().unwrap().nx as u32
}
#[no_mangle]
pub extern "C" fn map_ny() -> u32 {
    BUF.lock().unwrap().ny as u32
}
#[no_mangle]
pub extern "C" fn stat(i: u32) -> f64 {
    BUF.lock().unwrap().stats[i as usize]
}
