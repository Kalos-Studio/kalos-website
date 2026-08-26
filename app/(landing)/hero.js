"use client";

import { useCallback, useEffect, useRef } from "react";
import { LOCKUP_GEOMETRY, Mark, Wordmark } from "../lockup";
import BookACall from "./book-a-call";
import { definition, positioning } from "./content";

/**
 * The hero, and its handover to the masthead.
 *
 * Three beats, in the order they read:
 *
 *   1. The left block -- symbol, wordmark, term, definition -- rises with the
 *      page. Nothing fades, nothing separates, and the block top right holds
 *      too. This beat is the document scrolling; there is no animation in it.
 *   2. The block reaches the top and *stays there* while you keep scrolling.
 *      Only now does anything fade, and everything goes at once: the wordmark,
 *      the term, the definition, and the positioning line and button top right.
 *   3. Across that same held stretch the symbol alone leaves the block and moves
 *      into the masthead, where it stays.
 *
 * Beat 2 is the whole reason this file is more than a fade. With nowhere to
 * hold, the block reaches the top and immediately keeps going, so the fade has
 * to start early to happen at all -- which is what made an earlier version look
 * like it was dissolving on the way up rather than arriving and then leaving.
 *
 * It is held with a transform, not `position: fixed`. Fixed would take the block
 * out of flow and collapse the hero under it, so the page would jump the instant
 * it caught; a transform is invisible to layout. The block is translated down by
 * exactly as much as the page has scrolled past the catch point, which leaves it
 * sitting still on screen while everything else keeps moving.
 *
 * The work section scrolls up underneath during that stretch, which is the point
 * -- the hero dissolves as the work arrives, rather than the two taking turns.
 *
 * A switcher used to sit here offering a pinned variant, where the whole hero
 * was held and the rise was animated rather than scrolled. Free scrolling won:
 * the rise reads better as the page actually moving, and pinning the entire hero
 * meant a stretch where the scrollbar moved and nothing did.
 */

// How close to the top of the window the block gets before it catches. Roughly
// the masthead's own height, so the symbol lands in it rather than passing
// through it.
const HEADROOM = 72;

// The hold has to be over before the first case study can snap into place, or
// the page comes to rest with the hero half faded on top of the work -- measured
// at 0.26 opacity before this was derived rather than picked.
//
// So the runway is not a fixed length. It is a fraction of the distance between
// the block catching and the first panel reaching its snap position, which keeps
// the two from colliding at any viewport rather than at the one it was tuned on.
// The ceiling stops it becoming a marathon on a short page; the floor stops it
// vanishing on a tall one.
const RUNWAY_OF_AVAILABLE = 0.85;
const RUNWAY_MAX = 0.45; // of the window
const RUNWAY_MIN = 0.15; // of the window

// The fade finishes before the hold does, so the block is gone before it starts
// moving again. Releasing something mid-fade reads as a glitch.
const FADE_COMPLETE_AT = 0.8;

const clamp01 = (n) => Math.min(Math.max(n, 0), 1);

/**
 * Draws the flying symbol for the current frame.
 *
 * It is `position: fixed` at the origin and only ever has its transform written,
 * so it never participates in layout. An invisible anchor holds its place inside
 * the block and an invisible slot marks the masthead target; both are measured
 * every frame.
 *
 * Measuring every frame sounds wasteful and is not: getBoundingClientRect on an
 * untransformed element is cheap, and it means scroll, resize, font swap and
 * reflow are all handled without a listener for any of them. It is also what
 * makes beats 1 and 2 free -- while `progress` is 0 the symbol simply tracks its
 * anchor, so it rides up inside the block and then sits still with it, with no
 * special case for either.
 */
function drawFlight(el, anchor, slot, progress) {
  if (!el || !anchor || !slot) return;

  const a = anchor.getBoundingClientRect();
  const s = slot.getBoundingClientRect();
  if (!a.width || !s.width) return;

  const x = a.left + (s.left - a.left) * progress;
  const y = a.top + (s.top - a.top) * progress;
  const scale = (a.width + (s.width - a.width) * progress) / a.width;

  el.style.width = `${a.width}px`;
  el.style.height = `${a.height}px`;
  el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
}

export default function Hero() {
  const fadeRef = useRef(null);
  const sentinelRef = useRef(null);
  const blockRef = useRef(null);
  // The first case study panel, whose snap position bounds the hold. Looked up
  // once rather than per frame -- it is the only thing here the hero needs from
  // the rest of the page.
  const firstPanelRef = useRef(null);

  const markAnchorRef = useRef(null);
  const markSlotRef = useRef(null);
  const markRef = useRef(null);

  const frame = useCallback(() => {
    const sentinel = sentinelRef.current;
    const block = blockRef.current;
    if (!sentinel || !block) return;

    // The sentinel is a zero-height sibling immediately above the block and is
    // never transformed, so its top is the block's *natural* position. Reading
    // the block's own rect instead would feed the hold offset back into itself
    // and the block would run away up the page.
    const naturalTop = sentinel.getBoundingClientRect().top;

    const vh = window.innerHeight;

    // How much room there is between the catch and the first panel's snap
    // position. Both are document coordinates, so this is independent of where
    // the page currently is.
    const panel = firstPanelRef.current;
    let available = vh * RUNWAY_MAX;
    if (panel) {
      const pr = panel.getBoundingClientRect();
      const panelSnapY = pr.top + window.scrollY + pr.height / 2 - vh / 2;
      available = panelSnapY - (naturalTop + window.scrollY - HEADROOM);
    }

    const runway = Math.max(
      Math.min(available * RUNWAY_OF_AVAILABLE, vh * RUNWAY_MAX),
      vh * RUNWAY_MIN,
    );
    // How far past the catch point the page has scrolled, as a fraction of the
    // runway. Zero before the block arrives, one once the handover is done and
    // it is released to scroll away with everything else.
    const held = clamp01((HEADROOM - naturalTop) / runway);

    block.style.transform = `translate3d(0, ${held * runway}px, 0)`;

    if (fadeRef.current) {
      const fade = clamp01(held / FADE_COMPLETE_AT);
      fadeRef.current.style.setProperty("--hero-fade", String(1 - fade));
    }

    drawFlight(markRef.current, markAnchorRef.current, markSlotRef.current, held);
  }, []);

  useEffect(() => {
    let queued = false;

    const onScroll = () => {
      // Coalesce to one write per frame: a scroll event can fire many times
      // between paints and each of these does layout reads.
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        frame();
      });
    };

    firstPanelRef.current = document.querySelector('[id^="case-"]');

    // Once on mount, so a reload partway down the page draws the correct state
    // instead of starting at the top and jumping.
    frame();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // Space Grotesk arriving changes the block's height, which moves the catch
    // point.
    document.fonts?.ready?.then(frame).catch(() => {});

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [frame]);

  const { markWidth, wordmarkWidth, gapWidth, height } = LOCKUP_GEOMETRY;
  const markAspect = `${markWidth} / ${height}`;
  const wordmarkAspect = `${wordmarkWidth} / ${height}`;
  const lockupHeight = "clamp(2.5rem, 5vw, 5.25rem)";

  return (
    <>
      {/* The masthead the hero hands over to. Always in the DOM and always
          fixed; the slot draws nothing, it exists to be measured so the flying
          symbol knows where it is going. pointer-events-none because there is
          nothing interactive in here -- the call to action stays in the hero and
          fades with it. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 mx-auto flex w-full max-w-[120rem] items-center px-5 py-4 sm:px-8 lg:px-12 lg:py-6 xl:px-24">
        <div
          ref={markSlotRef}
          aria-hidden="true"
          className="h-7 lg:h-9"
          style={{ aspectRatio: markAspect }}
        />
      </div>

      {/* The flying symbol, positioned entirely by transform (see drawFlight).
          Rendered outside the fading content so the fade never touches it, and
          zero-sized until the first frame writes real dimensions -- a fixed box
          with no size gives the SVG an indefinite containing block, and a ~300px
          mark would sit over the hero until hydration. */}
      <div
        ref={markRef}
        style={{ width: 0, height: 0 }}
        className="pointer-events-none fixed left-0 top-0 z-50 origin-top-left text-black will-change-transform"
      >
        <Mark className="h-full w-full" />
      </div>

      {/* The fade lives on the header rather than on each child, so everything
          inside goes together and there is one place to change the timing. */}
      <header
        ref={fadeRef}
        className="flex min-h-[88svh] flex-col justify-between pb-4 lg:pb-6"
        style={{ opacity: "var(--hero-fade, 1)" }}
      >
        <div className="flex flex-col items-end gap-5 pt-6 sm:pt-10 lg:pt-16">
          {/* 478/1920 of the frame, which is what breaks it over two lines as
              drawn. Holds its place and its opacity for the whole of beat 1 and
              then goes with the left block. */}
          <p className="max-w-[26ch] text-right text-lead tracking-tight text-balance">
            {positioning}
          </p>

          <BookACall variant="filled" />
        </div>

        <div>
          {/* Zero-height and never transformed: this is what the hold is measured
              against. It has to sit immediately above the block with nothing
              between them. */}
          <div ref={sentinelRef} aria-hidden="true" className="h-0" />

          {/* z-30 so the block stays above the work section while it fades,
              rather than being covered by panels scrolling up underneath it. */}
          <div ref={blockRef} className="relative z-30 will-change-transform">
            {/* Symbol and wordmark at the proportions they have inside the full
                lockup: both take the row's height, so their widths follow their
                viewBoxes and the gap between them is the lockup's own. */}
            <div
              className="flex items-center"
              style={{
                height: lockupHeight,
                gap: `calc(${gapWidth} / ${height} * ${lockupHeight})`,
              }}
            >
              <div
                ref={markAnchorRef}
                className="h-full shrink-0"
                style={{ aspectRatio: markAspect }}
              />
              <div
                className="h-full shrink-0 text-black"
                style={{ aspectRatio: wordmarkAspect }}
              >
                <Wordmark className="h-full w-full" />
              </div>
            </div>

            <h1
              className="mt-5 text-display font-medium tracking-tight lg:mt-8"
              // Stylistic sets the brand file carries on this line.
              style={{ fontFeatureSettings: '"salt" 1, "ss01" 1, "ss04" 1' }}
            >
              {definition.term}
            </h1>

            <p className="mt-4 max-w-[52ch] text-lead tracking-tight lg:mt-6">
              {definition.detail}
            </p>
          </div>
        </div>
      </header>
    </>
  );
}
