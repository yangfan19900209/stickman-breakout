import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { chromium, request } from "playwright";

const site =
  process.env.PAGES_URL ||
  "https://yangfan19900209.github.io/stickman-breakout/";
const localVersion = JSON.parse(readFileSync("docs/version.json", "utf8"));
const manifest = JSON.parse(readFileSync("docs/.pages-manifest.json", "utf8"));
const api = await request.newContext();
const browser = await chromium.launch({ headless: true });
const applicationErrors = [],
  failedRequests = [];
try {
  const versionResponse = await api.get(new URL("version.json", site).href);
  assert.equal(versionResponse.status(), 200);
  const onlineVersion = await versionResponse.json();
  assert.equal(onlineVersion.webBuildSHA256, localVersion.webBuildSHA256);
  assert.equal(onlineVersion.sourceSHA256, localVersion.sourceSHA256);
  // The HTTP response bodies are decompressed before comparison. Check every engine/game file.
  for (const relative of manifest.files) {
    const response = await api.get(new URL(relative, site).href);
    assert.equal(response.status(), 200, `Missing published file: ${relative}`);
    assert.ok(
      (await response.body()).equals(readFileSync(`docs/${relative}`)),
      `Published bytes differ: ${relative}`,
    );
  }
  const snapshot = (page) =>
    page.evaluate(() => globalThis.__BREAKOUT__.snapshot());
  async function boot(context) {
    const page = await context.newPage();
    page.on("pageerror", (error) => applicationErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") applicationErrors.push(message.text());
    });
    page.on("requestfailed", (req) =>
      failedRequests.push({ url: req.url(), error: req.failure()?.errorText }),
    );
    page.on("response", (response) => {
      if (
        response.status() >= 400 &&
        response.url().startsWith(site) &&
        !response.url().endsWith("/favicon.ico")
      )
        failedRequests.push({ url: response.url(), status: response.status() });
    });
    const response = await page.goto(site);
    assert.equal(response.status(), 200);
    await page.waitForFunction(
      () => !!globalThis.__BREAKOUT__,
      {},
      { timeout: 45000 },
    );
    return page;
  }
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const desktop = await boot(desktopContext);
  assert.equal(await desktop.title(), "线条突围 · Stickman Breakout");
  await desktop.locator("#GameCanvas").focus();
  await desktop.keyboard.press("Enter");
  await desktop.waitForFunction(
    () => globalThis.__BREAKOUT__.snapshot().state === "playing",
  );
  await desktop.keyboard.down("KeyD");
  await desktop.keyboard.down("KeyJ");
  await desktop.keyboard.down("Space");
  await desktop.waitForFunction(() => {
    const s = globalThis.__BREAKOUT__.snapshot();
    return s.player.x > 150 && s.player.y > 200 && s.shots > 1;
  });
  await desktop.keyboard.up("KeyD");
  await desktop.keyboard.up("KeyJ");
  await desktop.keyboard.up("Space");
  const keyboard = await snapshot(desktop);
  await desktop.screenshot({ path: "reports/github-pages-desktop.png" });
  await desktop.keyboard.press("KeyP");
  await desktop.waitForFunction(
    () => globalThis.__BREAKOUT__.snapshot().state === "paused",
  );
  const paused = await snapshot(desktop);
  await desktop.waitForTimeout(200);
  assert.equal((await snapshot(desktop)).time, paused.time);
  await desktop.keyboard.press("Escape");
  await desktop.waitForFunction(
    () => globalThis.__BREAKOUT__.snapshot().state === "playing",
  );
  await desktopContext.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
  });
  const mobile = await boot(mobileContext);
  async function point(x, y) {
    const b = await mobile.locator("#GameCanvas").boundingBox();
    const d = (await snapshot(mobile)).display;
    const scale = Math.min(b.width / d.width, b.height / d.height);
    return {
      x: b.x + x * scale,
      y: b.y + (d.height - y) * scale,
    };
  }
  const d = (await snapshot(mobile)).display;
  const start = await point(d.width / 2 + 120, d.height / 2 - 128);
  await mobile.touchscreen.tap(start.x, start.y);
  await mobile.waitForFunction(
    () => globalThis.__BREAKOUT__.snapshot().state === "playing",
  );
  const cdp = await mobileContext.newCDPSession(mobile);
  const layout = (await snapshot(mobile)).controls.layout;
  const right = await point(
      layout.joystick.x + layout.joystick.r,
      layout.joystick.y,
    ),
    shoot = await point(layout.shoot.x, layout.shoot.y),
    jump = await point(layout.jump.x, layout.jump.y);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, ...right },
      { id: 2, ...shoot },
      { id: 3, ...jump },
    ],
  });
  await mobile.waitForFunction(() => {
    const s = globalThis.__BREAKOUT__.snapshot();
    return s.player.x > 150 && s.player.y > 200 && s.shots > 1;
  });
  const touch = await snapshot(mobile);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await mobile.screenshot({ path: "reports/github-pages-mobile.png" });
  await mobile.waitForTimeout(250);
  const released = await snapshot(mobile);
  await mobile.waitForTimeout(250);
  const settled = await snapshot(mobile);
  assert.ok(Math.abs(settled.player.x - released.player.x) < 2);
  assert.equal(settled.shots, released.shots);
  const mobileCanvas = await mobile.locator("#GameCanvas").boundingBox();
  assert.ok(
    mobileCanvas.width >= 844 * 0.98 && mobileCanvas.height >= 390 * 0.98,
  );
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.waitForFunction(
    () => globalThis.__BREAKOUT__.snapshot().display.portrait,
  );
  const portrait = await snapshot(mobile);
  await mobile.waitForTimeout(200);
  assert.equal((await snapshot(mobile)).time, portrait.time);
  await mobile.screenshot({ path: "reports/github-pages-portrait.png" });
  await mobile.setViewportSize({ width: 844, height: 390 });
  await mobile.waitForFunction(
    () => globalThis.__BREAKOUT__.snapshot().state === "playing",
  );
  assert.deepEqual(applicationErrors, []);
  assert.deepEqual(failedRequests, []);
  const result = {
    site,
    checkedAt: new Date().toISOString(),
    status: "passed",
    matchedBuildFiles: manifest.files.length,
    onlineVersion,
    desktop: {
      state: keyboard.state,
      playerX: keyboard.player.x,
      playerY: keyboard.player.y,
      shots: keyboard.shots,
      pauseResume: true,
    },
    mobile: {
      viewport: "844x390",
      simultaneousTouches: 3,
      playerX: touch.player.x,
      playerY: touch.player.y,
      shots: touch.shots,
      releaseVerified: true,
      fullViewport: true,
      portraitFrozen: true,
      rotationResume: true,
    },
    applicationErrors,
    failedRequests,
  };
  writeFileSync(
    "reports/github-pages-verification.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
  await api.dispose();
}
