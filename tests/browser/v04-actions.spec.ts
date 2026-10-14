import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
test("blank right tap and hold share the weapon; jump/grenade never cause extra shots", async ({
  page,
  context,
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
  const cdp = await context.newCDPSession(page),
    l = (await read()).controls.layout,
    k = 390 / 720;
  const xy = (p: any) => ({ x: p.x * k, y: 390 - p.y * k });
  await page.touchscreen.tap(560, 105);
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().playerShots === 1,
  );
  await page.waitForTimeout(180);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ id: 2, x: 580, y: 120 }],
  });
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().playerShots >= 4,
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForTimeout(200);
  const before = await read();
  await page.touchscreen.tap(
    ...(Object.values(xy(l.jump)) as [number, number]),
  );
  await page.waitForTimeout(250);
  expect((await read()).playerShots).toBe(before.playerShots);
  await page.touchscreen.tap(
    ...(Object.values(xy(l.grenade)) as [number, number]),
  );
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().grenadesThrown === 1,
  );
  expect((await read()).playerShots).toBe(before.playerShots);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, x: 240, y: 245 },
      { id: 2, ...xy(l.shoot) },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { id: 1, x: 296, y: 245 },
      { id: 2, ...xy(l.shoot) },
    ],
  });
  await page.waitForFunction(() => {
    const s = (globalThis as any).__BREAKOUT__.snapshot();
    return s.player.vx > 200 && s.playerShots > 4;
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, x: 296, y: 245 },
      { id: 2, ...xy(l.shoot) },
      { id: 3, ...xy(l.jump) },
    ],
  });
  await page.waitForFunction(() => {
    const s = (globalThis as any).__BREAKOUT__.snapshot();
    return s.player.y > 190 && s.player.vx > 200;
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [{ id: 3, ...xy(l.jump) }],
  });
  const owner = (await read()).controls.stick.owner;
  expect(owner).not.toBe(null);
  const firing = (await read()).playerShots;
  await page.waitForFunction(
    (n) => (globalThis as any).__BREAKOUT__.snapshot().playerShots > n,
    firing,
    { timeout: 1500 },
  );
  await page.screenshot({ path: "reports/v04-stage3-actions.png" });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForTimeout(200);
  const end = await read();
  await page.waitForTimeout(180);
  expect((await read()).playerShots).toBe(end.playerShots);
  expect(end.controls.stick.owner).toBe(null);
  writeFileSync(
    "reports/v04-actions.json",
    JSON.stringify(
      {
        blankTap: true,
        blankHold: true,
        jumpNoExtraShot: true,
        grenadeNoExtraShot: true,
        independentRelease: true,
        errors,
      },
      null,
      2,
    ),
  );
  expect(errors).toEqual([]);
});
