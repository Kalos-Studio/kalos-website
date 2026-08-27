"""Compose a case study cover from full phone screenshots.

    python3 scripts/compose-cover.py \
        --out public/work/my-heb-app/cover.webp \
        public/work/my-heb-app/{list,route,total}.webp

Why this exists. A cover is one file -- `landingCover` is spread over `cover`,
so the landing panel and the case study hero are always the same picture at the
same crop, which is the precondition for the morph between them. So when a study
wants several screens on its cover they have to be composited, and CLAUDE.md's
rule for that is to mask and shadow each screen *at composite time*: rounding a
flat composite rounds the outer edge of the picture rather than the phones, and
shadowing it puts one shadow under all three.

The numbers below were measured off the cover this replaced, so a regenerated
cover looks like the hand-made ones beside it:

  radius   0.185 x the phone's width
  shadow   soft, no offset -- 247/255 immediately outside the edge, white again
           by ~30px out at this scale

The reason it was rebuilt at all: the original composite laid its phones out
1405px tall on a 1362px canvas, so 226px of every phone was cut off. That took
the "Begin Spree with 4 items" button off the first screen and the "Turn right
and head towards Aisle 34" instruction off the second -- the two things those
screens were chosen to show.
"""

import argparse
from PIL import Image, ImageDraw, ImageFilter

# The panel frame, and so the cover frame: 1195x681 at 2x.
WIDTH, HEIGHT = 2390, 1362

# Space above and below the phones. Everything else follows from it: the phones
# are as large as fitting them whole inside the frame allows, which is smaller
# than a composite that lets them run off the bottom and is the entire point.
MARGIN = 56

RADIUS_RATIO = 0.185
GAP_RATIO = 0.052  # gap between phones, as a fraction of a phone's width

# Matched to the measurement above: a blurred rounded rectangle at this alpha
# reads as 247/255 against white right at the edge.
SHADOW_ALPHA = 18
SHADOW_BLUR = 14


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([(0, 0), (size[0] - 1, size[1] - 1)],
                                           radius=radius, fill=255)
    return mask


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sources", nargs="+")
    ap.add_argument("--out", required=True)
    ap.add_argument("--margin", type=int, default=MARGIN)
    ap.add_argument("--quality", type=int, default=88)
    args = ap.parse_args()

    screens = [Image.open(p).convert("RGB") for p in args.sources]

    phone_h = HEIGHT - 2 * args.margin
    # Every screen is assumed to share the first one's aspect, which is true of
    # a set of exports from one device and obvious in the output if it is not.
    phone_w = round(phone_h * screens[0].width / screens[0].height)
    radius = round(phone_w * RADIUS_RATIO)
    gap = round(phone_w * GAP_RATIO)

    total = len(screens) * phone_w + (len(screens) - 1) * gap
    if total > WIDTH:
        raise SystemExit(f"{len(screens)} phones at {phone_w}px do not fit in {WIDTH}px")
    left = (WIDTH - total) // 2

    canvas = Image.new("RGB", (WIDTH, HEIGHT), "white")
    mask = rounded_mask((phone_w, phone_h), radius)

    # One shadow per phone, drawn first so neighbours' shadows overlap cleanly.
    shadow_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    block = Image.new("RGBA", (phone_w, phone_h), (0, 0, 0, SHADOW_ALPHA))
    block.putalpha(mask.point(lambda v: v * SHADOW_ALPHA // 255))
    for i in range(len(screens)):
        shadow_layer.alpha_composite(block, (left + i * (phone_w + gap), args.margin))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(SHADOW_BLUR))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), shadow_layer).convert("RGB")

    for i, screen in enumerate(screens):
        resized = screen.resize((phone_w, phone_h), Image.LANCZOS)
        canvas.paste(resized, (left + i * (phone_w + gap), args.margin), mask)

    canvas.save(args.out, "WEBP", quality=args.quality, method=6)
    print(f"{args.out}  {WIDTH}x{HEIGHT}  phones {phone_w}x{phone_h} "
          f"radius {radius} gap {gap} margins {left}/{args.margin}")


if __name__ == "__main__":
    main()
