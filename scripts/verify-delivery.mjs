import assert from "node:assert/strict";
import {
  readFileSync,
  readdirSync,
  statSync,
  existsSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
const json = (file) => JSON.parse(readFileSync(file, "utf8"));
const browser = json("reports/browser-results.json"),
  run = json("reports/full-run.json");
assert.equal(browser.stats.unexpected, 0, "Browser suite has failing tests");
assert.ok(browser.stats.expected >= 27, "Expected the V0.4.1 browser suite");
assert.equal(
  run.snapshot.state,
  "complete",
  "Browser run did not reach the exit",
);
assert.equal(run.errors.length, 0, "Full run has runtime errors");
const game = json("build/wechatgame/game.json"),
  wxProject = json("build/wechatgame/project.config.json");
assert.equal(game.deviceOrientation, "landscape");
assert.equal(wxProject.compileType, "game");
assert.equal(
  wxProject.appid,
  json("build-config/wechatgame.json").packages.wechatgame.appid,
);
assert.ok(existsSync("build/web-mobile/index.html"));
assert.ok(existsSync("build/wechatgame/game.js"));
function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    return statSync(file).isDirectory() ? files(file) : [file];
  });
}
const source = files("assets/scripts").filter((file) => file.endsWith(".ts"));
assert.ok(
  !source.some((file) =>
    /\b(window|document|localStorage)\b/.test(readFileSync(file, "utf8")),
  ),
  "Platform-specific browser API leaked into game code",
);
function build(folder) {
  const items = files(folder);
  return {
    files: items.length,
    bytes: items.reduce((n, file) => n + statSync(file).size, 0),
  };
}
const web = build("build/web-mobile"),
  wechat = build("build/wechatgame");
assert.ok(
  wechat.bytes < 4 * 1024 * 1024,
  "WeChat package exceeds conservative 4MiB check",
);
assert.ok(
  !files("build/wechatgame").some((file) => file.endsWith(".wasm")),
  "Unused wasm engine modules remain",
);
const engineModules = json("settings/v2/packages/engine.json").modules.configs
  .defaultConfig.includeModules;
assert.ok(!engineModules.some((name) => /physics|spine|3d/.test(name)));
assert.ok(engineModules.includes("audio"));
const fingerprint = createHash("sha256");
for (const file of source.sort())
  fingerprint.update(file).update(readFileSync(file));
const record = {
  date: "2026-10-14",
  creator: "3.8.8",
  design: { width: 1280, height: 720, targetFPS: 60 },
  sourceModules: source.length,
  sourceSHA256: fingerprint.digest("hex"),
  typecheck: "passed",
  logicTests: json("reports/logic-results.json"),
  browserTests: {
    passed: browser.stats.expected,
    failed: browser.stats.unexpected,
  },
  web: { ...web, entry: "build/web-mobile/index.html", creatorExitCode: 36 },
  wechat: {
    ...wechat,
    entry: "build/wechatgame/game.js",
    creatorExitCode: 36,
    orientation: game.deviceOrientation,
    testAppID: wxProject.appid,
    runtimeVerified: false,
  },
  fullRun: {
    state: run.snapshot.state,
    seconds: run.snapshot.time,
    health: run.snapshot.player.health,
    kills: run.snapshot.kills,
    guardHealth: run.snapshot.guardHealth,
    cameraX: run.snapshot.cameraX,
    peakBullets: run.snapshot.peakBullets,
    droppedBullets: run.snapshot.droppedBullets,
    applicationErrors: run.errors,
  },
  touchCancellation: json("reports/mobile-cancellation.json"),
  mobileLayout: json("reports/v021-layout.json"),
  mobileDevices: [667, 740, 1024].map((w) =>
    json(`reports/v021-device-${w}.json`),
  ),
  combatFeedback: json("reports/v021-feedback.json"),
  v04Devices: [844, 852, 932, 1280].map((w) =>
    json(`reports/v04-device-${w}.json`),
  ),
  v04Platform: json("reports/v04-platform.json"),
  v04Actions: json("reports/v04-actions.json"),
  v041Comic: json("reports/v041-comic.json"),
  version: json("package.json").version,
  performance: json("reports/v02-browser-performance.json"),
  engineModules,
  unverified: [
    "WeChat developer-tools runtime",
    "Android/iOS/WeChat real devices",
    "Real-device 60FPS and memory",
    "Editor GUI manual inspection",
    "Physical iOS Safari fullscreen/PWA installation and browser toolbar behavior",
  ],
};
writeFileSync("reports/verification.json", JSON.stringify(record, null, 2));
console.log(JSON.stringify(record, null, 2));
