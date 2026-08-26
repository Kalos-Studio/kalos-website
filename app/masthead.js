"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Lockup from "./(landing)/lockup";
import Menu from "./menu";
import "./masthead.css";

// Where the fade starts, and how long it runs when nothing is coming for it.
//
// The hold is not decoration. A rubber-band bounce on iOS and a stray tick of
// wheel movement both count as scrolling, and neither is the reader deciding to
// move down the page — the scroll cue on the hero holds 24px for the same
// reason. 32 is a little more than that, because dimming the logo is a bigger
// gesture than taking a chevron away, and not much more.
//
// Neither number decides where the fade ends any more. That is measured off the
// page — see clashAt below — because a distance typed here cannot know how far
// the headline under the row happens to be from it: 80 and 400 put the whole
// fade across the first half-screen, 32 and 200 finished it 200px in, and both
// left the lockup lit while "Selected work" slid under it. These are the
// fallback for a page with no heading to measure, and the longest the fade is
// ever allowed to run.
const FADE_HOLD_PX = 32;
const FADE_OVER_PX = 168;

// How close the page's first line may come to the bottom of the row before the
// row has to be gone. Small on purpose: it is the gap at the moment the fade
// completes, not a gap anyone sees held.
const FADE_CLEAR_PX = 12;

// The fade never finishes sooner than this, whatever the measurement says. A
// heading that starts underneath the row — a short viewport, a deep link that
// restores mid-page — would otherwise compute a negative end and take the
// masthead away before the first pixel of scroll.
const FADE_MIN_PX = 24;

// And the hold gives way when the page is tight. /work leaves about 56px
// between the bottom of the lockup and the top of its headline, so a fixed 32px
// hold would spend more than half the available run standing still and then cut
// rather than fade. A share of whatever room there is keeps the fade a fade at
// every width; where there is room, FADE_HOLD_PX still caps it.
const FADE_HOLD_SHARE = 0.3;

// The nearest ancestor that actually scrolls.
//
// Every page here scrolls inside an element rather than the document —
// .landing-root on the homepage and /about, .work-root on /work — because
// globals.css takes the document's own scrolling away. Finding it by computed
// style rather than by class name means this keeps working the next time one of
// those containers is renamed.
function scrollParent(el) {
  for (let node = el?.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if (overflow === "auto" || overflow === "scroll") return node;
  }
  return null;
}

/**
 * The row across the top of every page: lockup left, menu right, both pinned to
 * the window rather than to whatever container the page happens to use.
 *
 * It renders the row and nothing about where the row sits. That is the caller's
 * job because the two cases are genuinely different: the hero wraps it in
 * .lab-header, which fixes it, holds it back until the sunrise has finished and
 * takes it away again when the mark docks into the lockup, while every other
 * page wants it present from first paint and passes .site-masthead--fixed.
 *
 * `href={null}` for the homepage. A logo linking to the page you are already on
 * is a dead control that still takes a tab stop.
 *
 * `lockupClassName` exists for one caller. On the hero the flat mark is the
 * target the 3D object flies into, and .lab-lockup .lockup-mark is what ramps it
 * to gold as the object dissolves over it. That selector is hero-specific and
 * has to stay in lab.css, so the hero passes its own class rather than the rule
 * moving somewhere it would apply to three pages that have no mark to dock.
 *
 * `fadeOnScroll` gives the pages that scroll the same exit the hero has. It is a
 * client component for that one reason, which costs the lockup's SVG a place in
 * those pages' JavaScript; the alternative was a headless child reaching up
 * through parentElement to find the row, which is worse to read for the same
 * few hundred bytes.
 */
export default function Masthead({
  className = "",
  href = "/",
  lockupClassName = "site-lockup",
  fadeOnScroll = false,
  leading = null,
}) {
  const row = useRef(null);
  // Only to retrigger the effect. /work renders this row from its layout, so it
  // survives the move from the listing into a case study: without this it keeps
  // whatever opacity the last page left it at, and it is measuring the old
  // page's headline until the next scroll event happens to arrive.
  const pathname = usePathname();

  useEffect(() => {
    const el = row.current;
    if (!fadeOnScroll || !el) return;

    const scroller = scrollParent(el);
    const offset = () => (scroller ? scroller.scrollTop : window.scrollY);

    // The page's own first line, which is the thing the row collides with.
    //
    // An h1 rather than "the first child of the scroller": every page that
    // fades has one, it is the topmost ink on all of them, and asking for the
    // element that starts highest would find the shell whose padding is the
    // clearance being measured. Anything further down the page arrives later by
    // definition, and by then the fade is over and stays over.
    //
    // Cached, and dropped when it leaves the document. /work renders the row
    // from its layout, so moving from the listing to a case study swaps the
    // heading under a masthead that never unmounts.
    let anchor = null;
    const heading = () => {
      if (!anchor?.isConnected) anchor = (scroller ?? document).querySelector("h1");
      return anchor;
    };

    // The offset at which that line would reach the bottom of the row.
    //
    // Read live on each frame rather than measured once on mount. It costs two
    // rects and it is self-correcting: a resize, a late font, an image above the
    // fold and a route change all move the heading, and none of them needs a
    // listener here to be noticed. `at + top` does not change as the page
    // scrolls, which is what makes the reading stable rather than circular.
    const clashAt = (at) => {
      const first = heading();
      if (!first) return FADE_HOLD_PX + FADE_OVER_PX;
      return (
        at +
        first.getBoundingClientRect().top -
        el.getBoundingClientRect().bottom -
        FADE_CLEAR_PX
      );
    };

    let frame = 0;
    const apply = () => {
      frame = 0;
      const at = offset();
      // Never later than the collision, never longer than FADE_OVER_PX: the
      // first is the guarantee, the second stops a page with a distant headline
      // from dragging the lockup halfway down itself at half strength.
      const end = Math.max(clashAt(at), FADE_MIN_PX);
      const start = Math.max(
        Math.min(FADE_HOLD_PX, end * FADE_HOLD_SHARE),
        end - FADE_OVER_PX,
      );
      const out = Math.min(1, Math.max(0, (at - start) / Math.max(end - start, 1)));

      // Written to the element rather than held in state, the same way the dock
      // handler in variants/solid.js writes the hero's. A re-render per frame to
      // move one number is work React should never be asked to do, and a
      // scroll-linked value that arrives a frame late stops being a function of
      // position.
      //
      // Nothing on .site-masthead transitions opacity, and nothing should start:
      // a timed fade on a scroll-driven page is only in step at the one speed it
      // was tuned at. The hero's version has to write `transition: none` inline
      // to defend against exactly that.
      el.style.opacity = out > 0 ? String(1 - out) : "";
      // An attribute rather than `visibility: hidden`, and the difference is the
      // whole of this site's navigation.
      //
      // It was visibility, to stop the faded card swallowing clicks in the
      // corner: the row is pointer-events: none but the menu inside it opts back
      // in, so opacity 0 alone leaves a live control nobody can see. What that
      // missed is that visibility also takes the element out of the tab order,
      // and this row is the only route to Work, About, Contact and home on the
      // whole site. Measured on /work at 600px of scroll: shift-tab from the
      // first card jumped straight past the masthead to the document root, so a
      // keyboard user had no way to it at all. A pointer user scrolls back up
      // and it returns; there is no equivalent gesture to scroll a page up in
      // order to reveal something you are trying to tab to.
      //
      // So it stays in the tree, the pointer-events opt-in is withdrawn while it
      // is invisible, and :focus-within brings it back the moment a tab reaches
      // it. See .site-masthead[data-faded] in masthead.css.
      el.toggleAttribute("data-faded", out >= 1);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    // Checked once on mount as well as on scroll: browser scroll restoration can
    // land someone halfway down the page before a single event fires, and the
    // masthead would be sitting there lit over content it should be gone from.
    apply();
    const target = scroller ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      target.removeEventListener("scroll", onScroll);
      el.style.opacity = "";
      el.removeAttribute("data-faded");
    };
  }, [fadeOnScroll, pathname]);

  const lockup = <Lockup className={lockupClassName} />;

  // Artwork rather than a heading: every page that uses this has its own h1
  // below, and the lockup was an h1 once already. It needs a label because the
  // SVG is decorative to a screen reader. The lockup is a link everywhere
  // except the homepage, where it would point at the page you are on.
  const wordmark = href ? (
    <Link href={href} className="site-wordmark" aria-label="Kalos, home">
      {lockup}
    </Link>
  ) : (
    lockup
  );

  return (
    <div className={`site-masthead ${className}`} ref={row}>
      {/* `leading` sits beside the lockup. /work uses it for the case study back
          control, which belongs with the chrome rather than in the page, where
          it was a lone fragment on its own line above the title. The wrapper
          only exists when a caller passes something, so the hero and /about
          keep exactly the markup they had. */}
      {leading ? (
        <div className="site-masthead-lead">
          {wordmark}
          {leading}
        </div>
      ) : (
        wordmark
      )}
      {/* A zero-height box that never changes size, so the card can grow
          without moving the lockup. See .site-menu-anchor. */}
      <div className="site-menu-anchor">
        <Menu />
      </div>
    </div>
  );
}
