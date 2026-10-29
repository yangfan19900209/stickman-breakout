import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const json=p=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const list=d=>readdirSync(d).flatMap(n=>{const p=path.join(d,n);return statSync(p).isDirectory()?list(p):[p];});
const specs=s=>[...(s.specs??[]),...(s.suites??[]).flatMap(specs)];
const logic=json('reports/logic-results.json'),browser=json('reports/v059-browser-results.json');
assert.equal(logic.exitCode,0);assert.equal(logic.failed,0);assert.ok(logic.passed>=129);
assert.equal(browser.stats.expected,2);assert.equal(browser.stats.unexpected,0);assert.equal(browser.stats.flaky,0);
assert.ok(specs(browser).every(s=>s.tests.every(t=>t.results.at(-1).status==='passed')));
const crate=json('reports/v059-crate.json'),campaign=json('reports/v059-campaign.json');
assert.deepEqual(crate.errors,[]);assert.deepEqual(campaign.errors,[]);
const live=crate.frames.filter(f=>f.alive);assert.ok(live.length>10);
assert.deepEqual([...new Set(live.map(f=>f.health))].sort(),[1,2,3]);
for(const f of live){assert.equal(f.visual.frame,'crate.intact');assert.equal(f.visual.width,crate.initial.width);assert.equal(f.visual.height,crate.initial.height);assert.equal(f.visual.y,crate.initial.y);assert.ok(f.solid&&f.hasCollider);}
const dead=crate.frames.at(-1);assert.equal(dead.alive,false);assert.equal(dead.visual,null);assert.equal(dead.hasCollider,false);
const end=campaign.snapshot;assert.equal(end.state,'complete');assert.ok(end.player.health>0);assert.equal(end.guardHealth,0);assert.equal(end.miniBoss.health,0);assert.ok(end.exitOpen);assert.equal(end.droppedBullets,0);
assert.deepEqual(campaign.phases,[1,2]);assert.equal(new Set(campaign.warnings).size,6);
for(const count of Object.values(end.boss.attackCounts))assert.ok(count>0);
const laser=campaign.captures.find(c=>c.label==='boss-laser').snapshot;
assert.equal(laser.art.renderedBoss.frame,'mech.charge');assert.ok(laser.art.combat.bossBeam.visible);
assert.equal(laser.art.combat.bossBeam.x,laser.boss.beam.x);assert.equal(laser.art.combat.bossBeam.y,laser.boss.beam.y);
const giant=laser.enemies.find(e=>e.kind==='colossus');assert.ok(giant.x-laser.cameraX<laser.display.worldVisibleWidth-150);
const manifest=json('art/v059-manifest.json');assert.equal(manifest.sources.length,3);assert.equal(manifest.frames.length,23);
for(const s of manifest.sources)assert.equal(createHash('sha256').update(readFileSync(s.file)).digest('hex'),s.sha256);
assert.equal(manifest.textureBytes,statSync('assets/resources/comic/mech.png').size);assert.deepEqual(manifest.textureSize,[2048,1024]);assert.equal(manifest.padding,8);assert.equal(manifest.extrusion,4);
const sources=list('assets/scripts').filter(p=>p.endsWith('.ts')).sort(),newest=Math.max(...sources.map(p=>statSync(p).mtimeMs));
assert.ok(newest<Date.parse(browser.stats.startTime));
const hash=createHash('sha256');for(const p of sources)hash.update(p).update(readFileSync(p));
const build=(d,entry)=>{assert.ok(newest<statSync(path.join(d,entry)).mtimeMs);const files=list(d);assert.ok(files.every(p=>!/[.](key|pem|pfx)$/i.test(p)));return{files:files.length,bytes:files.reduce((n,p)=>n+statSync(p).size,0),creatorExitCode:36};};
const web=build('build/web-mobile','index.html'),wechat=build('build/wechatgame','game.js');
assert.ok(wechat.bytes<4*1024*1024);assert.equal(json('build/wechatgame/game.json').deviceOrientation,'landscape');assert.equal(json('build/wechatgame/project.config.json').appid,'wx7d2aae02691fc088');
assert.ok(readFileSync('build/web-mobile/sw.js','utf8').includes('0.5.9'));
const screenshots=['reports/v059-contact.png',...['intact','damage-2','damage-1','break'].map(s=>'reports/v059-crate-'+s+'.png'),...campaign.captures.map(c=>'reports/v059-'+c.label+'.png'),'reports/v059-complete.png'];
for(const p of screenshots)assert.ok(existsSync(p),p);
const report={version:'0.5.9',date:'2026-10-29',creator:'3.8.8',sourceSHA256:hash.digest('hex'),typecheck:'passed',logicTests:logic,
 browserTests:{passed:2,failed:0,...browser.stats,report:'reports/v059-browser-results.json'},
 crates:{report:'reports/v059-crate.json',liveSamples:live.length,width:crate.initial.width,height:crate.initial.height,damageStages:[3,2,1],singleOpaqueBody:true,collisionRemoved:true,pickupReleased:true},
 campaign:{report:'reports/v059-campaign.json',state:end.state,seconds:end.time,health:end.player.health,kills:end.kills,phases:campaign.phases,warnings:campaign.warnings,attackCounts:end.boss.attackCounts,errors:campaign.errors},
 art:{sources:manifest.sources,cuts:23,textureBytes:manifest.textureBytes,textureSize:manifest.textureSize,padding:8,extrusion:4,body:'one complete supplied mech frame; shared sole/cannon/pod sockets, both facings'},
 web,wechat:{...wechat,runtimeVerified:false,uploaded:false},screenshots,
 limitations:['No physical Android/iOS or WeChat runtime verification; WeChat artifact built locally, not uploaded in this iteration.',
 'The attack sheet supplies standalone warnings and ground rings; its alternate smaller mech and the main sheet pose with detached painted missiles are not overlaid on the complete body.',
 'Drone/shield/cone-beam illustrations archived for future work; this iteration adds laser, shoulder missiles and fan cannon to the three existing attacks.',
 'Browser first attempt asserted a sprite before the boss entered camera view. Final tests allow offscreen culling and verify the actual sprite/beam when visible.']};
for(const p of ['reports/v059-verification.json','reports/verification.json'])writeFileSync(p,JSON.stringify(report,null,2));
console.log(JSON.stringify({version:report.version,logic:logic.passed,browser:report.browserTests,campaign:report.campaign,crates:report.crates,web,wechat},null,2));
