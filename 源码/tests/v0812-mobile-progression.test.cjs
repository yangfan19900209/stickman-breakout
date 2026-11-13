const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {safeInsetsInView}=load('platform/SafeAreaInsets'),{viewportLayout}=load('ui/ViewportLayout');
const {controlLayout}=load('ui/ControlLayout'),{readMenuRect,menuRectInView}=load('platform/MenuSafeArea');
const {LevelController}=load('level/LevelController'),{PlayerController}=load('player/PlayerController');
const {GameConfig:C}=load('core/GameConfig');
const {CameraFollow}=load('camera/CameraFollow');
const {GameSession}=load('core/GameSession');
const zero={left:0,right:0,top:0,bottom:0},dt=1/120;

test('retreat across the final entrance preserves the engaged boss and battle framing until restart',()=>{
 const s=new GameSession();s.reset();const boss=s.spawner.guard;
 assert.equal(s.bossFraming,false);
 s.player.x=s.level.data.arena.start+40;s.level.updateWorld(dt,s.player,s.spawner.enemies);
 assert.equal(s.bossFraming,true);assert.equal(s.level.arenaVisited,true);
 // Leaving before the first hit must behave exactly like leaving mid-fight.
 assert.equal(boss.health,boss.maxHealth);s.player.x=s.level.data.arena.start-100;
 s.level.updateWorld(dt,s.player,s.spawner.enemies);boss.update(dt,s.player,s.level,s.projectiles);
 assert.equal(boss.active,true);assert.equal(s.bossFraming,true);
 const x=s.player.x;s.camera.visibleWidth=1250;s.camera.zoom=1.03;
 for(let n=0;n<120;n++)s.update(dt,{axis:0,jump:false,shoot:false});
 assert.ok(s.player.x-s.camera.x>0);assert.ok(Math.abs(s.player.x-x)<2);
 s.player.x=boss.x-1500;assert.equal(s.bossFraming,true);
 s.reset();assert.equal(s.bossFraming,false);
});

test('opening hero silhouette clears the left thumb control after lowering the ground',()=>{
 for(const [cw,ch,left]of [[852,393,59],[844,390,47],[667,375,0]]){
  const d=viewportLayout(cw,ch),k=d.height/ch,l=controlLayout({...zero,left:left*k,bottom:21*k},d.width,d.height,ch);
  const c=new CameraFollow();c.visibleWidth=d.width/d.zoom;c.zoom=d.zoom;c.reset(150);
  const heroLeft=(150-c.x)*c.zoom-60;
  assert.ok(heroLeft>l.joystick.x+l.joystick.baseR+10);
 }
});

test('iPhone landscape safe rect remains in design coordinates at DPR 1, 2 and 3',()=>{
 for(const dpr of [1,2,3])for(const [cw,ch,left,right]of [[852,393,59,0],[852,393,0,59],[844,390,47,47],[667,375,0,0]]){
  const d=viewportLayout(cw,ch),k=d.height/ch;
  const rect={x:left*k,y:21*k,width:d.width-(left+right)*k,height:d.height-21*k};
  const edges=safeInsetsInView(rect,{width:cw*dpr,height:ch*dpr},d.width,d.height);
  assert.ok(Math.abs(edges.left-left*k)<1e-9);assert.ok(Math.abs(edges.right-right*k)<1e-9);
  assert.ok(Math.abs(edges.bottom-21*k)<1e-9);assert.ok(Math.abs(edges.top)<1e-9);
 }
});
test('CSS safe insets combine with engine insets without doubling, including non-notched and invalid APIs',()=>{
 const d=viewportLayout(852,393),k=d.height/393,frame={width:852,height:393};
 const rect={x:59*k,y:21*k,width:d.width-59*k,height:d.height-21*k};
 const a=safeInsetsInView(rect,frame,d.width,d.height,{...zero,left:59,bottom:21});
 assert.ok(Math.abs(a.left-59*k)<1e-9);assert.ok(Math.abs(a.bottom-21*k)<1e-9);assert.ok(Math.abs(a.right)<1e-9);
 const full=safeInsetsInView({x:0,y:0,width:d.width,height:d.height},frame,d.width,d.height);
 assert.deepEqual(full,zero);
 const bad=safeInsetsInView({x:NaN,y:0,width:0,height:0},frame,d.width,d.height,{...zero,left:59});
 assert.ok(Math.abs(bad.left-59*k)<1e-9);assert.ok(Object.values(bad).every(Number.isFinite));
});
test('both native capsule and adjacent circular button are outside pause hit areas on phone layouts',()=>{
 for(const [cw,ch,left]of [[852,393,59],[844,390,47],[667,375,0]]){
  const d=viewportLayout(cw,ch),k=d.height/ch;
  const rect=readMenuRect({getWindowInfo:()=>({windowWidth:cw,windowHeight:ch}),getMenuButtonBoundingClientRect:()=>({left:cw-96,top:12,width:88,height:32})},{width:cw,height:ch});
  const menu=menuRectInView(rect,{width:cw,height:ch},d.width,d.height);
  const layout=controlLayout({...zero,left:left*k,bottom:21*k},d.width,d.height,ch,menu);
  assert.ok(layout.pause.x+layout.pause.hit/2<menu.x-44*k);
  assert.ok(layout.hud.levelX-layout.hud.levelWidth/2>351*k+left*k);
  assert.ok(layout.pause.hit/k>=44-.01);
  assert.ok(layout.joystick.x-layout.joystick.baseR>=left*k);
  assert.equal(layout.safeInsets.left,left*k);
 }
});
function fixture(arena){
 const l=new LevelController({name:'retreat',width:8000,spawn:{x:150,y:150},exit:{x:7900,y:150},objects:[],enemies:[],solids:[{x:0,y:0,w:8000,h:150,kind:'ground'}],arena});
 const p=new PlayerController();p.reset(150,150);p.grounded=true;return{l,p};
}
const input=axis=>({axis,jump:false,jumpHeld:false,shoot:false,crouch:false,aimY:0,grenade:false});
test('normal run can retreat one screen but repeated left input cannot return to spawn',()=>{
 const {l,p}=fixture();for(let n=0;n<900;n++)p.update(dt,input(1),l);
 const furthest=p.x,left=l.retreatLimit;assert.ok(left>1000);assert.equal(left,furthest-C.progression.retreatDistance);
 for(let n=0;n<1000;n++)p.update(dt,input(-1),l);
 assert.equal(p.x,l.retreatLimit+p.halfWidth);assert.equal(p.vx,0);assert.equal(p.y,150);assert.ok(p.grounded);
 assert.ok(l.furthestPlayerX>=furthest&&l.furthestPlayerX-furthest<20,"braking keeps normal inertia");assert.equal(l.retreatLimit,l.furthestPlayerX-C.progression.retreatDistance);
 l.reset();p.reset(150,150);assert.equal(l.retreatLimit,0);assert.equal(l.furthestPlayerX,150);
 for(let n=0;n<180;n++)p.update(dt,input(-1),l);assert.equal(p.x,p.halfWidth);
});
test('airborne recoil obeys the retreat edge without changing height or blocking enemies',()=>{
 const {l,p}=fixture();p.vx=2000;l.movePlayer(p,1);const left=l.retreatLimit;
 p.x=left+p.halfWidth+3;p.y=310;p.vy=-20;p.vx=-400;p.grounded=false;
 l.movePlayer(p,.05);assert.equal(p.x,left+p.halfWidth);assert.equal(p.y,309);assert.equal(p.vx,0);
 p.y=150;p.grounded=true;p.vx=-490;l.movePlayer(p,.1);assert.equal(p.x,left+p.halfWidth);
 const e={x:left+30,y:150,vx:-280,vy:0,grounded:true,halfWidth:13,height:74};
 l.move(e,1);assert.ok(e.x<left,'ordinary enemies retain real pursuit across the boundary');
});
test('retreat collision keeps cover solid and resolves the correct slope landing surface',()=>{
 const {l,p}=fixture();p.vx=2200;l.movePlayer(p,1);
 const left=l.retreatLimit;
 l.staticSolids.push({x:left+70,y:150,w:80,h:90,kind:'step'});l.objects.revision++;l.refreshSolids();
 p.vx=-600;p.vy=-1;l.movePlayer(p,2);assert.equal(p.x,left+150+p.halfWidth);assert.equal(p.y,150);
 // Cross the actual cover from above and stop on the boundary, still airborne.
 p.y=300;p.vx=-600;p.vy=-100;l.movePlayer(p,.5);assert.equal(p.x,left+p.halfWidth);assert.equal(p.y,250);
 l.staticSolids.splice(0,l.staticSolids.length,{x:0,y:0,w:8000,h:300,kind:'ground',slope:{left:150,right:300}});l.objects.revision++;l.refreshSolids();
 p.vy=-500;l.movePlayer(p,.5);assert.equal(p.y,l.groundY(p.x));assert.ok(p.grounded);
});
test('final fight keeps the full arena and a retreat apron; defeating it does not jump the boundary onto the player',()=>{
 const {l,p}=fixture({start:5000,end:7900});p.vx=6500;l.movePlayer(p,1);
 assert.equal(l.retreatLimit,5000-C.progression.arenaRetreatMargin);
 p.vx=-3000;l.movePlayer(p,1);assert.equal(p.x,l.retreatLimit+p.halfWidth);
 const before=l.retreatLimit;l.guardDefeated=true;p.vx=0;l.movePlayer(p,dt);assert.equal(l.retreatLimit,before);
 p.vx=3000;l.movePlayer(p,1);assert.ok(l.retreatLimit>before);assert.ok(p.x-l.retreatLimit>900);
});
