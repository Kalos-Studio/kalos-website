# Case studies: what is written, and what is still needed

Written 2026-08-25. Everything under `/work` is public now, so anything landing
here is client-facing on a page the homepage links to.

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
  place the story stops. None of the six use them now.
- **Drop images where the narrative reaches something worth seeing**, not at
  fixed intervals.
- **`quote` blocks are for real client testimonials only**, always attributed to
  a named person with their title. An unattributed pull quote is our own copy set
  in bigger type.
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

New, and the strongest of the six. Ten weeks to define an ESP application and a
field data capture tool, then twenty-two months building Dynamic Routing. Carries
the Brandon Brown quote.

**Needs: `role`.** Every other entry has one and it was left blank rather than
guessed. The others read like "Head of Design" or "Mobile App Design &
Development". Until it is set, this page shows no facts line at all, because
`client` is dropped when it repeats the title and Vital's does.

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

## Open across the section

- **Featured three on the homepage.** `app/(landing)/content.js` picks Priority /
  Allganize / Shell. The web mock shows Shell / EchoCare / MARA. Now that Vital
  exists and is arguably the strongest, this wants choosing rather than drifting.
- **Nothing on the homepage links to `/work`.** The mock has a "See more" and the
  page does not, which is odd on a section that was just opened to the public.
- **`year`** is documented in the schema, populated on none of the six, and
  rendered nowhere. Either supply six values and wire it into the facts line, or
  cut the field.
- **`heroPosition`** is wired end to end and set on no entry. It only matters if a
  cover crops badly in the 16:9 hero, which none currently do.
- **`ExpandableImage` uses a plain `<img>`**, so body images skip the optimizer.
  The lightbox genuinely wants the original file, but the thumbnail does not.
- **Logos are never to be exported from Figma.** If a case study wants a client
  lockup, it gets a placeholder and the owner supplies the file. See
  `public/home/logos/README.md` for requirements.
