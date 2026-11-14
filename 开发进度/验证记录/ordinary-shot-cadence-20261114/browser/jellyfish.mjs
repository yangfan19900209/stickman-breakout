import {chromium} from '/Users/yangfan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const {OceanBrain}=createRequire(import.meta.url)('../../../../源码/scripts/ocean-brain.cjs');
const dir='../开发进度/验证记录/ordinary-shot-cadence-20261114/browser/jellyfish';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1,serviceWorkers:'block'});
const held=new Set(),seen=new Set(),events=[],errors=[];let s,dodgeUntil=0,targetId='',stage='approach';
const read=()=>page.evaluate(()=>globalThis.__BREAKOUT__.snapshot());
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.clock.install({time:new Date('2026-11-14T15:00:00Z')});await page.goto('http://127.0.0.1:4190/level02.html');
 await page.waitForFunction(()=>globalThis.__BREAKOUT__?.snapshot().oceanArt?.loaded);
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#GameCanvas').focus();
 const brain=new OceanBrain();s=await read();
 for(let n=0;n<1800&&s.state!=='gameover';n++){
  let f=brain.next(s);const jelly=s.enemies.find(e=>e.kind==='jellyfish'&&e.hp>0&&Math.abs(e.x-s.player.x)<550);
  if(jelly&&s.player.x>2300){
   targetId=jelly.id;
   // Approach and observe with genuine input; stop firing so the enemy can show its warning.
   if(stage==='approach'){f={axis:jelly.x-s.player.x>150?1:0,vertical:Math.abs(jelly.y+9-s.player.y)>15?Math.sign(jelly.y+9-s.player.y):0,shoot:false};}
   if(jelly.mode==='tell'&&jelly.locked&&stage==='approach'){stage='dodge';dodgeUntil=s.time+1.4;}
   if(stage==='dodge'){f={axis:0,vertical:s.time<dodgeUntil?(jelly.y>320?-1:1):0,shoot:false};}
   if(stage==='dodge'&&jelly.serial>0&&s.time>=dodgeUntil){stage='finish';}
   if(stage==='finish')f=brain.next(s);
  }
  const keys=new Set();if(f.axis>0)keys.add('KeyD');if(f.axis<0)keys.add('KeyA');if(f.vertical>0)keys.add('KeyW');if(f.vertical<0)keys.add('KeyS');if(f.shoot)keys.add('KeyJ');if(f.jump)keys.add('Space');if(f.grenade)keys.add('KeyK');
  for(const k of held)if(!keys.has(k)){await page.keyboard.up(k);held.delete(k);}for(const k of keys)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
  await page.clock.runFor(50);s=await read();
  for(const v of s.oceanArt.enemies.filter(e=>e.frame?.startsWith('jellyfish.'))){
   const e=s.enemies.find(e=>e.id===v.id);
   if(e.x<s.cameraX+80||e.x>s.cameraX+s.display.worldVisibleWidth-80||seen.has(v.frame))continue;
   seen.add(v.frame);await page.screenshot({path:`${dir}/${v.frame}.png`});events.push({frame:v.frame,mode:e.mode,time:s.time,enemy:e,player:s.player});
  }
  if(seen.has('jellyfish.sting')&&seen.has('jellyfish.recover')&&seen.has('jellyfish.defeat'))break;
 }
 for(const k of held)await page.keyboard.up(k);
 const r={method:'Normal keyboard approach, release fire to observe a warning, vertical dodge and resumed firing. Read-only snapshots; no gameplay state edits.',frames:[...seen],events,errors,final:s};writeFileSync(`${dir}/result.json`,JSON.stringify(r,null,2));
 assert.deepEqual(errors,[]);assert.ok(seen.has('jellyfish.tell'));assert.ok(seen.has('jellyfish.sting'));assert.ok(seen.has('jellyfish.recover'));assert.ok(s.player.health>0);
 console.log(JSON.stringify({passed:true,frames:[...seen],hp:s.player.health,time:s.time}));
}finally{await browser.close();}
