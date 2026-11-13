const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{PNG}=require('pngjs');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {GameSession}=load('core/GameSession'),{GameConfig:C}=load('core/GameConfig');
const {EnemyController}=load('enemy/EnemyController'),{TankBoss}=load('enemy/TankBoss'),{moveBoss}=load('enemy/BossMotion');
const {LevelController}=load('level/LevelController'),{PlayerController}=load('player/PlayerController');
const {ProjectileManager}=load('combat/ProjectileManager'),{ParticlePool}=load('combat/ParticlePool');
const {BossFrames,BossSockets,RhinoScale,ColossusScale}=load('render/BossFrames');
const {tankPresentation,tankSocket}=load('render/TankPresentation'),{colossusPresentation}=load('render/ColossusPresentation');
const {drawnGroundTiles}=load('render/LandDrawnPlan');
const dt=1/120;
function tankScene(){const l=new LevelController(),p=new PlayerController(),q=new ProjectileManager(new ParticlePool()),b=new TankBoss({id:'mini',kind:'guard',x:1000,y:150,health:42,encounter:'mini'});l.objects.reset([]);l.staticSolids.splice(0,l.staticSolids.length,{x:0,y:0,w:2200,h:150,kind:'ground'});l.refreshSolids();p.reset(700,150);return {l,p,q,b};}

test('every ordinary land soldier dies on precisely the third rifle hit, or one knife/rocket hit from either side',()=>{
 for(const kind of ['melee','ranged','turret'])for(const direction of [-1,1]){
  const make=()=>new EnemyController({id:'target',kind,x:400,y:150});
  const e=make();for(let n=1;n<=3;n++){e.takeDamage(C.weapons.rifle.damage,direction,'bullet');assert.equal(e.alive,n<3,`${kind}/${direction}/${n}`);}
  for(const [amount,type] of [[C.melee.damage,'melee'],[C.weapons.rocket.damage,'explosion']]){const target=make();target.takeDamage(amount,direction,type);assert.equal(target.alive,false,`${kind}/${type}`);}
 }
 const s=new GameSession();s.reset();assert.ok(s.spawner.enemies.filter(e=>!['guard','colossus','shield'].includes(e.kind)).every(e=>e.health===3));
});

test('tank cycles four telegraphed attacks and its committed ram damages a stationary target but can be cleared above the hull',()=>{
 const f=tankScene(),seen=new Set();f.p.y=400;
 for(let n=0;n<120*20;n++){f.p.x=f.b.x-270;f.b.update(dt,f.p,f.l,f.q);if(f.b.windup>0)seen.add(f.b.attack);}
 assert.equal(seen.size,4);for(const [name,count]of Object.entries(f.b.attackCounts))assert.ok(count>0,name);
 for(const airborne of [false,true]){
  const f=tankScene();Object.assign(f.b,{active:true,mode:'ramming',ramTime:.85,ramEndX:745,facing:-1});f.p.y=airborne?270:150;
  for(let n=0;n<102;n++)f.b.update(dt,f.p,f.l,f.q);
  assert.ok(f.b.x<800);assert.equal(f.p.health,airborne?5:4);assert.equal(f.b.mode,'recovering');assert.ok(f.b.attackCooldown>0.4);
 }
});

test('boss movement sweeps against real walls, uses actual displacement for stride, and retains grounded feet',()=>{
 const f=tankScene();f.l.staticSolids.push({x:800,y:150,w:40,h:220,kind:'step'});f.l.objects.reset([]);f.l.refreshSolids();
 for(let n=0;n<180;n++)moveBoss(f.b,f.l,dt,-300,0,2200,94);
 assert.ok(Math.abs(f.b.x-(840+f.b.halfWidth))<.01);assert.equal(f.b.y,150);assert.ok(f.b.grounded);assert.ok(Math.abs(f.b.stride-(1000-f.b.x)/94)<.001);
});

test('rocket blast damages heavy bosses without infantry knockback or airborne/frozen tanks',()=>{
 const s=new GameSession();s.reset();
 for(const b of [s.spawner.miniBoss,s.spawner.guard]){
  b.active=true;b.grounded=true;const health=b.health,x=b.x,y=b.y;
  s.applyBlast(x,y+40,160,9,'player');assert.ok(b.health<health);assert.equal(b.vy,0);assert.equal(b.vx,0);assert.ok(b.grounded);
 }
});

test('colossus advances and retreats through four full walking poses without moving locked warnings or beams',()=>{
 const s=new GameSession();s.reset();s.level.arenaEntered=true;s.player.reset(s.spawner.guard.x-580,150);
 const b=s.spawner.guard,frames=new Set(),xs=new Set();let locked;
 for(let n=0;n<120*23;n++){
  b.update(dt,s.player,s.level,s.projectiles);s.player.invincible=1;
  if(b.mode==='moving'){xs.add(Math.round(b.x));frames.add(colossusPresentation(b).id);assert.equal(b.windup,0);assert.equal(b.beam.active,false);}
  if(b.windup>0||b.beam.active){if(locked&&locked.attack===b.attack)assert.equal(b.x,locked.x);locked={attack:b.attack,x:b.x};}else locked=undefined;
 }
 assert.ok(b.movementTurns>=3);assert.ok(xs.size>40);assert.equal([...frames].filter(id=>id.startsWith('colossus.walk.')).length,4);
});

test('new whole-pose atlases retain original opaque pixels and source-pixel foot/muzzle anchors',()=>{
 const m=JSON.parse(fs.readFileSync('../开发进度/验证记录/v101-art.json')),p=PNG.sync.read(fs.readFileSync('assets/landart/boss-v088.png'));
 const originals={};for(const r of m.records.filter(r=>r.id.startsWith('rhino.')||r.id.startsWith('colossus.'))){
  // Historical reports retain their original paths; resolve the relocated art without rewriting evidence.
  const source=r.source.replace(/^art\//,'../素材/游戏美术/');
  const src=originals[r.source]??=PNG.sync.read(fs.readFileSync(source)),[l,t,right,bottom]=r.crop,[x,y,w,h]=r.region;
  assert.equal(w,right-l);assert.equal(h,bottom-t);assert.ok(r.opaqueWhite>500);
  for(let row=0;row<h;row++)assert.ok(p.data.subarray(((y+row)*p.width+x)*4,((y+row)*p.width+x+w)*4).equals(src.data.subarray(((t+row)*src.width+l)*4,((t+row)*src.width+right)*4)),r.id);
 }
 assert.equal(Object.keys(BossFrames).filter(id=>id.startsWith('rhino.')).length,8);
 assert.equal(Object.keys(BossFrames).filter(id=>id.startsWith('colossus.')).length,12);
 const terrain=PNG.sync.read(fs.readFileSync('assets/landart/terrain-v088.png'));
 for(const r of JSON.parse(fs.readFileSync('../开发进度/验证记录/v088-art.json')).records.filter(r=>r.id.startsWith('terrain088.'))){
  const [x,y,w,h]=r.region;
  for(let row=0;row<h;row++)for(const [outside,inside] of [[x-2,x],[x-1,x],[x+w,x+w-1],[x+w+1,x+w-1]]){
   const a=((y+row)*terrain.width+outside)*4,b=((y+row)*terrain.width+inside)*4;
   assert.ok(terrain.data.subarray(a,a+4).equals(terrain.data.subarray(b,b+4)),r.id+' filtered edge');
  }
 }
 for(const action of ['bombard','ram-tell','ram']){
  const a={x:1000,y:150,facing:-1,animation:'Idle',animationTime:0,deadTime:0,recoil:0,action};
  const view=tankPresentation(a),left=tankSocket(a),right=tankSocket({...a,facing:1});
  assert.equal(view.scale,RhinoScale);assert.equal(left.x+right.x,2000);assert.equal(left.y,right.y);assert.equal(left.y,150+BossSockets[view.id].muzzle[1]*RhinoScale);
 }
});

// Sample source coordinates in a rendered tile, including mirror transforms.
function pixelAt(tiles,x,y,id){const t=tiles.find(t=>t.id===id&&x>=t.x&&x<t.x+t.crop[2]*t.scale&&y>=t.y&&y<t.y+t.crop[3]*t.scale);assert.ok(t);return [t.crop[0]+(t.mirrorX?t.crop[2]-(x-t.x)/t.scale:(x-t.x)/t.scale),t.crop[1]+(t.mirrorY?(y-t.y)/t.scale:t.crop[3]-(y-t.y)/t.scale)];}
test('ground texture phase is invariant under arbitrary solid splits, material changes and road height changes',()=>{
 const whole=drawnGroundTiles([{x:-800,w:2300,top:150}]),split=drawnGroundTiles([{x:-800,w:1173,top:150},{x:373,w:1127,top:168}]);
 for(const x of [-600,0,371,374,447,449,900,1400])for(const y of [-230,-1,1,80]){
  const a=pixelAt(whole,x,y,'unified.fill'),b=pixelAt(split,x,y,'unified.fill');for(let k=0;k<2;k++)assert.ok(Math.abs(a[k]-b[k])<1e-7,`${x}/${y}`);
 }
});
