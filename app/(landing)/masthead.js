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
 * An IntersectionObserver on the hero rather than a scroll listener, because the
 * question is binary -- is any of the hero still on screen -- and the browser
 * answers it without anything running per frame.
 *
 * `mix-blend-difference` with white is what lets one lockup sit on everything
 * below it: white on the white hero and closer inverts to black, and over the
 * dark case study panels it stays white. The alternative was reading which panel
 * is behind the header and swapping colour, which is a scroll listener doing
 * what a blend mode does for free.
 */
export default function Masthead({ heroId }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(heroId);
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) =>
      setShown(!entry.isIntersecting),
    );
    observer.observe(hero);
    return () => observer.disconnect();
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

  return (
    <header
      className={
        "pointer-events-none fixed inset-x-0 top-0 z-10 px-5 py-4 text-white mix-blend-difference " +
        "transition duration-[var(--duration-settle)] ease-brand sm:px-8 lg:px-12 lg:py-6 " +
        (shown ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0")
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
    </header>
  );
}
