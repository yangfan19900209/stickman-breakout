# 源码

这是 **Cocos Creator 3.8.8 工程根目录**。用 Creator 打开本文件所在的文件夹，在这里执行 npm 命令。

| 目录 | 内容 |
| --- | --- |
| `assets/scripts/` | 游戏逻辑、呈现、输入和平台接入 |
| `assets/scenes/` | 启动场景 |
| `assets/resources/`、`assets/landart/`、`assets/level02/`、`assets/level03/` | 引擎实际加载的运行资源，必须保留 `.meta` |
| `scripts/` | 当前构建、素材处理、验证和维护工具 |
| `tests/` | 仍有用途的逻辑回归及历史浏览器专项 |
| `settings/`、`build-config/`、`build-templates/` | 引擎和平台构建设置 |
| `web-shell/` | 网页适配、离线缓存与调试入口 |
| `build/`、`library/`、`temp/`、`.test-build/` | 本机生成内容，可重建、不提交 |

```powershell
npm run typecheck
npm test
npm run check:project
npm run preview
```

构建与交付的完整用法见[运行与构建](../doc/PROJECT.md)。美术源文件在[素材](../素材/README.md)，验证结果写入[开发进度/验证记录](../开发进度/验证记录)。

Mac 使用仓库根目录的 [Mac开发.command](../Mac开发.command)，或在这里运行 `bash scripts/mac/run.sh menu`。首次运行 `bash scripts/mac/setup.sh` 安装项目独立 Node/npm 和锁定依赖；不要求预先安装 Homebrew。日常使用 `bash scripts/mac/run.sh dev`、`build wechatgame`、`package`，完整步骤见 [Mac 开发说明](../doc/MAC-DEVELOPMENT.md)。Windows 原来的 `build:web`、`build:wechat` 和上传命令保持不变。

旧版编号不代表测试或图集已经无用。当前逻辑测试仍覆盖早期修复；浏览器旧专项按适用版本选用，当前启动验证使用 `npm run test:smoke`。已归档的一次性旧版工具不再列为现行命令。
