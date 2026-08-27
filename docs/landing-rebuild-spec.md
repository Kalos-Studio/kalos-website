# Landing rebuild — requirements

Branch `new-new-landing-page`. Source of truth for layout is the Figma wireframe
[`new website wireframe`](https://www.figma.com/design/RPxXvG0XyvCvhBpBThTIiw/Kalos-Brand-Guidelines?node-id=396-9876)
(node `396:9876`, frame 1920×2583). It is a wireframe, not a comp: it fixes
structure, order and behaviour, not type scale or colour beyond black on white.

Written before building, to be argued with before building.

---

## 1. What the page is

One scrolling page replacing the current spotlight hero at `/`:

1. **Masthead**, top right — a one-line positioning statement with a `Book a call`
   button under it.
2. **Definition block**, left — the Kalos lockup, `καλός • adjective`, and the
   definition line under it.
3. **Work section** — a case study image that changes as you scroll, with a
   sticky column of pills on the right acting as a table of contents.
4. **Closer** — `Let's connect.` centred, with a second `Book a call`.

### Geometry from the wireframe

Positions are in the 1920-wide frame; treat them as ratios, not pixels.

| Element | x | y | w × h |
| --- | --- | --- | --- |
| Positioning statement | 1327 | 103 | 478 × 82 |
| `Book a call` (top) | 1624 | 215 | 181 × 49 |
| Lockup | 96 | 724 | 260 × 64 |
| `καλός • adjective` | 96 | 881 | 399 × 64 |
| Definition line | 96 | 971 | 667 × 82 |
| Fold rule | 97 | 1113 | 1708 × 0 |
| `Our Work` label | 1671 | 1012 | 134 × 41 |
| Pill column | 1624 | 1085 | 181 × 588 |
| Each pill | — | pitch 77 | 181 × 49 |
| Case study image | 267 | 1292 | 1195 × 681 |
| `Let's connect.` + button | 811 | 2294 | 184 × 122 |

Notes that matter:

- The right column is **181px in a 1920 frame — 9.4%**. It is a narrow rail, not
  a sidebar. `Our Work` is right-aligned above it.
- Pill pitch is 77 with a 49 height, so the **gap is 28px** — over half a pill
  height. The column is deliberately airy.
- The case study image is **1195 × 681, i.e. 1.754:1** — effectively 16:9, and
  it does *not* extend under the pill rail (it stops at x=1462, the rail starts
  at 1624).
- The fold rule runs the full content width and the **first pill sits on top of
  it** — the rule passes behind the pill column rather than stopping at it.

---

## 2. Behaviour

### 2.1 Scroll stops

Each case study is a scroll stop; scrolling moves from one to the next rather
than freely through them.

- CSS scroll snap on the work section: `scroll-snap-type: y mandatory` on the
  scroll container, `scroll-snap-align: center` on each case study panel.
- CSS-only, no scroll-jacking library. A JS wheel handler that animates to the
  next panel breaks trackpad momentum, keyboard paging, find-in-page and
  screen readers, and it is the single most common way a page like this becomes
  unusable.
- **The hero and the closer are not snap points**, or the page traps you at the
  top. Only the case study panels get `scroll-snap-align`.
- Under `prefers-reduced-motion`, snap stays (it is position, not motion) but
  every programmatic scroll becomes `behavior: auto`.

### 2.2 The pills

A table of contents that reports position and accepts clicks.

- **Inactive**: outlined pill, transparent fill, 1px border.
- **Active**: solid grey infill, and grows slightly.
- Growth is the thing to be careful with: scaling the pill must not move its
  neighbours or the column jitters as you scroll. Use `transform: scale()` on
  the pill, which does not affect layout, rather than padding or font-size,
  which do. Transform-origin on the right edge so the column's right margin
  stays put and the pill grows leftward.
- Active state is driven by an `IntersectionObserver` over the case study
  panels, not by a scroll handler doing arithmetic on `getBoundingClientRect`.
- Clicking a pill scrolls its panel into view.
- The rail is `position: sticky` so it holds while the images pass it.

Semantics: this is a list of links to sections of the same page, so it is a
`<nav>` containing `<a href="#panel-id">`, with `aria-current="true"` on the
active one. Anchor links mean it works with JavaScript disabled and gets
keyboard support for free.

### 2.3 Case study image → case study page

Each case study image is a link to `/work/<slug>`. The case study pages
themselves stay exactly as they are for now — the data ported over in the last
change, rendered by the existing `/work/[slug]` route. No new work there.

### 2.4 Book a call

Both buttons open the Cal.com modal.

- `@calcom/embed-react`, namespace `intro`, calLink `kalos/intro`.
- **Always light**, regardless of the visitor's system theme: pass
  `theme: "light"` in both the `cal("ui", …)` call and the per-open modal
  config. Setting it in only one of the two leaves the other to fall back to
  system preference, which is how this usually ends up dark on someone's
  machine and light on ours.
- `cssVarsPerTheme.light["cal-brand"]` = the page's black.
- There is a working version of this on the `new-landing-page` branch at
  `app/(landing)/cal.js` — a `useCalModal` hook that lazy-imports the embed so
  it lands in its own chunk, and returns a click handler for a real `<a>` so a
  blocked or still-loading embed falls through to the booking URL rather than
  swallowing the click. **Port that, switch it to light, keep the fallback.**
  It is a solved problem and the reasoning in its comments is worth keeping.

### 2.5 No corner rounding on images

Images render with square corners. This is a change to existing code, not just
new code: `app/work/work.css` currently sets `border-radius: 0.75rem` on
`.work-case-body figure img` and on the cover/thumbnail crops. Those go.

The **pills keep their radius** — they are pills, that is what makes them pills.
"No corner roundings" is about imagery.

---

## 3. Conflicts with the current codebase

These are the parts that are not additive. Each one needs a decision.

### 3.1 The site is dark; this design is light

`app/globals.css` sets `background: #000; color: #fff` on `html, body`,
unlayered so it beats Tailwind's preflight. The wireframe is black on white.

`/lab` and `/work` are both designed dark and stay dark. So the light ground has
to be scoped to `/` rather than swapped globally. The clean way is a route group
— `app/(landing)/` with its own `layout.js` and stylesheet — which is also how
the other branch is organised.

Note the ordering trap already documented in `CLAUDE.md`: everything after
`@import "tailwindcss"` in `globals.css` is unlayered and beats any layer, so a
light theme in a route-group stylesheet has to be *more specific* than the
`html, body` rule in globals, not merely later.

### 3.2 The site cannot scroll

`globals.css` has `html, body { overflow: hidden }` and `main { height: 100dvh }`.
`/lab` depends on that — it is documented as a fixed single viewport with no
scroll, and it must stay that way.

So `overflow: hidden` has to stop being global and become `/lab`'s own rule.
That is a small change with a wide blast radius, and it should be made and
verified on its own before any of the landing work lands on top of it.

### 3.3 `/work` is password-gated — **decided: the gate comes off**

`middleware.js` gates `/work` and everything under it, redirecting to
`/work/login`. The matcher also catches the static assets under `public/work/`,
so it is not only the click-through that breaks: the landing page's own case
study images are served from those paths and would 307 to a password screen for
every visitor who has not logged in. Measured, not assumed:

```
/work/vital-energy             307 -> /work/login?next=%2Fwork%2Fvital-energy
/work/vital-energy/cover.webp  307 -> /work/login?next=%2Fwork%2Fvital-energy%2Fcover.webp
```

**Decision: remove it entirely.** `/work` becomes a normal public section.

What that means concretely:

- Delete `middleware.js`, `lib/work-auth.js` and `app/work/login/page.js`.
- Remove `WORK_ROBOTS` from `app/work/data.js` and the `robots` key from
  `app/work/layout.js` and `app/work/[slug]/page.js`. The section was noindex'd
  *because* it was unlisted; once the homepage links into it, noindex would only
  mean the work is findable by anyone handed the link and by nobody else. The
  comment currently sitting on `WORK_ROBOTS` says to delete it the day the gate
  goes — this is that day.
- Remove the "temporary repository / more case studies coming soon" note on the
  `/work` index. It was true of a holding page and reads as an apology on a page
  the homepage sends people to.
- Drop the note I added at the top of `docs/case-studies.md`. It exists only to
  say the gate is still on, and it stops being true here.
- `WORK_PASSWORD` / `WORK_ACCESS_TOKEN` in `.env.example` go too.

### 3.3b The `/work` index page goes — **the landing is the portfolio**

With the landing page listing the work, a separate `/work` index is a second
copy of the same thing that will drift from the first. It goes.

- Delete `app/work/page.js`. The `workIndex` copy in `data.js` goes with it, and
  so do `.work-title` / `.work-standfirst` / `.work-index-intro` in `work.css`
  and the card/list styles that only that page used.
- **`/work` itself redirects to `/`.** Not a 404: the URL has been shared, it is
  in the sitemap of anyone who crawled it, and the landing page genuinely is
  where that content now lives. A permanent redirect in `next.config.mjs`.
- **`/work/<slug>` stays exactly as it is.** Those are the case study pages the
  landing links to, and they are the whole reason the section still exists.
- Two links out of the case study pages currently point at the index and have to
  be repointed at the landing:
  - the `← Work` back link at the top of `app/work/[slug]/page.js`
  - `View all work →` in the "More case studies" block at the bottom
- `app/work/layout.js` currently sets the section title and robots. Both get
  revisited: robots because the gate is going (3.3), title because there is no
  longer a section landing page to name.

The "More case studies" block at the foot of each case study stays — it is a
useful way sideways between studies, and it does not depend on the index page
existing, only on `caseStudies`.

### 3.3c `/lab` and the spotlight hero are deleted

Both go. Neither is reachable from the new site and neither is worth carrying.

Checked before proposing it: **nothing outside `app/lab/` references `/lab`** —
no link, no redirect, no config. It is self-contained, so deleting the directory
removes the whole feature.

**One thing has to come out first.** `app/lab/lockup.js` is the Kalos lockup as
inline SVG paths, and it is what the landing's lockup is built from (see §4). It
moves out of `app/lab/` before the directory goes, or the deletion takes the
artwork with it.

`app/lab/device.js` does not survive. Its capability probes and gyroscope input
exist for the 3D mark; the landing has no use for either.

#### The dependencies go with them

All five heavyweight dependencies are used **only** by these two pages:

| Package | Only used by |
| --- | --- |
| `three` | `app/lab/stage.js`, `app/lab/kalos-mark.js` |
| `@react-three/fiber` | `app/lab/kalos-mark.js`, `app/lab/variants/solid.js` |
| `@react-three/drei` | `app/lab/stage.js` |
| `@react-three/postprocessing` | `app/lab/post.js` |
| `motion` | `app/page.js` (the spotlight hero) |

So `package.json` loses all five. That is the renderer chunk (~250–300KB gzipped)
and the animation library gone from the project outright, not merely unused.

#### What this does to `globals.css`

`globals.css` is 187 lines and **most of it belongs to the spotlight hero**:

- 20 `.spot-*` rules, lines 79–187, delete with the hero.
- `html, body { overflow: hidden }` and `main { height: 100dvh }` existed to make
  the hero and `/lab` fixed single viewports. With both gone there is nothing
  left that must not scroll, so **§3.2 stops being a problem** — the rules are
  simply deleted rather than carefully relocated into `/lab`.
- `p { color: #888 }` was for the hero's subtitle. `work.css` already carries a
  comment about having to override it on case study paragraphs, so it should go
  the same way rather than being inherited by a page that never wanted it.

What remains is the Tailwind import, the note explaining why what follows is
unlayered, and element styling for `body`/`h1`/`p`. That is a reasonable base
for a light landing page to build on.

#### `CLAUDE.md` needs updating

It documents `/lab` at length — the load sequencing rules, the "never import
three in device.js" constraint, the SwiftShader caveat under **Verifying
changes** — and describes `/work` as password-gated. All of that becomes wrong
in this change. The file is project instructions, so leaving it stale is worse
than leaving stale code.

### 3.4 Pills vs. the case studies we have

The wireframe shows **eight** pills:

> MARA · Priority · Echocare · Allganize · ConEdison · Vital Energy · H-E-B · Shell

We have **seven** case studies, and `ConEdison` is not one of them. The other
seven match, but the wireframe's order is not the data's order:

| Wireframe | `app/work/data.js` |
| --- | --- |
| MARA | Vital Energy |
| Priority | Shell TapUp |
| Echocare | Priority Ambulance Transfer |
| Allganize | EchoCare |
| ConEdison | MARA |
| Vital Energy | Allganize Website Redesign |
| H-E-B | My H-E-B App |
| Shell | — |

**Decided: the wireframe order wins, and `data.js` is reordered to match** so
there is still exactly one ordering driving both the rail and the case study
pages' "More case studies" block. The existing ordering comment gets rewritten
rather than left in place describing an order that no longer exists.

Final order: MARA, Priority, EchoCare, Allganize, **ConEdison**, Vital Energy,
H-E-B, Shell.

**Decided: ConEdison is a placeholder pill** — rendered in the rail, visibly
inactive, not a link, and not a scroll stop. It holds the slot until the case
study exists.

That makes it the one pill not backed by a `caseStudies` entry, so it needs to
be explicit rather than emergent: a `placeholder: true` entry in `data.js` that
the rail renders and every other consumer skips. The alternative — a hardcoded
extra pill in the landing markup — puts the ordering in two places and is how
the rail ends up out of step with the data. Consumers to guard:
`generateStaticParams`, the "More case studies" block, and the scroll-snap
panels, none of which should ever see it.

### 3.5 Pill labels are not case study titles

Pills read `Priority`, `H-E-B`, `Shell`, `Echocare`. Titles are
`Priority Ambulance Transfer`, `My H-E-B App`, `Shell TapUp`, `EchoCare`. A 181px
pill will not hold the full titles.

So: a short label per case study, living in `app/work/data.js` beside the title,
not a lookup table in the landing page that silently goes stale when a study is
added. Proposed field: `shortName`, falling back to `title` when absent.

Note the wireframe spells it `Echocare`; the data says `EchoCare`. The data is
right — I will not propagate the wireframe's casing.

### 3.6 Which image shows on the landing

The wireframe just says "case study image that will change as you scroll" in a
16:9 box. Default: each study's existing `cover` from `data.js`, which is
already the right shape and already has alt text.

Worth knowing: on `new-landing-page` this was solved with an optional per-study
landing override, because for EchoCare the cover that reads at `/work` size is
not the frame that reads in a wide row. Same mechanism can come across if you
want it.

---

## 4. What gets built

Proposed structure, mirroring the route-group approach:

```
app/(landing)/layout.js      light ground, scoped to this route only
app/(landing)/landing.css    plain CSS — art direction, per CLAUDE.md
app/(landing)/page.js        composition
app/(landing)/content.js     all copy in one place, no strings in markup
app/(landing)/cal.js         ported from new-landing-page, forced light
app/(landing)/work-rail.js   pills + IntersectionObserver (client component)
app/(landing)/lockup.js      reuse of app/lab/lockup.js, colour as a prop
```

`app/lab/lockup.js` already has the mark and wordmark as inline SVG paths, hard
coded to brand white. It needs a colour prop to render black. **No Figma export
is needed for the logo** and none should be attempted.

Order of work, structure before effects. The clearing-out comes first: it is the
part that can break existing pages, and doing it before any landing markup
exists means a broken build has only one possible cause.

1. **Rescue the lockup** — move `app/lab/lockup.js` out of `app/lab/`, take a
   colour prop instead of the hardcoded brand white. Nothing else needs it yet,
   but it must not be deleted in step 2.
2. **Delete `/lab` and the spotlight hero** (3.3c): the `app/lab/` directory,
   `app/page.js`, the 20 `.spot-*` rules and the fixed-viewport rules in
   `globals.css`, and all five dependencies from `package.json`. `/` is
   deliberately left with no page at the end of this step.
3. **Remove the password gate** (3.3): middleware, `work-auth`, login page,
   `WORK_ROBOTS`, the construction note, the `.env.example` keys, and the note
   at the top of `docs/case-studies.md`.
4. **Retire the `/work` index** (3.3b): delete `app/work/page.js` and the styles
   and copy only it used, redirect `/work` → `/`, repoint the two links out of
   the case study pages.
5. **Reshape `data.js`**: wireframe order, `shortName` on each entry, the
   `placeholder: true` ConEdison entry, and guards on every consumer that must
   not see it (`generateStaticParams`, "More case studies", the snap panels).
6. **Static landing** at `/`, built from the Figma design — layout, type, light
   ground, real copy, no motion and no interactivity. The bulk of the work.
7. **Case study panels + scroll snap** (2.1).
8. **Pill rail + active tracking** (2.2).
9. **Cal modal** on both buttons (2.4).
10. **Square off the image corners** in `work.css` (2.5).
11. **Update `CLAUDE.md`** — the `/lab` section, the WebGL notes under
    *Verifying changes*, and the description of `/work` as password-gated are
    all wrong by this point.

Steps 2–5 are deletions and refactors of things that already work; each ends
with a `bun run build` and a look at whatever it touched. Step 6 onward is new
surface, and step 6 is where the Figma design gets pulled properly rather than
worked from a screenshot.

---

## 5. The share card — **done**

The Open Graph image is **the Kalos lockup in brand white on black**, shipped at
`app/opengraph-image.png` (1200×630) with the alt text updated off "coming soon".

It is generated by `scripts/render-og-image.py`, which reads the SVG below and
rasterises it with Pillow. That script exists because this machine has no
rsvg-convert, cairosvg, Inkscape or ImageMagick, and `qlmanage` is a thumbnailer
rather than a renderer — it returns a padded square with document chrome. Output
is deterministic: re-running produces a byte-identical PNG.

The source is `docs/assets/og-image.svg`, which already held the lockup in
`#F5FEFD` at 1200×630 — the only change is its `#212225` ground going black. It
stays in `docs/assets/` for the same reason the My H-E-B sources do: so the card
can be regenerated rather than recovered from a PNG.

No Figma export was involved; the paths were already in the repo.

Verified after the fact: ground pure black at both corners, and exactly two
enclosed regions in the render — the counters in "a" and "o" — which is what
says the fill rule resolved correctly rather than flooding the letterforms.

## 6. Decisions taken

| Question | Decision |
| --- | --- |
| `/work` password gate | **Remove entirely.** See 3.3. |
| `/work` index page | **Delete**, redirect `/work` → `/`. See 3.3b. |
| ConEdison | **Placeholder pill**, inactive and unlinked. See 3.4. |
| Pill order | **Wireframe order**, with `data.js` reordered to match. See 3.4. |
| The fold rule | **Annotation only** — nothing renders. |
| Share card | **White lockup on black**, generated from the SVG in `docs/assets`. |
| `/lab` | **Deleted**, with the four 3D dependencies. See 3.3c. |
| Spotlight hero | **Deleted**, with `motion` and the `.spot-*` styles. See 3.3c. |

## 6b. The hero's scroll mode — **decided: free scroll**

The block rises because the document is scrolling. Nothing is pinned, and the
switcher that offered a pinned alternative is gone along with the `mode` state
and the `kalos-hero-mode` storage key.

The pinned variant lost for the reason it was always likely to: it held the whole
hero still while the scrollbar moved, which is the opposite of the beat it was
meant to serve. The block is supposed to rise *because* you are scrolling.

What survived from it is the idea it existed to provide — somewhere for the
handover to happen. The block now catches at the top and is **held there with a
transform** for `RUNWAY` (0.45 of a window) while the fade and the symbol's
flight run, then releases. Transform rather than `position: fixed`, so the block
never leaves the flow and the page cannot jump when it catches.

Two knobs, at the top of `app/(landing)/hero.js`: `RUNWAY` (how long the hold
lasts, and so the whole duration of the handover) and `HEADROOM` (72px, how near
the top it catches).

## 7. Type and copy

**Type is Space Grotesk**, everywhere, replacing Inter. One family covers the
whole site — there is no second face to pair it with. Loaded through
`next/font/google` in `app/layout.js`, so it is self-hosted at build time rather
than fetched from Google at runtime: no third-party request on first paint and
no shift waiting on it.

**The wireframe's copy is the shipping copy.** "Companies turn to us to build
presence and get recognized.", `καλός • adjective`, the definition line, "Our
Work", "Let's connect." and "Book a call" all go in verbatim. They live in
`app/(landing)/content.js` rather than inline in the markup, so the page is one
file to edit for wording.

Nothing is open. Everything below §6 is decided.
