# Client logos for the homepage proof strip

Drop a file here named after the client, lowercase and hyphenated:

    shell-tapup.svg      allganize.svg      mara.svg      echocare.svg

Then point the matching entry in `app/(landing)/content.js` at it:

    { slug: "allganize", name: "Allganize", logo: "/home/logos/allganize.svg" }

A client with `logo: null` renders its name in the brand typeface instead, so a
half-supplied strip still looks deliberate rather than broken.

**SVG, on a transparent background.** The strip renders every logo in one
monochrome weight so the row reads as evidence rather than as a row of competing
brand colours, and it does that with `filter: brightness(0) invert(1)`, which
turns every opaque pixel white. A logo supplied on a white rectangle becomes a
white rectangle. PNG works if the background is genuinely transparent, but SVG
scales and weighs less.

Names must match the `slug` values in `app/(landing)/content.js`.
