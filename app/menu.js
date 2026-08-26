"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCalModal } from "./(landing)/cal";
import { menu } from "./(landing)/content";

/**
 * The masthead's menu: four dots top right, which grow a card on hover and
 * unfold into the site's navigation when pressed.
 *
 * Three states, and they are meant to read as one object rather than three:
 *
 *   rest   four dots, no ground. Chrome you glance at, not a button shouting.
 *   hover  a card fades in around them and the dots spread apart.
 *   open   that same card widens and drops open, "Menu" appearing beside the
 *          dots and the pages under them.
 *
 * The card is one element the whole way through, which is the point of the
 * arrangement. An earlier shape for this had a hover pill and a separate
 * dropdown panel that crossfaded, and it read as two things swapping places
 * because that is what it was. Widening a single box means the ground the
 * reader is already looking at is the ground that opens, so there is nothing to
 * re-find.
 *
 * The dots do not move. The card grows left and down around them, which means
 * the label has to arrive on their left: the first build put it on their right
 * and paid for it by walking the whole row leftwards as it opened, so the thing
 * you had just clicked slid out from under the cursor. Nothing about the icon
 * changes position between the three states now. See .site-menu in lab.css.
 */
export default function Menu() {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);

  const toggle = useCallback(() => setOpen((value) => !value), []);

  // Contact books a call, the same modal the homepage's button opens. The embed
  // starts loading when the panel opens rather than when the page does: this
  // menu is on every route now, and an eager load would put Cal's script on
  // every case study for a link almost nobody clicks. See cal.js.
  const onContact = useCalModal({ enabled: open });

  // Every item closes the panel behind it. Three of the four cases hide this:
  // navigating away unmounts the whole thing, and clicking Work from /work is
  // the one that made it obvious. Contact is the case that matters, because it
  // opens a modal over the page rather than leaving it, and the panel sat there
  // in the corner behind the booker.
  const close = useCallback(() => setOpen(false), []);
  const onContactClick = useCallback(
    (event) => {
      onContact(event);
      close();
    },
    [onContact, close],
  );

  useEffect(() => {
    if (!open) return;

    // Escape hands focus back to the dots. Closing a menu and dumping the
    // caret at the top of the document is the version of this that gets
    // reported as a bug by anyone navigating with a keyboard.
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };

    // pointerdown rather than click: a click that starts outside and finishes
    // on the card would otherwise close it, and a drag to select the address
    // bar should close it immediately rather than on release.
    const onDown = (event) => {
      if (root.current?.contains(event.target)) return;
      setOpen(false);
    };

    // Close when the page moves. It matters most on the homepage, where the
    // masthead fades out as the mark docks into it and an open panel would go
    // invisible while still being there and still focusable.
    //
    // Capture on the document rather than a named container. Every page here
    // scrolls inside an element rather than the document — .landing-root on the
    // homepage and /about, .work-root on /work — and scroll events do not
    // bubble, so a listener on window hears nothing on any of them. They are
    // still dispatched through the capture phase, which is one listener instead
    // of a list of container class names to keep current.
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("scroll", close, { capture: true, passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("scroll", close, { capture: true });
    };
    // `close` is stable, so this still runs only when `open` flips. It is in the
    // list because the rule is an error in this project and a stale closure over
    // a setter is exactly the kind of thing it is there to catch.
  }, [open, close]);

  return (
    <div className={`site-menu${open ? " is-open" : ""}`} ref={root}>
      <button
        type="button"
        ref={trigger}
        className="site-menu-trigger"
        aria-expanded={open}
        aria-controls="site-menu-panel"
        onClick={toggle}
      >
        {/* Before the icon in the DOM as well as on screen: the row is
            space-between, so this ends up at the card's left edge and the icon
            stays at its right. Source order that disagrees with reading order is
            a thing that only ever gets found later. Hidden from assistive tech,
            because the button's own label below says what pressing it does
            rather than what it is called. */}
        <span className="site-menu-label" aria-hidden="true">
          {menu.label}
        </span>
        {/* 10x10 so a circle's radius is a whole pixel and the four of them sit
            on an even grid. The spread on hover is a transform per circle
            rather than a second icon, so it can be interrupted halfway. */}
        <svg
          className="site-menu-dots"
          viewBox="0 0 10 10"
          width="10"
          height="10"
          fill="none"
          aria-hidden="true"
        >
          <circle className="site-menu-dot" cx="3" cy="3" r="1" fill="currentColor" />
          <circle className="site-menu-dot" cx="7" cy="3" r="1" fill="currentColor" />
          <circle className="site-menu-dot" cx="3" cy="7" r="1" fill="currentColor" />
          <circle className="site-menu-dot" cx="7" cy="7" r="1" fill="currentColor" />
        </svg>
        <span className="sr-only">{open ? menu.a11yClose : menu.a11yOpen}</span>
      </button>

      {/* Stays mounted so it has something to animate from, and `inert` while
          closed so a clipped, invisible list is not in the tab order. */}
      <div className="site-menu-panel" id="site-menu-panel" inert={!open}>
        <nav className="site-menu-clip" aria-label={menu.label}>
          <ul className="site-menu-list">
            {menu.links.map((link, i) => (
              // --i drives the stagger from CSS, so the delays live beside the
              // durations they are offset from rather than in JavaScript.
              <li key={link.href} style={{ "--i": i }}>
                {link.external ? (
                  // A real href, always. If the embed is blocked or has not
                  // arrived yet the click falls through to a page that books a
                  // call, which is the same guarantee the homepage's button has.
                  <a
                    className="site-menu-link"
                    href={link.href}
                    onClick={onContactClick}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link className="site-menu-link" href={link.href} onClick={close}>
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
