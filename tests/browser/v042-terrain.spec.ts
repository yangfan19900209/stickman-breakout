import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";

test("mobile road: actual movement follows both sides of the ridge and can return without jumping", async ({
  page,
}) => {
  test.setTimeout(60000);
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
  const samples: {
    direction: number;
    x: number;
    y: number;
    grounded: boolean;
  }[] = [];
  let captured = false;
  for (const direction of [1, -1]) {
    const key = direction > 0 ? "KeyD" : "KeyA";
    await page.keyboard.down(key);
    await page.keyboard.down("KeyJ");
    for (let n = 0; n < 550; n++) {
      const s = await read(),
        p = s.player;
      expect(s.state).toBe("playing");
      const r = s.terrain.find(
        (r: any) => r.kind === "ground" && p.x >= r.x && p.x <= r.x + r.w,
      );
      const height =
        r.slope.left + ((r.slope.right - r.slope.left) * (p.x - r.x)) / r.w;
      if (p.grounded) expect(Math.abs(p.y - height)).toBeLessThan(0.1);
      samples.push({ direction, x: p.x, y: p.y, grounded: p.grounded });
      if (!captured && direction > 0 && p.x > 220 && p.x < 270) {
        await page.screenshot({ path: "reports/v042-road-running.png" });
        captured = true;
      }
      if (direction > 0 ? p.x > 640 : p.x < 125) break;
      await page.waitForTimeout(35);
    }
    await page.keyboard.up(key);
    await page.keyboard.up("KeyJ");
  }
  const s = await read();
  await page.screenshot({ path: "reports/v042-road-return.png" });
  const result = { samples, final: s.player, errors };
  writeFileSync("reports/v042-terrain.json", JSON.stringify(result, null, 2));
  expect(captured).toBe(true);
  expect(s.player.x).toBeLessThan(130);
  for (const direction of [1, -1]) {
    const values = samples.filter(
      (v) => v.direction === direction && v.grounded,
    );
    expect(Math.max(...values.map((v) => v.y))).toBeGreaterThan(173);
    expect(Math.min(...values.map((v) => v.y))).toBeLessThan(151);
  }
  expect(errors).toEqual([]);
});
