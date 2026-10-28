import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const { PlaytestBrain } = createRequire(import.meta.url)('../../scripts/playtest-brain.cjs');
test.use({ serviceWorkers: 'block' });
const read = (page: any) => page.evaluate(() => (globalThis as any).__BREAKOUT__.snapshot());
async function boot(page: any) {
  await page.clock.install({time:new Date('2026-10-16T00:00:00Z')});
  await page.goto('/');
  await page.waitForFunction(() => !!(globalThis as any).__BREAKOUT__);
  await page.locator('#GameCanvas').focus();
  await page.clock.pauseAt(new Date('2026-10-16T00:00:10Z'));
  await page.keyboard.press('Enter');await page.clock.runFor(34);
}
test('supplied six-frame crouch walk actually advances while moving and firing',async({page})=>{
  await page.setViewportSize({width:844,height:390});await boot(page);
  await page.keyboard.down('KeyS');await page.keyboard.down('KeyD');await page.keyboard.down('KeyJ');
  const frames=new Set<string>();
  // A full 96-unit stride needs >0.84s at crouch speed, plus acceleration.
  for(let i=0;i<30;i++){await page.clock.runFor(34);const s=await read(page);frames.add(s.art.playerFrame);expect(s.player.crouched).toBe(true);}
  expect(frames.size).toBe(6);expect([...frames].every(f=>f.startsWith('player.crouch-walk.'))).toBe(true);
  expect((await read(page)).shots).toBeGreaterThan(2);
  await page.screenshot({path:'reports/v053-crouch-walk.png'});
  await page.keyboard.up('KeyS');await page.keyboard.up('KeyD');await page.keyboard.up('KeyJ');
});
test('first two zones use supplied art with real combat, explosions and mobile controls',async({page})=>{
  test.setTimeout(180000);await page.setViewportSize({width:1280,height:720});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await boot(page);await page.screenshot({path:'reports/v053-first-screen.png'});
  const brain=new PlaytestBrain(),held=new Set<string>(),captures=new Set<string>(),weapons=new Set<string>();
  let last:any;
  for(let i=0;i<2200;i++){
    last=await read(page);if(last.state!=='playing'||last.player.x>3800)break;
    weapons.add(last.weapon);
    let name='';
    if(last.player.x>2400&&last.player.x<2800&&!captures.has('second-zone'))name='second-zone';
    else if(last.player.x>3180&&!captures.has('rocket-soldier'))name='rocket-soldier';
    else if(last.feedback.blasts.some((b:any)=>b.age>.18&&b.age<.34)&&!captures.has('explosion'))name='explosion';
    else if(last.player.x>350&&last.player.x<850&&last.player.grounded&&!captures.has('first-combat'))name='first-combat';
    if(name){await page.screenshot({path:`reports/v053-${name}.png`});captures.add(name);}
    const f=brain.next(last),keys=new Set<string>();
    if(f.axis>0)keys.add('KeyD');if(f.axis<0)keys.add('KeyA');if(f.jumpHeld)keys.add('Space');if(f.shoot)keys.add('KeyJ');if(f.crouch)keys.add('KeyS');if(f.aimY)keys.add('KeyW');if(f.grenade)keys.add('KeyK');
    for(const k of held)if(!keys.has(k)){await page.keyboard.up(k);held.delete(k);}
    for(const k of keys)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
    await page.clock.runFor(34);
  }
  for(const k of held)await page.keyboard.up(k);
  writeFileSync('reports/v053-two-zones.json',JSON.stringify({captures:[...captures],weapons:[...weapons],snapshot:last,errors},null,2));
  expect(last.player.x).toBeGreaterThan(3800);expect(last.player.health).toBeGreaterThan(0);
  expect(last.art.active).toBe('comic');expect(captures.has('second-zone')).toBe(true);expect(captures.has('explosion')).toBe(true);expect(captures.has('rocket-soldier')).toBe(true);expect(errors).toEqual([]);
});
