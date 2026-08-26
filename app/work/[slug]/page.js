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
  // Not a real slug: hand the title back to the root layout. Naming one here
  // does nothing, which is worth knowing before trying it. Next resolves
  // metadata before the page renders and then discards the page's share of it
  // when notFound() throws, so a title returned from this branch never reaches
  // the document. What fixes it is the layout not having one to fall back to.
  // See app/work/layout.js.
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

  // Just the role. It used to be the client name and the role joined by a
  // slash, with the client dropped whenever it repeated the title: that fired
  // on four of the six entries, so some pages read "Shell / Mobile App Design"
  // and the rest read the role alone. Same field, two shapes, no rule a reader
  // could infer.

  const otherCaseStudies = caseStudies.filter((c) => c.slug !== cs.slug);

  return (
    <div className="work-shell">
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
        {cs.role && <p className="work-case-facts">{cs.role}</p>}
      </div>

      <CoverImage
        cover={cs.cover}
        className="work-case-cover"
        sizes="(min-width: 1200px) 1200px, 100vw"
        objectPosition={cs.cover?.heroPosition}
        priority
      />

      <CaseStudyBody blocks={cs.body} />

      {/* The whole block is conditional, not just the grid. Only the <ul> was
          guarded before, so a section with one case study rendered "More case
          studies" and "View all work" over nothing at all. */}
      {otherCaseStudies.length > 0 && (
        <div className="work-more">
          <div className="work-more-header">
            <h2 className="work-more-heading">More case studies</h2>
            <Link href="/work" className="work-more-view-all">
              View all work →
            </Link>
          </div>

          <ul className="work-more-grid">
            {otherCaseStudies.map((other) => (
              <li key={other.slug}>
                <Link href={`/work/${other.slug}`} className="work-card work-more-card">
                  <CoverImage
                    cover={other.cover}
                    className="work-more-cover"
                    sizes="(min-width: 640px) 33vw, 100vw"
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
        </div>
      )}
    </div>
  );
}
