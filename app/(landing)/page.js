import Image from "next/image";
import Hero from "./hero";
import CallToAction from "./cta";
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
  const work = featured();

  return (
    <main className="landing-root">
      <Hero />

      {/* Proof directly under the hero, before any argument. Someone deciding
          whether to keep reading wants evidence, not a second claim. */}
      <Section rule={false}>
        <span className="ln-runninghead mb-6">{proof.eyebrow}</span>
        <div className="ln-proof">
          {proof.clients.map((name) => (
            <span className="ln-client" key={name}>
              {name}
            </span>
          ))}
        </div>
      </Section>

      {/* The offer, with the principles as its evidence rather than as a
          separate screen. They used to be a section with no headline at all,
          which rendered as four orphaned claims. */}
      <Section>
        <div className="ln-cols">
          <h2 className="ln-h2">{offering.heading}</h2>
          <div>
            <p className="ln-body">{offering.body}</p>
            <p className="ln-aside mt-5">{offering.secondary}</p>
          </div>
        </div>

        <div className="ln-values mt-14">
          {values.map((v) => (
            <div key={v.title}>
              <h3 className="ln-h3">{v.title}</h3>
              <p className="ln-body--tight mt-2">{v.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Work, then the call to action. This is the point of highest intent on
          the page: someone who has just looked at three projects and is still
          reading should not have to scroll to the bottom to act. It is the same
          single offer, not a competing one, which is the distinction the
          research actually draws. */}
      <Section>
        <h2 className="ln-h2 max-w-3xl">{featuredWork.heading}</h2>
        <div className="mt-9 grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {work.map((study) => (
            <article key={study.slug}>
              <div className="ln-card-media">
                <Image
                  src={study.publicCover}
                  alt={study.cover?.alt ?? study.title}
                  width={1200}
                  height={750}
                  sizes="(min-width: 1024px) 340px, (min-width: 640px) 50vw, 100vw"
                  style={{ objectPosition: study.cover?.cardPosition }}
                />
              </div>
              <h3 className="ln-h3 mt-4">{study.title}</h3>
              <p className="ln-body--tight mt-2">{study.blurb}</p>
            </article>
          ))}
        </div>
        <CallToAction className="mt-12" />
      </Section>

      {/* Story and mission as one section. They were two full screens saying a
          single thing, which is most of why the page felt long. */}
      <Section>
        <div className="ln-cols">
          <h2 className="ln-h2">{story.heading}</h2>
          <div>
            <p className="ln-body">{story.body}</p>
            <p className="ln-body mt-5">{mission.body}</p>
          </div>
        </div>
      </Section>

      <Section>
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
      </Section>

      <Section>
        <div className="ln-cols">
          <h2 className="ln-h2">Questions</h2>
          {/* Rendered in the order content.js declares, answered or not. An
              earlier version grouped the unanswered ones at the end, which read
              fine on the preview and quietly moved "how much does it cost" to
              the bottom of the page. That is the question most visitors came
              for, so the placeholder holds its slot instead. */}
          <div>
            {faq.map((item) => (
              <div className="ln-faq-item" key={item.q}>
                <h3 className="ln-faq-q">{item.q}</h3>
                {item.a ? (
                  <p className="ln-body--tight mt-2">{item.a}</p>
                ) : (
                  <p className="ln-faq-pending mt-2">
                    Answer pending: {item.pending} is not set yet.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="text-center">
        <h2 className="ln-h2 mx-auto max-w-2xl">{finalCta.heading}</h2>
        <CallToAction className="mt-8" />
      </Section>
    </main>
  );
}
