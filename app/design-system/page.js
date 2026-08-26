import BookACall from "../(landing)/book-a-call";
import Lockup, { LOCKUP_GEOMETRY, Mark, Wordmark } from "../lockup";
import { caseStudies, workRail } from "../work/data";

// Internal reference, not a page anyone should find by searching.
export const metadata = {
  title: "Design system — Kalos",
  description: "Every token, component and rule this site is built from.",
  robots: { index: false, follow: false },
};

/* A record of what exists, written from the code rather than from intent.
 *
 * The rule for this page: everything on it is either imported from the real
 * thing or quoted from it. Where a swatch or a specimen is a copy rather than
 * the component itself, it says so. A design system page that documents replicas
 * drifts from the site within a week and is then worse than nothing.
 *
 * The Issues section at the foot is the point of it as much as the catalogue is.
 * All of it is checked -- each entry says how to verify it.
 */

function Section({ id, title, intro, children }) {
  return (
    <section id={id} className="scroll-mt-8 border-t border-black/15 py-14 lg:py-20">
      <h2 className="text-display font-medium tracking-tight">{title}</h2>
      {intro && (
        <p className="mt-3 max-w-[62ch] text-lead tracking-tight text-neutral-600">
          {intro}
        </p>
      )}
      <div className="mt-8 lg:mt-10">{children}</div>
    </section>
  );
}

function Row({ name, meaning, children }) {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-black/10 py-5 lg:grid-cols-[16rem_1fr] lg:gap-8">
      <div>
        <code className="text-sm tracking-tight">{name}</code>
        {meaning && (
          <p className="mt-1 max-w-[40ch] text-sm tracking-tight text-neutral-500">
            {meaning}
          </p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Issue({ n, title, evidence, why, fix, severity }) {
  const tone =
    severity === "high"
      ? "border-black bg-black text-white"
      : severity === "medium"
        ? "border-black text-black"
        : "border-black/30 text-neutral-600";
  return (
    <li className="border-b border-black/10 py-7">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span
          className={`inline-flex h-7 items-center rounded-full border px-3 text-xs tracking-tight ${tone}`}
        >
          {severity}
        </span>
        <h3 className="text-lead font-medium tracking-tight">
          {n}. {title}
        </h3>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 lg:grid-cols-[8rem_1fr]">
        <dt className="text-sm tracking-tight text-neutral-500">Evidence</dt>
        <dd className="max-w-[70ch] text-sm tracking-tight">{evidence}</dd>
        <dt className="text-sm tracking-tight text-neutral-500">Why it matters</dt>
        <dd className="max-w-[70ch] text-sm tracking-tight">{why}</dd>
        <dt className="text-sm tracking-tight text-neutral-500">Fix</dt>
        <dd className="max-w-[70ch] text-sm tracking-tight">{fix}</dd>
      </dl>
    </li>
  );
}

const BRAND = [
  ["vulcan-gold", "#AE9357", "Accent: buttons, callouts, active indicators"],
  ["eerie-gray", "#212225", "Borders, grid lines, card backgrounds"],
  ["dark-silver", "#A8A8A8", "Secondary text and sub-labels"],
  ["snow-white", "#F5FEFD", "Primary text and key headlines"],
  ["obsidian-black", "#040406", "Primary canvas background"],
];

// Every grey the site actually renders, found by grepping the app directory.
const GREYS_IN_USE = [
  ["#525252", "work.css", "Case study kickers, captions, quote attributions"],
  ["text-neutral-600", "Tailwind", "Section intros on this page, panel summaries"],
  ["text-neutral-500", "Tailwind", "Placeholder panel copy, sub-labels"],
  ["text-neutral-400", "Tailwind", "Placeholder discipline tags"],
  ["bg-neutral-200", "Tailwind", "Pill hover fill"],
  ["bg-neutral-100", "Tailwind", "Panel plate behind a cover"],
  ["bg-neutral-50", "Tailwind", "Placeholder panel plate"],
];

export default function DesignSystemPage() {
  const { markWidth, wordmarkWidth, gapWidth, height } = LOCKUP_GEOMETRY;

  return (
    <div className="mx-auto w-full max-w-[90rem] px-5 pb-24 sm:px-8 lg:px-12">
      <header className="py-14 lg:py-24">
        <Lockup className="h-auto w-40 text-black lg:w-52" />
        <h1 className="mt-8 text-display font-medium tracking-tight">
          Design system
        </h1>
        <p className="mt-4 max-w-[64ch] text-lead tracking-tight text-neutral-600">
          Everything this site is built from, read out of the code rather than
          out of intent. Where something is inconsistent it is listed at the
          foot, with evidence and a fix.
        </p>
        <nav className="mt-8 flex flex-wrap gap-2">
          {[
            ["type", "Type"],
            ["colour", "Colour"],
            ["shape", "Shape"],
            ["motion", "Motion"],
            ["components", "Components"],
            ["scroll", "Scroll system"],
            ["issues", "Issues"],
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="inline-flex h-9 items-center rounded-full border border-black px-4 text-control tracking-tight transition-colors hover:bg-black hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      {/* --- Type ---------------------------------------------------------- */}
      <Section
        id="type"
        title="Type"
        intro="One family, Space Grotesk, self-hosted by next/font and set as --font-sans so preflight applies it everywhere. No element needs a font class."
      >
        <Row
          name="--text-display"
          meaning="clamp(2rem, 2.6vw, 3.125rem). The καλός term and the closer."
        >
          <p className="text-display font-medium tracking-tight">Let’s connect.</p>
        </Row>
        <Row
          name="--text-lead"
          meaning="clamp(1.125rem, 1.5vw, 1.75rem). Positioning line, definition, section labels."
        >
          <p className="text-lead tracking-tight">
            Companies turn to us to build presence and get recognized.
          </p>
        </Row>
        <Row
          name="--text-control"
          meaning="clamp(0.875rem, 1vw, 1.125rem). Buttons and pills only."
        >
          <p className="text-control tracking-tight">Book a call</p>
        </Row>
        <Row
          name="Tailwind scale"
          meaning="text-sm and text-xs carry captions, tags and fine print. Still preferred for ordinary work."
        >
          <p className="text-sm tracking-tight">
            text-sm — captions, discipline tags, fine print
          </p>
          <p className="mt-1 text-xs tracking-tight text-neutral-500">
            text-xs — the smallest thing that ships
          </p>
        </Row>
        <Row
          name="tracking-tight"
          meaning="On essentially everything. The wireframe sets negative tracking at every size; the default looks loose beside it."
        >
          <p className="text-lead">Untracked, for comparison</p>
          <p className="text-lead tracking-tight">Tracked, as shipped</p>
        </Row>
      </Section>

      {/* --- Colour -------------------------------------------------------- */}
      <Section
        id="colour"
        title="Colour"
        intro="Five brand colours are declared in @theme. None of them are used yet — the site is deliberately being built in black and white first. That gap is issue 1."
      >
        <h3 className="text-lead font-medium tracking-tight">Brand palette</h3>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {BRAND.map(([name, hex, role]) => (
            <div key={name}>
              <div
                className="h-24 w-full border border-black/15"
                style={{ backgroundColor: hex }}
              />
              <p className="mt-2 text-sm tracking-tight">{name}</p>
              <p className="text-sm tracking-tight text-neutral-500">{hex}</p>
              <p className="mt-1 max-w-[24ch] text-xs tracking-tight text-neutral-500">
                {role}
              </p>
              <p className="mt-2 text-xs tracking-tight">
                <span className="rounded-full border border-black/30 px-2 py-0.5 text-neutral-600">
                  0 uses in app/
                </span>
              </p>
            </div>
          ))}
        </div>

        <h3 className="mt-14 text-lead font-medium tracking-tight">
          What the site actually renders
        </h3>
        <p className="mt-2 max-w-[64ch] text-sm tracking-tight text-neutral-600">
          Black, white, and seven separate greys — none of them tokens. This is
          issue 2.
        </p>
        <div className="mt-5">
          {GREYS_IN_USE.map(([value, source, use]) => (
            <Row key={value} name={value} meaning={use}>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block h-8 w-16 border border-black/15 ${
                    value.startsWith("#") ? "" : value.replace("text-", "bg-")
                  }`}
                  style={value.startsWith("#") ? { backgroundColor: value } : undefined}
                />
                <span className="text-sm tracking-tight text-neutral-500">
                  {source}
                </span>
              </div>
            </Row>
          ))}
        </div>
      </Section>

      {/* --- Shape --------------------------------------------------------- */}
      <Section
        id="shape"
        title="Shape"
        intro="One radius for controls, none at all for imagery."
      >
        <Row
          name="--radius-button"
          meaning="9999px. Buttons and pills share it — they are the same kind of object. Named 'button' though it covers both; see issue 3."
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-11 w-44 items-center justify-center rounded-button border border-black text-control tracking-tight">
              rounded-button
            </span>
            <span className="inline-flex h-9 items-center rounded-full border border-black px-4 text-control tracking-tight">
              rounded-full
            </span>
          </div>
        </Row>
        <Row
          name="Imagery: no radius"
          meaning="Square corners on every image, everywhere. A 1px black hairline is the frame instead."
        >
          <div className="aspect-[1195/681] w-full max-w-md border border-black bg-neutral-100" />
          <p className="mt-2 text-sm tracking-tight text-neutral-500">
            aspect-[1195/681] — the case study frame, from the wireframe
          </p>
        </Row>
        <Row name="Hairlines" meaning="border-black on imagery; border-black/10 to /30 for structure.">
          <div className="space-y-2">
            {["border-black", "border-black/30", "border-black/15", "border-black/10"].map((c) => (
              <div key={c} className={`border-t ${c} pt-2 text-sm tracking-tight text-neutral-500`}>
                {c}
              </div>
            ))}
          </div>
        </Row>
      </Section>

      {/* --- Motion -------------------------------------------------------- */}
      <Section
        id="motion"
        title="Motion"
        intro="Four values, all inline. None are tokens — issue 4."
      >
        <Row name="duration-200" meaning="Colour changes: button and pill hover, active state.">
          <span className="inline-flex h-11 w-44 items-center justify-center rounded-button border border-black bg-transparent text-control tracking-tight transition-colors duration-200 hover:bg-black hover:text-white">
            Hover me
          </span>
        </Row>
        <Row name="duration-500" meaning="The work rail retiring as the closer arrives." />
        <Row
          name="520ms"
          meaning="The cover morph between a panel and its case study hero."
        />
        <Row
          name="cubic-bezier(0.22, 1, 0.36, 1)"
          meaning="The one easing curve. Fast out, long settle. Used for the morph and the panel hover zoom."
        />
        <Row
          name="prefers-reduced-motion"
          meaning="Honoured by the morph, the rail's dock magnification, every programmatic scroll, and the hero handover. Snap points stay — they are positions, not motion."
        />
      </Section>

      {/* --- Components ---------------------------------------------------- */}
      <Section
        id="components"
        title="Components"
        intro="Imported here, not copied — what you see is the shipping component."
      >
        <Row
          name="BookACall"
          meaning="Two treatments, one label. Always a real link to cal.com with the modal on a click handler, so a blocked embed still books a call."
        >
          <div className="flex flex-wrap gap-4">
            <BookACall variant="filled" />
            <BookACall variant="outline" />
          </div>
        </Row>

        <Row
          name="Work rail pill"
          meaning="Copies, not the live rail — it needs case study panels to track. Active is the loudest state, because it answers 'where am I'."
        >
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex h-11 w-44 items-center justify-center rounded-full border border-black text-control tracking-tight">
              Default
            </span>
            <span className="inline-flex h-11 w-44 items-center justify-center rounded-full border border-black bg-neutral-200 text-control tracking-tight">
              Hover
            </span>
            <span className="inline-flex h-11 w-44 items-center justify-center rounded-full border border-black bg-black text-control tracking-tight text-white">
              Active
            </span>
          </div>
          <p className="mt-3 max-w-[60ch] text-sm tracking-tight text-neutral-500">
            Hovering also magnifies, Dock-style: the pill under the cursor grows
            9% and its neighbours taper off over 130px, on a raised cosine so the
            bulge has no corner. Transform only, so the column never reflows.
          </p>
        </Row>

        <Row name="Discipline tags" meaning="Read from each case study's own role field, split at render.">
          <ul className="flex flex-wrap gap-x-2 gap-y-1.5">
            {(caseStudies[0]?.role ?? "")
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
              .map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-black/25 px-2.5 py-0.5 text-xs tracking-tight text-neutral-600"
                >
                  {tag}
                </li>
              ))}
          </ul>
        </Row>

        <Row
          name="Lockup / Mark / Wordmark"
          meaning={`Three exports, one artwork. currentColor throughout. Geometry: mark ${markWidth}, gap ${gapWidth}, wordmark ${wordmarkWidth}, all at height ${height}.`}
        >
          <div className="space-y-5">
            <Lockup className="h-auto w-56 text-black" />
            <div className="flex items-center gap-6">
              <Mark className="h-10 w-auto text-black" />
              <Wordmark className="h-10 w-auto text-black" />
            </div>
          </div>
          <p className="mt-3 max-w-[60ch] text-sm tracking-tight text-neutral-500">
            The halves exist so the hero can fly the mark into the masthead while
            the letterforms fade. Never re-export these from Figma — the paths
            here are the only copy in the repo.
          </p>
        </Row>
      </Section>

      {/* --- Scroll system ------------------------------------------------- */}
      <Section
        id="scroll"
        title="Scroll system"
        intro="The most intricate part of the site, and the least visible in the markup."
      >
        <Row
          name="scroll-snap-type: y proximity"
          meaning="On <html>. Proximity, not mandatory: mandatory would never let the page rest between two stops, and the hero's handover happens between the top and the first case study."
        />
        <Row
          name="Stops"
          meaning={`${caseStudies.length} case study panels (snap-center) plus the closer (snap-start). The hero is deliberately not a stop.`}
        />
        <Row
          name="PagedScroll"
          meaning="One wheel gesture, one view, from the first case study down. Takes only the wheel — keyboard, touch, find-in-page and anchor links are untouched — and leaves the hero region free so its handover can still be scrubbed."
        />
        <Row
          name="Hero handover"
          meaning="The block rises with the page, catches 72px from the top, is held there by a transform while everything fades and the mark flies into the masthead, then releases. The hold's length is derived from the distance to the first panel, never tuned by hand."
        />
        <Row
          name="bun run check:landing"
          meaning="Drives real Chrome across five viewports and asserts the hero is fully faded and the panel centred at every stop, and that the definition block never overlaps a case study image mid-scroll. Both guard bugs that shipped."
        />
      </Section>

      {/* --- Issues -------------------------------------------------------- */}
      <Section
        id="issues"
        title="Issues"
        intro="Everything below is verified, not suspected. Ordered by how much it costs to leave alone."
      >
        <ol className="mt-2">
          <Issue
            n={1}
            severity="high"
            title="The brand palette is declared and entirely unused"
            evidence={`All five colours — ${BRAND.map(([n]) => n).join(", ")} — appear zero times outside globals.css. The site renders black, white and seven greys.`}
            why="A design system whose colours nothing uses is a plan, not a system. Every day it stays this way, more black-and-white decisions get made that the palette will have to be retrofitted into."
            fix="Apply it in one pass rather than piecemeal: obsidian-black and snow-white replace black/white, dark-silver replaces the grey sprawl in issue 2, vulcan-gold takes the active pill and the primary button."
          />
          <Issue
            n={2}
            severity="high"
            title="Seven greys, no token, two sources of truth"
            evidence="#525252 hardcoded in work.css, plus neutral-400/500/600 for text and neutral-50/100/200 for surfaces. Meanwhile dark-silver (#A8A8A8) is defined as the brand's secondary text colour and used nowhere."
            why="Secondary text has no single definition, so /work and the landing page can drift apart without anyone noticing — which is exactly how the two pages diverged the first time."
            fix="Collapse to two tokens: one secondary text, one surface. Resolve them against dark-silver rather than picking a Tailwind neutral, or change the brand value if #A8A8A8 is genuinely too light on white."
          />
          <Issue
            n={3}
            severity="medium"
            title="Two buttons that look identical behave differently"
            evidence={
              "app/work/[slug]/page.js hardcodes https://cal.com/kalos/intro in a plain anchor. Every other Book a call on the site is the BookACall component, which opens the Cal modal."
            }
            why="Same label, same shape, same size — one opens a modal over the page and one navigates away. It also duplicates booking.link, so changing the booking path leaves this one pointing at a dead URL."
            fix="Use BookACall on the case study page. It already handles the fallback."
          />
          <Issue
            n={4}
            severity="medium"
            title="Motion has no tokens"
            evidence="duration-200, duration-500, 520ms and one cubic-bezier, all written inline at the point of use."
            why="The easing curve in particular is a brand decision repeated as a literal in two files. A third animation will get a different one without anybody deciding to."
            fix="Add --ease-brand and a small duration scale to @theme, the way the type sizes already are."
          />
          <Issue
            n={5}
            severity="low"
            title="--radius-button covers pills too"
            evidence="The token is named button; rounded-button and rounded-full are both in use for what is one shape decision."
            why="Naming drift. Somebody will eventually add a third radius because the token did not sound like it applied to them."
            fix="Rename to --radius-control and use it in both places, or accept rounded-full as the idiom and delete the token."
          />
          <Issue
            n={6}
            severity="low"
            title="The landing page jacks the scroll wheel"
            evidence="paged-scroll.js calls preventDefault on wheel events from the first case study down."
            why="It was asked for and it is scoped carefully — keyboard, touch and the hero region are all untouched — but it is a deliberate exception to a rule this codebase otherwise holds, and exceptions get copied."
            fix="Nothing, unless it stops feeling right. Recorded here so the next person knows it was a decision rather than an accident."
          />
        </ol>

        <h3 className="mt-14 text-lead font-medium tracking-tight">Fixed</h3>
        <ul className="mt-4">
          <li className="border-b border-black/10 py-6">
            <p className="text-sm font-medium tracking-tight">
              agentation no longer ships to production
            </p>
            <p className="mt-2 max-w-[72ch] text-sm tracking-tight text-neutral-600">
              Moved to devDependencies, which fixed how it was classified and
              nothing else: the 428KB chunk was still built, because
              app/layout.js imports it statically and only the render was guarded
              by NODE_ENV. A static import is resolved and bundled whether or not
              the branch using it survives, so a runtime check cannot undo a
              build-time decision. next.config.mjs now aliases the package to a
              stub for production builds only. Chunks went from 1.3M to 864K, and
              the real toolbar still loads in development — both measured.
            </p>
            <p className="mt-2 max-w-[72ch] text-sm tracking-tight text-neutral-500">
              Worth keeping: the comment beside that import used to claim Next
              dropped the import along with the dead branch. It never did.
            </p>
          </li>
        </ul>

        <p className="mt-10 max-w-[70ch] text-sm tracking-tight text-neutral-600">
          Not listed, because they are decisions rather than defects: the
          placeholder ConEdison entry ({workRail.length} pills against{" "}
          {caseStudies.length} case studies), the black-and-white build, and the
          absence of a unit test suite.
        </p>
      </Section>
    </div>
  );
}
