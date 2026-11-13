import {readFileSync,writeFileSync,readdirSync,mkdirSync,existsSync,cpSync,copyFileSync,statSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import {workspaceRoot,sourceRoot,reportsRoot} from './project-paths.mjs';

const reportDir=path.join(reportsRoot,'recommendation-20261113');
const json=f=>JSON.parse(readFileSync(f,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const rel=(root,file)=>path.relative(root,file).replaceAll('\\','/');
const version=json(path.join(sourceRoot,'package.json')).version;
const verified=json(path.join(reportsRoot,'verification.json')),browser=json(path.join(reportDir,'browser.json'));
assert.equal(verified.version,version);assert.equal(verified.passed,true);assert.equal(browser.version,version);assert.equal(browser.passed,true);
assert.deepEqual(browser.errors,[]);assert.deepEqual(browser.failed,[]);assert.ok(Date.parse(browser.startedAt)>verified.web.entryTime);
const digest=createHash('sha256');for(const file of walk(path.join(sourceRoot,'assets/scripts')).filter(f=>f.endsWith('.ts')).sort())digest.update(rel(sourceRoot,file)).update(readFileSync(file));
assert.equal(digest.digest('hex'),verified.sourceSHA256,'Source changed after validation');
const destination=path.join(workspaceRoot,'交付/版本',version+'-推荐接入');
assert.ok(!existsSync(destination),'Fixed recommendation package must never be overwritten');
const inputs=['assets','settings','build-config','build-templates','web-shell','types'].flatMap(d=>walk(path.join(sourceRoot,d)))
  .concat(['package.json','package-lock.json','tsconfig.json','tsconfig.check.json','scripts/prepare-web-shell.mjs','scripts/prepare-wechat-social.mjs'].map(f=>path.join(sourceRoot,f))).sort();
const inputRecords=inputs.map(f=>({file:rel(sourceRoot,f),bytes:statSync(f).size,sha256:sha(readFileSync(f))}));
// Creator rewrites engine.json on every launch, including unchanged content.
// Exempt only that file after proving byte equality to the pre-change checkpoint.
const engineConfig=path.join(sourceRoot,'settings/v2/packages/engine.json');
const checkpoint=new AdmZip(path.join(workspaceRoot,'历史归档/体验锚点/PRE-RECOMMENDATION-20261113/source.zip'));
const engineConfigUnchanged=sha(checkpoint.readFile('源码/settings/v2/packages/engine.json'))===sha(readFileSync(engineConfig));
for(const platform of ['web-mobile','wechatgame']){
 const entry=path.join(sourceRoot,'build',platform,platform==='web-mobile'?'index.html':'game.js');
 assert.ok(statSync(entry).mtimeMs>Math.max(...inputs.filter(f=>!f.includes('tsconfig')&&!(f===engineConfig&&engineConfigUnchanged)).map(f=>statSync(f).mtimeMs)),'Build predates current inputs');
}
mkdirSync(destination,{recursive:true});
const archives=[];
function archive(name,entries){
 const zip=new AdmZip();for(const e of entries){assert.ok(!/\.(pem|key)$/i.test(e.name),'Never archive credentials');zip.addFile(e.name,readFileSync(e.file));}
 const target=path.join(destination,name);zip.writeZip(target);const check=new AdmZip(target);
 assert.equal(check.getEntryCount(),entries.length);
 const records=entries.map(e=>{const bytes=readFileSync(e.file),record={file:e.name,bytes:bytes.length,sha256:sha(bytes)};assert.equal(sha(check.readFile(e.name)),record.sha256);return record;});
 archives.push({file:name,bytes:statSync(target).size,sha256:sha(readFileSync(target)),entries:entries.length});return records;
}
const builds=[];
for(const [platform,label] of [['web-mobile','Web'],['wechatgame','微信小游戏']]){
 const from=path.join(sourceRoot,'build',platform),to=path.join(destination,platform);cpSync(from,to,{recursive:true,errorOnExist:true});
 const records=archive(`线条突围-${label}-${version}-推荐接入.zip`,walk(to).map(file=>({name:rel(to,file),file})));
 for(const r of records)assert.equal(sha(readFileSync(path.join(from,r.file))),r.sha256,'Build changed while freezing');
 writeFileSync(path.join(destination,platform+'-files.json'),JSON.stringify(records,null,2)+'\n');
 builds.push({platform,files:records.length,bytes:records.reduce((n,r)=>n+r.bytes,0),entryTime:verified[platform==='wechatgame'?'wechat':'web'].entryTime});
 const log=path.join(reportsRoot,'构建日志',`build-${platform}.log`),fallback=path.join(reportsRoot,'构建日志',`build-${platform}.stdout.log`);
 const content=readFileSync(existsSync(log)?log:fallback,'utf8');assert.match(content,/build Task.*Finished/);assert.doesNotMatch(content,/Missing class|Script .+ is missing or invalid/);
 writeFileSync(path.join(destination,`build-${platform}.log`),content);
}
archive('构建输入.zip',inputs.map(file=>({name:'源码/'+rel(sourceRoot,file),file})));
const finalInputs=inputRecords.map(r=>({...r,sha256:sha(readFileSync(path.join(sourceRoot,r.file)))}));assert.deepEqual(finalInputs,inputRecords,'Inputs changed while freezing');
const evidence=path.join(destination,'验证');mkdirSync(evidence);
for(const file of ['browser.json','logic-results-final.json','smoke-final.json','skill-validation.json'])copyFileSync(path.join(reportDir,file),path.join(evidence,file));
copyFileSync(path.join(reportsRoot,'verification.json'),path.join(evidence,'verification.json'));
copyFileSync(path.join(reportsRoot,'verification.json'),path.join(reportDir,'verification-final.json'));
const wechatRecords=json(path.join(destination,'wechatgame-files.json')),game=json(path.join(destination,'wechatgame/game.json'));
const subpackages=game.subpackages.map(p=>({name:p.name,root:p.root,bytes:wechatRecords.filter(f=>f.file.startsWith(p.root)).reduce((n,f)=>n+f.bytes,0)}));
const total=builds.find(b=>b.platform==='wechatgame').bytes,main=total-subpackages.reduce((n,p)=>n+p.bytes,0);
assert.equal(game.openDataContext,'openDataContext');assert.ok(main<4*1024*1024);assert.ok(total<20*1024*1024);
writeFileSync(path.join(destination,'导入说明.txt'),`线条突围 ${version} 推荐入口 P0 本地验收包\n\n微信开发者工具导入本目录的 wechatgame 文件夹。ZIP 解压后的根目录也可导入。\n首页点击“推荐游戏”打开微信官方推荐组件；评价打星仍通过微信评分主页。\n基础库低于 3.8.6 或能力缺失时显示兼容说明，不影响单人游戏。\nP1 通关主动提示未启用，不提供推荐奖励。\n本包包含当前工作区已有的第二关修正、复活及通关选关。保留第一、二关开放，第三关未开放。\n本次 516 项逻辑回归、13 组推荐宿主模拟及两关冒烟检查通过。\n官方组件在微信开发者工具、iOS 和 Android 真机的打开/关闭仍待验收；浏览器模拟不代表微信真机通过。\n未上传、送审或发布。\n`);
// A portable document copy must not retain links relative to the project docs directory.
const deliveryNote=readFileSync(path.join(workspaceRoot,'开发进度/迭代记录/WECHAT-RECOMMENDATION-P0.md'),'utf8')
  .replace(/\[([^\]\n]+)\]\(([^\s)]+)\)/g,(match,label,url)=>/^https?:/.test(url)?match:label);
writeFileSync(path.join(destination,'接入记录.md'),deliveryNote);
const manifest={version,releaseName:'推荐入口 P0',createdAt:new Date().toISOString(),sourceSHA256:verified.sourceSHA256,
 inputSHA256:sha(JSON.stringify(inputRecords)),engineConfigUnchangedFromCheckpoint:engineConfigUnchanged,inputs:inputRecords,builds,archives,
 budget:{mainBytes:main,totalBytes:total,subpackages,basis:'Existing project local budgets: main < 4 MiB and total < 20 MiB; not a claim of current platform policy.'},
 validation:{typecheck:true,logic:verified.logicTests, recommendationCases:browser.cases.length, browserEvidence:'验证/browser.json',twoChapterSmoke:true},
 checkpoint:'PRE-RECOMMENDATION-20261113',chapterAvailability:[1,2],thirdChapterOpen:false,automaticPromptEnabled:false,
 uploaded:false,published:false,wechatDeviceVerified:false};
writeFileSync(path.join(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
writeFileSync(path.join(reportDir,'package.json'),JSON.stringify({destination,version,sourceSHA256:manifest.sourceSHA256,archives,budget:manifest.budget,verified:true},null,2)+'\n');
console.log(JSON.stringify({destination,archives,mainBytes:main,totalBytes:total},null,2));
