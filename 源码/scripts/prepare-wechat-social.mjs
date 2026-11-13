import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';
const root = 'build/wechatgame';
const output = `${root}/openDataContext`;
mkdirSync(output, { recursive: true });
cpSync('build-templates/wechatgame/openDataContext', output, { recursive: true });
// Keep a stable file for native sharing; a rendered Texture2D need not retain
// its source ImageAsset/nativeUrl on a real mini-game device.
mkdirSync(`${root}/subpackages/landart`, { recursive: true });
cpSync('assets/landart/title-cover.jpg', `${root}/subpackages/landart/share-cover.jpg`);
writeFileSync(`${output}/records.js`, ts.transpileModule(readFileSync('assets/scripts/social/RunRecords.ts', 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2018, module: ts.ModuleKind.CommonJS },
}).outputText);
const config = JSON.parse(readFileSync(`${root}/game.json`, 'utf8'));
config.openDataContext = 'openDataContext';
writeFileSync(`${root}/game.json`, JSON.stringify(config, null, 2) + '\n');
console.log('WeChat isolated leaderboard package prepared.');
