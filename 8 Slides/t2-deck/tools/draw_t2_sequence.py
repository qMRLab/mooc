#!/usr/bin/env python3
"""Redraw the book's Figure 3.2 (3 T2 Mapping/02-Monoexponential T2 Mapping/img/t2_sequence.png, 461 x 286 px) as a
vector image with the same layout (every position below is in the original's pixels). Writes img/t2_sequence.svg for the
deck, and the same file beside the original in the chapter, which the book now shows.

Usage (from the t2-deck folder):
    python3 -I tools/draw_t2_sequence.py
"""
import math
from pathlib import Path

DECK = Path(__file__).resolve().parents[1]
OUTS = [DECK / "img" / "t2_sequence.svg", DECK.parents[1] / "3 T2 Mapping" / "02-Monoexponential T2 Mapping" / "img" / "t2_sequence.svg"]
RF_Y, SIG_Y = 100, 271          # baselines of the RF and signal rows
X0, X1 = 40, 387                # where the RF line starts and ends; dots follow
FONT = "'Times New Roman', Times, serif"


def pulse(xc, height, half):
    """A sinc-like RF pulse centred on xc: main lobe up, first side lobes down, second side lobes up."""
    pts = []
    for k in range(-120, 121):
        t = 2.5 * k / 120                       # lobes at t = 0, ±1, ±2; the pulse ends at ±2.5
        # lobe heights relative to the main lobe, as drawn in the original: about 0.55, then 0.32
        env = 1.0 - (1.0 - 0.55) * min(1, max(0, (abs(t) - 0.25) / 0.75)) if abs(t) < 1.0 else 0.55 - (0.55 - 0.32) * min(1, abs(t) - 1.0)
        v = math.cos(math.pi * t) * env
        pts.append((xc + half * t / 2.5, RF_Y - height * v))
    return pts


def echo(xc, top, half):
    """A narrow echo (or the FID): a peak rising from the signal baseline."""
    pts = []
    for k in range(-30, 31):
        u = k / 30
        pts.append((xc + half * u, SIG_Y - (SIG_Y - top) * (1 - u * u) ** 2.2))
    return pts


def poly(pts, **attrs):
    a = " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in attrs.items())
    return f'<polyline points="{" ".join(f"{x:.2f},{y:.2f}" for x, y in pts)}" {a}/>'


def text(x, y, s, size=11, sub=None, anchor="middle", rotate=None):
    t = f'<tspan>{s}</tspan>' + (f'<tspan font-size="{size * 0.65:.1f}" dy="2">{sub}</tspan>' if sub else "")
    tr = f' transform="rotate({rotate} {x} {y})"' if rotate else ""
    return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}"{tr}>{t}</text>'


def main():
    sw = dict(fill="none", stroke="#000", stroke_width="1.6", stroke_linejoin="round", stroke_linecap="round")
    p90, p180 = (65, 29, 17.5), [(140, 65, 23), (221, 65, 23), (303, 65, 23)]
    # the RF line: baseline between pulses, and the pulses themselves
    segs = []
    edges = [(p90[0] - p90[2], p90[0] + p90[2])] + [(x - h, x + h) for x, _, h in p180]
    xs = [X0] + [v for e in edges for v in e] + [X1]
    for a, b in zip(xs[0::2], xs[1::2]):
        segs.append(poly([(a, RF_Y), (b, RF_Y)], **sw))
    segs.append(poly(pulse(p90[0], p90[1], p90[2]), **sw))
    for x, h, half in p180:
        segs.append(poly(pulse(x, h, half), **sw))
    dots = lambda y: f'<line x1="393" y1="{y}" x2="442" y2="{y}" stroke="#000" stroke-width="1.6" stroke-dasharray="2 3.2"/>'
    # TE/2: dashed lines down from the 90° and the first 180°, and a double arrow between them
    dash = ''.join(f'<line x1="{x}" y1="{y}" x2="{x}" y2="153" stroke="#555" stroke-width="1" stroke-dasharray="3 2.5"/>'
                   for x, y in ((p90[0], RF_Y - p90[1] + 2), (p180[0][0], RF_Y - p180[0][1] + 2)))  # through the middle of each pulse
    arrow = (f'<line x1="{p90[0] + 0.8}" y1="152" x2="{p180[0][0] - 0.8}" y2="152" stroke="#000" stroke-width="1.6" marker-start="url(#ah)" marker-end="url(#ah)"/>')
    # the signal row: axis, FID, echoes, and the T2 decay through the echo tops
    tops = [(184, 212, 7.5), (263, 246, 5.5), (347, 257, 5.5)]
    decay = [(x, SIG_Y - (9 + 50 * math.exp(-(x - 184) / 71))) for x in range(184, X1 + 1)]
    sig = [poly([(43, SIG_Y), (X1, SIG_Y)], **sw), '<line x1="43" y1="271" x2="43" y2="201" stroke="#000" stroke-width="1.6" marker-end="url(#ah)"/>',
           poly(echo(66, 201, 7.5), **sw)] + [poly(echo(x, y, h), **sw) for x, y, h in tops] + [poly(decay, **sw)]
    labels = [text(69, 59, "90°", 11, "x"), *[text(x + 3, 21, "180°", 11, "y") for x, _, _ in p180],
              text(103, 168, "TE/2", 11), text(25, 104, "RF", 11, rotate=-90),
              text(68.5, 193, "FID", 11), text(189, 206, "TE 1", 11), text(266, 236, "TE 2", 11), text(353, 249, "TE 3", 11),
              text(28, 239, "MR signal", 11, rotate=-90)]
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 461 286" font-family="{FONT}" fill="#000">'
           '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">'
           '<path d="M0,0 L10,5 L0,10 z"/></marker></defs>'
           + "".join(segs) + dots(RF_Y) + dash + arrow + "".join(sig) + dots(SIG_Y) + "".join(labels) + "</svg>\n")
    for out in OUTS:
        out.write_text(svg)
        print(out.relative_to(DECK.parents[1]), f"{len(svg) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
