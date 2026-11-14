import {chromium} from 'playwright';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {combatSprites} from './combat-sprites.mjs';
const {PlaytestBrain}=createRequire(import.meta.url)('./playtest-brain.cjs');
const {OceanBrain}=createRequire(import.meta.url)('./ocean-brain.cjs');
const {BossFrames}=createRequire(import.meta.url)('../.test-build/assets/scripts/render/BossFrames.js');
const projectileOnly=process.argv.includes('--projectiles-only');
const desktop=process.argv.includes('--desktop'),prefix=projectileOnly?'v104-projectiles':desktop?'v104-desktop':'v104-mobile',viewport=desktop?{width:1280,height:720}:{width:852,height:393};
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport,deviceScaleFactor:3,hasTouch:true,serviceWorkers:'block'});
const startedAt=new Date().toISOString(),errors=[],failed=[],captures=[],seen=new Set(),held=new Set(),projectiles=new Map(),bossFrames=new Set(),events=[],milestones=[],damage=[];
const barrelEvidence=[],victoryPhases=[],paletteEvidence=[],bossBlastSequence=[];let trackedBlast;
const halfSupply=[];
let s,firstHit,defeated,miniHit,miniDefeated,bossEntry,lastMark=0;
const afterMini=new Set(createRequire(import.meta.url)("../.test-build/assets/scripts/level/LevelData.js").AbandonedBase.enemies.filter(e=>e.unlockAfter==="mini").map(e=>e.id));
const encounter={lockedSamples:0,released:false,reward:false,rifleBossHits:0};
const framing={samples:0,minHeadClearance:Infinity,worst:null};
const pursuit={outsideArenaSamples:0,minBossX:Infinity,barSamples:0};
const projectileKeys=['player-standard-bullet','enemy-standard-bullet','player-standard-rocket','enemy-mini-cannon','enemy-standard-cannon'];
const captured=key=>projectiles.get(key)?.maxWidth>=projectiles.get(key)?.fullWidth-.1;
const projectileCoverage=()=>projectileKeys.every(captured);
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>failed.push(r.url()));
const read=()=>page.evaluate(()=>globalThis.__BREAKOUT__.snapshot());
async function capture(name){if(seen.has(name))return;seen.add(name);const file=`../开发进度/验证记录/${prefix}-${name}.png`;await page.screenshot({path:file,timeout:60000});captures.push(file);}
await page.addInitScript(()=>{
 globalThis.wx={getWindowInfo:()=>({windowWidth:innerWidth,windowHeight:innerHeight}),getMenuButtonBoundingClientRect:()=>({left:innerWidth-96,top:12,width:88,height:32})};
 let shell;Object.defineProperty(globalThis,'__BREAKOUT_PLATFORM__',{configurable:true,get:()=>shell,set(v){shell=v;shell.safeInsets=()=>({left:59,right:0,top:0,bottom:21});}});
});
try{
 await page.clock.install({time:new Date('2026-11-11T04:00:00Z')});await page.goto('http://127.0.0.1:4190/');await page.waitForFunction(()=>globalThis.__BREAKOUT__);
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));assert.equal(await page.evaluate(()=>globalThis.__BREAKOUT__.version),'1.0.4');
 // Align the first input to the test clock's animation-frame boundary so
 // bootstrap loading time does not change the entire route's key cadence.
 await page.clock.runFor(await page.evaluate(()=>16-(performance.now()%16)));
 await page.locator('#GameCanvas').focus();await page.keyboard.press('Enter');await page.clock.runFor(32);s=await read();const brain=new PlaytestBrain({healthThreshold:4});
 for(let n=0;n<10500&&s.state!=='gameover'&&!(s.state==='complete'&&s.victory.resultsReady);n++){
  const f=brain.next(s),keys=new Set();
  if(projectileOnly){
   // This separate art check deliberately leaves the launcher alive long
   // enough to fire. It is not evidence of sustained-fire battle difficulty.
   const miniPending=s.miniBoss.active&&s.miniBoss.health>0&&!captured('enemy-mini-cannon');
   const launcherPending=!captured('enemy-standard-cannon')&&s.enemies.some(e=>e.kind==='turret'&&e.health>0&&Math.abs(e.x-s.player.x)<800);
   if(miniPending||launcherPending){f.shoot=false;f.grenade=false;}
  }
  // The mini-boss commits its hull direction before rushing. Dodge with the
  // same visible cue and ordinary jump used by the previous combat playtest.
  if(s.miniBoss.health>0&&s.miniBoss.mode==='ramming'&&Math.abs(s.miniBoss.x-s.player.x)<250)f.jumpHeld=true;
  // Use the available second jump against an arriving round during an early
  // catwalk crossing; a grounded-only dodge cannot react once already in air.
  if(!s.arenaEntered&&!(s.miniBoss.active&&s.miniBoss.health>0)&&!s.player.grounded&&s.player.airJumpsRemaining>0&&s.player.vy<100){
   const threat=s.projectileStates.some(p=>{
    if(p.owner!=='enemy')return false;
    const relative=p.vx-s.player.vx;if(Math.abs(relative)<1)return false;
    const t=(s.player.x-p.x)/relative;if(t<0||t>.3)return false;
    const y=p.y+p.vy*t-.5*(p.gravity??0)*t*t;
    return y>s.player.y-15&&y<s.player.y+90;
   });
   if(threat){f.jumpHeld=true;if(held.has('Space')){await page.keyboard.up('Space');held.delete('Space');}}
  }
  if(f.axis>0)keys.add('KeyD');if(f.axis<0)keys.add('KeyA');if(f.shoot)keys.add('KeyJ');if(f.jumpHeld)keys.add('Space');if(f.crouch&&!f.jumpHeld)keys.add('KeyS');if(f.aimY)keys.add('KeyW');if(f.grenade)keys.add('KeyK');
  for(const k of held)if(!keys.has(k)){await page.keyboard.up(k);held.delete(k);}for(const k of keys)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
  assert.ok(s.player.x >= s.progression.retreatLimit+s.player.halfWidth-.1 || s.player.x >= s.progression.retreatLimit);
  const before=s;await page.clock.runFor(projectileOnly?50:34);s=await read();const b=s.boss;
  const burst=s.objects.find(o=>o.kind==='barrel'&&!o.alive&&o.deadTime>0&&o.deadTime<.09&&o.x>s.cameraX&&o.x<s.cameraX+s.display.worldVisibleWidth);
  if(burst&&!seen.has('barrel-first-frames')){
   barrelEvidence.push({time:s.time,object:burst,explosions:s.explosions,combat:s.art.combat});
   await capture('barrel-first-frames');
  }
  for(const tier of ['mini','boss'])if(!paletteEvidence.some(e=>e.tier===tier)&&s.art.combat.projectiles.some(p=>p.owner==='enemy'&&p.tier===tier&&p.width>p.fullWidth*.8)){
   const sprites=await combatSprites(page),shot=s.art.combat.projectiles.find(p=>p.owner==='enemy'&&p.tier===tier&&p.width>p.fullWidth*.8);
   const actual=sprites.find(p=>p.node.startsWith('Comic combat pool/')&&Math.hypot(p.x-shot.x+s.cameraX,p.y-shot.y)<.1);
   // Presentation records can include offscreen candidates. Wait until an
   // actual rendered sprite is available before validating its tint.
   if(actual){assert.deepEqual(actual.color,[255,255,255,255]);
    paletteEvidence.push({tier,time:s.time,shot,actual});await capture('monochrome-'+tier+'-ammunition');}
  }
  const liveBlasts=s.art.combat.blasts??[];
  if(!trackedBlast)trackedBlast=liveBlasts.find(b=>b.owner==='enemy'&&b.style==='boss'&&b.age<.1);
  const tracked=trackedBlast&&liveBlasts.find(b=>b.x===trackedBlast.x&&b.y===trackedBlast.y);
  if(tracked&&!bossBlastSequence.some(b=>b.frame===tracked.frame)){
   const sprites=await combatSprites(page);assert.ok(sprites.some(v=>v.frame===tracked.frame));assert.ok(sprites.every(v=>!v.frame.startsWith('mech.blast')));
   bossBlastSequence.push({...tracked,time:s.time,sprites});await capture('colored-boss-blast-'+bossBlastSequence.length);
  }
  if(s.victory.active&&!victoryPhases.includes(s.victory.phase)){
   victoryPhases.push(s.victory.phase);await capture('ending-'+s.victory.phase);
  }
  if(s.miniBoss.health>0){assert.ok(s.pendingEnemies>0);assert.ok(s.enemies.every(e=>!afterMini.has(e.id)));encounter.lockedSamples++;}
  if(before.miniBoss.health>0&&s.miniBoss.health===0){assert.equal(s.pendingEnemies,0);encounter.released=true;encounter.reward=s.recoverySpawned.includes("after-tank");await capture("mini-defeated-reward");}
  if(s.miniBoss.active&&s.miniBoss.health>0)await capture("mini-platform-layout");
  if(before.weapon==="rifle"&&Math.abs(before.guardHealth-s.guardHealth-2)<.001)encounter.rifleBossHits++;
  if(s.player.health<before.player.health)damage.push({time:s.time,x:s.player.x,y:s.player.y,hp:s.player.health,boss:before.boss,input:f,shots:before.projectileStates.filter(p=>p.owner==='enemy'&&Math.abs(p.x-before.player.x)<220)});
  if(s.arenaEntered&&!bossEntry)bossEntry={time:s.time,hp:s.player.health,weapon:s.weapon,ammo:s.ammo,grenades:s.grenades};
  if(s.miniBoss.health<s.miniBoss.maxHealth)miniHit??=s.time;if(s.miniBoss.health===0)miniDefeated??=s.time;
  if(b.active&&s.guardHealth<b.maxHealth)firstHit??=s.time;if(s.guardHealth===0)defeated??=s.time;
  for(const p of s.art.combat.projectiles){
   const key=[p.owner,p.tier,p.kind].join('-');const old=projectiles.get(key);
   projectiles.set(key,{frame:p.frame,samples:(old?.samples??0)+1,fullWidth:p.fullWidth,maxWidth:Math.max(p.width,old?.maxWidth??0),maxHeight:Math.max(p.height,old?.maxHeight??0)});
   if(p.width>=p.fullWidth-.1&&p.kind!=='pellet')await capture('projectile-'+key);
  }
  if(b.active){
   if(s.guardHealth>0&&s.state==='playing'){
    assert.ok(s.presentation.bossBar.visible,'engaged boss bar must remain visible');assert.equal(s.presentation.objective.visible,false);pursuit.barSamples++;
    pursuit.minBossX=Math.min(pursuit.minBossX,b.x);
    if(!s.arenaEntered){pursuit.outsideArenaSamples++;await capture('pursuit-outside-arena');}
   }
   const frame=s.art.renderedBoss?.frame;if(frame)bossFrames.add(frame);
   const drawn=s.art.renderedBoss;
   if(b.introTime===0&&drawn?.visible&&s.guardHealth>0&&s.state==='playing'){
    const top=s.display.worldY+(drawn.y+drawn.height*(1-BossFrames[frame].anchor[1]))*s.display.combatZoom;
    const clearance=s.display.bossCeiling-top;
    framing.samples++;
    if(clearance<framing.minHeadClearance){
     framing.minHeadClearance=clearance;
     framing.worst={time:s.time,mode:b.mode,attack:b.attack,drawn,display:s.display,bossY:b.y,windup:b.windup,top};
     if(clearance<0){await capture('framing-overlap');if(!seen.has('framing-warning')){seen.add('framing-warning');console.log('FRAMING '+JSON.stringify(framing.worst));}}
    }
   }
   if(b.windup>0)await capture('tell-'+b.attack);
   if(b.mode==='enraging')await capture('enrage');
   if(b.mode==='charging')await capture('charging');
   if(b.mode==='leaping'&&b.y>220)await capture('leaping');
   if(before.boss.mode==='leaping'&&b.grounded)await capture('landing');
   if(b.mode!==before.boss.mode||b.attack!==before.boss.attack||s.guardHealth!==before.guardHealth)events.push({time:s.time,hp:s.player.health,bossHP:s.guardHealth,mode:b.mode,attack:b.attack,phase:b.phase,x:b.x,y:b.y,frame});
   if(drawn?.visible&&(b.x-s.cameraX)*s.display.combatZoom<s.display.width-drawn.width*s.display.combatZoom)await capture('boss-size');
  }
  if(n%300===0){writeFileSync('../开发进度/验证记录/v104-campaign-progress.json',JSON.stringify({n,time:s.time,state:s.state,player:s.player,boss:b,weapon:s.weapon,ammo:s.ammo,progression:s.progression,input:f}));if(b.active)console.log(JSON.stringify({n,time:s.time,hp:s.player.health,bhp:s.guardHealth,bx:b.x,by:b.y,px:s.player.x,py:s.player.y,mode:b.mode}));}
  assert.ok(!s.recoverySpawned.includes('colossus-half-rockets'), 'removed mid-fight rocket supply returned');
  assert.ok(!s.pickups.some(p=>p.sourceId==='colossus-half-rockets'));
  if(s.player.x>lastMark+2000){lastMark=s.player.x;const item={time:s.time,x:lastMark,hp:s.player.health};milestones.push(item);console.log(JSON.stringify(item));}
  if(projectileOnly&&projectileCoverage())break;
 }
 for(const k of held)await page.keyboard.up(k);await capture('result');
 const report={halfSupply,paletteEvidence,bossBlastSequence,barrelEvidence,victoryPhases,version:'1.0.4',startedAt,method:projectileOnly?'Normal-keyboard art check, deliberately holding fire near ordinary and mini-boss launchers until their ammunition is captured. Partial route with normal damage, read-only snapshots and controlled clock; not sustained-fire difficulty evidence.':'Complete normal-keyboard campaign; read-only snapshots and controlled clock; normal health, ammo and enemy states, no teleports or deliberate cease-fire tour.',viewport:{...viewport,dpr:3},bossEntry,firstHit,defeated,fightDuration:defeated-firstHit,miniFightDuration:miniDefeated-miniHit,encounter,framing,pursuit,projectiles:Object.fromEntries(projectiles),bossFrames:[...bossFrames],milestones,events,damage,captures,errors,failed,final:s};
 writeFileSync(`../开发进度/验证记录/${prefix}.json`,JSON.stringify(report,null,2));
 assert.ok(s.player.health>0);
 if(projectileOnly)assert.ok(projectileCoverage());
 else{
  assert.ok(barrelEvidence.length>0,'first barrel destruction frames captured');
  assert.deepEqual(victoryPhases,['collapse','focus','cheer','settlement']);
  assert.equal(s.state,'complete');assert.equal(s.guardHealth,0);assert.equal(s.miniBoss.health,0);
  // A full-inventory kill may skip later patterns; the rifle-only fixture and
  // model campaign separately cover all four attacks without an invulnerability gate.
  assert.ok(Object.values(s.miniBoss.attackCounts).filter(n=>n>0).length>=2);
  assert.ok(Object.values(s.boss.attackCounts).filter(n=>n>0).length>=2);
  assert.ok(encounter.lockedSamples>100&&encounter.released&&encounter.reward);assert.equal(s.miniBoss.maxHealth,68);assert.ok(report.miniFightDuration>5&&report.miniFightDuration<30);
  assert.ok(seen.has('leaping')&&seen.has('enrage'));
  assert.equal(halfSupply.length,0,'final boss no longer grants mid-fight rockets');
  assert.ok(framing.samples>100&&framing.minHeadClearance>0,JSON.stringify(framing));
 }
 assert.equal(paletteEvidence.length,2);assert.ok(bossBlastSequence.length>=5);
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 console.log(JSON.stringify({state:s.state,hp:s.player.health,fightDuration:report.fightDuration,miniFightDuration:report.miniFightDuration,attacks:s.boss.attackCounts,projectiles:report.projectiles}));
 // Continue from the real first-chapter settlement, without a URL skip or
 // debug transition. The same input confirms the second-chapter ending.
 const landFinal=s; assert.equal(s.personalRecords.records.cleared,1); assert.ok(s.personalRecords.result.valid); assert.equal(s.personalRecords.records.times[1].ms,s.personalRecords.result.ms);
 assert.equal(s.presentation.resultPrimary,'进入第二关  →');
 await page.keyboard.press('Enter');
 for(let n=0;n<200&&s.chapter!==2;n++){await page.clock.runFor(50);s=await read();}
 assert.equal(s.chapter,2);assert.equal(s.player.health,5);
 const oceanStart=s,oceanBrain=new OceanBrain(),oceanMilestones=[];let oceanZone='';held.clear();
 for(let n=0;n<6500&&s.state!=='gameover'&&!(s.state==='complete'&&s.victory.resultsReady);n++){
  const f=oceanBrain.next(s),keys=new Set();
  if(f.axis>0)keys.add('KeyD');if(f.axis<0)keys.add('KeyA');if(f.vertical>0)keys.add('KeyW');if(f.vertical<0)keys.add('KeyS');if(f.shoot)keys.add('KeyJ');if(f.jump)keys.add('Space');
  for(const k of held)if(!keys.has(k)){await page.keyboard.up(k);held.delete(k);}for(const k of keys)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
  await page.clock.runFor(50);s=await read();
  assert.equal(s.chapterAssets.flightLoaded,false);
  if(s.zone!==oceanZone){oceanZone=s.zone;const p={zone:oceanZone,time:s.time,x:s.player.x,hp:s.player.health};oceanMilestones.push(p);console.log(JSON.stringify(p));}
 }
 for(const k of held)await page.keyboard.up(k);held.clear();
 assert.equal(s.state,'complete');assert.ok(s.player.health>0&&s.victory.resultsReady);
 assert.equal(s.presentation.resultPrimary,'返回首页  →');
 assert.equal(s.boss.hp,0);assert.equal(s.miniBoss.hp,0);
 await capture('chapter2-release-ending');const oceanFinal=s; assert.equal(s.personalRecords.records.cleared,2); assert.ok(s.personalRecords.result.valid); assert.equal(s.personalRecords.records.times[2].ms,s.personalRecords.result.ms);
 await page.keyboard.press('Enter');await page.clock.runFor(150);s=await read();
 assert.equal(s.chapter,1);assert.equal(s.state,'title');assert.equal(s.chapterAssets.flightLoaded,false);assert.equal(s.chapterAssets.oceanFrames,0);
 await capture('release-return-home');const home=s;
 const t=s.presentation.title.start;
 await page.touchscreen.tap(t.x*viewport.width/s.display.width,(s.display.height-t.y)*viewport.height/s.display.height);
 await page.clock.runFor(100);s=await read();assert.equal(s.chapter,1);assert.equal(s.state,'playing');assert.equal(s.player.health,5);
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 writeFileSync('../开发进度/验证记录/v104-campaign.json',JSON.stringify({version:'1.0.4',startedAt,method:'Continuous ordinary-input campaign from the cover through chapter 1 and chapter 2; normal health/ammo. Enter follows settlement actions; touch starts a fresh run after return. No teleports or state edits.',viewport,landFinal,oceanStart,oceanFinal,oceanMilestones,home,restart:s,captures,errors,failed},null,2)+'\n');
 console.log(JSON.stringify({passed:true,landHealth:landFinal.player.health,oceanHealth:oceanFinal.player.health,returnedHome:true,freshRun:true,flightLoaded:false}));
}catch(error){writeFileSync(`../开发进度/验证记录/${prefix}-failure.json`,JSON.stringify({error:String(error),errors,failed,events,damage,final:s},null,2));throw error;}
finally{await browser.close();}

