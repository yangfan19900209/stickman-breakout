import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
const read = (page: any) =>
  page.evaluate(() => (globalThis as any).__BREAKOUT__.snapshot());
test("portrait blocks gameplay; rotating restores full viewport with reachable controls", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForFunction(
    () => !!(globalThis as any).__BREAKOUT__,
    {},
    { timeout: 45000 },
  );
  await page.locator("#GameCanvas").focus();
  await page.keyboard.press("Enter");
  expect((await read(page)).state).toBe("title");
  expect((await read(page)).display.portrait).toBe(true);
  await page.screenshot({ path: "reports/v021-portrait.png" });
  const rows: any[] = [];
  for (const size of [{ width: 844, height: 390 }]) {
    await page.setViewportSize(size);
    await page.waitForFunction(
      () => !(globalThis as any).__BREAKOUT__.snapshot().display.portrait,
    );
    await page.keyboard.press("Enter");
    const s = await read(page),
      d = s.display,
      l = s.controls.layout;
    const canvas = await page.locator("#GameCanvas").boundingBox();
    expect(canvas).toBeTruthy();
    expect(canvas!.width).toBeGreaterThan(size.width * 0.98);
    expect(canvas!.height).toBeGreaterThan(size.height * 0.98);
    const k = canvas!.height / d.height;
    for (const c of [l.joystick, l.shoot, l.jump, l.grenade, l.pause]) {
      expect(c.x - c.hit / 2).toBeGreaterThanOrEqual(0);
      expect(c.x + c.hit / 2).toBeLessThanOrEqual(d.width);
      expect(c.y - c.hit / 2).toBeGreaterThanOrEqual(0);
      expect(c.hit * k).toBeGreaterThanOrEqual(44);
    }
    const xy = (c: any) => ({
      x: canvas!.x + c.x * k,
      y: canvas!.y + (d.height - c.y) * k,
    });
    const cdp = await context.newCDPSession(page);
    const before = await read(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { id: 1, ...xy({ ...l.joystick, x: l.joystick.x + l.joystick.r }) },
        { id: 2, ...xy(l.shoot) },
        { id: 3, ...xy(l.jump) },
      ],
    });
    await page.waitForFunction(
      (shots) => {
        const s = (globalThis as any).__BREAKOUT__.snapshot();
        return s.player.vx > 200 && s.player.y > 180 && s.shots > shots;
      },
      before.shots,
      { timeout: 5000 },
    );
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.screenshot({ path: `reports/v021-landscape-${size.width}.png` });
    const after = await read(page);
    rows.push({
      size,
      display: d,
      layout: l,
      canvas,
      heroHeightCSS: 74 * d.zoom * k,
      shot: after.shots,
    });
    await page.keyboard.press("KeyP");
    await page.waitForFunction(
      () => (globalThis as any).__BREAKOUT__.snapshot().state === "paused",
      {},
      { timeout: 5000 },
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(
      () => (globalThis as any).__BREAKOUT__.snapshot().display.portrait,
    );
    const frozen = await read(page);
    await page.waitForTimeout(180);
    expect((await read(page)).time).toBe(frozen.time);
    await page.setViewportSize(size);
    await page.waitForFunction(
      () => !(globalThis as any).__BREAKOUT__.snapshot().display.portrait,
    );
    expect((await read(page)).state).toBe("paused");
    await page.keyboard.press("KeyP");
    await page.waitForFunction(
      () => (globalThis as any).__BREAKOUT__.snapshot().state === "playing",
      {},
      { timeout: 5000 },
    );
    await cdp.detach();
  }
  // Orientation pause resumes only a run that was playing, never a manual pause.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().display.orientationPaused,
  );
  const frozen = await read(page);
  await page.waitForTimeout(180);
  expect((await read(page)).time).toBe(frozen.time);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().state === "playing",
  );
  expect((await read(page)).controls.stick.owner).toBe(null);
  writeFileSync(
    "reports/v021-layout.json",
    JSON.stringify({ rows, errors }, null, 2),
  );
  expect(errors).toEqual([]);
});
for (const size of [
  { width: 667, height: 375, dpr: 2 },
  { width: 740, height: 360, dpr: 3 },
  { width: 1024, height: 768, dpr: 2 },
]) {
  test(`full screen and larger hit areas at ${size.width} / DPR ${size.dpr}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: size,
      deviceScaleFactor: size.dpr,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4190/");
    await page.waitForFunction(
      () => !!(globalThis as any).__BREAKOUT__,
      {},
      { timeout: 45000 },
    );
    await page.locator("#GameCanvas").focus();
    await page.keyboard.press("Enter");
    const s = await read(page),
      d = s.display,
      l = s.controls.layout,
      b = await page.locator("#GameCanvas").boundingBox();
    expect(b!.width).toBeGreaterThan(size.width * 0.98);
    expect(b!.height).toBeGreaterThan(size.height * 0.98);
    const k = b!.height / d.height;
    const pixelRatio = await page
      .locator("#GameCanvas")
      .evaluate((c: any) => c.width / c.getBoundingClientRect().width);
    expect(pixelRatio).toBeGreaterThanOrEqual(Math.min(size.dpr, 2) - 0.05);
    for (const c of [l.joystick, l.shoot, l.jump, l.grenade, l.pause]) {
      expect(c.hit * k).toBeGreaterThanOrEqual(44);
      expect(c.x - c.hit / 2).toBeGreaterThanOrEqual(0);
      expect(c.x + c.hit / 2).toBeLessThanOrEqual(d.width);
    }
    const xy = (c: any) => ({
      x: b!.x + c.x * k,
      y: b!.y + (d.height - c.y) * k,
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { id: 1, ...xy({ ...l.joystick, x: l.joystick.x + l.joystick.r }) },
        { id: 2, ...xy(l.shoot) },
        { id: 3, ...xy(l.jump) },
      ],
    });
    await page.waitForFunction(
      () => {
        const s = (globalThis as any).__BREAKOUT__.snapshot();
        return s.player.vx > 200 && s.player.y > 180 && s.shots > 0;
      },
      {},
      { timeout: 5000 },
    );
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.screenshot({ path: `reports/v021-landscape-${size.width}.png` });
    writeFileSync(
      `reports/v021-device-${size.width}.json`,
      JSON.stringify(
        {
          size,
          display: d,
          canvas: b,
          actualPixelRatio: pixelRatio,
          hitPixels: Object.fromEntries(
            Object.entries(l).map(([name, c]: [string, any]) => [
              name,
              c.hit * k,
            ]),
          ),
          heroHeightCSS: 74 * d.zoom * k,
          shots: (await read(page)).shots,
        },
        null,
        2,
      ),
    );
    await context.close();
  });
}
test("browser safe-area bridge repositions controls; expanded fire hit region works", async ({
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
  const base = await read(page);
  await page.addStyleTag({
    content:
      "#safe-area-probe{padding-left:42px;padding-right:24px;padding-bottom:18px}",
  });
  await page.setViewportSize({ width: 845, height: 390 });
  await page.waitForFunction(
    () =>
      (globalThis as any).__BREAKOUT__.snapshot().display.frameWidth === 845,
  );
  await page.locator("#GameCanvas").focus();
  await page.keyboard.press("Enter");
  const s = await read(page),
    l = s.controls.layout;
  expect(l.joystick.x - base.controls.layout.joystick.x).toBeCloseTo(
    (42 * 720) / 390,
    1,
  );
  expect(l.shoot.y - base.controls.layout.shoot.y).toBeCloseTo(
    (18 * 720) / 390,
    1,
  );
  const cdp = await context.newCDPSession(page),
    k = 390 / 720;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, x: (l.shoot.x + l.shoot.r + 8) * k, y: (720 - l.shoot.y) * k },
    ],
  });
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().shots > 1,
    {},
    { timeout: 5000 },
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.screenshot({ path: "reports/v021-safe-area.png" });
});
