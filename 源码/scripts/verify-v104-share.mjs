import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const dir='../开发进度/验证记录/v104-share';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),cases=[],captures=[],errors=[],failed=[],startedAt=new Date().toISOString();
const read=p=>p.evaluate(()=>globalThis.__BREAKOUT__.snapshot()),tick=p=>p.clock.runFor(160);
async function click(page,value){
 const target=await page.evaluate(async value=>{const cc=await System.import('cc');let t;function visit(n){if(!n.activeInHierarchy)return;const l=n.getComponent(cc.Label);if(l?.string===value)t={x:n.worldPosition.x,y:n.worldPosition.y};n.children.forEach(visit);}visit(cc.director.getScene());return t;},value);
 assert.ok(target,'Missing '+value);const s=await read(page),v=page.viewportSize();await page.touchscreen.tap((target.x+s.display.width/2)*v.width/s.display.width,(s.display.height/2-target.y)*v.height/s.display.height);await tick(page);
}
async function capture(page,name){const file=`${dir}/${name}.png`;await page.screenshot({path:file});captures.push(file);}
try{
 for(const mode of ['normal','pending-image','empty-export','failed-export','expired-card']){
  const context=await browser.newContext({viewport:{width:852,height:393},hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>failed.push(r.url()));
  await page.addInitScript(mode=>{
   const probe=globalThis.__SHARE_HOST__={attempts:[],cards:[],toasts:[]};
   globalThis.wx={getWindowInfo:()=>({windowWidth:innerWidth,windowHeight:innerHeight}),getMenuButtonBoundingClientRect:()=>({left:innerWidth-96,top:12,width:88,height:32}),
    showShareMenu(){},onShareAppMessage:f=>probe.menu=f,offShareAppMessage(){},showToast:o=>probe.toasts.push(o),
    shareAppMessage:o=>{probe.attempts.push(o);if(mode==='expired-card'&&o.imageUrl.startsWith('fixture:'))throw Error('temporary file expired');probe.cards.push(o);},
    createImage:()=>mode==='pending-image'?{width:0}:new Image(),
    createCanvas:()=>{const c=document.createElement('canvas');c.toTempFilePathSync=()=>{if(mode==='failed-export')throw Error('export unavailable');return mode==='empty-export'?'':'fixture:dynamic-own-card';};return c;},
    createGameClubButton:o=>({style:o.style,onTap(){},offTap(){},show(){},hide(){},destroy(){}})};
   let shell;Object.defineProperty(globalThis,'__BREAKOUT_PLATFORM__',{configurable:true,get:()=>shell,set(v){shell=v;shell.status=()=>({mode:'wechat-mini-game',fullscreen:false,fullscreenSupported:false,ios:false});shell.safeInsets=()=>({left:59,right:0,top:0,bottom:21});}});
  },mode);
  await page.clock.install({time:new Date('2026-11-13T06:00:00Z')});await page.goto('http://127.0.0.1:4190/');await page.waitForFunction(()=>globalThis.__BREAKOUT__);
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));assert.equal(await page.evaluate(()=>__BREAKOUT__.version),'1.0.4');
  const asset=await page.request.get('http://127.0.0.1:4190/subpackages/landart/share-cover.jpg');assert.equal(asset.status(),200);assert.ok((await asset.body()).length>300000);
  await click(page,'分享游戏');let host=await page.evaluate(()=>__SHARE_HOST__);assert.equal(host.cards.length,1);assert.equal(host.toasts.length,0);assert.equal(host.cards[0].query,'from=invite&sv=1');
  assert.ok(host.cards[0].imageUrl);if(mode!=='normal')assert.equal(host.cards[0].imageUrl,'subpackages/landart/share-cover.jpg');
  if(mode==='expired-card')assert.equal(host.attempts.length,2);else assert.equal(host.attempts.length,1);
  assert.equal((await read(page)).state,'title');assert.equal((await read(page)).platform.share.error,'');await capture(page,mode+'-title');
  await click(page,'开始突围');await page.clock.runFor(300);await page.keyboard.press('p');await tick(page);const paused=(await read(page)).personalRecords.clockMs;
  await click(page,'分享邀请');assert.equal((await read(page)).state,'paused');await page.clock.runFor(1000);assert.equal((await read(page)).personalRecords.clockMs,paused);
  const menu=await page.evaluate(()=>__SHARE_HOST__.menu());assert.equal(menu.query,'from=progress&sv=1&rule=r1&level=1');assert.ok(menu.imageUrl);
  await click(page,'纪录与好友榜');await click(page,'分享邀请');host=await page.evaluate(()=>__SHARE_HOST__);assert.equal(host.cards.length,3);assert.equal(host.toasts.length,0);
  await capture(page,mode+'-records');await click(page,'返回');assert.equal((await read(page)).state,'paused');
  await page.evaluate(async()=>{const cc=await System.import('cc');cc.game.emit(cc.Game.EVENT_HIDE);cc.game.emit(cc.Game.EVENT_SHOW);});await tick(page);assert.equal((await read(page)).state,'paused');
  cases.push({mode,passed:true,nativeShareRequests:host.cards.length,attempts:host.attempts.length,toasts:host.toasts.length,packagedCoverAvailable:true});await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 writeFileSync(`${dir}/browser.json`,JSON.stringify({version:'1.0.4',passed:true,startedAt,method:'Actual Cocos build and ordinary touchscreen/keyboard inputs. WeChat API host is simulated; attempts and native-share requests observed synchronously, no actual message sent or real WeChat panel claimed.',cases,captures,errors,failed},null,2)+'\n');
 console.log(JSON.stringify({passed:true,cases:cases.length}));
}catch(error){writeFileSync(`${dir}/failure.json`,JSON.stringify({error:String(error),stack:error.stack,cases,captures,errors,failed},null,2));throw error;}
finally{await browser.close();}
