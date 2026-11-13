/* Friend identities and cloud data must never be posted to the main domain. */
const R = require('./records.js');
const { createStore } = require('./store.js');
const canvas = wx.getSharedCanvas();
canvas.width = 960; canvas.height = 340;
const ctx = canvas.getContext('2d');
let visible = false, board = 'progress', page = 0, generation = 0, loading = false;
let friends = [], self, error = '', own = R.emptyRecords(), syncStatus = '授权后同步';
const avatars = new Map();
const store = createStore(wx, state => { own = state.own; syncStatus = state.status; draw(); });
const clean = (s, length) => String(s || '').replace(/[\u0000-\u001f]/g, '').slice(0, length);
function text(value, x, y, size = 22, color = '#22201d', align = 'left') {
  ctx.font = `${size}px sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(value, x, y);
}
function avatar(person, x, y) {
  const url = person.avatarUrl;
  if (!url || !/^https:\/\//.test(url)) return;
  let image = avatars.get(url);
  if (image === undefined) {
    image = wx.createImage(); avatars.set(url, image);
    image.onload = () => draw(); image.onerror = () => avatars.set(url, null); image.src = url;
    // Bound texture retention while paging a large friend list.
    if (avatars.size > 80) avatars.delete(avatars.keys().next().value);
  }
  if (image && image.width > 0) { try { ctx.drawImage(image, x, y, 32, 32); } catch {} }
}
function rows() {
  const unique = new Map();
  for (const user of friends) {
    if (!user || typeof user.openid !== 'string') continue;
    const record = R.fromCloud(Array.isArray(user.KVDataList) ? user.KVDataList : []);
    unique.set(user.openid, { id: user.openid, name: user.nickname, avatarUrl: user.avatarUrl, record });
  }
  if (self) {
    const previous = unique.get(self.openId);
    unique.set(self.openId, { id: self.openId, name: self.nickName || '我', avatarUrl: self.avatarUrl,
      record: R.mergeRecords(previous?.record || R.emptyRecords(), own), me: true });
  }
  const list = [...unique.values()].filter(p => board === 'progress' ? p.record.reached > 0 : !!p.record.times[board === 'level1' ? 1 : 2]);
  list.sort((a, b) => R.compareRecords(a.record, b.record, board) || a.id.localeCompare(b.id));
  let rank = 0;
  return list.map((p, i) => { if (!i || R.compareRecords(p.record, list[i - 1].record, board)) rank = i + 1; return { ...p, rank }; });
}
function score(record) { return board === 'progress' ? R.progressText(record) : R.formatTime(record.times[board === 'level1' ? 1 : 2]?.ms); }
function row(person, y, footer = false) {
  if (person.me || footer) { ctx.fillStyle = '#e9e0d2'; ctx.fillRect(10, y - 29, 940, 41); }
  text(person.rank ? String(person.rank) : '—', 34, y);
  avatar(person, 89, y - 26);
  text(`${clean(person.name, 13) || '微信用户'}${person.me && person.name !== '我' ? '（我）' : ''}`, 137, y);
  text(score(person.record), 923, y, 22, '#22201d', 'right');
}
function draw() {
  if (!visible) return;
  ctx.clearRect(0, 0, 960, 340); ctx.fillStyle = '#f6f1e8'; ctx.fillRect(0, 0, 960, 340);
  text('名次', 24, 25, 18, '#69645c'); text('同玩好友', 137, 25, 18, '#69645c');
  text(board === 'progress' ? '闯关进度' : '最快通关用时', 923, 25, 18, '#69645c', 'right');
  const list = rows(), pages = Math.max(1, Math.ceil(list.length / 5)); page = Math.max(0, Math.min(page, pages - 1));
  if (loading) text('正在读取好友成绩…', 480, 139, 24, '#69645c', 'center');
  else if (error) text(error, 480, 139, 22, '#ad3526', 'center');
  else if (!list.length) text('还没有可展示的成绩，先完成一次突围吧', 480, 139, 24, '#69645c', 'center');
  else list.slice(page * 5, page * 5 + 5).forEach((p, i) => row(p, 65 + i * 43));
  const me = self && list.find(p => p.id === self.openId);
  row(me || { name: self?.nickName || '我', avatarUrl: self?.avatarUrl, record: own, me: true }, 289, true);
  text(`${syncStatus}${!self ? ' · 自己的信息暂不可用' : ''}`, 24, 329, 16, '#69645c');
  text(`${page + 1} / ${pages} 页 · ${list.length} 人`, 935, 329, 16, '#69645c', 'right');
}
function refresh() {
  const request = ++generation; loading = true; error = ''; draw();
  const alive = () => visible && request === generation;
  try {
    wx.getUserInfo({ openIdList: ['selfOpenId'], lang: 'zh_CN', success(result) {
      if (!alive()) return; self = result.data?.find(u => typeof u.openId === 'string'); draw();
    }, fail() { if (alive()) { self = undefined; draw(); } } });
    wx.getUserCloudStorage({ keyList: [...R.RECORD_KEYS], success(result) {
      if (alive()) { own = R.mergeRecords(own, R.fromCloud(result.KVDataList || [])); draw(); }
    }, fail() { if (alive()) { syncStatus = '个人云端纪录暂不可读，请刷新重试'; draw(); } } });
    wx.getFriendCloudStorage({ keyList: [...R.RECORD_KEYS], success(result) {
      if (!alive()) return; friends = Array.isArray(result.data) ? result.data : []; loading = false; draw();
    }, fail() { if (alive()) { loading = false; error = '好友榜读取失败，请点刷新重试'; friends = []; draw(); } } });
  } catch { if (alive()) { loading = false; error = '当前微信暂不支持好友榜，请更新后重试'; draw(); } }
}
wx.onMessage(message => {
  if (!message || message.type !== 'social' || message.rule !== R.RULE) return;
  if (message.action === 'records') store.submit(message.records);
  else if (message.action === 'show' && ['progress', 'level1', 'level2'].includes(message.board)) {
    visible = true; board = message.board; page = 0; refresh();
  } else if (message.action === 'hide') { visible = false; generation++; ctx.clearRect(0, 0, 960, 340); }
  else if (message.action === 'page' && visible) { page += message.delta === -1 ? -1 : message.delta === 1 ? 1 : 0; draw(); }
  else if (message.action === 'refresh' && visible) refresh();
});
