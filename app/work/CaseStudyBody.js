// Renders the `body` array from app/work/data.js. Deliberately a small, fixed
// set of block types — see the schema comment at the top of data.js.
export default function CaseStudyBody({ blocks }) {
  if (!blocks?.length) return null;

  return (
    <div className="work-case-body">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return <h2 key={i}>{block.text}</h2>;
          case "paragraph":
            return <p key={i}>{block.text}</p>;
          case "list":
            return (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          case "image":
            return (
              <figure key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.src} alt={block.alt || ""} />
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            );
          case "link":
            return (
              <a
                key={i}
                href={block.href}
                target="_blank"
                rel="noopener noreferrer"
                className="work-case-more-link"
              >
                {block.text} →
              </a>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
