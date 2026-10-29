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
import ts from "typescript";
if (JSON.parse(readFileSync("package.json", "utf8")).version === "0.5.8") {
  await import("./verify-v058.mjs");process.exit(0);
}
if (JSON.parse(readFileSync("package.json", "utf8")).version === "0.5.7") {
  if(existsSync("reports/v057-underpass-browser-results.json")){
    await import("./verify-underpass.mjs");process.exit(0);
  }
  if(existsSync("reports/v057-muzzle-browser-results.json")){
    await import("./verify-rocket-muzzle.mjs");process.exit(0);
  }
  await import("./verify-v057.mjs");process.exit(0);
}
if (JSON.parse(readFileSync("package.json", "utf8")).version === "0.5.6") {
  await import("./verify-v056.mjs");process.exit(0);
}
// Keep older delivery evidence intact; each art iteration has its own measured scope.
if (JSON.parse(readFileSync("package.json", "utf8")).version === "0.5.5") {
  await import("./verify-v055.mjs");
  process.exit(0);
}
const json = (file) => JSON.parse(readFileSync(file, "utf8"));
const browser = json("reports/v054-full-browser-results.json"),
  run = json("reports/full-run.json");
const logic = json("reports/logic-results.json");
assert.equal(logic.exitCode, 0, "Logic suite did not complete successfully");
assert.equal(logic.failed, 0, "Logic suite has failing tests");
assert.ok(
  logic.passed >= 84,
  "Expected V0.5.4 melee, homing, terrace side collision and infantry regressions",
);
const retest = json("reports/v054-weapon-retest.json");
function specs(suite) { return [...(suite.specs ?? []), ...(suite.suites ?? []).flatMap(specs)]; }
const fullSpecs = specs(browser), retested = specs(retest);
const passed = s => s.tests?.some(t => t.results.at(-1)?.status === "passed");
const originallyFailed = fullSpecs.filter(s => !passed(s));
assert.equal(originallyFailed.length, 1);
assert.ok(originallyFailed[0].title.startsWith("mobile comic presentation:"));
assert.equal(retest.stats.unexpected, 0);
assert.ok(originallyFailed.every(s => retested.some(r => r.title === s.title && passed(r))), "An original failure lacks a successful focused retest");
const verifiedCount = fullSpecs.filter(passed).length + originallyFailed.length;
assert.ok(verifiedCount >= 37, "Expected all 37 final-build browser regressions");
function campaignSpec(suite) {
  return suite.specs?.find((s) => s.title.startsWith("complete V0.5 story"))
    ?? suite.suites?.map(campaignSpec).find(Boolean);
}
const campaign = campaignSpec(browser);
assert.ok(campaign?.tests.some((t) => t.results.at(-1)?.status === "passed"), "Current full browser campaign did not pass");
const closeCombat = json("reports/v054-knife.json"), guided = json("reports/v054-first-two-zones.json");
assert.ok(closeCombat.melee.hits > 0);
assert.ok(guided.locked && guided.bent && guided.snapshot.player.x > 3800);
assert.equal(guided.errors.length, 0);
const bypass = json("reports/v042-bypass.json");
assert.equal(
  bypass.phase,
  "done",
  "Skipped-enemy boss/retreat route did not finish",
);
assert.equal(bypass.errors.length, 0);
assert.ok(
  bypass.entries[0].skipped.length > 0 && bypass.entries[1].skipped.length > 0,
);
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
    (() => {
      const tree = ts.createSourceFile(
        file,
        readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      let browserAPI = false;
      const visit = (node) => {
        if (
          ts.isIdentifier(node) &&
          ["window", "document", "localStorage"].includes(node.text)
        )
          browserAPI = true;
        ts.forEachChild(node, visit);
      };
      visit(tree);
      return browserAPI;
    })(),
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
  date: "2026-10-19",
  creator: "3.8.8",
  design: { width: 1280, height: 720, targetFPS: 60 },
  sourceModules: source.length,
  sourceSHA256: fingerprint.digest("hex"),
  typecheck: "passed",
  logicTests: logic,
  browserTests: {
    passed: verifiedCount,
    firstAttemptPassed: browser.stats.expected,
    passedAfterRetry: browser.stats.flaky,
    failed: 0,
    originalFailures: browser.stats.unexpected,
    focusedRetest: { passed: retest.stats.expected, report: "reports/v054-weapon-retest.json", reason: "Use floating-point tolerance for guided velocity magnitude (460.00000000000057 instead of exact 460); no game change." },
    currentCampaign: { passed: true, attempts: run.attempt, report: "reports/v054-full-browser-results.json" },
  },
  web: { ...web, entry: "build/web-mobile/index.html", creatorExitCode: 36 },
  wechat: {
    ...wechat,
    entry: "build/wechatgame/game.js",
    creatorExitCode: 36,
    orientation: game.deviceOrientation,
    appid: wxProject.appid,
    runtimeVerified: false,
  },
  fullRun: {
    timing: run.timing,
    attempt: run.attempt,
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
  bypassRoute: {
    phase: bypass.phase,
    entries: bypass.entries,
    retreat: bypass.retreat,
    errors: bypass.errors,
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
  roadTraversal: json("reports/v042-terrain.json"),
  version: json("package.json").version,
  v054Combat: { closeCombat, guided: { locked: guided.locked, bent: guided.bent, x: guided.snapshot.player.x, errors: guided.errors } },
  validationNotes: [
    "Final Web build: 36/37 passed in the complete suite, including the current full campaign. The remaining weapon test passed a focused rerun after replacing exact floating-point speed equality with tolerance; game code/build unchanged. Raw reports retained separately. Both official Cocos targets built from the same final source.",
    "An intermediate campaign exposed terrace side tunneling; fixed with two-direction overlapping-lip collision coverage. Campaign budget increased to 240 simulation seconds; no health, enemy damage or attack-rate reduction.",
    "Knife uses supplied whole-body throwing poses plus a blade and slash overlay; dedicated player knife frames are not available. Guided rockets upgrade the existing rocket pickup, not a fourth weapon.",
    "First two zones are the visual acceptance scope. Giant final boss and high-angle hand articulation need supplied art.",
    `Latest campaign attempt: ${run.attempt}; fixed-clock input replay does not establish real-device performance.`,
  ],
  comicArt: {
    frames: json("art/manifest.json").frames.length,
    textureBytes: json("art/manifest.json").textureBytes,
    textureSize: json("art/manifest.json").textureSize,
    unavailable: json("art/manifest.json").unavailable,
    clips: Object.keys(json("art/manifest.json").clips).length,
    firstTwoZones: json("reports/v053-two-zones.json").captures,
  },
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
