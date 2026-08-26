import ExpandableImage from "./ExpandableImage";

// Renders one block from app/work/data.js's `body` array. Deliberately a
// small, fixed set of block types — see the schema comment at the top of
// data.js.
//
// Class names moved from `work-case-*` to `work-prose-*` when the section was
// rebuilt on the landing page's light surface: the old ones were part of a dark
// template whose rules this shares nothing with, and keeping them would have
// made the stylesheet read as a restyle of something that no longer exists.
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
      // A client saying it is worth more than us saying it, so this is set to
      // interrupt rather than to decorate: larger than the body, off the prose
      // measure, and attributed to a named person with their title. An
      // unattributed pull quote is just our own copy in bigger type.
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
      return (
        <figure key={key}>
          <ExpandableImage src={block.src} alt={block.alt} />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
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
