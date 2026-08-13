import Link from "next/link";
import { notFound } from "next/navigation";
import CoverImage from "../CoverImage";
import CaseStudyBody from "../CaseStudyBody";
import { WORK_ROBOTS, caseStudies, workPageTitle } from "../data";

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
  return {
    title: workPageTitle(cs.title),
    description: cs.summary,
    robots: WORK_ROBOTS,
  };
}

export default async function CaseStudyPage({ params }) {
  const { slug } = await params;
  const cs = getCaseStudy(slug);

  if (!cs) notFound();

  const facts = [
    cs.client && { label: "Client", value: cs.client },
    cs.role && { label: "Role", value: cs.role },
  ].filter(Boolean);

  const otherCaseStudies = caseStudies.filter((c) => c.slug !== cs.slug);

  return (
    <div className="work-shell">
      <Link href="/work" className="work-back">
        ← Work
      </Link>

      <div className="work-case-header">
        <p className="work-case-eyebrow">Case study</p>
        <h1 className="work-case-title">{cs.title}</h1>
        <p className="work-case-summary">{cs.summary}</p>

        {facts.length > 0 && (
          <dl className="work-case-facts">
            {facts.map((fact) => (
              <div className="work-case-fact" key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
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
