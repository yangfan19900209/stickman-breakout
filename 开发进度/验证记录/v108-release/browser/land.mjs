import {chromium} from '/Users/yangfan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const {PlaytestBrain}=createRequire(import.meta.url)('../../../../源码/scripts/playtest-brain.cjs');
const startedAt=new Date().toISOString();
const dir='../开发进度/验证记录/v108-release/browser/land';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:852,height:393},deviceScaleFactor:2,hasTouch:true,serviceWorkers:'block'});
const held=new Set(),captures=[],events=[],errors=[];let s,preBoss=false,barrels=false,healthSeen=false,miniArrival=null;const launchersSeen=new Set();
page.on('pageerror',e=>errors.push(e.message));
const read=()=>page.evaluate(()=>globalThis.__BREAKOUT__.snapshot());
async function capture(name){const file=`${dir}/${name}.png`;await page.screenshot({path:file});captures.push(file);}
try{
 await page.clock.install({time:new Date('2026-11-14T13:40:00Z')});await page.goto((process.env.PREVIEW_URL||'http://127.0.0.1:4198')+'/');
 await page.waitForFunction(()=>globalThis.__BREAKOUT__?.snapshot().art.loaded);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
 assert.equal(await page.evaluate(()=>globalThis.__BREAKOUT__.version),'1.0.8');
 await page.locator('#GameCanvas').focus();await page.keyboard.press('Enter');await page.clock.runFor(32);s=await read();
 const brain=new PlaytestBrain({healthThreshold:4});
 for(let n=0;n<5600&&!(s.state==='complete'&&s.victory.resultsReady)&&s.state!=='gameover';n++){
  if(!preBoss&&s.player.x>4300){preBoss=true;await capture('before-health');}
  if(!healthSeen&&s.pickups.some(p=>p.kind==='health'&&Math.abs(p.x-4590)<1)){healthSeen=true;await capture('health-before-activation');events.push({event:'health-visible',time:s.time,player:s.player,mini:s.miniBoss});}
  if(!barrels&&s.player.x>5400){barrels=true;await capture('tank-approach');events.push({event:'tank-approach',time:s.time,player:s.player,barrels:s.objects.filter(o=>/^barrel-C[12]$/.test(o.id)),mini:s.miniBoss});}
  const f=brain.next(s);
  // Use the player's normal knife key when a soldier is already at arm's length.
  const close=s.enemies.filter(e=>e.health>0&&['ranged','melee','shield','turret'].includes(e.kind)&&Math.abs(e.x-s.player.x)<85&&Math.abs(e.y-s.player.y)<38).sort((a,b)=>Math.abs(a.x-s.player.x)-Math.abs(b.x-s.player.x))[0];
  if(close){f.axis=Math.sign(close.x-s.player.x);f.shoot=false;f.crouch=false;f.jump=false;f.melee=true;}
  else if(s.weapon==='knife')await page.keyboard.press('KeyQ');
  const keys=new Set();if(f.melee)keys.add('KeyL');if(f.axis>0)keys.add('KeyD');if(f.axis<0)keys.add('KeyA');if(f.jump)keys.add('Space');if(f.shoot)keys.add('KeyJ');if(f.crouch)keys.add('KeyS');if(f.aimY>0)keys.add('KeyW');if(f.grenade)keys.add('KeyK');
  for(const k of held)if(!keys.has(k)){await page.keyboard.up(k);held.delete(k);}for(const k of keys)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
  const before=s;await page.clock.runFor(50);s=await read();
  if(s.miniBoss.active&&!miniArrival){miniArrival={time:s.time,weapon:s.weapon,ammo:s.ammo,x:s.player.x};events.push({event:'mini-arrival',...miniArrival});}
  for(const id of ['turret-C','turret-E','turret-F0']){const e=s.enemies.find(e=>e.id===id);if(e&&!launchersSeen.has(id)&&Math.abs(e.x-s.player.x)<350){launchersSeen.add(id);await capture(id);}}

  if(s.player.health!==before.player.health){events.push({event:'health-change',time:s.time,x:s.player.x,before:before.player.health,after:s.player.health,miniActive:s.miniBoss.active});}
 }
 for(const k of held)await page.keyboard.up(k);await capture('result');
 const report={version:'1.0.8',startedAt,finishedAt:new Date().toISOString(),method:'Normal keyboard play from title through the entire first chapter. Read-only snapshots, no state edits.',errors,captures,events,healthSeen,miniArrival,launchersSeen:[...launchersSeen],final:s};
 writeFileSync(`${dir}/result.json`,JSON.stringify(report,null,2));assert.deepEqual(errors,[]);assert.equal(s.state,'complete');assert.equal(s.miniBoss.health,0);assert.equal(s.guardHealth,0);assert.ok(s.player.health>0);
 console.log(JSON.stringify({passed:true,time:s.time,hp:s.player.health,x:s.player.x,healthSeen}));
}catch(error){await capture('failure');writeFileSync(`${dir}/failure.json`,JSON.stringify({error:String(error),errors,events,final:s},null,2));throw error;}
finally{await browser.close();}
