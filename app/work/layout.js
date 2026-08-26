import Masthead from "../masthead";
import BackLink from "./back-link";
import "./work.css";
import { workPageTitle } from "./data";

// Applies to every /work route. No `robots` here any more: the section was
// noindex'd while it sat behind a password, and it is public now.
export const metadata = {
  title: workPageTitle("Work"),
};

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
