"use client";

import { useActionState } from "react";
import { unlockCaseStudy } from "./unlock";

/**
 * What stands in for a case study's body while it is locked.
 *
 * Written to read as part of the page rather than as a login screen. The old
 * gate was a centred card on its own route with an eyebrow, a heading and a
 * box around it, which is what a password page looks like when it is the whole
 * page. This one is a sentence and a field sitting in the reading column, under
 * a hero that has already told you what you are looking at, so the page still
 * reads as the case study it is.
 *
 * The error is state rather than a query parameter (`?error=1`, as before) so a
 * wrong attempt does not rewrite the URL of a page reached through a view
 * transition -- and so the address that gets shared is still the study's own.
 */
export default function PasswordGate({ slug }) {
  const [state, formAction, pending] = useActionState(unlockCaseStudy, {
    error: null,
  });

  return (
    <div className="max-w-[46ch]">
      <p className="text-lead tracking-tight">This one is still being written.</p>

      <p className="mt-3 text-control tracking-tight text-muted">
        The work shipped; the write-up has not. Enter the password if you have
        it, or book a call below and I will walk you through it.
      </p>

      <form action={formAction} className="mt-6 flex flex-wrap gap-3">
        <input type="hidden" name="slug" value={slug} />

        <label htmlFor={`pw-${slug}`} className="sr-only">
          Password
        </label>

        {/* The control's own tokens: --radius-control is shared with the button
            beside it because they are the same kind of object, and the height
            matches BookACall's so the pair sits on one line. */}
        <input
          id={`pw-${slug}`}
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          required
          className={
            "h-11 min-w-0 flex-1 rounded-control border border-black/25 bg-transparent " +
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
            "inline-flex h-11 shrink-0 items-center justify-center rounded-control " +
            "border border-current bg-transparent px-7 text-control tracking-tight text-black " +
            "transition-colors duration-[var(--duration-quick)] " +
            "hover:bg-black hover:text-white disabled:opacity-50 lg:h-12"
          }
        >
          {pending ? "Checking" : "Read it"}
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
