import { meta } from "./content";

// Everything in this route group is the landing page. The group was originally
// created to keep a zoom lock off `/work`; that lock is gone (see below), so
// what it earns now is a themeColor and a title/description that belong to the
// homepage alone rather than to every route under the root layout.
//
// page.js is a server component again now that the client-only parts live in
// hero.js, so these exports could technically move there. They stay here
// because the group is the thing being described, not the page.
//
// There's deliberately no `robots` block here. This carried `noindex` for as long
// as it was the /lab prototype living behind a coming-soon homepage. That page
// is gone and this is the homepage now, so it inherits the site default and is
// indexable.
//
// themeColor is the brand's #030305 rather than the hero's old #060505. It is
// the first colour a phone paints while the page loads, so it should be the
// real ground and not a warmer approximation of it.
export const metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: { title: meta.title, description: meta.description, url: "/" },
  twitter: { title: meta.title, description: meta.description },
};

// The zoom lock that used to live here is gone.
//
// It was correct while this route was a single fixed viewport with a draggable
// object on it, where a pinch was only ever an accident. The page scrolls now
// and has an FAQ on it, and taking zoom away from a page with body copy is a
// straightforward accessibility failure. `touch-action: pan-y` in lab.css still
// keeps a horizontal drag on the mark from panning the page.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030305",
};

export default function LandingLayout({ children }) {
  return children;
}
