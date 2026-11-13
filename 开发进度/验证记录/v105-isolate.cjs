const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const AdmZip=require('../../源码/node_modules/adm-zip');
const root=path.resolve(__dirname,'../..'),target=path.join(root,'历史归档/交付构建/1.0.5');
assert.ok(!fs.existsSync(target),'Never overwrite a fixed build workspace');fs.mkdirSync(target,{recursive:true});
const zip=new AdmZip(path.join(root,'历史归档/体验锚点/PRE-V105-OCEAN-20261113/source.zip'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),records=[];
for(const e of zip.getEntries()){
 if(e.isDirectory)continue;const dest=path.resolve(target,e.entryName);
 assert.ok(dest.startsWith(target+path.sep));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,e.getData());
}
function overlay(rel){const bytes=fs.readFileSync(path.join(root,rel)),dest=path.join(target,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);records.push({file:rel,sha256:hash(bytes)});}
for(const name of ['SwimNavigation','OceanFish','OceanSession','OceanCombatTuning','OceanRenderer','OceanPose','OceanFrames','OceanAssets','OceanUpdateFrames'])
 for(const suffix of ['.ts','.ts.meta'])overlay('源码/assets/scripts/ocean/'+name+suffix);
for(const f of ['ocean-v105.png','ocean-v105.png.meta'])overlay('源码/assets/level02/'+f);
for(const f of ['pack-ocean-v105.mjs','ocean-brain.cjs','verify-ocean-current.mjs','verify-v104-budget.mjs','build-cocos.ps1'])overlay('源码/scripts/'+f);
for(const f of ['v070-ocean.test.cjs','v073-ocean-combat.test.cjs','v0816-jump-ocean-parity.test.cjs','v0818-ocean-combat.test.cjs','v105-ocean-fixes.test.cjs'])overlay('源码/tests/'+f);
function tree(rel){for(const e of fs.readdirSync(path.join(root,rel),{withFileTypes:true})){const f=rel+'/'+e.name;if(e.isDirectory())tree(f);else overlay(f);}}
tree('素材/游戏美术/source/v105');tree('素材/游戏美术/slices/v105');overlay('素材/游戏美术/v105-manifest.json');
// The live OceanSession also contains the separately authorized revival task.
// Exclude that unfinished feature ONLY in this isolated release; never alter the live file.
const sessionPath=path.join(target,'源码/assets/scripts/ocean/OceanSession.ts');
let s=fs.readFileSync(sessionPath,'utf8').replaceAll('\r\n','\n');
for(const fragment of [
 'import { Revival, waterRevivePoint, padded } from "../core/Revival";\n',
 '  readonly revival = new Revival();\n  private reviveAnchor?: Vec;\n  private deathOrigin?: Vec;\n  private anchorTime = 0;\n',
 '    this.revival.reset(); this.reviveAnchor=undefined; this.deathOrigin=undefined; this.anchorTime=0;\n',
 '    if(this.state==="reviving") {\n      if(this.revival.advance(dt))this.state="playing";\n      return;\n    }\n',
 '      if(!this.deathOrigin)this.deathOrigin={x:p.x,y:p.y};\n',
 '    this.anchorTime-=dt;\n    if(this.anchorTime<=0){this.anchorTime=.2;this.reviveAnchor={x:p.x,y:p.y};}\n',
 '      revival: this.revival.snapshot(),\n'
]){assert.ok(s.includes(fragment),fragment);s=s.replace(fragment,'');}
const start=s.indexOf('  revive(): boolean {'),end=s.indexOf('  pause() {',start);assert.ok(start>0&&end>start);s=s.slice(0,start)+s.slice(end);
s=s.replace(' || this.state === "reviving"','');assert.ok(!/Reviv|reviv|deathOrigin|anchorTime/.test(s));fs.writeFileSync(sessionPath,s);
for(const f of ['package.json','package-lock.json']){const p=path.join(target,'源码',f),o=JSON.parse(fs.readFileSync(p));o.version='1.0.5';if(o.packages?.[''])o.packages[''].version='1.0.5';fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n');}
const release=path.join(target,'源码/assets/scripts/core/ReleaseConfig.ts');fs.writeFileSync(release,fs.readFileSync(release,'utf8').replace('"1.0.4"','"1.0.5"'));
const verification=path.join(target,'开发进度/验证记录');fs.mkdirSync(verification,{recursive:true});
fs.writeFileSync(path.join(verification,'isolation.json'),JSON.stringify({version:'1.0.5',createdAt:new Date().toISOString(),base:'PRE-V105-OCEAN-20261113',reason:'Concurrent 1.0.6 revival/chapter-select and recommendation work in the shared source/build directories. Live work was preserved; only this isolated release excludes those later features.',overlays:records,isolatedOceanSessionSHA256:hash(fs.readFileSync(sessionPath))},null,2));
console.log(JSON.stringify({target,baseEntries:zip.getEntryCount(),overlaidFiles:records.length}));
