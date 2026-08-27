import "./work.css";
import { workPageTitle } from "./data";

// Applies to every /work route.
//
// The `robots: { index: false }` that used to sit here went with the password
// gate. The section was kept out of search results because it was unlisted, and
// it is neither now: the landing page links straight into these case studies, so
// noindex would only mean the work is findable by anyone handed a link and by
// nobody else.
export const metadata = {
  title: workPageTitle("Work"),
};

// No wrapper element. There was a `.work-root` div here that painted the
// section's own black surface, held a fixed magenta texture in a ::before, and
// forced `min-height: 100dvh` so a short case study did not leave white below
// the fold. All three existed to make /work a dark island inside a site whose
// front door is white. The island is gone: these pages inherit <body>'s ground
// like every other route, which is the whole point of the rebuild, and a div
// that exists only to import a stylesheet is not worth keeping.
export default function WorkLayout({ children }) {
  return children;
}
