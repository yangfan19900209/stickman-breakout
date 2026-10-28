# V0.5.3 资源与动作映射

直接裁切提供的四张图片，不生成新图。参考图只保存在 art/source/v053，未进入 assets/resources。原图按字节保存并记录 SHA256。

## 源文件与边缘

- `art/source/v053/卡通士兵动作精灵表.png`：1448×1086，RGBA，完全透明像素 740085，用途 runtime。
- `art/source/v053/黑白军用角色与坦克精灵图集.png`：1448×1086，RGBA，完全透明像素 841928，用途 runtime。
- `art/source/v053/卡通射击游戏特效与武器精灵图集.png`：1448×1086，RGBA，完全透明像素 760171，用途 runtime。
- `art/source/v053/黑白平台游戏环境精灵素材表.png`：1448×1086，RGBA，完全透明像素 817503，用途 runtime。
- `art/source/v053/黑白涂鸦战场_突击关卡.png`：1672×941，RGB，完全透明像素 0，用途 reference-only。

处理：透明度 ≤8 的微尘清零；人物按 alpha>128 的主体连通区域保留 2px 抗锯齿边缘，去掉相邻角色、标签和分离的内嵌枪火。黑色不作抠图色，白色身体填充保留。人物/环境转灰阶，独立武器特效保留原暖色。每帧不同裁切框使用源图脚底锚点，角色采用固定源像素比例（玩家0.64、普通敌人0.8），没有按每帧包围盒强制缩成同高。

## 主角 / 敌人动作序列

| 序列 | 帧数 | sprite IDs |
|---|---:|---|
| `player.idle` | 4 | `player.idle.0` ～ `player.idle.3` |
| `player.run` | 9 | `player.run.0` ～ `player.run.8` |
| `player.jump` | 4 | `player.jump.0` ～ `player.jump.3` |
| `player.fall` | 2 | `player.fall.0` ～ `player.fall.1` |
| `player.crouch` | 2 | `player.crouch.0` ～ `player.crouch.1` |
| `player.crouch-walk` | 6 | `player.crouch-walk.0` ～ `player.crouch-walk.5` |
| `player.stand-shoot` | 4 | `player.stand-shoot.0` ～ `player.stand-shoot.3` |
| `player.run-shoot` | 7 | `player.run-shoot.0` ～ `player.run-shoot.6` |
| `player.crouch-shoot` | 4 | `player.crouch-shoot.0` ～ `player.crouch-shoot.3` |
| `player.throw` | 5 | `player.throw.0` ～ `player.throw.4` |
| `player.hit` | 4 | `player.hit.0` ～ `player.hit.3` |
| `player.death` | 6 | `player.death.0` ～ `player.death.5` |
| `rifle.idle` | 2 | `rifle.idle.0` ～ `rifle.idle.1` |
| `rifle.walk` | 4 | `rifle.walk.0` ～ `rifle.walk.3` |
| `rifle.shoot` | 4 | `rifle.shoot.0` ～ `rifle.shoot.3` |
| `rifle.hit` | 3 | `rifle.hit.0` ～ `rifle.hit.2` |
| `rifle.dead` | 4 | `rifle.dead.0` ～ `rifle.dead.3` |
| `knife.walk` | 4 | `knife.walk.0` ～ `knife.walk.3` |
| `knife.attack` | 4 | `knife.attack.0` ～ `knife.attack.3` |
| `knife.hit` | 3 | `knife.hit.0` ～ `knife.hit.2` |
| `knife.dead` | 4 | `knife.dead.0` ～ `knife.dead.3` |
| `shield.walk` | 4 | `shield.walk.0` ～ `shield.walk.3` |
| `shield.brace` | 2 | `shield.brace.0` ～ `shield.brace.1` |
| `shield.shoot` | 3 | `shield.shoot.0` ～ `shield.shoot.2` |
| `shield.hit` | 3 | `shield.hit.0` ～ `shield.hit.2` |
| `shield.dead` | 4 | `shield.dead.0` ～ `shield.dead.3` |
| `rocket.idle` | 2 | `rocket.idle.0` ～ `rocket.idle.1` |
| `rocket.aim` | 2 | `rocket.aim.0` ～ `rocket.aim.1` |
| `rocket.fire` | 3 | `rocket.fire.0` ～ `rocket.fire.2` |
| `rocket.hit` | 3 | `rocket.hit.0` ～ `rocket.hit.2` |
| `rocket.dead` | 4 | `rocket.dead.0` ～ `rocket.dead.3` |
| `tank.explode` | 4 | `tank.explode.0` ～ `tank.explode.3` |
| `explosion` | 7 | `explosion.0` ～ `explosion.6` |

主角：Idle→idle，Run→run，Jump→jump，Fall→fall，Crouch→crouch，Crouch Walk→crouch-walk，Stand Shoot→stand-shoot，Run Shoot→run-shoot，Crouch Shoot→crouch-shoot，Grenade Throw→throw，Hit→hit，Death→death。蹲走同时开火使用蹲走腿部序列及独立枪火，避免静止蹲射帧冻结腿部。

原表标注 Run(8)、Run Shoot(6)，实际可辨识分别为9、7姿势，按实际切片接入。跳跃/下落源帧带有腾空/收腿姿势，不能当成新碰撞体；碰撞高度仍为原站立74/下蹲43。

敌人：ranged→rifle（idle、walk/Patrol、shoot、hit、dead）；melee→knife（walk/Run、attack、hit、dead）；shield→shield（walk、brace、shoot、hit、dead），盾破后换 rifle 轮廓；turret→rocket（idle、aim、fire、hit、dead），沿用原固定重火力行为、前摇和伤害；guard→tank，health比例≥65% idle、30–65% damaged、<30% heavy，开火fire，死亡explode.0–3后wreck。盾面镜像与原防御方向一致。

## 武器 / 特效 / 环境

| 用途 | sprite | 运行方式 |
|---|---|---|
| 步枪 / 霰弹 / 火箭筒 | weapon.rifle / shotgun / rocket | HUD 独立轮廓；特殊枪械按枪口挂接完整人物帧 |
| 步枪弹 | projectile.bullet | 64×12逻辑单位，含短弹体和速度线；速度1100 |
| 霰弹 | projectile.pellet | 六条独立轨迹，21×7；速度880，保留近距增伤 |
| 火箭 / 炮弹 | projectile.rocket | 宽96，完整弹身/尾翼/烟，火箭460；敌重火力260，坦克保持原抛物线 |
| 手雷 | projectile.grenade | 19×26，旋转、抛物线、原落地反弹与引信 |
| 枪火 | effect.muzzle / muzzle-large / smoke | 步枪48、霰弹84、火箭72；随当前枪口，不留在上次发射位置 |
| 人物 / 金属 / 木箱命中 | effect.impact / metal / wood | 原材质事件选择不同爆点；物理碎片仍独立运动 |
| 爆炸 | explosion.0–6 | 约70ms一帧，由小白热核心到大烟火；缩放、冲击波、碎片、0.1–0.85s延迟升烟及原有震屏 |
| 箱子 | crate.intact / broken / debris | HP受损图，死亡残片；实体碰撞立即移除 |
| 油桶 | barrel.intact / dented / broken | HP受损图、原短延迟连锁爆炸；销毁烟片过渡 |
| 路面 | ground.flat-a / flat-b / small | 清洁平顶点状块，沿实际缓坡铺设，不使用裂缝岩壁 |
| 浮台 / 木台 / 石台 | platform.metal / wood / stone / short | 当前关卡浮台主要用 metal，其他已切好供关卡装配 |
| 掩体 | cover.sandbags / concrete | 沿原尺寸碰撞；损坏专帧缺失，见下方 |
| 背景 | prop.tent / tower、building.*、background.cloud* / mountains | 三层视差、浅透明度；参考整图从未作为背景 |

## 全部独立切片

**player**：`player.idle.0`, `player.idle.1`, `player.idle.2`, `player.idle.3`, `player.run.0`, `player.run.1`, `player.run.2`, `player.run.3`, `player.run.4`, `player.run.5`, `player.run.6`, `player.run.7`, `player.run.8`, `player.jump.0`, `player.jump.1`, `player.jump.2`, `player.jump.3`, `player.fall.0`, `player.fall.1`, `player.crouch.0`, `player.crouch.1`, `player.crouch-walk.0`, `player.crouch-walk.1`, `player.crouch-walk.2`, `player.crouch-walk.3`, `player.crouch-walk.4`, `player.crouch-walk.5`, `player.stand-shoot.0`, `player.stand-shoot.1`, `player.stand-shoot.2`, `player.stand-shoot.3`, `player.run-shoot.0`, `player.run-shoot.1`, `player.run-shoot.2`, `player.run-shoot.3`, `player.run-shoot.4`, `player.run-shoot.5`, `player.run-shoot.6`, `player.crouch-shoot.0`, `player.crouch-shoot.1`, `player.crouch-shoot.2`, `player.crouch-shoot.3`, `player.throw.0`, `player.throw.1`, `player.throw.2`, `player.throw.3`, `player.throw.4`, `player.hit.0`, `player.hit.1`, `player.hit.2`, `player.hit.3`, `player.death.0`, `player.death.1`, `player.death.2`, `player.death.3`, `player.death.4`, `player.death.5`

**rifle**：`rifle.idle.0`, `rifle.idle.1`, `rifle.walk.0`, `rifle.walk.1`, `rifle.walk.2`, `rifle.walk.3`, `rifle.shoot.0`, `rifle.shoot.1`, `rifle.shoot.2`, `rifle.shoot.3`, `rifle.hit.0`, `rifle.hit.1`, `rifle.hit.2`, `rifle.dead.0`, `rifle.dead.1`, `rifle.dead.2`, `rifle.dead.3`

**knife**：`knife.walk.0`, `knife.walk.1`, `knife.walk.2`, `knife.walk.3`, `knife.attack.0`, `knife.attack.1`, `knife.attack.2`, `knife.attack.3`, `knife.hit.0`, `knife.hit.1`, `knife.hit.2`, `knife.dead.0`, `knife.dead.1`, `knife.dead.2`, `knife.dead.3`

**shield**：`shield.walk.0`, `shield.walk.1`, `shield.walk.2`, `shield.walk.3`, `shield.brace.0`, `shield.brace.1`, `shield.shoot.0`, `shield.shoot.1`, `shield.shoot.2`, `shield.hit.0`, `shield.hit.1`, `shield.hit.2`, `shield.dead.0`, `shield.dead.1`, `shield.dead.2`, `shield.dead.3`

**rocket**：`rocket.idle.0`, `rocket.idle.1`, `rocket.aim.0`, `rocket.aim.1`, `rocket.fire.0`, `rocket.fire.1`, `rocket.fire.2`, `rocket.hit.0`, `rocket.hit.1`, `rocket.hit.2`, `rocket.dead.0`, `rocket.dead.1`, `rocket.dead.2`, `rocket.dead.3`

**tank**：`tank.idle`, `tank.fire`, `tank.damaged`, `tank.heavy`, `tank.wreck`, `tank.explode.0`, `tank.explode.1`, `tank.explode.2`, `tank.explode.3`

**weapon**：`weapon.rifle`, `weapon.shotgun`, `weapon.rocket`

**projectile**：`projectile.grenade`, `projectile.bullet`, `projectile.pellet`, `projectile.rocket`

**pickup**：`pickup.grenades`, `pickup.health`

**effect**：`effect.muzzle`, `effect.muzzle-large`, `effect.smoke`, `effect.impact`, `effect.metal`, `effect.wood`, `effect.explosion`, `effect.trail`, `effect.dust`

**explosion**：`explosion.0`, `explosion.1`, `explosion.2`, `explosion.3`, `explosion.4`, `explosion.5`, `explosion.6`

**ground**：`ground.flat-a`, `ground.flat-b`, `ground.small`, `ground.slope`

**platform**：`platform.stone`, `platform.short`, `platform.metal`, `platform.wood`

**crate**：`crate.intact`, `crate.broken`, `crate.debris`

**barrel**：`barrel.intact`, `barrel.dented`, `barrel.broken`

**cover**：`cover.sandbags`, `cover.concrete`

**prop**：`prop.sign`, `prop.warning`, `prop.rocks`, `prop.tent`, `prop.tower`

**building**：`building.base`, `building.barracks`

**background**：`background.cloud`, `background.cloud-small`, `background.mountains`

## 当前缺口 / 临时实现

- 最终巨型步行 Boss 不在提供图集中，保留原 Graphics 实现；本轮第一屏和前两段不包含它。不能声称整关所有敌人已彻底替换。
- 没有完整向上瞄准、霰弹/火箭筒专用手臂帧。当前是整帧人物加大枪图覆盖原持枪区域；大角度时仍可能看出原步枪和手臂不完全对齐，列为待补，不声称已精修。
- 没有沙袋/混凝土的破坏专帧。沙袋死亡压低原沙袋外形并扬尘、混凝土仍用原材质火花；木箱仅完整/破损/碎裂三个真正独立阶段，worn兼容名称指向同一破损图。
- 源图动作头身比例、步幅不完全一致；未重新生成帧或用旧分段身体修补，仍有有限逐帧跳变。后续应由原素材补绘统一比例动作。
- 全局 atlas 已替换，但本轮主要截图/装配验收集中在第一屏及前两段；后段逐物体拼接尚未逐一人工验收。

复现：`python scripts/prepare-comic-v053.py`（Pillow、NumPy）→ `npm run meta` → Creator 构建。原V0.5资源留作历史，不进入新运行纹理。纹理为单张2048×2048；源文件/切片预览不打入微信包。
