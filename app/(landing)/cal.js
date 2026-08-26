"use client";

import { useCallback, useEffect, useRef } from "react";
import { booking } from "./content";

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
 * Opens the booking modal, for anything that should open the booking modal.
 *
 * This was inline in cta.js while the page's call to action was the only thing
 * that booked a call. The menu's Contact item is the second, and it went out
 * first as a plain link to cal.com on the reasoning that the brief allows one
 * primary action: wrong reading. The rule is about not growing a second
 * competing *button*, and a nav item that opens the same modal is not competing
 * with the call to action, it is the same action reached from the menu. A link
 * that leaves the site to do what a button on the same site already does is just
 * worse.
 *
 * `enabled` is when to start loading the embed, and it is not always true.
 * Mounting the hook fetches Cal's script, and the menu is on every page now, so
 * an eager load would pull an external script onto /work and every case study
 * for a link almost nobody clicks. The menu passes its own open state instead:
 * the embed starts loading when the panel opens, which is a second or two of
 * head start on the click that might follow, and if the click wins that race the
 * href underneath still books a call.
 *
 * Which is the same reason this returns a click handler for an <a> rather than
 * something to hang on a <button>. Every caller must be a real link to the real
 * booking page. If the embed is blocked, still loading or fails outright, the
 * click falls through to a URL that works.
 */
export function useCalModal({ enabled = true } = {}) {
  const api = useRef(null);

  useEffect(() => {
    // Already loaded: the menu closing and reopening must not re-run this.
    if (!enabled || api.current) return;
    let cancelled = false;

    (async () => {
      // Imported here rather than at the top of the file so the embed lands in
      // its own chunk, fetched on demand, instead of in the page's initial
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
  }, [enabled]);

  return useCallback((event) => {
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
}
