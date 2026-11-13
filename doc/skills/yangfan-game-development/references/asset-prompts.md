# 可复用素材提示词

以下是填写后用于图像工具的模板，不是当前任务自动发起生成的指令。替换方括号参数；只使用已提供且允许作为参考的图片。实际工具参数中指定透明背景，文字提示不能替代透明输出设置。

通用组成：用途 → 严格参考 → 帧布局与动作 → 一致比例/基准 → 透明与填色 → 排除不应烘焙的内容。原图和最终提示词一起存档。

## 成套敌人装备与弹体

将“装备 × 动作”作为整套资源契约：同一敌人身份的不同枪械分行，悬停瞄准、交替移动、躲避等完整姿势分列；要求同一头径、躯干比例、描边与留白。弹体单独生成，敌我版本共享轮廓，只改变可读的内部色带。提示词要区分物理弹体与界面符号，例如鱼叉应有独立杆身、尖端与尾翼，不能把通用方向箭头直接当作成品。

生成后先挑选合适的轮廓，再测量裁剪框、枢轴和枪口；不要按每格不同的包围盒统一显示宽度。分别检查原图和手机实际画面，完整箭杆在缩小后可能仍比大图看起来细弱。弹体可读性要测杆身等最细有效截面的屏幕像素，而非仅检查整体长度或弹头宽度；过细时在生成提示中明确缩短长宽比、加粗整段实心杆身和描边，保留尖端/尾翼语义。截图应取飞行中的实际大小，不只验大图；装饰尾翼的增宽不应直接扩大伤害范围。弃用的候选与最终选用资源分开记录，不为了凑齐格子接入错误语义的图形。

小型载具 Boss 应先建立与普通兵不同的完整轮廓，如驾驶舱、可见驾驶员和成组发射管，再生成完整、受损和击破状态。各帧保留同一源像素比例，逐帧量测舱体枢轴和所有炮口，不能把放大的普通兵当作新 Boss。参考图中的驾驶员身份、最终显示线宽与环境复杂度仍需统一。

## 跨章节统一风格

新关卡同时引用已采用的角色和既有地图，不能只参考新关卡自己的上一张素材。生成前写清共用的轮廓/内部线宽比例、角色相对尺度、单位屏幕内的细节密度、主体留白、材质填色与背景对比度。章节允许更换地貌、建筑、水下气氛和局部色调，人物与环境仍属于同一套视觉体系。

不要只写“精细”“粗线漫画”：前者容易产生满屏排线，后者可能生成过重的图标边框。提示词给出源图线宽和预期运行缩放关系，并在真正游戏尺寸下与人物并排检查；数值是当前项目的约束，不能机械迁移到其他项目。复杂度适中、结构完整、接触合理优先于纹理数量。

用户已接受某一关时，将它作为画风基准，另一关重绘到同一手绘语言；不要为了统一而把已接受的场景也降级。提示词同时写清“减少过密排线”和“保留自然草叶、根系、圆润岩石、裂缝与完整支架”，并排除空白几何块、图标式简化和线框平台。草皮/钢梁表层与无表层语义的内部材质分别生成、分别使用，不能将整块结构向深处重复堆叠。

```text
Use the supplied in-game hero AND accepted chapter environment as strict
references for one shared visual language. Keep matching final-scale outer
contours, lighter interior lines, opaque pale fills and restrained detail.
At runtime this asset is shown at [scale]; target outer line weight is
[world/screen units] beside the hero. Preserve structural clarity and space.
Change the environment theme to [theme], not the drawing style. Do not add
photoreal textures, dense hatching, noisy stippling or heavy icon borders.
```

## 完整角色动作图

```text
Create a production-ready 2D game animation sprite sheet.
Use the attached [character reference] as the strict identity and style reference:
[silhouette, clothing, equipment, line weight, palette, viewpoint].
Exactly [N] complete full-body frames arranged in [rows × columns],
with equal cells, generous outer margins and clear gaps between silhouettes.
Frame order: [explicit numbered poses and animation phases].
Facing [direction], consistent body scale, perspective and foot baseline.
Draw the complete character together with [weapon/equipment] in every relevant frame.
Transparent background with true alpha. Keep [white clothing/armor] opaque.
No cut-off heads, feet or weapon tips. No text, labels, grid or borders.
Do not include detached projectiles, impact particles, muzzle flashes,
ground, cast shadows or extra character copies unless requested in the pose list.
Target size [width × height] if supported; preserve clear frame separation.
```

挥刀要描述前摇、命中姿态、随动收刀，避免每格只是刀的位置不同而身体没有重心变化。跑动帧保持基准，但允许身体随动作自然起伏；不要求每帧脚都接地。

俯冲、跃水等倾斜动作要同时说明运动方向与身体端点位置，例如“头和炮口位于右下、脚蹼位于左上，身体朝右下倾斜”。只写“dive”可能得到水平游泳。收图后确认头脚关系与轮廓，角度仍以实际原画测量为准。

## 四帧欢呼

```text
Create a 2D GAME ANIMATION SPRITE SHEET using the attached character
as the strict character and style reference. Exactly FOUR full-body frames
in ONE HORIZONTAL ROW, equal cells, generous margins, consistent scale
and shared ground baseline. [View direction and art style].
Frame 1: clenched fists at shoulder height.
Frame 2: both fists raised overhead in a V.
Frame 3: one fist overhead, a clear joyful posture.
Frame 4: both hands raised with a small celebratory bounce.
No weapons. Preserve the same face, helmet, outfit, backpack and boots.
True transparent background, opaque character fills.
No ground, shadows, particles, text, dividers or borders.
```

这是《线条突围》欢呼素材的抽象模板。其他角色只保留自己的身份特征，不继承士兵装备。欢呼循环和播放频率在引擎中定义，生成图本身不能证明动画流畅。

## 可拼接地形

```text
Create modular 2D side-scrolling platform terrain assets in [reference style].
Separate modules: [repeatable top strip, interior fill, left/right end caps,
inside/outside corners, optional brackets]. Arrange them with clean empty gaps.
Use a consistent [pixel/world] scale, line weight, top-surface thickness
and side-view perspective. The repeatable horizontal strip must have
matching left and right edge patterns with no visible seam when repeated.
Do not bake end caps, perspective taper or large unique decorations into
the repeating middle strip. True transparent background where appropriate;
keep solid terrain fills opaque. No text, measurements, grid or scene background.
```

不要只检查单块好看：接入前至少并排重复多块并检查部分尾块，确认端帽连接和地面顶线。复杂平台最好分别生成主体与端帽，降低模型对“无缝”的误解。

## 完整人物向上举炮

适用于武器已画在完整人物帧中的项目；已有骨骼或可旋转武器结构时继续复用该结构。生成后仍需测量实际筒轴，提示词角度不能替代挂点检查。

```text
Use the supplied soldier as the strict identity and style reference.
Draw complete held-launcher poses for [vertical-up / diagonal-up] aiming,
covering [standing, running, crouching, jumping, falling].
The tube centerline points exactly [90 / 45] degrees above horizontal.
Keep both the muzzle opening and the rear opening visible and unambiguous.
Preserve helmet size, body proportions, tube length, contour weight and
opaque interiors across all poses. Natural whole arms grip the launcher.
Use equal spacious cells and a shared ground reference for grounded poses.
Transparent background. No detached body parts, projectiles, muzzle flashes,
smoke, ground, text or frame borders.
```

发射特效和弹体由运行时生成。记录实际原图尺寸、脚底基准、炮口/后口及统一缩放，并检查左右镜像、受击时继续瞄准、后坐力恢复和空中动作的挂点连续性。

## Boss 受损、坍塌与独立特效

```text
Use the attached [Boss] as the strict design reference.
Create [N] complete, separate states: [intact/charged/damaged/collapsing/wreck].
Preserve the identity, component proportions, perspective and scale.
Keep a shared ground reference and generous space for collapsing parts.
Show progressively readable structural damage; make the final wreck low and settled.
Transparent background. No baked explosions, smoke, detached flying missiles,
text or duplicate intact Boss behind the damaged version.
```

```text
Create a separate 2D effects sprite sheet matching [style].
Exactly [N] isolated frames for [explosion/shockwave/smoke], in time order:
[small ignition → expanding burst → peak → dissipating fragments].
Consistent effect center, scale progression and spacing.
True transparent background, no character, weapon, terrain, text or frame borders.
```

将 Boss 本体阶段和爆炸特效分开，便于按时间线叠加且保持真实世界位置。不要生成“完整 Boss 带爆炸”后又叠加另一套完整 Boss。

水下爆炸可具体描述为“短促亮核 → 膨胀气泡云和水压轮廓 → 碎片外抛 → 气泡上浮消散”，保持漫画白色不透明填充。裁剪后保留各帧原始尺寸与共同中心，按同一比例绘制；不要把每张裁剪框都放大到相同宽度，否则会抹掉小到大的膨胀过程。短命中闪光与重型爆炸分别设置寿命和显示尺寸，并检查实际命中与消散关键帧。

## 游戏按钮与操作图标

用户要求生成 UI 美术时，按钮、摇杆、图标先用图像生成工具产出，再切图接入；不要用临时程序绘图顶替。以当前实景和角色素材作画风参考，而不是只写抽象的“高级、有质感”。对粗线漫画游戏，要求相同的黑白填充、线宽层级、简化程度和少量平涂阴影，明确排除写实金属、细密噪点与不属于该游戏的材质。

同一图集列清楚按钮语义与位置、透明背景、完整边缘和文字留白。跳跃可用离地的人形，二段跳增加第二次起跳标记，水下冲刺用水平速度线/箭头；不要让生成器用相同双箭头代替所有运动动作。让每个按钮下方留出原生文字区域，计数徽章保持空白。生成后检查实测尺寸、透明度、完整轮廓和标签是否遮挡图标；只进行必要的完整切片、等比缩放与图集打包，不用像素修补把错误语义掩盖过去。

长按钮采用九宫格缩放时，切线必须越过源图完整圆角和投影，再按源像素到 UI 的比例处理边缘尺寸。切线仍穿过圆角会把弧形黑边拉成横线；固定大切边直接套到矮按钮也会挤没中部。至少检查实际最矮菜单按钮与主要按钮的完整边框和文字净空。

## 封面主视觉

```text
Create a [landscape/portrait] key illustration for a 2D action game in
[established game art style], using [provided character and enemy references].
Use references for identity; redraw subjects together with consistent contour
weight, interior detail, sharpness, perspective and shared ground contact.
The enemy is [physical size relative to the hero], not an independently scaled sticker.
Composition: [hero position, antagonist scale, action direction, depth layers].
Reserve clean low-detail negative space at [location] for the title and
at [location] for the main action button. Keep essential silhouettes away
from safe-area edges. [Palette, lighting and line weight].
No words, logos, interface buttons or fake lettering in the image.
```

游戏内封面的标题、按钮与结算数字由 UI 渲染。在不同宽高比下检查裁切与文字留白。已有素材在最终尺寸下的线宽、清晰度和比例一致时，可以直接通过引擎构图；若存在明显拼贴感，先统一重绘主视觉，不用额外云朵、爆炸或边框遮盖风格冲突。

## 渠道提交用推广素材

适用于商店页、小游戏资料页等静态推广图片；游戏内封面的标题与交互仍由运行时 UI 负责。结合 `create-game-assets` 的统一视觉/资源契约与 `imagegen` 的成套生成、原图留存方法：

- 先从当前实际版本核对可宣传的场景、武器和操作；将已完成内容、可玩样段和规划分开。推广插画可以重构构图，但保持真实角色和玩法，不标作实机截图，不把未完成章节写成完整卖点。
- 将后台明确显示的格式、尺寸、字节上限、必需张数与制作默认值分别记录。截图没有展开的横竖版限制不能靠示意框或其他渠道规范补成确定结论；规格不全时只能标为设计稿，不能把默认尺寸图当作可直接提交的成品。逐个上传位置独立验收，不将竖版要求自动套到横版。保留原图及用途映射，便于按真实字段重导出。文字上限未知时同时提供推荐句与较短版本，并实际计算字符数。
- 成套图先选定一个代表画面，再用同一角色、敌人和场景作为参考。小尺寸通用封面优先放大核心对抗关系；横、竖海报分别构图，避免硬裁导致主角、标题或装备丢失。中文标题及副标题逐字复查，按最终尺寸检查辨识度与安全边距。
- 生成器请求尺寸不是交付尺寸。保留生成 PNG，实测宽高比后再等比规范化；仅允许不损害主体的少量收边，差异明显时重新构图。对最终 JPEG 重新解码检查尺寸、颜色模式和精确字节数，并在实际展示大小下检查线条、文字和压缩质量。记录来源、最终提示词、处理方式与校验结果；不得用“已生成”代替渠道验收，也不得把本地交付说成已上传。
- 用户补充规格后，同时修正像素尺寸、文件上限与要求数量；大幅改变宽高比时重排构图，不能拉伸图片或裁掉标题来满足尺寸。将旧规格成品移至清楚标记的历史目录，更新说明、预览与压缩包；专用提交包只放本次该位置需要的成品，解包后再次核对数量和文件哈希，避免用户混用旧图。
- 创意申请中的“创作过程材料”应整理真实源图、设计记录和运行截图，与宣传插画分开。可以排版、等比缩放和标明局部放大，但不能生成虚假的手绘草稿、开发过程、运行画面或权属证明；说明生成工具参与情况、历史版本和未完成内容。文档摘录回查原文，保留来源快照、裁切区域与哈希，逐张检查文字可读性和文件限制；制作材料完成不代表原创性认定或申请已提交。

