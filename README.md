# 线条突围 / Stickman Breakout V0.4.2

原创黑白手绘横版动作射击游戏。沿用真实 **Cocos Creator 3.8.8 + TypeScript** 工程，Graphics 程序化绘制，1280×720 横屏。移动、武器、敌人、破坏物、机关与游戏状态仍是独立模块，核心不使用 DOM 或浏览器存储。

在线试玩：[GitHub Pages](https://yangfan19900209.github.io/stickman-breakout/)。本地试玩：安装 Node.js 22/24 后双击 **试玩.cmd**，或运行 `npm run preview`，打开 http://127.0.0.1:4190。Cocos 模块需要 HTTP 加载，不能使用 `file://`。

## V0.4.2 起伏道路、漫画动作与关尾修复

- 普通区域的强制清敌墙已移除。敌人可以跳过，BOSS 按玩家进入区域激活；原有敌人不会被偷偷删除。清敌统计仍保留，HUD 区域名称根据当前位置切换。
- BOSS 区允许退回补给，退离入口后取消未发出的攻击预警、解除相机限制；再次进入保留战车血量。击毁战车即可打开出口，不要求回头清理普通敌人。
- 新增 `level/TerrainProfile.ts`：路面高度 118–185，包含缓坡、路基和浅沟；地面箱子、油桶、敌人和台阶随地形摆放。碰撞体是连续坡面，行走双向贴地，跳跃正常脱离；子弹、手雷、补给和坠落物使用同一坡面高度。战车最后一段为平整阵地，保持原有炮击预警。
- 奔跑步幅跟随实际移动距离。落地脚反向移动抵消身体前进，摆动脚用平滑抬脚弧；双段腿部求解膝盖弯曲，鞋底随坡度调整。落地有短暂压低再恢复，握枪的支撑手、护膝、衣褶、肩章、背包扣、下颌与头盔绑带增加角色感。
- 远景改为带侵蚀纹理的不规则曲线岩壁；中景用残墙、拱门、屋顶水箱、弯管、破损吊架与碎石替换重复窗格和矩形机柜。前景补充随坡面走向的断续土层纹理；背景仍使用浅灰，战斗和可站立边缘保持深黑。
- 人物改为贝塞尔圆顶头盔、带鼻尖/下颌的脸、护目镜、带卷毯的大背包、厚实衣袖和靴子；加强弯膝、前倾和奔跑跨步。仍使用同一关节驱动枪口和碰撞逻辑。
- 拆除抢画面的大告示牌，平台改为有轮廓的柱腿/交叉支架；木箱有斜撑木板，沙袋有弧形袋口与缝线，圆柱油桶有清晰火焰标识。远景沿用浅灰，云朵改为曲线，并修正原来云层位于手机镜头上方看不见的问题。
- 火箭使用更大的弧形弹头、尾翼与描边烟尾；爆炸的深色烟冠、白色前烟、墨点和碎片更清楚。伤害范围保持原参数，扩大的是视觉烟团。
- 跳跃键下移到普攻左侧略上，减少遮挡敌人；摇杆方向箭头、深色主按钮、曲线心形和粗暂停图标统一风格。拾取提示移到 HUD 下方的小字号通知，避开人物。

本轮新增回归：`tests/v042-progression.test.cjs`、`tests/v042-terrain.test.cjs` 和对应浏览器测试。漏敌路线从起点使用真实键盘推进，主动留下最后一组敌人，验证 BOSS 激活、返回和重新进入；坡面路线在手机尺寸中用普通移动/射击往返第一段山脊。没有使用传送、改血量或删除敌人的调试入口。新增截图：`reports/v042-road-running.png`、`reports/v042-road-return.png`。

## 已保留的操作与武器能力

按操作布局 → 角色 → 武器/反馈 → HUD 顺序迭代，复用原有关节、输入、碰撞、对象池和关卡。没有增加敌人数量、地图长度或背景密度。

- 左摇杆不再缩成 55%：默认保留完整、低透明度浅灰底座、深灰拇指圆和高光，触摸后提高对比度并浮动到触点。默认左右拇指中心对齐。844×390 下底座约 146px、内圈 70px，普攻约 117px、跳跃 70px、手雷 59px；触区分别再扩大 14/12/12px。跳跃在普攻左上，手雷在上方略偏右，触区不重叠。
- 人物用黑描边、白/灰填充的四肢、躯干、手掌和靴子替代单线肢体。主角是圆头、穹顶头盔、护目镜、卷毯背包、肩带和弹药包；远程兵是前伸帽檐，近战兵是绑带与警棍，盾兵是封闭面罩和棱角盾牌。奔跑抬腿/前倾、射击后坐、受击后仰更明显。绘制与枪口共用关节坐标，保持左右翻转和向上射击对齐。
- 步枪：有弹头的短弹迹、紧凑枪口爆点。霰弹：六颗带短迹的独立圆形弹丸、扇形扩散、大枪口爆点、原有近距离增伤与击退。火箭：尖头、白色弹身、分隔环、尾翼、跳动尾焰、后方漫画烟尾和发射后喷烟；速度 460，明显慢于步枪 1100。手雷：旋转雷体/拉环、运动迹、原有抛物线与反弹引信。
- 爆炸：白色墨迹爆闪、有描边的贝塞尔烟团、亮色前景烟团、外扩冲击波、径向动势线、木/金属碎片、扬尘和轻震屏。火箭冲击波较快（0.28s），手雷较慢（0.4s）且烟团向上发展；原有范围伤害继续生效。
- HUD：左上生命，中上偏左显示三种独立武器轮廓与弹药，遭遇文字弱化，右上进度刻度与暂停。武器图标仅在换武器时重绘，按钮主体和冷却弧继续分层缓存。沙袋改为圆角软包，木箱增加少量木纹，远景灰度/数量保持原有层次。

截图：`reports/v041-balanced-controls.png`、`v041-rifle-flight.png`、`v041-shotgun-flight.png`、`v041-rocket-flight.png`、`v041-grenade-blast.png`。复现：`npm run test:browser -- tests/browser/v041-comic.spec.ts`；新增逻辑测试检查尾烟位置、爆炸来源传递与重开后的池槽复用。完整结果见 `reports/verification.json`。

所有造型都是原创 Graphics 程序化绘制；现阶段仍是可迭代的程序美术，不是最终手绘动画素材。真实 iOS/Android/微信手机触感、持续帧率和微信开发者工具运行尚未验收。

## 沿用的全屏与移动操作

显示仍由 Cocos 负责：横屏固定 720 逻辑高度并扩展宽度，竖屏显示独立全高旋转引导并暂停战斗。网页外壳使用 `100dvw/100dvh` 回退、`visualViewport`、resize 和安全区；CSS 尺寸与引擎 DPR 像素尺寸分离，不拉伸人物。页面不滚动、不选中文字，不允许触控引发缩放或橡皮筋回弹。

左半屏空白处按下即可唤出浮动摇杆，起点为中立位置，拖动后移动。底座在边缘自动向内限位，输入仍按原始触点计算；手指越出圆圈也能继续移动，第二根手指不能抢占。844×390 下底座约 146px、内圈 70px、最大拖动半径 52px；尺寸按可视高度设置上下限。上拖瞄准、下拖下蹲，上拖不触发跳跃。

右半屏空白区域轻点发射一次、按住持续开火，和大号普攻按钮使用原有 WeaponSystem。普攻约 117px，跳跃约 70px，手雷约 59px；跳跃在普攻左上、手雷在上方，扩大触区互不重叠。明确命中判定顺序为菜单/暂停 → 跳跃 → 手雷 → 普攻 → 空白射击；跳跃和手雷不会额外射击。按钮显示常态、按下态、禁用态和冷却弧。

HUD 为约 52 CSS 像素高的一行：左侧生命/武器/弹药，右侧进度/暂停，次要区域文字缩小，击杀统计放入结算。HUD 不跟随世界镜头。每根手指独立拥有动作，单指松开、同时松开、取消、暂停、失焦与切后台都能清理状态。同方向的视口高度变化会保持触点与正确坐标，旋转则释放输入。

### Safari 普通网页、主屏幕模式与微信

| 模式            | 显示和边界                                                                                                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Safari 普通网页 | 占满浏览器提供的可用视口；地址栏、标签栏由浏览器管理，CSS 不能强制隐藏。支持 Fullscreen API 时可点击首页/暂停页的“进入全屏”，并尝试横屏锁定；失败安全回退。                               |
| 主屏幕 Web App  | manifest 配置 `standalone`、相对 start_url/scope、横屏提示、192/512 图标和 iOS 180 图标。从主屏幕图标独立启动时不会使用普通 Safari 地址栏和标签栏，但系统状态栏、底部手势区仍由系统管理。 |
| 微信内 H5       | 仍是网页，不能等同于微信小游戏。使用网页适配层，不能承诺隐藏微信的系统 UI。                                                                                                               |
| 原生微信小游戏  | 用 Creator 官方 `wechatgame` 包、横屏配置和 Cocos API，不加载 Safari DOM 外壳。正式运行需 AppID 与开发者工具/真机验收。                                                                   |

网页能力只在 `web-shell/browser-platform.js` 中实现，游戏通过 `PlatformAdapter` 合约访问；核心 TypeScript 不调用 DOM。Service Worker 按子路径缓存首次访问后的资源，联网优先、断网回退，不预先声称未访问的资源能离线使用。发布使用 `main/docs`，manifest 的 `./` 地址和 scope 解析为 `/stickman-breakout/`。

### iPhone / iPad 添加到主屏幕

1. 用 Safari 打开在线试玩地址。
2. 打开“分享”，选择“添加到主屏幕”；若没看到该项，在分享菜单的编辑操作中启用。
3. 如果系统提供“作为 Web App 打开”，保持开启，点击“添加”。
4. 回到主屏幕，点击“线条突围”图标，并旋转为横屏。
5. 新版本发布后先联网打开并刷新一次，离线缓存才会更新。

参考：[Apple 主屏幕 Web App 说明](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios)、[WebKit Safari 26 Web App 行为](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)、[Fullscreen API 用户激活要求](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen)。iOS Safari 和主屏幕模式目前没有真机验收。

### 复现移动测试

运行 `npm run test:browser`，或只检查本轮：`npm run test:browser -- tests/browser/v04-*.spec.ts`。覆盖 844×390、852×393、932×430、1280×720、390×844，另保留 DPR 2/3 和平板回归。截图在 `reports/v04-landscape-*.png`，平台、动作和设备记录为 `reports/v04-*.json`。独立模式检测和失焦信号为自动化模拟；Chrome 全屏进入/退出及已访问资源离线启动为真实 API 测试，均不代表 Safari 或微信真机结果。

保留 V0.2.1 的分层粗线角色、场景、爆炸、命中和破坏效果，以及所有原有武器、敌人、BOSS、关卡与碰撞逻辑。本轮没有增加游戏内容。

## 操作与玩法

| 操作          | 手机横屏                             | PC                |
| ------------- | ------------------------------------ | ----------------- |
| 移动          | 左半屏任意空白处按下后拖动，松手停止 | A/D 或左右箭头    |
| 下蹲射击      | 摇杆下拉，同时按射击                 | S/↓ + J           |
| 向上瞄准      | 摇杆上拉，斜上为 45°，正上为 90°     | W/↑，与方向键配合 |
| 可变高度跳跃  | 按住跳跃高跳，轻点低跳               | 按住/轻点 Space   |
| 连射          | 按住右半屏空白处或右下普攻按钮       | 按住 J            |
| 手雷          | 较小手雷按钮，有数量限制             | K                 |
| 暂停/继续     | 右上暂停及面板按钮                   | P/Esc             |
| 开始/重新开始 | 面板按钮                             | Enter 或按钮      |

支持摇杆、跳跃和射击三指同时操作；摇杆上推不会触发跳跃。暂停与切后台会清空输入，返回后重新按住操作按钮。暂停面板可以切换音效。

废弃前哨站分为道路遭遇、工业突破、机械阵地、战车决战四段。普通敌人可以跳过，也可以返回击败；进入战车区即激活 BOSS，击败战车后抵达出口即可通关。木箱、沙袋、铁箱能破坏；油桶能连锁爆炸；厚轮廓混凝土障碍不能破坏，需要跳过。绳索可射断，吊桥会实际落下；升降台可以载人。高台和隐藏箱子中有武器补给。

自动步枪弹药不限。霰弹枪一次六颗散射弹丸，近距离伤害和击退更强；火箭筒速度较慢、范围爆炸、对机械敌人更有效。有限弹药用完后回到步枪。玩家接近掉落物会自动拾取：S 为霰弹枪、R 为火箭、G 为手雷，+ 为生命。满血时生命补给会留在原地。

盾兵正面吸收部分弹丸，盾牌可被打碎；绕后或使用爆炸可以越过盾牌防御。炮塔会瞄准并发射慢速重弹。进入战车场后镜头平滑拉远并限制推进范围，地面圆环预告炮弹落点；战车半血进入第二阶段并召唤增援。击毁战车、等待爆炸演出，再走到出口完成突围。

## 安装、编辑器和构建

1. 在 Cocos Dashboard 安装 Creator **3.8.8**，添加当前工程根目录。
2. 等待导入，打开 `assets/scenes/Main.scene`，通过编辑器浏览器预览。编辑态场景仅含启动组件，游戏节点在运行时创建。
3. 安装开发依赖：`npm ci`。
4. 在 PowerShell 设置编辑器路径：

```powershell
$env:COCOS_CREATOR = '你的安装目录\CocosCreator.exe'
npm run typecheck
npm test
npm run build:web
npm run preview
```

或运行 `scripts/build-cocos.ps1 -Creator '完整路径\CocosCreator.exe' -Platform web-mobile`。项目使用 `settings/v2/packages/engine.json` 选择 2D、Graphics、UI、音频和必要渲染模块，未引入 3D 物理或第三方浏览器游戏库。

## 微信小游戏

```powershell
npm run build:wechat
```

先把 `build-config/wechatgame.json` 中的 `packages.wechatgame.appid` 替换为自己的小游戏 AppID；当前为 Cocos 官方测试 AppID `wx6ac3f5090a6b99c5`。构建后在微信开发者工具导入 `build/wechatgame`，工程类型小游戏，方向 landscape。然后在 Android/iOS 真机检查多点触控、刘海/手势区域、音频解锁、后台恢复、帧率和内存。

微信包和入口由 Creator 官方构建器生成；成功构建不代表已经通过微信开发者工具或真机验收。相关步骤：[Cocos 官方微信发布说明](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/publish-wechatgame.html)。

## 测试与证据

```powershell
npm run typecheck
npm test
npx playwright install chromium
npm run test:browser
npm run verify:delivery
```

浏览器套件先要求已经存在 Web 构建。它通过只读 `__BREAKOUT__.snapshot()` 读取状态，以实际键盘、Touch/CDP 操作验证游戏，不通过传送、改血量或删除敌人通关。完整测试包含三种武器拾取、四段区域、吊桥、两阶段战车、出口以及漏敌返回路线。逻辑回归还保留了 V0.1 的 4000 单位关卡夹具，以免升级损坏基础能力。

结果及截图位于 `reports/`。`logic-results.json` 是逻辑测试计数，`browser-results.json` 是浏览器结果，`full-run.json` 为真实键盘整局记录，`v02-browser-performance.json` 为当前自动化浏览器样本；不能将它等同于手机真机帧率。`verification.json` 记录源码指纹、构建包和验证边界。

程序化音效位于 `assets/resources/audio`，由 `node scripts/sound-assets.mjs` 生成七个原创 22.05kHz 单声道 PCM WAV；声音播放使用 Cocos AudioSource。没有复制参考截图中的角色、地图或美术素材。

## GitHub Pages 更新

发布来源为 `main/docs`，`.nojekyll` 保持 Creator 文件原样，`docs/** -text` 保留构建字节和行尾。源码变化后必须重新构建和测试，再准备发布副本：

```powershell
npm run pages:prepare
git add assets build-config build-templates settings scripts tests reports package.json package-lock.json docs README.md DEVELOPMENT.md
git commit -m 'Update Stickman Breakout'
git push origin main
# 等 GitHub Pages 部署成功后：
npm run pages:check
```

`pages:prepare` 校验发布文件并只清理此前生成的文件；`docs/version.json` 含版本和包指纹。在线检查逐文件比较公开包，并验证键盘、暂停和三指触控。

## 核心模块

| 模块                                                                | 职责                                         |
| ------------------------------------------------------------------- | -------------------------------------------- |
| `core/InputManager` / `VirtualJoystick`                             | 输入所有权、死区、模拟量与动作边缘           |
| `player/PlayerController`                                           | 加减速、可变跳高、土狼时间、缓冲、下蹲和上瞄 |
| `combat/WeaponSystem` / `ProjectileManager`                         | 三种武器、扫掠碰撞、贴身命中和子弹池         |
| `combat/GrenadeSystem` / `ExplosionSystem`                          | 抛物线、碰撞反弹、范围伤害与有界连锁队列     |
| `world/DestructibleObject` / `DestructibleManager` / `PickupSystem` | 材质、渐进破坏、真实碰撞体、掉落与拾取       |
| `enemy/EnemyController` / `TankBoss` / `EnemySpawner`               | 步兵、冲锋、盾牌、炮塔、战车两阶段和有界增援 |
| `level/LevelData` / `LevelController` / `MechanismController`       | 四段关卡、自由推进、平台碰撞、升降与吊桥     |
| `render/CharacterArt` / `MechanicalEnemyArt` / `SceneryArt`         | 原创角色、机械结构和多层场景                 |
| `render/LevelRenderer` / `CombatRenderer` / `ObjectRenderer`        | 可见分块、战斗效果与可交互物绘图             |
| `platform/AudioBridge` / `PlatformBridge` / `CocosInputAdapter`     | 跨平台音频、生命周期、安全区和设备事件       |
| `GameManager` / `GameSession` / `HUDController`                     | 组件装配、模拟流程和持续复用 UI              |

完整完成状态、遗留问题和后续迭代计划见 `DEVELOPMENT.md`。
