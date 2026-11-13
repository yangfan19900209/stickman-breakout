const {test}=require('node:test');
const assert=require('node:assert/strict');
const {GameClubBridge,gameClubWindowRect}=require('../.test-build/assets/scripts/platform/GameClubBridge.js');
const design={width:1280,height:720},frame={width:1280,height:720};
const home={left:95,top:544,width:300,height:80};
const paused={left:653,top:524,width:280,height:80};
function host(){
 const calls={create:0,show:0,hide:0,destroy:0,off:0,reads:0,writes:0,toasts:[],options:[]};
 let tap,removed,enabled=true;
 const api={getWindowInfo(){calls.reads++;return{windowWidth:1280,windowHeight:720,pixelRatio:3};},
  showToast(o){calls.toasts.push(o);},createGameClubButton(options){
   calls.create++;calls.options.push(options);
   return{style:new Proxy({...options.style},{set(t,k,v){calls.writes++;t[k]=v;return true;}}),
    show(){calls.show++;},hide(){calls.hide++;},destroy(){calls.destroy++;},
    onTap(fn){tap=fn;},offTap(fn){removed=fn;calls.off++;}};
  }};
 const bridge=new GameClubBridge(()=>enabled,()=>api);
 return{bridge,api,calls,tap:r=>tap?.(r),removed:()=>removed,listener:()=>tap,setEnabled:v=>enabled=v};
}
test('native home entry omits openlink and reuses one button without per-frame host calls',()=>{
 const h=host();h.bridge.sync(home,design,frame);
 for(let i=0;i<120;i++)h.bridge.sync(home,design,frame);
 assert.equal(h.calls.create,1);assert.equal(h.calls.reads,1);assert.equal(h.calls.writes,0);
 assert.equal(h.calls.options[0].text,'');assert.equal('openlink' in h.calls.options[0],false);
 assert.equal(h.calls.options[0].type,'text'); // Image-only icon must not replace generated art.
 assert.equal(h.calls.options[0].style.backgroundColor,'transparent');assert.equal(h.calls.options[0].style.borderWidth,0);
 assert.equal(h.bridge.status().visible,true);
 h.bridge.sync(undefined,design,frame);assert.equal(h.calls.hide,1);
 h.bridge.sync(paused,design,frame);assert.equal(h.calls.create,1);assert.equal(h.calls.show,1);
 assert.deepEqual(h.bridge.status().bounds,paused);
});
test('window coordinates use logical pixels with DPR-independent scaling and letterbox offsets',()=>{
 assert.deepEqual(gameClubWindowRect({left:100,top:200,width:300,height:80},design,{width:640,height:360}),
  {left:50,top:100,width:150,height:40});
 assert.deepEqual(gameClubWindowRect({left:100,top:200,width:300,height:80},design,{width:800,height:360}),
  {left:130,top:100,width:150,height:40});
 const h=host();h.api.getWindowInfo=()=>({windowWidth:640,windowHeight:360,pixelRatio:3});
 h.bridge.sync(home,design,{width:1920,height:1080});
 assert.deepEqual(h.bridge.status().bounds,{left:47.5,top:272,width:150,height:40});
});
test('background, portrait and non-menu states hide the native button until eligible again',()=>{
 const h=host();h.bridge.sync(home,design,frame);h.bridge.setBackground(true);
 for(let i=0;i<3;i++)h.bridge.sync(home,design,frame);
 assert.equal(h.bridge.status().visible,false);assert.equal(h.calls.show,0);
 h.bridge.setBackground(false);h.bridge.sync(home,design,frame);assert.equal(h.calls.show,1);
 h.bridge.sync(home,design,{width:393,height:852});assert.equal(h.bridge.status().visible,false);
 h.bridge.sync(paused,design,frame);assert.equal(h.calls.show,2);
 h.bridge.sync(undefined,design,frame);assert.equal(h.bridge.status().visible,false);
});
test('tap requests clear input via owner and ignore hidden or disposed callbacks',()=>{
 const h=host();let cleared=0;h.bridge.onOpenRequest=()=>cleared++;
 h.bridge.sync(home,design,frame);h.tap();assert.equal(cleared,1);assert.equal(h.bridge.status().tapRequests,1);
 h.bridge.showFallback();assert.equal(h.calls.toasts.length,0,'Engine hit-area propagation cannot show a false error');
 h.tap({errMsg:'openGameClub:fail'});assert.equal(cleared,2);assert.equal(h.bridge.status().tapRequests,1);
 assert.equal(h.calls.toasts.length,1);
 h.bridge.hide();h.tap();assert.equal(cleared,2);
 h.bridge.sync(paused,design,frame);const listener=h.listener();h.bridge.destroy();h.bridge.destroy();listener();
 assert.equal(cleared,2);assert.equal(h.calls.destroy,1);assert.equal(h.calls.off,1);assert.equal(h.removed(),listener);
 h.bridge.sync(home,design,frame);assert.equal(h.calls.create,1);
});
test('unsupported hosts and browser mode do not crash or create a native overlay',()=>{
 const h=host();h.setEnabled(false);h.bridge.sync(home,design,frame);h.bridge.showFallback();
 assert.equal(h.calls.create,0);assert.equal(h.calls.toasts.length,0);
 h.setEnabled(true);delete h.api.createGameClubButton;h.bridge.sync(home,design,frame);h.bridge.showFallback();
 assert.match(h.calls.toasts[0].title,/更新微信/);assert.equal(h.bridge.status().supported,false);
 const empty=new GameClubBridge(()=>true,()=>undefined);empty.sync(home,design,frame);empty.showFallback();empty.destroy();
});
test('creation failure is bounded to one attempt until menu reentry and cleanup handles host errors',()=>{
 const h=host();const create=h.api.createGameClubButton;
 h.api.createGameClubButton=()=>{h.calls.create++;throw new Error('host unavailable');};
 for(let i=0;i<60;i++)h.bridge.sync(home,design,frame);
 assert.equal(h.calls.create,1);assert.match(h.bridge.status().error,/host unavailable/);
 h.bridge.sync(undefined,design,frame);h.api.createGameClubButton=create;
 h.bridge.sync(home,design,frame);assert.equal(h.calls.create,2);assert.equal(h.bridge.status().visible,true);
 const broken=new GameClubBridge(()=>true,()=>({createGameClubButton(){return{
  style:{},onTap(){throw Error('onTap failed');},offTap(){throw Error('offTap failed');},
  hide(){throw Error('hide failed');},destroy(){throw Error('destroy failed');},show(){}};}}));
 assert.doesNotThrow(()=>{broken.sync(home,design,frame);broken.destroy();});
 assert.equal(broken.status().visible,false);
});
test('invalid rectangles and sizes cannot place native overlays outside the game',()=>{
 for(const rect of [{...home,left:-1},{...home,top:NaN},{...home,width:0},{...home,top:710}])
  assert.equal(gameClubWindowRect(rect,design,frame),undefined);
 assert.equal(gameClubWindowRect(home,design,{width:0,height:720}),undefined);
 const h=host();h.bridge.sync(home,design,frame);h.bridge.sync({...home,top:800},design,frame);
 assert.equal(h.bridge.status().visible,false);
});
test('legacy window information works without requiring the modern window API',()=>{
 const h=host();delete h.api.getWindowInfo;
 h.api.getSystemInfoSync=()=>({windowWidth:640,windowHeight:360});
 h.bridge.sync(home,design,{width:1920,height:1080});assert.equal(h.bridge.status().bounds.width,150);
});
