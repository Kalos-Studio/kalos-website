"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Lockup from "./lockup";
import {
  isCoarsePointer,
  needsMotionPermission,
  requestDeviceTilt,
  startDeviceTilt,
} from "./device";
import "./lab.css";

// three.js is client-only and worth a couple of hundred KB, so it stays behind a
// dynamic import: the page shell paints immediately and the renderer follows.
const Solid = dynamic(() => import("./variants/solid"), {
  ssr: false,
  loading: () => <div className="lab-loading" />,
});

// Some phones — older devices, low-power mode, locked-down browsers — either
// can't give us a WebGL context or lose it under memory pressure. Probe once and
// fall back to the lockup on its own rather than rendering an empty black canvas.
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

// How long to wait for the renderer before showing the motion prompt anyway.
// It normally arrives with the first rendered frame, but a lost context or a
// chunk that never downloads would otherwise strand the prompt forever — and
// without it there's no way to reach the gyroscope at all.
const STAGE_READY_TIMEOUT_MS = 4000;

export default function Lab() {
  const [webgl, setWebgl] = useState(true);
  const [hintTilt, setHintTilt] = useState(false);
  // The stage lands seconds after this copy does. The prompt waits for it:
  // "tap to enable gyroscope" over an empty background is an instruction about
  // something that isn't on screen yet.
  const [stageReady, setStageReady] = useState(false);
  const onStageReady = useCallback(() => setStageReady(true), []);

  useEffect(() => {
    if (stageReady) return;
    const id = setTimeout(() => setStageReady(true), STAGE_READY_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [stageReady]);

  useEffect(() => {
    const supported = hasWebGL();
    setWebgl(supported);
    // Nothing to wait for when there's no stage to render.
    if (!supported) setStageReady(true);

    // ?hint=1 forces the motion prompt on any browser. It only ever mounts on
    // iOS otherwise, which makes it impossible to art-direct from a desktop —
    // Chrome's mobile emulation isn't iOS and doesn't expose requestPermission.
    const params = new URLSearchParams(window.location.search);
    if (params.get("hint") === "1") setHintTilt(true);

    // Gyroscope input, phones only.
    if (!isCoarsePointer()) return;

    // Android hands over the sensor as soon as we listen. iOS 13+ needs a grant
    // that must originate from a user gesture — but that gesture doesn't have to
    // be a button about permissions. Piggybacking on the first touch anywhere
    // gets the same result without putting a pill over the hero.
    if (!needsMotionPermission()) {
      startDeviceTilt();
      return;
    }
    setHintTilt(true);
    const onFirstTouch = () => {
      setHintTilt(false);
      requestDeviceTilt();
    };
    window.addEventListener("pointerdown", onFirstTouch, { once: true });
    return () => window.removeEventListener("pointerdown", onFirstTouch);
  }, []);

  return (
    <main className="lab">
      {webgl && (
        <div className="lab-stage">
          <Solid onReady={onStageReady} />
        </div>
      )}

      {/* The lockup sits where a site's logo sits — top left, small, out of the
          way. The 3D mark is the only thing in the middle of the page now, which
          is the point: the composition is the object, and this is the masthead
          around it. */}
      <header className="lab-header">
        <h1>
          <Lockup className="lab-lockup" />
        </h1>
      </header>

      {hintTilt && stageReady && (
        <span className="lab-tilt-hint">tap to enable gyroscope</span>
      )}
    </main>
  );
}
