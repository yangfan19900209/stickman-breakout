import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import ts from 'typescript';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const list=dir=>readdirSync(dir).flatMap(n=>{const p=path.join(dir,n);return statSync(p).isDirectory()?list(p):[p];});
const logic=json('reports/logic-results.json'), browser=json('reports/v057-browser-results.json');
const run=json('reports/full-run.json'),bypass=json('reports/v042-bypass.json');
const swaps=json('reports/v057-switch.json'),knife=json('reports/v057-knife.json'),pickups=json('reports/v057-browser.json');
assert.equal(logic.exitCode,0);assert.equal(logic.failed,0);assert.ok(logic.passed>=104);
assert.equal(browser.stats.unexpected,0);assert.ok(browser.stats.expected+browser.stats.flaky>=41);
assert.equal(run.snapshot.state,'complete');assert.deepEqual(run.errors,[]);
assert.equal(bypass.phase,'done');assert.deepEqual(bypass.errors,[]);
assert.ok(swaps.renderedFrames.length>20);
assert.ok(swaps.renderedFrames.every(f=>f.id===f.player&&f.hud==='weapon.'+f.id&&f.visible));
assert.ok(swaps.frames.filter(f=>f.id==='knife').every(f=>f.actor.body.startsWith('direct.knife.')&&f.actor.weapon==='baked.knife'));
assert.deepEqual(knife.stages,[1,2,3]);assert.ok(knife.hitStop>0);assert.ok(knife.snapshot.melee.hits>0);
assert.equal(knife.snapshot.playerShots,0);
const rocket=pickups.captures.find(c=>c.weapon==='rocket');
assert.ok(rocket.body.startsWith('direct.rocket.'));assert.equal(rocket.equipment.weapon,null);assert.equal(rocket.equipment.grip,null);
assert.ok(pickups.returned);assert.ok(pickups.snapshot.player.x>3900);assert.deepEqual(pickups.errors,[]);
const manifest=json('art/v057-manifest.json');assert.equal(manifest.frames.length,112);
for(const s of Object.values(manifest.sources))assert.equal(createHash('sha256').update(readFileSync(s.file)).digest('hex'),s.sha256);
const sources=list('assets/scripts').filter(p=>p.endsWith('.ts'));
for(const p of sources){
 const tree=ts.createSourceFile(p,readFileSync(p,'utf8'),ts.ScriptTarget.Latest,true);
 const visit=n=>{assert.ok(!(ts.isIdentifier(n)&&['window','document','localStorage'].includes(n.text)),p);ts.forEachChild(n,visit);};visit(tree);
}
const build=dir=>{const files=list(dir);return{files:files.length,bytes:files.reduce((n,p)=>n+statSync(p).size,0)};};
const web=build('build/web-mobile'),wechat=build('build/wechatgame');
assert.ok(wechat.bytes<4*1024*1024);assert.equal(json('build/wechatgame/game.json').deviceOrientation,'landscape');
assert.equal(json('build/wechatgame/project.config.json').appid,'wx7d2aae02691fc088');
const screenshots=['first-screen','platform','rocket','rocket-detail','knife-hold','knife-1','knife-2','knife-3','knife-hit','knife-crouch','knife-jump','second-zone'].map(n=>'reports/v057-'+n+'.png');
for(const p of screenshots)assert.ok(existsSync(p),p);
const hash=createHash('sha256');for(const p of sources.sort())hash.update(p).update(readFileSync(p));
const report={version:'0.5.7',date:'2026-10-20',creator:'3.8.8',typecheck:'passed',sourceSHA256:hash.digest('hex'),
 logicTests:logic,browserTests:{...browser.stats,report:'reports/v057-browser-results.json'},
 fullRun:{attempt:run.attempt,state:run.snapshot.state,seconds:run.snapshot.time,health:run.snapshot.player.health,kills:run.snapshot.kills,errors:run.errors},
 bypass:{attempt:bypass.attempt,phase:bypass.phase,entries:bypass.entries,retreat:bypass.retreat,errors:bypass.errors},
 switches:{cycles:swaps.frames.length,sampledRenderFrames:swaps.renderedFrames.length,blankFrames:swaps.renderedFrames.filter(f=>!f.visible).length},
 knife:{stages:knife.stages,hitStop:knife.hitStop,hits:knife.snapshot.melee.hits,bullets:knife.snapshot.playerShots},
 newAssets:{sources:manifest.sources,cuts:112,clips:Object.keys(manifest.clips).length,textureBytes:manifest.textureBytes,textureSize:manifest.textureSize,padding:8,extrusion:4,actorComposition:'single complete supplied frame for knife and rocket; no extra gun/grip/slash'},
 web:{...web,creatorExitCode:36},wechat:{...wechat,creatorExitCode:36,runtimeVerified:false,uploaded:false},screenshots,
 limitations:['Shotgun full-body action sheet was not supplied; existing shotgun composition remains.',
 'No dedicated crouched cutting or high-angle aiming frames; crouch cuts reuse native low knife poses, grenade throws reuse the earlier supplied sheet.',
 'WeChat developer tools, physical Android/iOS devices, WeChat browser safe area/multitouch and sustained real-device 60FPS are unverified.',
 'No upload, review submission or publication performed in this iteration.']};
writeFileSync('reports/v057-verification.json',JSON.stringify(report,null,2));writeFileSync('reports/verification.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({version:report.version,logic:logic.passed,browser:browser.stats,fullRun:report.fullRun,switches:report.switches,web,wechat},null,2));
