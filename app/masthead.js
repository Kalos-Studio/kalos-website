import Link from "next/link";
import Lockup from "./(landing)/lockup";
import Menu from "./menu";
import "./masthead.css";

/**
 * The row across the top of every page: lockup left, menu right, both pinned to
 * the window rather than to whatever container the page happens to use.
 *
 * It renders the row and nothing about where the row sits. That is the caller's
 * job because the two cases are genuinely different: the hero wraps it in
 * .lab-header, which fixes it, holds it back until the sunrise has finished and
 * takes it away again when the mark docks into the lockup, while every other
 * page wants it present from first paint and passes .site-masthead--fixed.
 *
 * `href={null}` for the homepage. A logo linking to the page you are already on
 * is a dead control that still takes a tab stop.
 *
 * `lockupClassName` exists for one caller. On the hero the flat mark is the
 * target the 3D object flies into, and .lab-lockup .lockup-mark is what ramps it
 * to gold as the object dissolves over it. That selector is hero-specific and
 * has to stay in lab.css, so the hero passes its own class rather than the rule
 * moving somewhere it would apply to three pages that have no mark to dock.
 */
export default function Masthead({
  className = "",
  href = "/",
  lockupClassName = "site-lockup",
}) {
  const lockup = <Lockup className={lockupClassName} />;

  return (
    <div className={`site-masthead ${className}`}>
      {href ? (
        // Artwork rather than a heading: every page that uses this has its own
        // h1 below, and the lockup was an h1 once already. It needs a label
        // because the SVG is decorative to a screen reader.
        <Link href={href} className="site-wordmark" aria-label="Kalos, home">
          {lockup}
        </Link>
      ) : (
        lockup
      )}
      {/* A zero-height box that never changes size, so the card can grow
          without moving the lockup. See .site-menu-anchor. */}
      <div className="site-menu-anchor">
        <Menu />
      </div>
    </div>
  );
}
