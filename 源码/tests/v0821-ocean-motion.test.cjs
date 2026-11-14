const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {OceanSession}=load('ocean/OceanSession'),{InputManager}=load('core/InputManager');
const {OceanLevel:L}=load('ocean/OceanLevel'),{StaticRectIndex}=load('core/StaticRectIndex');
const dt=1/120,idle={axis:0,vertical:0,jump:false,shoot:false};
function scene(){const s=new OceanSession();s.finishEntry();s.player.x=1100;s.player.y=350;s.camera.x=700;s.camera.visibleWidth=1400;s.crates=[];for(const e of s.enemies){e.hp=0;e.deadTime=3;}return s;}
function target(s,kind='diver'){const e=s.enemies.find(e=>e.kind===kind);Object.assign(e,{x:1450,y:350,homeX:1450,homeY:350,hp:3,maxHp:3,shieldHp:0,active:true,mode:'rest',timer:100,dodgeCooldown:100,deadTime:0});return e;}

test('swim input retains full radial speed through diagonal/down sectors, with or without firing',()=>{
 for(const shoot of [false,true])for(const angle of [0,45,60,65,90,135,180,225,270,300]){
  const s=scene(),i=new InputManager();s.terrainIndex=new StaticRectIndex([]);s.player.x=3000;s.player.y=350;
  const a=angle*Math.PI/180;i.joystick.start(1,Math.cos(a)*i.joystick.radius,Math.sin(a)*i.joystick.radius);
  if(shoot)i.press('finger:2','shoot');
  for(let n=0;n<60;n++){const f=i.consume('swim');assert.equal(f.crouch,false);s.update(dt,f);assert.equal(s.hitStop,0);}
  assert.ok(Math.hypot(s.player.vx,s.player.vy)>279,angle);assert.equal(s.player.health,5);
  i.joystick.end(1);i.release('finger:2');for(let n=0;n<40;n++)s.update(dt,i.consume('swim'));
  assert.ok(Math.hypot(s.player.vx,s.player.vy)<.5);
 }
});

test('swimming through actual harpoon hits and a kill never stalls the world clock or drops speed',()=>{
 const s=scene(),e=target(s);let contacts=0,reacted=false;
 for(let n=0;n<240&&e.hp>0;n++){
  const hits=s.hits;s.update(dt,{...idle,axis:1,shoot:true});assert.equal(s.hitStop,0);
  if(s.hits>hits){contacts++;reacted ||= e.hit>0;assert.ok(s.player.vx>260);}
 }
 assert.equal(contacts,3);assert.equal(e.hp,0);assert.ok(reacted);assert.ok(s.effects.some(f=>f.kind==='blast'));assert.equal(s.player.health,5);
});

test('sonar, torpedo and swimming knife contacts retain damage/impact without global pauses',()=>{
 for(const weapon of ['sonar','torpedo','knife']){
  const s=scene(),e=target(s);s.weapon=weapon;s.ammo=10;
  if(weapon==='knife'){e.x=e.homeX=1180;}
  let damaged=false;
  for(let n=0;n<150&&e.hp>0;n++){s.update(dt,{...idle,axis:1,shoot:true});assert.equal(s.hitStop,0);damaged ||= e.hp<3;}
  assert.ok(damaged,weapon);assert.equal(e.hp,0,weapon);assert.ok(s.kills>0);assert.equal(s.player.health,5);
 }
});

test('nearby and distant grenade/mine chain bursts do not brake a healthy swimmer',()=>{
 for(const x of [1350,7000]){
  const s=scene(),mine=target(s,'mine');Object.assign(mine,{x,y:350,homeX:x,hp:2,maxHp:2});
  s.player.vx=280;s.blastQueue.push({x,y:380,r:150,damage:9,owner:'player'});const start=s.player.x;
  for(let n=0;n<30;n++){s.update(dt,{...idle,axis:1});assert.equal(s.hitStop,0);}
  assert.equal(mine.hp,0);assert.ok(s.blastCount>=2);assert.ok(Math.abs(s.player.x-start-70)<1e-6);assert.equal(s.player.health,5);
 }
});

test('mini-sub death chain and submarine module destruction keep swimming responsive',()=>{
 const s=scene(),e=target(s,'captain');s.damageEnemy(e,3);
 s.boss.active=true;s.boss.x=1700;s.boss.y=350;s.damageBoss(40,1461,380,'cannonHp');
 s.player.vx=280;const start=s.player.x;
 for(let n=0;n<72;n++){s.update(dt,{...idle,axis:1});assert.equal(s.hitStop,0);}
 assert.equal(s.boss.cannonHp,0);assert.equal(e.hp,0);assert.ok(s.effects.some(f=>f.kind==='blast'));assert.ok(s.player.x-start>160);
});

test('actual player damage still pauses briefly even beside simultaneous remote impact; invulnerability does not retrigger it',()=>{
 const s=scene();target(s);s.blastQueue.push({x:1450,y:380,r:100,damage:1,owner:'player'},{x:1100,y:385,r:80,damage:1,owner:'enemy'});
 s.update(dt,{...idle,axis:1});assert.equal(s.player.health,4);assert.ok(s.player.hitTime>0);assert.ok(s.hitStop>0&&s.hitStop<.08);
 s.hitStop=0;s.blastQueue.push({x:1100,y:385,r:80,damage:1,owner:'enemy'});s.update(dt,idle);
 assert.equal(s.player.health,4);assert.equal(s.hitStop,0);s.reset();assert.equal(s.hitStop,0);
});

test('authored currents and tangent collision keep their intended movement without extra hit pauses',()=>{
 const s=scene();s.terrainIndex=new StaticRectIndex([]);const c=L.currents[1];s.player.x=c.x+100;s.player.y=c.y+20;s.player.vx=280;
 const x=s.player.x,y=s.player.y;s.update(dt,{...idle,axis:1});assert.ok(Math.abs(s.player.x-x-(280+c.vx)*dt)<1e-6);assert.ok(Math.abs(s.player.y-y-c.vy*dt)<1e-6);
 const tangent=scene();tangent.player.vx=280;tangent.terrainIndex=new StaticRectIndex([{x:1000,y:300,w:600,h:50}]);
 const start=tangent.player.x;for(let n=0;n<60;n++)tangent.update(dt,{...idle,axis:1});assert.ok(Math.abs(tangent.player.x-start-140)<1e-6);assert.equal(tangent.player.y,350);assert.equal(tangent.hitStop,0);
});
