"use client";

import { useActionState, useEffect, useId } from "react";
import Link from "next/link";
import { unlockCaseStudy } from "./unlock";

// The one line either variant says, and all it says. It was three sentences
// admitting the write-up was not finished, which told a visitor something they
// had no reason to be told and turned a locked page into an apology. The work
// shipped; the only fact a reader needs here is that there is a door.
const PROMPT = "Enter password to access full case study.";

/**
 * Two ways of asking for the password over one case study, switchable so they
 * can be looked at side by side rather than one being iterated into the other.
 * The debug menu in GateDebugMenu.js flips between them; WORK_GATE sets which
 * one real visitors get. See lib/work-lock.js.
 *
 *   inline -- the gate stands where the body would, in the reading column, and
 *             the page around it behaves normally. Cheapest and quietest: the
 *             study still scrolls, the closer is still reachable, and nothing
 *             is covering anything.
 *
 *   modal  -- a translucent layer over the whole page with the ask centred on
 *             it, arriving after the cover has finished flying in from the
 *             landing panel. Louder, unambiguous, and it stops the page.
 *
 * Neither variant is given the prose. The check that produced them ran on the
 * server, so the locked writing was never sent to the browser and there is
 * nothing behind the scrim to read.
 */
export default function PasswordGate({ slug, variant = "inline" }) {
  return variant === "modal" ? (
    <ModalGate slug={slug} />
  ) : (
    <InlineGate slug={slug} />
  );
}

function InlineGate({ slug }) {
  return (
    <div className="max-w-[46ch]">
      <p className="text-lead tracking-tight">{PROMPT}</p>
      <GateForm slug={slug} className="mt-6" />
    </div>
  );
}

function ModalGate({ slug }) {
  const labelId = useId();

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

        <GateForm slug={slug} className="mt-6" autoFocus stacked />

        {/* A way out. There is no Escape and no backdrop click, because both
            would leave a reader on a page with nothing on it -- so the exit is
            the one the masthead already offers, back to this study's own panel
            on the landing page. */}
        <Link
          href={`/#case-${slug}`}
          className="mt-5 inline-block text-control tracking-tight text-muted underline-offset-4 transition-colors hover:text-black hover:underline"
        >
          Back to Work
        </Link>
      </div>
    </div>
  );
}

/**
 * The field, the button and the error, shared so the two variants differ in
 * where they sit rather than in what they are.
 *
 * `stacked` gives the modal a full-width button under the field instead of
 * beside it: at 26rem the pair on one line leaves the field too short to see
 * what you typed.
 *
 * The error is component state rather than a query parameter (`?error=1`, which
 * is what the gate this replaced used) so a wrong attempt does not rewrite the
 * URL of a page reached through a view transition, and the address that gets
 * shared is still the study's own.
 */
function GateForm({ slug, className = "", autoFocus = false, stacked = false }) {
  const [state, formAction, pending] = useActionState(unlockCaseStudy, {
    error: null,
  });
  const fieldId = useId();

  return (
    <div className={className}>
      <form
        action={formAction}
        className={stacked ? "flex flex-col gap-3" : "flex flex-wrap gap-3"}
      >
        <input type="hidden" name="slug" value={slug} />

        <label htmlFor={fieldId} className="sr-only">
          Password
        </label>

        {/* --radius-control, shared with the button, because they are the same
            kind of object -- and the heights match BookACall's so the pair sits
            on one line in the inline variant. */}
        <input
          id={fieldId}
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          autoFocus={autoFocus}
          required
          className={
            "h-11 min-w-0 rounded-control border border-black/25 bg-transparent " +
            "px-4 text-control tracking-tight placeholder:text-muted " +
            "transition-colors duration-[var(--duration-quick)] " +
            "focus:border-black focus:outline-none lg:h-12 " +
            (stacked ? "w-full" : "flex-1")
          }
        />

        {/* The closer's outlined treatment, not the hero's filled one. A black
            button here would be the loudest thing on a page whose subject is a
            picture. */}
        <button
          type="submit"
          disabled={pending}
          className={
            "inline-flex h-11 items-center justify-center rounded-control " +
            "border border-current bg-transparent px-7 text-control tracking-tight text-black " +
            "transition-colors duration-[var(--duration-quick)] " +
            "hover:bg-black hover:text-white disabled:opacity-50 lg:h-12 " +
            (stacked ? "w-full" : "shrink-0")
          }
        >
          {pending ? "Checking" : "Enter"}
        </button>
      </form>

      {/* aria-live, because on a wrong password nothing else on the page moves
          and a screen reader would otherwise be told nothing at all. */}
      <p
        aria-live="polite"
        className="mt-3 min-h-5 text-control tracking-tight text-muted"
      >
        {state?.error}
      </p>
    </div>
  );
}
