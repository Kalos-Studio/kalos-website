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
- `--radius-button` is a full round. Buttons and pills are the same kind of
  object, so they share one radius. **Imagery gets no radius anywhere.**

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
"Back to Work" and the hero, which flies back into its own panel.

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
bun run check:landing  # another
```

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

Work on a feature branch and confirm before pushing anywhere else. Commit
messages: short imperative subject, then prose explaining the reasoning — match
the existing log, which is unusually descriptive and worth keeping that way.
