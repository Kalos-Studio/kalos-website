"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Case study images render at content-column width (~860px), which isn't
// enough to read fine detail in a dense screenshot. Clicking one opens it
// at a much larger size in an overlay instead.
//
// The overlay is portaled to document.body rather than rendered inline:
// this component sits inside a <figure>, and app/work/work.css scopes
// image sizing with a `.work-case-body figure img` selector — if the
// overlay's <img> stayed nested in that same <figure>, that selector's
// higher specificity would win over the overlay's own sizing and the
// "expanded" image would render at the same width as the thumbnail.
export default function ExpandableImage({ src, alt }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="work-expandable-image"
        onClick={() => setOpen(true)}
        aria-label={`Expand image${alt ? `: ${alt}` : ""}`}
      >
        {/* Still a plain <img>, and deliberately. next/image needs intrinsic
            dimensions for a string src, either width and height or `fill` inside
            a sized parent, and a body image block carries neither: these run at
            their natural aspect ratio down the column, which is the point. Lazy
            and async decoding are the parts of the benefit that do not need the
            dimensions. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt || ""} loading="lazy" decoding="async" />
      </button>

      {open &&
        createPortal(
          <div
            className="work-lightbox"
            role="dialog"
            aria-modal="true"
            onClick={() => setOpen(false)}
          >
            <button
              type="button"
              className="work-lightbox-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="work-lightbox-img"
              src={src}
              alt={alt || ""}
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
