import {readFileSync,writeFileSync,readdirSync,existsSync,statSync,copyFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
const root='../交付/版本/1.0.6-复活选关',reports='../开发进度/验证记录/v106-revive-select';
const json=p=>JSON.parse(readFileSync(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
assert.equal(existsSync(`${root}/manifest.json`),false,'Fixed release already finalized; never overwrite.');
const inputs=json(`${reports}/build-inputs.json`),logic=json(`${reports}/logic-results.json`),ui=json(`${reports}/ui.json`),campaign=json(`${reports}/campaign.json`),smoke=json(`${reports}/smoke.json`),share=json(`${reports}/share/browser.json`);
assert.equal(logic.failed,0);assert.equal(logic.passed,logic.tests);assert.equal(logic.exitCode,0);
for(const r of [ui,campaign,smoke,share]){assert.equal(r.version,'1.0.6');assert.equal(r.passed,true);assert.deepEqual(r.errors,[]);assert.deepEqual(r.failed,[]);}
const archives=[],builds=[];
for(const [platform,label] of [['web-mobile','Web'],['wechatgame','微信小游戏']]){
 const manifest=json(`${root}/${platform}-files.json`);assert.equal(manifest.inputSHA256,inputs.sha256);
 assert.deepEqual(walk(`${root}/${platform}`).map(f=>f.slice(`${root}/${platform}/`.length)).sort(),manifest.files.map(f=>f.file).sort());
 for(const f of manifest.files){assert.ok(!/\.(pem|key)$/i.test(f.file));assert.equal(sha(readFileSync(`${root}/${platform}/${f.file}`)),f.sha256);}
 const log=readFileSync(`${root}/build-${platform}.log`,'utf8');assert.match(log,/build Task.*Finished/);assert.doesNotMatch(log,/Missing class|Script .+ is missing or invalid/);
 const cover=manifest.files.find(f=>f.file==='subpackages/landart/share-cover.jpg');assert.equal(cover.sha256,inputs.inputs.find(f=>f.file==='assets/landart/title-cover.jpg').sha256);
 if(platform==='web-mobile')for(const r of [ui,campaign,smoke,share])assert.ok(Date.parse(r.startedAt)>Date.parse(manifest.frozenAt),'Browser evidence must follow frozen artifact');
 const file=`线条突围-${label}-1.0.6.zip`;assert.equal(existsSync(`${root}/${file}`),false);
 const zip=new AdmZip();for(const f of manifest.files)zip.addFile(`${platform}/${f.file}`,readFileSync(`${root}/${platform}/${f.file}`));zip.writeZip(`${root}/${file}`);
 const check=new AdmZip(`${root}/${file}`);for(const f of manifest.files)assert.equal(sha(check.readFile(`${platform}/${f.file}`)),f.sha256);
 archives.push({file,bytes:statSync(`${root}/${file}`).size,sha256:sha(readFileSync(`${root}/${file}`)),entries:manifest.files.length});
 builds.push({platform,files:manifest.files.length,bytes:manifest.files.reduce((n,f)=>n+f.bytes,0),inputSHA256:manifest.inputSHA256});
}
const game=json(`${root}/wechatgame/game.json`),wechat=json(`${root}/wechatgame-files.json`);
assert.equal(game.openDataContext,'openDataContext');for(const f of ['index.js','store.js','records.js'])assert.ok(existsSync(`${root}/wechatgame/openDataContext/${f}`));
const subpackages=game.subpackages.map(p=>({...p,bytes:wechat.files.filter(f=>f.file.startsWith(p.root)).reduce((n,f)=>n+f.bytes,0)}));
for(const name of ['landart','level02','level03'])assert.ok(subpackages.find(p=>p.name===name)?.bytes>0);
const total=builds.find(b=>b.platform==='wechatgame').bytes,main=total-subpackages.reduce((n,p)=>n+p.bytes,0);
assert.ok(main<4*1024*1024);assert.ok(total<20*1024*1024);
const budget={mainBytes:main,totalBytes:total,subpackages,localBudget:{main:4*1024*1024,total:20*1024*1024},basis:'Existing project limits; not a claim of current platform policy'};
writeFileSync(`${reports}/budget.json`,JSON.stringify(budget,null,2)+'\n');
mkdirSync(`${root}/验证`,{recursive:true});
for(const [source,name]of [['logic-results.json','logic-results.json'],['ui.json','ui.json'],['campaign.json','campaign.json'],['smoke.json','smoke.json'],['share/browser.json','share.json'],['budget.json','budget.json'],['skill-validation.json','skill-validation.json'],['build-inputs.json','build-inputs.json']])copyFileSync(`${reports}/${source}`,`${root}/验证/${name}`);
const result={version:'1.0.6',releaseName:'复活与通关选关',createdAt:new Date().toISOString(),sourceInputSHA256:inputs.sha256,
 inputArchive:{file:'构建输入.zip',sha256:sha(readFileSync(`${root}/构建输入.zip`))},builds,archives,budget,
 validation:{typecheck:true,logic:logic.tests,uiCases:ui.cases.length,shareHostCases:share.cases.length,ordinaryInputTwoChapterCampaign:true,assistedLandClear:true,unassistedOceanClear:true,waterRevive:true},
 checkpoints:['PRE-REVIVE-SELECT-20261113'],chapterAvailability:[1,2],thirdChapterOpen:false,uploaded:false,published:false,wechatDeviceVerified:false,
 scope:'Fixed artifact built from a shared-workspace snapshot, including existing ocean and recommendation work. Gameplay and sharing checks listed here apply to this frozen package. Subsequent workspace edits are not incorporated automatically.'};
writeFileSync(`${root}/manifest.json`,JSON.stringify(result,null,2)+'\n');writeFileSync(`${reports}/verification.json`,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:true,version:result.version,validation:result.validation,mainBytes:main,totalBytes:total,archives},null,2));
