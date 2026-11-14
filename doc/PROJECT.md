# 运行与构建

当前正式交付版本 1.0.8，Cocos Creator 3.8.8。当前开放前两关，第三关样段继续保留但未开放。功能进展见[当前进度](../开发进度/当前进度.md)，本文件只维护现行操作方法。

## 工程位置

在 Creator 中打开 **`源码/`**，其中的 `package.json`、`assets/`、`settings/` 和 `build-config/` 构成实际工程。仓库根目录用于资料管理。

所有 npm 命令在 `源码/` 执行。新机器先运行 `npm ci`，现有依赖不需要重复安装。美术处理工具会访问同级的 `素材/游戏美术/`，因此完整移交时应保留整个工作区布局。

## 常用命令

```powershell
cd 源码
npm run typecheck
npm test
npm run check:project
npm run preview
```

试玩地址为 `http://127.0.0.1:4190`。第二关调试使用 `/level02.html`；第三关目前关闭，旧的 `/level03.html` 入口会回到首页。

键盘：A / D 或方向键移动，Space 跳跃，J 开火，P 暂停，Esc 返回或恢复。触屏使用左侧浮动摇杆和右侧动作按钮；实际支持以界面提示为准。

## 生成游戏包

Windows 设置引擎路径后，继续使用原有 PowerShell 构建流程：

```powershell
$env:COCOS_CREATOR = '你的安装目录\CocosCreator.exe'
npm run build:web
npm run build:wechat
```

macOS 使用独立的 [Mac开发.command](../Mac开发.command)，首次选 `1`；或者在 `源码/` 执行下列命令。无需先打开 Creator 编辑器窗口。Windows 原有命令保持不变，详细入口、依赖安装与上传步骤见 [Mac 开发说明](MAC-DEVELOPMENT.md)。

```sh
bash scripts/mac/setup.sh
bash scripts/mac/run.sh build wechatgame
# 只检查启动参数，不执行构建：
bash scripts/mac/run.sh build wechatgame --dry-run
```

不要同时从编辑器和命令行构建同一工程。Mac 命令行使用工程内独占锁，构建结束后释放；异常中断留下锁时，先确认原进程已退出再清理。启动器要求新的入口文件、构建完成标记且无缺失脚本报错，然后执行平台后处理，不能把残留旧包当成成功产物。

结果在 `源码/build/web-mobile/` 和 `源码/build/wechatgame/`，构建日志在 `开发进度/验证记录/构建日志/`。`build/`、`library/`、`temp/`、`.test-build/` 是可重建内容，不是素材原件；不提交依赖和缓存。

早期适配阶段仅完成编辑器微信启动，CLI与浏览器当时尚未验证，原记录见[Mac适配记录](../开发进度/验证记录/mac-workflow-20261114/README.md)。下文记录后续已取得的验证结果。

2026-11-14 本机验证：此前受限自动化进程在应用初始化阶段收到 `SIGABRT`；本次经执行工具正式沙箱外授权，同一 CLI 模块已完成微信和 Web 构建，两关浏览器移动 / 开火、音频加载和暂停恢复通过，见[续接验证](../开发进度/验证记录/combat-audio-20261114/continuation/README.md)。本次使用现有离线依赖和独立浏览器运行库，完整 `setup.sh` 锁定依赖初始化尚未验证；实际上传和真机仍待验证。此前编辑器证据保留在[本地微信验证](../开发进度/验证记录/mac-20261114/README.md)。

11-14 后续六项玩法反馈已完成 587 项逻辑回归、同源双平台 CLI、第二关浏览器通关及小 Boss 五模式观察，固定包与当前验证见[本轮记录](../开发进度/验证记录/ocean-feedback-20261114/README.md)。

11-14 再次按用户反馈提前第一关血包、移动油桶，第二关改为分轮多方向攻击与炮筒追踪火箭。591 项回归与双平台 CLI 通过，[验证与新包](../开发进度/验证记录/supplies-patterns-20261114/README.md)和[按路线阅读的配置说明](../开发计划/关卡/道具清单/两关配置说明-20261114.html)分别记录实现证据与敌人／道具布置。

Web 构建完成并启动试玩服务后：

```powershell
npm run test:smoke
npm run verify:delivery
```

启动检查覆盖两关资源加载、正常按键移动/开火、暂停与恢复。它不替代完整通关或微信真机验收。完整两关专项仍可使用 `node scripts/verify-v104-campaign.mjs`；分享宿主模拟使用 `node scripts/verify-v104-share.mjs`，均要求本地试玩服务已启动。

## 固定交付与发布

`源码/build/` 随构建更新；`交付/版本/<版本号>/` 为已固定的交付包，不覆盖历史版本。每次实际发布前关联本轮测试、更新说明和新包哈希。历史固定包保持原字节内容，见[交付入口](../交付/README.md)。本次 Mac 构建输出不覆盖原有 1.0.7 固定交付。

GitHub Pages 使用根目录 `docs/`，配置保存在 `源码/scripts/github-pages.json`。`npm run pages:prepare` 在验证通过后生成该目录；此命令会更换本地 Pages 文件，不代表已经发布。`npm run pages:check` 对配置的网站执行只读核验。当前本地 Pages 快照是 0.5.9，不应与当前 1.0.8 包混用。

微信上传工具 `npm run upload:wechat -- --key <密钥绝对路径>` 仅在获得明确上传指示时使用。上传、送审、公开发布和设备验收分别记录，密钥不放进工程或游戏包。

## 恢复与维护

修改前可运行 `npm run checkpoint -- PRE-任务名-日期`，生成包含源码、美术来源、文档和构建的工作区归档。它不是新的用户认可记录。旧锚点不可覆盖，恢复到新的空目录；详见[体验基准](BASELINES.md)和[历史归档](../历史归档/README.md)。

本次目录整理的清理清单、路径映射、前后哈希和验证结果存放在[工程整理记录](../开发进度/工程整理/2026-11-13/README.md)。

本轮复活/选关专项：`源码/scripts/verify-v106-ui.mjs` 和 `verify-v106-campaign.mjs` 可通过 `PREVIEW_URL` 指定待验包的本地服务。固定的 1.0.6 复活选关包见 [交付目录](../交付/版本/1.0.6-复活选关)，其结果与构建输入独立保存。

11-14 正式交付版本已整理为1.0.8，见[更新说明](../交付/更新说明/1.0.8-更新说明.md)和[发布验证](../开发进度/验证记录/v108-release/README.md)。微信与Web固定包统一放在 `交付/版本/1.0.8/`，此前12个1.0.7开发包原样移入 `交付/版本/1.0.7/历史测试包/`。
