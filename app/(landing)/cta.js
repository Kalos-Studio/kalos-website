import { cta } from "./content";

/**
 * The page's only call to action, in its only styling.
 *
 * One primary action and no competing buttons is a brief-level rule, so this is
 * a component rather than a class: every instance is the same element with the
 * same label, and adding a second, different button means editing this file and
 * noticing that you are doing it.
 *
 * When BOOKING_URL is still null it renders a disabled <button> rather than an
 * anchor pointing at "#". A dead link looks identical to a working one, invites
 * a click and does nothing; a disabled button stays out of the tab order, tells
 * assistive tech the truth, and is visibly unfinished on the deploy preview.
 */
export default function CallToAction({ className = "" }) {
  if (!cta.href) {
    return (
      <button
        type="button"
        className={`ln-cta ${className}`}
        disabled
        title="Booking link not set yet"
      >
        {cta.label}
      </button>
    );
  }

  return (
    <a className={`ln-cta ${className}`} href={cta.href}>
      {cta.label}
    </a>
  );
}
