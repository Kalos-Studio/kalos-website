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
export default function BookACall({
  variant = "filled",
  size = "md",
  className = "",
}) {
  const openModal = useCalModal();

  // `sm` is the redesign's: the wireframe draws the button small under the
  // hero line and under the closer, at about 140x32 on a 1440 window. `md` is
  // the case study page's, which still sets it at the old size.
  const box =
    size === "sm"
      ? "h-9 px-5 text-sm lg:h-10 lg:px-6"
      : "h-11 w-44 text-control lg:h-12 lg:w-48";

  const base =
    "inline-flex items-center justify-center rounded-control " +
    "border border-current tracking-tight " +
    "transition-colors duration-[var(--duration-quick)] " +
    box;

  const treatment =
    variant === "filled"
      ? "bg-white text-black hover:bg-transparent hover:text-white"
      : "bg-transparent text-white hover:bg-white hover:text-black";

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
