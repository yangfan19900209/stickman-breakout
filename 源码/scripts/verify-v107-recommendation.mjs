import {chromium} from 'playwright';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {reportsRoot,sourceRoot} from './project-paths.mjs';

const dir=path.join(reportsRoot,'v107-social-revive/recommendation');mkdirSync(dir,{recursive:true});
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4197';
const version=JSON.parse(readFileSync(path.join(sourceRoot,'package.json'),'utf8')).version;
const browser=await chromium.launch({channel:'chrome',headless:true});
const cases=[],captures=[],errors=[],failed=[],startedAt=new Date().toISOString();
const read=p=>p.evaluate(()=>globalThis.__BREAKOUT__.snapshot());
const tick=(p,ms=180)=>p.clock.runFor(ms);
const host=p=>p.evaluate(()=>({instances:__RECOMMEND_HOST__.instances.map(i=>({load:i.load,show:i.show,destroy:i.destroy})),shares:__RECOMMEND_HOST__.shares,club:__RECOMMEND_HOST__.club}));
async function capture(p,name){const file=path.join(dir,name+'.png');await p.screenshot({path:file});captures.push(file);}
async function tapBounds(p,b){const s=await read(p),v=p.viewportSize();await p.touchscreen.tap(b.x*v.width/s.display.width,(s.display.height-b.y)*v.height/s.display.height);await tick(p);}
async function click(p,text){
 const target=await p.evaluate(async text=>{const cc=await System.import('cc');let t;function visit(n){if(!n.activeInHierarchy)return;const l=n.getComponent(cc.Label);if(l?.string===text)t={x:n.worldPosition.x,y:n.worldPosition.y};n.children.forEach(visit);}visit(cc.director.getScene());return t;},text);
 assert.ok(target,'Missing clickable label: '+text);const s=await read(p);await tapBounds(p,{x:target.x+s.display.width/2,y:target.y+s.display.height/2});
}
async function emit(p,event,result,index=-1){await p.evaluate(({event,result,index})=>__RECOMMEND_HOST__.instances.at(index).emit(event,result),{event,result,index});await tick(p);}
async function setup(mode='normal',viewport={width:844,height:390}){
 const context=await browser.newContext({viewport,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failed.push({url:r.url(),status:r.status()});});
 await page.addInitScript(mode=>{
  const probe=globalThis.__RECOMMEND_HOST__={instances:[],shares:0,club:false,destroyThrows:mode==='cleanup-failure'};
  globalThis.wx={
   getAppBaseInfo:()=>({SDKVersion:mode==='old'?'3.8.5':'3.8.6'}),
   getWindowInfo:()=>({windowWidth:innerWidth,windowHeight:innerHeight}),
   getMenuButtonBoundingClientRect:()=>({left:innerWidth-96,top:12,width:88,height:32}),
   showShareMenu(){},onShareAppMessage(){},offShareAppMessage(){},shareAppMessage(){probe.shares++;},
   onShow:f=>probe.launch=f,offShow(){},
   createGameClubButton:o=>{probe.club=true;return{style:o.style,onTap:f=>probe.clubTap=f,offTap(){},show(){probe.club=true;},hide(){probe.club=false;},destroy(){probe.club=false;}};},
   createPageManager(){
    const events={},all={};const instance={load:0,show:0,destroy:0,emit:(e,r)=>events[e]?.(r),late:(e,r)=>all[e]?.(r)};probe.instances.push(instance);
    return{
     on(e,f){events[e]=all[e]=f;},off(e){delete events[e];},
     load(){instance.load++;return mode==='pending-load'?new Promise(resolve=>instance.resolveLoad=resolve):mode==='preload-failure'?Promise.reject({errCode:-6}):Promise.resolve();},
     show(){instance.show++;if(mode==='show-failure')return Promise.reject({errCode:-6});return Promise.resolve();},
     destroy(){instance.destroy++;if(probe.destroyThrows)throw{errCode:-5};events.destroy?.({isRecommended:true});},
    };
   },
  };
  if(mode==='missing-api')delete wx.createPageManager;
  if(mode!=='web'){
   let shell;Object.defineProperty(globalThis,'__BREAKOUT_PLATFORM__',{configurable:true,get:()=>shell,set(v){shell=v;shell.status=()=>({mode:'wechat-mini-game',fullscreen:false,fullscreenSupported:false,ios:false});shell.safeInsets=()=>({left:innerWidth<750?44:59,right:0,top:0,bottom:21});}});
  }
 },mode);
 await page.clock.install({time:new Date('2026-11-13T09:20:00Z')});await page.goto(base+'/');await page.waitForFunction(()=>!!globalThis.__BREAKOUT__);
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+900));
 assert.equal(await page.evaluate(()=>__BREAKOUT__.version),version);
 return{context,page};
}
try{
 for(const viewport of [{width:667,height:375},{width:844,height:390},{width:932,height:430},{width:1280,height:720}]){
  const {context,page}=await setup('normal',viewport);let s=await read(page),h=await host(page);
  assert.equal(h.instances.length,1);assert.equal(h.instances[0].show,0,'No automatic recommendation');assert.equal(s.state,'title');
  const b=s.presentation.title,scale=viewport.height/s.display.height;
  for(const key of ['start','gameClub','share','records','recommendation']){
   assert.ok(b[key].height*scale>=44,key+' touch height');
   assert.ok((b[key].x-b[key].width/2)*scale>=(viewport.width<750?44:59),key+' left safe area');
   assert.ok((b[key].y-b[key].height/2)*scale>=21,key+' bottom safe area');
  }
  assert.ok((b.recommendation.x-b.recommendation.width/2-b.records.x-b.records.width/2)*scale>=8,'column gap');
  assert.ok((b.share.y-b.share.height/2-b.recommendation.y-b.recommendation.height/2)*scale>=8,'row gap');
  await capture(page,`home-${viewport.width}x${viewport.height}`);
  await tapBounds(page,b.recommendation);s=await read(page);assert.equal(s.platform.recommendation.state,'opening');assert.equal(s.platform.gameClub.visible,false);
  const saved=s.personalRecords,recordClock=saved.clockMs;
  await tapBounds(page,b.recommendation);await tapBounds(page,b.start);await tapBounds(page,b.share);await tapBounds(page,b.records);await page.keyboard.press('Enter');await tick(page,400);
  assert.equal((await host(page)).instances[0].show,1);assert.equal((await host(page)).shares,0);s=await read(page);assert.equal(s.state,'title');assert.equal(s.recordsPanel.visible,false);assert.equal(s.chapterSelect.visible,false);assert.equal(s.personalRecords.clockMs,recordClock);
  if(viewport.width===844)await capture(page,'opening-cancellable');
  await emit(page,'show');await tick(page,10000);s=await read(page);assert.equal(s.platform.recommendation.state,'visible');assert.equal(s.platform.gameClub.visible,false);
  await page.evaluate(async()=>{const cc=await System.import('cc');cc.game.emit(cc.Game.EVENT_HIDE);cc.game.emit(cc.Game.EVENT_SHOW);});await tick(page);
  assert.equal((await read(page)).platform.recommendation.state,'visible');
  await emit(page,'destroy',{isRecommended:false});s=await read(page);assert.equal(s.state,'title');assert.equal(s.recommendationPanel.thanksVisible,false);assert.equal(s.platform.gameClub.visible,true);assert.deepEqual(s.personalRecords,saved);
  await click(page,'推荐游戏');await emit(page,'show');await emit(page,'destroy',{});assert.equal((await read(page)).recommendationPanel.thanksVisible,false);
  await click(page,'推荐游戏');await emit(page,'show');await emit(page,'destroy',{isRecommended:true});assert.equal((await read(page)).recommendationPanel.thanksVisible,true);await tick(page,2200);assert.equal((await read(page)).recommendationPanel.thanksVisible,false);
  await click(page,'纪录榜');assert.equal((await read(page)).recordsPanel.visible,true);await click(page,'返回');await click(page,'分享游戏');assert.equal((await host(page)).shares,1);
  await click(page,'开始突围');await tick(page,300);assert.equal((await read(page)).state,'playing');await page.keyboard.press('p');await tick(page);assert.equal((await read(page)).state,'paused');
  cases.push({name:'touch-layout-and-return',viewport,minimumTouchHeight:88*scale,passed:true});await context.close();
 }
 for(const mode of ['old','missing-api','show-failure','pending-load','preload-failure','cleanup-failure','normal']){
  const {context,page}=await setup(mode);let before=await host(page);await click(page,'推荐游戏');let s=await read(page);
  if(['old','missing-api'].includes(mode)){
   assert.equal(s.platform.recommendation.state,'unsupported');assert.equal((await host(page)).instances.length,0);assert.match(s.recommendationPanel.message,/评分主页/);await capture(page,mode);await click(page,'返回首页');
  }else if(mode==='show-failure'){
   assert.equal(s.platform.recommendation.state,'error');await capture(page,mode);await click(page,'返回首页');
  }else if(mode==='cleanup-failure'){
   await click(page,'取消等待');assert.equal((await read(page)).platform.recommendation.state,'recovery');await capture(page,mode);await page.keyboard.press('Enter');await tick(page);assert.equal((await read(page)).state,'title');
   await page.evaluate(()=>__RECOMMEND_HOST__.destroyThrows=false);await click(page,'重试返回首页');
  }else if(mode==='normal'){
   await tick(page,8200);assert.equal((await read(page)).platform.recommendation.state,'error');await capture(page,'timeout');await click(page,'返回首页');
  }else{
   if(mode==='pending-load'){const h=await host(page);assert.equal(h.instances.length,2);assert.equal(h.instances[0].destroy,1);assert.equal(h.instances[1].show,1);await page.evaluate(()=>__RECOMMEND_HOST__.instances[0].resolveLoad());}
   assert.equal((await read(page)).platform.recommendation.state,'opening');await click(page,'取消等待');
  }
  s=await read(page);assert.equal(s.platform.recommendation.blocking,false);assert.equal(s.state,'title');assert.equal(s.recommendationPanel.thanksVisible,false);
  await page.evaluate(()=>__RECOMMEND_HOST__.instances.forEach(i=>{i.late('show');i.late('destroy',{isRecommended:true});}));await tick(page);assert.equal((await read(page)).platform.recommendation.blocking,false);
  await click(page,'开始突围');assert.equal((await read(page)).state,'playing');cases.push({name:mode,passed:true,preloadInstances:before.instances.length});await context.close();
 }
 {
  const {context,page}=await setup();await click(page,'推荐游戏');await emit(page,'show');
  await page.evaluate(()=>__RECOMMEND_HOST__.launch({query:{from:'invite',sv:'1'}}));await tick(page);assert.equal((await read(page)).recordsPanel.visible,false);
  await page.setViewportSize({width:390,height:844});await tick(page,1200);assert.equal((await read(page)).platform.recommendation.blocking,true);assert.equal((await read(page)).platform.gameClub.visible,false);await capture(page,'native-open-portrait');
  await page.setViewportSize({width:844,height:390});await tick(page,1200);assert.equal((await read(page)).state,'title');
  await emit(page,'destroy',{isRecommended:false});assert.equal((await read(page)).recordsPanel.mode,'invite');await click(page,'返回');assert.equal((await read(page)).platform.recommendation.blocking,false);
  await page.setViewportSize({width:390,height:844});await tick(page,1200);await page.keyboard.press('Enter');assert.equal((await read(page)).state,'title');await capture(page,'home-portrait');
  await page.setViewportSize({width:844,height:390});await tick(page,1200);await click(page,'推荐游戏');await page.setViewportSize({width:390,height:844});await tick(page,1200);
  const portrait=await read(page);assert.ok(portrait.recommendationPanel.buttonHeight*844/portrait.display.height>=44,'Portrait cancel touch height');
  await capture(page,'waiting-portrait');await click(page,'取消等待');assert.equal((await read(page)).platform.recommendation.blocking,false);
  cases.push({name:'invitation-queue-orientation-and-return',passed:true});await context.close();
 }
 {
  const {context,page}=await setup('web');assert.equal((await read(page)).presentation.title.recommendation,null);assert.equal((await host(page)).instances.length,0);await capture(page,'web-no-wechat-entry');await click(page,'开始突围');assert.equal((await read(page)).state,'playing');cases.push({name:'web-hidden',passed:true});await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 const report={version,passed:true,startedAt,finishedAt:new Date().toISOString(),method:'Actual Cocos build, normal touch and keyboard input, simulated WeChat PageManager and platform lifecycle. No real recommendation, rating, sharing or WeChat device result.',cases,captures,errors,failed};
 writeFileSync(path.join(dir,'browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,cases:cases.length,captures:captures.length,version}));
}catch(error){writeFileSync(path.join(dir,'failure.json'),JSON.stringify({error:String(error),stack:error.stack,cases,captures,errors,failed},null,2));throw error;}
finally{await browser.close();}
