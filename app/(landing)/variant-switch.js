"use client";

import { useEffect, useState } from "react";
import {
  VARIANTS,
  activeVariantName,
  chooseVariant,
} from "./sunrise-variants";

/**
 * A hidden switch for comparing the two sunrises back to back.
 *
 * Top left, invisible until you go looking for it: a small transparent target
 * over the masthead's own corner that fades a list in on hover or focus. It has
 * to be reachable without being visible, because the whole point of the hero is
 * that there is nothing in that corner but the lockup.
 *
 * Switching reloads the page rather than swapping state. That is not laziness —
 * the two variants differ in which light element exists in the scene and in
 * material values built inside a useMemo, so a live swap would mean tearing down
 * and rebuilding the canvas, which is exactly what a reload does with less code
 * to be wrong.
 *
 * THIS IS A DEV TOOL AND IT SHOULD NOT SURVIVE LAUNCH. It is deliberately not
 * gated on NODE_ENV, because the place it most needs to work is a Netlify deploy
 * preview, which is a production build. Delete this file, sunrise-variants.js,
 * and the branches that read them once the choice is made.
 */
export default function VariantSwitch() {
  const [current, setCurrent] = useState(null);

  // After mount only: the answer comes from localStorage and the query string,
  // neither of which exists on the server, and rendering a guess would hydrate
  // wrong.
  useEffect(() => setCurrent(activeVariantName()), []);

  if (!current) return null;

  return (
    <div className="ln-variants">
      <span className="ln-variants-tab" aria-hidden>
        variant
      </span>
      <div className="ln-variants-menu">
        {Object.entries(VARIANTS).map(([name, variant]) => (
          <button
            key={name}
            type="button"
            className={`ln-variants-option${name === current ? " is-current" : ""}`}
            onClick={() => chooseVariant(name)}
          >
            <span className="ln-variants-name">{variant.label}</span>
            <span className="ln-variants-note">{variant.note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
