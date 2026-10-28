import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const source = path.resolve("build/web-mobile");
const target = path.resolve("docs");
const manifestPath = path.join(target, ".pages-manifest.json");
assert.ok(
  existsSync(path.join(source, "index.html")),
  "Build Web Mobile with Cocos before preparing Pages.",
);
const verification = JSON.parse(
  readFileSync("reports/verification.json", "utf8"),
);
assert.equal(verification.logicTests.failed, 0, "Logic regression must pass.");
assert.equal(verification.logicTests.exitCode, 0);
if (verification.browserTests) {
  assert.equal(verification.browserTests.failed, 0);
} else {
  assert.ok(verification.browser?.targetedPassed > 0, "Browser verification is required.");
  assert.deepEqual(verification.route?.errors, []);
}
function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    return statSync(file).isDirectory() ? files(file) : [file];
  });
}
// Verify the current source and build before replacing any generated Pages files.
const sourceHash = createHash("sha256");
const sourceFiles = files("assets/scripts").filter((file) => file.endsWith(".ts")).sort();
for (const file of sourceFiles) sourceHash.update(file).update(readFileSync(file));
assert.equal(sourceHash.digest("hex"), verification.sourceSHA256, "Source changed since verification.");
const buildFiles = files(source);
assert.equal(buildFiles.length, verification.web.files, "Web build file count changed.");
assert.equal(buildFiles.reduce((bytes, file) => bytes + statSync(file).size, 0), verification.web.bytes);
assert.ok(
  Math.max(...sourceFiles.map((file) => statSync(file).mtimeMs)) < statSync(path.join(source, "index.html")).mtimeMs,
  "Rebuild Web Mobile after changing gameplay source.",
);
function outputPath(relative) {
  const file = path.resolve(target, relative);
  assert.ok(
    file.startsWith(target + path.sep),
    "Generated file must stay inside docs.",
  );
  return file;
}
if (existsSync(target)) {
  if (existsSync(manifestPath)) {
    const previous = JSON.parse(readFileSync(manifestPath, "utf8"));
    assert.equal(previous.project, "stickman-breakout");
    const owned = new Set([
      ...previous.files,
      ".pages-manifest.json",
      ".nojekyll",
      "version.json",
    ]);
    for (const file of files(target)) {
      assert.ok(
        owned.has(path.relative(target, file).replaceAll("\\", "/")),
        `Unmanaged file in docs: ${file}`,
      );
    }
    // Delete only known generated files; source, project documentation and directories are preserved.
    for (const relative of previous.files) {
      const file = outputPath(relative);
      if (existsSync(file)) unlinkSync(file);
    }
  } else {
    assert.equal(
      files(target).length,
      0,
      "Existing docs contains unmanaged files; use a separate publishing folder.",
    );
  }
}
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
const fileNames = files(source)
  .map((file) => path.relative(source, file).replaceAll("\\", "/"))
  .sort();
const fingerprint = createHash("sha256");
for (const relative of fileNames) {
  const original = readFileSync(path.join(source, relative));
  assert.ok(
    original.equals(readFileSync(outputPath(relative))),
    `Copy mismatch: ${relative}`,
  );
  fingerprint.update(relative).update(original);
}
assert.equal(
  fileNames.length,
  verification.web.files,
  "Build file count changed since verification.",
);
assert.equal(
  fileNames.reduce(
    (n, relative) => n + statSync(path.join(source, relative)).size,
    0,
  ),
  verification.web.bytes,
);
writeFileSync(path.join(target, ".nojekyll"), "");
writeFileSync(
  manifestPath,
  JSON.stringify({ project: "stickman-breakout", files: fileNames }, null, 2),
);
const version = {
  project: "stickman-breakout",
  version: JSON.parse(readFileSync('package.json','utf8')).version,
  creator: "3.8.8",
  sourceSHA256: verification.sourceSHA256,
  webBuildSHA256: fingerprint.digest("hex"),
  preparedAt: new Date().toISOString(),
};
writeFileSync(
  path.join(target, "version.json"),
  JSON.stringify(version, null, 2),
);
console.log(
  `Pages package ready: ${fileNames.length} Cocos files, byte-for-byte verified in docs.`,
);
console.log(JSON.stringify(version, null, 2));
