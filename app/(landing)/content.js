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
  // The one small label on the page, and it is a line of copy rather than a
  // section tag. Set like the deck's running head, which is the only small text
  // the brand file actually contains.
  eyebrow: "Trusted by teams who ship",
  // Rendered as logos when we have clean files, and as the brand typeface
  // otherwise. Names stay accurate either way.
  clients: ["Shell", "MARA", "Allganize", "EchoCare"],
};

// Close to verbatim from the brand kit. This is the strongest writing we have
// and rewriting it would be vandalism. Only the em dashes came out.
//
// No `kicker`. The brand file has no eyebrow-above-heading pattern at all: its
// section labels are single words set at 160px, and its only small text is the
// running head at the top of a slide. A 16px tag over every headline was
// invented, and it is the thing that made the page read as generic.
//
// Rendered in the same section as `mission` below. They were two sections and
// they were saying one thing: here is what we believe. Splitting a single idea
// across two full screens is what made the page feel long.
export const story = {
  // Laid out as the dictionary entry node 206:165 makes of it: the Greek word at
  // display size, the grammatical labels in gold, then the definition. The word
  // is the studio's whole argument, so it should be the largest thing in the
  // section rather than a mention inside a paragraph.
  //
  // The *treatment* is from 206:165. The *words* are not, and that distinction
  // cost us. 206:165 sits in the superseded column of the brand file — the copy
  // of the deck still set in Host Grotesk, page numbers unpadded — and the
  // definition it carries ("deepens beauty and lifts your spirits, adding a
  // touch of magic…") is copy the studio has since thrown out. It shipped here
  // for a while. The live About slide (194:10423, page 04) has no dictionary
  // entry at all and defines the word plainly; that wording is what is below.
  //
  // Anything else sourced from a 206:* node deserves the same check.
  word: "καλός",
  labels: ["[adj]", "[Greek]"],
  definition:
    "Beautiful, good, and well-made all at once, with no line drawn between them.",
  heading: "Beautiful because it is made well.",
  // Opens on "the ancient idea" rather than re-introducing the word, because the
  // entry above has just defined it. Previously both did, twenty words apart,
  // and the entry was giving the definition the file had dropped while the
  // paragraph gave the one it kept — the section argued with itself.
  body: "The ancient idea was that a thing was beautiful because it was made well, not in addition to it. That belief is the whole studio. When something looks right but works wrong, we do not call it finished. We call it broken.",
};

export const offering = {
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
//
// These render inside the offering section rather than as a section of their
// own. Alone they had no headline and read as four orphaned claims; under "one
// team, from identity to launch" they are the evidence for it.
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
//
// The heading is gone and the body now closes the story section. It was a
// standalone screen carrying 49 words, and the concrete half of it (small team,
// senior hands, no handoff) is the part a buyer can actually use.
export const mission = {
  body: "We build work that has to hold up in the real world, for teams who need it to be both beautiful and true. Small team, senior hands, and no handoff between the people who design and the people who build.",
};

export const process = {
  heading: "How it works",
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
