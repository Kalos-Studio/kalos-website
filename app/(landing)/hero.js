"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { LOCKUP_GEOMETRY, Mark, Wordmark } from "../lockup";
import BookACall from "./book-a-call";
import { definition, positioning, workLabel } from "./content";

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

// The hold is bounded by the first case study, not by taste.
//
// While the block is held at the top, the work is scrolling up towards it. The
// block has to be gone before the first panel reaches it, or the definition sits
// over a photograph -- which at any opacity above zero reads as a mistake. So the
// runway is derived: it ends when the panel's top would arrive at the block's
// bottom, less a clearance.
//
// Tuning this by eye produced the version before it, which measured 11px of
// clearance at 0.14 opacity. That did not technically overlap, and would have on
// the first viewport that wrapped the definition onto another line.
const CLEARANCE = 96; // px kept between the block's bottom and the panel's top
const RUNWAY_MAX = 0.45; // of the window, so it never becomes a marathon

// The fade finishes before the hold does, so the block is gone before it starts
// moving again. Releasing something mid-fade reads as a glitch.
const FADE_COMPLETE_AT = 0.8;

const clamp01 = (n) => Math.min(Math.max(n, 0), 1);

// Clicking the masthead mark returns to the hero.
//
// Only the plain left click is intercepted; everything else falls through to the
// href, so a modified click still opens the site in a new tab and a visitor
// without JavaScript still gets a working link.
function backToHero(event) {
  if (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  ) {
    return;
  }
  event.preventDefault();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  // Drop any #case- fragment the rail left in the URL, so a reload comes back to
  // the top rather than jumping to whichever case study was last looked at.
  history.replaceState(null, "", "/");
}

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
function drawFlight(el, anchor, slot, progress, baseWidth) {
  if (!el || !anchor || !slot || !baseWidth) return;

  const a = anchor.getBoundingClientRect();
  const s = slot.getBoundingClientRect();
  if (!a.width || !s.width) return;

  const width = a.width + (s.width - a.width) * progress;

  // Only the transform is written, never width or height.
  //
  // Setting those every frame made the mark shimmer: each write forces a layout
  // of this element on every scroll frame, and the SVG is re-rasterised at a
  // fractionally different size each time. Sizing it once and scaling it with a
  // transform keeps it a single composited layer that is never re-laid-out, so
  // it holds still.
  //
  // Translation is rounded to whole pixels for the same reason: at fractional
  // offsets the mark lands between the device grid and its edges crawl as the
  // subpixel coverage changes. Scale is quantised for the same reason -- a
  // rounding wobble in the fourth decimal is invisible as a number and visible
  // as a twitch.
  const x = Math.round(a.left + (s.left - a.left) * progress);
  const y = Math.round(a.top + (s.top - a.top) * progress);
  const scale = Math.round((width / baseWidth) * 1000) / 1000;

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
  // The mark's rendered size, set once. See drawFlight for why it is not written
  // per frame.
  const markBaseRef = useRef(0);

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
    const catchY = naturalTop + window.scrollY - HEADROOM;

    // Where the first panel's top would meet the held block's bottom. All in
    // document coordinates, so it does not matter where the page currently is --
    // and the block's height is unaffected by the translate written below, so
    // reading it back here is safe.
    const panel = firstPanelRef.current;
    let available = vh * RUNWAY_MAX;
    if (panel) {
      const blockHeight = block.getBoundingClientRect().height;
      const panelTopY = panel.getBoundingClientRect().top + window.scrollY;
      available = panelTopY - HEADROOM - blockHeight - CLEARANCE - catchY;
    }

    // Clamped by what the geometry allows, never floored above it.
    //
    // The floor used to win when `available` was small, which is precisely the
    // case below lg: the 35svh that buys the hold its room is an lg-only class,
    // so on a phone the runway was longer than the distance to the first panel
    // and the fade did not finish in time. Measured at 36px of clearance on a
    // 390-wide window, against the 96 this is supposed to keep -- the same
    // failure the derivation was written to prevent, just at a width nothing
    // was testing. A short hold is fine; an overlapping one is not.
    const runway = Math.min(Math.max(available, 0), vh * RUNWAY_MAX);
    // How far past the catch point the page has scrolled, as a fraction of the
    // runway. Zero before the block arrives, one once the handover is done and
    // it is released to scroll away with everything else.
    const held = clamp01((HEADROOM - naturalTop) / runway);

    block.style.transform = `translate3d(0, ${held * runway}px, 0)`;

    if (fadeRef.current) {
      const fade = clamp01(held / FADE_COMPLETE_AT);
      const value = String(1 - fade);
      fadeRef.current.style.setProperty("--hero-fade", value);
      // Also on the root, so anything outside the fading block can move with
      // it. The masthead's "Our Work" label uses the inverse: it has to stay
      // out of the way while the hero's own top-right block is still there,
      // and arrive exactly as that leaves.
      document.documentElement.style.setProperty("--hero-fade", value);
    }

    drawFlight(
      markRef.current,
      markAnchorRef.current,
      markSlotRef.current,
      held,
      markBaseRef.current,
    );
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

    // Size the mark once from its anchor. Re-measured on resize and after the
    // font lands, both of which change the lockup's height.
    const sizeMark = () => {
      const anchor = markAnchorRef.current;
      const mark = markRef.current;
      if (!anchor || !mark) return;
      const { width, height } = anchor.getBoundingClientRect();
      if (!width) return;
      markBaseRef.current = width;
      mark.style.width = `${width}px`;
      mark.style.height = `${height}px`;
    };
    sizeMark();

    // Once on mount, so a reload partway down the page draws the correct state
    // instead of starting at the top and jumping.
    frame();

    const onResize = () => {
      sizeMark();
      onScroll();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // Space Grotesk arriving changes the block's height, which moves the catch
    // point.
    document.fonts?.ready?.then(onResize).catch(() => {});

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
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
          symbol knows where it is going. The bar is transparent to clicks -- the
          call to action stays in the hero and fades with it -- and the mark
          re-enables them on itself, because it is the way back to the top.

          The white ground is not decoration. This bar was transparent, so the
          case study panels scrolled visibly under the symbol on their way up the
          page. It is painted on an outer full-bleed element rather than on the
          padded column, because the column is capped at 120rem and past that
          width the bar would have had clear gutters either side.

          It fades in rather than being white from the start, on the inverse of
          the hero's own fade -- the same value the label below uses. A bar that
          is opaque at scroll 0 covers the top of the hero's positioning line,
          which sits under it by design; there is nothing to hide up there
          anyway, since the only thing behind it is the hero. By the time a panel
          reaches the top of the window the hero has gone and this is solid. */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-40 pb-6 lg:pb-10"
        style={{
          // A gradient rather than a flat fill, so the bar has no bottom edge.
          //
          // Flat, it ended in a hard line across the page and every panel
          // scrolling under it was visibly clipped by a rectangle. Fading the
          // last stretch to nothing means content passes out of view instead of
          // being cut off, which is the whole job of a bar like this.
          //
          // The alpha is the same `1 - var(--hero-fade)` the flat fill used, so
          // the bar still arrives as the hero leaves rather than sitting over it
          // at the top of the page. Carried on every stop so the fade tracks it.
          backgroundImage:
            "linear-gradient(to bottom," +
            " rgb(255 255 255 / calc(1 - var(--hero-fade, 1))) 0%," +
            " rgb(255 255 255 / calc(1 - var(--hero-fade, 1))) 55%," +
            " rgb(255 255 255 / calc((1 - var(--hero-fade, 1)) * 0.6)) 78%," +
            " rgb(255 255 255 / 0) 100%)",
        }}
      >
        <div className="mx-auto flex w-full max-w-[120rem] items-center justify-between px-5 py-4 sm:px-8 lg:px-12 lg:py-6 xl:px-24">
          <div
            ref={markSlotRef}
            aria-hidden="true"
            className="h-7 lg:h-9"
            style={{ aspectRatio: markAspect }}
          />

          {/* Below lg the rail is a horizontal strip and its label cost a whole
              line above the pills, on a viewport that has none to spare. Up here
              it sits in space the symbol was not using. From lg the rail is a
              column with room for its own label, so this hides.

              The opacity is the inverse of the hero's fade: at the top of the
              page the hero's own positioning line and call to action are in this
              corner, and this would sit on top of them. It arrives as they go. */}
          <p
            className="text-lead tracking-tight lg:hidden"
            style={{ opacity: "calc(1 - var(--hero-fade, 1))" }}
          >
            {workLabel}
          </p>
        </div>
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
        {/* The mark is the way back to the top, the same way it is the way home
            from a case study. pointer-events-auto because the layer above it is
            deliberately transparent to clicks; this is the one thing in it that
            is not.

            A real link rather than a button: it works with JavaScript off,
            cmd-click opens the site in a tab, and the handler below only takes
            over the plain left click. On this page "/" is where we already are,
            so the handler turns that navigation into a scroll rather than
            letting the router re-render the page to reach the top of it.

            next/link rather than a bare <a>, because eslint's
            no-html-link-for-pages is right: this is an internal route, and a raw
            anchor would give up client-side navigation for everyone whose click
            the handler does not intercept. */}
        <Link
          href="/"
          onClick={backToHero}
          aria-label="Kalos, back to top"
          className="pointer-events-auto block h-full w-full"
        >
          <Mark className="h-full w-full" />
        </Link>
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
