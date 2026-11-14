import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { sourceRoot, macReports, buildInputs, nodeRun, run, writeJSON, readJSON, timestamp } from './common.mjs';
import { diagnose, requireDependencies } from './doctor.mjs';
import { build } from './build.mjs';
import { freezePackage, uploadPlan, uploadWechat, openWechat, inspectPackage } from './wechat-package.mjs';

process.chdir(sourceRoot);

function testCode() {
  requireDependencies();
  const receipt = { startedAt: new Date().toISOString(), passed: false, inputSHA256: buildInputs().sha256 };
  const file = path.join(macReports, 'tests.json');
  writeJSON(file, receipt);
  nodeRun('node_modules/typescript/bin/tsc', ['-p', 'tsconfig.check.json']);
  nodeRun('scripts/test.mjs');
  const tooling = fs.readdirSync(path.join(sourceRoot, 'tests/mac')).filter(name => name.endsWith('.test.mjs')).map(name => `tests/mac/${name}`);
  nodeRun('scripts/mac/verify-project.mjs', ['--source-only']);
  // Pass concrete paths so behavior is independent of the caller's shell globbing.
  const child = spawn(process.execPath, ['--test', ...tooling], { cwd: sourceRoot, stdio: 'inherit' });
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', code => {
      if (code !== 0) return reject(new Error(`工具链回归失败（${code}）`));
      if (buildInputs().sha256 !== receipt.inputSHA256) return reject(new Error('测试期间构建输入发生变化，请重跑。'));
      Object.assign(receipt, { passed: true, completedAt: new Date().toISOString(), logic: readJSON(path.join(macReports, '../logic-results.json')) });
      writeJSON(file, receipt); console.log('类型、逻辑、工程结构和工具链检查通过。'); resolve(receipt);
    });
  });
}

async function smoke() {
  const server = spawn(process.execPath, ['scripts/mac/serve.mjs'], { cwd: sourceRoot, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  const closed = new Promise(resolve => server.once('close', resolve));
  let errors = '';
  server.stderr.on('data', data => { errors += data.toString(); });
  try {
    const base = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`试玩服务启动超时：${errors}`)), 30000);
      let output = '';
      const finish = callback => value => { clearTimeout(timer); callback(value); };
      server.once('error', finish(reject));
      server.once('exit', finish(code => reject(new Error(`试玩服务退出（${code}）：${errors}`))));
      server.stdout.on('data', data => {
        output += data.toString();
        const address = output.match(/Cocos Web preview: (http:\/\/127\.0\.0\.1:\d+)/);
        if (address) finish(resolve)(address[1]);
      });
    });
    console.log(`针对本轮 Web 包回归：${base}`);
    nodeRun('scripts/verify-smoke.mjs', [], { env: { ...process.env, PREVIEW_URL: base } });
  } finally {
    if (server.exitCode === null && server.signalCode === null) server.kill('SIGTERM');
    const timer = setTimeout(() => server.kill('SIGKILL'), 3000);
    await closed; clearTimeout(timer);
  }
}

const [action = 'help', ...args] = process.argv.slice(2);
try {
  if (!['build'].includes(action) && args.length) throw new Error(`此操作不接受额外参数：${action}`);
  switch (action) {
    case 'doctor': {
      const report = diagnose(); writeJSON(path.join(macReports, 'environment.json'), report);
      console.log(JSON.stringify(report, null, 2));
      if (!report.ready) { console.log('环境尚未就绪：先运行 bash scripts/mac/setup.sh。'); process.exitCode = 1; }
      break;
    }
    case 'test': await testCode(); break;
    case 'test-tooling': {
      const files = fs.readdirSync(path.join(sourceRoot, 'tests/mac')).filter(name => name.endsWith('.test.mjs')).map(name => `tests/mac/${name}`);
      run(process.execPath, ['--test', ...files]); break;
    }
    case 'build': {
      const platform = args.find(arg => arg !== '--dry-run') || 'wechatgame';
      if (args.some(arg => !['wechatgame', 'web-mobile', '--dry-run'].includes(arg)) || args.filter(arg => arg !== '--dry-run').length > 1) throw new Error('用法：build [wechatgame|web-mobile] [--dry-run]');
      if (!args.includes('--dry-run')) requireDependencies();
      await build(platform, { dryRun: args.includes('--dry-run') }); break;
    }
    case 'dev':
      requireDependencies(); await build('web-mobile'); nodeRun('scripts/mac/serve.mjs', ['--open']); break;
    case 'verify': {
      const record = { startedAt: new Date().toISOString(), passed: false, uploaded: false, deviceVerified: false };
      const file = path.join(macReports, 'runs', `${timestamp()}-verify.json`);
      writeJSON(file, record);
      try {
        await testCode(); await build('web-mobile'); await build('wechatgame');
        await smoke(); nodeRun('scripts/verify-delivery.mjs');
        const fixed = freezePackage();
        Object.assign(record, { passed: true, completedAt: new Date().toISOString(), packageDirectory: fixed.directory });
        console.log('代码检查、双平台构建、浏览器冒烟和微信固定打包完成。微信模拟器与真机操作请分别验收。');
      } catch (error) { record.error = error.message; throw error; }
      finally { writeJSON(file, record); }
      break;
    }
    case 'package': freezePackage(); break;
    case 'open-wechat': openWechat(); break;
    case 'upload-check': {
      const plan = uploadPlan();
      const report = { checkedAt: new Date().toISOString(), localChecksPassed: true, version: plan.receipt.version, appid: plan.receipt.appid, project: plan.receipt.project, zip: plan.receipt.zip, payloadSHA256: plan.receipt.payloadSHA256, uploaded: false, serviceLoginAndUploadNotTested: true };
      writeJSON(path.join(macReports, 'upload-check.json'), report);
      console.log(JSON.stringify(report, null, 2));
      console.log('本地上传条件通过；微信登录、CLI 服务及平台上传结果在实际 upload 时验证。'); break;
    }
    case 'upload': uploadWechat(); break;
    case 'inspect': {
      const config = readJSON(path.join(sourceRoot, 'build-config/wechatgame.json'));
      const musicDirectory = path.join(sourceRoot, 'assets/bgm');
      const result = inspectPackage(path.join(sourceRoot, 'build/wechatgame'), { appid: config.packages.wechatgame.appid, cover: path.join(sourceRoot, 'assets/landart/title-cover.jpg'),
        effectsDirectory: path.join(sourceRoot, 'assets/resources/audio'),
        ...(fs.existsSync(musicDirectory) ? { musicDirectory } : {}) });
      writeJSON(path.join(macReports, 'package-inspection.json'), result);
      console.log(JSON.stringify({ ...result, files: result.files.length, sourceFreshnessVerified: false, uploaded: false }, null, 2)); break;
    }
    case 'help': console.log('用法：bash scripts/mac/run.sh <doctor|test|test-tooling|build [web-mobile|wechatgame] [--dry-run]|dev|verify|package|open-wechat|upload-check|upload|inspect>'); break;
    default: throw new Error(`未知操作：${action}`);
  }
} catch (error) {
  console.error(`\nMac 工作流停止：${error.message}`);
  process.exitCode = 1;
}
