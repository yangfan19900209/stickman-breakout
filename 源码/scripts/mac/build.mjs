import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sourceRoot, reportsRoot, macReports, readJSON, writeJSON, timestamp, creatorExecutable, buildInputs, manifest, manifestHash, nodeRun, assertBuildCompletion } from './common.mjs';
import { payloadFile, inspectPackage } from './wechat-package.mjs';
import { diagnose } from './doctor.mjs';

export async function build(platform, { dryRun = false } = {}) {
  if (process.platform !== 'darwin') throw new Error('Use the Windows build scripts on Windows.');
  if (!['web-mobile', 'wechatgame'].includes(platform)) throw new Error('Expected web-mobile or wechatgame.');
  const creator = creatorExecutable();
  if (!fs.existsSync(creator)) throw new Error('Creator not found. Set COCOS_CREATOR to its .app or executable.');
  if (!diagnose().creator.passed) throw new Error('Creator 版本与工程不一致；本工程要求 3.8.8。');
  const runDir = path.join(macReports, 'builds', `${timestamp()}-${platform}-${process.pid}`);
  const logFile = path.join(runDir, 'creator.log');
  const stdoutFile = path.join(runDir, 'stdout.log'), stderrFile = path.join(runDir, 'stderr.log');
  const args = ['--project', sourceRoot, '--build', `configPath=${path.join(sourceRoot, 'build-config', `${platform}.json`)};logDest=${logFile}`];
  if (dryRun) { console.log(JSON.stringify({ creator, args, cwd: sourceRoot, postprocess: platform }, null, 2)); return; }
  fs.mkdirSync(path.join(sourceRoot, 'temp'), { recursive: true });
  const lock = path.join(sourceRoot, 'temp/creator-cli-build.lock');
  let lockFd;
  try { lockFd = fs.openSync(lock, 'wx'); } catch (error) {
    if (error.code === 'EEXIST') throw new Error('已有 CLI 构建锁。确认另一次构建结束后再试，不会自动删除他人的锁。');
    throw error;
  }
  const descriptors = [];
  const receiptFile = path.join(macReports, `build-${platform}.json`);
  const receipt = { platform, version: readJSON(path.join(sourceRoot, 'package.json')).version, status: 'building', startedAt: new Date().toISOString(), runDir };
  try {
    fs.writeFileSync(lockFd, JSON.stringify({ pid: process.pid, ...receipt }));
    fs.mkdirSync(runDir, { recursive: true });
    writeJSON(receiptFile, receipt);
    const inputs = buildInputs(); writeJSON(path.join(runDir, 'inputs.json'), inputs);
    const out = fs.openSync(stdoutFile, 'w'); descriptors.push(out);
    const err = fs.openSync(stderrFile, 'w'); descriptors.push(err);
    const startedAt = Date.now();
    const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
    console.log(`Creator 命令行构建 ${platform}；日志：${runDir}`);
    const result = await new Promise((resolve, reject) => {
      const child = spawn(creator, args, { cwd: sourceRoot, env, stdio: ['ignore', out, err], timeout: 15 * 60 * 1000 });
      const stop = () => child.kill('SIGTERM');
      process.once('SIGINT', stop); process.once('SIGTERM', stop);
      child.once('error', reject);
      child.once('close', (status, signal) => {
        process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop);
        resolve({ status, signal });
      });
    });
    const log = [logFile, stdoutFile, stderrFile].filter(fs.existsSync).map(f => fs.readFileSync(f, 'utf8')).join('\n');
    const entry = path.join(sourceRoot, 'build', platform, platform === 'wechatgame' ? 'game.js' : 'index.html');
    assertBuildCompletion({ platform, ...result, log, startedAt, entryTime: fs.existsSync(entry) ? fs.statSync(entry).mtimeMs : NaN });
    if (buildInputs().sha256 !== inputs.sha256) throw new Error('构建期间源码/资源/配置变化，本轮产物不能固定交付。');
    nodeRun(`scripts/${platform === 'wechatgame' ? 'prepare-wechat-social.mjs' : 'prepare-web-shell.mjs'}`);
    if (platform === 'wechatgame') inspectPackage(path.join(sourceRoot, 'build/wechatgame'), {
      appid: readJSON(path.join(sourceRoot, 'build-config/wechatgame.json')).packages.wechatgame.appid,
      cover: path.join(sourceRoot, 'assets/landart/title-cover.jpg'),
    });
    const files = manifest(path.join(sourceRoot, 'build', platform), payloadFile);
    Object.assign(receipt, { status: 'built', completedAt: new Date().toISOString(), exitCode: result.status, inputSHA256: inputs.sha256, payloadSHA256: manifestHash(files), files });
    writeJSON(receiptFile, receipt); writeJSON(path.join(runDir, 'result.json'), receipt);
    const canonical = path.join(reportsRoot, '构建日志'); fs.mkdirSync(canonical, { recursive: true });
    fs.writeFileSync(path.join(canonical, `build-${platform}.log`), log);
    console.log(`构建和后处理完成：build/${platform}（${files.length} 文件）`);
    return receipt;
  } catch (error) {
    Object.assign(receipt, { status: 'failed', completedAt: new Date().toISOString(), error: error.message });
    writeJSON(receiptFile, receipt); writeJSON(path.join(runDir, 'result.json'), receipt);
    if (/SIGABRT/.test(error.message)) {
      error.message += '\nCreator 异常中止。若日志尚未进入构建、系统崩溃报告指向 AppKit/_RegisterApplication，请在普通终端运行 Mac开发.command 对比验证；不需要先打开编辑器窗口。本次不能认定生成了新包。';
    }
    throw error;
  } finally {
    for (const fd of descriptors) fs.closeSync(fd);
    fs.closeSync(lockFd); fs.rmSync(lock);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [platform = 'wechatgame', ...args] = process.argv.slice(2);
    if (args.some(arg => arg !== '--dry-run')) throw new Error('Usage: build.mjs [wechatgame|web-mobile] [--dry-run]');
    await build(platform, { dryRun: args.includes('--dry-run') });
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
