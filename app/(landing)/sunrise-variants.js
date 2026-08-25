/**
 * Two sunrises, side by side, so they can be judged against each other rather
 * than against a memory of the other one.
 *
 * `soft` is the version that was approved at commit 8ec14aa: the sky tips a
 * little, a directional light passes the mark, the surface keeps its full
 * turning. `drastic` is what came out of aiming at the Robinhood card page:
 * darker room, a rectAreaLight blade rather than a point, a sharper curve
 * through the middle, and a flatter finish that survives a grazing light.
 *
 * The one thing NOT varied here is the ring pitch. That was a sampling bug —
 * grooves one texel apart on a mark that renders at a texel per pixel, beating
 * against the grid into a bullseye — and a bug does not get a variant. Both use
 * the fixed generator; they differ in how hard they drive it.
 *
 * THIS IS A DEV TOOL AND IT SHOULD NOT SURVIVE LAUNCH. It ships a hidden menu in
 * the corner of the homepage and a second set of values nobody will read again
 * once the choice is made. Delete this file, `variant-switch.js`, and the
 * branches that read them, and inline whichever one won.
 */

export const VARIANTS = {
  soft: {
    label: "Soft",
    note: "Approved at 8ec14aa. Gentler sky, point light, full finish.",
    seconds: 4.6,
    // Where the environment starts, as a fraction of its settled intensity.
    start: 0.06,
    // How far the sky is tipped over at the beginning, in radians.
    tilt: 1.15,
    // smoothstep: slow at both ends.
    ease: "smooth",
    // A directional light: a hot spot travelling, rather than a bar.
    light: "point",
    lightIntensity: 2.6,
    // Rises and falls on a sine across its window.
    lightShape: "pulse",
    // How dark the sand gets. The floor it fades toward, not the value it holds.
    sandFloor: 0.32,
    faceBump: 4.5,
    faceAnisotropy: 0.85,
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
    // enormously and the soft version's amplitude smears into ripples while the
    // sky is still tipped over.
    faceBump: 1.5,
    faceAnisotropy: 0.42,
  },
};

export const DEFAULT_VARIANT = "drastic";
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
