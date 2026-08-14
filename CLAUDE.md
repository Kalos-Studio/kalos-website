# Kalos website

Next.js 15 (App Router) marketing site. Three areas: a spotlight hero at `/`, a
WebGL hero at `/lab`, and a password-gated case study section under `/work`.

Stack: React 19, plain CSS + Tailwind v4, `@react-three/fiber` + `drei` for the
3D, Inter via `next/font/google`, deployed on Netlify. Package manager is `bun`.

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

**Plain CSS owns art direction.** `app/globals.css`, `app/lab/lab.css` and
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
- `html, body` pins `line-height: normal`. Preflight sets the root to `1.5`,
  which silently moved existing pages (the work login card grew 17px, the home
  hero shifted 3px). New components should set their own leading explicitly
  instead of relying on either default.
- Preflight makes form controls inherit the page font. That is wanted — the
  login input and button rendered in Arial before and now match the site.

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

`react-hooks/exhaustive-deps` is promoted to **error**. The `/lab` code drives an
imperative render loop through `useFrame`, where a stale closure shows up as a
subtly wrong animation rather than a crash — close to impossible to catch by eye.
Fix the dependency rather than silencing the rule; if a value genuinely must not
retrigger an effect, hold it in a ref and say why in a comment.

## /lab, the WebGL hero

Read the comments in these files before changing them — most non-obvious lines
record a specific failure.

- `app/lab/device.js` — capability probes and gyroscope input. **Must never
  import three, drei or fiber.** The page shell imports it, so a three import
  here pulls the whole renderer into the page's own chunk and defeats the
  dynamic import. That cost ~350KB of First Load JS once already.
- `app/lab/stage.js` — shared material, lighting rig, pointer helper. The gold
  environment is hand-built from `Lightformer` planes rather than an HDRI: no
  CDN fetch on first paint, and the highlights are aimed deliberately.
- `app/lab/variants/solid.js` — the `Canvas` and the mark.

### Load sequencing

The renderer is ~250–300KB gzipped behind `dynamic(ssr: false)`, so on a phone
it lands seconds after the page shell. Rules that follow from that:

- **Never put an entrance on a fixed delay that assumes the 3D is present.** It
  will fire over an empty background. Gate on the stage being ready instead —
  `Solid` takes an `onReady` callback that fires on its first painted frame.
- Anything gated on the renderer needs a timeout fallback, because a lost
  context or a failed chunk must not strand it forever. See
  `STAGE_READY_TIMEOUT_MS` in `app/lab/page.js`.
- The mark's entrance swing (damping out of an off-target start rotation) is the
  page's only cue that it responds to movement. It is held until the canvas is
  revealed and must stay that way — frame counting alone isn't enough, since
  shader compilation and the cubemap bake make the first frames very long.

### Layout

`/lab` is a fixed single viewport — no scroll, no zoom, no selection callout.
Conditional content (the gyroscope prompt) must be **out of the flow** of
anything that anchors other elements, or showing and hiding it moves the page.
The prompt is anchored to the viewport bottom with a safe-area inset for exactly
this reason. Any new conditional element gets the same treatment.

## Verifying changes

There is no test suite, and the interesting behaviour here is visual. Drive a
real browser instead of assuming:

```js
// Chromium is preinstalled; do NOT run `playwright install`.
chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" })
```

- Prefer **computed styles and bounding boxes** over screenshot diffing. The home
  page has animated grain and `/lab` renders live, so no two frames ever match
  byte-for-byte — a size comparison proves nothing.
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

## Code style

- JavaScript, not TypeScript. No semicolon or formatter config — match the file.
- Comments explain **why**, and record what was tried and rejected. This is the
  strongest convention in the codebase and the reason changes here are fast to
  make safely. A comment that restates the code is worse than none.
- Entrances are CSS rather than JS where possible, so a slow hydration still
  resolves to a readable page.
- Respect `prefers-reduced-motion` in anything that animates.

## Git

Work on a feature branch and confirm before pushing anywhere else. Commit
messages: short imperative subject, then prose explaining the reasoning — match
the existing log, which is unusually descriptive and worth keeping that way.
