import "./work.css";

// Applies to every /work route, including the login page. This whole section
// is deliberately kept out of search results — it's unlisted, not indexed.
export const metadata = {
  title: "Work — Kalos",
  robots: { index: false, follow: false },
};

export default function WorkLayout({ children }) {
  return <div className="work-root">{children}</div>;
}
