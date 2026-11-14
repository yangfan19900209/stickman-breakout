# 攻击音效任务续接：构建、浏览器验证和固定交付

日期：2026-11-14（Asia/Shanghai），版本 1.0.7，Creator 3.8.8。继续上个对话卡在 `SIGABRT` 的构建任务；本次没有修改已完成的游戏逻辑、音效或 Windows 工具配置。

## 结果

| 检查 | 本次结果 |
| --- | --- |
| Creator 微信 CLI | 20:25:28–20:25:47，19.513 秒，退出码 36，完成标记 / 新入口 / 输入哈希通过 |
| Creator Web CLI | 20:26:16–20:26:52，35.888 秒，退出码 36，同一构建输入 |
| 逻辑 / 类型 / 工具链 | 577 / 577 逻辑、现有离线类型检查、10 / 10 Mac 工具链通过 |
| 工程结构 | 源码、文档和资源引用通过；Git 忽略的历史本地产物按源码检查模式单独列示 |
| 浏览器 | 两关加载、真实键盘移动 / 开火、音频加载和 Web Audio start、音乐暂停 / 恢复通过；已查看两张实际截图 |
| 固定微信包 | 477 个游戏文件，18 段 resources WAV、4 段音乐索引和字节哈希通过；ZIP 解压回验一致 |

[机器可读总结果](verification.json) · [类型日志](typecheck.log) · [577 项测试日志](tests.log) · [工具链日志](tooling.log) · [浏览器结果](browser.json) · [交付检查](delivery.json) · [完整输入指纹](inputs.json)。

[第一关截图](chapter-1.png) · [第二关截图](chapter-2.png)。本次只做两关启动与音频冒烟，没有宣称完整通关。Boss 招式与敌人实际攻击事件、火箭爆炸区分和半血补给规则由现有逻辑用例覆盖；两关真实 Boss 战听感仍待手机确认。

## 启动阻塞的处理

先前受限执行器在 AppKit / `_RegisterApplication` 阶段 `SIGABRT`，尚未进入构建；同机普通终端已有成功记录。前一会话正式请求又被宿主策略在执行前拒绝。

本次使用执行工具的 `require_escalated` 正式申请，仅运行现有 `scripts/mac/build.mjs`，获得批准后成功完成双平台构建。本地预览服务与无界面 Chrome 也通过正式执行授权运行。没有控制 Terminal、改用编辑器构建、降低成功判定或修改应用权限配置。

本轮命令在 `源码/` 执行：

```sh
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node scripts/mac/build.mjs wechatgame
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node scripts/mac/build.mjs web-mobile
bash scripts/mac/run.sh package
```

[微信构建回执](../../mac/builds/2026-11-14T12-25-28-326Z-wechatgame-80387/result.json) · [Web 构建回执](../../mac/builds/2026-11-14T12-26-16-834Z-web-mobile-80760/result.json)。各目录保留 `creator.log`、stdout、stderr 与输入清单。

完整 `setup.sh` 初始化仍未验证。本次 Node 24.22.1、TypeScript 5.8.2、Creator types 3.8.8-121517 来自现有离线环境，浏览器使用独立运行库的 Playwright 1.62.1 和系统 Chrome；没有把这些记录为项目锁定依赖通过。环境明细见 [environment.json](environment.json)。

## 浏览器首轮失败的解释

[首轮结果](browser-first-attempt.json)因第二关开火断言超时而失败。脚本一直按住方向 / 开火跨过入水演出；游戏正常清理过场前的输入，故过场结束后没有新的开火。保留了失败截图与快照，快照已观察到敌方 `enemy-shot` 发声。

修正验证脚本为通过正常右移进入过场、等待 `stage === swimming`，松开并重新按下键后，再检查移动与实际发弹。未调用调试接口跳过演出、传送或改变游戏状态，随后两关通过。实际执行脚本为 [verify-browser.mjs](verify-browser.mjs)。

## 固定包与边界

[微信导入目录](../../../../交付/版本/1.0.7/历史测试包/1.0.7-mac-2026-11-14T12-28-10-970Z-81318/wechatgame) · [ZIP](../../../../交付/版本/1.0.7/历史测试包/1.0.7-mac-2026-11-14T12-28-10-970Z-81318/stickman-breakout-1.0.7-wechat.zip) · [导入说明](../../../../交付/版本/1.0.7/历史测试包/1.0.7-mac-2026-11-14T12-28-10-970Z-81318/导入说明.md)。

- 构建输入 SHA-256：`9910a55b1c48187ba307c25e7285de078add04ac9deb2aa84c573a20d9adc7c0`。
- 微信包内容 SHA-256：`b8b5ad6a173f23a7462f4a35a1ea67250127b3864027cd5d701c89fb93269559`。
- ZIP SHA-256：`5e677f66c48cc41d3ecc5be849bd34fe1e67f53873054c1438ed1d8da55758dd`，20,995,426 字节。
- 原始文件总计 23,097,941 字节，主包 4,084,144 字节；这些是文件大小，不是微信上传压缩统计。

旧固定包与体验锚点保留。未上传 GitHub / 微信、未送审发布；微信模拟器、本轮手机触摸、听感、真实视频广告均未验收。

## 技能维护

按 `skill-creator` 与本体系自动维护规则，将经过验证的 Creator Mac 启动阶段排错与正式执行授权流程补入 `references/verification-and-delivery.md`。先比较项目 / 安装副本；安装侧没有独有修改，项目侧已有上一轮 `wechat-social.md` 增补也一并保留同步。格式与两侧文件集合 / SHA-256 结果见 [skill-validation.json](skill-validation.json)。
