import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('./', import.meta.url);
const base = 'https://developers.weixin.qq.com/minigame/dev/';
const pages = [
  ['friend-cloud', 'api/open-api/data/wx.getFriendCloudStorage.html'],
  ['potential-friends', 'api/open-api/data/wx.getPotentialFriendList.html'],
  ['relation-friends', 'api/open-api/data/wx.getRelationFriendList.html'],
  ['set-cloud', 'api/open-api/data/wx.setUserCloudStorage.html'],
  ['get-cloud', 'api/open-api/data/wx.getUserCloudStorage.html'],
  ['kv-data', 'api/open-api/data/KVData.html'],
  ['open-data', 'guide/open-ability/open-data.html'],
  ['share-api', 'api/share/wx.shareAppMessage.html'],
  ['share-guide', 'guide/open-ability/share/share.html'],
  ['direct-share', 'api/open-api/data/wx.shareMessageToFriend.html'],
  ['direct-query', 'api/share/wx.setMessageToFriendQuery.html'],
  ['group-cloud', 'api/open-api/data/wx.getGroupCloudStorage.html'],
  ['group-entry', 'api/open-api/group/wx.getGroupEnterInfo.html'],
  ['authorize', 'api/open-api/authorize/wx.authorize.html'],
  ['privacy', 'api/open-api/privacy/wx.requirePrivacyAuthorize.html'],
  ['launch', 'api/base/app/life-cycle/wx.getLaunchOptionsSync.html'],
  ['on-show', 'api/base/app/life-cycle/wx.onShow.html'],
  ['timeline', 'api/share/wx.onShareTimeline.html'],
  ['privacy-guide', 'guide/open-ability/privacy.html'],
  ['context-guide', 'guide/open-ability/opendata/basic.html'],
  ['content-rules', 'guide/open-ability/game-content.html'],
  ['performance', 'api/base/performance/wx.getPerformance.html'],
  ['performance-now', 'api/base/performance/Performance.now.html'],
  ['self-info', 'api/open-api/data/OpenDataContext-wx.getUserInfo.html'],
];
await mkdir(root, { recursive: true });
const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const results = await Promise.all(pages.map(async ([id, path]) => {
  const url = base + path;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
    const html = await response.text();
    const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1];
    if (!response.ok || !article) return { id, url, status: response.status, error: 'No article extracted' };
    const text = decode(article.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<\/(?:p|h[1-6]|tr|li|pre|blockquote)>/gi, '\n').replace(/<[^>]*>/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n')).trim();
    await writeFile(new URL(id + '.txt', root), text + '\n');
    return { id, url, status: response.status, title: decode(html.match(/<title[^>]*>(.*?)<\/title>/s)?.[1] ?? ''), sha256: createHash('sha256').update(html).digest('hex'), chars: text.length, retrievedAt: new Date().toISOString() };
  } catch (error) { return { id, url, error: String(error) }; }
}));
await writeFile(new URL('sources.json', root), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results.map(({id,status,chars,error}) => ({id,status,chars,error})), null, 2));
