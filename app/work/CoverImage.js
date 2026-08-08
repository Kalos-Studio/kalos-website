import Image from "next/image";

// Cover art is optional in the data — case studies added before their final
// imagery exists still get a card/hero instead of a broken <img>.
export default function CoverImage({
  cover,
  className,
  sizes,
  priority,
  objectPosition,
}) {
  if (!cover?.src) {
    return (
      <div className={className}>
        <div className="work-card-placeholder">Cover image coming soon</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* unoptimized: Next's image optimizer fetches local images via an
          internal HTTP request that doesn't carry the visitor's cookies, and
          everything under /work — including its image files — sits behind
          the password-gate middleware. Skipping optimization means the
          browser requests the file directly (with its own cookie) instead. */}
      <Image
        src={cover.src}
        alt={cover.alt || ""}
        fill
        sizes={sizes || "(min-width: 860px) 860px, 100vw"}
        priority={priority}
        unoptimized
        style={objectPosition ? { objectPosition } : undefined}
      />
    </div>
  );
}
