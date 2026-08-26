/**
 * Scroll behaviour checks for the landing page.
 *
 *     bun run dev                 # in another shell
 *     bun run check:scroll
 *
 * The companion to check-landing.mjs, which measures where things *sit*. This
 * measures what the page does when it is driven, because that is the part that
 * has broken most often and the part an eye is worst at judging -- every scroll
 * bug in this project's history was reported as a feeling ("impossible to
 * scroll", "it kinda freaks out", "super weird") and every one of them turned
 * out to be a specific, measurable rule firing in the wrong order.
 *
 * Each assertion below is a bug that shipped:
 *
 *   FLICKS      One trackpad gesture must move exactly one view. A flick is a
 *               burst of small deltas followed by a decaying momentum tail, and
 *               without holding the lock through that tail one flick paged three
 *               panels.
 *
 *   INTERLEAVE  The wheel and the keyboard share a lock, so the interesting case
 *               is one straight after the other. An early version had the
 *               keyboard take the wheel's momentum lock, which left the trackpad
 *               swallowed for up to MAX_LOCK_MS after a keystroke that had no
 *               momentum to absorb.
 *
 *   KEYS        Arrow and page keys must land on stops. Before they were handled
 *               at all, an arrow key scrolled ~40px and proximity snapping
 *               dragged the page straight back, so the press did nothing.
 *
 *   HANDBACK    Everything that is not a bare arrow or page key must reach the
 *               browser: typing in a field, Cmd-Arrow, a modal's own keys. A
 *               swallowed keystroke in a text field is a far worse failure than
 *               a swallowed one on the page.
 *
 *   RETURN      "Back to Work" must land on the panel of the study it was
 *               clicked from, centred, with the hero gone. It used to go to
 *               `/#work` -- the top of the section -- so the way out of a study
 *               was a different place from the way in.
 *
 * Uses the installed Google Chrome via `channel: "chrome"`, like check-landing.
 */

import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

// A panel counts as centred within this. Not zero: browsers land on fractional
// pixels and device pixel ratios differ.
const CENTRE_TOLERANCE = 2;
// Below this the hero counts as gone.
const FADED = 0.02;
// Long enough for a paged scroll to run and settle (SETTLE_MS is 500).
const SETTLE = 1000;

// A trackpad flick, as the hardware actually emits it: a short ramp up, then a
// decaying tail after the fingers have lifted. A single large delta is a mouse
// wheel and does not exercise the lock at all, which is why an earlier round of
// this was tested with synthetic events and reported working while the real
// trackpad was unusable.
const FLICK = [6, 14, 28, 44, 52, 44, 30, 18, 10, 6, 4, 3, 2];

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

let failed = false;
let measured = 0;
const check = (name, ok, detail = "") => {
  measured += 1;
  if (!ok) failed = true;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name.padEnd(52)}${detail ? "  " + detail : ""}`,
  );
};

const panels = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('[id^="case-"]')].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        id: el.id,
        off: Math.round(r.top + r.height / 2 - window.innerHeight / 2),
      };
    }),
  );

const nearest = async () =>
  (await panels()).reduce((a, b) => (Math.abs(a.off) < Math.abs(b.off) ? a : b));

const heroOpacity = () =>
  page.evaluate(() => +getComputedStyle(document.querySelector("header")).opacity);

const scrollY = () => page.evaluate(() => window.scrollY);

const flick = async (direction) => {
  for (const delta of FLICK) {
    await page.mouse.wheel(0, delta * direction);
    await page.waitForTimeout(16);
  }
};

const step = async (act) => {
  await act();
  await page.waitForTimeout(SETTLE);
  return nearest();
};

const load = async (url = BASE) => {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  // Wait for what is about to be measured, not for the network. An earlier
  // version of check-landing passed four viewports by measuring a page that had
  // not hydrated.
  await page.waitForSelector('[id^="case-"]', { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
};

try {
  await load();
  const order = (await panels()).map((p) => p.id);
  if (order.length < 5) throw new Error(`only ${order.length} panels found`);
  await page.mouse.move(700, 450);

  // --- FLICKS ------------------------------------------------------------
  const down = [];
  for (let i = 0; i < 4; i++) down.push((await step(() => flick(1))).id);
  check(
    "one trackpad flick moves exactly one view",
    down.join(",") === order.slice(0, 4).join(","),
    down.join(" -> "),
  );

  const up = [];
  for (let i = 0; i < 3; i++) up.push((await step(() => flick(-1))).id);
  check(
    "flicking back up reverses it",
    up.join(",") === order.slice(0, 3).reverse().join(","),
    up.join(" -> "),
  );

  // --- KEYS --------------------------------------------------------------
  await load();
  await page.evaluate(() => document.body.focus());
  const keyed = [];
  for (let i = 0; i < 3; i++)
    keyed.push(await step(() => page.keyboard.press("ArrowDown")));
  check(
    "ArrowDown steps one panel at a time",
    keyed.map((k) => k.id).join(",") === order.slice(0, 3).join(","),
    keyed.map((k) => k.id).join(" -> "),
  );
  check(
    "every key step lands centred",
    keyed.every((k) => Math.abs(k.off) <= CENTRE_TOLERANCE),
    keyed.map((k) => `${k.off}px`).join(" "),
  );
  const heroGone = await heroOpacity();
  check("the hero is gone once paged past it", heroGone < FADED, `opacity ${heroGone}`);

  const paged = await step(() => page.keyboard.press("PageDown"));
  check(
    "PageDown lands on a stop rather than between two",
    Math.abs(paged.off) <= CENTRE_TOLERANCE,
    `${paged.id}@${paged.off}px`,
  );

  for (let i = 0; i < 6; i++) await step(() => page.keyboard.press("ArrowUp"));
  check("ArrowUp all the way reaches the hero", (await scrollY()) === 0);

  // --- INTERLEAVE --------------------------------------------------------
  // The wheel and the keyboard share one lock, so each must leave the other
  // usable straight afterwards.
  await load();
  await page.mouse.move(700, 450);
  await page.evaluate(() => document.body.focus());

  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(600); // just past SETTLE_MS
  const beforePad = (await nearest()).id;
  const afterPad = await step(() => flick(1));
  check(
    "a trackpad flick straight after an arrow key still pages",
    afterPad.id !== beforePad && Math.abs(afterPad.off) <= CENTRE_TOLERANCE,
    `${beforePad} -> ${afterPad.id}@${afterPad.off}px`,
  );

  const beforeKey = (await step(() => flick(1))).id;
  const afterKey = await step(() => page.keyboard.press("ArrowDown"));
  check(
    "an arrow key straight after a trackpad flick still pages",
    afterKey.id !== beforeKey && Math.abs(afterKey.off) <= CENTRE_TOLERANCE,
    `${beforeKey} -> ${afterKey.id}@${afterKey.off}px`,
  );

  // --- HANDBACK ----------------------------------------------------------
  await load();
  await page.evaluate(() => {
    const input = document.createElement("input");
    input.id = "scroll-check-probe";
    input.style.cssText = "position:fixed;top:8px;left:8px;z-index:99";
    document.body.append(input);
    input.focus();
  });
  const beforeTyping = await scrollY();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(600);
  check(
    "arrows inside a text field are not taken",
    (await scrollY()) === beforeTyping,
  );
  await page.evaluate(() =>
    document.getElementById("scroll-check-probe")?.remove(),
  );

  await page.evaluate(() => document.body.focus());
  const beforeMeta = await scrollY();
  await page.keyboard.press("Meta+ArrowDown");
  await page.waitForTimeout(700);
  const afterMeta = await scrollY();
  check(
    "Cmd+ArrowDown stays the browser's (jump to bottom)",
    afterMeta > beforeMeta + 500,
    `${beforeMeta} -> ${afterMeta}`,
  );

  // --- RETURN ------------------------------------------------------------
  for (const slug of ["my-heb-app", "echocare", "vital-energy"]) {
    await page.goto(`${BASE}/work/${slug}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(`a[href="/#case-${slug}"]`, { timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await page.click(`a[href="/#case-${slug}"]`);
    await page.waitForSelector('[id^="case-"]', { timeout: 30000 });
    await page.waitForTimeout(SETTLE);
    const landed = await nearest();
    const hero = await heroOpacity();
    check(
      `Back to Work from ${slug} returns to its own panel`,
      landed.id === `case-${slug}` &&
        Math.abs(landed.off) <= CENTRE_TOLERANCE &&
        hero < FADED,
      `${landed.id}@${landed.off}px  hero ${hero}`,
    );
  }
} catch (error) {
  failed = true;
  console.log(`FAIL  ${error.message.split("\n")[0]}`);
  console.log(`      Is \`bun run dev\` running at ${BASE}?`);
} finally {
  await browser.close();
}

// A run that asserted nothing is a failure, not a pass. check-landing reported
// four green viewports while finding zero pills before it learned this.
if (!measured) {
  console.log("\nMeasured nothing.");
  process.exit(1);
}
if (failed) {
  console.log("\nA check failed. Each one guards a scroll bug that shipped;");
  console.log("see the comment at the top of this file for what each means.");
  process.exit(1);
}
console.log(`\nAll ${measured} checks pass.`);
