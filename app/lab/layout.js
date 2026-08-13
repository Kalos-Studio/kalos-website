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

// The page is one fixed viewport with a drag-driven object in the middle of it,
// so pinch-zoom and scroll are only ever accidents here.
//
// Worth knowing: iOS Safari has ignored user-scalable=no since iOS 10, on
// purpose — it won't let a page take zoom away from someone who needs it. The
// thing that actually stops an accidental pinch on iPhone is `touch-action:
// none` in lab.css. This declaration is what handles Android.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#060505",
};

export default function LabLayout({ children }) {
  return children;
}
