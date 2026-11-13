import{readFileSync,writeFileSync,readdirSync,existsSync,statSync,copyFileSync,mkdirSync}from'node:fs';
import{createHash}from'node:crypto';import assert from'node:assert/strict';import AdmZip from'adm-zip';
const root='../交付/版本/1.0.7-社交复活',reports='../开发进度/验证记录/v107-social-revive';
const json=p=>JSON.parse(readFileSync(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
assert.equal(existsSync(`${root}/manifest.json`),false,'Finalized release must never be overwritten');
const inputs=json(`${reports}/build-inputs.json`),logic=json(`${reports}/logic-results.json`);
assert.equal(logic.failed,0);assert.equal(logic.passed,logic.tests);assert.equal(logic.exitCode,0);
const checks=['browser.json','recommendation/browser.json','share/browser.json','smoke.json'].map(file=>({file,result:json(`${reports}/${file}`)}));
for(const {result:r}of checks){assert.equal(r.version,'1.0.7');assert.equal(r.passed,true);assert.deepEqual(r.errors,[]);assert.deepEqual(r.failed,[]);}
const archives=[],builds=[];
for(const [platform,label]of[['web-mobile','Web'],['wechatgame','微信小游戏']]){
 const m=json(`${root}/${platform}-files.json`);assert.equal(m.inputSHA256,inputs.sha256);
 assert.deepEqual(walk(`${root}/${platform}`).map(f=>f.slice(`${root}/${platform}/`.length)).sort(),m.files.map(f=>f.file).sort());
 for(const f of m.files){assert.ok(!/\.(pem|key)$/i.test(f.file));assert.equal(sha(readFileSync(`${root}/${platform}/${f.file}`)),f.sha256);}
 const log=readFileSync(`${root}/build-${platform}.log`,'utf8');assert.match(log,/build Task.*Finished/);assert.doesNotMatch(log,/Missing class|Script .+ is missing or invalid/);
 const cover=m.files.find(f=>f.file==='subpackages/landart/share-cover.jpg');assert.equal(cover.sha256,inputs.inputs.find(f=>f.file==='assets/landart/title-cover.jpg').sha256);
 if(platform==='web-mobile')for(const {result:r}of checks)assert.ok(Date.parse(r.startedAt)>Date.parse(m.frozenAt));
 const file=`线条突围-${label}-1.0.7.zip`;assert.equal(existsSync(`${root}/${file}`),false);
 const zip=new AdmZip();for(const f of m.files)zip.addFile(`${platform}/${f.file}`,readFileSync(`${root}/${platform}/${f.file}`));zip.writeZip(`${root}/${file}`);
 const check=new AdmZip(`${root}/${file}`);for(const f of m.files)assert.equal(sha(check.readFile(`${platform}/${f.file}`)),f.sha256);
 archives.push({file,bytes:statSync(`${root}/${file}`).size,sha256:sha(readFileSync(`${root}/${file}`)),entries:m.files.length});builds.push({platform,files:m.files.length,bytes:m.files.reduce((n,f)=>n+f.bytes,0),inputSHA256:m.inputSHA256});
}
const game=json(`${root}/wechatgame/game.json`),wechat=json(`${root}/wechatgame-files.json`);assert.equal(game.openDataContext,'openDataContext');
const config=json(`${root}/wechatgame/project.config.json`);assert.equal(config.appid,json('build-config/wechatgame.json').packages.wechatgame.appid);assert.equal(config.compileType,'game');assert.equal(game.deviceOrientation,'landscape');
for(const f of ['index.js','store.js','records.js'])assert.ok(existsSync(`${root}/wechatgame/openDataContext/${f}`));
const subpackages=game.subpackages.map(p=>({...p,bytes:wechat.files.filter(f=>f.file.startsWith(p.root)).reduce((n,f)=>n+f.bytes,0)}));
for(const name of['landart','level02','level03'])assert.ok(subpackages.find(p=>p.name===name)?.bytes>0);
const total=builds.find(b=>b.platform==='wechatgame').bytes,main=total-subpackages.reduce((n,p)=>n+p.bytes,0);assert.ok(main<4*1024*1024);assert.ok(total<20*1024*1024);
const budget={mainBytes:main,totalBytes:total,subpackages,localBudget:{main:4*1024*1024,total:20*1024*1024},basis:'Existing project limits, not a statement of current platform policy'};
writeFileSync(`${reports}/budget.json`,JSON.stringify(budget,null,2)+'\n');mkdirSync(`${root}/验证`,{recursive:true});
for(const file of['logic-results.json','browser.json','smoke.json','share/browser.json','recommendation/browser.json','budget.json','build-inputs.json','skill-validation.json'])copyFileSync(`${reports}/${file}`,`${root}/验证/${file.replaceAll('/','-')}`);
const result={version:'1.0.7',releaseName:'分享与推荐复活',createdAt:new Date().toISOString(),sourceInputSHA256:inputs.sha256,inputArchive:{file:'构建输入.zip',sha256:sha(readFileSync(`${root}/构建输入.zip`))},builds,archives,budget,
 validation:{typecheck:true,logic:logic.tests,revivalBrowserCases:checks[0].result.cases.length,recommendationCases:checks[1].result.cases.length,shareHostCases:checks[2].result.cases.length,twoChapterSmoke:true,naturalDeathsPerChapter:4,revivalsPerChapter:4},
 rules:{freePerChapterAttempt:1,additionalLives:'Unlimited one-at-a-time credits',share:'Request issued; cancelling also retains credit',recommendation:'Official close result isRecommended === true; includes already recommended',rating:'No verified star/text review callback; not rewarded',fastestTime:'All revived runs excluded; progress retained'},
 checkpoints:['PRE-SHARE-REVIVE-20261113'],chapterAvailability:[1,2],thirdChapterOpen:false,uploadedToWechat:false,publishedToWechat:false,wechatDeviceVerified:false};
writeFileSync(`${root}/manifest.json`,JSON.stringify(result,null,2)+'\n');writeFileSync(`${reports}/verification.json`,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:true,version:result.version,validation:result.validation,mainBytes:main,totalBytes:total,archives},null,2));
