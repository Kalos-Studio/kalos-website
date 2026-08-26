# Handoff: the 3D mark

Working notes for continuing the hero work in a fresh session. Written
2026-08-24, last updated 2026-08-25.

---

## Where things are

Repo `/Users/omar.anees/Projects/kalos-website`, branch `new-landing-page`, tree
clean and pushed. Draft PR #4. There is a second worktree at
`../kalos-website-page` on `new-page`, cut from `origin/main` for unrelated work.

Everything the mock's annotations asked for is built: the sunrise, the black sand,
scroll stopping on titles, the second turning mark, and the mark docking into the
masthead. Both of the designer's OR-decisions were taken rather than left open,
because the owner asked for the work to be finished without further approval
rounds. Both are one-line reversals and both are flagged below.

Run it: `NODE_OPTIONS= bun run dev`. **Do not run `bun run build` while it is up** —
they share `.next` and the dev server starts 500ing on MODULE_NOT_FOUND, which
reads exactly like your change broke the app.

Two dev affordances worth knowing: `?dawn=0.4` pins the sunrise at a point rather
than playing it, and `?hint=1` forces the gyroscope prompt.

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

### The decisions that were taken

**Mark interaction: kept cursor and gyro.** The annotation offered "rotates on the
vertical axis OR keeps current interaction style". Cursor and gyro stays, because
it is the page's only demonstration that the object answers to you, and the
designer offered the rotation as an alternative rather than a correction. The
page gets both behaviours anyway: the second mark beside the dictionary entry
turns on its own and has no OR against it, so the hero mark responds and the
still one does not, which says more about the object than either alone.

**Mark on scroll: docks into the masthead.** The other option was exiting down and
to the right. Docking is the one that means something, because the mark and the
lockup are the same artwork and the object does not leave to make room, it becomes
the thing in the corner that was standing in for it. It also settles the
contradiction between the two masthead annotations: the lockup does not vanish
past the hero, it is what the mark turns into on the way, and then both go.

Building it forced one structural change worth knowing. `.lab-header` is
`position: fixed` now, not absolute. Measured as an absolute child of `.lab`, the
lockup's screen top ran 26, -48, -122, -265, -389 across the scroll the mark takes
to reach it: it left the viewport inside about 56px of scroll, so the mark was
flying at a target that had been gone for most of the trip. Fixed keeps it there
to be landed on, and `.lab-header.is-past` takes it away afterwards.

## The material, as it stands

All in `app/(landing)/stage.js`.

Faces (`GoldFaceMaterial`): `#ac9267`, metalness 1, roughness 0.42, `bumpMap` at
`bumpScale={4.5}`, `anisotropyMap` with `anisotropy={0.85}`, `DoubleSide`.

Bevel and sides (`GoldBevelMaterial`): `#d9b782`, metalness 1, roughness 0.17, the
`wall` map at `bumpScale={0.6}`, `anisotropy={0.45}` with `anisotropyRotation={0}`.

**Neither has an `envMapIntensity` any more, and that is the most important thing
on this page.** They used to declare 1.45 and 1.35, and neither number had ever
reached the shader. `WebGLRenderer.js` does this every frame, gated on nothing:

```
if ( ( material.isMeshStandardMaterial || … ) &&
     material.envMap === null && scene.environment !== null )
  m_uniforms.envMapIntensity.value = scene.environmentIntensity;
```

These materials have no `envMap` of their own — the light comes from
`scene.environment`, which drei's `<Environment>` sets — so both were rendering at
the scene's flat 1.0 while the source said otherwise. The comment explaining that
the bevel had come down from 1.9 to stop it hazing the bloom pass was describing a
change that could not have done anything.

They were removed rather than made real. Handing the materials their own envMap
does make the numbers work, and measured, it lifts the whole mark about 45% above
the state that has actually been approved. If you ever want a per-surface
difference in environment response, that is the mechanism — and it is a visual
change, not a fix.

`useBrushedGold()` generates all three maps on a canvas at runtime, 512px on
desktop and 256 on a coarse pointer. Nothing is fetched.

`Post` (`app/(landing)/post.js`) is bloom only, intensity 0.2, threshold 0.99,
dynamically imported, and phones never load it.

## The rest of the page

- **The sunrise** is in `variants/solid.js` (`applySunrise`). It ramps
  `scene.environmentIntensity` from 0.06 to 1 on a smoothstep and climbs one
  directional light past the mark. Gated on the reveal, and it plays in full on
  every load including a refresh: the once-a-session rule this file used to
  describe was removed on the owner's instruction. Reduced motion still gets a
  shortened 1.6s rather than none. `sunriseSeconds()` in `device.js` owns that,
  and says why the session gate is not to come back without asking.
- **The sand** is `app/(landing)/sand.js`: one fixed canvas, dunes generated at
  160x110 and drawn up, specks at 1:1 on the crests, parallaxing off
  `.landing-root`. Generated because the plate cannot tile. Costs 12ms desktop,
  33ms on a phone at 4x CPU throttle.
- **The second mark** is `mark-turning.js`, mounted by `mark-slot.js` through an
  IntersectionObserver, and **not mounted at all on a coarse pointer**: a phone is
  already running one WebGL context for the hero and this one is decoration beside
  body copy. That is a judgement made without a real device in hand and it is one
  condition to change.

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
