import CoverImage from "../work/CoverImage";
import ViewTransitionLink from "../view-transition-link";
import { Mark } from "../lockup";
import { landingWork } from "../work/data";
import BookACall from "./book-a-call";
import PagedScroll from "./paged-scroll";
import HashTarget from "./hash-target";
import Masthead from "./masthead";
import Reveal from "./reveal";
import { closer, positioning } from "./content";

// The landing page, from the redesign wireframe: a hero that is the mark and
// one line, the first case study growing out from under it to full bleed, the
// rest as full-bleed panels one after another, and the closer.
//
// What went, and why it is not coming back as part of this: the pill rail, the
// definition block and the hero's fly-the-mark handover. The wireframe has none
// of them, and the handover existed to hand the mark to a masthead that is now
// hidden until the hero has gone.
//
// Four studies, not all of them. `landingWork` in data.js says which and in what
// order; the rest keep their pages.

const HERO_ID = "top";

export default function LandingPage() {
  const [first, ...rest] = landingWork;

  return (
    <>
      <Masthead revealStopId={`case-${landingWork[0].slug}`} />
      {/* Arrow and page keys only. The wheel is the browser's, paged by
          mandatory scroll snapping -- see paged-scroll.js for why reading it
          here cannot work. Renders nothing. */}
      <PagedScroll />
      {/* Opens on a panel when arrived at as /#case-<slug>, which is where
          "Back to Work" on a case study points. Also renders nothing. */}
      <HashTarget />

      {/* --- Hero and first study, one snap area -------------------------
          Free scrolling from the top of the page to the first study at full
          bleed, with the stops starting after it.

          The reveal is the one thing on the page that should be *watched*, and
          under mandatory snapping it could only be glimpsed: the page glided
          from the hero to full bleed in one snap and the zoom played in a blur.
          Removing its stop does not help on its own, since mandatory snapping
          then has nowhere to rest in the runway and glides to the next stop.

          What does is the spec's rule for a snap area larger than the window:
          every position at which it covers the window is a valid snap
          position. This wrapper is exactly the hero plus the runway, so the
          positions it covers run from the top of the page to the scroll at
          which the reveal completes -- free scrolling across all of it, a hard
          stop at each end, and the same geometry that times the animation
          bounds the freedom. `snap-always` so a fling from the hero cannot fly
          past full bleed onto EchoCare.

          It is also the top snap stop, which the hero used to carry itself:
          without one the top of the document is unreachable under mandatory
          snapping. */}
      <div className="snap-always snap-start">
        {/* Short of a full window on purpose: the first study's inset frame
            sits under it and peeks over the fold, which is what says there is
            more below. 18% of the window from lg; below that a fixed 6rem,
            since a fraction of a phone's height is either nothing or most of
            the frame. */}
        <section
          id={HERO_ID}
          className="flex h-[calc(100svh-6rem)] flex-col items-center justify-center gap-10 px-5 text-center lg:h-[82svh] lg:gap-14"
        >
          {/* The wireframe draws the mark at 60 of 460, 13% of the width.

              All three carry a soft shadow, the same one in three forms --
              drop-shadow on the mark because it follows the shape rather than
              the box, text-shadow on the line, box-shadow on the button. Low
              and wide so it lifts them off the page rather than outlining
              them. */}
          <Mark className="h-auto w-[clamp(6rem,13vw,13rem)] drop-shadow-[0_12px_24px_rgb(4_4_6/0.22)]" />
          <h1 className="max-w-[26ch] text-lead tracking-tight text-shadow-[0_4px_14px_rgb(4_4_6/0.18)]">
            {positioning}
          </h1>
          <BookACall
            variant="outline"
            size="sm"
            className="shadow-[0_8px_20px_-6px_rgb(4_4_6/0.25)]"
          />
        </section>

        <Reveal cs={first} />
      </div>

      <section aria-label="More work">
        {/* The panels, edge to edge and touching, as the wireframe stacks them.
            A full window each from lg, and each one a stop, so a flick moves
            exactly one picture. Below lg they are 16:9 strips: a landscape
            picture cropped to a portrait phone keeps a sliver of the middle,
            which for Priority is half a headline.

            snap-center rather than start, which is the same place when a panel
            is the window's height and the right one when it is a strip. */}
        {rest.map((cs) => {
          const cover = { ...cs.cover, ...cs.landingCover };
          const vtName = `cover-${cs.slug}`;
          return (
            <article
              key={cs.slug}
              id={`case-${cs.slug}`}
              className="snap-always snap-center"
            >
              <ViewTransitionLink
                href={`/work/${cs.slug}`}
                vtName={vtName}
                aria-label={cs.title}
                className="block"
              >
                <CoverImage
                  cover={cover}
                  className="relative aspect-video w-full overflow-hidden bg-surface lg:aspect-auto lg:h-svh"
                  imageClassName="object-cover"
                  objectPosition={cover.cardPosition}
                  sizes="100vw"
                  containerProps={{
                    style: { viewTransitionName: vtName },
                    "data-vt-cover": "",
                    "data-vt-target": vtName,
                  }}
                />
              </ViewTransitionLink>
            </article>
          );
        })}
      </section>

      {/* --- Closer --------------------------------------------------------
          A full window and a stop of its own, snap-start. It carried snap-end
          once, which aligns its end with the bottom of the document and dragged
          the last panel's landing all the way down. */}
      <footer
        id="connect"
        className="flex min-h-svh snap-always snap-start flex-col items-center justify-center gap-6 px-5 text-center"
      >
        <p className="text-display font-medium tracking-tight">{closer}</p>
        <BookACall variant="outline" size="sm" />
      </footer>
    </>
  );
}
