import Link from "next/link";
import CoverImage from "./CoverImage";
import { caseStudies } from "./data";

export default function WorkIndexPage() {
  return (
    <div className="work-shell work-shell--wide">
      {/* The "temporary repository, more coming soon" note is gone with the
          password gate. It was true while this was an unlisted holding page and
          it is an apology now: the homepage sends people here on purpose. */}
      {/* The lockup that used to sit above this title is in the masthead now,
          pinned to the window rather than to this shell's left margin, which on
          a laptop was 164px in from the edge of the screen. What is left here is
          the page's headline. */}
      <header className="work-header">
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
                  sizes="(min-width: 640px) 50vw, 100vw"
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
