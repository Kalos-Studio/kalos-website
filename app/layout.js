import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
