# Design system audit — site vs. the brand file

Audited against **The Kalos Brand**, page `0:1` ("Brand Kit"),
`https://www.figma.com/design/RPxXvG0XyvCvhBpBThTIiw/The-Kalos-Brand?node-id=0-1`.
Read on 16 August 2026 through the Figma MCP server, so every number below is
off the live nodes rather than off a screenshot.

No code was changed. This is the findings list.

---

## 0. What is actually on that page

The page holds three things, and telling them apart turns out to matter more
than anything else in this audit.

**The live deck** — eight 1920×1080 frames in the column at `x = -10759`,
`Brand-Guidelines-1` through `-8` (`147:21846`, `159:9830`, `162:9963`,
`162:10186`, `202:10451`, `189:10391`, `209:10481`, `216:10589`). Set in Space
Grotesk, page numbers zero-padded (`04`). Page 08 is a stub — one line,
"Structural. We are", and an empty frame — so the deck is unfinished at the end.

**A superseded column** at `x = -7517 / -5509` (the `206:*` frames). Same slide
names, but set in **Host Grotesk**, and its page numbers are unpadded (`4`).
This is a previous typeface era of the same deck. It matters because the site
currently sources two decisions from it — see findings 5 and 6.

**A standalone colour board**, `132:9101` "Our colors.", off on its own at
`x = -15787`. This is the only written spec of anything on the whole page.

Two absences worth stating plainly:

- **There are no Figma variables.** `get_variable_defs` returns `{}` on the page
  and on individual slides. No published colour styles, no text styles, no
  library. There is nothing to sync against automatically, and nothing that
  would flag drift on the Figma side either.
- **The Foundations section does not exist yet.** The index (slide 02) lists
  Voice & Tone, Logo, Color and Type with `XX` page numbers. So "Color" and
  "Type" as *specified* are: one colour board, and whatever the slides happen to
  do. Every type value below is inferred from usage, because there is no page
  that states it.

---

## 1. Colour tokens — exact match ✅

`132:9101` against the `@theme` block in `app/globals.css`:

| Brand name | Figma | Token | Stated role |
|---|---|---|---|
| Obsidian Black | `#040406` | `--color-obsidian-black` | Primary canvas background |
| Snow White | `#F5FEFD` | `--color-snow-white` | Primary text & key headlines |
| Dark Silver | `#A8A8A8` | `--color-dark-silver` | Secondary text & sub-labels |
| Eerie Gray | `#212225` | `--color-eerie-gray` | Borders, grid lines & card backgrounds |
| Vulcan Gold | `#AE9357` | `--color-vulcan-gold` | Accent — buttons, callouts, active indicators |

Five for five, names and roles included. Nothing to do here. The rest of this
document is about the values that are *not* coming from these tokens.

---

## 2. Type — measured off the live slides

No type page exists, so this is read off the text nodes themselves:

| Role | Size | Weight | Tracking | Leading | Colour | Node |
|---|---|---|---|---|---|---|
| Section word | 154px | Medium | −3.08px (−0.02em) | normal | white | `202:10459` |
| Statement | 116px | Medium | −2.32px (−0.02em) | normal | `#F5FEFD` | `209:10493` |
| Body | 26px | Regular | −0.52px (−0.02em) | normal | `#F5FEFD` | `194:10423` |
| Running head | 16px | Regular | −0.32px (−0.02em) | normal / 1.11 | white @ **32% opacity** | `162:10194` |

Three things follow, and the codebase already has two of them right:

- **Two weights exist in the entire deck: Regular (400) and Medium (500).**
  Nothing is bold anywhere.
- **Tracking is −0.02em at every size**, from 16px to 154px. Nothing tracks
  positive. There is no uppercase small-caps label anywhere in the file.
- **Stylistic sets are not uniform.** Header and display runs carry
  `salt, ss01, ss04`; the body run adds `ss02, ss03`. The site applies all five
  everywhere, which is a defensible simplification but is not what the file does.

Slide chrome, for reference: a 24px `Kalos_Mono` icon at `x: 64, y: 43`, running
head centred, page number right, header band 1792px wide inside 1920 — i.e. a
64px page margin.

---

## 3. `globals.css` base styles are still pre-token 🔴

The `@theme` block is correct and then the element rules underneath it ignore it.

| `app/globals.css` | Currently | Brand |
|---|---|---|
| `body` background | `#000` | `#040406` Obsidian Black |
| `body` color | `#fff` | `#F5FEFD` Snow White |

These are unlayered element rules, so per the note at the top of that same file
they beat every utility — this is the highest-leverage block on the site and it
is the one furthest from the palette.

Related: `app/layout.js` sets `themeColor: "#000000"` while
`app/(landing)/layout.js` sets `#040406`. The browser chrome and the page
ground are two different blacks depending on the route.

**Third black:** `app/(landing)/stage.js` exports `BACKDROP = "#060505"`. So
`#000`, `#040406` and `#060505` are all in play as "the ground".

> **Revised against the current branch.** This finding originally also covered
> the bare `h1` and `p` element rules — `h1` at weight 700 and `-0.04em`, `p` at
> `#888`, uppercase, tracked `+0.2em`. Commit `d459f5b` on this branch deleted
> those rules outright while the audit was being written, which is a better fix
> than retuning them: they were art direction for the deleted spotlight homepage
> and, being unlayered, they silently outranked every Tailwind utility. Two of
> the values are still worth knowing, so they are recorded as a comment where the
> rules used to be — the brand contains exactly two weights, Regular and Medium,
> and tracks −0.02em at every size.

---

## 4. `/work` predates the brand entirely 🔴

`app/work/work.css` is the largest single body of off-palette values on the site.
It was composed before the brand file was found and has not been revisited.

- **Magenta.** `rgba(255, 0, 170, …)` as a fixed backdrop glow and diagonal-line
  texture (L28–34). Magenta appears nowhere in the brand file.
- **Wrong gold.** `#ffcc66` with `rgba(255, 204, 102, …)` fill and border on the
  construction note (L93–98). Vulcan Gold is `#AE9357` — a much duller, browner
  gold. This one reads as a different brand.
- **Six invented greys** where the palette has one: `#9a9a9a`, `#b8b8b8`, `#ccc`,
  `#444`, `#555`, `#e6e6e6`.
- **Four invented near-blacks**: `#000`, `#111`, `#1a1a1a`/`#050505`, and
  `#1f1f1f`/`#2a2a2a`/`#333` as borders where Eerie Gray `#212225` is specified.
- **Weights 600, 700 and 800** (L185, 262, 335, 503, 545, 555, 583, 610). Space
  Grotesk tops out at 700, so the `800` on `.work-more-card:hover .work-more-title`
  is synthesised. It is also animated — `transition: font-weight` (L547) — which
  reflows text on hover and has no counterpart in the brand.
- **Positive tracking on uppercase eyebrows**: `0.06em` (L256, 286), `0.08em`
  (L178), `0.1em` (L578). The brand file has no eyebrow pattern and never tracks
  positive. `landing.css` already records this conclusion and acted on it;
  `/work` never got the same pass.
- **Error red** `#ff6b6b` (L619) — off-palette, though the palette offers no
  error colour, so this is a genuine gap rather than a mistake.

Nothing in this file references a token.

---

## 5. Display tracking is sourced from the superseded column 🟠

`app/(landing)/landing.css:115-130` records a four-level hierarchy and cites
`section word 160px … -0.05em … leading 0.79 ("Mission", 206:223)`, and
`.ln-word` (L493) uses `letter-spacing: -0.05em` on the strength of it.

`206:223` is in the **Host Grotesk** column. The live Mission slide is
`202:10459`: **154px, tracking −3.08px = −0.02em, leading normal**. The claim in
the comment — "the file tightens display type as it grows … both landing on
−0.05em" — does not hold for the current file, where 154px and 16px track
identically.

Not visually dramatic, but the comment presents itself as measured provenance,
which is exactly the kind of note the rest of this codebase relies on being true.

---

## 6. The homepage ships the old καλός definition 🔴

`app/(landing)/content.js:71` cites node `206:165` for the dictionary-entry
treatment. That node is in the superseded column, and the site carries its
definition text verbatim (`content.js:77-78`):

> "A word that deepens beauty and lifts your spirits, adding a touch of magic
> that brightens your world and puts a spring in your step."

The live About slide (`194:10423`, page 04) has no dictionary entry and has
replaced that copy with:

> "A word that meant beautiful, good, and well-made all at once, with no line
> drawn between them."

The homepage carries **both** — the superseded definition in `.ln-definition`,
and a close paraphrase of the current one in `story.body` two elements later. So
the section defines the word twice, and the version set largest and gold-labelled
is the one the brand file dropped.

The *layout* (word at display size, `[adj] [Greek]` in Vulcan Gold, definition,
rule) is a good treatment and worth keeping. The copy inside it is stale.

---

## 7. The reference sheet breaks the rule it states 🟠

`/design-system` says, of Dark Silver:

> "One value, so hierarchy below a headline comes from size rather than from
> invented intermediate greys."

`app/design-system/design-system.css` then invents four, as alpha levels of Snow
White: `0.62` (lead, body, list), `0.48` (note), `0.45` (dim mono), `0.8`
(quote-sub). Dark Silver is never used on the page that documents it.

Same file, tracking: `.ds-lead`, `.ds-body` and `.ds-note` set
`letter-spacing: normal` (L67), and the quote pair uses `-0.03em` (L120) and
`-0.01em` (L128) — three departures from the −0.02em the file next door
documents as universal.

Also `border-white/10` throughout `app/design-system/page.js` where Eerie Gray is
the specified border colour.

Worth noting the file gets the hard part right: `.ds-kicker` correctly implements
the running head as Regular / 16px / −0.02em / white @32%, sentence case.

---

## 8. Hero material tokens are not what the hero uses 🟠

`--gold-render-face: #AC9267` and `--gold-render-rim: #F4EEDA` are defined in
`globals.css`, displayed as chips on `/design-system` under "Hero material", and
described there as "the target for the hero material".

`app/(landing)/stage.js:7` sets the actual material to `GOLD = "#cba75f"` — a
noticeably lighter, more saturated gold — and never reads either token. The
reference sheet is showing a swatch that nothing renders.

Similarly `app/(landing)/landing.css:195-196` hardcodes `#F4F0DF` and `#CDB796`
for the CTA's lit-bevel border. Both are documented and deliberate, but they sit
as inline hexes in a file whose neighbours all use `var(--…)`.

---

## 9. Lockup naming ⚪

`app/(landing)/lockup.js:1` describes itself as "the full Kalos_Mono lockup —
mark plus wordmark". In the brand file, `Kalos_Mono` is the **24×24 icon-only**
mark used in the slide header. The mark-plus-wordmark asset is `Kalos_Light`
(`194:10409`, 567×139) / `Kalos_Dark` (`155:9731`). The component's viewBox is
`0 0 568 139`, so it is Kalos_Light. Comment only — the artwork is right.

Worth flagging that the site has no equivalent of `Kalos_Mono` itself, and the
deck's own header — icon left, label centred, index right — is the one
recurring layout pattern in the brand file that the site does not use anywhere.

---

## 10. Open question for the brand owner — now answered 🟡

**Is Dark Silver used anywhere in the file?** It is specified as "Secondary Text
& Sub-labels", but every piece of secondary text in the live deck — running
heads, page numbers, slide labels — is Snow White at 32% opacity, not `#A8A8A8`.
The two are not close: white@32% over Obsidian Black composites to roughly
`#545454`, far darker than Dark Silver.

This matters because the site has to pick one. `landing.css` currently uses both
conventions side by side: `.ln-body` and `.ln-client` take `var(--color-dark-silver)`,
while `.ln-runninghead` and `.ln-step-index` take `color-mix(… snow-white 32% …)`.
Both cite the brand file, and the brand file genuinely supports both readings.

Related: the deck sets its **body copy at Snow White**, not at a secondary grey.
The site sets all body copy at Dark Silver. Defensible for a scrolling page
rather than a projected slide, but it is a departure and is not recorded as one.

> **Answered.** Secondary text **splits by role**: prose you read (body copy,
> captions, step descriptions, client names) is Dark Silver; chrome you glance at
> once (running heads, step numbers, page indices) is Snow White at 32%. Each
> source is right about one of them — 32% is correct for a label nobody reads
> twice and hard work for a paragraph on a phone outdoors. **Body copy stays Dark
> Silver** rather than following the deck to Snow White, because a landing page is
> read at arm's length while scrolling and the headline has to stay the loudest
> thing in its section. The rule now sits next to the `--color-dark-silver` token
> in `globals.css`, so the `/design-system` pass has something to conform to
> instead of the four alpha greys it invented.

---

## Priority

**Fix first**

1. `globals.css` element rules → tokens (finding 3). Highest leverage, smallest diff.
2. The καλός definition (finding 6). Wrong copy on the studio's central claim.
3. `/work`'s magenta and `#ffcc66` (finding 4). The two values that read as a
   different brand outright.

**Then**

4. The rest of `/work` — greys, borders, weights, eyebrow tracking.
5. `/design-system`'s alpha greys and stray tracking (finding 7).
6. `.ln-word` tracking and the hierarchy comment (finding 5).
7. Reconcile `stage.js`'s `GOLD` with the render tokens (finding 8).

**Answered, and applied**

8. Dark Silver vs. white@32%, and body copy colour (finding 10). Split by role;
   body stays Dark Silver. Recorded on the token itself.

**Not ours to fix**

9. The brand file publishes no variables or styles, and its Color and Type
   foundations pages are still `XX` placeholders. Until those exist, `@theme` in
   `globals.css` is the de facto specification, and drift can only be caught by
   reading — which is what this document is.
