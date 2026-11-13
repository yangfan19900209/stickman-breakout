import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const dir='../开发进度/验证记录/v107-social-revive',base=process.env.PREVIEW_URL||'http://127.0.0.1:4197';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),cases=[],captures=[],errors=[],failed=[],startedAt=new Date().toISOString();
const read=p=>p.evaluate(()=>__BREAKOUT__.snapshot());
async function tick(p,ms=160){await p.clock.runFor(ms);return read(p);}
async function pos(p,value){
 const t=await p.evaluate(async value=>{const cc=await System.import('cc');let t;function visit(n){if(!n.activeInHierarchy)return;const l=n.getComponent(cc.Label);if(l?.string===value){const b=n.parent.getComponent(cc.UITransform);t={x:n.worldPosition.x,y:n.worldPosition.y,h:b?.height*n.parent.worldScale.y};}n.children.forEach(visit);}visit(cc.director.getScene());return t;},value);
 assert.ok(t,'Missing '+value);const s=await read(p),v=p.viewportSize();return{x:(t.x+s.display.width/2)*v.width/s.display.width,y:(s.display.height/2-t.y)*v.height/s.display.height,h:t.h*v.height/s.display.height};
}
async function click(p,value,minHeight=/复活/.test(value)?44:0){const b=await pos(p,value);assert.ok(b.h>=minHeight,value+' touch height '+b.h);await p.touchscreen.tap(b.x,b.y);return tick(p);}
async function capture(p,name){const file=`${dir}/${name}.png`;await p.screenshot({path:file});captures.push(file);}
async function emit(p,event,result,late=false){await p.evaluate(({event,result,late})=>__SOCIAL_HOST__.pages.at(-1)[late?'late':'emit'](event,result),{event,result,late});return tick(p);}
async function background(p){await p.evaluate(async()=>{const cc=await System.import('cc');cc.game.emit(cc.Game.EVENT_HIDE);cc.game.emit(cc.Game.EVENT_SHOW);});return tick(p);}
async function die(p){let s=await read(p);for(let i=0;i<360&&s.state!=='gameover';i++)s=await tick(p,250);assert.equal(s.state,'gameover','Natural enemy damage should reach gameover');return s;}
async function boot(chapter=1,web=false){
 const context=await browser.newContext({viewport:{width:667,height:375},hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
 await page.addInitScript(({chapter,web})=>{
  if(chapter===2)localStorage.setItem('breakout.records.r1.local',JSON.stringify({v:1,rule:'r1',reached:2,cleared:2,times:{1:{ms:120000,run:'legacy',at:1},2:{ms:110000,run:'legacy2',at:1}}}));
  const h=globalThis.__SOCIAL_HOST__={cards:[],pages:[],mode:'normal'};
  globalThis.wx={getAppBaseInfo:()=>({SDKVersion:'3.8.6'}),getWindowInfo:()=>({windowWidth:innerWidth,windowHeight:innerHeight}),getMenuButtonBoundingClientRect:()=>({left:innerWidth-96,top:12,width:88,height:32}),
   showShareMenu(){},onShareAppMessage:f=>h.menu=f,offShareAppMessage(){},shareAppMessage:o=>{if(h.mode==='share-failure')throw Error('fixture unavailable');h.cards.push(o)},
   createImage:()=>new Image(),createCanvas:()=>{const c=document.createElement('canvas');c.toTempFilePathSync=()=>'';return c},
   createGameClubButton:o=>({style:o.style,onTap(){},offTap(){},show(){},hide(){},destroy(){}}),
   createPageManager(){const events={},old={},p={emit:(e,r)=>events[e]?.(r),late:(e,r)=>old[e]?.(r)};h.pages.push(p);return{on(e,f){events[e]=old[e]=f},off(e){delete events[e]},load(){return Promise.resolve()},show(){if(h.mode==='recommend-failure')throw Error('fixture unavailable');return Promise.resolve()},destroy(){events.destroy?.({isRecommended:true})}}}
  };
  if(!web){let shell;Object.defineProperty(globalThis,'__BREAKOUT_PLATFORM__',{configurable:true,get:()=>shell,set(v){shell=v;shell.status=()=>({mode:'wechat-mini-game',fullscreen:false,fullscreenSupported:false,ios:false});shell.safeInsets=()=>({left:44,right:0,top:0,bottom:21});}})}
 },{chapter,web});
 await page.clock.install({time:new Date('2026-11-13T11:30:00Z')});await page.goto(base);await page.waitForFunction(()=>globalThis.__BREAKOUT__);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
 assert.equal(await page.evaluate(()=>__BREAKOUT__.version),'1.0.7');await page.locator('#GameCanvas').focus();
 if(chapter===1)await click(page,'开始突围');else {await click(page,'选择关卡');await click(page,'重玩第二关');let s;for(let i=0;i<240;i++){s=await tick(page,100);if(s.chapter===2&&!s.chapterSelect.visible)break;}assert.equal(s.chapter,2);await page.keyboard.press('Enter');await tick(page);}
 await page.keyboard.down('KeyD');if(chapter===1)await page.keyboard.down('KeyJ');
 for(let i=0;i<180;i++){const s=await tick(page,100);if(s.player.x>(chapter===1?610:1190))break;}
 await page.keyboard.up('KeyD');if(chapter===1)await page.keyboard.up('KeyJ');await die(page);return{context,page};
}
try{
 for(const chapter of [1,2]){
  const {context,page}=await boot(chapter);let s=await read(page);assert.equal(s.revival.remaining,1);await capture(page,`chapter-${chapter}-free`);
  s=await click(page,'免费原地复活 · 1 次');assert.equal(s.state,'reviving');assert.equal(s.revival.used,1);assert.equal(s.player.health,5);await tick(page,1200);await die(page);
  await capture(page,`chapter-${chapter}-social-options`);const death=await read(page),clock=death.personalRecords.clockMs;
  if(chapter===1){
   await page.evaluate(()=>__SOCIAL_HOST__.mode='share-failure');s=await click(page,'分享邀请 · 得复活');assert.equal(s.revival.remaining,0);assert.match(s.revival.error,/分享未能打开/);
   await page.evaluate(()=>__SOCIAL_HOST__.mode='recommend-failure');s=await click(page,'推荐游戏 · 得复活');assert.equal(s.platform.recommendation.state,'error');assert.equal(s.revival.remaining,0);await click(page,'返回失败页');
   await page.evaluate(()=>__SOCIAL_HOST__.mode='normal');await click(page,'推荐游戏 · 得复活');await click(page,'取消等待');s=await emit(page,'destroy',{isRecommended:true},true);assert.equal(s.revival.remaining,0);
   await click(page,'推荐游戏 · 得复活');await emit(page,'show');await background(page);assert.equal((await read(page)).platform.recommendation.state,'visible');
   s=await emit(page,'destroy',{isRecommended:false});assert.equal(s.revival.remaining,0);assert.equal(s.personalRecords.clockMs,clock);
  }
  // Every repeat recommendation must be for this death and return a strict true.
  await click(page,'推荐游戏 · 得复活');s=await emit(page,'show');assert.equal(s.revival.remaining,0);await capture(page,`chapter-${chapter}-native-ownership`);
  s=await emit(page,'destroy',{isRecommended:true});assert.equal(s.state,'gameover');assert.equal(s.revival.remaining,1);assert.equal(s.revival.recommended,1);
  s=await emit(page,'destroy',{isRecommended:true},true);assert.equal(s.revival.remaining,1);await capture(page,`chapter-${chapter}-credit-ready`);
  s=await click(page,'原地复活 · 满血继续');assert.equal(s.revival.used,2);assert.equal(s.kills,death.kills);assert.equal(s.personalRecords.assisted,true);await tick(page,1200);await die(page);
  // The ordinary share has no completion callback: cancelled requests retain this credit.
  s=await click(page,'分享邀请 · 得复活');assert.equal(s.state,'gameover');assert.equal(s.revival.shared,1);assert.equal(s.revival.remaining,1);
  const frozen=s.personalRecords.clockMs;s=await background(page);s=await tick(page,2000);assert.equal(s.state,'gameover');assert.equal(s.personalRecords.clockMs,frozen);
  await page.evaluate(()=>__SOCIAL_HOST__.menu());assert.equal((await read(page)).revival.remaining,1);
  s=await click(page,'原地复活 · 满血继续');assert.equal(s.revival.used,3);assert.equal(s.player.health,5);await tick(page,1200);await die(page);
  await page.keyboard.press('Enter');s=await tick(page);assert.equal(s.revival.remaining,1);assert.equal(s.revival.shared,2);assert.equal(s.state,'gameover');
  s=await click(page,'原地复活 · 满血继续');assert.equal(s.revival.used,4);await tick(page,1200);await page.keyboard.press('p');await tick(page);await click(page,'重新开始',0);s=await read(page);
  assert.equal(s.revival.remaining,1);assert.equal(s.revival.used,0);assert.equal(s.revival.shared+s.revival.recommended,0);assert.equal(s.personalRecords.assisted,false);
  if(chapter===2){assert.equal(s.personalRecords.records.times[1].ms,120000);assert.equal(s.personalRecords.records.times[2].ms,110000);}
  cases.push({name:`chapter-${chapter}-free-recommend-share-repeat-reset`,passed:true,ordinaryInputDeaths:4,revivals:4,shareRequests:await page.evaluate(()=>__SOCIAL_HOST__.cards.length),minimumViewport:'667x375'});await context.close();
 }
 const {context,page}=await boot(1,true);await click(page,'免费原地复活 · 1 次');await tick(page,1200);await die(page);await capture(page,'web-exhausted');await click(page,'重新开始  →');assert.equal((await read(page)).revival.remaining,1);cases.push({name:'web-unavailable-restart',passed:true});await context.close();
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 writeFileSync(`${dir}/browser.json`,JSON.stringify({version:'1.0.7',passed:true,startedAt,finishedAt:new Date().toISOString(),method:'Final frozen Cocos build, real touch and keyboard, natural damage/deaths. Chapter 2 uses declared legacy cleared-save fixture. Share/PageManager API is simulated; no real messages or recommendations sent.',cases,captures,errors,failed},null,2)+'\n');console.log(JSON.stringify({passed:true,cases}));
}catch(error){writeFileSync(`${dir}/browser-failure.json`,JSON.stringify({error:String(error),stack:error.stack,cases,captures,errors,failed},null,2));throw error}finally{await browser.close()}
