import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {PlaytestBrain}=createRequire(import.meta.url)('../../scripts/playtest-brain.cjs');
test.use({serviceWorkers:'block'});
const read=(page:any)=>page.evaluate(()=>(globalThis as any).__BREAKOUT__.snapshot());

test('upward rocket emerges from the visible tube for both facing directions',async({page})=>{
 test.setTimeout(180000);await page.setViewportSize({width:1280,height:720});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-10-20T00:00:00Z')});
 await page.goto('/');await page.waitForFunction(()=>!!(globalThis as any).__BREAKOUT__);
 await page.locator('#GameCanvas').focus();await page.clock.pauseAt(new Date('2026-10-20T00:00:10Z'));
 await page.keyboard.press('Enter');await page.clock.runFor(34);
 const brain=new PlaytestBrain(),held=new Set<string>();let s:any;
 for(let i=0;i<1200;i++){
  s=await read(page);if(s.weapon==='rocket')break;
  expect(s.state).toBe('playing');const f=brain.next(s),keys=new Set<string>();
  if(f.axis>0)keys.add('KeyD');if(f.axis<0)keys.add('KeyA');if(f.jumpHeld)keys.add('Space');
  if(f.shoot)keys.add('KeyJ');if(f.crouch)keys.add('KeyS');if(f.aimY)keys.add('KeyW');if(f.grenade)keys.add('KeyK');
  for(const key of held)if(!keys.has(key)){await page.keyboard.up(key);held.delete(key);}
  for(const key of keys)if(!held.has(key)){await page.keyboard.down(key);held.add(key);}
  await page.clock.runFor(34);
 }
 for(const key of held)await page.keyboard.up(key);
 expect(s.weapon).toBe('rocket');
 // Walk out from under the authored upper platform. An upward rocket should
 // collide with that platform, so it is not a valid empty-sky trajectory test.
 await page.keyboard.down('KeyA');
 for(let i=0;i<50;i++){await page.clock.runFor(34);s=await read(page);if(s.player.x<1220)break;}
 await page.keyboard.up('KeyA');await page.clock.runFor(1000);
 const captures:any[]=[];
 for(const [label,key] of [['right','KeyD'],['left','KeyA']]){
  await page.keyboard.down(key);await page.clock.runFor(34);await page.keyboard.up(key);
  await page.keyboard.down('KeyW');await page.clock.runFor(34);const before=await read(page);
  await page.keyboard.down('KeyJ');
  for(let i=0;i<8;i++){await page.clock.runFor(17);s=await read(page);if(s.playerShots>before.playerShots)break;}
  await page.keyboard.up('KeyJ');
  s=await read(page);expect(s.player.aimPitch).toBeCloseTo(Math.PI/2,3);
  expect(s.playerShots).toBeGreaterThan(before.playerShots);
  expect(s.art.renderedPlayer.body).toMatch(/^direct\.rocket\./);
  expect(s.art.equipment.weapon).toBeNull();expect(s.art.equipment.grip).toBeNull();
  expect(s.weaponShot.pitch).toBe(0);
  expect(s.art.combat.muzzle).toBeDefined();
  expect(s.art.combat.muzzle.x).toBeCloseTo(s.weaponShot.x,3);
  expect(s.art.combat.muzzle.y).toBeCloseTo(s.weaponShot.y,3);
  const rocket=s.art.combat.rockets.find((r:any)=>r.age<.08);expect(rocket).toBeDefined();
  expect(Math.hypot(rocket.x-s.weaponShot.x,rocket.y-s.weaponShot.y)).toBeLessThan(16);
  expect(rocket.width).toBeLessThan(40);expect(Math.abs(Math.sin(rocket.angle*Math.PI/180))).toBeLessThan(.6);
  captures.push({label,snapshot:s});await page.screenshot({path:`reports/v057-up-rocket-${label}.png`});
  await page.clock.runFor(145);const turned=await read(page);
  expect(turned.projectileStates.some((p:any)=>p.owner==='player'&&p.kind==='rocket'&&p.age>.12&&p.age<.3&&p.vy>400)).toBe(true);
  captures.push({label:'turned-'+label,snapshot:turned});
  await page.screenshot({path:`reports/v057-up-rocket-${label}-flight.png`});
  await page.keyboard.up('KeyW');await page.clock.runFor(1100);
 }
 expect(errors).toEqual([]);writeFileSync('reports/v057-rocket-muzzle.json',JSON.stringify({captures,errors},null,2));
});
