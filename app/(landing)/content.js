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
export const PRICE_ANCHOR = null; // TODO(owner): e.g. "$12k". Never a range.
export const TIMELINE_RANGE = null; // TODO(owner): e.g. "six to eight"

// Cal.com. `link` is the public booking path, so the call to action can point at
// https://cal.com/<link> as a real href and still work if the embed never loads.
// `namespace` scopes the embed's config to this one event type, which matters
// the moment a second booking type exists.
export const booking = {
  namespace: "intro",
  link: "kalos/intro",
};

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
  // One primary action and no competing buttons, per the brief. The destination
  // lives in `booking` above.
};

export const proof = {
  // The one small label on the page, and it is a line of copy rather than a
  // section tag. Set like the deck's running head, which is the only small text
  // the brand file actually contains.
  eyebrow: "Trusted by teams who ship",
  // Set `logo` to a path under /public and that client renders as artwork;
  // leave it off and the name renders in the brand typeface instead. Mixed is
  // fine, which matters because the logos are arriving a few at a time.
  //
  // This started as a filesystem lookup so that dropping a file in was the only
  // step, which is nicer and does not survive the bundler: `process.cwd` is not
  // a function in the context Next prerenders server components in, and it
  // fails the build with an error about collecting route configuration. One
  // explicit line is worth more than that cleverness.
  //
  // Requirements for the file are in public/home/logos/README.md. The short
  // version: SVG, transparent background, or the monochrome treatment turns it
  // into a white rectangle.
  clients: [
    { slug: "shell-tapup", name: "Shell", logo: "/home/logos/shell-tapup.webp" },
    {
      slug: "priority-ambulance-transfer",
      name: "Priority Ambulance Transfer",
      logo: "/home/logos/priority-ambulance-transfer.svg",
    },
    { slug: "allganize", name: "Allganize", logo: "/home/logos/allganize.webp" },
    { slug: "mara", name: "MARA", logo: "/home/logos/mara.webp" },
    // Composed rather than supplied. echoambulance.com publishes the mark on its
    // own with no wordmark anywhere on the site, so the name is set beside it in
    // Space Grotesk. Worth knowing it is our lettering, not their lockup, if
    // EchoCare ever sends a real one.
    { slug: "echocare", name: "EchoCare", logo: "/home/logos/echocare.webp" },
  ],
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
  // Laid out as the dictionary entry the brand file makes of it (node 206:165):
  // the Greek word at display size, the grammatical labels in gold, then the
  // definition. The word is the studio's whole argument, so it should be the
  // largest thing in the section rather than a mention inside a paragraph.
  word: "καλός",
  labels: ["[adj]", "[Greek]"],
  definition:
    "A word that deepens beauty and lifts your spirits, adding a touch of magic that brightens your world and puts a spring in your step.",
  heading: "Beautiful because it is made well.",
  body: "Our name comes from the Greek καλός, a word that meant beautiful, good, and well-made all at once, with no line drawn between them. A thing was beautiful because it was made well, not in addition to it. That belief is the whole studio. When something looks right but works wrong, we do not call it finished. We call it broken.",
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
    // Both halves matter. The Care Plan is the recurring revenue, but saying out
    // loud that a clean handoff is on the table is what stops the question
    // behind this one, which is whether choosing Kalos means being stuck with
    // Kalos. Answering it here is cheaper than answering it on the call.
    q: "What happens after launch?",
    a: "Your choice. We can keep it on a Care Plan that covers hosting, updates and small changes, or hand the whole thing over to your team with everything they need to run it.",
  },
];

export const finalCta = {
  heading: "Let's build something made well.",
};

// Two titles on purpose.
//
// `title` is the <title> element, which is the browser tab, the bookmark and the
// window. It is one word because that is what a tab should be: at tab width
// anything longer truncates to "Kalos, Brand and..." and reads as clutter.
//
// `shareTitle` is what goes on a link preview, where there is room for a line
// and the reader has no other context for what Kalos is. Search engines weigh
// the <title> most heavily, so the short one does cost something there; the
// description below is carrying that weight instead.
export const meta = {
  title: "Kalos",
  shareTitle: "Kalos, Brand and Web Design Studio",
  description:
    "We design and build brand identities and websites for teams who need both done properly. Beautiful because it is made well.",
};
