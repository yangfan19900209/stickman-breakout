import { test, expect } from "@playwright/test";
test.use({ serviceWorkers: "block" });
test("comic texture loads without errors; active frames survive running, air fire, crouch, throwing and resume", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.setViewportSize({ width: 844, height: 390 });
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
  expect((await read()).art).toMatchObject({
    active: "comic",
    loaded: true,
    error: "",
  });
  await page.keyboard.down("KeyD");
  await page.keyboard.down("KeyJ");
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().player.x > 260,
  );
  await page.keyboard.up("KeyD");
  await page.keyboard.press("Space");
  await page.keyboard.press("KeyK");
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().grenades < 3,
  );
  await page.keyboard.up("KeyJ");
  await page.screenshot({ path: "reports/v05-comic-combat.png" });
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().player.grounded,
  );
  await page.keyboard.down("KeyS");
  await page.waitForTimeout(150);
  await page.keyboard.up("KeyS");
  await page.keyboard.press("KeyP");
  await page.keyboard.press("Enter");
  expect((await read()).player.health).toBe(5);
  expect((await read()).art.active).toBe("comic");
  expect(errors).toEqual([]);
});

test("missing comic texture falls back to playable legacy art", async ({
  page,
}) => {
  const crashes: string[] = [];
  page.on("pageerror", (e) => crashes.push(e.message));
  await page.route(/fc0931d5.*\.png/, (route) => route.abort());
  await page.goto("/");
  await page.waitForFunction(
    () => !!(globalThis as any).__BREAKOUT__,
    {},
    { timeout: 45000 },
  );
  await page.locator("#GameCanvas").focus();
  await page.keyboard.press("Enter");
  const before = await page.evaluate(() =>
    (globalThis as any).__BREAKOUT__.snapshot(),
  );
  expect(before.art.active).toBe("legacy");
  expect(before.art.loaded).toBe(false);
  expect(before.art.error).not.toBe("");
  await page.keyboard.down("KeyD");
  await page.keyboard.down("KeyJ");
  await page.waitForFunction(
    (x) => (globalThis as any).__BREAKOUT__.snapshot().player.x > x + 50,
    before.player.x,
  );
  await page.keyboard.up("KeyD");
  await page.keyboard.up("KeyJ");
  await page.screenshot({ path: "reports/v05-legacy-fallback.png" });
  expect(crashes).toEqual([]);
});
