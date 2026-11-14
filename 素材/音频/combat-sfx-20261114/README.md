# 敌人与 Boss 攻击音效、火箭声音重做

日期：2026-11-14。全部声音由本目录 `render.mjs` 的振荡器、滤波噪声和包络合成，未使用外部录音或采样。运行 `node render.mjs` 可跨平台复现；原 `源码/scripts/sound-assets.mjs` 也会调用此生成器，避免重新生成旧版火箭声。

| 文件 | 用途 | 时长 |
| --- | --- | --- |
| `rocket.wav` | 玩家火箭、敌方导弹：出膛冲击 → 延迟喷射 → 短尾音 | 0.62 秒 |
| `rocket-blast.wav` | 陆地火箭、重炮及 Boss 爆破弹：低频爆破与碎裂尾声 | 0.86 秒 |
| `enemy-shot.wav` | 普通敌人射击、鱼叉 | 0.105 秒 |
| `boss-shot.wav` | 坦克与机甲机枪、连射 | 0.18 秒 |
| `cannon.wav` | 炮台、坦克及 Boss 重炮发射 | 0.32 秒 |
| `beam.wav` | 陆地 / 水下 Boss 激光真正开始发射 | 0.85 秒 |
| `slam.wav` | 机甲踏地 / 跳砸实际落地 | 0.55 秒 |
| `charge.wav` | 坦克、机甲和小潜艇冲撞起步 | 0.46 秒 |
| `enemy-melee.wav` | 近战兵、盾击、鱼类扑咬和触手挥击 | 0.22 秒 |
| `enemy-sonar.wav` | 水下敌人声波、Boss 环形攻击 | 0.52 秒 |

运行文件在 `源码/assets/resources/audio/`，22,050 Hz、单声道、16-bit PCM，总计 207,050 字节；`output/manifest.json` 保存每段时长、峰值、RMS 和 SHA-256。重做前的火箭声保留在 `source/rocket-before-20261114.wav`。

[连续试听](output/combat-sfx-audition.wav)按表格顺序播放，每段间隔 0.45 秒，试听文件不打入游戏包。游戏内使用独立音量及距离衰减，同类齐射合并，普通枪声至少间隔 75 ms、其他敌方攻击至少 120 ms，每帧最多四类；玩家射击仍沿用自己的事件统计。

采样格式、首尾归零、无 PCM 削波及源码资源哈希已核验；实际设备听感待用户验证。源码已接入，当前代理执行器启动 Creator CLI 仍报 SIGABRT，本轮微信包待用户普通终端构建。见[验证记录](../../../开发进度/验证记录/combat-audio-20261114/README.md)。
