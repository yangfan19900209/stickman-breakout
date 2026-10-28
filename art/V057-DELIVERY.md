# V0.5.7 完整原图武器动作 / 新地形

日期：2026-10-20。继续修改当前 Cocos Creator 3.8.8 工程。

## 炮口修正补丁

保留完整原画炮筒方向。向上输入改为**先从可见炮口出膛，再转向上方**（90°约0.12秒），不是把水平炮管图片当成已抬向上方。出膛阶段逐步露出原火箭鼻部，避免长弹体伸到角色下方；炮口烟雾方向与炮管一致，尾喷位置同步到炮管后端，蹲姿也使用低位后端。火箭随后沿用原追踪逻辑，伤害/弹药/射速不变，近墙与平台仍能阻挡。

新增 `RocketPresentation.ts` 与炮管轴线/出膛转向；修改 `WeaponSystem`、`ProjectileManager`、`DirectPose`、`ComicCombatArt`、`ComicAssets`。没有再拼接身体或重画角色。

验证：109项逻辑测试、5项相关浏览器用例（4项集成首次通过，专用炮口检查调整到无遮挡位置后复测通过）；左右朝向的实际绘制烟雾点与本次发射点一致。Web和微信包重新构建。本补丁未重跑下文41项整套浏览器基线，未重跑浏览器整关，未测微信真机。

[补丁报告](../reports/v057-muzzle-verification.json) · [向右出膛](../reports/v057-up-rocket-right.png) · [向右上飞行](../reports/v057-up-rocket-right-flight.png) · [向左出膛](../reports/v057-up-rocket-left.png) · [向左上飞行](../reports/v057-up-rocket-left-flight.png)。下文为资源替换基线的记录。

## 使用的资源

直接归档本次4张附件，没有生成新资源。均为1448×1086 RGBA，带真实透明背景。

| 附件标识前缀 | 归档文件 | 零透明度像素数 | 用途 |
| --- | --- | ---: | --- |
| 50116073 | source/v057/持刀士兵动作.png | 1,009,236 | 53张完整刀动作 |
| eacbeb82 | source/v057/火箭筒士兵动作.png | 990,341 | 43张完整火箭筒动作 |
| add2a958 | source/v057/漫画地形模块.png | 792,341 | 顶边、断面、底边、土层和预留装饰 |
| 4651bee8 | source/v057/金属平台模块.png | 848,465 | 梁端、中段、支架、预留柱体 |

[全部112个切片预览](v057-preview.html) · [每帧裁切/锚点/枪口/来源SHA256](v057-manifest.json)。原始RGBA切片在 `art/slices/v057`，运行图集 `assets/resources/comic/native.png` 为2048×1024，4px边缘挤出、8px间隔、无mipmap；保留线性抗锯齿并在运行时Clamp。索引压缩不改变几何比例，原切片可无损重新导出。

边缘检查：清理极低alpha散点和相邻单元裁切残片，不重画人物/武器。源图帧数以可见身体为准：刀跑动9帧、蹲走7帧、空中刀2帧；火箭射击每行3个身体，另一个单元是独立导弹；火箭死亡5个身体。

## 人物动作映射

| 状态 | 刀 | 火箭筒 |
| --- | --- | --- |
| Idle | knife.idle，4帧 | rocket.idle，4帧 |
| Run | knife.run，9帧 | rocket.run，6帧 |
| Jump / Fall | 4 / 2帧 | 4 / 2帧 |
| Crouch / Crouch Walk | 2 / 7帧 | 2 / 4帧 |
| 普攻 | combo1→combo2→combo3，4/4/5帧 | stand-fire / run-fire / crouch-fire，各3帧 |
| 空中刀 | air-attack，2帧 | 近身自动出刀时切完整刀动作 |
| 蹲斩 | 低姿持刀/蹲走帧暂代，仍使用低位扇形判定 | 同左 |
| Hit / Death | 4 / 6帧 | 4 / 5帧 |
| Grenade Throw | 沿用先前原图完整投掷帧 | 同左 |

所有新角色帧使用同一0.84世界比例；脚底与身体根位置单独标注，不按每帧边框中心摇摆。人物左右翻转沿用原逻辑。火箭枪口由源图标记，不再额外添加外挂枪的长度；独立导弹不随身体重复绘制。新图的Aim 3帧已裁入图集，但缺少真正向上的瞄准姿势，不冒充俯仰动画。

## 武器与地图修复

- 原因：旧版用去枪步枪动作挂接刀/火箭筒，姿势和遮罩无法适配。现在完整动作只画一层人物；不画旧枪、替换枪、手掌补片或第二层刀光。刀弧直接使用新图中绘制的弧线。原扇形命中、三连击、前冲、命中停顿、伤害/击退仍保留。
- 切换检查完整动作缓存后才改装备；没有“先清空、再加载”。HUD、角色和弹药继续共用 `WeaponSystem` / `WeaponPresentation`。
- 地面端头/中段/断面/底边按原比例拼接，余宽只裁切。土层使用新原图白底完整石子区域，不用旧的镜像周期纹理；底边避开半个石子造成的重复C形边缘。
- 相连地面与台阶先求可见轮廓，不在实体内部重复草皮/底边；碰撞仍使用原关卡矩形，没有修改通行高度、掉落和敌人站位。
- 金属梁采用新图左端/中段/右端，0.5固定比例；支架固定53世界单位宽，独立铺设，铆钉和支架不被横向拉长。
- 未增加背景复杂度、未修改敌人血量/攻击频率、未更改Boss激活或撤退规则。

## 核心文件

`scripts/prepare-comic-v057.py`、`DirectFrames.ts`、`DirectPose.ts`、`ComicFrames.ts`、`ComicAssets.ts`、`ComicEquipment.ts`、`ComicActorArt.ts`、`ComicPose.ts`、`TerrainSurface.ts`、`TerrainTiles.ts`、`ComicLevelRenderer.ts`、`CombatRenderer.ts`、`WeaponSystem.ts`、`GameManager.ts`。

## 截图与验证

最终浏览器回归结果写入 `reports/v057-verification.json`，当前汇总亦在 `reports/verification.json`。截图是实际Cocos Web构建运行结果：

- [第一屏](../reports/v057-first-screen.png)
- [高低台阶和金属平台](../reports/v057-platform.png)
- [火箭筒整帧动作](../reports/v057-rocket.png) / [人物细节](../reports/v057-rocket-detail.png)
- [持刀](../reports/v057-knife-hold.png) / [第一刀](../reports/v057-knife-1.png) / [第二刀](../reports/v057-knife-2.png) / [第三刀](../reports/v057-knife-3.png)
- [前两段](../reports/v057-second-zone.png)

已完成：

- 严格类型检查通过；104/104项逻辑测试通过。
- 浏览器41项：39项首轮通过；整关和Boss撤退两项首轮角色死亡、第二轮通过，保留首次失败证据，未降低难度；最终没有未通过项。
- 真实键盘第2次整关94.47秒通关，剩余3生命、20击杀、0运行错误。跳过活敌仍能激活Boss、撤退和再次进入。
- 前两段真实拾取步枪→霰弹枪→火箭筒→弹药耗尽回步枪，HUD/人物/弹药同步；完整火箭帧无外接武器和手掌层。
- Q/真实触摸切刀16次，70个渲染帧没有空白。普通攻击触发三段原画刀动作；蹲下、空中刀、双跳、摇杆与多点触控回归通过。
- 667/740/844/852/932/1024/1280等浏览器尺寸、DPR2/3、横竖屏切换、浏览器安全区适配均有通过证据。
- Creator真实构建：Web 5,899,277字节 / 52文件；微信3,102,432字节 / 51文件，小游戏横屏配置和AppID核对通过。新增贴图253,895字节；三张贴图理论RGBA显存约32 MiB，不等于游戏总内存峰值。

未实测：微信开发者工具运行、Android/iOS真机、微信内触摸和安全区、持续60FPS。微信构建成功不等于已上线；本轮未上传/提审/发布。

## 仍缺资源或临时映射

- 本次没有霰弹枪全身动作，暂沿用已有霰弹枪身体/武器方案；未声称所有武器均已换成完整新动作。
- 新刀图没有专门蹲斩行，暂用完整低姿持刀帧；其挥砍动作精度仍待对应原画。
- 刀/火箭筒没有新投雷动作，沿用之前提供的投掷帧。
- 上下高角度持枪动作缺失；逻辑瞄准保留，整个人物图不做手臂拼装。巨型最终Boss仍为此前表现，本轮新图不含巨型Boss。

## 复现

资源重切：使用带Pillow/numpy的Python运行 `scripts/prepare-comic-v057.py`。之后 `npm run meta`、`npm run typecheck`、`npm test`；用README中的Creator构建命令依次构建Web和微信。`npm run preview`启动试玩；`npx playwright test`执行全部浏览器用例；`npm run verify:delivery`汇总当前版本证据。
