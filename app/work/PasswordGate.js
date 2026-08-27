"use client";

import { useActionState, useEffect, useId } from "react";
import Link from "next/link";
import { unlockCaseStudy } from "./unlock";

// The one thing it says, and all it says.
//
// It was three sentences admitting the write-up was not finished and offering a
// call instead. That told a visitor something they had no reason to be told:
// the work shipped, and a locked page that apologises for itself reads as an
// unfinished portfolio rather than a private one.
const PROMPT = "Enter password to access full case study.";

/**
 * The ask that stands over a locked case study: a translucent layer across the
 * whole page with the prompt centred on it, arriving once the cover has landed.
 *
 * The other one, built and cut. An inline variant put the same prompt where the
 * body would be, in the reading column, and left the page around it behaving
 * normally. It was quieter and it was the wrong kind of quiet -- sitting in the
 * flow at the top of an empty column it read as a small piece of the page rather
 * than as a door, and a reader who scrolled past it found a case study that
 * simply stopped. Covering the page says the thing the inline one only implied.
 * The two were switchable behind a debug menu for exactly as long as it took to
 * look at them side by side; that menu and the switch went with the decision.
 *
 * There is nothing behind the scrim to read. The check that produced this ran
 * on the server, so the locked prose was never sent to the browser -- the layer
 * is not what is hiding it.
 */
export default function PasswordGate({ slug }) {
  const [state, formAction, pending] = useActionState(unlockCaseStudy, {
    error: null,
  });
  const labelId = useId();
  const fieldId = useId();

  // The page underneath must not scroll while the layer is over it, or the
  // reader can push the hero off screen behind a modal they cannot dismiss and
  // end up looking at nothing. Restored on unmount, which is what unlocking
  // does -- the prose arrives and this component goes away.
  //
  // On <html> rather than <body>, because the document is the scroll container
  // here (see the note on snapping in app/layout.js).
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      className={
        "fixed inset-0 z-50 flex items-center justify-center px-5 " +
        // Warm white rather than the usual black scrim: the site's ground is
        // white and a dark wash would read as a different product's dialog.
        // The blur is what makes it a layer rather than a tint -- it says the
        // page is still there and is being held back.
        "bg-white/70 backdrop-blur-md motion-safe:animate-gate-scrim"
      }
    >
      {/* Square and hairline black, which is the case study's own panel frame.
          The site has no cards and no elevation except under a screenshot, so a
          rounded, shadowed box here would be the one object on the page
          borrowed from somewhere else. */}
      <div className="w-full max-w-[26rem] border border-black bg-white px-6 py-7 motion-safe:animate-gate-card sm:px-8 sm:py-9">
        <p id={labelId} className="text-lead tracking-tight">
          {PROMPT}
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-3">
          <input type="hidden" name="slug" value={slug} />

          <label htmlFor={fieldId} className="sr-only">
            Password
          </label>

          {/* Full width and stacked rather than a field with the button beside
              it: at 26rem the pair on one line leaves the field too short to
              see what you have typed.

              --radius-control, shared with the button, because they are the
              same kind of object. */}
          <input
            id={fieldId}
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            autoFocus
            required
            className={
              "h-11 w-full min-w-0 rounded-control border border-black/25 bg-transparent " +
              "px-4 text-control tracking-tight placeholder:text-muted " +
              "transition-colors duration-[var(--duration-quick)] " +
              "focus:border-black focus:outline-none lg:h-12"
            }
          />

          {/* The closer's outlined treatment, not the hero's filled one. A black
              button here would be the loudest thing on a page whose subject is a
              picture. */}
          <button
            type="submit"
            disabled={pending}
            className={
              "inline-flex h-11 w-full items-center justify-center rounded-control " +
              "border border-current bg-transparent px-7 text-control tracking-tight text-black " +
              "transition-colors duration-[var(--duration-quick)] " +
              "hover:bg-black hover:text-white disabled:opacity-50 lg:h-12"
            }
          >
            {pending ? "Checking" : "Enter"}
          </button>
        </form>

        {/* aria-live, because on a wrong password nothing else on the page moves
            and a screen reader would otherwise be told nothing at all.

            The error is component state rather than a query parameter
            (`?error=1`, which is what the gate this replaced used) so a wrong
            attempt does not rewrite the URL of a page reached through a view
            transition, and the address that gets shared is still the study's
            own. */}
        <p
          aria-live="polite"
          className="mt-3 min-h-5 text-control tracking-tight text-muted"
        >
          {state?.error}
        </p>

        {/* A way out. There is no Escape and no backdrop click, because both
            would leave a reader on a page with nothing on it -- so the exit is
            the one the masthead already offers, back to this study's own panel
            on the landing page. */}
        <Link
          href={`/#case-${slug}`}
          className="mt-2 inline-block text-control tracking-tight text-muted underline-offset-4 transition-colors hover:text-black hover:underline"
        >
          Back to Work
        </Link>
      </div>
    </div>
  );
}
