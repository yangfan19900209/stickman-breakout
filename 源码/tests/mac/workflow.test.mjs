import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { assertBuildCompletion, hash, manifest, writeJSON, buildInputs } from '../../scripts/mac/common.mjs';
import { inspectPackage, assertPayload, createArchive, verifyFrozenPackage } from '../../scripts/mac/wechat-package.mjs';
import { partitionMissingArtifacts } from '../../scripts/mac/artifact-links.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stickman-mac-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function put(root, relative, content = 'test') {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content);
  return file;
}
function gameFixture(root) {
  const project = path.join(root, '中文 空格 wechatgame');
  const groups = ['internal', 'main', 'landart', 'level02', 'level03'];
  for (const group of groups) put(project, `subpackages/${group}/index.js`);
  put(project, 'game.js');
  for (const file of ['index.js', 'store.js', 'records.js']) put(project, `openDataContext/${file}`);
  put(project, 'subpackages/landart/share-cover.jpg', 'fixture-cover');
  writeJSON(path.join(project, 'project.config.json'), { appid: 'fixture-appid', compileType: 'game', miniprogramRoot: './' });
  writeJSON(path.join(project, 'game.json'), { deviceOrientation: 'landscape', openDataContext: 'openDataContext', subpackages: groups.map(name => ({ name, root: `subpackages/${name}/` })) });
  return project;
}

const success = { platform: 'wechatgame', status: 36, signal: null, log: 'build Task (wechatgame) Finished', startedAt: 10000, entryTime: 10020 };
test('Creator success requires matching platform marker, allowed code, fresh output and valid scripts', () => {
  assert.doesNotThrow(() => assertBuildCompletion(success));
  assert.doesNotThrow(() => assertBuildCompletion({ ...success, status: 0 }));
  for (const patch of [
    { status: 34 }, { status: 134 }, { status: null, signal: 'SIGABRT' },
    { log: 'build Task (web-mobile) Finished' }, { log: '' },
    { entryTime: NaN }, { entryTime: 8000 },
    { log: success.log + '\nMissing class: test' },
    { log: success.log + '\nScript 123 is missing or invalid' },
  ]) assert.throws(() => assertBuildCompletion({ ...success, ...patch }), JSON.stringify(patch));
});

test('postprocess contents and all five subpackages are required', t => {
  const project = gameFixture(fixture(t));
  assert.equal(inspectPackage(project, { appid: 'fixture-appid' }).appid, 'fixture-appid');
  assert.throws(() => inspectPackage(project, { appid: 'wrong-appid' }), /AppID/);
  fs.rmSync(path.join(project, 'openDataContext/records.js'));
  assert.throws(() => inspectPackage(project), /records.js/);
  put(project, 'openDataContext/records.js');
  fs.rmSync(path.join(project, 'subpackages/level02'), { recursive: true });
  assert.throws(() => inspectPackage(project), /空分包/);
});

test('metadata does not invalidate a payload, but a secret in excluded metadata is rejected', t => {
  const project = gameFixture(fixture(t));
  const initial = inspectPackage(project);
  put(project, 'project.private.config.json', '{}');
  put(project, '.runtime-bridge/config.snapshot.json', '{}');
  put(project, '.DS_Store');
  assert.equal(inspectPackage(project).payloadSHA256, initial.payloadSHA256);
  put(project, '.runtime-bridge/upload.pem', 'not a real key');
  assert.throws(() => inspectPackage(project), /密钥文件/);
});

test('music builds require the bgm package, resource paths, exact audio bytes and credits', t => {
  const root = fixture(t), project = gameFixture(root), musicDirectory = path.join(root, 'music');
  put(musicDirectory, 'canon-80bpm.mp3', 'fixture-audio');
  assert.throws(() => inspectPackage(project, { musicDirectory }), /缺少音乐 bgm 分包/);
  const config = JSON.parse(fs.readFileSync(path.join(project, 'game.json'), 'utf8'));
  config.subpackages.push({ name: 'bgm', root: 'subpackages/bgm/' });
  writeJSON(path.join(project, 'game.json'), config);
  put(project, 'subpackages/bgm/index.js');
  assert.throws(() => inspectPackage(project, { musicDirectory }), /音乐来源/);
  put(project, 'AUDIO-CREDITS.txt', 'fixture-credit');
  writeJSON(path.join(project, 'subpackages/bgm/config.json'), { paths: { 0: ['canon-80bpm', 0] } });
  assert.throws(() => inspectPackage(project, { musicDirectory }), /音乐未打包/);
  put(project, 'subpackages/bgm/native/fixture.mp3', 'fixture-audio');
  assert.doesNotThrow(() => inspectPackage(project, { musicDirectory }));
  put(project, 'subpackages/bgm/native/fixture.mp3', 'stale-audio');
  assert.throws(() => inspectPackage(project, { musicDirectory }), /音乐未打包/);
});

test('new or redesigned combat sounds require current index entries and exact WAV bytes', t => {
  const root = fixture(t), project = gameFixture(root), effectsDirectory = path.join(root, 'sounds');
  put(effectsDirectory, 'rocket.wav', 'new-rocket');
  assert.throws(() => inspectPackage(project, { effectsDirectory }), /缺少音效资源索引/);
  writeJSON(path.join(project, 'assets/resources/config.json'), { paths: {} });
  assert.throws(() => inspectPackage(project, { effectsDirectory }), /音效未进入资源索引/);
  writeJSON(path.join(project, 'assets/resources/config.json'), { paths: { 0: ['audio/rocket', 0] } });
  put(project, 'assets/resources/native/rocket.wav', 'old-rocket');
  assert.throws(() => inspectPackage(project, { effectsDirectory }), /音效未打包或不是当前版本/);
  put(project, 'assets/resources/native/rocket.wav', 'new-rocket');
  assert.doesNotThrow(() => inspectPackage(project, { effectsDirectory }));
});

test('modified or extra game files cannot pass a saved build fingerprint', t => {
  const project = gameFixture(fixture(t));
  const receipt = inspectPackage(project);
  put(project, 'game.js', 'modified');
  assert.throws(() => assertPayload(receipt, inspectPackage(project)), /构建文件已经变化/);
  put(project, 'game.js', 'test');
  put(project, 'extra.js', 'unexpected');
  assert.throws(() => assertPayload(receipt, inspectPackage(project)), /构建文件已经变化/);
});

test('symlinks cannot escape a package directory', t => {
  const root = fixture(t), project = gameFixture(root);
  const outside = put(root, 'outside.txt');
  fs.symlinkSync(outside, path.join(project, 'linked.txt'));
  assert.throws(() => inspectPackage(project), /symlink/);
});

test('ZIP roundtrip preserves unicode/spaces, refuses overwrite and detects later tampering', { skip: process.platform !== 'darwin' }, t => {
  const root = fixture(t), project = gameFixture(root);
  const inspection = inspectPackage(project);
  const zip = path.join(root, '中文 固定包.zip');
  const archive = createArchive(project, zip);
  assert.equal(archive.sha256, hash(fs.readFileSync(zip)));
  const receipt = { ...inspection, project, zip, archive };
  assert.doesNotThrow(() => verifyFrozenPackage(receipt));
  assert.throws(() => createArchive(project, zip), /不覆盖/);
  put(project, 'project.private.config.json', '{}');
  assert.doesNotThrow(() => verifyFrozenPackage(receipt));
  fs.appendFileSync(zip, 'tampered');
  assert.throws(() => verifyFrozenPackage(receipt), /ZIP 已变化/);
});

test('build input snapshot covers runtime package, assets and web shell, excluding account UI state', t => {
  const root = fixture(t);
  for (const directory of ['assets', 'web-shell', 'build-config', 'build-templates', 'settings']) put(root, `${directory}/sample.txt`);
  for (const file of ['scripts/prepare-web-shell.mjs', 'scripts/prepare-wechat-social.mjs', 'package-lock.json']) put(root, file);
  writeJSON(path.join(root, 'package.json'), { version: '1.0.0', scripts: { test: 'old' } });
  writeJSON(path.join(root, 'settings/v2/packages/information.json'), { account: 'fixture' });
  const initial = buildInputs(root).sha256;
  writeJSON(path.join(root, 'package.json'), { version: '1.0.0', scripts: { test: 'new' } });
  writeJSON(path.join(root, 'settings/v2/packages/information.json'), { account: 'other' });
  assert.equal(buildInputs(root).sha256, initial);
  put(root, 'web-shell/sample.txt', 'new shell');
  assert.notEqual(buildInputs(root).sha256, initial);
  put(root, 'web-shell/sample.txt', 'test');
  writeJSON(path.join(root, 'package.json'), { version: '1.0.1' });
  assert.notEqual(buildInputs(root).sha256, initial);
});

test('source-only check exempts only git-ignored artifacts, not missing docs, source or tracked artifacts', t => {
  const root = fixture(t);
  const initialized = spawnSync('git', ['init', '-q', root], { encoding: 'utf8' });
  assert.equal(initialized.status, 0, initialized.stderr);
  put(root, '.gitignore', '*.png\n历史归档/体验锚点/\n交付/版本/**/wechatgame/\n运营/备案截图/\n');
  put(root, '开发进度/验证记录/tracked.png');
  assert.equal(spawnSync('git', ['add', '-f', '开发进度/验证记录/tracked.png'], { cwd: root }).status, 0);
  const missing = [
    { file: 'README.md', target: '历史归档/体验锚点/old/manifest.json' },
    { file: 'README.md', target: '开发进度/验证记录/missing.png' },
    { file: 'README.md', target: '交付/版本/1.0.0/wechatgame' },
    { file: 'README.md', target: '运营/备案截图' },
    { file: 'README.md', target: '历史归档/体验锚点' },
    { file: 'README.md', target: '开发进度/验证记录/tracked.png' },
    { file: 'README.md', target: '源码/assets/missing.png' },
    { file: 'README.md', target: 'doc/missing.md' },
    { file: 'README.md', target: '历史归档/missing.json' },
  ];
  const result = partitionMissingArtifacts(missing, root);
  assert.equal(result.unavailableArtifacts.length, 5);
  assert.deepEqual(result.missing, missing.slice(5));
});
