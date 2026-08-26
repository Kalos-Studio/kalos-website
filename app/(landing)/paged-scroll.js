"use client";

import { useEffect } from "react";

/**
 * One gesture, one view.
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
 * - **The hero is left alone structurally.** Everything above the first case
 *   study is still one scroll away, and the handover plays across it.
 * - **The wheel and the arrow/page keys are taken, and nothing else.** Tab,
 *   find-in-page, the pill rail and anchor links all still move the page
 *   themselves, so nothing that depends on them stops working.
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

// The hard ceiling on a single lock, and the reason it exists: every swallowed
// event pushes the quiet timer out, and a trackpad emits events continuously
// while a finger is anywhere near it. Without a ceiling, resting a hand on the
// pad held the lock open indefinitely and the page simply would not scroll --
// several attempts before one happened to land in a gap. A gesture can never
// hold the page for longer than this.
const MAX_LOCK_MS = 900;

// A scroll of about a viewport takes roughly this long. The lock is not released
// on it -- quiet is what releases the lock -- but paging again before the page
// has moved would compute the next stop from a stale position.
const SETTLE_MS = 500;

// Treat a position within this of a stop as being at it.
const EDGE = 8;

// The keys that mean "next view" and "previous view".
//
// Arrow and page keys only. Home and End are left to the browser: the top of
// the document is the hero and the bottom is the closer, both of which are
// stops already, so intercepting them would only reimplement what they do.
//
// Space is deliberately not here either. It scrolls a page *unless* something
// focusable has focus, in which case it activates it -- and this page is a
// column of links. Taking it would mean either breaking the pill rail under the
// keyboard or reimplementing the browser's own rule about when space is a
// scroll, and it is one key.
const PAGING_KEYS = {
  ArrowDown: true,
  PageDown: true,
  ArrowUp: false,
  PageUp: false,
};

// Where a key press must not be read as scrolling. The Cal booker is a modal
// over the page with a month grid in it that has its own arrow-key handling,
// and paging the page behind an open modal is wrong whatever the key does.
const TYPING = "input, textarea, select, [contenteditable]:not([contenteditable='false'])";
const MODAL = "cal-modal-box, dialog[open]";

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
    let startedAt = 0;

    // The stop a gesture in this direction should land on, or undefined for
    // "there is nothing that way, let the browser have it".
    //
    // The hero is a stop in both directions. It was free going down, so the
    // handover could be scrubbed at the reader's own pace. In practice that made
    // the two directions feel like different pages: up snapped cleanly to the
    // hero, down drifted. The handover still plays -- it runs across the paged
    // scroll instead of across the reader's gesture -- and consistency turned
    // out to matter more than scrubbing it.
    const nextStop = (down) => {
      const list = stops();
      if (!list.length) return undefined;
      const y = window.scrollY;
      const previous = [...list].reverse().find((stop) => stop < y - EDGE);
      return down
        ? list.find((stop) => stop > y + EDGE)
        : // Nothing above the first case study but the hero, so that is where
          // going up leads. Undefined once already at the top, which hands the
          // gesture back to the browser.
          (previous ?? (y > EDGE ? 0 : undefined));
    };

    // The paging step itself, shared by the wheel and the keyboard so that the
    // two can never run at once. That sharing is the whole point of the split:
    // two independent locks would have let one compute its target from a
    // position the other was still animating away from.
    //
    // `absorbMomentum` is the one thing they do differently, and it is the
    // difference between the two input devices rather than a tuning knob. A
    // trackpad keeps emitting events after the fingers lift, so a wheel gesture
    // has to hold the lock through its own tail or one flick pages three views.
    // A key press has no tail. Locking after one would buy nothing and cost the
    // trackpad up to MAX_LOCK_MS of being swallowed for a keystroke that was
    // already finished -- so the keyboard relies on `ready` alone, which the
    // wheel handler honours anyway, and the trackpad is free again as soon as
    // the scroll it would have fought has landed.
    const pageTo = (target, absorbMomentum) => {
      startedAt = performance.now();
      ready = false;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      // Turn CSS snapping off for the duration of the scroll.
      //
      // The page also has `scroll-snap-type: y proximity`, which is a second
      // thing deciding where the page should sit. As a programmatic smooth
      // scroll lands, the snap engine re-adjusts the position it just arrived
      // at, and on a trackpad -- where momentum keeps arriving after the
      // gesture -- that reads as a jitter on the panel it settled on.
      //
      // Suppressed rather than removed, because snapping is what positions the
      // page on touch, where none of this runs at all.
      document.documentElement.style.scrollSnapType = "none";

      window.scrollTo({
        top: target,
        behavior: reduced ? "auto" : "smooth",
      });

      window.setTimeout(() => {
        ready = true;
        document.documentElement.style.scrollSnapType = "";
      }, SETTLE_MS);

      if (absorbMomentum) {
        locked = true;
        window.clearTimeout(quiet);
        quiet = window.setTimeout(() => {
          locked = false;
        }, QUIET_MS);
      }
    };

    const onWheel = (event) => {
      if (event.ctrlKey) return; // pinch zoom, not a scroll

      // The lock comes first, and swallows everything.
      //
      // This used to sit below the noise threshold, which meant every event too
      // small to count as a gesture returned early *without* preventDefault --
      // and a momentum tail is mostly such events. They went straight to the
      // browser and scrolled the page natively while the lock believed it held
      // it. Swiping hard up and down let you park the page anywhere between two
      // panels for a second or two before it caught up, because the lock was
      // only ever stopping the large events.
      //
      // Nothing about a wheel event's size makes it safe to let through while a
      // paged scroll is running.
      if (locked) {
        event.preventDefault();
        // Extend the lock, but never past the ceiling. Absorbing momentum is
        // worth a short wait; holding the page hostage while a hand rests on the
        // trackpad is not.
        const remaining = startedAt + MAX_LOCK_MS - performance.now();
        if (remaining <= 0) {
          locked = false;
          return;
        }
        window.clearTimeout(quiet);
        quiet = window.setTimeout(
          () => {
            locked = false;
          },
          Math.min(QUIET_MS, remaining),
        );
        return;
      }

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

      if (!ready) {
        event.preventDefault();
        return;
      }

      const target = nextStop(delta > 0);

      // Past the last stop in that direction: let the browser have it, so the
      // page can still be scrolled to its very top or bottom.
      if (target === undefined) return;

      event.preventDefault();
      pageTo(target, true);
    };

    // The keyboard, which had the same problem the wheel had and a worse
    // symptom.
    //
    // An arrow key scrolls about 40px. Proximity snapping then decides the page
    // is still nearest the stop it just left and drags it back, so the press
    // does nothing at all -- press, twitch, return. Page Down moves a viewport,
    // which on this layout lands between two panels and gets dragged to
    // whichever is closer, so it skips one panel or none depending on where you
    // started. Neither is a scroll anyone asked for, and "arrow key scrolling is
    // super weird" was exactly this.
    //
    // So the keys go through the same stops as the wheel. Note what is checked
    // and in what order: everything that could mean something other than
    // scrolling is handed back *before* the lock is consulted, because a
    // swallowed keystroke in a text field is a much worse failure than a
    // swallowed one on the page.
    const onKeyDown = (event) => {
      // Someone else has already acted on this -- a link's own Enter, a
      // component that handles its own arrows.
      if (event.defaultPrevented) return;

      // Modified arrows are the browser's. Cmd-Down is "go to the bottom" on a
      // Mac, Alt-Arrow is history navigation, Shift-Arrow extends a selection.
      // Taking any of them would break a shortcut to reimplement a worse one.
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;

      if (!(event.key in PAGING_KEYS)) return;

      const target = event.target;
      if (target instanceof Element) {
        if (target.closest(TYPING)) return;
      }
      if (document.querySelector(MODAL)) return;

      // Held down, or pressed during a scroll that is still running. Swallowed
      // rather than passed through: letting the repeat reach the browser would
      // scroll natively away from the position the animation is heading for,
      // which is the drift this whole file exists to remove.
      //
      // `ready` rather than `locked`, so a deliberate press right after a flick
      // still works while its momentum tail is being absorbed.
      if (!ready) {
        event.preventDefault();
        return;
      }

      const stop = nextStop(PAGING_KEYS[event.key]);
      if (stop === undefined) return;

      event.preventDefault();
      pageTo(stop, false);
    };

    // Not passive: this has to be able to preventDefault, and a passive listener
    // cannot. Everything above returns early rather than calling it, so the
    // browser keeps the scroll in every case this does not handle.
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(quiet);
      // Never leave snapping off behind us.
      document.documentElement.style.scrollSnapType = "";
    };
  }, []);

  return null;
}
