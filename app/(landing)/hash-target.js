"use client";

import { useEffect } from "react";

/**
 * Arriving at `/#case-<slug>` opens the landing page on that case study's panel,
 * centred, the same way clicking its pill or flying its cover back would.
 *
 * This exists because "Back to Work" on a case study used to go to `/#work`,
 * which is the top of the section -- so leaving the H-E-B study put you at the
 * first panel with H-E-B somewhere below the fold, and the way back out of a
 * study was a different place from the way in. The cover already flew back to
 * its own panel; the text link now agrees with it.
 *
 * Centring cannot be done with `scroll-margin` and an ordinary anchor jump. An
 * anchor aligns the top of the element with the top of the viewport, and the
 * offset that would centre a panel instead depends on the panel's height and the
 * window's -- neither of which CSS can subtract from the other here.
 */

// How far the page may have moved before a late correction is abandoned. A few
// pixels is the browser landing on a fractional position; more than that is the
// reader having started scrolling, and yanking the page back under them is worse
// than a panel sitting slightly off centre.
const MOVED = 4;

export default function HashTarget() {
  useEffect(() => {
    // Where we last put the page, so a correction can tell its own scroll apart
    // from the reader's.
    let placed = null;

    const centre = () => {
      const id = window.location.hash.slice(1);
      // Only the panels. Every other anchor on the page -- #work, #connect --
      // means what a top-aligned jump already does.
      if (!id.startsWith("case-")) return false;
      const el = document.getElementById(id);
      if (!el) return false;
      // Instant, not smooth: this is where the page *opens*, not a move the
      // reader made, and animating it would look like the page had drifted.
      el.scrollIntoView({ block: "center", behavior: "instant" });
      placed = window.scrollY;
      return true;
    };

    if (!centre()) return;

    // Again on the next frame, because Next does its own hash scroll around the
    // same commit and that one is top-aligned. Whichever lands second wins, so
    // this has to be the one that does.
    const frame = requestAnimationFrame(centre);

    // And once more when the font lands. Space Grotesk is wider than the
    // fallback, so the tag row under a panel can wrap to a second line and move
    // every panel below it -- including this one, after it had been centred
    // against the fallback's layout.
    document.fonts?.ready
      ?.then(() => {
        if (placed !== null && Math.abs(window.scrollY - placed) <= MOVED) {
          centre();
        }
      })
      .catch(() => {});

    return () => cancelAnimationFrame(frame);
  }, []);

  return null;
}
