# Client marks

One file per client, named after the case study's `slug` in `app/work/data.js`,
pointed at by that entry's `logo` field:

    { slug: "allganize-website-redesign", logo: "/home/logos/allganize.webp" }

They are rendered by `ClientMark` in `app/(landing)/page.js`, as the heading of
each case study's caption row on the landing page. An entry with no `logo`
renders its title in the brand typeface instead, so a half-supplied set still
looks deliberate rather than broken.

## Transparent background, and no padding around the mark

Two separate requirements, and the second is the one that keeps getting missed.

**Transparent**, because the row is drawn in one monochrome weight so it reads
as evidence rather than as a row of competing brand colours. `ClientMark` does
that with `filter: brightness(0)`, which blackens every opaque pixel. A mark
supplied on a white rectangle becomes a black rectangle.

That filter also means the alpha channel is the only thing on screen: RGB is
multiplied by zero. When re-encoding one of these, alpha is what must survive
byte for byte, and colour fidelity is worth nothing.

**Cropped to the mark itself**, with no transparent margin inside the frame.
CSS sizes the file, not the artwork in it, so empty space inside the frame is
empty space on the page and there is nothing a stylesheet can do about it -- it
cannot see where the ink is. Three of these carried it: allganize was 22% empty
by height, my-heb-app 18%, shell-tapup 8%, and all three painted visibly
smaller than the marks beside them at the same `h-12`. Measured against the
median mark's optical area, allganize was 0.68x before it was cropped and 0.86x
after, my-heb-app 0.85x then 1.04x.

The check, run against the file itself:

```python
im = Image.open(path).convert("RGBA")
im.getchannel("A").getbbox() == (0, 0, *im.size)   # True -> no padding to trim
```

If it is False, crop to that box and re-save. Pick the smallest encoding whose
alpha channel is unchanged (`lossless=True` for flat art, `quality=90,
exact=True` when the original was lossy) -- lossless was 60% *larger* than the
original for two of these.

## Shape

`ClientMark` fits every mark inside a box 3.9 times as wide as it is tall,
because a row of logos is read by how much ink each one puts on the page rather
than by how tall it is. A wordmark wider than that is scaled down to fit. The
reasoning, and the aspect ratios it was derived from, are in the comment above
that component.

Nothing needs to be square or a fixed size. WebP or SVG both work; SVG scales
and weighs less, and one of these (priority-ambulance-transfer) is one already.
