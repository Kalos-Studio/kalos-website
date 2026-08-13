"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Wordmark from "./wordmark";
import {
  isCoarsePointer,
  needsMotionPermission,
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
    cost: "~225KB gz, lazy",
  },
  {
    key: "magnet",
    name: "Magnet",
    Component: Magnet,
    webgl: true,
    blurb: "The two shapes have different mass. They stretch apart and reassemble.",
    cost: "~225KB gz, lazy",
  },
  {
    key: "parallax",
    name: "Parallax",
    Component: Parallax,
    webgl: false,
    blurb: "The baked Figma render, tilted. No WebGL — the safe fallback.",
    cost: "no WebGL · 120KB image",
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
  const [askTilt, setAskTilt] = useState(false);

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
    const target = wanted >= 0 ? wanted : 0;

    setIndex(supported || !VARIANTS[target].webgl ? target : FALLBACK);
    if (params.get("chrome") === "0") setChrome(false);

    // Gyroscope input, phones only. Android hands over the sensor as soon as we
    // listen; iOS 13+ requires a grant that must come from a real tap, so there
    // we have to surface a button and wait for one.
    if (!isCoarsePointer()) return;
    if (needsMotionPermission()) setAskTilt(true);
    else startDeviceTilt();
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
          <Wordmark className="lab-wordmark" />
        </h1>
        <p>coming soon</p>
      </div>

      {askTilt && active.webgl && (
        <button
          className="lab-tilt"
          onClick={async () => {
            if (await requestDeviceTilt()) setAskTilt(false);
          }}
        >
          Tilt to move
        </button>
      )}

      {chrome && (
        <nav className="lab-switch" aria-label="Hero variants">
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
          <div className="lab-hint">
            {webgl ? "1–3 to switch · h to hide" : "WebGL unavailable — showing fallback"}
          </div>
        </nav>
      )}
    </main>
  );
}
