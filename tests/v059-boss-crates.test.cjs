const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),{PNG}=require('pngjs');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {GameSession}=load('core/GameSession'),{objectPresentation}=load('render/ObjectPresentation');
const {colossusPresentation,colossusSocket}=load('render/ColossusPresentation');
const {MechFrames,MechScale}=load('render/MechFrames'),{BossBeam}=load('combat/BossBeam'),{PlayerController}=load('player/PlayerController');
const {GameConfig:C}=load('core/GameConfig');
const input={axis:0,jump:false,shoot:false},dt=1/120;
function fixture(){const s=new GameSession();s.reset();s.level.arenaEntered=true;s.player.x=7300;s.player.y=150;return{s,b:s.spawner.guard,p:s.player};}
function until(f,predicate,limit=120*25){for(let n=0;n<limit;n++){f.b.update(dt,f.p,f.s.level,f.s.projectiles);if(predicate())return;}throw Error('Boss state not reached');}

test('live crate stays one full-size intact body through every damage stage; death removes collision and drops once',()=>{
 const s=new GameSession();s.reset();const o=s.level.objects.objects.find(o=>o.id==='shotgun-cache');
 const first=objectPresentation(o),bounds={...o.bounds};assert.equal(first.id,'crate.intact');
 for(let hp=o.maxHealth;hp>0;hp--){
  const v=objectPresentation(o);assert.equal(v.id,'crate.intact');assert.equal(v.width,first.width);assert.equal(v.height,first.height);
  assert.deepEqual(o.bounds,bounds);assert.ok(o.solid);assert.ok(s.level.solids.some(r=>r.entityId===o.id));
  o.takeDamage(1,1);s.update(dt,input);
 }
 assert.equal(o.alive,false);assert.equal(o.solid,false);assert.equal(objectPresentation(o).id,'crate.debris');
 assert.ok(!s.level.solids.some(r=>r.entityId===o.id));
 const count=s.pickups.items.filter(p=>p.active&&p.kind==='shotgun').length;
 assert.equal(count,1);for(let n=0;n<50;n++)s.update(dt,input);
 assert.equal(s.pickups.items.filter(p=>p.active&&p.kind==='shotgun').length,1);
});

test('three supplied RGBA sheets produce padded native mech, warning, projectile and explosion cuts without repainted pixels',()=>{
 const m=JSON.parse(fs.readFileSync('art/v059-manifest.json'));assert.equal(m.sources.length,3);assert.equal(m.frames.length,23);
 const sources=m.sources.map(s=>{const b=fs.readFileSync(s.file);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),s.sha256);assert.deepEqual(s.size,[1448,1086]);assert.ok(s.transparentPixels>400000);return PNG.sync.read(b);});
 const atlas=PNG.sync.read(fs.readFileSync('assets/resources/comic/mech.png'));assert.ok(atlas.width<=2048&&atlas.height<=2048);assert.ok(m.textureBytes<500*1024);
 for(const f of m.frames){
  const im=PNG.sync.read(fs.readFileSync(f.file)),source=sources[f.source];assert.deepEqual(MechFrames[f.id].size,f.size);
  assert.ok(Math.abs(f.origin[0]+f.anchor[0]*f.size[0]-f.pivotSource[0])<1e-8);
  assert.ok(Math.abs(f.origin[1]+(1-f.anchor[1])*f.size[1]-f.pivotSource[1])<1e-8);
  for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){const i=(y*im.width+x)*4;if(im.data[i+3]===0)continue;const o=((y+f.origin[1])*source.width+x+f.origin[0])*4;for(let c=0;c<4;c++)assert.equal(im.data[i+c],source.data[o+c],f.id);}
  const [x,y,w,h]=f.atlas;assert.ok(x>=4&&y>=4&&x+w+4<=atlas.width&&y+h+4<=atlas.height);
 }
});

test('native mech soles and muzzle mirror together; charge, damage, collapse and wreck each use one whole frame',()=>{
 const a={x:1000,y:150,facing:-1,animation:'Idle',animationTime:0,deadTime:0,health:132,maxHealth:132,recoil:0,action:'salvo'};
 for(const state of [{},{action:'stomp',windup:.8},{action:'laser',windup:1},{action:'laser',recoil:2},{health:30},{animation:'Dead',deadTime:.8},{animation:'Dead',deadTime:1.5}]){
  const left={...a,...state},right={...left,facing:1},v=colossusPresentation(left),l=colossusSocket(left),r=colossusSocket(right);
  assert.ok(v.id.startsWith('mech.'));assert.equal(v.scale,MechScale);assert.equal(v.flip,1);
  assert.equal(colossusPresentation(right).flip,-1);assert.ok(Math.abs(l.x+r.x-2000)<1e-8);assert.equal(l.y,r.y);
 }
 const charge=colossusSocket({...a,action:'laser',recoil:2});assert.ok(charge.x<900);assert.ok(charge.y>280);
 assert.equal(colossusPresentation({...a,animation:'Dead',deadTime:1.5}).id,'mech.wreck');
});

test('six boss attacks keep warnings, locked targets and bounded projectiles in both phases',()=>{
 for(const phase of [1,2]){
  const f=fixture();if(phase===2){f.b.active=true;f.b.takeDamage(70,1);}
  const warnings=new Set();let prev=0;
  for(let n=0;n<120*21;n++){
   f.b.update(dt,f.p,f.s.level,f.s.projectiles);
   if(f.b.windup>0){warnings.add(f.b.attack);assert.ok(f.b.warningTime>0);}
   const emitted=Object.values(f.b.attackCounts).reduce((a,b)=>a+b,0);
   if(emitted>prev)assert.ok(warnings.has(f.b.attack),'Attack fired without warning');prev=emitted;
  }
  assert.equal(warnings.size,6);for(const count of Object.values(f.b.attackCounts))assert.ok(count>0);
  assert.equal(f.s.projectiles.dropped,0);assert.equal(f.b.phase,phase);
  assert.ok(f.b.beam.serial>0);assert.ok(f.b.impactSerial>0);
 }
});

test('laser warning deals no damage, locks the target, fires at the painted charge muzzle and permits evasion',()=>{
 const f=fixture();until(f,()=>f.b.attack==='laser'&&f.b.windup>0);
 const hp=f.p.health,locked=f.b.warningX;assert.equal(f.b.beam.active,false);
 f.p.x=locked-220;
 for(let n=0;n<40;n++)f.b.update(dt,f.p,f.s.level,f.s.projectiles);
 assert.equal(f.p.health,hp);assert.equal(f.b.warningX,locked);
 until(f,()=>f.b.beam.active);
 const muzzle=colossusSocket(f.b);assert.equal(f.b.beam.x,muzzle.x);assert.equal(f.b.beam.y,muzzle.y);
 const expected=Math.atan2(f.b.warningTargetY-muzzle.y,locked-muzzle.x);assert.equal(f.b.beam.angle,expected);
 for(let n=0;n<80;n++)f.b.update(dt,f.p,f.s.level,f.s.projectiles);
 assert.equal(f.b.beam.active,false);assert.equal(f.p.health,hp);
});

test('live laser hits once, stops at cover and misses a jumping player',()=>{
 const p=new PlayerController();p.reset(400,150);const beam=new BossBeam();
 beam.start({x:700,y:185},{x:400,y:185},700,.55);for(let n=0;n<60;n++)beam.update(dt,p,[]);
 assert.equal(beam.hits,1);assert.equal(p.health,4);
 p.reset(400,150);beam.start({x:700,y:185},{x:400,y:185},700,.55);beam.update(dt,p,[{x:500,y:150,w:30,h:100}]);
 assert.equal(p.health,5);assert.equal(beam.endX,530);assert.equal(beam.length,170);
 p.reset(400,290);beam.start({x:700,y:185},{x:400,y:185},700,.55);beam.update(dt,p,[]);assert.equal(p.health,5);
 beam.stop();assert.equal(beam.active,false);assert.equal(beam.length,0);
});

test('shoulder missiles launch from native pods and reach the marked ground; fan cannon produces three real trajectories',()=>{
 const f=fixture();until(f,()=>f.s.projectiles.items.some(p=>p.active&&p.visual==='mech-missile'));
 const rocket=f.s.projectiles.items.find(p=>p.active&&p.visual==='mech-missile'),pod=colossusSocket(f.b,'leftPod'),flight=C.colossus.missileFlight;
 assert.equal(rocket.x,pod.x);assert.equal(rocket.y,pod.y);assert.ok(Math.abs(rocket.x+rocket.vx*flight-f.b.warningX)<1e-6);
 assert.ok(Math.abs(rocket.y+rocket.vy*flight-.5*rocket.gravity*flight*flight-f.b.warningY)<1e-6);
 until(f,()=>f.s.projectiles.items.some(p=>p.active&&p.visual==='mech-round'));
 const fan=f.s.projectiles.items.filter(p=>p.active&&p.visual==='mech-round');assert.equal(fan.length,3);
 assert.equal(new Set(fan.map(p=>Math.atan2(p.vy,p.vx).toFixed(4))).size,3);
 const muzzle=colossusSocket(f.b);for(const p of fan){assert.equal(p.x,muzzle.x);assert.equal(p.y,muzzle.y);assert.equal(p.damage,1);}
});

test('retreat, player death and boss death clear the active laser without healing or stun-locking the boss',()=>{
 for(const reason of ['retreat','player-death','boss-death']){
  const f=fixture();until(f,()=>f.b.beam.active);f.b.takeDamage(1,1);const hp=f.b.health;
  assert.ok(f.b.beam.active);if(reason==='retreat')f.s.level.arenaEntered=false;
  // Isolate the death transition: the preceding live beam may have granted
  // normal damage invincibility, which would otherwise reject this setup hit.
  if(reason==='player-death'){f.p.invincible=0;assert.ok(f.p.takeDamage(99,-1));}if(reason==='boss-death')f.b.takeDamage(999,1);
  f.b.update(dt,f.p,f.s.level,f.s.projectiles);assert.equal(f.b.beam.active,false,reason);assert.equal(f.b.windup,0);
  if(reason==='retreat'){f.s.level.arenaEntered=true;f.b.update(dt,f.p,f.s.level,f.s.projectiles);assert.equal(f.b.health,hp);}
 }
});

test('evasive facing changes do not pan away from the giant, while leaving the arena restores normal camera freedom',()=>{
 const f=fixture();f.p.x=7300;f.s.camera.visibleWidth=1250;f.s.camera.zoom=1.024;
 f.p.facing=-1;for(let n=0;n<120;n++)f.s.update(dt,input);
 const camera=f.s.camera.x;assert.ok(f.b.x-camera<1250-150);assert.ok(f.p.x-camera>250);assert.equal(f.p.facing,-1);
 f.p.x=6700;for(let n=0;n<120;n++)f.s.update(dt,input);
 assert.equal(f.s.level.arenaEntered,false);assert.ok(f.s.camera.x<camera-300);
});
