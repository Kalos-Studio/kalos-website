import Image from "next/image";

// Cover art is optional in the data — case studies added before their final
// imagery exists still get a card/hero instead of a broken <img>.
export default function CoverImage({
  cover,
  className,
  sizes,
  priority,
  objectPosition,
  children,
}) {
  if (!cover?.src) {
    return (
      <div className={className}>
        <div className="work-card-placeholder">Cover image coming soon</div>
        {children}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* `unoptimized` used to be here and is gone with the password gate. The
          optimizer fetches local images through an internal HTTP request that
          carries no cookies, so while middleware gated /work the optimizer got
          the login page's HTML instead of a JPEG and the build failed on it.
          Nothing gates these files now, so they go through the optimizer like
          every other image on the site. */}
      <Image
        src={cover.src}
        alt={cover.alt || ""}
        fill
        sizes={sizes || "(min-width: 860px) 860px, 100vw"}
        priority={priority}
        style={objectPosition ? { objectPosition } : undefined}
      />
      {/* Optional overlay content (e.g. a caption) — rendered inside the
          same position:relative box as the image so it can be positioned
          with a plain `inset: 0` instead of needing its own wrapper. */}
      {children}
    </div>
  );
}
