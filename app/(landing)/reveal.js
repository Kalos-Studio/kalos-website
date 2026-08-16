"use client";

import { useEffect, useRef, useState } from "react";

// Reveal anything whose top edge has reached this fraction of the viewport.
const TRIGGER = 0.92;

/**
 * Fades and lifts its children the first time they scroll into view.
 *
 * The point of this is perceived quality, so the failure modes matter more than
 * the effect. It renders visible and un-transformed on the server: if the JS
 * never runs the page is simply a normal page, rather than a screen of
 * invisible text. That is why the hidden state is applied from an effect rather
 * than being the initial render. It fires once and then stops listening, since
 * a section that re-animates on every pass reads as a gimmick by the third
 * scroll. And prefers-reduced-motion skips the whole thing.
 *
 * Deliberately a scroll listener rather than an IntersectionObserver, which is
 * the obvious tool and was the first implementation. IO only fires when an
 * element's intersection actually changes, and a jump scroll (an anchor link,
 * browser scroll restoration, a hard flick, or scrollTo) can move an element
 * from below the viewport to above it without ever sampling a frame where it
 * intersected. Those elements then stay hidden forever. Measured: scrolling
 * straight to the bottom left eight of ten sections permanently invisible.
 *
 * A position check cannot miss that way, because it asks where the element is
 * now instead of relying on having witnessed the transition. Each instance
 * listens only until it reveals, so the listeners are gone by the time anyone
 * has read the page, and the work per event is one getBoundingClientRect behind
 * a rAF gate.
 */
export default function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [state, setState] = useState("static");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const reached = () =>
      el.getBoundingClientRect().top < window.innerHeight * TRIGGER;

    // Already in view at mount, which is the first section on most screens.
    // Reveal without hiding first, or it flashes out and back in.
    if (reached()) {
      setState("in");
      return;
    }

    setState("out");

    // The page scrolls inside .landing-root rather than the document, so the
    // events come from there. window is kept as well for resize and for any
    // future layout where the container is the document itself.
    const scroller = el.closest(".landing-root") ?? window;
    let frame = 0;
    let done = false;

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };

    const check = () => {
      frame = 0;
      if (done || !reached()) return;
      done = true;
      setState("in");
      stop();
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return stop;
  }, []);

  return (
    <div
      ref={ref}
      className={`ln-reveal ln-reveal--${state} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
