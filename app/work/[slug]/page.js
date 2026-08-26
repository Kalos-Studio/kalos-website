import Link from "next/link";
import { notFound } from "next/navigation";
import CoverImage from "../CoverImage";
import CaseStudyBody from "../CaseStudyBody";
import { Mark } from "../../lockup";
import ViewTransitionLink from "../../view-transition-link";
import { caseStudies, workPageTitle } from "../data";
import BookACall from "../../(landing)/book-a-call";
import { closer } from "../../(landing)/content";

// A case study, built from the landing page's vocabulary rather than its own.
//
// What it replaced: a dark section with its own #000 surface, a fixed magenta
// diagonal texture, 12px-rounded imagery, its own fixed type scale, a 1080px
// centred shell and a grid of tinted thumbnails at the foot. That was a
// reference template, and clicking a panel on the landing page changed sites.
//
// What it borrows, deliberately and by name:
//
//   - the content column (`COLUMN`), identical to the landing page's
//   - the fluid type tokens from globals.css: text-display, text-lead,
//     text-control
//   - the 1195/681 panel frame, square and hairline black
//   - the masthead, holding the symbol and the way back
//   - the closer, "Let's connect." over an outlined Book a call
//
// Everything above is Tailwind because it is ordinary structure. The prose
// column's typography is real CSS in work.css, because it needs element
// selectors inside content this file does not author.
//
// Three things were tried here and cut, all for the same reason -- they were
// chrome the landing page does not have, and next to it they read as a
// different, busier system:
//
//   - a "Case study" label over the title, and a "Role" label over the role,
//     both set small and grey. The page has one title and one fact; labelling
//     either of them says nothing the reader did not already know.
//   - a Book a call button in the masthead. The landing page's masthead is the
//     symbol alone (the hero's own call to action fades out rather than being
//     promoted into the bar), so this one is too. The closer still has it.
//   - the pill rail down the right-hand side, mirroring the landing page's work
//     index. It worked as navigation and looked wrong here: on the landing page
//     the rail indexes a list you are looking at, and beside a single piece of
//     prose it was a menu with nowhere to be.
//   - previous/next in the masthead row, and a next-case-study panel above the
//     closer. Both were built and looked at side by side. The pair of grey
//     labels read before the title and promised an order the work does not
//     have; the panel cost a screenful and pushed the closer out of reach.
//
// What the way back turned out to be, after those four: "Back to Work" top
// right, set as quietly as the role line, plus the hero itself -- clicking the
// cover flies it back into its own panel and undoes the animation that brought
// you here. One is for a reader looking for the exit, the other is for a
// reader who clicks the picture; neither adds a control to the page.

// The landing page's column, to the pixel: x=96..1805 of a 1920 frame, capped
// and centred rather than reproduced as percentages. Duplicated as a string
// rather than imported because app/(landing)/page.js keeps it inline too --
// if a third page wants it, that is the moment to extract it, not now.
const COLUMN = "mx-auto w-full max-w-[120rem] px-5 sm:px-8 lg:px-12 xl:px-24";

function getCaseStudy(slug) {
  return caseStudies.find((c) => c.slug === slug);
}

export function generateStaticParams() {
  return caseStudies.map((cs) => ({ slug: cs.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cs = getCaseStudy(slug);
  if (!cs) return {};
  return {
    title: workPageTitle(cs.title),
    description: cs.summary,
  };
}

export default async function CaseStudyPage({ params }) {
  const { slug } = await params;
  const cs = getCaseStudy(slug);

  if (!cs) notFound();

  // The hero is the landing panel's image, resolved the same way the panel
  // resolves it. `landingCover` used to be a panel-only override, which meant
  // three studies opened on a different picture than the one that was clicked
  // -- echocare on the login screen after showing the map, H-E-B on the maroon
  // plate after showing the phones floating. One image per study now, chosen
  // once and used in both places.
  //
  // That is also the precondition for the cover morph: the two ends have to be
  // the same file at the same crop or the animation is a swap with a slide on
  // it. Now that they always are, every study gets a name rather than the one
  // it was prototyped on.
  const cover = { ...cs.cover, ...cs.landingCover };
  const vtName = `cover-${cs.slug}`;

  return (
    <div className={COLUMN}>
      {/* --- Masthead ------------------------------------------------------
          The symbol, at the size and inset the landing page's hero flies it to.

          In flow rather than fixed: the landing's masthead is fixed because it
          is the destination of a scroll animation. Here there is no animation to
          anchor, and a fixed bar would sit over a page whose whole job is
          full-width imagery. */}
      <div className="flex items-center justify-between gap-6 py-4 lg:py-6">
        <Link href="/" className="block shrink-0" aria-label="Kalos home">
          <Mark className="h-7 w-auto text-black lg:h-9" />
        </Link>

        {/* The way back, and the only chrome on the page besides the symbol.
            Words, not an arrow: "<- Back" was ruled out. Set in the same grey
            and size as the role line, it sits in the landing page's own
            typographic register rather than looking like a control bolted on.

            It goes to the work section, not the site root, because the symbol
            beside it already goes home and two links to the same place is one
            too many. */}
        <Link
          href="/#work"
          className="text-control tracking-tight text-muted underline-offset-4 transition-colors hover:text-black hover:underline"
        >
          Back to Work
        </Link>
      </div>

      {/* --- Header --------------------------------------------------------
          The landing hero's shape: the display line, one capped paragraph under
          it, and the facts as a plain line rather than a labelled list. */}
      <header className="pt-8 lg:pt-14">
        <h1
          className="text-display font-medium tracking-tight"
          // The stylistic sets the brand file carries, the same ones the
          // landing page's definition line asks for.
          style={{ fontFeatureSettings: '"salt" 1, "ss01" 1, "ss04" 1' }}
        >
          {cs.title}
        </h1>

        {/* 52ch, the measure the landing page's definition uses. */}
        <p className="mt-4 max-w-[52ch] text-lead tracking-tight">
          {cs.summary}
        </p>

        {/* The disciplines, unlabelled. This was a <dl> with a "Role" term over
            it and a rule above the pair; `client` was the only other fact the
            list could ever hold and no entry has carried one since the studies
            were rewritten, so the list was scaffolding around a single line. */}
        {cs.role && (
          <p className="mt-5 text-control tracking-tight text-muted">
            {cs.role}
          </p>
        )}
      </header>

      {/* The landing panel, drawn again at page width: same 1195/681 ratio,
          same square corners, same floating treatment for artwork that carries
          its own transparent ground. It was 16/9 with a 12px radius over a #111
          plate, so the image a visitor clicked and the image they landed on were
          cropped differently and cornered differently.

          `heroPosition` still wins over `cardPosition` if an entry sets it, but
          the two boxes are identical now so nothing needs to.

          The hero is also the way back, and it undoes the animation that
          brought you here: clicking it flies the cover back down into its own
          panel. Nothing marks it, deliberately -- the word "Work" above is what
          a reader looking for the exit finds, and this is what someone who
          clicks the picture gets. `#case-<slug>` rather than `#work` so it
          returns to this study's panel rather than the top of the list, which
          is also what gives the morph somewhere on screen to land. */}
      <ViewTransitionLink
        href={`/#case-${cs.slug}`}
        vtName={vtName}
        centreInView
        className="block cursor-pointer"
        aria-label={`Back to the work, at ${cs.title}`}
      >
        <CoverImage
          cover={cover}
          className={
            // work-bleed takes the hero edge to edge below 640px -- see the
            // phone block at the foot of work.css.
            "work-bleed relative mt-10 aspect-[1195/681] lg:mt-14 " +
            (cover.floating
              ? ""
              : "overflow-hidden bg-surface")
          }
          imageClassName={cover.floating ? "object-contain" : "object-cover"}
          objectPosition={cover.heroPosition ?? cover.cardPosition}
          sizes="(min-width: 1024px) 92vw, 100vw"
          priority
          containerProps={{
            style: { viewTransitionName: vtName },
            "data-vt-target": vtName,
            "data-vt-cover": "",
          }}
        />
      </ViewTransitionLink>

      {/* One column, the full width of the page's own. The prose caps itself at
          a reading measure inside it (see .work-prose in work.css) while figures
          run the whole width, which is the same relationship the landing page
          has between a panel and the summary line under it: the imagery is the
          wide element and the text is the narrow one. */}
      <div className="mt-12 lg:mt-16">
        <CaseStudyBody blocks={cs.body} />
      </div>

      {/* --- Closer --------------------------------------------------------
          The landing page's footer, verbatim, so a case study ends where the
          landing page ends. */}
      <footer className="mt-24 flex flex-col items-center gap-5 pb-24 text-center lg:mt-32 lg:pb-32">
        <p className="text-display font-medium tracking-tight">{closer}</p>
        <BookACall variant="outline" />
      </footer>
    </div>
  );
}
