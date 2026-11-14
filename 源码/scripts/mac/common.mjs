import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { sourceRoot, workspaceRoot, reportsRoot } from '../project-paths.mjs';

export { sourceRoot, workspaceRoot, reportsRoot };
export const macReports = path.join(reportsRoot, 'mac');
export const readJSON = file => JSON.parse(fs.readFileSync(file, 'utf8'));
export const hash = data => createHash('sha256').update(data).digest('hex');
export const normalize = value => value.replaceAll('\\', '/');
export const timestamp = () => new Date().toISOString().replaceAll(/[:.]/g, '-');
export function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}
export function walk(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(root, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink in build inputs/output: ${file}`);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
export function manifest(root, filter = () => true) {
  return walk(root).map(file => ({ file: normalize(path.relative(root, file)), absolute: file }))
    .filter(entry => filter(entry.file))
    .sort((a, b) => a.file.localeCompare(b.file, 'en'))
    .map(({ file, absolute }) => {
      const data = fs.readFileSync(absolute);
      return { file, bytes: data.length, sha256: hash(data) };
    });
}
export const manifestHash = files => hash(JSON.stringify(files));
export function buildInputs(root = sourceRoot) {
  const files = ['assets', 'web-shell', 'build-config', 'build-templates', 'settings']
    .flatMap(dir => walk(path.join(root, dir)))
    // Account UI state is not a game build input.
    .filter(file => !/settings\/v2\/packages\/(information|cocos-service)\.json$/.test(normalize(file)))
    .concat(['scripts/prepare-web-shell.mjs', 'scripts/prepare-wechat-social.mjs', 'package-lock.json'].map(file => path.join(root, file)))
    .map(file => ({ file: normalize(path.relative(root, file)), sha256: hash(fs.readFileSync(file)) }))
    .sort((a, b) => a.file.localeCompare(b.file, 'en'));
  const { scripts, ...runtimePackage } = readJSON(path.join(root, 'package.json'));
  files.push({ file: 'package.json (without npm scripts)', sha256: hash(JSON.stringify(runtimePackage)) });
  return { sha256: hash(JSON.stringify(files)), files };
}
export function creatorExecutable() {
  const version = readJSON(path.join(sourceRoot, 'package.json')).creator.version;
  let executable = process.env.COCOS_CREATOR || `/Applications/Cocos/Creator/${version}/CocosCreator.app/Contents/MacOS/CocosCreator`;
  if (executable.endsWith('.app')) executable = path.join(executable, 'Contents/MacOS/CocosCreator');
  return executable;
}
export function wechatCLI() {
  let cli = process.env.WECHAT_DEVTOOLS || '/Applications/wechatwebdevtools.app';
  if (cli.endsWith('.app')) cli = path.join(cli, 'Contents/MacOS/cli');
  return cli;
}
export function run(executable, args, options = {}) {
  const result = spawnSync(executable, args, { cwd: sourceRoot, stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Command failed: ${path.basename(executable)} ${args[0] || ''} (exit=${result.status}, signal=${result.signal})`);
  return result;
}
export const nodeRun = (script, args = [], options = {}) => run(process.execPath, [path.join(sourceRoot, script), ...args], options);

export function assertBuildCompletion({ platform, status, signal, log, entryTime, startedAt }) {
  if (![0, 36].includes(status) || signal) {
    throw new Error(`Creator failed (exit=${status}, signal=${signal}).`);
  }
  if (!log.includes(`build Task (${platform}) Finished`)) throw new Error('No completion marker for this platform.');
  if (/Missing class|Script .+ is missing or invalid/.test(log)) throw new Error('Creator reported missing script classes.');
  if (!Number.isFinite(entryTime) || entryTime < startedAt - 1000) throw new Error('Build entry is absent or stale.');
}

export function latestBuild(platform) {
  const file = path.join(macReports, `build-${platform}.json`);
  if (!fs.existsSync(file)) throw new Error(`先执行 Mac 构建：bash scripts/mac/run.sh build ${platform}`);
  const receipt = readJSON(file);
  if (receipt.status !== 'built') throw new Error('最近一次 Mac 构建未成功，请重新构建。');
  if (receipt.inputSHA256 !== buildInputs().sha256) throw new Error('源码或资源已变化，请重新构建后再打包/上传。');
  return receipt;
}
