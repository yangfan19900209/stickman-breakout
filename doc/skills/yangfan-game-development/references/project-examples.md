# 《线条突围》实例索引

本技能随项目持续维护。这里的路径均相对《线条突围》仓库根目录，仅用于定位实例；在其他仓库中不要假定这些文件存在。技能其余参考文件与检查脚本可独立使用。

## 当前工程布局

Creator 工程在 `源码/`，命令在该目录执行；`素材/` 保存原稿和美术记录，`运营/` 保存宣传/提交/备案资料，`开发计划/` 保存待办和方案，`开发进度/` 保存进展与验证，`交付/` 保存固定包。技术方法维护源仍为 `doc/skills/yangfan-game-development/`；体验归档在 `历史归档/体验锚点/`，GitHub Pages 沿用根目录 `docs/`。

下文旧版验收工具如已移出现行源码，可在 `历史归档/整理前源码-20261113.zip` 的 `scripts/` 中查看对应原件；仅作为历史依据，不直接运行旧版本断言。

## 本项目已确认的 UI 美术规则

操作按钮、摇杆及动作图标使用生成图片资源；不再自行用 Graphics、Canvas、SVG 凑出最终按钮。以现有游戏实景与戴帽主角为风格参考，保持黑白粗线、白色填充和克制的灰色投影。用户明确否定了金属/写实的磨砂按钮：质感来自完整绘制和统一风格，不能换成另一种游戏的 UI。

第一关跳跃、二段跳、下台与第二关冲刺、第三关闪避使用对应图片和文案；滑铲已移除，旧图仅保留归档。原生代码负责文字与数值、透明度、状态切换、按压/冷却、布局和触摸区域。实现可参考 `源码/assets/scripts/ui/ControlSkin.ts`、`ControlFrames.ts`、`JoystickView.ts`；生成来源与提示词见 `素材/游戏美术/source/v084/GENERATION.md`，完整切片记录见 `素材/游戏美术/v084-controls-manifest.json`。

战斗继续保持黑白画风，攻击瞬时效果和爆炸沿用统一橙黄色；用户随后明确要求第二关已锁定准心也用这一个强调色提高可见性，不扩展成整套彩色 HUD。不按火焰、能量或预警分别设置红、蓝等不同色系。人物、武器、弹体外壳与预警维持黑白，烟雾灰度消散。此规则来自用户对多色版本的明确纠正及对准心的后续要求，后续关卡同样遵循；实现入口为 `源码/assets/scripts/render/CombatPalette.ts`。

## 从需求定位入口

| 需要参考的实现 | 项目文件 |
| --- | --- |
| 纯模拟会话、系统调度、演出接入 | `源码/assets/scripts/core/GameSession.ts` |
| 独立水下会话、纵向输入、整身旋转枪口 | `源码/assets/scripts/ocean/OceanSession.ts`、`OceanPose.ts`、`OceanLevel.ts` |
| 章节资源预载与运行副本 | `源码/assets/scripts/ocean/OceanAssets.ts`、`源码/scripts/pack-level02.py`、`素材/游戏美术/level02-runtime.json` |
| 固定步长、资源加载、场景与画面 | `源码/assets/scripts/GameManager.ts` |
| 箱体支撑、移动平台、残骸 | `源码/assets/scripts/world/DestructibleManager.ts`、`DestructibleObject.ts` |
| 可视尺寸与对象碰撞契约 | `源码/assets/scripts/render/ObjectPresentation.ts` |
| 碎片重力、反弹、初始嵌入 | `源码/assets/scripts/combat/ParticlePool.ts` |
| 装备、弹药、枪口、冷却 | `源码/assets/scripts/combat/WeaponSystem.ts` |
| 跳台通弹、射线与追踪遮挡 | `源码/assets/scripts/combat/ShotObstruction.ts`、`ProjectileManager.ts`、`BossBeam.ts`；`源码/tests/v0822-controls-fire.test.cjs` |
| 上下文拆箱、整次按压保护 | `源码/assets/scripts/combat/MeleeSystem.ts` |
| 原画姿态与火箭呈现 | `源码/assets/scripts/render/DirectPose.ts`、`RocketAimFrames.ts`、`RocketPresentation.ts` |
| 敌人攻击预警与锁定 | `源码/assets/scripts/enemy/EnemyTactics.ts`、`TankBoss.ts`、`ColossusBoss.ts` |
| 关卡长度、组合遭遇 | `源码/assets/scripts/level/LevelData.ts` |
| 补给点、去重、拾取落地 | `源码/assets/scripts/world/PickupSystem.ts` |
| 多指输入与屏幕布局 | `源码/assets/scripts/platform/CocosInputAdapter.ts`、`源码/assets/scripts/core/InputManager.ts`、`源码/assets/scripts/ui/ControlLayout.ts`、`ViewportLayout.ts` |
| 微信胶囊的窗口坐标、延迟可用与 HUD 避让 | `源码/assets/scripts/platform/MenuSafeArea.ts`、`PlatformAdapter.ts`、`PlatformBridge.ts`；`源码/tests/v082-route-menu.test.cjs`、归档内 `scripts/verify-v082-menu.mjs` |
| 封面海报 | `源码/assets/scripts/ui/TitlePoster.ts` |
| 胜利时间线、设备震动 | `源码/assets/scripts/core/VictorySequence.ts`、`源码/assets/scripts/platform/VictoryHaptics.ts` |
| 四帧欢呼图与锚点 | `源码/assets/scripts/render/CelebrationFrames.ts` |
| 原图切片、挂点、图集与来源 | `源码/scripts/prepare-comic-v057.py`、`prepare-comic-v058.py`、`prepare-comic-v059.py`；`素材/游戏美术/v057-manifest.json`、`素材/游戏美术/v059-manifest.json` |
| 全套陆地人物的统一帧/挂点、整族状态覆盖 | `源码/scripts/pack-v081-art.mjs`、`源码/assets/scripts/render/UnifiedActorFrames.ts`、`源码/tests/v081-cast-supplies.test.cjs` |
| 吊桥绳索绘制与可切断区共用几何 | `源码/assets/scripts/render/BridgePresentation.ts`、`ObjectRenderer.ts`、`源码/assets/scripts/level/LevelData.ts` |
| 构建与最终证据关联 | `源码/scripts/build-cocos.ps1`、`源码/scripts/verify-delivery.mjs` |

缩写文件名沿用同一行前一个完整路径的目录。使用前检查当前分支中的真实路径和实现；不要基于此索引推断新版本状态。

## 具体经验的依据

- `素材/说明/V081-DELIVERY.md`：同一母版覆盖主角三种装备、普通敌兵、投雷/死亡/欢呼，采用统一源图尺度与逐行裁剪；检查钢制/混凝土同外观障碍，并审计强武器全部获取路径。归档内 `scripts/verify-v081-details.mjs` 使用真实按键验证吊桥射断、石墩顶面、四帧持炮移动和冷却结束后的向上发射。

- `素材/说明/V057-DELIVERY.md`：完整持武器动作、脚底与炮口、真实切片边界。
- `素材/说明/V057-UNDERPASS-FIX.md`：平台下双向通路与台阶出口净空。
- `素材/说明/V059-DELIVERY.md`：完整机甲、独立弹体与特效、箱体破碎。
- `素材/说明/V063-DELIVERY.md`：欢呼生成提示词、实际输出尺寸、无损重编码和通关演出。
- `素材/说明/V064-DELIVERY.md`：不同精灵放大后的线宽冲突、统一重绘战场封面、原生UI与插画分别适配；`源码/tests/browser/v064-cover.spec.ts`覆盖四种比例和首页导航。
- `素材/说明/V065-DELIVERY.md`：完整举炮帧、首帧同轴出弹、薄平台与侧墙扫掠；`源码/scripts/prepare-rocket-aim.py`生成统一尺度的帧和双挂点，`源码/tests/browser/v065-rocket-aim.spec.ts`覆盖左右/空中/蹲姿及模拟双指操作。
- `素材/说明/LEVEL-02-ASSETS.md`：潜水资源的实际动作核对、入水姿态补画与独立潜艇部件；`源码/scripts/prepare-level02-assets.py`按每行透明间隔裁剪，保留原始像素和来源矩形，`素材/游戏美术/level02-preview.html`提供多底色原图/切片检查。原始素材页验收只证明素材准备；首版运行接入另见 V0.7.0。
- `素材/说明/V070-DELIVERY.md`：独立水下会话、正常输入通关、Boss 部件伤害去重和弹药回退帧；归档内 `scripts/verify-v070.mjs` 与 归档内 `scripts/verify-v070-link.mjs` 分别验证海底流程和陆地通关后的衔接。`源码/settings/v2/packages/builder.json` 和 `源码/assets/level02.meta` 为 Creator 3.8.8 章节分包的实际预设实例。
- `素材/说明/V071-DELIVERY.md`：完整步枪举枪/空中动作替代擦枪遮罩，修复无枪下落帧；`源码/scripts/prepare-rifle-actions.py` 保存原图裁剪与统一挂点。`源码/web-shell/level02.html`、`第二关测试.cmd` 复用章节加载入口；归档内 `scripts/verify-v071-browser.mjs` 覆盖刷新、转屏、双指和 24 张完整人物动作截图。
- `doc/PROJECT.md`：当前操作方法；`开发进度/开发记录.md`：早期实现历史；版本记录不保证以后仍然适用。
- `源码/tests/v061-support.test.cjs`、`源码/tests/v061-enemy-combat.test.cjs`、`源码/tests/v061-campaign.test.cjs`：支撑、敌人和路线规则。
- `源码/tests/v062-supplies.test.cjs`、`源码/tests/browser/v062-supplies.spec.ts`：补给及上下文近战。
- `源码/tests/v063-victory.test.cjs`、`源码/tests/browser/v063-presentation.spec.ts`：演出时间线、真实输入与关键帧。
- `源码/tests/rocket-muzzle.test.cjs`：当前向上直接出弹、筒轴碰撞与尾烟回归。历史 V0.5.7 水平出筒后转向的期望已被替代；自由飞行测试仍需先离开真实顶棚，遮挡用例单独保留。

## 数值只是实例

V0.6.1 将关卡长度从 8200 调整到 12400，并在两次 Boss 间增加实际遭遇；可迁移的是“新增可玩的段落和压力变化”，不是固定长度。

V0.6.2 在四个恢复位置按缺血与附近道具状态提供补给；可迁移的是“位置 + 状态 + 一次成功生成”的规则，不是固定四包。

V0.6.3 欢呼原图实际为 2172×724。四帧 `atlas` 分别为 `[60,90,450,580]`、`[603,90,450,580]`、`[1146,90,450,580]`、`[1689,90,450,580]`，共同锚点 `[0.5,10/580]`。游戏使用重新编码的 PNG，解码 RGBA 与原图一致；早期量化过的图集不能据此宣称无损。

V0.6.3 使用分阶段爆炸、坍塌、推近、欢呼、结算。测试中的震动请求为模拟接口证据；浏览器运行不等于微信或手机已验证。

## 在本项目运行资源检查

在项目根目录，用当前环境的 Python 执行：

```text
python doc/skills/yangfan-game-development/scripts/inspect_sprite.py 源码/assets/resources/comic/mech.png --frames 素材/游戏美术/v059-manifest.json --require-transparency
python doc/skills/yangfan-game-development/scripts/inspect_sprite.py 源码/assets/resources/comic/celebration.png --compare 素材/游戏美术/source/v063/celebration.png --require-transparency
```

脚本不运行图集生成器，不覆盖原图，也不重新发布游戏。
