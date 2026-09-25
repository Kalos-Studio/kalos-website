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
 * Over the work it is white on a black fade. It was one white lockup under
 * `mix-blend-difference`, which is correct on flat grounds and falls apart on a
 * photograph: over MARA's collage it inverted each colour behind it and came
 * out a patchwork of teal, orange and grey. The fade gives it a ground of its
 * own whatever is behind it.
 *
 * Over the closer the fade goes and the lockup turns black. A black gradient
 * across the top of a white page is a smudge, not a backdrop.
 *
 * IntersectionObservers rather than a scroll listener: both questions are
 * binary, and the browser answers them without anything running per frame.
 */
export default function Masthead({ heroId }) {
  const [shown, setShown] = useState(false);
  const [onWork, setOnWork] = useState(true);

  useEffect(() => {
    const hero = document.getElementById(heroId);
    const closer = document.getElementById("connect");
    if (!hero || !closer) return;

    const heroObserver = new IntersectionObserver(([entry]) =>
      setShown(!entry.isIntersecting),
    );
    heroObserver.observe(hero);

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
  }, [heroId]);

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
      {/* The fade. Taller than the bar so it dissolves into the picture rather
          than ending in an edge; three stops because a straight two-stop ramp
          reads as a band. */}
      <div
        aria-hidden="true"
        className={
          "absolute inset-x-0 top-0 h-28 bg-linear-to-b from-black/60 via-black/25 to-transparent transition-opacity lg:h-36 " +
          fade +
          (onWork ? " opacity-100" : " opacity-0")
        }
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
