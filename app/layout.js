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
});

// og:image has to be an absolute URL or iMessage and friends can't resolve it.
// Netlify exposes the production site URL as URL at build time; NEXT_PUBLIC_SITE_URL
// overrides it once there's a custom domain.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.URL ?? "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "Kalos",
  description: "Coming soon",
  openGraph: {
    title: "Kalos",
    description: "Coming soon",
    siteName: "Kalos",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kalos",
    description: "Coming soon",
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
