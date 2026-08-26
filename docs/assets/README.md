# Design sources for generated assets

Vector originals for images that ship as rasters. Nothing here is imported,
bundled or served — these files exist so the shipped bitmap can be re-exported
instead of recovered from a PNG.

## `og-image.svg`

The source for `app/opengraph-image.png`, the link-preview card. Verified: the
committed PNG and this SVG are the same artwork, differing only in rasteriser
antialiasing (0.03% of pixels past a luma delta of 32, all of them on glyph
edges).

Re-export at **2400 × 1260**, twice the 1200 × 630 viewBox. og:image wants
1200 × 630 in CSS pixels and every crawler that matters serves the card to
retina screens, so the file is a 2× asset and the `og:image:width` /
`og:image:height` tags Next emits report 2400 × 1260. Colours are the brand
tokens: `#212225` ground, `#F5FEFD` lockup.

Two things move together with it:

- `app/opengraph-image.alt.txt` — the alt text on the card. It describes the
  artwork, so changing the artwork means rewriting it.
- Nothing else. `/`, `/design-system` and `/work` all inherit this one image
  from the root layout, and Next derives `twitter:image` from
  `opengraph-image` on its own, so there is no second file to keep in sync.

**This does not belong in `app/`.** Two reasons, either one sufficient:

- Next's `opengraph-image` file convention only matches `jpg`, `jpeg`, `png`
  and `gif` (`extensions` in `next/dist/lib/metadata/is-metadata-route.js`).
  An `app/opengraph-image.svg` would be dead weight, silently ignored.
- Even where a route convention does accept SVG, two files claiming one route
  means one of them is built and never served — `app/icon.png` and
  `app/icon.svg` already cost this repo that lesson once.
