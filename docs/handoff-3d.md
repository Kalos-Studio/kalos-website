# Handoff: the 3D mark

Working notes for continuing the hero work in a fresh session. Written
2026-08-24, last updated 2026-08-25.

---

## Where things are

Repo `/Users/omar.anees/Projects/kalos-website`, branch `new-landing-page`, tree
clean and pushed at `52d81f4`. Draft PR #4. There is a second worktree at
`../kalos-website-page` on `new-page`, cut from `origin/main` for unrelated work;
nothing here depends on it.

The two jobs below are **done** — the side walls are brushed along the outline
and the bevel is a narrow chamfer — and so is a third that came out of the owner
looking at them: the walls are lit. What is left is the list under **Now stop and
ask**, which is the owner's to choose from.

### One question outstanding

The owner has not yet said whether the wall brightness is right. It sits at about
60% of the face's luminance; the reference render is nearer 22%, but 22% is
roughly where this already was and it is what the owner called flat. The dial is
the two `intensity` values on the back wash in `stage.js`, and the reasoning is
written beside them. Do not treat 60% as settled.

Run it: `NODE_OPTIONS= bun run dev`. Clearing `NODE_OPTIONS` is required, the dev
server dies on a stale preload otherwise. `bun run lint`, `bun run lint:copy` and
`bun run build` all need to pass before committing.

The mission for this whole effort: make the landing page genuinely good, not
merely finished.

## The two jobs, done

### 1. The side walls are brushed along the perimeter

`contourUVGenerator` in `app/(landing)/kalos-mark.js` is passed to
`ExtrudeGeometry` as its `UVGenerator`. Side-wall UVs are now u = distance
travelled around the outline, v = position through the extrusion. The caps keep
the default parameterisation, raw shape coordinates, because the faces' maps are
scaled and centred against exactly that.

`useBrushedGold` grew a third map, `wall`: a straight run of grooves varying only
across the depth, with a slow modulation along the perimeter so an edge is not
one even corrugation. `GoldBevelMaterial` takes that instead of the faces' spun
texture, and its `anisotropyRotation` is now 0 for a real reason rather than
`PI/2` as a guess — see the tangent-frame note below.

Verified against the reference by zooming: the streaks run parallel to the edge
all the way round, and bracketing `bumpScale` at 0 and 7 proved the wiring and
put 1.4 between "invisible" and "corrugated".

### 2. The bevel is a narrow chamfer

`MARK_BEVEL` is 1.2 with `bevelSegments: 2`, down from 2.6 with 8. The edge is a
single tight specular line that travels rather than jumps: swept through the
cursor's whole range at 4x device scale, the highlight stays continuous and does
not break into facets. At 390x844 it is a fine bright line and never the black
line that one hard facet would have given.

`MARK_WIDTH`/`MARK_HEIGHT` are now derived from measured artwork bounds plus the
bevel rather than hand-typed. Worth knowing: `MARK_HEIGHT` was 145 against a true
138.3, so `useMarkFit`'s height fraction had never been the fraction it claimed.
It reads 0.362 now, which is what the page was actually rendering — correcting
the bounds and leaving 0.38 would have grown the mark 5% as a side effect.

### Now stop and ask

Both have landed and been verified. Do not pick the next thing unilaterally:
lay out the options with what each would cost and what it would buy, and let the
owner choose. The known candidates, in no order:

- **The sunrise entrance.** Owner's designer asked for it: page loads with the
  white lockup at the bottom, light rises, and the rising light reveals the gold
  mark, over 3 to 5 seconds. Constraints already established: it must hang off
  the existing stage-ready signal rather than a timer, because the renderer lands
  seconds late on a phone and a timed entrance plays to an empty screen; and it
  should play once per session, with a short version on return visits and under
  `prefers-reduced-motion`, because a five second intro every time someone comes
  back for the pricing is a tax.
- **The environment rig.** Partly done — see the back wash below — but ours is
  still warmer than the reference and lights its faces less evenly. This is
  lighting, not material. Worth knowing the sunrise rebuilds the lighting anyway,
  so doing both means tuning it twice.
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
the `wall` map at `bumpScale={1.4}`, `anisotropy={0.45}` with
`anisotropyRotation={0}`, envMapIntensity 1.35.

`useBrushedGold()` generates all three maps on a canvas at runtime, 512px on
desktop and 256 on a coarse pointer, with the wall map at a quarter of that
across the depth. Nothing is fetched: the hero must never wait on a network round
trip before it can draw.

The environment gained a **back wash**: a broad dim warm panel at `z = -6.5` and
a smaller brighter one off to the left. Without it the walls had nothing to
reflect — at metalness 1 a wall mirrors along its own normal, and a slab turned
only 0.26rad by the idle drift mirrors very nearly straight backwards, where
nothing was. Measured on the diamond's edge, the wall came out at luminance 12
against a background of 16: the side of the object was darker than the backdrop,
so the mark had no thickness and read flat. It is 69 against a face of 122 now.

The reference sits nearer 22% of its face rather than our 60%, and that is
deliberate: 22% is roughly where this already was, and it is what looked flat,
because the reference is tilted hard over with a wide wall and a floor under it
while ours sits nearly face-on at rest. Those two intensities are the dial if the
owner wants it further either way.

The wall's `bumpScale` came down from 1.4 to 0.6 in the same pass. 1.4 was judged
against a wall that was effectively unlit; once there was something to reflect,
the same number read as corrugation.

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
- **`UVGenerator` gets indices into the output triangle soup, not the contour.**
  `generateSideWallUV(geometry, vertices, a, b, c, d)` looks like it should let
  you recover which contour point you are on, and it does not: `f4` passes
  offsets into the flat vertex array it is building, which has no relationship to
  the outline's indexing. The parameterisation has to come from the *position*.
- **Bevel layers are inset from the contour**, by up to `bevelSize` along the
  miter, so their vertices are not contour points. Matching one to its nearest
  contour point lands on a neighbour wherever `curveSegments` puts points closer
  together than the bevel is wide, which is every rounded corner on this mark.
  Projecting onto the polyline and taking the parameter along it is exact and
  costs nothing at this scale.
- **The wall spans `-bevelThickness` to `depth + bevelThickness`.**
  `ExtrudeGeometry` hangs the bevel off both ends of the extrusion rather than
  insetting it, so v has to be normalised against `depth + bevel * 2` and the
  chamfers are the first and last few percent of it.
- **Without a normal map, three derives the anisotropy tangent frame from
  `vUv`.** `normal_fragment_begin` falls back to `getTangentFrame(..., vUv)` when
  there is no `USE_NORMALMAP`, which means `anisotropyRotation` on the wall was
  measured from whichever world axis `WorldUVGenerator` happened to pick. Fixing
  the UVs is what makes a fixed rotation describe anything at all.
- **Pin the pose before measuring anything.** Three separate wrong readings came
  from comparing shots at different angles. The idle float moves the mark about
  60 screen pixels at 3x, so fixed sample coordinates land on a different
  surface between runs; and after a hot reload the mark is still damping out of
  its entrance pose for a second or two, which looks exactly like a lighting
  change. `page.emulateMedia({ reducedMotion: "reduce" })` stops the drift and
  the float while deliberately leaving pointer input driving, so the pose is
  reproducible to the pixel. Verify by shooting the same frame twice.
- **A repeated `mouse.move` to identical coordinates dispatches nothing**, so the
  2200ms pointer-idle timeout expires and the mark wanders back to its drift.
  Nudge by a pixel to hold it.
- **Scan a line across the edge rather than sampling a point.** Wall, chamfer and
  face are a few pixels apart; a point sample cannot tell you which one it hit,
  and a luminance profile across the edge shows all three as plateaus.
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
