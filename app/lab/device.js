"use client";

import { useEffect, useState } from "react";

/**
 * Device capability + gyroscope input.
 *
 * Deliberately kept in its own module with NO three.js imports. The page shell
 * needs these (to decide whether to show the iOS motion prompt, and whether the
 * device can run WebGL at all), and if it reached for them through stage.js it
 * would drag three, drei and postprocessing into the page's own chunk — which
 * defeats the dynamic import of the variants entirely. That mistake cost ~350KB
 * of First Load JS before it was caught.
 */

// Coarse pointer means a phone or tablet: no hover, weaker GPU, and a display
// that's usually far denser than the desktop one.
export function isCoarsePointer() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(pointer: coarse)").matches === true
  );
}

/**
 * Whether this connection wants us to go easy on it.
 *
 * The WebGL variants pull ~225KB gz of three.js. On a 3G connection that's
 * several seconds of staring at an empty hero, and Save-Data is an explicit
 * request not to spend someone's allowance. Either way we'd rather serve the
 * 120KB image variant, which is a complete experience in its own right.
 */
export function prefersLightweight() {
  if (typeof navigator === "undefined") return false;
  const connection =
    navigator.connection ?? navigator.mozConnection ?? navigator.webkitConnection;
  if (!connection) return false;
  if (connection.saveData === true) return true;
  return ["slow-2g", "2g", "3g"].includes(connection.effectiveType);
}

/**
 * Tracks tab visibility so the render loop can be parked.
 *
 * A hero animates forever by design. Left running in a background tab it keeps
 * a phone's GPU awake and eats battery for something nobody is looking at, so
 * the variants drop the Canvas to frameloop="never" while hidden.
 */
export function usePageVisible() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    onChange();
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return visible;
}

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/* ---------------------------------------------------------------------------
 * Device tilt
 *
 * On a phone there's no cursor to follow, so the gyroscope becomes the input:
 * tilting the handset turns the mark as though you were holding the object.
 *
 * A module-level singleton rather than a hook, because two very different
 * consumers need it — the R3F scene reads it every frame, and the DOM renders a
 * permission button — and there should only ever be one listener.
 * ------------------------------------------------------------------------- */

const tilt = { x: 0, y: 0, active: false };
let baseline = null;
let listening = false;

// How far you have to tilt, in degrees, to reach full deflection.
//
// 26° was too much: combined with the rotation amplitude it worked out to very
// nearly 1:1 — tilt the handset 26° and the mark turned 26° — which reads as the
// thing barely responding. 14° means a normal wrist movement covers the full
// range, and the mark moves noticeably further than the phone does.
const TILT_RANGE = 14;

function clamp(v) {
  return Math.min(1, Math.max(-1, v));
}

function onOrientation(event) {
  const { beta, gamma } = event;
  if (beta === null || gamma === null) return;

  // beta/gamma swap roles in landscape, so rotate the reading by however far the
  // screen itself is rotated.
  const angle = window.screen?.orientation?.angle ?? 0;
  let horizontal = gamma;
  let vertical = beta;
  if (angle === 90) {
    horizontal = -beta;
    vertical = gamma;
  } else if (angle === 270 || angle === -90) {
    horizontal = beta;
    vertical = -gamma;
  }

  // The first reading becomes "level". Without this, whatever angle someone
  // naturally holds their phone at would peg the mark to one extreme forever.
  if (!baseline) baseline = { horizontal, vertical };

  tilt.x = clamp((horizontal - baseline.horizontal) / TILT_RANGE);
  tilt.y = clamp((vertical - baseline.vertical) / TILT_RANGE);
  tilt.active = true;
}

function recalibrate() {
  baseline = null;
}

export function startDeviceTilt() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("deviceorientation", onOrientation);
  window.addEventListener("orientationchange", recalibrate);
}

// iOS 13+ gates the sensor behind an explicit grant that must originate from a
// user gesture. Everywhere else the listener just works.
export function needsMotionPermission() {
  return (
    typeof window !== "undefined" &&
    typeof window.DeviceOrientationEvent !== "undefined" &&
    typeof window.DeviceOrientationEvent.requestPermission === "function"
  );
}

export async function requestDeviceTilt() {
  if (!needsMotionPermission()) {
    startDeviceTilt();
    return true;
  }
  try {
    const result = await window.DeviceOrientationEvent.requestPermission();
    if (result !== "granted") return false;
    startDeviceTilt();
    return true;
  } catch {
    return false;
  }
}

export function getTilt() {
  return tilt;
}
