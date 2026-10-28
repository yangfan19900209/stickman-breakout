import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {PlaytestBrain}=createRequire(import.meta.url)('../../scripts/playtest-brain.cjs');
test.use({serviceWorkers:'block'});
const read=(page:any)=>page.evaluate(()=>(globalThis as any).__BREAKOUT__.snapshot());

test('mobile real-key route can enter and leave the 42-percent underpass standing, with normal cover and combat',async({page})=>{
 test.setTimeout(240000);await page.setViewportSize({width:844,height:390});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.clock.install({time:new Date('2026-10-20T00:00:00Z')});
 await page.goto('/');await page.waitForFunction(()=>!!(globalThis as any).__BREAKOUT__);
 await page.locator('#GameCanvas').focus();await page.clock.pauseAt(new Date('2026-10-20T00:00:10Z'));
 await page.keyboard.press('Enter');await page.clock.runFor(34);
 const held=new Set<string>(),brain=new PlaytestBrain(),walks:any[]=[];
 async function apply(keys:Set<string>){
  for(const k of held)if(!keys.has(k)){await page.keyboard.up(k);held.delete(k);}
  for(const k of keys)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
  await page.clock.runFor(34);
 }
 let s:any;
 for(let i=0;i<2800;i++){
  s=await read(page);if(s.player.x>3640&&s.player.grounded&&s.player.y<200)break;
  expect(s.state).toBe('playing');const f=brain.next(s),keys=new Set<string>();
  if(f.axis>0)keys.add('KeyD');if(f.axis<0)keys.add('KeyA');if(f.jumpHeld)keys.add('Space');
  if(f.shoot)keys.add('KeyJ');if(f.crouch)keys.add('KeyS');if(f.aimY)keys.add('KeyW');if(f.grenade)keys.add('KeyK');
  await apply(keys);
 }
 expect(s.player.x).toBeGreaterThan(3640);expect(s.player.health).toBeGreaterThan(0);
 const deck=s.terrain.find((r:any)=>r.kind==='platform'&&r.x===3300);
 expect(deck.y).toBe(320);expect(s.objects.find((o:any)=>o.id==='sandbags-B').x).toBe(3520);
 await apply(new Set());await page.screenshot({path:'reports/v057-underpass-exit.png'});
 const directions=[{name:'left',key:'KeyA',done:(x:number)=>x<3270},{name:'right',key:'KeyD',done:(x:number)=>x>3640}];
 for(const dir of directions){
  let sampled=false,done=false;
  for(let i=0;i<450;i++){
   const keys=new Set([dir.key,'KeyJ']);
   // The normal route drops bridge-B, leaving a 14-unit lip just outside the
   // underpass. Cross that separate obstacle using the real jump button.
   if(dir.name==='left'&&s.player.x<3320&&s.player.x>3270)keys.add('Space');
   await apply(keys);s=await read(page);expect(s.state).toBe('playing');
   if(s.player.x>3315&&s.player.x<3470&&s.player.grounded){
    expect(s.player.crouched).toBe(false);expect(s.player.y+74).toBeLessThan(deck.y);
    walks.push({direction:dir.name,player:s.player,enemies:s.enemies,shots:s.playerShots});
    if(!sampled){sampled=true;await page.screenshot({path:`reports/v057-underpass-${dir.name}.png`});}
   }
   if(dir.done(s.player.x)){done=true;break;}
  }
  expect(sampled).toBe(true);expect(done).toBe(true);
 }
 await apply(new Set());expect(errors).toEqual([]);expect(s.player.health).toBeGreaterThan(0);
 writeFileSync('reports/v057-underpass.json',JSON.stringify({walks,snapshot:s,errors},null,2));
});
