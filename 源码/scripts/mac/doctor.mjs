import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sourceRoot, macReports, readJSON, writeJSON, creatorExecutable, wechatCLI } from './common.mjs';

const require = createRequire(path.join(sourceRoot, 'package.json'));
export function diagnose() {
  const pkg = readJSON(path.join(sourceRoot, 'package.json'));
  const dependencies = Object.entries(pkg.devDependencies).map(([name, expected]) => {
    let actual = null;
    try { actual = require(`${name}/package.json`).version; } catch {}
    return { name, expected, actual, passed: expected === actual };
  });
  const creator = creatorExecutable();
  const app = creator.replace(/\/Contents\/MacOS\/CocosCreator$/, '');
  const plist = path.join(app, 'Contents/Info.plist');
  const version = fs.existsSync(plist) ? spawnSync('/usr/libexec/PlistBuddy', ['-c', 'Print :CFBundleShortVersionString', plist], { encoding: 'utf8' }).stdout?.trim() : null;
  const cli = wechatCLI();
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  const npm = spawnSync(path.join(path.dirname(process.execPath), 'npm'), ['--version'], { encoding: 'utf8', timeout: 15000 });
  const result = {
    checkedAt: new Date().toISOString(), platform: process.platform,
    node: { version: process.versions.node, path: process.execPath, passed: nodeMajor >= 22 },
    npm: { version: npm.status === 0 ? npm.stdout.trim() : null, passed: npm.status === 0 },
    creator: { path: creator, expected: pkg.creator.version, actual: version, passed: fs.existsSync(creator) && version === pkg.creator.version },
    wechat: { path: cli, installed: fs.existsSync(cli) },
    chrome: { installed: fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome') },
    dependencies,
  };
  result.ready = result.platform === 'darwin' && result.node.passed && result.npm.passed && result.creator.passed && result.wechat.installed && result.chrome.installed && dependencies.every(d => d.passed);
  return result;
}
export function requireDependencies() {
  const diagnosis = diagnose();
  if (!diagnosis.node.passed || diagnosis.dependencies.some(d => !d.passed)) {
    throw new Error('Node 或锁定版本依赖不完整。请先在系统终端运行 bash scripts/mac/setup.sh，不能把编辑器临时依赖当成完整开发环境。');
  }
  return diagnosis;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = diagnose(); writeJSON(path.join(macReports, 'environment.json'), report);
  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes('--require-ready') && !report.ready) process.exitCode = 1;
}
