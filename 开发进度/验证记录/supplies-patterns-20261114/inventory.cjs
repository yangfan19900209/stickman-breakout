const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../源码'),load=p=>require(path.join(root,'.test-build/assets/scripts',p+'.js'));
const {AbandonedBase:L}=load('level/LevelData'),{OceanLevel:O}=load('ocean/OceanLevel');
const {OceanSession}=load('ocean/OceanSession'),{GameSession}=load('core/GameSession');
const {GameConfig:C}=load('core/GameConfig'),{OceanEntry}=load('ocean/OceanEntry');
const {overlaps}=load('core/Types');
const zone=(zones,x)=>zones.find(z=>x>=z.start&&x<z.end)?.name??'战斗位置';
const names={wood:'木箱',barrel:'油桶',hanging:'悬挂箱',sandbag:'沙袋',concrete:'混凝土障碍',rope:'绳索'};
const row=(id,type,x,y,qty,effect,mode,note,source)=>({id,type,x,y,qty,effect,mode,note,source});
const first=L.objects.map(o=>row(o.id,names[o.kind]+(o.drop==='rocket'?'·火箭筒':o.drop==='grenades'?'·手雷':''),o.x,o.y,1,
 o.drop==='rocket'?`火箭弹补至至少 ${C.weapons.rocket.ammo} 发`:o.drop==='grenades'?'手雷 +2（上限 6）':'无补给',
 '固定物件',o.kind==='barrel'?'爆炸半径 155，伤害 7，能连锁引爆':o.kind==='rope'?`射断后放下 ${o.link}`:o.kind==='hanging'?'先射落，再破坏。空箱':o.drop?'破坏后必掉 1 件补给，箱子和掉落不重复计件':o.hidden?'隐藏箱，当前没有设置掉落':o.kind==='concrete'?'不可破坏':o.kind==='wood'?'空箱，当前没有设置掉落':'可破坏，无补给','LevelData.objects'));
for(const p of L.recoveryPoints)first.push(row(p.id,'血包',p.x,p.y,1,'生命 +2（上限 5）','低血量触发',
 '生命不高于 3，水平距离≤220、高差≤180，且玩家 900 范围内无存留血包时生成一次。初生 Y=锚点Y+10','LevelData.recoveryPoints / PickupSystem'));
const tank=L.enemies.find(e=>e.encounter==='mini');
first.push(row('after-tank','血包',tank.x,tank.y,1,'生命 +2（上限 5）','击杀掉落','X/Y 为 Boss 出生参考点。实际在击杀点 (BossX, BossY+10) 生成一次，满血也掉落','GameSession / PickupSystem'));
for(const m of L.mechanisms)first.push(row(m.id,'吊桥',m.x,m.y,1,'无补给','机关',`射断 ${m.ropeId} 后下降。宽 ${m.w}，高 ${m.h}，底边 Y 从 ${m.maxY} 降到 ${m.minY}`,'LevelData.mechanisms'));
const sea=new OceanSession();sea.finishEntry();
for(let n=0;n<240;n++)sea.updateSupplies(1/120);
const second=sea.crates.map((c,i)=>row(c.id,c.drop==='torpedo'?'补给箱·鱼雷火箭':c.drop==='sonar'?'补给箱·声波':'补给箱·水下手雷',c.x,c.y,1,
 c.drop==='torpedo'?'鱼雷弹 +8（上限 8）':c.drop==='sonar'?'声波弹 +24（上限 24）':'水下手雷 +2（上限 6）','固定物件',
 `箱底落稳 Y=${c.y}，配置初始 Y=${O.crates[i].y}。破坏后必掉 1 件补给，初生 Y=箱底+20`,'OceanLevel.crates / OceanSession'));
for(const p of O.recovery)second.push(row(p.id,'血包',p.x,'随玩家高度',1,'生命 +2（上限 5）','低血量触发',
 '生命≤3、水平距离<180、该点 550 范围内没有存留血包时生成一次。初生Y=max(100,玩家脚底Y−10)','OceanLevel.recovery / OceanSession'));
for(const e of sea.enemies){
 if(e.kind==='diver'&&(e.role==='sonar'||e.role==='torpedo'))second.push(row(e.id,e.role==='sonar'?'声波补给':'鱼雷火箭补给',e.x,e.y,1,
  e.role==='sonar'?'声波弹 +12（上限 24）':'鱼雷弹 +4（上限 8）','击杀掉落','X/Y 为携带敌人的出生点。实际在敌人死亡点 (X,Y+30) 掉落一次','OceanLevel.enemies / OceanSession.damageEnemy'));
 if(e.kind==='captain'){
  second.push(row(e.id+'-recovery','血包',e.x,e.y,1,'生命 +2（上限 5）','击杀掉落','X/Y 为小 Boss 出生参考点。实际在击杀点 (BossX−140, BossY+30) 掉落，满血也生成','OceanSession.damageEnemy'));
  second.push(row(e.id+'-torpedo','鱼雷火箭补给',e.x,e.y,1,'鱼雷弹 +4（上限 8）','击杀掉落','X/Y 为小 Boss 出生参考点。实际在击杀点 (BossX−70, BossY) 掉落，内部来源 ID 为 '+e.id,'OceanSession.damageEnemy'));
 }
 if(e.kind==='mine')second.push(row(e.id,'锚雷',e.x,e.y,1,'无补给','环境危险物','按敌人逻辑管理。被破坏可引爆，接近玩家也会触发，无道具掉落','OceanLevel.enemies'));
}
second.push(row('shore-equipment-chest','岸边装备箱',OceanEntry.chestX,720,1,'潜水面罩与气瓶','过场物件','开场自动取装备，不消耗背包资源，不计入战斗补给','OceanEntry / OceanRenderer'));
for(const [rows,zones]of[[first,L.zones],[second,O.zones]]){rows.sort((a,b)=>a.x-b.x||a.id.localeCompare(b.id));for(const r of rows)r.zone=zone(zones,r.x);assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);}
// Isolated gameplay verification. These are not a browser or device playthrough.
const session=new GameSession();session.reset();
const boss=session.spawner.miniBoss,bars=session.level.objects.objects.filter(o=>/^barrel-C[12]$/.test(o.id));
assert.equal(bars.length,2);const blasts=[];
for(const o of bars){assert.ok(!overlaps(o.bounds,boss.bounds));
 const x=o.x+o.w/2,y=o.y+o.h/2,r=boss.bounds;
 const distance=Math.hypot(x-Math.max(r.x,Math.min(x,r.x+r.w)),y-Math.max(r.y,Math.min(y,r.y+r.h)));
 assert.ok(distance<155);blasts.push({id:o.id,x:o.x,y:o.y,distanceToHull:distance});
}
assert.ok(Math.abs(bars[0].x-bars[1].x)<155);
boss.active=true;const initialHP=boss.health;bars[0].takeDamage(3,1);session.level.objects.flushHits();
for(let i=0;i<35;i++){session.explosions.advance(1/120);session.explosions.flush((...args)=>session.applyBlast(...args));session.level.objects.flushHits();}
assert.ok(bars.every(o=>!o.alive));assert.ok(boss.health<initialHP);
const hpSession=new GameSession();hpSession.reset();const p=hpSession.player,point=L.recoveryPoints.find(p=>p.id==='before-tank');
Object.assign(p,{x:point.x-210,y:point.y,health:3,grounded:true});
let healedAt=null,maxX=p.x;
for(let i=0;i<240;i++){hpSession.update(1/120,{axis:1,jump:false,shoot:false});maxX=Math.max(maxX,p.x);
 assert.equal(hpSession.spawner.miniBoss.active,false,'the tank must stay dormant before the heal');
 if(p.health===5){healedAt={x:p.x,y:p.y,time:hpSession.time};break;}}
assert.ok(healedAt,'health pickup must be collected through actual movement');
assert.ok(healedAt.x<tank.x-900);
const verification={kind:'isolated-gameplay',barrels:blasts,chainDamage:initialHP-boss.health,healedAt,bossActivationX:tank.x-900};
const summary={land:{objects:L.objects.length,wood:14,hanging:3,barrels:10,sandbags:7,concrete:4,ropes:2,bridges:2,rocketCrates:2,grenadeCrates:2,conditionalHealth:5,miniHealth:1,maxSupplyItems:10},
 ocean:{supplyCrates:9,sonarCrates:4,torpedoCrates:3,grenadeCrates:2,conditionalHealth:6,miniHealth:1,sonarEnemyDrops:8,torpedoEnemyDrops:4,miniTorpedo:1,mines:3,entryChest:1,maxSupplyItems:29}};
assert.equal(first.length,48);assert.equal(second.length,33);
assert.equal(L.objects.filter(o=>o.drop).length,4);assert.equal(second.filter(r=>r.mode==='击杀掉落').length,14);
const result={generatedAt:new Date().toISOString(),summary,land:first,ocean:second,verification,
 loadout:{land:{health:C.player.maxHealth,grenades:C.grenade.initial,gun:'无限步枪和战术刀'},ocean:{health:5,grenades:3,gun:'无限鱼叉和潜水刀'}}};
fs.writeFileSync(path.join(__dirname,'inventory.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({summary,verification},null,2));
