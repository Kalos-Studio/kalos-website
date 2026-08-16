import Image from "next/image";
import Hero from "./hero";
import CallToAction from "./cta";
import Reveal from "./reveal";
import { caseStudies } from "../work/data";
import {
  faq,
  featuredWork,
  finalCta,
  mission,
  offering,
  process,
  proof,
  story,
  values,
} from "./content";
import "./landing.css";

// A server component on purpose. Only the hero needs the client, and everything
// below it is copy that should exist in the HTML for a crawler and for anyone
// whose JS never arrives.
//
// Section order: offer, then evidence, then belief. The first version led with
// the καλός story, which put two screens of philosophy in front of a visitor who
// did not yet know what we sell. Both of the peer sites worth copying the shape
// of (Kree8, Designjoy) put the offer and the proof first and the studio's own
// story after, and that is also the order a cold reader needs.

function Section({ children, rule = true, className = "" }) {
  return (
    <section className={`ln-section ${rule ? "ln-rule" : ""} ${className}`}>
      <div className="ln-shell">{children}</div>
    </section>
  );
}

// Titles and alt text come from app/work/data.js rather than being restated
// here, so a case study renamed over there stays correct on the homepage.
//
// The cover image does NOT. Everything under /work is behind the password gate,
// and middleware.js matches /work/:path* which includes the static files, so
// those images 307 to the login page for anyone not already signed in. Next's
// image optimizer follows the redirect, gets HTML, and fails the request. That
// is not a bug to route around by loosening the gate: the homepage is public
// and should serve its own public assets deliberately, so the three featured
// covers are copied into /public/home. Verified by watching them 400 first.
function featured() {
  return featuredWork.slugs
    .map((slug) => {
      const study = caseStudies.find((c) => c.slug === slug);
      if (!study) return null;
      return {
        ...study,
        blurb: featuredWork.blurbs[slug],
        publicCover: `/home/${slug}.webp`,
      };
    })
    .filter(Boolean);
}

export default function Landing() {
  const [lead, ...rest] = featured();

  return (
    <main className="landing-root">
      <Hero />

      {/* Proof directly under the hero, before any argument. Someone deciding
          whether to keep reading wants evidence, not a second claim. */}
      <Section rule={false}>
        <Reveal>
          <span className="ln-runninghead mb-6">{proof.eyebrow}</span>
          <div className="ln-proof">
            {proof.clients.map((name) => (
              <span className="ln-client" key={name}>
                {name}
              </span>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* The offer, with the principles as its evidence rather than as a
          separate screen. They used to be a section with no headline at all,
          which rendered as four orphaned claims. */}
      <Section>
        <Reveal>
          <div className="ln-cols">
            <h2 className="ln-h2">{offering.heading}</h2>
            <div>
              <p className="ln-body">{offering.body}</p>
              <p className="ln-aside mt-5">{offering.secondary}</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="ln-values mt-14">
            {values.map((v) => (
              <div key={v.title}>
                <h3 className="ln-h3">{v.title}</h3>
                <p className="ln-body--tight mt-2">{v.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* Flagship at full width, the other two beneath it. Three equal
          thumbnails is the most generic arrangement available, and it spent the
          same space on Priority Ambulance Transfer, which is the entire offering
          delivered end to end, as on everything else.

          There is deliberately no call to action here any more. One went in on
          the theory that this is the highest-intent point on the page, which is
          true, but three buttons started to read as pestering and the research
          is on the side of fewer links, not more: one link converts at 13.5%
          against 10.5% for five or more. Hero and close is enough. */}
      <Section>
        <Reveal>
          <h2 className="ln-h2 max-w-3xl">{featuredWork.heading}</h2>
        </Reveal>
        <Reveal delay={80}>
          <article className="ln-work-lead mt-9">
            <div className="ln-card-media">
              <Image
                src={lead.publicCover}
                alt={lead.cover?.alt ?? lead.title}
                width={1200}
                height={750}
                sizes="(min-width: 1080px) 1040px, 100vw"
                priority={false}
                style={{ objectPosition: lead.cover?.cardPosition }}
              />
            </div>
            <div className="ln-cols mt-5">
              <h3 className="ln-h3">{lead.title}</h3>
              <p className="ln-body--tight">{lead.blurb}</p>
            </div>
          </article>
        </Reveal>
        <Reveal delay={120}>
          <div className="ln-work-rest mt-12 grid gap-x-7 gap-y-10">
            {rest.map((study) => (
              <article key={study.slug}>
                <div className="ln-card-media">
                  <Image
                    src={study.publicCover}
                    alt={study.cover?.alt ?? study.title}
                    width={1200}
                    height={750}
                    sizes="(min-width: 860px) 500px, 100vw"
                    style={{ objectPosition: study.cover?.cardPosition }}
                  />
                </div>
                <h3 className="ln-h3 mt-4">{study.title}</h3>
                <p className="ln-body--tight mt-2">{study.blurb}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* The word, set the way the brand file sets it (node 206:165): a
          dictionary entry with the Greek at display size, the grammatical
          labels in gold, then the definition and a rule. It used to be a single
          mention inside a paragraph, which is a strange way to treat the thing
          the whole studio is named after and argues from.

          Gold_Sand on the right, as the slide has it. The page's second image,
          and the studio's own artwork rather than a stock texture. */}
      <Section>
        <Reveal>
          <div className="ln-cols">
            <div>
              <span className="ln-word" lang="grc">
                {story.word}
              </span>
              <div className="ln-word-labels" aria-hidden>
                {story.labels.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </div>
              <p className="ln-definition">{story.definition}</p>
              <div className="ln-word-rule" />
              <h2 className="ln-h2 mt-8">{story.heading}</h2>
              <p className="ln-body mt-5">{story.body}</p>
              <p className="ln-body mt-5">{mission.body}</p>
            </div>
            <div className="ln-sand">
              <Image
                src="/home/gold-sand.webp"
                alt="Black sand in shallow focus, scattered with grains of gold"
                width={900}
                height={795}
                sizes="(min-width: 860px) 480px, 100vw"
              />
            </div>
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="ln-cols">
            <h2 className="ln-h2">{process.heading}</h2>
            <ol className="grid gap-7 sm:grid-cols-2">
              {process.steps.map((step, i) => (
                <li key={step.title}>
                  <span className="ln-step-index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="ln-h3 mt-2">{step.title}</h3>
                  <p className="ln-body--tight mt-1.5">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <div className="ln-cols">
            <h2 className="ln-h2">Questions</h2>
            {/* Rendered in the order content.js declares, answered or not. An
              earlier version grouped the unanswered ones at the end, which read
              fine on the preview and quietly moved "how much does it cost" to
              the bottom of the page. That is the question most visitors came
              for, so the placeholder holds its slot instead. */}
            <div>
              {faq.map((item, i) => (
                // Built on <details> rather than state: no JS, keyboard and
                // screen reader behaviour for free, and it still opens if
                // scripting fails. The first one is open so the pattern is
                // legible at a glance instead of reading as four dead rules.
                <details className="ln-faq-item" key={item.q} open={i === 0}>
                  <summary>
                    <h3 className="ln-faq-q">{item.q}</h3>
                    <span className="ln-faq-mark" aria-hidden />
                  </summary>
                  <div className="ln-faq-answer">
                    {item.a ? (
                      <p className="ln-body--tight">{item.a}</p>
                    ) : (
                      <p className="ln-faq-pending">
                        Answer pending: {item.pending} is not set yet.
                      </p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>

      <Section className="ln-closing text-center" rule={false}>
        <Reveal>
          <h2 className="ln-h2 mx-auto max-w-2xl">{finalCta.heading}</h2>
          <CallToAction className="mt-8" />
        </Reveal>
      </Section>
    </main>
  );
}
