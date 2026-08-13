// /lab is a live prototype, not a page we're publishing. It ships to production
// so it can be opened on a real phone, but it shouldn't be indexed or turn up in
// search results for "kalos" while the real site is still a coming-soon page.
//
// This has to be a layout rather than metadata on the page itself: page.js is a
// client component, and client components can't export metadata.
export const metadata = {
  title: "Kalos — motion lab",
  robots: { index: false, follow: false, nocache: true },
};

export default function LabLayout({ children }) {
  return children;
}
