import { test, expect, Page } from "@playwright/test";
import {writeFileSync} from 'node:fs';
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
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().state === "playing",
  );
  return errors;
}
const read = (page: Page) =>
  page.evaluate(() => (globalThis as any).__BREAKOUT__.snapshot());
async function point(page: Page, x: number, y: number) {
  const b = await page.locator("#GameCanvas").boundingBox();
  if (!b) throw Error("No canvas");
  const s = Math.min(b.width / 1280, b.height / 720);
  return {
    x: b.x + (b.width - 1280 * s) / 2 + x * s,
    y: b.y + (b.height - 720 * s) / 2 + (720 - y) * s,
  };
}
test("actual analog drag, dead zone, three fingers and automatic recenter", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const errors = await boot(page),
    cdp = await context.newCDPSession(page);
  const layout = (await read(page)).controls.layout,
    c = layout.joystick;
  const center = await point(page, c.x, c.y),
    dead = await point(page, c.x + 6, c.y),
    partial = await point(page, c.x + 35, c.y);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ id: 1, ...center }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ id: 1, ...dead }],
  });
  await page.waitForTimeout(120);
  expect((await read(page)).controls.stick.axis).toBe(0);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ id: 1, ...partial }],
  });
  await page.waitForFunction(() => {
    const s = (globalThis as any).__BREAKOUT__.snapshot();
    return s.controls.stick.axis > 0.3 && s.player.vx > 60;
  });
  expect((await read(page)).player.vx).toBeLessThan(180);
  const right = await point(page, c.x + c.r, c.y),
    fire = await point(page, layout.shoot.x, layout.shoot.y),
    jump = await point(page, layout.jump.x, layout.jump.y);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ id: 1, ...right }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, ...right },
      { id: 2, ...fire },
      { id: 3, ...jump },
    ],
  });
  await page.waitForFunction(() => {
    const s = (globalThis as any).__BREAKOUT__.snapshot();
    return s.player.y > 200 && s.shots > 1 && s.player.vx > 220;
  });
  await page.screenshot({ path: "reports/v02-stage1-touch.png" });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForTimeout(300);
  const a = await read(page);
  await page.waitForTimeout(250);
  const b = await read(page);
  expect(b.controls.stick.owner).toBe(null);
  expect(Math.abs(b.player.x - a.player.x)).toBeLessThan(2);
  expect(b.shots).toBe(a.shots);
  expect(errors).toEqual([]);
});
test("dragging down crouches and dragging up aims without triggering a jump", async ({
  page,
  context,
}) => {
  const errors = await boot(page),
    cdp = await context.newCDPSession(page),
    c = (await read(page)).controls.layout.joystick;
  const down = await point(page, c.x, c.y - c.r),
    up = await point(page, c.x, c.y + c.r);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ id: 1, ...down }],
  });
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().player.crouched,
  );
  expect((await read(page)).player.y).toBe(150);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ id: 1, ...up }],
  });
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().player.aimPitch > 1.5,
  );
  expect((await read(page)).player.grounded).toBe(true);
  await page.keyboard.down("KeyJ");
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().shots > 2,
  );
  await page.screenshot({ path: "reports/v02-stage1-aim.png" });
  await page.keyboard.up("KeyJ");
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(errors).toEqual([]);
});
