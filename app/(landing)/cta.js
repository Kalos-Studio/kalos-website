"use client";

import { useCallback, useEffect, useRef } from "react";
import { booking, cta } from "./content";

// month_view is the classic booker: month calendar beside a column of times, and
// it sits at modal size. week_view, which the original snippet asked for, is the
// full seven-day grid and needs most of the screen, so the modal opened close to
// full bleed. useSlotsViewOnSmallScreen means a phone collapses to a slot list
// either way, so this only changes desktop.
const CAL_CONFIG = {
  layout: "month_view",
  useSlotsViewOnSmallScreen: "true",
  theme: "dark",
};

/**
 * The page's only call to action, in its only styling.
 *
 * One primary action and no competing buttons is a brief-level rule, so this is
 * a component rather than a class: every instance is the same element with the
 * same label, and adding a second, different button means editing this file and
 * noticing that you are doing it.
 *
 * It is an anchor pointing at the real Cal.com page, and the click is taken over
 * in JavaScript to open the embed instead. That ordering is deliberate: if the
 * embed is blocked, still loading, or fails outright, the link goes somewhere
 * that books a call. A <button> in the same situation is an inert control on the
 * one element the whole page exists to get clicked.
 *
 * The click is handled explicitly rather than through Cal's `data-cal-link`
 * attributes, which is their documented approach and did not work here: the
 * embed loaded, `Cal.ns.intro` existed, and the click still navigated away
 * instead of opening the modal, so its binding never caught the element.
 * Calling `modal` ourselves is one line, and it is testable.
 */
export default function CallToAction({ className = "" }) {
  const api = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Imported here rather than at the top of the file so the embed lands in
      // its own chunk, fetched after hydration, instead of in the page's initial
      // JavaScript. Worth about 1kB of First Load rather than the whole embed.
      const { getCalApi } = await import("@calcom/embed-react");
      const cal = await getCalApi({ namespace: booking.namespace });
      if (cancelled) return;

      cal("ui", {
        theme: "dark",
        // The modal takes the brand rather than Cal's default. `cal-brand` is
        // what it uses for its own accents, so it gets Snow White on dark and
        // Obsidian Black on light, matching the tokens in globals.css.
        cssVarsPerTheme: {
          light: { "cal-brand": "#040406" },
          dark: { "cal-brand": "#F5FEFD" },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });

      api.current = cal;
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const onClick = useCallback((event) => {
    // Let the browser have the ones it should own: new tab, new window, save.
    // Hijacking a cmd-click into a modal is the kind of thing that makes a link
    // feel broken.
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    // Not ready yet: fall through to the href rather than swallow the click.
    if (!api.current) return;

    event.preventDefault();
    api.current("modal", { calLink: booking.link, config: CAL_CONFIG });
  }, []);

  return (
    <a
      className={`ln-cta ${className}`}
      href={`https://cal.com/${booking.link}`}
      onClick={onClick}
    >
      {cta.label}
    </a>
  );
}
