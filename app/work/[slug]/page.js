import Link from "next/link";
import { notFound } from "next/navigation";
import CoverImage from "../CoverImage";
import CaseStudyBody from "../CaseStudyBody";
import { caseStudies, workPageTitle } from "../data";

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
  // Next replaces metadata keys rather than deep-merging them, so anything this
  // object names is the whole value for that key. `robots` is deliberately absent
  // now that the section is public, which hands the root layout's default back.
  return {
    title: workPageTitle(cs.title),
    description: cs.summary,
  };
}

export default async function CaseStudyPage({ params }) {
  const { slug } = await params;
  const cs = getCaseStudy(slug);

  if (!cs) notFound();

  // The client is dropped when it is the title again, which it is on more than
  // half of these. "Vital Energy / Vital Energy / Head of Design" is not a fact
  // list, it is a stutter.
  const facts = [
    cs.client !== cs.title && cs.client,
    cs.role,
  ].filter(Boolean);

  const otherCaseStudies = caseStudies.filter((c) => c.slug !== cs.slug);

  return (
    <div className="work-shell">
      <Link href="/work" className="work-back">
        ← Work
      </Link>

      {/* No "Case study" eyebrow above the title any more. It was a label
          announcing what the reader can already see, and the brand file has no
          eyebrow-above-heading pattern anywhere in it — the same invention that
          landing.css records as the thing that made the homepage read as a
          template.

          The facts are one line rather than a labelled definition list. CLIENT
          set in small caps over a client name is two pieces of furniture around
          one fact, and on half these pages the client name and the title were
          the same word, so the label was introducing a repeat. */}
      <div className="work-case-header">
        <h1 className="work-case-title">{cs.title}</h1>
        <p className="work-case-summary">{cs.summary}</p>
        {facts.length > 0 && <p className="work-case-facts">{facts.join(" / ")}</p>}
      </div>

      <CoverImage
        cover={cs.cover}
        className="work-case-cover"
        objectPosition={cs.cover?.heroPosition}
        priority
      />

      <CaseStudyBody blocks={cs.body} columns={cs.bodyLayout === "columns"} />

      <div className="work-more">
        <div className="work-more-header">
          <h2 className="work-more-heading">More case studies</h2>
          <Link href="/work" className="work-more-view-all">
            View all work →
          </Link>
        </div>

        {otherCaseStudies.length > 0 && (
          <ul className="work-more-grid">
            {otherCaseStudies.map((other) => (
              <li key={other.slug}>
                <Link href={`/work/${other.slug}`} className="work-card work-more-card">
                  <CoverImage
                    cover={other.cover}
                    className="work-more-cover"
                    objectPosition={other.cover?.cardPosition}
                  >
                    <div className="work-more-overlay">
                      <span className="work-more-title">{other.title}</span>
                    </div>
                  </CoverImage>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
