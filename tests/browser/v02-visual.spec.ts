import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
test("original audio, scene culling and bounded frame work; portrait freezes the run", async ({
  page,
  context,
}) => {
  const browser = context.browser()!,
    cdp = await browser.newBrowserCDPSession();
  const { gpu } = await cdp.send("SystemInfo.getInfo");
  const environment = {
    browser: browser.version(),
    renderer: gpu.auxAttributes?.glRenderer ?? gpu.devices,
  };
  await cdp.detach();
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
    () => (globalThis as any).__BREAKOUT__.snapshot().audio.loaded === 9,
  );
  await page.keyboard.down("KeyJ");
  await page.waitForTimeout(500);
  await page.keyboard.up("KeyJ");
  const metrics = await page.evaluate(async () => {
    const deltas: number[] = [];
    let last = performance.now();
    const until = last + 3000;
    await new Promise<void>((resolve) => {
      const frame = (now: number) => {
        deltas.push(now - last);
        last = now;
        if (now >= until) resolve();
        else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    const s = (globalThis as any).__BREAKOUT__.snapshot();
    return {
      frames: deltas.length,
      averageFPS: 1000 / (deltas.reduce((a, b) => a + b, 0) / deltas.length),
      slowFramesOver50ms: deltas.filter((d) => d > 50).length,
      visibleChunks: s.visibleChunks,
      audio: s.audio,
    };
  });
  writeFileSync(
    "reports/v02-browser-performance.json",
    JSON.stringify({ ...metrics, environment }, null, 2),
  );
  expect(metrics.visibleChunks).toBeLessThan(13);
  expect(metrics.audio.loadErrors).toEqual([]);
  expect(metrics.audio.played).toBeGreaterThan(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  await page.screenshot({ path: "reports/portrait.png" });
  const frozen = await page.evaluate(() =>
    (globalThis as any).__BREAKOUT__.snapshot(),
  );
  expect(frozen.display.portrait).toBe(true);
  await page.touchscreen.tap(330, 720);
  await page.waitForTimeout(150);
  expect(
    (await page.evaluate(() => (globalThis as any).__BREAKOUT__.snapshot()))
      .time,
  ).toBe(frozen.time);
  expect(errors).toEqual([]);
});
