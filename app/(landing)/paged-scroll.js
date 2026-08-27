"use client";

import { useEffect } from "react";

/**
 * The arrow and page keys page the landing page. **The wheel does not, and must
 * not be made to.**
 *
 * A trackpad gesture reaches JavaScript as a stream of wheel events, and Chrome
 * does not say which of them are fingers and which are the momentum the OS
 * synthesises after the fingers lift. Four ways of guessing were built here and
 * measured against real hardware. Each one worked on the case it was written
 * for and broke a different one:
 *
 * - **A per-event size threshold.** A gentle two-finger drag is all 1-3px
 *   events, so all of it was discarded as noise -- and an event the handler
 *   declines to claim is one the browser scrolls on, so the page crawled ~120px
 *   natively and snapping dragged it back when the fingers stopped. Reported as
 *   "scrolling is sometimes not working".
 * - **A fixed lock ceiling** to hold the page through the momentum tail. It
 *   expires in the middle of that tail while the deltas are still large, and
 *   the remainder pages a second time. Measured at two panels per hard flick.
 * - **Reading the tail's shape**, on the theory that momentum only ever decays,
 *   so a delta bigger than the one before it must be a fresh push. On macOS the
 *   momentum stream *starts above the peak of the gesture that threw it* and
 *   wobbles on the way down: one flick read as a page plus two phantom pushes
 *   and went three case studies down.
 * - **One unbroken stream is one gesture.** True of a flick, false of a long
 *   swipe: the first 20px paged and every event after it was swallowed, and a
 *   second swipe thrown before the momentum ran out was swallowed too.
 *   Reported as "a full swipe does nothing".
 *
 * The information is not in the event stream. It is in the compositor, which is
 * where CSS scroll snapping runs -- so `scroll-snap-type: y mandatory` in
 * app/layout.js plus the `scroll-snap-stop: always` already on every panel does
 * the whole job, on every input device, with the phase information a script
 * cannot see. If this file ever grows a `wheel` listener again, read the list
 * above first.
 *
 * What snapping genuinely does not handle is the keyboard, which is what is
 * left here.
 */

// A scroll of about a viewport takes roughly this long. A held key repeats
// about thirty times a second, so without a gate one press flies through the
// page; and a target computed while a scroll is still running is computed from
// a position the page is in the middle of leaving.
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
    // The same stops the CSS declares, read back from the DOM rather than
    // duplicated as numbers. A panel's snap position is where snapping would
    // put it, so a key press and a flick land on exactly the same pixel.
    const measureStops = () => {
      const vh = window.innerHeight;
      // The hero, which is `snap-start` at the top of the document.
      const out = [0];
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

    let ready = true;
    let settle;

    // The stop in this direction, or undefined for "there is nothing that way,
    // let the browser have it".
    const nextStop = (down) => {
      const list = measureStops();
      const y = window.scrollY;
      return down
        ? list.find((stop) => stop > y + EDGE)
        : [...list].reverse().find((stop) => stop < y - EDGE);
    };

    // The keyboard, and the bug it exists for.
    //
    // An arrow key scrolls about 40px. Snapping then decides the page is still
    // nearest the stop it just left and puts it back, so the press does nothing
    // at all -- press, twitch, return. Page Down moves a viewport, which on this
    // layout lands between two panels and gets pulled to whichever is closer, so
    // it skips one panel or none depending on where you started. Neither is a
    // scroll anyone asked for, and "arrow key scrolling is super weird" was
    // exactly this. Snapping cannot fix it: the press is too small to change
    // which snap point is nearest.
    //
    // Note what is checked and in what order: everything that could mean
    // something other than scrolling is handed back *first*, because a swallowed
    // keystroke in a text field is a much worse failure than a swallowed one on
    // the page.
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
      // scroll away from the position the animation is heading for.
      if (!ready) {
        event.preventDefault();
        return;
      }

      const stop = nextStop(PAGING_KEYS[event.key]);
      if (stop === undefined) return;

      event.preventDefault();
      ready = false;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      window.scrollTo({ top: stop, behavior: reduced ? "auto" : "smooth" });

      // Snapping is left alone through this. It used to be switched off for the
      // duration of the scroll, back when the wheel was handled here and a
      // momentum tail could drift the page off the target as it landed; with
      // the wheel native there is nothing to drift, the target *is* a snap
      // position, and switching mandatory snapping off and on mid-scroll is
      // itself a jump.
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        ready = true;
      }, SETTLE_MS);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(settle);
    };
  }, []);

  return null;
}
