import { Space_Grotesk } from "next/font/google";
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
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.URL ?? "http://localhost:3000";

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

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className={spaceGrotesk.className}>{children}</body>
    </html>
  );
}
