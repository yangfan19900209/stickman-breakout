import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const dir='../开发进度/验证记录/v106-revive-select';mkdirSync(dir,{recursive:true});
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4190';
const browser=await chromium.launch({channel:'chrome',headless:true}),cases=[],captures=[],errors=[],failed=[],startedAt=new Date().toISOString();
const read=p=>p.evaluate(()=>globalThis.__BREAKOUT__.snapshot());
async function tick(p,n=120){await p.clock.runFor(n);return read(p);}
async function position(page,value){
 const target=await page.evaluate(async value=>{const cc=await System.import('cc');let target;function visit(n){if(!n.activeInHierarchy)return;const l=n.getComponent(cc.Label);if(l?.string===value){const t=n.parent.getComponent(cc.UITransform);target={x:n.worldPosition.x,y:n.worldPosition.y,width:t?.width,height:t?.height,scale:n.parent.worldScale.x};}n.children.forEach(visit);}visit(cc.director.getScene());return target;},value);
 assert.ok(target,'Missing visible label: '+value);const s=await read(page),v=page.viewportSize();
 return {x:(target.x+s.display.width/2)*v.width/s.display.width,y:(s.display.height/2-target.y)*v.height/s.display.height,height:target.height*target.scale*v.height/s.display.height};
}
async function click(page,value,advance=120){const p=await position(page,value);await page.touchscreen.tap(p.x,p.y);if(advance)await tick(page,advance);}
async function capture(page,name){const file=`${dir}/${name}.png`;await page.screenshot({path:file});captures.push(file);}
async function boot({cleared,viewport={width:852,height:393},badStore=false,failLoad=false}={}){
 const context=await browser.newContext({viewport,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>{if(!failLoad||!r.url().includes('/level02/'))failed.push(r.url());});
 await page.addInitScript(({cleared,badStore})=>{
  const key='breakout.records.r1.local';if(cleared!==undefined&&!sessionStorage.getItem('fixture')){localStorage.setItem(key,badStore?'{corrupt':JSON.stringify({v:1,rule:'r1',reached:Math.max(1,cleared),cleared,times:cleared?{1:{ms:120000,run:'old',at:1},...(cleared===2?{2:{ms:110000,run:'old2',at:1}}:{})}:{}}));sessionStorage.setItem('fixture','yes');}
  const probe=globalThis.__SHARE_HOST__={cards:[],toasts:[]};
  globalThis.wx={getWindowInfo:()=>({windowWidth:innerWidth,windowHeight:innerHeight}),getMenuButtonBoundingClientRect:()=>({left:innerWidth-96,top:12,width:88,height:32}),showShareMenu(){},onShareAppMessage:f=>probe.menu=f,offShareAppMessage(){},showToast:o=>probe.toasts.push(o),shareAppMessage:o=>probe.cards.push(o),
    createImage:()=>new Image(),createCanvas:()=>{const c=document.createElement('canvas');c.toTempFilePathSync=()=>'';return c;},createGameClubButton:o=>({style:o.style,onTap(){},offTap(){},show(){},hide(){},destroy(){}})};
  let shell;Object.defineProperty(globalThis,'__BREAKOUT_PLATFORM__',{configurable:true,get:()=>shell,set(v){shell=v;shell.status=()=>({mode:'wechat-mini-game',fullscreen:false,fullscreenSupported:false,ios:false});shell.safeInsets=()=>({left:59,right:0,top:0,bottom:21});}});
 },{cleared,badStore});
 if(failLoad)await page.route('**/assets/level02/**',route=>route.abort());
 await page.clock.install({time:new Date('2026-11-13T08:00:00Z')});await page.goto(base);await page.waitForFunction(()=>globalThis.__BREAKOUT__);
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));assert.equal(await page.evaluate(()=>__BREAKOUT__.version),'1.0.6');await page.locator('#GameCanvas').focus();
 return {context,page};
}
try {
 const {context,page}=await boot();let s=await read(page);assert.equal(s.presentation.title.primary,'开始突围');await click(page,'开始突围');
 // Enter danger with real movement/fire, then deliberately stop defending.
 await page.keyboard.down('KeyD');await page.keyboard.down('KeyJ');
 for(let i=0;i<160;i++){s=await tick(page,100);if(s.player.x>610)break;}
 await page.keyboard.up('KeyD');await page.keyboard.up('KeyJ');
 for(let i=0;i<240&&s.state!=='gameover';i++)s=await tick(page,250);
 assert.equal(s.state,'gameover');assert.equal(s.revival.remaining,1);const dead=s;
 await capture(page,'death-852');
 const primary=await position(page,'原地复活 · 本关剩余 1 次');assert.ok(primary.height>=44);
 await click(page,'分享邀请');s=await read(page);assert.equal(s.state,'gameover');assert.equal(s.revival.remaining,1);
 assert.equal((await page.evaluate(()=>__SHARE_HOST__.cards)).length,1);
 await page.evaluate(async()=>{const cc=await System.import('cc');cc.game.emit(cc.Game.EVENT_HIDE);cc.game.emit(cc.Game.EVENT_SHOW);});s=await tick(page,500);assert.equal(s.state,'gameover');assert.equal(s.revival.remaining,1);
 await click(page,'原地复活 · 本关剩余 1 次');s=await read(page);assert.equal(s.state,'reviving');assert.equal(s.player.health,5);assert.equal(s.revival.used,1);assert.equal(s.personalRecords.assisted,true);
 assert.equal(s.kills,dead.kills);assert.equal(s.guardHealth,dead.guardHealth);assert.equal(s.weapon,dead.weapon);assert.equal(s.ammo,dead.ammo);assert.equal(s.grenades,dead.grenades);
 await capture(page,'revive-preparation');const frozen=s.personalRecords.clockMs;
 await page.evaluate(async()=>{const cc=await System.import('cc');cc.game.emit(cc.Game.EVENT_HIDE);cc.game.emit(cc.Game.EVENT_SHOW);});s=await tick(page);assert.equal(s.state,'paused');const prep=s.revival.preparation;
 s=await tick(page,3000);assert.equal(s.revival.preparation,prep);assert.equal(s.personalRecords.clockMs,frozen);
 await page.keyboard.press('Escape');s=await tick(page,1200);assert.equal(s.state,'playing');assert.equal(s.player.health,5);assert.ok(s.player.invincible>2);
 await capture(page,'revived-protection');
 for(let i=0;i<240&&s.state!=='gameover';i++)s=await tick(page,250);
 assert.equal(s.state,'gameover');assert.equal(s.revival.remaining,0);assert.equal(s.personalRecords.records.cleared,0);
 await page.setViewportSize({width:667,height:375});await tick(page);await capture(page,'second-death-667');
 const restart=await position(page,'重新开始  →');assert.ok(restart.height>=44);
 await click(page,'重新开始  →');s=await read(page);assert.equal(s.state,'playing');assert.equal(s.revival.remaining,1);assert.equal(s.personalRecords.assisted,false);assert.equal(s.player.health,5);
 cases.push({name:'real-death-revive-second-death-restart',passed:true,shareRequests:1,primaryHeight:primary.height,smallRestartHeight:restart.height});await context.close();

 for(const cleared of [1,2]){
  const {context,page}=await boot({cleared,viewport:{width:667,height:375}});let s=await read(page);assert.equal(s.presentation.title.primary,'选择关卡');
  await click(page,'选择关卡');s=await read(page);assert.equal(s.chapterSelect.visible,true);assert.deepEqual(s.chapterSelect.unlocked,[1,2]);assert.equal(s.platform.gameClub.visible,false);
  for(const b of s.chapterSelect.buttons)assert.ok(b.height*375/s.display.height>=44);
  await capture(page,`chapter-select-cleared-${cleared}-667`);
  await page.setViewportSize({width:375,height:667});await tick(page);await capture(page,`chapter-select-portrait-${cleared}`);await page.keyboard.press('Digit2');s=await tick(page);assert.equal(s.chapter,1);assert.equal(s.chapterSelect.visible,true);
  await page.setViewportSize({width:667,height:375});await tick(page);
  await click(page,cleared===1?'进入第二关':'重玩第二关');
  for(let i=0;i<200;i++){s=await tick(page,50);if(s.chapter===2&&!s.chapterSelect.visible)break;}
  assert.equal(s.chapter,2);assert.equal(s.entryMode,'campaign');assert.equal(s.revival.remaining,1);assert.equal(s.personalRecords.assisted,false);assert.equal(s.personalRecords.records.times[1].ms,120000);
  await page.keyboard.press('KeyP');s=await tick(page);assert.equal(s.state,'paused');await click(page,'返回首页');s=await read(page);assert.equal(s.state,'title');
  await page.clock.resume();await page.reload();await page.waitForFunction(()=>globalThis.__BREAKOUT__);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));s=await read(page);assert.equal(s.presentation.title.primary,'选择关卡');
  await click(page,'选择关卡');await click(page,'重玩第一关');s=await read(page);assert.equal(s.chapter,1);assert.equal(s.state,'playing');assert.equal(s.player.health,5);assert.equal(s.revival.remaining,1);assert.equal(s.personalRecords.assisted,false);
  cases.push({name:`persisted-cleared-${cleared}-selection-replay`,passed:true});await context.close();
 }
 {
  const {context,page}=await boot({cleared:2,badStore:true});const s=await read(page);assert.equal(s.personalRecords.records.cleared,0);assert.equal(s.presentation.title.primary,'开始突围');
  cases.push({name:'corrupt-records-remain-locked',passed:true});await context.close();
 }
 {
  const {context,page}=await boot({cleared:1,failLoad:true});await click(page,'选择关卡');await click(page,'进入第二关');
  let s;for(let i=0;i<240;i++){s=await tick(page,100);if(!s.chapterSelect.loading)break;}
  assert.equal(s.chapter,1);assert.equal(s.state,'title');assert.equal(s.chapterSelect.visible,true);assert.equal(s.chapterSelect.loading,false);assert.match(s.chapterSelect.status,/重试/);
  await capture(page,'chapter-load-failed');await page.unroute('**/assets/level02/**');await click(page,'进入第二关');
  // Backgrounding an in-flight chapter load must keep the new session paused.
  await page.evaluate(async()=>{const cc=await System.import('cc');cc.game.emit(cc.Game.EVENT_HIDE);cc.game.emit(cc.Game.EVENT_SHOW);});
  for(let i=0;i<240;i++){s=await tick(page,100);if(s.chapter===2&&!s.chapterSelect.visible)break;}
  assert.equal(s.chapter,2);assert.equal(s.state,'paused');assert.equal(s.revival.remaining,1);const x=s.player.x,ms=s.personalRecords.clockMs;
  s=await tick(page,2000);assert.equal(s.player.x,x);assert.equal(s.personalRecords.clockMs,ms);await page.keyboard.press('Escape');s=await tick(page);assert.equal(s.state,'playing');
  cases.push({name:'chapter-load-failure-retry-background',passed:true});await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 const result={version:'1.0.6',startedAt,finishedAt:new Date().toISOString(),passed:true,method:'Actual Cocos build, real keyboard/touch. Natural combat deaths and revival. Saved-progress cases use declared legacy-storage fixtures; no game-state editing. WeChat share/lifecycle API simulated, no message sent.',cases,captures,errors,failed};
 writeFileSync(`${dir}/ui.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:true,cases}));
}catch(error){writeFileSync(`${dir}/ui-failure.json`,JSON.stringify({error:String(error),stack:error.stack,cases,captures,errors,failed},null,2));throw error;}finally{await browser.close();}
