// Everything in this route group is the landing page — the group exists so these
// declarations stay scoped to `/`. Put them in the root layout instead and the
// zoom lock below would also apply to `/work`, which scrolls and has body copy
// that people need to be able to pinch.
//
// It has to be a layout rather than exports on the page itself: page.js is a
// client component, and client components can't export metadata or viewport.
//
// There's deliberately no `robots` block here. This carried `noindex` for as long
// as it was the /lab prototype living behind a coming-soon homepage. It is the
// homepage now, so it inherits the site default and is indexable.

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

export default function LandingLayout({ children }) {
  return children;
}
