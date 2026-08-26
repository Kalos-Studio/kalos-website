#!/usr/bin/env python3
"""Render the Open Graph share card from its SVG source.

    python3 scripts/render-og-image.py     # needs Pillow, nothing else

Reads docs/assets/og-image.svg (the Kalos lockup in brand white) and writes
app/opengraph-image.png at 1200x630 with a black ground.

Why this exists rather than a one-off export: the card is the lockup, the lockup
lives in the repo as vector paths, and a PNG is not a source you can edit. Same
reasoning as docs/assets/my-heb-app -- keep the input and the recipe so the
output can be regenerated instead of recovered.

Why it hand-rolls a rasteriser: this machine has no rsvg-convert, cairosvg,
Inkscape or ImageMagick, and macOS Quick Look (qlmanage) is not a renderer -- it
returns a square thumbnail with document chrome baked in, which is what it was
asked for and not what we need. The artwork is 6 paths using only M/L/H/V/C/Z
with no arcs, no strokes, no transforms and no gradients, so the subset needed
here is small and entirely testable against the geometry in the file.
"""

import re
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs/assets/og-image.svg"
OUT = ROOT / "app/opengraph-image.png"

# The share card's ground. The source SVG carries #212225, the brand's near-black
# surface, because it was drawn as a slide. The card is black.
GROUND = (0, 0, 0)

# Everything is rendered at this multiple and then resampled down. Pillow's
# polygon fill is hard-edged -- there is no antialiasing to ask for -- so the
# downsample is what produces clean curve edges. 4x is where the letterform
# counters stop showing stair-stepping at 1200 wide.
SUPERSAMPLE = 4

# Cubic segments per curve. The longest curve here spans roughly 90 user units,
# which at 4x is 360 device pixels, so 48 segments puts each chord well under a
# pixel. Flat is flat; going higher only costs time.
CURVE_STEPS = 48

NUMBER = re.compile(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?")
COMMAND = re.compile(r"([MmLlHhVvCcZz])")


def tokenize(d):
    """Split a path's `d` into (command, [numbers]) pairs."""
    out = []
    for chunk in (c for c in COMMAND.split(d) if c.strip()):
        if COMMAND.fullmatch(chunk):
            out.append([chunk, []])
        elif out:
            out[-1][1].extend(float(n) for n in NUMBER.findall(chunk))
    return out


def cubic(p0, p1, p2, p3, steps=CURVE_STEPS):
    """Flatten one cubic bezier to points, excluding the start point."""
    pts = []
    for i in range(1, steps + 1):
        t = i / steps
        u = 1 - t
        a, b, c, dd = u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t
        pts.append(
            (
                a * p0[0] + b * p1[0] + c * p2[0] + dd * p3[0],
                a * p0[1] + b * p1[1] + c * p2[1] + dd * p3[1],
            )
        )
    return pts


def subpaths(d):
    """Flatten a path's `d` into a list of point lists, one per subpath."""
    paths, current = [], []
    cursor = start = (0.0, 0.0)

    def flush():
        # Two points cannot enclose area, so anything shorter is dropped rather
        # than handed to polygon() as a degenerate shape.
        if len(current) > 2:
            paths.append(list(current))

    for cmd, nums in tokenize(d):
        rel = cmd.islower()
        up = cmd.upper()

        if up == "Z":
            flush()
            current = []
            cursor = start
            continue

        # Each command's operands repeat: "L 1 2 3 4" is two linetos. Step
        # through in the right stride so a repeated run is handled like the
        # separate commands it stands for.
        stride = {"M": 2, "L": 2, "H": 1, "V": 1, "C": 6}[up]
        for i in range(0, len(nums) - stride + 1, stride):
            seg = nums[i : i + stride]

            if up == "M":
                x, y = seg
                if rel:
                    x, y = cursor[0] + x, cursor[1] + y
                # A second coordinate pair after M is an implicit lineto, which
                # is why this only starts a subpath on the first pair.
                if i == 0:
                    flush()
                    current = [(x, y)]
                    start = (x, y)
                else:
                    current.append((x, y))
                cursor = (x, y)

            elif up in ("L", "H", "V"):
                if up == "L":
                    x, y = seg
                    if rel:
                        x, y = cursor[0] + x, cursor[1] + y
                elif up == "H":
                    x = cursor[0] + seg[0] if rel else seg[0]
                    y = cursor[1]
                else:
                    x = cursor[0]
                    y = cursor[1] + seg[0] if rel else seg[0]
                current.append((x, y))
                cursor = (x, y)

            elif up == "C":
                pts = [seg[0:2], seg[2:4], seg[4:6]]
                if rel:
                    pts = [(cursor[0] + px, cursor[1] + py) for px, py in pts]
                else:
                    pts = [tuple(p) for p in pts]
                current.extend(cubic(cursor, *pts))
                cursor = pts[2]

    flush()
    return paths


def fill_mask(paths, size):
    """Rasterise subpaths to a mask, treating every subpath as even-odd.

    The source marks exactly one path fill-rule="evenodd" and leaves the rest to
    nonzero winding. That distinction does not matter for this artwork: a
    counter -- the hole in an "o" or an "a" -- is a separate subpath that lies
    entirely inside its outer contour and nowhere else, and even-odd and nonzero
    agree on that shape whichever way the inner contour is wound. XOR-ing each
    subpath in turn punches the counters out under either rule.

    This would be wrong for artwork with genuinely overlapping same-wound
    subpaths, where nonzero unions what even-odd cancels. There is none here,
    and a fill-rule aware rasteriser is a lot of machinery for a hole in an "a".
    """
    # Mode "1" throughout: ImageChops.logical_xor only accepts bilevel images,
    # and a bilevel mask is what XOR-ing contours wants anyway. Converted to "L"
    # on the way out so paste() can use it as an alpha mask.
    mask = Image.new("1", size, 0)
    for pts in paths:
        layer = Image.new("1", size, 0)
        ImageDraw.Draw(layer).polygon(pts, fill=1)
        mask = ImageChops.logical_xor(mask, layer)
    return mask.convert("L")


def main():
    if not SRC.exists():
        sys.exit(f"missing source: {SRC}")

    svg = SRC.read_text(encoding="utf-8")

    vb = re.search(r'viewBox="([\d.\-\s]+)"', svg)
    if not vb:
        sys.exit("source has no viewBox")
    _, _, vw, vh = (float(v) for v in vb.group(1).split())
    w, h = int(round(vw)), int(round(vh))

    scale = SUPERSAMPLE
    big = (w * scale, h * scale)
    canvas = Image.new("RGB", big, GROUND)

    drawn = 0
    for d, fill in re.findall(r'<path[^>]*\bd="([^"]+)"[^>]*?\bfill="([^"]+)"',
                              svg):
        if fill.lower() in ("none", ""):
            continue
        paths = [[(x * scale, y * scale) for x, y in sp] for sp in subpaths(d)]
        if not paths:
            continue
        colour = tuple(int(fill.lstrip("#")[i : i + 2], 16) for i in (0, 2, 4))
        canvas.paste(colour, (0, 0), fill_mask(paths, big))
        drawn += 1

    if not drawn:
        sys.exit("no filled paths found -- the source did not parse")

    out = canvas.resize((w, h), Image.LANCZOS)
    out.save(OUT, "PNG", optimize=True)
    print(f"{OUT.relative_to(ROOT)}  {w}x{h}  {drawn} paths  "
          f"{OUT.stat().st_size / 1024:.1f}KB")


if __name__ == "__main__":
    main()
