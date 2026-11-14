const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SocialBridge } = require('../.test-build/assets/scripts/platform/SocialBridge.js');

function fixture(initialScope) {
  let scope = initialScope, foreground;
  const messages = [], calls = [];
  const api = {
    getOpenDataContext: () => ({ canvas: {}, postMessage: m => messages.push(m) }),
    getPrivacySetting: o => o.success({ needAuthorization: false }),
    requirePrivacyAuthorize: o => o.success({}),
    getSetting: o => o.success({ authSetting: scope === undefined ? {} : { 'scope.WxFriendInteraction': scope } }),
    authorize: o => { calls.push('authorize'); scope = true; o.success({}); },
    openSetting: o => { calls.push('settings'); scope = true; o.success({ authSetting: { 'scope.WxFriendInteraction': true } }); },
    onShow: f => { foreground = f; },
    offShow() {},
  };
  const bridge = new SocialBridge(() => true, () => true, () => api);
  bridge.install();
  return { api, bridge, calls, messages, scope: v => { scope = v; }, foreground: () => foreground({}) };
}

test('scope/API failures are not reported as user denial and never offer a missing settings switch', () => {
  const f = fixture();
  f.api.authorize = o => o.fail({ errMsg: 'authorize:fail invalid scope' });
  f.bridge.show('progress'); f.bridge.authorize();
  assert.equal(f.bridge.state, 'error');
  assert.equal(f.bridge.canOpenSettings, false);
  assert.doesNotMatch(f.bridge.message, /你暂未允许|你拒绝|前往微信设置/);
  assert.equal(f.bridge.snapshot().lastFailure.stage, 'authorize');
  assert.match(f.bridge.snapshot().lastFailure.message, /invalid scope/);
});

test('a confirmed denial opens native settings synchronously in the original tap', () => {
  const f = fixture(false);
  f.bridge.show('progress'); f.bridge.authorize();
  assert.equal(f.bridge.canOpenSettings, true);
  f.api.getPrivacySetting = () => { f.calls.push('async privacy read'); };
  f.bridge.authorize(true);
  assert.equal(f.calls[0], 'settings');
});

test('settings without the friend scope offers retry instead of an endless settings loop', () => {
  const f = fixture(false);
  f.bridge.show('progress');
  f.api.openSetting = o => { f.calls.push('settings'); f.scope(undefined); o.success({ authSetting: {} }); };
  f.bridge.authorize(true);
  assert.equal(f.bridge.state, 'error');
  assert.equal(f.bridge.canOpenSettings, false);
  assert.match(f.bridge.message, /开关/);
  f.bridge.authorize();
  assert.deepEqual(f.calls, ['settings', 'authorize']);
  assert.equal(f.bridge.state, 'ready');
});

test('an already authorized friend board loads on selection without a second authorization tap', () => {
  const f = fixture(true);
  f.bridge.show('level2');
  assert.equal(f.bridge.state, 'ready');
  assert.equal(f.calls.length, 0);
  assert.ok(f.messages.some(m => m.action === 'show' && m.board === 'level2'));
});

test('settings foreground events cannot reset a successful authorization to an idle page', () => {
  const f = fixture(false);
  f.bridge.show('level1');
  f.api.openSetting = o => {
    f.scope(true); f.foreground();
    o.success({ authSetting: { 'scope.WxFriendInteraction': true } });
    f.foreground();
  };
  f.bridge.authorize(true);
  assert.equal(f.bridge.state, 'ready');
  assert.equal(f.bridge.snapshot().allowed, true);
});

test('scope revoked while away hides friend data and offers settings only for explicit false', () => {
  const f = fixture(true);
  f.bridge.show('progress'); f.messages.length = 0;
  f.scope(false); f.foreground();
  assert.equal(f.bridge.state, 'denied');
  assert.equal(f.bridge.canOpenSettings, true);
  assert.equal(f.bridge.snapshot().allowed, false);
  assert.ok(f.messages.some(m => m.action === 'hide'));
  assert.ok(!f.messages.some(m => m.action === 'show'));
});

test('privacy declaration failures are not rewritten as the player refusing privacy', () => {
  const f = fixture();
  f.api.getPrivacySetting = o => o.success({ needAuthorization: true });
  f.api.requirePrivacyAuthorize = o => o.fail({ errno: 112, errMsg: 'privacy permission is not declared' });
  f.bridge.show('progress'); f.bridge.authorize();
  assert.equal(f.bridge.state, 'error');
  assert.equal(f.bridge.snapshot().lastFailure.kind, 'configuration');
  assert.doesNotMatch(f.bridge.message, /你暂未同意/);
  assert.equal(f.calls.length, 0);
});

test('an asynchronous authorization exception exits checking and can be retried', () => {
  const f = fixture(); let privacy;
  f.bridge.show('progress');
  f.api.getPrivacySetting = o => { privacy = o; };
  f.api.authorize = () => { throw new Error('authorize:fail network unavailable'); };
  f.bridge.authorize();
  assert.doesNotThrow(() => privacy.success({ needAuthorization: false }));
  assert.equal(f.bridge.state, 'error');
  assert.equal(f.bridge.canOpenSettings, false);
});

test('late settings results after closing never show the board or submit records', () => {
  const f = fixture(false); let settings;
  f.bridge.show('progress');
  f.api.openSetting = o => { settings = o; };
  f.bridge.authorize(true); f.bridge.hide(); f.messages.length = 0;
  f.scope(true); settings.success({ authSetting: { 'scope.WxFriendInteraction': true } });
  assert.equal(f.messages.length, 0);
});

test('a failed authorization only offers settings after a fresh, explicit false scope result', () => {
  const f = fixture();
  f.api.authorize = o => { f.scope(false); o.fail({ errMsg: 'authorize:fail auth deny' }); };
  f.bridge.show('progress'); f.bridge.authorize();
  assert.equal(f.bridge.state, 'denied');
  assert.equal(f.bridge.canOpenSettings, true);
});

test('native privacy confirmation finishes before friend authorization; custom privacy is never registered', () => {
  const f = fixture(); let pending, custom = 0, privacy = true;
  f.api.onNeedPrivacyAuthorization = () => { custom++; };
  f.api.getPrivacySetting = o => o.success({ needAuthorization: privacy });
  f.api.requirePrivacyAuthorize = o => { pending = o; f.calls.push('native privacy'); };
  f.bridge.show('progress'); assert.equal(f.calls.length, 0);
  f.bridge.authorize(); f.foreground();
  assert.equal(custom, 0); assert.equal(f.bridge.state, 'checking');
  assert.deepEqual(f.calls, ['native privacy']);
  privacy = false; pending.success({});
  assert.deepEqual(f.calls, ['native privacy', 'authorize']);
  assert.equal(f.bridge.state, 'ready');
});

test('closing while the native privacy dialog is open ignores late consent without friend access', () => {
  const f = fixture(); let pending;
  f.api.getPrivacySetting = o => o.success({ needAuthorization: true });
  f.api.requirePrivacyAuthorize = o => { pending = o; };
  f.bridge.show('progress'); f.bridge.authorize(); f.bridge.hide();
  f.messages.length = 0; pending.success({});
  assert.deepEqual(f.calls, []); assert.deepEqual(f.messages, []);
});

test('no privacy prompt needed does not prove declaration: authorize errno 112 stays visible without granting data access', () => {
  const f = fixture();
  f.api.authorize = o => o.fail({ errno: 112, errMsg: 'authorize:fail api scope is not declared in the privacy agreement' });
  f.bridge.show('progress'); f.bridge.authorize();
  assert.equal(f.bridge.state, 'error'); assert.equal(f.bridge.canOpenSettings, false);
  assert.match(f.bridge.message, /隐私声明未完成/);
  assert.match(f.bridge.diagnosticText, /A1114-3.*authorize.*112/);
  assert.match(f.bridge.diagnosticText, /api scope is not declared/);
  assert.ok(!f.messages.some(m => m.action === 'records' || m.action === 'show'));
});

test('platform restriction is distinct from missing declaration and retains its stage and numeric code', () => {
  const f = fixture();
  f.api.getPrivacySetting = o => o.fail({ errno: '1026', errMsg: 'getPrivacySetting:fail privacy API banned' });
  f.bridge.show('progress');
  assert.match(f.bridge.message, /已限制.*隐私接口/);
  assert.doesNotMatch(f.bridge.message, /稍后重试|服务暂未就绪|未完成/);
  assert.match(f.bridge.diagnosticText, /getPrivacySetting.*1026/);
  assert.equal(f.calls.length, 0);
  assert.equal(f.bridge.snapshot().lastFailure.errno, 1026);
});

test('actual device errno 1026 asking to announce privacy usage is a declaration issue, not a generic restriction', () => {
  const f = fixture();
  const errMsg = 'authorize:fail please go to mp to announce your privacy usage';
  f.api.authorize = o => o.fail({ errno: 1026, errMsg });
  f.bridge.show('progress'); f.bridge.authorize();
  assert.match(f.bridge.message, /隐私声明未完成/);
  assert.doesNotMatch(f.bridge.message, /已限制|后台通知/);
  assert.match(f.bridge.diagnosticText, /authorize.*1026/);
  assert.ok(f.bridge.diagnosticText.includes(errMsg));
  assert.equal(f.bridge.canOpenSettings, false);
  assert.ok(!f.messages.some(m => m.action === 'records' || m.action === 'show'));
});

test('diagnostic only retains bounded platform failure fields and disappears after a successful retry', () => {
  const f = fixture();
  f.api.authorize = o => o.fail({ errCode: 112, errMsg: 'authorize:fail not declared\n' + 'x'.repeat(250), data: { openid: 'private-friend-id' } });
  f.bridge.show('progress'); f.bridge.authorize();
  assert.match(f.bridge.diagnosticText, /112/);
  assert.equal(f.bridge.snapshot().lastFailure.message.length, 180);
  assert.doesNotMatch(f.bridge.diagnosticText, /private-friend-id/);
  assert.doesNotMatch(f.bridge.snapshot().lastFailure.message, /\n/);
  f.api.authorize = o => { f.scope(true); o.success({}); };
  f.bridge.authorize();
  assert.equal(f.bridge.state, 'ready'); assert.equal(f.bridge.diagnosticText, '');
});
