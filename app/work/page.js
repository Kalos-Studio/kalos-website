import Link from "next/link";
import CoverImage from "./CoverImage";
import { caseStudies, MORE_CASE_STUDIES_URL } from "./data";

export default function WorkIndexPage() {
  return (
    <div className="work-shell">
      <header className="work-header">
        <Link href="/work" className="work-wordmark">
          kalos <span>/ work</span>
        </Link>
      </header>

      {caseStudies.length === 0 ? (
        <p className="work-empty">No case studies published yet.</p>
      ) : (
        <ol className="work-list">
          {caseStudies.map((cs, i) => (
            <li key={cs.slug}>
              <Link href={`/work/${cs.slug}`} className="work-card">
                <CoverImage
                  cover={cs.cover}
                  className="work-card-cover"
                  priority={i === 0}
                />
                <div className="work-card-meta">
                  <h2 className="work-card-title">{cs.title}</h2>
                  {cs.year && <span className="work-card-year">{cs.year}</span>}
                </div>
                <p className="work-card-summary">{cs.summary}</p>
                <span className="work-card-link">View case study →</span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <a
        href={MORE_CASE_STUDIES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="work-case-more-link work-list-more-link"
      >
        See more case studies →
      </a>
    </div>
  );
}
