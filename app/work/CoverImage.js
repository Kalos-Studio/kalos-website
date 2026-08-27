import Image from "next/image";

// Cover art is optional in the data — case studies added before their final
// imagery exists still get a card/hero instead of a broken <img>.
export default function CoverImage({
  cover,
  className,
  sizes,
  priority,
  objectPosition,
  // Applied to the <img>, not the box. `fill` makes Next stretch the image to
  // the container, and with no object-fit the browser's default squashes it to
  // whatever aspect the box happens to be. Every caller so far wanted a crop,
  // which /work supplies as `object-fit: cover` in work.css; the landing page's
  // floating panels want `object-contain` instead, and have no stylesheet of
  // their own to say so.
  imageClassName,
  // Spread onto the box, not the image: style, data-* attributes, anything
  // the caller needs on the element itself. The view transition prototype
  // uses it to hang a view-transition-name and a data-vt-target on the pair
  // of covers it morphs between, which have to be the boxes rather than the
  // <img> -- the box is what has the frame and the aspect ratio.
  containerProps,
  children,
}) {
  if (!cover?.src) {
    return (
      <div className={className} {...containerProps}>
        {/* Utilities rather than a class in work.css. The rule used to live
            there (a dark radial gradient, from when /work was a black section)
            and only applied under /work — this component is on the landing page
            too, which never imports that stylesheet, so a coverless entry there
            would have rendered the fallback completely unstyled. */}
        <div className="flex h-full w-full items-center justify-center bg-surface text-sm tracking-tight text-muted">
          Cover image coming soon
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className={className} {...containerProps}>
      {/* This carried `unoptimized` for one reason: Next's image optimizer
          fetches local files over an internal HTTP request that does not carry
          the visitor's cookies, and everything under /work — image files
          included — sat behind the password-gate middleware, so the optimizer
          got redirected to the login page instead of the image.
          The gate is gone, so the optimizer can reach them and the flag came
          off. That matters more than it used to: the landing page puts seven of
          these covers on one screen. */}
      <Image
        src={cover.src}
        alt={cover.alt || ""}
        fill
        sizes={sizes || "(min-width: 860px) 860px, 100vw"}
        priority={priority}
        className={imageClassName}
        style={objectPosition ? { objectPosition } : undefined}
      />
      {/* Optional overlay content (e.g. a caption) — rendered inside the
          same position:relative box as the image so it can be positioned
          with a plain `inset: 0` instead of needing its own wrapper. */}
      {children}
    </div>
  );
}
