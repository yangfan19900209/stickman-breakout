# 第二关《深海突围》资源图

[文档目录](../../doc/README.md) · [第二关设计](../../开发计划/关卡/LEVEL-02-DESIGN.md) · [资源预览页](../游戏美术/level02-preview.html)

本批为依据第二关设计生成的美术源资源。使用内置 **imagegen**，以第一关原士兵和统一封面为画风参考，再用本批潜水主角、潜艇作为后续图的身份参考。全部生成原图保留于 [art/source/level02](../游戏美术/source/level02)，不会覆盖第一关资源。

V0.7.0 已接入可玩首版。源图和切片记录继续保持原样，新增 [运行副本清单](../游戏美术/level02-runtime.json) 和 [章节资源目录](../../源码/assets/level02)；实际运行范围见 [首版交付](V070-DELIVERY.md)。下文源素材页检查属于上一轮证据，不代替当前游戏验证。

## 文件与用途

| 原图 | 图块数 | 用途 |
| --- | --- | --- |
| [hero-swim.png](../游戏美术/source/level02/hero-swim.png) | 8 | 主角悬停、游泳踢腿、推进与受击 |
| [hero-combat.png](../游戏美术/source/level02/hero-combat.png) | 12 | 声纳上/下/斜向、聚能炮、鱼雷、刀击、死亡 |
| [hero-transition.png](../游戏美术/source/level02/hero-transition.png) | 8 | 戴面罩、背气瓶、准备跃水、上浮和欢呼关键姿态 |
| [hero-entry.png](../游戏美术/source/level02/hero-entry.png) | 2 | 斜向与陡角度头朝下入水姿态 |
| [diver-enemies.png](../游戏美术/source/level02/diver-enemies.png) | 8 | 潜水射手、重装潜水队长各四个状态 |
| [marine-life.png](../游戏美术/source/level02/marine-life.png) | 12 | 冲刺鱼、攻击水草、鱼群与装饰水草 |
| [submarine-hull.png](../游戏美术/source/level02/submarine-hull.png) | 4 | 完整潜艇造型参考、无炮塔船体、受损船体、残骸 |
| [submarine-modules.png](../游戏美术/source/level02/submarine-modules.png) | 12 | 双管炮、激光炮、鱼雷舱的不同状态，以及核心和螺旋桨 |
| [terrain.png](../游戏美术/source/level02/terrain.png) | 12 | 海床边块、礁石、拱门、悬崖、船舱与管道 |
| [props-weapons.png](../游戏美术/source/level02/props-weapons.png) | 12 | 武器、医疗箱、能量、鱼雷补给、深水弹、密封箱、水雷与炮台 |
| [combat-effects.png](../游戏美术/source/level02/combat-effects.png) | 12 | 声纳脉冲、鱼雷、压力弹、激光、带缺口压力环和命中特效 |
| [water-effects.png](../游戏美术/source/level02/water-effects.png) | 12 | 入水水花、涟漪、气泡、推进尾迹与四阶段水下爆炸 |
| [coast-background.png](../游戏美术/source/level02/coast-background.png) | 1 | 海边悬崖与海面远景，独立不透明背景 |
| [undersea-background.png](../游戏美术/source/level02/undersea-background.png) | 1 | 海底礁石、沉船与海沟远景，独立不透明背景 |

共 14 张原图、116 个图块，其中 114 个来自透明资源图，2 个是完整背景。潜艇完整组装图只作造型参考；运行时应选无炮塔船体配独立部件，避免画出重复炮塔。

## 记录与检查

- [完整提示词与生成来源](../游戏美术/level02-generation.json)：逐张记录提示词、参考文件、预期行列和语义顺序，以及实际筛选备注。工具返回原文件被复制进项目，默认生成目录中的文件未删除。
- [资源清单](../游戏美术/level02-manifest.json)：记录实际尺寸、RGBA/透明度统计、SHA-256、实际裁剪矩形、图块用途和来源。
- [单独图块](../游戏美术/slices/level02)：保持选中区域原尺寸和 RGBA 像素。没有重画、缩放、量化或自动抠除白色填充。
- [切片脚本](../../源码/scripts/prepare-level02-assets.py)：名义网格只作为定位参考，实际边界移到透明间隔，再裁取完整轮廓。保留原始坐标，逐一核对保存后的 RGBA 与源图对应区域一致。
- [预览页](../游戏美术/level02-preview.html)：可查看原图或单独图块、搜索名称，并在棋盘/深色/白色底之间切换。点击图片打开原尺寸资源；无需外部字体或网络服务。
- [验证记录](../../开发进度/验证记录/level02-assets-verification.json)：14 张原图与 116 张切片的哈希检查通过；桌面 1600×1000、手机横屏 844×390 的本地预览检查通过，130 张图片均加载成功，搜索、页签与底色切换正常，未发现页面错误或横向溢出。[总览截图](../../开发进度/验证记录/level02-assets-overview.png)可直接查看整批内容。

生成结果的校正：`terrain.png` 实际前两格是左端块、中间块，清单按实际顺序命名。原过场图第五格生成的是水平滑游，因此改为 `diver.water.glide`，另生成两张明确头朝下的入水姿态。未将错误动作继续标成俯冲。

所有源图与实际裁剪都已做透明边缘、完整轮廓和白色主体检查。半透明抗锯齿边缘保留，不能用透明像素数量代替目视检查。

## 接入约定

1. 本批是源资源和关键动作候选，V0.7.0 已选择实际动作接入。不是每张候选帧都播放，关键姿态图也不等于完整连续动画；仍需逐步补齐过渡与装备移动变体。
2. 原图尺寸以清单为准，不能使用提示词中的期望尺寸计算切片。当前身体枢轴和炮口见 [OceanPose](../../源码/assets/scripts/ocean/OceanPose.ts)，炮塔枢轴和挂点见 [OceanSession](../../源码/assets/scripts/ocean/OceanSession.ts) 的 `bossModuleTransform`，呈现见 [OceanRenderer](../../源码/assets/scripts/ocean/OceanRenderer.ts)。源切片清单保持生成时记录，运行挂点不回写成生成工具的承诺。
3. 同一角色所有帧使用共同头身尺度，不能为了填满格子各自拉伸。主角白头盔、圆面罩和单气瓶；潜水射手黑头罩、窄面罩与双瓶；重装队长圆金属盔，三者轮廓可区分。
4. 潜艇船体、炮塔和破损部件需在统一世界比例下对齐，完整潜艇参考不能再叠同一组炮塔。图片内“上仰/下俯”不是精确发射角证据，挂点和筒轴仍需测量。
5. 地形图是模块原画候选，不宣称无缝平铺。海床接缝、模块端帽、拱门与舱门实际通路、镜像后的悬崖朝向都需检查后才建立碰撞。
6. 背景仅作远景，不产生实体碰撞。危险水草与装饰水草分别命名；鱼群不冒充攻击鱼。
7. 激光、声纳、压力环和水下爆炸按独立特效使用。鱼雷原画尾部带少量气泡，接入时明确是否保留，避免又叠一份相同的烘焙尾迹。
8. 原资源留在 `素材/游戏美术/`。运行版由 [pack-level02.py](../../源码/scripts/pack-level02.py) 输出独立 `level02` 包，切关前预载 115 张纹理；组装潜艇参考图不打包。船体/地形保留尺寸，其余精灵降至 50%，PNG 量化为 128 色；背景宽 1280、JPEG 质量 88。上述运行处理有损，不能与原始裁剪的 RGBA 一致性混淆。

原资源生成轮没有改玩法或构建。后续 V0.7.0 已更新玩法和本地构建，并完成浏览器通关；未发布，微信实际运行未测。各轮证据分别归档。
