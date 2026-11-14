const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),load=p=>require(path.join(root,'源码/.test-build/assets/scripts',p+'.js'));
const {AbandonedBase:L}=load('level/LevelData'),{OceanLevel:O}=load('ocean/OceanLevel');
const {GameSession}=load('core/GameSession'),{OceanSession}=load('ocean/OceanSession');
const {EnemyController}=load('enemy/EnemyController'),{GameConfig:C}=load('core/GameConfig');
const {oceanRangedRest}=load('ocean/OceanCombatTuning');
const version=JSON.parse(fs.readFileSync(path.join(root,'源码/package.json'),'utf8')).version;
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'inventory.json'),'utf8'));
const land=new GameSession(),sea=new OceanSession();
const miniHP=land.spawner.miniBoss.maxHealth,bossHP=land.spawner.guard.maxHealth,ammo=C.weapons.rocket.ammo,summary=data.summary;
const landPlaces={
 'entry-crate':'起点往右走，第一只小木箱', 'crate-01':'开局地面，第一组油桶之前',
 'barrel-01':'开局第一个近战兵身旁，第一组油桶的左桶','barrel-02':'同一组油桶的右桶，后面接地面步枪兵',
 'upper-crate-A':'第一块低平台上，平台步枪兵右侧','crate-02':'第一段路末尾，高平台下方的地面',
 'sandbags-01':'进入工业区时，地面上的第一道沙袋','hanging-01':'工业区入口，地面步枪兵后方的悬挂箱',
 'barrel-03':'工业区第二块低平台之前的地面','crate-03':'工业区第二块低平台之后、高平台左侧的地面',
 'concrete-B':'工业区第一座吊桥的左侧地面','bridge-B':'工业区中段，射断绳索可落下的第一座桥',
 'bridge-rope':'第一座吊桥上方的绳索','sandbags-B':'第一座吊桥后，小平台之后的地面',
 'cargo-B':'工业区末尾，沙袋后的空中悬挂箱','after-industry':'工业区末尾，炮筒敌人之后、进入机械阵地之前',
 'concrete-C':'机械阵地入口的地面石墩','upper-crate-C':'机械阵地第一块低平台上，藏在高处的木箱',
 'before-tank':'高处隐藏箱之后、前方高平台之前的地面空隙；在近战兵之前、火箭箱之后，尚未进入坦克激活范围',
 'rocket-before-tank':'机械阵地入口石墩之后、盾兵之前的地面；拿到后还要打盾兵、新炮筒、近战兵和步枪兵，再到坦克',
 'barrel-C1':'坦克场地中间高平台下方，坦克初始位置左侧的第一桶','barrel-C2':'紧接第一桶右侧，距离坦克初始位置更近的一桶',
 'after-tank':'坦克实际被击败的位置；会随战斗移动而改变，不固定在出生点',
 'cargo-C':'坦克场地右侧出口，右侧低平台之后的空中',
 'grenades-E':'击败坦克后，运输栈道入口的地面，下一组敌人之前',
 'sandbag-E1':'运输栈道第一块低平台之后、高平台之前的地面',
 'barrel-E1':'运输栈道高平台下方，冲锋兵附近的地面',
 'upper-crate-E':'运输栈道后半段的低平台上，隐藏木箱',
 'sandbag-E2':'运输栈道后半段低平台之后的地面','after-freight':'运输栈道末尾，最后一个地面步枪兵之后',
 'upper-crate-F':'封锁哨线入口的低平台上，平台步枪兵左侧',
 'sandbag-F':'封锁哨线第一块低平台后，高平台左侧的地面',
 'barrel-F':'封锁哨线高平台下方，盾兵前方',
 'bridge-F':'封锁哨线中段，第二座可以射断绳索放下的桥','bridge-rope-F':'第二座吊桥上方的绳索',
 'concrete-F':'第二座吊桥之后，炮筒敌人之前的地面',
 'crate-F':'封锁哨线炮筒之后，最后一个步枪兵之前的地面','after-blockade':'封锁哨线末尾，最后一个步枪兵之后、维修长廊之前',
 'concrete-G':'维修长廊入口，第一名盾兵之前','barrel-G1':'维修长廊第一块低平台之后、高平台之前的地面',
 'crate-G':'维修长廊中段高平台右端下方的地面','sandbag-G':'维修长廊中后段，第二名盾兵之前的地面',
 'barrel-G2':'维修长廊最后一块低平台之后，炮筒敌人之前',
 'grenades-before-final':'维修长廊末尾，最后一个炮筒之后的第一箱','before-colossus':'大 Boss 前补给区，手雷箱之后、火箭箱之前',
 'rocket-before-colossus':'大 Boss 战场入口前，血包点之后的最后一箱',
 'arena-sandbag':'大 Boss 决战区中后段，中间高平台下方的地面','arena-barrel':'大 Boss 决战区后半段，沙袋右侧、最后一块低平台之前'
};
const landEnemyPlaces={
 m1:'起步后第一组油桶附近的地面',r1:'第一组油桶之后的地面',r2:'第一块低平台上',m2:'第一块低平台之后、高平台之前的地面',
 r3:'工业区入口，第一道沙袋之后',m3:'工业区第二块低平台之后，地面木箱之前',r4:'工业区第二块低平台上',m4:'工业区高平台下方的地面',r5:'第一座吊桥下方的地面',
 'shield-B':'工业区高平台下方，近战兵身旁','turret-B':'工业区末尾，悬挂箱之后、血包点之前',
 'shield-C':'机械阵地入口石墩之后','charge-C':'小 Boss 前新血包点之后，高平台左侧的地面','rifle-C1':'小 Boss 前高平台下方，血包与近战兵之后',
 'turret-C':'机械阵地第一块低平台右端下方的地面，隐藏木箱下方、血包点之前',
 'turret-E':'运输栈道中段高平台下方，油桶和冲锋兵之后、盾兵之前',
 'turret-F0':'封锁哨线入口第一块低平台左端下方，与平台上的步枪兵形成高低层攻击',
 'outpost-tank':'机械阵地后半段，两层平台之间；新油桶在其初始位置左侧',
 'rifle-E0':'运输栈道入口，手雷箱之后','rifle-E1':'运输栈道第一块低平台上','charge-E1':'运输栈道高平台下方，油桶附近','shield-E':'运输栈道第二块低平台之前的地面','rifle-E2':'运输栈道第二块低平台上','rifle-E3':'运输栈道末尾的地面，血包点之前',
 'charge-F0':'封锁哨线入口，第一块低平台之前','rifle-F1':'封锁哨线第一块低平台上','shield-F':'封锁哨线高平台末端，油桶之后的地面','charge-F':'第二座吊桥下方的地面','turret-F':'第二座吊桥之后、地面木箱之前','rifle-F2':'封锁哨线末尾，地面木箱之后、维修长廊之前',
 'shield-G1':'维修长廊入口石墩之后','rifle-G1':'维修长廊第一块低平台上','charge-G1':'维修长廊中段高平台下方','shield-G2':'维修长廊后半段，最后一块低平台之前','rifle-G2':'维修长廊最后一块低平台上','turret-G':'维修长廊末尾，最后一个油桶之后、手雷箱之前',
 'gate-colossus':'终点前的独立决战场地，前面有连续三组高低平台'
};
const seaEnemyPlaces=[
 '浅海训练中层，第一根石柱之前','第一根石柱之后，上方悬岩之前的中层',
 '水草暗礁入口，悬顶岩石之后的中上层','第一片珊瑚台之前的中下层','第一片珊瑚台顶上','珊瑚台之后的中层','水草暗礁后半段、悬顶岩石之前的中下层','悬顶岩石右侧的中上层','悬顶岩石下面的海床',
 '第一块横向沉船甲板上，鱼雷箱左侧','沉船甲板右端下方的水域','沉船甲板右侧开阔水域的中上层','小潜艇前开阔水域的中下层','小潜艇前开阔水域的中层','沉船前哨后半段的开阔水域，可从上下两侧绕行',
 '小潜艇之后，深水断层第一根石柱之前','深水断层第一根石柱之后的上层','顺向水流中的中层','顺向水流末端的中下层','悬顶岩石下面的海床','悬顶岩石之后、第二根石柱之前的中层','第二根石柱之后的中层','逆向水流附近的上层',
 '潜艇防线入口，拐角管道顶端','拐角管道之后的中层','防线前段，上方横向沉船甲板之前','上方横向沉船甲板下面的中层','上方横向沉船甲板右侧的上层','两段管道之间的中上层','防线后半段，直管顶部','直管右侧的中上层',
 '海沟入口，第一片珊瑚台之前的上层','海沟第一片珊瑚台之后的中层','海沟悬顶岩石下面的中下层','海沟悬顶岩石之后的水域','海沟最后一根石柱上方','海沟后半段、最后一根石柱附近的海床',
 '船坞入口，第一块横向甲板左侧的中下层','船坞第一块横向甲板上','第一块甲板之后、残墙之前的中层','残墙右侧的上层','残墙之后、水下手雷箱附近的下层','船坞最后一块高处甲板下方','船坞最后一块高处甲板右侧的上层'
];
seaEnemyPlaces[4]='第一片珊瑚台上方的中层水域，可上下追游';
seaEnemyPlaces[8]='水草暗礁末尾，悬顶岩石下方的中层水域';
seaEnemyPlaces[19]='深水断层中段，悬顶岩石下方的中层水域';
seaEnemyPlaces[36]='海沟后半段，顺向水流中、最后一根石柱之前的中下层';
seaEnemyPlaces[9]='沉船前哨第一块横向甲板上，进入前已能拿到鱼雷箱';
const seaPlaces={
 'ambient-kelp-0':'水草暗礁第一片珊瑚台顶面',
 'ambient-kelp-1':'水草暗礁末尾悬顶岩石下面的海床',
 'ambient-kelp-2':'深水断层悬顶岩石下面的海床',
 'ambient-kelp-3':'海沟后半段，最后一根石柱之前的海床',
 'shore-equipment-chest':'悬崖边，开场角色自动打开的装备箱',
 'sea-crate-0':'刚下水后的浅海海床，第一名潜水兵之前',
 'sea-crate-1':'水草暗礁中段海床，第一片珊瑚台之后',
 'sea-crate-2':'水草暗礁末尾、沉船前哨入口之前的海床，最后一名声波潜水兵之后；拿到后经过甲板炮筒、鱼叉兵、鱼雷兵、声波兵和掠食鱼，再打小潜艇',
 'sea-crate-3':'击败小潜艇后，深水断层入口的海床，第一根石柱之前',
 'sea-crate-4':'潜艇防线前段，拐角管道之后、第一颗锚雷右下方的海床',
 'sea-crate-5':'潜艇防线末段，直管和后面的炮筒之后、海沟入口之前的海床',
 'sea-crate-6':'海沟中段，上方悬垂岩石之后、海底水草之前的海床',
 'sea-crate-7':'船坞后半段，残墙之后、低处锚雷附近的海床',
 'sea-crate-8':'大潜艇战场入口前，战前整备区最下方的海床，与血包点相邻',
 'kelp-rest':'水草暗礁末尾，上方悬岩之后、第一块沉船甲板之前',
 'captain-prep':'沉船前哨第一块横向甲板的右端；炮筒之后、小潜艇激活范围之前，低血量时可以先领取',
 'abyss-rest':'深水断层末尾，第二根石柱之后、逆向水流末端',
 'defense-rest':'潜艇防线结束、海沟入口处','trench-rest':'海沟末尾，最后一根石柱之后、进入船坞之前',
 'sub-prep':'最后一组潜水兵之后、大潜艇战场入口前，鱼雷箱左侧',
 'sea-14-recovery':'小潜艇实际击败位置的左侧；满血也会掉落，不固定在出生点',
 'sea-14-torpedo':'小潜艇实际击败位置的左侧，靠近血包奖励',
};
// Runtime crate IDs change when a crate is removed; landmarks follow authored positions.
const crateLandmarks=Object.fromEntries([1180,3270,4190,6440,9100,10600,11980,14040,15000].map((x,i)=>[x,seaPlaces['sea-crate-'+i]]));
for(const key of Object.keys(seaPlaces))if(key.startsWith('sea-crate-'))delete seaPlaces[key];
for(const c of sea.crates)seaPlaces[c.id]=crateLandmarks[c.x];
for(const e of sea.enemies){if(!seaPlaces[e.id])seaPlaces[e.id]=seaEnemyPlaces[Number(e.id.slice(4))];}
for(const r of data.land)assert.ok(landPlaces[r.id],r.id);
for(const r of data.ocean)assert.ok(seaPlaces[r.id],r.id);
for(const e of L.enemies)assert.ok(landEnemyPlaces[e.id],e.id);
assert.equal(seaEnemyPlaces.length,sea.enemies.length);
const kindName=e=>e.encounter==='mini'?'小 Boss：铁犀巡逻车':e.encounter==='final'?'大 Boss：裁决者':({melee:'近战冲锋兵',ranged:'步枪兵',shield:'盾兵',turret:'炮筒敌人'})[e.kind];
const seaName=e=>e.kind==='diver'?(e.shielded?'盾牌潜水兵':({harpoon:'鱼叉潜水兵',sonar:'声波潜水兵',torpedo:'火箭／鱼雷潜水兵'})[e.role]):({fish:'掠食鱼',jellyfish:'水母',turret:'海底炮筒',mine:'锚雷',captain:'小 Boss：铁壳号'})[e.kind];
const getZone=(zones,x)=>zones.find(z=>x>=z.start&&x<z.end)?.name;
const enemies1=L.enemies.map(e=>({...e,name:kindName(e),hp:e.encounter==='mini'?land.spawner.miniBoss.maxHealth:e.encounter==='final'?land.spawner.guard.maxHealth:new EnemyController(e).maxHealth,place:landEnemyPlaces[e.id],zone:getZone(L.zones,e.x)}));
const enemies2=sea.enemies.map(e=>({...e,name:seaName(e),hp:e.maxHp,place:seaEnemyPlaces[Number(e.id.slice(4))],zone:getZone(O.zones,e.x)}));
enemies2.push({id:'submarine',name:'大 Boss：巨型潜艇',kind:'boss',hp:sea.boss.maxHp,x:sea.boss.x,zone:'巨型潜艇',place:'战前整备区之后，最后一片独立水域'});
assert.equal(enemies1.length,37);assert.equal(enemies2.length,45);
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const safe=s=>String(s).replaceAll('|','／');
const sections=[];
function title(t){sections.push({t});}
function para(t){sections.push({p:t});}
function table(head,rows){sections.push({head,rows});}
title('两关配置说明：按实际路线查看');
para('2026年11月14日1.0.8正式交付版。下面按从左到右的游玩顺序描述位置，不需要记坐标。敌人位置指初始布置，进入战斗后会巡逻、追击或换高度。道具数量按每局上限统计，条件血包不保证全部出现。');
table(['关卡','固定普通敌人','Boss','其他目标／增援','大小 Boss 血量'],[
 ['第一关：废弃前哨站','35：近战9、步枪14、盾兵6、炮筒6','2个','大 Boss 只召唤一批2名增援',`小 Boss ${miniHP}；大 Boss ${bossHP}`],
 ['第二关：深海突围','40：普通潜水兵18、盾牌潜水兵4、掠食鱼10、水母4、炮筒4','2个','另外3颗锚雷；大 Boss 只召唤一批2名增援',`小 Boss ${sea.mini.maxHp}；大 Boss ${sea.boss.maxHp}`]]);
para('第一关固定敌人合计37，算上增援最多39。第二关固定可击破目标45个：敌人／Boss 42个、锚雷3个；加上增援后最多47个可击破目标。四处水草已变成纯装饰，不计入敌人，也不会锁定、受伤或攻击。');
title('Boss 血量、位置和战斗规则');
table(['Boss','血量','出现在哪里','主要攻击与阶段','周围补给'],[
 ['第一关小 Boss：铁犀巡逻车',miniHP,'机械阵地后半段，双层平台区域，约在全关四成处','落点炮击、锁线双发、蓄力冲撞、扇形散射，并会追赶和跳台。半血35及以下进入第二阶段。','先拿提前的火箭箱，打盾兵和炮筒，再经过血包与步枪／近战兵；坦克左侧有2桶。击败后掉1个血包。'],
 ['第一关大 Boss：裁决者',bossHP,'维修长廊之后，终点前独立决战场','重炮、连射、踏地、激光、肩部导弹、扇形机炮、冲撞与跳跃。60及以下进入第二阶段。只召唤一批2名增援。','进场前依次是手雷箱、血包点、火箭箱。场内有沙袋1道和油桶1个。半血不再发额外火箭。'],
 ['第二关小 Boss：铁壳号',sea.mini.maxHp,'沉船前哨后半段的开阔水域，约在全关三分之一处','鱼雷、移动声波齐射、斜向俯冲、扇形声波、冲刺，共5种。低于35血时部分攻击加强。','沉船前哨入口前的海床有8发鱼雷箱，箱后还有一波普通敌人；前方甲板右端有条件血包，可在激活小 Boss 之前领取。战后鱼雷已合并到这个战前箱，击败后只掉1个血包。'],
 ['第二关大 Boss：巨型潜艇',sea.boss.maxHp,'战前整备区之后的最后一片水域','鱼雷、定向激光、扇形声波、直线激光扫射、炮弹，共5种；已去掉向外扩散的扇形圆弧。140至高于98为一阶段，98至高于49为二阶段，49及以下为三阶段。','进场前有8发鱼雷箱和条件血包，位于下方海床附近。']]);
para('巨型潜艇有3个可拆部件：鱼雷装置32血、激光装置30血、炮台36血。打部件同时扣本体血，不能把部件血量再加到第二关大 Boss 的140上。拆掉部件后，对应攻击停用；全部武装摧毁后仅剩船体移动，不会恢复被移除的圆弧攻击。');
para('两关大 Boss 各只召唤一批2名增援，开战约10秒后出现；若提前击败 Boss，可能来不及召唤。第一关为1名步枪兵、1名近战兵，各3血，在 Boss 左侧出现。第二关为1名鱼叉潜水兵、1名声波潜水兵，各3血，在潜艇侧面的上下水层出现，先停顿、再完整预警开枪，不掉补给。击败增援或 Boss 换阶段都不会补召。');
para('第二关大 Boss 的扇形声波改为每轮3枚、每招2轮，轮间0.75秒；两轮沿相同三条弹道发射，相邻弹道约27.5度，不再错位填满间隙。招式结束后的休息按阶段从0.65／0.50／0.40秒缩短到0.35／0.28／0.22秒。定向攻击仍预警1秒，激光扫射仍预警1.25秒。');
title('每种普通敌人多少血');
table(['关卡','类型','数量','每个血量','说明'],[
 ['第一关','近战冲锋兵',9,3,'地面追赶、近战攻击'],['第一关','步枪兵',14,3,'分布在地面和平台上'],['第一关','盾兵',6,5,'盾牌正面耐久3已包含在总血量5内，不是额外3血'],['第一关','炮筒敌人',6,3,'工业区1、机械阵地1、运输栈道1、封锁哨线2、维修长廊1；本轮新增机械阵地、运输栈道和封锁入口各1个'],
 ['第二关','普通鱼叉潜水兵',6,3,'不掉特殊武器'],['第二关','声波潜水兵',8,3,'仍使用声波攻击，击败不掉声波枪'],['第二关','火箭／鱼雷潜水兵',4,3,'不再掉鱼雷或其他补给'],['第二关','盾牌潜水兵',4,5,'使用鱼叉。护盾2已包含在总血量5内'],['第二关','掠食鱼',10,3,'游动速度150、扑咬速度740；在820范围内开始追击，560范围内能发动扑咬。预警0.60秒、后半段锁定；扑咬行程与距离配套，恢复1秒。可侧向躲避，实体岩壁能挡住'],['第二关','水母',4,3,'游动追近 → 收缩预警0.85秒 → 向锁定方向移动突刺 → 至少休息1.4秒。碰中掉1格；预警时不伤人，锁定后可侧移躲开。两只在水草暗礁，一只在深水断层，一只在海沟'],['第二关','海底炮筒',4,3,'现在发射3个方向的追踪火箭，不再发鱼叉'],['第二关','锚雷',3,2,'危险物，另算，不纳入普通敌人40个']]);
title('两关补给总数');
table(['补给类型','第一关','第二关'],[
 ['火箭／鱼雷固定箱',`${summary.land.rocketCrates}箱，每箱火箭弹补至${ammo}发`,`${summary.ocean.torpedoCrates}箱，每箱给${ammo}发鱼雷`],
 ['声波固定箱','没有',`${summary.ocean.sonarCrates}箱，每箱24发；全关仅这两处获取`],
 ['手雷固定箱','2箱，每箱+2','2箱，每箱水下手雷+2'],
 ['低血量恢复点',`${summary.land.conditionalHealth}处，每处最多1个血包`,`${summary.ocean.conditionalHealth}处，每处最多1个血包`],
 ['小 Boss 击杀血包','1个，必掉','1个，必掉'],
 ['普通敌人武器掉落','没有','没有；4名鱼雷潜水兵已全部取消掉落'],
 ['小 Boss 额外武器','没有','战后鱼雷已前置，合并到沉船前哨入口前的8发鱼雷箱，战后不再掉落'],
 ['全关最多可生成的补给件数',`${summary.land.maxSupplyItems}件：4个箱内补给+5个血包`,`${summary.ocean.maxSupplyItems}件：7个箱内补给+5个血包`]]);
para('两关初始都是5格生命、3枚手雷，手雷最多6枚。每个血包恢复2格，最多恢复到5格。第一关基础步枪、第二关基础鱼叉均为无限弹药，也都能用刀。箱子破坏后才出补给，不能把箱子和箱内同一份补给重复相加。');
para('条件血包只有生命剩3格或更少、接近该点、附近没有未拾取血包时才生成，每局每点最多一次。第一关落到实际地面或平台；第二关先出现在玩家附近高度，再缓慢下沉到支撑面。小 Boss 击杀血包不受低血量条件限制，满血时也会留下。');
para('声波枪仅在第二关两处获取：刚下水后的浅海海床、第一名潜水兵之前；潜艇防线前段、拐角管道之后、第一颗锚雷右下方的海床。每箱24发，携带上限24发。');
para(`火箭／鱼雷携带上限统一为${ammo}发。第一关火箭箱补齐${ammo}发；第二关只由三个固定鱼雷箱提供，每箱均给${ammo}发，超过上限的部分不保留。小 Boss 战前只有一箱8发鱼雷，不重复叠加原战后奖励。`);
title('玩家与敌人的伤害规则');
table(['攻击类型','玩家打普通敌人','玩家打大小 Boss','Boss／普通敌人打玩家'],[
 ['普通子弹／鱼叉','每次1血',`每次${C.playerBossDamage.bullet}血`,'每次1血'],
 ['声波','每次2血',`每次${C.playerBossDamage.sonar}血`,'每次1血'],
 ['火箭／鱼雷','命中或爆炸范围内直接斩杀',`每次${C.playerBossDamage.rocket}血，爆炸边缘也不衰减`,`每次${C.projectileDamage.enemyRocket}血`],
 ['近战刀','命中直接斩杀，盾兵也适用','沿用原刀伤：第一关普通刀／前两刀4血，第三刀7血；第二关小 Boss 4血、大 Boss 3血','沿用原近战伤害1血']]);
para('子弹每次命中只结算一次。声波可穿透多个目标，对每个目标按其类型结算；潜艇部件受击会同时扣本体相同血量，不再额外重复扣血。油桶、手雷、激光和碰撞攻击按原规则。');
title('第二关普通敌人的开枪节奏');
table(['敌人武器','每轮发射','下一轮如何开始','休息'],[
 ['鱼叉枪','1枚鱼叉','换高度／重新瞄准，完成0.70秒预警后发射','轮间休息'+oceanRangedRest.betweenAttacks+'秒'],
 ['声波枪','1枚声波弹；每枚仍是三个侧面重叠、依次放大的圆圈','换高度／重新瞄准，完成0.85秒预警后发射','轮间休息'+oceanRangedRest.betweenAttacks+'秒'],
 ['鱼雷潜水兵','1枚追踪鱼雷','重新瞄准，完成1.05秒预警后发射','轮间休息'+oceanRangedRest.betweenAttacks+'秒'],
 ['海底炮筒','3个方向各1枚追踪鱼雷','重新瞄准，完成1.05秒预警后发射','轮间休息'+oceanRangedRest.betweenAttacks+'秒']]);
para(`浅海训练每组1轮，中段每组2轮，后段每组3轮。整组结束后休息至少${oceanRangedRest.afterSequence}秒，之后再重新预警。鱼叉与声波每轮都只有一枚，没有自动补第二发，也没有同时散射。不同方向来自轮次之间的换位和重新瞄准，锁定后仍给玩家躲避时间。`);
para('鱼叉相邻两轮实际开枪间隔约2.72秒，声波约2.87秒（包含发射动作收尾、轮间休息和下一轮预警）；遮挡、换位、攻击名额限制可能让间隔更长。玩家鱼叉从每0.30秒一发放慢到0.36秒，声波从0.36秒放慢到0.43秒，鱼雷从0.68秒放慢到0.80秒。弹速、伤害和弹药数量不因此变化。小 Boss 移动声波轮间0.40秒、鱼雷轮间0.46秒；大 Boss 鱼雷／炮弹轮间0.50秒、扇形声波轮间0.75秒。');
para('普通潜水兵的游动和换位加快；360范围内识别真实来弹，至少反应0.10秒，再尝试侧向或斜向闪避。一次闪避约90距离、持续0.30秒，冷却1.6—1.8秒；用完整身体检查路线，不能穿墙或在闪避中无敌，锁定后的预警和攻击也不能被闪避取消。掠食鱼单独加快游动与扑咬、扩大追击和出招距离，不沿用枪械射速。');
title('血包位置集中看');
table(['关卡','血包','能看懂的位置','什么时候出现'],[
 ...data.land.filter(r=>r.type==='血包').map((r,i)=>['第一关',`第${i+1}处`,landPlaces[r.id],r.mode==='击杀掉落'?'击败小 Boss 必掉':'剩3格血或更少时靠近生成']),
 ...data.ocean.filter(r=>r.type==='血包').map((r,i)=>['第二关',`第${i+1}处`,seaPlaces[r.id],r.mode==='击杀掉落'?'击败小 Boss 必掉':'剩3格血或更少时靠近生成'])]);
para('第一关小 Boss 前的顺序现在是：入口石墩 → 地面火箭箱 → 盾兵 → 低平台和新炮筒 → 地面血包 → 近战／步枪兵 → 坦克战。血包仍保证位于坦克激活范围之前；火箭箱已前移，箱后留出一波敌人供弹药消耗，不会暗扣玩家弹药。第二关小 Boss 血包已从交战水域提前到第一块沉船甲板右端；低血量时先领取，再进入小潜艇激活范围。');
const objectHealth=r=>r.mode==='纯装饰'?'无血量／无碰撞／无攻击':r.id.startsWith('sea-crate')?'箱体3血':r.type==='油桶'?'3血；可连锁爆炸':r.type==='沙袋'?'6血':r.type==='混凝土障碍'?'不可破坏':r.type==='绳索'?'2血':r.type==='吊桥'?'射断上方绳索放下':r.type==='悬挂箱'?'吊挂阶段2血，落下后1血':r.type.startsWith('木箱')?'箱体3血':r.type==='锚雷'?'2血；可引爆':r.mode==='击杀掉落'?'击杀后出现':r.mode==='低血量触发'?'按需出现，最多一次':'开场过场';
for(const [chapter,zones,rows,enemies,places,width]of[[1,L.zones,data.land,enemies1,landPlaces,L.width],[2,O.zones,data.ocean,enemies2,seaPlaces,O.width]]){
 title(`第${chapter}关逐段明细`);
 para(chapter===1?'全关40件场景物件：14只地面／平台木箱、3只悬挂箱、10个油桶、7道沙袋、4个混凝土障碍、2根绳索；另有2座吊桥。17只木箱中4只是补给箱，13只是空箱，其中2只藏在高处。':'全关7个战斗补给箱，另有开场装备箱1个、锚雷3个、保留的装饰水草4处。礁石、甲板、残墙和水流是地形，不算可领取道具。');
 for(const [i,z]of zones.entries()){
  title(`${chapter}-${i+1} ${z.name}（进度约${Math.round(z.start/width*100)}%—${Math.round(z.end/width*100)}%）`);
  const es=enemies.filter(e=>e.zone===z.name).sort((a,b)=>a.x-b.x),items=rows.filter(r=>r.zone===z.name);
  const count={};for(const e of es)count[e.name]=(count[e.name]??0)+1;
  para(es.length?`这一段：${es.length}个可击破目标。${Object.entries(count).map(([name,n])=>`${name}${n}个`).join('，')}。`:'这一段没有固定战斗敌人。');
  if(chapter===1&&z.id==='E')para('此段及后面的封锁哨线、维修长廊敌人，要等坦克被击败后才进入场景，不会提前加入小 Boss 战。');
  if(es.length)table(['顺序','敌人','血量','位置'],es.map((e,j)=>[j+1,e.name,e.hp,e.place]));
  if(items.length)table(['顺序','道具／物件','数量','位置','补给效果','耐久／触发'],items.map((r,j)=>[j+1,r.type,r.qty,places[r.id],r.effect,objectHealth(r)]));
  else para('本段没有固定补给箱或恢复点。');
 }
}
title('本轮已经调整的地方');
para('本轮调整第二关普通敌人的开枪节奏：声波从同时三向散射改为每轮一枚，鱼叉取消自动第二发，每轮只发一枚。轮间休息从0.6秒延长到1.4秒，整组攻击后的休息从至少1.05秒延长到至少2.0秒。每轮重新预警和瞄准，潜水兵换高度形成不同方向。');
para('两关小 Boss 改为70血，第一关大 Boss 保持120血、第二关大 Boss 提高到140血；各只召唤2名增援；火箭／鱼雷保持8发，小 Boss 前补给均前移，箱后留出一波敌人。第一关新增3个炮筒。第二关大 Boss 去掉扩散扇形圆弧、调疏声波弹道并缩短招式休息；小 Boss 血包提前到战前甲板。第二关4个水草敌人改为装饰，并新增4只移动攻击水母；4名普通鱼雷潜水兵全部取消掉落，鱼雷仅由3个固定箱提供。声波仍仅在浅海训练和潜艇防线两处获取，指定三个血包点保持移除。');
title('当前验证范围');
para('1.0.8已重新通过610项逻辑回归、10项Mac工具链检查、类型检查、Web与微信构建。浏览器正常键盘输入完整通关：第一关109.72秒、剩1格血，第二关129.62秒、剩3格血。正式目录与ZIP已经逐文件核对；手机触摸、微信实机、真实广告和实际难度体感尚未验收。');
para('内容来自本轮已构建的关卡运行数据、敌人生成器、战斗配置和拾取逻辑。盾牌耐久与潜艇部件血量已按实际扣血规则说明，避免重复加血量。');
const dir=path.join(root,'开发计划/关卡/道具清单');fs.mkdirSync(dir,{recursive:true});
const md=sections.map(s=>s.t?`## ${s.t}`:s.p?s.p:`| ${s.head.join(' | ')} |\n| ${s.head.map(()=>'---').join(' | ')} |\n${s.rows.map(row=>`| ${row.map(safe).join(' | ')} |`).join('\n')}`).join('\n\n')+'\n';
fs.writeFileSync(path.join(dir,'两关配置说明-20261114.md'),md);
let num=0;const nav=[],html=sections.map(s=>{
 if(s.t){const id='section-'+(++num);if(!/^\d-\d/.test(s.t))nav.push(`<a href="#${id}">${escape(s.t)}</a>`);return `<h2 id="${id}">${escape(s.t)}</h2>`;}
 if(s.p)return `<p>${escape(s.p)}</p>`;
 return `<div class="table-wrap"><table><thead><tr>${s.head.map(t=>`<th>${escape(t)}</th>`).join('')}</tr></thead><tbody>${s.rows.map(row=>`<tr>${row.map((c,i)=>`<td data-label="${escape(s.head[i])}"${typeof c==='number'?' class="num"':''}>${escape(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}).join('\n');
fs.writeFileSync(path.join(dir,'两关配置说明-20261114.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>线条突围 · 两关配置说明</title><style>
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f4f1e9;color:#252a30;font:16px/1.8 system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}header{padding:30px max(24px,calc((100vw - 1180px)/2));background:#25333a;color:#fff}header small{color:#cfb88a;letter-spacing:.12em}h1{font-size:28px;line-height:1.4;margin:6px 0}header p{margin:8px 0 0;color:#dce2e3}nav{position:sticky;top:0;background:#fffef9;border-bottom:1px solid #dcd8ce;display:flex;gap:16px;padding:12px 24px;overflow-x:auto;z-index:2}nav a{white-space:nowrap;font-size:14px;color:#45545a;text-decoration:none}main{max-width:1240px;margin:auto;padding:24px 30px 80px}h2{font-size:22px;margin:50px 0 14px;padding-top:8px;border-top:2px solid #cdbd9c;scroll-margin-top:70px}h2:first-child{margin-top:0}p{max-width:1080px;margin:14px 0;color:#45515a}.table-wrap{overflow:auto;margin:16px 0 26px;border:1px solid #d8d5cc;border-radius:8px;background:white}table{border-collapse:collapse;width:100%;min-width:720px;font-size:14px;line-height:1.7}th{text-align:left;background:#33444c;color:white;padding:12px 14px;white-space:nowrap}td{vertical-align:top;padding:12px 14px;border-bottom:1px solid #e5e4df;min-width:70px}tbody tr:nth-child(even){background:#f8f8f4}td.num{text-align:center;font-variant-numeric:tabular-nums;font-weight:650}tr:last-child td{border:0}td:first-child{min-width:55px}footer{max-width:1180px;margin:0 auto;padding:20px 0;color:#788285;font-size:13px}@media(max-width:700px){main{padding:16px}h1{font-size:23px}h2{font-size:20px}header{padding:22px 16px}}@media print{body{background:white;font-size:11pt}header{color:#222;background:white;padding:0}nav{display:none}main{max-width:none;padding:0}h2{break-after:avoid;scroll-margin-top:0}table{min-width:0;font-size:9pt}th{color:#222;background:#eee}tr{break-inside:avoid}.table-wrap{overflow:visible}header p{color:#555}}
@media screen and (max-width:700px){.table-wrap{overflow:visible}table{min-width:0}table,tbody,tr,td{display:block}thead{display:none}tbody tr{padding:10px 0;border-bottom:2px solid #d9d6ca}td,td.num{display:grid;grid-template-columns:86px 1fr;gap:12px;text-align:left;padding:6px 12px;border:0;font-weight:400}td::before{content:attr(data-label);font-weight:600;color:#58646c}tr:last-child{border:0}}
</style><header><small>线条突围 · 正式交付版 ${version}</small><h1>两关配置说明</h1><p>按路线找位置。敌人数量、血量、Boss与全部道具放在一起查看。</p></header><nav>${nav.join('')}</nav><main>${html}</main><footer>2026-11-14 · 当前本地配置快照</footer></html>`);
fs.writeFileSync(path.join(__dirname,'guide-data.json'),JSON.stringify({enemies1,enemies2,landPlaces,seaPlaces,sections},null,2));
console.log(JSON.stringify({landEnemies:enemies1.length,oceanTargets:enemies2.length,landItems:data.land.length,oceanItems:data.ocean.length,sections:sections.filter(s=>s.t).length,files:[path.join(dir,'两关配置说明-20261114.md'),path.join(dir,'两关配置说明-20261114.html')]}));
