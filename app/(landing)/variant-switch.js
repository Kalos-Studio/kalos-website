"use client";

import { useEffect, useState } from "react";
import {
  VARIANTS,
  activeVariantName,
  chooseVariant,
} from "./sunrise-variants";
import {
  SAND_VARIANTS,
  activeSandName,
  chooseSand,
} from "./sand-variants";
import "./variant-switch.css";

/**
 * A switch for comparing the sunrises and the grounds back to back.
 *
 * Rendered from the root layout, so it is on /work and /about and the design
 * sheet as well as the homepage. Two reasons rather than one: the sand runs
 * behind /about too, so the ground axis was only half reviewable from the page
 * it was pinned to, and a preview link opened on a phone was landing wherever
 * the last choice had put it with no way to change it from there.
 *
 * Top centre, and lit at rest — see variant-switch.css. It used to hide in the
 * top left until hovered, which is fine for a tool on one page whose owner put
 * it there and is not fine for one that has to be findable on a deploy preview.
 *
 * Two groups, not one list. The sunrise and the ground are independent axes —
 * any ground runs under any sunrise — so a single flat list would need nine
 * entries to offer six decisions, and each of them would have to be named after
 * a combination rather than after the thing it changes.
 *
 * There was a third group here for a while, comparing two ways of snapping the
 * scroll past the hero. Commit won and the loser is deleted rather than left on
 * the menu: a switch nobody is going to touch again is a second implementation
 * to keep working.
 *
 * Clicking the tab pins the menu open, rather than the menu living on hover
 * alone. Hover-only was tried and is genuinely fragile: the panel vanishes the
 * moment the pointer leaves the tab on its way to the thing it is pointing at,
 * and it could not be driven from a script at all. Escape and a click outside
 * close it.
 *
 * Switching reloads rather than swapping state. Not laziness — the sunrises
 * differ in which light element exists in the scene and in material values built
 * inside a useMemo, so a live swap would mean tearing the canvas down and
 * rebuilding it, which is what a reload does with less code to be wrong. The
 * grounds could repaint in place, and deliberately do not, for the much duller
 * reason that one code path for switching is easier to trust than two.
 *
 * THIS IS A DEV TOOL AND IT SHOULD NOT SURVIVE LAUNCH. It is deliberately not
 * gated on NODE_ENV, because the place it most needs to work is a Netlify deploy
 * preview, which is a production build. Delete this file, variant-switch.css,
 * sunrise-variants.js, sand-variants.js, the line in app/layout.js that renders
 * it, and the lookups in solid.js, stage.js and sand.js.
 */

function Group({ title, variants, current, onChoose }) {
  return (
    <div className="ln-variants-group">
      <p className="ln-variants-title">{title}</p>
      {Object.entries(variants).map(([name, variant]) => (
        <button
          key={name}
          type="button"
          className={`ln-variants-option${name === current ? " is-current" : ""}`}
          onClick={() => onChoose(name)}
        >
          <span className="ln-variants-name">{variant.label}</span>
          <span className="ln-variants-note">{variant.note}</span>
        </button>
      ))}
    </div>
  );
}

export default function VariantSwitch() {
  const [current, setCurrent] = useState(null);
  const [sand, setSand] = useState(null);
  const [open, setOpen] = useState(false);

  // After mount only: the answers come from localStorage and the query string,
  // neither of which exists on the server, and rendering a guess would hydrate
  // wrong.
  useEffect(() => {
    setCurrent(activeVariantName());
    setSand(activeSandName());
  }, []);

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

  if (!current || !sand) return null;

  return (
    <div className={`ln-variants${open ? " is-open" : ""}`}>
      {/* Both names on the tab, stacked. Knowing what you are looking at without
          opening the menu is most of what the tab is for, and with two axes one
          name no longer answers that. */}
      <button
        type="button"
        className="ln-variants-tab"
        aria-expanded={open}
        onClick={() => setOpen((was) => !was)}
      >
        <span className="ln-variants-tab-line">{VARIANTS[current].label}</span>
        <span className="ln-variants-tab-line">{SAND_VARIANTS[sand].label}</span>
      </button>
      {open && (
        <div className="ln-variants-menu">
          <Group
            title="Sunrise"
            variants={VARIANTS}
            current={current}
            onChoose={chooseVariant}
          />
          <Group
            title="Ground"
            variants={SAND_VARIANTS}
            current={sand}
            onChoose={chooseSand}
          />
        </div>
      )}
    </div>
  );
}
