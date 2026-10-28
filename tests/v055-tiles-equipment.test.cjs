const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
const load=p=>require('../.test-build/assets/scripts/'+p+'.js');
const {ComicFrames}=load('render/ComicFrames'),{comicEquipment}=load('render/ComicEquipment');
const {terrainTiles,metalTiles}=load('render/TerrainTiles');
const base={animation:'Idle',animationTime:0,recoil:0,deadTime:0};

test('new supplied terrain source is traceable and cuts remain inside both texture pages',()=>{
 const m=JSON.parse(fs.readFileSync('art/v055-manifest.json'));
 assert.equal(m.source.sha256,crypto.createHash('sha256').update(fs.readFileSync(m.source.file)).digest('hex'));
 assert.deepEqual(m.source.size,[1448,1086]);assert.equal(m.source.mode,'RGBA');assert.ok(m.source.transparentPixels>100000);
 for(const f of m.frames){const [x,y,w,h]=f.atlas;assert.ok(x>=0&&y>=0&&x+w<=2048&&y+h<=1024,f.id);assert.deepEqual(ComicFrames[f.id].anchor,f.anchor);}
});
test('terrain and platforms repeat at fixed scale, crop remainders, cover arbitrary solid widths without gaps',()=>{
 for(const width of [70,81,160,205,270,370,630,800,2640])for(const metal of [false,true]){
  const tiles=metal?metalTiles(123,150,width):terrainTiles(123,150,width,88);
  assert.ok(tiles.length>0);const scale=metal?.5:.6;
  for(const t of tiles){const size=ComicFrames[t.id].size,[cx,cy,w,h]=t.crop;
   assert.equal(t.scale,scale);assert.ok(cx>=-.001&&cy>=-.001&&w>0&&h>0&&cx+w<=size[0]+.001&&cy+h<=size[1]+.001,t.id);
   assert.ok(t.x>=123-.001&&t.x+w*scale<=123+width+.001);
  }
  // Beam interior or the dirt fill row: sample the whole width, including partial final tiles.
  const y=metal?140:110;
  for(let x=123+.01;x<123+width;x+=.5)assert.ok(tiles.some(t=>x>=t.x-.001&&x<=t.x+t.crop[2]*scale+.001&&y>=t.y&&y<=t.y+t.crop[3]*scale),`gap ${x}/${width}`);
 }
});
test('rocket uses complete native poses, shotgun uses gun-free bodies, returning to rifle restores its baked frame',()=>{
 const poses=[{}, {animation:'Run',vx:280,stride:.2},{animation:'Jump'}, {animation:'Fall'},
  {crouched:true},{crouched:true,vx:100,stride:.3},{recoil:1},{recoil:1,vx:280,stride:.5},{crouched:true,recoil:1},{animation:'Hit',hitTime:.22},{animation:'Hit',hitTime:.12}];
 for(const weaponId of ['rifle','shotgun','rocket'])for(const pose of poses){
  const a={...base,...pose,weaponId},e=comicEquipment(a);
  if(weaponId==='rifle')assert.equal(e.weapon,null);
  else if(weaponId==='rocket'){assert.equal(e.weapon,null);assert.equal(e.grip,null);assert.equal(e.bakedWeapon,'rocket');assert.ok(e.body.startsWith('direct.rocket.'));}
  else {assert.equal(e.weapon,'weapon.'+weaponId);assert.equal(e.bakedRifle,false);if(('unarmed.'+e.pose) in ComicFrames)assert.ok(e.body.startsWith('unarmed.'));}
 }
 assert.equal(comicEquipment({...base,aimPitch:Math.PI/2,weaponId:'rifle'}).bakedRifle,false);
 for(const special of [{animation:'Dead'}, {throwTime:.2}, {meleeTime:.2}])assert.equal(comicEquipment({...base,...special,weaponId:'rocket'}).weapon,null);
 const gun=comicEquipment({...base,weaponId:'rocket'});assert.ok(gun.body.startsWith('direct.rocket.'));
 const reset=comicEquipment({...base,weaponId:'rifle'});assert.equal(reset.body,'player.idle.0');assert.equal(reset.bakedRifle,true);
});
