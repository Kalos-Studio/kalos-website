# Handoff: the 3D mark

Working notes for continuing the hero work in a fresh session. Written 2026-08-24.

---

## Where things are

Repo `/Users/omar.anees/Projects/kalos-website`, branch `new-landing-page`, all
committed and pushed, tree clean at `8f6ac74`. Draft PR #4.

Run it: `NODE_OPTIONS= bun run dev`. Clearing `NODE_OPTIONS` is required, the dev
server dies on a stale preload otherwise. `bun run lint`, `bun run lint:copy` and
`bun run build` all need to pass before committing.

The mission for this whole effort: make the landing page genuinely good, not
merely finished.

## The two jobs, in order

### 1. Brush the side walls along the perimeter

Currently wrong, and knowingly so. `GoldBevelMaterial` in
`app/(landing)/stage.js` gets `bumpMap={bump}` where `bump` is the faces' spun
texture: concentric rings meant to be sampled by distance from the mark's centre.
Side walls do not have UVs that mean anything for that. `ExtrudeGeometry`'s
`WorldUVGenerator.generateSideWallUV` builds side UVs out of world position, so
the walls end up sampling arbitrary slices of a circular pattern. It reads as
random streaks rather than as a brushed edge.

Wanted: straight brushing that follows the shape's outline, wrapping around the
perimeter, like the machined edge in the reference. That needs custom side-wall
UVs, which means passing a `UVGenerator` into `ExtrudeGeometry` in
`app/(landing)/kalos-mark.js`. `generateSideWallUV` receives the geometry, the
vertex array and four indices, and can return whatever parameterisation is
wanted: distance along the contour for one axis, position through the extrusion
depth for the other. With that, a simple linear streak texture maps correctly and
the existing anisotropy story becomes honest rather than an approximation.

### 2. Make the bevel a crisp narrow chamfer

Currently `bevelSize` and `bevelThickness` are both `2.6` with `bevelSegments: 8`
(see `useMarkGeometries`, `app/(landing)/kalos-mark.js`). On a mark about 150
units wide that is a wide smooth fillet, and it reads as rounded. The reference
shows a narrow machined chamfer catching a single tight specular line.

Decided: cut the bevel to roughly `1.2` and the segments to about `2`. Keep a
little rounding rather than going to a single hard facet, so the edge does not
alias into a black line at small sizes or flicker as the mark turns. Both numbers
want checking by eye, not just set.

Note the bevel size interacts with `MARK_WIDTH`/`MARK_HEIGHT` in the same file
(currently 155/145, "bevel included"), which feed `useMarkFit`. Shrinking the
bevel shrinks the real bounds slightly.

### Then stop and ask

Once those two land and are verified, do not pick the next thing unilaterally.
Lay out the options with what each would cost and what it would buy, and let the
owner choose. The known candidates, in no order:

- **The sunrise entrance.** Owner's designer asked for it: page loads with the
  white lockup at the bottom, light rises, and the rising light reveals the gold
  mark, over 3 to 5 seconds. Constraints already established: it must hang off
  the existing stage-ready signal rather than a timer, because the renderer lands
  seconds late on a phone and a timed entrance plays to an empty screen; and it
  should play once per session, with a short version on return visits and under
  `prefers-reduced-motion`, because a five second intro every time someone comes
  back for the pricing is a tax.
- **The environment rig.** The last measurable gap against the reference: ours is
  warmer and its faces are lit more evenly than ours. This is lighting, not
  material. Worth knowing the sunrise rebuilds the lighting anyway, so doing both
  means tuning it twice.
- **The black sand background.** `Gold_Sand` in the brand file: black granular
  field with gold specks. Recommendation on record was procedural (a GPU point
  field in the scene, so it parallaxes against the mark and reacts to tilt)
  rather than the photographic plate, which reads as pasted the moment the mark
  moves. The plate is already committed at `public/home/gold-sand.webp`.
- **Scroll behaviour for the mark.** Owner previously chose docking into the
  masthead: as the hero scrolls away the mark rotates flat, shrinks and flies to
  the top-left lockup. The two share identical path data (`kalos-mark.js` and
  `lockup.js` hold the same `d` strings), so the handoff can be exact rather than
  approximate. Owner also asked at one point for all three behaviours built
  behind a switcher on a `/stage` sandbox; that has not been done.
- **The type scale.** Audit found it runs 68 / 60 / 18px with nothing between, so
  card titles sit at body size and hierarchy flattens wherever a section has
  sub-parts. A step around 24 to 28px would fix it.
- **Section rhythm.** Heights measured 262 / 596 / 1249 / 1067 / 401, so the page
  reads as two big slabs bracketed by small ones.

## The material, as it stands

All in `app/(landing)/stage.js`.

Faces (`GoldFaceMaterial`): `#ac9267`, metalness 1, roughness 0.42, `bumpMap` at
`bumpScale={4.5}`, `anisotropyMap` with `anisotropy={0.85}`, envMapIntensity
1.45, `DoubleSide`.

Bevel and sides (`GoldBevelMaterial`): `#d9b782`, metalness 1, roughness 0.17,
`bumpMap` at `bumpScale={1.4}`, `anisotropy={0.45}` with a fixed
`anisotropyRotation`, envMapIntensity 1.35.

`useBrushedGold()` generates both maps on a canvas at runtime, 512px on desktop
and 256 on a coarse pointer. Nothing is fetched: the hero must never wait on a
network round trip before it can draw.

`Post` (`app/(landing)/post.js`) is bloom only, intensity 0.2, threshold 0.99. It
is dynamically imported and phones never load it.

## Things that cost time to learn here

Every one of these was found by measuring, and each one looked like something
else first.

- **`ExtrudeGeometry` emits two material groups.** Group 0 is the flat caps,
  group 1 is the side walls and bevel. `solid.js` attaches materials with
  `attach="material-0"` and `attach="material-1"`. Confirmed in three's source;
  getting it backwards polishes the faces and mattes the rim.
- **Its UVs are not 0..1.** `generateTopUV` writes raw shape coordinates into
  `uv`, so a face's UVs are its artwork coordinates. The mark's viewBox is
  `0 0 150 139`, so its centre is near (75, 70), which is what `MARK_UV_CENTRE`
  and the texture `offset` exist for. Any map put on this geometry has to be
  scaled and centred against that, not against 0..1.
- **A roughness map alone is invisible on this material.** It only widens the
  specular lobe, and against a smooth gradient environment 0.42 and 0.58 both
  reflect a soft blur. Visible micro-texture needs a bump map, which perturbs
  normals and scatters the reflection itself.
- **`bumpScale` has a much wider useful range than it looks.** 0.55 rendered a
  perfectly smooth face and 8 rendered legible grooves. It multiplies a
  derivative, so a groove one texel across needs a far larger number than a broad
  dent. "No visible effect" is not evidence the map is disconnected: test at an
  absurd value first to prove the wiring, then come down.
- **At metalness 1 the `color` is what the surface reflects.** Setting the bevel
  to the reference's brightest *highlight* (`#f4eeda`) made the whole chamfer a
  solid white band with a haze around it. The white belongs where the edge
  catches the key, not in the tint.
- **Aggregate image statistics were repeatedly useless here.** Mean, peak and
  saturation barely moved between a broken render and a fixed one. Zooming into
  the surface at 2x or 3x found in seconds what histograms missed for several
  rounds. Some problems are only visible at the size they are wrong.

## How to look at it

There is no test suite. Chrome is at
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` and a
`playwright-core` driver is cached at `~/.cache/kalos-tools/node_modules`. Drive
a real browser, wait for `.lab-canvas.is-revealed`, then screenshot and crop
tight on the mark. Check a 390x844 mobile viewport too: the canvas must still
reveal and the console must stay clean.

The reference renders are committed at `public/design-system/mark-render.webp`
and `public/design-system/gold-sand.webp`, and the brand file is Figma
`RPxXvG0XyvCvhBpBThTIiw` (the 3D renders are on the Brand Kit page).

## House rules that bite

Full detail in `CLAUDE.md`. The ones that matter for this work:

- `app/(landing)/device.js` must never import three, drei or fiber. The page
  shell imports it, and a three import there drags the renderer into the page's
  own chunk. That cost about 350KB of First Load once already. `stage.js` may
  import `device.js`, and does.
- Comments explain **why**, and record what was tried and rejected. This is the
  strongest convention in the codebase. A comment that restates the code is worse
  than none.
- Anything that animates respects `prefers-reduced-motion`. Note the distinction
  already established in `solid.js`: reduced motion silences the motion the page
  starts by itself, and must not silence motion the visitor is causing, or the
  gyroscope dies for anyone with the setting on.
- Commit messages: short imperative subject, then prose explaining the reasoning.
  The log is unusually descriptive and worth keeping that way.
- First Load JS for `/` is 114 kB and the renderer is behind a dynamic import.
  Check it stays that way.
