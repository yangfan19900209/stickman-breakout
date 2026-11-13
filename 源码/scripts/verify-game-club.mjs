import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const dir='../开发进度/验证记录/game-club-20261113';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const startedAt=new Date().toISOString(),errors=[],failed=[],cases=[],captures=[];
const read=page=>page.evaluate(()=>globalThis.__BREAKOUT__.snapshot());
const tick=page=>page.clock.runFor(100);
async function open(viewport,{mode='wechat',url='/',inset=0}={}){
 const context=await browser.newContext({viewport,deviceScaleFactor:3,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>failed.push(r.url()));
 await page.addInitScript(({mode,inset})=>{
  const probe=globalThis.__GAME_CLUB_HOST__={created:0,shown:0,hidden:0,destroyed:0,taps:0,options:[],toasts:[]};
  const css=(e,s)=>Object.assign(e.style,{position:'fixed',zIndex:'9999',boxSizing:'border-box',padding:'0',
   left:s.left+'px',top:s.top+'px',width:s.width+'px',height:s.height+'px',backgroundColor:s.backgroundColor,
   color:s.color,border:`${s.borderWidth}px solid ${s.borderColor}`,borderRadius:s.borderRadius+'px',
   font:`${s.fontSize}px sans-serif`,lineHeight:s.lineHeight+'px',textAlign:s.textAlign});
  globalThis.wx={getWindowInfo:()=>({windowWidth:innerWidth,windowHeight:innerHeight,pixelRatio:3}),
   getMenuButtonBoundingClientRect:()=>({left:innerWidth-96,top:12,width:88,height:32}),
   showToast:o=>probe.toasts.push(o)};
  if(mode!=='unsupported')globalThis.wx.createGameClubButton=options=>{
   probe.created++;probe.options.push(options);
   if(mode==='failure')throw Error('simulated host unavailable');
   const e=document.createElement('button');e.dataset.testid='native-game-club';e.textContent=options.text;
   const style=new Proxy({...options.style},{set(t,k,v){t[k]=v;css(e,t);return true;}});css(e,style);
   let listener;e.addEventListener('click',()=>{probe.taps++;listener?.({errMsg:'createGameClubButton:ok'});});
   document.body.append(e);
   return{style,onTap:fn=>listener=fn,offTap:fn=>{if(fn===listener)listener=undefined;},
    show:()=>{probe.shown++;e.style.display='block';},hide:()=>{probe.hidden++;e.style.display='none';},
    destroy:()=>{probe.destroyed++;e.remove();}};
  };
  let shell;Object.defineProperty(globalThis,'__BREAKOUT_PLATFORM__',{configurable:true,get:()=>shell,set(v){
   shell=v;if(mode!=='browser')shell.status=()=>({mode:'wechat-mini-game',fullscreen:false,fullscreenSupported:false,ios:false});
   shell.safeInsets=()=>({left:inset,right:0,top:0,bottom:inset?21:0});
  }});
 },{mode,inset});
 await page.clock.install({time:new Date('2026-11-13T01:00:00Z')});
 await page.goto('http://127.0.0.1:4190'+url);await page.waitForFunction(()=>globalThis.__BREAKOUT__);
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+800));await page.locator('#GameCanvas').focus();
 return{context,page};
}
async function touchRect(page,rect){
 const s=await read(page),v=page.viewportSize();
 await page.touchscreen.tap((rect.left+rect.width/2)*v.width/s.display.width,
  (rect.top+rect.height/2)*v.height/s.display.height);await tick(page);
}
async function touchLabel(page,value){
 const target=await page.evaluate(async value=>{
  const cc=await System.import('cc');let target;
  function visit(n){if(!n.activeInHierarchy)return;const l=n.getComponent(cc.Label);
   if(l?.string===value)target={x:n.worldPosition.x,y:n.worldPosition.y};for(const child of n.children)visit(child);}
  visit(cc.director.getScene());return target;
 },value);assert.ok(target,'Missing visible label '+value);
 const s=await read(page),v=page.viewportSize();
 await page.touchscreen.tap((target.x+s.display.width/2)*v.width/s.display.width,
  (s.display.height/2-target.y)*v.height/s.display.height);await tick(page);
}
async function capture(page,name){const file=`${dir}/${name}.png`;await page.screenshot({path:file});captures.push(file);}
async function lifecycle(page,hidden){await page.evaluate(async hidden=>{
 const cc=await System.import('cc');cc.game.emit(hidden?cc.Game.EVENT_HIDE:cc.Game.EVENT_SHOW);
},hidden);await tick(page);}
try{
 for(const [viewport,inset,name] of [[{width:852,height:393},59,'wide-phone'],[{width:667,height:375},0,'small-phone'],[{width:1280,height:720},0,'desktop']]){
  const {context,page}=await open(viewport,{inset});let s=await read(page);
  assert.equal(s.state,'title');assert.equal(s.platform.gameClub.visible,true);assert.ok(s.presentation.gameClub);
  const native=page.getByTestId('native-game-club'),rect=await native.boundingBox();
  assert.ok(rect.x>inset&&rect.y+rect.height<viewport.height);assert.ok(rect.height>=40);
  const expected=s.platform.gameClub.bounds;assert.ok(Math.abs(expected.left-rect.x)<1);
  assert.ok(Math.abs(expected.top-rect.y)<1);await capture(page,`${name}-home`);
  await native.tap();await tick(page);s=await read(page);
  assert.equal(s.state,'title');assert.equal(s.platform.gameClub.tapRequests,1);
  await lifecycle(page,true);assert.equal((await read(page)).platform.gameClub.visible,false);
  await lifecycle(page,false);assert.equal((await read(page)).platform.gameClub.visible,true);
  await touchLabel(page,'开始突围');s=await read(page);assert.equal(s.state,'playing');assert.equal(s.platform.gameClub.visible,false);
  await page.keyboard.press('p');await tick(page);s=await read(page);assert.equal(s.state,'paused');assert.equal(s.platform.gameClub.visible,true);
  await page.keyboard.down('j');await native.tap();await tick(page);s=await read(page);
  assert.equal(s.controls.shootHeld,false);assert.equal(s.state,'paused');await page.keyboard.up('j');
  await lifecycle(page,true);await lifecycle(page,false);assert.equal((await read(page)).state,'paused');
  await capture(page,`${name}-paused`);
  await page.setViewportSize({width:viewport.height,height:viewport.width});await page.clock.runFor(250);
  s=await read(page);assert.equal(s.display.portrait,true);assert.equal(s.platform.gameClub.visible,false);
  await page.setViewportSize(viewport);await page.clock.runFor(250);s=await read(page);
  assert.equal(s.state,'paused');assert.equal(s.platform.gameClub.visible,true);
  await touchLabel(page,'继续突围');s=await read(page);assert.equal(s.state,'playing');assert.equal(s.platform.gameClub.visible,false);
  await page.keyboard.press('p');await tick(page);await touchLabel(page,'返回首页');s=await read(page);
  assert.equal(s.state,'title');assert.equal(s.platform.gameClub.visible,true);assert.equal(s.chapterAssets.flightLoaded,false);
  const host=await page.evaluate(()=>globalThis.__GAME_CLUB_HOST__);assert.equal(host.created,1);
  assert.ok(host.options.every(o=>!('openlink'in o)));assert.deepEqual(host.toasts,[]);
  cases.push({name,viewport,inset,homeBounds:rect,host,final:s.platform.gameClub,checks:['title tap','start hides','pause tap clears input','background/foreground preserves pause','rotation hides/restores','resume hides','return home reuses button']});
  await context.close();
 }
 for(const mode of ['unsupported','failure','browser']){
  const {context,page}=await open({width:852,height:393},{mode});let s=await read(page);
  assert.equal(s.platform.gameClub.visible,false);
  if(mode==='browser'){assert.equal(s.presentation.gameClub,undefined);await touchLabel(page,'开始突围');assert.equal((await read(page)).state,'playing');}
  else{assert.ok(s.presentation.gameClub);await touchRect(page,s.presentation.gameClub);
   const host=await page.evaluate(()=>globalThis.__GAME_CLUB_HOST__);assert.equal(host.toasts.length,1);
   assert.equal(host.created,mode==='failure'?1:0);await touchLabel(page,'开始突围');assert.equal((await read(page)).state,'playing');}
  cases.push({name:mode,passed:true});await context.close();
 }
 const {context,page}=await open({width:852,height:393},{url:'/level02.html'});
 // Let async chapter preloading finish before freezing the game clock again.
 await page.clock.resume();await page.waitForFunction(()=>globalThis.__BREAKOUT__.snapshot().chapter===2);
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+200));await tick(page);
 await page.keyboard.press('Enter');await tick(page);await page.keyboard.press('p');await tick(page);
 let s=await read(page);assert.equal(s.chapter,2);assert.equal(s.state,'paused');assert.equal(s.platform.gameClub.visible,true);
 await page.getByTestId('native-game-club').tap();await lifecycle(page,true);await lifecycle(page,false);
 assert.equal((await read(page)).state,'paused');await capture(page,'chapter-two-paused');
 await touchLabel(page,'继续突围');assert.equal((await read(page)).platform.gameClub.visible,false);
 cases.push({name:'chapter-two-pause',passed:true});await context.close();
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 writeFileSync(`${dir}/browser.json`,JSON.stringify({passed:true,startedAt,method:'Actual Cocos Web build and touch/keyboard input, with a simulated WeChat host and native overlay. No game-state changes. This does not confirm WeChat device behavior or server-side community access.',cases,captures,errors,failed},null,2)+'\n');
 console.log(JSON.stringify({passed:true,cases:cases.length,captures}));
}catch(error){writeFileSync(`${dir}/browser-failure.json`,JSON.stringify({error:String(error),stack:error.stack,cases,captures,errors,failed},null,2));throw error;}
finally{await browser.close();}
