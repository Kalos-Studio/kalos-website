# kalos-website
Codebase for website. 

## Local development

```
npm install   # or bun install
npm run dev   # or bun run dev
```

Then open http://localhost:3000. The homepage (`/`) is the WebGL hero — the
gold mark that responds to the pointer, and to device tilt on a phone. It used
to live at `/lab`, and that URL still redirects here. The spotlight "coming
soon" page it replaced is parked at `/coming-soon`.

It's safe to try things locally before pushing — nothing deploys until changes
are pushed to `main` (or a PR branch, if this repo has preview deploys
configured on Netlify).

## `/work` — password-protected portfolio

`/work` is a separate section for case studies. It has no link from the
homepage — it's only reachable if you know the URL — and the whole section is
marked `noindex` so search engines won't list it either.

- **Password gate:** every route under `/work` is gated by
  [middleware.js](middleware.js), which checks for a cookie set after a
  correct password is submitted on `/work/login`. Default password is `k4l0s`;
  override it by setting a `WORK_PASSWORD` env var (see
  [.env.example](.env.example)). To rotate the password and log everyone out
  at once, change `WORK_PASSWORD` and/or `WORK_ACCESS_TOKEN`.
- **Adding case studies:** all content lives in
  [app/work/data.js](app/work/data.js) — the schema is documented in a comment
  at the top of that file. Add an entry to the `caseStudies` array and it
  automatically shows up on the `/work` listing and gets its own page at
  `/work/<slug>`. Images go in `public/work/<slug>/...`.
- **Standard case study page format:** eyebrow label, title, one-line
  summary, optional facts (client / role / year), cover image, then a body
  made of `paragraph` / `heading` / `image` / `list` blocks — see
  [app/work/[slug]/page.js](app/work/[slug]/page.js) and
  [app/work/CaseStudyBody.js](app/work/CaseStudyBody.js).
