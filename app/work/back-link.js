"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * The back control on a case study, rendered into the masthead band.
 *
 * It used to be a hardcoded `← Work` sitting in the content flow above the
 * title, and it was wrong twice. Visually it was a third navigation element in
 * a corner that already had two, indented to the content column so it aligned
 * with nothing above it and pushed the title down a line. Behaviourally it was
 * a link dressed as a button: a left arrow reads as "go back", but it always
 * went to /work, which is only where you came from if you arrived from /work.
 * Reach a case study from a homepage row and it pointed somewhere you had
 * never been.
 *
 * So it goes back now, and it lives in the masthead band instead of the page.
 * It fades with the rest of the row on scroll, which is the point rather than a
 * compromise: it is chrome, so it behaves like the menu beside it instead of
 * like a piece of the case study.
 *
 * WHY IT IS A LINK AND NOT A BUTTON. With JS it calls router.back(); without
 * it, next/link has still rendered a plain <a href="/work">, so the control is
 * never dead. It also keeps middle-click, cmd-click and "open in new tab"
 * working, which a <button> would silently break.
 *
 * `history.length > 1` is the test, and it is a heuristic rather than a fact.
 * A tab opened straight onto this URL has a length of 1 and gets /work, which
 * is the case that matters: a shared link or a search result, where there is no
 * "back" inside the site to go to. Arriving from an external page in the same
 * tab also passes, and back() then leaves the site, which is what the word says
 * it does. The alternative was document.referrer, which is worse here: it is
 * not updated by client-side navigation, so every in-app move from the homepage
 * would report whatever loaded the homepage, or nothing at all.
 */
export default function BackLink() {
  const pathname = usePathname();
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  // After hydration only. Reading history during render would differ between
  // server and client and take the whole page down with a mismatch.
  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, [pathname]);

  // The layout renders the masthead for every /work route, so this decides for
  // itself whether it belongs on this one. /work itself is not a case study and
  // has nowhere to go back to that the lockup does not already cover.
  if (!/^\/work\/[^/]+$/.test(pathname)) return null;

  return (
    <Link
      href="/work"
      className="work-back"
      onClick={(event) => {
        // Let the browser handle anything that is not a plain left click, or
        // the new-tab modifiers stop working.
        if (!canGoBack || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
          return;
        }
        event.preventDefault();
        router.back();
      }}
    >
      <span className="work-back-arrow" aria-hidden="true">
        ←
      </span>
      Back
    </Link>
  );
}
