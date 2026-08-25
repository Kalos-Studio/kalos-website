import Image from "next/image";
import Link from "next/link";
import Hero from "./hero";
import CallToAction from "./cta";
import Reveal from "./reveal";
import Sand from "./sand";
import MarkSlot from "./mark-slot";
import { caseStudies } from "../work/data";
import {
  featuredWork,
  finalCta,
  mission,
  offering,
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
// A plain <img> rather than next/image. These are SVGs at a fixed height, so
// there is nothing for the optimizer to do, and next/image would add a layout
// wrapper and a round trip to serve the same bytes.
function ClientLogo({ src, name }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="ln-logo" src={src} alt={name} />;
}

function featured() {
  return featuredWork.slugs
    .map((slug) => {
      const study = caseStudies.find((c) => c.slug === slug);
      if (!study) return null;
      return {
        ...study,
        blurb: featuredWork.blurbs[slug],
      };
    })
    .filter(Boolean);
}

export default function Landing() {
  const [lead, ...rest] = featured();

  return (
    <main className="landing-root">
      <Sand />
      <Hero />

      {/* Proof directly under the hero, before any argument. Someone deciding
          whether to keep reading wants evidence, not a second claim. */}
      <Section rule={false}>
        <Reveal>
          <span className="ln-runninghead mb-6">{proof.eyebrow}</span>
          <div className="ln-proof">
            {proof.clients.map((client) =>
              client.logo ? (
                <ClientLogo
                  key={client.slug}
                  src={client.logo}
                  name={client.name}
                />
              ) : (
                <span className="ln-client" key={client.slug}>
                  {client.name}
                </span>
              )
            )}
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
                src={lead.cover.src}
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
                    src={study.cover.src}
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
        {/* The one link out of this section. Nothing on the homepage pointed at
            /work at all while /work was behind a password, which was consistent
            if unhelpful; it is public now, and three of six projects is a reason
            to keep going rather than a complete answer. Kept as a text link
            rather than a second button: the page has one primary action and the
            note above about three buttons reading as pestering still holds. */}
        <Reveal delay={160}>
          <Link href="/work" className="ln-more mt-10">
            See all work
          </Link>
        </Reveal>
      </Section>

      {/* The word, set the way the brand file sets it (node 206:165): a
          dictionary entry with the Greek at display size, the grammatical
          labels in gold, then the definition and a rule. It used to be a single
          mention inside a paragraph, which is a strange way to treat the thing
          the whole studio is named after and argues from.

          Two rows, not one, and the reason is the plate beside it.

          All of this used to be a single left column with the artwork alongside,
          which worked only while the artwork was tall enough to run the length
          of the prose. It is not any more: the plate is now the mark's slot at
          7:6 (see .ln-sand), so a one-column arrangement left about 450px of
          dead space to the right of the paragraphs. Splitting at the rule fixes
          that and says something truer about the content — the entry is a
          self-contained object and the argument that follows is a different
          thought. It is also how the mock has it: definition block and mark on
          one line, everything else below.

          The second row borrows the offer section's shape, heading left and
          prose right, because that pattern already exists on this page and a
          statement at 60px reads better across two lines than three. */}
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
            </div>
            <MarkSlot />
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div className="ln-cols mt-14">
            <h2 className="ln-h2">{story.heading}</h2>
            <div>
              <p className="ln-body">{story.body}</p>
              <p className="ln-body mt-5">{mission.body}</p>
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
