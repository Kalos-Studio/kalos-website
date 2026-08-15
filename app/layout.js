import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// The brand face, confirmed off the guidelines deck rather than guessed. It is
// loaded here but deliberately NOT set as the body font yet: /work and
// /coming-soon were composed against Inter, and swapping the face under them
// would move every line of those pages. New surfaces opt in with `font-display`
// (the token in globals.css), and flipping the site over is its own decision.
//
// The variable goes on <html> rather than <body> so the @theme token can
// reference it: a custom property declared on body isn't resolvable from :root,
// where Tailwind puts the theme.
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
