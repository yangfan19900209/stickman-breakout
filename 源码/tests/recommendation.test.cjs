const {test}=require('node:test');
const assert=require('node:assert/strict');
const {RecommendationBridge,recommendationVersionSupported,RECOMMENDATION_OPENLINK}=require('../.test-build/assets/scripts/platform/RecommendationBridge.js');
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};}
function host(options={}){
 const instances=[],timers=new Map();let id=0,enabled=true,thanks=0,opened=0;
 const api={getAppBaseInfo:()=>({SDKVersion:options.version??'3.8.6'}),createPageManager(){
  if(options.createThrows)throw Error('creation failed');
  const handlers={},all={},load=deferred(),show=deferred();
  const calls={load:0,show:0,destroy:0,off:0,openlinks:[]};
  const manager={
   load(o){calls.load++;calls.openlinks.push(o.openlink);if(options.loadThrows)throw{errCode:-6};if(!options.pendingLoad)load.resolve();return load.promise;},
   show(o){calls.show++;calls.openlinks.push(o.openlink);if(options.showThrows)throw{errCode:-7};return show.promise;},
   on(e,f){handlers[e]=all[e]=f;if(options.onThrows)throw Error('registration failed');},
   off(e,f){assert.equal(all[e],f);calls.off++;delete handlers[e];},
   destroy(){calls.destroy++;if(options.destroyThrows)throw{errCode:-5};handlers.destroy?.({isRecommended:true});},
  };
  if(options.missing)delete manager[options.missing];
  instances.push({manager,calls,load,show,emit:(e,r)=>handlers[e]?.(r),late:(e,r)=>all[e]?.(r)});
  return manager;
 }};
 const bridge=new RecommendationBridge(()=>enabled,()=>api,{set(f){const key=++id;timers.set(key,f);return key;},clear(key){timers.delete(key);}});
 bridge.onThanks=()=>thanks++;bridge.onOpenRequest=()=>opened++;
 return{api,bridge,instances,timers,options,get current(){return instances.at(-1);},get thanks(){return thanks;},get opened(){return opened;},
  enabled:v=>enabled=v,timeout(){for(const [key,f] of [...timers]){timers.delete(key);f();}}};
}
test('capability gate compares SDK numerical components and rejects unknown versions',()=>{
 for(const version of ['3.8.6','3.8.10','3.10.0','4.0.0'])assert.equal(recommendationVersionSupported(version),true,version);
 for(const version of ['3.8.5','3.6.7','2.30.0','',undefined,'3.8','3.8.6-beta','9.0.'+'9'.repeat(40)])assert.equal(recommendationVersionSupported(version),false,String(version));
});
test('web never preloads or opens a native page',()=>{const h=host();h.enabled(false);h.bridge.preload();h.bridge.request();assert.equal(h.instances.length,0);assert.equal(h.bridge.blocking,false);assert.equal(h.opened,0);});
test('unsupported SDK and absent APIs give a dismissible explanation without creation',()=>{
 for(const version of ['3.8.5','']){const h=host({version});h.bridge.preload();h.bridge.request();assert.equal(h.instances.length,0);assert.equal(h.bridge.state,'unsupported');h.bridge.dismiss();assert.equal(h.bridge.blocking,false);}
 const h=host();delete h.api.createPageManager;h.bridge.request();assert.equal(h.bridge.state,'unsupported');
});
test('legacy system info is read for SDKVersion, never the WeChat client version',()=>{
 const h=host();delete h.api.getAppBaseInfo;h.api.getSystemInfoSync=()=>({SDKVersion:'3.8.6',version:'8.0.1'});h.bridge.request();assert.equal(h.current.calls.show,1);
 const unsupported=host();delete unsupported.api.getAppBaseInfo;unsupported.api.getSystemInfoSync=()=>({version:'8.0.1'});unsupported.bridge.request();assert.equal(unsupported.instances.length,0);
});
test('preload is silent, nonblocking, deduplicated and never displays a page',async()=>{
 const h=host();h.bridge.preload();h.bridge.preload();assert.equal(h.bridge.blocking,false);await flush();
 assert.equal(h.instances.length,1);assert.equal(h.current.calls.load,1);assert.equal(h.current.calls.show,0);assert.equal(h.bridge.state,'ready');assert.equal(h.timers.size,0);
});
test('completed preload is reused by synchronous tap, with one fixed public openlink',async()=>{
 const h=host();h.bridge.preload();await flush();h.bridge.request();
 assert.equal(h.instances.length,1);assert.equal(h.current.calls.show,1);assert.deepEqual(h.current.calls.openlinks,[RECOMMENDATION_OPENLINK,RECOMMENDATION_OPENLINK]);
 assert.equal(h.bridge.state,'opening');assert.equal(h.opened,1);
});
test('tap cancels pending preload and shows replacement synchronously; late resolution cannot reopen it',async()=>{
 const h=host({pendingLoad:true});h.bridge.preload();const old=h.current;h.bridge.request();
 assert.equal(old.calls.destroy,1);assert.equal(old.calls.show,0);assert.equal(h.instances.length,2);assert.equal(h.current.calls.show,1);
 old.load.resolve();old.late('show');old.late('destroy',{isRecommended:true});await flush();
 assert.equal(h.bridge.state,'opening');assert.equal(h.thanks,0);assert.equal(h.instances.length,2);
});
test('failed or stuck preload does not show an error panel; next tap can try a new instance',async()=>{
 for(const reason of ['reject','event','timeout','throw']){
  const h=host({pendingLoad:true,loadThrows:reason==='throw'});h.bridge.preload();
  if(reason==='reject')h.current.load.reject({errCode:-6});if(reason==='event')h.current.emit('error',{errCode:-6});if(reason==='timeout')h.timeout();await flush();
  assert.equal(h.bridge.state,'idle',reason);assert.equal(h.bridge.blocking,false);h.bridge.request();assert.equal(h.current.calls.show,1);
 }
});
test('repeated taps create one native request and one ownership acquisition',()=>{
 const h=host();for(let i=0;i<20;i++)h.bridge.request();assert.equal(h.instances.length,1);assert.equal(h.current.calls.show,1);assert.equal(h.opened,1);
 h.current.emit('show');h.bridge.request();assert.equal(h.current.calls.show,1);assert.equal(h.bridge.snapshot().requests,1);
});
test('ready, show Promise resolution, background and foreground do not announce a recommendation',async()=>{
 const h=host();h.bridge.request();h.current.emit('ready');h.current.show.resolve();await flush();
 h.bridge.setBackground(true);h.bridge.setBackground(false);assert.equal(h.bridge.state,'opening');assert.equal(h.thanks,0);
 h.current.emit('show');h.bridge.setBackground(true);h.bridge.setBackground(false);assert.equal(h.bridge.state,'visible');assert.equal(h.bridge.blocking,true);assert.equal(h.thanks,0);
});
test('show event cancels the wait timeout and lets players read as long as they wish',()=>{
 const h=host();h.bridge.request();assert.equal(h.timers.size,1);h.current.emit('show');h.current.emit('show');assert.equal(h.timers.size,0);h.timeout();h.bridge.dismiss();
 assert.equal(h.bridge.state,'visible');assert.equal(h.current.calls.destroy,0);assert.equal(h.bridge.snapshot().shows,1);
});
test('only a genuine boolean true on user close gives one thank-you, with no native destroy recursion',()=>{
 const h=host();h.bridge.request();h.current.emit('show');const instance=h.current;instance.emit('destroy',{isRecommended:true});instance.late('destroy',{isRecommended:true});
 assert.equal(h.thanks,1);assert.equal(h.bridge.blocking,false);assert.equal(instance.calls.destroy,0);assert.equal(h.bridge.snapshot().closes.recommended,1);
 assert.equal(h.bridge.snapshot().lastKnownRecommended,true);h.bridge.request();assert.equal(h.instances.length,2);
});
test('false, absent and malformed close results return silently with correct three-state observation',()=>{
 for(const result of [{isRecommended:false},{},undefined,{isRecommended:'true'},{isRecommended:1}]){
  const h=host();h.bridge.request();h.current.emit('show');h.current.emit('destroy',result);
  assert.equal(h.thanks,0);assert.equal(h.bridge.state,'idle');assert.equal(h.bridge.snapshot().lastKnownRecommended,result?.isRecommended===false?false:null);
  assert.equal(h.bridge.snapshot().closes[result?.isRecommended===false?'notRecommended':'unknown'],1);
 }
});
test('cancel cleans up before unlocking and ignores late success, errors and Promise rejection',async()=>{
 const h=host();h.bridge.request();const old=h.current;h.bridge.dismiss();assert.equal(old.calls.destroy,1);assert.equal(h.bridge.state,'idle');
 old.late('show');old.late('destroy',{isRecommended:true});old.late('error',{errCode:-6});old.show.reject({errCode:-5});await flush();
 assert.equal(h.bridge.state,'idle');assert.equal(h.thanks,0);assert.equal(h.timers.size,0);assert.deepEqual(h.bridge.snapshot().closes,{recommended:0,notRecommended:0,unknown:0});
});
test('stale callbacks are harmless even on hosts without off',()=>{
 const h=host({missing:'off'});h.bridge.request();const old=h.current;h.bridge.dismiss();h.bridge.request();old.late('destroy',{isRecommended:true});old.late('show');
 assert.equal(h.bridge.state,'opening');assert.equal(h.thanks,0);assert.equal(h.instances.length,2);
});
test('timeout destroys pending page then offers a dismissible failure and explicit retry',()=>{
 const h=host();h.bridge.request();h.timeout();assert.equal(h.current.calls.destroy,1);assert.equal(h.bridge.state,'error');assert.equal(h.bridge.snapshot().lastError.stage,'show-timeout');
 h.bridge.request();assert.equal(h.instances.length,1);h.bridge.dismiss();h.bridge.request();assert.equal(h.instances.length,2);
});
test('sync, asynchronous and native-event errors are caught and expose only sanitized diagnostics',async()=>{
 for(const reason of ['throw','reject','event']){
  const h=host({showThrows:reason==='throw'});h.bridge.request();
  if(reason==='reject')h.current.show.reject({errCode:-6,errMsg:'private diagnostic',user:{secret:'no'}});
  if(reason==='event')h.current.emit('error',{errCode:-8,errMsg:'private diagnostic'});await flush();
  assert.equal(h.bridge.state,'error');assert.equal(h.thanks,0);assert.doesNotMatch(JSON.stringify(h.bridge.snapshot()),/private diagnostic|secret/);h.bridge.dismiss();assert.equal(h.bridge.blocking,false);
 }
});
test('missing PageManager methods and creation/registration exceptions safely degrade',()=>{
 for(const options of [{missing:'load'},{missing:'show'},{missing:'destroy'},{missing:'on'},{createThrows:true},{onThrows:true}]){
  const h=host(options);assert.doesNotThrow(()=>h.bridge.request());assert.equal(h.bridge.state,'unsupported');h.bridge.dismiss();assert.equal(h.bridge.blocking,false);
 }
});
test('failed native cancellation retains ownership until real close and does not count cleanup as recommendation',()=>{
 const h=host({destroyThrows:true});h.bridge.request();h.bridge.dismiss();assert.equal(h.bridge.state,'recovery');assert.equal(h.bridge.blocking,true);
 h.bridge.request();assert.equal(h.instances.length,1);h.current.emit('show');assert.equal(h.bridge.state,'recovery');h.current.emit('destroy',{isRecommended:true});
 assert.equal(h.bridge.state,'idle');assert.equal(h.thanks,0);assert.equal(h.bridge.snapshot().closes.recommended,0);
});
test('recovery retry can clean up and unlock without replaying native show',()=>{
 const h=host({destroyThrows:true});h.bridge.request();h.timeout();assert.equal(h.bridge.state,'recovery');h.options.destroyThrows=false;h.bridge.dismiss();
 assert.equal(h.bridge.state,'idle');assert.equal(h.current.calls.destroy,2);assert.equal(h.current.calls.show,1);assert.equal(h.thanks,0);
});
test('scene teardown is idempotent and removes timeouts and late completions',async()=>{
 for(const preload of [true,false]){
  const h=host({pendingLoad:true});preload?h.bridge.preload():h.bridge.request();const old=h.current;h.bridge.destroy();h.bridge.destroy();
  old.load.resolve();old.show.reject(Error('late'));old.show.promise.catch(()=>{});old.late('destroy',{isRecommended:true});await flush();
  h.bridge.request();h.bridge.preload();assert.equal(h.instances.length,1);assert.equal(old.calls.destroy,1);assert.equal(h.thanks,0);assert.equal(h.timers.size,0);
 }
});
test('background does not start new requests and cancels only optional preload',()=>{
 const h=host({pendingLoad:true});h.bridge.preload();h.bridge.setBackground(true);assert.equal(h.bridge.state,'idle');h.bridge.request();assert.equal(h.current.calls.show,0);
 h.bridge.setBackground(false);h.bridge.request();assert.equal(h.current.calls.show,1);h.bridge.setBackground(true);h.current.emit('show');assert.equal(h.bridge.state,'visible');
});
