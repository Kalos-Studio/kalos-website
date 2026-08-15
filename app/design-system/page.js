import Image from "next/image";
import Lockup from "../(landing)/lockup";
import "./design-system.css";

// Internal reference sheet. Not linked from anywhere and kept out of search
// results — it exists so the tokens can be looked at together, and so a value
// that has drifted is visible rather than buried in a stylesheet.
export const metadata = {
  title: "Design system — Kalos",
  robots: { index: false, follow: false, nocache: true },
};

// Each swatch paints itself from the @theme token rather than from the hex
// beside it, so this page cannot quietly drift from the source of truth. If a
// chip stops matching its label, the label is what is wrong.
const COLORS = [
  {
    token: "--color-ink",
    hex: "#030305",
    name: "Ink",
    note: "The ground. 22% of the Principles frame on its own. Cool-shifted, where the hero currently uses a warmer, lighter #060505.",
  },
  {
    token: "--color-bone",
    hex: "#F5FEFD",
    name: "Bone",
    note: "Brand white. Sampled #F5FEFC off the render slide, and already hardcoded in the lockup SVG.",
  },
  {
    token: "--color-gold-deep",
    hex: "#8B7462",
    name: "Gold deep",
    note: "Mean of the warm specks in Gold_Sand. The shadow end of the ramp.",
  },
  {
    token: "--color-gold-base",
    hex: "#AC9267",
    name: "Gold base",
    note: "The faces of the 3D mark. This is the matte body colour.",
  },
  {
    token: "--color-gold-light",
    hex: "#C19D79",
    name: "Gold light",
    note: "Brightest warm value in Gold_Ray. The colour the sunrise arrives in.",
  },
  {
    token: "--color-gold-highlight",
    hex: "#F4EEDA",
    name: "Gold highlight",
    note: "The lit bevel on the principle pills. Reserved for edges, never for fills.",
  },
];

const PLATES = [
  {
    src: "/design-system/mark-render.webp",
    alt: "The Kalos mark rendered in gold, three quarter view, on near black",
    title: "Kalos_3D_Render",
    note: "The target for the hero material. Faces are sandblasted matte with visible micro-grain, and the bevel carries a hard specular rim. What ships today is uniformly glossy, which is the whole of the gap.",
    w: 1000,
    h: 563,
  },
  {
    src: "/design-system/gold-sand.webp",
    alt: "Black sand dunes in shallow focus with warm gold specks",
    title: "Gold_Sand",
    note: "Background direction. A black granular field with warm specks, some pin-sharp and some thrown well out of focus.",
    w: 900,
    h: 795,
  },
  {
    src: "/design-system/gold-ray.webp",
    alt: "A soft warm shaft of light crossing a dark hazy field",
    title: "Gold_Ray",
    note: "The sunrise. A soft-edged warm shaft through haze, with no hard boundary anywhere in it.",
    w: 900,
    h: 633,
  },
];

const OPEN = [
  "Which of the brand file's palettes is the canonical one. These six were sampled off renders.",
  "Client logos for the proof strip. The repo has case study covers and nothing else.",
  "Booking URL for the primary call to action.",
  "Price anchor and timeline range for the FAQ.",
];

function Section({ label, title, children }) {
  return (
    <section className="border-t border-white/10 py-14">
      <div className="mb-8">
        <span className="ds-kicker">{label}</span>
        <h2 className="ds-h2 mt-2">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function DesignSystem() {
  return (
    <main className="ds-root">
      <div className="mx-auto max-w-5xl px-6 pb-24 pt-16">
        <header className="pb-14">
          <Lockup className="mb-10 block h-7 w-auto" />
          <h1 className="ds-h1 max-w-2xl">Design system</h1>
          <p className="ds-lead mt-5 max-w-2xl">
            Derived from the artwork in the brand file rather than from a spec
            page. The deck lists Color and Type in its contents, but those
            slides do not exist yet and the file has no bound variables, so
            every value here was sampled off a real render. Sources are noted so
            anything can be re-derived, or overruled.
          </p>
        </header>

        <Section label="Colour" title="Six tokens, sampled">
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {COLORS.map((c) => (
              <div key={c.token}>
                <div
                  className="ds-chip"
                  style={{ background: `var(${c.token})` }}
                />
                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <span className="ds-swatch-name">{c.name}</span>
                  <code className="ds-mono ds-mono--dim">{c.hex}</code>
                </div>
                <code className="ds-mono ds-mono--gold mt-1 block">
                  {c.token}
                </code>
                <p className="ds-note mt-2">{c.note}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section label="Type" title="Space Grotesk Medium">
          <p className="ds-body mb-8 max-w-2xl">
            Confirmed off the brand file rather than guessed. It is open source
            and on Google Fonts, so it loads through next/font with no licensing
            question. Five OpenType features are deliberately on: salt, ss01,
            ss02, ss03 and ss04. Those alternates are why the wordmark looks the
            way it does, which makes them part of the token rather than a
            nicety.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 p-6">
              <span className="ds-kicker mb-4">Features on</span>
              <span className="ds-specimen">Kalos ag</span>
            </div>
            <div className="ds-plain rounded-lg border border-white/10 p-6">
              <span className="ds-kicker mb-4">Default forms</span>
              <span className="ds-specimen">Kalos ag</span>
            </div>
          </div>

          <div className="mt-10 space-y-6">
            <span className="ds-quote">Beautiful because it is made well.</span>
            <span className="ds-quote-sub">
              We believe beauty is evidence of purposeful thinking.
            </span>
            <p className="ds-body max-w-2xl">
              Body copy at reading size. Space Grotesk is a display-leaning
              grotesk, so this is the size worth judging: if a long FAQ answer
              reads poorly here, the honest fix is a pairing rather than forcing
              the brand face down to twelve pixels.
            </p>
          </div>
        </Section>

        <Section label="Mark" title="Lockup">
          <p className="ds-body mb-8 max-w-2xl">
            The icon travels with the wordmark by rule, so this is the whole
            lockup rather than the letterforms alone. It is built from the same
            two path strings the 3D hero extrudes, which is what would make a
            handoff between the rendered mark and this flat one exact rather
            than approximate.
          </p>
          <div className="flex flex-wrap items-end gap-10 rounded-lg border border-white/10 p-8">
            <Lockup className="h-10 w-auto" />
            <Lockup className="h-7 w-auto" />
            <Lockup className="h-5 w-auto" />
          </div>
        </Section>

        <Section label="Reference" title="Plates from the brand file">
          <div className="space-y-10">
            {PLATES.map((p) => (
              <figure key={p.src}>
                <Image
                  src={p.src}
                  alt={p.alt}
                  width={p.w}
                  height={p.h}
                  className="w-full rounded-lg border border-white/10"
                />
                <figcaption className="mt-3 max-w-2xl">
                  <code className="ds-mono ds-mono--gold">{p.title}</code>
                  <p className="ds-note mt-1">{p.note}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section label="Open" title="Still missing">
          <ul className="ds-list max-w-2xl list-disc space-y-3 pl-5">
            {OPEN.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      </div>
    </main>
  );
}
