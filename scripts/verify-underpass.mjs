import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const specs=s=>[...(s.specs??[]),...(s.suites??[]).flatMap(specs)];
const passed=s=>s.tests?.some(t=>t.results.at(-1)?.status==='passed');
const list=d=>readdirSync(d).flatMap(n=>{const p=path.join(d,n);return statSync(p).isDirectory()?list(p):[p];});
const logic=json('reports/logic-results.json'),before=json('reports/v057-underpass-before.json');
const browser=json('reports/v057-underpass-browser-results.json'),first=json('reports/v057-underpass-first-attempt.json');
const route=json('reports/v057-underpass.json');
assert.equal(before.failed,4);assert.equal(logic.failed,0);assert.ok(logic.passed>=114);assert.equal(logic.exitCode,0);
assert.equal(browser.stats.unexpected,0);assert.equal(browser.stats.expected,1);assert.ok(specs(browser).every(passed));
const rocket=specs(first).find(s=>s.title.includes('upward rocket'));assert.ok(rocket&&passed(rocket));
assert.deepEqual(route.errors,[]);
for(const direction of ['left','right']){
 const samples=route.walks.filter(w=>w.direction===direction);assert.ok(samples.length>0);
 assert.ok(samples.every(w=>!w.player.crouched&&w.player.grounded&&w.player.y+74<320));
}
const deck=route.snapshot.terrain.find(s=>s.kind==='platform'&&s.x===3300);
const cover=route.snapshot.objects.find(o=>o.id==='sandbags-B');assert.equal(deck.y,320);assert.equal(cover.x,3520);
assert.ok(route.snapshot.player.health>0);
const sources=list('assets/scripts').filter(p=>p.endsWith('.ts')).sort();
assert.ok(Math.max(...sources.map(p=>statSync(p).mtimeMs))<Date.parse(browser.stats.startTime));
const hash=createHash('sha256');for(const p of sources)hash.update(p).update(readFileSync(p));
const build=d=>{const files=list(d);return{files:files.length,bytes:files.reduce((n,p)=>n+statSync(p).size,0)};};
const web=build('build/web-mobile'),wechat=build('build/wechatgame');assert.ok(wechat.bytes<4*1024*1024);
assert.equal(json('build/wechatgame/game.json').deviceOrientation,'landscape');
const report={version:'0.5.7',patch:'industrial-underpass',date:'2026-10-20',sourceSHA256:hash.digest('hex'),typecheck:'passed',logicTests:logic,
 reproducedBefore:{report:'reports/v057-underpass-before.json',failed:4},
 changes:{platform:{x:3300,oldBottom:248,newBottom:320,width:160,height:16},sandbags:{oldX:3480,newX:3520,exitGap:60},
  ai:'Sandbags and indestructible cover block sight; wooden boxes/barrels remain firing targets. Existing hop logic and combat values preserved.'},
 browser:{targetedPassed:2,standingRoute:'reports/v057-underpass-browser-results.json',rocketRegression:'reports/v057-underpass-first-attempt.json',
  note:'Rocket regression passed first run. Underpass return route initially met the dropped bridge lip; normal jump was added to the input pilot and the two-way standing underpass run passed.'},
 route:{report:'reports/v057-underpass.json',standingSamples:route.walks.length,health:route.snapshot.player.health,x:route.snapshot.player.x,errors:route.errors},web,wechat,
 screenshots:['left','right','exit'].map(s=>'reports/v057-underpass-'+s+'.png'),
 limitations:['Full browser suite/campaign not rerun for this patch; all model logic tests including campaign/retreat passed.','WeChat editor/device runtime, sustained mobile FPS, upload and publication not verified/performed.']};
writeFileSync('reports/v057-underpass-verification.json',JSON.stringify(report,null,2));writeFileSync('reports/verification.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
