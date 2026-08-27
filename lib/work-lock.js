import { cookies } from "next/headers";
import { createHash } from "node:crypto";

// A soft gate over a case study's body, not a security boundary.
//
// Its whole job is to buy time: the studies are linked from the landing page
// and the writing in them is still being cleaned up, so the cover, the title
// and the one-line summary stay public and the prose sits behind a password
// until it is ready to read.
//
// Why the body and not the page. The previous gate (see `git show
// 7ad487f^:middleware.js`) matched /work/:path* in middleware and redirected to
// a login route. That cannot work now: clicking a panel on the landing page
// runs a view transition that flies the cover into this page's hero, and a
// redirect to a third URL leaves the morph with nowhere to land. Gating inside
// the page keeps the animation, keeps the study identifiable, and still never
// sends the locked prose to the browser -- the check is on the server and the
// body is simply not rendered.
//
// Consequence worth knowing: reading a cookie opts the route out of static
// generation. `generateStaticParams` still runs, but these pages are rendered
// per request now.

// The password itself. Set WORK_PASSWORD in Netlify (or .env.local) to rotate
// it; the default is here so the gate works on a fresh checkout without
// configuration, and it is public in this file, which is the point of calling
// this soft.
export const WORK_PASSWORD = process.env.WORK_PASSWORD || "kalos";

// One escape hatch, so the whole experiment can be switched off in an env var
// rather than reverted. Anything other than "off" leaves the gate on.
export const LOCK_ENABLED = (process.env.WORK_LOCK || "on") !== "off";

// Which of the two gate variants a visitor gets. See app/work/PasswordGate.js
// for what they are. This is the default for everyone; the debug menu overrides
// it per browser with a cookie, so the two can be compared without a deploy.
export const DEFAULT_GATE = process.env.WORK_GATE === "modal" ? "modal" : "inline";

const GATE_COOKIE = "work_gate";
const DEBUG_COOKIE = "work_debug";

const COOKIE = "work_keys";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

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
// it once opens all of them. Six prompts for the same six characters is a gate
// that punishes the person you gave the password to.
export function passwordFor(cs) {
  return cs?.password || WORK_PASSWORD;
}

// A study opts out with `open: true` in data.js -- for the ones whose copy is
// already clean, so they can be sent to anyone as the rest are finished.
export async function isUnlocked(cs) {
  if (!LOCK_ENABLED || cs?.open) return true;

  const store = await cookies();
  const held = (store.get(COOKIE)?.value || "").split(" ").filter(Boolean);
  return held.includes(keyFor(passwordFor(cs)));
}

// Adds one key to the set the visitor holds rather than replacing it, so
// unlocking a study with its own password does not lock the rest back up.
// Capped because a cookie is not a keyring and nothing here is worth an
// unbounded header.
export async function grantKey(password) {
  const store = await cookies();
  const held = (store.get(COOKIE)?.value || "").split(" ").filter(Boolean);
  const next = [keyFor(password), ...held.filter((k) => k !== keyFor(password))];

  store.set(COOKIE, next.slice(0, 8).join(" "), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

// Clears every key the visitor holds. Only the debug menu calls this, and it is
// the thing that makes comparing the two variants possible at all: the cookie
// lasts a month, so without a way back to locked you get one look at the gate
// per browser profile.
export async function clearKeys() {
  const store = await cookies();
  store.delete(COOKIE);
}

// Not httpOnly, unlike the keys above. The variant is a preference rather than
// a credential, and the debug menu sets it straight from the browser with
// document.cookie so switching is a refresh rather than a round trip through a
// server action.
export async function gateVariant() {
  const store = await cookies();
  const chosen = store.get(GATE_COOKIE)?.value;
  return chosen === "modal" || chosen === "inline" ? chosen : DEFAULT_GATE;
}

// The debug menu is on in development without asking, and off in production
// until someone appends ?debug=1 -- at which point the menu itself writes the
// cookie below so it survives the next navigation.
//
// The order matters, and it was wrong first: NODE_ENV was checked before the
// cookie, which made the menu undismissable in development. That is the one
// place it most needs dismissing, because the whole point of the thing is
// judging how a page looks and the menu is sitting on top of the page. So an
// explicit 0 wins everywhere, and ?debug=1 is the way back afterwards.
export async function debugEnabled(searchParams) {
  if (searchParams?.debug === "1") return true;

  const store = await cookies();
  const chosen = store.get(DEBUG_COOKIE)?.value;
  if (chosen === "0") return false;
  if (chosen === "1") return true;

  return process.env.NODE_ENV === "development";
}
