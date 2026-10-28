import { test, expect } from "@playwright/test";
test("upright soldier and real keyboard double jump, with no third takeoff", async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/");
  await page.waitForFunction(
    () => !!(globalThis as any).__BREAKOUT__,
    {},
    { timeout: 45000 },
  );
  await page.locator("#GameCanvas").focus();
  await page.keyboard.press("Enter");
  await page.screenshot({ path: "reports/v05-upright-soldier.png" });
  await page.keyboard.down("Space");
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().player.y > 220,
  );
  await page.keyboard.up("Space");
  await page.keyboard.down("Space");
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().player.jumpCount === 2,
  );
  await page.keyboard.up("Space");
  const second = await page.evaluate(
    () => (globalThis as any).__BREAKOUT__.snapshot().player,
  );
  expect(second.airJumpsRemaining).toBe(0);
  expect(second.canJump).toBe(false);
  await page.keyboard.press("Space");
  expect(
    (
      await page.evaluate(
        () => (globalThis as any).__BREAKOUT__.snapshot().player,
      )
    ).airJumpsRemaining,
  ).toBe(0);
  await page.screenshot({ path: "reports/v05-double-jump.png" });
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().player.grounded,
  );
  expect(
    (
      await page.evaluate(
        () => (globalThis as any).__BREAKOUT__.snapshot().player,
      )
    ).airJumpsRemaining,
  ).toBe(1);
});
test("two actual touch presses use the original jump button in the air", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/");
  await page.waitForFunction(
    () => !!(globalThis as any).__BREAKOUT__,
    {},
    { timeout: 45000 },
  );
  await page.locator("#GameCanvas").focus();
  await page.keyboard.press("Enter");
  const s = await page.evaluate(() =>
      (globalThis as any).__BREAKOUT__.snapshot(),
    ),
    b = s.controls.layout.jump,
    k = 390 / s.display.height;
  const cdp = await context.newCDPSession(page),
    point = { x: b.x * k, y: (s.display.height - b.y) * k };
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ id: 1, ...point }],
  });
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().player.y > 210,
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ id: 2, ...point }],
  });
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().player.jumpCount === 2,
  );
  expect(
    (
      await page.evaluate(
        () => (globalThis as any).__BREAKOUT__.snapshot().player,
      )
    ).airJumpsRemaining,
  ).toBe(0);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await cdp.detach();
});
