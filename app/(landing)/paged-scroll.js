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
 * Two rules run this file, and both were learned the hard way:
 *
 * **A gesture is the sum of its events, never one of them.** A trackpad emits a
 * scroll as dozens of small deltas. Thresholding each one on its own discards
 * the whole of a gentle two-finger drag as noise -- and because a discarded
 * event was also an unclaimed one, the browser scrolled natively on it. A slow
 * scroll crawled a hundred pixels, snapping dragged it back when the fingers
 * stopped, and the page read as frozen. That was "scrolling is sometimes not
 * working", measured at 120px of native crawl and 0 panels moved.
 *
 * **Momentum is not a gesture, and no amount of arithmetic on a delta will tell
 * you which one you are holding.** After the fingers lift, a trackpad keeps
 * emitting for up to two seconds. Two ways of ending that have been tried and
 * cut:
 *
 * - *A fixed ceiling.* It expires in the middle of the tail while the deltas
 *   are still large, and the remainder pages a second time. Measured at two
 *   panels per hard flick, every time.
 * - *Reading the tail's shape*, on the theory that momentum only ever decays,
 *   so an event suddenly bigger than the one before it must be a fresh push.
 *   It is not: on macOS the momentum stream **starts above the peak of the
 *   gesture that threw it**, and wobbles on the way down. Every firm flick
 *   read as one page plus two phantom pushes, and a normal flick went three
 *   case studies down. That is what this rule replaced.
 *
 * So the stream is the gesture: one unbroken run of wheel events pages exactly
 * once, however long it runs and whatever shape it has. The only thing that
 * starts a new gesture is a pause, because momentum arrives at the frame rate
 * and never pauses. The cost is that a second flick thrown with no pause at all
 * is absorbed rather than obeyed, and that is the right side to err on: a
 * gesture ignored is a gesture you make again, while a gesture doubled has
 * already taken you somewhere you did not ask to go.
 */

// The distance a stream has to cover before it counts as a deliberate gesture.
// Small enough that a slow drag pages almost immediately; large enough that a
// stray twitch on the pad does not move the page.
const GESTURE_PX = 20;

// A pause longer than this ends the stream, and is the *only* thing that does.
// Sized off the two rates it has to separate: momentum arrives every 8-16ms and
// must never look like a pause, while lifting the fingers, putting them back
// down and starting to move again cannot be done in under about a tenth of a
// second. Anything in between is margin.
const STREAM_GAP_MS = 80;

// How long the wheel has to be quiet before the lock lets go. There is no
// ceiling beside it any more: a ceiling can only ever expire in the middle of
// something, and the middle of a momentum tail is the one place it must not.
// What used to need the ceiling -- a hand resting on the pad emitting forever
// and holding the page hostage -- is handled by STREAM_GAP_MS instead, which
// drops the lock outright the moment the pad goes quiet for a moment.
const QUIET_MS = 220;

// A scroll of about a viewport takes roughly this long. The wheel does not wait
// on it -- it aims from where the page is *heading* instead -- but the keyboard
// does, because a held key repeats about thirty times a second and would
// otherwise fly through the whole page.
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
    const measureStops = () => {
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
    let settle;

    // Where a running scroll is heading, or undefined when the page is at rest.
    //
    // Every target is computed from this rather than from `window.scrollY`, so
    // a second flick that arrives while the first is still animating aims at the
    // stop after the one being travelled to. Aiming from the live position
    // instead is how a fast pair of flicks used to land back where it started:
    // the second read a position the first was in the middle of leaving.
    let pending;

    // The stream: one continuous run of wheel events, which is one flick plus
    // whatever momentum follows it.
    let stops = null; // cached for the stream -- these are document positions,
    let acc = 0; //     so scrolling does not move them and a stream is short
    let lastAt = 0;

    const endStream = () => {
      stops = null;
      acc = 0;
    };

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
      if (!stops) stops = measureStops();
      if (!stops.length) return undefined;
      const y = pending ?? window.scrollY;
      const previous = [...stops].reverse().find((stop) => stop < y - EDGE);
      return down
        ? stops.find((stop) => stop > y + EDGE)
        : // Nothing above the first case study but the hero, so that is where
          // going up leads. Undefined once already at the top, which hands the
          // gesture back to the browser.
          (previous ?? (y > EDGE ? 0 : undefined));
    };

    // The paging step itself, shared by the wheel and the keyboard so that the
    // two can never disagree about where the page is going.
    //
    // `absorbMomentum` is the one thing they do differently, and it is the
    // difference between the two input devices rather than a tuning knob. A
    // trackpad keeps emitting events after the fingers lift, so a wheel gesture
    // has to hold the lock through its own tail or one flick pages twice. A key
    // press has no tail, so locking after one would only swallow the trackpad
    // for a gesture that was already over.
    const pageTo = (target, absorbMomentum) => {
      ready = false;
      pending = target;

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

      // Cleared first: two pages in quick succession would otherwise have the
      // first one's timer restore snapping in the middle of the second scroll,
      // which is the jitter this suppression exists to prevent.
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        ready = true;
        pending = undefined;
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

      // Normalise before anything else. Firefox reports mouse-wheel events in
      // lines rather than pixels, with deltaY around 1-3 -- so a bare pixel
      // threshold discarded every genuine wheel gesture there and paging
      // silently never engaged, leaving the 1026px gap before the closer with
      // no stop in it. A notched wheel is also not a stream: one click is one
      // whole gesture, however few pixels the browser calls it.
      const discrete = event.deltaMode !== 0;
      const delta =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      const now = performance.now();

      if (now - lastAt > STREAM_GAP_MS) {
        // The pad went quiet, so the fingers left it: whatever the lock was
        // absorbing is over and this is a new gesture. This is the only way a
        // new gesture ever begins, and dropping the lock here is the only way
        // the lock ever ends early.
        endStream();
        locked = false;
        window.clearTimeout(quiet);
      }
      lastAt = now;

      if (locked) {
        // The lock swallows everything, for as long as the stream keeps coming.
        // Nothing about a wheel event's size makes it safe to let through while
        // a paged scroll is running: an event the handler declines to claim is
        // one the browser scrolls on, and a page being scrolled natively
        // underneath a programmatic smooth scroll cancels it outright, leaving
        // the page stranded between two panels for snapping to drag back.
        event.preventDefault();
        window.clearTimeout(quiet);
        quiet = window.setTimeout(() => {
          locked = false;
        }, QUIET_MS);
        return;
      }

      // The gesture is the sum of its events. A direction change starts the sum
      // again rather than cancelling against what came before it.
      if (acc !== 0 && Math.sign(delta) !== Math.sign(acc)) acc = 0;
      acc += delta;

      const down = acc > 0;
      const target = nextStop(down);

      // Past the last stop in that direction: let the browser have it, so the
      // page can still be scrolled to its very top or bottom.
      if (target === undefined) {
        acc = 0;
        return;
      }

      // Claimed either way. Below the threshold the event is still part of a
      // gesture that is being measured, and letting it reach the browser is what
      // made a slow drag crawl and spring back.
      event.preventDefault();

      if (!discrete && Math.abs(acc) < GESTURE_PX) return;

      acc = 0;
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

      // The keyboard is not a stream, so it measures fresh every time.
      stops = null;
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
      window.clearTimeout(settle);
      // Never leave snapping off behind us.
      document.documentElement.style.scrollSnapType = "";
    };
  }, []);

  return null;
}
