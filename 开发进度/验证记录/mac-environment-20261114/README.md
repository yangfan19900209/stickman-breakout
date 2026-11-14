# Mac 环境与 Windows 保留核对 · 2026-11-14

本记录单独保存 Mac 环境适配，源码版本为 **1.0.7**，Creator **3.8.8**。Windows 对照基准为 `7f19bd47578286cd8b267b5624ffda59bd62a1c7`。Mac 使用独立入口与脚本，不改变原 Windows 构建、试玩、检查和上传方式。

## 当前入口

- 双击根目录 [Mac开发.command](../../../Mac开发.command)，首次选 `1`。
- 命令在 `源码/` 执行，使用 `bash scripts/mac/run.sh ...` 或 `mac:*` npm 别名。
- 实现集中在 [scripts/mac](../../../源码/scripts/mac)，测试在 [tests/mac](../../../源码/tests/mac)。
- 完整用法与故障边界见 [Mac 开发说明](../../../doc/MAC-DEVELOPMENT.md)。

## Windows 保留范围

| 对照项 | 本次处理 |
| --- | --- |
| 根目录原 `.cmd` 入口 | 保持原字节内容 |
| `build-cocos.ps1`、`upload-wechat.mjs` | 保持原字节内容 |
| `serve.mjs`、`verify-project.mjs` | 恢复并保留原字节内容；Mac 实现已放入独立目录 |
| `package.json` | 只增加 `mac:*` 命令；原有全部命令与其他字段不变 |
| `package-lock.json`、TypeScript 配置、构建配置及模板 | 保持原字节内容 |
| 游戏代码、美术资源、Web 壳、运行版本号 | 不变 |
| 原 `project-structure.json` | 保留 Windows 原记录；Mac 记录另存 `mac/project-structure.json` |
| 本机 Cocos 登录状态与服务配置 | 留在本地，不提交到 GitHub；远端设置保留基准版本 |

逐文件 SHA-256 与提交范围见 [验证结果](validation.json)。此核对证明源码和配置没有被 Mac 适配替换，不代表在 Windows 机器上重新执行过构建。

## 技能安装状态

已在本机 `~/.codex/skills/yangfan-game-development/` 检查到“杨帆游戏开发体系”。共 **14 个文件**，与项目副本逐文件哈希一致，`SKILL.md` 和自动调用配置均存在。本轮不修改技能内容；项目仍以 `doc/skills/yangfan-game-development/` 为维护源。

## 验证与未完成项

- 隔离后的 Mac 工具链 **8 项回归通过**，涵盖构建结果检查、分包、密钥排除、文件改动识别、ZIP 实际解压哈希和仅源码检查模式。
- Bash / JavaScript 语法、Mac 源码结构和实际安装路径 dry-run 通过。
- 同日先前已通过 **524 项逻辑测试**及类型检查；依赖来自临时离线环境，TypeScript 5.8.2、Creator types 3.8.8-121517，不能认定锁文件环境已验证。本轮仅调整开发入口隔离，沿用该逻辑结果，不虚报重新执行。
- 同日 Creator 编辑器微信构建成功，微信工具中已观察到首页与第一关启动；包检查及社交后处理通过。此前证据见 [本机微信构建](../mac-20261114/README.md) 与 [第一阶段适配](../mac-workflow-20261114/README.md)。
- 当前自动化执行环境缺少完整 npm 依赖；Creator 原生命令行启动曾在 AppKit 初始化时 `SIGABRT`，本地 HTTP 监听返回 `EPERM`。普通终端的完整初始化、双平台 CLI 构建和浏览器全流程仍待验证。
- **未执行微信开发版本上传、送审、公开发布或真机验收。** 本轮 GitHub 上传只保存 Mac 开发支持与记录，不替代这些步骤。

原始日志、机器路径快照、构建产物和缓存留在本机。GitHub 保存可复用脚本、必要说明、公开验证摘要及 Windows 保留清单，不上传账户状态或私钥。

## GitHub 上传完成

Mac 适配已通过 [提交 acba1b2](https://github.com/yangfan19900209/stickman-breakout/commit/acba1b204a99f32383b4cad49cfbb682c8002419) 更新到 `main`。重新读取远端主分支确认提交一致、改动范围为预定 32 个文件，并核对远端 `package.json` 与本地内容一致。用户已明确确认目标分支；更新采用非强制快进和预期基准校验。

完整回执见 [GitHub 上传成功记录](github-upload-success.json)。原有 94 个受保护文件和 17 条 npm 命令保持不变；随后仅补存本文、验证摘要和计划/进度中的上传状态。

本次通过 GitHub 连接完成提交；本地 `.git` 受执行环境限制，HEAD 尚未同步到远端。本机 Cocos 登录状态和服务配置仍只保留在本地。GitHub 上传成功不代表微信开发版本上传、CLI 全流程或真机验收通过。

## GitHub 同步范围与上传过程

本轮选择 32 个文件保存 Mac 开发入口、独立脚本、测试和验证记录，不包含本机 Cocos 账号配置、构建缓存或产物。Windows 保留范围按上表与 `validation.json` 核对。

前两次连接写入返回 `403 Resource not accessible by integration`，请求在创建提交树阶段被拒绝。随后截图显示 GitHub 应用安装被暂停；恢复启用后重试，已成功创建提交树和提交，说明本次连接的写入能力已恢复。不能只凭此前的 403 就断言账号或应用没有写权限。

首次推进 `main` 时，自动审批要求用户明确确认目标分支，因而该次分支更新未执行。上述为上传过程的历史快照，见 [上传尝试记录](github-upload-attempt.json)；最终是否进入主分支，以 [GitHub main](https://github.com/yangfan19900209/stickman-breakout/tree/main) 为准。后续更新采用已核对的远端基准、非强制快进和分支预期值校验。

本地命令执行权限与 GitHub 应用授权分别检查：恢复应用不会改变本会话的本地沙箱限制，也不代表微信开发版本已上传或真机验收通过。
