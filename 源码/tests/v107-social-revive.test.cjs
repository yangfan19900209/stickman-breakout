const {test}=require('node:test'),assert=require('node:assert/strict');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {Revival}=load('core/Revival'),{GameSession}=load('core/GameSession'),{OceanSession}=load('ocean/OceanSession');
const {ShareBridge}=load('platform/ShareBridge'),{RecommendationBridge}=load('platform/RecommendationBridge');
const {PersonalRecords}=load('social/PersonalRecords'),{emptyRecords}=load('social/RunRecords');
const idle={axis:0,shoot:false,jump:false};
function die(s){s.player.health=0;for(let i=0;i<240&&s.state!=='gameover';i++)s.update(1/120,idle);assert.equal(s.state,'gameover');}

test('each chapter has one free life then unlimited individually earned share/recommendation lives',()=>{
 for(const s of [new GameSession(),new OceanSession()]){
  s.reset();s.finishEntry?.();die(s);assert.equal(s.revival.remaining,1);assert.ok(s.revive());s.update(1,idle);
  for(let i=0;i<20;i++){
   die(s);assert.equal(s.revive(),false);const award=s.revival.reward(i%2?'recommendation':'share');
   assert.equal(award(false),false);assert.equal(s.revival.remaining,0);assert.equal(award(true),true);assert.equal(award(true),false);
   assert.equal(s.revival.remaining,1);const kills=s.snapshot().kills;assert.ok(s.revive());assert.equal(s.revival.remaining,0);
   assert.equal(s.player.health,5);assert.equal(s.snapshot().kills,kills);assert.equal(award(true),false);s.update(1,idle);
  }
  assert.equal(s.revival.used,21);assert.equal(s.revival.shared,10);assert.equal(s.revival.recommended,10);
  s.reset();assert.equal(s.revival.remaining,1);assert.equal(s.revival.used,0);assert.equal(s.revival.shared+s.revival.recommended,0);
 }
});
test('credits cannot stack, be saved before the free life, or leak across deaths and resets',()=>{
 const r=new Revival();const early=r.reward('share');assert.equal(early(true),false);r.begin();assert.equal(early(true),false);
 const a=r.reward('share'),b=r.reward('recommendation');assert.ok(a(true));assert.equal(b(true),false);r.begin();assert.equal(b(true),false);
 const stale=r.reward('share');r.reset();r.begin();assert.equal(stale(true),false);assert.equal(r.remaining,0);
 assert.equal(r.shared+r.recommended,0);assert.ok(r.reward('recommendation')(true));
});
test('a paid credit survives a missing safe revive position without changing battle state',()=>{
 const s=new GameSession();s.reset();die(s);s.revive();s.update(1,idle);die(s);s.revival.reward('share')(true);
 s.level.solids.length=0;const used=s.revival.used,x=s.player.x;assert.equal(s.revive(),false);
 assert.equal(s.revival.remaining,1);assert.equal(s.revival.used,used);assert.equal(s.player.x,x);assert.equal(s.player.health,0);
});
test('only a callable successful share request grants; no API, disabled, throw and destroyed do not',()=>{
 for(const mode of ['missing','disabled','throw','destroyed','requested','fallback']){
  let calls=0;const api=mode==='missing'?{}:{shareAppMessage:o=>{calls++;if(mode==='throw'||(mode==='fallback'&&o.imageUrl.startsWith('wxfile:')))throw Error('unavailable');}};
  const bridge=new ShareBridge(()=>mode!=='disabled',()=>api);if(mode==='destroyed')bridge.destroy();if(mode==='fallback')bridge.configure('wxfile:old');
  const r=new Revival();r.begin();const issued=bridge.request();r.reward('share')(issued);
  assert.equal(issued,['requested','fallback'].includes(mode));assert.equal(r.remaining,issued?1:0);assert.equal(calls,mode==='fallback'?2:mode==='requested'||mode==='throw'?1:0);
 }
});
test('cancelled ordinary shares still grant by request; onShow and menu cards do not manufacture credits',()=>{
 let menu;const r=new Revival();r.begin();const bridge=new ShareBridge(()=>true,()=>({shareAppMessage(){},showShareMenu(){},onShareAppMessage:f=>menu=f}));bridge.install();
 menu();assert.equal(r.remaining,0);const grant=r.reward('share');assert.ok(grant(bridge.request()));assert.equal(r.shared,1);assert.equal(grant(true),false);
});
function recommendation(options={}){
 const all=[],bridge=new RecommendationBridge(()=>true,()=>({getAppBaseInfo:()=>({SDKVersion:options.old?'3.8.5':'3.8.6'}),createPageManager(){
  const listeners={},old={};const entry={emit:(e,v)=>listeners[e]?.(v),late:(e,v)=>old[e]?.(v)};all.push(entry);
  return{on(e,f){listeners[e]=old[e]=f},off(e){delete listeners[e]},load(){return Promise.resolve()},show(){if(options.fail)throw Error('show');return Promise.resolve()},destroy(){listeners.destroy?.({isRecommended:true})}};
 }}),{set(){return 1},clear(){}});return{bridge,all,get current(){return all.at(-1)}};
}
test('recommendation observes strict booleans, accepts already-recommended state, issues once and can repeat next death',()=>{
 const h=recommendation(),r=new Revival();r.begin();
 for(const value of [false,undefined,'true',1]){
  const grant=r.reward('recommendation');h.bridge.request('revival',v=>grant(v===true));h.current.emit('show');h.current.emit('destroy',{isRecommended:value});assert.equal(r.remaining,0);
 }
 for(let i=0;i<3;i++){
  const grant=r.reward('recommendation');h.bridge.request('revival',v=>grant(v===true));const entry=h.current;
  entry.emit('show');assert.equal(r.remaining,0);h.bridge.setBackground(true);h.bridge.setBackground(false);assert.equal(r.remaining,0);
  entry.emit('destroy',{isRecommended:true});assert.equal(r.remaining,1);entry.late('destroy',{isRecommended:true});assert.equal(r.recommended,i+1);r.begin();
 }
 assert.equal(h.bridge.snapshot().source,'revival');
});
test('recommendation failure, cleanup, unsupported and late result after new attempt grant nothing',()=>{
 for(const mode of ['fail','old','cancel','disposed','reset']){
  const h=recommendation({[mode]:true}),r=new Revival();r.begin();const grant=r.reward('recommendation');h.bridge.request('revival',v=>grant(v===true));
  if(mode==='cancel')h.bridge.dismiss();if(mode==='disposed')h.bridge.destroy();if(mode==='reset'){r.reset();r.begin();}
  h.current?.late('destroy',{isRecommended:true});assert.equal(r.remaining,0,mode);assert.equal(r.recommended,0);
 }
});
test('multiple revivals preserve achieved progress while excluding all fastest times; a fresh chapter restores eligibility',()=>{
 let now=0;const p=new PersonalRecords({load:emptyRecords,save:()=>true},()=>now);p.begin(1,true);p.active(true);now=1000;
 for(let i=0;i<5;i++){p.active(false);p.markRevived();now+=10000;p.active(true);now+=1000;}
 p.win();assert.equal(p.result.reason,'revived');assert.equal(p.result.ms,6000);assert.equal(p.records.cleared,1);assert.equal(p.records.times[1],undefined);
 p.begin(2,true);p.active(true);now+=2000;p.win();assert.equal(p.result.valid,true);assert.equal(p.records.times[2].ms,2000);
});
