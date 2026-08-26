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
      (canvas.getContext("webgl2") || canvas.getContext("webgl")),
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

// The hero: first section of the landing page rather than the whole of it.
//
// The `lab-` class prefix and lab.css stay as they are. Those names describe the
// WebGL hero itself, and that stylesheet's value is the comments recording what
// each number was tried against — a rename would churn every one of them for
// nothing.
export default function Hero() {
  const [webgl, setWebgl] = useState(true);
  const [hintTilt, setHintTilt] = useState(false);
  // The stage lands seconds after this copy does. The prompt waits for it:
  // "tap to enable gyroscope" over an empty background is an instruction about
  // something that isn't on screen yet.
  const [stageReady, setStageReady] = useState(false);
  const onStageReady = useCallback(() => setStageReady(true), []);

  // The masthead waits for the sunrise to finish rather than for a delay.
  //
  // It used to animate in on a fixed 0.25s CSS delay, which is the pattern this
  // codebase keeps relearning: on a phone the renderer lands seconds later, so
  // the lockup had long since faded in over an empty background by the time
  // there was anything for it to sit above. The annotation on the mock asks for
  // it to arrive "after starting animation", and now it does.
  //
  // Same timeout as the stage: a lost context or a failed chunk must not leave
  // the masthead invisible forever, so `lit` falls back on the same guarantee
  // stageReady has.
  const [lit, setLit] = useState(false);
  const onLit = useCallback(() => setLit(true), []);

  // React hears nothing about the dock any more.
  //
  // It used to carry two class flags. The mark taking the lockup's colour became
  // a custom property written from the scroll handler, because it is a ramp
  // rather than a switch and a class can only say "started". The masthead
  // following the mark out became a scroll-driven opacity written from the same
  // place, for the same reason a timed fade was wrong for it. Both live in the
  // dock handler in variants/solid.js now. There was a third once, fading the
  // hero copy out from under the fixed masthead, and it went with the copy.

  useEffect(() => {
    if (!stageReady || lit) return;
    const id = setTimeout(() => {
      setLit(true);
      // The sunrise drives --dawn, which the sand's opacity reads. If the stage
      // died partway through, the page would otherwise be left sitting on a
      // half-lit field forever.
      document.documentElement.style.setProperty("--dawn", "1");
    }, STAGE_READY_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [stageReady, lit]);

  useEffect(() => {
    if (stageReady) return;
    const id = setTimeout(() => setStageReady(true), STAGE_READY_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [stageReady]);

  useEffect(() => {
    const supported = hasWebGL();
    setWebgl(supported);
    // Nothing to wait for when there's no stage to render.
    if (!supported) {
      setStageReady(true);
      setLit(true);
    }

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

    // Piggyback on the first *deliberate tap* anywhere, so someone who taps the
    // mark gets the sensor without having to aim at the prompt.
    //
    // "Deliberate" is doing real work here. This used to be a plain
    // `pointerdown` with `{ once: true }`, from when the hero was the whole page
    // and `touch-action: none` meant it could not scroll: the first touch was
    // necessarily an interaction with the mark. Now the page scrolls, and the
    // first touch on a phone is nearly always the start of a scroll. That still
    // fires pointerdown, so it burned the one and only listener, threw the iOS
    // permission sheet up in the middle of a swipe where it gets dismissed, and
    // left no way to ask again. Measured in a browser: a drag gesture delivers
    // pointerdown exactly like a tap does.
    //
    // So: measure the gesture, ignore anything that moved or dwelled, and only
    // stop listening once permission is actually granted. A refused or missed
    // attempt can be retried, which the previous version made impossible.
    let start = null;
    const onDown = (e) => {
      start = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    };
    const onUp = async (e) => {
      if (!start) return;
      // The prompt is a button with its own handler. Without this, tapping it
      // asks twice, which on iOS means putting the permission sheet up twice.
      if (e.target?.closest?.(".lab-tilt-hint")) {
        start = null;
        return;
      }
      const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      const held = e.timeStamp - start.t;
      start = null;
      if (moved > 10 || held > 700) return;
      const granted = await requestDeviceTilt();
      if (granted) {
        setHintTilt(false);
        detach();
      }
    };
    const detach = () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
    const onCancel = () => {
      start = null;
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return detach;
  }, []);

  // The prompt is a real button now. It was a <span> with pointer-events: none,
  // which meant the one element on screen telling you to tap was the one element
  // that could not be tapped.
  const onEnableTilt = useCallback(async () => {
    if (await requestDeviceTilt()) setHintTilt(false);
  }, []);

  return (
    <section className="lab">
      {webgl && (
        <div className="lab-stage">
          <Solid onReady={onStageReady} onLit={onLit} />
        </div>
      )}

      {/* The lockup sits where a site's logo sits — top left, small, out of the
          way. The 3D mark is the only thing in the middle of the page now, which
          is the point: the composition is the object, and this is the masthead
          around it. */}
      <header className={`lab-header${lit ? " is-lit" : ""}`}>
        <div className="lab-shell">
          <Lockup className="lab-lockup" />
        </div>
      </header>

      {/* There is no copy here any more. The mock's hero is the lockup, the sand
          and the mark, and nothing else: the headline and subhead that used to
          sit in the lower left came out with the rest of what the mock does not
          contain. The page's h1 is the word, one section down. */}

      {hintTilt && stageReady && (
        <button type="button" className="lab-tilt-hint" onClick={onEnableTilt}>
          tap to enable gyroscope
        </button>
      )}
    </section>
  );
}
