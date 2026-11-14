# Mac 本地微信构建与启动验证

本记录保留最初的编辑器构建与命令行失败证据。后续独立 Mac 入口和 Windows 原环境保留结果见 [Mac 环境独立记录](../mac-environment-20261114/README.md)，不要将本记录中的早期启动器状态视为最终入口。

日期：2026-11-14（北京时间）。版本 1.0.7，Cocos Creator 3.8.8，微信开发者工具 2.02.2609250 Stable，模拟器基础库 3.18.0。

## 本轮结果

| 检查 | 结果与边界 |
| --- | --- |
| 类型检查 | 通过，退出码 0，使用本机已有离线依赖 |
| 逻辑回归 | 524 / 524 通过，0 失败 |
| Cocos 微信包 | 通过；编辑器构建，11:15:34 开始，11:16:12 完成，约 38 秒 |
| 平台后处理 | `prepare-wechat-social.mjs` 已执行；开放数据域与分享封面一致性通过 |
| 包结构 | AppID、横屏、5 个分包、启动入口、引擎 settings 与开放数据域脚本通过 |
| 微信模拟器启动 | 首页正常显示；日志确认 604 帧图集加载完成、V1.0.7 ready、2 chapters available |
| 第一关 | 已观察到战斗画面，以及 `New run: Abandoned Base.` / `title → playing` 日志 |
| 输入回归 | 未完成：自动点击多次没有可确认结果，并出现用户改变窗口状态提示；不据此认定游戏输入缺陷，也不宣称移动、攻击、暂停或两关完整流程通过 |
| 真机 / 分享收发 / 推荐 / 好友榜 | 未验证 |
| 上传、审核、发布 | 本轮均未执行 |

启动控制台为 0 error、2 warning，内容为基础库 HarmonyOS 提示及首次启动 `gamecaches/cacheList.json` 不存在；游戏随后初始化成功。画面在工具截图中观察，未单独保存截图文件。模拟器截图后段顶部 HUD 出现裁切，尚未区分工具视口变化与游戏布局问题，保留为后续显示复核项。

## 构建入口与命令行边界

构建位置为 `源码/build/wechatgame/`，不覆盖 `交付/版本/1.0.7/历史测试包/1.0.7-社交复活/` 等历史固定包。

原 npm 构建命令固定调用 PowerShell。本轮增加 `源码/scripts/build-cocos.mjs`：Windows 委托原脚本；Mac 直接启动已安装的 Creator，保留日志、工程锁、产物新鲜度与缺失脚本检查，再执行原平台后处理。语法检查、Mac 微信参数解析、非法参数拒绝和实际启动失败处理已验证；Windows 分支未在本机运行。

Mac 命令行原始调用退出码 134；新启动器实际调用捕获 `SIGABRT` 并返回失败，没有把既有编辑器产物误判为命令行成功。macOS 崩溃记录显示在 `_RegisterApplication` / `NSApplication` 初始化阶段退出，构建日志尚未开始，具体根因未确定。当前自动化终端的完整 CLI 构建仍待解决，不能归结为 Mac 不支持命令行，也不能说所有 Mac 终端都存在同样问题。

成功的本轮构建来自编辑器：Dashboard 打开 `源码/`，在“项目 → 发布到 → 应用 → 微信小游戏”导入 `build-config/wechatgame.json`，再构建。不能直接使用面板默认 AppID；构建后执行项目的微信后处理，再导入微信开发者工具。

本机系统 PATH 没有 Node/npm。本轮实际使用 `/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node`（v24.22.1）。现有依赖是前一轮从 Creator 复用的 TypeScript 5.8.2、Creator 类型 3.8.8-121517 与 pngjs 3.4.0，详见 `dependencies.json`；不是按锁文件执行 `npm ci` 的完整环境，也不是 package.json 声明的 TypeScript 5.9.3。未改变依赖锁文件。

## 文件与数据

- `build-inputs-local.json`：构建前 750 项输入 SHA-256；构建及后处理完成时核对一致。随后仅修改 npm 启动命令、增加构建启动器和文档，游戏源码、资源、微信配置与后处理脚本均未变化；`validation-local.json` 记录最终对应关系。
- `build-wechatgame-editor.log`：本轮成功构建日志。日志中工作进程结束的两条 debug 级 `SIGTERM` 信息后有最终完成标记；未发现 Missing class / missing or invalid。
- `typecheck-local.log`、`logic-tests-local.log`：本轮类型检查和 524 项逻辑结果。
- `cli-launcher-local.log`：新启动器在当前终端失败的独立记录。
- `wechat-package-local.json`、`wechat-files-local.json`：包检查与逐文件 SHA-256。原始文件共 449 项，20,948,598 字节；其中主包目录文件 3,885,697 字节。它们是本地原始文件统计，不是微信上传压缩尺寸或平台限额验收。

本轮未修改玩法、运行资源、体验锚点或已固定交付。保留工作开始前已有的 `settings/v2/packages/information.json` 修改与 `cocos-service.json`。验证方法沿用项目现有分层证据和构建后处理规则；未确诊的启动与输入现象只记本次记录，暂不写入通用技能规则。
