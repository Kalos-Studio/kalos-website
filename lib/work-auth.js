// Shared constants for gating /work behind a password.
//
// This is a soft gate (like a "coming soon" password page), not a security
// boundary for sensitive data — it's meant to keep the portfolio out of search
// engines and off the homepage until it's ready to share. Anyone who has the
// password (or a copy of the cookie) can get in.
//
// Both values can be overridden with env vars so the password can be rotated
// without a code change/deploy tied to a git diff. Set them in Netlify's env
// vars (or a local .env.local, which is gitignored) — never commit real values.
export const WORK_PASSWORD = process.env.WORK_PASSWORD || "k4l0s";

export const WORK_AUTH_COOKIE = "work_access";

// The cookie's value is intentionally decoupled from the password itself, so
// the password isn't sitting in plaintext inside every visitor's cookie jar.
export const WORK_AUTH_VALUE = process.env.WORK_ACCESS_TOKEN || "granted-kalos-work";

export const WORK_AUTH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
