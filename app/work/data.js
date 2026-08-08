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
//   year: "2026",              // optional — shown on the card and case study
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
//   body: [                    // optional — the content blocks on the case
//                               // study page, rendered top to bottom
//     { type: "paragraph", text: "..." },
//     { type: "heading", text: "..." },
//     { type: "image", src: "/work/kebab-case-id/detail-1.jpg", alt: "...", caption: "..." },
//     { type: "list", items: ["...", "..."] },
//     { type: "link", href: "https://example.com", text: "See more case studies" },
//   ],
// }

// Shared destination for "see more case studies" links — used both inline in
// individual case study bodies and at the bottom of the /work listing page.
export const MORE_CASE_STUDIES_URL = "https://saadmirza.framer.website/works";

export const caseStudies = [
  {
    slug: "shell-tapup",
    title: "Shell TapUp",
    summary: "Native iOS and Android app design for Shell's global refueling service.",
    year: "2022",
    client: "Shell",
    role: "Mobile App Design & Development",
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
        text: "Product Definition",
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
        text: "Product Design",
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
    year: "2024",
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
      {
        type: "link",
        href: MORE_CASE_STUDIES_URL,
        text: "See more case studies",
      },
    ],
  },
  {
    slug: "visual-systems-and-scaling",
    title: "Visual Systems and Scaling",
    summary: "Catered brand kits for many... brands.",
    year: "2024-26",
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
      {
        type: "link",
        href: MORE_CASE_STUDIES_URL,
        text: "See more case studies",
      },
    ],
  },
];
