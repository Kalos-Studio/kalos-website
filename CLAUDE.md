# Kalos website

Next.js 15 (App Router) marketing site. Three areas: the WebGL hero at `/`, a
password-gated case study section under `/work`, and `/design-system`, an
unlisted reference sheet for the brand tokens.

Type is Space Grotesk (the brand face, confirmed off the brand file) with five
stylistic sets on, applied site-wide from `app/layout.js`. Colour tokens live in
the `@theme` block at the top of `globals.css` and come from the brand file's own
"Our colors." board, names and roles included — Vulcan Gold is an accent for
buttons and active indicators, not a fill, and Dark Silver is the one secondary
text value. Follow the role, not the vibe.

The hero lives in the `app/(landing)/` route group, which carries the homepage's
`themeColor` and its title and description. `/lab` — where the hero was built —
307s to `/` from `next.config.mjs`.

Stack: React 19, plain CSS + Tailwind v4, `@react-three/fiber` + `drei` for the
3D, Space Grotesk via `next/font/google`, Cal.com for booking, deployed on
Netlify. Package manager is `bun`.

`bun run dev` needs `NODE_OPTIONS` cleared (`NODE_OPTIONS= bun run dev`) or it
dies on a stale preload.

## Commands

```bash
bun install
bun run dev        # next dev
bun run build      # production build — run before claiming a change works
bun run lint       # eslint . — must be clean before committing
bun run lint:fix
```

There is no test suite. See **Verifying changes** below for what to do instead.

## Styling

Two systems live here on purpose, and the split matters.

**Plain CSS owns art direction.** `app/globals.css`, `app/(landing)/lab.css` and
`app/work/work.css` hold values that were arrived at by looking at the result —
vignette falloff percentages, tilt ranges, gold lighting, entrance timings.
Those files carry comments explaining what was tried and rejected. Do not
convert them to utility classes: the comments and the named values are the
point, and a wall of `[0.42]` arbitrary values would destroy both.

**Tailwind owns new, ordinary layout.** Structural work — a new section, a grid,
a responsive stack — should use utilities rather than growing another bespoke
stylesheet.

### How the two coexist

`app/globals.css` starts with `@import "tailwindcss"`. Everything after that
import is **unlayered**, and unlayered CSS beats any `@layer` regardless of
source order. Tailwind's preflight lives in `@layer base`, so the site's own
element styling wins automatically — no `!important`, no ordering games.

Consequences to keep in mind:

- Utilities (`@layer utilities`) still apply normally, because they target
  classes rather than elements.
- Where an element rule in `globals.css` and a utility set the same property on
  the same element, **the element rule wins**. Add a plain class rather than
  fighting it.
- **Never reintroduce a bare `* { margin: 0; padding: 0 }`.** Preflight already
  does it. An unlayered copy outranks `@layer utilities`, which silently
  resolves every `p-*` and `m-*` in the project to 0 — no error, no warning,
  the classes are simply inert.
- **A scoped reset is the same trap, just harder to see.** `landing.css` once
  carried `.landing-root :where(h1, h2, h3, p, …) { margin: 0 }` for tidiness.
  Nothing needed it (preflight already zeroes margins from `@layer base`), and
  because it was unlayered it killed every `mt-*` on a `p`, `h2` or `h3` on the
  page: twenty-odd utilities computing to `0px`, with divs and buttons unaffected
  because they were not in the selector. Grid gaps masked most of it. If you find
  yourself writing a reset, ask what is actually imposing the thing you are
  resetting.
- **When you replace a bare element rule, keep its weight.** A bare `p` weighs
  (0,0,1) and *loses* to any class, which is often exactly why the classes
  around it work. Rewriting it as `.work-root p` weighs (0,1,1), beats those
  classes, and silently changes the page — this blew every `/work` card summary
  from 15px to 18px. Use `:where()` (`.work-root :where(p)`) to match a class's
  weight and lose on source order, the way the element rule did.
- `html, body` pins `line-height: normal`. Preflight sets the root to `1.5`,
  which silently moved existing pages (the work login card grew 17px, the home
  hero shifted 3px). New components should set their own leading explicitly
  instead of relying on either default.
- Preflight makes form controls inherit the page font. That is wanted — the
  login input and button rendered in Arial before and now match the site.
- **`animation-fill-mode: both` holds the final keyframe forever.** An entrance
  ending on `transform: none` will quietly cancel any `transform` the element
  needs for layout. Centring `.lab-copy` with `translateY(-50%)` did nothing
  until the offset moved into a custom property that the keyframes compose
  against. If a transform "does not apply", check for an animation on the same
  property before checking anything else.

### Tailwind conventions

- Tailwind v4 has **no `tailwind.config.js`**. Configure from CSS: `@theme` for
  design tokens, `@utility` for custom utilities, in `app/globals.css`.
- Put shared tokens in `@theme` rather than repeating hex values across files.
- Avoid arbitrary values (`w-[347px]`) for anything that reads as a design
  decision. If a number needs a reason, it needs a comment, which means it wants
  to be real CSS.
- Order utilities structure → box → type → colour → state. Keep class lists
  short enough to read; past roughly a dozen, extract a component or a class.
- Don't `@apply` in a stylesheet to recreate a component. Either use utilities
  in the markup or write plain CSS.

## Linting

`eslint.config.mjs` is flat config extending `next/core-web-vitals`. Keep
`eslint-config-next` on the same major as `next` — mismatched majors resolve but
misbehave.

`react-hooks/exhaustive-deps` is promoted to **error**. The hero code drives an
imperative render loop through `useFrame`, where a stale closure shows up as a
subtly wrong animation rather than a crash — close to impossible to catch by eye.
Fix the dependency rather than silencing the rule; if a value genuinely must not
retrigger an effect, hold it in a ref and say why in a comment.

## `app/(landing)/`, the WebGL hero

Read the comments in these files before changing them — most non-obvious lines
record a specific failure.

- `app/(landing)/device.js` — capability probes and gyroscope input. **Must never
  import three, drei or fiber.** The page shell imports it, so a three import
  here pulls the whole renderer into the page's own chunk and defeats the
  dynamic import. That cost ~350KB of First Load JS once already.
- `app/(landing)/stage.js` — shared material, lighting rig, pointer helper. The gold
  environment is hand-built from `Lightformer` planes rather than an HDRI: no
  CDN fetch on first paint, and the highlights are aimed deliberately.
- `app/(landing)/variants/solid.js` — the `Canvas` and the mark.

See `docs/handoff-3d.md` for where the material work stands and what is next.

### The mark's material

Hard-won, and every one of these looked like something else first.

- **`ExtrudeGeometry` emits two material groups.** Group 0 is the flat caps,
  group 1 is the side walls and bevel, so the mark takes an array of two
  materials (`attach="material-0"` / `"material-1"` in `solid.js`). This is what
  lets the faces be matte while the bevel stays polished — a difference between
  two surfaces, not a lighting trick, which is why it survives the mark turning.
- **Its UVs are not 0..1.** `generateTopUV` writes raw shape coordinates into
  `uv`, so a face's UVs are its artwork coordinates: the mark's viewBox is
  `0 0 150 139`, centre near (75, 70). Any map has to be scaled *and centred*
  against that (`MARK_UV_SPAN`, `MARK_UV_CENTRE` in `stage.js`). A texture left
  at default tiling lands ~2,700 times across the mark and mipmaps to flat grey.
- **Side-wall UVs used to be generated from world position**, not the outline, so
  a map meant for the faces meant nothing there. `contourUVGenerator` in
  `kalos-mark.js` replaces them: u is distance around the contour, v is position
  through the extrusion. Two traps if you touch it. The indices `generateSideWallUV`
  receives point into the output triangle soup, not the outline, so there is no
  contour index to recover and the parameterisation has to come from the vertex
  position. And bevel layers are inset from the outline by up to `bevelSize`, so
  matching one to its nearest contour *point* lands on a neighbour at every
  rounded corner — project onto the polyline instead.
- **A roughness map alone is invisible on this material.** It only widens the
  specular lobe, and against a smooth gradient environment 0.42 and 0.58 both
  reflect a soft blur. Visible micro-texture needs a **bump map**, which perturbs
  normals and scatters the reflection itself.
- **`bumpScale` has a far wider range than it looks.** 0.55 rendered a perfectly
  smooth face; 8 rendered legible grooves. It multiplies a derivative, so a
  groove one texel across needs a large number. "No visible effect" is not
  evidence the map is disconnected — test at an absurd value to prove the wiring,
  then come down.
- **At `metalness: 1`, `color` is what the surface reflects.** Setting the bevel
  to the reference's brightest *highlight* turned the whole chamfer into a solid
  white band with a haze around it. The white belongs where the edge catches the
  key light, not in the tint.
- **The finish is brushed, not sandblasted.** Fine grooves in concentric arcs on
  the faces, centred on the mark; a straight run along the outline on the walls.
  Directional grooves need an `anisotropyMap` (R/G are a [-1,1] tangent-space
  direction, B is strength); a single `anisotropyRotation` can only describe a
  straight brush, which is why the walls can use one and the faces cannot.
  Isotropic speckle reads as stone and no amount of tuning gets it there.
- **Without a normal map, three takes the anisotropy tangent frame from `vUv`.**
  `normal_fragment_begin` falls back to `getTangentFrame(..., vUv)`, so
  `anisotropyRotation` is measured from whatever the UVs happen to do. It only
  says something once they say something.
- Textures are generated on a canvas at runtime and **half resolution on a coarse
  pointer** — building one costs ~20ms on a desktop and several times that on a
  phone, landing exactly as the hero appears.

### Load sequencing

The renderer is ~250–300KB gzipped behind `dynamic(ssr: false)`, so on a phone
it lands seconds after the page shell. Rules that follow from that:

- **Never put an entrance on a fixed delay that assumes the 3D is present.** It
  will fire over an empty background. Gate on the stage being ready instead —
  `Solid` takes an `onReady` callback that fires on its first painted frame.
- Anything gated on the renderer needs a timeout fallback, because a lost
  context or a failed chunk must not strand it forever. See
  `STAGE_READY_TIMEOUT_MS` in `app/(landing)/hero.js`.
- The mark's entrance swing (damping out of an off-target start rotation) is the
  page's only cue that it responds to movement. It is held until the canvas is
  revealed and must stay that way — frame counting alone isn't enough, since
  shader compilation and the cubemap bake make the first frames very long.

### Layout

The landing page **scrolls**. It was a single locked viewport for most of its
life and several things still read as though it were, so check before assuming.
Three consequences that were each a bug first:

- `touch-action` on `.lab` and `.lab-stage` is **`pan-y`, not `none`**. `none`
  was right when the hero was the whole page and every touch was meant for the
  mark. On a scrolling page it swallows the vertical swipe too, so a thumb
  starting anywhere on the first screen cannot scroll at all.
- There is **no zoom lock**. It was correct for a fixed viewport and is an
  accessibility failure on a page with body copy.
- Anything hanging off "the first touch" has to distinguish a tap from a scroll.
  See the gyroscope permission grab in `hero.js`: a `pointerdown` listener with
  `{ once: true }` gets burned by the first swipe.

Conditional content (the gyroscope prompt) must be **out of the flow** of
anything that anchors other elements, or showing and hiding it moves the page.

**One page grid.** `--page-max` and `--page-pad` in `globals.css`, used by
`.ln-shell` for sections and `.lab-shell` inside the hero. The hero used to inset
from the viewport edge while the sections sat in a centred container: identical
on a phone, and 332px apart on a 16in laptop. If a new surface needs to sit on
the page's left edge, use the shared grid rather than a fresh inset.

## Showing work to a human

**Open a draft PR.** Netlify builds a deploy preview for every PR, and that
preview is how the work actually gets looked at — a hero that reads as gold on
a CPU rasterizer in CI is not evidence about a phone. A localhost server in an
agent sandbox is unreachable from anywhere else, and screenshots of a live
renderer are a still of one frame of something whose whole point is that it
moves. Push the branch, open the PR as a draft, hand over the preview link.

This applies to anything visual, which here is nearly everything.

## Verifying changes

Automated checks come first — a draft PR is for judging art direction, not for
finding out the build is broken. There is no test suite, and the interesting
behaviour is visual, so drive a real browser instead of assuming:

```js
// Chromium is preinstalled; do NOT run `playwright install`.
chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" })
```

That path is the sandbox's. On the owner's Mac there is no `/opt/pw-browsers`:
drive the real Chrome at
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, with
`playwright-core` from `~/.cache/kalos-tools/node_modules`. Worth the check,
because it is a real GPU there and SwiftShader in the sandbox, and the hero looks
materially different on the two.

**Pin the mark's pose before measuring anything about it.** Three separate
confident, wrong readings this session came from comparing shots taken at
different angles rather than under different code:

- The idle float moves the mark about 60 screen pixels at 3x device scale, so a
  fixed sample coordinate lands on the wall in one run and the face in the next.
- After a hot reload the mark spends a second or two damping out of its entrance
  pose, which looks exactly like the change you just made having done something.
- A repeated `mouse.move` to *identical* coordinates dispatches no event, so the
  2200ms pointer-idle timeout expires and the mark wanders back to its drift
  mid-measurement. Nudge by a pixel to hold it.

`page.emulateMedia({ reducedMotion: "reduce" })` fixes the first two: `still`
stops the drift and the float while deliberately leaving pointer input driving,
so the pose is reproducible to the pixel. Shoot the same frame twice and diff
before trusting any number.

**Scan a line across an edge rather than sampling a point.** Wall, chamfer and
face are a few pixels apart on this mark, and a point sample cannot tell you
which of the three it hit. A luminance profile across the edge shows all three as
plateaus, and that is what turned "the sides look too dark" into "the wall is at
12 against a background of 16".

- Prefer **computed styles and bounding boxes** over screenshot diffing. The hero
  renders live, so no two frames ever match byte-for-byte — a size comparison
  proves nothing.
- **Measure the right thing.** Several confident, wrong readings came from
  measuring something adjacent to the question:
  - `innerText` **excludes collapsed `<details>` content**. A check for a string
    on the page reported clean while the string was sitting in a closed
    accordion. Use `innerHTML` when asking whether something shipped.
  - A `display: block` element's `getBoundingClientRect()` returns the
    **container**, not the glyphs. Comparing font rendering needs a `Range` over
    the text node, or every font measures identically.
  - Contrast has to be **composited**, not parsed. Hand-parsing `rgb()` silently
    returned ratios in the billions for every `color(srgb … / alpha)` value —
    exactly the colours most likely to fail. Paint the ground and the text into
    a 1×1 canvas and read back the result.
- **For surface and material work, zoom in.** Aggregate statistics (mean, peak,
  saturation, high-frequency energy) repeatedly failed to distinguish a broken
  render from a fixed one, because both had, say, a bright edge — what differed
  was whether that edge was white or gold. A 2–3× crop of the actual surface
  found in seconds what histograms missed for several rounds. Some problems are
  only visible at the size they are wrong.
- For before/after work, build each side cleanly. Starting a server and then
  rebuilding underneath it serves a `.next` whose hashed CSS no longer exists,
  and the page comes back **unstyled** — which looks like a catastrophic
  regression and is purely an artifact.
- Throttle when judging load behaviour: CDP `Network.emulateNetworkConditions`
  plus `Emulation.setCPUThrottlingRate`.
- **Headless here has no GPU** — WebGL runs through SwiftShader, a CPU
  rasterizer. First-frame and shader-compile timings are wildly inflated and say
  nothing about a real phone. Load *ordering* is trustworthy; timings are not.
  Say which is which when reporting.

## Things that will catch you out

Infrastructure facts that are invisible until they cost an hour.

- **Everything under `/work` is behind the password gate, including its static
  images.** `middleware.js` matches `/work/:path*`, so a case study cover 307s to
  the login page for anyone not signed in, and Next's image optimizer fails on
  the HTML it gets back. They render on `/work` only because you are already
  authenticated. Any `/work` image needed on a public page must be copied to
  `public/` — the three featured covers live in `public/home/`.
- **Next merges metadata by replacing whole keys, not deep merging.** A nested
  layout declaring `twitter: { title, description }` drops the root layout's
  `card: "summary_large_image"` and silently falls back to `summary`, which
  frames a wide OG image as a small square crop. Restate what you need. Only
  visible in the rendered meta tags, never in the source.
- **Two files claiming the same icon route means one is ignored.** `app/icon.png`
  and `app/icon.svg` both existing emits a single link tag, and the PNG wins, so
  the SVG is built and never served.
- **`process.cwd` is not a function** in the context Next prerenders server
  components. A filesystem lookup fails the build with "Failed to collect
  configuration for /", which reads like a routing problem and is not one.
- **Space Grotesk has no Greek glyphs**, and `next/font` builds its metric-matched
  fallback out of Times New Roman, so `καλός` rendered as a serif beside a
  grotesk. `app/layout.js` names a sans stack in `fallback` with
  `adjustFontFallback: false`.
- **Copy lives in `app/(landing)/content.js`** and `bun run lint:copy` fails the
  build on an em dash in it. The guard imports the module and walks the exported
  *values*, deliberately: reading the file as text flagged source comments, which
  are not shipped and which this codebase writes with em dashes by convention. A
  lint rule that fires when you write a comment is one people learn to ignore.

## Code style

- JavaScript, not TypeScript. No semicolon or formatter config — match the file.
- Comments explain **why**, and record what was tried and rejected. This is the
  strongest convention in the codebase and the reason changes here are fast to
  make safely. A comment that restates the code is worse than none.
- Entrances are CSS rather than JS where possible, so a slow hydration still
  resolves to a readable page.
- Respect `prefers-reduced-motion` in anything that animates — but it silences
  motion **the page starts by itself**, never motion the visitor is causing.
  Pinning the mark's rotation under reduced motion killed the gyroscope outright:
  the page asked for the sensor, was granted it, and then discarded every
  reading. `still` in `solid.js` now suppresses only the idle drift and float.

## Git

Work on a feature branch and confirm before pushing anywhere else. Commit
messages: short imperative subject, then prose explaining the reasoning — match
the existing log, which is unusually descriptive and worth keeping that way.

Feature branches want a draft PR early, for the deploy preview — see **Showing
work to a human** above. Nothing reaches production until it merges to `main`.
