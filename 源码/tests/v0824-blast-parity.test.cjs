const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../.test-build/assets/scripts');
test('boss missiles, artillery and player rockets render the same colored blast frames at every phase',()=>{
 const file='render/ComicCombatArt',exports={};
 vm.runInNewContext(fs.readFileSync(path.join(root,file+'.js'),'utf8'),{exports,require:p=>p==='cc'?{Color:class{},UITransform:'size'}:p==='./Ink'?{}:p==='./ComicAssets'?{ComicAssets:{enabled:true}}:require(path.resolve(root,path.dirname(file),p))});
 const art=new exports.ComicCombatArt(),records=[];art.batch={put(id,...args){records.push({id,args});}};
 for(const age of [0,.08,.15,.24,.33,.42,.5,.6,.8]){
  const drawings=[];
  for(const style of ['rocket','cannon','boss']){records.length=0;art.blast({x:300,y:180,radius:90,age,style,owner:style==='rocket'?'player':'enemy'},0);drawings.push(JSON.stringify(records));assert.ok(records.every(r=>!r.id.startsWith('mech.blast')&&r.id!=='mech.smoke'));}
  assert.equal(drawings[0],drawings[1]);assert.equal(drawings[0],drawings[2]);
 }
});
