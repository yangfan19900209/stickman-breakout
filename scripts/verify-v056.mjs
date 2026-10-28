import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import ts from 'typescript';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const logic=json('reports/logic-results.json'),browser=json('reports/v056-browser-results.json'),
  run=json('reports/full-run.json'),bypass=json('reports/v042-bypass.json'),
  switches=json('reports/v056-switch.json'),knife=json('reports/v056-knife.json');
const retest=json('reports/v056-audio-retest.json'),framesRetest=json('reports/v056-frame-retest.json');
const allSpecs=s=>[...(s.specs??[]),...(s.suites??[]).flatMap(allSpecs)];
const passed=s=>s.tests?.some(t=>t.results.at(-1)?.status==='passed');
const original=allSpecs(browser),failed=original.filter(s=>!passed(s)),repeated=[...allSpecs(retest),...allSpecs(framesRetest)];
assert.equal(failed.length,2);
assert.ok(failed.every(s=>/real bullets|service worker/.test(s.title)&&repeated.some(r=>r.title===s.title&&passed(r))));
assert.equal(retest.stats.unexpected,0);assert.equal(framesRetest.stats.unexpected,0);
const effective=new Map(original.map(s=>[s.title,s]));for(const s of repeated)effective.set(s.title,s);
const verified=[...effective.values()].filter(passed).length;
assert.equal(logic.exitCode,0);assert.equal(logic.failed,0);assert.ok(logic.passed>=97);
assert.ok(verified>=41);
assert.equal(run.snapshot.state,'complete');assert.equal(run.errors.length,0);
assert.equal(bypass.phase,'done');assert.equal(bypass.errors.length,0);
assert.ok(switches.renderedFrames.length>20);
assert.ok(switches.renderedFrames.every(f=>f.id===f.player&&f.hud==='weapon.'+f.id&&f.visible));
assert.deepEqual(knife.stages,[1,2,3]);assert.ok(knife.hitStop>0);assert.ok(knife.snapshot.melee.hits>0);assert.equal(knife.snapshot.playerShots,0);
const list=dir=>readdirSync(dir).flatMap(name=>{const p=path.join(dir,name);return statSync(p).isDirectory()?list(p):[p];});
const source=list('assets/scripts').filter(p=>p.endsWith('.ts'));
for(const file of source){
 const tree=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
 const visit=n=>{assert.ok(!(ts.isIdentifier(n)&&['window','document','localStorage'].includes(n.text)),file);ts.forEachChild(n,visit);};visit(tree);
}
const build=dir=>{const files=list(dir);return{files:files.length,bytes:files.reduce((n,p)=>n+statSync(p).size,0)};};
const web=build('build/web-mobile'),wechat=build('build/wechatgame');
assert.ok(wechat.bytes<4*1024*1024);assert.equal(json('build/wechatgame/game.json').deviceOrientation,'landscape');
assert.equal(json('build/wechatgame/project.config.json').appid,'wx7d2aae02691fc088');
const manifest=json('art/v055-manifest.json');assert.equal(manifest.extrusion,4);
assert.equal(createHash('sha256').update(readFileSync(manifest.source.file)).digest('hex'),manifest.source.sha256);
const hash=createHash('sha256');for(const file of source.sort())hash.update(file).update(readFileSync(file));
const report={version:json('package.json').version,date:'2026-10-19',creator:'3.8.8',typecheck:'passed',sourceSHA256:hash.digest('hex'),
 logicTests:logic,browserTests:{passed:verified,firstAttemptPassed:browser.stats.expected,passedAfterRetry:browser.stats.flaky,failed:0,originalFailures:browser.stats.unexpected,report:'reports/v056-browser-results.json',
  retest:'reports/v056-audio-retest.json',frameSampling:'reports/v056-frame-retest.json',note:'Final build complete suite:39/41. Two tests still waited for exactly 7 audio clips; updated to 9 after adding knife/hit sounds and both passed focused rerun. Per-render-frame swap sampling passed separately. Game/build unchanged between runs.'},
 fullRun:{attempt:run.attempt,state:run.snapshot.state,seconds:run.snapshot.time,health:run.snapshot.player.health,kills:run.snapshot.kills,guardHealth:run.snapshot.guardHealth,errors:run.errors},
 bypass:{phase:bypass.phase,entries:bypass.entries,retreat:bypass.retreat,errors:bypass.errors},
 weaponSwitch:{cycles:switches.frames.length,sampledRenderFrames:switches.renderedFrames.length,blankFrames:switches.renderedFrames.filter(f=>!f.visible).length,report:'reports/v056-switch.json'},
 knife:{stages:knife.stages,hitStop:knife.hitStop,hits:knife.snapshot.melee.hits,bullets:knife.snapshot.playerShots,report:'reports/v056-knife.json'},
 web:{...web,creatorExitCode:36},wechat:{...wechat,creatorExitCode:36,runtimeVerified:false,uploaded:false},
 art:{cuts:manifest.frames.length,additionalTextureBytes:manifest.textureBytes,additionalTextureSize:manifest.textureSize,padding:manifest.padding,extrusion:manifest.extrusion,source:manifest.source},
 screenshots:['reports/v056-first-screen.png','reports/v056-platform.png','reports/v056-shotgun.png','reports/v056-rocket.png','reports/v056-knife-hold.png','reports/v056-knife-1.png','reports/v056-knife-2.png','reports/v056-knife-3.png','reports/v056-knife-hit.png','reports/v056-knife-crouch.png','reports/v056-knife-jump.png'],
 limitations:['Knife body animation reuses supplied throw/crouch/jump frames; bespoke knife animation frames remain unavailable.','No high-angle dedicated arm poses for all guns.','WeChat developer tools, physical Android/iOS devices and sustained real-device 60FPS not verified.','No upload, review submission or publication performed in this iteration.']};
writeFileSync('reports/v056-verification.json',JSON.stringify(report,null,2));writeFileSync('reports/verification.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
