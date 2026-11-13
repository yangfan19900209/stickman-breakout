const {test}=require('node:test'),assert=require('node:assert/strict');
const {OceanSession}=require('../.test-build/assets/scripts/ocean/OceanSession.js');
const {OceanLevel:L}=require('../.test-build/assets/scripts/ocean/OceanLevel.js');
const idle={axis:0,vertical:0,jump:false,shoot:false};
test('no-input opening walks, equips and dives continuously at multiple frame rates before enabling combat',()=>{
 for(const hz of [30,60,120]){
  const s=new OceanSession(),phases=new Set(),chest=new Set();let splash=0;
  for(let n=0;n<hz*9&&s.stage!=='swimming';n++){
   assert.equal(s.controlEnabled,false);phases.add(s.snapshot().entryPhase);chest.add(s.snapshot().chest.phase);
   s.update(1/hz,idle);splash=Math.max(splash,s.effects.filter(f=>f.kind==='splash').length);
   assert.equal(s.player.health,5);assert.equal(s.shots,0);assert.equal(s.player.grenades,3);
   assert.equal(s.enemies.filter(e=>e.active).length,0);
  }
  assert.equal(s.stage,'swimming');assert.ok(s.time>8&&s.time<8.2);assert.equal(splash,1);
  assert.deepEqual([...phases],['approach','reach','open','take','mask','tank','ready','walk','dive']);
  assert.deepEqual([...chest],[0,1,2]);assert.equal(s.controlEnabled,true);assert.equal(s.introActive,false);
  assert.equal(s.player.x,L.swimSpawn.x);assert.equal(s.player.y,L.swimSpawn.y);assert.equal(s.player.vx,0);assert.equal(s.player.vy,0);
 }
});
test('steering and combat input cannot interrupt, spend equipment or change the automatic opening',()=>{
 const a=new OceanSession(),b=new OceanSession();
 while(a.stage!=='swimming'){
  a.update(1/120,idle);b.update(1/120,{axis:-1,vertical:1,jump:true,shoot:true,grenade:true,switchWeapon:true});
  assert.deepEqual(b.snapshot(),a.snapshot());
 }
});
test('each opening phase pauses exactly, and replay can skip from the initial shore to the same equipped spawn',()=>{
 const s=new OceanSession();const seen=new Set();
 while(s.stage!=='swimming'){
  const phase=s.snapshot().entryPhase;
  if(!seen.has(phase)){seen.add(phase);s.pause();const before=s.snapshot();s.update(2,idle);assert.deepEqual(s.snapshot(),before);s.resume();}
  s.update(1/120,idle);
 }
 const expected={...s.snapshot().player};s.reset();assert.equal(s.stage,'shore');assert.equal(s.introSeen,true);
 s.skipEntry();assert.equal(s.stage,'swimming');assert.deepEqual(s.snapshot().player,expected);
 s.reset();s.update(.1,idle);assert.ok(s.player.x>L.spawn.x);assert.equal(s.introActive,true);
});
