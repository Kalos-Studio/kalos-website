"use client";

import { useCalModal } from "./cal";
import { booking, cta } from "./content";

/**
 * The page's only call to action, in its only styling.
 *
 * One primary action and no competing buttons is a brief-level rule, so this is
 * a component rather than a class: every instance is the same element with the
 * same label, and adding a second, different button means editing this file and
 * noticing that you are doing it.
 *
 * It is an anchor pointing at the real Cal.com page, and the click is taken over
 * in JavaScript to open the embed instead. That ordering is deliberate: if the
 * embed is blocked, still loading, or fails outright, the link goes somewhere
 * that books a call. A <button> in the same situation is an inert control on the
 * one element the whole page exists to get clicked.
 *
 * The embed wiring moved to cal.js when the menu's Contact item started opening
 * the same modal. It is worth keeping the note on why the click is handled
 * explicitly rather than through Cal's `data-cal-link` attributes, which is
 * their documented approach and did not work here: the embed loaded, `Cal.ns.intro`
 * existed, and the click still navigated away instead of opening the modal, so
 * its binding never caught the element. Calling `modal` ourselves is one line,
 * and it is testable.
 */
export default function CallToAction({ className = "" }) {
  const onClick = useCalModal();

  return (
    <a
      className={`ln-cta ${className}`}
      href={`https://cal.com/${booking.link}`}
      onClick={onClick}
    >
      {cta.label}
    </a>
  );
}
