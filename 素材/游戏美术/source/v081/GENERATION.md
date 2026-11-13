# V0.8.1 原图与生成记录

使用内置 `image_gen` 生成，项目保留原始 RGBA。运行时只做原图裁剪、按整张母版的统一比例降采样、透明边缘采样及打包。没有重新绘制像素或拼接肢体。

最终使用 rifle、rocket、actions、enemies、shared 和 soil 六张原图；soil-candidate 是弃用的石堆候选。人物共 88 张完整帧，运行时覆盖 247 个已有动作 ID。脚底、头部尺度与炮口在清单及打包脚本中登记。

- [运行帧清单](../../v081-art-manifest.json)
- [打包脚本](../../../../源码/scripts/pack-v081-art.mjs)
- [人物图集](../../../../源码/assets/landart/cast.png)
- [土层材质](../../../../源码/assets/landart/soil.png)

## rifle

参考：art/slices/v053/player.idle.0.png。

```text
Production 2D side-scrolling game sprite sheet, exact 4 columns x 4 rows, 16 COMPLETE same soldier poses, transparent background. Reference image is strict character identity: round helmet with brim, round white face, two black eyes, small backpack, plain white suit/boots and short black rifle. REDRAW EVERY pose in ONE very consistent clean bold hand-ink cartoon language. Rounded 7px black outer contours and 5px inner lines at a character height of 250px; opaque white interiors, no grey hatching. Consistent head diameter 82px, consistent body size, no style drift. 1536x1536 canvas, each 384x384 cell, margins >=36px; character sole baseline at cell y=332 and hip x=166. All face RIGHT. No grids/text/shadows/muzzle flashes/projectiles/effects.
Read order:
Row1: 1 relaxed standing rifle aimed right; 2 run left leg forward/right leg back contact; 3 run legs passing with left knee back; 4 run right leg forward/left leg back contact.
Row2: 5 run opposite passing with right knee back; 6 low crouch rifle right; 7 crouch walking left leg leading; 8 crouch walking right leg leading.
Row3: 9 rising jump knees bent rifle RIGHT; 10 descending jump one foot extended rifle RIGHT; 11 standing rifle aimed EXACTLY vertically up, both hands holding; 12 crouched rifle aimed vertically up.
Row4: 13 airborne rifle aimed vertically up; 14 standing rifle aimed diagonally 45 degrees up-right; 15 crouched rifle aimed 45 degrees up-right; 16 airborne rifle aimed 45 degrees up-right.
Every frame contains its complete body, head, both arms, hands and correct rifle. Keep helmet head size identical through jumps and crouches. Aimed poses can lower their body to fit 384px cells; keep limb scale. No missing white parts, no disconnected gun/body.
```

## soil

参考：art/slices/v075/reef.seabed.png。

```text
Game environment texture, a seamless underground soil cross-section for a black-and-white hand-ink cartoon platformer. Reference image is STYLE ONLY: confident rounded black contours, white/light-gray opaque fills, minimal internal detail. Make a 1024x1024 continuous tile of packed soil containing organic rounded rock clusters in different sizes, softly interlocking rounded earthy shapes, a few tiny pebbles and VERY SHORT curved soil marks. Calm moderately sparse arrangement, evenly spread across entire tile including the top; broad clean negative space but no blank horizontal band. Outer strokes 4px, small interior strokes 2px. Most clusters about 70-170px across. Paper fill flat #f8f8f5. Absolutely NO tree roots, branching root symbols, long crack networks, scribbles, grass, top surface, horizontal strata, borders, platforms, geometric polygons, shading hatching, repeating identical icons, perspective or text. The image is the interior soil ONLY, extends through all four edges and must tile in X/Y without seams. Keep left/right and top/bottom boundary transition as mostly quiet plain soil so repeat is unobtrusive. Quality is thoughtful clean shapes and spacing, NOT noisy detail.
```

## rocket

参考：art/source/v081/rifle.png。

```text
EDIT / companion sprite sheet. EXACTLY MATCH the supplied rifle soldier sheet's character identity, opaque white fill, helmet/head diameter, body proportions and bold uniform black ink stroke. Replace rifle with a simple WHITE tubular rocket launcher with black contour, rear opening and visible dark forward muzzle, supported in BOTH hands. NO warhead protruding from tube. SAME 4 columns x 4 rows layout,16 complete poses, identical cell positions and character scale as reference. True transparent background. Target1280x1280. Common sole baseline cell y=296. 
Row1: idle launcher horizontal RIGHT; run left-leg-forward contact; run passing legs; run right-leg-forward contact.
Row2: opposite passing legs; low crouch horizontal launcher; crouch walk left leg leading; crouch walk right leg leading.
Row3: rising jump launcher horizontal; falling jump launcher horizontal; standing launcher aimed EXACTLY vertically up; crouch launcher vertically up.
Row4: airborne launcher vertically up; standing launcher45 degrees up-right; crouch launcher45 degrees up-right; airborne launcher45 degrees up-right.
Complete body in every cell, same head and limb size including aimed poses. For vertical poses shift gun grip lower so all fits. Weapon tube front opening must point in the prescribed direction and not overlap/cut face. No labels, no flashes, smoke, action lines, projectile, ground/shadows or baked effects. A single unified ink artist drew all frames.
```

## actions

参考：art/source/v081/rifle.png。

```text
Complete animation sprites for the EXACT same white helmeted backpack soldier in reference sheet, same rounded bold black contours and white interiors, same face, eyes, head/limb proportions. 24 complete frames in SIX COLUMNS by FOUR ROWS, transparent background. Target1920x1280, equal320x320 cells, body scale matches reference (standing whole soldier about260px high; helmet head width105px), generous gaps and shared bottom baseline y296percell. All face RIGHT, no guns. Tactical knife in right hand in first18 poses. Small knife sharp but not giant sword.
Read order precisely:
row1: knife-ready idle, running left-leg forward, run passing left leg, running right-leg forward, run passing right leg, low crouch knife-ready.
row2: crouch stepping left, crouch stepping right, standing cut wind-up knife above shoulder, cut forward arm extended, follow-through blade low, reverse cut wind-up blade low.
row3: rising slash forward, slash follow-through above shoulder, strong overhead wind-up, strong downward slash, crouched low slash, airborne forward slash.
row4: unarmed grenade throwing arm cocked back (no detached grenade), unarmed grenade follow-through hand forward; hurt recoil bent knees; dying kneel head bowed; lying dead on side; cheer both fists raised overhead.
No text/grid/borders, no effect swooshes, spark, blood, smoke, shadow, ground or scattered equipment. White face/suit remains opaque. Every pose full body with intact hands/head/feet. Keep every pose in same bold lineweight. No thin detailed variants.
```

## enemies

参考：art/source/v081/rifle.png；art/slices/v053/rifle.walk.0.png；art/slices/v053/knife.walk.0.png。

```text
Unified enemy animation sprite sheet for 2D side-scrolling game. Image1 defines EXACT bold black contour weight, round proportions and opaque white fills. Images2/3 show enemy identities: low cap/dark eye-band, plain jacket/trousers, small backpack; distinguish from player's round helmet. All drawn by SAME artist/ink as Image1, no hatching, no textures.24 complete full-body frames in SIX columns FOUR rows, true transparency, target1920x1280,equal320x320cells, soles at296. Consistent standing height255px/headwidth100px. All face RIGHT. Row1 RIFLE enemy, row2 KNIFE enemy,row3 SHIELD soldier with small gun and large plain rectangular white shield, row4 ROCKET soldier with horizontal plain tube (no warhead).
For EVERY row,exact six poses left to right: 1 ready idle, 2 full running left leg forward contact, 3 running legs passing and knees bent, 4 opposite right leg forward contact, 5 distinct attack (rifle/tube aiming forward; knife thrust extended; shield brace with small gun extended), 6 lying defeated on side with appropriate equipment down, no blood.
Keep leg gait meaningful and all body parts/equipment intact. Do not reuse player helmet on enemies. No text/grid/shadows/ground/flashes/swooshes/smoke/loose projectiles. Crisp uniform outer lines around7px with simple interiors around5px.
```

## soil-final

参考：art/slices/v075/reef.seabed.png。

```text
A finished seamless texture for UNDERGROUND SOIL INTERIOR in a black-and-white cartoon platformer.1024x1024flatpaperbackground#f8f8f5; opaque full image. Reference is only its clean rounded hand-ink language. Make a natural NOT patterned scatter of about24 isolated small closed rounded irregular embedded stones, varying30to85px across, each a full rounded uneven pebble/oval silhouette. Add about35much smaller pebble dots10to20px across. Sparse short curved2to15px soil flecks in between. Fine clean black contour3px, very pale grey underside on SOME stones. Arrange naturally over whole image with quiet whitespace, all zones including top have equal medium density. Every rock looks embedded in soil, NOT piled on a surface. NO GROUPED BOULDER PILES, NO clouds or mountain-like shapes, NO repetitive icons, NO branching roots, long cracks, polygon geometry, hatching, scribbles, stripes, surface grass, horizon, horizontal stratum or borders. Edges mostly quiet blank soil so texture repeats smoothly. Clean considered small-scale texture, not large poster-sized decorations. Completely flat orthographic cross-section.
```

## shared

参考：art/source/v081/rifle.png。

```text
Exactly the SAME supplied soldier, same helmet/face/eyes/backpack, opaque white suit, bold black ink weight and scale. A companion 8 frame whole character sprite sheet, 4columns2rows,1280x640, each320x320cell, character260px standing height andsolebaseline296. True transparent background, no shadow/background/lines/text/effects/looseobjects. Facingright.
Row1: grenade throwing wind-up handcockedback (no gun), grenade throwfollow-through emptyhandextended (no loosegrenade), hurt recoil leaningbackwithhandsclenched, death kneelingheadbowed.
Row2: lyingdeadonrightside; cheeringbothfistsatshoulders; cheeringrightfistraisedoverheadleftfistatshoulder; cheeringbothfistsoverhead.
Strong unified 7px outline and5px simpleinteriorlines; match exact headsize and limbwidth across8. No movementlines or shadows. Generouscellgaps. This fills throw/hurt/death/victory states so they cannot fall back to a different drawing style.
```


