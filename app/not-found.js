import Link from "next/link";
import Masthead from "./masthead";
import "./not-found.css";

/**
 * The 404 for the whole site.
 *
 * There used to be a second one at app/work/not-found.js, a single grey
 * sentence hung off the top left of an otherwise empty black page, and nothing
 * at all at the root, so /randomtext fell through to Next's built-in 404: a
 * white page with black Helvetica, on a site that is otherwise obsidian black
 * throughout. Two wrong answers to the same question. This is the only one now.
 *
 * A statement and one way out, and nothing else. It carried a line of
 * explanation, a second link to /work and an "Error 404" note underneath, all
 * of which came out on instruction. Worth keeping out: a visitor who hit a dead
 * link does not need the status code, and offering two destinations turns a
 * dead end into a decision.
 *
 * Layout is utilities and type is classes, per the split in CLAUDE.md: the
 * --type-* tokens live in :root rather than @theme precisely so they cannot be
 * reached as text-* utilities.
 */
export default function NotFound() {
  return (
    <div className="nf-root">
      <Masthead className="site-masthead--fixed" />

      <div className="nf-shell mx-auto flex flex-col items-start justify-center gap-8">
        <h1 className="nf-heading max-w-2xl">This page does not exist.</h1>

        <Link href="/" className="nf-link">
          Back to home
        </Link>
      </div>
    </div>
  );
}
