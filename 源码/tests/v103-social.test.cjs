const {test}=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm'), path=require('node:path'), {createRequire}=require('node:module');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const R=load('social/RunRecords'), {RunClock}=load('social/RunClock'), {PersonalRecords}=load('social/PersonalRecords');
const {RecordStore}=load('platform/RecordStore'), {SocialBridge}=load('platform/SocialBridge'), {ShareBridge}=load('platform/ShareBridge');
const {parseInvite}=load('social/InviteRoute');
const record=(reached=2,cleared=2,a=120000,b=80000)=>({v:1,rule:'r1',reached,cleared,times:{...(a?{1:{ms:a,run:'a',at:10}}:{}),...(b?{2:{ms:b,run:'b',at:11}}:{})}});
const copy=x=>JSON.parse(JSON.stringify(x));
function openModule(name,dependencies={}){
 const module={exports:{}};vm.runInNewContext(fs.readFileSync('build-templates/wechatgame/openDataContext/'+name+'.js','utf8'),{module,exports:module.exports,require:k=>k==='./records.js'?R:dependencies[k],setTimeout,clearTimeout,...dependencies});return module.exports;
}
test('real elapsed clock includes long frames and hit-stop; excludes pauses, background and load gaps',()=>{
 let n=100;const c=new RunClock(()=>n);c.reset();n+=3000;c.setActive(true);n+=8017;c.setActive(false);n+=60000;c.setActive(true);n+=323;
 assert.equal(c.stop(),8340);n+=999;c.stop();assert.equal(c.milliseconds,8340);assert.ok(c.valid);
});
test('clock reset clears a prior run; backwards/invalid monotonic samples invalidate the score',()=>{
 let n=10;const c=new RunClock(()=>n);c.reset();c.setActive(true);n=9;c.stop();assert.equal(c.valid,false);
 n=20;c.reset();assert.ok(c.valid);assert.equal(c.milliseconds,0);c.setActive(true);n=NaN;c.stop();assert.equal(c.valid,false);
 c.reset();n=30;c.setActive(true);assert.equal(c.valid,false);
});
test('WeChat raw microseconds are converted once; browser, debug and developer-tool records cannot upload',()=>{
 const file=path.resolve('.test-build/assets/scripts/platform/PlatformAdapter.js'), nativeRequire=createRequire(file);
 for(const [platform,debug,hostPlatform,expected]of [['wechat',false,'ios',true],['wechat',false,'devtools',false],['wechat',true,'ios',false],['browser',false,'ios',false]]){
  const module={exports:{}};vm.runInNewContext(fs.readFileSync(file,'utf8'),{module,exports:module.exports,performance:{now:()=>4500},wx:{getPerformance:()=>({now:()=>1234567}),getSystemInfoSync:()=>({platform:hostPlatform})},require:name=>name==='cc'?{sys:{platform,Platform:{WECHAT_GAME:'wechat'}},view:{}}:name==='cc/env'?{DEBUG:debug}:nativeRequire(name)});
  const adapter=new module.exports.PlatformAdapter();assert.equal(adapter.canUpload(),expected);assert.equal(adapter.monotonicNow(),platform==='wechat'?1234.567:4500);
 }
});
test('accepted invitation targets remain display-only across normal chapter changes',()=>{
 let n=0;const saves=[],p=new PersonalRecords({load:R.emptyRecords,save:r=>{saves.push(copy(r));return true;}},()=>n);
 p.challenge=parseInvite({from:'challenge',sv:'1',rule:'r1',level:'2',targetMs:'1'});
 p.begin(1,true);p.active(true);n=1000;p.win();p.begin(2,true);assert.equal(p.challenge.targetMs,1);assert.equal(p.records.cleared,1);
 assert.ok(saves.every(r=>!('challenge'in r)));assert.equal(p.records.times[2],undefined);
});
test('normal two-chapter progression saves fastest completed run and wins are idempotent',()=>{
 let n=0,saves=0;const p=new PersonalRecords({load:R.emptyRecords,save:()=>{saves++;return true;}},()=>n,()=>100000);
 p.begin(1,true);p.active(true);n=1201;p.win();p.win();assert.equal(saves,2);assert.equal(p.records.cleared,1);assert.equal(p.records.times[1].ms,1201);
 p.begin(2,true);p.active(true);n+=555;p.win();assert.equal(p.records.cleared,2);assert.equal(p.records.times[2].ms,555);
 p.begin(1,true);p.active(true);n+=2400;p.win();assert.equal(p.records.times[1].ms,1201);assert.equal(p.result.best,false);
 p.begin(1,true);p.active(true);n+=999;p.win();assert.equal(p.records.times[1].ms,999);assert.equal(p.result.best,true);
});
test('direct preview, unearned chapter two and third chapter cannot contaminate persistent records',()=>{
 for(const [chapter,eligible]of [[1,false],[2,true],[2,false],[3,true]]){
  let n=0;const p=new PersonalRecords({load:R.emptyRecords,save:()=>{throw Error('must not save');}},()=>n);
  p.begin(chapter,eligible);p.active(true);n=1000;p.win();assert.deepEqual(p.records,R.emptyRecords());
 }
});
test('death/cancel cannot settle and a broken clock can record a clear but not a speed result',()=>{
 let n=5;const p=new PersonalRecords({load:R.emptyRecords,save:()=>true},()=>n);
 p.begin(1,true);p.active(true);n=100;p.cancel();p.win();assert.equal(p.records.cleared,0);
 p.begin(1,true);p.active(true);n=99;p.win();assert.equal(p.records.cleared,1);assert.equal(p.result.valid,false);assert.equal(p.records.times[1],undefined);
});
test('record validation rejects corrupt, old-version, nonfinite, negative and impossible progress values',()=>{
 for(const r of [null,{}, {...record(),rule:'old'},{...record(),reached:1},{...record(),cleared:-1}, {...record(),times:{1:null}}, {...record(),times:{1:{ms:0,run:'x',at:0}}}, {...record(),times:{2:{ms:NaN,run:'x',at:1}}}])assert.equal(R.validateRecords(r),undefined);
 assert.deepEqual(R.validateRecords(record()),record());assert.equal(R.formatTime(123456),'123.5 秒');assert.equal(R.formatTime(0),'暂无通关纪录');
});
test('cloud merge preserves higher progress and each independent minimum; codec is round-trip and byte-bounded',()=>{
 const merged=R.mergeRecords(record(1,1,10000,0),record(2,2,20000,15000));
 assert.deepEqual(merged,record(2,2,10000,15000));assert.deepEqual(R.fromCloud(R.cloudValues(merged)),merged);
 assert.equal(R.RECORD_KEYS.length,3);for(const kv of R.cloudValues(merged))assert.ok(Buffer.byteLength(kv.key+kv.value)<1024);
 const values=R.cloudValues(merged);values[1].value='corrupt';assert.equal(R.fromCloud(values).times[1],undefined);assert.equal(R.fromCloud(values).times[2].ms,15000);
});
test('progress ranking distinguishes reached versus cleared and never treats missing time as zero',()=>{
 const a=record(2,1,20000,0), b=record(1,1,10000,0), c=record(2,2,30000,10000);
 assert.ok(R.compareRecords(a,b,'progress')<0);assert.ok(R.compareRecords(c,a,'progress')<0);
 assert.ok(R.compareRecords(a,c,'level2')>0);assert.equal(R.compareRecords(a,b,'level2'),0);
});
test('two-slot local persistence recovers corrupt primary and reports quota failure without deleting history',()=>{
 const data=new Map(), api={get:k=>data.get(k),set:(k,v)=>data.set(k,v)};let s=new RecordStore(api);
 s.load();assert.ok(s.save(record(1,1,1000,0)));assert.ok(s.save(record()));data.set('breakout.records.r1','{broken');
 s=new RecordStore(api);assert.equal(s.load().times[1].ms,1000);api.set=()=>{throw Error('quota');};assert.equal(s.save(record()),false);
 assert.equal(new RecordStore(api).load().times[1].ms,1000);
});
test('cold/warm invitation parser rejects malformed values, retains old rules as display-only targets',()=>{
 const q={from:'challenge',sv:'1',rule:'r1',level:'2',targetMs:'123456'};assert.equal(parseInvite(q).targetMs,123456);
 for(const change of [{sv:'2'},{level:'3'},{level:'NaN'},{targetMs:'-1'},{targetMs:'Infinity'},{targetMs:'0'},{targetMs:'1e3'},{targetMs:4},{from:'debug'}])assert.equal(parseInvite({...q,...change}),undefined);
 assert.ok(parseInvite({...q,rule:'older'}).oldRule);assert.equal(parseInvite({sv:'1',from:'invite'}).kind,'invite');
});
test('sharing prepares bounded public challenge parameters with explicit artwork and no success callback',()=>{
 let card;const share=new ShareBridge(()=>true,()=>({shareAppMessage:c=>card=c}));share.configure('cover.jpg');share.prepare(2,123456);share.request();
 assert.equal(card.imageUrl,'cover.jpg');assert.equal(parseInvite(Object.fromEntries(new URLSearchParams(card.query))).targetMs,123456);
 assert.ok(!('success'in card));share.prepare(2,0);share.request();assert.equal(parseInvite(Object.fromEntries(new URLSearchParams(card.query))).kind,'progress');
});
function socialFixture({privacy=false,scope,upload=true}={}){
 const messages=[],invites=[],calls={authorize:0,settings:0,offShow:0,offPrivacy:0};let shown,need,privacyRequest,delayed;
 const api={getOpenDataContext:()=>({canvas:{},postMessage:m=>messages.push(copy(m))}),getPrivacySetting:o=>o.success({needAuthorization:privacy}),
 getSetting:o=>o.success({authSetting:scope===undefined?{}:{'scope.WxFriendInteraction':scope}}),
 requirePrivacyAuthorize:o=>{privacyRequest=o;need(data=>{if(data.event==='agree'){privacy=false;o.success({});}if(data.event==='disagree')o.fail({});});},
 onNeedPrivacyAuthorization:f=>need=f,offNeedPrivacyAuthorization:()=>calls.offPrivacy++,
 authorize:o=>{calls.authorize++;scope=true;o.success({});},openSetting:o=>{calls.settings++;scope=true;o.success({authSetting:{'scope.WxFriendInteraction':true}});},
 getLaunchOptionsSync:()=>({query:{from:'invite',sv:'1'}}),onShow:f=>shown=f,offShow:()=>calls.offShow++};
 const bridge=new SocialBridge(()=>true,()=>upload,()=>api);bridge.onInvite=i=>invites.push(i);bridge.install();
 return{bridge,api,messages,invites,calls,show:o=>shown(o),scope:v=>scope=v};
}
test('social consent is lazy; privacy and friend authorization are separate, reject keeps all records untouched',()=>{
 const f=socialFixture({privacy:true});assert.equal(f.messages.length,0);assert.equal(f.calls.authorize,0);
 f.bridge.show('progress');f.bridge.authorize();assert.equal(f.bridge.state,'privacy');f.bridge.agreePrivacy(false);assert.equal(f.calls.authorize,0);assert.equal(f.messages.length,0);
 f.bridge.authorize();f.bridge.agreePrivacy(true);assert.equal(f.calls.authorize,1);assert.equal(f.bridge.state,'ready');assert.ok(f.messages.some(m=>m.action==='show'));
});
test('explicit permission denial offers settings and a granted scope allows direct loading',()=>{
 const f=socialFixture({scope:false});f.bridge.show('level1');f.bridge.authorize();assert.equal(f.bridge.state,'denied');assert.equal(f.calls.authorize,0);
 f.bridge.authorize(true);assert.equal(f.calls.settings,1);assert.equal(f.bridge.state,'ready');
});
test('debug host never uploads scores; main messages contain no invented readiness/ack callbacks',()=>{
 const f=socialFixture({scope:true,upload:false});f.bridge.updateRecords(record());f.bridge.show('level2');f.bridge.authorize();
 assert.ok(f.messages.some(m=>m.action==='show'));assert.ok(f.messages.every(m=>m.action!=='records'));assert.ok(f.messages.every(m=>typeof m==='object'));
});
test('closing or destroying during asynchronous consent prevents stale upload and display',()=>{
 const f=socialFixture();let pending;f.api.getSetting=o=>pending=o;f.bridge.show('progress');f.bridge.authorize();f.bridge.hide();
 pending.success({authSetting:{'scope.WxFriendInteraction':true}});assert.ok(!f.messages.some(m=>m.action==='show'||m.action==='records'));
 f.bridge.destroy();assert.equal(f.calls.offShow,1);assert.equal(f.calls.offPrivacy,1);
});
test('invitation callbacks handle cold and warm entry once; return invalidates visible cached friend authorization',()=>{
 const f=socialFixture({scope:true});assert.equal(f.invites.length,1);f.show({query:{from:'invite',sv:'1'}});assert.equal(f.invites.length,1);
 f.show({query:{from:'challenge',sv:'1',rule:'r1',level:'1',targetMs:'1234'}});assert.equal(f.invites.length,2);
 f.bridge.show('progress');f.bridge.authorize();f.scope(false);f.show({});assert.equal(f.bridge.state,'idle');assert.equal(f.bridge.snapshot().allowed,false);
});
test('unsupported and misconfigured privacy APIs are recoverable personal-record states',()=>{
 const f=socialFixture();delete f.api.requirePrivacyAuthorize;f.bridge.show('progress');f.bridge.authorize();assert.equal(f.bridge.state,'unsupported');
 const g=socialFixture();g.api.getPrivacySetting=o=>o.fail({errno:112});g.bridge.show('progress');g.bridge.authorize();assert.equal(g.bridge.state,'error');assert.match(g.bridge.message,/配置/);
});
test('cloud writer reads before writing, merges old bests and serializes a better score arriving mid-write',()=>{
 const {createStore}=openModule('store');let read,write;const output=[];
 const s=createStore({getUserCloudStorage:o=>read=o,setUserCloudStorage:o=>{write=o;output.push(copy(o.KVDataList));}},()=>{});
 s.submit(record(1,1,10000,0));assert.equal(output.length,0);read.success({KVDataList:R.cloudValues(record(2,2,12000,8000))});
 assert.equal(R.fromCloud(output[0]).times[1].ms,10000);s.submit(record(2,2,9000,9000));assert.equal(output.length,1);
 write.success();read.success({KVDataList:output[0]});write.success();assert.equal(output.length,2);
 assert.equal(R.fromCloud(output[1]).times[1].ms,9000);assert.equal(R.fromCloud(output[1]).times[2].ms,8000);
});
test('failed cloud reads never cause blind writes and automatic retries are bounded',()=>{
 const {createStore}=openModule('store');let reads=0,writes=0;const timers=[];
 const s=createStore({getUserCloudStorage:o=>{reads++;o.fail({});},setUserCloudStorage:()=>writes++},()=>{},(fn,delay)=>{timers.push({fn,delay});return timers.length;},()=>{});
 s.submit(record());assert.equal(writes,0);for(let i=0;i<3;i++)timers[i].fn();assert.equal(reads,4);assert.equal(timers.length,3);assert.match(s.current().status,/失败/);
});
test('isolated renderer handles ties, missing results, pages and stale request callbacks without a reverse channel',()=>{
 const painted=[],requests=[];let listener;
 const context={clearRect:()=>painted.splice(0),fillRect(){},fillText:(s,x,y)=>painted.push({s,x,y}),drawImage(){}};
 const own=record(2,2,10000,20000), fixtures=Array.from({length:7},(_,i)=>({openid:'f'+i,nickname:'好友'+i,KVDataList:R.cloudValues(record(2,2,i<2?10000:20000+i*1000,30000))}));
 const api={getSharedCanvas:()=>({width:960,height:340,getContext:()=>context}),onMessage:f=>listener=f,
  createImage:()=>({width:0}),getUserInfo:o=>{assert.deepEqual(Array.from(o.openIdList),['selfOpenId']);o.success({data:[{openId:'me',nickName:'我'}]});},
  getUserCloudStorage:o=>o.success({KVDataList:R.cloudValues(own)}),getFriendCloudStorage:o=>requests.push(o)};
 openModule('index',{'./store.js':{createStore:()=>({submit(){}})},wx:api});
 const message=(action,extra={})=>listener({type:'social',rule:'r1',action,...extra});
 message('show',{board:'level1'});requests[0].success({data:fixtures});
 assert.equal(painted.filter(p=>p.x===34&&p.s==='1').length,4,'three tied first rows and own footer');
 assert.ok(painted.some(p=>p.s==='1 / 2 页 · 8 人'));message('page',{delta:1});assert.ok(painted.some(p=>p.s==='2 / 2 页 · 8 人'));
 message('show',{board:'level2'});message('hide');requests[1].success({data:fixtures});assert.equal(painted.length,0);
 message('show',{board:'progress'});requests[2].fail({});assert.ok(painted.some(p=>p.s.includes('读取失败')));
});
