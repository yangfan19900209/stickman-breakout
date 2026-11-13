const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {InputManager}=load('core/InputManager'),{PlayerController}=load('player/PlayerController'),{GameSession}=load('core/GameSession');
const {WeaponSystem}=load('combat/WeaponSystem'),{ProjectileManager}=load('combat/ProjectileManager'),{ParticlePool}=load('combat/ParticlePool');
const {comicPose,comicMuzzle,rifleRecoilOffset}=load('render/ComicPose'),{directMuzzle}=load('render/DirectPose'),{bulletCrop}=load('render/RocketPresentation');
const {BossBeam}=load('combat/BossBeam');
const dt=1/120,idle={axis:0,jump:false,shoot:false};
const floor={solids:[],movePlayer(p,t){p.x+=p.vx*t;p.y=150;p.grounded=true;p.vy=0;}};

test('ordinary diagonals keep full walking speed during fire and reversals',()=>{
 for(const shoot of [false,true])for(const side of [-1,1]){
  const i=new InputManager(),p=new PlayerController();i.joystick.start(1,0,0);if(shoot)i.press('fire','shoot');
  for(const degrees of [15,25,35,45,55,58,55,45,35,25,15]){
   const angle=degrees*Math.PI/180,r=i.joystick.radius;i.joystick.move(1,side*r*Math.cos(angle),-r*Math.sin(angle));
   for(let n=0;n<24;n++){const f=i.consume();assert.ok(Math.abs(f.axis-side)<1e-8,degrees);assert.equal(f.crouch,false);assert.equal(f.shoot,shoot);p.update(dt,f,floor);}
   assert.ok(Math.abs(p.vx-side*280)<1e-6);
  }
  i.joystick.move(1,-side*i.joystick.radius,0);for(let n=0;n<36;n++)p.update(dt,i.consume(),floor);assert.ok(Math.abs(p.vx+side*280)<1e-6);
 }
});
test('vertical gestures are accessible and short land movements no longer throttle speed',()=>{
 const i=new InputManager(),r=i.joystick.radius;i.joystick.start(1,0,0);
 i.joystick.move(1,r*.05,-r);let f=i.consume();assert.equal(f.axis,0);assert.equal(f.crouch,true);
 i.joystick.move(1,r*.25,-r);f=i.consume();assert.equal(f.crouch,true);assert.equal(f.axis,0);
 i.joystick.move(1,0,r);f=i.consume();assert.equal(f.axis,0);assert.equal(f.aimY,1);
 i.joystick.move(1,r*.35,0);f=i.consume();assert.equal(f.axis,1);
 for(const movement of ['swim','flight']){i.joystick.move(1,r*.25,-r);f=i.consume(movement);assert.equal(f.axis,i.joystick.axis);assert.equal(f.vertical,i.joystick.vertical);assert.equal(f.crouch,false);}
 i.clear();assert.equal(i.consume().axis,0);
});
test('remote boss impact preserves movement; an actual hit retains its reaction',()=>{
 const s=new GameSession({name:'remote impact',width:8000,spawn:{x:150,y:150},exit:{x:7900,y:150},objects:[],enemies:[{id:'boss',kind:'colossus',x:7700,y:150}],solids:[{x:0,y:0,w:8000,h:150,kind:'ground'}]});s.reset();
 for(let n=0;n<30;n++)s.update(dt,{...idle,axis:1});const x=s.player.x;s.spawner.guard.impactSerial++;
 s.update(dt,{...idle,axis:1});assert.equal(s.hitStop,0);assert.ok(Math.abs(s.player.x-x-280*dt)<1e-6);assert.equal(s.player.health,5);
 s.explosions.enqueue(s.player.x,s.player.y+35,60,1,'enemy');s.update(dt,idle);assert.equal(s.player.health,4);assert.ok(s.hitStop>0);
});
test('rifle recoil, painted barrel, flash and projectile share the same offset across stances',()=>{
 for(const facing of [-1,1])for(const aimPitch of [0,Math.PI/4,Math.PI/2])for(const stance of ['stand','run','crouch','jump']){
  const p=new PlayerController(),w=new WeaponSystem(),q=new ProjectileManager(new ParticlePool());p.x=400;p.y=250;p.facing=facing;p.aimPitch=aimPitch;p.crouched=stance==='crouch';p.vx=stance==='run'?280*facing:0;p.grounded=stance!=='jump';p.vy=stance==='jump'?100:0;p.stride=.38;
  assert.ok(w.fire(p,q,'player'));const bullet=q.items.find(b=>b.active),tip=comicMuzzle(p,aimPitch),native=directMuzzle(comicPose(p));
  assert.equal(rifleRecoilOffset(p),-4);assert.ok(Math.abs(tip.x-native[0]+4)<1e-6);
  assert.ok(Math.abs(bullet.x-p.x-tip.x*facing)<1e-6);assert.ok(Math.abs(bullet.y-p.y-tip.y)<1e-6);assert.equal(w.flashX,bullet.x);assert.equal(w.flashY,bullet.y);
  w.update(.1);assert.ok(w.flash>0,'A maximum catch-up frame must not swallow the flash');
  const x=p.x;p.update(.0625,idle,floor);assert.ok(rifleRecoilOffset(p)>-4&&rifleRecoilOffset(p)<0);if(stance==='stand')assert.equal(p.x,x);
 }
});
test('rifle fire keeps the running leg phase instead of freezing or restarting it',()=>{
 for(let n=0;n<16;n++){
  const a={animation:'Run',animationTime:93,stride:(n+.2)/4,vx:280,weaponId:'rifle',recoil:1,deadTime:0};
  assert.equal(comicPose(a),`player.run-shoot.${n%4}`);assert.equal(comicPose({...a,recoil:0}),`player.run.${n%4}`);
 }
});
test('bullet trail grows forward from its muzzle with bounded source crops',()=>{
 const crops=new Set();let last=0;
 for(let i=0;i<=120;i++){
  const distance=i*.8,crop=bulletCrop(distance,146,32,86),width=crop[2]/146*86;
  assert.equal(crop[0]+crop[2],146);assert.ok(width>=last);assert.ok(width<=Math.max(86/146,distance)+1e-6);last=width;crops.add(crop.join(','));
 }
 assert.equal(last,86);assert.ok(crops.size<=39);
});
const target=(x,y)=>({alive:true,x,y,hits:0,bounds:{x:x-10,y:y-10,w:20,h:20},takeDamage(){this.hits++;return true;}});
test('both teams shoot bullets, pellets and rockets through jump decks in either direction',()=>{
 for(const owner of ['player','enemy'])for(const kind of ['bullet','pellet','rocket','cannon'])for(const direction of [-1,1]){
  const q=new ProjectileManager(new ParticlePool()),t=target(160,180),start=direction===1?0:320;
  q.spawn({owner,kind,x:start,y:180,direction,speed:1000,damage:1,range:1000});
  q.update(.32,t,[t],[{x:60,y:160,w:20,h:40,kind:'platform'},{x:230,y:160,w:20,h:40,kind:'platform',oneWay:true}]);
  assert.equal(t.hits,1,`${owner} ${kind} ${direction}`);
 }
});
test('upward and downward shots cross decks while ground and solid cover still stop them',()=>{
 for(const pitch of [Math.PI/2,-Math.PI/2])for(const kind of ['platform','ground','crate','step']){
  const q=new ProjectileManager(new ParticlePool()),t=target(100,pitch>0?300:0);
  q.spawn({owner:'player',kind:'bullet',x:100,y:pitch>0?0:300,pitch,direction:1,speed:1000,damage:1,range:1000});
  q.update(.32,t,[t],[{x:50,y:145,w:100,h:15,kind}]);assert.equal(t.hits,kind==='platform'?1:0,`${kind} ${pitch}`);
 }
});
test('homing and boss beams obey the same deck versus solid cover rule',()=>{
 for(const kind of ['platform','crate']){
  const solid={x:80,y:0,w:20,h:300,kind},q=new ProjectileManager(new ParticlePool()),t=target(200,130),p=new PlayerController();p.reset(200,100);
  q.spawn({owner:'player',kind:'rocket',x:0,y:100,direction:1,speed:1,damage:1,range:1000,homing:true});
  q.items[0].age=1;q.update(dt,t,[t],[solid]);assert.equal(q.items[0].target===t,kind==='platform');
  const beam=new BossBeam();beam.start({x:0,y:130},{x:200,y:130},400,.5);beam.update(dt,p,[solid]);assert.equal(p.health,kind==='platform'?4:5);
 }
});
