# V0.6.3 封面与胜利演出

[文档目录](../../doc/README.md)

日期：2026-11-05。本轮使用内置 **image_gen** 生成欢呼动作，封面和结算由 Cocos 原生文字、线条与游戏现有素材组成。

## 成品资源

- 原始透明图：[art/source/v063/celebration.png](../游戏美术/source/v063/celebration.png)，2172×724，四个等宽单元。
- 游戏图集：[assets/resources/comic/celebration.png](../../源码/assets/resources/comic/celebration.png)，696,888 字节。仅重新编码 PNG；解码后的所有 RGBA 像素与原图完全一致，透明度保留，没有重绘、缩放或量化。
- 四张完整角色帧 `celebrate.0` 至 `celebrate.3`，每帧450×580，脚底同一基准。直接选帧播放，不拼接人物四肢，欢呼时不显示枪械。
- 参考角色：[direct.knife.idle.0.png](../游戏美术/slices/v057/direct.knife.idle.0.png)。头盔、背包、白色制服和黑线风格保持一致。

## 本次生成提示词规格

Create a production-ready 2D GAME ANIMATION SPRITE SHEET using the attached soldier as the strict character and style reference. Transparent background. Exactly FOUR full-body frames in ONE HORIZONTAL ROW, 1536x512 if possible, equal cells. Same friendly monochrome black-ink helmet, backpack, white uniform and boots. No knife or gun. Frames: hands at shoulder height with clenched fists; both fists overhead in a V; one fist overhead; both raised with a small bounce. Three-quarter view facing right. Same scale and baseline at 440, with margins. Opaque white fills. No ground, shadow, particles, text, borders or dividers. Match the reference line weight and keep clean open silhouettes.

工具实际返回2172×724，运行时按实际尺寸取帧；没有把指定尺寸当成已生成尺寸。

## 演出与操作

- 标题改为左侧大字、右侧战场的漫画海报，突出开始按钮；移除全屏和主屏幕说明按钮。
- 最终机甲死亡后，0.08/0.43/0.88/1.37/1.92秒依次爆炸；1.37秒强冲击配合闪光和镜头震动，受损、坍塌、残骸三个原图阶段衔接。
- 2.55秒开始推近，3.25秒切入完整举拳动画；5.8秒展开结算，6.55秒开放再战/返回首页。结算数字渐进显示，人物在卡片左侧持续欢呼。
- 演出冻结战斗用时和战果，停止射击/投雷/移动输入；暂停后从原时刻继续，重开清除状态。正常战斗击败Boss即可进入演出，不再要求走至出口。
- 屏幕震动始终有视觉反馈；微信调用 `wx.vibrateShort`，浏览器在支持时调用 `navigator.vibrate`。硬件请求测试使用模拟接口，**不等于真机已震动**。浏览器支持限制参考 [MDN Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate)。

## 本地构建

新增图集保持无损。微信构建使用 Creator 内置主场景分包，将 `internal` / `main` 交给引擎启动时预载，保持首包在4 MiB以内；资源仍在本地包内，没有远程素材地址。配置依据 [Cocos 3.8 小游戏分包文档](https://docs.cocos.com/creator/3.8/manual/en/editor/publish/subpackage.html)。

验证结果及真实画面见 [v063-verification.json](../../开发进度/验证记录/v063-verification.json)。本轮不上传、不发布；浏览器运行验证不替代微信开发者工具和手机真机验证。
