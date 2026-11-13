import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {PlaytestBrain}=createRequire(import.meta.url)('../../scripts/playtest-brain.cjs');
const read=(page:any)=>page.evaluate(()=>(globalThis as any).__BREAKOUT__.snapshot());
test.use({serviceWorkers:'block'});
async function boot(page:any){
  await page.clock.install({time:new Date('2026-11-05T00:00:00Z')});await page.goto('/');
  await page.waitForFunction(()=>!!(globalThis as any).__BREAKOUT__);
  await page.locator('#GameCanvas').focus();await page.clock.pauseAt(new Date('2026-11-05T00:00:10Z'));
  await page.keyboard.press('Enter');await page.clock.runFor(34);
  expect(await page.evaluate(()=>(globalThis as any).__BREAKOUT__.version)).toBe('0.6.2');
}
async function keys(page:any,held:Set<string>,f:any){
  const next=new Set<string>();
  if(f.axis>0)next.add('KeyD');if(f.axis<0)next.add('KeyA');if(f.jumpHeld)next.add('Space');
  if(f.shoot)next.add('KeyJ');if(f.crouch)next.add('KeyS');if(f.aimY)next.add('KeyW');if(f.grenade)next.add('KeyK');
  for(const k of held)if(!next.has(k)){await page.keyboard.up(k);held.delete(k);}
  for(const k of next)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
}
async function settle(page:any){
  for(let n=0;n<70;n++){await page.clock.runFor(17);if((await read(page)).player.grounded)return;}
}

test('close-range attack cuts the opening crate and the enlarged drop stays above the road',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await boot(page);
  await page.keyboard.down('KeyD');await page.keyboard.down('Space');
  for(let n=0;n<50;n++){await page.clock.runFor(17);if((await read(page)).player.x>=250)break;}
  await page.keyboard.up('KeyD');await page.keyboard.up('Space');await settle(page);
  const before=await read(page);expect(before.objects.find((o:any)=>o.id==='shotgun-cache').alive).toBe(true);
  const frames:any[]=[];await page.keyboard.down('KeyJ');
  for(let n=0;n<80;n++){
    await page.clock.runFor(17);const s=await read(page);frames.push({time:s.time,melee:s.melee,shots:s.playerShots,frame:s.art.renderedPlayer.body});
    if(n===7)await page.screenshot({path:'../开发进度/验证记录/v062-opening-knife.png'});
  }
  await page.keyboard.up('KeyJ');const s=await read(page),visual=s.art.pickups.find((p:any)=>p.kind==='shotgun');
  expect(s.objects.find((o:any)=>o.id==='shotgun-cache').alive).toBe(false);
  expect(s.playerShots).toBe(before.playerShots);expect(frames.some(f=>f.melee.hits>before.melee.hits)).toBe(true);
  expect(frames.some(f=>f.frame.startsWith('direct.knife.'))).toBe(true);
  expect(visual.width).toBe(76);expect(visual.height).toBeGreaterThan(20);
  const drop=s.pickups.find((p:any)=>p.kind==='shotgun');expect(visual.y).toBeGreaterThan(drop.y-10);
  expect(s.pickups.filter((p:any)=>p.kind==='health')).toHaveLength(0);expect(errors).toEqual([]);
  await page.screenshot({path:'../开发进度/验证记录/v062-enlarged-drop.png'});
  writeFileSync('../开发进度/验证记录/v062-opening.json',JSON.stringify({before,frames,end:s,errors},null,2));
});

test('mobile attack automatically uses a knife on a nearby crate while preserving real rocket ammo',async({page,context})=>{
  test.setTimeout(180000);await page.setViewportSize({width:844,height:390});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await boot(page);
  const brain=new PlaytestBrain(),held=new Set<string>();let s=await read(page);
  for(let n=0;n<1000&&s.weapon!=='rocket'&&s.state==='playing';n++){
    await keys(page,held,brain.next(s));await page.clock.runFor(34);s=await read(page);
  }
  await keys(page,held,{});expect(s.weapon).toBe('rocket');
  // Walk from the actual launcher pickup to the next wooden supply crate.
  await page.keyboard.down('KeyD');
  for(let n=0;n<220;n++){
    await page.clock.runFor(17);s=await read(page);
    if(s.player.x>=1680)break;
  }
  await page.keyboard.up('KeyD');await settle(page);const before=await read(page);
  expect(before.player.health).toBeGreaterThan(0);expect(before.weapon).toBe('rocket');
  const target=before.objects.find((o:any)=>o.id==='crate-02');expect(target.alive).toBe(true);
  expect(target.x-before.player.x).toBeGreaterThan(0);expect(target.x-before.player.x).toBeLessThan(88);
  const control=before.controls.layout.shoot,cdp=await context.newCDPSession(page);
  const touch={x:control.x*844/before.display.width,y:(before.display.height-control.y)*390/before.display.height,id:71};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]});
  const frames:any[]=[];
  for(let n=0;n<65;n++){
    await page.clock.runFor(17);s=await read(page);frames.push({time:s.time,weapon:s.weapon,ammo:s.ammo,shots:s.playerShots,melee:s.melee,frame:s.art.renderedPlayer.body});
    if(n===8)await page.screenshot({path:'../开发进度/验证记录/v062-mobile-rocket-knife.png'});
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const end=await read(page);
  writeFileSync('../开发进度/验证记录/v062-rocket-crate.json',JSON.stringify({input:'real keyboard pickup and travel, then held touch attack',before,frames,end,errors},null,2));
  expect(end.objects.find((o:any)=>o.id==='crate-02').alive).toBe(false);
  expect(end.weapon).toBe('rocket');expect(end.ammo).toBe(before.ammo);expect(end.playerShots).toBe(before.playerShots);
  expect(frames.some(f=>f.melee.hits>before.melee.hits)).toBe(true);expect(errors).toEqual([]);
  expect(frames.some(f=>f.frame.startsWith('direct.knife.'))).toBe(true);
});

test('real-input campaign completes with only authored need-based medical supplies',async({page})=>{
  test.setTimeout(600000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await boot(page);
  const brain=new PlaytestBrain(),held=new Set<string>(),seen=new Set<string>(),trace:any[]=[],supplies:any[]=[];
  let lastTrace=-5,healthImage=false;
  for(let n=0;n<10000;n++){
    const s=await read(page);if(s.state!=='playing')break;
    for(const id of s.recoverySpawned)if(!seen.has(id)){
      seen.add(id);supplies.push({id,time:s.time,x:s.player.x,health:s.player.health,pickups:s.pickups});
    }
    for(const p of s.pickups.filter((p:any)=>p.kind==='health')){
      const point=s.recoveryPoints.find((q:any)=>q.id===p.sourceId);expect(point).toBeDefined();expect(p.x).toBe(point.x);
    }
    if(!healthImage&&s.art.pickups.some((p:any)=>p.kind==='health')){
      const visual=s.art.pickups.find((p:any)=>p.kind==='health');expect(visual.width).toBe(48);
      await page.screenshot({path:'../开发进度/验证记录/v062-medical-supply.png'});healthImage=true;
    }
    if(s.time-lastTrace>=5){lastTrace=s.time;trace.push({time:s.time,x:s.player.x,health:s.player.health,mini:s.miniBoss.health,boss:s.guardHealth,medical:s.recoverySpawned});
      writeFileSync('../开发进度/验证记录/v062-campaign-progress.json',JSON.stringify({snapshot:s,trace},null,2));}
    await keys(page,held,brain.next(s));await page.clock.runFor(34);
  }
  await keys(page,held,{});const end=await read(page);
  await page.screenshot({path:'../开发进度/验证记录/v062-complete.png'});
  writeFileSync('../开发进度/验证记录/v062-campaign.json',JSON.stringify({snapshot:end,trace,supplies,healthImage,errors},null,2));
  expect(end.state,JSON.stringify(trace.slice(-5))).toBe('complete');expect(end.player.health).toBeGreaterThan(0);
  expect(end.miniBoss.health).toBe(0);expect(end.guardHealth).toBe(0);expect(end.recoveryPoints).toHaveLength(4);
  expect(end.recoverySpawned.length).toBeLessThanOrEqual(4);expect(new Set(end.recoverySpawned).size).toBe(end.recoverySpawned.length);
  expect(healthImage).toBe(true);expect(end.droppedBullets).toBe(0);expect(errors).toEqual([]);
});
