import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const { BypassBrain } = createRequire(import.meta.url)(
  "../../scripts/bypass-brain.cjs",
);

test("real keys: bypass living soldiers, activate boss, retreat freely and re-enter", async ({
  page,
}) => {
  test.setTimeout(240000);
  await page.setViewportSize({ width: 844, height: 390 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/");
  await page.waitForFunction(() => !!(globalThis as any).__BREAKOUT__);
  await page.locator("#GameCanvas").focus();
  await page.keyboard.press("Enter");
  const brain = new BypassBrain(),
    held = new Set<string>();
  let last: any,
    captured = false;
  for (let n = 0; n < 4200; n++) {
    last = await page.evaluate(() =>
      (globalThis as any).__BREAKOUT__.snapshot(),
    );
    if (last.state !== "playing") break;
    const f = brain.next(last);
    if (brain.entries.length && !captured) {
      await page.screenshot({ path: "reports/v042-bypassed-boss.png" });
      captured = true;
    }
    if (brain.phase === "done") break;
    const desired = new Set<string>();
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
    phase: brain.phase,
    entries: brain.entries,
    retreat: brain.retreat,
    snapshot: last,
    errors,
  };
  writeFileSync("reports/v042-bypass.json", JSON.stringify(result, null, 2));
  expect(
    brain.phase,
    JSON.stringify({
      x: last.player.x,
      hp: last.player.health,
      phase: brain.phase,
    }),
  ).toBe("done");
  expect(brain.entries).toHaveLength(2);
  // Previously fired rockets can destroy the turret after we stop shooting.
  // The regression needs living ordinary C-zone enemies on BOTH entries, not one fixed soldier.
  expect(
    brain.entries.every((entry: any) =>
      entry.skipped.some((id: string) =>
        ["turret-C", "shield-C2", "rifle-C3"].includes(id),
      ),
    ),
  ).toBe(true);
  expect(brain.retreat.x).toBeLessThan(6660);
  expect(brain.retreat.active).toBe(false);
  expect(last.boss.active).toBe(true);
  expect(last.zones.find((z: any) => z.id === "C").cleared).toBe(false);
  expect(errors).toEqual([]);
});
