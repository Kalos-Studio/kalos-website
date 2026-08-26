"use client";

import { useEffect, useRef, useState } from "react";
import { workLabel } from "./content";

/**
 * The work rail: an index of the case studies that reports where you are.
 *
 * Active state comes from an IntersectionObserver rather than arithmetic on a
 * scroll handler. The root is shrunk to a thin band across the middle of the
 * window (`rootMargin`), so "active" means the panel crossing the centre of the
 * screen — which is also where the scroll snapping parks it.
 *
 * The last active pill is never cleared, only replaced. There are gaps between
 * panels where nothing is in the band, and blanking the rail there would make it
 * flicker on every gap.
 */

// -45% top and bottom leaves a 10%-tall band through the middle of the viewport.
// Wide enough that a panel always crosses it, narrow enough that only one does.
const CENTRE_BAND = "-45% 0px -45% 0px";

/* Dock magnification.
 *
 * The pill under the cursor grows most and its neighbours grow progressively
 * less, so the rail bulges around the pointer rather than one pill popping on
 * its own. That taper is the whole effect — without it this is just :hover.
 *
 * RADIUS is how far the influence reaches, in pixels of vertical distance from
 * the cursor. Roughly two pills and the gaps between them, so two either side
 * react and the fourth is untouched.
 *
 * BOOST is how much the pill directly under the cursor grows, and it is small on
 * purpose. A Dock icon is a small square in a row with room to expand into; a
 * pill here is nearly as wide as its column, so the same percentage buys a lot
 * of width and almost no height. At 0.22 the column stopped reading as a
 * magnification and started reading as pills of inconsistent width. Nine per
 * cent is felt rather than seen, which is what this should be.
 *
 * The falloff is a raised cosine rather than linear. Linear gives the bulge a
 * visible corner at the cursor and a hard edge where the influence stops; the
 * cosine arrives and leaves at zero slope, which is what makes it read as a wave.
 */
const DOCK_RADIUS = 130;
const DOCK_BOOST = 0.09;

function dockScale(distance) {
  if (distance >= DOCK_RADIUS) return 1;
  const falloff = 0.5 * (1 + Math.cos((Math.PI * distance) / DOCK_RADIUS));
  return 1 + DOCK_BOOST * falloff;
}

export default function WorkRail({ items }) {
  const [active, setActive] = useState(null);
  const navRef = useRef(null);
  const listRef = useRef(null);
  const itemRefs = useRef([]);

  // Centring a sticky element is not a transform job.
  //
  // `-translate-y-1/2` was the first attempt and it was wrong: a transform
  // applies always, not only once the element is stuck, so it lifted the rail by
  // half its height at rest too and moved a resting position that was correct.
  //
  // What is actually wanted is for the resting position to stay exactly where
  // the grid puts it, and for the *stuck* position to be centred. That is the
  // `top` offset, and the right value is half the leftover space — which needs
  // the rail's own height, so it is measured rather than guessed.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const measure = () => {
      const leftover = window.innerHeight - nav.offsetHeight;
      // Never negative: on a short window the rail is taller than the viewport
      // and the best it can do is start at the top.
      nav.style.setProperty("--rail-sticky-top", `${Math.max(leftover / 2, 0)}px`);
    };

    measure();

    // The rail's height changes with the pill font size, which is fluid.
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Dock magnification, pointer-driven.
  //
  // Written straight to the DOM in a rAF rather than held in state: this fires on
  // every pointer move, and re-rendering eight list items sixty times a second to
  // change a transform is work React should never be asked to do.
  //
  // The transform goes on the <li>, not the <a>. That keeps it clear of the
  // link's own active-state scale and colour transition -- the two compose
  // instead of fighting over one property -- and it means the magnification has
  // no transition of its own, so it tracks the cursor exactly. A transition here
  // would lag the pointer and feel like syrup.
  useEffect(() => {
    const list = listRef.current;
    const nav = navRef.current;
    if (!list || !nav) return;

    // Vertical column only. Below lg the rail is a horizontal strip and this
    // would need to run on the other axis; not worth it for a pointer effect on
    // a layout that is mostly touched.
    const isColumn = window.matchMedia("(min-width: 1024px)");
    // Someone who asked for less motion should not get a rail that breathes.
    const stillness = window.matchMedia("(prefers-reduced-motion: reduce)");

    let queued = false;
    let pointerY = null;

    const clear = () => {
      for (const el of itemRefs.current) {
        if (el) el.style.transform = "";
      }
    };

    const draw = () => {
      if (pointerY === null || !isColumn.matches || stillness.matches) {
        clear();
        return;
      }
      // offsetTop and offsetHeight are layout values, unaffected by the
      // transform this is about to write. Measuring rects instead would feed
      // each pill's own scale back into the next frame's distance.
      const navTop = nav.getBoundingClientRect().top;
      for (const el of itemRefs.current) {
        if (!el) continue;
        const centre = navTop + el.offsetTop + el.offsetHeight / 2;
        el.style.transform = `scale(${dockScale(Math.abs(pointerY - centre))})`;
      }
    };

    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        draw();
      });
    };

    const onMove = (event) => {
      pointerY = event.clientY;
      schedule();
    };

    const onLeave = () => {
      pointerY = null;
      schedule();
    };

    list.addEventListener("pointermove", onMove);
    list.addEventListener("pointerleave", onLeave);

    // Both queries need watching, or a pill can be left scaled with no event
    // able to reset it: dropping below lg turns the rail into a horizontal strip
    // where pointerleave never fires, so a transform applied at desktop width
    // would simply stay.
    isColumn.addEventListener("change", onLeave);
    stillness.addEventListener("change", onLeave);

    return () => {
      list.removeEventListener("pointermove", onMove);
      list.removeEventListener("pointerleave", onLeave);
      isColumn.removeEventListener("change", onLeave);
      stillness.removeEventListener("change", onLeave);
      clear();
    };
  }, []);

  useEffect(() => {
    // Placeholders included: they have a framed slot in the run now, so the rail
    // has to track them or it would go stale while one is on screen.
    const panels = items
      .map((item) => document.getElementById(`case-${item.slug}`))
      .filter(Boolean);

    if (!panels.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id.replace("case-", ""));
          }
        }
      },
      { rootMargin: CENTRE_BAND, threshold: 0 },
    );

    panels.forEach((panel) => observer.observe(panel));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      ref={navRef}
      aria-label="Case studies"
      className={
        // Below lg: a horizontal strip stuck to the top, because a 9.4% column
        // would be 37px wide on a phone.
        // top-14, not top-0: the hero's masthead is fixed across the top of the
        // window and the flying mark lands in it, so a rail stuck at 0 would have
        // the mark drawn straight over its label on a phone.
        "sticky top-14 z-10 flex flex-col gap-4 self-start bg-white py-3 " +
        // From lg: the column the wireframe draws. It rests exactly where the
        // grid puts it, rides up with the page, and once it would pass the
        // sticky offset it holds there — vertically centred, because that offset
        // is half the leftover space (see the effect above). The fallback of 2rem
        // only applies for the frame before the measurement lands.
        "lg:top-[var(--rail-sticky-top,2rem)] lg:col-start-2 lg:row-start-1 lg:items-end lg:bg-transparent lg:py-0"
      }
    >
      <p className="text-lead tracking-tight">{workLabel}</p>

      <ul
        ref={listRef}
        className="flex w-full flex-row gap-2 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:gap-4 lg:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <li
            key={item.slug}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            // Grows leftward, so the rail's right edge stays put while the bulge
            // moves through it.
            className="shrink-0 lg:w-full lg:origin-right"
          >
            {/* Every pill is drawn the same, the not-yet-written one included.
                It has a slot on this page and scrolls to it like the rest; the
                only thing it lacks is a /work page, and dressing it up as
                provisional made the rail look broken rather than honest. */}
            <a
              href={`#case-${item.slug}`}
              aria-current={active === item.slug ? "true" : undefined}
              className={
                "flex h-9 items-center justify-center whitespace-nowrap rounded-full border border-black px-4 text-control tracking-tight " +
                // Colour only. All the scaling belongs to the dock effect on the
                // <li>; giving the active pill its own scale meant the two
                // multiplied, and the pill under the cursor reached 1.28.
                "transition-colors duration-200 lg:h-11 lg:w-full lg:px-0 " +
                // Active is the loudest thing in the rail, because it is the one
                // answering "where am I". Hover is quieter than it.
                (active === item.slug
                  ? "bg-black text-white"
                  : "bg-transparent text-black hover:bg-neutral-200")
              }
            >
              {item.shortName}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
