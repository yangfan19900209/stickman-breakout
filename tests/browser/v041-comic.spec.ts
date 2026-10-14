import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { PlaytestBrain } = require("../../scripts/playtest-brain.cjs");
test("mobile comic presentation: real weapon pickups, fan pellets, visible rocket and separate blasts", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 844, height: 390 });
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
  await page.keyboard.press("Enter");
  const read = () =>
    page.evaluate(() => (globalThis as any).__BREAKOUT__.snapshot());
  await page.screenshot({ path: "reports/v041-balanced-controls.png" });
  await page.keyboard.press("KeyK");
  await page.waitForFunction(() =>
    (globalThis as any).__BREAKOUT__
      .snapshot()
      .feedback.blasts.some((b: any) => b.style === "grenade"),
  );
  await page.screenshot({ path: "reports/v041-grenade-blast.png" });
  // Return to a clean run via the ordinary UI so the route is comparable to the campaign test.
  await page.keyboard.press("KeyP");
  const s0 = await read(),
    k = 390 / s0.display.height;
  await page.mouse.click(
    (s0.display.width / 2 - 153) * k,
    (s0.display.height / 2 + 122) * k,
  );
  const brain = new PlaytestBrain(),
    held = new Set<string>(),
    captures = new Set<string>();
  const styles = new Set<string>();
  let fan = false,
    rocketSpeed = 0,
    rocketSmoke = false;
  for (let n = 0; n < 3600; n++) {
    const s = await read();
    if (s.state !== "playing") break;
    for (const b of s.feedback.blasts) styles.add(b.style);
    const shots = s.projectileStates.filter((p: any) => p.owner === "player");
    fan ||=
      shots.filter((p: any) => p.kind === "pellet").length >= 4 &&
      new Set(
        shots.filter((p: any) => p.kind === "pellet").map((p: any) => p.vy),
      ).size >= 4;
    const p = shots.find(
      (p: any) =>
        p.kind === "rocket" &&
        p.x > s.player.x + 90 &&
        p.x - s.cameraX < s.display.worldVisibleWidth - 40,
    );
    if (p) {
      rocketSpeed = Math.hypot(p.vx, p.vy);
      rocketSmoke ||= s.feedback.particles.some((p: any) => p.kind === "smoke");
    }
    const kind = p
      ? "rocket"
      : shots.some((p: any) => p.kind === "pellet")
        ? "shotgun"
        : shots.length
          ? "rifle"
          : "";
    if (kind && !captures.has(kind)) {
      await page.screenshot({ path: `reports/v041-${kind}-flight.png` });
      captures.add(kind);
    }
    if (captures.has("rocket") && fan && styles.has("rocket")) break;
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
    await page.waitForTimeout(35);
  }
  for (const key of held) await page.keyboard.up(key);
  const result = {
    captures: [...captures],
    fan,
    rocketSpeed,
    rocketSmoke,
    styles: [...styles],
    errors,
  };
  writeFileSync("reports/v041-comic.json", JSON.stringify(result, null, 2));
  expect(captures).toEqual(new Set(["rifle", "shotgun", "rocket"]));
  expect(fan).toBe(true);
  expect(rocketSpeed).toBe(460);
  expect(rocketSmoke).toBe(true);
  expect(styles.has("rocket")).toBe(true);
  expect(errors).toEqual([]);
});
