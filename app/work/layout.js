import Masthead from "../masthead";
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
      {/* In the layout rather than on each page, so the index, every case study
          and the 404 get it without three chances to forget one. It is fixed to
          the window, so it sits outside .work-shell's column and does not move
          when the shell's max-width changes between the listing and a study. */}
      <Masthead className="site-masthead--fixed" />
      {children}
    </div>
  );
}
