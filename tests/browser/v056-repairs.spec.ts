import {test,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
test.use({serviceWorkers:'block'});
const read=(page:any)=>page.evaluate(()=>(globalThis as any).__BREAKOUT__.snapshot());
async function boot(page:any){
 await page.setViewportSize({width:844,height:390});
 await page.clock.install({time:new Date('2026-10-19T00:00:00Z')});await page.goto('/');
 await page.waitForFunction(()=>!!(globalThis as any).__BREAKOUT__);await page.locator('#GameCanvas').focus();
 await page.clock.pauseAt(new Date('2026-10-19T00:00:10Z'));await page.keyboard.press('Enter');await page.clock.runFor(34);
}
async function touch(page:any,context:any,p:{x:number;y:number}){
 const s=await read(page),box=await page.locator('#GameCanvas').boundingBox(),k=box!.height/s.display.height,cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:7,x:box!.x+p.x*k,y:box!.y+(s.display.height-p.y)*k}]});
 await page.clock.runFor(34);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.clock.runFor(34);await cdp.detach();
}
test('real HUD tap and Q switch knife/gun atomically with cached visible sprites and no accidental shot',async({page,context})=>{
 await boot(page);const frames:any[]=[];
 await page.evaluate(()=>{
  const records:any[]=[];(globalThis as any).__weaponFrames=records;
  const sample=()=>{const s=(globalThis as any).__BREAKOUT__.snapshot();
   if(s.state==='playing'&&s.melee.time===0&&s.player.animation!=='Hit'&&records.length<250)
    records.push({id:s.weapon,player:s.playerWeapon,hud:s.art.hudWeapon.frame,visible:s.art.renderedPlayer.weaponVisible});
   requestAnimationFrame(sample);
  };requestAnimationFrame(sample);
 });
 for(let n=0;n<16;n++){
  if(n%2)await page.keyboard.press('KeyQ');else await touch(page,context,(await read(page)).art.hudWeapon.switch);
  await page.clock.runFor(34);const s=await read(page);
  const expected=n%2?'rifle':'knife';expect(s.weapon).toBe(expected);expect(s.playerWeapon).toBe(expected);
  expect(s.art.hudWeapon.frame).toBe('weapon.'+expected);expect(s.art.hudWeapon.id).toBe(expected);
  expect(s.art.renderedPlayer.weaponVisible).toBe(true);expect(s.art.renderedPlayer.body).not.toBe('');
  expect(s.playerShots).toBe(0);expect(s.player.x).toBe(110);
  if(expected==='knife'){expect(s.art.hudWeapon.text).toContain('近战');expect(s.art.renderedPlayer.body).toMatch(/^direct\.knife\./);expect(s.art.equipment.weapon).toBeNull();expect(s.art.equipment.grip).toBeNull();}
  frames.push({id:s.weapon,hud:s.art.hudWeapon,actor:s.art.renderedPlayer});
 }
 await page.keyboard.press('KeyQ');await page.clock.runFor(34);await page.screenshot({path:'reports/v057-knife-hold.png'});
 const renderedFrames=await page.evaluate(()=>(globalThis as any).__weaponFrames);
 expect(renderedFrames.length).toBeGreaterThan(20);
 for(const f of renderedFrames){expect(f.player).toBe(f.id);expect(f.hud).toBe('weapon.'+f.id);expect(f.visible).toBe(true);}
 writeFileSync('reports/v057-switch.json',JSON.stringify({frames,renderedFrames,errors:[]},null,2));
});
test('held ordinary attack plays three knife cuts, then a real enemy hit produces stop and recoil without firing',async({page})=>{
 await boot(page);await page.keyboard.press('KeyQ');await page.keyboard.down('KeyJ');
 const stages=new Set<number>();let s:any,stop=0;
 for(let n=0;n<150;n++){
  await page.clock.runFor(10);s=await read(page);
  if(s.melee.state==='active'&&!stages.has(s.melee.stage)){
   expect(s.art.renderedPlayer.body).toMatch(new RegExp('^direct\\.knife\\.combo'+s.melee.stage+'\\.'));
   stages.add(s.melee.stage);await page.screenshot({path:`reports/v057-knife-${s.melee.stage}.png`});
  }
  if(stages.size===3)break;
 }
 await page.keyboard.up('KeyJ');expect([...stages]).toEqual([1,2,3]);expect(s.playerShots).toBe(0);
 await page.clock.runFor(900);s=await read(page);expect(s.melee.stage).toBe(0);
 for(let n=0;n<240;n++){
  s=await read(page);
  if(s.enemies.some((e:any)=>e.health>0&&e.x>s.player.x&&e.x-s.player.x<110))break;
  await page.clock.runFor(17);
 }
 const before=s.melee.hits;await page.keyboard.down('KeyJ');
 for(let n=0;n<180;n++){
  await page.clock.runFor(10);s=await read(page);stop=Math.max(stop,s.feedback.hitStop);
  if(s.melee.hits>before){await page.screenshot({path:'reports/v057-knife-hit.png'});break;}
 }
 await page.keyboard.up('KeyJ');expect(s.melee.hits).toBeGreaterThan(before);expect(stop).toBeGreaterThan(0);
 expect(s.playerShots).toBe(0);expect(s.player.health).toBeGreaterThan(0);
 writeFileSync('reports/v057-knife.json',JSON.stringify({stages:[...stages],hitStop:stop,snapshot:s},null,2));
});
test('mobile ordinary button uses crouch and airborne knife sectors while jump/movement ownership survives',async({page,context})=>{
 await boot(page);await page.keyboard.press('KeyQ');await page.keyboard.down('KeyS');
 const initial=await read(page);await touch(page,context,initial.controls.layout.shoot);await page.clock.runFor(50);
 let s=await read(page);expect(s.melee.stance).toBe('crouch');await page.screenshot({path:'reports/v057-knife-crouch.png'});
 await page.keyboard.up('KeyS');await page.clock.runFor(600);
 await page.keyboard.down('Space');await page.keyboard.down('KeyJ');await page.clock.runFor(100);
 s=await read(page);expect(s.melee.stance).toBe('jump');expect(s.player.grounded).toBe(false);expect(s.playerShots).toBe(0);
 await page.screenshot({path:'reports/v057-knife-jump.png'});await page.keyboard.up('Space');await page.keyboard.up('KeyJ');
});
