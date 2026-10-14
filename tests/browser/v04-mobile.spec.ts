import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
const read = (page: any) =>
  page.evaluate(() => (globalThis as any).__BREAKOUT__.snapshot());
async function boot(page: any) {
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
}
for (const size of [
  { width: 844, height: 390 },
  { width: 852, height: 393 },
  { width: 932, height: 430 },
  { width: 1280, height: 720 },
]) {
  test(`V0.4 thumb layout, full viewport and touch at ${size.width}x${size.height}`, async ({
    page,
    context,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize(size);
    await boot(page);
    const s = await read(page),
      l = s.controls.layout,
      k = size.height / s.display.height,
      b = await page.locator("#GameCanvas").boundingBox();
    expect(b!.width).toBeCloseTo(size.width, 0);
    expect(b!.height).toBeCloseTo(size.height, 0);
    expect(l.joystick.baseR * 2 * k).toBeGreaterThanOrEqual(136);
    expect(l.joystick.baseR * 2 * k).toBeLessThanOrEqual(156.1);
    expect(l.joystick.knobR * 2 * k).toBeGreaterThanOrEqual(62);
    expect(l.joystick.knobR * 2 * k).toBeLessThanOrEqual(76.1);
    expect(l.shoot.r * 2 * k).toBeGreaterThanOrEqual(100);
    expect(l.shoot.r * 2 * k).toBeLessThanOrEqual(122.1);
    expect(l.joystick.y).toBeCloseTo(l.shoot.y, 0);
    expect(l.jump.x).toBeLessThan(l.shoot.x);
    expect(l.jump.y).toBeGreaterThan(l.shoot.y);
    expect(l.grenade.y).toBeGreaterThan(l.shoot.y);
    const controls = [l.shoot, l.jump, l.grenade];
    for (let i = 0; i < 3; i++)
      for (let j = i + 1; j < 3; j++)
        expect(
          Math.abs(controls[i].x - controls[j].x) >
            (controls[i].hit + controls[j].hit) / 2 ||
            Math.abs(controls[i].y - controls[j].y) >
              (controls[i].hit + controls[j].hit) / 2,
        ).toBe(true);
    for (const c of [...controls, l.pause]) {
      expect(c.x - c.hit / 2).toBeGreaterThanOrEqual(0);
      expect(c.x + c.hit / 2).toBeLessThanOrEqual(s.display.width);
      expect(c.hit * k).toBeGreaterThanOrEqual(44 - 1e-8);
    }
    const xy = (p: any) => ({ x: p.x * k, y: size.height - p.y * k }),
      cdp = await context.newCDPSession(page);
    const left = { x: size.width * 0.28, y: size.height * 0.65 },
      right = { x: left.x + l.joystick.r * k, y: left.y };
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { id: 1, ...left },
        { id: 2, ...xy(l.shoot) },
        { id: 3, ...xy(l.jump) },
      ],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { id: 1, ...right },
        { id: 2, ...xy(l.shoot) },
        { id: 3, ...xy(l.jump) },
      ],
    });
    await page.waitForFunction(() => {
      const s = (globalThis as any).__BREAKOUT__.snapshot();
      return s.player.vx > 200 && s.player.y > 180 && s.shots > 0;
    });
    await page.screenshot({ path: `reports/v04-landscape-${size.width}.png` });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.waitForFunction(() => {
      const s = (globalThis as any).__BREAKOUT__.snapshot();
      return !s.controls.shootHeld && s.controls.floating.owners.length === 0;
    });
    writeFileSync(
      `reports/v04-device-${size.width}.json`,
      JSON.stringify(
        {
          size,
          canvas: b,
          layout: l,
          hudHeightCSS: s.controls.hudHeight * k,
          baseDiameterCSS: l.joystick.baseR * 2 * k,
          knobDiameterCSS: l.joystick.knobR * 2 * k,
          dragRadiusCSS: l.joystick.r * k,
          fireDiameterCSS: l.shoot.r * 2 * k,
          errors,
        },
        null,
        2,
      ),
    );
    expect(errors).toEqual([]);
  });
}
test("movement, fire, grenade, HUD priority and simultaneous release stay independent", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await boot(page);
  const cdp = await context.newCDPSession(page),
    l = (await read(page)).controls.layout,
    k = 390 / 720;
  const xy = (p: any) => ({ x: p.x * k, y: 390 - p.y * k }),
    a = { id: 1, x: 230, y: 245 },
    move = { id: 1, x: 286, y: 245 },
    fire = { id: 2, x: 565, y: 105 },
    grenade = { id: 3, ...xy(l.grenade) };
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [a, fire],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [move, fire],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [move, fire, grenade],
  });
  await page.waitForFunction(() => {
    const s = (globalThis as any).__BREAKOUT__.snapshot();
    return s.grenadesThrown === 1 && s.controls.shootHeld && s.player.vx > 200;
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [grenade],
  });
  expect((await read(page)).controls.stick.owner).not.toBe(null);
  const owner = (await read(page)).controls.stick.owner;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [move, fire, { id: 4, x: 380, y: 20 }],
  });
  expect((await read(page)).controls.stick.owner).toBe(owner);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [{ id: 4, x: 380, y: 20 }, fire],
  });
  expect((await read(page)).controls.stick.owner).toBe(owner);
  expect((await read(page)).controls.shootHeld).toBe(false);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [move, { id: 5, ...xy(l.pause) }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [{ id: 5, ...xy(l.pause) }],
  });
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().state === "paused",
  );
  expect((await read(page)).controls.floating.owners.length).toBe(0);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
});
test("viewport height changes retain fingers; browser blur signal clears input and pauses", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await boot(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, x: 230, y: 245 },
      { id: 2, x: 565, y: 105 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { id: 1, x: 286, y: 245 },
      { id: 2, x: 565, y: 105 },
    ],
  });
  await page.waitForFunction(() => {
    const s = (globalThis as any).__BREAKOUT__.snapshot();
    return s.controls.stick.axis > 0.9 && s.controls.shootHeld;
  });
  await page.setViewportSize({ width: 844, height: 360 });
  await page.waitForFunction(
    () =>
      (globalThis as any).__BREAKOUT__.snapshot().display.frameHeight === 360,
  );
  expect((await read(page)).controls.stick.owner).not.toBe(null);
  expect((await read(page)).controls.shootHeld).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().state === "paused",
    {},
    { timeout: 5000 },
  );
  const s = await read(page);
  expect(s.controls.stick.owner).toBe(null);
  expect(s.controls.floating.owners.length).toBe(0);
  expect(s.controls.shootHeld).toBe(false);
  await page.locator("#GameCanvas").focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().state === "playing",
  );
  expect((await read(page)).controls.shootHeld).toBe(false);
});
