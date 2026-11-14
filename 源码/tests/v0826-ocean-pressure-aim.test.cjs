const {test}=require('node:test'),assert=require('node:assert/strict');
const {OceanSession}=require('../.test-build/assets/scripts/ocean/OceanSession.js');
const {OceanLevel:L}=require('../.test-build/assets/scripts/ocean/OceanLevel.js');
const idle={axis:0,vertical:0,jump:false,shoot:false},dt=1/120;
function sea(){const s=new OceanSession();s.finishEntry();s.player.x=1100;s.player.y=350;s.camera.x=700;s.camera.y=0;s.camera.visibleWidth=1400;s.crates=[];for(const e of s.enemies)e.hp=0;return s;}
function boss(){const s=sea();s.player.x=L.arena+100;s.boss.active=true;s.boss.timer=0;return s;}

test('lock acquisition advances once per target, freezes on pause, and restarts after loss or switching targets',()=>{
 const s=sea(),[a,b]=s.enemies.filter(e=>e.kind==='diver').slice(0,2);
 Object.assign(a,{x:1420,y:350,hp:3,active:true,mode:'rest',timer:100});
 s.updateAim(dt,idle);assert.equal(s.aimIndicator().targetId,a.id);assert.equal(s.aimIndicator().lockAge,0);
 for(let n=0;n<40;n++)s.updateAim(dt,idle);
 assert.ok(s.aimIndicator().lockAge>.28);const age=s.aimLockAge;
 s.pause();s.update(.5,idle);assert.equal(s.aimLockAge,age);s.resume();
 a.hp=0;assert.equal(s.aimIndicator().locked,false);
 Object.assign(b,{x:1400,y:400,hp:3,active:true,mode:'rest',timer:100});
 s.updateAim(.2,idle);assert.equal(s.aimIndicator().targetId,b.id);assert.equal(s.aimIndicator().lockAge,0);
 s.weapon='knife';s.updateAim(dt,idle);assert.equal(s.aimLockAge,0);assert.equal(s.aimIndicator().visible,false);
 s.reset();assert.equal(s.aimLockAge,0);
});

test('submarine tracks early in warning then commits both its hull and aim before firing',()=>{
 const s=boss(),b=s.boss;s.updateBoss(dt);assert.equal(b.mode,'tell');
 const first=b.angle;s.player.y=170;s.updateBoss(.1);assert.notEqual(b.angle,first);
 while(!b.locked)s.updateBoss(dt);
 const angle=b.angle,x=b.x,y=b.y,remaining=b.timer;assert.ok(remaining>=.5);
 s.player.y=530;while(b.mode==='tell')s.updateBoss(dt);
 assert.equal(b.angle,angle);assert.equal(b.x,x);assert.equal(b.y,y);
 assert.ok(s.projectiles.some(p=>p.active));
 s.pause();const frozen={...b};s.update(1,idle);assert.deepEqual(b,frozen);
});

test('attack cursor keeps all five patterns across health phases without reviving destroyed modules',()=>{
 const s=boss(),b=s.boss,seen=[];let last=0;
 for(let n=0;n<120*35;n++){
  s.updateBoss(dt);s.player.x=b.x-550;
  if(b.serial!==last){seen.push(b.attack);last=b.serial;if(seen.length===1)b.hp=b.maxHp*.6;if(seen.length===3)b.hp=b.maxHp*.3;}
  for(const p of s.projectiles)p.active=false;
 }
 assert.deepEqual(seen.slice(0,5),['torpedo','laser','fan','sweep','cannon']);
 b.laserHp=b.torpedoHp=b.cannonHp=0;b.mode='rest';b.timer=0;
 for(let n=0;n<120*12;n++){s.updateBoss(dt);s.player.x=b.x-550;assert.equal(b.mode,'rest');assert.equal(b.beamActive,false);assert.equal(b.volleyRemaining,0);}
 assert.equal(b.hp,b.maxHp*.3);assert.equal(b.maxHp,140);
});

test('boss volleys are staggered, aim remains committed, and breaking the source cancels the follow-up',()=>{
 for(const destroy of [false,true]){
  const s=boss(),b=s.boss;b.hp=b.maxHp*.5;
  while(b.mode!=='fire')s.updateBoss(dt);
  assert.equal(b.attack,'torpedo');const first=s.projectiles.filter(p=>p.active);assert.equal(first.length,3);
  const a=b.angle;s.player.y=520;s.updateBoss(.2);assert.equal(s.projectiles.filter(p=>p.active).length,3);
  if(destroy)s.damageBoss(b.torpedoHp,b.x,b.y,'torpedoHp');
  s.updateBoss(.31);assert.equal(s.projectiles.filter(p=>p.active).length,destroy?3:6);assert.equal(b.angle,a);
  s.reset();assert.equal(s.boss.volleyRemaining,0);assert.equal(s.boss.volleyCount,0);assert.equal(s.boss.locked,false);
 }
});

test('boss pressure never exceeds its live projectile budget even with prior threats',()=>{
 const s=boss(),b=s.boss;b.attack='fan';b.phase=3;b.volleyRemaining=2;
 for(let i=0;i<15;i++)s.spawnShot('enemy','harpoon',15000,350,100,0,1,4);
 s.fireBossVolley();s.fireBossVolley();assert.equal(s.projectiles.filter(p=>p.active&&p.owner==='enemy').length,18);
});

test('boss and mini torpedoes stop steering after the initial chase window',()=>{
 for(const tier of ['mini','boss']){
  const s=sea();s.player.y=500;
  const p=s.spawnShot('enemy','torpedo',1460,380,-250,0,1,4,tier);p.homing=.48;
  s.updateShots(.1);assert.ok(p.vy>0);
  p.age=1.3;const angle=Math.atan2(p.vy,p.vx);s.player.y=100;s.updateShots(.1);
  assert.equal(Math.atan2(p.vy,p.vx),angle);assert.ok(p.active);
 }
});

test('damaged mini submarine adds a delayed twin volley, retaining normal HP and its visible tube sockets',()=>{
 const s=sea(),e=s.mini;Object.assign(e,{x:1450,y:330,hp:29,maxHp:60,active:true,mode:'tell',attack:'torpedo',angle:Math.PI,locked:true,timer:0});
 s.updateMiniSub(e,dt);assert.equal(s.projectiles.filter(p=>p.active).length,2);
 s.updateMiniSub(e,.2);assert.equal(s.projectiles.filter(p=>p.active).length,2);
 s.updateMiniSub(e,.27);assert.equal(s.projectiles.filter(p=>p.active).length,4);
 assert.equal(e.hp,29);assert.equal(e.maxHp,60);assert.equal(e.burstLeft,0);
 s.reset();assert.equal(s.mini.burstLeft,0);assert.equal(s.mini.hp,70);
});
