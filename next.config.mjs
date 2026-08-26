import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // /work was a listing page. The landing page is the portfolio now, so a
      // second list of the same case studies would only drift from the first.
      //
      // Permanent rather than a 404 because the URL has been handed out and
      // crawled, and the content genuinely moved rather than going away. Only
      // the exact path matches -- /work/<slug> is untouched, which is the point,
      // since those are what the landing links to.
      {
        source: "/work",
        destination: "/#work",
        permanent: true,
      },
    ];
  },

  /**
   * Keep the dev toolbar out of production builds.
   *
   * app/layout.js imports Agentation statically and renders it only under
   * NODE_ENV=development. That guard drops the *render*, not the module: a
   * static import is resolved and bundled either way, which put 428KB of chunk
   * into every release for something no visitor can reach. A runtime check
   * cannot undo a build-time decision, so this replaces the module itself.
   *
   * Aliased to a stub rather than to webpack's `false`, because the import is a
   * named ESM one and resolving that against an empty module is fragile.
   *
   * Guarded on `dev`, so development still gets the real toolbar. If it ever
   * goes missing locally, this hook is the first place to look.
   *
   * Webpack only. `next build` uses webpack here; if builds ever move to
   * Turbopack this silently stops applying and the chunk comes back -- the
   * equivalent knob there is experimental.turbo.resolveAlias.
   */
  webpack(config, { dev }) {
    if (!dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        agentation: path.join(here, "lib/agentation-stub.js"),
      };
    }
    return config;
  },
};

export default nextConfig;
