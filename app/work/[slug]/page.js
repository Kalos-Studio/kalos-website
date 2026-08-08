import Link from "next/link";
import { notFound } from "next/navigation";
import CoverImage from "../CoverImage";
import CaseStudyBody from "../CaseStudyBody";
import { caseStudies } from "../data";

export function generateStaticParams() {
  return caseStudies.map((cs) => ({ slug: cs.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cs = caseStudies.find((c) => c.slug === slug);
  if (!cs) return {};
  return {
    title: `${cs.title} — Kalos`,
    description: cs.summary,
    robots: { index: false, follow: false },
  };
}

export default async function CaseStudyPage({ params }) {
  const { slug } = await params;
  const cs = caseStudies.find((c) => c.slug === slug);

  if (!cs) notFound();

  const facts = [
    cs.client && { label: "Client", value: cs.client },
    cs.role && { label: "Role", value: cs.role },
    cs.year && { label: "Year", value: cs.year },
  ].filter(Boolean);

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

      <CaseStudyBody blocks={cs.body} />
    </div>
  );
}
