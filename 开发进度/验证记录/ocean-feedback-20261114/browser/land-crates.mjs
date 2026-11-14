import {chromium} from '/Users/yangfan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const {PlaytestBrain}=createRequire(import.meta.url)('../../../../源码/scripts/playtest-brain.cjs');
const dir='../开发进度/验证记录/ocean-feedback-20261114/browser/land';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:852,height:393},deviceScaleFactor:2,hasTouch:true,serviceWorkers:'block'});
const errors=[],failed=[],seen=new Map(),held=new Set(),captures=[];
let s;page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
try{
 await page.clock.install({time:new Date('2026-11-14T13:00:00Z')});await page.goto('http://127.0.0.1:4190/');
 await page.waitForFunction(()=>globalThis.__BREAKOUT__?.snapshot().art.loaded);
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
 await page.locator('#GameCanvas').focus();await page.keyboard.press('Enter');await page.clock.runFor(32);
 const read=()=>page.evaluate(()=>globalThis.__BREAKOUT__.snapshot());s=await read();const brain=new PlaytestBrain({healthThreshold:4});
 for(let n=0;n<2000&&s.player.x<3600&&s.state!=='gameover';n++){
  let fresh=false;
  for(const v of s.art.objects){
   const o=s.objects.find(o=>o.id===v.id);
   if(!v.alive||!['wood','hanging'].includes(o?.kind))continue;
   assert.ok(Math.abs(v.width-53.74647887323944)<1e-5);assert.equal(v.height,53);
   if(!seen.has(v.id)){seen.set(v.id,{...v,worldX:o.x,worldY:o.y,kind:o.kind});fresh=true;}
  }
  if(fresh&&captures.length<7){const file=`${dir}/crates-${captures.length+1}.png`;await page.screenshot({path:file});captures.push(file);}
  const f=brain.next(s),keys=new Set();if(f.axis>0)keys.add('KeyD');if(f.axis<0)keys.add('KeyA');
  if(f.jump)keys.add('Space');if(f.shoot)keys.add('KeyJ');if(f.crouch)keys.add('KeyS');if(f.aimY>0)keys.add('KeyW');if(f.grenade)keys.add('KeyK');
  for(const k of held)if(!keys.has(k)){await page.keyboard.up(k);held.delete(k);}
  for(const k of keys)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
  await page.clock.runFor(50);s=await read();
 }
 assert.ok(s.player.x>=3600);assert.ok(seen.size>=5);assert.ok([...seen.values()].some(v=>v.kind==='hanging'));
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 writeFileSync(`${dir}/result.json`,JSON.stringify({passed:true,method:'Read-only rendered UITransform sizes during normal keyboard play to x=3600; unchanged health/ammo.',seen:[...seen.values()],captures,errors,failed,final:s},null,2));
 console.log(JSON.stringify({passed:true,crates:seen.size,x:s.player.x,hp:s.player.health}));
}catch(error){await page.screenshot({path:`${dir}/failure.png`});writeFileSync(`${dir}/failure.json`,JSON.stringify({error:String(error),errors,failed,seen:[...seen.values()],final:s},null,2));throw error;}
finally{await browser.close();}
