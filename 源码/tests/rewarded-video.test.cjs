const { test } = require('node:test');
const assert = require('node:assert/strict');
const { RewardedVideoBridge, REVIVAL_AD_UNIT_ID, rewardedVideoSupported } = require('../.test-build/assets/scripts/platform/RewardedVideoBridge.js');
const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
function fixture(options = {}) {
  const entries = [], creates = [], results = [], timers = new Map(); let timerId = 0, opens = 0;
  const api = { getAppBaseInfo: () => ({ SDKVersion: options.version ?? '3.8.6' }), createRewardedVideoAd(config) {
    creates.push(config); if (options.createThrows) throw Error('create');
    const listeners = {}, old = {};
    const entry = { listeners, old, loads: 0, shows: 0, destroys: 0,
      emit: (event, result) => listeners[event]?.(result), late: (event, result) => old[event]?.(result) };
    entry.ad = {
      load() { entry.loads++; return options.load ? options.load(entry) : Promise.resolve(); },
      show() { entry.shows++; return options.show ? options.show(entry) : Promise.resolve(); },
      destroy() { entry.destroys++; if (options.destroyThrows) throw Error('destroy'); if (options.closeOnDestroy) entry.emit('close', { isEnded: true }); },
      onLoad: f => { listeners.load = old.load = f; }, offLoad: f => { assert.equal(f, old.load); delete listeners.load; },
      onError: f => { listeners.error = old.error = f; if (options.registrationError) f({ errCode: 1005 }); }, offError: f => { assert.equal(f, old.error); delete listeners.error; },
      onClose: f => { listeners.close = old.close = f; }, offClose: f => { assert.equal(f, old.close); delete listeners.close; },
    };
    entries.push(entry); return entry.ad;
  } };
  if (options.missing) delete api.createRewardedVideoAd;
  const bridge = new RewardedVideoBridge(() => !options.disabled, () => api,
    { set: fn => { timers.set(++timerId, fn); return timerId; }, clear: id => timers.delete(id) });
  bridge.onOpenRequest = () => opens++;
  return { bridge, entries, creates, results, timers, options, get current() { return entries.at(-1); }, get opens() { return opens; },
    request: () => bridge.request(r => results.push(r)), timeout: () => { for (const fn of [...timers.values()]) fn(); } };
}

test('preload creates the supplied isolated video unit once, with share fallback disabled, and never shows or rewards', async () => {
  const f = fixture(); f.bridge.preload(); f.bridge.preload(); await tick();
  assert.deepEqual(f.creates, [{ adUnitId: REVIVAL_AD_UNIT_ID, multiton: true, disableFallbackSharePage: true }]);
  assert.equal(REVIVAL_AD_UNIT_ID, 'adunit-d647515c81ac9f11');
  assert.equal(f.current.shows, 0); assert.equal(f.bridge.state, 'ready'); assert.equal(f.bridge.blocking, false);
  f.current.emit('close', { isEnded: true }); assert.equal(f.results.length, 0);
  f.request(); assert.equal(f.current.shows, 1); assert.equal(f.bridge.blocking, true);
  await tick(); assert.equal(f.bridge.state, 'visible'); assert.equal(f.results.length, 0);
});
test('show success, duplicate taps, onLoad and foreground transitions never grant or unlock input', async () => {
  const f = fixture(); f.request(); f.request(); await tick();
  f.current.emit('load'); f.bridge.setBackground(true); f.bridge.setBackground(false);
  assert.equal(f.opens, 1); assert.equal(f.current.shows, 1); assert.equal(f.results.length, 0); assert.equal(f.bridge.blocking, true);
  assert.equal(f.timers.size, 0); // No timeout may end an already visible video.
});
test('only strict native isEnded true grants once; duplicate and destroy-generated closures are ignored', async () => {
  const f = fixture({ closeOnDestroy: true }); f.request(); await tick(); const entry = f.current;
  entry.emit('close', { isEnded: true }); entry.late('close', { isEnded: true });
  assert.equal(f.results.length, 1); assert.equal(f.results[0].completed, true);
  assert.equal(f.bridge.blocking, false); assert.equal(f.bridge.snapshot().completions, 1);
  assert.deepEqual(Object.keys(entry.listeners), []); assert.equal(entry.destroys, 1);
});
test('incomplete and malformed closes never grant, and another explicit attempt can succeed', async () => {
  for (const value of [false, undefined, null, 'true', 1]) {
    const f = fixture(); f.request(); await tick(); const old = f.current;
    old.emit('close', value === undefined ? undefined : { isEnded: value });
    assert.equal(f.results.length, 1); assert.equal(f.results[0].completed, false); assert.equal(f.bridge.blocking, false);
    f.request(); await tick(); old.late('close', { isEnded: true }); assert.equal(f.results.length, 1);
    f.current.emit('close', { isEnded: true }); assert.equal(f.results.length, 2); assert.equal(f.results[1].completed, true);
  }
});
test('first show failure retries load then show exactly once, including onError-before-rejection ordering', async () => {
  const f = fixture({ show(entry) {
    if (entry.shows === 1) { entry.emit('error', { errCode: 1004 }); return Promise.reject({ errCode: 1004 }); }
    return Promise.resolve();
  } });
  f.request(); await tick(); assert.equal(f.current.loads, 1); assert.equal(f.current.shows, 2);
  assert.equal(f.bridge.state, 'visible'); assert.equal(f.results.length, 0);
  f.current.emit('close', { isEnded: true }); assert.equal(f.results[0].completed, true);
});
test('failed retry/load and synchronous host exceptions stop without free rewards and retain useful errors', async () => {
  for (const mode of ['show', 'load', 'throw-show', 'throw-load']) {
    const f = fixture({ show() { if (mode === 'throw-show') throw { errCode: 1004 }; return Promise.reject({ errCode: 1004 }); },
      load() { if (mode === 'throw-load') throw { errCode: 1005 }; return mode === 'load' ? Promise.reject({ errCode: 1005 }) : Promise.resolve(); } });
    f.request(); await tick(); assert.equal(f.results.length, 1, mode); assert.equal(f.results[0].completed, false);
    assert.equal(f.bridge.blocking, false); assert.ok(f.current.shows <= 2); assert.equal(f.current.loads, 1);
    assert.match(f.results[0].message, mode.includes('load') ? /审核/ : /没有可播放/);
  }
});
test('unsupported versions, absent APIs and creation failures never reward or fall back to another action', () => {
  for (const options of [{ version: '3.7.0' }, { version: '' }, { missing: true }, { disabled: true }, { createThrows: true }]) {
    const f = fixture(options); f.request(); assert.equal(f.results.length, 1); assert.equal(f.results[0].completed, false);
    assert.equal(f.bridge.blocking, false); assert.equal(f.bridge.snapshot().completions, 0);
  }
  assert.equal(rewardedVideoSupported('3.7.1'), true); assert.equal(rewardedVideoSupported('4.0.0'), true);
  assert.equal(rewardedVideoSupported('3.7.1garbage'), false);
});
test('an immediate native error while listeners are registering cannot leave a stuck wait or stale listeners', () => {
  const f = fixture({ registrationError: true });
  f.bridge.preload(); assert.equal(f.bridge.blocking, false); assert.deepEqual(Object.keys(f.current.listeners), []);
  f.request(); assert.equal(f.bridge.blocking, false); assert.equal(f.results.length, 1);
  assert.equal(f.results[0].completed, false); assert.deepEqual(Object.keys(f.current.listeners), []);
});
test('cancel/timeout during pending load/show ignores all late completions and clears modal ownership', async () => {
  for (const mode of ['cancel', 'timeout']) {
    const pending = deferred(), f = fixture({ show: () => pending.promise, closeOnDestroy: true });
    f.request(); const entry = f.current; if (mode === 'cancel') f.bridge.cancel(); else f.timeout();
    pending.resolve(); await tick(); entry.late('close', { isEnded: true });
    assert.equal(f.results.length, 1); assert.equal(f.results[0].completed, false); assert.equal(f.bridge.blocking, false);
    assert.equal(f.timers.size, 0);
  }
});
test('pending preload cannot supersede a clicked video or a cancelled wait', async () => {
  const pending = deferred(), f = fixture({ load: () => pending.promise });
  f.bridge.preload(); f.request(); await tick(); assert.equal(f.bridge.state, 'visible');
  pending.resolve(); await tick(); assert.equal(f.bridge.state, 'visible'); assert.equal(f.results.length, 0);
  f.current.emit('close', { isEnded: false }); assert.equal(f.bridge.blocking, false);
});
test('backgrounding during retry never auto-opens an ad on return and does not award', async () => {
  const loading = deferred(), f = fixture({ show: () => Promise.reject({ errCode: 1004 }), load: () => loading.promise });
  f.request(); await tick(); f.bridge.setBackground(true); loading.resolve(); await tick(); f.bridge.setBackground(false);
  assert.equal(f.current.shows, 1); assert.equal(f.results[0].completed, false); assert.equal(f.bridge.blocking, false);
});
test('playback error cannot be converted to a completed reward by a following native close', async () => {
  const f = fixture({ closeOnDestroy: true }); f.request(); await tick(); const entry = f.current;
  entry.emit('error', { errCode: 1000 }); entry.late('close', { isEnded: true });
  assert.equal(f.results.length, 1); assert.equal(f.results[0].completed, false); assert.equal(f.bridge.blocking, false);
});
test('failed cancellation keeps input blocked until cleanup succeeds; native close during recovery is never rewarded', async () => {
  const pending = deferred(), f = fixture({ destroyThrows: true, show: () => pending.promise });
  f.request(); const entry = f.current; f.bridge.cancel(); assert.equal(f.bridge.state, 'recovery'); assert.equal(f.bridge.blocking, true);
  pending.resolve(); await tick(); entry.emit('close', { isEnded: true });
  assert.equal(f.results.length, 1); assert.equal(f.results[0].completed, false); assert.equal(f.bridge.blocking, false);
});
test('destroy invalidates pending requests and all listeners without awarding, including later promise rejection', async () => {
  const pending = deferred(), f = fixture({ show: () => pending.promise, closeOnDestroy: true });
  f.request(); const entry = f.current; f.bridge.destroy(); pending.reject({ errCode: 1000 }); await tick();
  entry.late('close', { isEnded: true }); entry.late('error', { errCode: 1000 });
  assert.equal(f.results.length, 0); assert.equal(f.bridge.blocking, false); assert.equal(f.timers.size, 0);
  assert.deepEqual(Object.keys(entry.listeners), []);
});
