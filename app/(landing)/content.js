// All landing page copy, in one place.
//
// Same reasoning as app/work/data.js: copy changes far more often than layout,
// and it should never require opening JSX to make a wording edit. The page
// reads from here and does no writing of its own.
//
// HARD RULE: no em dashes, anywhere in this file's strings. It is a brand and
// owner preference and it applies to every line that ships. `bun run
// lint:copy` enforces it, because a style rule policed only by attention gets
// broken on a busy day. Use periods, commas, colons or parentheses.

// Owner-supplied values that do not exist yet. Kept as named constants so the
// placeholders are impossible to miss in a review and become real in one edit.
export const BOOKING_URL = null; // TODO(owner): scheduling link
export const PRICE_ANCHOR = null; // TODO(owner): e.g. "$12k". Never a range.
export const TIMELINE_RANGE = null; // TODO(owner): e.g. "six to eight"

// Two hero directions, both written to the same brief. `active` picks which one
// renders. Kept side by side rather than in git history so they can be compared
// on the deploy preview by changing one word.
//
// A: the claim, short. Owner's pick. It is deliberately not a value
//    proposition, so the subheading has to carry the concrete offer on its own.
//    Watch this one on the preview: an abstract line is the most likely thing on
//    the page to read as mood rather than meaning to a cold visitor, which is
//    exactly the reader it exists for.
// B: direct. Says what we sell in one line. Safer, less memorable.
export const heroes = {
  active: "A",

  A: {
    h1: "Good work deserves to look like it.",
    sub: "We design your brand and build your site as one piece of work, so what people see matches what you actually do.",
  },

  B: {
    h1: "Your brand and your website, built by one team.",
    sub: "Identity first, then a custom site designed and developed end to end. You show up credible, and the people who visit act.",
  },
};

export const cta = {
  label: "Book a Call",
  // Every call to action on the page points here. One primary action, no
  // competing buttons, per the brief.
  href: BOOKING_URL,
};

export const proof = {
  eyebrow: "Trusted by teams who ship",
  // Rendered as logos when we have clean files, and as the brand typeface
  // otherwise. Names stay accurate either way.
  clients: ["Shell", "MARA", "Allganize", "EchoCare"],
};

// Close to verbatim from the brand kit. This is the strongest writing we have
// and rewriting it would be vandalism. Only the em dashes came out.
export const story = {
  kicker: "Why Kalos",
  heading: "Beautiful because it is made well.",
  body: "Our name comes from the Greek καλός, a word that meant beautiful, good, and well-made all at once, with no line drawn between them. A thing was beautiful because it was made well, not in addition to it. That belief is the whole studio. When something looks right but works wrong, we do not call it finished. We call it broken.",
};

export const offering = {
  kicker: "The work",
  heading: "One team, from identity to launch.",
  body: "Most teams stitch a brand together from one freelancer, a site from another, and hope the two match. We do both, so the brand and the build come from the same hands and actually fit. Brand identity first, then a fast, custom website designed and developed end to end.",
  // The secondary track. One line, never a co-equal headline, or it dilutes the
  // primary pitch to the audience that makes up most of the pipeline.
  secondary:
    "Building a product? We also design and develop the software teams run on.",
};

// Four of the five principles. Premium and timeless are carried by the voice
// rather than listed: in a grid of claims they read as table stakes and cost
// the other three their force.
export const values = [
  {
    title: "Structural",
    body: "We build on real foundations, not templates. Every decision holds up under weight.",
  },
  {
    title: "Lucid",
    body: "Clear at a glance, whether it is a first-time visitor or your own team. Clarity is the point.",
  },
  {
    title: "Bold",
    body: "Strong opinions and early prototypes. We would rather show you a real direction in week one than spend a month asking what you want.",
  },
  {
    title: "Made to ship",
    body: "We measure the work by one thing: what actually launches and stands up in the world.",
  },
];

// Three on the homepage, full set stays on /work. Slugs match app/work/data.js,
// so covers and links come from there rather than being duplicated here.
export const featuredWork = {
  heading: "Recent work",
  slugs: [
    "priority-ambulance-transfer",
    "allganize-website-redesign",
    "shell-tapup",
  ],
  // Homepage framing, written to sell rather than to document. The case study
  // pages keep their own summaries.
  blurbs: {
    "priority-ambulance-transfer":
      "A brand built from zero, then a Next.js site and the full collateral around it. One identity across the fleet, the site, and every facility it touches.",
    "allganize-website-redesign":
      "Restructured, redesigned and shipped the website for an enterprise AI suite. Designed and built by the same team, with no handoff in the middle.",
    "shell-tapup":
      "Native iOS and Android apps for Shell's global refueling service, replacing error-prone manual steps with a guided one.",
  },
};

// Rewritten off the brand kit's "complex organizations", which aims at a buyer
// the pipeline does not actually contain. The premium voice survives; the
// enterprise-only implication that would put off a nonprofit or a local firm
// does not.
export const mission = {
  heading: "Great design and flawless execution are not competing goals.",
  body: "We build work that has to hold up in the real world, for teams who need it to be both beautiful and true. Small team, senior hands, and no handoff between the people who design and the people who build.",
};

export const process = {
  kicker: "Process",
  steps: [
    {
      title: "Book a call",
      body: "We learn what you are building and where you are stuck.",
    },
    {
      title: "We scope it",
      body: "One clear plan, fixed and agreed upfront.",
    },
    {
      title: "We design",
      body: "Real directions early, not a month of questions.",
    },
    {
      title: "We build and launch",
      body: "Shipped, responsive, and yours.",
    },
  ],
};

// `pending` marks an answer that depends on an owner input. The page renders
// those questions only once the constant above is filled, rather than shipping
// a visible TODO or an invented number.
export const faq = [
  {
    q: "Do you do brand without the website, or the other way around?",
    a: "Our best work is both together, but we scope to what you need.",
  },
  {
    q: "How much does it cost?",
    // "Starting at" only. Never a range, per the brief.
    a: PRICE_ANCHOR
      ? `Projects start at ${PRICE_ANCHOR}. You get a fixed number after the call.`
      : null,
    pending: "PRICE_ANCHOR",
  },
  {
    q: "How long does it take?",
    a: TIMELINE_RANGE
      ? `Most brand and web projects run ${TIMELINE_RANGE} weeks.`
      : null,
    pending: "TIMELINE_RANGE",
  },
  {
    q: "What happens after launch?",
    a: "We offer a Care Plan that keeps the site fast, current, and handled.",
  },
];

export const finalCta = {
  heading: "Let's build something made well.",
};

export const meta = {
  title: "Kalos, Brand and Web Design Studio",
  description:
    "We design and build brand identities and websites for teams who need both done properly. Beautiful because it is made well.",
};
