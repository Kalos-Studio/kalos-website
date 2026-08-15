// The spotlight wordmark that used to be the homepage, kept on its own route now
// that the WebGL hero has taken `/`. Nothing links to it — it's here so the older
// treatment is a URL away rather than a git revert, and so the `.spot-*` block in
// globals.css still has a page that uses it.
//
// noindex for the same reason /lab used to carry it: two pages that are both "the
// Kalos homepage" should not compete in search results.
export const metadata = {
  title: "Kalos",
  robots: { index: false, follow: false, nocache: true },
};

export default function ComingSoonLayout({ children }) {
  return children;
}
