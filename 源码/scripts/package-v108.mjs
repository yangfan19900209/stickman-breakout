import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { sourceRoot, workspaceRoot, macReports, readJSON, writeJSON, buildInputs, latestBuild, manifest, manifestHash, hash } from './mac/common.mjs';
import { payloadFile, inspectPackage, createArchive, verifyFrozenPackage } from './mac/wechat-package.mjs';

// Fixed 1.0.8 delivery, following the existing version-number directory layout.
const version = readJSON(path.join(sourceRoot, 'package.json')).version;
assert.equal(version, '1.0.8');
const evidence = path.join(workspaceRoot, '开发进度/验证记录/v108-release');
const verified = readJSON(path.join(evidence, 'verification.json'));
assert.equal(verified.version, version); assert.equal(verified.passed, true);
const builds = { web: latestBuild('web-mobile'), wechat: latestBuild('wechatgame') };
assert.equal(builds.web.inputSHA256, builds.wechat.inputSHA256);
assert.equal(buildInputs().sha256, builds.web.inputSHA256);
for (const chapter of ['land', 'campaign']) {
  const report = readJSON(path.join(evidence, `browser/${chapter}/result.json`));
  assert.equal(report.version, version); assert.equal(report.final.state, 'complete');
  assert.ok(report.final.player.health > 0); assert.deepEqual(report.errors, []);
  if (report.failed) assert.deepEqual(report.failed, []);
  assert.ok(Date.parse(report.startedAt) > Date.parse(builds.web.completedAt));
}
const destination = path.join(workspaceRoot, '交付/版本', version);
assert.ok(!fs.existsSync(destination), 'A fixed release must never be overwritten.');
const update = fs.readFileSync(path.join(workspaceRoot, `交付/更新说明/${version}-update.txt`), 'utf8');
fs.mkdirSync(destination);
const packages = {};
for (const [platform, label, build] of [['wechatgame', '微信小游戏', builds.wechat], ['web-mobile', 'Web', builds.web]]) {
  const source = path.join(sourceRoot, 'build', platform), target = path.join(destination, platform);
  const files = manifest(source, payloadFile);
  assert.equal(manifestHash(files), build.payloadSHA256);
  for (const file of files) {
    const output = path.join(target, file.file); fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.copyFileSync(path.join(source, file.file), output, fs.constants.COPYFILE_EXCL);
  }
  assert.deepEqual(manifest(target), files);
  const zip = path.join(destination, `线条突围-${label}-${version}.zip`);
  const archive = createArchive(target, zip);
  packages[platform] = { project: target, zip, archive, payloadSHA256: build.payloadSHA256, buildRun: build.runDir, files };
  writeJSON(path.join(destination, `${platform}-files.json`), { version, platform, inputSHA256: build.inputSHA256, files });
}
const config = readJSON(path.join(sourceRoot, 'build-config/wechatgame.json'));
const inspection = inspectPackage(packages.wechatgame.project, {
  appid: config.packages.wechatgame.appid,
  cover: path.join(sourceRoot, 'assets/landart/title-cover.jpg'),
  musicDirectory: path.join(sourceRoot, 'assets/bgm'), effectsDirectory: path.join(sourceRoot, 'assets/resources/audio'),
});
const receipt = {
  schema: 1, version, releaseName: '两关战斗与补给优化', channel: 'formal-delivery', createdAt: new Date().toISOString(),
  directory: destination, appid: inspection.appid, ...packages.wechatgame,
  description: update.trim(), inputSHA256: builds.wechat.inputSHA256,
  totalBytes: inspection.totalBytes, mainBytes: inspection.mainBytes, sizeBasis: inspection.sizeBasis,
  web: packages['web-mobile'], verification: '开发进度/验证记录/v108-release/verification.json',
  chapterAvailability: [1, 2], thirdChapterOpen: false, uploaded: false, published: false, deviceVerified: false,
};
writeJSON(path.join(destination, 'manifest.json'), receipt);
fs.writeFileSync(path.join(destination, '更新说明.txt'), update);
fs.writeFileSync(path.join(destination, '导入说明.txt'), `线条突围 ${version} 正式交付包（待上传）\n\n微信开发者工具：导入本目录的 wechatgame 文件夹，项目类型选择小游戏。\n上传版本号填写 ${version}，更新内容见“更新说明.txt”。ZIP解压后同样选择 wechatgame 文件夹。\nWeb包在 web-mobile 文件夹，须通过HTTP服务访问，不能直接双击HTML。\n\n已完成610项逻辑回归、10项Mac工具链检查、类型检查、双平台构建、浏览器两关完整通关及ZIP解包哈希核验。\n微信开发者工具当前包完整操作、手机触摸、真实广告和主观难度仍待验收。此包尚未上传、送审或发布。\n\nmanifest.json、wechatgame-files.json、web-mobile-files.json记录构建输入与文件校验值。\n1.0.7测试包已原样归入相邻的1.0.7/历史测试包目录。\n`);
verifyFrozenPackage(receipt);
assert.equal(hash(fs.readFileSync(receipt.web.zip)), receipt.web.archive.sha256);
writeJSON(path.join(macReports, 'latest-package.json'), { directory: destination });
writeJSON(path.join(evidence, 'package.json'), {
  version, directory: destination, inputSHA256: receipt.inputSHA256,
  packages: Object.entries(packages).map(([platform, p]) => ({ platform, project: p.project, zip: p.zip, sha256: p.archive.sha256, files: p.files.length, bytes: p.archive.bytes })),
  verified: true, uploaded: false, published: false, deviceVerified: false,
});
console.log(JSON.stringify({ version, directory: destination, files: Object.fromEntries(Object.entries(packages).map(([p, v]) => [p, v.files.length])) }));
