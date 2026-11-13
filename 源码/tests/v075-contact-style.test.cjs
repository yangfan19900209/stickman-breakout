const {test}=require('node:test'),assert=require('node:assert/strict');
const {swimMove}=require('../.test-build/assets/scripts/ocean/SwimCollision.js');
const {OceanSession}=require('../.test-build/assets/scripts/ocean/OceanSession.js');
const {OceanLevel:L}=require('../.test-build/assets/scripts/ocean/OceanLevel.js');
const {landOutline}=require('../.test-build/assets/scripts/render/LandContourPlan.js');
const {terrainSurface}=require('../.test-build/assets/scripts/render/TerrainSurface.js');
const {AbandonedBase}=require('../.test-build/assets/scripts/level/LevelData.js');
const {drawnGroundTiles,drawnPlatformTiles,DrawnSteel,landMaterialSpans}=require('../.test-build/assets/scripts/render/LandDrawnPlan.js');
const {ComicFrames}=require('../.test-build/assets/scripts/render/ComicFrames.js');
const rect={x:100,y:100,w:200,h:30},hw=10,h=40;
test('swimming bodies can slide and move away from each exactly touching face',()=>{
 const cases=[
  [{x:180,y:130},30,0], [{x:180,y:130},-30,0], [{x:180,y:130},0,30],
  [{x:180,y:60},30,0], [{x:180,y:60},-30,0], [{x:180,y:60},0,-30],
  [{x:90,y:100},0,30], [{x:90,y:100},0,-30], [{x:90,y:100},-30,0],
  [{x:310,y:100},0,30], [{x:310,y:100},0,-30], [{x:310,y:100},30,0],
 ];
 for(const [p,dx,dy] of cases){const before={...p};swimMove(p,dx,dy,hw,h,[rect]);assert.equal(p.x,before.x+dx);assert.equal(p.y,before.y+dy);}
});
test('swept bodies still stop at all four solid faces even at boost-sized displacements',()=>{
 for(const [p,dx,dy,axis,target] of [[{x:60,y:100},400,0,'x',90],[{x:350,y:100},-400,0,'x',310],[{x:180,y:0},0,400,'y',60],[{x:180,y:200},0,-400,'y',130]]){
  swimMove(p,dx,dy,hw,h,[rect]);assert.ok(Math.abs(p[axis]-target)<.002);
 }
});
test('small penetration at a joined wall corner resolves against the whole union',()=>{
 const solids=[rect,{x:300,y:100,w:40,h:150}],p={x:289.9999,y:129.9999};
 swimMove(p,-15,0,hw,h,solids);
 assert.ok(p.x<276&&p.y>=130&&p.y<130.01);
 const q={x:90,y:60};swimMove(q,15,15,hw,h,[rect]);assert.ok(q.y<=60.001);assert.ok(q.x>90);
});
test('actual first wreck deck contact releases left, right and up, with downward motion blocked',()=>{
 const deck=L.landforms.find(o=>o.art.includes('deck'));
 assert.equal(deck.y+deck.h,320);
 for(const [axis,vertical] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const s=new OceanSession();s.finishEntry();s.enemies.forEach(e=>e.hp=0);
  s.player.x=4660;s.player.y=320;
  for(let i=0;i<40;i++)s.update(1/120,{axis,vertical,jump:false,shoot:false});
  if(axis)assert.ok((s.player.x-4660)*axis>40);
  if(vertical>0)assert.ok(s.player.y>360);
  if(vertical<0)assert.ok(Math.abs(s.player.y-320)<.01);
 }
});
test('first chapter main road is continuous and level, with material changes independent of collision',()=>{
 const spans=terrainSurface(AbandonedBase.solids),points=landOutline(spans);
 assert.deepEqual(spans,[{x:0,w:AbandonedBase.width,top:150}]);
 assert.equal(AbandonedBase.solids.some(s=>s.kind==='step'),false);
 assert.ok(points.every(p=>p.y===150));
 const materials=landMaterialSpans(spans);
 assert.deepEqual(materials.map(s=>s.x),[0,3950,6800,8500]);
 assert.equal(materials.reduce((n,s)=>n+s.w,0),AbandonedBase.width);
 assert.ok(materials.every(s=>s.top===150));
 const tiles=drawnGroundTiles(spans);
 assert.ok(tiles.some(t=>t.id==='terrain088.grass'));
 assert.ok(tiles.some(t=>t.id==='unified.fill'));
});
test('illustrated land uses valid clipped interiors and complete foliage across material changes',()=>{
 const spans=terrainSurface(AbandonedBase.solids),tiles=drawnGroundTiles(spans);
 for(const t of tiles){
  const [x,y,w,h]=t.crop,d=ComicFrames[t.id];
  assert.ok(x>=-.001&&y>=-.001&&w>0&&h>0&&x+w<=d.size[0]+.001&&y+h<=d.size[1]+.001,t.id);
  assert.equal(t.scale,t.id==='unified.fill'?.875:t.id==='drawn.grass'?.5:.25);
  if(t.id==='drawn.grass'&&y===0){
   assert.equal(w,586);assert.equal(h,82);
   assert.ok(spans.some(s=>t.y===s.top&&t.x>=s.x+20&&t.x+w*t.scale<=s.x+s.w-20));
  }
 }
 for(const s of spans)for(let x=s.x+.2;x<s.x+s.w;x+=31)
  assert.ok(tiles.some(t=>t.id==='unified.fill'&&x>=t.x-.001&&x<t.x+t.crop[2]*t.scale+.001&&Math.abs(t.y+260)<.001));
});
test('floating deck ends retain their shape and line weight while quiet centres extend',()=>{
 const decks=[...AbandonedBase.solids.filter(s=>s.kind==='platform'),...AbandonedBase.mechanisms];
 for(const deck of decks){
  const fixed=deck.kind==='platform',top=deck.y+deck.h;
  const tiles=drawnPlatformTiles(deck.x,top,deck.w,fixed?150:undefined);
  assert.ok(tiles.length>=3);
  const beam=tiles[0];
  assert.match(beam.id,/^terrain088[.]deck[.]/);
  assert.equal(beam.crop[0],0);assert.equal(beam.crop[1],0);
  assert.ok(Math.abs(tiles.reduce((sum,t)=>sum+t.crop[2]*t.scale,0)-deck.w)<1e-6);
  assert.ok(tiles.every(t=>(t.scaleY??t.scale)===beam.scale));
  for(let i=1;i<tiles.length;i++)assert.ok(Math.abs(tiles[i].x-tiles[i-1].x-tiles[i-1].crop[2]*tiles[i-1].scale)<1e-6);
  assert.ok(Math.abs(beam.y+(ComicFrames[beam.id].size[1]-3)*beam.scale-top)<1e-6);
  assert.ok(Math.abs(beam.y+3*beam.scale-deck.y)<1e-6);
 }
});
test('each fixed deck can be reached from below with one ordinary held jump, without an air jump',()=>{
 const {LevelController}=require('../.test-build/assets/scripts/level/LevelController.js');
 const {PlayerController}=require('../.test-build/assets/scripts/player/PlayerController.js');
 for(const deck of AbandonedBase.solids.filter(s=>s.kind==='platform'&&s.y+s.h<=276)){
  const l=new LevelController();l.objects.reset([]);l.refreshSolids();
  const p=new PlayerController(),x=deck.x+deck.w/2,top=deck.y+deck.h;
  p.reset(x,l.groundY(x));
  let arrived=false;
  for(let tick=0;tick<480;tick++){
   p.update(1/120,{axis:0,jump:tick===0,jumpHeld:tick<46,shoot:false},l);
   assert.ok(p.jumpCount<=1,'ordinary scaffold must not require a second jump');
   if(p.grounded&&Math.abs(p.y-top)<.01&&p.x>deck.x){arrived=true;break;}
  }
  assert.ok(arrived,`unreachable deck at ${deck.x}; stopped ${p.x},${p.y}`);
 }
});

