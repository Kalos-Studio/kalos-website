# Case studies: what is written, and what is still needed

Written 2026-08-25. Everything under `/work` is public now, so anything landing
here is client-facing on a page the homepage links to.

> The landing page shows three of these as full-width rows, with the client's
> logo where a title would go, and links to the rest. Which three, and the copy in
> those rows, is `featuredWork` in `app/(landing)/content.js`, not here.

## The format

Case studies are **stories**, not labelled beats. The owner's call, and the
reason is that a spine of Context / The work / The result produces something
consistent and skimmable, which is a different thing from something anyone
reads. `shell-tapup` and `vital-energy` in `app/work/data.js` are the reference
voice.

What that means mechanically:

- **Leave `bodyLayout` off.** Setting it to `"columns"` pins each heading to the
  left of its content and starts a new row at every one, which is the rigid
  structure made visual. Without it the body is a single reading column capped at
  a 40rem measure (about 67 characters a line), and images run wider than the
  text.
- **Use `heading` and `section` blocks sparingly, if at all.** Every one is a
  place the story stops. None of the seven use them now.
- **Drop images where the narrative reaches something worth seeing**, not at
  fixed intervals.
- **`quote` blocks are for real client testimonials only**, always attributed to
  a named person with their title. An unattributed pull quote is our own copy set
  in bigger type.
- **`role` is the facts line, and it comes from one vocabulary.** Disciplines,
  not a job title, three to five of them, and the same words for the same work
  across every entry rather than a fresh phrasing each time:

  | | |
  |---|---|
  | research | `User Research` |
  | strategy | `Product Strategy`, `Brand Strategy` |
  | design | `Product Design`, `Web Design`, `Mobile App Design`, `Brand Identity` |
  | systems | `Design Systems`, `Brand Guidelines` |
  | build | `Development` |

  `Development` is the only build term. It was "Web Design & Development" on one
  entry, "Mobile App Design & Development" on another and "Development" on a
  third, which is three names for the same thing plus a compound that hides the
  design work inside the build. Split them.

  One-offs are fine where the work genuinely is one: `Fleet Livery`,
  `Art Direction`, `Design Exploration`. What is not fine is a synonym for a
  word already in the table.

  EchoCare and Priority both read "Head of Design" until the owner had them
  rewritten, so a job title is the thing to avoid here rather than a precedent.

- **There is no `client` field.** It rendered beside the role as "Shell / ..."
  and was dropped whenever it repeated the title, which was four of six entries,
  so the line had two shapes and no rule a reader could infer. It went the way
  `year` did. Every study names its client in the title and the first paragraph.
- **No em dashes.** `bun run lint:copy` only walks `app/(landing)/content.js`, so
  nothing enforces it here, but it applies to every line that ships.

The full block schema is at the top of `app/work/data.js`.

## Per case study

### Shell TapUp — `shell-tapup`

Complete. Written from the Umbrage case study page the owner supplied, so it has
the detail the repo was missing: TapUp was a pilot, the engagement ran through an
industrialisation phase at the end (a universal data framework, so it could grow
into new regions rather than be rebuilt), and the feature set is specific.
Carries the Humza Saleem quote.

Images: cover, plus `orders.webp`, `fueling.webp`, `wetstock-history.webp`
converted from the supplied AVIF files. Only `orders.webp` is placed; the other
two are in `public/work/shell-tapup/` and unused, available if the story wants
another beat.

### Vital Energy — `vital-energy`

New, and the strongest of the seven. Ten weeks to define an ESP application and a
field data capture tool, then twenty-two months building Dynamic Routing. Carries
the Brandon Brown quote.

`role` is set now: "User Research, Product Strategy, Product Design,
Development". It was blank for a long time because it was left rather than
guessed, and with `client` dropped when it repeats the title, this page showed
no facts line at all. Written off the story: the site visits and working
sessions the copy leads on, the ten week definition sprint, the two products
designed inside it, and the twenty-two months of build after.

Images: four placed. `vital3` (an oil derrick at sunset, stock or generated) was
deliberately not used — it is decoration, and every other image on the page is
the actual product.

### EchoCare — `echocare`

Complete, written from the owner's supplied context. Three images, all placed.

### Allganize Website Redesign — `allganize-website-redesign`

Complete. Three images, all placed.

**Worth a look: the summary.** It reads "Pushing the future of workforce AI
further.", which is the client's marketing line rather than a description of what
we did. Left alone deliberately; every other summary says what the project was.

### MARA — `mara`

Reslugged from `mara-partner-brand-kits` and retitled, because the story is no
longer only about brand kits. It leads on **Exaion** (a brand for EDF's technology
division that had to be distinctively its own and still legibly part of MARA's
system), then the governance work, then the hackathon. Its image directory moved
from `public/work/visual-systems-and-scaling/` to `public/work/mara/` to match.

**Needs images, and this is the biggest gap in the section.** The story now leads
on pieces there is no art for:

- **The Exaion brand kit.** The single most valuable image here — it is the
  paragraph the case study opens its argument with.
- **The hackathon landing page**, and ideally a social asset. This is the most
  memorable material in the whole file (100 builders, judges from Apple, Nvidia,
  LG and DoorDash, one bitcoin) and it currently has nothing to look at.
- **The gas-to-power infographic**, and/or a spread from the 2024 Social
  Responsibility Report. Both are mentioned in one paragraph near the end and
  would justify their own moment if there were art.

What exists: `cover.jpg`, `anduro-kit.jpg`, `mara-slipstream-kit.jpg`,
`2pic-kit.jpg`. Anduro and Slipstream are placed; 2PIC is not, to avoid three
near-identical closing slides in a row.

**Also needs a read on the summary**, which is the one summary that was rewritten
rather than left: the old text was "Catered brand kits for many... brands."

### Priority Ambulance Transfer — `priority-ambulance-transfer`

Complete as prose. **Thin on images:** the narrative covers identity, fleet wraps,
brand and content strategy, the website, and print collateral, and the only image
is the website.

- **A fleet wrap photograph** would do the most work of any image in the section.
  The copy argues that the ambulance is the brand's most visible asset, seen by
  more people in a week than the site reaches in a year, and then does not show
  it.
- **The logo and wordmark**, and a collateral shot (credentialing, facility sales
  materials) would each earn a place.

### My H-E-B App — `my-heb-app`

New, and the only entry that is not a client engagement: a design exploration
for H-E-B, written up as one. Last in the array deliberately, since the order
note in `app/work/data.js` ranks by depth of the work.

**Read the framing before editing the copy.** It never says H-E-B commissioned
it and never narrates a pitch. `role` leads on "Design Exploration", which is
what keeps a page formatted like six client engagements from reading as a
seventh. It said "Design exploration for H-E-B" until the vocabulary pass, and
the "for H-E-B" half is now carried by the summary and the copy instead. The closing
paragraph observes that the shape of the proposal is close to the shape of the
app today and stops there, which is a checkable statement rather than a claim
about another company's roadmap. That restraint is the point, not an oversight.

Other decisions that will look arbitrary later:

- **No `client` field.** It was a pitch, not an engagement, so the facts line is
  the role alone.
- **No `quote` block**, though the deck has four good interview quotes. Every one
  is an anonymous shopper, and the schema wants a named person. The strongest of
  them runs inside a paragraph instead, where it is the pivot of the story.
- **"the largest grocery chain in Texas" appears twice**, in the summary and in
  the first paragraph. The card on `/work` shows only the summary, so a reader
  who never opens the page still gets the context.
- **The feature is called a Spree in the designs** and the screenshots say so all
  over. One sentence names it for that reason. The case study is called after the
  app, not the feature.
- **The personas and the "Impact" slide were left out.** The personas are stock
  photographs captioned as fictional shoppers; the impact slide asserts business
  impact with nothing behind it.

Images: ten, exported from the Figma at 3x and dropped in as they come. They
were composited onto an obsidian plate once, by a script that is now deleted --
right while `/work` was a dark page, a near-black rectangle on a white one.

Every frame in the Figma is a 390x844 portrait phone screen, which at full
column width renders about 1,860px tall and gave the page a tall-thin rhythm
with nothing to break it. That is what the `split` and `srcs` blocks are for: a
paragraph beside its screens, and two or three screens under one caption. The
one genuinely tall screen, the finish/QR frame, uses `scroll`. See
`docs/assets/my-heb-app/README.md` for where the files came from.

## Open across the section

- **Featured three on the homepage: settled, and worth arguing with.** It is the
  mock's set now, Shell / EchoCare / MARA, replacing Priority / Allganize / Shell.
  Vital Energy is arguably the strongest of the seven and is not among them. That is
  a positioning call, and the mock made it rather than anyone here.
- **`heroPosition`** is wired end to end and set on no entry. It only matters if a
  cover crops badly in the 16:9 hero, which none currently do.
- **`ExpandableImage` uses a plain `<img>`**, so body images skip the optimizer.
  The lightbox genuinely wants the original file, but the thumbnail does not.
- **Logos are never to be exported from Figma.** If a case study wants a client
  lockup, it gets a placeholder and the owner supplies the file. See
  `public/home/logos/README.md` for requirements.
