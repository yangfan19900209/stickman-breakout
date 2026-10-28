import { test, expect, Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PlaytestBrain } = require("../../scripts/playtest-brain.cjs");
// Keep unsuccessful pilot attempts in the report, rather than changing health
// or enemies to guarantee victory. Retried wins are reported separately.
test.describe.configure({ retries: 2 });
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
    { timeout: 45000 },
  );
  await page.locator("#GameCanvas").focus();
  return errors;
}
const read = (page: Page) =>
  page.evaluate(() => (globalThis as any).__BREAKOUT__.snapshot());
async function state(page: Page, s: string, timeout = 10000) {
  await page.waitForFunction(
    (s) => (globalThis as any).__BREAKOUT__.snapshot().state === s,
    s,
    { timeout },
  );
}
async function click(page: Page, x: number, y: number) {
  const b = await page.locator("#GameCanvas").boundingBox();
  if (!b) throw Error("No canvas");
  const k = Math.min(b.width / 1280, b.height / 720);
  await page.mouse.click(
    b.x + (b.width - 1280 * k) / 2 + x * k,
    b.y + (b.height - 720 * k) / 2 + (720 - y) * k,
  );
}

test("title, left-facing air fire, pause, audio switch, home and restart", async ({
  page,
}) => {
  const errors = await boot(page);
  await page.screenshot({ path: "reports/title.png" });
  await page.keyboard.press("Enter");
  await state(page, "playing");
  await page.keyboard.down("KeyA");
  await page.keyboard.down("KeyJ");
  await page.keyboard.down("Space");
  await page.waitForFunction(() => {
    const s = (globalThis as any).__BREAKOUT__.snapshot();
    return s.player.y > 200 && s.shots > 1;
  });
  await page.keyboard.up("KeyA");
  await page.keyboard.up("KeyJ");
  await page.keyboard.up("Space");
  expect((await read(page)).player.facing).toBe(-1);
  await page.keyboard.press("KeyP");
  await state(page, "paused");
  const frozen = await read(page);
  await page.waitForTimeout(250);
  expect((await read(page)).time).toBe(frozen.time);
  await click(page, 640, 156);
  expect((await read(page)).audio.muted).toBe(true);
  await page.screenshot({ path: "reports/pause.png" });
  await page.keyboard.press("Escape");
  await state(page, "playing");
  const pause = (await read(page)).controls.layout.pause;
  await click(page, pause.x, pause.y);
  await state(page, "paused");
  await click(page, 793, 238);
  await state(page, "title");
  await page.keyboard.press("Enter");
  await state(page, "playing");
  const s = await read(page);
  expect(s.player.health).toBe(5);
  expect(s.weapon).toBe("rifle");
  expect(s.grenades).toBe(3);
  expect(s.kills).toBe(0);
  expect(errors).toEqual([]);
});

test("actual enemy damage leads to game over; restart restores objects and player", async ({
  page,
}) => {
  const errors = await boot(page);
  await page.keyboard.press("Enter");
  await state(page, "playing");
  await state(page, "gameover", 30000);
  expect((await read(page)).player.health).toBe(0);
  await page.screenshot({ path: "reports/game-over.png" });
  await click(page, 640, 271);
  await state(page, "playing");
  const s = await read(page);
  expect(s.player.health).toBe(5);
  expect(s.player.x).toBeLessThan(130);
  expect(s.objects.find((o: any) => o.id === "shotgun-cache").alive).toBe(true);
  expect(errors).toEqual([]);
});

test("complete V0.5 story with real keyboard input, mini tank and two-phase final boss", async ({
  page,
}) => {
  test.setTimeout(600000);
  // Replay at a fixed browser clock cadence so GPU/IPC timing does not change
  // the input policy. All actions still use real keyboard events and Cocos.
  await page.clock.install({ time: new Date("2026-10-15T00:00:00Z") });
  const errors = await boot(page);
  await page.clock.pauseAt(new Date("2026-10-15T00:00:10Z"));
  await page.keyboard.press("Enter");
  await page.clock.runFor(34);
  await state(page, "playing");
  const brain = new PlaytestBrain(),
    held = new Set<string>(),
    weapons = new Set<string>(),
    phases = new Set<number>();
  let arenaShot = false,
    phaseTwoShot = false,
    tankShot = false,
    miniDeathAt = -1,
    bridge = false,
    lift = false;
  const trace: any[] = [];
  let lastTrace = 0;
  for (let n = 0; n < 9000; n++) {
    const s = await read(page);
    if (s.state !== "playing") break;
    if (s.miniBoss?.health === 0 && miniDeathAt < 0) miniDeathAt = s.time;
    if (miniDeathAt >= 0 && s.time - miniDeathAt > 0.3 && !tankShot) {
      await page.screenshot({ path: "reports/v05-tank-wreck.png" });
      tankShot = true;
    }
    weapons.add(s.weapon);
    if (s.boss.active) phases.add(s.boss.phase);
    bridge ||= s.mechanisms.some((m: any) => m.kind === "bridge" && m.released);
    lift ||= s.player.y > 200 && s.player.x > 4990 && s.player.x < 5150;
    if (s.time - lastTrace >= 5) {
      trace.push({
        time: s.time,
        x: s.player.x,
        y: s.player.y,
        health: s.player.health,
        kills: s.kills,
        boss: s.guardHealth,
      });
      lastTrace = s.time;
      writeFileSync(
        "reports/v02-browser-progress.json",
        JSON.stringify({ snapshot: s, trace }, null, 2),
      );
      console.log(
        `Run ${Math.round(s.time)}s x=${Math.round(s.player.x)} hp=${s.player.health} kills=${s.kills} boss=${Math.ceil(s.guardHealth)}`,
      );
    }
    if (s.arenaEntered && !arenaShot) {
      await page.screenshot({ path: "reports/v02-boss.png" });
      arenaShot = true;
    }
    if (s.boss.active && s.boss.phase === 2 && !phaseTwoShot) {
      await page.screenshot({ path: "reports/v02-boss-phase2.png" });
      phaseTwoShot = true;
    }
    const f = brain.next(s),
      desired = new Set<string>();
    if (f.axis > 0) desired.add("KeyD");
    if (f.axis < 0) desired.add("KeyA");
    if (f.jumpHeld) desired.add("Space");
    if (f.shoot) desired.add("KeyJ");
    if (f.crouch) desired.add("KeyS");
    if (f.aimY) desired.add("KeyW");
    if (f.grenade) desired.add("KeyK");
    for (const key of held)
      if (!desired.has(key)) {
        await page.keyboard.up(key);
        held.delete(key);
      }
    for (const key of desired)
      if (!held.has(key)) {
        await page.keyboard.down(key);
        held.add(key);
      }
    await page.clock.runFor(34);
  }
  for (const key of held) await page.keyboard.up(key);
  const end = await read(page);
  writeFileSync(
    "reports/full-run.json",
    JSON.stringify(
      {
        timing:
          "fixed browser clock, 34 ms input cadence; real keyboard events",
        attempt: test.info().retry + 1,
        snapshot: end,
        errors,
        trace,
        weapons: [...weapons],
        phases: [...phases],
        bridgeReleased: bridge,
        liftUsed: lift,
      },
      null,
      2,
    ),
  );
  await page.screenshot({ path: "reports/complete.png" });
  expect(
    end.state,
    JSON.stringify({
      state: end.state,
      x: end.player.x,
      health: end.player.health,
      boss: end.guardHealth,
      enemies: end.enemies,
    }),
  ).toBe("complete");
  expect(end.guardHealth).toBe(0);
  expect(end.player.health).toBeGreaterThan(0);
  // Ordinary-zone clearance is optional; only the defeated boss gates completion.
  expect(end.exitOpen).toBe(true);
  expect(weapons.has("shotgun")).toBe(true);
  expect(weapons.has("rocket")).toBe(true);
  expect(phases.has(1) && phases.has(2)).toBe(true);
  expect(bridge).toBe(true);
  expect(end.droppedBullets).toBe(0);
  expect(errors).toEqual([]);
});
