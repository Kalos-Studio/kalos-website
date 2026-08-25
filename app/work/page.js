import Link from "next/link";
import Lockup from "../(landing)/lockup";
import CoverImage from "./CoverImage";
import { caseStudies } from "./data";

export default function WorkIndexPage() {
  return (
    <div className="work-shell work-shell--wide">
      {/* The "temporary repository, more coming soon" note is gone with the
          password gate. It was true while this was an unlisted holding page and
          it is an apology now: the homepage sends people here on purpose. */}
      <header className="work-header">
        <Link href="/" className="work-wordmark" aria-label="Kalos, home">
          <Lockup className="work-lockup" />
        </Link>
        <h1 className="work-title">Work</h1>
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
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
