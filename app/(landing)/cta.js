import { cta } from "./content";

/**
 * The page's only call to action, in its only styling.
 *
 * One primary action and no competing buttons is a brief-level rule, so this is
 * a component rather than a class: every instance is the same element with the
 * same label, and adding a second, different button means editing this file and
 * noticing that you are doing it.
 *
 * It renders fully active whether or not BOOKING_URL is set. An earlier version
 * greyed it out to 45% opacity while the link was missing, on the grounds that a
 * dead control should look dead. The owner wants to judge the real thing, and a
 * washed-out button is not the real thing, so the styling no longer depends on
 * the URL.
 *
 * The element still does. With a URL it is an anchor; without one it stays a
 * <button>, so it is not a link that goes nowhere, and it carries a title saying
 * why. Nothing about that is visible until the link lands, which is the point.
 */
export default function CallToAction({ className = "" }) {
  if (!cta.href) {
    return (
      <button
        type="button"
        className={`ln-cta ${className}`}
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
