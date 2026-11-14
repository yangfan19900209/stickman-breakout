import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Source-only clones intentionally omit these local archives and captures.
// Missing source/docs still fail, even if a broad ignore pattern happens to match.
export function partitionMissingArtifacts(missing, root) {
  const candidates = missing.map(item => ({ ...item, resolved: path.relative(root, path.resolve(root, path.dirname(item.file), item.target)).replaceAll('\\', '/') }));
  const paths = [...new Set(candidates.map(item => item.resolved).filter(file => /^(?:历史归档\/|交付\/版本\/|开发进度\/验证记录\/|运营\/(?:提交素材|备案截图)(?:\/|$))/.test(file)))];
  if (!paths.length) return { missing, unavailableArtifacts: [] };
  // A missing directory has no stat information; add its explicit trailing slash
  // when checking directory-only ignore rules. Do not do this to arbitrary files.
  const directories = paths.filter(file => /\/(?:wechatgame|web-mobile|验证|体验锚点|备案截图|提交素材)$/.test(file));
  const checked = spawnSync('git', ['check-ignore', '-z', '--stdin'], { cwd: root, input: paths.concat(directories.map(file => file + '/')).join('\0') + '\0', encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (checked.error || ![0, 1].includes(checked.status)) throw new Error('无法核实 git 忽略规则；不会跳过失效链接。');
  const ignored = new Set(checked.stdout.split('\0').filter(Boolean).map(file => file.replace(/\/$/, '')));
  return {
    missing: candidates.filter(item => !ignored.has(item.resolved)).map(({ resolved, ...item }) => item),
    unavailableArtifacts: candidates.filter(item => ignored.has(item.resolved)),
  };
}
