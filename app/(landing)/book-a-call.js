"use client";

import { booking, cta } from "./content";
import { useCalModal } from "./cal";

/**
 * The page's one action, in the two treatments the wireframe draws: filled in
 * the hero, outlined at the foot of the page. Same label, same box.
 *
 * Always an `<a>` pointing at the real booking page, never a `<button>`. The
 * click handler opens the modal over the page; if the embed is blocked or has
 * not loaded yet, the href takes over and the visitor still books a call. See
 * the note in cal.js.
 */
export default function BookACall({ variant = "filled", className = "" }) {
  const openModal = useCalModal();

  const base =
    "inline-flex h-11 w-44 items-center justify-center rounded-control " +
    "border border-current text-control tracking-tight " +
    "transition-colors duration-[var(--duration-quick)] lg:h-12 lg:w-48";

  const treatment =
    variant === "filled"
      ? "bg-black text-white hover:bg-transparent hover:text-black"
      : "bg-transparent text-black hover:bg-black hover:text-white";

  return (
    <a
      href={`https://cal.com/${booking.link}`}
      onClick={openModal}
      className={`${base} ${treatment} ${className}`}
    >
      {cta}
    </a>
  );
}
