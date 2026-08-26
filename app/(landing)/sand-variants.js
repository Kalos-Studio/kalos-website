/**
 * Three grounds, so the sand can be judged against itself rather than against a
 * memory of the last build.
 *
 * A separate axis from the sunrise in sunrise-variants.js, deliberately. The two
 * are independent — any ground can run under any sunrise — and folding them into
 * one menu would mean nine entries to describe six decisions.
 *
 * `sandtop-dark` and `black-gold` share a generator and differ in three numbers.
 * The first is the plate rendered faithfully; the second is what the plate is a
 * photograph *of*. They are not the same brief and it took being told so to see
 * it: matching a photograph's statistics is not the same as building the
 * material in it, and this one matched on every measure while reading as
 * volcanic rock.
 *
 * `dune` is what has been on the page: generated off public/home/gold-sand.webp,
 * which is a warm plate with real dune structure (row means swinging 12 to 42 of
 * 255). `sandtop-dark` comes from `Sand_Top`, node 383:62 in the brand file,
 * which is a completely different surface and was measured rather than
 * eyeballed:
 *
 *   mean luminance   110 of 255, and neutral — R, G and B within one level
 *   p5 to p95        104 to 121. Seventeen levels. The plate is nearly flat.
 *   coarse structure ripples only, +/-7 levels once blurred. No dunes at all.
 *   direction        vertical gradient 1.99x the horizontal, so bands run across
 *   wavelength       ~210px at its native 2012px width, about five down the frame
 *   grain            sigma ~4 at pixel scale, and that is off a downscaled render
 *   specks           3,077 per million pixels, 92% warm, peaking near 2x ground
 *
 * Two of those took a second pass to get right, and both failures are the same
 * failure: measuring the plate without deciding what in it was being measured.
 *
 * The direction figure came out anywhere between 1.31 and 2.24 depending on the
 * blur radius, because the plate's grain is isotropic and dense enough to swamp
 * the ripple's contribution at a small radius, while a wide blur stops measuring
 * ripples at all. 1.99 is what it reads at a radius matched to its own ripple
 * period with the grain blurred off — and the only number that means anything is
 * one taken the same way on both sides, which is what compares this generator to
 * the plate rather than comparing two different questions.
 *
 * The wavelength was misread off a first pass as ten ripples down the frame; the
 * period is right and the frame is 783px tall in that render, not 1470.
 *
 * Two things in that list drive everything below. The plate has no coarse
 * structure worth the name, so the dune generator cannot be tuned into it — it
 * is a different model, not different numbers. And all of its warmth is in the
 * specks: the ground is dead neutral and only the sparkle is gold, which is the
 * opposite of how the dune field was built.
 *
 * A third ground was here and is not any more: `sandtop-lifted` put the field on
 * a mid-grey close to the plate's own tonality, and it was rejected on sight.
 * Worth keeping the one number that came out of building it, because it is what
 * any future attempt at a light ground runs into. Snow White survives the
 * plate's own #6e6e6e at 4.95:1; Dark Silver, the palette's one secondary-text
 * value, is 2.1:1 on it. Solving Dark Silver for 4.5:1 caps a neutral ground at
 * #4c4c4c — so a light page is a body-copy-colour decision before it is an art
 * direction one, and the grey is what blocks it, not the headlines.
 *
 * THIS IS A DEV TOOL AND IT SHOULD NOT SURVIVE LAUNCH. Delete this file, the
 * sand group in variant-switch.js, and inline whichever ground won into sand.js.
 */

export const SAND_VARIANTS = {
  dune: {
    label: "Dune (current)",
    note: "Generated off gold-sand.webp. Warm, near-black, real dunes.",
    model: "dune",
  },

  "sandtop-dark": {
    label: "Sand_Top, dark",
    note: "383:62's ripple, grain and sparkle, kept on the obsidian ground.",
    model: "ripple",

    // Neutral, and very dark. Neutral because the plate is (R=G=B within one
    // level) and because the only warm thing in it is the sparkle — see specks
    // below, which is where all the gold now comes from.
    ground: [15, 15, 16],

    // Relief in absolute levels, not as a fraction of the ground, and this is
    // the one number that could not be copied across.
    //
    // The plate's ripples are +/-7 on a ground of 110 — about 6%. Six percent of
    // a ground of 15 is one level, which is nothing: the field renders as flat
    // black and every measurement says it worked. Absolute amplitude is what
    // survives the move down, and at 9 on 15 the ripple is a far bigger relative
    // swing here than in the plate. That is the trade this variant is making.
    relief: 9,

    // The plate's own density, unscaled. It is 15x what the dune field carries
    // (210 per million) and that difference is most of why the two read as
    // different materials rather than as the same material at two exposures.
    speckDensity: 3080,
    // How far a fleck travels along the gold ramp in sand.js, 0 to 1. Low here
    // because this ground is trying to be the plate, and the plate's specks are
    // pale and warm rather than metallic.
    goldPeak: 0.4,

    // The brightest a grain gets above the bed, in levels. Additive and heavily
    // skewed, so the mean lift is about a fifth of this — sand.js drops the
    // ground by that mean so the two layers sum back to `ground`.
    //
    // Distinct from the page-wide film grain in landing.css, which sits over
    // everything including the mark. Leaning on that one for this left the bed
    // smooth between the flecks, which is half of why they read as stars.
    grainLevels: 22,
  },

  "black-gold": {
    label: "Black sand + gold",
    note: "Grain-forward, low relief, real gold. Less the plate, more the material.",
    model: "ripple",

    // Same ground and the same generator as sandtop-dark. Three numbers differ,
    // and they are the three that decide whether this reads as a particulate
    // material or as a lit solid.
    //
    // `relief` is less than half. A smooth shaded height field is the single
    // thing that made the first version read as volcanic rock — give it the
    // amplitude to be the subject and it is a rock surface with speckle on it,
    // however well the ripple statistics match the plate. Here the ripple is a
    // modulation across a bed of grains rather than the surface itself.
    //
    // `grainLevels` is half again as high, so the grains are what the eye lands
    // on first. That is the right way round for sand seen this close: you see
    // particles, and the ripples are a pattern in how they catch the light.
    //
    // `goldPeak` is the whole way up the ramp. "Black sand with gold in it"
    // means the gold is a defining feature of the material rather than a sparkle
    // budget to be spent carefully — at 0.4 it is a pale warm speck, and only
    // near 1 does it read as metal.
    ground: [15, 15, 16],
    relief: 4,
    grainLevels: 34,
    speckDensity: 2600,
    // Was 1, the whole way up the ramp, and that is a shade hot: at full
    // strength the brightest flecks compete with the mark's own lit rim, which
    // is the one thing on this page that should be the brightest gold in view.
    goldPeak: 0.82,
  },

  "black-gold-deep": {
    label: "Black sand + gold, deep",
    note: "The same material, further back. A ground rather than a photograph.",
    model: "ripple",

    // The same generator again, turned down across the board.
    //
    // The note this answers is that black-gold "looks like a full image behind",
    // and that is a real thing rather than a matter of taste: a surface reads as
    // a photograph when it carries enough contrast to be looked *at*, and as a
    // ground when it only rewards looking. Every number here is the same
    // decision — the material stays, its amplitude drops, and what is left is
    // texture on black rather than a plate filling the viewport.
    //
    // Deliberately not just a darker ground. Dropping tone alone and keeping the
    // amplitudes gives a high-contrast texture in a dim room, which is more
    // photographic rather than less; the contrast has to come down with it.
    ground: [10, 10, 11],

    // Barely there. At 3 the ripple is a suggestion of direction rather than a
    // form, which is all it needs to be once the grain is carrying the material.
    relief: 3,

    // Just over half of black-gold's. The grain is what makes a surface read as
    // photographed — it is the highest-frequency thing in the frame and the eye
    // goes to it — so this is the number that decides whether the field sits
    // behind the page or in front of it.
    grainLevels: 18,

    // Sparser and dimmer both. Fewer flecks means the gaps between them are the
    // subject, which is what keeps this from being a field of glitter.
    speckDensity: 1500,
    goldPeak: 0.62,
  },
};

// What a first-time visitor gets. `dune` held this while the grounds were being
// compared, on the grounds that it was what already shipped; the comparison is
// over and this is the one that won.
export const DEFAULT_SAND = "black-gold-deep";
const KEY = "kalos:sand-variant";

/**
 * Which ground is running. Same contract as the sunrise switch: `?sand=` wins
 * and is remembered, so a link carries the choice; otherwise the last pick.
 *
 * Read once at mount. The field is painted into a canvas from a useEffect, so
 * changing it is a repaint at best and a reload in practice — see chooseSand.
 */
export function activeSandName() {
  if (typeof window === "undefined") return DEFAULT_SAND;
  try {
    const asked = new URLSearchParams(window.location.search).get("sand");
    if (asked && SAND_VARIANTS[asked]) {
      window.localStorage.setItem(KEY, asked);
      return asked;
    }
    const saved = window.localStorage.getItem(KEY);
    if (saved && SAND_VARIANTS[saved]) return saved;
  } catch {
    // Private mode throws on storage. The default is a fine answer.
  }
  return DEFAULT_SAND;
}

export function activeSand() {
  return SAND_VARIANTS[activeSandName()];
}

export function chooseSand(name) {
  try {
    window.localStorage.setItem(KEY, name);
  } catch {
    // Fall through: the query string below carries it either way.
  }
  // Reloads rather than repainting, and sets the param rather than replacing the
  // search string, so the sunrise choice in `?v=` rides along untouched.
  const url = new URL(window.location.href);
  url.searchParams.set("sand", name);
  window.location.href = url.toString();
}
