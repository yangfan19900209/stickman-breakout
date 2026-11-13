import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {PlaytestBrain}=createRequire(import.meta.url)('../../scripts/playtest-brain.cjs');
const read=(page:any)=>page.evaluate(()=>(globalThis as any).__BREAKOUT__.snapshot());
test.use({serviceWorkers:'block'});
async function boot(page:any){
  await page.addInitScript(()=>{(globalThis as any).__vibrations=[];
    Object.defineProperty(navigator,'vibrate',{value:(pattern:any)=>{(globalThis as any).__vibrations.push(pattern);return true;},configurable:true});});
  await page.clock.install({time:new Date('2026-11-05T00:00:00Z')});await page.goto('/');
  await page.waitForFunction(()=>!!(globalThis as any).__BREAKOUT__);await page.locator('#GameCanvas').focus();
  await page.clock.pauseAt(new Date('2026-11-05T00:00:10Z'));
  expect(await page.evaluate(()=>(globalThis as any).__BREAKOUT__.version)).toBe('0.6.3');
}
async function clickUI(page:any,x:number,y:number){const s=await read(page),size=page.viewportSize();
  await page.mouse.click(x*size.width/s.display.width,(s.display.height-y)*size.height/s.display.height);await page.clock.runFor(50);}
async function keys(page:any,held:Set<string>,f:any){
  const next=new Set<string>();if(f.axis>0)next.add('KeyD');if(f.axis<0)next.add('KeyA');if(f.jumpHeld)next.add('Space');
  if(f.shoot)next.add('KeyJ');if(f.crouch)next.add('KeyS');if(f.aimY)next.add('KeyW');if(f.grenade)next.add('KeyK');
  for(const k of held)if(!next.has(k)){await page.keyboard.up(k);held.delete(k);}
  for(const k of next)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
}
for(const size of [{width:1280,height:720},{width:844,height:390},{width:1024,height:768}]){
  test(`poster fits ${size.width}x${size.height}, starts and returns home without fullscreen controls`,async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize(size);await boot(page);
    const s=await read(page);expect(s.state).toBe('title');expect(s.presentation.cover).toBe('ink-poster-v063');expect(s.presentation.fullscreenTools).toBe(false);
    await page.screenshot({path:`../开发进度/验证记录/v063-title-${size.width}.png`});
    const scale=Math.min(1,s.display.width/1280,s.display.height/720);
    await clickUI(page,s.display.width/2-360*scale,s.display.height/2-151*scale);expect((await read(page)).state).toBe('playing');
    await page.keyboard.press('KeyP');await page.clock.runFor(34);expect((await read(page)).state).toBe('paused');
    await clickUI(page,s.display.width/2+153,s.display.height/2-122);expect((await read(page)).state).toBe('title');
    expect(errors).toEqual([]);
  });
}
test('real campaign plays collapse, shake, pause-safe close-up cheer and animated results; restart clears them',async({page})=>{
  test.setTimeout(600000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await boot(page);
  await page.keyboard.press('Enter');await page.clock.runFor(34);
  const brain=new PlaytestBrain(),held=new Set<string>(),trace:any[]=[],samples:any[]=[],captures=new Set<string>();
  const cheer=new Set<string>(),bossFrames=new Set<string>();let lastTrace=-5,before:any=null,paused=false,blockedEarlyRestart=false;
  async function capture(id:string){if(captures.has(id))return;captures.add(id);await page.screenshot({path:`../开发进度/验证记录/v063-${id}.png`});}
  for(let n=0;n<10000;n++){
    const s=await read(page);if(s.state==='gameover')break;
    if(s.victory.active){
      expect(s.weaponShot.flash).toBe(0);
      expect(s.art.combat.muzzle).toBeUndefined();
      if(!before){before=s;await keys(page,held,{});await page.keyboard.down('KeyJ');await page.keyboard.down('KeyK');await page.keyboard.down('KeyD');}
      samples.push({victory:s.victory,zoom:s.display.combatZoom,art:s.art.renderedPlayer,boss:s.art.renderedBoss,shake:s.feedback.shakePower,
        time:s.time,health:s.player.health,ammo:s.ammo,shots:s.playerShots,kills:s.kills,grenades:s.grenades,presentation:s.presentation});
      if(s.victory.time>.1)bossFrames.add(s.art.renderedBoss.frame);
      if(s.art.renderedPlayer.body.startsWith('celebrate.'))cheer.add(s.art.renderedPlayer.body);
      if(s.victory.time>.5)await capture('boss-explosions');if(s.victory.time>1.45)await capture('boss-collapse');
      if(s.victory.phase==='focus')await capture('camera-push');if(s.victory.phase==='cheer'&&s.victory.time>4.2)await capture('hero-cheer');
      if(!paused&&s.victory.time>2.8){
        await page.keyboard.press('KeyP');await page.clock.runFor(34);const p=await read(page);expect(p.state).toBe('paused');
        await page.clock.runFor(800);expect((await read(page)).victory.time).toBe(p.victory.time);
        await page.keyboard.press('KeyP');await page.clock.runFor(34);paused=true;
      }
      if(!blockedEarlyRestart&&s.state==='complete'&&!s.victory.resultsReady){
        await page.keyboard.press('Enter');await page.clock.runFor(17);expect((await read(page)).state).toBe('complete');blockedEarlyRestart=true;
      }
      if(s.victory.resultsReady&&s.victory.time>7)break;
    }else{
      if(s.time-lastTrace>=5){lastTrace=s.time;trace.push({time:s.time,x:s.player.x,health:s.player.health,boss:s.guardHealth});
        writeFileSync('../开发进度/验证记录/v063-campaign-progress.json',JSON.stringify({snapshot:s,trace},null,2));}
      await keys(page,held,brain.next(s));
    }
    await page.clock.runFor(34);
  }
  await keys(page,held,{});for(const k of ['KeyJ','KeyK','KeyD'])await page.keyboard.up(k);
  const end=await read(page),vibrations=await page.evaluate(()=>(globalThis as any).__vibrations);
  await capture('results');
  writeFileSync('../开发进度/验证记录/v063-campaign.json',JSON.stringify({before,end,trace,samples,captures:[...captures],cheer:[...cheer],bossFrames:[...bossFrames],vibrations,paused,blockedEarlyRestart,errors},null,2));
  expect(end.state,JSON.stringify(trace.slice(-5))).toBe('complete');expect(end.victory.resultsReady).toBe(true);
  expect(end.miniBoss.health).toBe(0);expect(end.guardHealth).toBe(0);expect(end.player.health).toBeGreaterThan(0);
  expect(end.presentation.resultProgress).toBe(1);expect(end.presentation.resultReady).toBe(true);
  expect(cheer.size).toBe(4);expect(bossFrames.has('mech.collapse')).toBe(true);expect(bossFrames.has('mech.wreck')).toBe(true);
  expect(end.display.combatZoom).toBeGreaterThan(before.display.combatZoom*2);
  expect(samples.some(s=>s.shake>=14)).toBe(true);expect(vibrations).toHaveLength(5);expect(vibrations).toContainEqual([55,40,70]);
  for(const s of samples){expect(s.time).toBe(before.time);expect(s.health).toBe(before.player.health);expect(s.shots).toBe(before.playerShots);
    expect(s.ammo).toBe(before.ammo);expect(s.kills).toBe(before.kills);expect(s.grenades).toBe(before.grenades);}
  expect(paused&&blockedEarlyRestart).toBe(true);expect(errors).toEqual([]);
  await page.setViewportSize({width:844,height:390});await page.clock.runFor(500);await capture('results-mobile');
  const mobile=await read(page),scale=Math.min(1,mobile.display.width/1280,mobile.display.height/720);
  await clickUI(page,mobile.display.width/2+310*scale,mobile.display.height/2-109*scale);
  const restart=await read(page);expect(restart.state).toBe('playing');expect(restart.victory.active).toBe(false);
  expect(restart.art.renderedPlayer.body.startsWith('celebrate.')).toBe(false);expect(restart.presentation.cinematicVisible).toBe(false);
  expect(restart.controls.shootHeld).toBe(false);expect(restart.playerShots).toBe(0);
  writeFileSync('../开发进度/验证记录/v063-restart.json',JSON.stringify({restart,mobile,errors},null,2));
});
