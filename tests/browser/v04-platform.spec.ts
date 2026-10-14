import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
const read = (page: any) =>
  page.evaluate(() => (globalThis as any).__BREAKOUT__.snapshot());
async function boot(page: any, url = "/stickman-breakout/") {
  await page.goto(url);
  await page.waitForFunction(
    () => !!(globalThis as any).__BREAKOUT__,
    {},
    { timeout: 45000 },
  );
  await page.locator("#GameCanvas").focus();
}
test("subpath manifest, icons, viewport, real fullscreen entry and exit", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 844, height: 390 });
  await boot(page);
  const manifest = await page.evaluate(async () => {
    const link = document.querySelector(
      "link[rel=manifest]",
    ) as HTMLLinkElement;
    const r = await fetch(link.href);
    return { url: link.href, data: await r.json() };
  });
  expect(manifest.url).toContain("/stickman-breakout/manifest.webmanifest");
  expect(new URL(manifest.data.start_url, manifest.url).pathname).toBe(
    "/stickman-breakout/",
  );
  expect(manifest.data.scope).toBe("./");
  expect(manifest.data.display).toBe("standalone");
  for (const icon of manifest.data.icons) {
    const r = await page.request.get(new URL(icon.src, manifest.url).href);
    expect(r.ok()).toBe(true);
    expect(r.headers()["content-type"]).toContain("image/png");
  }
  const d = (await read(page)).display,
    k = 390 / d.height;
  await page.touchscreen.tap((d.width / 2 + 140) * k, 44 * k);
  await page.waitForFunction(
    () => !!document.fullscreenElement,
    {},
    { timeout: 5000 },
  );
  expect((await read(page)).platform.fullscreen).toBe(true);
  await page.evaluate(() => document.exitFullscreen());
  await page.waitForTimeout(150);
  expect((await read(page)).platform.fullscreen).toBe(false);
  const b = await page.locator("#GameCanvas").boundingBox();
  expect(b!.width).toBeCloseTo(844, 0);
  expect(b!.height).toBeCloseTo(390, 0);
  await page.screenshot({ path: "reports/v04-stage1-platform.png" });
  writeFileSync(
    "reports/v04-platform.json",
    JSON.stringify(
      { manifest, fullscreenEntered: true, fullscreenExited: true, errors },
      null,
      2,
    ),
  );
  expect(errors).toEqual([]);
});
test("unsupported fullscreen and standalone detection safely fall back", async ({
  browser,
}) => {
  for (const standalone of [false, true]) {
    const c = await browser.newContext({
      viewport: { width: 844, height: 390 },
      hasTouch: true,
    });
    const p = await c.newPage();
    await p.addInitScript((standalone) => {
      Object.defineProperty(navigator, "standalone", { get: () => standalone });
      Object.defineProperty(Element.prototype, "requestFullscreen", {
        value: undefined,
      });
      Object.defineProperty(Element.prototype, "webkitRequestFullscreen", {
        value: undefined,
      });
      Object.defineProperty(document, "fullscreenEnabled", {
        get: () => false,
      });
    }, standalone);
    await boot(p);
    expect((await read(p)).platform.mode).toBe(
      standalone ? "standalone" : "browser",
    );
    const d = (await read(p)).display,
      k = 390 / d.height;
    await p.touchscreen.tap((d.width / 2 + 140) * k, 44 * k);
    await p.keyboard.press("Enter");
    await p.waitForFunction(
      () => (globalThis as any).__BREAKOUT__.snapshot().state === "playing",
    );
    expect(await p.evaluate(() => !!document.fullscreenElement)).toBe(false);
    await c.close();
  }
});
test("service worker preserves subpath offline startup after an online visit", async ({
  page,
  context,
}) => {
  await boot(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(
    () => !!(globalThis as any).__BREAKOUT__,
    {},
    { timeout: 45000 },
  );
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().audio.loaded === 7,
  );
  await page.waitForTimeout(300);
  await context.setOffline(true);
  await page.reload();
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
  await context.setOffline(false);
});
