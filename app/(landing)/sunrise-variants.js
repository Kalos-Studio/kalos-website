/**
 * Two sunrises, side by side, so they can be judged against each other rather
 * than against a memory of the other one.
 *
 * `soft` is 8ec14aa's lighting and material amplitude — a gentle sky tilt, a
 * directional light passing the mark, the full turning — with the ring sampling
 * fixed. `drastic` is what came out of aiming at the Robinhood card page: darker
 * room, a rectAreaLight blade rather than a point, a sharper curve through the
 * middle, and a flatter finish that survives a grazing light.
 *
 * `original` is the approved commit exactly, including the ring sampling that
 * caused the bullseye. It is here because "save that commit as a variant" means
 * that commit, not an improved version of it wearing its name — `soft` was
 * originally labelled as 8ec14aa and was not, since it carried the pitch fix.
 * Keeping all three makes the fix's contribution visible on its own, which is
 * worth more than hiding it.
 *
 * THIS IS A DEV TOOL AND IT SHOULD NOT SURVIVE LAUNCH. It ships a hidden menu in
 * the corner of the homepage and a second set of values nobody will read again
 * once the choice is made. Delete this file, `variant-switch.js`, and the
 * branches that read them, and inline whichever one won.
 */

export const VARIANTS = {
  original: {
    label: "Original (8ec14aa)",
    note: "Exactly the approved commit, bullseye included.",
    seconds: 4.6,
    start: 0.06,
    tilt: 1.15,
    ease: "smooth",
    light: "point",
    lightIntensity: 2.6,
    lightShape: "pulse",
    sandFloor: 0.32,
    faceBump: 4.5,
    faceAnisotropy: 0.85,
    // One groove per texel of radius, indexed with Math.round. This is the
    // sampling that produced the concentric moiré: the mark renders at roughly a
    // texel per screen pixel, so the grooves land on the pixel grid's own
    // frequency and beat against it. It is here because the owner asked to keep
    // the approved commit comparable, not because it is a candidate.
    ringPitch: 1,
    ringStep: true,
  },

  soft: {
    label: "Soft",
    note: "8ec14aa's light and finish, with the ring sampling fixed.",
    seconds: 4.6,
    start: 0.06,
    tilt: 1.15,
    // smoothstep: slow at both ends.
    ease: "smooth",
    // A directional light: a hot spot travelling, rather than a bar.
    light: "point",
    lightIntensity: 2.6,
    // Rises and falls on a sine across its window.
    lightShape: "pulse",
    // How dark the sand gets: the floor it fades toward.
    sandFloor: 0.32,
    faceBump: 4.5,
    faceAnisotropy: 0.85,
    ringPitch: 4,
    ringStep: false,
  },

  drastic: {
    label: "Drastic",
    note: "Darker room, blade of light, flatter finish.",
    seconds: 5.6,
    start: 0.22,
    tilt: 1.0,
    // Ease-in-out cubic: sharper through the middle, so it reads as a sweep.
    ease: "sharp",
    // A rectAreaLight: the only light in three that reads as a bar on metal
    // rather than a dot.
    light: "blade",
    lightIntensity: 4.2,
    // Rises and holds, then hands over at the end.
    lightShape: "hold",
    sandFloor: 0.1,
    // Flatter, because a grazing light exaggerates normal perturbation
    // enormously and the soft amplitude smears into ripples while the sky is
    // still tipped over.
    faceBump: 1.5,
    faceAnisotropy: 0.42,
    ringPitch: 4,
    ringStep: false,
  },
};

// What a first-time visitor gets. Chosen, not left over — `drastic` was the
// default while the three were being compared and `soft` is the one that won.
export const DEFAULT_VARIANT = "soft";
const KEY = "kalos:sunrise-variant";

/**
 * Which one is running.
 *
 * `?v=soft` wins, and is remembered, so a link can carry a choice to somebody
 * else. Otherwise whatever was last picked from the menu. Read once at mount
 * rather than reactively: the materials are built in a useMemo and the light is
 * a different element per variant, so changing it is a reload, not a re-render.
 */
export function activeVariantName() {
  if (typeof window === "undefined") return DEFAULT_VARIANT;
  try {
    const asked = new URLSearchParams(window.location.search).get("v");
    if (asked && VARIANTS[asked]) {
      window.localStorage.setItem(KEY, asked);
      return asked;
    }
    const saved = window.localStorage.getItem(KEY);
    if (saved && VARIANTS[saved]) return saved;
  } catch {
    // Private mode throws on storage. The default is a fine answer.
  }
  return DEFAULT_VARIANT;
}

export function activeVariant() {
  return VARIANTS[activeVariantName()];
}

export function chooseVariant(name) {
  try {
    window.localStorage.setItem(KEY, name);
  } catch {
    // Fall through: the query string below carries it either way.
  }
  const url = new URL(window.location.href);
  url.searchParams.set("v", name);
  window.location.href = url.toString();
}
