import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync,existsSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {sourceRoot,reportsRoot} from './project-paths.mjs';

process.chdir(sourceRoot);
const json=f=>JSON.parse(readFileSync(f,'utf8'));
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
const hash=b=>createHash('sha256').update(b).digest('hex');
const version=json('package.json').version,lock=json('package-lock.json');
assert.equal(lock.version,version);assert.equal(lock.packages[''].version,version);
const sourceFiles=walk('assets/scripts').filter(f=>f.endsWith('.ts')).sort();
const sourceHash=createHash('sha256');for(const f of sourceFiles)sourceHash.update(f).update(readFileSync(f));
const inputs=['assets','web-shell','build-config','build-templates'].flatMap(walk).concat(['scripts/prepare-web-shell.mjs','scripts/prepare-wechat-social.mjs']);
const newest=Math.max(...inputs.map(f=>statSync(f).mtimeMs));
const builds={};
for(const [platform,entry] of [['web-mobile','index.html'],['wechatgame','game.js']]){
  const dir=`build/${platform}`;assert.ok(existsSync(`${dir}/${entry}`),`Missing ${platform}`);
  const entryTime=statSync(`${dir}/${entry}`).mtimeMs;assert.ok(entryTime>newest,`Rebuild ${platform} after changing source/assets`);
  const logPath=path.join(reportsRoot,'构建日志',`build-${platform}.log`);
  const log=readFileSync(existsSync(logPath)?logPath:path.join(reportsRoot,'构建日志',`build-${platform}.stdout.log`),'utf8');
  assert.match(log,/build Task.*Finished/);assert.doesNotMatch(log,/Missing class|Script .+ is missing or invalid/);
  const files=walk(dir);builds[platform]={files:files.length,bytes:files.reduce((n,f)=>n+statSync(f).size,0),entryTime};
  assert.equal(hash(readFileSync(`${dir}/subpackages/landart/share-cover.jpg`)),hash(readFileSync('assets/landart/title-cover.jpg')));
}
const game=json('build/wechatgame/game.json');assert.equal(game.openDataContext,'openDataContext');
for(const chapter of ['landart','level02','level03'])assert.ok(game.subpackages.some(s=>s.root.includes(chapter)),chapter);
for(const file of ['index.js','store.js','records.js'])assert.ok(existsSync('build/wechatgame/openDataContext/'+file));
const logicPath=path.join(reportsRoot,'logic-results.json'),logic=json(logicPath);
assert.ok(logic.tests>0);assert.equal(logic.passed,logic.tests);assert.equal(logic.failed,0);assert.equal(logic.exitCode,0);
assert.ok(statSync(logicPath).mtimeMs>Math.max(...walk('tests').map(f=>statSync(f).mtimeMs),...sourceFiles.map(f=>statSync(f).mtimeMs)),'Rerun logic tests');
const browser=json(path.join(reportsRoot,'current-smoke/result.json'));
assert.equal(browser.version,version);assert.ok(browser.passed);assert.deepEqual(browser.errors,[]);assert.deepEqual(browser.failed,[]);
assert.ok(Date.parse(browser.startedAt)>builds['web-mobile'].entryTime,'Rerun browser smoke against the final Web build');
const result={version,checkedAt:new Date().toISOString(),passed:true,sourceSHA256:sourceHash.digest('hex'),logicTests:logic,web:builds['web-mobile'],wechat:builds.wechatgame,browser:{targetedPassed:browser.chapters.length,scope:browser.scope},route:{errors:[]},uploaded:false,published:false,deviceVerified:false};
writeFileSync(path.join(reportsRoot,'verification.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
