"use client";

import { useEffect } from "react";

/**
 * One scroll gesture, one view.
 *
 * CSS proximity snapping only acts once you have stopped, and only if you
 * happened to stop near a stop. That leaves two problems: a deliberate flick
 * drifts before it settles, and the 1026px gap between the last case study and
 * the closer has no stop in it at all, so a medium scroll came to rest showing
 * the tail of one and the top of the other. This takes the gesture and moves to
 * the next view immediately instead.
 *
 * Yes, this is scroll-jacking, and it is the thing this codebase otherwise
 * avoids. It is here because it was asked for, so the job is to do the version
 * that does not break the page:
 *
 * - **The hero is left alone.** Everything above the first case study scrolls
 *   normally, because the hero's handover is scrubbed by the reader and paging
 *   would replace it with a single jump. Paging engages once the work starts.
 * - **Only the wheel is taken.** Keyboard, space, Page Down, find-in-page, the
 *   pill rail and anchor links all still move the page themselves, so nothing
 *   that depends on them stops working.
 * - **Touch is untouched.** A phone keeps native momentum and CSS snapping,
 *   which are better than anything reimplemented here.
 * - **Reduced motion jumps** rather than animating.
 *
 * The lock is the fiddly part. A trackpad emits a long tail of momentum events
 * after the fingers lift, and without holding the lock through them one flick
 * would page three views. So the lock is released only once the wheel has been
 * quiet, not on a timer from when the animation started.
 */

// Wheel deltas smaller than this are noise -- a resting trackpad, a shaking
// hand, the tail end of momentum -- and must not count as a gesture.
const MIN_DELTA = 4;

// How long the wheel has to be quiet before another gesture is accepted. Long
// enough to outlast trackpad momentum, short enough that deliberate consecutive
// flicks still feel responsive.
const QUIET_MS = 220;

// A scroll of about a viewport takes roughly this long. The lock is not released
// on it -- quiet is what releases the lock -- but paging again before the page
// has moved would compute the next stop from a stale position.
const SETTLE_MS = 500;

// Treat a position within this of a stop as being at it.
const EDGE = 8;

export default function PagedScroll() {
  useEffect(() => {
    const stops = () => {
      const vh = window.innerHeight;
      const out = [];
      // Case study panels are centred, so their stop is the position that puts
      // the middle of the panel in the middle of the window.
      for (const el of document.querySelectorAll('[id^="case-"]')) {
        const r = el.getBoundingClientRect();
        out.push(r.top + window.scrollY + r.height / 2 - vh / 2);
      }
      // The closer aligns to the top of the window instead, being a full one.
      const closer = document.getElementById("connect");
      if (closer) out.push(closer.getBoundingClientRect().top + window.scrollY);
      return out.sort((a, b) => a - b);
    };

    let locked = false;
    let quiet;
    let ready = true;

    const onWheel = (event) => {
      if (event.ctrlKey) return; // pinch zoom, not a scroll

      // Normalise before thresholding. Firefox reports mouse-wheel events in
      // lines rather than pixels, with deltaY around 1-3 -- so a bare pixel
      // threshold discarded every genuine wheel gesture there as noise and
      // paging silently never engaged, leaving the 1026px gap before the closer
      // with no stop in it.
      const LINE_HEIGHT = 16;
      const PAGE_HEIGHT = window.innerHeight;
      const scale =
        event.deltaMode === 1 ? LINE_HEIGHT : event.deltaMode === 2 ? PAGE_HEIGHT : 1;
      const delta = event.deltaY * scale;

      if (Math.abs(delta) < MIN_DELTA) return;

      const list = stops();
      if (!list.length) return;

      // Above the first case study the hero owns the scroll. Nothing here.
      if (window.scrollY < list[0] - EDGE) return;

      if (locked) {
        // Momentum from the gesture already handled. Swallow it, and hold the
        // lock open until the wheel actually goes quiet.
        event.preventDefault();
        window.clearTimeout(quiet);
        quiet = window.setTimeout(() => {
          locked = false;
        }, QUIET_MS);
        return;
      }

      if (!ready) {
        event.preventDefault();
        return;
      }

      const down = delta > 0;
      const y = window.scrollY;
      const target = down
        ? list.find((stop) => stop > y + EDGE)
        : [...list].reverse().find((stop) => stop < y - EDGE);

      // Past the last stop in that direction: let the browser have it, so the
      // page can still be scrolled to its very top or bottom.
      if (target === undefined) return;

      event.preventDefault();
      locked = true;
      ready = false;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      window.scrollTo({
        top: target,
        behavior: reduced ? "auto" : "smooth",
      });

      window.setTimeout(() => {
        ready = true;
      }, SETTLE_MS);

      window.clearTimeout(quiet);
      quiet = window.setTimeout(() => {
        locked = false;
      }, QUIET_MS);
    };

    // Not passive: this has to be able to preventDefault, and a passive listener
    // cannot. Everything above returns early rather than calling it, so the
    // browser keeps the scroll in every case this does not handle.
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.clearTimeout(quiet);
    };
  }, []);

  return null;
}
