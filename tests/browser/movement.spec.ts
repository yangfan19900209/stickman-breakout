import { test, expect } from "@playwright/test";
test("Cocos startup, keyboard movement and jump", async ({ page }) => {
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
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().state === "playing",
  );
  const read = () =>
    page.evaluate(() => (globalThis as any).__BREAKOUT__.snapshot());
  const before = await read();
  await page.keyboard.down("KeyD");
  await page.waitForFunction(
    (x) => (globalThis as any).__BREAKOUT__.snapshot().player.x > x + 55,
    before.player.x,
  );
  await page.keyboard.down("Space");
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().player.y > 200,
  );
  await page.keyboard.up("KeyD");
  await page.keyboard.up('Space');
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().player.grounded,
  );
  await page.screenshot({ path: "reports/stage-2-movement.png" });
  expect(errors).toEqual([]);
});
