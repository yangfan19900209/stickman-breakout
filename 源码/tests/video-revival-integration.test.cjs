const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { GameSession } = require('../.test-build/assets/scripts/core/GameSession.js');
const { RewardedVideoBridge } = require('../.test-build/assets/scripts/platform/RewardedVideoBridge.js');
const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
// Use real controller methods, stubbing only Cocos rendering dependencies; no device claim.
function controller(file, name) {
  const absolute = path.resolve('.test-build/assets/scripts/' + file + '.js');
  const nativeRequire = createRequire(absolute), module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(absolute, 'utf8'), { module, exports: module.exports, console,
    require: key => key === 'cc' ? { Component: class {}, _decorator: { ccclass: () => target => target } }
      : /core\/(GameConfig|ReleaseConfig)$/.test(key) ? nativeRequire(key) : {} });
  return Object.create(module.exports[name].prototype);
}
function fixture() {
  let close, shares = 0, assisted = 0, clears = 0;
  const video = new RewardedVideoBridge(() => true, () => ({ getAppBaseInfo: () => ({ SDKVersion: '3.8.6' }),
    createRewardedVideoAd: () => ({ load: () => Promise.resolve(), show: () => Promise.resolve(), destroy() {},
      onLoad() {}, onError() {}, onClose(fn) { close = fn; }, offLoad() {}, offError() {}, offClose() {} }) }),
    { set() { return 1; }, clear() {} });
  const manager = controller('GameManager', 'GameManager');
  manager.session = new GameSession(); manager.session.reset(); manager.session.player.health = 0;
  for (let i = 0; i < 240 && manager.session.state !== 'gameover'; i++) manager.session.update(1 / 120, { axis: 0, jump: false, shoot: false });
  manager.platform = { adapter: { rewardedVideo: video, recommendation: { blocking: false },
    status: () => ({ mode: 'wechat-mini-game' }), gameClub: { hide() {} }, share: { request() { shares++; return true; } } } };
  manager.recordsPanel = manager.chapterSelect = { visible: false };
  manager.adapter = { clear() { clears++; } };
  manager.personal = { active() {}, markRevived() { assisted++; } };
  manager.playerPose = manager.cameraPose = { capture() {} };
  return { manager, video, close: value => close(value), get shares() { return shares; }, get assisted() { return assisted; }, get clears() { return clears; } };
}
test('actual revive action opens one video, grants one opportunity on completion, and waits for a separate resume tap', async () => {
  const f = fixture(); f.manager.revive(); f.manager.revive(); await tick();
  assert.equal(f.video.snapshot().requests, 1); assert.equal(f.manager.session.revival.remaining, 0);
  f.close({ isEnded: true }); assert.equal(f.manager.session.revival.remaining, 1); assert.equal(f.manager.session.state, 'gameover');
  assert.equal(f.assisted, 0); f.manager.revive(); assert.equal(f.manager.session.state, 'reviving');
  assert.equal(f.manager.session.revival.remaining, 0); assert.equal(f.assisted, 1); assert.ok(f.clears > 0);
});
test('cancelled video leaves the same death retryable and shows an explanation without consuming allowance', async () => {
  const f = fixture(); f.manager.revive(); await tick(); f.close({ isEnded: false });
  assert.equal(f.manager.session.revival.videos, 0); assert.equal(f.manager.session.revival.used, 0);
  assert.match(f.manager.session.revival.error, /完整看完/); assert.equal(f.manager.session.state, 'gameover');
  f.manager.revive(); await tick(); f.close({ isEnded: true }); assert.equal(f.manager.session.revival.remaining, 1);
});
test('a completed old video cannot grant into a restarted or replaced chapter, even if it has already died again', async () => {
  for (const replace of [false, true]) {
    const f = fixture(); f.manager.revive(); await tick();
    if (replace) f.manager.session = new GameSession();
    f.manager.session.reset(); f.manager.session.state = 'gameover'; f.manager.session.player.health = 0;
    f.close({ isEnded: true }); assert.equal(f.manager.session.revival.remaining, 0); assert.equal(f.manager.session.revival.videos, 0);
  }
});
test('ordinary sharing no longer grants a revival and cannot open while a video owns the screen', async () => {
  const f = fixture(); f.manager.shareGame(); assert.equal(f.shares, 1); assert.equal(f.manager.session.revival.remaining, 0);
  f.manager.revive(); await tick(); f.manager.shareGame(); assert.equal(f.shares, 1);
});
test('exhausting ten earned videos cannot request an eleventh; the main action becomes restart', () => {
  const f = fixture(); let restarts = 0; f.manager.startRun = () => restarts++;
  for (let i = 0; i < 10; i++) { assert.ok(f.manager.session.revival.rewardVideo()(true)); f.manager.session.revival.begin(); }
  f.manager.revive(); assert.equal(f.video.snapshot().requests, 0); assert.equal(restarts, 1);
});
test('the real HUD reflects video allowance, earned credit, exhaustion and a browser without ads', () => {
  const hud = controller('ui/HUDController', 'HUDController'), session = new GameSession();
  const button = { string: '' }; hud.reviveButton = { getComponentInChildren: () => button };
  hud.reviveNote = { string: '' }; hud.reviveCountdown = { string: '' }; hud.titlePoster = { setUnlocked() {} };
  hud.updateRevival(session, true); assert.match(button.string, /看视频/); assert.match(hud.reviveNote.string, /0\/10/);
  session.revival.rewardVideo()(true); hud.updateRevival(session, true); assert.match(button.string, /满血继续/);
  assert.doesNotMatch(button.string + hud.reviveNote.string, /免费|分享|推荐/);
  session.revival.begin();
  for (let i = 1; i < 10; i++) { session.revival.rewardVideo()(true); session.revival.begin(); }
  hud.updateRevival(session, true); assert.match(button.string, /重新开始/); assert.match(hud.reviveNote.string, /10 次.*用完/);
  session.reset(); hud.updateRevival(session, false); assert.match(button.string, /重新开始/); assert.equal(hud.reviveAvailable, false);
});
