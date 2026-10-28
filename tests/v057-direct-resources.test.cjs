const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),{PNG}=require('pngjs');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {DirectFrames,DirectClips,DirectSockets}=load('render/DirectFrames');
const {comicPose,comicMuzzle}=load('render/ComicPose');
const {comicEquipment}=load('render/ComicEquipment');
const base={animation:'Idle',animationTime:0,recoil:0,deadTime:0};

test('four supplied sheets are archived, all native cuts are source-sized and padded inside the real atlas',()=>{
 const m=JSON.parse(fs.readFileSync('art/v057-manifest.json'));
 const atlas=PNG.sync.read(fs.readFileSync('assets/resources/comic/native.png'));
 assert.equal(Object.keys(m.sources).length,4);assert.deepEqual([atlas.width,atlas.height],m.textureSize);
 for(const source of Object.values(m.sources)){
  assert.equal(source.sha256,crypto.createHash('sha256').update(fs.readFileSync(source.file)).digest('hex'));
  assert.deepEqual(source.size,[1448,1086]);assert.ok(source.transparentPixels>100000);
 }
 for(const f of m.frames){
  assert.deepEqual(DirectFrames[f.id].size,f.size);assert.deepEqual(f.size,f.sourceSize);
  const [x,y,w,h]=f.atlas;assert.ok(x>=4&&y>=4&&x+w+4<=atlas.width&&y+h+4<=atlas.height,f.id);
  // Four-pixel edge extrusion, not just a promise in metadata.
  for(let c=0;c<4;c++)for(let p=1;p<=4;p++){
   assert.equal(atlas.data[(y*atlas.width+x)*4+c],atlas.data[(y*atlas.width+x-p)*4+c]);
   assert.equal(atlas.data[(y*atlas.width+x)*4+c],atlas.data[((y-p)*atlas.width+x)*4+c]);
  }
 }
});

test('knife and rocket never use a rifle body, attachment or hand patch in supported actions',()=>{
 const states=[{}, {animation:'Run',vx:280,stride:.4}, {animation:'Jump',animationTime:.1},
  {animation:'Fall',animationTime:.3}, {crouched:true}, {crouched:true,vx:100,stride:.2},
  {recoil:1.9},{recoil:1.3,vx:280,stride:.5},{crouched:true,recoil:1.4},
  {animation:'Hit',hitTime:.17},{animation:'Dead',deadTime:.3}];
 for(const weaponId of ['knife','rocket'])for(const state of states){
  const e=comicEquipment({...base,...state,weaponId});
  assert.ok(e.body.startsWith(`direct.${weaponId}.`),JSON.stringify({weaponId,state,e}));
  assert.equal(e.weapon,null);assert.equal(e.grip,null);assert.equal(e.bakedRifle,false);assert.equal(e.bakedWeapon,weaponId);
 }
 for(const id of ['knife','rocket'])assert.ok(comicPose({...base,weaponId:id,throwTime:.2}).startsWith('player.throw.'));
});

test('each knife cut uses its own full painted combo, including contextual attacks made while carrying a gun',()=>{
 for(const [stage,count] of [[1,4],[2,4],[3,5]]){
  const seen=new Set();
  for(let i=0;i<100;i++){
   const e=comicEquipment({...base,weaponId:'rifle',meleeTime:.1,meleeStage:stage,meleeProgress:i/100,meleeStance:'stand'});
   assert.ok(e.body.startsWith(`direct.knife.combo${stage}.`));assert.equal(e.weapon,null);seen.add(e.body);
  }
  assert.equal(seen.size,count);
 }
 assert.equal(DirectClips['knife.run'].length,9);assert.equal(DirectClips['knife.crouch-walk'].length,7);
 assert.equal(DirectClips['knife.air-attack'].length,2);assert.equal(DirectClips['rocket.death'].length,5);
});

test('rocket fire excludes detached missile cells and both facing directions fire from its painted muzzle',()=>{
 const {WeaponSystem}=load('combat/WeaponSystem'),{ProjectileManager}=load('combat/ProjectileManager'),{ParticlePool}=load('combat/ParticlePool');
 for(const stance of [{},{crouched:true},{vx:280,animation:'Run'}])for(const facing of [-1,1]){
  const a={...base,...stance,x:100,y:150,facing,weaponId:'rocket'};
  const w=new WeaponSystem('rocket'),p=new ProjectileManager(new ParticlePool());
  const id=comicPose({...a,recoil:1.9});assert.ok(DirectSockets[id]);
  const tip=comicMuzzle({...a,recoil:1.9},0,9);assert.deepEqual([tip.x,tip.y],DirectSockets[id]);
  assert.equal(w.fire(a,p,'player'),true);const shot=p.items.find(b=>b.active);
  assert.equal(shot.x,100+tip.x*facing);assert.equal(shot.y,150+tip.y);
 }
 for(const action of ['stand-fire','run-fire','crouch-fire'])assert.equal(DirectClips['rocket.'+action].length,3);
});

test('every terrain plan uses only the new sheet, with native-scale end caps and fixed-size brackets',()=>{
 const {terrainTiles,metalTiles}=load('render/TerrainTiles');
 for(const width of [64,76,92,160,205,340,630,2640]){
  for(const t of [...terrainTiles(0,150,width,72),...metalTiles(0,262,width)])assert.ok(t.id.startsWith('native.'),t.id);
  const parts=metalTiles(0,262,width);assert.equal(parts.filter(t=>t.id==='native.metal.left').length,1);
  assert.equal(parts.filter(t=>t.id==='native.metal.right').length,1);
  assert.ok(parts.filter(t=>t.id==='native.metal.bracket').every(t=>t.crop[2]*t.scale===53));
 }
});

test('joined steps form one visible terrain envelope without buried top borders or collision mutations',()=>{
 const {terrainSurface}=load('render/TerrainSurface');
 const solids=[{x:0,y:0,w:600,h:150,kind:'ground'},
  {x:100,y:150,w:100,h:48,kind:'step'},{x:200,y:150,w:100,h:88,kind:'step'},
  {x:160,y:280,w:200,h:14,kind:'platform'}];
 const before=JSON.stringify(solids),spans=terrainSurface(solids);
 assert.deepEqual(spans,[{x:0,w:100,top:150},{x:100,w:100,top:198},{x:200,w:100,top:238},{x:300,w:300,top:150}]);
 assert.equal(JSON.stringify(solids),before);
});

test('new soil repeat boundaries pass through pale paper rather than severing a black outlined stone',()=>{
 const im=PNG.sync.read(fs.readFileSync('art/slices/v057/native.soil.png'));
 const edge=[];
 for(let x=0;x<im.width;x++){edge.push(x,(im.height-1)*im.width+x);}
 for(let y=0;y<im.height;y++){edge.push(y*im.width,y*im.width+im.width-1);}
 for(const p of edge){const k=p*4;assert.ok(im.data[k+3]===0||Math.min(im.data[k],im.data[k+1],im.data[k+2])>100,`stone cut at ${p}`);}
});
