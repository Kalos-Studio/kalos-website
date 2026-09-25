// Every string on the landing page, so the page is one file to edit for wording
// and the markup stays about structure.
//
// All of it is the brand wireframe's copy verbatim
// (Figma node 396:9876), confirmed as the shipping copy rather than placeholder.
// No em dashes anywhere: a brand preference that applies to every line that
// ships, and nothing enforces it automatically here.

// The hero's one line, under the mark and over the call to action.
export const positioning =
  "Companies turn to us to build presence and get recognized.";

export const closer = "Let’s connect.";

// One primary action, in two places: under the hero line and under the closer.
export const cta = "Book a call";

// Cal.com. `link` is the public booking path, so the button can point at
// https://cal.com/<link> as a real href and still work if the embed never
// loads. `namespace` scopes the embed's config to this one event type, which
// matters the moment a second booking type exists.
export const booking = {
  namespace: "intro",
  link: "kalos/intro",
};
