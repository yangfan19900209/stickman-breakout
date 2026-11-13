const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {PNG}=require('pngjs');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {OceanSession}=load('ocean/OceanSession'),{OceanLevel:L}=load('ocean/OceanLevel');
const {StaticRectIndex}=load('core/StaticRectIndex'),{overlaps}=load('core/Types');
const {oceanHeldPose,oceanMuzzle}=load('ocean/OceanPose');
const {oceanReticleStyle,oceanShotProfile}=load('ocean/OceanCombatTuning');
const {OceanUpdateFrames,OceanUpdateRegions}=load('ocean/OceanUpdateFrames');
const {oceanFishBounds}=load('ocean/OceanFish');
const {SwimNavigation}=load('ocean/SwimNavigation');
const dt=1/120;
function scene(){const s=new OceanSession();s.finishEntry();s.player.x=1100;s.player.y=350;s.camera.x=700;s.camera.visibleWidth=1400;s.crates=[];for(const e of s.enemies)e.hp=0;return s;}

test('a completely blocked swimming route caches failure instead of repeating a full search every frame',()=>{
 const nav=new SwimNavigation(),start={x:1100,y:100},goal={x:1400,y:100};
 const solids=[{x:1150,y:70,w:60,h:610},{x:990,y:70,w:60,h:610}];
 let searches=0;const search=nav.findRoute.bind(nav);nav.findRoute=(...args)=>{searches++;return search(...args);};
 for(let i=0;i<60;i++)nav.next(start,goal,48,100,solids,100,100,i/120);
 assert.equal(searches,1);
 nav.next(start,goal,48,100,solids,100,100,.7);assert.equal(searches,2);
});

test('mini hull pursues beyond its former home clamp and routes above the real wreck wall without penetration',()=>{
 for(const [px,py] of [[6900,370],[5100,105]]){
  const s=scene(),e=s.mini;Object.assign(e,{x:5860,y:py,hp:84,mode:'rest',timer:100,active:true});
  s.player.x=px;s.player.y=py;let travel=0,maxY=e.y;
  for(let i=0;i<120*16;i++){
   const x=e.x,y=e.y;s.time+=dt;s.updateEnemy(e,dt);travel+=Math.hypot(e.x-x,e.y-y);maxY=Math.max(maxY,e.y);
   assert.ok(!L.obstacles.some(r=>overlaps({x:e.x-96,y:e.y,w:192,h:124},r)),`hull overlaps at ${e.x},${e.y}`);
   assert.ok(Math.hypot(e.x-x,e.y-y)<2,'movement never teleports');
  }
  assert.ok(travel>450);assert.ok(Math.abs(e.x-px)<440,`${px}: ${e.x},${e.y}`);
  if(px<5860){assert.ok(maxY>250);assert.ok(e.x<5360);}
  else assert.ok(e.x>e.homeX+430);
 }
});

test('fish bite uses its enlarged swept body in both horizontal and diagonal directions, with a real escape lane',()=>{
 for(const direction of [-1,1])for(const dy of [-130,0,130])for(const dodge of [false,true]){
  const s=scene();s.terrainIndex=new StaticRectIndex([]);s.player.x=3000;s.player.y=330;
  const e=s.enemies.find(e=>e.kind==='fish');
  Object.assign(e,{x:3000+direction*380,y:330+dy,homeX:3000+direction*380,homeY:330+dy,hp:3,active:true,mode:'tell',attack:'dash',locked:true,timer:0,angle:Math.atan2(-dy+3,-direction*380)});
  s.updateEnemy(e,dt);
  if(dodge)s.player.y=dy<0?540:100;
  for(let i=0;i<100;i++)s.updateEnemy(e,dt);
  assert.equal(s.player.health,dodge?5:4,JSON.stringify({direction,dy,dodge,e}));
  assert.equal(s.player.health>=4,true,'one pass cannot repeat damage');
 }
});

test('fish cannot bite through a wall and its hit box covers the visible trunk',()=>{
 const s=scene(),e=s.enemies.find(e=>e.kind==='fish');s.terrainIndex=new StaticRectIndex([{x:1250,y:70,w:40,h:610}]);
 Object.assign(e,{x:1470,y:350,hp:3,homeX:1470,active:true,mode:'attack',attack:'dash',vx:-625,vy:0,angle:Math.PI,timer:1});
 const b=oceanFishBounds(e);assert.ok(b.w>=110&&b.h>=48);
 for(let i=0;i<100;i++)s.updateEnemy(e,dt);
 assert.equal(s.player.health,5);assert.ok(e.x>=1290+57-.01);
});

test('moving fire keeps complete alternating leg poses and the same measured muzzle for every ranged weapon',()=>{
 for(const weapon of ['harpoon','sonar','torpedo'])for(const aim of [0,Math.PI,.7,2.4]){
  const frames=new Set();
  for(let i=0;i<12;i++){
   const pose=oceanHeldPose(weapon,i/24,280,false);frames.add(pose.frame);
   assert.match(pose.frame,new RegExp(`diver.${weapon}.swim`));
   const m=oceanMuzzle(3000,330,aim,weapon,pose,.8);
   assert.ok(Number.isFinite(m.x)&&Number.isFinite(m.y));
   const s=scene();s.player.x=3000;s.player.y=330;s.player.vx=280;s.player.animationTime=i/24;
   s.weapon=weapon;s.ammo=10;s.aim=aim;s.firePlayer();
   const shot=s.projectiles.find(p=>p.active);assert.ok(shot);assert.deepEqual({x:shot.x,y:shot.y},s.muzzle());
  }
  assert.ok(frames.size>=2,`${weapon} legs frozen`);
 }
});

test('reticle opens wider and settles to fine lines at a fixed screen size across zooms',()=>{
 for(const zoom of [.5,1,1.5]){
  const first=oceanReticleStyle(0,true,zoom),last=oceanReticleStyle(1,true,zoom);
  assert.equal(first.radius*zoom,74);assert.equal(last.radius*zoom,18);
  assert.ok(last.line*zoom<=1.21);assert.ok(first.radius>last.radius*4);
 }
});

test('boss cannon uses heavy explosive shells and its full attack cycle never emits ordinary harpoons',()=>{
 const s=scene(),b=s.boss;s.player.x=15300;b.active=true;b.timer=0;
 const kinds=new Set();
 for(let i=0;i<120*30;i++){
  s.updateBoss(dt);s.player.x=b.x-500;
  for(const shot of s.projectiles)if(shot.active){kinds.add(shot.kind);assert.equal(shot.tier,'boss');shot.active=false;}
 }
 assert.deepEqual([...kinds].sort(),['bomb','sonar','torpedo']);
 const profile=oceanShotProfile('bomb','boss');assert.ok(profile.width>=64&&profile.radius>=20);
 const t=scene();t.terrainIndex=new StaticRectIndex([]);
 t.spawnShot('enemy','bomb',1350,385,-320,0,1,4,'boss');
 for(let i=0;i<120;i++){t.updateShots(dt);t.flushBlasts();}
 assert.equal(t.player.health,4);assert.equal(t.blastCount,1);
});

test('all new complete sprites have alpha, intact margins and packed regions; different swim IDs contain different pixels',()=>{
 const p=PNG.sync.read(fs.readFileSync('assets/level02/ocean-v105.png')),hashes=new Set();
 assert.equal(Object.keys(OceanUpdateFrames).length,10);
 for(const [id,d] of Object.entries(OceanUpdateFrames)){
  const [x,y,w,h]=OceanUpdateRegions[id];assert.ok(x>0&&y>0&&x+w<p.width&&y+h<p.height);
  const s=PNG.sync.read(fs.readFileSync(d.source));assert.deepEqual([s.width,s.height],d.sourceSize);
  assert.ok(s.data.some((v,i)=>i%4===3&&v===0));assert.ok(s.data.some((v,i)=>i%4===3&&v>=250));
  if(id.startsWith('diver.sonar.swim'))hashes.add(d.sha256);
 }
 assert.equal(hashes.size,4);
});
