# 微信小游戏社交能力的调研与设计

适用范围：微信小游戏好友榜、分享邀请与 Cocos 开放数据域。以下是 2026-11-13 对官方文档与项目代码的核验方法，不代表已完成微信真机接入。平台能力会变化，实施时再次核对目标基础库与账号能力。

## 先区分关系链与权限

- `getFriendCloudStorage` 是同玩好友的托管成绩，`getPotentialFriendList` 是有限的未注册候选好友，二者都不等于完整通讯录。当前均在开放数据域内使用并需要 `scope.WxFriendInteraction`；“开放数据域无需授权”的旧教程不可直接采用。
- 关系链指南说明，写过托管数据才被视为玩过游戏；如需展示尚未通关玩家，应在用户同意相应数据处理后登记最小进度，而非只在通关时首次上传。
- 基础库 3.16.2 起另有 `getRelationFriendList`，使用独立的 `scope.interactedUserInfo` 并返回加密的同玩互动好友标识。它是另外一种受授权约束的能力，不能把旧子域数据回传限制泛化成“平台永远没有任何主域关系链接口”。也不能用它推论可读取完整通讯录。
- 隐私政策同意与朋友信息授权分开处理；拒绝时保留单人玩法。后台是否已声明、是否具备能力与接口定义存在是三件事。

来源：[关系链](https://developers.weixin.qq.com/minigame/dev/guide/open-ability/open-data.html)、[好友成绩](https://developers.weixin.qq.com/minigame/dev/api/open-api/data/wx.getFriendCloudStorage.html)、[候选好友](https://developers.weixin.qq.com/minigame/dev/api/open-api/data/wx.getPotentialFriendList.html)、[同玩互动好友](https://developers.weixin.qq.com/minigame/dev/api/open-api/data/wx.getRelationFriendList.html)、[小游戏隐私](https://developers.weixin.qq.com/minigame/dev/guide/open-ability/privacy.html)。

## 单向通信决定状态归属

主域可以给开放数据域发消息，子域不能向主域发消息。排行榜的好友资料、排序与自己名次留在子域绘制；主域只持有本人的游戏状态、卡片及界面命令。不要规划回传好友数组、子域 ready 回执或云端上传成功回执。

本人 `getUserCloudStorage` 也只在子域可用，而 `setUserCloudStorage` 可在两个域使用。设计无服务器的“取历史最好”时，要写清谁读、谁合并、谁写和谁显示同步状态；主域本机存档成功不等于云端成功。客户端读改写不能代替服务器事务，不承诺多设备并发严格单调或可靠防作弊。

不同接口返回字段存在 `openid/openId`、`nickname/nickName` 差异，按具体 API 校验，不能直接复用旧概览中的结构。本人头像查询当前使用 `openIdList: ['selfOpenId']`。

来源：[子域基础能力](https://developers.weixin.qq.com/minigame/dev/guide/open-ability/opendata/basic.html)、[读本人托管数据](https://developers.weixin.qq.com/minigame/dev/api/open-api/data/wx.getUserCloudStorage.html)、[本人信息](https://developers.weixin.qq.com/minigame/dev/api/open-api/data/OpenDataContext-wx.getUserInfo.html)。

## 分享路线分别设计

普通 `shareAppMessage` 可携带 query；子域 `shareMessageToFriend` 不能直接传 query，需主域先 `setMessageToFriendQuery`，并按接收端嵌套的 `query.query` 解析。当前定向参数长度上限 128，场景编号 0–50；图片走本地路径。接口存在回调不代表能确认接收者已经开始游戏；有效邀请与奖励需另有可验证事件。

冷启动与热启动都处理，并对同一入口去重。卡片目标关卡仍受正式开放范围与用户进度约束，query 不能当成绩、权限或奖励凭证。普通分享监听同步返回预先准备的卡片，不在监听内等网络请求。

自定义分享按钮在用户点击链内同步调用主动分享接口，不因动态卡片尚未生成而改成菜单操作提示。Cocos 渲染纹理的源 `ImageAsset` 可能在上传后释放，不能把 `texture.image.nativeUrl` 当作长期可用的分享文件来源。显式准备可直接访问的包内原画路径，在最终构建包验证文件存在、分包已加载且内容正确；独立卡片导出为空或失败时保留该路径。临时文件引发同步调用异常时，可在同一次点击中用稳定原画重试一次，清理输入和暂停也不应吞掉分享调用；这不代表所有平台异步拒绝都能被捕获，更不能据调用返回宣布分享成功。

宿主模拟应覆盖源图为空、图像未加载、导出为空/抛错、临时文件失效，并从实际页面触摸分享按钮验证调用时序。仅给模拟接口提供完美图片无法发现生产资源生命周期问题。浏览器的路径可读与调用成功仍不能代替微信真机面板和收卡验证。

群榜的 shareTicket 与 groupid 分路线核对。`getGroupEnterInfo` 返回加密数据 / cloudID，不能直接假设 `res.opengid` 存在；启用 withShareTicket 对分享目标和二次转发的影响也需要纳入产品设计。

来源：[普通分享](https://developers.weixin.qq.com/minigame/dev/api/share/wx.shareAppMessage.html)、[定向分享](https://developers.weixin.qq.com/minigame/dev/api/open-api/data/wx.shareMessageToFriend.html)、[定向 query](https://developers.weixin.qq.com/minigame/dev/api/share/wx.setMessageToFriendQuery.html)、[群数据](https://developers.weixin.qq.com/minigame/dev/api/open-api/data/wx.getGroupCloudStorage.html)、[群进入信息](https://developers.weixin.qq.com/minigame/dev/api/open-api/group/wx.getGroupEnterInfo.html)。

## 分享收益、复活与竞速资格

设计「分享后复活」等收益时，先核对当前具体分享接口是否提供完成证据。2026-11-13 核验的[官方普通分享类型](https://github.com/wechat-miniprogram/minigame-api-typings/blob/master/types/wx/lib.wx.api.d.ts)没有成功/取消回调，返回值为 `void`；不得使用 onShow、后台停留时长、按钮点击或请求计数伪造送达验证。当前[平台运营规范](https://developers.weixin.qq.com/miniprogram/product/#滥用分享行为)限制强制分享、暗示分享和无深度互动的利益分享，不应照搬旧教程的立即奖励；同时不能把该规则泛化为「所有好友互动活动都禁止」。实施时仍需复核当时规范和具体账号能力。

简单客户端首版可让复活独立可得、分享自愿；这是对需求的产品建议，应明确说明，不悄悄把用户要求的奖励机制改写为已完成。用户明确选择「发起请求即获得」时，把取消也会获得的结果说清楚；接口不存在、被禁用或调用抛错不算已发起，图片回退重试仍只算同一次操作。不增加虚构的发送回调或等待时长判定，也不将该产品规则写成平台认可。真正的好友助力需明确参与者的实质互动、活动规则、服务端身份/有效期/幂等验证与领取范围；后台证明互动发生也不等于平台自动认可活动。

复活或辅助机制接入竞速榜时，拆开「通关进度可保存」与「用时可竞争」；复活标记在当前关不可逆，保留累计操作时间及旧最佳，避免把辅助通关耗时合并进原无辅助榜。选关复用已持久化的通关资格，在入口和会话开始处共同检查；正式重玩与调试直达分别标记，不将邀请参数当作解锁凭证。这些方法已在当前 Cocos 项目通过恢复逻辑、旧存档和正常输入连续两关检查；微信真机表现仍需目标平台确认。辅助通关但尚无合法用时应显示“暂无竞速纪录”，避免同时显示“已通关”和“暂无通关纪录”。

## 渲染、计时与证据边界

Cocos 3.8 优先按当前官方 `SubContextView` 文档设计，再核对实际引擎实现，而非套用旧版第二个 Creator 子项目的流程。Creator 3.8.8 的 `designResolutionSize` setter 仅在编辑器生效，运行时直接设值不会改掉默认的竖向画布；纯代码搭建的横屏界面可用公开 `ImageAsset/Texture2D/SpriteFrame` 接入 `sharedCanvas`，不改引擎私有字段。画布保持固定设计尺寸、整体缩放，翻页由主域按钮发送命令，避免额外的触摸坐标映射；只在可见时按有限帧率上传纹理，关闭后停刷。此路线已有实际 Cocos 浏览器宿主模拟验证，微信纹理兼容仍须真机确认。

子域源码放在可维护的构建模板目录，构建后显式校验 `game.json.openDataContext`、入口与依赖齐全。将纯成绩协议编译给两个域共同使用，避免键名、毫秒格式和合并规则分叉。消息区分引擎内部与业务命名空间。offscreenCanvas 与 screenCanvas 模式能力不同且不能中途切换，不混用方案。

启用子域会限制主画布像素读取、画布转绘等行为。战绩分享优先只使用本人数据与游戏美术；不得把好友榜画布当作可读取上传的普通图片。官方 API 与指南对默认分享图片的描述不一致时，记录冲突并显式指定图片，最后用真实卡片验证，不能将任一默认行为写成永久事实。

设计竞速榜前检查原 `time` 是否来自固定步长、截断帧差或演出累计。模拟时间不是未经检查即可使用的真实用时。微信小游戏 `Performance.now()` 当前标注微秒，浏览器通常为毫秒；适配器或引擎可能已经换算，实施前核对单位并标定。Creator 3.8.8 微信适配器的全局 `performance.now` 可能落到 `Date.now`，需从原始 `wx.getPerformance().now()` 取值并统一单位，而不是只看 API 名字。时钟倒退、非有限初始值或采样使竞速成绩失效；通关进度可独立保留。暂停、隐藏、旋屏等事件立刻停表，加载与不可操作入场不计时，胜利触发即结算，避免把结尾演出算进成绩。

排行榜弹层必须同时隔离键盘、触摸热区与原生覆盖按钮，仅绘制遮罩不够。首页新增底部按钮要重新检查安全区，竖屏时提供可见提示。第二关邀请目标只保存在展示状态，沿正常第一关流程保留到第二关；旧规则目标只作参考，不能合并进存档或分享为自己的战绩。

云端先读后写，读取失败不能拿空值覆盖旧纪录；将更高进度与每关最小合法用时合并，用串行队列接收写入途中新成绩，重试次数有上限，状态由子域展示。测试用虚构好友明确标识，与生产包分开；同时验证真实 UI 调用链和纯协议。控制浏览器时钟时，页面重载或异步资源启动前先恢复时钟，防止把测试框架暂停导致的超时误判为游戏启动失败。

来源：[Cocos 3.8](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/build-open-data-context.html)、[子域限制](https://developers.weixin.qq.com/minigame/dev/guide/open-ability/opendata/basic.html)、[转发指南](https://developers.weixin.qq.com/minigame/dev/guide/open-ability/share/share.html)、[时间单位](https://developers.weixin.qq.com/minigame/dev/api/base/performance/Performance.now.html)。

页面状态与输入隔离可组合 `game-ui-ux`；数据格式、迁移与失败恢复可组合 `save-systems`。仅迁移适用原则，不能把文件 rename 流程直接套到微信 KV 存储。浏览器宿主模拟、打包和官方文档阅读分别只能证明对应层面；真实关系链、授权、卡片接收与群场景需微信多账号和目标设备验证。

## 评分与推荐的设计边界

2026-11-13 根据用户提供的[微信「评价与推荐」官方正文](https://developers.weixin.qq.com/minigame/dev/guide/open-ability/game-evaluate.html)核对：评分主页承载打星和文字评价，游戏内 PageManager 加官方固定 openlink 拉起的是推荐组件。入口名称、交付描述和统计必须区分二者，不将推荐按钮写成直接评分接口，不将文档中的公开组件常量误当成游戏专属链接或登录凭据。实施前仍需核验当时接口及账号能力。

推荐能力指南将事件及 `destroy.isRecommended` 的支持起点标为基础库 3.8.6；2026-11-13 核对的[官方小游戏类型定义](https://github.com/wechat-miniprogram/minigame-api-typings/blob/master/types/wx/lib.wx.api.d.ts)将通用 PageManager 创建及 `load/show/on/off/destroy` 标为 3.6.7。两处说明的能力范围不同，不能把推荐回调门槛扩写成所有 PageManager 方法的最早版本。项目可保守要求推荐回调门槛，并检测实际方法；`off(event, callback)` 有官方定义，但兼容缺失时仍应靠实例身份隔离迟到事件。

`isRecommended` 表示关闭时的推荐状态，不能证明这次新增推荐、打了几星或分享已送达。仅接受合法布尔值，缺字段保留未知；`ready`、`show`、Promise 返回和重回前台都不是推荐完成证据。主动清理与用户关闭分开处理，防止析构事件误报成功。

组合 `game-ui-ux` 的层级和模态方法时，先提供自愿固定入口，再按产品需要考虑可关闭的结算提示；默认不绑定奖励或先筛满意度，用户明确选择奖励时不得将其实现为代用户推荐或打星。频控参数属于具体项目设计，本机历史状态也不等于当前账号实时状态。预加载不阻塞启动，失败不强弹提示；实例关闭后复用、销毁回调次序和异步点击兼容需目标微信版本确认，不能把设计原型当成原生组件实测。

异步结果若改变复活资格，应绑定发起时的局次与当前死亡轮次，并限制为一次有效发放；重开、切关、主动销毁、重复或迟到回调均不得发给新一局。领取机会与消耗复活分开，已有机会不叠加、找不到安全落点不扣除，返回外部页面后仍由玩家主动恢复战斗。`isRecommended === true` 可以是之前已推荐的状态；如产品允许再次获得，也只能表述为本次观察符合资格，不能统计成新增推荐。测试应同时覆盖未推荐、未知、已推荐、重复结果、取消清理与跨局次迟到事件。

在已有持续更新循环的游戏中，打开外部组件时一次性清输入、停表或隐藏原生按钮并不充分。沿实际调用链检查计时启停、原生按钮同步和弹层/邀请调度，在组件加载、显示以及错误说明期间共同尊重占用状态，防止下一帧重新启用或另一个弹层覆盖输入所有者。当前 Cocos 项目已用真实构建、普通触摸/键盘和微信宿主模拟验证这些路径；真机表现仍须另行确认。不要为单一新入口重写整个 UI 架构。

保留点击链时可复用已完成预载的实例；预载仍在等待时，先销毁未展示实例，再在同一次点击内创建并调用 `show({openlink})`，避免并发 `load/show` 或任意异步等待后丢失点击语义。这是已通过模拟的项目策略，真实微信的实例销毁和点击要求仍需设备验证。超时只覆盖展示前；收到 `show` 后移除超时，不强行关闭阅读中的页面。原生页可能伴随 hide/show 生命周期，不能把后台事件自动当作取消打开，也不能把前台事件当作关闭。主动销毁抛错时保持输入隔离，提供再次返回的恢复按钮，并继续接收真实关闭；旧 Promise 和监听不得重新开页或计入推荐结果。

新增入口与错误/等待页都按最终窗口逻辑像素检查，包含旋屏后仍可用的取消按钮。横屏设计整体缩小到竖屏可能让文字和触摸区过小；在同一模态所有者内切换文本宽度、换行和控件布局，比只缩放整张横屏面板更可靠。测试断言点击尺寸后仍需检查实际截图。
