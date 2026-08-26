import Masthead from "../masthead";
import MarkSlot from "../(landing)/mark-slot";
import Reveal from "../(landing)/reveal";
import Sand from "../(landing)/sand";
import { story } from "../(landing)/content";
import "../(landing)/landing.css";
import "./about.css";

// The word, moved off the homepage.
//
// It was the first section under the hero and the only prose above the work. The
// section itself is unchanged: same copy out of app/(landing)/content.js, same
// .ln-word and .ln-definition, same turning mark. What changed is the frame
// around it. As a top-aligned two-column section it was a page that filled its
// first third and left two thirds of empty sand underneath, which reads as
// something that failed to finish loading rather than as a page. It is one
// centred stack holding one screen now: the mark as a crest, the name, the
// sentence. Same three objects, arranged for a page rather than for a slot in a
// longer one.
//
// Which is also why this page imports the landing page's stylesheet rather than
// taking a copy of the rules it needs. .ln-word, .ln-definition and .ln-sand are
// the section's art direction and they carry the comments explaining every
// number in them; duplicating them here would leave two versions to drift apart.
// landing.css also owns the page ground, the grid and the entrance. about.css
// holds only what is new: the masthead and the centred stage.
//
// It brings .landing-root and <Sand /> with it for the same reason: the section
// was composed on the black sand field, and on a flat ground it is a different
// section.

export const metadata = {
  title: "About — Kalos",
  description: story.definition,
  // openGraph and twitter are restated in full rather than extended. Next merges
  // metadata by replacing whole keys, so declaring either one here drops
  // everything the root layout put in it — siteName and type in one,
  // summary_large_image in the other, which is the difference between a wide
  // card and a small square crop. Only ever visible in the rendered meta tags.
  openGraph: {
    title: "About — Kalos",
    description: story.definition,
    siteName: "Kalos",
    type: "website",
    url: "/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "About — Kalos",
    description: story.definition,
  },
};

export default function About() {
  return (
    <main className="landing-root about-root">
      <Sand />

      {/* The masthead, and the way back. This page had no route out of it at
          all, which matters more here than on /work: /work's cards all go
          somewhere, and this page's only content is a sentence. It is the shared
          row now rather than this page's own: same lockup in the same corner as
          the homepage, and the menu that came with it is a second way out. */}
      <Masthead className="site-masthead--fixed" />

      {/* The Latin wordmark, a slash, the Greek in gold, one sentence, and the
          turning mark above it. The h1 comes with it: this is the page's
          headline now, which is the job it was already doing on the homepage. */}
      <section className="ab-stage">
        <div className="ln-shell">
          <Reveal>
            <div className="ab-entry">
              {/* sharesPageWithHero={false}: this route has no hero, so this
                  is the only WebGL context on it and the phone is not being
                  asked to run a second one. See mark-slot.js — without it a
                  phone gets the sand plate, which centred at crest size on a
                  sand ground is a photograph of the page's own background. */}
              <div className="ab-mark">
                <MarkSlot sharesPageWithHero={false} />
              </div>
              <h1 className="ln-word">
                {story.latin}
                <span className="ln-word-greek" lang="grc">
                  {" / "}
                  {story.word}
                </span>
              </h1>
              <p className="ln-definition">{story.definition}</p>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
