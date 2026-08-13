import "./work.css";
import { WORK_ROBOTS, workPageTitle } from "./data";

// Applies to every /work route, including the login page. This whole section
// is deliberately kept out of search results — it's unlisted, not indexed.
export const metadata = {
  title: workPageTitle("Work"),
  robots: WORK_ROBOTS,
};

export default function WorkLayout({ children }) {
  return <div className="work-root">{children}</div>;
}
