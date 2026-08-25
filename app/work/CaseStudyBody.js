import ExpandableImage from "./ExpandableImage";

// Renders one block from app/work/data.js's `body` array. Deliberately a
// small, fixed set of block types — see the schema comment at the top of
// data.js.
function renderBlock(block, key) {
  switch (block.type) {
    case "heading":
      return <h2 key={key}>{block.text}</h2>;
    case "section":
      // A small-caps kicker above a bolder headline — for section breaks
      // that need a category label, not just a single heading (two plain
      // "heading" blocks in a row render identically and read as flat, with
      // no way to tell label from headline apart).
      return (
        <div className="work-case-section-header" key={key}>
          <p className="work-case-eyebrow">{block.kicker}</p>
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
        <figure className="work-case-quote" key={key}>
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

// Splits a flat block list into { label, content } groups, one per heading —
// used by the "columns" layout, where each heading becomes a label pinned
// to the left of the paragraphs/images that follow it, instead of a
// full-width line above them.
function groupIntoSections(blocks) {
  const sections = [];
  let current = null;
  for (const block of blocks) {
    if (block.type === "heading" || block.type === "section") {
      current = { label: block, content: [] };
      sections.push(current);
    } else if (current) {
      current.content.push(block);
    } else {
      current = { label: null, content: [block] };
      sections.push(current);
    }
  }
  return sections;
}

export default function CaseStudyBody({ blocks, columns }) {
  if (!blocks?.length) return null;

  if (columns) {
    return (
      <div className="work-case-body work-case-body--columns">
        {groupIntoSections(blocks).map((section, i) => (
          <div className="work-case-row" key={i}>
            {section.label && (
              <div className="work-case-row-label">
                {renderBlock(section.label, `label-${i}`)}
              </div>
            )}
            {section.content.map((block, j) => (
              <div
                className={
                  block.type === "image" ? "work-case-row-full" : "work-case-row-text"
                }
                key={j}
              >
                {renderBlock(block, `content-${i}-${j}`)}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="work-case-body">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}
