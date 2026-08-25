import Image from "next/image";
import Link from "next/link";
import Hero from "./hero";
import CallToAction from "./cta";
import Reveal from "./reveal";
import Sand from "./sand";
import MarkSlot from "./mark-slot";
import { caseStudies } from "../work/data";
import { featuredWork, finalCta, story } from "./content";
import "./landing.css";

// A server component on purpose. Only the hero needs the client, and everything
// below it is copy that should exist in the HTML for a crawler and for anyone
// whose JS never arrives.
//
// Four sections, which is what the web mock has: the hero, the word, the work,
// and the close. It used to have six. A proof strip, an offer section and four
// principles sat between the hero and the word, and the word itself carried a
// heading and two paragraphs after the definition. All of that came out on the
// instruction to remove anything the mock does not contain.
//
// The reasoning for those sections is in git and it was not bad reasoning: it
// was about a cold visitor who does not yet know what we sell, and it put the
// offer and the proof in front of the studio's own story deliberately. The mock
// answers the same question by saying less and reaching the work sooner. If any
// of it should come back, `git show 55a0cad:app/\(landing\)/content.js` has the
// copy and the argument for it.

function Section({ children, rule = true, className = "" }) {
  return (
    <section className={`ln-section ${rule ? "ln-rule" : ""} ${className}`}>
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
      <Hero />

      {/* The word. In the mock this is the first thing under the hero and the
          only prose above the work: the Latin wordmark, a slash, the Greek in
          gold, one sentence, a rule, and the turning mark beside it.

          It carries the page's h1. The hero has no copy in the mock, only the
          lockup, so there is no headline up there to be the document's heading
          any more. */}
      <Section rule={false}>
        <Reveal>
          <div className="ln-cols ln-definition-row">
            <div>
              <h1 className="ln-word">
                {story.latin}
                <span className="ln-word-greek" lang="grc">
                  {" / "}
                  {story.word}
                </span>
              </h1>
              <p className="ln-definition">{story.definition}</p>
              <div className="ln-word-rule" />
            </div>
            <MarkSlot />
          </div>
        </Reveal>
      </Section>

      {/* The work, as full-width rows rather than a lead card over a grid of
          thumbnails. Copy left, screenshot right, three of them, which is how the
          mock lays it out and gives each project the same weight instead of
          ranking them.

          The client's logo goes where the project title would. It is a stronger
          claim than a name set in type: a reader recognises Shell before they
          read anything. */}
      <Section>
        <Reveal>
          <h2 className="ln-h2">{featuredWork.heading}</h2>
        </Reveal>
        {projects.map((project, i) => (
          <Reveal key={project.slug} delay={i === 0 ? 80 : 0}>
            <article className="ln-work-row">
              <div className="ln-work-text">
                {/* A plain <img>: fixed-height logos give the optimizer nothing
                    to do, and next/image would add a layout wrapper to serve the
                    same bytes. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="ln-work-logo" src={project.logo} alt={project.title} />
                <p className="ln-body">{project.blurb}</p>
              </div>
              <Link href={`/work/${project.slug}`} className="ln-card-media">
                <Image
                  src={project.cover.src}
                  alt={project.cover?.alt ?? project.title}
                  width={1200}
                  height={750}
                  sizes="(min-width: 860px) 620px, 100vw"
                  style={{ objectPosition: project.cover?.cardPosition }}
                />
              </Link>
            </article>
          </Reveal>
        ))}
        <Reveal>
          <Link href="/work" className="ln-more ln-more--centred">
            {featuredWork.more}
          </Link>
        </Reveal>
      </Section>

      {/* The close. One statement and one action, which is the only button on the
          page now that the hero has no copy. */}
      <Section rule={false} className="ln-closing text-center">
        <Reveal>
          <h2 className="ln-h2 mx-auto max-w-2xl">{finalCta.heading}</h2>
          <CallToAction className="mt-8" />
        </Reveal>
      </Section>
    </main>
  );
}
