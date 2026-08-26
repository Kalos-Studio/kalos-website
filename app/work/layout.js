import Masthead from "../masthead";
import BackLink from "./back-link";
import "./work.css";

// No `metadata` here, and its absence is the point.
//
// It carried `title: "Work — Kalos"` for every route under /work, which is
// correct for the two that exist and wrong for the one that does not: a bad URL
// renders the root not-found boundary, inherits this title, and announces itself
// as the Work page in the tab, in a bookmark, and in every link preview of a
// broken link somebody shared. The obvious fix is to name a title for the miss
// in [slug]/page.js's generateMetadata, and it does nothing, because Next
// resolves metadata before the page renders and then discards the page's share
// of it when notFound() throws.
//
// So both real routes name their own title and this contributes none, which
// leaves a 404 under /work on the root layout's "Kalos" -- what /randomtext
// already gets.
//
// No `robots` either, and that one is older: the section was noindex'd while it
// sat behind a password, and it is public now.

export default function WorkLayout({ children }) {
  return (
    <div className="work-root">
      {/* In the layout rather than on each page, so the index and every case
          study get it without two chances to forget one. Not the 404 any more:
          app/work/not-found.js has gone, so a bad /work URL renders the root
          boundary, which carries its own. It is fixed to
          the window, so it sits outside .work-shell's column and does not move
          when the shell's max-width changes between the listing and a study.

          fadeOnScroll gives it the hero's exit. It is a function of position
          rather than of direction, so scrolling back to the top brings it back
          the same way the homepage's does, which is what keeps the menu
          reachable from the bottom of a long case study. */}
      <Masthead className="site-masthead--fixed" fadeOnScroll leading={<BackLink />} />
      {children}
    </div>
  );
}
