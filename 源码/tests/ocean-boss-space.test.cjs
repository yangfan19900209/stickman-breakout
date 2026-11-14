const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {OceanSession}=load('ocean/OceanSession'),{OceanLevel:L}=load('ocean/OceanLevel');
const {StaticRectIndex}=load('core/StaticRectIndex');
const dt=1/120;
test('the submarine has 140 HP, no expanding arc, retained laser attacks and shorter recoveries in every phase',()=>{
 for(const [hp,rest] of [[140,.35],[80,.28],[40,.22]]){
  const s=new OceanSession();s.finishEntry();const b=s.boss;s.player.x=15500;b.active=true;b.hp=hp;
  const seen=new Set();let recovering=0;
  for(let n=0;n<120*35;n++){
   const old=b.mode;s.updateBoss(dt);s.player.x=b.x-530;
   if(b.mode==='tell'){seen.add(b.attack);assert.ok(b.tellDuration>=1);}
   if(old==='fire'&&b.mode==='rest'){assert.equal(b.timer,rest);recovering++;}
   for(const p of s.projectiles)p.active=false;
  }
  assert.deepEqual([...seen].sort(),['cannon','fan','laser','sweep','torpedo']);assert.ok(recovering>=9);
  assert.equal(b.maxHp,140);assert.equal(b.attackCounts.ring,undefined);assert.equal(b.ringRadius,0);
 }
});
test('two three-shot sonar volleys leave the same usable gap in all phases, while standing in a lane is hit',()=>{
 for(const phase of [1,2,3])for(const gap of [false,true]){
  const s=new OceanSession();s.finishEntry();s.terrainIndex=new StaticRectIndex([]);s.crates=[];for(const e of s.enemies)e.hp=0;
  const b=s.boss;Object.assign(b,{active:true,phase,mode:'fire',attack:'fan',angle:Math.PI,volleyRemaining:2,volleyIndex:0});
  const o=s.bossOrigin(),angle=Math.PI+(gap?.24:0);
  s.player.x=o.x+Math.cos(angle)*360;s.player.y=o.y+Math.sin(angle)*360-35;
  s.fireBossVolley();const shots=s.projectiles.filter(p=>p.active);assert.equal(shots.length,3);assert.equal(b.volleyTimer,.75);
  const directions=shots.map(p=>Math.atan2(p.vy,p.vx));
  for(let n=0;n<120*2.5;n++){
   if(n===90){s.fireBossVolley();assert.deepEqual(s.projectiles.filter(p=>p.active).slice(3).map(p=>Math.atan2(p.vy,p.vx)),directions);}
   s.updateShots(dt);s.flushBlasts();
  }
  assert.equal(b.volleyCount,2);assert.equal(s.player.health,gap?5:4,`phase ${phase}, gap ${gap}`);
 }
});
test('the submarine prep medkit is collected by swimming before the mini boss can activate',()=>{
 const s=new OceanSession();s.finishEntry();const point=L.recovery.find(p=>p.id==='captain-prep');
 s.player.x=point.x-170;s.player.y=350;s.player.health=3;
 for(const e of s.enemies)if(e.kind!=='captain')e.hp=0;
 for(let n=0;n<240&&s.player.health<5;n++){
  s.update(dt,{axis:1,vertical:0,shoot:false,jump:false});assert.equal(s.mini.active,false);
 }
 assert.equal(s.player.health,5);assert.ok(s.player.x<s.mini.homeX-820);
 assert.ok(s.recoveryUsed.has('captain-prep'));assert.equal(s.drops.filter(d=>d.source==='captain-prep').length,1);
});
