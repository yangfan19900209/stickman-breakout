const {test}=require('node:test');
const assert=require('node:assert/strict');
const {VictorySequence,victoryBursts}=require('../.test-build/assets/scripts/core/VictorySequence.js');
const {VictoryHaptics}=require('../.test-build/assets/scripts/platform/VictoryHaptics.js');
const {GameSession}=require('../.test-build/assets/scripts/core/GameSession.js');
const {celebrationFrame,CelebrationFrames}=require('../.test-build/assets/scripts/render/CelebrationFrames.js');
const idle={axis:0,jump:false,shoot:false};
function win(){const s=new GameSession();s.reset();s.player.x=s.level.data.arena.start+280;s.update(1/120,idle);
  s.weapon.fire(s.player,s.projectiles,'player');assert.ok(s.weapon.flash>0);
  s.spawner.guard.takeDamage(1000,1,'explosion');s.update(1/120,idle);assert.ok(s.victory.active);assert.equal(s.weapon.flash,0);return s;}
test('victory impacts cross frame skips exactly once, then focus, cheer and reveal results',()=>{
  const v=new VictorySequence();assert.equal(v.phase,'idle');assert.deepEqual(v.advance(5),[]);
  v.start();assert.equal(v.phase,'collapse');assert.equal(v.advance(.45).length,2);
  assert.equal(v.advance(1.6).length,3);assert.equal(v.impactSerial,5);assert.deepEqual(v.advance(.6),[]);
  assert.equal(v.phase,'focus');assert.ok(v.focus>0&&v.focus<1);v.advance(1.2);
  assert.equal(v.phase,'cheer');assert.equal(v.focus,1);v.advance(2.1);
  assert.equal(v.phase,'settlement');assert.ok(v.resultProgress>0&&v.resultProgress<1);
  assert.equal(v.resultsReady,false);v.advance(1);assert.equal(v.resultProgress,1);assert.equal(v.resultsReady,true);
  assert.deepEqual(v.advance(100),[]);v.reset();assert.equal(v.phase,'idle');assert.equal(v.cheerTime,0);
  v.start();assert.equal(v.advance(2).length,victoryBursts.length);
});
test('boss victory ignores held combat input, freezes clear stats and cannot hurt the hero',()=>{
  const s=win(),before=s.snapshot(),explosions=s.explosions.total;
  s.explosions.schedule(s.player.x,s.player.y,200,100,'enemy');
  for(let i=0;i<900;i++)s.update(1/120,{axis:1,jump:true,jumpHeld:true,shoot:true,grenade:true,switchWeapon:true});
  assert.equal(s.state,'complete');assert.ok(s.victory.resultsReady);
  assert.equal(s.time,before.time);assert.equal(s.player.health,before.player.health);assert.equal(s.spawner.kills,before.kills);
  assert.equal(s.weapon.ammo,before.ammo);assert.equal(s.weapon.id,before.weapon);assert.equal(s.player.grenades,before.grenades);
  assert.equal(s.player.x,before.player.x);assert.ok(s.player.grounded);assert.equal(s.weapon.shots,1);
  assert.equal(s.weapon.flash,0);
  assert.ok(s.explosions.total>=explosions+5);assert.ok(s.player.celebrationTime>0);
  assert.ok(s.spawner.guard.deadTime<2.6);assert.ok(s.level.guardDefeated);
  assert.equal(s.projectiles.items.filter(p=>p.active).length,0);
});
test('pause suspends the victory timeline and restart clears the entire presentation',()=>{
  const s=win();s.update(.45,idle);const t=s.victory.time,serial=s.victory.impactSerial;
  s.pause();for(let i=0;i<100;i++)s.update(1/60,idle);
  assert.equal(s.victory.time,t);assert.equal(s.victory.impactSerial,serial);
  s.resume();s.update(.1,idle);assert.ok(s.victory.time>t);
  s.reset();assert.equal(s.victory.active,false);assert.equal(s.player.celebrationTime,0);assert.equal(s.shakeTime,0);
  s.update(1/120,{...idle,shoot:true});assert.equal(s.weapon.shots,1);
});
test('simultaneous player and boss death never produces a victory celebration',()=>{
  const s=new GameSession();s.reset();s.player.x=s.level.data.arena.start+280;s.update(1/120,idle);
  s.spawner.guard.takeDamage(1000,1,'explosion');s.player.health=0;s.update(1/120,idle);
  assert.equal(s.victory.active,false);assert.equal(s.state,'dying');
});
test('haptics request once per impact, prefer WeChat and tolerate unsupported or denied hardware',()=>{
  const calls=[],h=new VictoryHaptics({wx:{vibrateShort:o=>calls.push(o.type)},navigator:{vibrate:()=>{throw Error('wrong API');}}});
  const v={active:true,impactSerial:1,haptic:'light'};h.update(v);h.update(v);v.impactSerial=2;v.haptic='heavy';h.update(v);
  assert.deepEqual(calls,['light','heavy']);v.impactSerial=3;h.update(v,false);h.update(v,true);assert.equal(calls.length,2);
  h.update({...v,active:false});h.update({...v,impactSerial:1});assert.equal(calls.length,3);
  const browser=[],web=new VictoryHaptics({navigator:{vibrate:p=>{browser.push(p);return false;}}});
  web.update(v);assert.deepEqual(browser,[[55,40,70]]);
  assert.doesNotThrow(()=>new VictoryHaptics({}).update(v));
  assert.doesNotThrow(()=>new VictoryHaptics({wx:{vibrateShort:()=>{throw Error('denied');}}}).update(v));
});
test('cheer animation uses all four complete frames, with equal baselines and no weapon',()=>{
  const ids=new Set(Array.from({length:48},(_,i)=>celebrationFrame(i/24)));
  assert.equal(ids.size,4);
  for(const id of ids){const f=CelebrationFrames[id];assert.deepEqual(f.size,[450,580]);assert.equal(f.anchor[1],10/580);}
});
test('runtime cheer texture preserves every generated RGBA pixel and the four full-body crops fit',()=>{
  const fs=require('node:fs'),{PNG}=require('pngjs');
  const source=PNG.sync.read(fs.readFileSync('../素材/游戏美术/source/v063/celebration.png'));
  const runtime=PNG.sync.read(fs.readFileSync('assets/resources/comic/celebration.png'));
  assert.equal(runtime.width,source.width);assert.equal(runtime.height,source.height);assert.ok(runtime.data.equals(source.data));
  for(const f of Object.values(CelebrationFrames)){
    const [x,y,w,h]=f.atlas;assert.ok(x>=0&&y>=0&&x+w<=runtime.width&&y+h<=runtime.height);
    let solid=0;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(runtime.data[(yy*runtime.width+xx)*4+3]>200)solid++;
    assert.ok(solid>30000,'full soldier must be present');
  }
});
