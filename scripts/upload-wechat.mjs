import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createHash, createPrivateKey } from "node:crypto";
import path from "node:path";
import ci from "miniprogram-ci";

// Uses the explicitly supplied code-upload key, never an AppSecret or browser session.
const root = path.resolve(import.meta.dirname, "..");
const projectPath = path.join(root, "build/wechatgame");
const config = JSON.parse(
  readFileSync(path.join(projectPath, "project.config.json"), "utf8"),
);
const build = JSON.parse(
  readFileSync(path.join(root, "build-config/wechatgame.json"), "utf8"),
);
const version = JSON.parse(
  readFileSync(path.join(root, "package.json"), "utf8"),
).version;
const description = `线条突围 V${version}｜开发者 YF：完整持刀/火箭筒动作、模块化地图、三段刀连击；修正火箭炮口与42%平台死角。`;
const keyIndex = process.argv.indexOf("--key");
const keyPath =
  keyIndex >= 0 ? process.argv[keyIndex + 1] : process.env.WECHAT_UPLOAD_KEY;
assert.ok(keyPath, "Supply --key <absolute path> or WECHAT_UPLOAD_KEY.");
assert.equal(
  config.appid,
  build.packages.wechatgame.appid,
  "Rebuild for the configured AppID first.",
);
assert.equal(config.compileType, "game");
assert.equal(
  JSON.parse(readFileSync(path.join(projectPath, "game.json"), "utf8"))
    .deviceOrientation,
  "landscape",
);
assert.equal(
  createPrivateKey(readFileSync(path.resolve(keyPath))).asymmetricKeyType,
  "rsa",
  "Expected a valid RSA code-upload key.",
);
function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    return statSync(file).isDirectory() ? files(file) : [file];
  });
}
const allFiles = files(projectPath).sort();
assert.ok(allFiles.some((file) => file.endsWith("game.js")));
assert.ok(
  !allFiles.some((file) => /\.(key|pem)$/i.test(file)),
  "Private credentials must stay outside the upload package.",
);
const fingerprint = createHash("sha256");
for (const file of allFiles)
  fingerprint
    .update(path.relative(projectPath, file).replaceAll("\\", "/"))
    .update(readFileSync(file));
const record = {
  appid: config.appid,
  version,
  description,
  developer: "YF",
  type: "miniGame",
  robot: 1,
  buildSHA256: fingerprint.digest("hex"),
  files: allFiles.length,
  bytes: allFiles.reduce((n, file) => n + statSync(file).size, 0),
  startedAt: new Date().toISOString(),
  status: "pending",
  release: "not_published",
  runtimeVerified: false,
};
const receipt = path.join(root, "reports/wechat-upload.json");
const redact = (value) =>
  String(value)
    .replace(/invalid ip:\s*[\d.]+/gi, "invalid ip: [upload IP omitted]")
    .replace(/-----BEGIN[\s\S]*?-----END[^-]*-----/g, "[redacted key]")
    .replace(
      /(access_token|secret|privateKey|authorization)[=:]\s*[^\s,]+/gi,
      "$1=[redacted]",
    );
try {
  const project = new ci.Project({
    appid: config.appid,
    type: "miniGame",
    projectPath,
    privateKeyPath: path.resolve(keyPath),
    ignores: ["node_modules/**/*"],
  });
  console.log(
    `Uploading Stickman Breakout ${version} to ${config.appid} (${record.files} files).`,
  );
  const progress = new Set();
  const result = await ci.upload({
    project,
    version,
    robot: 1,
    threads: 2,
    desc: description,
    setting: { useProjectConfig: true, minify: true },
    onProgressUpdate: (task) => {
      const message =
        typeof task === "string" ? task : `${task.status}: ${task.message}`;
      if (!progress.has(message)) {
        progress.add(message);
        console.log(redact(message));
      }
    },
  });
  Object.assign(record, {
    status: "uploaded",
    completedAt: new Date().toISOString(),
    versionId: result.strUint64Version ?? null,
    packages: result.subPackageInfo ?? [],
    plugins: result.pluginInfo ?? [],
  });
  writeFileSync(receipt, JSON.stringify(record, null, 2));
  console.log(JSON.stringify(record, null, 2));
  process.exit(0);
} catch (error) {
  Object.assign(record, {
    status: "failed",
    completedAt: new Date().toISOString(),
    errorCode: error.code ?? error.errCode ?? error.errcode ?? null,
    error: redact(error.message ?? error),
  });
  writeFileSync(receipt, JSON.stringify(record, null, 2));
  console.error(
    `Upload failed (${record.errorCode ?? "unknown"}): ${record.error}`,
  );
  process.exit(1);
}
