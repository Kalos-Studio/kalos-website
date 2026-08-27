# Kalos website

Next.js 15 (App Router) portfolio site. Two areas:

- **`/`** — the landing page, in `app/(landing)/`. It *is* the portfolio: a hero
  that hands over to a masthead as you scroll, then the case studies as a run of
  full-width panels with a pill rail indexing them.
- **`/work/<slug>`** — the case studies themselves. There is no `/work` index;
  that URL permanently redirects to `/#work` (see `next.config.mjs`), because a
  second list of the same projects would only drift from the first.

Stack: React 19, Tailwind v4, Space Grotesk via `next/font/google`, deployed on
Netlify. Package manager is `bun`.

## Commands

```bash
bun install
bun run dev            # next dev
bun run build          # production build — run before claiming a change works
bun run lint           # eslint . — must be clean before committing
bun run lint:fix
bun run check:landing  # geometry checks against a running dev server
```

## Styling

**Tailwind owns the landing page.** `app/(landing)/` has no stylesheet at all —
layout, type and colour are utilities, and the shared values are tokens.

**Plain CSS owns the case studies' prose.** `app/work/work.css` styles the
reading column, its figures and the lightbox. That is long-form typography with
reasons behind the numbers, and it carries comments explaining them.

### Tokens live in `@theme`

Tailwind v4 has **no `tailwind.config.js`** — configuration is CSS. Everything
shared is declared in `@theme` in `app/globals.css` and becomes a utility:

- `--font-sans` is Space Grotesk, so preflight applies it everywhere and nothing
  needs a `font-sans` class.
- `--text-display`, `--text-lead`, `--text-control` are fluid clamps. They exist
  because the brand wireframe is drawn at 1920 wide, where the body copy is 32px
  — a size that is absurd on a laptop and unreadable when scaled down naively.
  Tailwind's own scale (`text-sm`, `text-base`, …) is still there and still
  preferred for ordinary work.
- The five brand colours are named for the role they play: `vulcan-gold`,
  `eerie-gray`, `dark-silver`, `snow-white`, `obsidian-black`. Most are declared
  and unused — the site is being built in black and white first and moves onto
  the palette in one pass. That is deliberate, not dead code to prune.
- `--color-muted` is the one secondary text colour and `--color-surface` the one
  grey plate. They do not resolve against `dark-silver`, and that is measured:
  it is 2.38:1 on white, below what even large text needs, against 8.61:1 on
  obsidian. It is a dark-ground colour and this site is light.
- `--ease-brand` is the one easing curve, with `--duration-quick`, `-settle` and
  `-morph` beside it. Each duration is a kind of event, not a point on a scale.
- `--radius-control` is a full round, shared by buttons and pills because they
  are the same kind of object. It was `--radius-button`; a token that sounds like
  it covers one thing is how a third radius gets invented.
- `--radius-screen` and `--shadow-screen` are for device screens only, and they
  are the **one exception** to the rule that imagery has no radius and no shadow.
  See *Case study imagery* for which images qualify — guessing gets it wrong.

### The trap this file used to document

`app/globals.css` now contains only `@theme`, a `prefers-reduced-motion` rule,
and a view-transition prototype. **Keep it that way.** Everything after
`@import "tailwindcss"` is *unlayered*, and unlayered CSS beats any `@layer`
regardless of source order — so an element rule here silently outranks every
Tailwind utility touching that property, on every page.

That was not hypothetical. `globals.css` used to style bare `h1` and `p` for a
hero that no longer exists, and `/work` carried a `.work-root p` reset whose only
job was to undo it.

Two specific rules that must never come back:

- **`* { margin: 0; padding: 0 }`.** Preflight already does exactly that from
  inside `@layer base`. An unlayered copy changes nothing visually and silently
  resolves every `p-*` and `m-*` in the project to 0 — no error, no warning.
- **Element styling on `h1`, `p`, `html`, `body`.** The base ground is set with
  utilities on `<body>` in `app/layout.js`. `/work` paints its own surface from
  `work.css`.

### Tailwind conventions

- Put shared values in `@theme` rather than repeating them across files.
- Arbitrary values (`w-[347px]`) are fine when the number is a ratio from the
  wireframe — but say which ratio in a comment. `aspect-[1195/681]` is the case
  study frame; `lg:pt-[35svh]` is sized to give the hero's handover room.
- Order utilities structure → box → type → colour → state. Past roughly a dozen,
  extract a component.
- Don't `@apply` in a stylesheet to recreate a component.

## The landing page

Read the comments in `app/(landing)/hero.js` before changing it. The scroll
choreography is three beats — the block rises with the page, catches at the top
and is *held* there while everything fades, and the symbol alone flies into the
masthead — and most of the non-obvious lines record a specific failure.

The rule that matters: **the geometry is derived, not tuned.** The hold ends when
the first case study panel's top would reach the held block's bottom, less a
clearance. Picking that length by eye produced a version that measured 11px of
clearance mid-scroll — fine until the definition wrapped to another line. If you
change the hero's height or the panel offset, run `bun run check:landing` rather
than trusting your eye.

The wheel **and the unmodified arrow and page keys** are paged by
`app/(landing)/paged-scroll.js`; `Home`, `End`, space, every modified key,
typing and touch are handed straight back to the browser. The keyboard was left
out at first and that was the bug: an arrow key scrolls about 40px, proximity
snapping decides the page is still nearest the stop it just left and drags it
back, so the press does nothing.

Two rules run that file, and everything reported as "scrolling is sometimes not
working" has been a violation of one of them:

- **A gesture is the sum of its events, never one of them.** A trackpad emits a
  scroll as dozens of deltas, and a gentle drag's are all one to three pixels.
  Thresholding each event on its own threw the whole drag away — and because an
  event the handler declines to claim is one the *browser* scrolls on, the page
  crawled ~120px natively and snapping dragged it back. Every wheel event is now
  claimed as long as there is a stop to move to; only the accumulated total
  decides whether to page.
- **Momentum is not a gesture, and no arithmetic on a delta will tell you which
  one you are holding.** A firm flick keeps emitting for up to two seconds after
  the fingers lift, and two ways of ending that have been tried and cut. A fixed
  ceiling expires mid-tail while the deltas are still large and pages a second
  time — every hard flick moved two panels. Reading the tail's *shape* instead,
  on the theory that momentum only decays so a delta bigger than the last must
  be a fresh push, was worse: on macOS the momentum stream **starts above the
  peak of the gesture that threw it**, so a normal flick went three case studies
  down. What runs now is that one unbroken run of wheel events pages exactly
  once, however long it runs and whatever shape it has, and **only a pause of
  80ms starts a new one** — momentum arrives every 8-16ms and never pauses, and
  no hand can lift, land and move again in less. The cost is that a second flick
  thrown with no pause at all is absorbed rather than obeyed, which is the right
  side to err on: a gesture ignored is one you make again, a gesture doubled has
  already taken you somewhere you did not ask to go.

The wheel aims from where the page is *heading* rather than from where it is, so
a second flick during a running scroll targets the stop after the one being
travelled to. The keyboard still waits for the scroll to settle, because a held
key repeats about thirty times a second.

`app/lockup.js` holds the Kalos mark and wordmark as vector paths, in three
exports: the full `Lockup`, and `Mark` / `Wordmark` separately so the hero can
fly one and fade the other. **Never re-export the logo from Figma** — these paths
are the only copy in the repo.

## The case study page

`app/work/[slug]/page.js` is built from the landing page's vocabulary on
purpose, and names what it borrows in a comment at the top: the same content
column, the same `text-display`/`lead`/`control` tokens, the same 1195/681 panel
frame, the same closer. It used to be a reference template with its own black
surface and type scale, and a visitor crossing from `/` changed sites. Keep the
two in step or that comes back.

That file also records **four attempts at putting navigation on a case study
that were built and cut** — an eyebrow, a masthead call to action, a pill rail,
and previous/next. Read the list before adding a fifth. What survived is one
"Back to Work" and the hero. Both return to *this* study's panel on the landing
page rather than to the top of the work section: the hero flies its cover back
there, and the link is a `#case-<slug>` anchor that `HashTarget` centres, since
an anchor on its own top-aligns. They used to disagree, and the text link was
the one that was wrong.

**One image per case study.** `landingCover` is spread over `cover` and the hero
renders the result, so the panel and the hero are always the same picture at the
same crop. That is a design decision *and* the precondition for the morph below
— overriding one without the other puts the animation back to a swap with a
slide on it.

### The cover morph

`app/view-transition-link.js`. Clicking a panel flies its cover into the case
study hero and clicking the hero flies it back. Hand-rolled rather than React's
`<ViewTransition>`, which needs the experimental React channel.

Three things there are load-bearing, all of them things that were got wrong
first:

- **Never wait on a frame inside the update callback.** Rendering is suppressed
  while it is pending, so `requestAnimationFrame` never fires and the transition
  deadlocks until Chrome kills it with *"Transition was aborted because of
  timeout in DOM update"*. Timers and promises are fine.
- **Both ends of a pair carry `data-vt-target`,** because either can be the
  destination. The waiter has to exclude the element being navigated away from,
  or the first `querySelector` matches it and resolves before React has rendered.
- **The page-level cross-fade is off** (`::view-transition-old/new(root)` in
  `globals.css`). The old root snapshot is the whole outgoing page, so leaving
  the landing it still held the panels above and below the clicked one and
  ghosted them over the case study. Shortening the fade only makes the ghost
  briefer; it has to be zero.

### Case study imagery

**Two kinds of image, and the difference decides the treatment.** Test it, do not
eyeball it — open the file and look at the corner pixels:

- **Product screenshots** are opaque rectangles with a hard edge. They get
  `screenshot: true` in `data.js`, which gives them `--radius-screen`,
  `--shadow-screen` and no border. A screen with square corners sitting flat on
  white reads as a crop of a screen rather than a screen.
- **Floating artwork** — marketing renders with transparent corners, elements
  hanging off the frame, often its own shadow baked in — gets **no flag at all**.
  Rounding it draws a rounded rectangle around something that is not rectangular,
  and adds a second shadow under the one it already has. Vital and Shell's body
  images are this; EchoCare's and H-E-B's are screenshots.

```python
# The check, run against the file itself
Image.open(path).convert("RGBA").getchannel("A").getextrema()   # (0, 255) -> floating
```

**No black borders on imagery anywhere.** The `1px solid #000` hairline came from
the dark template this section began as, where a rule was the only thing
separating an image from the surface. On white it framed things that already had
edges. Controls keep their borders; images do not.

**A case study image has two render paths and they do not share code.** The hero
goes through `CoverImage` in `app/work/[slug]/page.js`; body images go through
`imageFigure` in `CaseStudyBody.js` and the `.work-prose-shot` rules. Changing
one changes nothing about the other — a fix verified on the body while the hero
stayed square shipped exactly that way once.

**A composited image bakes its own treatment in.** Rounding a flat composite of
three phones rounds the outer edge of the picture, not the phones. If screens
have to share one file, mask and shadow each one at composite time — or better,
use `srcs: [...]` and let the markup put them side by side, which keeps each at
its own resolution and needs no plate behind it.

**Block types beyond `image`:** `srcs` puts two or three screens under one
caption; `split` sets a paragraph beside its screens, alternating sides with
`flip`; `scroll` caps a very tall screen and scrolls it. A run of full-width
phone screens separated by paragraphs gives the page a tall-thin rhythm with
nothing to break it, which is what `split` exists to fix. Do not apply `scroll`
to an ordinary phone screen — it is for the outliers, the ones near 0.37 and
below.

**Exports from Figma never upscale.** `get_screenshot`'s `maxDimension` only
caps, so a 390-wide phone frame comes back at 390 and looks soft on any retina
display. Use `download_assets` with `defaultScale: 3`.

### Editing `app/work/data.js`

It is a large hand-written object literal, and two things have gone wrong in it:

- **Measure indentation off the line, never from terminal output.** Anything
  piped through `sed 's/^/  /'` has been shifted, and anchors built from that
  silently fail to match. Several edits failed this way, and one script that
  parsed blocks by assumed indent found none and wrote an **empty `body: []`**,
  deleting a whole case study's content.
- **Never rebuild the array from parsed blocks.** Insert and replace lines in
  place, and verify by loading the module afterwards:

```bash
node --input-type=module -e "import {caseStudies} from './app/work/data.js'; ..."
```

Compare that count against the file's own (`grep -c`). They must agree —
**duplicate keys in an object literal collapse silently**, so a re-applied edit
looks correct while being wrong.

### Images and icons

`app/work/work.css` is the prose column's typography and the lightbox, nothing
else — everything structural is Tailwind in the component. Its phone block
bleeds figures to the viewport edge below 640px, because a dense product
screenshot inside the gutters renders 350px wide and is unreadable.

Favicons are declared in `metadata.icons` in `app/layout.js`, not as
`app/icon.*` files: the file convention emits one unconditional `<link>` with no
way to hang a media query off it, which is exactly what a light/dark pair needs.
Declaring `icons` at all **switches off the `app/apple-icon.*` convention**, so
that one is listed explicitly too.

`app/opengraph-image.alt.txt` must have **no trailing newline**. With one, Next
drops the `og:image:alt` tag altogether rather than emitting the string with
whitespace — no error, no warning, just a share card with no description. The
card itself is regenerated from its SVG source with
`python3 scripts/render-og-image.py`.

## Linting

`eslint.config.mjs` is flat config extending `next/core-web-vitals`. Keep
`eslint-config-next` on the same major as `next` — mismatched majors resolve but
misbehave.

`react-hooks/exhaustive-deps` is promoted to **error**. Fix the dependency rather
than silencing the rule; if a value genuinely must not retrigger an effect, hold
it in a ref and say why in a comment.

## Verifying changes

There is no unit test suite and there should not be one — almost nothing here is
a pure function. What can break is geometric, and geometry can be measured:

```bash
bun run dev            # one shell
bun run check:landing  # another -- where things sit
bun run check:scroll   #         -- what happens when the page is driven
```

`check-landing.mjs` measures geometry. `check-scroll.mjs` measures behaviour,
and exists because every scroll bug in this project was reported as a feeling
("impossible to scroll", "it kinda freaks out", "super weird") and every one had
a specific cause a browser could measure. It asserts that one trackpad flick
moves exactly one view — a short one, a hard one whose tail runs a second and a
half, one whose momentum onset is three times the flick's own peak, and a gentle
drag made entirely of 3px events — that a twitch moves nothing, that a second
flick 150/400/800ms after the first still pages, that the
wheel and the keyboard each leave the other usable straight afterwards, that
typing and modified keys are handed back, and that "Back to Work" lands on its
own panel. **A synthetic wheel event is not a trackpad** — a flick is a burst of
small deltas plus a decaying tail, and an earlier round of tuning passed with
single large deltas while the real trackpad was unusable. The check emits the
burst, and it emits a long one: a short tail ends before any plausible lock does
and so never exercises the case that broke.

`scripts/check-landing.mjs` drives real Chrome across five viewports and asserts
the two things that have actually gone wrong: that landing on a case study leaves
the hero fully faded and the panel centred, and that scrolling *through* the
handover never brings the definition block over an image. Both guard bugs that
shipped. It uses the installed Google Chrome via `channel: "chrome"`, so there is
no browser to download.

Beyond that:

- Prefer **computed styles and bounding boxes** over screenshot diffing.
- **Never trust a `PASS` that measured nothing.** An early version of the check
  reported four green viewports while finding zero pills, because it waited on
  `networkidle` rather than on the elements it was about to measure. It now
  fails when it has nothing to assert.
- **Do not run `bun run build` while a dev server is up.** The build rewrites
  `.next` underneath it and the server starts throwing `Cannot find module for
  page: /_document` — which looks like a catastrophic regression and is purely
  an artifact. Kill the server, `rm -rf .next`, then build. This bites hardest
  when two sessions share the working tree.

## Code style

- JavaScript, not TypeScript. No semicolon or formatter config — match the file.
- Comments explain **why**, and record what was tried and rejected. This is the
  strongest convention in the codebase and the reason changes here are fast to
  make safely. A comment that restates the code is worse than none.
- Keep comments true. Several in here outlived the code they described — a stale
  comment in a codebase that leans this hard on them is worse than a missing one.
- Respect `prefers-reduced-motion` in anything that animates.
- Scroll-driven work writes to the DOM in a `requestAnimationFrame`, not through
  React state. See `hero.js` and `work-rail.js`.
- No em dashes in shipping copy. Nothing enforces it; it is a brand preference.

## Git

Work on a feature branch. Commit messages: short imperative subject, then prose
explaining the reasoning — match the existing log, which is unusually descriptive
and worth keeping that way.

**Every local commit gets pushed to its own branch on GitHub, in the same
breath.** Not at the end of the session, not when asked: commit then
`git push origin <branch>`. Parallel sessions share this working tree and the
remote is the only place they can see each other's work, so an unpushed commit is
invisible to everything but this checkout. Pushing anywhere *other* than the
current feature branch — `main` especially — still needs confirming first.
