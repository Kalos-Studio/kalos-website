import ExpandableImage from "./ExpandableImage";

// Renders one block from app/work/data.js's `body` array. Deliberately a
// small, fixed set of block types — see the schema comment at the top of
// data.js.
//
// Class names moved from `work-case-*` to `work-prose-*` when the section was
// rebuilt on the landing page's light surface: the old ones were part of a dark
// template whose rules this shares nothing with, and keeping them would have
// made the stylesheet read as a restyle of something that no longer exists.

// The figure for an image block. Pulled out so the `split` block below can set
// the same image beside a paragraph without a second copy of the screenshot,
// scroll and side-by-side handling.
function imageFigure(block, key) {
  // Two opt-in treatments, both set per image in data.js.
  //
  // `screenshot` says this is the product itself rather than artwork, which is
  // the one thing on this site allowed a radius and a shadow: a screenshot is a
  // picture of a device, and square corners make it read as a crop of a screen
  // rather than as a screen. Artwork that carries its own transparent ground and
  // its own shadow gets neither -- see "Case study imagery" in CLAUDE.md, and
  // test the corner pixels rather than guessing.
  //
  // `scroll` is for a screen taller than it is sensible to show at once. It is
  // read below rather than turned into a class, because what scrolls is the box
  // around the image, not the figure.
  const classes = block.screenshot ? "work-prose-shot" : undefined;

  // `srcs` puts two or three screens side by side under one caption. Several
  // captions here describe more than one screen -- "weight for produce, a scan
  // for everything that was never on the list" is two -- and read as
  // over-promising when the figure below shows one.
  const sources = block.srcs ?? [block.src];
  const alts = block.alts ?? [block.alt];

  const images = sources.map((src, i) => (
    <ExpandableImage key={src} src={src} alt={alts[i] ?? block.alt} />
  ));

  const content =
    sources.length > 1 ? (
      <div className="work-prose-screens">{images}</div>
    ) : block.scroll ? (
      <div className="work-prose-scroller">{images[0]}</div>
    ) : (
      images[0]
    );

  return (
    <figure key={key} className={classes}>
      {content}
      {block.caption && <figcaption>{block.caption}</figcaption>}
    </figure>
  );
}

function renderBlock(block, key) {
  switch (block.type) {
    case "heading":
      return <h2 key={key}>{block.text}</h2>;
    case "section":
      // A kicker above a heading — for section breaks that need a category
      // label, not just a single heading (two plain "heading" blocks in a row
      // render identically and read as flat, with no way to tell label from
      // headline apart).
      return (
        <div className="work-prose-section" key={key}>
          <p className="work-prose-kicker">{block.kicker}</p>
          <h2>{block.heading}</h2>
        </div>
      );
    case "paragraph":
      return <p key={key}>{block.text}</p>;
    case "quote":
      // Unused, and kept rather than deleted only because the shape is right if
      // an attributable quote ever exists again. The two that shipped -- a CTO
      // and a global product manager -- were removed: named client contacts do
      // not appear on this site. Dropping just the attribution is not the
      // fallback, since an unattributed pull quote is our own copy in bigger
      // type. See the block comment in data.js.
      return (
        <figure className="work-prose-quote" key={key}>
          <blockquote>{block.text}</blockquote>
          {block.attribution && <figcaption>{block.attribution}</figcaption>}
        </figure>
      );
    case "list":
      return (
        <ul key={key}>
          {block.items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      );
    case "image":
      return imageFigure(block, key);

    case "split":
      // A paragraph and its screens on one line rather than stacked. `flip` puts
      // the screens on the left instead, so a run of these alternates down the
      // page rather than forming a column of its own.
      return (
        <div
          key={key}
          className={[
            "work-prose-split",
            block.flip && "work-prose-split--flip",
            (block.srcs?.length ?? 1) > 1 && "work-prose-split--pair",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="work-prose-split-text">
            <p>{block.text}</p>
          </div>
          {imageFigure(block)}
        </div>
      );

    default:
      return null;
  }
}

// A `columns` variant used to live here: an opt-in layout, selected with
// `bodyLayout: "columns"` in the data, that pinned each heading as a label to
// the left of the blocks following it. No entry has set that flag for a long
// time — data.js documents the layout as gone — so the branch was unreachable
// and only survived because its CSS did. The page's rewrite took that CSS with
// it, and the dead branch went at the same time rather than being carried into
// a stylesheet that no longer has rules for it.
export default function CaseStudyBody({ blocks }) {
  if (!blocks?.length) return null;

  return (
    <div className="work-prose">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}
