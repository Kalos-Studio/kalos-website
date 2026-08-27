# kalos-website
Codebase for website. 

## Local development

```
npm install   # or bun install
npm run dev   # or bun run dev
```

Then open http://localhost:3000. The homepage (`/`) is the spotlight "coming
soon" page. It's safe to try things locally before pushing — nothing deploys
until changes are pushed to `main` (or a PR branch, if this repo has preview
deploys configured on Netlify).

## `/work` — the case studies

`/work` holds one page per case study at `/work/<slug>`. There is no listing
page: the landing page is the portfolio, and `/work` on its own permanently
redirects to `/#work` (see [next.config.mjs](next.config.mjs)).

The section is public and deliberately indexable. It used to sit behind a
password gate in `middleware.js`, with a login page and `WORK_PASSWORD` /
`WORK_ACCESS_TOKEN` env vars; all of that is gone, along with `.env.example`.
Nothing here needs environment setup to build.

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
