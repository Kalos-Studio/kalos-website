import { Space_Grotesk } from "next/font/google";
import { Agentation } from "agentation";
import "./globals.css";

// Space Grotesk everywhere, replacing Inter. It is the geometric sans the brand
// wireframes are set in, and the site is small enough that one family covers all
// of it -- there is no second face to pair it with.
//
// Self-hosted by next/font at build time rather than fetched from Google at
// runtime: no third-party request on first paint, and no layout shift waiting on
// it. Loaded as a variable font so weights 300-700 are all available from the
// one file.
//
// Exposed as a CSS variable rather than a class because globals.css builds
// `--font-sans` out of it in @theme. That makes it the family Tailwind's
// preflight applies to everything, so no element needs a `font-sans` class and
// there is one place to change the face.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

// og:image has to be an absolute URL or iMessage and friends can't resolve it,
// which is the only reason metadataBase is set at all.
//
// Netlify exposes the deploy's own address as URL at build time, so this needs
// no configuration: previews get their own URL and production gets the site's.
// A NEXT_PUBLIC_SITE_URL override and a .env.example documenting it used to sit
// here; both went, because a landing page should not need environment setup to
// build. When there is a custom domain and the pretty one matters on the share
// card, hardcode it below rather than reintroducing an env var.
const siteUrl = process.env.URL ?? "http://localhost:3000";

// The site's one-line description, shared by the page metadata, the share card
// and Twitter. It is the landing page's own positioning line, so the card says
// what the page says rather than something written separately and left to rot.
const SITE_DESCRIPTION =
  "Companies turn to us to build presence and get recognized.";

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
  // Declared here rather than as an `app/icon.*` file convention, because the
  // convention emits a single unconditional <link> and there is no way to hang
  // a media query off it -- which is exactly what the light/dark pair needs.
  // The old app/icon.png (a placeholder "K") went with it.
  //
  // Order matters: browsers walk the list and keep the last one they can use,
  // so the PNG goes first as the floor and the SVGs override it wherever
  // they're supported. The PNG only ever reaches pre-17 Safari and the odd feed
  // reader; it carries the dark mark, since those surfaces are overwhelmingly
  // light. Every one of these is transparent -- the mark never ships a ground.
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      {
        url: "/icon-light.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    // Declaring `icons` at all switches off Next's `app/apple-icon.*`
    // convention -- the link simply stops being emitted -- so the apple touch
    // icon moved to public/ and is listed here too.
    //
    // iOS home-screen icons are one fixed image with no dark variant, and iOS
    // flattens their transparency to black. So this one is the white mark:
    // transparent like the rest, but the colour that survives that flattening.
    // The black mark here would render invisible.
    apple: { url: "/apple-icon.png", sizes: "180x180" },
  },
};

// The browser chrome colour on mobile. White, because the landing page is the
// page people arrive on and it is a light surface -- this was black for the
// spotlight hero, which no longer exists.
export const viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }) {
  return (
    // The document is the scroll container, so scroll snapping is declared
    // here rather than on a wrapper. `snap-y snap-mandatory` makes every
    // element that opts in with a snap-* alignment a stop; anything that does
    // not opt in is scrolled past normally.
    //
    // proximity, not mandatory: mandatory never lets the page rest between two
    // snap points, so the hero's handover to the masthead could only ever be
    // glimpsed during a snap glide. Proximity still stops on each case study
    // while leaving the hero free to be scrolled through.
    //
    // scroll-smooth is for the pill rail: clicking one jumps to its case study,
    // and an instant jump reads as a page change rather than a move within the
    // page. globals.css turns it off under prefers-reduced-motion.
    <html
      lang="en"
      className={`${spaceGrotesk.variable} snap-y snap-proximity scroll-smooth`}
    >
      {/* The base ground, on utilities rather than an unlayered `html, body`
          rule in globals.css -- see the note at the foot of that file. Light by
          default because the landing page is the site's front door; /work
          paints its own dark surface over this.

          Plain white/black on purpose: the page is being built in black and
          white first, and moves onto the brand palette (Obsidian Black, Snow
          White) once the layout is settled. */}
      <body className="bg-white text-black antialiased">
        {children}
        {/* The Agentation annotation toolbar: click anything on the page, type
            a note, and it syncs to the coding agent. Development only -- the
            NODE_ENV check is what keeps it out of the production bundle, since
            Next statically replaces the expression and the dead branch is
            dropped, import and all.

            Ships "use client" itself, so it can sit in this server layout
            without turning the document into a client component. Rendered after
            children so its fixed overlay stacks above the page without needing
            a z-index fight. */}
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
