const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { GameSession } = require('../.test-build/assets/scripts/core/GameSession.js');
const { OceanSession } = require('../.test-build/assets/scripts/ocean/OceanSession.js');
const { selectMusicCue } = require('../.test-build/assets/scripts/platform/MusicCue.js');
const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function load(name, cc, overrides = {}) {
  const absolute = path.resolve('.test-build/assets/scripts/' + name + '.js');
  const module = { exports: {} }, native = createRequire(absolute);
  vm.runInNewContext(fs.readFileSync(absolute, 'utf8'), { module, exports: module.exports,
    console: { warn() {} }, require: key => key === 'cc' ? cc : overrides[key] ?? native(key) });
  return module.exports;
}
function fixture() {
  const sources = [], requested = [], pending = new Map(), effects = [], releases = [];
  class Source {
    volume = 1; currentTime = 0; clip = null; playing = false; isValid = true; plays = 0; pauses = 0; stops = 0;
    play() { if (this.fail) throw new Error('device unavailable'); this.plays++; this.playing = true; }
    pause() { this.pauses++; this.playing = false; }
    stop() { this.stops++; this.playing = false; this.currentTime = 0; }
    destroy() { this.isValid = false; }
    playOneShot(clip) { effects.push(clip.name); }
  }
  const makeClip = name => ({ name, refs: 0, addRef() { this.refs++; return this; }, decRef() { this.refs--; releases.push(name); } });
  const cc = { AudioSource: Source, AudioClip: class {},
    resources: { load(name, type, callback) { requested.push(name); callback(null, makeClip(name)); } },
    assetManager: { getBundle: () => ({ load(key, type, callback) { requested.push(key); pending.set(key, callback); } }), releaseAsset() {} } };
  const parent = { addComponent() { const source = new Source(); sources.push(source); return source; } };
  const { MusicBridge } = load('platform/MusicBridge', cc);
  const music = new MusicBridge(parent);
  const cue = (tempo = 80, mode = 'playing', theme = 'turkish-march') => ({ theme, tempo, mode });
  const resolve = key => { const clip = makeClip(key); pending.get(key)(null, clip); pending.delete(key); return clip; };
  const fade = (c = cue()) => { for (let i = 0; i < 4; i++) music.update(c, false, .1); };
  return { music, sources, requested, pending, effects, cc, parent, MusicBridge, cue, resolve, fade, releases };
}

test('land and ocean use distinct themes; only live, activated mini/final bosses request 120 BPM', () => {
  const land = new GameSession();
  assert.equal(selectMusicCue(land).mode, 'stopped'); land.reset();
  assert.equal(selectMusicCue(land).theme, 'turkish-march'); assert.equal(selectMusicCue(land).tempo, 80);
  land.spawner.miniBoss.active = true; assert.equal(selectMusicCue(land).tempo, 120);
  land.spawner.miniBoss.health = 0; assert.equal(selectMusicCue(land).tempo, 80);
  land.spawner.guard.active = true; assert.equal(selectMusicCue(land).tempo, 120);
  land.pause(); assert.equal(selectMusicCue(land).mode, 'paused'); land.resume();
  land.victory.start(); assert.equal(selectMusicCue(land).mode, 'stopped');
  const ocean = new OceanSession();
  assert.equal(selectMusicCue(land, ocean).theme, 'canon'); assert.equal(selectMusicCue(land, ocean).tempo, 80);
  ocean.mini.active = true; assert.equal(selectMusicCue(land, ocean).tempo, 120);
  ocean.mini.hp = 0; assert.equal(selectMusicCue(land, ocean).tempo, 80);
  ocean.boss.active = true; assert.equal(selectMusicCue(land, ocean).tempo, 120);
  ocean.state = 'gameover'; assert.equal(selectMusicCue(land, ocean).mode, 'stopped');
});
test('preload remains silent; repeated frames do not restart the selected loop', async () => {
  const f = fixture(); f.music.prepare('turkish-march'); await tick();
  f.resolve('turkish-march-80bpm'); f.resolve('turkish-march-120bpm'); await tick();
  assert.equal(f.sources.reduce((s, v) => s + v.plays, 0), 0);
  f.fade(); for (let i = 0; i < 200; i++) f.music.update(f.cue(), false, 1 / 60);
  const source = f.sources.find(s => s.playing);
  assert.equal(source.plays, 1); assert.equal(source.volume, .27); assert.equal(source.loop, true);
});
test('80 to 120 and back keeps beat position, crossfades, and retires the previous source', async () => {
  const f = fixture(); f.music.update(f.cue(), false); await tick();
  f.resolve('turkish-march-80bpm'); f.resolve('turkish-march-120bpm'); await tick(); f.fade();
  const slow = f.sources.find(s => s.playing); slow.currentTime = 12;
  f.music.update(f.cue(120), false, .1);
  const fast = f.sources.find(s => s !== slow);
  assert.equal(fast.currentTime, 8); assert.equal(fast.playing, true); assert.ok(slow.volume > 0 && slow.volume < .27);
  f.fade(f.cue(120)); assert.equal(slow.playing, false); assert.equal(slow.clip, null);
  fast.currentTime = 10; f.fade();
  assert.equal(slow.currentTime, 15); assert.equal(fast.playing, false); assert.equal(f.music.status().track, 'turkish-march-80bpm');
});
test('pause and background/ad blocking preserve position and do not automatically unpause gameplay', async () => {
  const f = fixture(); f.music.update(f.cue(), false); await tick(); f.resolve('turkish-march-80bpm'); f.fade();
  const source = f.sources.find(s => s.playing); source.currentTime = 7;
  f.music.update(f.cue(), true, .1); assert.equal(source.playing, false); assert.equal(source.currentTime, 7);
  f.music.update(f.cue(80, 'paused'), false, .1); assert.equal(source.playing, false);
  // Model a host that resumes its audio when the app returns. Player pause still wins.
  source.playing = true; f.music.update(f.cue(80, 'paused'), false, .1); assert.equal(source.playing, false);
  f.fade(); assert.equal(source.currentTime, 7); assert.equal(source.plays, 2);
});
test('mute is immediate and late loads cannot start audio while muted, blocked, or on the title', async () => {
  for (const reason of ['mute', 'blocked', 'title']) {
    const f = fixture(); f.music.update(f.cue(), false); await tick();
    if (reason === 'mute') f.music.muted = true;
    if (reason === 'blocked') f.music.update(f.cue(), true);
    if (reason === 'title') f.music.update(f.cue(80, 'stopped'), false);
    f.resolve('turkish-march-80bpm'); await tick();
    assert.equal(f.sources.some(s => s.playing), false, reason);
  }
});
test('late previous-chapter loads release their references and never replace Canon', async () => {
  const f = fixture(); f.music.update(f.cue(), false); await tick();
  f.music.update(f.cue(80, 'playing', 'canon'), false); await tick();
  const old = f.resolve('turkish-march-80bpm'); assert.equal(old.refs, 0);
  const canon = f.resolve('canon-80bpm'); f.resolve('canon-120bpm'); await tick();
  f.fade(f.cue(80, 'playing', 'canon'));
  assert.equal(canon.refs, 1); assert.equal(f.music.status().track, 'canon-80bpm'); assert.equal(f.music.status().loaded, 2);
  f.music.update(f.cue(), false); assert.equal(canon.refs, 0); assert.equal(f.sources.some(s => s.playing), false);
});
test('failed music download does not retry each frame; a new attempt allows recovery', async () => {
  const f = fixture(); f.music.update(f.cue(), false); await tick();
  f.pending.get('turkish-march-80bpm')(new Error('offline')); await tick();
  const count = f.requested.length;
  for (let i = 0; i < 100; i++) f.music.update(f.cue(), false, .02);
  await tick(); assert.equal(f.requested.length, count);
  f.music.reset(); f.music.update(f.cue(), false); await tick();
  assert.equal(f.requested.filter(k => k === 'turkish-march-80bpm').length, 2);
  f.resolve('turkish-march-80bpm'); f.fade(); assert.equal(f.music.status().track, 'turkish-march-80bpm');
});
test('a synchronous playback error leaves gameplay running and does not produce a retry loop', async () => {
  const f = fixture(); f.sources.forEach(s => s.fail = true); f.music.update(f.cue(), false); await tick();
  assert.doesNotThrow(() => f.resolve('turkish-march-80bpm')); await tick();
  for (let i = 0; i < 100; i++) assert.doesNotThrow(() => f.music.update(f.cue(), false, .02));
  assert.equal(f.music.loadErrors.length, 1); assert.equal(f.sources.some(s => s.playing), false);
});
test('reset stops the old song; destroy releases loaded and late clips without resurrection', async () => {
  const f = fixture(); f.music.update(f.cue(), false); await tick();
  const loaded = f.resolve('turkish-march-80bpm'); f.fade(); f.music.reset();
  assert.equal(f.sources.some(s => s.playing), false);
  f.music.destroy(); const late = f.resolve('turkish-march-120bpm'); await tick();
  assert.equal(loaded.refs, 0); assert.equal(late.refs, 0); assert.equal(f.sources.every(s => !s.isValid), true);
});
test('walking is silent while shots and other combat effects still use their own source', async () => {
  const f = fixture();
  const { AudioBridge } = load('platform/AudioBridge', f.cc, { './MusicBridge': { MusicBridge: f.MusicBridge } });
  const audio = new AudioBridge(f.parent); await audio.load();
  assert.equal(f.requested.includes('audio/step'), false);
  const s = new GameSession(); s.reset(); s.player.grounded = true; s.player.vx = 180;
  for (let i = 0; i < 600; i++) { s.time = i / 60; audio.update(s); }
  assert.equal(f.effects.length, 0);
  s.weapon.shots++; s.weapon.lastShot = 'rifle'; audio.update(s);
  assert.deepEqual(f.effects, ['audio/rifle']); audio.muted = true; s.weapon.shots++; audio.update(s);
  assert.equal(f.effects.length, 1);
});
test('GameManager forwards chapter, overlay, portrait and background state to music', () => {
  const absolute = path.resolve('.test-build/assets/scripts/GameManager.js'), module = { exports: {} }, calls = [];
  vm.runInNewContext(fs.readFileSync(absolute, 'utf8'), { module, exports: module.exports, console,
    require: key => key === 'cc' ? { Component: class {}, _decorator: { ccclass: () => target => target } }
      : key.endsWith('/MusicCue') ? { selectMusicCue } : {} });
  const manager = Object.create(module.exports.GameManager.prototype);
  manager.session = new GameSession(); manager.session.reset();
  manager.audio = { music: { update: (...args) => calls.push(args) } };
  manager.platform = { adapter: { recommendation: { blocking: false }, rewardedVideo: { blocking: false } } };
  manager.recordsPanel = { visible: false }; manager.chapterSelect = { visible: false };
  manager.portrait = manager.loadingChapter = false;
  manager.syncMusic(.1); assert.equal(calls.at(-1)[1], false);
  for (const field of ['portrait', 'loadingChapter']) {
    manager[field] = true; manager.syncMusic(.1); assert.equal(calls.at(-1)[1], true); manager[field] = false;
  }
  manager.platform.adapter.rewardedVideo.blocking = true; manager.syncMusic(.1); assert.equal(calls.at(-1)[1], true);
  manager.platform.adapter.rewardedVideo.blocking = false;
  manager.session.pause(); manager.syncMusic(.1); assert.equal(calls.at(-1)[0].mode, 'paused');
  manager.session.resume(); manager.syncMusic(.1); assert.equal(calls.at(-1)[0].mode, 'playing');
  manager.ocean = new OceanSession(); manager.ocean.mini.active = true; manager.syncMusic(.1);
  assert.equal(calls.at(-1)[0].theme, 'canon'); assert.equal(calls.at(-1)[0].tempo, 120);
});
