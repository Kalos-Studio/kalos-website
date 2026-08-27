import BookACall from "../(landing)/book-a-call";
import Lockup, { LOCKUP_GEOMETRY, Mark, Wordmark } from "../lockup";
import { caseStudies, workRail } from "../work/data";

// Internal reference, not a page anyone should find by searching.
export const metadata = {
  title: "Design system | Kalos",
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
 *
 * One trap when editing this page: Tailwind scans it for class names like any
 * other source file, and it cannot tell markup from prose. Writing a bare
 * utility name in a sentence emits that utility into the production CSS. This
 * was caught describing a class the site had just stopped using -- the sentence
 * saying it was gone is what kept it in the bundle. Refer to a retired class
 * descriptively, or wrap it so it is not a bare candidate.
 */

function Section({ id, title, intro, children }) {
  return (
    <section id={id} className="scroll-mt-8 border-t border-black/15 py-14 lg:py-20">
      <h2 className="text-display font-medium tracking-tight">{title}</h2>
      {intro && (
        <p className="mt-3 max-w-[62ch] text-lead tracking-tight text-muted">
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
          <p className="mt-1 max-w-[40ch] text-sm tracking-tight text-muted">
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
        : "border-black/30 text-muted";
  return (
    <li className="border-b border-black/10 py-7">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span
          className={`inline-flex h-7 items-center rounded-control border px-3 text-xs tracking-tight ${tone}`}
        >
          {severity}
        </span>
        <h3 className="text-lead font-medium tracking-tight">
          {n}. {title}
        </h3>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 lg:grid-cols-[8rem_1fr]">
        <dt className="text-sm tracking-tight text-muted">Evidence</dt>
        <dd className="max-w-[70ch] text-sm tracking-tight">{evidence}</dd>
        <dt className="text-sm tracking-tight text-muted">Why it matters</dt>
        <dd className="max-w-[70ch] text-sm tracking-tight">{why}</dd>
        <dt className="text-sm tracking-tight text-muted">Fix</dt>
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

// The working palette: what the light ground is actually built from.
const WORKING = [
  ["--color-muted", "#525252", "7.81:1 on white", "All secondary text: captions, kickers, sub-labels, panel summaries. Quieter shades come from the opacity modifier, not another token."],
  ["--color-surface", "#F5F5F5", "the one grey plate", "Behind a cover while it loads, and the pill hover fill. Replaced neutral-50, 100 and 200."],
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
        <p className="mt-4 max-w-[64ch] text-lead tracking-tight text-muted">
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
              className="inline-flex h-9 items-center rounded-control border border-black px-4 text-control tracking-tight transition-colors hover:bg-black hover:text-white"
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
            text-sm: captions, discipline tags, fine print
          </p>
          <p className="mt-1 text-xs tracking-tight text-muted">
            text-xs: the smallest thing that ships
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
        intro="Five brand colours are declared in @theme and none of them are used. The site is deliberately being built in black and white first. That gap is issue 1. Below them is the working palette the light ground actually runs on."
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
              <p className="text-sm tracking-tight text-muted">{hex}</p>
              <p className="mt-1 max-w-[24ch] text-xs tracking-tight text-muted">
                {role}
              </p>
              <p className="mt-2 text-xs tracking-tight">
                <span className="rounded-control border border-black/30 px-2 py-0.5 text-muted">
                  0 uses in app/
                </span>
              </p>
            </div>
          ))}
        </div>

        <h3 className="mt-14 text-lead font-medium tracking-tight">
          Working palette
        </h3>
        <p className="mt-2 max-w-[72ch] text-sm tracking-tight text-muted">
          Two tokens, where there were seven ungoverned greys. Secondary text has
          one definition now, so /work and the landing page cannot drift apart
          the way they did before.
        </p>
        <p className="mt-3 max-w-[72ch] text-sm tracking-tight text-muted">
          Neither resolves against dark-silver, and that is measured rather than
          preferred: on white it scores 2.38:1, below the 3.0 even large text
          needs. On the brand&rsquo;s own obsidian ground it is 8.61:1 and
          entirely correct. It is a dark-ground colour, and this site is light.
        </p>
        <div className="mt-5">
          {WORKING.map(([token, hex, note, use]) => (
            <Row key={token} name={token} meaning={use}>
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-8 w-16 border border-black/15"
                  style={{ backgroundColor: hex }}
                />
                <span className="text-sm tracking-tight">{hex}</span>
                <span className="text-sm tracking-tight text-muted">{note}</span>
              </div>
            </Row>
          ))}
        </div>
      </Section>

      {/* --- Shape --------------------------------------------------------- */}
      <Section
        id="shape"
        title="Shape"
        intro="One radius for controls, one for device screens, and none at all for other imagery. Screens also carry the site’s only shadow."
      >
        <Row
          name="--radius-control"
          meaning="9999px, and the only radius on anything pill-shaped. Named for controls rather than for buttons, because it covers pills too. A token that sounds like it applies to one thing is how a third radius gets invented."
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-11 w-44 items-center justify-center rounded-control border border-black text-control tracking-tight">
              rounded-control
            </span>
            <span className="inline-flex h-9 items-center rounded-control border border-black px-4 text-control tracking-tight">
              rounded-control
            </span>
          </div>
        </Row>
        <Row
          name="--radius-screen"
          meaning="1.5rem. A device screen's own corner. Product screenshots are borderless, and a hard 90-degree corner on a phone reads as a crop rather than as a device."
        >
          <div
            className="h-40 w-24 bg-surface"
            style={{
              borderRadius: "var(--radius-screen)",
              boxShadow: "var(--shadow-screen)",
            }}
          />
        </Row>
        <Row
          name="--shadow-screen"
          meaning="The one shadow, for one job: lifting a borderless screenshot off a white page. Two layers, a wide soft falloff and a tight contact edge, because a single blur reads as a smudge."
        >
          <div className="flex flex-wrap items-end gap-6">
            <div className="h-24 w-40 bg-surface" />
            <div
              className="h-24 w-40 bg-surface"
              style={{ boxShadow: "var(--shadow-screen)" }}
            />
          </div>
          <p className="mt-3 text-sm tracking-tight text-muted">
            Flat, then lifted. Deliberately low-opacity: the page is white and
            quiet, and anything heavier looks like a sticker.
          </p>
        </Row>
        <Row
          name="Imagery: no radius, no border"
          meaning="Square corners and no frame on photography and artwork. The hairline that used to sit here came from the dark template this site started as, where a rule was the only thing separating an image from the surface; on white it framed things that already had edges. Device screens are the exception above."
        >
          <div className="aspect-[1195/681] w-full max-w-md bg-surface" />
          <p className="mt-2 text-sm tracking-tight text-muted">
            aspect-[1195/681]: the case study frame, from the wireframe
          </p>
        </Row>
        <Row name="Hairlines" meaning="border-black on imagery; border-black/10 to /30 for structure.">
          <div className="space-y-2">
            {["border-black", "border-black/30", "border-black/15", "border-black/10"].map((c) => (
              <div key={c} className={`border-t ${c} pt-2 text-sm tracking-tight text-muted`}>
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
        intro="One easing curve and three durations, all named in @theme. Each duration is a kind of event rather than a point on a scale."
      >
        <Row name="duration-[var(--duration-quick)]" meaning="Colour changes: button and pill hover, active state.">
          <span className="inline-flex h-11 w-44 items-center justify-center rounded-control border border-black bg-transparent text-control tracking-tight transition-colors duration-[var(--duration-quick)] hover:bg-black hover:text-white">
            Hover me
          </span>
        </Row>
        <Row name="duration-[var(--duration-settle)]" meaning="The work rail retiring as the closer arrives." />
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
          meaning="Honoured by the morph, the rail's dock magnification, every programmatic scroll, and the hero handover. Snap points stay, because they are positions, not motion."
        />
      </Section>

      {/* --- Components ---------------------------------------------------- */}
      <Section
        id="components"
        title="Components"
        intro="Imported here, not copied: what you see is the shipping component."
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
          meaning="Copies, not the live rail, which needs case study panels to track. Active is the loudest state, because it answers 'where am I'."
        >
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex h-11 w-44 items-center justify-center rounded-control border border-black text-control tracking-tight">
              Default
            </span>
            <span className="inline-flex h-11 w-44 items-center justify-center rounded-control border border-black bg-surface text-control tracking-tight">
              Hover
            </span>
            <span className="inline-flex h-11 w-44 items-center justify-center rounded-control border border-black bg-black text-control tracking-tight text-white">
              Active
            </span>
          </div>
          <p className="mt-3 max-w-[60ch] text-sm tracking-tight text-muted">
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
                  className="rounded-control border border-black/25 px-2.5 py-0.5 text-xs tracking-tight text-muted"
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
          <p className="mt-3 max-w-[60ch] text-sm tracking-tight text-muted">
            The halves exist so the hero can fly the mark into the masthead while
            the letterforms fade. Never re-export these from Figma: the paths
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
          meaning="The bare arrow and page keys, and nothing else. The wheel is the browser's, and so are touch, find-in-page, anchor links, Home, End, space and every modified key. One lock, held for the length of a scroll, so a held key cannot fly through the page."
        />
        <Row
          name="Hero handover"
          meaning="The block rises with the page, catches 72px from the top, is held there by a transform while everything fades and the mark flies into the masthead, then releases. The hold's length is derived from the distance to the first panel, never tuned by hand."
        />
        <Row
          name="Back to Work"
          meaning="Returns to the panel of the study it was clicked from, centred, rather than to the top of the work section, matching the hero, which flies its cover back to the same place. The href is a panel anchor; HashTarget does the centring, since an anchor alone top-aligns."
        />
        <Row
          name="bun run check:landing"
          meaning="Drives real Chrome across seven viewports and asserts the hero is fully faded and the panel centred at every stop, and that the definition block never overlaps a case study image mid-scroll. Both guard bugs that shipped."
        />
        <Row
          name="bun run check:scroll"
          meaning="The companion check, for what the page does when it is driven rather than where things sit: one trackpad flick moves one view, keys and wheel each leave the other usable, typing and modified keys are handed back, and Back to Work lands on its own panel. Every scroll bug here was reported as a feeling and turned out to be measurable."
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
            evidence={`All five colours appear zero times outside globals.css: ${BRAND.map(([n]) => n).join(", ")}. The site renders black, white, and the two working tokens above.`}
            why="A design system whose colours nothing uses is a plan, not a system. Every day it stays this way, more black-and-white decisions get made that the palette will have to be retrofitted into."
            fix="Apply it in one pass: obsidian-black and snow-white replace black and white, vulcan-gold takes the active pill and the primary button. dark-silver is the open question, because it is a dark-ground colour. Either the site goes dark, or that hex is revised for a light ground, or it stays reserved for dark surfaces like the lightbox and --color-muted remains the light-ground answer."
          />
        </ol>

        <h3 className="mt-14 text-lead font-medium tracking-tight">Fixed</h3>
        <ul className="mt-4">
          <li className="border-b border-black/10 py-6">
            <p className="text-sm font-medium tracking-tight">
              The wheel is the browser&rsquo;s again
            </p>
            <p className="mt-2 max-w-[72ch] text-sm tracking-tight text-muted">
              This was logged as &ldquo;the landing page jacks the scroll wheel
              and the arrow keys&rdquo;. The wheel half is gone: there is no
              wheel listener on this site. Chrome does not tell a script which
              wheel events are fingers and which are the momentum the OS
              synthesises after they lift, so four hand-rolled handlers each
              fixed the gesture they were written for and broke another. The
              compositor has the phase information a script does not, which
              makes scroll-snap-type: y mandatory the whole answer.
            </p>
            <p className="mt-2 max-w-[72ch] text-sm tracking-tight text-muted">
              The keyboard half stays, and is a decision rather than an
              accident. Snapping cannot fix an arrow key: the press moves about
              40px, too little to change which stop is nearest, so the page is
              put straight back and nothing happens. PagedScroll is that and
              nothing else now, still scoped the way the issue credited it for
              being: touch, find-in-page, typing, Home, End and every modified
              key are handed straight back.
            </p>
          </li>
          <li className="border-b border-black/10 py-6">
            <p className="text-sm font-medium tracking-tight">
              Seven greys collapsed to two tokens
            </p>
            <p className="mt-2 max-w-[72ch] text-sm tracking-tight text-muted">
              --color-muted for every piece of secondary text and --color-surface
              for the one grey plate, replacing #525252 in work.css and six
              Tailwind neutrals. Quieter shades come from the opacity modifier
              rather than another token, so there is still one decision.
            </p>
            <p className="mt-2 max-w-[72ch] text-sm tracking-tight text-muted">
              The fix asked for these to resolve against dark-silver. They do
              not, and the measurement is why: 2.38:1 on white, below the 3.0
              even large text needs, against 8.61:1 on obsidian. Changing the
              brand hex is a brand decision rather than a housekeeping one, so it
              stays as issue 1.
            </p>
          </li>
          <li className="border-b border-black/10 py-6">
            <p className="text-sm font-medium tracking-tight">
              One Book a call, everywhere
            </p>
            <p className="mt-2 max-w-[72ch] text-sm tracking-tight text-muted">
              The case study page used the BookACall component instead of its own
              anchor, so both open the modal and both fall back to the same URL.
              No booking link is hardcoded outside content.js now.
            </p>
          </li>
          <li className="border-b border-black/10 py-6">
            <p className="text-sm font-medium tracking-tight">
              Motion is named
            </p>
            <p className="mt-2 max-w-[72ch] text-sm tracking-tight text-muted">
              --ease-brand plus quick, settle and morph durations in @theme. The
              easing curve was a literal in two files; it is one token now, and
              the view-transition rules reference it rather than repeating it.
            </p>
          </li>
          <li className="border-b border-black/10 py-6">
            <p className="text-sm font-medium tracking-tight">
              --radius-button is now --radius-control
            </p>
            <p className="mt-2 max-w-[72ch] text-sm tracking-tight text-muted">
              Renamed for what it governs, and applied to pills as well as
              buttons. The generic full-round utility is gone from the markup;
              there is one radius decision and one name for it.
            </p>
          </li>
          <li className="border-b border-black/10 py-6">
            <p className="text-sm font-medium tracking-tight">
              Screens are rounded and lifted, by token
            </p>
            <p className="mt-2 max-w-[72ch] text-sm tracking-tight text-muted">
              --radius-screen and --shadow-screen. Product screenshots lost their
              borders because the app&rsquo;s own chrome is the frame, which left
              them sitting flat on white with square corners, reading as a crop
              of a screen rather than a screen. Both are tokens rather than values
              in work.css, so the next surface that needs a device does not invent
              its own.
            </p>
          </li>
          <li className="border-b border-black/10 py-6">
            <p className="text-sm font-medium tracking-tight">
              agentation no longer ships to production
            </p>
            <p className="mt-2 max-w-[72ch] text-sm tracking-tight text-muted">
              Moved to devDependencies, which fixed how it was classified and
              nothing else: the 428KB chunk was still built, because
              app/layout.js imports it statically and only the render was guarded
              by NODE_ENV. A static import is resolved and bundled whether or not
              the branch using it survives, so a runtime check cannot undo a
              build-time decision. next.config.mjs now aliases the package to a
              stub for production builds only. Chunks went from 1.3M to 864K, and
              the real toolbar still loads in development. Both measured.
            </p>
            <p className="mt-2 max-w-[72ch] text-sm tracking-tight text-muted">
              Worth keeping: the comment beside that import used to claim Next
              dropped the import along with the dead branch. It never did.
            </p>
          </li>
        </ul>

        <p className="mt-10 max-w-[70ch] text-sm tracking-tight text-muted">
          Not listed, because they are decisions rather than defects: the
          placeholder ConEdison entry ({workRail.length} pills against{" "}
          {caseStudies.length} case studies), the black-and-white build, and the
          absence of a unit test suite.
        </p>
      </Section>
    </div>
  );
}
