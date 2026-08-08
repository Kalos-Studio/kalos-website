// Standard format for a case study. Add one entry per project to the
// `caseStudies` array below — that's the only file you need to touch to add,
// reorder, or remove a project from /work.
//
// {
//   slug: "kebab-case-id",     // required, unique — becomes the URL /work/<slug>
//   title: "Project Title",    // required
//   summary: "One line describing the project.", // required — shown on the
//                                                  // listing card and at the
//                                                  // top of the case study
//   year: "2026",              // optional — not currently displayed anywhere,
//                               // kept for reference/future use
//   client: "Client name",     // optional — shown as a fact on the case study
//   role: "What we did",       // optional — shown as a fact on the case study
//   cover: {                   // optional — omit to show a placeholder
//     src: "/work/kebab-case-id/cover.jpg", // put images in /public/work/<slug>/
//     alt: "Description of the cover image for screen readers",
//     heroPosition: "center",  // optional CSS object-position, e.g. "bottom" —
//                               // the case study's hero crops to a wider box
//                               // than the listing card, so a screenshot with
//                               // important content near the top (like a nav
//                               // bar) may need to anchor lower to avoid
//                               // slicing through it. Card crop is unaffected.
//   },
//   bodyLayout: "columns",     // optional — lays the body out as label +
//                               // content rows (each heading pinned to the
//                               // left of the paragraphs/images that follow
//                               // it) instead of one full-width column.
//                               // Images inside a row still span full width.
//   body: [                    // optional — the content blocks on the case
//                               // study page, rendered top to bottom
//     { type: "paragraph", text: "..." },
//     { type: "heading", text: "..." },       // a single standalone heading
//     { type: "section", kicker: "...", heading: "..." }, // a small-caps label
//                               // above a bolder headline — use this instead
//                               // of two "heading" blocks in a row, which
//                               // render identically and read as flat
//     { type: "image", src: "/work/kebab-case-id/detail-1.jpg", alt: "...", caption: "..." },
//     { type: "list", items: ["...", "..."] },
//   ],
// }

// Shared metadata bits — every /work page is noindex'd and follows the same
// "<title> — Kalos" convention, so this stays in one place instead of being
// re-typed at each page's export const metadata / generateMetadata.
export const WORK_ROBOTS = { index: false, follow: false };

export function workPageTitle(title) {
  return `${title} — Kalos`;
}

export const caseStudies = [
  {
    slug: "shell-tapup",
    title: "Shell TapUp",
    summary: "Native iOS and Android app design for Shell's global refueling service.",
    client: "Shell",
    role: "Mobile App Design & Development",
    bodyLayout: "columns",
    cover: {
      src: "/work/shell-tapup/cover.jpg",
      alt: "A Shell TapUp driver app screenshot, showing tank levels and fueling controls, composited over a photo of the Shell pecten logo at a refueling station",
    },
    body: [
      {
        type: "heading",
        text: "Client Need",
      },
      {
        type: "paragraph",
        text: "Shell was seeing inconsistencies across its business customer refueling service leading to significant human errors, data issues, and inefficient fueling time per vehicle. The Shell team wanted to see if they could design a better tool and experience.",
      },
      {
        type: "heading",
        text: "Driven by Understanding",
      },
      {
        type: "paragraph",
        text: "Through driver interviews, working sessions, and on-site visits, we developed a deep understanding of Shell's fuel delivery ecosystem.",
      },
      {
        type: "heading",
        text: "Innovation in Motion",
      },
      {
        type: "paragraph",
        text: "Our design work centered on translating these insights into an iOS and Android app experience, aligning with Shell's goals to revolutionize the fuel delivery experience through design innovation and user-centric functionality.",
      },
      {
        type: "heading",
        text: "The Result",
      },
      {
        type: "paragraph",
        text: "Native, global iOS and Android mobile applications were designed to bring clarity and consistency to the refueling process for Shell TapUp drivers and their customers, replacing error-prone manual steps with a guided, purpose-built experience.",
      },
      {
        type: "paragraph",
        text: "The driver-focused solution provides fuel delivery drivers a singular tool to manage orders, remotely operate pumps, and easily submit invoices in a turn-key experience.",
      },
      {
        type: "image",
        src: "/work/shell-tapup/streamlined-fuel-management.jpg",
        alt: "Streamlined Fuel Management: Shell TapUp login, fueling, wetstock history, and fuel truck screens",
      },
    ],
  },
  {
    slug: "allganize-website-redesign",
    title: "Allganize Website Redesign",
    summary: "Pushing the future of workforce AI further.",
    client: "Allganize",
    role: "Development, Web Design",
    cover: {
      src: "/work/allganize-website-redesign/cover.webp",
      alt: "The Allganize homepage hero, \"The All-In-One LLM Enabler For Enterprise,\" shown on a laptop screen",
    },
    body: [
      {
        type: "paragraph",
        text: "Allganize's website needed a modern refresh to better showcase its AI innovation and stand out from competitors. The outdated design lacked clarity and a distinct identity, so the goal was to create a cleaner, more engaging experience that strengthened the brand and clearly communicated its value.",
      },
      {
        type: "image",
        src: "/work/allganize-website-redesign/detail-1.webp",
        alt: "The Allganize homepage's Alli App Builder section, \"AI-Powered Business Automation,\" showing a no-code workflow canvas",
      },
      {
        type: "image",
        src: "/work/allganize-website-redesign/detail-2.webp",
        alt: "The Allganize homepage's \"Build LLM Enabled AI Apps\" section, showing a skill-builder workflow canvas in the Alli Suite",
      },
      {
        type: "paragraph",
        text: "Giving Allganize a fresh new look going into 2024.",
      },
    ],
  },
  {
    slug: "mara-partner-brand-kits",
    title: "MARA Partner Brand Kits",
    summary: "Catered brand kits for many... brands.",
    client: "MARA",
    role: "Brand Strategy, Brand Identity, Brand Guidelines, Art Direction",
    cover: {
      src: "/work/visual-systems-and-scaling/cover.jpg",
      alt: "A tiled wall of brand deliverables across many different companies and products",
    },
    body: [
      {
        type: "paragraph",
        text: "Led the end-to-end strategy and creation of multiple scalable brand identity systems for both internal organizations and external partner companies under the MARA umbrella.",
      },
      {
        type: "paragraph",
        text: "Took full ownership of the long-term maintenance and governance of these systems, establishing robust documentation and design guidelines to ensure cross-platform visual consistency.",
      },
      {
        type: "paragraph",
        text: "By actively auditing and optimizing component repositories, successfully streamlined cross-functional workflows, minimized design debt, and accelerated product delivery timelines.",
      },
      {
        type: "image",
        src: "/work/visual-systems-and-scaling/anduro-kit.jpg",
        alt: "The closing slide of the Anduro brand kit",
        caption: "Anduro",
      },
      {
        type: "image",
        src: "/work/visual-systems-and-scaling/mara-slipstream-kit.jpg",
        alt: "The closing slide of the MARA Slipstream brand kit",
        caption: "MARA Slipstream",
      },
      {
        type: "image",
        src: "/work/visual-systems-and-scaling/2pic-kit.jpg",
        alt: "The closing slide of the 2PIC by MARA brand kit",
        caption: "2PIC by MARA",
      },
    ],
  },
  {
    slug: "echocare",
    title: "EchoCare",
    summary:
      "B2B SaaS dispatch platform for emergency medical services and non-emergent medical transport operations.",
    client: "EchoCare",
    role: "Head of Design",
    bodyLayout: "columns",
    cover: {
      src: "/work/echocare/cover.jpg",
      alt: "The EchoCare login screen, \"The help you need, when you need it,\" with an animated network of service icons",
    },
    body: [
      {
        type: "heading",
        text: "The Work",
      },
      {
        type: "paragraph",
        text: "Led product design across the core dispatch platform — scheduling, fleet and unit management, trip lifecycle flows, and billing and insurance workflows.",
      },
      {
        type: "paragraph",
        text: "Designed complex operational interfaces for time-sensitive decision-making, including dispatch board interactions, conflict resolution, and multi-path state changes.",
      },
      {
        type: "image",
        src: "/work/echocare/dispatch-board.jpg",
        alt: "The EchoCare dispatch board, showing a live timeline of units, trips, and delay states across a service area",
        caption: "The dispatch board — live scheduling across every unit and trip.",
      },
      {
        type: "image",
        src: "/work/echocare/trip-tracking.jpg",
        alt: "An EchoCare trip detail view with live GPS tracking, route, and a dispatch tracking timeline",
        caption: "Live GPS tracking and trip lifecycle detail.",
      },
      {
        type: "heading",
        text: "Delivering Scalability",
      },
      {
        type: "paragraph",
        text: "Built and maintained the product design system in Figma, extending it into documented standards for engineering handoff.",
      },
      {
        type: "paragraph",
        text: "Partnered with product and engineering to translate operational requirements into shippable interface patterns, and to validate marketing and product claims against what the platform actually delivers.",
      },
    ],
  },
  {
    slug: "priority-ambulance-transfer",
    title: "Priority Ambulance Transfer",
    summary:
      "Texas-based medical transport company providing ambulance and wheelchair transport across the greater Houston area and beyond.",
    client: "Priority Ambulance Transfer",
    role: "Head of Design",
    cover: {
      src: "/work/priority-ambulance-transfer/cover.jpg",
      alt: "The Priority Ambulance Transfer homepage hero, \"When every minute matters, we're already moving.\"",
    },
    body: [
      {
        type: "heading",
        text: "The Work",
      },
      {
        type: "list",
        items: [
          "Created the company's entire brand identity from the ground up — logo and wordmark, color system, typography, and the visual language applied consistently across every touchpoint.",
          "Designed the vehicle wraps for the ambulance fleet, translating the identity onto the company's most visible physical asset.",
          "Authored the brand and content strategy, defining positioning pillars, target verticals, audience segmentation, and a phased rollout plan.",
          "Designed and built the marketing website end to end in Next.js and Tailwind, including responsive architecture, technical SEO, and production deployment.",
          "Produced the full print and digital collateral suite — employee credentialing, facility-facing sales materials, service overviews, and branded stationery.",
        ],
      },
      {
        type: "image",
        src: "/work/priority-ambulance-transfer/services-page.jpg",
        alt: "The Priority Ambulance Transfer services page, showing the ambulance transport hero and a carousel of service types with photography of EMTs and patients",
        caption: "The services page — priorityat.com/services/ambulance.",
      },
    ],
  },
];
