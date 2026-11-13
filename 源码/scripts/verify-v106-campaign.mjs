import {chromium} from 'playwright';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{PlaytestBrain}=require('./playtest-brain.cjs'),{OceanBrain}=require('./ocean-brain.cjs');
const dir='../开发进度/验证记录/v106-revive-select';mkdirSync(dir,{recursive:true});
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4190';
const browser=await chromium.launch({channel:'chrome',headless:true}),viewport={width:852,height:393};
const page=await browser.newPage({viewport,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'});
const startedAt=new Date().toISOString(),errors=[],failed=[],captures=[],milestones=[],held=new Set();let s;
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>failed.push(r.url()));
const read=()=>page.evaluate(()=>globalThis.__BREAKOUT__.snapshot());
async function tick(ms=50){await page.clock.runFor(ms);return s=await read();}
async function capture(name){const file=`${dir}/campaign-${name}.png`;await page.screenshot({path:file});captures.push(file);}
async function keys(next){for(const k of held)if(!next.has(k)){await page.keyboard.up(k);held.delete(k);}for(const k of next)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}}
async function click(value){
 const p=await page.evaluate(async value=>{const cc=await System.import('cc');let p;function visit(n){if(!n.activeInHierarchy)return;const l=n.getComponent(cc.Label);if(l?.string===value)p={x:n.worldPosition.x,y:n.worldPosition.y};n.children.forEach(visit);}visit(cc.director.getScene());return p;},value);
 assert.ok(p,value);await read().then(v=>s=v);await page.touchscreen.tap((p.x+s.display.width/2)*viewport.width/s.display.width,(s.display.height/2-p.y)*viewport.height/s.display.height);await tick(100);
}
await page.addInitScript(()=>{
 globalThis.wx={getWindowInfo:()=>({windowWidth:innerWidth,windowHeight:innerHeight}),getMenuButtonBoundingClientRect:()=>({left:innerWidth-96,top:12,width:88,height:32})};
 let shell;Object.defineProperty(globalThis,'__BREAKOUT_PLATFORM__',{configurable:true,get:()=>shell,set(v){shell=v;shell.safeInsets=()=>({left:59,right:0,top:0,bottom:21});}});
});
try {
 await page.clock.install({time:new Date('2026-11-13T09:00:00Z')});await page.goto(base);await page.waitForFunction(()=>globalThis.__BREAKOUT__);
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));assert.equal(await page.evaluate(()=>__BREAKOUT__.version),'1.0.6');
 await page.clock.runFor(await page.evaluate(()=>16-(performance.now()%16)));await page.locator('#GameCanvas').focus();await page.keyboard.press('Enter');await tick(32);
 // Genuine combat defeat before the campaign, then the same ordinary-input route.
 await keys(new Set(['KeyD','KeyJ']));for(let i=0;i<160&&s.player.x<610;i++)await tick(100);await keys(new Set());
 for(let i=0;i<240&&s.state!=='gameover';i++)await tick(250);assert.equal(s.state,'gameover');const firstDeath=s;await capture('first-death');
 await click('原地复活 · 本关剩余 1 次');assert.equal(s.state,'reviving');await tick(1100);assert.equal(s.state,'playing');
 const brain=new PlaytestBrain({healthThreshold:4});
 for(let n=0;n<11000&&s.state!=='gameover'&&!(s.state==='complete'&&s.victory.resultsReady);n++){
  const f=brain.next(s),input=new Set();
  if(s.miniBoss.health>0&&s.miniBoss.mode==='ramming'&&Math.abs(s.miniBoss.x-s.player.x)<250)f.jumpHeld=true;
  if(!s.arenaEntered&&!(s.miniBoss.active&&s.miniBoss.health>0)&&!s.player.grounded&&s.player.airJumpsRemaining>0&&s.player.vy<100){
   const threat=s.projectileStates.some(p=>{if(p.owner!=='enemy')return false;const relative=p.vx-s.player.vx;if(Math.abs(relative)<1)return false;const t=(s.player.x-p.x)/relative;if(t<0||t>.3)return false;const y=p.y+p.vy*t-.5*(p.gravity??0)*t*t;return y>s.player.y-15&&y<s.player.y+90;});
   if(threat){f.jumpHeld=true;if(held.has('Space')){await page.keyboard.up('Space');held.delete('Space');}}
  }
  if(f.axis>0)input.add('KeyD');if(f.axis<0)input.add('KeyA');if(f.shoot)input.add('KeyJ');if(f.jumpHeld)input.add('Space');if(f.crouch&&!f.jumpHeld)input.add('KeyS');if(f.aimY)input.add('KeyW');if(f.grenade)input.add('KeyK');
  await keys(input);await tick(34);
  if(n%500===0){const point={chapter:1,n,time:s.time,x:s.player.x,hp:s.player.health,bossHp:s.guardHealth};milestones.push(point);console.log(JSON.stringify(point));writeFileSync(`${dir}/campaign-progress.json`,JSON.stringify(point));}
 }
 await keys(new Set());assert.equal(s.state,'complete');assert.equal(s.guardHealth,0);assert.equal(s.miniBoss.health,0);assert.equal(s.personalRecords.result.reason,'revived');assert.equal(s.personalRecords.result.valid,false);assert.equal(s.personalRecords.records.cleared,1);assert.equal(s.personalRecords.records.times[1],undefined);
 const landFinal=s;await capture('land-assisted-result');
 await page.keyboard.press('Enter');for(let i=0;i<200&&s.chapter!==2;i++)await tick();assert.equal(s.chapter,2);assert.equal(s.revival.remaining,1);assert.equal(s.personalRecords.assisted,false);const oceanStart=s;
 const oceanBrain=new OceanBrain();let zone='';
 for(let n=0;n<7000&&s.state!=='gameover'&&!(s.state==='complete'&&s.victory.resultsReady);n++){
  const f=oceanBrain.next(s),input=new Set();if(f.axis>0)input.add('KeyD');if(f.axis<0)input.add('KeyA');if(f.vertical>0)input.add('KeyW');if(f.vertical<0)input.add('KeyS');if(f.shoot)input.add('KeyJ');if(f.jump)input.add('Space');
  await keys(input);await tick();
  if(s.zone!==zone){zone=s.zone;const p={chapter:2,zone,time:s.time,x:s.player.x,hp:s.player.health};milestones.push(p);console.log(JSON.stringify(p));writeFileSync(`${dir}/campaign-progress.json`,JSON.stringify(p));}
 }
 await keys(new Set());assert.equal(s.state,'complete');assert.equal(s.boss.hp,0);assert.equal(s.miniBoss.hp,0);assert.equal(s.personalRecords.records.cleared,2);assert.equal(s.personalRecords.result.valid,true);assert.equal(s.personalRecords.records.times[2].ms,s.personalRecords.result.ms);
 const oceanFinal=s;await capture('ocean-unassisted-result');await page.keyboard.press('Enter');await tick(200);assert.equal(s.state,'title');assert.equal(s.presentation.title.primary,'选择关卡');await capture('unlocked-home');
 await click('选择关卡');await capture('earned-two-chapters');await click('重玩第二关');for(let i=0;i<200&&s.chapter!==2;i++)await tick();
 for(let i=0;i<200&&s.stage!=='swimming';i++)await tick(100);assert.equal(s.stage,'swimming');
 await keys(new Set(['KeyD']));for(let i=0;i<120&&s.player.x<1190&&s.state==='playing';i++)await tick(100);await keys(new Set());
 for(let i=0;i<300&&s.state!=='gameover';i++)await tick(250);assert.equal(s.state,'gameover');const oceanDeath=s;await capture('ocean-death');
 await click('原地复活 · 本关剩余 1 次');assert.equal(s.state,'reviving');await capture('ocean-preparing');await tick(1100);assert.equal(s.state,'playing');assert.equal(s.player.health,5);assert.equal(s.revival.used,1);assert.equal(s.kills,oceanDeath.kills);assert.equal(s.boss.hp,oceanDeath.boss.hp);assert.equal(s.ammo,oceanDeath.ammo);assert.equal(s.personalRecords.records.times[2].ms,oceanFinal.personalRecords.records.times[2].ms);
 await keys(new Set(['KeyD','KeyW','KeyJ']));const beforeMove=s.player;await tick(250);await keys(new Set());assert.ok(Math.hypot(s.player.x-beforeMove.x,s.player.y-beforeMove.y)>10);await capture('ocean-revived');
 assert.equal(s.chapterAssets.flightLoaded,false);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 writeFileSync(`${dir}/campaign.json`,JSON.stringify({version:'1.0.6',passed:true,startedAt,finishedAt:new Date().toISOString(),method:'Continuous ordinary keyboard/touch play from fresh storage. Deliberate natural land death then one revival, assisted chapter-1 clear, unassisted chapter-2 clear, earned chapter selection and natural water death/revival. No teleports, invulnerability cheats or state edits.',viewport,firstDeath,landFinal,oceanStart,oceanFinal,oceanDeath,oceanRevived:s,milestones,captures,errors,failed},null,2)+'\n');console.log(JSON.stringify({passed:true,assistedLandClear:true,unassistedOceanClear:true,earnedSelection:true,waterRevival:true}));
}catch(error){writeFileSync(`${dir}/campaign-failure.json`,JSON.stringify({error:String(error),stack:error.stack,final:s,milestones,captures,errors,failed},null,2));throw error;}finally{await browser.close();}
