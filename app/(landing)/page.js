import CoverImage from "../work/CoverImage";
import ViewTransitionLink from "../view-transition-link";
import { workRail } from "../work/data";
import Hero from "./hero";
import BookACall from "./book-a-call";
import PagedScroll from "./paged-scroll";
import WorkRail from "./work-rail";
import { closer } from "./content";

// The landing page, built from the brand wireframe (Figma node 396:9876).
//
// Two things about the numbers below. The wireframe is a 1920x2583 frame, so its
// pixel values are not sizes to copy -- they are proportions. Where one is used
// directly it is because the ratio matters and the arbitrary value carries a
// comment saying which ratio: `aspect-[1195/681]` is the case study frame, and
// the rail's width tracks 181/1920.
//
// Everything else is Tailwind's own scale plus the three fluid type tokens in
// globals.css (text-display, text-lead, text-control), which exist because this
// design is proportion-driven and a fixed 32px body would be enormous on a
// laptop and unreadable on a phone.
//
// Black and white for now. The brand palette is declared in @theme and gets
// applied once the layout is settled.


// `role` is one comma-separated string in data.js, which is right for the case
// study page (it sets it as a single line) and wrong here. Split rather than
// reshape the data: the string stays the source of truth and this is the only
// caller that wants it in parts.
function disciplines(role) {
  return role ? role.split(",").map((part) => part.trim()).filter(Boolean) : [];
}

export default function LandingPage() {
  return (
    // The content column. x=96..1805 of 1920 -- a 5% left margin and a 6% right
    // one. The asymmetry is real (the right edge is where the rail and both
    // calls to action line up) but not worth reproducing at the cost of a
    // centred, capped column that behaves at every width.
    <div className="mx-auto w-full max-w-[120rem] px-5 sm:px-8 lg:px-12 xl:px-24">
      <Hero />
      {/* One wheel gesture, one view, from the first case study down. Renders
          nothing -- see paged-scroll.js for what it does and does not take. */}
      <PagedScroll />

      {/* --- Work ---------------------------------------------------------
          Two columns: panels left, pill rail right. The frame puts panels at
          x=267..1462 and the rail at 1624..1805, so the gap between them is 8.4%
          and the rail is 9.4% wide.

          The rail comes first in the DOM so that on a narrow window, where the
          grid collapses to one column, it lands above the panels without needing
          an order override -- and so a screen reader meets the index before the
          list it indexes. */}
      <section id="work" className="scroll-mt-8 pb-24 lg:pb-40">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_11.5rem] lg:gap-16 xl:gap-24">
          <WorkRail items={workRail} />

          {/* The panels start below the fold, and only the rail peeks above it.
              The two share a grid row, so without this offset shortening the
              hero would reveal the first case study alongside the rail — and the
              first thing a visitor sees should be the index, not a project.

              The arithmetic: the hero is 88svh, so the work section begins 0.12
              of a viewport above the fold, and the panels start below it. The
              wireframe does the same — rail at y=1012 against a fold at y=1113,
              first panel not until y=1292.

              35svh rather than the 17svh this started at, because the hero's
              handover needs somewhere to happen. The block catches at the top
              and is held there while it fades, and this panel is scrolling up
              towards it the whole time; at 17svh the two came within 11px of
              each other while the block was still visible. This is the distance
              that buys the hold its room, and the space is not empty — the
              fading hero is sitting in it.

              lg only. Below that the rail is a horizontal strip above the panels
              rather than a column beside them, so there is no shared row to
              offset and a 17svh hole would just be a gap. */}
          <ul className="flex flex-col gap-10 lg:col-start-1 lg:row-start-1 lg:gap-24 lg:pt-[35svh]">
            {workRail.map((cs, i) => {
              // The placeholder has no page, no cover and no logo. It renders as
              // an empty framed slot in the same rhythm as the rest, and is not a
              // link — there is nowhere for it to go yet.
              if (cs.placeholder) {
                return (
                  <li
                    key={cs.slug}
                    id={`case-${cs.slug}`}
                    className="snap-always snap-center"
                  >
                    <div className="flex aspect-[1195/681] items-center justify-center border border-dashed border-black/30 bg-neutral-50">
                      <p className="text-control tracking-tight text-neutral-500">
                        Case study coming soon
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-2 lg:mt-5 lg:gap-x-10">
                      <h2 className="shrink-0">
                        {cs.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cs.logo}
                            alt={cs.title}
                            className="h-8 w-auto [filter:brightness(0)] lg:h-12"
                          />
                        ) : (
                          <span className="text-lead font-medium tracking-tight text-neutral-500">
                            {cs.title}
                          </span>
                        )}
                      </h2>
                      <ul className="flex flex-wrap gap-x-2 gap-y-1.5">
                        {disciplines(cs.role).map((tag) => (
                          <li
                            key={tag}
                            className="rounded-full border border-black/15 px-2.5 py-0.5 text-xs tracking-tight text-neutral-400"
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              }

              // The panel image is the case study's cover unless the entry
              // overrides it for the landing page. Spread rather than replaced,
              // so an override can set one key (vital-energy only sets
              // `floating`) and inherit src and alt from the cover.
              const cover = { ...cs.cover, ...cs.landingCover };

              // The name that pairs this panel with its case study hero, so
              // the cover morphs between the two instead of the page swapping
              // under it. Every study, now that the hero renders this same
              // resolved cover -- the morph only reads as one when both ends
              // are the same file at the same crop.
              const vtName = `cover-${cs.slug}`;

              return (
                // Each case study is a scroll stop. snap-center rather than
                // snap-start because a panel is shorter than the viewport, so
                // centring it puts the image in the middle of the screen instead
                // of pinning it under the sticky rail.
                //
                // snap-always stops a fast flick from skipping several at once,
                // which is what makes this read as stepping through the work
                // rather than as scrolling that happens to catch.
                <li
                  key={cs.slug}
                  id={`case-${cs.slug}`}
                  className="snap-always snap-center"
                >
                  <ViewTransitionLink
                    href={`/work/${cs.slug}`}
                    className="group block"
                    vtName={vtName}
                  >
                    {/* 1195x681 in the frame. Square corners by decision -- no
                        rounding on imagery anywhere on this site.

                        A floating cover drops the border and the grey plate and
                        switches to object-contain: the artwork carries its own
                        transparent ground, so the frame would be a second box
                        drawn around something already framed, and a crop would
                        cut the very edges that make it read as floating. The
                        aspect box stays either way, so the panels keep their
                        rhythm down the column whatever is inside them. */}
                    <CoverImage
                      cover={cover}
                      className={
                        "relative aspect-[1195/681] " +
                        (cover.floating
                          ? ""
                          : "overflow-hidden border border-black bg-neutral-100")
                      }
                      imageClassName={
                        cover.floating ? "object-contain" : "object-cover"
                      }
                      objectPosition={cover.cardPosition}
                      sizes="(min-width: 1024px) 70vw, 100vw"
                      // No `priority` here. The first panel is deliberately
                      // pushed to about 1.05 viewports down, so preloading it
                      // would fetch an off-screen image in competition with what
                      // is actually on screen at load -- which is type, not
                      // imagery.
                      containerProps={{
                        style: { viewTransitionName: vtName },
                        "data-vt-cover": "",
                        // Both ends of a pair are marked, because the morph
                        // runs both ways: this is the source going out to a
                        // case study and the destination coming back from one.
                        "data-vt-target": vtName,
                      }}
                    />
                    <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-2 lg:mt-5 lg:gap-x-10">
                      {/* The client's own mark stands in for its name. Still an
                          <h2>, so the page keeps its heading structure -- the
                          logo is the heading's content and its alt text is the
                          name.

                          Rendered monochrome: a row of competing brand colours
                          reads as a logo salad, and one weight makes it read as
                          evidence. brightness(0) blackens every opaque pixel,
                          which is why everything in public/home/logos has to sit
                          on a genuinely transparent background -- a logo
                          supplied on white would become a black rectangle.

                          A plain <img> rather than next/image: these are small,
                          already sized, and one is an SVG with no intrinsic
                          raster dimensions to give the optimizer. */}
                      <h2 className="shrink-0">
                        {cs.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cs.logo}
                            alt={cs.title}
                            className="h-8 w-auto [filter:brightness(0)] lg:h-12"
                          />
                        ) : (
                          <span className="text-lead font-medium tracking-tight">
                            {cs.title}
                          </span>
                        )}
                      </h2>

                      {/* The disciplines, straight off the case study's own
                          `role`, so the landing page and the study can never
                          disagree about what we did. */}
                      <ul className="flex flex-wrap gap-x-2 gap-y-1.5">
                        {disciplines(cs.role).map((tag) => (
                          <li
                            key={tag}
                            className="rounded-full border border-black/25 px-2.5 py-0.5 text-xs tracking-tight text-neutral-600"
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </ViewTransitionLink>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* --- Closer -------------------------------------------------------- */}
      {/* Not a snap point. `snap-end` here meant "align the end of this with the
          end of the scrollport", which is the bottom of the document -- so
          clicking the last pill landed near enough to that stop for proximity
          snapping to drag the page the rest of the way down instead of centring
          the case study. The stops are for the work; the closer is just the end
          of the page. */}
      {/* The closer gets the whole window. It is the one thing on the page being
          asked for, and sharing a screen with the tail of the work made it read
          as a footer rather than as the point. The rail fades out as this
          arrives -- see work-rail.js -- so nothing competes with it. */}
      <footer
        id="connect"
        // A stop of its own, so scrolling past the last case study lands here
        // rather than drifting to the bottom of the document.
        //
        // snap-start, not snap-end. This carried snap-end once, when it was a
        // short block at the foot of a long page: that aligns the element's end
        // with the end of the scrollport, which is the bottom of the document,
        // so clicking the last pill got dragged all the way down instead of
        // centring the case study. The closer is a full viewport now, so
        // aligning its top with the window's top is both correct and unambiguous.
        className="flex min-h-svh snap-always snap-start flex-col items-center justify-center gap-6 text-center"
      >
        <p className="text-display font-medium tracking-tight">{closer}</p>
        <BookACall variant="outline" />
      </footer>
    </div>
  );
}
