const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve('.test-build/assets/scripts'),load=p=>require(path.join(root,p+'.js'));
const {GameSession}=load('core/GameSession'),{GameConfig:C}=load('core/GameConfig');
const dt=1/120,idle={axis:0,shoot:false,jump:false,jumpHeld:false,crouch:false,aimY:0,grenade:false};
function scene(){const s=new GameSession();s.reset();const b=s.spawner.miniBoss,final=s.spawner.guard;s.player.reset(b.x-420,150);s.spawner.enemies.splice(0,s.spawner.enemies.length,b,final);s.level.objects.reset([]);s.level.refreshSolids();b.active=true;return{s,b};}
function moduleWith(file,overrides){const exports={};vm.runInNewContext(fs.readFileSync(path.join(root,file+'.js'),'utf8'),{exports,require:p=>p in overrides?overrides[p]:require(path.resolve(root,path.dirname(file),p))});return exports;}

test('hanging and moving decks keep beam height and style while the camera scrolls',()=>{
 const {ComicBatch}=moduleWith('render/ComicAssets',{'cc':{},'./Ink':{}});
 const {ComicObjectArt}=moduleWith('render/ComicObjectArt',{'cc':{UITransform:'size'},'./ComicAssets':{ComicBatch}});
 for(const [x,w]of [[3080,210],[5000,142],[8000,142],[9690,220]]){
  let first;
  for(const cam of [x-180,x-325,x-440]){
   const calls=[],batch=new ComicBatch(null,'rig');
   batch.putRegion=(id,px,py,scale,crop)=>{const size={width:crop[2]*scale,height:crop[3]*scale},node={position:{x:px,y:py},scale:{x:1,y:1},getComponent:()=>size,setScale(a,b){this.scale={x:a,y:b};}};calls.push({id,node});return node;};
   const art=new ComicObjectArt();art.batch=batch;art.mechanism(x,266,w,14,cam);
   const r=art.renderedMechanisms[0];
   assert.ok(r.segments.length>2);for(const p of r.segments){assert.ok(p.height<27,JSON.stringify(p));assert.ok(p.y+p.height<282);assert.ok(p.y>253);}
   assert.ok(Math.abs(r.segments.reduce((n,p)=>n+p.width,0)-w)<.001);
   const ids=calls.map(c=>c.id).join(',');if(first)assert.equal(ids,first);first=ids;
  }
 }
});

test('mini boss survives two full rocket impacts and a grenade without changing ordinary-enemy or final-boss damage',()=>{
 const {s,b}=scene();assert.equal(b.maxHealth,70);
 for(let shot=0;shot<2;shot++)s.applyBlast(b.x,b.y+40,160,C.weapons.rocket.damage,'player','rocket');
 s.applyBlast(b.x,b.y+40,155,C.grenade.damage,'player');
 assert.equal(b.health,53);assert.ok(b.alive);
 const final=s.spawner.guard;final.active=true;const hp=final.health;s.applyBlast(final.x,final.y+40,160,C.weapons.rocket.damage,'player','rocket');assert.equal(final.health,hp-5);
 b.takeDamage(999,1,'bullet');assert.equal(b.alive,false,'no minimum-life timer or damage immunity');
});

test('uninterrupted basic fire can defeat the mini boss without a minimum life or attack-cycle gate',()=>{
 const {s,b}=scene();const xs=[],directions=new Set();let frames=0;
 // Isolate exposure time: invincibility keeps the stationary test shooter alive,
 // but all firing, hits, boss damage, movement and attack timers remain real.
 while(b.alive&&frames<120*45){s.player.invincible=1;s.player.facing=s.player.x<b.x?1:-1;s.update(dt,{...idle,shoot:true});if(b.mode==='repositioning'&&Math.abs(b.vx)>1){directions.add(Math.sign(b.vx));xs.push(b.x);}frames++;}
 assert.equal(b.alive,false);assert.ok(frames*dt>0&&frames*dt<30,frames*dt);
 assert.ok(Object.values(b.attackCounts).some(n=>n>0),JSON.stringify(b.attackCounts));
 assert.ok(b.movementTurns>0);assert.ok(directions.size>0);assert.ok(xs.length>0);
});

test('repositioning is vulnerable, respects walls, and locks its muzzle before firing',()=>{
 const {s,b}=scene();s.level.staticSolids.splice(0,s.level.staticSolids.length,{x:0,y:0,w:15000,h:150,kind:'ground'},{x:b.x-180,y:150,w:40,h:220,kind:'step'});s.level.objects.reset([]);s.level.refreshSolids();
 let sawStep=false,sawTell=false;
 for(let n=0;n<120*5;n++){
  const before=b.health;b.update(dt,s.player,s.level,s.projectiles);
  if(b.mode==='repositioning'){sawStep=true;b.takeDamage(1,1,'bullet');assert.equal(b.health,before-1);}
  assert.ok(b.x-b.halfWidth>=s.level.staticSolids[1].x+40-.01);
  if(b.windup>0){sawTell=true;const x=b.x,facing=b.facing,warning=b.warningX;s.player.x=b.x+300;b.update(dt,s.player,s.level,s.projectiles);assert.equal(b.x,x);assert.equal(b.facing,facing);assert.equal(b.warningX,warning);break;}
 }
 assert.ok(sawStep&&sawTell);assert.equal(b.y,150);
});
