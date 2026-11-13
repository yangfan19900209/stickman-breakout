# V0.6.5 举炮姿势与火箭出筒

[文档目录](../../doc/README.md) · [验收记录](../../开发进度/验证记录/v065-verification.json)

## 修复的行为

旧动作帧只有平举炮筒，发射逻辑使用平举挂点，并让弹体先向前飞再转向上方。V0.6.5 补齐真正竖直、斜上方举炮的完整人物帧，角色动作、炮口、后喷口和初速度共用测量数据。向上瞄准从第一帧直接向上发射，左右镜像、站立、跑动、蹲下、起跳和下落均覆盖。

首次碰撞沿后喷口到炮口再到弹头扫掠，防止炮口伸过薄平台时跳过遮挡，同时避免从人物中心水平扫到旁边的墙。尾烟等尾部出筒再生成，炮口烟缩小，后喷烟沿炮筒轴线向后喷出。伤害、弹速、弹药和追踪规则不变。

## 素材来源与接入

- 使用内置 `imagegen`，以已有 [持火箭筒士兵](../游戏美术/slices/v057/direct.rocket.idle.0.png) 为身份和画风参考，生成 8 张完整持炮姿势，无拆分手臂或枪体叠贴。
- [原始透明图](../游戏美术/source/v065/rocket-aim.png)：实际 1774×887 RGBA，868260 字节；保留原文件。提示中的期望尺寸不作为实际尺寸。
- [运行图集](../../源码/assets/resources/comic/rocket-aim.png)：1024×512，27949 字节。完整裁剪后等比缩小至二分之一、128 色量化，有损处理；不声称与原图像素一致。
- [生成与打包脚本](../../源码/scripts/prepare-rocket-aim.py)记录每帧虚拟脚底、炮口、后喷口、统一世界缩放与裁剪边界，生成 [帧和挂点](../../源码/assets/scripts/render/RocketAimFrames.ts)及[来源清单](../游戏美术/v065-manifest.json)。运行前预载图集，换枪不临时加载。
- 全帧资源范围和透明度检查通过。8 帧使用同一世界缩放，不按每个包围盒重新拉伸。空中帧使用虚拟落地基准，锚点可以在裁剪框外。

复现提示词（按本轮生成约束整理）：

```text
Create a production 2D sprite sheet for the attached black-and-white soldier.
Preserve the exact helmet, face, backpack, outfit, body proportions, black
contour weight and opaque white interiors. Draw eight complete characters
in two rows of four equal cells, with generous transparent gaps.
Top row: launcher points exactly vertically upward, muzzle above the helmet,
rear opening near the lower chest: standing, crouching, jumping with bent
knees, falling with lowered legs.
Bottom row: launcher points exactly 45 degrees upward-right: running pose A,
running pose B with the other leg forward, crouching, airborne.
Keep the same head/body scale and tube length throughout. Whole intact bodies,
natural hands gripping the tube. No detached arms or guns, no projectiles,
smoke, explosions, lettering, cell borders, ground or background.
True transparent background. Requested canvas 2048x1024.
```

## 验证

- 严格类型检查通过；173 项逻辑回归通过，包含第一帧竖直/斜向速度、左右镜像、受击持炮、薄平台遮挡、侧墙不误撞、挂点坐标、尾烟与池复用。
- [浏览器检查](../../源码/tests/browser/v065-rocket-aim.spec.ts) 3/3 通过，使用安装的 Chrome，真实键盘取得火箭筒，分别检查左右竖直/斜向、起跳/下落/蹲下/空中斜向，以及 844×390 双指触控。无页面或应用错误；保留 17 张首帧/飞行截图。
- 截图：[朝右向上](../../开发进度/验证记录/v065-up-right.png)、[朝左出筒](../../开发进度/验证记录/v065-up-left-flight.png)、[斜向](../../开发进度/验证记录/v065-diagonal-right.png)、[空中](../../开发进度/验证记录/v065-jump-up.png)、[手机横屏触控](../../开发进度/验证记录/v065-touch-up.png)。已目视核对炮口、弹头与人物姿态。
- Web 与微信本地构建成功；Web 7510938 字节，微信主包 4170873 字节，满足本项目现有 4 MiB 预算。完整包指纹及分包信息见验收记录，离线缓存版本更新至 0.6.5。
- 本轮未重跑浏览器整关通关，未在微信开发者工具或手机真机运行，未上传或发布。历史 V0.5.7 的水平出筒后转向测试记录不再代表当前期望行为。

游戏技能已修正举炮方向与完整动作的契约、首段碰撞扫掠和 getter 状态复制注意事项，并补充举炮素材提示词。
