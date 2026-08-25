"use client";

import { useEffect, useState } from "react";
import {
  VARIANTS,
  activeVariantName,
  chooseVariant,
} from "./sunrise-variants";

/**
 * A hidden switch for comparing the sunrises back to back.
 *
 * Top left, over the corner the masthead already occupies: a small target that
 * is invisible until hovered or tabbed to, because the point of that hero is
 * that there is nothing in that corner but the lockup.
 *
 * Clicking the tab pins the menu open, rather than the menu living on hover
 * alone. Hover-only was tried and is genuinely fragile: the panel vanishes the
 * moment the pointer leaves the tab on its way to the thing it is pointing at,
 * and it could not be driven from a script at all. Escape and a click outside
 * close it.
 *
 * Switching reloads rather than swapping state. Not laziness — the variants
 * differ in which light element exists in the scene and in material values built
 * inside a useMemo, so a live swap would mean tearing the canvas down and
 * rebuilding it, which is what a reload does with less code to be wrong.
 *
 * THIS IS A DEV TOOL AND IT SHOULD NOT SURVIVE LAUNCH. It is deliberately not
 * gated on NODE_ENV, because the place it most needs to work is a Netlify deploy
 * preview, which is a production build. Delete this file, sunrise-variants.js,
 * the .ln-variants rules, and the V. lookups in solid.js, stage.js and sand.js.
 */
export default function VariantSwitch() {
  const [current, setCurrent] = useState(null);
  const [open, setOpen] = useState(false);

  // After mount only: the answer comes from localStorage and the query string,
  // neither of which exists on the server, and rendering a guess would hydrate
  // wrong.
  useEffect(() => setCurrent(activeVariantName()), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onDown = (event) => {
      if (!event.target.closest?.(".ln-variants")) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  if (!current) return null;

  return (
    <div className={`ln-variants${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="ln-variants-tab"
        aria-expanded={open}
        onClick={() => setOpen((was) => !was)}
      >
        {VARIANTS[current].label}
      </button>
      {open && (
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
      )}
    </div>
  );
}
