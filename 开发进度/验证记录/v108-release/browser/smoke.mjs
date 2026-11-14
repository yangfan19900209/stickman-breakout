import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from '/Users/yangfan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { sourceRoot, reportsRoot } from '../../../../源码/scripts/project-paths.mjs';
import { buildInputs, latestBuild, writeJSON } from '../../../../源码/scripts/mac/common.mjs';

// One-run evidence using the installed runtime, without changing project dependencies.
const directory = path.dirname(fileURLToPath(import.meta.url));
const build = latestBuild('web-mobile');
const report = {
  version: build.version, startedAt: new Date().toISOString(), passed: false,
  inputSHA256: build.inputSHA256, buildRun: build.runDir,
  environment: { node: process.version, playwright: '1.62.1', browser: 'system Google Chrome, headless' },
  scope: 'Browser: both chapter loaders, real keyboard movement/fire, pause/resume, audio loading and Web Audio start calls. Not full-campaign, WeChat, device or listening validation.',
  chapters: [], errors: [], failed: [],
};
const server = spawn(process.execPath, ['scripts/mac/serve.mjs'], {
  cwd: sourceRoot, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'],
});
const serverClosed = new Promise(resolve => server.once('close', resolve));
let serverOutput = '', serverError = '', browser;
server.stderr.on('data', data => { serverError += data; });
try {
  const base = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Preview startup timeout: ${serverError}`)), 30000);
    server.once('error', error => { clearTimeout(timer); reject(error); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Preview exited ${code}: ${serverError}`)); });
    server.stdout.on('data', data => {
      serverOutput += data;
      const found = serverOutput.match(/Cocos Web preview: (http:\/\/127\.0\.0\.1:\d+)/);
      if (found) { clearTimeout(timer); resolve(found[1]); }
    });
  });
  report.base = base;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const chapter of [1, 2]) {
    const context = await browser.newContext({ viewport: { width: 852, height: 393 }, hasTouch: true, serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.addInitScript(() => {
      const probe = globalThis.__AUDIO_PROBE__ = { starts: 0, running: 0 };
      const original = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...args) {
        const result = original.apply(this, args);
        probe.starts++;
        if (this.context.state === 'running') probe.running++;
        return result;
      };
    });
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) report.failed.push({ url: response.url(), status: response.status() });
    });
    page.on('requestfailed', request => report.failed.push({ url: request.url(), error: request.failure()?.errorText }));
    try {
      await page.goto(base + (chapter === 2 ? '/level02.html' : '/'));
      await page.waitForFunction(() => !!globalThis.__BREAKOUT__);
      assert.equal(await page.evaluate(()=>globalThis.__BREAKOUT__.version),build.version);
      await page.locator('#GameCanvas').focus();
      if (chapter === 1) await page.keyboard.press('Enter');
      await page.waitForFunction(c => {
        const state = globalThis.__BREAKOUT__.snapshot();
        return state.state === 'playing' && state.chapter === c;
      }, chapter, { timeout: 30000 });
      await page.waitForFunction(() => {
        const audio = globalThis.__BREAKOUT__.snapshot().audio;
        return audio.loaded >= 17 && audio.music.loaded === 2;
      });
      if (chapter === 2) {
        // The shore entry is reached normally; it clears held input on completion.
        await page.keyboard.down('KeyD');
        await page.waitForFunction(() => globalThis.__BREAKOUT__.snapshot().stage === 'swimming', null, { timeout: 20000 });
        await page.keyboard.up('KeyD');
      }
      const before = await page.evaluate(() => globalThis.__BREAKOUT__.snapshot());
      await page.keyboard.down('KeyD');
      await page.keyboard.down('KeyJ');
      await page.waitForFunction(initial => {
        const state = globalThis.__BREAKOUT__.snapshot();
        return state.player.x > initial.x + 10 && state.playerShots > initial.shots;
      }, { x: before.player.x, shots: before.playerShots }, { timeout: 15000 });
      await page.keyboard.up('KeyD');
      await page.keyboard.up('KeyJ');
      await page.waitForFunction(() => globalThis.__BREAKOUT__.snapshot().audio.music.playing);
      const after = await page.evaluate(() => globalThis.__BREAKOUT__.snapshot());
      const probe = await page.evaluate(() => globalThis.__AUDIO_PROBE__);
      assert.deepEqual(after.audio.loadErrors, []);
      assert.deepEqual(after.audio.music.loadErrors, []);
      assert.ok(after.audio.played > before.audio.played);
      assert.ok(probe.starts > 0 && probe.running > 0, 'Web Audio did not start on a running context');
      await page.screenshot({ path: path.join(directory, `chapter-${chapter}.png`) });
      await page.keyboard.press('KeyP');
      await page.waitForFunction(() => {
        const state = globalThis.__BREAKOUT__.snapshot();
        return state.state === 'paused' && !state.audio.music.playing;
      });
      const paused = await page.evaluate(() => globalThis.__BREAKOUT__.snapshot().audio);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => {
        const state = globalThis.__BREAKOUT__.snapshot();
        return state.state === 'playing' && state.audio.music.playing;
      });
      report.chapters.push({ chapter, loaded: true, moved: true, fired: true, pauseResume: true,
        beforeX: before.player.x, afterX: after.player.x, audio: after.audio, pausedAudio: paused, webAudio: probe });
      console.log(`Chapter ${chapter}: movement/fire, audio load/play and pause/resume passed.`);
    } catch (error) {
      await page.screenshot({ path: path.join(directory, `chapter-${chapter}-failure.png`) }).catch(() => {});
      report.lastSnapshot = await page.evaluate(() => globalThis.__BREAKOUT__?.snapshot()).catch(() => null);
      throw error;
    } finally { await context.close(); }
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.failed, []);
  assert.equal(buildInputs().sha256, build.inputSHA256);
  report.passed = true;
} catch (error) { report.error = error.message; process.exitCode = 1; }
finally {
  await browser?.close();
  if (server.exitCode === null && server.signalCode === null) server.kill('SIGTERM');
  const timer = setTimeout(() => server.kill('SIGKILL'), 3000);
  await serverClosed; clearTimeout(timer);
  report.finishedAt = new Date().toISOString();
  writeJSON(path.join(directory, 'browser.json'), report);
  fs.writeFileSync(path.join(directory, 'preview.log'), serverOutput + serverError);
  if (report.passed) {
    const current = path.join(reportsRoot, 'current-smoke'); fs.mkdirSync(current, { recursive: true });
    writeJSON(path.join(current, 'result.json'), report);
    for (const chapter of [1, 2]) fs.copyFileSync(path.join(directory, `chapter-${chapter}.png`), path.join(current, `chapter-${chapter}.png`));
  }
  console.log(JSON.stringify({ passed: report.passed, error: report.error, chapters: report.chapters.length, evidence: directory }));
}
