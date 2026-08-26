# Sources for `/work/my-heb-app`

The screens in `public/work/my-heb-app/` are exported from the Figma file, not
composited here:

    https://www.figma.com/design/yLj9CFZXjKKzk8IxK8RpeM/HEB-Design-Challenge

Exported at 3x through the Figma MCP (`download_assets`, `defaultScale: 3`) and
converted to webp. 3x rather than 1x because Figma will not upscale past a node's
natural size, and a 390-wide phone screen exported at 1x is soft on any retina
display.

They are dropped in as they come, with no plate behind them. An earlier pipeline
composited every one of these onto an obsidian ground, which was right while
`/work` was a dark page and became a near-black rectangle on a white one. The
script that did it, and the screenshots it consumed, are gone.

`painpoints-slide.png` is the exception and the only source still here. It comes
from a deck rather than the Figma file, and `public/work/my-heb-app/painpoints.webp`
is just a resized webp of it.
