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
// Cal.com. `link` is the public booking path, so the call to action can point at
// https://cal.com/<link> as a real href and still work if the embed never loads.
// `namespace` scopes the embed's config to this one event type, which matters
// the moment a second booking type exists.
export const booking = {
  namespace: "intro",
  link: "kalos/intro",
};

export const cta = {
  label: "Book a Call",
  // One primary action and no competing buttons, per the brief. The destination
  // lives in `booking` above.
};

// The hero's menu, top right. The site has no navigation anywhere else, so this
// is it: the work first, who we are second, how to reach us last.
//
// Contact's href is the real Cal.com page and its click opens the booking modal,
// the same one the homepage's button opens. It went out as a plain link first,
// on the reading that cta.js's one-primary-action rule forbade a second thing
// that books a call. That was the wrong reading: the rule is about not growing a
// second competing button, and a nav item opening the same modal is the same
// action reached from the menu, not a rival to it. The href stays because it is
// the fallback when the embed is blocked or still loading. See cal.js.
export const menu = {
  // Sits to the right of the dots once the card opens. Sentence case, because
  // it is a label on a control rather than a heading.
  label: "Menu",
  // What the button says to a screen reader, which cannot see four dots move.
  a11yOpen: "Open menu",
  a11yClose: "Close menu",
  links: [
    { label: "Work", href: "/work" },
    { label: "About", href: "/about" },
    { label: "Contact", href: `https://cal.com/${booking.link}`, external: true },
  ],
};

// The dictionary entry. It renders on /about now rather than on the homepage,
// where it was the first section under the hero; the copy stays here because
// this file is where the site's copy lives, not because of which page reads it.
//
// This section used to carry a heading and two paragraphs after the definition,
// and before it there was a proof strip, an offer section and four principles
// between the hero and here. All of that is gone, on the instruction to remove
// anything the web mock does not contain. Worth knowing what it cost, because it
// was not nothing: the reasoning for those sections is in git and it was good
// reasoning about a cold reader who does not yet know what we sell. The mock
// answers that differently, by saying less and showing the work sooner.
//
// The definition is the mock's own sentence rather than the brand file's. The
// file's About slide (194:10423) defines the word; this one defines the studio,
// which is what a homepage is for.
export const story = {
  // Set as the mock sets it: the Latin wordmark, a slash, then the Greek in
  // gold, all on one line at display size.
  latin: "Kalos",
  word: "\u03ba\u03b1\u03bb\u03cc\u03c2",
  definition:
    "Guided by the idea that beauty requires craftsmanship, we prototype fast and measure success by what ships.",
};

// Three of the seven on /work, and which three is a positioning decision rather
// than a technical one. This was the mock's set (Shell, EchoCare, MARA), which
// itself replaced Priority, Allganize, Shell. Shell came out for the H-E-B work
// on the owner's call.
//
// `logo` is what goes where a title would. The mock puts a client lockup at the
// top of each row rather than the project's name, which is a stronger claim: a
// reader recognises Shell before they read anything. All three files are already
// in the repo. Anything that is not gets a placeholder and a request, never a
// Figma export.
export const featuredWork = {
  // No heading. There was a "Work" h2 over these rows and it came out: three
  // client logos at the top of three full-width rows are already the label, and
  // a word above them was naming what the reader can see.

  // {count} is filled from caseStudies.length in page.js rather than typed here.
  // "See more" said neither what nor how much, and a number is the reason to
  // click: three rows read as the whole of it otherwise. Interpolated because a
  // hardcoded "six" went stale the day a seventh case study landed.
  more: "See all {count} projects",
  projects: [
    // Supplied by the owner, not exported from the Figma or lifted off the deck.
    // Cropped to the artwork's alpha bounds before it landed here: the file
    // arrived as a 512 square with the mark occupying 158px of that height, and
    // .ln-work-logo sizes by height, so uncropped it rendered at a third of the
    // weight of the two lockups beside it.
    { slug: "my-heb-app", logo: "/home/logos/my-heb-app.webp" },
    // The landing row shows the live tracking map rather than the case study's
    // own cover. featured() in page.js spreads the project over the study, so a
    // cover here replaces the study's outright and nothing else has to change.
    // Deliberately landing-only: /work and the case study hero still open on
    // cover.jpg, and this is the frame that reads at a glance in a wide row.
    {
      slug: "echocare",
      logo: "/home/logos/echocare.webp",
      cover: {
        src: "/work/echocare/trip-tracking.jpg",
        alt: "The EchoCare trip tracking view, with a dispatch timeline beside a live GPS map tracing an ambulance route between two hospitals",
      },
    },
    { slug: "mara", logo: "/home/logos/mara.webp" },
  ],
  // Homepage framing, written to sell rather than to document. The case study
  // pages keep their own summaries.
  blurbs: {
    // Says "design exploration" here because this is the one surface that did
    // not. The case study and the /work card both open on it, and the homepage
    // row set an H-E-B logo where Shell's and MARA's go, in the same treatment,
    // under a line that read as delivered work. The row is the strongest claim
    // the site makes about a project, so it is the last place the label should
    // be missing.
    "my-heb-app":
      "A design exploration for the largest grocery chain in Texas, where the shopping list becomes a route through the store and the total is already right by the time you reach the front.",
    echocare:
      "The dispatch platform an ambulance service runs on, designed for decisions made with a clock running and no undo.",
    mara:
      "The design function for an energy company's whole portfolio, from partner brand systems to the events that put them in front of governments.",
  },
};

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
