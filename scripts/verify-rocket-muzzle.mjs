import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const list=d=>readdirSync(d).flatMap(n=>{const p=path.join(d,n);return statSync(p).isDirectory()?list(p):[p];});
const specs=s=>[...(s.specs??[]),...(s.suites??[]).flatMap(specs)];
const passed=s=>s.tests?.some(t=>t.results.at(-1)?.status==='passed');
const logic=json('reports/logic-results.json'), focused=json('reports/v057-muzzle-browser-results.json');
const initial=json('reports/v057-muzzle-first-attempt.json'),shots=json('reports/v057-rocket-muzzle.json');
assert.equal(logic.exitCode,0);assert.equal(logic.failed,0);assert.ok(logic.passed>=109);
assert.equal(focused.stats.unexpected,0);assert.equal(focused.stats.expected,1);
const integration=specs(initial).filter(s=>!s.title.includes('upward rocket'));
assert.equal(integration.length,4);assert.ok(integration.every(passed));assert.ok(specs(focused).every(passed));
assert.deepEqual(shots.errors,[]);
for(const side of ['left','right']){
 const birth=shots.captures.find(c=>c.label===side).snapshot;
 const flight=shots.captures.find(c=>c.label==='turned-'+side).snapshot;
 assert.ok(birth.art.renderedPlayer.body.startsWith('direct.rocket.'));
 assert.equal(birth.art.equipment.weapon,null);assert.equal(birth.art.equipment.grip,null);
 assert.ok(Math.hypot(birth.art.combat.muzzle.x-birth.weaponShot.x,birth.art.combat.muzzle.y-birth.weaponShot.y)<.001);
 const rocket=birth.art.combat.rockets.find(p=>p.age<.08);assert.ok(rocket.width<40);
 assert.ok(Math.hypot(rocket.x-birth.weaponShot.x,rocket.y-birth.weaponShot.y)<16);
 assert.ok(flight.projectileStates.some(p=>p.owner==='player'&&p.kind==='rocket'&&p.age>.12&&p.age<.3&&p.vy>400));
}
const sources=list('assets/scripts').filter(p=>p.endsWith('.ts')).sort();
assert.ok(Math.max(...sources.map(p=>statSync(p).mtimeMs))<Date.parse(focused.stats.startTime),'Browser report predates current source');
const hash=createHash('sha256');for(const p of sources)hash.update(p).update(readFileSync(p));
const build=d=>{const files=list(d);return{files:files.length,bytes:files.reduce((s,p)=>s+statSync(p).size,0)};};
const web=build('build/web-mobile'),wechat=build('build/wechatgame');assert.ok(wechat.bytes<4*1024*1024);
assert.equal(json('build/wechatgame/game.json').deviceOrientation,'landscape');
const result={version:'0.5.7',patch:'rocket-muzzle',date:'2026-10-20',sourceSHA256:hash.digest('hex'),typecheck:'passed',logicTests:logic,
 browser:{passed:5,integrationFirstPass:4,aimedRocketRetest:1,report:'reports/v057-muzzle-browser-results.json',integrationReport:'reports/v057-muzzle-first-attempt.json',
  note:'Initial aimed-rocket scenario correctly hit an overhead platform; moved by real input to open sky and reran both facing directions. Other four integration cases passed on the same build.'},
 shots:'reports/v057-rocket-muzzle.json',screenshots:['right','right-flight','left','left-flight'].map(s=>'reports/v057-up-rocket-'+s+'.png'),
 web,wechat,priorBaseline:{report:'reports/v057-verification.json',browserFullSuiteRerun:false,browserFullCampaignRerun:false},
 limitations:['Complete supplied soldier stays in its painted pose; rocket exits the tube before steering to upward input. No new high-angle soldier artwork.',
  'No WeChat developer-tools/physical-device verification, upload or publication.']};
writeFileSync('reports/v057-muzzle-verification.json',JSON.stringify(result,null,2));writeFileSync('reports/verification.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
