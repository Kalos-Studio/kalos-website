import { Space_Grotesk } from "next/font/google";
import VariantSwitch from "./(landing)/variant-switch";
import "./globals.css";

// The brand face, confirmed off the guidelines deck rather than guessed, and now
// the font for the whole site. Inter is gone: it was only ever a stand-in from
// before anyone had checked what the brand face actually was.
//
// The variable goes on <html> as well as the class on <body>, because the
// @theme token in globals.css references it and a custom property declared on
// body is not resolvable from :root, which is where Tailwind puts the theme.
//
// This moves every line of /work, which was composed against Inter. Intended,
// not a side effect.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  // Space Grotesk has no Greek glyphs, and "καλός" is now the largest word in
  // the story section, so what catches those characters matters.
  //
  // By default next/font builds a metric-matched fallback out of Times New
  // Roman and puts it straight after the real family. Every Greek character
  // therefore rendered as a high-contrast serif, next to a monoline grotesk,
  // which is not what the brand file shows. Measured: the word came out exactly
  // as wide with the brand font as with `font-family: serif`, which is only
  // possible if it was already serif.
  //
  // Naming a sans stack here makes the fallback a grotesk instead, so unsupported
  // glyphs land on SF Pro, Segoe UI or Roboto depending on the platform. That is
  // effectively what Figma is doing when it renders this slide.
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
  adjustFontFallback: false,
});

// og:image has to be an absolute URL or iMessage and friends can't resolve it.
// Netlify exposes the production site URL as URL at build time; NEXT_PUBLIC_SITE_URL
// overrides it once there's a custom domain.
//
// A deploy preview has to advertise its own host, which is why the Netlify
// context is checked first. Both URL and NEXT_PUBLIC_SITE_URL are the *production*
// address in every context — Netlify's URL is documented as the main site
// address, not the current deploy's — so a preview was stamping
// `https://kalos.so/opengraph-image.png?<hash of the branch's image>` into its
// own og:image. That URL resolves: production ignores the query string and
// serves whatever image is on main, HTTP 200. So every preview link pasted into
// a chat previewed *production's* card, and a new OG image was unreviewable in
// the one place it is meant to be reviewed. It looked like the image had not
// updated. The image was fine; the URL pointed somewhere else.
//
// DEPLOY_PRIME_URL is the deploy's own primary address (the stable
// `deploy-preview-4--kalosso` form rather than DEPLOY_URL's per-build hash).
// CONTEXT is unset outside Netlify, so local dev is untouched.
const deployPreviewUrl =
  process.env.CONTEXT && process.env.CONTEXT !== "production"
    ? process.env.DEPLOY_PRIME_URL
    : null;

const siteUrl =
  deployPreviewUrl ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.URL ??
  "http://localhost:3000";

// Site-wide defaults. Every route that does not set its own falls back to these,
// which currently means /work and /design-system.
//
// The description used to read "Coming soon", left over from the placeholder
// homepage that was deleted several commits ago. It was still the default every
// non-landing route inherited.
const SITE_DESCRIPTION = "Brand and web design studio.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "Kalos",
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "Kalos",
    description: SITE_DESCRIPTION,
    siteName: "Kalos",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kalos",
    description: SITE_DESCRIPTION,
  },
};

// Obsidian Black, matching the `html, body` ground in globals.css. It was
// #000000, which left the browser chrome a slightly different black from the
// page meeting it at the top of the screen — visible on an OLED phone, which is
// the only place this property does anything.
export const viewport = {
  themeColor: "#040406",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className={spaceGrotesk.className}>
        {children}
        {/* Dev only, and it comes out before launch. It is here rather than on
            the landing page because the sunrise and the ground it switches are
            reachable from more than one route — /about runs the same sand — and
            because a deploy preview opened on any page should be able to change
            them without navigating home first. See (landing)/variant-switch.js. */}
        <VariantSwitch />
      </body>
    </html>
  );
}
