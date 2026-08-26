"use client";

import { useEffect } from "react";
import { isCoarsePointer, prefersReducedMotion } from "./device";

/**
 * Keeps the page from coming to rest between the hero and the work.
 *
 * The two rest points are the top of the page and the top of the first section.
 * Everything between them is a dead zone: the dock is over at 0.55 of the hero,
 * so the last 45% of that first screen has nothing on it but ground, with a case
 * study half-risen underneath. The page commits the moment you leave a rest
 * point and carries you to the other one.
 *
 * Chosen against the gentler version, which let you scrub freely and only moved
 * the page once your gesture had ended. Both were built and put on a switch to
 * be felt rather than argued about; this one won, and the other is deleted
 * rather than kept as an option nobody will pick again.
 *
 * Renders nothing. It is behaviour, and it lives outside the hero because the
 * thing it is about — the seam between two sections — belongs to neither of them.
 *
 * Deliberately not CSS scroll-snap, which is the obvious first answer and does
 * not work here. `proximity` will not fire from the middle of a 405px gap, which
 * is exactly where the problem is. `mandatory` will, and then traps the reader
 * in the work section: it is 1526px tall against a 900px viewport and carries one
 * snap point at its start, so scrolling down inside it snaps back to the top of
 * it. Snapping needs to apply over one range of this page and CSS has no way to
 * say that.
 */

// How long the page has to be still before a gesture counts as finished.
//
// Momentum on a trackpad keeps firing scroll events long after the fingers have
// left it, so this is measuring the end of the *movement*, not of the input.
// Short enough not to feel like a delay, long enough to sit through the gaps
// between frames on a slow one.
const IDLE_MS = 140;

// Under this, the reader is close enough to an end that moving them is noise.
const NEAR_PX = 2;

// Two curves, because the two triggers start from different places.
//
// A commit takes over a page that is already moving, so it has to be moving too
// from its first frame: ease-in-out spends its opening barely going anywhere —
// 0.4% of the distance in the first tenth — and against a reader's own momentum
// that does not read as restraint, it reads as the page stalling before it does
// what you asked. A settle starts from a standstill after the gesture has
// finished, and there an ease at both ends is what stops it feeling flung.
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function ScrollSettle() {
  useEffect(() => {
    const scroller = document.querySelector(".landing-root");
    const section = document.querySelector(".ln-section");
    if (!scroller || !section) return;

    // Measured rather than assumed to be one viewport. It is one viewport today,
    // because the hero is 100dvh and the section follows it — but that is a fact
    // about the current layout, and a rest point that quietly stops matching the
    // thing it is named after is worse than no rest point.
    const restPoints = () => [
      0,
      section.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop,
    ];

    const still = prefersReducedMotion();
    // Committing means taking over the scroll while it is still moving, and on a
    // touch screen that is not possible: iOS drives momentum off the main thread
    // and overrides anything written to scrollTop underneath it. There the glide
    // waits for the movement to stop instead, which lands in the same place a
    // beat later. Not a fallback anyone will notice, but it is why the trigger is
    // conditional rather than absolute.
    const commits = !isCoarsePointer();

    let raf = 0;
    let idle = 0;
    let lastY = scroller.scrollTop;
    let heading = 1;
    // Whether the reader has actually touched the page yet.
    //
    // A scroll event is not evidence of a gesture. Browser scroll restoration
    // fires one on reload, and so does anything calling scrollIntoView — so
    // without this, reloading while parked in the dead zone yanks the page
    // somewhere the reader did not ask to go, which is exactly the behaviour
    // this component is supposed to be the polite version of. "Once you start
    // scrolling" means input, so input is what is listened for.
    let touched = false;
    // Which way a running glide is going, so an input can be told apart from a
    // reader changing their mind.
    let bearing = 0;

    const running = () => raf !== 0;

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      bearing = 0;
    };

    const glideTo = (target) => {
      stop();
      const from = scroller.scrollTop;
      const distance = Math.abs(target - from);
      if (distance < NEAR_PX) return;

      // Reduced motion gets the correction without the travel. The flight is
      // scroll-driven, so this does mean the mark is not seen to fly — which is
      // the right trade: this movement is the page moving itself, which is
      // exactly the thing that setting is about.
      if (still) {
        scroller.scrollTop = target;
        return;
      }

      // Long enough to read as the page carrying you, short enough that a reader
      // who has decided to move on is not made to wait. Scaled by distance so a
      // short correction near an end is not given the same ceremony as the full
      // screen.
      //
      // Slower than it was — a full screen took 700ms and read as a jump rather
      // than a movement. The lengthening goes into the tail, not the start: the
      // curve is what makes it grab immediately, and the two are independent, so
      // this can be slowed as far as it wants to go without ever going back to
      // feeling like it hesitates.
      const ms = Math.min(1050, 420 + distance * 0.62);
      const curve = commits ? easeOutCubic : easeInOutCubic;
      bearing = Math.sign(target - from);
      const started = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - started) / ms);
        scroller.scrollTop = from + (target - from) * curve(t);
        if (t < 1) {
          raf = requestAnimationFrame(step);
          return;
        }
        // Landed exactly, not on whatever the easing's last frame rounded to:
        // the rest points are also where the snap decides to leave you alone,
        // and being a pixel short of one means the next flick re-triggers it.
        scroller.scrollTop = target;
        raf = 0;
        bearing = 0;
      };
      raf = requestAnimationFrame(step);
    };

    const settle = () => {
      idle = 0;
      if (running()) return;
      const [top, bottom] = restPoints();
      const y = scroller.scrollTop;
      if (y <= top + NEAR_PX || y >= bottom - NEAR_PX) return;
      // Where they were going, not which end is closer. Nearest sends someone
      // who has scrolled two thirds of the way down back to the hero, which
      // undoes a decision rather than completing one.
      glideTo(heading >= 0 ? bottom : top);
    };

    const onScroll = () => {
      // Our own writes come back through here. Nothing to decide about them.
      if (running()) return;
      if (!touched) {
        lastY = scroller.scrollTop;
        return;
      }

      const y = scroller.scrollTop;
      if (y !== lastY) heading = y > lastY ? 1 : -1;
      lastY = y;

      if (commits) {
        const [top, bottom] = restPoints();
        if (y > top + NEAR_PX && y < bottom - NEAR_PX) {
          glideTo(heading >= 0 ? bottom : top);
          return;
        }
      }

      // The idle settle is the backstop, and on a touch screen the only trigger
      // there is. A reader who grabs the page mid-glide cancels it, and without
      // this they would be left standing in the dead zone the glide existed to
      // get them out of.
      clearTimeout(idle);
      idle = setTimeout(settle, IDLE_MS);
    };

    // Deliberate input abandons the glide, with one exception that is most of
    // what "commit" means.
    //
    // A flick is not one event, it is a stream of them, and every one of them was
    // cancelling the glide and letting the next scroll start a fresh one from a
    // standstill. For the length of the gesture the page barely moved — which is
    // the second half of the sitting-for-a-second, and the half that no easing
    // would have fixed. A wheel going the same way as the glide is the reader
    // agreeing with it, so it is left alone; only a gesture that opposes it, or
    // one whose direction cannot be known, hands control back.
    //
    // The line this holds: at no point can a reader be pushing against the page
    // and not win.
    const onInput = (event) => {
      touched = true;
      if (!running()) return;
      if (
        commits &&
        event.type === "wheel" &&
        Math.sign(event.deltaY || 0) === bearing
      ) {
        return;
      }
      stop();
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("wheel", onInput, { passive: true });
    scroller.addEventListener("touchstart", onInput, { passive: true });
    // Dragging the scrollbar produces neither a wheel nor a touch, only scroll
    // events, so without this the one input that cannot be felt as a gesture is
    // also the one that never settles.
    scroller.addEventListener("pointerdown", onInput, { passive: true });
    window.addEventListener("keydown", onInput);

    return () => {
      stop();
      clearTimeout(idle);
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("wheel", onInput);
      scroller.removeEventListener("touchstart", onInput);
      scroller.removeEventListener("pointerdown", onInput);
      window.removeEventListener("keydown", onInput);
    };
  }, []);

  return null;
}
