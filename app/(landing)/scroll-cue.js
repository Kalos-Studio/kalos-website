// A single gold chevron, and nothing else.
//
// The page's only cue that it scrolls. The hero is a full viewport with an
// object in the middle of it and no copy, so there is nothing at the bottom
// edge to be half-cut and imply more below — which is what normally does this
// job for free. The chevron says it instead.
//
// Deliberately not a button. It is a hint about the page, not a control on it:
// making it clickable would put a second interactive target on a screen whose
// only action is meant to be the mark, and a scroll-to-next-section jump is a
// worse version of the scroll it is describing. aria-hidden for the same
// reason — a screen reader is not being told anything by it.
//
// Takes a className so a section can place it. The chevron's own size, colour
// and motion live in .ln-cue (landing.css); where it sits is the caller's.
export default function ScrollCue({ className = "" }) {
  return (
    <div className={`ln-cue ${className}`} aria-hidden="true">
      {/* Stroked rather than filled, and open at both ends: a filled triangle
          reads as a play button, and a boxed chevron reads as a control. */}
      <svg viewBox="0 0 28 12" fill="none" focusable="false">
        <path
          d="M1.5 1.5 L14 10.5 L26.5 1.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
