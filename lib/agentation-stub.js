/**
 * Production stand-in for the `agentation` dev toolbar.
 *
 * `app/layout.js` imports Agentation statically and renders it only when
 * NODE_ENV is development. The guard keeps it off the page; it does not keep the
 * module out of the build, because a static import is resolved and bundled
 * whether or not the branch that uses it survives. That was 428KB of chunk built
 * and deployed on every release for a toolbar no visitor can reach.
 *
 * next.config.mjs aliases the package to this file for production builds only,
 * so the import resolves to something that costs nothing. It is a real module
 * exporting a real component rather than webpack's `false`, because the import
 * is a named ESM one and resolving that against an empty module is the kind of
 * thing that works until it does not.
 *
 * This should never render. If the toolbar is missing in development, the alias
 * is leaking out of the production branch -- check the `dev` flag in the webpack
 * hook rather than anything here.
 */
export function Agentation() {
  return null;
}
