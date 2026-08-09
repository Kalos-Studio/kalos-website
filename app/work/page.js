import Link from "next/link";
import CoverImage from "./CoverImage";
import { caseStudies } from "./data";

export default function WorkIndexPage() {
  return (
    <div className="work-shell work-shell--wide">
      <p className="work-construction-note">
        This is a temporary repository as we build out our website. More
        case studies are coming soon.
      </p>

      <header className="work-header">
        <Link href="/work" className="work-wordmark">
          kalos <span>/ work</span>
        </Link>
      </header>

      {caseStudies.length === 0 ? (
        <p className="work-empty">No case studies published yet.</p>
      ) : (
        <ul className="work-list">
          {caseStudies.map((cs, i) => (
            <li key={cs.slug}>
              <Link href={`/work/${cs.slug}`} className="work-card">
                <CoverImage
                  cover={cs.cover}
                  className="work-card-cover"
                  objectPosition={cs.cover?.cardPosition}
                  priority={i === 0}
                />
                <h2 className="work-card-title">{cs.title}</h2>
                <p className="work-card-summary">{cs.summary}</p>
                <span className="work-card-link">View case study →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
