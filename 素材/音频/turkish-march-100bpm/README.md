# 《土耳其进行曲》慢速芯片音乐试听

2026-11-14。按用户要求制作：复古 FC 主旋律音色，搭配较丰满的低音和轻鼓点；速度固定为 **四分音符 = 100 BPM**，不使用快节奏鼓组。目前是试听素材，尚未导入 Cocos 或重新构建微信包。

| 文件 | 用途 |
| --- | --- |
| [turkish-march-100bpm-preview.mp3](turkish-march-100bpm-preview.mp3) | 首选试听，约 77 秒、1.54 MB；播放两轮后淡出 |
| [turkish-march-100bpm-loop.wav](turkish-march-100bpm-loop.wav) | 38.4 秒、64 拍循环母带，44.1 kHz / 16-bit PCM / 双声道 |
| [turkish-march-100bpm-preview.wav](turkish-march-100bpm-preview.wav) | 未压缩试听母带 |
| [render.mjs](render.mjs) | 无第三方依赖的 Node.js 合成与编排脚本 |
| [verification.json](verification.json) | 源文件哈希、节拍、采样、循环边界和编码检查 |

保留开头的 A 小调旋律及接续的 A 大调进行曲主题，选取源 MIDI 的前 64 拍，缩编为一段循环，并非全曲演奏。主旋律采用柔化的脉冲波，低音为三角波与 FM 合成，伴奏和鼓声由脚本合成；使用轻鼓点、较低伴奏音量，避免高速十六分音符踩镲。这里的“16-bit”同时包含复古音色方向及 PCM 母带精度，不声称严格模拟某款主机的声道或芯片限制。

## 曲谱与来源

- 作曲：W. A. Mozart，K.331 第三乐章 Rondo Alla Turca。
- 曲谱/MIDI：[Mutopia Project 原始条目目录](https://www.mutopiaproject.org/ftp/MozartWA/KV331/KV331_3_RondoAllaTurca/)。下载日期：2026-11-14。
- 排版：Rune Zedeler and Chris Sawer；条目标识 `Mutopia-2015/08/13-108`。
- 下载的 [LilyPond 主文件](source/KV331_3_RondoAllaTurca.ly) 明示 `license = "Public Domain"`。同时保存其 [音符文件](source/KV331_3_RondoAllaTurcaNotes.ly) 与 [MIDI](source/mozart-k331-rondo.mid)。
- 本次依照该 MIDI 重新合成与编排声音，未采样现成演奏录音。
- 源 MIDI 内的默认速度不作为演奏速度依据；本次直接以 100 BPM 重排事件时间，没有对音频降速变调。

## 复现

在本目录运行以下命令，需要 Node.js 和支持 libmp3lame 的 FFmpeg：

```sh
node render.mjs
ffmpeg -y -i turkish-march-100bpm-preview.wav -c:a libmp3lame -b:a 160k turkish-march-100bpm-preview.mp3
```

母带由脚本确定性生成；MP3 元数据随编码命令不同可能不同。循环版保持固定 64 拍，并将短反射声延续至下一轮。试听版连播两轮，便于检查 38.4 秒处的衔接，结尾淡出只属于试听版。

本轮已检查 MIDI 音符配对、采样数、文件可解码、峰值和循环边界；MP3 综合响度约 -15.9 LUFS，真峰值约 -2.8 dBFS，未发现数字削波。节奏、音色偏好及手机扬声器听感待用户试听，游戏中的音乐音量、切后台和广告期间暂停恢复尚未接入。
