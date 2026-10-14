import { test, expect } from "@playwright/test";
test("left blank touch summons neutral floating stick, edge clamp and second finger ownership", async ({
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
  const read = () =>
    page.evaluate(() => (globalThis as any).__BREAKOUT__.snapshot());
  const cdp = await context.newCDPSession(page);
  for (const p of [
    { x: 230, y: 205 },
    { x: 8, y: 330 },
    { x: 388, y: 145 },
  ]) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ id: 1, ...p }],
    });
    await page.waitForFunction(
      () =>
        (globalThis as any).__BREAKOUT__.snapshot().controls.stick.owner !==
        null,
    );
    expect((await read()).controls.stick.axis).toBe(0);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ id: 1, x: p.x + 58, y: p.y }],
    });
    await page.waitForFunction(
      () =>
        (globalThis as any).__BREAKOUT__.snapshot().controls.stick.axis > 0.9,
    );
    const owner = (await read()).controls.stick.owner;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { id: 1, x: p.x + 58, y: p.y },
        { id: 2, x: 80, y: 180 },
      ],
    });
    expect((await read()).controls.stick.owner).toBe(owner);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [{ id: 2, x: 80, y: 180 }],
    });
    expect((await read()).controls.stick.owner).toBe(owner);
    await page.screenshot({ path: `reports/v04-floating-${p.x}.png` });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.waitForFunction(
      () =>
        (globalThis as any).__BREAKOUT__.snapshot().controls.stick.owner ===
        null,
    );
  }
});
