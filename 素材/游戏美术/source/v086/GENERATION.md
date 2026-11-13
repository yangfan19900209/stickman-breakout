# V086 第二关战斗素材

工具：内置 `image_gen.imagegen`，所有选用图均请求 `transparent_background: true`。原图按返回路径复制到本目录，保留生成像素与 alpha。来源 SHA、实际裁剪矩形与图集坐标见 [v086-art.json](../../../../开发进度/验证记录/v086-art.json)。

| 原图 | 实际尺寸 | 选用 |
| --- | --- | --- |
| enemy-loadouts.png | 1448×1086 | 三种装备 × 悬停瞄准/两张游动/躲避，12 张完整敌人 |
| projectiles.png | 1536×1024 | 敌我声波、鱼雷共 4 张；左列方向箭头候选弃用 |
| harpoon-darts.png | 2172×724 | 两张完整鱼叉弹体，替换方向箭头候选 |

输出：`源码/assets/level02/combat-v086.png`，2048×512，18 帧；`OceanCombatFrames.ts` 保留原画尺寸、枢轴和枪口。打包脚本只裁剪、带 alpha 降采样与排版，无手绘、拼接肢体、描边增强或重新着色。相邻格实际透明间隙优先于机械均分。潜水兵原画比例统一 .235；队长恒定 .28；不按攻击状态缩放。

## 敌人原图提示词

参考：现有 `素材/游戏美术/slices/level02/enemy.diver.swim.png` 的身份、`素材/游戏美术/source/v073/harpoon.png` 的主角和鱼叉、`素材/游戏美术/source/v081/enemies.png` 的已认可陆地角色笔触。三张参考均先查看。

> Create a production 2D sprite sheet for this existing side-scrolling black-and-white ink comic game. References: first image is the ENEMY diver identity to preserve (dark rounded hood, white goggle with one angry eye, round regulator, two white air tanks, white suit, dark flippers); second is the player's harpoon weapon and exact cartoon ink language; third is the accepted chapter-one cast, controlling consistent outline thickness and simple clean shapes. Make ONE transparent PNG, 4 equal columns x 3 equal rows, exactly 12 separate COMPLETE enemy diver sprites. Each sprite faces LEFT with horizontal gun aimed left. Identical body/head scale in ALL cells, head outer diameter about 85 pixels if canvas1536 wide, same thick rounded black outline 6-7px and sparse interior strokes. Generous empty transparent spacing, at least24pixels each cell edges. No grid, text, shadows, background, glow, bubbles, firing effects, projectiles or loose parts. Opaque white body fills and charcoal dark hood/gloves/flippers. All 12 sprites have same enemy identity. Row1 HARPOON rifle: small conventional rifle with clearly visible spearhead protruding left, similar to hero reference weapon, not a pistol. Row2 SONAR gun: short chunky ribbed circular emitter barrel with wide round aperture, white body and black rings, visually distinct from spear gun. Row3 TORPEDO launcher: large cylindrical tube carried with both arms, simple fins/tube shape, no spear. Within EACH row: col1 steady hovering aim, bent knees and flippers hanging down; col2 swimming forward with legs extended behind in first flutter kick; col3 second flutter kick with opposite leg bent, different readable limb silhouette; col4 evasive tucked-leg sidestep swimming pose, keeping the SAME weapon held and pointed left. Every sprite full body, same-size skull and limbs, no zooming/stretching between poses. This is game animation source art with weapons held naturally by both hands. Clean bold outlines, large quiet white shapes, no intricate hatching. Actual transparent background alpha, retain solid white inside the figures. Preserve the existing game's style, not realistic or metallic.

## 声波与鱼雷原图提示词

> A clean transparent sprite sheet of six small non-realistic cartoon objects for a family-friendly underwater arcade videogame. Black-and-white ink drawing, thick smooth black outlines, opaque white interior, flat charcoal accents, no people, no scene, no violence depicted. Grid of three columns and two rows with wide transparent gaps, no grid lines or labels. Column 1 contains a toy-like harpoon dart pointing RIGHT: a bold triangular tip, a thick straight shaft and two tiny fins on the back, proportions 4:1. Column 2 contains a sonar signal pointing RIGHT: three separate thick curved crescent wavefronts, total silhouette square. Column 3 contains a little cartoon underwater torpedo pointing RIGHT: a rounded capsule with short rear fins and a small propeller, proportion3:1. Top row white interior versions of the three objects. Bottom row the exact same three silhouettes with a charcoal stripe. These are isolated polished game item illustrations with no explosions, trails, glow, motion blur, shadows, background, words or numbers. Keep white interiors opaque and genuine transparency outside. Simple bold illustrated silhouettes that stay clear at 50 pixels wide.

## 最终鱼叉原图提示词

> A polished black-and-white hand-drawn cartoon game asset, isolated transparent PNG. Two horizontal miniature mechanical DARTS pointing RIGHT, one above the other, generous empty margin. They are stylized little underwater science-fiction toy objects, not UI arrows. Each object has a very long slender straight white tubular shaft, a small separate angular diamond-shaped pointed metal tip on the right, and two short triangular stabilizer fins at the left tail. Length is SIX TIMES maximum height. Shaft is 75% of object length; point is small, about18%. Bold smooth rounded black outline, opaque white fill, sparse charcoal accents, no hatching, no realism, no texture. Upper dart has white shaft; lower is identical but with a charcoal stripe along its shaft. Both have exactly the same silhouette, dimensions and ink weight. No people, targets, scenes, text, labels, glow, background, shadows, trails or extra objects. Sprite art for a simple thick-line comic videogame, with opaque white fill inside and actual transparency around the two objects.

生成过程另有两次工具未返回图片，不作为资源或完成证据。原始六格图的鱼叉更像界面箭头，因此最终另行生成实体杆身，未用代码将候选拼成新图。
