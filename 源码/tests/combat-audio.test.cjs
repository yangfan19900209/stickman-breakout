const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {GameSession}=load('core/GameSession'),{OceanSession}=load('ocean/OceanSession');
const {EnemyController}=load('enemy/EnemyController');
const {CombatAudioEvents}=load('combat/CombatAudioEvents');
const dt=1/120;
async function fixture(){
 const played=[],requests=[];
 const cc={AudioSource:class{},AudioClip:class{},resources:{load(name,type,done){
  requests.push(name);assert.ok(fs.existsSync('assets/resources/'+name+'.wav'),name);
  done(null,{name:name.split('/').at(-1)});
 }},assetManager:{releaseAsset(){}}};
 class MusicBridge{prepare(){}reset(){}destroy(){}status(){return{};}}
 const file=path.resolve('.test-build/assets/scripts/platform/AudioBridge.js'),module={exports:{}},native=createRequire(file);
 vm.runInNewContext(fs.readFileSync(file,'utf8'),{module,exports:module.exports,console,
  require:k=>k==='cc'?cc:k==='./MusicBridge'?{MusicBridge}:native(k)});
 const b=new module.exports.AudioBridge({addComponent:()=>({isValid:true,stop(){},playOneShot(c,gain){played.push({name:c.name,gain});}})});
 await b.load();const s=new GameSession();s.reset();s.player.reset(1000,150);
 return {b,s,played,requests,names:()=>played.map(p=>p.name)};
}
function shot(s,patch={}){return s.projectiles.spawn({owner:'enemy',x:900,y:190,direction:1,speed:6000,damage:1,range:1200,...patch});}

test('enemy fire survives same-step collision, plays once, and failed/full-pool shots stay silent',async()=>{
 const {b,s,played,names}=await fixture();assert.ok(shot(s));
 s.projectiles.update(dt,s.player,[],[{x:920,y:150,w:10,h:100}]);
 assert.ok(!s.projectiles.items.some(p=>p.active));b.update(s);b.update(s);
 assert.deepEqual(names(),['enemy-shot']);
 s.projectiles.reset();for(let i=0;i<s.projectiles.items.length;i++)assert.ok(shot(s,{owner:'player'}));
 assert.equal(shot(s),false);s.time=1;b.update(s);assert.equal(played.length,1);
});
test('boss volleys coalesce, later bursts remain audible, and player rockets are not doubled',async()=>{
 const {b,s,names}=await fixture();for(let i=0;i<7;i++)shot(s,{tier:'boss'});b.update(s);
 assert.deepEqual(names(),['boss-shot']);s.time=.05;shot(s,{tier:'boss'});b.update(s);assert.equal(names().length,1);
 s.time=.2;shot(s,{tier:'boss'});b.update(s);assert.equal(names().length,2);
 s.weapon.equip('rocket',2);assert.ok(s.weapon.fire(s.player,s.projectiles,'player'));b.update(s);
 assert.equal(names().filter(n=>n==='rocket').length,1);
});
test('land boss actual attack cycle emits machine-gun, cannon, missile, beam, slam and charge sounds',()=>{
 const s=new GameSession();s.reset();s.level.arenaEntered=true;
 const b=s.spawner.guard;s.player.x=b.x-540;s.player.y=150;const sounds=new Set();
 for(let n=0;n<120*40;n++){
  s.player.invincible=1;b.update(dt,s.player,s.level,s.projectiles);
  for(const e of s.projectiles.audio.drain())sounds.add(e.sound);
 }
 for(const name of ['boss-shot','cannon','rocket','beam','slam','charge'])assert.ok(sounds.has(name),name);
 assert.ok(b.beam.serial>0);assert.ok(b.attackCounts.leap>0);
});
test('melee and shield attacks sound on the strike, never on the warning',()=>{
 for(const kind of ['melee','shield']){
  const s=new GameSession();s.reset();s.player.reset(960,150);
  const e=new EnemyController({id:'audio-melee',kind,x:1000,y:150,patrol:20});e.grounded=true;e.attackCooldown=0;
  e.tactics.action=kind==='melee'?'swing':'bash';e.windup=.1;
  e.tactics.update(e,dt,s.player,s.level,s.projectiles);assert.equal(s.projectiles.audio.drain().length,0);
  e.windup=dt;e.tactics.update(e,dt,s.player,s.level,s.projectiles);
  assert.deepEqual(s.projectiles.audio.drain().map(e=>e.sound),['enemy-melee']);
 }
});
test('ocean enemy and both boss tiers use their real projectile paths; beam starts once',async()=>{
 const {b,names}=await fixture(),s=new OceanSession();s.finishEntry();s.player.x=s.boss.x-500;s.player.y=s.boss.y;
 for(const kind of ['harpoon','torpedo','sonar','bomb']){
  s.spawnShot('enemy',kind,s.player.x+100,s.player.y+35,200,0,1,3,kind==='bomb'?'boss':'standard');
 }
 b.updateOcean(s);for(const n of ['enemy-shot','rocket','enemy-sonar','cannon'])assert.ok(names().includes(n),n);
 s.time=1;s.boss.active=true;s.boss.mode='tell';s.boss.attack='laser';s.boss.timer=dt;s.boss.locked=true;
 s.updateBoss(dt);assert.ok(s.boss.beamActive);b.updateOcean(s);s.updateBoss(dt);b.updateOcean(s);
 assert.equal(names().filter(n=>n==='beam').length,1);
 s.projectiles.forEach(p=>p.active=false);s.attackAudio.reset();s.boss.attack='torpedo';s.boss.volleyRemaining=1;
 s.fireBossVolley();assert.ok(s.attackAudio.drain().some(e=>e.sound==='rocket'));
 s.projectiles.forEach(p=>p.active=false);s.mini.attack='sonar';s.fireMiniSub(s.mini);
 assert.ok(s.attackAudio.drain().some(e=>e.sound==='enemy-sonar'));
});
test('muting, pause, new session, distance and reset cannot replay old combat sounds',async()=>{
 const {b,s,played,names}=await fixture();
 s.pause();shot(s);b.update(s);s.resume();b.update(s);assert.equal(played.length,0);
 b.muted=true;shot(s);b.update(s);b.muted=false;b.update(s);assert.equal(played.length,0);
 shot(s,{x:5000});b.update(s);assert.equal(played.length,0);
 shot(s);b.update(s);assert.equal(played.length,1);assert.ok(played[0].gain<.24);
 b.reset();s.reset();s.player.reset(1000,150);shot(s);b.update(s);assert.equal(played.length,2);
 b.destroy();shot(s);b.update(s);assert.equal(played.length,2);assert.ok(!names().includes('step'));
});
test('rocket impacts use redesigned blast while grenade and barrel sounds remain distinct',async()=>{
 const {b,s,names}=await fixture();
 for(const style of ['rocket','cannon','boss'])s.explosions.enqueue(1200,200,60,0,'enemy',style);
 s.explosions.flush(()=>{});b.update(s);assert.deepEqual(names(),['rocket-blast']);b.update(s);assert.equal(names().length,1);
 s.explosions.enqueue(1200,200,60,0,'player','grenade');s.explosions.flush(()=>{});b.update(s);
 assert.deepEqual(names(),['rocket-blast','blast']);
 s.pause();s.explosions.enqueue(1200,200,60,0,'player','rocket');s.explosions.flush(()=>{});b.update(s);s.resume();b.update(s);
 assert.equal(names().length,2);
});
test('attack audio stays bounded without a renderer and resets between attempts',()=>{
 const events=new CombatAudioEvents();for(let i=0;i<1000;i++)events.emit('enemy-shot',i,0);
 const pending=events.drain();assert.equal(pending.length,64);assert.equal(pending.at(-1).x,999);
 assert.equal(events.drain().length,0);events.emit('beam',0,0);events.reset();assert.equal(events.drain().length,0);
});
