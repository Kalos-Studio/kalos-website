"use client";

import { useCallback, useEffect, useRef } from "react";
import { booking } from "./content";

/**
 * Opens the Cal.com booking modal, for anything that should open it.
 *
 * Two things about this that are deliberate and easy to undo by accident.
 *
 * **It is always light.** The theme is set in both the `cal("ui", …)` call and
 * the per-open modal config, and it has to be in both: `ui` configures the
 * embed, the modal config configures that opening, and setting only one leaves
 * the other to fall back to the visitor's system preference. That is how this
 * ends up light on our machines and dark on someone else's. The landing page is
 * a white surface and the booker sits on top of it, so a dark modal would look
 * like a different site had opened.
 *
 * **The caller must be a real link.** This returns a click handler for an `<a>`
 * whose href is the public booking page. If the embed is blocked, still loading,
 * or fails outright, the click falls through to a URL that books a call. Hanging
 * this on a `<button>` would mean a visitor with an ad blocker gets a button
 * that does nothing.
 */

// month_view is the classic booker: a month calendar beside a column of times,
// at modal size. week_view is the full seven-day grid and needs most of the
// screen, so the modal opens close to full bleed. useSlotsViewOnSmallScreen
// collapses a phone to a slot list either way, so this only changes desktop.
const MODAL_CONFIG = {
  layout: "month_view",
  useSlotsViewOnSmallScreen: "true",
  theme: "light",
};

export function useCalModal() {
  const api = useRef(null);

  useEffect(() => {
    if (api.current) return;
    let cancelled = false;

    (async () => {
      // Imported here rather than at the top of the file so the embed lands in
      // its own chunk, fetched on demand, instead of in the page's initial
      // JavaScript. Worth about 1kB of First Load rather than the whole embed.
      const { getCalApi } = await import("@calcom/embed-react");
      const cal = await getCalApi({ namespace: booking.namespace });
      if (cancelled) return;

      cal("ui", {
        theme: "light",
        // Cal uses `cal-brand` for its own accents. Obsidian Black, so the
        // booker's buttons match the page's rather than arriving in Cal's blue.
        cssVarsPerTheme: {
          light: { "cal-brand": "#040406" },
          dark: { "cal-brand": "#040406" },
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

  return useCallback((event) => {
    // Let the browser keep the ones it should own: new tab, new window, save.
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
    api.current("modal", { calLink: booking.link, config: MODAL_CONFIG });
  }, []);
}
