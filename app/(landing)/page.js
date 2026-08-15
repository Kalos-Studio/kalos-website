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

function Section({ children, rule = true, className = "" }) {
  return (
    <section className={`ln-section ${rule ? "ln-rule" : ""} ${className}`}>
      <div className="ln-shell">{children}</div>
    </section>
  );
}

function SectionHead({ kicker, heading, className = "" }) {
  return (
    <div className={className}>
      {kicker && <span className="ln-kicker mb-3">{kicker}</span>}
      <h2 className="ln-h2 max-w-3xl">{heading}</h2>
    </div>
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
        <span className="ln-kicker mb-6">{proof.eyebrow}</span>
        <div className="ln-proof">
          {proof.clients.map((name) => (
            <span className="ln-client" key={name}>
              {name}
            </span>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead kicker={story.kicker} heading={story.heading} />
        <p className="ln-body mt-7 max-w-2xl">{story.body}</p>
      </Section>

      <Section>
        <SectionHead kicker={offering.kicker} heading={offering.heading} />
        <p className="ln-body mt-7 max-w-2xl">{offering.body}</p>
        <p className="ln-aside mt-6 max-w-2xl">{offering.secondary}</p>
      </Section>

      <Section>
        <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {values.map((v) => (
            <div key={v.title}>
              <h3 className="ln-h3">{v.title}</h3>
              <p className="ln-body--tight mt-2.5 max-w-sm">{v.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Not linked. Every /work route is behind the password gate, so a card
          that looks clickable would send a cold visitor into a login wall. The
          covers and the blurbs do the work here; /work stays for warm leads who
          are given the URL. */}
      <Section>
        <SectionHead heading={featuredWork.heading} />
        <div className="mt-10 grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
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
      </Section>

      <Section>
        <h2 className="ln-h2 max-w-3xl">{mission.heading}</h2>
        <p className="ln-body mt-7 max-w-2xl">{mission.body}</p>
      </Section>

      <Section>
        <SectionHead kicker={process.kicker} heading="How it works" />
        <ol className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {process.steps.map((step, i) => (
            <li key={step.title}>
              <span className="ln-step-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="ln-h3 mt-3">{step.title}</h3>
              <p className="ln-body--tight mt-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <SectionHead heading="Questions" />
        {/* Rendered in the order content.js declares, answered or not. An
            earlier version grouped the unanswered ones at the end, which read
            fine on the preview and quietly moved "how much does it cost" to the
            bottom of the page. That is the question most visitors came for, so
            the placeholder holds its slot instead. */}
        <div className="mt-8 max-w-3xl">
          {faq.map((item) => (
            <div className="ln-faq-item" key={item.q}>
              <h3 className="ln-faq-q">{item.q}</h3>
              {item.a ? (
                <p className="ln-body--tight mt-2.5">{item.a}</p>
              ) : (
                <p className="ln-faq-pending mt-2.5">
                  Answer pending: {item.pending} is not set yet.
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section className="text-center">
        <h2 className="ln-h2 mx-auto max-w-2xl">{finalCta.heading}</h2>
        <CallToAction className="mt-9" />
      </Section>
    </main>
  );
}
