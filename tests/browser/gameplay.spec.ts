import { test, expect, Page } from "@playwright/test";
import { writeFileSync } from "node:fs";

async function boot(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/");
  await page.waitForFunction(
    () => !!(globalThis as any).__BREAKOUT__,
    {},
    { timeout: 40000 },
  );
  await page.locator("#GameCanvas").focus();
  return errors;
}
const snapshot = (page: Page) =>
  page.evaluate(() => (globalThis as any).__BREAKOUT__.snapshot());
async function state(page: Page, name: string, timeout = 10000) {
  await page.waitForFunction(
    (name) => (globalThis as any).__BREAKOUT__.snapshot().state === name,
    name,
    { timeout },
  );
}
async function point(page: Page, x: number, y: number) {
  const b = await page.locator("#GameCanvas").boundingBox();
  if (!b) throw Error("Missing canvas");
  const s = Math.min(b.width / 1280, b.height / 720);
  return {
    x: b.x + (b.width - 1280 * s) / 2 + x * s,
    y: b.y + (b.height - 720 * s) / 2 + (720 - y) * s,
  };
}
async function click(page: Page, x: number, y: number) {
  const p = await point(page, x, y);
  await page.mouse.click(p.x, p.y);
}

test("title, pause/resume, left-facing airborne shooting, home and restart", async ({
  page,
}) => {
  const errors = await boot(page);
  expect((await snapshot(page)).state).toBe("title");
  await page.screenshot({ path: "reports/title.png" });
  await click(page, 760, 232);
  await state(page, "playing");
  await page.keyboard.down("KeyA");
  await page.keyboard.down("KeyJ");
  await page.keyboard.press("Space");
  await page.waitForFunction(() => {
    const s = (globalThis as any).__BREAKOUT__.snapshot();
    return s.player.y > 200 && s.shots > 1;
  });
  expect((await snapshot(page)).player.facing).toBe(-1);
  await page.keyboard.up("KeyA");
  await page.keyboard.up("KeyJ");
  await page.keyboard.press("KeyP");
  await state(page, "paused");
  const before = await snapshot(page);
  await page.waitForTimeout(250);
  const frozen = await snapshot(page);
  expect(frozen.time).toBe(before.time);
  expect(frozen.player.x).toBe(before.player.x);
  await page.screenshot({ path: "reports/pause.png" });
  await page.keyboard.press("Escape");
  await state(page, "playing");
  await click(page, 1204, 686);
  await state(page, "paused");
  await click(page, 793, 238);
  await state(page, "title");
  await page.keyboard.press("Enter");
  await state(page, "playing");
  const restarted = await snapshot(page);
  expect(restarted.player.health).toBe(5);
  expect(restarted.kills).toBe(0);
  expect(restarted.shots).toBe(0);
  expect(errors).toEqual([]);
});

test("enemy combat kills player, game over and button restart work", async ({
  page,
}) => {
  const errors = await boot(page);
  await page.keyboard.press("Enter");
  await state(page, "playing");
  await page.keyboard.down("KeyD");
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().player.x > 340,
  );
  await page.keyboard.press("Space");
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().player.x > 540,
  );
  await page.keyboard.up("KeyD");
  await state(page, "gameover", 24000);
  const dead = await snapshot(page);
  expect(dead.player.health).toBe(0);
  await page.screenshot({ path: "reports/game-over.png" });
  await click(page, 640, 271);
  await state(page, "playing");
  expect((await snapshot(page)).player.health).toBe(5);
  expect((await snapshot(page)).player.x).toBeLessThan(130);
  expect(errors).toEqual([]);
});

test("full Cocos level completion using real keyboard movement/jump/fire", async ({
  page,
}) => {
  test.setTimeout(80000);
  const errors = await boot(page);
  await page.keyboard.press("Enter");
  await state(page, "playing");
  await page.keyboard.down("KeyD");
  await page.keyboard.down("KeyJ");
  let right = true,
    jumps = 0;
  const obstacles = [
    { x: 420, y: 150, h: 54 },
    { x: 950, y: 150, h: 48 },
    { x: 1042, y: 150, h: 88 },
    { x: 1150, y: 248, h: 14 },
    { x: 1430, y: 360, h: 14 },
    { x: 1750, y: 150, h: 64 },
    { x: 2040, y: 150, h: 55 },
    { x: 2140, y: 150, h: 95 },
    { x: 2300, y: 266, h: 16 },
    { x: 2710, y: 150, h: 60 },
    { x: 2920, y: 150, h: 50 },
  ];
  for (let i = 0; i < 650; i++) {
    const s = await snapshot(page);
    if (s.state !== "playing") break;
    const waiting = s.player.x > 3180 && s.guardHealth > 0;
    if (waiting && right) {
      await page.keyboard.up("KeyD");
      right = false;
    }
    if (!waiting && !right) {
      await page.keyboard.down("KeyD");
      right = true;
    }
    const p = s.player;
    if (
      !waiting &&
      p.grounded &&
      (s.guardHealth === 0 ||
        obstacles.some(
          (r) =>
            r.x > p.x &&
            r.x - p.x < 76 &&
            r.y < p.y + 74 &&
            r.y + r.h > p.y + 2,
        ))
    ) {
      await page.keyboard.press("Space");
      jumps++;
    }
    await page.waitForTimeout(60);
  }
  await page.keyboard.up("KeyD");
  await page.keyboard.up("KeyJ");
  const end = await snapshot(page);
  writeFileSync(
    "reports/full-run.json",
    JSON.stringify({ snapshot: end, jumps, errors }, null, 2),
  );
  await page.screenshot({ path: "reports/complete.png" });
  expect(end.state, JSON.stringify(end)).toBe("complete");
  expect(end.guardHealth).toBe(0);
  expect(end.player.health).toBeGreaterThan(0);
  expect(end.cameraX).toBeGreaterThan(2600);
  expect(end.droppedBullets).toBe(0);
  expect(end.hits).toBeGreaterThan(18);
  expect(errors).toEqual([]);
});

test("landscape mobile three-finger move/jump/shoot and touch cancellation", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const errors = await boot(page);
  const start = await point(page, 760, 232);
  await page.touchscreen.tap(start.x, start.y);
  await state(page, "playing");
  const cdp = await context.newCDPSession(page);
  const right = await point(page, 225, 72),
    shoot = await point(page, 1162, 78),
    jump = await point(page, 1022, 78);
  const points = [
    { id: 1, ...right },
    { id: 2, ...shoot },
    { id: 3, ...jump },
  ];
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: points,
  });
  await page.waitForFunction(
    () => {
      const s = (globalThis as any).__BREAKOUT__.snapshot();
      return s.player.x > 150 && s.player.y > 200 && s.shots > 1;
    },
    {},
    { timeout: 5000 },
  );
  await page.screenshot({ path: "reports/mobile-multitouch.png" });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: points.slice(0, 2),
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await page.waitForTimeout(300);
  const a = await snapshot(page);
  await page.waitForTimeout(300);
  const b = await snapshot(page);
  expect(Math.abs(b.player.x - a.player.x)).toBeLessThan(2);
  expect(b.shots).toBe(a.shots);
  const pause = await point(page, 1204, 686);
  await page.touchscreen.tap(pause.x, pause.y);
  await state(page, "paused");
  const resume = await point(page, 640, 326);
  await page.touchscreen.tap(resume.x, resume.y);
  await state(page, "playing");
  // Chromium synthesizes a non-cancelable touchcancel. Creator 3.8.8's adapter calls
  // preventDefault unconditionally; capture this one engine diagnostic separately.
  const diagnostic =
    "Ignored attempt to cancel a touchcancel event with cancelable=false, for example because scrolling is in progress and cannot be interrupted.";
  writeFileSync(
    "reports/mobile-cancellation.json",
    JSON.stringify(
      {
        inputReleased: true,
        engineDiagnostics: errors.filter((e) => e === diagnostic),
        applicationErrors: errors.filter((e) => e !== diagnostic),
      },
      null,
      2,
    ),
  );
  expect(errors.filter((e) => e !== diagnostic)).toEqual([]);
});

test("portrait letterboxing preserves touch hit areas", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await boot(page);
  const start = await point(page, 760, 232);
  await page.touchscreen.tap(start.x, start.y);
  await state(page, "playing");
  await page.screenshot({ path: "reports/portrait.png" });
  const jump = await point(page, 1022, 78);
  await page.touchscreen.tap(jump.x, jump.y);
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().player.y > 190,
    {},
    { timeout: 5000 },
  );
  expect(errors).toEqual([]);
});
