const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {PNG}=require('pngjs');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {OceanSession}=load('ocean/OceanSession'),{OceanLevel:L}=load('ocean/OceanLevel');
const {StaticRectIndex}=load('core/StaticRectIndex'),{overlaps}=load('core/Types');
const {oceanShotVisual}=load('ocean/OceanEnemyPose');
const {OceanFrames}=load('ocean/OceanFrames'),{OceanSonarRegions}=load('ocean/OceanSonarFrames');
const dt=1/120,idle={axis:0,vertical:0,jump:false,shoot:false};
function sea(){const s=new OceanSession();s.finishEntry();s.player.x=3000;s.player.y=300;
 s.camera.x=2300;s.camera.y=0;s.camera.visibleWidth=1400;s.crates=[];
 s.terrainIndex=new StaticRectIndex([]);for(const e of s.enemies)e.hp=0;return s;}

test('nearby enemies lock in all eight directions for every gun, independent of facing, and shots follow the muzzle ray',()=>{
 for(const weapon of ['harpoon','sonar','torpedo'])for(const facing of [-1,1])for(let i=0;i<8;i++){
  const s=sea(),e=s.enemies.find(e=>e.kind==='diver'),a=i*Math.PI/4;
  s.weapon=weapon;s.storedWeapon=weapon;s.ammo=8;s.player.facing=facing;
  Object.assign(e,{x:3000+200*Math.cos(a),y:306+200*Math.sin(a),hp:3,active:true});
  s.updateAim(dt,idle);const aim=s.aimIndicator();assert.equal(aim.targetId,e.id,`${weapon}/${facing}/${i}`);
  s.firePlayer();const shot=s.projectiles.find(p=>p.active);
  assert.ok(shot);const rayError=Math.abs((aim.x-shot.x)*shot.vy-(aim.y-shot.y)*shot.vx)/Math.hypot(shot.vx,shot.vy);
  assert.ok(rayError<.1,JSON.stringify({weapon,facing,direction:i,rayError}));
  assert.equal(s.player.facing,facing,'locking does not reverse movement');
 }
});

test('omnidirectional lock is bounded and keeps its target until death, occlusion or leaving view',()=>{
 const s=sea(),[a,b]=s.enemies.filter(e=>e.kind==='diver');
 Object.assign(a,{x:2580,y:306,hp:3,active:true});s.updateAim(dt,idle);assert.equal(s.aimTarget,a.id);
 Object.assign(b,{x:3100,y:306,hp:3,active:true});s.updateAim(.3,idle);assert.equal(s.aimTarget,a.id);
 a.x=2579;s.updateAim(.3,idle);assert.equal(s.aimTarget,b.id);
 b.hp=0;s.updateAim(.3,idle);assert.equal(s.aimTarget,'');
 a.x=3600;s.updateAim(.3,idle);assert.equal(s.aimTarget,a.id,'longer forward aim remains available');
 a.x=2750;s.terrainIndex=new StaticRectIndex([{x:2850,y:70,w:30,h:610}]);
 s.updateAim(.3,idle);assert.equal(s.aimTarget,'','no lock through terrain');
 s.terrainIndex=new StaticRectIndex([]);s.camera.x=2900;s.updateAim(.3,idle);assert.equal(s.aimTarget,'','no offscreen lock');
});

test('submarine hull can be acquired and hit from left, right, above and below with real projectiles',()=>{
 for(const [dx,dy] of [[-490,0],[490,0],[0,230],[0,-230]]){
  const s=sea();Object.assign(s.boss,{x:12000,y:350,active:true,torpedoHp:0,laserHp:0,cannonHp:0});
  s.player.x=12000+dx;s.player.y=315+dy;s.camera.x=s.player.x-700;
  s.player.facing=dx>0?1:-1;
  s.updateAim(.2,idle);assert.ok(s.aimTarget,`${dx}/${dy}`);assert.equal(s.aimTarget,'submarine');
  s.firePlayer();for(let n=0;n<120;n++)s.updateShots(dt);
  assert.equal(s.boss.hp,s.boss.maxHp-2,`shot missed hull from ${dx}/${dy}`);
 }
});

test('three growing side-view sonar rings retain alpha, share a region across owners and scale their damage envelope',()=>{
 const v=oceanShotVisual('sonar','player'),r=OceanSonarRegions[v.id],d=OceanFrames[v.id];
 const image=PNG.sync.read(fs.readFileSync(`assets/level02/${d.file}.png`));
 assert.deepEqual(v,oceanShotVisual('sonar','enemy'));assert.equal(v.width,v.height);
 assert.ok(r[2]/r[3]>.9&&r[2]/r[3]<1.1);
 const alpha=(x,y)=>image.data[(Math.floor(y)*image.width+Math.floor(x))*4+3];
 assert.equal(alpha(r[0]+r[2]*.14,r[1]+r[3]/2),0);assert.equal(alpha(0,0),0);
 assert.equal(v.radius,18);assert.ok(v.radius<v.height/2);
 const mini=oceanShotVisual('sonar','enemy','mini');assert.equal(mini.radius/v.radius,mini.width/v.width);
});

test('both boss approaches provide eight torpedoes before activation through the actual break and pickup flow',()=>{
 for(const x of [4190,15000]){
  const s=new OceanSession();s.finishEntry();const c=s.crates.find(c=>c.x===x);assert.equal(c.drop,'torpedo');
  s.player.x=c.x;s.player.y=c.y;s.updateSupplies(.1);s.damageCrate(c,3);s.updateSupplies(.1);
  assert.equal(s.weapon,'torpedo');assert.equal(s.ammo,8);assert.equal(s.storedWeapon,'torpedo');
  assert.ok(x===4190?x<s.mini.x-820:x<L.arena);
  assert.equal(s.mini.active,false);assert.equal(s.boss.active,false);
 }
});

test('the mini arena has a real open crossing lane and retains the approach deck and surrounding terrain',()=>{
 assert.ok(!L.landforms.some(r=>r.x>=4900&&r.x<6400));
 assert.ok(!L.obstacles.some(r=>overlaps(r,{x:4900,y:80,w:1500,h:540})));
 assert.ok(L.landforms.some(r=>r.x===4450));assert.ok(L.landforms.some(r=>Math.abs(r.x+r.w/2-6810)<.01));
 const s=new OceanSession();s.finishEntry();s.player.x=5000;s.player.y=120;
 for(let n=0;n<350;n++)s.moveBody(s.player,4,1,22,66);
 assert.equal(s.player.x,6400);assert.equal(s.player.y,470);
});

test('mini diagonal charge commits before moving, follows both axes and stops against terrain',()=>{
 for(const wall of [false,true]){
  const s=sea(),e=s.mini;Object.assign(e,{x:3350,y:450,hp:84,active:true,mode:'tell',attack:'dive',timer:1,tellDuration:1,locked:false});
  while(!e.locked)s.updateMiniSub(e,dt);const a=e.angle;
  assert.ok(e.timer>.5);s.player.y=500;
  while(e.mode==='tell')s.updateMiniSub(e,dt);
  assert.equal(e.angle,a);const start={x:e.x,y:e.y};
  if(wall)s.terrainIndex=new StaticRectIndex([{x:3100,y:70,w:30,h:610}]);
  for(let n=0;n<100&&e.mode==='attack';n++)s.updateMiniSub(e,dt);
  assert.ok(e.x<start.x-100&&e.y<start.y-50);assert.equal(e.angle,a);
  assert.equal(s.player.health,5,'late dodge escapes the committed diagonal');
  if(wall)assert.ok(e.x>=3226-.01,'full hull stops before the solid wall');
 }
});

test('mini strafe fires three spaced volleys from changing heights and pause/reset clear its movement',()=>{
 const s=sea(),e=s.mini;Object.assign(e,{x:3350,y:330,hp:84,active:true,mode:'tell',attack:'sweep',timer:0,locked:true,angle:Math.PI});
 s.updateMiniSub(e,dt);let shots=s.projectiles.filter(p=>p.active);assert.equal(shots.length,3);
 const y=shots[0].y;s.updateMiniSub(e,.2);assert.equal(s.projectiles.filter(p=>p.active).length,3);
 s.updateMiniSub(e,.21);shots=s.projectiles.filter(p=>p.active);assert.equal(shots.length,6);assert.ok(shots[3].y<y-40);
 s.updateMiniSub(e,.41);assert.equal(s.projectiles.filter(p=>p.active).length,9);
 s.pause();const saved=JSON.stringify(e);s.update(.5,idle);assert.equal(JSON.stringify(e),saved);
 s.reset();assert.equal(s.mini.burstLeft,0);assert.equal(s.mini.vy,0);
});

test('ordinary harpoon and sonar attacks release one committed projectile at every chapter stage',()=>{
 for(const x of [1450,3500,8000])for(const kind of ['harpoon','sonar','torpedo']){
  const s=sea(),e=s.enemies.find(e=>e.kind==='diver');
  Object.assign(e,{x:3350,y:300,homeX:x,hp:3,active:true,mode:'tell',attack:kind,role:kind,locked:true,timer:0,angle:Math.PI});
  s.updateEnemy(e,dt);s.player.y=500;
  for(let n=0;n<70;n++)s.updateEnemy(e,dt);
  const shots=s.projectiles.filter(p=>p.active);assert.equal(shots.length,1,`${x}/${kind}`);
  assert.ok(Math.abs(shots[0].vy)<1e-8,'the single shot stays on the warned direction');
  assert.equal(e.burstLeft,0);assert.equal(e.burstTimer,0);
 }
});
