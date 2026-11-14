import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { sourceRoot, workspaceRoot, macReports, readJSON, writeJSON, hash, timestamp, manifest, manifestHash, latestBuild, run, wechatCLI } from './common.mjs';

// Creator/editor metadata and local developer preferences are not game files.
// A key anywhere in the output is an error, including inside an excluded directory.
export function payloadFile(file) {
  if (/\.(pem|key)$/i.test(file)) throw new Error(`游戏包含密钥文件，拒绝打包：${file}`);
  return !file.split('/').some(part => ['.DS_Store', '.git', 'node_modules', '.runtime-bridge'].includes(part))
    && file !== 'project.private.config.json';
}

export function inspectPackage(directory, { appid, cover, musicDirectory, effectsDirectory } = {}) {
  const files = manifest(directory, payloadFile);
  const names = new Set(files.map(item => item.file));
  for (const file of ['game.js', 'game.json', 'project.config.json', 'openDataContext/index.js', 'openDataContext/store.js', 'openDataContext/records.js', 'subpackages/landart/share-cover.jpg']) {
    assert.ok(names.has(file), `微信包缺少 ${file}`);
  }
  const project = readJSON(path.join(directory, 'project.config.json'));
  const game = readJSON(path.join(directory, 'game.json'));
  assert.equal(project.compileType, 'game', '不是微信小游戏包');
  assert.equal(project.miniprogramRoot || './', './', '小游戏根目录必须为当前目录');
  if (appid) assert.equal(project.appid, appid, '微信 AppID 不一致');
  assert.equal(game.deviceOrientation, 'landscape');
  assert.equal(game.openDataContext, 'openDataContext');
  const expected = ['internal', 'main', 'landart', 'level02', 'level03'];
  if (game.subpackages.some(item => item.name === 'bgm')) expected.push('bgm');
  assert.deepEqual(game.subpackages.map(item => item.name).sort(), expected.sort(), '分包列表不一致');
  for (const item of game.subpackages) {
    assert.equal(item.root.replace(/\/$/, ''), `subpackages/${item.name}`, '分包路径错误');
    assert.ok(files.some(file => file.file.startsWith(`subpackages/${item.name}/`)), `空分包：${item.name}`);
  }
  if (cover) assert.equal(hash(fs.readFileSync(path.join(directory, 'subpackages/landart/share-cover.jpg'))), hash(fs.readFileSync(cover)), '分享封面不是当前资源');
  if (musicDirectory) {
    assert.ok(game.subpackages.some(item => item.name === 'bgm'), '缺少音乐 bgm 分包，需刷新资源后重新构建');
    assert.ok(names.has('AUDIO-CREDITS.txt'), '缺少音乐来源与授权说明');
    const configFile = path.join(directory, 'subpackages/bgm/config.json');
    assert.ok(fs.existsSync(configFile), '缺少音乐资源索引');
    const paths = Object.values(readJSON(configFile).paths ?? {}).map(value => value[0]);
    const packed = new Set(files.filter(file => file.file.startsWith('subpackages/bgm/') && file.file.endsWith('.mp3')).map(file => file.sha256));
    for (const file of fs.readdirSync(musicDirectory).filter(file => file.endsWith('.mp3'))) {
      assert.ok(paths.includes(path.basename(file, '.mp3')), `音乐未进入资源索引：${file}`);
      assert.ok(packed.has(hash(fs.readFileSync(path.join(musicDirectory, file)))), `音乐未打包或不是当前版本：${file}`);
    }
  }
  if (effectsDirectory) {
    const configFile = path.join(directory, 'assets/resources/config.json');
    assert.ok(fs.existsSync(configFile), '缺少音效资源索引');
    const paths = Object.values(readJSON(configFile).paths ?? {}).map(value => value[0]);
    const packed = new Set(files.filter(file => file.file.startsWith('assets/resources/') && file.file.endsWith('.wav')).map(file => file.sha256));
    for (const file of fs.readdirSync(effectsDirectory).filter(file => file.endsWith('.wav'))) {
      assert.ok(paths.includes(`audio/${path.basename(file, '.wav')}`), `音效未进入资源索引：${file}`);
      assert.ok(packed.has(hash(fs.readFileSync(path.join(effectsDirectory, file)))), `音效未打包或不是当前版本：${file}`);
    }
  }
  const totalBytes = files.reduce((sum, item) => sum + item.bytes, 0);
  return { appid: project.appid, files, payloadSHA256: manifestHash(files), totalBytes, mainBytes: files.filter(item => !item.file.startsWith('subpackages/')).reduce((sum, item) => sum + item.bytes, 0), sizeBasis: 'raw files; not WeChat upload compressed size' };
}

function projectOptions() {
  const musicDirectory = path.join(sourceRoot, 'assets/bgm');
  return { appid: readJSON(path.join(sourceRoot, 'build-config/wechatgame.json')).packages.wechatgame.appid, cover: path.join(sourceRoot, 'assets/landart/title-cover.jpg'),
    effectsDirectory: path.join(sourceRoot, 'assets/resources/audio'),
    ...(fs.existsSync(musicDirectory) ? { musicDirectory } : {}) };
}

export function assertPayload(receipt, inspection) {
  assert.equal(inspection.payloadSHA256, receipt.payloadSHA256, '构建文件已经变化，请重新构建；不能上传旧包或修改后的包。');
}

// Kept independent of build launching so ZIP integrity can be tested with fixtures.
export function createArchive(directory, zipFile) {
  if (fs.existsSync(zipFile)) throw new Error(`压缩包已存在，不覆盖：${zipFile}`);
  run('/usr/bin/ditto', ['-c', '-k', '--norsrc', '--keepParent', directory, zipFile]);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'stickman-zip-check-'));
  try {
    run('/usr/bin/ditto', ['-x', '-k', zipFile, temporary]);
    assert.deepEqual(manifest(path.join(temporary, path.basename(directory))), manifest(directory), 'ZIP 解压后与固定目录不一致');
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
  return { sha256: hash(fs.readFileSync(zipFile)), bytes: fs.statSync(zipFile).size };
}

export function freezePackage() {
  const build = latestBuild('wechatgame');
  const source = path.join(sourceRoot, 'build/wechatgame');
  const inspection = inspectPackage(source, projectOptions());
  assertPayload(build, inspection);
  const version = readJSON(path.join(sourceRoot, 'package.json')).version;
  assert.equal(build.version, version);
  const updateFile = path.join(workspaceRoot, '交付/更新说明', `${version}-update.txt`);
  const description = fs.readFileSync(updateFile, 'utf8').trim();
  assert.ok(description, '缺少此版本更新说明');
  const destination = path.join(workspaceRoot, '交付/版本', `${version}-mac-${timestamp()}-${process.pid}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.mkdirSync(destination); // Existing version/anchor directories are never overwritten.
  const project = path.join(destination, 'wechatgame');
  for (const file of inspection.files) {
    const target = path.join(project, file.file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(source, file.file), target, fs.constants.COPYFILE_EXCL);
  }
  assertPayload(build, inspectPackage(project, projectOptions()));
  // All files in the fixed directory must be exactly the payload; no hidden extras.
  assert.deepEqual(manifest(project), inspection.files);
  fs.writeFileSync(path.join(destination, '更新说明.txt'), description + '\n');
  const zip = path.join(destination, `stickman-breakout-${version}-wechat.zip`);
  const archive = createArchive(project, zip);
  const receipt = {
    schema: 1, createdAt: new Date().toISOString(), version, appid: inspection.appid,
    directory: destination, project, zip, archive, description,
    inputSHA256: build.inputSHA256, payloadSHA256: inspection.payloadSHA256,
    buildRun: build.runDir, files: inspection.files,
    totalBytes: inspection.totalBytes, mainBytes: inspection.mainBytes, sizeBasis: inspection.sizeBasis,
    uploaded: false, published: false, deviceVerified: false,
  };
  writeJSON(path.join(destination, 'manifest.json'), receipt);
  writeJSON(path.join(macReports, 'latest-package.json'), { directory: destination });
  console.log(`固定包与 ZIP 已生成并核对解压哈希：${destination}`);
  return receipt;
}

export function verifyFrozenPackage(receipt) {
  const current = inspectPackage(receipt.project, { appid: receipt.appid });
  assertPayload(receipt, current);
  assert.deepEqual(current.files, receipt.files);
  // WeChat may add a local private config when opening this directory; ignored above.
  assert.equal(hash(fs.readFileSync(receipt.zip)), receipt.archive.sha256, '固定 ZIP 已变化');
  return current;
}

export function uploadPlan() {
  const cli = wechatCLI();
  assert.ok(fs.existsSync(cli), `未找到微信开发者工具 CLI：${cli}`);
  const pointer = path.join(macReports, 'latest-package.json');
  assert.ok(fs.existsSync(pointer), '尚无 Mac 固定包。先构建微信包，再执行 package。');
  const receipt = readJSON(path.join(readJSON(pointer).directory, 'manifest.json'));
  const build = latestBuild('wechatgame');
  assert.equal(build.inputSHA256, receipt.inputSHA256, '固定包不是当前源码，请重新固定打包');
  assert.equal(build.payloadSHA256, receipt.payloadSHA256, '固定包不是最近一次成功构建，请重新固定打包');
  assert.equal(receipt.version, readJSON(path.join(sourceRoot, 'package.json')).version);
  assert.equal(receipt.appid, projectOptions().appid);
  verifyFrozenPackage(receipt);
  const tests = readJSON(path.join(macReports, 'tests.json'));
  assert.equal(tests.passed, true, '请先完成 Mac 代码检查');
  assert.equal(tests.inputSHA256, receipt.inputSHA256, '代码检查已过期，请执行 mac:test');
  const info = path.join(macReports, 'uploads', `${timestamp()}-devtools.json`);
  return { cli, args: ['upload', '--project', receipt.project, '--version', receipt.version, '--desc', receipt.description, '--info-output', info], info, receipt };
}

export function uploadWechat() {
  const plan = uploadPlan();
  fs.mkdirSync(path.dirname(plan.info), { recursive: true });
  console.log(`上传开发版本 ${plan.receipt.version} → ${plan.receipt.appid}\n固定目录：${plan.receipt.project}`);
  // Uses the developer tool's existing login. Does not change service-port settings.
  const resultFile = plan.info.replace('-devtools.json', '-result.json');
  const result = {
    startedAt: new Date().toISOString(), uploaded: false, published: false,
    version: plan.receipt.version, appid: plan.receipt.appid,
    project: plan.receipt.project, payloadSHA256: plan.receipt.payloadSHA256, infoFile: plan.info,
  };
  writeJSON(resultFile, result);
  try {
    run(plan.cli, plan.args);
    assert.ok(fs.existsSync(plan.info), 'CLI 未生成上传回执，请在微信工具确认结果；未记录为成功。');
    const info = readJSON(plan.info);
    assert.ok(info && typeof info === 'object' && Object.keys(info).length > 0, '上传回执为空');
    for (const key of ['errCode', 'errcode']) {
      if (key in info) assert.equal(Number(info[key]), 0, '微信回执包含错误码');
    }
    Object.assign(result, { uploaded: true, completedAt: new Date().toISOString() });
    console.log('开发版本上传成功；未送审、未发布。');
  } catch (error) { result.error = error.message; throw error; }
  finally { writeJSON(resultFile, result); }
}

export function openWechat() {
  const pointer = path.join(macReports, 'latest-package.json');
  let project = path.join(sourceRoot, 'build/wechatgame');
  if (fs.existsSync(pointer)) {
    const receipt = readJSON(path.join(readJSON(pointer).directory, 'manifest.json'));
    const build = latestBuild('wechatgame');
    if (build.payloadSHA256 === receipt.payloadSHA256) {
      verifyFrozenPackage(receipt); project = receipt.project;
    } else {
      assertPayload(build, inspectPackage(project, projectOptions()));
      console.log('本轮构建尚未固定打包，打开最新共享构建目录。');
    }
  }
  inspectPackage(project, projectOptions());
  run(wechatCLI(), ['open', '--project', project]);
}
