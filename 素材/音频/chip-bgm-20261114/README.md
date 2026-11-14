# 两关芯片背景音乐

2026-11-14。用户认可原 100 BPM《土耳其进行曲》的音色，要求普通游玩放慢到 80 BPM、Boss 战为 120 BPM，并增加《卡农》、移除走路声。原试听目录完整保留，认可范围仅为音乐音色；见[原版](../turkish-march-100bpm/README.md)。

| 使用场景 | 80 BPM 普通关卡 | 120 BPM Boss 战 |
| --- | --- | --- |
| 第一关：陆地 | [土耳其进行曲](output/turkish-march-80bpm.mp3) | [土耳其进行曲](output/turkish-march-120bpm.mp3) |
| 第二关：水下 | [卡农](output/canon-80bpm.mp3) | [卡农](output/canon-120bpm.mp3) |

每段为 64 拍循环，80 BPM 长 48 秒，120 BPM 长 32 秒。四段独立合成，改变节拍时间，保持音高；没有用音频倍速改变音高。保留脉冲波主旋律、合成低音及轻鼓点。《卡农》使用第一小提琴第 8–72 拍，辅以错开 8/16 拍的循环模仿声部和原低音。两曲均为缩编循环，并非完整演奏。

## 文件与复现

- `output/*.mp3`：可直接试听，也与 `源码/assets/bgm/` 的运行文件逐字节一致；96 kbps / 44.1 kHz / 双声道，四段共约 1.92 MB。
- `output/*.wav`：16-bit PCM 母带；相应 JSON 保存源 MIDI 哈希、帧数、循环边界。
- [manifest.json](output/manifest.json)：最终 MP3 的 SHA-256、时长及响度测量。四段约 -16 LUFS，真峰值低于 0 dBFS。
- [AUDIO-CREDITS.txt](AUDIO-CREDITS.txt)：作曲、源谱、排版、授权及本次改编说明；同步进入运行音乐分包和微信构建模板。
- [render.mjs](render.mjs)：以选定速度重新合成；[build.mjs](build.mjs)：生成四段、统一响度、编码并安装运行文件，保留已有 `.meta` UUID。

在本目录运行 `node build.mjs`，需要 Node.js 和 FFmpeg（可用 `FFMPEG` 指定路径）。此命令只更新音乐及其元数据，不启动 Cocos，也不更改 Windows 的构建入口、依赖版本或锁文件。只重新编码已有母带可加 `--encode-only`。

《土耳其进行曲》沿用原目录的 Mutopia 公有领域曲谱；《卡农》源谱与 MIDI 来自 [Mutopia 条目 2047](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2047)，排版 © 2015 Michael Fischer v. Mollard，CC BY 4.0。原始压缩包与提取 MIDI 保存在 `source/`，改编说明及授权链接见署名文件。

## 游戏内行为与验收边界

源码已接入普通 80 / 大小 Boss 120 BPM；按真实激活与存活状态切换，击败小 Boss 后恢复 80 BPM，最终胜利与结算停止音乐。切换保留乐句拍位置并作约 0.28 秒交叉淡化。音乐与战斗音效分开播放，原声音开关同时控制两者。菜单、暂停、竖屏、原生页面和视频广告期间不启动音乐；前后台沿用原有游戏暂停状态，手动继续才恢复。脚步声已停止加载和派发，战斗音效保留。

已通过 569 项逻辑回归、类型检查、9 项 Mac 工具链检查及音频解码/响度检查。19:32 用户普通终端 CLI 构建成功，四段音乐已进入 `bgm` 分包，资源索引和音频哈希一致；[微信音乐固定包](../../../交付/版本/1.0.7/历史测试包/1.0.7-mac-2026-11-14T11-37-21-211Z-70230/wechatgame)与 ZIP 已生成并完成解压核验。此前漏资源和执行器 SIGABRT 的历史证据保留在[本轮验证](../../../开发进度/验证记录/background-music-20261114/README.md)。手机播放、循环间隙和广告返回听感仍待真机验收。
