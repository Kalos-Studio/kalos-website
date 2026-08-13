"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Lockup from "./lockup";
import {
  isCoarsePointer,
  needsMotionPermission,
  prefersLightweight,
  requestDeviceTilt,
  startDeviceTilt,
} from "./device";
import "./lab.css";

// The WebGL variants are client-only and each pull in three.js, so they're split
// out and loaded on demand — switching variants shouldn't mean shipping every
// renderer up front, and none of them can server-render anyway.
const loading = () => <div className="lab-loading" />;

const Solid = dynamic(() => import("./variants/solid"), { ssr: false, loading });
const Magnet = dynamic(() => import("./variants/magnet"), { ssr: false, loading });
const Parallax = dynamic(() => import("./variants/parallax"), { ssr: false, loading });

const VARIANTS = [
  {
    key: "solid",
    name: "Solid",
    Component: Solid,
    webgl: true,
    blurb: "Real extruded geometry. The mark turns to follow your cursor.",
    cost: "three.js · ~230KB gz, lazy",
  },
  {
    key: "magnet",
    name: "Magnet",
    Component: Magnet,
    webgl: true,
    blurb: "The two shapes have different mass. They stretch apart and reassemble.",
    cost: "three.js · ~230KB gz, lazy",
  },
  {
    key: "parallax",
    name: "Parallax",
    Component: Parallax,
    webgl: false,
    blurb: "The baked Figma render, tilted. No WebGL — the safe fallback.",
    cost: "no WebGL · ~5KB image",
  },
];

const FALLBACK = VARIANTS.findIndex((v) => !v.webgl);

// Some phones — older devices, low-power mode, locked-down browsers — either
// can't give us a WebGL context or lose it under memory pressure. A hero is the
// worst place to discover that, so probe once and route to the image variant
// rather than rendering an empty black canvas.
function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

export default function Lab() {
  const [index, setIndex] = useState(0);
  const [chrome, setChrome] = useState(true);
  const [webgl, setWebgl] = useState(true);
  const [coarse, setCoarse] = useState(false);
  // The switcher is lab furniture. On a phone it eats a chunk of a small screen,
  // so it starts collapsed behind a caret and the hero gets the room.
  const [expanded, setExpanded] = useState(true);
  const [hintTilt, setHintTilt] = useState(false);

  const active = VARIANTS[index];
  const Active = active.Component;

  // Deep-link a variant with ?v=magnet, and strip the switcher with ?chrome=0 —
  // handy for sending someone a single option without the lab furniture around
  // it. Read after mount rather than in the initial state, so the server and
  // client agree on the first render.
  useEffect(() => {
    const supported = hasWebGL();
    setWebgl(supported);

    const params = new URLSearchParams(window.location.search);
    const wanted = VARIANTS.findIndex((v) => v.key === params.get("v"));

    // An explicit ?v= is a deliberate choice and always wins — including over the
    // connection heuristic, so this stays testable. Only the default is downgraded
    // on a slow or metered connection.
    const target = wanted >= 0 ? wanted : prefersLightweight() ? FALLBACK : 0;

    setIndex(supported || !VARIANTS[target].webgl ? target : FALLBACK);
    if (params.get("chrome") === "0") setChrome(false);

    // ?hint=1 forces the motion prompt on any browser. It only ever mounts on
    // iOS otherwise, which makes it impossible to art-direct from a desktop —
    // Chrome's mobile emulation isn't iOS and doesn't expose requestPermission.
    if (params.get("hint") === "1") setHintTilt(true);

    // Gyroscope input, phones only.
    if (!isCoarsePointer()) return;
    setCoarse(true);
    setExpanded(false);

    // Android hands over the sensor as soon as we listen. iOS 13+ needs a grant
    // that must originate from a user gesture — but that gesture doesn't have to
    // be a button about permissions. Piggybacking on the first touch anywhere
    // gets the same result without putting a pill over the hero.
    if (!needsMotionPermission()) {
      startDeviceTilt();
      return;
    }
    // A hint rather than a button — small, dim, and gone the moment it's served
    // its purpose. Without something the tap is undiscoverable; as a pill it sat
    // on top of the hero.
    setHintTilt(true);
    const onFirstTouch = () => {
      setHintTilt(false);
      requestDeviceTilt();
    };
    window.addEventListener("pointerdown", onFirstTouch, { once: true });
    return () => window.removeEventListener("pointerdown", onFirstTouch);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      const n = Number(event.key);
      if (n >= 1 && n <= VARIANTS.length && (webgl || !VARIANTS[n - 1].webgl)) {
        setIndex(n - 1);
      }
      if (event.key.toLowerCase() === "h") setChrome((c) => !c);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [webgl]);

  return (
    <main className="lab">
      <div className="lab-stage">
        {/* Keying on the variant forces a fresh Canvas per variant. Reusing one
            would leak the previous variant's scene graph and lighting rig. */}
        <Active key={active.key} />
      </div>

      <div className={`lab-hero ${chrome ? "" : "bare"}`}>
        <h1>
          <Lockup className="lab-lockup" />
        </h1>
        <p>coming soon</p>
        {hintTilt && <span className="lab-tilt-hint">tap to enable gyroscope</span>}
      </div>

      {chrome && (
        <nav className="lab-switch" aria-label="Hero variants">
          {/* Shown everywhere, not just on touch: on desktop the only way to
              dismiss this panel used to be knowing about the `h` shortcut, which
              isn't a close button by any reasonable definition. */}
          <button
            className={`lab-caret ${expanded ? "open" : ""}`}
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            aria-label={expanded ? "Hide variants" : "Show variants"}
          >
            <svg viewBox="0 0 24 24" aria-hidden focusable="false">
              <path
                d="M6 15l6-6 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {expanded && (
            <>
          <div className="lab-tabs">
            {VARIANTS.map((variant, i) => {
              const blocked = variant.webgl && !webgl;
              return (
                <button
                  key={variant.key}
                  onClick={() => setIndex(i)}
                  disabled={blocked}
                  className={i === index ? "on" : ""}
                  aria-current={i === index}
                  title={blocked ? "WebGL unavailable on this device" : undefined}
                >
                  <span className="num">{i + 1}</span>
                  {variant.name}
                </button>
              );
            })}
          </div>
          <div className="lab-meta">
            <span className="blurb">{active.blurb}</span>
            <span className="cost">{active.cost}</span>
          </div>
          {!coarse && (
            <div className="lab-hint">
              {webgl
                ? "1–3 to switch · h to hide"
                : "WebGL unavailable — showing fallback"}
            </div>
          )}
            </>
          )}
        </nav>
      )}
    </main>
  );
}
