const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {LevelController}=load('level/LevelController');
const {PlayerController}=load('player/PlayerController');
const {objectPresentation}=load('render/ObjectPresentation');
const {groundDecorClear,drawnGroundTiles}=load('render/LandDrawnPlan');
const {terrainSurface}=load('render/TerrainSurface');
const {segmentRect}=load('core/Types');
const idle={axis:0,jump:false,shoot:false};
const liftFixture=require('./fixtures/lift-level.cjs');

test('fixed scaffold rear supports never block the standing ground route or low shots',()=>{
 const l=new LevelController();l.mechanisms=[];l.objects.reset([]);l.refreshSolids();
 // Independent geometry cases may run in any authored order; rolling campaign
 // progress from a later deck must not constrain the next fixture's spawn.
 l.movePlayer=(body,dt,ignored)=>l.move(body,dt,body.halfWidth,ignored);
 assert.equal(l.staticSolids.filter(s=>s.kind==='support').length,0);
 for(const deck of l.staticSolids.filter(s=>s.supported)){
  assert.equal(deck.oneWay,true);assert.ok([260,266,324,348,354].includes(deck.y+deck.h));
  assert.ok(deck.y-150>=86,'standing and drawn helmet clearance');
  for(const dir of [-1,1]){
   const p=new PlayerController();
   p.reset(dir>0?deck.x-50:deck.x+deck.w+50,150);
   for(let n=0;n<270;n++){p.update(1/120,{...idle,axis:dir},l);assert.equal(p.y,150);assert.equal(p.crouched,false);}
   assert.ok(dir>0?p.x>deck.x+deck.w+40:p.x<deck.x-40,'underpass should require no jump');
   assert.equal(segmentRect({x:deck.x-50,y:200},{x:deck.x+deck.w+50,y:200},deck),null);
  }
 }
});
test('floating lifts have no pillars and permit ground passage at every height',()=>{
 const l=liftFixture();
 l.objects.reset([]);l.refreshSolids(); // Isolate the platform from adjacent breakable barrels.
 for(const m of l.mechanisms.filter(m=>m.data.kind==='lift')){
  assert.equal(m.rect.oneWay,true);assert.equal(m.supports.length,0);
  for(const y of [m.data.minY,224,m.data.maxY])for(const direction of [-1,1]){
   m.rect.y=y;
   const p=new PlayerController();p.reset(direction>0?m.rect.x-40:m.rect.x+m.rect.w+40,150);
   for(let n=0;n<150;n++)p.update(1/120,{...idle,axis:direction},l);
   assert.ok(direction>0?p.x>m.rect.x+m.rect.w+25:p.x<m.rect.x-25);
   assert.equal(p.y,150);
  }
 }
});
test('people below a floating lift never reverse its cycle, while a rider is carried',()=>{
 const l=liftFixture(),m=l.mechanisms.find(m=>m.data.kind==='lift'),p=new PlayerController();
 m.rect.y=230;m.direction=-1;p.reset(m.rect.x+20,150);
 let reachedBottom=false,reachedTop=false;
 for(let n=0;n<720;n++){
  l.updateWorld(1/120,p,[]);p.update(1/120,idle,l);
  assert.equal(p.y,150);
  if(m.rect.y===m.data.minY)reachedBottom=true;
  if(m.rect.y===m.data.maxY)reachedTop=true;
 }
 assert.ok(reachedBottom&&reachedTop);
 m.direction=1;m.rect.y=200;
 p.reset(m.rect.x+m.rect.w/2,m.rect.y+m.rect.h);const before=p.y;
 l.updateWorld(.1,p,[]);
 assert.ok(p.y>before);assert.ok(Math.abs(p.y-m.rect.y-m.rect.h)<.01);
});
test('cover is readable chest height, uses the visible envelope, and excludes nearby foliage',()=>{
 const l=new LevelController(),cover=l.objects.objects.filter(o=>o.kind==='sandbag'||o.kind==='concrete');
 assert.ok(cover.length>=7);
 for(const o of cover){
  const v=objectPresentation(o);assert.ok(v.height>=60&&v.height<=70,o.id);
  assert.ok(v.width>=135);
  const solid=load('render/ObjectPresentation').objectSolid(o);
  assert.equal(solid.width,o.bounds.w);assert.equal(solid.height,o.bounds.h);
  assert.equal(groundDecorClear(o.bounds.x-5,30,[o.bounds]),false);
 }
 for(const t of drawnGroundTiles(terrainSurface(l.staticSolids),-260,cover.map(o=>o.bounds)))
  if(t.id==='drawn.grass'&&t.crop[1]===0)assert.ok(groundDecorClear(t.x,t.crop[2]*t.scale,cover.map(o=>o.bounds)));
});
test('a rising lift never carries a rider through an overlapping overhead beam',()=>{
 const l=liftFixture(),m=l.mechanisms.find(m=>m.data.kind==='lift'),p=new PlayerController();
 m.rect.y=180;m.direction=1;m.syncSupports();p.reset(m.rect.x+20,m.rect.y+m.rect.h);
 l.staticSolids.push({x:p.x-20,y:295,w:40,h:20,kind:'platform'});
 l.objects.reset([]);l.refreshSolids();
 for(let n=0;n<50;n++){
  l.updateWorld(1/120,p,[]);p.update(1/120,idle,l);
  assert.ok(p.y+p.height<=295.01);
 }
 assert.equal(m.direction,-1);
});
test('lower optional decks retain attached supplies and spawns stay clear of enlarged cover',()=>{
 const l=new LevelController();
 for(const e of l.data.enemies.filter(e=>!e.onPlatform)){
  assert.ok(!l.objects.objects.some(o=>o.solid&&e.x+13>o.bounds.x&&e.x-13<o.bounds.x+o.bounds.w&&e.y<o.bounds.y+o.bounds.h&&e.y+74>o.bounds.y),e.id+' intersects cover');
 }
 for(const point of l.data.recoveryPoints)
  assert.ok(l.staticSolids.some(s=>point.x>=s.x&&point.x<=s.x+s.w&&Math.abs(point.y-s.y-s.h)<.01),'Recovery must share its real support');
});
