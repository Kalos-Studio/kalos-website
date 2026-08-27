"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { relockWork } from "./unlock";

const MONTH = 60 * 60 * 24 * 30;

/**
 * A switch for looking at the two password gates next to each other, and the
 * relock button that makes doing so possible more than once.
 *
 * Deliberately not in the site's vocabulary. Everything else on this page is
 * black, white and Space Grotesk at the brand's sizes, so a tool that is not
 * part of the design has to be legibly not part of it -- otherwise the thing
 * being judged is being judged next to something that looks like it belongs.
 *
 * Bottom centre because the two corners are taken: Next's dev indicator sits
 * bottom left and the Agentation toolbar bottom right.
 *
 * On in development without asking. In production it appears only after
 * ?debug=1, and the cookie it writes below is what carries it across the next
 * navigation -- otherwise comparing means re-appending the flag to every URL,
 * which is exactly the loop this exists to shorten. See debugEnabled() in
 * lib/work-lock.js.
 */
export default function GateDebugMenu({ slug, variant, unlocked }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    document.cookie = `work_debug=1;path=/;max-age=${MONTH};samesite=lax`;
  }, []);

  function choose(next) {
    if (next === variant) return;
    document.cookie = `work_gate=${next};path=/;max-age=${MONTH};samesite=lax`;
    // The variant is read on the server, so the page has to be re-rendered
    // there. refresh() keeps the reader's place and their form state; a full
    // reload would also work and would throw away the scroll position.
    router.refresh();
  }

  // 0 rather than deleting the cookie: absent means "no opinion", which in
  // development means on, so a delete here would hide the menu for exactly one
  // render and then bring it straight back. Append ?debug=1 to get it again.
  function close() {
    document.cookie = `work_debug=0;path=/;max-age=${MONTH};samesite=lax`;
    router.refresh();
  }

  return (
    <div
      className={
        "fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1 " +
        "rounded-control bg-black/90 p-1 text-xs text-white shadow-lg backdrop-blur"
      }
    >
      <span className="pl-3 pr-1 text-white/45">gate</span>

      {["inline", "modal"].map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => choose(name)}
          aria-pressed={variant === name}
          className={
            "rounded-control px-3 py-1.5 capitalize transition-colors duration-[var(--duration-quick)] " +
            (variant === name
              ? "bg-white text-black"
              : "text-white/70 hover:bg-white/10 hover:text-white")
          }
        >
          {name}
        </button>
      ))}

      <span className="mx-1 h-4 w-px bg-white/20" />

      {/* Reads as state as much as a control: if it says "locked" there is
          nothing to undo, which is the question you actually have when the
          page in front of you is showing prose. */}
      <button
        type="button"
        disabled={!unlocked || pending}
        onClick={() => startTransition(() => relockWork(slug))}
        className={
          "rounded-control px-3 py-1.5 transition-colors duration-[var(--duration-quick)] " +
          (unlocked
            ? "text-white/70 hover:bg-white/10 hover:text-white"
            : "text-white/30")
        }
      >
        {pending ? "relocking" : unlocked ? "relock" : "locked"}
      </button>

      <button
        type="button"
        onClick={close}
        aria-label="Hide the gate debug menu"
        className="rounded-control px-2.5 py-1.5 text-white/40 transition-colors duration-[var(--duration-quick)] hover:bg-white/10 hover:text-white"
      >
        &times;
      </button>
    </div>
  );
}
