import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const { PlaytestBrain } = createRequire(import.meta.url)('../../scripts/playtest-brain.cjs');
test.use({serviceWorkers:'block'});
const read=(page:any)=>page.evaluate(()=>(globalThis as any).__BREAKOUT__.snapshot());
async function boot(page:any) {
  await page.clock.install({time:new Date('2026-10-19T00:00:00Z')});
  await page.goto('/');await page.waitForFunction(()=>!!(globalThis as any).__BREAKOUT__);
  await page.locator('#GameCanvas').focus();await page.clock.pauseAt(new Date('2026-10-19T00:00:10Z'));
  await page.keyboard.press('Enter');await page.clock.runFor(34);
}
test('keyboard knife and mobile ordinary fire perform real close combat',async({page,context})=>{
  await page.setViewportSize({width:844,height:390});await boot(page);
  await page.keyboard.press('KeyL');await page.clock.runFor(100);
  expect((await read(page)).melee.swings).toBe(1);
  await page.screenshot({path:'reports/v054-knife.png'});
  let s=await read(page);
  for(let i=0;i<450;i++) {
    s=await read(page);
    if(s.enemies.some((e:any)=>e.health>0&&e.kind==='melee'&&e.x>s.player.x&&e.x-s.player.x<98&&Math.abs(e.y-s.player.y)<25))break;
    await page.clock.runFor(34);
  }
  expect(s.state).toBe('playing');
  const before=s.melee.swings,box=await page.locator('#GameCanvas').boundingBox();
  const fire=s.controls.layout.shoot,scale=box!.height/s.display.height;
  const cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:9,x:box!.x+fire.x*scale,y:box!.y+(s.display.height-fire.y)*scale}]});
  await page.clock.runFor(110);s=await read(page);
  await page.screenshot({path:'reports/v054-touch-knife.png'});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  expect(s.melee.swings).toBeGreaterThan(before);expect(s.melee.hits).toBeGreaterThan(0);
  expect(s.playerShots).toBe(0);
  writeFileSync('reports/v054-knife.json',JSON.stringify({melee:s.melee,health:s.player.health,kills:s.kills},null,2));
});
test('rectangular road and enlarged guided rockets work through the first two zones',async({page})=>{
  test.setTimeout(180000);await page.setViewportSize({width:1280,height:720});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await boot(page);
  await page.screenshot({path:'reports/v054-terraces.png'});
  const brain=new PlaytestBrain(),held=new Set<string>();let last:any,locked=false,bent=false;
  for(let i=0;i<2200;i++){
    last=await read(page);if(last.state!=='playing'||last.player.x>3800)break;
    for(const r of last.terrain.filter((r:any)=>r.kind==='ground'))expect(r.slope.left).toBe(r.slope.right);
    const guided=last.projectileStates.find((p:any)=>p.homing&&p.locked);
    if(guided){locked=true;if(Math.abs(guided.vy)>20){if(!bent)await page.screenshot({path:'reports/v054-tracking.png'});bent=true;}}
    const f=brain.next(last),keys=new Set<string>();
    if(f.axis>0)keys.add('KeyD');if(f.axis<0)keys.add('KeyA');if(f.jumpHeld)keys.add('Space');if(f.shoot)keys.add('KeyJ');if(f.crouch)keys.add('KeyS');if(f.aimY)keys.add('KeyW');if(f.grenade)keys.add('KeyK');
    for(const k of held)if(!keys.has(k)){await page.keyboard.up(k);held.delete(k);}
    for(const k of keys)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
    await page.clock.runFor(34);
  }
  for(const k of held)await page.keyboard.up(k);
  writeFileSync('reports/v054-first-two-zones.json',JSON.stringify({locked,bent,snapshot:last,errors},null,2));
  expect(last.player.x).toBeGreaterThan(3800);expect(locked).toBe(true);expect(bent).toBe(true);expect(errors).toEqual([]);
});
