"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * PROTOTYPE. A <Link> that morphs one element into its counterpart on the
 * destination page, using the View Transitions API.
 *
 * Wired to exactly one pair right now -- the Priority Ambulance Transfer panel
 * on the landing page and that case study's hero -- to answer whether the effect
 * is worth what it costs before the other seven are committed to it. Delete this
 * file and the two `vtName` props if the answer is no.
 *
 * How the pairing works: the source element carries `view-transition-name: X`,
 * the destination carries the same name plus `data-vt-target="X"`. The browser
 * captures the old state, we swap the page, it captures the new state, and it
 * animates between the two boxes. The two never coexist in the DOM, which
 * matters -- a duplicate view-transition-name aborts the whole transition.
 *
 * Why this is hand-rolled rather than React's <ViewTransition>: that component
 * needs the experimental React channel (react 19.2.8 here exports Activity and
 * nothing else), and Next's `experimental.viewTransition` flag is the switch for
 * it. Not a dependency worth taking on for a prototype.
 *
 * The hard part is that `router.push` is not synchronous, so the callback has to
 * hold the transition open until the destination has actually rendered. Hence
 * the observer below. Everything about that is why this is not a one-liner.
 */

// If the destination never shows up -- a failed chunk, a slow network, a route
// that does not carry the target -- the transition must not hang the page. Past
// this the callback resolves anyway and the browser cross-fades whatever it has.
const TARGET_TIMEOUT_MS = 1500;

// Which navigation is current. A wait can outlive the click that started it:
// its MutationObserver is on document.body and keeps firing after a second
// click has moved on, and `centreInView` means a stale one would scroll the
// newly arrived page to an unrelated position. Every click takes a ticket and
// a wait that no longer holds the current one resolves without touching
// anything. Module scope rather than a ref because the component unmounts
// mid-navigation, taking its refs with it.
let currentNavigation = 0;

// Nothing in here may wait on a frame. While the update callback is pending the
// browser has rendering suppressed, so requestAnimationFrame never fires and the
// transition deadlocks until Chrome kills it with "Transition was aborted
// because of timeout in DOM update". That was the first version of this function
// and it failed exactly that way; timers and promises are fine, frames are not.
//
// No frame is needed anyway: the browser lays out and captures the new state
// itself once this promise settles.
//
// `source` is the element being navigated away from. It carries the same
// data-vt-target as the destination -- both ends of a pair are marked, because
// the morph runs in both directions now -- so without excluding it the very
// first querySelector matches the element we are leaving and the callback
// resolves before React has rendered anything.
function waitForTarget(name, source, { centreInView = false, ticket } = {}) {
  return new Promise((resolve) => {
    const superseded = () => ticket !== currentNavigation;
    const selector = `[data-vt-target="${name}"]`;
    const find = () =>
      [...document.querySelectorAll(selector)].find((el) => el !== source);
    let observer;
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      observer?.disconnect();
      clearTimeout(timer);
      resolve();
    };

    // The one hard deadline. It covers a missing target, a decode that never
    // comes back, and anything else -- image decoding has no timeout of its own.
    const timer = setTimeout(finish, TARGET_TIMEOUT_MS);

    const settle = (el) => {
      if (superseded()) return finish();

      // Going back to the landing page, the panel this hero came from is
      // usually far down a long page. Without this the morph flies the cover to
      // wherever that panel happens to sit, which is often off screen, and the
      // page then scrolls to it afterwards. Instant, because a smooth scroll
      // would still be moving when the new state is captured.
      if (centreInView && el) {
        el.scrollIntoView({ block: "center", behavior: "instant" });
      }

      // Start the panels either side of the target loading, without waiting for
      // them.
      //
      // Coming back to the landing page, scrolling the target into view brings
      // its neighbours into the window too -- and they are lazy, so the browser
      // only begins fetching them at that moment and they arrive about a second
      // later, popping in after the transition has finished. Kicking them off
      // here gives them the length of the morph to load in.
      //
      // Deliberately not awaited: the transition should never be held open for
      // an image nobody is looking at. If they are not ready in time they fade
      // in late exactly as they did before, which is the current behaviour and
      // an acceptable floor.
      if (el) {
        const panel = el.closest("li");
        for (const sibling of [
          panel?.previousElementSibling,
          panel?.nextElementSibling,
        ]) {
          const neighbour = sibling?.querySelector("img");
          if (!neighbour || neighbour.complete) continue;
          // Lazy images do not begin until the browser decides they are near
          // enough; saying eager is what actually starts the fetch.
          neighbour.loading = "eager";
          neighbour.decode?.().catch(() => {});
        }
      }

      // A snapshot of an <img> that has not decoded yet is a grey box, and the
      // morph lands on that and then pops. The two ends ask for different
      // `sizes`, so they resolve to different files out of the srcset and the
      // destination's is usually a fresh request -- the common case, not an
      // edge one.
      const img = el?.querySelector("img");
      if (img && !img.complete) {
        img.decode().catch(() => {}).then(finish, finish);
      } else {
        finish();
      }
    };

    const existing = find();
    if (existing) return settle(existing);

    observer = new MutationObserver(() => {
      if (superseded()) return finish();
      const el = find();
      if (el) settle(el);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

export default function ViewTransitionLink({
  href,
  vtName,
  // Set on the case study hero, which navigates back to a panel partway down a
  // long landing page. Left off the panels, which navigate to a hero that is
  // near the top of a page starting at the top.
  centreInView = false,
  className,
  children,
  ...rest
}) {
  const router = useRouter();

  const onClick = (event) => {
    // Every one of these falls through to the plain <Link>, which is the point:
    // the animation is an enhancement and its absence is a working link.
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!document.startViewTransition) return;
    // Entrances respect this everywhere else on the site and so does this one.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // The element being left behind, so the waiter can tell it apart from its
    // counterpart on the destination. Both ends of a pair carry the same
    // data-vt-target, so without something to exclude, the first match would be
    // this page's own box and the callback would resolve before React had
    // rendered the next one.
    //
    // If it is missing -- a caller that put the named box outside the link, or
    // renamed one end only -- there is nothing to morph and nothing to exclude,
    // so drop through to the plain <Link> rather than run a transition that
    // cannot work.
    const source = event.currentTarget.querySelector(
      `[data-vt-target="${vtName}"]`,
    );
    if (!source) return;

    const ticket = ++currentNavigation;

    event.preventDefault();
    const transition = document.startViewTransition(() => {
      router.push(href);
      return waitForTarget(vtName, source, { centreInView, ticket });
    });

    // These reject rather than resolve when a transition is skipped, which
    // happens whenever a second click starts one while this is still waiting.
    // Unhandled, that surfaces as an uncaught AbortError in the console for
    // something that is working as intended.
    transition.ready?.catch(() => {});
    transition.finished?.catch(() => {});
    transition.updateCallbackDone?.catch(() => {});
  };

  return (
    // The name deliberately is not set here. This component wraps the whole
    // panel -- cover, title and summary -- and naming the wrapper would morph
    // the caption along with the image, which stretches type during the flight.
    // The caller puts the name on the cover box alone and passes it here only so
    // the transition knows what to wait for.
    // `rest` is spread first on purpose: an onClick or href arriving through
    // it must not silently replace the transition handler or send the link
    // somewhere other than the router.push above.
    <Link {...rest} href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
