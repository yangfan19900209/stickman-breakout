const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {OceanSession}=load('ocean/OceanSession'),{FlightSession}=load('flight/FlightSession');
const {oceanGunOrigin,oceanGunTransform}=load('ocean/OceanPose');
const {StaticRectIndex}=load('core/StaticRectIndex');
const dt=1/120,idle={axis:0,vertical:0,jump:false,shoot:false};
function sea(){const s=new OceanSession();s.finishEntry();s.player.x=1100;s.player.y=350;s.enemies.forEach(e=>e.hp=0);s.crates=[];s.terrainIndex=new StaticRectIndex([]);return s;}
function sky(){const s=new FlightSession();s.finishEntry();s.player.x=600;s.player.y=300;s.enemies.forEach(e=>e.hp=0);return s;}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('water gun, recoil and projectile nose use the same painted socket for every weapon and direction',()=>{
 for(const weapon of ['harpoon','sonar','torpedo'])for(const aim of [0,.7,Math.PI/2,Math.PI,3.8,-Math.PI/2])for(const speed of [0,280]){
  const s=sea();s.weapon=weapon;s.ammo=3;s.aim=aim;s.player.vx=speed;s.player.animationTime=.37;
  const pose=s.heldPose(),before=s.muzzle(),x=s.player.x,y=s.player.y;s.firePlayer();const q=s.projectiles.find(p=>p.active);assert.ok(q);
  const m=s.muzzle(),o=oceanGunOrigin(x,y,aim,1,weapon),t=oceanGunTransform(aim),dx=(pose.muzzle[0]-pose.pivot[0])*pose.scale*t.flip,dy=(pose.pivot[1]-pose.muzzle[1])*pose.scale;
  near(m.x,o.x+dx*Math.cos(t.angle)-dy*Math.sin(t.angle));near(m.y,o.y+dx*Math.sin(t.angle)+dy*Math.cos(t.angle));
  near(q.x,m.x);near(q.y,m.y);near((before.x-m.x)*Math.sin(aim)-(before.y-m.y)*Math.cos(aim),0);
  assert.ok(Math.hypot(before.x-m.x,before.y-m.y)>=4-1e-7);near(s.player.x,x);near(s.player.y,y);
  near(q.vx/Math.hypot(q.vx,q.vy),Math.cos(aim));near(q.vy/Math.hypot(q.vx,q.vy),Math.sin(aim));
 }
});
test('water flash survives maximum frame catch-up and recovers without slowing swimming',()=>{
 const a=sea(),b=sea();a.firePlayer();for(let n=0;n<12;n++){a.update(dt,{...idle,axis:1,vertical:.3});b.update(dt,{...idle,axis:1,vertical:.3});}
 assert.ok(a.player.recoil>.28);near(a.player.x,b.player.x);near(a.player.y,b.player.y);
 for(let n=0;n<12;n++)a.update(dt,idle);assert.equal(a.player.recoil,0);
});
test('water last round keeps its firing weapon through recovery and manual knife switch clears it',()=>{
 for(const weapon of ['sonar','torpedo']){const s=sea();s.weapon=weapon;s.ammo=1;s.firePlayer();assert.equal(s.weapon,'harpoon');assert.equal(s.heldWeapon,weapon);assert.deepEqual(s.muzzle(),{x:s.lastShotMuzzle.x,y:s.lastShotMuzzle.y});
  s.update(dt,{...idle,switchWeapon:true});assert.equal(s.heldWeapon,'knife');assert.equal(s.player.recoil,0);
 }
});
test('water pool reuse resets emergence distance and all projectile families accumulate true travel',()=>{
 const s=sea();for(const kind of ['harpoon','sonar','torpedo','bomb'])for(const owner of ['player','enemy']){
  const q=s.spawnShot(owner,kind,1600,400,120,160,1,2);assert.equal(q.distance,0);s.updateShots(.05);assert.ok(q.distance>0);near(q.distance,Math.hypot(q.x-1600,q.y-400));if(kind!=='bomb')near(q.distance,10);q.active=false;
 }
});
test('water failed fire does not consume ammo or play a false kick; nearby walls still prevent muzzle bypass',()=>{
 const s=sea();for(const q of s.projectiles)q.active=true;s.weapon='torpedo';s.ammo=2;s.firePlayer();assert.equal(s.shots,0);assert.equal(s.player.recoil,0);assert.equal(s.ammo,2);
 s.projectiles.forEach(q=>q.active=false);s.terrainIndex=new StaticRectIndex([{x:1110,y:340,w:5,h:130}]);s.firePlayer();assert.ok(!s.projectiles.some(q=>q.active));
});
test('flight recoil moves only the painted gun origin and shares its ray with both weapon types',()=>{
 for(const weapon of ['rifle','rocket'])for(const aim of [0,.7,Math.PI/2,Math.PI,3.8,-Math.PI/2]){
  const s=sky();s.weapon=weapon;s.ammo=4;s.aim=aim;const before=s.muzzle(),x=s.player.x,y=s.player.y;s.firePlayer();const q=s.projectiles.items.find(p=>p.active),m=s.muzzle();assert.ok(q);
  near(q.x,m.x);near(q.y,m.y);near(q.vx/Math.hypot(q.vx,q.vy),Math.cos(aim));near(q.vy/Math.hypot(q.vx,q.vy),Math.sin(aim));
  near(Math.hypot(m.x-before.x,m.y-before.y),weapon==='rocket'?7:4);near(s.player.x,x);near(s.player.y,y);assert.equal(s.effects.length,0,'muzzle is attached, never a world-space effect');
 }
});
test('flight last rocket retains its gun during flash; moving/reversing tracks the current gun',()=>{
 const s=sky();s.weapon='rocket';s.ammo=1;s.firePlayer();const first=s.muzzle();assert.equal(s.weapon,'rifle');assert.equal(s.heldWeapon,'rocket');near(first.x,s.lastShotMuzzle.x);
 s.player.x+=40;s.player.y+=70;s.aim=Math.PI;const next=s.muzzle();near(next.x,s.player.x-51);near(next.y,s.player.y+44);assert.notDeepEqual(next,first);
 for(let n=0;n<12;n++)s.update(dt,{...idle,axis:1});assert.ok(s.player.recoil>.28);
 s.update(dt,{...idle,switchWeapon:true});assert.equal(s.heldWeapon,'knife');assert.equal(s.player.recoil,0);
});
test('flight enemy flashes retain the fired missile port and never create a stale world effect',()=>{
 const s=sky(),e=s.boss;e.hp=64;e.active=true;e.mode='fire';e.attack='missiles';e.shotsLeft=1;e.angle=Math.PI;
 s.fireEnemy(e);assert.equal(e.muzzleFlash,.12);assert.equal(e.flashPort,1);assert.equal(e.flashMissile,true);assert.equal(s.effects.length,0);
 const m=s.enemyMuzzle(e,1,true),q=s.projectiles.items.find(p=>p.active);near(q.x,m.x);near(q.y,m.y);e.fireClock=1;s.updateEnemies(.05);assert.ok(e.muzzleFlash>0&&e.muzzleFlash<.12);
});
test('flight fire cadence and empty pool do not create extra shots or false animation',()=>{
 const s=sky();for(let n=0;n<120;n++)s.update(dt,{...idle,shoot:true});assert.equal(s.shots,5);
 s.player.recoil=0;s.projectiles.items.forEach(p=>p.active=true);const old=s.shots;s.firePlayer();assert.equal(s.shots,old);assert.equal(s.player.recoil,0);
});
