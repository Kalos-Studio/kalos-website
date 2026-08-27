import { createHash } from "node:crypto";

// The parts of the case study gate that are not bound to a request: the
// password, the cookie's name, and the digest that goes in it.
//
// Split out of work-lock.js because that file imports `next/headers`, and a
// plain Node script cannot resolve it -- `scripts/check-scroll.mjs` drives a
// real browser through the case study pages and needs to hand it a key first,
// or it measures a page with a modal over it. See the note in that file.
//
// The whole thing is a soft gate, not a security boundary. Its job is to buy
// time while the write-ups are cleaned up: the cover, the title and the summary
// stay public and the prose sits behind a password.

// Set WORK_PASSWORD in Netlify (or .env.local) to rotate it; the default is
// here so the gate works on a fresh checkout without configuration, and it is
// public in this file, which is the point of calling this soft.
export const WORK_PASSWORD = process.env.WORK_PASSWORD || "k4l0s";

// One escape hatch, so every study can be opened in an env var rather than by
// reverting code. Anything other than "off" leaves the gate on.
export const LOCK_ENABLED = (process.env.WORK_LOCK || "on") !== "off";

export const KEY_COOKIE = "work_keys";
export const KEY_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

// What goes in the cookie: a digest of the password, never the password. It is
// derived rather than a separate constant so that changing WORK_PASSWORD
// invalidates every cookie already out there without a second env var to
// remember to change with it.
export function keyFor(password) {
  return createHash("sha256")
    .update(`kalos/work:${password}`)
    .digest("base64url")
    .slice(0, 22);
}

// The password for one study. Per-study by default and shared in practice: a
// study can set its own `password` in data.js when it needs to go to one client
// and not another, and otherwise every study takes WORK_PASSWORD, so entering
// it once opens all of them. Asking for the same password once per study is a
// gate that punishes the person you gave it to.
export function passwordFor(cs) {
  return cs?.password || WORK_PASSWORD;
}
