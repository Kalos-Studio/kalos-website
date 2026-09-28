"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Lockup from "../lockup";

/**
 * The lockup, top left, and only once the hero is behind you.
 *
 * The wireframe's note is "header only pops up after user scrolls past hero":
 * the hero already has the mark in the middle of it, and a second one in the
 * corner would be the name said twice on the first screen.
 *
 * Over the work it is white on a black fade in the top left corner. It was one white lockup under
 * `mix-blend-difference`, which is correct on flat grounds and falls apart on a
 * photograph: over MARA's collage it inverted each colour behind it and came
 * out a patchwork of teal, orange and grey. The fade gives it a ground of its
 * own whatever is behind it.
 *
 * Over the closer the fade goes and the lockup turns black. A dark gradient
 * in the corner of a white page is a smudge, not a backdrop.
 *
 * IntersectionObservers rather than a scroll listener: both questions are
 * binary, and the browser answers them without anything running per frame.
 */
export default function Masthead({ revealStopId }) {
  const [shown, setShown] = useState(false);
  const [onWork, setOnWork] = useState(true);

  useEffect(() => {
    const reveal = document.getElementById(revealStopId);
    const closer = document.getElementById("connect");
    if (!reveal || !closer) return;

    // "Past the hero" means the first study has reached full bleed, not that
    // the hero's own box has left the window. The hero's box goes a long way
    // before that: the first study grows from under it, so there is white at
    // the top of the window until the very end of the expansion, and a lockup
    // arriving there sat on white with its gradient drawn on nothing.
    //
    // The expansion completes when the reveal's stop block reaches the top of
    // the window, so that is what is watched: is it at, or anywhere above, the
    // top 1% of the window.
    //
    // The root is that strip *extended upwards without limit*, not the strip
    // alone. An observer only reports a change of state, and with the bare
    // strip a jump straight past it -- "Back to Work" landing on the last
    // study -- went from "below the strip" to "above the strip", which is not
    // intersecting both times, so nothing fired and the lockup stayed hidden.
    // With the root reaching up forever, above counts as inside, and any jump
    // across the line is a change the observer reports.
    const heroObserver = new IntersectionObserver(
      ([entry]) => setShown(entry.isIntersecting),
      { rootMargin: "1000000px 0px -99% 0px" },
    );
    heroObserver.observe(reveal);

    // Is the closer under the masthead? The root is shrunk to the top 10% of
    // the window, which is about where the lockup sits. The closer rather than
    // the work section, because resting on the closer puts the work's bottom
    // edge exactly on the window's top, and an edge touching the root counts
    // as intersecting.
    const closerObserver = new IntersectionObserver(
      ([entry]) => setOnWork(!entry.isIntersecting),
      { rootMargin: "0px 0px -90% 0px" },
    );
    closerObserver.observe(closer);

    return () => {
      heroObserver.disconnect();
      closerObserver.disconnect();
    };
  }, [revealStopId]);

  // Back to the top rather than a navigation, since this is the page it would
  // navigate to. Modified clicks fall through to the href.
  const toTop = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.button !== 0) return;
    event.preventDefault();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    history.replaceState(null, "", "/");
  };

  const fade = "duration-[var(--duration-settle)] ease-brand";

  return (
    <header
      className={
        "pointer-events-none fixed inset-x-0 top-0 z-10 transition " +
        fade +
        (shown ? " opacity-100" : " opacity-0")
      }
    >
      {/* The fade, in the corner only, and it reaches zero before its box
          ends. The ellipse's radii are the box's own width and height, centred
          on the corner, so it is fully transparent along both far edges and
          everywhere outside the curve -- there is no edge to see. Tailwind's
          three-stop ramp was centred the same way but sized to the far corner,
          which left it still visibly dark where the box cut it off.

          Six stops on an ease-out curve rather than a straight ramp, which
          reads as a band. */}
      <div
        aria-hidden="true"
        className={
          "absolute top-0 left-0 h-40 w-96 transition-opacity lg:h-52 lg:w-[34rem] " +
          fade +
          (onWork ? " opacity-100" : " opacity-0")
        }
        style={{
          backgroundImage:
            "radial-gradient(ellipse 100% 100% at 0 0, " +
            "rgb(4 4 6 / 0.55) 0%, rgb(4 4 6 / 0.42) 20%, rgb(4 4 6 / 0.26) 40%, " +
            "rgb(4 4 6 / 0.12) 60%, rgb(4 4 6 / 0.04) 80%, rgb(4 4 6 / 0) 100%)",
        }}
      />
      <div
        className={
          "relative px-5 py-4 transition sm:px-8 lg:px-12 lg:py-6 " +
          fade +
          (shown ? " translate-y-0" : " -translate-y-2") +
          (onWork ? " text-white" : " text-black")
        }
      >
        <Link
          href="/"
          onClick={toTop}
          aria-label="Kalos, back to top"
          tabIndex={shown ? 0 : -1}
          className={"inline-block " + (shown ? "pointer-events-auto" : "")}
        >
          <Lockup className="h-6 w-auto lg:h-7" />
        </Link>
      </div>
    </header>
  );
}
