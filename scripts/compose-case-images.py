#!/usr/bin/env python3
"""Compose the /work/my-heb-app case study images from their source frames.

    python3 scripts/compose-case-images.py

Reads docs/assets/my-heb-app/sources/, writes public/work/my-heb-app/. No
network: the Figma exports and the one deck slide are committed alongside, so
this reproduces the shipped images offline. See the README beside the sources
for where each one came from and how to re-export it.

WHY THIS EXISTS AT ALL. Every frame in that Figma is a 390x844 portrait phone
screen, and body images render at `width: 100%` of the ~860px case study column
(`.work-case-body figure img` in app/work/work.css). Dropped in raw, each screen
would render about 1,860px tall and the page would come to roughly 13,000px of
giant phones. Compositing each screen onto a landscape ground brings that to
~6,200px and lets two screens share one beat where the story wants them side by
side.

The ground is obsidian black rather than H-E-B red on purpose. /work is a near
black page, and five full-bleed red panels down it would read as the brand of
the subject shouting over the brand of the site. Red survives as a bloom behind
the devices, which is the same discipline globals.css applies to Vulcan Gold:
an accent, not a fill.
"""

import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "docs", "assets", "my-heb-app", "sources")
OUT = os.path.join(ROOT, "public", "work", "my-heb-app")

GROUND = (5, 5, 6)        # obsidian black, so the frame melts into the page
HEB_RED = (219, 41, 29)   # sampled off the deck's own background

SINGLE = (1340, 1000)     # 4:3  - one phone
PAIR = (1500, 1000)       # 3:2  - two phones
COVER = (2000, 1125)      # 16:9 - the hero crop on the case study page


def rounded(img, radius):
    """Round a screenshot's corners. Figma exports them square."""
    img = img.convert("RGBA")
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, img.size[0] - 1, img.size[1] - 1], radius=radius, fill=255
    )
    img.putalpha(mask)
    return img


def glow(size, centres, radius, strength=0.13):
    """The red bloom behind the devices.

    Drawn at quarter scale and resized up. A full resolution gaussian at this
    radius costs seconds per image and is indistinguishable in the result,
    because the thing being blurred is a soft ellipse to begin with.

    Strength is deliberately low. The first pass ran at 0.42 and turned the
    whole ground maroon, which read as a coloured background rather than as
    light coming off the screens.
    """
    w, h = size
    layer = Image.new("L", (w // 4, h // 4), 0)
    d = ImageDraw.Draw(layer)
    for cx, cy in centres:
        cx, cy, r = cx // 4, cy // 4, radius // 4
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=int(255 * strength))
    layer = layer.filter(ImageFilter.GaussianBlur(max(1, radius // 8)))
    return Image.new("RGB", (w, h), HEB_RED), layer.resize((w, h), Image.LANCZOS)


def shadow(size, boxes, radius, blur=26, opacity=150):
    layer = Image.new("L", size, 0)
    d = ImageDraw.Draw(layer)
    for x, y, dw, dh in boxes:
        d.rounded_rectangle([x, y + 10, x + dw, y + dh + 10], radius=radius, fill=opacity)
    return layer.filter(ImageFilter.GaussianBlur(blur))


def _place(base, imgs, gap, glow_radius, glow_strength, shadow_radius, corner=None):
    """Lay images out in a centred row over the bloom and their shadows.

    `corner` defaults to the phone radius, proportional to device width. A flat
    artefact (wireframe sheet, deck panel) passes a small fixed radius instead:
    scaling the phone rule to a 1,260px-wide panel rounds its corners by 94px
    and turns a sheet of paper into a lozenge.
    """
    W, H = base.size
    total = sum(i.width for i in imgs) + gap * (len(imgs) - 1)
    x = (W - total) // 2
    boxes, centres = [], []
    for im in imgs:
        y = (H - im.height) // 2
        boxes.append((x, y, im.width, im.height))
        centres.append((x + im.width // 2, y + im.height // 2))
        x += im.width + gap

    red, mask = glow((W, H), centres, glow_radius, glow_strength)
    base.paste(red, (0, 0), mask)
    base.paste((0, 0, 0), (0, 0), shadow((W, H), boxes, radius=shadow_radius))
    for im, (bx, by, _, _) in zip(imgs, boxes):
        rr = rounded(im, corner if corner else max(18, round(im.width * 0.075)))
        base.paste(rr, (bx, by), rr)
    return base


def _load(name, crop=None):
    im = Image.open(os.path.join(SRC, name))
    return im.crop(crop) if crop else im


def devices(name, sources, canvas, height_frac=0.88, gap=64):
    """One or more phone screens, scaled to a common height and centred.

    Every screen in a pair must share a source height or the two land at
    visibly different scales: the drawer frame is a scrolled-out 390x1434
    export, and matched by height against an 844 screen its content came out
    two thirds the size of its neighbour's. It is cropped to 844 in the recipe
    below instead, which is the viewport a phone actually shows.
    """
    W, H = canvas
    target = int(H * height_frac)
    imgs = []
    for src in sources:
        im = _load(*src) if isinstance(src, tuple) else _load(src)
        k = target / im.height
        imgs.append(im.resize((round(im.width * k), target), Image.LANCZOS))

    total = sum(i.width for i in imgs) + gap * (len(imgs) - 1)
    if total > W * 0.86:                       # never let a pair touch the edges
        k = (W * 0.86) / total
        imgs = [i.resize((round(i.width * k), round(i.height * k)), Image.LANCZOS) for i in imgs]

    base = _place(Image.new("RGB", canvas, GROUND), imgs, gap, int(H * 1.15), 0.13, 34)
    _save(base, name)


def panel(name, source, canvas, width_frac=0.84, crop=None):
    """A landscape artefact (the wireframe sheet, the deck's pain points board)."""
    W, H = canvas
    im = _load(source, crop)
    k = min((W * width_frac) / im.width, (H * 0.86) / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    base = _place(Image.new("RGB", canvas, GROUND), [im], 0, int(H * 1.15), 0.13, 24, corner=20)
    _save(base, name)


def cover(name, sources):
    """The 16:9 hero.

    Two constraints, both learned the hard way:

    - The /work card and the "more case studies" thumbnails crop this to 16:10
      (`.work-card-cover`, `.work-more-cover`), so everything has to sit inside
      the central 1800px or the outer phones lose their edges on the listing.
    - Every screen here must be 844 tall. The first cover used the 390x1057
      finish screen as its third phone and it read as a device with a broken
      viewport next to two normal ones.
    """
    W, H = COVER
    target = int(H * 0.80)
    imgs = []
    for src in sources:
        im = _load(src)
        k = target / im.height
        imgs.append(im.resize((round(im.width * k), target), Image.LANCZOS))

    gap = 76
    safe = H * 16 / 10                          # 1800px of 16:10 safe area
    total = sum(i.width for i in imgs) + gap * (len(imgs) - 1)
    if total > safe * 0.92:
        k = (safe * 0.92) / total
        imgs = [i.resize((round(i.width * k), round(i.height * k)), Image.LANCZOS) for i in imgs]

    base = _place(Image.new("RGB", COVER, GROUND), imgs, gap, int(H * 1.2), 0.16, 30)
    _save(base, name)


def _save(img, name):
    os.makedirs(OUT, exist_ok=True)
    img.save(os.path.join(OUT, name), "WEBP", quality=90, method=6)
    print(f"{name:18} {img.size[0]}x{img.size[1]}")


# The recipe. One entry per image in the case study's `body`, in page order.
# Changing which screens appear is editing this list and rerunning; the alt text
# and captions live with the copy in app/work/data.js and have to move with it.
if __name__ == "__main__":
    devices("list.webp", ["list.png"], SINGLE)
    # The slide header carries a personal byline, and the case study is written
    # in the studio's "we". Cropped to the card grid.
    panel("painpoints.webp", "painpoints-slide.png", PAIR, crop=(430, 330, 2130, 1300))
    panel("wireframes.webp", "wireframes.png", PAIR)
    devices("route.webp", ["spree.png", ("drawer.png", (0, 0, 390, 844))], PAIR)
    devices("total.webp", ["scale.png", "barcode.png"], PAIR)
    devices("finish.webp", ["finish.png"], SINGLE)
    devices("receipt.webp", ["receipt.png"], SINGLE)
    cover("cover.webp", ["list.png", "summary.png", "spree.png"])
