# 线条突围 / Stickman Breakout V0.1

原创黑白火柴人横版射击原型。工程根目录就是 **Cocos Creator 3.8.8 项目**，不是网页外壳替代的小游戏工程。游戏使用 TypeScript、Cocos Graphics 和 Label；核心模拟不使用 DOM、浏览器存储或浏览器第三方库。

## 立即试玩

本目录保留了已经构建的 `build/web-mobile/`。安装 Node.js 22 或 24 后，双击 **试玩.cmd**，或在此目录运行：

```powershell
npm run preview
```

打开 http://127.0.0.1:4190，点击「开始突围」。保持启动窗口运行；关闭窗口停止本地服务。Cocos 的模块和资源需要通过 HTTP 加载，请不要双击 `index.html` 使用 `file://`。预览服务只在本机回环地址监听，不需要后台业务服务或外部素材。

| 操作 | 键盘 | 触控 |
| --- | --- | --- |
| 移动 | A / D 或 ← / → | 左下两个方向按钮 |
| 单次跳跃 | Space | 右下上箭头 |
| 自动步枪 | 按住 J | 按住右下准星 |
| 暂停 / 继续 | P / Esc | 右上暂停 / 面板继续 |
| 开始 / 再来一次 | Enter 或按钮 | 面板按钮 |

可同时移动、跳跃和射击。朝向由移动方向决定；左右都能射击。受伤后有短暂无敌闪烁。目标是从左向右通过废弃基地，击败出口守卫，再抵达出口；普通敌人无需全部清除。箱子会挡住子弹，跳上障碍后继续前进。

## 安装与编辑器预览

1. 通过 Cocos Dashboard 安装 Creator **3.8.8**；其他 3.8.x 小版本未单独验证。
2. 在 Dashboard「添加项目」选择当前目录；不要选择 `assets` 或 `build`。
3. 等待资源导入，打开 `assets/scenes/Main.scene`。
4. 点击编辑器预览按钮，选择浏览器。场景只有启动组件；相机、程序化地图、人物与 UI 在运行时创建。
5. 在终端安装开发依赖：

```powershell
npm ci
npm run typecheck
npm test
```

`tsconfig.json` 使用 Creator 首次导入后生成的 `temp/tsconfig.cocos.json`。`tsconfig.check.json` 可不启动编辑器，直接对官方 3.8.8 类型声明执行严格检查。

## 构建 Web

在 PowerShell 中设置本机编辑器路径：

```powershell
$env:COCOS_CREATOR = '你的安装目录\CocosCreator.exe'
npm run build:web
npm run preview
```

也可直接运行：

```powershell
.\scripts\build-cocos.ps1 -Creator '你的安装目录\CocosCreator.exe' -Platform web-mobile
```

编辑器构建面板中选择 Web Mobile，起始场景为 Main，设计尺寸 1280×720。项目的 `build-config/web-mobile.json` 可导入为构建配置。`build-templates/web-mobile/index.ejs` 使用官方 EJS 接口，只有网页标题、触摸滚动控制和画布焦点处理；游戏与按钮仍由 Cocos 创建。Web 包保留调试日志和只读快照。

## 构建微信小游戏

已提供 Cocos **wechatgame** 构建配置与构建包。当前使用 Cocos 官方文档列出的测试 AppID `wx6ac3f5090a6b99c5`，仅用于构建验证；不是你的正式 AppID。

1. 在 `build-config/wechatgame.json` 的 `packages.wechatgame.appid` 填入自己的 **小游戏 AppID**。设备方向保持 `landscape`。
2. 设置 `COCOS_CREATOR` 后运行 `npm run build:wechat`，或在 Creator 构建面板导入对应配置并构建。
3. 打开微信开发者工具，导入 `build/wechatgame`，工程类型选「小游戏」，确认 AppID 正确。
4. 在模拟器检查 UI、移动、多点触控、暂停、受伤、重开和通关。
5. 使用「真机调试」分别在 Android / iOS 横屏验证操作、切后台恢复、刘海区域、资源占用和帧率。

微信包使用非调试模式和必要的引擎模块裁剪，不包含 Web 预览模板与 Node 开发依赖。`game.js`、`game.json`、`project.config.json` 和平台适配代码由 Creator 官方构建器生成。代码无需 `window/document/localStorage`；构建包中的官方引擎适配器出现这些名称属于引擎提供的兼容层。

**微信开发者工具与手机真机运行尚未验证。成功生成包不代表已经通过微信端验收，也未执行上传或发布。**

官方说明：[命令行构建](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/publish-in-command-line.html)、[发布到微信小游戏](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/publish-wechatgame.html)。

## 自动验证

```powershell
npm run typecheck
npm test
npx playwright install chromium
npm run test:browser
npm run verify:delivery
```

浏览器测试会启动预览服务，需要先构建 Web。测试读取 `globalThis.__BREAKOUT__.snapshot()` 的只读状态；完整通关只使用真实键盘事件，不通过传送、加血或删除敌人完成。触控测试启用 `hasTouch`，使用 CDP 同时发送三根手指。

证据保存在 `reports/`：阶段移动截图、首页、暂停、失败、通关、手机触控、竖屏适配截图，以及浏览器测试报告和完整一局的状态记录。取消触摸测试会单独记录 Cocos/Chromium 的已知不可取消事件提示，见 `DEVELOPMENT.md`。

## GitHub Pages 发布

仓库：`https://github.com/yangfan19900209/stickman-breakout`。Pages 地址：`https://yangfan19900209.github.io/stickman-breakout/`。

Pages 使用 `main` 分支的 `/docs` 目录。`docs` 是 Creator Web Mobile 构建的发布副本，包含 `.nojekyll`，不会经过 Jekyll 转换；游戏入口与引擎资源均使用相对路径，适用于项目站点的子目录。源码仍在 `assets/`，修改源码后必须先重新构建游戏再更新发布副本。

```powershell
npm run build:web
# 完成本地测试、更新验收记录后准备发布副本：
npm run pages:prepare
git add assets build-config build-templates settings scripts package.json package-lock.json docs
git commit -m 'Update game and Pages build'
git push origin main
```

`pages:prepare` 会检查构建文件数量/字节数、逐文件验证复制内容，只清理此前由该脚本生成的发布文件。GitHub 在推送后自动部署 Pages；可在仓库 Actions 中查看 `pages build and deployment` 的结果。`docs/version.json` 提供线上包指纹。

## 源码入口

| 文件 / 目录 | 职责 |
| --- | --- |
| `assets/scripts/GameManager.ts` | Cocos 组件装配、固定步长循环与表现 |
| `core/GameConfig.ts` | 玩家、武器、敌人、对象池与绘制参数 |
| `core/GameSession.ts` | 游戏状态和模拟更新顺序 |
| `core/InputManager.ts` | 设备无关输入，按键和多指所有权 |
| `player/PlayerController.ts` | 移动、跳跃、伤害、无敌和死亡 |
| `render/StickmanAnimator.ts` | 头、肩、肘、手、髋、膝、踝关节姿态 |
| `render/StickmanRenderer.ts` | Graphics 绘制、朝向和武器 |
| `combat/` | 步枪、扫掠子弹碰撞、子弹池、粒子池 |
| `enemy/` | 两类士兵与简化守卫、状态机、数据生成 |
| `level/` | 4000 单位关卡数据、轴向碰撞、出口条件 |
| `camera/CameraFollow.ts` | 平滑水平跟随和边界约束 |
| `ui/HUDController.ts` | HUD、四类面板、持续触控按钮 |
| `platform/` | Cocos 键盘/触摸事件、后台暂停和调试接口 |

修改参数与关卡后重新构建 Web / 微信包；已有构建包不会自动更新。完整功能状态、验证范围和后续迭代记录见 `DEVELOPMENT.md`。
