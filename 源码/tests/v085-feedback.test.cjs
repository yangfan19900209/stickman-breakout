const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = p => require('../.test-build/assets/scripts/' + p + '.js');
const { GameSession } = load('core/GameSession');
const { OceanSession } = load('ocean/OceanSession');
const { landAttackCooldown, cooldownRatio } = load('ui/ActionFeedback');
const { StatusBarCache } = load('ui/StatusBarCache');
const idle = { axis:0, vertical:0, jump:false, shoot:false };

test('knife recovery and contextual cuts show actual melee recovery without altering shot cooldown', () => {
  const s = new GameSession(); s.reset(); s.weapon.equip('knife');
  s.update(1/120, {...idle, shoot:true});
  assert.equal(s.melee.swings,1); assert.equal(s.weapon.cooldown,0);
  assert.equal(landAttackCooldown(s),1);
  for(let n=0;n<12;n++)s.update(1/120,idle);
  assert.ok(landAttackCooldown(s)>0.5 && landAttackCooldown(s)<0.7);
  for(let n=0;n<100;n++)s.update(1/120,idle);
  assert.equal(landAttackCooldown(s),0);
  s.weapon.equip('rifle'); s.melee.time=.2; s.melee.cooldown=.48;
  assert.equal(landAttackCooldown(s),1);assert.equal(s.weapon.shots,0);
});

test('water cooldown follows all four actual attacks, final-ammo fallback, pause and restart', () => {
  for(const [weapon,duration] of [['harpoon',.36],['sonar',.43],['torpedo',.80],['knife',.45]]){
    const s = new OceanSession();s.finishEntry();s.weapon=weapon;s.ammo=1;
    s.update(1/120,{...idle,shoot:true});
    assert.equal(s.attackCooldownDuration,duration);
    assert.equal(cooldownRatio(s.cooldown,s.attackCooldownDuration),1);
    if(weapon==='sonar'||weapon==='torpedo')assert.equal(s.weapon,'harpoon');
    s.pause();s.update(2,idle);assert.equal(s.cooldown,duration);
    s.resume();s.update(duration/2,idle);
    assert.ok(Math.abs(cooldownRatio(s.cooldown,s.attackCooldownDuration)-.5)<1e-9);
    s.reset();assert.equal(cooldownRatio(s.cooldown,s.attackCooldownDuration),0);
  }
});

test('unchanged boss health reuses geometry while damage, encounter changes and relayout repaint', () => {
  const cache = new StatusBarCache(), tank={}, submarine={};
  assert.ok(cache.changed(tank,42,42,320,7));
  for(let i=0;i<3600;i++)assert.equal(cache.changed(tank,42,42,320,7),false);
  assert.equal(cache.builds,1);
  assert.ok(cache.changed(tank,41,42,320,7));
  assert.ok(cache.changed(submarine,41,42,320,7));
  assert.ok(cache.changed(submarine,41,42,350,8));
  cache.invalidate();assert.ok(cache.changed(submarine,41,42,350,8));
  assert.equal(cache.builds,5);
});

// Exercise the actual bridge with a small engine playback boundary. This checks
// event dispatch and ownership; it does not claim speaker output verification.
const Module = require('node:module'), oldLoad = Module._load;
const cc = {
  AudioClip:class{}, AudioSource:class{},
  resources:{load:(name,type,done)=>done(null,{name:name.split('/').at(-1)})},
  assetManager:{getBundle:()=>({load:(name,type,done)=>done(null,{name,addRef(){return this;},decRef(){}})}),releaseAsset:()=>{}},
};
Module._load=function(name,...args){return name==='cc'?cc:oldLoad.call(this,name,...args);};
const { AudioBridge } = load('platform/AudioBridge');
Module._load=oldLoad;
async function soundFixture(){
  const played=[];const b=new AudioBridge({addComponent:()=>({isValid:true,playOneShot:c=>played.push(c.name),stop(){}})});
  await b.load();await b.loadOcean();return {b,played};
}

test('fatal water damage and its explosion dispatch exactly once, including final frame', async () => {
  const {b,played}=await soundFixture(),s=new OceanSession();s.finishEntry();b.updateOcean(s);
  s.player.health=0;s.state='dying';s.blastCount++;b.updateOcean(s);
  assert.deepEqual(played,['water-blast','hit']);
  b.updateOcean(s);s.state='gameover';b.updateOcean(s);assert.equal(played.length,2);
  assert.equal(b.status().byEffect.hit,1);
});

test('audio restart clears event serials and throttles; mute and pause never replay stale effects',async()=>{
  const {b,played}=await soundFixture(),s=new OceanSession();s.finishEntry();s.shots=4;s.hits=9;s.time=20;b.updateOcean(s);
  b.reset();s.reset();s.finishEntry();s.shots=1;s.hits=1;s.time=.1;b.updateOcean(s);
  assert.equal(played.filter(n=>n==='rifle').length,2);assert.equal(played.filter(n=>n==='melee-hit').length,2);
  s.pause();s.shots++;b.updateOcean(s);const n=played.length;s.resume();b.updateOcean(s);assert.equal(played.length,n);
  b.muted=true;s.shots++;b.updateOcean(s);b.muted=false;b.updateOcean(s);assert.equal(played.length,n);
  s.victory.start();s.victory.advance(1);b.updateOcean(s);const final=played.length;
  s.pause();b.updateOcean(s);s.resume();b.updateOcean(s);assert.equal(played.length,final);
  assert.ok(played.includes('water-blast'));
});

test('ocean clip completed after disposal is released without playback',async()=>{
  const pending=[],released=[];
  const originalBundle=cc.assetManager.getBundle,originalRelease=cc.assetManager.releaseAsset;
  cc.assetManager.getBundle=()=>({load:(name,type,done)=>pending.push(()=>done(null,{name}))});
  cc.assetManager.releaseAsset=clip=>released.push(clip.name);
  try{
    const b=new AudioBridge({addComponent:()=>({isValid:true,stop(){},destroy(){this.isValid=false;},playOneShot(){throw Error('disposed sound');}})});
    const done=b.loadOcean();b.destroy();for(const resolve of pending)resolve();await done;
    assert.deepEqual(released.sort(),['sonar','water-blast']);assert.equal(b.status().loaded,0);
  }finally{cc.assetManager.getBundle=originalBundle;cc.assetManager.releaseAsset=originalRelease;}
});
