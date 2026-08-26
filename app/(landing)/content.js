// Every string on the landing page, so the page is one file to edit for wording
// and the markup stays about structure.
//
// All of it is the brand wireframe's copy verbatim
// (Figma node 396:9876), confirmed as the shipping copy rather than placeholder.
// No em dashes anywhere: a brand preference that applies to every line that
// ships, and nothing enforces it automatically here.

// The line above the first call to action. Right-aligned against the same edge
// the work rail uses, which is what ties the two sides of the page together.
export const positioning =
  "Companies turn to us to build presence and get recognized.";

// The name means something, and the page opens by saying what. `term` is set
// larger than the definition under it, the way a dictionary entry is.
export const definition = {
  term: "καλός • adjective",
  detail:
    "An ancient Greek concept to signify beauty, excellence, praiseworthiness, and nobility",
};

// The label over the pill rail.
export const workLabel = "Our Work";

export const closer = "Let’s connect.";

// One primary action, in two places: top right, and at the foot of the page.
// The wireframe draws them differently on purpose — the top one is filled and
// the bottom one is outlined — so the label is shared and the treatment is not.
export const cta = "Book a call";

// Cal.com. `link` is the public booking path, so the button can point at
// https://cal.com/<link> as a real href and still work if the embed never
// loads. `namespace` scopes the embed's config to this one event type, which
// matters the moment a second booking type exists.
export const booking = {
  namespace: "intro",
  link: "kalos/intro",
};
