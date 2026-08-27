import { cookies } from "next/headers";
import {
  KEY_COOKIE,
  KEY_MAX_AGE_SECONDS,
  LOCK_ENABLED,
  keyFor,
  passwordFor,
} from "./work-key";

// Reading and writing the visitor's keys. The password, the digest and the
// cookie's name live in work-key.js, which imports nothing from Next so that a
// plain Node script can hold a key too -- see the note there.
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

export { WORK_PASSWORD, keyFor, passwordFor } from "./work-key";

// A study opts out with `open: true` in data.js -- for the ones whose copy is
// already clean, so they can be sent to anyone as the rest are finished.
export async function isUnlocked(cs) {
  if (!LOCK_ENABLED || cs?.open) return true;

  const store = await cookies();
  const held = (store.get(KEY_COOKIE)?.value || "").split(" ").filter(Boolean);
  return held.includes(keyFor(passwordFor(cs)));
}

// Adds one key to the set the visitor holds rather than replacing it, so
// unlocking a study with its own password does not lock the rest back up.
// Capped because a cookie is not a keyring and nothing here is worth an
// unbounded header.
export async function grantKey(password) {
  const store = await cookies();
  const held = (store.get(KEY_COOKIE)?.value || "").split(" ").filter(Boolean);
  const next = [keyFor(password), ...held.filter((k) => k !== keyFor(password))];

  store.set(KEY_COOKIE, next.slice(0, 8).join(" "), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: KEY_MAX_AGE_SECONDS,
  });
}
