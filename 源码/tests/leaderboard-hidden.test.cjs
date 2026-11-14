const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { PersonalRecords } = require('../.test-build/assets/scripts/social/PersonalRecords.js');

test('hidden leaderboard never accesses friends, while release saves, cold/warm invites and sharing still work', () => {
  const key = 'breakout.records.r1.release';
  const data = new Map([[key, JSON.stringify({ v: 1, rule: 'r1', reached: 1, cleared: 1,
    times: { 1: { ms: 1200, run: 'existing', at: 10 } } })]]);
  const friendCalls = [], invitations = [], shares = [];
  let foreground, now = 0, removed;
  const wx = {
    getSystemInfoSync: () => ({ platform: 'ios' }),
    getPerformance: () => ({ now: () => now * 1000 }),
    getStorageSync: k => data.get(k),
    setStorageSync: (k, value) => data.set(k, value),
    getLaunchOptionsSync: () => ({ query: { from: 'invite', sv: '1' } }),
    onShow: fn => { foreground = fn; },
    offShow: fn => { removed = fn; },
    shareAppMessage: card => shares.push(card),
    getOpenDataContext: () => { friendCalls.push('context'); return { canvas: {}, postMessage: m => friendCalls.push(m) }; },
  };
  for (const api of ['getPrivacySetting', 'getSetting', 'authorize', 'openSetting', 'requirePrivacyAuthorize']) {
    wx[api] = () => friendCalls.push(api);
  }
  const file = path.resolve('.test-build/assets/scripts/platform/PlatformAdapter.js');
  const nativeRequire = createRequire(file), module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), { module, exports: module.exports, wx,
    require: name => name === 'cc' ? { sys: { platform: 'wechat', Platform: { WECHAT_GAME: 'wechat' } }, view: {} }
      : name === 'cc/env' ? { DEBUG: false } : nativeRequire(name) });
  const adapter = new module.exports.PlatformAdapter();
  // The CommonJS bridge normally resolves the global host in its own realm.
  const previousWx = globalThis.wx;
  globalThis.wx = wx;
  try {
    adapter.social.onInvite = invite => invitations.push(invite);
    adapter.social.install();
    assert.equal(invitations[0].kind, 'invite');
    foreground({ query: { from: 'challenge', sv: '1', rule: 'r1', level: '2', targetMs: '1500' } });
    foreground({ query: { from: 'challenge', sv: '1', rule: 'r1', level: '2', targetMs: '1500' } });
    assert.equal(invitations.length, 2);
    assert.equal(invitations[1].targetMs, 1500);

    const records = new PersonalRecords(adapter.recordStore(), () => adapter.monotonicNow());
    assert.equal(records.records.times[1].ms, 1200);
    records.changed = () => adapter.social.updateRecords(records.records);
    records.begin(1, true); records.active(true); now = 800; records.win();
    assert.equal(JSON.parse(data.get(key)).times[1].ms, 800);
    assert.ok(!data.has('breakout.records.r1.local'));

    adapter.social.show('progress'); adapter.social.authorize(); adapter.social.authorize(true);
    adapter.social.select('level1'); adapter.social.retry(); adapter.social.page(1); adapter.social.hide();
    assert.equal(adapter.social.context(), undefined);
    assert.equal(adapter.social.snapshot().visible, false);
    assert.equal(adapter.social.snapshot().leaderboardEnabled, false);
    assert.equal(adapter.social.snapshot().uploadEnabled, false);
    assert.deepEqual(friendCalls, []);

    adapter.share.configure('cover.jpg'); adapter.share.prepare(1, 800); adapter.share.request();
    assert.equal(shares.length, 1);
    assert.match(shares[0].query, /from=challenge/);
    adapter.social.destroy();
    assert.equal(removed, foreground);
    assert.deepEqual(friendCalls, []);
  } finally {
    if (previousWx === undefined) delete globalThis.wx; else globalThis.wx = previousWx;
  }
});
