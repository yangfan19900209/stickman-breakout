import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const json=p=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const list=d=>readdirSync(d).flatMap(n=>{const p=path.join(d,n);return statSync(p).isDirectory()?list(p):[p];});
const specs=s=>[...(s.specs??[]),...(s.suites??[]).flatMap(specs)];
const logic=json('reports/logic-results.json'),browser=json('reports/v058-browser-results.json');
assert.equal(logic.exitCode,0);assert.equal(logic.failed,0);assert.ok(logic.passed>=120);
assert.equal(browser.stats.expected,2);assert.equal(browser.stats.unexpected,0);assert.equal(browser.stats.flaky,0);
assert.ok(specs(browser).every(s=>s.tests.every(t=>t.results.at(-1).status==='passed')));
const rifle=json('reports/v058-rifle.json'),shotgun=json('reports/v058-shotgun.json');
assert.equal(rifle.first.vx,760);assert.equal(rifle.second.vx,760);assert.deepEqual(rifle.errors,[]);
assert.ok(Math.abs(rifle.second.x-rifle.first.x-760*(rifle.second.age-rifle.first.age))<1e-6);
assert.ok(shotgun.samples.length>40);assert.equal(new Set(shotgun.legs).size,6);assert.deepEqual(shotgun.errors,[]);
for(const s of shotgun.samples){
 assert.ok(s.body.startsWith('direct.shotgun.'));assert.equal(s.visible,true);assert.equal(s.weapon,'baked.shotgun');
 assert.equal(s.hud,'shotgun');assert.equal(s.player,'shotgun');assert.equal(s.overlay,null);assert.equal(s.grip,null);
}
const labels=['idle','stand-fire','run','run-fire','crouch','crouch-fire','crouch-walk','jump','fall','switched'];
const screenshots=['reports/v058-contact.png','reports/v058-rifle-flight.png',...labels.map(s=>'reports/v058-shotgun-'+s+'.png')];
for(const p of screenshots)assert.ok(existsSync(p),p);
assert.deepEqual(shotgun.captures.map(c=>c.label),labels);
const manifest=json('art/v058-manifest.json');assert.equal(manifest.frames.length,51);assert.equal(Object.keys(manifest.clips).length,12);
assert.equal(createHash('sha256').update(readFileSync(manifest.source.file)).digest('hex'),manifest.source.sha256);
assert.equal(manifest.textureBytes,statSync('assets/resources/comic/shotgun.png').size);
assert.deepEqual(manifest.textureSize,[2048,512]);assert.equal(manifest.padding,8);assert.equal(manifest.extrusion,4);
const sources=list('assets/scripts').filter(p=>p.endsWith('.ts')).sort();
const newestSource=Math.max(...sources.map(p=>statSync(p).mtimeMs));assert.ok(newestSource<Date.parse(browser.stats.startTime));
const hash=createHash('sha256');for(const p of sources)hash.update(p).update(readFileSync(p));
const build=(d,entry)=>{assert.ok(newestSource<statSync(path.join(d,entry)).mtimeMs);const files=list(d);return{files:files.length,bytes:files.reduce((n,p)=>n+statSync(p).size,0),creatorExitCode:36};};
const web=build('build/web-mobile','index.html'),wechat=build('build/wechatgame','game.js');
assert.ok(wechat.bytes<4*1024*1024);assert.equal(json('build/wechatgame/game.json').deviceOrientation,'landscape');
assert.equal(json('build/wechatgame/project.config.json').appid,'wx7d2aae02691fc088');
assert.ok(readFileSync('build/web-mobile/sw.js','utf8').includes('0.5.8'));
const report={version:'0.5.8',date:'2026-10-29',creator:'3.8.8',sourceSHA256:hash.digest('hex'),typecheck:'passed',logicTests:logic,
 browserTests:{passed:2,failed:0,...browser.stats,report:'reports/v058-browser-results.json'},
 rifle:{oldSpeed:1100,speed:760,reductionPercent:Math.round((1-760/1100)*1000)/10,measuredDistance:rifle.second.x-rifle.first.x,measuredSeconds:rifle.second.age-rifle.first.age,report:'reports/v058-rifle.json'},
 shotgun:{source:manifest.source,frames:51,clips:12,textureBytes:manifest.textureBytes,textureSize:manifest.textureSize,padding:8,extrusion:4,
  composition:'single complete supplied figure; no gun-removal mask, weapon or hand overlay',excludedOverlaps:manifest.excludedOverlaps,
  renderSamples:shotgun.samples.length,blankFrames:shotgun.samples.filter(f=>!f.visible).length,crouchWalkFrames:shotgun.legs.length,switchCycles:8,report:'reports/v058-shotgun.json'},
 web,wechat:{...wechat,runtimeVerified:false,uploaded:false},screenshots,
 limitations:['Only the two targeted browser cases rerun; full campaign and boss/retreat remain covered by current model tests, not a new full browser playthrough.',
 'Six overlapping/truncated source fire figures excluded. Clean standing/run firing clips have 3/2 frames; reload row archived without adding reload gameplay.',
 'Crouch-walking fire uses the six complete walking frames with muzzle FX. Grenade throw uses the previously supplied complete throw; no dedicated high-angle shotgun aiming art.',
 'No physical mobile device or WeChat runtime validation; WeChat artifact built but not uploaded in this iteration.']};
for(const p of ['reports/v058-verification.json','reports/verification.json'])writeFileSync(p,JSON.stringify(report,null,2));
console.log(JSON.stringify({version:report.version,logic:logic.passed,browser:report.browserTests,rifle:report.rifle,shotgunSamples:shotgun.samples.length,web,wechat},null,2));
