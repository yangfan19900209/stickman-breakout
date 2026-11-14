# Mac 开发、构建和上传

本工程使用 Creator 3.8.8。Mac 和 Windows 都可以从命令行启动构建，不需要先手动打开 Cocos 编辑器窗口。Mac 新增独立入口，Windows 继续使用原有 PowerShell 和 `.cmd` 文件。

用户在 2026-11-14 再次明确日常构建走命令行。19:32 用户普通终端已完成音乐版微信 CLI 构建；20:25 至 20:26，本次代理通过执行工具正式沙箱外授权完成含攻击音效修改的微信和 Web CLI 构建。两关浏览器冒烟与独立固定 ZIP 核验通过，见[最新续接验证](../开发进度/验证记录/combat-audio-20261114/continuation/README.md)。不需要先打开编辑器窗口。

Mac 的预览和源码结构检查分别位于 `scripts/mac/serve.mjs`、`scripts/mac/verify-project.mjs`。原 `scripts/serve.mjs`、`scripts/verify-project.mjs` 与 Windows 构建/上传脚本保持原文件内容。`package.json` 只增加 `mac:*` 命令，原有命令、依赖版本和锁文件不变。独立核对记录见 [Mac 环境归档](../开发进度/验证记录/mac-environment-20261114/README.md)。

当前发布准备使用 **1.0.8**，正式包在 `交付/版本/1.0.8/`，见[交付入口](../交付/README.md)。下文的1.0.7构建次数和日期属于历史过程，最新验证以[1.0.8发布记录](../开发进度/验证记录/v108-release/README.md)为准。

## 首次使用

双击仓库根目录的 [Mac开发.command](../Mac开发.command)，选择 `1`。它依次执行：

1. 检查 CPU 架构，从 Node.js 官网下载项目独立 Node 24.22.3，并校验 SHA-256；运行 `npm ci` 安装锁定依赖。
2. 类型、逻辑、工程结构和工具链检查。
3. 串行构建 Web、微信包，执行对应后处理。
4. 在独立本地端口启动 Web 包，执行两关启动、移动/开火和暂停恢复冒烟。
5. 检查交付条件，生成独立微信固定目录与 ZIP，解压回验哈希。

此选项不会上传、送审或发布。依赖和运行环境位于 `源码/local/mac/`，不修改全局 Node、Shell 配置或锁文件；旧的临时依赖先备份，安装失败时恢复。需要终端可访问 Node.js 官网及 npm registry。已安装 Creator、微信开发者工具和 Google Chrome。

也可从普通终端执行；以下命令均在 `源码/` 内：

```sh
bash scripts/mac/setup.sh
bash scripts/mac/run.sh verify
```

## 日常命令

| 操作 | 不依赖全局 npm 的命令 | npm 别名 |
| --- | --- | --- |
| 环境诊断 | `bash scripts/mac/run.sh doctor` | `npm run mac:doctor` |
| 代码与工具检查 | `bash scripts/mac/run.sh test` | `npm run mac:test` |
| 仅工具链回归 | `bash scripts/mac/run.sh test-tooling` | `npm run mac:test:tooling` |
| 构建 Web 并打开试玩 | `bash scripts/mac/run.sh dev` | `npm run mac:dev` |
| 构建微信包 | `bash scripts/mac/run.sh build wechatgame` | `npm run mac:build:wechat` |
| 仅构建 Web | `bash scripts/mac/run.sh build web-mobile` | `npm run mac:build:web` |
| 完整本地验证并固定打包 | `bash scripts/mac/run.sh verify` | `npm run mac:verify` |
| 固定当前成功构建 | `bash scripts/mac/run.sh package` | `npm run mac:package:wechat` |
| 微信开发者工具打开包 | `bash scripts/mac/run.sh open-wechat` | `npm run mac:open:wechat` |
| 本地上传前检查 | `bash scripts/mac/run.sh upload-check` | `npm run mac:upload:check` |
| 上传开发版本 | `bash scripts/mac/run.sh upload` | `npm run mac:upload:wechat` |

只有安装了全局 npm，或在当前终端先执行 `source scripts/mac/env.sh`、`mac_find_node` 后，才能直接使用 npm 别名。根目录入口和 `bash scripts/mac/run.sh ...` 自动定位项目 Node；也可在仓库根目录执行 `./Mac开发.command build wechatgame`。带参数调用不会等待按键退出。

Web 试玩默认为 `http://127.0.0.1:4190`，第二关为 `/level02.html`；关闭试玩服务按 Ctrl+C。只核对 Creator 启动参数可以使用 `bash scripts/mac/run.sh build wechatgame --dry-run`，不会生成新包。`inspect` 只检查已有微信包结构，不证明它由当前源码构建。

## 构建与固定包

默认 Creator 路径为 `/Applications/Cocos/Creator/3.8.8/CocosCreator.app`；微信工具为 `/Applications/wechatwebdevtools.app`。非默认位置可设置 `COCOS_CREATOR`、`WECHAT_DEVTOOLS` 为相应 `.app` 或 CLI 的绝对路径。

直接执行 Creator 的 `Contents/MacOS/CocosCreator --project ... --build ...`。命令参数通过数组传递，工程路径含中文和空格无需修改。成功必须同时满足允许的退出码、对应平台完成标记、新的入口文件和无缺失脚本错误，然后才执行社交脚本、分享封面或 Web 壳后处理。构建输入前后做哈希比较；不能把失败时残留的旧包固定交付。

不要从编辑器和命令行同时构建同一工程。Mac CLI 使用 `源码/temp/creator-cli-build.lock`，只清理自己持有的锁；异常中止留下锁时，先核对其中 PID 和实际进程是否结束，再清理该锁。

共享输出在 `源码/build/`。Mac 固定包写入 `交付/版本/1.0.7-mac-<时间>-<进程号>/`（版本随项目变化），内含 `wechatgame/`、ZIP、更新说明和 `manifest.json`。已有版本包和体验锚点不会覆盖。当前包指针、各轮构建输入/输出指纹、测试、诊断、上传回执保存在 `开发进度/验证记录/mac/`。

固定包排除 `.DS_Store`、微信个人配置和编辑器元数据；任何 `.pem` / `.key` 会阻止打包。上传前再核对源码、最近成功构建、固定目录、ZIP 和测试记录。包体数字是原始文件大小，微信实际上传压缩大小以工具回执为准。

## 上传开发版本

菜单 `8` / `upload` 是明确的上传动作，调用微信开发者工具自带 CLI，使用工具中已经登录的账号。先完成 `test`、`build wechatgame`、`package`，或直接完成一次 `verify`，再执行 `upload-check`。`open-wechat` 优先打开与本轮构建一致的固定包；没有固定包或最新构建尚未固定时打开共享构建目录，并提示实际选择。

若微信 CLI 提示服务端口未开启，在微信开发者工具“设置 → 安全设置”中按提示开启 CLI 服务；若配置了访问令牌，通过 `WECHAT_DEVTOOLS_CLI_TOKEN` 环境变量传递，不写入项目。脚本不自动修改工具安全设置。上传时会显示版本、AppID 和固定目录；使用该版本的 `交付/更新说明/<版本>-update.txt`。本地 `upload-check` 不会连接上传接口，也不能证明账号权限或平台审核结果。

上传成功必须有 CLI 成功退出和非空 JSON 回执；不会自动送审或上线。Windows 的 `npm run upload:wechat -- --key <密钥路径>` 保留原有行为。

## 当前实测边界与排错

### 早期适配记录（以下为当时状态）

2026-11-14：独立入口、包检查、ZIP 回验和保护逻辑已有本机测试；原先通过编辑器构建的微信包可启动。普通终端中的初始化、Creator CLI 完整构建、浏览器回归和实际上传仍待首次执行，不能视为已全部打通。详见 [Mac 入口适配记录](../开发进度/验证记录/mac-workflow-20261114/README.md)。

当前代理的受限执行进程启动 Creator 时，在进入构建前出现 `SIGABRT`，系统栈指向 AppKit / `_RegisterApplication`；这不等于 Mac 不支持 CLI，也不能推断用户普通终端必然失败。电脑控制工具拒绝操作系统 Terminal，因此没有经由该工具完成普通终端对比；未尝试其他方式绕过限制。

同一执行器绑定本地 `127.0.0.1` 预览端口也返回 `EPERM`，因此浏览器服务的实跑同样待普通终端验证；不通过换启动渠道绕过工具权限。

### 后续验证进展

2026-11-14 攻击音效续接轮：代理经正式执行授权完成双平台 CLI 构建、577 项逻辑回归、离线类型检查、10 项工具链检查和两关浏览器音频冒烟。微信固定包为 477 个游戏文件，音效 / 音乐资源与 ZIP 解压哈希通过。完整环境初始化、锁定依赖、实际上传与真机仍待验证：本次使用现有 Node 24.22.1、TypeScript 5.8.2、Creator types 3.8.8-121517，并通过独立 Playwright 1.62.1 运行系统 Chrome，未修改项目依赖或锁文件。原始边界见 [Mac 入口适配记录](../开发进度/验证记录/mac-workflow-20261114/README.md)，最新结果见 [续接验证](../开发进度/验证记录/combat-audio-20261114/continuation/README.md)。

代理的受限执行进程启动 Creator 时，在进入构建前出现 `SIGABRT`，系统栈指向 AppKit / `_RegisterApplication`；用户随后在普通终端执行相同构建模块成功，说明需要区分启动环境，不能归因为 Mac 不支持 CLI。电脑控制工具未用于操作 Terminal；该次终端命令由用户执行。

11-14 后续排查：20:04:57 的系统崩溃报告仍停在 `_RegisterApplication` → `NSApplication`，构建 stdout / stderr 为空、`creator.log` 尚未创建。尝试通过正式执行授权运行同一构建命令时，在启动前被宿主权限策略拒绝：当前 `approval_policy.granular.sandbox_approval=false`，不允许提出沙箱外执行申请。这次拒绝没有运行 Creator，不能作为新的构建尝试或修复成功记录。

20:25 的新会话已允许正式执行申请：同一 `scripts/mac/build.mjs` 在沙箱外完成微信构建约 20 秒，随后完成 Web 构建约 36 秒；本轮不再出现启动阶段 `SIGABRT`。后续遇到相同启动栈，先在执行工具中为具体 CLI 命令申请所需权限，不要求用户在未经核实的 Mac 界面位置寻找 Windows 控件。若宿主拒绝，项目脚本不能改变会话权限，也不通过 Terminal 控制、launchctl、后台转发服务或切换编辑器界面绕过。此修复只确认本机该启动环境，不把所有 `SIGABRT` 都归因权限。

官方说明：[权限模式](https://learn.chatgpt.com/docs/permission-modes)、[granular.sandbox_approval 配置](https://learn.chatgpt.com/docs/config-file/config-reference)。本轮没有修改应用权限或 Windows 构建配置。

此前受限执行器绑定 `127.0.0.1` 返回 `EPERM`；本次经正式执行授权启动现有 Mac 预览服务和无界面 Chrome，两关正常输入及音频检查通过。相关授权只用于本地验证，不涉及微信上传。

“系统图形环境”不等于“打开编辑器窗口”。[Cocos 官方命令行文档](https://docs.cocos.com/creator/3.8/manual/en/editor/publish/publish-in-command-line.html)同时提供 Mac / Windows CLI，Jenkins 部分讨论的是服务进程访问系统窗口服务的条件。正常登录桌面后使用终端，通常已具备相应环境，不需要额外“打开会话”。若普通终端仍失败，保留本轮 `creator.log` / `stdout.log` / `stderr.log` 和系统崩溃报告，按发生阶段继续排查，不能只凭退出码认定是权限或游戏代码问题。

Mac 工程结构检查使用 `node scripts/mac/verify-project.mjs --source-only`，结果写入 `开发进度/验证记录/mac/project-structure.json`：只把 Git 明确忽略的本地历史构建、截图和运营材料列为 `unavailableArtifacts`；源码、资源和文档缺失仍失败。原 `npm run check:project` 的脚本与默认行为保持不变，适用于保存了全部本地历史材料的机器。浏览器冒烟不代替微信模拟器或 iPhone / Android 验收。

2026-11-14 后续六项玩法反馈轮：587 项逻辑测试、类型检查、同源双平台构建和第二关浏览器通关通过；479 个文件的独立固定包已解压核验。小 Boss 五种攻击与第一关 7 个实际显示箱子均有浏览器证据，见[最新记录](../开发进度/验证记录/ocean-feedback-20261114/README.md)。依赖环境和真机验证边界沿用上文，未实际上传。
