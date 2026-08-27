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
 * scroll", "it kinda freaks out", "super weird", "it gets stuck") and every one
 * of them turned out to be a specific, measurable rule firing in the wrong
 * order.
 *
 * **How this drives the page, and why it is not `page.mouse.wheel`.** Paging is
 * done by CSS mandatory scroll snapping, in the compositor, off the gesture
 * phase -- which tells the browser where the fingers went down and came up.
 * Playwright's synthetic wheel events have no phase, so Chrome treats each one
 * as a whole scroll of its own and snaps it straight back: a burst of forty of
 * them moves the page *zero pixels*, which would have read as a catastrophic
 * regression and is purely an artifact of the input. So the gestures here are
 * synthesized through CDP's `Input.synthesizeScrollGesture`, which produces a
 * real phased fling with momentum on it. This file's predecessor already warned
 * that a synthetic wheel event is not a trackpad; it is not even a gesture.
 *
 *   ONEVIEW     A gentle, a normal and a firm flick each move exactly one view,
 *               in both directions, and four in a row move four. This is the
 *               whole of what "one gesture, one view" means and every scroll
 *               complaint on this page has been a violation of it.
 *
 *               The bottom of the range is asserted too: a five-pixel flick
 *               moves one view, because Chrome resolves any fling to the next
 *               snap point in its direction. There is no dead zone where a
 *               small deliberate gesture does nothing, and a dead zone at the
 *               bottom of the range is what every hand-rolled version of this
 *               had. A drag whose fingers stop before they lift is not a fling
 *               and correctly moves nothing.
 *
 *               Deliberately thrown *hard* -- 700px at 2500/s and up -- a fling
 *               travels two views, and about four at 12000/s. That is measured,
 *               not chosen: `scroll-snap-stop: always` is declared on every
 *               panel and Chrome does not honour it for compositor flings. It
 *               is left alone because the alternative is correcting the landing
 *               afterwards, which is a visible snap back, and because a hard
 *               throw going further is what every native surface does.
 *
 *   ATREST      Whatever the gesture, the page comes to rest exactly on a stop
 *               and never between two. The 1026px gap before the closer has no
 *               snap point in it, which is what mandatory rather than proximity
 *               snapping is for, and a medium scroll used to stop in it showing
 *               the tail of one panel and the top of the other.
 *
 *   REACH       The hero and the foot of the document stay reachable. Under
 *               mandatory snapping the top of the page is only reachable
 *               because the hero carries `snap-start`; without it the nearest
 *               snap point going up is the first case study you just left.
 *
 *   KEYS        Arrow and page keys must land on stops. Snapping cannot do this
 *               one: an arrow key scrolls ~40px, which is too small to change
 *               which snap point is nearest, so the page is put straight back
 *               and the press does nothing.
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

// A stop counts as reached within this. Not zero: browsers land on fractional
// pixels and device pixel ratios differ.
const TOLERANCE = 2;
// Below this the hero counts as gone.
const FADED = 0.02;
// Long enough for a scroll to run and for snapping to settle after it.
const SETTLE = 1000;

// The gestures, as distance and speed rather than as a list of deltas: CDP
// synthesizes the event stream and the momentum from these, the way the
// hardware would. Everyday gestures, all of which must move exactly one view.
const GESTURES = [
  ["a gentle drag", 150, 400],
  ["a normal flick", 400, 800],
  ["a firm flick", 500, 1200],
];

// The smallest gesture a hand can make and still be flicking. Five pixels, and
// it moves a whole view -- which is not a bug and is worth knowing on purpose:
// Chrome resolves any fling to the next snap point in its direction, so there
// is no dead zone at the bottom of the range where a small deliberate flick
// does nothing. That dead zone is what every hand-rolled version of this had.
const TINY = [5, 200];

// A throw. Travels further than one view on purpose -- see ONEVIEW above -- so
// it is asserted to land on a stop rather than to land on a particular one.
const THROW = [1200, 6000];

// A drag, not a flick: the fingers come to a stop before they lift, so there is
// no fling and nothing for the snap to resolve forwards. The page must return
// to the stop it started from rather than be left partway.
const HOLD = [200, 800];

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const cdp = await page.context().newCDPSession(page);

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

// Every stop on the page, the hero and the closer included -- the same list the
// keyboard computes, so "rests on a stop" means the same thing to both.
const stops = () =>
  page.evaluate(() => {
    const vh = window.innerHeight;
    const out = [0];
    for (const el of document.querySelectorAll('[id^="case-"]')) {
      const r = el.getBoundingClientRect();
      out.push(r.top + window.scrollY + r.height / 2 - vh / 2);
    }
    const closer = document.getElementById("connect");
    if (closer) out.push(closer.getBoundingClientRect().top + window.scrollY);
    return out.sort((a, b) => a - b);
  });

const distanceToStop = async () => {
  const list = await stops();
  const y = await scrollY();
  return Math.round(Math.min(...list.map((stop) => Math.abs(stop - y))));
};

const heroOpacity = () =>
  page.evaluate(() => +getComputedStyle(document.querySelector("header")).opacity);

const scrollY = () => page.evaluate(() => Math.round(window.scrollY));

// One gesture: fingers down, a swipe of `distance` at `speed`, fingers up, and
// whatever momentum that earns. `direction` is 1 for down the page.
const fling = async ([distance, speed], direction = 1, preventFling = false) => {
  await cdp.send("Input.synthesizeScrollGesture", {
    x: 700,
    y: 450,
    xDistance: 0,
    yDistance: -distance * direction,
    speed,
    gestureSourceType: "touch",
    preventFling,
  });
};

const flick = (direction) => fling(GESTURES[1].slice(1), direction);

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

  // --- ONEVIEW -----------------------------------------------------------
  const goto = async (target) => {
    await page.evaluate((t) => window.scrollTo(0, t), target);
    await page.waitForTimeout(SETTLE);
  };

  const stopList = await stops();
  const firstPanel = stopList[1];
  const lastPanel = stopList[stopList.length - 2];
  const closerStop = stopList[stopList.length - 1];

  for (const [label, distance, speed] of GESTURES) {
    await goto(firstPanel);
    const from = (await nearest()).id;
    await fling([distance, speed]);
    await page.waitForTimeout(SETTLE);
    const to = await nearest();
    check(
      `${label} moves exactly one view`,
      order.indexOf(to.id) - order.indexOf(from) === 1 &&
        Math.abs(to.off) <= TOLERANCE,
      `${from} -> ${to.id}@${to.off}px`,
    );
  }

  await goto(stopList[3]);
  const fromUp = (await nearest()).id;
  await flick(-1);
  await page.waitForTimeout(SETTLE);
  const toUp = await nearest();
  check(
    "a flick up moves exactly one view",
    order.indexOf(fromUp) - order.indexOf(toUp.id) === 1 &&
      Math.abs(toUp.off) <= TOLERANCE,
    `${fromUp} -> ${toUp.id}@${toUp.off}px`,
  );

  // Consecutive gestures, which is where every hand-rolled lock went deaf: the
  // second flick landed inside the first one's momentum and was swallowed.
  await load();
  const run = [];
  for (let i = 0; i < 4; i++) {
    await flick(1);
    await page.waitForTimeout(SETTLE);
    run.push((await nearest()).id);
  }
  check(
    "four flicks in a row move four views",
    run.join(",") === order.slice(0, 4).join(","),
    run.join(" -> "),
  );

  // --- ATREST ------------------------------------------------------------
  await goto(firstPanel);
  await fling(THROW);
  await page.waitForTimeout(SETTLE);
  const thrown = await distanceToStop();
  check(
    "a hard throw still lands on a stop",
    thrown <= TOLERANCE,
    `${thrown}px off, at y=${await scrollY()}`,
  );

  await goto(firstPanel);
  const tinyFrom = (await nearest()).id;
  await fling(TINY);
  await page.waitForTimeout(SETTLE);
  const tinyTo = await nearest();
  check(
    "even a 5px flick moves exactly one view",
    order.indexOf(tinyTo.id) - order.indexOf(tinyFrom) === 1 &&
      Math.abs(tinyTo.off) <= TOLERANCE,
    `${tinyFrom} -> ${tinyTo.id}@${tinyTo.off}px`,
  );

  await goto(firstPanel);
  const heldY = await scrollY();
  await fling(HOLD, 1, true);
  await page.waitForTimeout(SETTLE);
  check(
    "a drag released without a flick returns to its stop",
    (await scrollY()) === heldY,
    `${heldY} -> ${await scrollY()}`,
  );

  // The gap the whole paging apparatus was originally built for: 1026px between
  // the last panel and the closer, with no snap point in it. A medium scroll
  // used to come to rest inside it, showing the tail of one and the top of the
  // other. Mandatory snapping is what makes that unreachable.
  for (const [label, distance, speed] of GESTURES) {
    await goto(lastPanel);
    await fling([distance, speed]);
    await page.waitForTimeout(SETTLE);
    const landed = await scrollY();
    check(
      `${label} crosses the gap to the closer`,
      Math.abs(landed - closerStop) <= TOLERANCE,
      `${landed} (want ${Math.round(closerStop)})`,
    );
  }

  // --- REACH -------------------------------------------------------------
  await goto(firstPanel);
  await flick(-1);
  await page.waitForTimeout(SETTLE);
  const backAtTop = await scrollY();
  const heroBack = await heroOpacity();
  check(
    "flicking up from the first panel reaches the hero",
    backAtTop === 0 && heroBack > 0.9,
    `y=${backAtTop} hero ${heroBack}`,
  );

  await load();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(SETTLE);
  const bottom = await scrollY();
  const max = await page.evaluate(() =>
    Math.round(document.documentElement.scrollHeight - window.innerHeight),
  );
  check("the foot of the document is reachable", bottom === max, `${bottom}/${max}`);

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
    keyed.every((k) => Math.abs(k.off) <= TOLERANCE),
    keyed.map((k) => `${k.off}px`).join(" "),
  );
  const heroGone = await heroOpacity();
  check("the hero is gone once paged past it", heroGone < FADED, `opacity ${heroGone}`);

  const paged = await step(() => page.keyboard.press("PageDown"));
  check(
    "PageDown lands on a stop rather than between two",
    Math.abs(paged.off) <= TOLERANCE,
    `${paged.id}@${paged.off}px`,
  );

  for (let i = 0; i < 6; i++) await step(() => page.keyboard.press("ArrowUp"));
  check("ArrowUp all the way reaches the hero", (await scrollY()) === 0);

  // The wheel and the keyboard no longer share any state -- one is the browser's
  // and the other is this page's -- but they did, and each used to be able to
  // leave the other deaf, so each still has to work straight after the other.
  await load();
  await page.evaluate(() => document.body.focus());
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(600);
  const beforePad = (await nearest()).id;
  const afterPad = await step(() => flick(1));
  check(
    "a flick straight after an arrow key still pages",
    afterPad.id !== beforePad && Math.abs(afterPad.off) <= TOLERANCE,
    `${beforePad} -> ${afterPad.id}@${afterPad.off}px`,
  );

  const beforeKey = (await step(() => flick(1))).id;
  const afterKey = await step(() => page.keyboard.press("ArrowDown"));
  check(
    "an arrow key straight after a flick still pages",
    afterKey.id !== beforeKey && Math.abs(afterKey.off) <= TOLERANCE,
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
        Math.abs(landed.off) <= TOLERANCE &&
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
