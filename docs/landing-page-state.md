# The landing page: what is built, what changed, what is missing

Written 2026-08-25, at the end of a long session. Branch `new-landing-page`,
draft PR #4. Read this before `docs/handoff-3d.md`, which covers the 3D in more
depth but predates the page being restructured.

---

## The page as it stands

Four sections, which is what the web mock (Figma `RPxXvG0XyvCvhBpBThTIiw`, node
`356:116`) contains:

1. **Hero.** Generated black sand, the lockup fixed top-left, the 3D mark
   centred. No copy at all.
2. **The word.** "Kalos / καλός" at display size with the Greek in gold, one
   sentence, and a second 3D mark turning on its vertical axis beside it. Carries
   the page's `h1`.
3. **Work.** Three full-width rows, client logo and copy left, screenshot right,
   linking into `/work`. "See more" underneath.
4. **The close.** One statement, one button.

`/work` is public, six case studies, all written as narrative.

---

## Audit against the original plan

The plan was approved as structure → sunrise → background → the rest. Here is
what actually happened to each item, including the parts that were undone.

| Plan item | State |
|---|---|
| 1a Type scale | **Superseded, then done properly.** The `.ln-h3` step was added, then deleted when the mock removed card titles, then replaced by a seven-step scale in `:root` that every stylesheet now resolves to. |
| 1b Section rhythm | **Moot.** The measured heights it was evening out belonged to sections that no longer exist. |
| 1c Reserve the mark slot | Done, and filled. |
| 1d Scroll stopping on titles | **Built, then removed.** Proximity snap measured well and felt janky. The mock's annotation is unimplemented. |
| 1e Open `/work` | Done. Gate, login route, `unoptimized`, duplicated covers and `noindex` all gone. |
| 1f Case study spine | **Superseded.** The spine was replaced by narrative on the owner's call. |
| 1g `/work` index and loose ends | Done. |
| 1h Logos: placeholder, never Figma | Held. The three on the homepage were already in the repo. |
| 2a Sunrise | Done, and later extended to the background (see below). |
| 2b Masthead timing | Done. Fixed position, cued by the sunrise, gone past the hero. |
| 2c Settle the material at the sunrise's end state | **Partly.** It turned up that `envMapIntensity` had never reached the shader at all, which was the more important finding, and both props were removed rather than made real. The wall-versus-face judgement was never re-taken. |
| 3a–3d Black sand | Done: generated, not tiled; parallaxed; grain kept. |
| 3c Re-check the mark against the sand | **Not done cleanly.** Attempted and abandoned: the crop now catches lit dune crests above the measurement threshold, so the numbers are not comparable to the pre-sand baseline. There is no mechanism for the material to have moved — the mark is lit by its own baked cubemap, which the page background cannot reach — but that is an argument, not a measurement. |
| 4a Second mark | Done, desktop only. |
| 4b The two OR decisions | Taken. See below. |

### Two variants, and a switch to compare them

`app/(landing)/sunrise-variants.js` holds three.

- **original** is commit `8ec14aa` exactly, including the ring sampling that
  caused the bullseye. It is there because "save that commit as a variant" means
  that commit, not an improved version wearing its name.
- **soft** is `8ec14aa`'s lighting and material amplitude with the ring sampling
  fixed — a combination that never existed at any commit, and possibly the one
  worth shipping.
- **drastic** came out of aiming at the Robinhood card page: darker room, a
  rectAreaLight blade, sharper curve, flatter finish.

They differ in duration, starting floor, sky tilt, easing, light type and shape,
sand floor, face bump and anisotropy, and ring pitch. Having all three makes the
pitch fix's contribution visible on its own.

**No variant has been chosen, and `drastic` is the default** — so that is what a
visitor gets today, by inheritance rather than by decision. `DEFAULT_VARIANT` in
`sunrise-variants.js` is the one line to change. Picking one is the last open item
on the hero, and `soft` is worth a hard look: it is the finish that was originally
approved, without the moiré that turned out to be a sampling bug rather than a
property of it.

The tab sits at the top centre of every page, invisible until hovered — it was hidden
in the hero's top-left corner and only rendered on `/`, which made the ground
axis half-reviewable (the same sand runs behind `/about`) and left a preview
opened on `/work` with no way to change either. It renders from `app/layout.js`
now. `?v=original`, `?v=soft`, `?v=drastic` still work — remembered, and
shareable as a link. Switching reloads, because the two differ in which light
element exists in the scene and in material values built inside a `useMemo`.

**This is a dev tool and it must not survive launch.** It is deliberately not
gated on `NODE_ENV`, because the place it most needs to work is a Netlify deploy
preview, which is a production build. Delete `sunrise-variants.js`,
`sand-variants.js`, `variant-switch.js`, `variant-switch.css`, the line in
`app/layout.js` that renders it, and the `V.` lookups in `solid.js`, `stage.js`
and `sand.js`, then inline whichever one won.

### The sunrise plays on every load

It used to be once a session, on the argument that a three second overture is a
delight the first time and a toll after. The owner removed that rule directly.

It was also wrong in practice, not just unwanted: `sessionStorage` survives a
reload, so from the second load in a tab onward everybody got the short version —
which means every person working on the page, and the owner reviewing it, saw the
abbreviated one and effectively never the real thing. A rule that hides a feature
from the people judging it is not restraint. **Do not reintroduce it without
asking.**

It runs 4.6s. Reduced motion gets a shortened 2s rather than none, because
cutting straight to the lit state reads as an animation that failed.

**The ringing was a sampling bug in the material, not a lighting problem.** The
faces' groove profile was indexed with `Math.round(r)` — one groove per texel of
radius — and the mark renders at roughly one texel per screen pixel. A pattern at
the pixel grid's own frequency cannot be drawn; it beats against it, and what you
see is concentric moiré. `RING_PITCH` in `stage.js` puts four texels to a groove
and interpolates between profile samples instead of stepping. `bumpScale` came
down 4.5 to 2.4 and then to 1.5, and `anisotropy` 0.85 to 0.42.

That last reduction is a deliberate trade rather than a fix. The settled state was
fine at 2.4; the dim, grazing phase of the sunrise was not, because a light at a
shallow angle exaggerates normal perturbation enormously and a soft turning
becomes a smeared ripple. Lowering the amplitude was chosen over ramping the
finish during the reveal, which had already been tried and rejected for making
the opening look like plastic. The surface is meaningfully flatter than it
started; the owner's call on that was "a tad flatter, but thats alright".

Two dead ends worth not repeating, both of which treated the symptom. Ramping
`bumpScale` down during the reveal did not fix it, because the anisotropy map is
an independent second source of the same artefact — it stores a tangent direction
that rotates concentrically and the specular stretch draws the rings on its own.
Ramping both down did suppress it during the reveal and made the opening look
like plastic, while leaving the settled state ringing at any angle that lit it
that way. The finish is no longer touched by the sunrise at all.

**Two independent sources of the ringing, and the second is the one that
mattered.** The anisotropy map stores a per-texel tangent direction that rotates
around the mark's centre, and anisotropy stretches the specular lobe along it, so
under a hard light the stretch itself draws concentric streaks. `bumpScale` has
no influence over that at all, which is why ramping it alone did not fix
anything. Both ride the same `finish` factor now.

**A hard raking light and this finish do not coexist.** The faces carry a bump map
at `bumpScale: 4.5`, tuned so grooves about a texel wide read under the
environment. Under a bright direct light at a grazing angle each groove's normal
swings in and out of the reflection direction, neighbouring texels flip fully lit
to fully dark, and the mark renders as a vinyl record. Measured, it was still
ringing after the light came down from 26 to 4.2. The sunrise therefore ramps
`bumpScale` as the light arrives and drops it while the blade crosses: detail the
lighting cannot represent should not be asked for, which is mipmapping's argument
rather than a cheat.

The effect that actually reads is `scene.environmentRotation`, not the intensity
ramp. At metalness 1 the mark is a mirror: what you see on it is the environment,
so brightening the environment uniformly is a dimmer switch, while rotating it
drags the reflection of the key light and the hot rim up across the faces. The
sky is tipped 1.15rad at the start and rotates level, which is what makes the
light travel bottom to top. Nothing is re-baked; the cubemap is still the single
`frames={1}` bake, because `environmentRotation` is applied at draw time to
materials that have no `envMap` of their own.

The sand is floored at 0.32 rather than fading from nothing, so the opening
happens on the object rather than as a page-wide crossfade.

The sun and the sky are staggered: the sun's sweep finishes at 62% of the
duration and the environment keeps filling in after it. Both used to run over the
full time, and the sun's intensity follows a sine that falls through exactly the
window where the environment is still rising — the two cancelled, and the mark's
mean luminance measured 129, 129, 127 across the last half. Half the runtime with
nothing changing, which reads as the animation getting stuck at the top of the
mark. It now runs 82, 77, 100, 108, 122, 127 across the same span.

`?dawn=0.4` pins it at a point instead of playing it, for judging a single frame.

### The one thing that was genuinely missed

**The sunrise did not reach the background.** The mark rose out of darkness while
the sand behind it sat at full brightness from the first frame: a sunrise that
lights the object and not the landscape is a spotlight. Fixed by having
`applySunrise` write a `--dawn` custom property that the sand's opacity reads, so
the dunes come up with the mark. Caught by the owner, not by me, and it was
visible in every frame I had already looked at.

---

## Decisions taken without sign-off

The owner asked for the work finished rather than brought back, so these were
decided. Each is a small reversal.

- **Mark interaction stays cursor and gyro** rather than a constant rotation. It
  is the only demonstration on the page that the object answers to you, and the
  second mark turns by itself anyway, so the page has both behaviours.
- **The mark docks into the masthead** on scroll rather than exiting down-right,
  and the lockup takes its colour. This forced `.lab-header` to `position: fixed`:
  as an absolute child of `.lab` the lockup left the viewport within about 56px of
  scroll, so the mark was flying at a target nobody could see.
- **The second mark does not render on a coarse pointer.** A phone already runs
  one WebGL context for the hero. One condition in `mark-slot.js`, decided
  without a real device in hand.
- **The homepage's three are the mock's** — Shell, EchoCare, MARA. Vital Energy
  is arguably the strongest of the six and is not among them.
- **`envMapIntensity` was removed rather than made to work.** Making it work
  lifts the whole mark about 45% above the state that has been approved.

---

## What is missing

### Blocked on the owner

1. **The booking URL.** `content.js` points at a placeholder Cal.com path
   (`kalos/intro`). The page's only button does not go anywhere real. This is the
   single most important open item.
2. **MARA imagery.** The case study leads on the Exaion brand kit and closes on
   the hackathon, and there is art for neither. MARA is also one of the three on
   the homepage, so this is front-page material.
3. **Priority imagery.** The copy argues the ambulance fleet is the brand's most
   visible asset and then does not show it. A wrap photograph does more than any
   other single image in the section.
4. **A role for Vital Energy.** Every other case study has one; without it that
   page shows no facts line.
5. **Two summaries.** Allganize's is the client's marketing line rather than a
   description of the work. MARA's is the one that was written rather than moved.

`docs/case-studies.md` has the per-project detail.

### Not started

- **A real phone.** Everything is verified at 390x844 in emulation with a clean
  console. The sunrise, the dock, the sand parallax and the fixed masthead are
  all things emulation reports as fine and a thumb may not.
- **A footer.** The document ends at the closing CTA. No legal, no contact, no
  social.
- **`/lab`** still 307s to `/` from `next.config.mjs`, left from when the hero
  was prototyped there.
- **The removed sections.** The proof strip is the one worth reconsidering: five
  client logos under the hero were the only evidence a cold visitor met before
  reaching the work, and the mock's hero gives them nothing but a mark.
  `app/(landing)/page.js` names the commit to recover the copy from.

### Known risks

- **Three canvases on desktop**, two on a phone. No dropped frames in scripted
  scrolling, but that is not the same as a real device under a thumb.
- **The dock depends on a fixed masthead.** If the fixed masthead is unwanted,
  the dock goes with it.
- **First Load JS is 118 kB**, up from 114 at the start of the session. The
  renderer is still behind its dynamic import; the growth is the sand component,
  the sunrise helpers and `next/link`.

---

## Things that cost time, worth not repeating

- **`envMapIntensity` never reaches a standard material that has no `envMap` of
  its own.** `WebGLRenderer` overwrites the uniform with
  `scene.environmentIntensity` every frame, gated on nothing. Two tuned numbers
  and a paragraph of reasoning were describing something that had never happened.
- **`bun run build` while `bun run dev` is up** clobbers `.next` and every route
  starts 500ing on `MODULE_NOT_FOUND`, which reads exactly like your change broke
  the app.
- **`animation-fill-mode: both` holds its final keyframe forever** and outranks
  any class you add later. Written up in CLAUDE.md and it still caught this
  session.
- **Measure the pose before measuring the pixels.** Three confident wrong
  readings came from comparing frames taken at different angles. `?dawn=0.4` pins
  the sunrise, `reducedMotion: "reduce"` pins the drift.
- **Screenshot harnesses go stale silently.** The capture script kept assuming
  the mark's old 19% offset after it was centred, and reported clean scans of
  empty background.
