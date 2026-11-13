# V0.6.4 统一绘制的战场封面

[文档目录](../../doc/README.md)

日期：2026-11-06。针对旧封面中人物放大后粗线模糊、机甲细线密集、比例与场景割裂的问题，使用内置 image_gen 生成一张完整战场插画，再以原生 UI 排版标题与按钮。

## 最终画面

- [桌面 1280×720](../../开发进度/验证记录/v064-cover-1280.png)
- [手机横屏 844×390](../../开发进度/验证记录/v064-cover-844.png)
- [平板 1024×768](../../开发进度/验证记录/v064-cover-1024.png)
- [手机横屏 932×430](../../开发进度/验证记录/v064-cover-932.png)

主角、机甲、木箱、尘土与地面统一绘制，共享轮廓线、透视和接地关系。机甲体型明显大于士兵，保留重装敌人的压迫感；白色填充、炭黑线条和米色纸面统一风格，胸口暖红与开始按钮呼应。

取消旧斜切画框、单独粘贴的爆炸/云朵、底部关卡数字。标题和开始按钮仍由 Cocos 渲染；按钮有稳定的点击区域，只有箭头轻微移动。手机横屏取景以地面为下边界，优先裁剪上部留白；更窄的比例保留完整构图。

## 素材与处理

| 文件 | 内容 |
| --- | --- |
| [生成原图](../游戏美术/source/v064/cover.png) | 1672×941 RGB PNG，1,725,508 字节，完整保留 |
| [运行时封面（现位于 landart）](../../源码/assets/landart/title-cover.jpg) | 同尺寸 JPEG，337,403 字节；质量93、4:4:4采样，无缩放 |
| [角色参考](../游戏美术/slices/v057/direct.knife.idle.0.png) | 士兵身份和装备特征 |
| [机甲参考](../游戏美术/slices/v059/mech.idle.png) | 装甲轮廓、胸口核心和肩部弹巢 |
| [验收与 SHA-256](../../开发进度/验证记录/v064-verification.json) | 源图、运行资源、构建与验证记录 |

JPEG 是有损运行副本，不宣称逐像素无损；原始 PNG 保持不变。两张参考只提供角色身份，封面重新统一绘制，未使用原游戏精灵叠贴。提示词要求1920×1080，实际返回1672×941，以实际尺寸接入。

## 生成提示词

```text
Use case: illustration-story. Create a completely redesigned premium illustrated title-screen BACKGROUND for the 2D action game Stickman Breakout. Input 1 is the soldier IDENTITY reference; input 2 is the mech IDENTITY reference. REDRAW BOTH in one coherent illustration by the SAME ink artist: same controlled outer contour weight, same simplified interior line weight, same crispness, shading, perspective and ground plane. Do not paste, collage or enlarge the supplied sprites. Soldier: round white face, simple expressive black eyes, curved helmet, white uniform, small backpack, holding a compact rifle with both hands. Mech: broad armored body, dark visor, round chest core, twin shoulder missile pods, left-facing arm cannon and large feet. Simplify mech surface details to match the soldier's clean cartoon language. Mech is physically about 2 times the soldier's standing height, believable within the same scene; hero not giant and mech not toy-sized. Scene: one energetic side-scrolling confrontation in an abandoned military outpost, the soldier in a low forward-running pose facing right, aiming toward the advancing left-facing mech, both grounded on one continuous rocky platform. Subtle broken crate, restrained debris and graphic dust connect them. A few faint outpost silhouettes in the far distance. Clean French-comic / hand-inked game art, confident black contours, opaque ivory fills, selective charcoal shadows and very sparse halftone; no gradients, no photographic texture, no colored explosions. Near-monochrome warm ivory paper (#f6f3eb) and charcoal ink; a tiny muted vermilion glow inside the mech core is the only color accent. Wide 16:9 landscape composition, 1920x1080 if possible. This image will fill an actual game cover. Reserve the LEFT 40 percent as very quiet warm ivory negative space for large native title and button; no characters, busy lines or dark objects in that zone. The hero sits around x=60%, ground at y=83%, visible body about 27% of image height. Boss at x=82%, about 50% image height, with all main body parts safely inside the image. Right-side scene should feel full, integrated, dynamic and professionally art-directed; shared shadows and dust ground both subjects. Low distant scenery may gently trail into the lower left but keep the UI area clean. No text, lettering, logos, buttons, frames, grid, outer border, sticker outlines or watermarks. Output one finished unified scene, not a sprite sheet and not a UI mockup.
```

## 实现与验证

- `TitlePoster.ts` 用一张预载插画替换旧精灵拼贴，标题/按钮独立布局；`ComicAssets.ts` 预载封面，封面加载失败不禁用战斗图集。
- 版本更新为0.6.4，并同步浏览器离线缓存版本。类型检查和169项逻辑回归通过。
- 实际 Chrome 验证4/4通过：四种尺寸的画面、鼠标/模拟触摸开始、暂停返回首页、回车开始；应用错误为0。截图为浏览器画面，不是微信运行截图。
- 首次浏览器检查因 Playwright 自带浏览器可执行文件缺失而未运行，记录保留在 [环境失败记录](../../开发进度/验证记录/v064-browser-unavailable.json)。改用本机 Chrome 后完成最终验证。
- Web与微信本地包构建通过，微信首包4,142,683字节，满足本项目现有4 MiB预算。没有上传或发布，也未进行微信开发者工具/真机验证。
- 本轮浏览器验证针对封面与导航，未重新跑完整战役；战斗与通关时间线的既有逻辑回归已通过。

复核命令：`npm run typecheck`、`npm test`、`npx playwright test tests/browser/v064-cover.spec.ts`、`npm run verify:delivery`。生成独立浏览器报告时，将 `PLAYWRIGHT_JSON_OUTPUT_NAME` 设置为 `开发进度/验证记录/v064-browser-results.json`，并使用 `--reporter=list,json`。
