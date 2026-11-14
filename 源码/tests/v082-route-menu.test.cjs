const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {AbandonedBase:level}=load('level/LevelData'),{LevelController}=load('level/LevelController');
const {GameConfig:C}=load('core/GameConfig'),{objectPresentation}=load('render/ObjectPresentation');
const {controlLayout}=load('ui/ControlLayout'),{viewportLayout}=load('ui/ViewportLayout');
const {readMenuRect,menuRectInView}=load('platform/MenuSafeArea');
const zero={left:0,right:0,top:0,bottom:0};

test('the industrial stone and every concrete-looking land barrier survive sustained bullets, melee and explosions unchanged',()=>{
 const l=new LevelController(),stones=l.objects.objects.filter(o=>o.solid&&objectPresentation(o).id==='cover.concrete');
 assert.ok(stones.some(o=>o.id==='concrete-B'));
 for(const o of stones){
  const bounds={...o.bounds},visual=objectPresentation(o),health=o.health;
  assert.equal(o.category,'indestructible',o.id);
  for(const kind of ['bullet','melee','explosion'])for(let n=0;n<30;n++)assert.equal(o.takeDamage(99999,1,kind),false);
  l.objects.flushHits();l.refreshSolids();
  assert.ok(o.alive&&o.solid);assert.equal(o.health,health);assert.deepEqual(o.bounds,bounds);
  assert.equal(objectPresentation(o).id,visual.id);assert.equal(objectPresentation(o).height,visual.height);
  assert.ok(l.solids.some(r=>r.entityId===o.id));assert.equal(o.deadTime,0);
 }
});

test('grenade budget is three at spawn plus only two deliberate resupplies; rockets stay before each boss',()=>{
 const drops=level.objects.filter(o=>o.drop==='grenades');
 assert.equal(C.grenade.initial,3);assert.equal(drops.length,2);
 assert.deepEqual(drops.map(o=>o.id),['grenades-E','grenades-before-final']);
 const mini=level.enemies.find(e=>e.encounter==='mini');
 assert.ok(drops[0].x>mini.x&&drops[0].x-mini.x<1000);
 assert.ok(drops[1].x<level.arena.start&&level.arena.start-drops[1].x<500);
 assert.ok(drops.every(o=>o.dropChance===1));
 assert.ok(level.objects.filter(o=>o.x<mini.x).every(o=>o.drop!=='grenades'));
 const rocket=level.objects.find(o=>o.id==='rocket-before-colossus');
 assert.ok(rocket.x+rocket.w+60<level.arena.start);
 assert.ok(!level.objects.some(o=>o.drop==='shotgun'||o.drop==='ammo'));
});

test('a released industrial bridge rests on the real permanent stone and carries its rider without embedding',()=>{
 const l=new LevelController(),{PlayerController}=load('player/PlayerController'),p=new PlayerController();
 const bridge=l.mechanisms.find(m=>m.data.id==='bridge-B'),stone=l.objects.objects.find(o=>o.id==='concrete-B');
 p.reset(bridge.rect.x+90,bridge.rect.y+bridge.rect.h);p.grounded=true;
 l.objects.objects.find(o=>o.id==='bridge-rope').takeDamage(10,1,'bullet');l.objects.flushHits();
 for(let n=0;n<180;n++){
  l.updateWorld(1/120,p,[]);p.update(1/120,{axis:0,jump:false,shoot:false},l);
  assert.ok(bridge.rect.y>=stone.bounds.y+stone.bounds.h-.01);
  assert.ok(p.y>=bridge.rect.y+bridge.rect.h-.01);
 }
 assert.ok(bridge.landed);assert.equal(bridge.rect.y,stone.bounds.y+stone.bounds.h);
 assert.equal(p.y,bridge.rect.y+bridge.rect.h);
 for(let n=0;n<120;n++)p.update(1/120,{axis:1,jump:false,shoot:false},l);
 assert.ok(p.x>bridge.rect.x+bridge.rect.w+25);assert.equal(p.y,150);
});

test('a released bridge follows an actual support, then falls again when that support disappears',()=>{
 const {MechanismController}=load('level/MechanismController');
 const b=new MechanismController({id:'test',kind:'bridge',x:100,y:300,w:200,h:24,minY:150,maxY:300,speed:0});
 const floor={x:0,y:0,w:1000,h:150},box={x:150,y:150,w:80,h:50};b.released=true;
 for(let n=0;n<150;n++)b.update(1/120,[floor,box,b.rect]);
 assert.equal(b.rect.y,200);assert.ok(b.landed);
 box.y+=3;assert.equal(b.update(1/120,[floor,box,b.rect]),3);assert.equal(b.rect.y,203);
 for(let n=0;n<150;n++)b.update(1/120,[floor,b.rect]);
 assert.equal(b.rect.y,150);assert.ok(b.landed);
});

test('the longer post-tank route adds staggered encounters, continuous terrain and no unreachable final anchors',()=>{
 const mini=level.enemies.find(e=>e.encounter==='mini'),boss=level.enemies.find(e=>e.encounter==='final');
 assert.equal(level.width,14800);assert.ok(boss.x-mini.x>=8200);
 const route=level.zones.filter(z=>['E','F','G'].includes(z.id));
 const regular=level.enemies.filter(e=>e.x>=route[0].start&&e.x<route.at(-1).end);
 assert.equal(regular.length,20);
 for(const z of route)assert.equal(regular.filter(e=>e.x>=z.start&&e.x<z.end).length,z.id==='G'?6:7);
 const ground=level.solids.filter(s=>s.kind==='ground');assert.equal(ground.length,1);
 assert.equal(ground[0].x+ground[0].w,level.width);
 assert.ok(level.exit.x>boss.x&&level.exit.x<level.width);
 for(const o of level.objects)assert.ok(o.x>=0&&o.x+o.w<=level.width,o.id);
});

test('capsule conversion respects window coordinates, letterboxing and high-DPR frames exactly once',()=>{
 const api={getWindowInfo:()=>({windowWidth:844,windowHeight:390}),getMenuButtonBoundingClientRect:()=>({left:748,top:12,width:88,height:32})};
 const normal=readMenuRect(api,{width:844,height:390}),retina=readMenuRect(api,{width:2532,height:1170});
 const design=viewportLayout(844,390);
 const a=menuRectInView(normal,{width:844,height:390},design.width,design.height);
 const b=menuRectInView(retina,{width:2532,height:1170},design.width,design.height);
 for(const key of ['x','y','w','h'])assert.ok(Math.abs(a[key]-b[key])<1e-9);
 assert.deepEqual(menuRectInView({left:900,top:20,width:80,height:30},{width:1000,height:600},900,500),{x:810,y:475,w:72,h:27});
});

test('pause hit area and progress leave capsule clear at mobile sizes without shrinking thumb controls',()=>{
 for(const [width,height,inset]of [[844,390,47],[852,393,59],[667,375,0],[1280,720,0]]){
  const d=viewportLayout(width,height),k=d.height/height,insets={...zero,left:inset*k,right:inset*k};
  const menu=menuRectInView({left:width-96,top:12,width:88,height:32},{width,height},d.width,d.height);
  const before=controlLayout(insets,d.width,d.height,height),after=controlLayout(insets,d.width,d.height,height,menu);
  assert.ok(after.pause.x+after.pause.hit/2<=menu.x-8*k);
  assert.ok(after.hud.levelX+after.hud.levelWidth/2<=after.pause.x-after.pause.hit/2-7*k);
  assert.ok(after.hud.levelX-after.hud.levelWidth/2>351*k+insets.left,'weapon/level labels must stay disjoint');
  assert.ok(after.pause.hit/k>=44-1e-9);assert.deepEqual(after.shoot,before.shoot);assert.deepEqual(after.grenade,before.grenade);assert.deepEqual(after.joystick,before.joystick);
  if(!after.hud.secondRow)assert.ok(after.hud.objectiveX-after.hud.objectiveWidth/2>=363*k+insets.left-.01);
 }
});

test('missing, invalid and not-yet-ready capsule APIs reserve safe space then accept the real rectangle',()=>{
 const frame={width:844,height:390};
 for(const api of [undefined,{}, {getMenuButtonBoundingClientRect(){throw Error('not ready')}}, {getMenuButtonBoundingClientRect:()=>({left:0,top:0,width:0,height:0})}]){
  const r=readMenuRect(api,frame);assert.equal(r.left,736);assert.equal(r.width,100);
 }
 const real={left:700,top:16,width:120,height:38};assert.deepEqual(readMenuRect({getMenuButtonBoundingClientRect:()=>real},frame),real);
});
