# Source frames for `/work/my-heb-app`

The eight images in `public/work/my-heb-app/` are generated, not exported. Their
inputs are in `sources/`, and the compositor is
`scripts/compose-case-images.py`:

```bash
python3 scripts/compose-case-images.py    # needs Pillow, nothing else
```

It reads only from this directory and reproduces the eight shipped `.webp`
files byte for byte. Verified after the fact: rerunning it over the committed
sources produced pixel-identical output for all eight.

Nothing here is imported, bundled or served. These files exist so the shipped
images can be regenerated instead of recovered from a `.webp`, the same reason
`og-image.svg` sits one directory up.

## Where the sources came from

Nine of the ten are Figma frames from **HEB Design Challenge**, file key
`yLj9CFZXjKKzk8IxK8RpeM`:

| File | Frame | Node | Native size |
|---|---|---|---|
| `list.png` | List | `14:99` | 390 × 844 |
| `summary.png` | Spree Summary | `20:242` | 390 × 844 |
| `spree.png` | Spree | `23:482` | 390 × 844 |
| `drawer.png` | Spree - Expanded Drawer | `23:602` | 390 × **1434** |
| `scale.png` | Scale | `31:441` | 390 × 844 |
| `barcode.png` | Barcode Scan (Scanned) | `31:665` | 390 × 844 |
| `finish.png` | Finish Spree | `38:486` | 390 × **1057** |
| `receipt.png` | Receipt | `48:818` | 390 × **920** |
| `wireframes.png` | Spree - Lofi | `201:943` | 1344 × 984 |

The file holds about nineteen hi-fi screens and nine hand-drawn lo-fi sheets;
the nine above are the ones the story reaches. `get_metadata` on page `0:1`
lists the rest, and its output is far past a single tool response, so query it
with `jq` rather than reading it whole.

**Figma will not upscale.** `get_screenshot` treats `maxDimension` as a cap, so
390 × 844 is the most a phone frame will ever return and asking for 1688 gets
you 390. That ceiling is why the composited canvases are 1000px tall: at that
size the phone screens sit at roughly 1:1 rather than being interpolated up.

The tenth, `painpoints-slide.png`, is page 10 of **HEB Presentation.pptx.pdf**,
the 18-page deck, rendered with poppler:

```bash
pdftoppm -png -r 200 -f 10 -l 10 "HEB Presentation.pptx.pdf" painpoints-slide
```

The deck is not in this repo and was supplied by the owner. Its text is
outlined, so `pdftotext` returns an empty file and the pages have to be read as
images.

## Two crops worth knowing about

Both are applied by the script, not baked into the sources, so the originals
stay intact.

- **`drawer.png` is cropped to 390 × 844.** It is a scrolled-out export of a
  scrolling view. Placed beside an 844-tall screen and matched by height, its
  content rendered about two thirds the size of its neighbour's and the pair
  read as a mistake. Cropped to 844 it is simply the viewport a phone shows.
- **`painpoints-slide.png` is cropped to its card grid**, `(430, 330, 2130,
  1300)`. The full slide carries a per-slide byline in the top right, and the
  case study is written in the studio's "we".

## If you change which screens appear

The recipe is the block at the bottom of `scripts/compose-case-images.py`, one
line per image in page order. Adding or swapping a screen means adding its PNG
here, editing that list, and rerunning.

Two things do not move with it and have to be updated by hand in
`app/work/data.js`: the `alt` text and the `caption` on each image block. An
`alt` describing a screen that is no longer there is worse than none.
