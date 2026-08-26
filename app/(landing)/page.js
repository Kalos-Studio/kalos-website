import Image from "next/image";
import Link from "next/link";
import Hero from "./hero";
import CallToAction from "./cta";
import Reveal from "./reveal";
import Sand from "./sand";
import ScrollSettle from "./scroll-settle";
import { caseStudies } from "../work/data";
import { featuredWork, finalCta } from "./content";
import "./landing.css";

// A server component on purpose. Only the hero needs the client, and everything
// below it is copy that should exist in the HTML for a crawler and for anyone
// whose JS never arrives.
//
// Three sections now: the hero, the work, and the close.
//
// The mock had four. The word — "Kalos / καλός", the definition and the turning
// mark — was the first thing under the hero, and it has moved to /about intact
// rather than being cut: app/about/page.js is the same markup and the same
// copy, still reading from content.js. Before that it had six. A proof strip, an
// offer section and four principles sat between the hero and the word, and the
// word itself carried a heading and two paragraphs after the definition. All of
// that came out on the instruction to remove anything the mock does not contain.
//
// Worth flagging what moving the word costs here, because it is invisible: it
// carried the page's h1, and nothing has taken that over. The hero has no copy
// and the two remaining headings are h2s, so this document currently has no h1
// at all. The obvious fix is the masthead lockup, which was an h1 until the word
// took the job.
//
// The reasoning for those sections is in git and it was not bad reasoning: it
// was about a cold visitor who does not yet know what we sell, and it put the
// offer and the proof in front of the studio's own story deliberately. The mock
// answers the same question by saying less and reaching the work sooner. If any
// of it should come back, `git show 55a0cad:app/\(landing\)/content.js` has the
// copy and the argument for it.

function Section({ children, className = "" }) {
  return (
    <section className={`ln-section ${className}`}>
      <div className="ln-shell">{children}</div>
    </section>
  );
}

// Titles and alt text come from app/work/data.js rather than being restated here,
// so a case study renamed over there stays correct on the homepage.
function featured() {
  return featuredWork.projects
    .map((project) => {
      const study = caseStudies.find((c) => c.slug === project.slug);
      if (!study) return null;
      return { ...study, ...project, blurb: featuredWork.blurbs[project.slug] };
    })
    .filter(Boolean);
}

export default function Landing() {
  const projects = featured();

  return (
    <main className="landing-root">
      <Sand />
      {/* Keeps the page from stopping in the dead zone between the hero and the
          work: the first scroll commits and carries you to the case studies.
          See scroll-settle.js. */}
      <ScrollSettle />
      <Hero />

      {/* The word lives at /about now. See the note at the top of this file. */}

      {/* The work, as full-width rows rather than a lead card over a grid of
          thumbnails. Copy left, screenshot right, three of them, which is how the
          mock lays it out and gives each project the same weight instead of
          ranking them.

          The client's logo goes where the project title would. It is a stronger
          claim than a name set in type: a reader recognises Shell before they
          read anything. */}
      <Section>
        {/* No "Work" heading over the rows. Three client logos at the top of
            three full-width rows already say what this is, and a section label
            above them was labelling the obvious — the same reasoning that took
            the kicker off every section. */}
        {projects.map((project, i) => (
          <Reveal key={project.slug} delay={i === 0 ? 80 : 0}>
            <article className="ln-work-row">
              <div className="ln-work-text">
                {/* A plain <img>: fixed-height logos give the optimizer nothing
                    to do, and next/image would add a layout wrapper to serve the
                    same bytes.

                    A project with no logo file sets its name in the brand face
                    instead of rendering src={undefined}, which is a broken image
                    icon on a marketing page. Same reasoning as the logo README:
                    a half-supplied row should look deliberate. */}
                {project.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="ln-work-logo" src={project.logo} alt={project.title} />
                ) : (
                  <p className="ln-work-name">{project.title}</p>
                )}
                <p className="ln-body">{project.blurb}</p>
              </div>
              <Link href={`/work/${project.slug}`} className="ln-card-media">
                <Image
                  src={project.cover.src}
                  alt={project.cover?.alt ?? project.title}
                  width={1200}
                  height={675}
                  sizes="(min-width: 860px) 620px, 100vw"
                  style={{ objectPosition: project.cover?.cardPosition }}
                />
              </Link>
            </article>
          </Reveal>
        ))}
        <Reveal>
          <Link href="/work" className="ln-more ln-more--ends-list">
            {featuredWork.more.replace("{count}", caseStudies.length)}
          </Link>
        </Reveal>
      </Section>

      {/* The close. One statement and one action, which is the only button on the
          page now that the hero has no copy. */}
      <Section className="ln-closing text-center">
        <Reveal>
          <h2 className="ln-h2 mx-auto max-w-2xl">{finalCta.heading}</h2>
          <CallToAction className="mt-8" />
        </Reveal>
      </Section>
    </main>
  );
}
