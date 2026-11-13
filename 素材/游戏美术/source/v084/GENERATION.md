# V0.8.4 生成按钮资源

使用内置 image_gen，透明背景；最终运行时来源为[最终原图](controls-comic-final.png)。用户否定的金属/写实候选 `control-sheet.png` 与布局中间稿 `comic-control-candidate.png` 已移入[废弃候选归档](../../../../历史归档/废弃美术候选-20261113.zip)，不能作为当前接入源图。

参考：`开发进度/验证记录/v083-land-start.png` 与 `素材/游戏美术/source/v081/rifle.png`。整套保持黑白粗线、白色填充、克制灰色投影。跳跃、二段跳、滑铲使用同一戴帽主角；水下冲刺使用横向速度箭头。

技术准备仅切出完整素材、保留透明度、等比例缩放与图集打包，不自行补画底板或图标。原图尺寸及 SHA 见 `素材/游戏美术/v084-controls-manifest.json`，运行时 `源码/assets/landart/controls.png`。

## 最终留白调整提示词

Precise layout edit of the provided generated 4-column, 3-row black-and-white cartoon game UI sprite sheet. Keep this EXACT cartoon ink style, all 12 assets, same layout, same black contour weight and white/gray cel fills. The jumping and sliding heroes must keep the same helmeted character identity. Keep actual transparency and opaque white button faces.
The only change required is LEGIBLE SPACE FOR LABELS: in the seven ROUND ACTION buttons in row 1 and row 2 (attack, jump, dash, grenade, knife, slide and double jump), SHRINK EACH INNER PICTOGRAM to 70% of its current width and height and place it centered in the UPPER HALF of its circular face. Keep the outer button size unchanged. The bottom THIRD of the inside face must be COMPLETELY EMPTY WHITE, unobstructed by the pictogram, takeoff strokes, speed streaks or shadows. That empty zone will hold a Chinese label at runtime. Do not actually write labels. For jump and double-jump keep the complete human figure and its takeoff swoosh together as one smaller pictogram. Grenade and knife also must shrink, not touch the lower label zone.
The pause button, joystick base, joystick thumb cap and empty inventory badge stay as they are. The blank rectangular menu button must fit wholly inside row 3 column 4, with transparent gutter on all sides; reduce its width if necessary.
No words or numbers. No texture, gradients, metallic effect or realism. Use the same crisp professional comic outline drawing, clean white faces and restrained flat gray lower-edge shading. True transparent PNG sprite sheet only.

## 漫画风格重绘提示词

Edit target: image 1 is a 12-asset game-control sprite sheet. It was REJECTED because its realistic graphite, cream metal rims, bevels and fine material texture do NOT match the game. Redraw the entire sheet in the ACTUAL GAME STYLE shown by image 2 (game screenshot) and image 3 (character art). Image 1 supplies ONLY the inventory and grid placement, never the material style.
The visual language must match the chunky ink-outlined cartoon soldier, crates and terrain: bold near-black organic contours, clean almost-white opaque fills, extremely restrained flat light-gray cel shading, large simple shapes, confident professional hand-inked drawing. No metal, no brass/cream coloration, no photorealism, no grain/noise, no gradients, no specular highlights, no rubber texture, no ornate rim rings. The UI must look like it was drawn by the same artist as the characters. Premium finish comes from excellent drawing, proportions, consistent line weight, clean spacing and a little flat offset ink shadow; NOT realism.
Exactly 12 separate full control assets in a strict FOUR COLUMN x THREE ROW grid, generous fully transparent gutters. Each complete sprite entirely inside its cell, including the last rectangular button. All circle buttons use the same size, WHITE paper face, a strong black outer contour plus one restrained inner hand-inked edge, and a small flat black lower-right offset edge for thickness. Do not draw multiple metallic concentric bands. Their ICONS are BLACK bold comic ink on WHITE, occupying the upper-middle. Leave lower 25% of each action button EMPTY for engine-rendered Chinese labels. No text/letters/numbers anywhere.
Grid left to right:
Row 1: 
1. Attack reticle, thick confident graphic with central dot.
2. JUMP: simplified helmeted cartoon hero matching image 3, no weapon, joyfully LEAPING UP with one raised fist and both knees airborne; small takeoff dash below. It must unambiguously depict jumping, not walking or just chevrons.
3. DASH: bold horizontal rightward speed arrow with three expressive trailing motion streaks, unmistakable sudden forward acceleration, not an upward icon.
4. Hand grenade: compact black-outline cartoon grenade with white fill, pin and lever, same simple line weight as the game's weapons.
Row 2:
1. Combat knife: chunky diagonal black-outline knife, white blade, simple black handle.
2. SLIDE: simplified helmeted game hero in a clearly feet-forward LOW sliding pose, leading foot extended, torso leaned back, small trailing speed marks.
3. Pause: matching white rounded-square thick black-outline control with two solid black pause bars.
4. DOUBLE JUMP: same jumping hero drawing as row 1 column 2, with two short distinct takeoff swooshes below, same proportions.
Row 3:
1. Joystick BASE ONLY: white/light-gray shallow circle, bold but slightly lighter ink rim, four small black directional notches, calm empty center; no thumb cap.
2. Joystick THUMB CAP ONLY: white comic circular cap with bold black perimeter, one short black inset contour near lower edge, three simple short black grip marks in the center; no material grain or realistic bevel.
3. Inventory badge: small empty white circle, simple confident black outline and tiny flat offset shadow; no number.
4. Menu button: blank wide rounded rectangle with the same white paper face, bold black outline and small flat offset lower edge; no icon/text. Fully contained within its cell, even if this requires making it smaller than the circles.
Absolutely true alpha transparency outside every sprite, not a black/white/checkerboard background. Preserve the opaque white fill inside every control. Clean professional inked game art, with the SAME detail density and bold line quality as the reference soldier. No screenshot or game scenery in the output; output only the sprite sheet.

## 被否定候选提示词（留档，禁止沿用写实材质）

Use case: stylized-concept.
Create ONE production-ready transparent PNG sprite sheet for the touch controls of a black-and-white hand-inked side-scrolling soldier action game. The user explicitly rejected primitive code-drawn circles and chevrons; these must be professionally ILLUSTRATED finished game UI assets with tactile surface quality, crisp readable action pictograms, consistent deliberate contour weights and balanced detail, not wireframes.
Composition: a strict 4 COLUMN by 3 ROW grid, exactly 12 isolated assets, generous transparent gutters, centered in equal cells. Each action button has the SAME face diameter and the SAME finish. Front-on, perfectly usable circular silhouettes, no perspective tilt. No background panel, grid lines, typography, letters, numbers, watermarks or cast shadows extending into other cells.
Art direction: monochrome ink, charcoal graphite and warm ivory only. Thick confident black outer contour, an ivory inset rim with restrained hand-painted highlights and a dark lower lip, matte charcoal rubber/enamel cap with subtle fine grain and smooth painted shading. A small amount of texture gives substance; no grunge, no ornate engraving, no photoreal chrome, no glossy plastic, no neon. The buttons belong with chunky outlined cartoon soldiers and clean hand-drawn terrain. All pictograms are warm ivory, bold, expertly drawn and readable at 60-110 screen pixels. The lower quarter of every ACTION button is intentionally empty for engine-rendered Chinese labels. Pictograms occupy the upper middle, not the entire face.
Exact grid, left to right:
ROW 1:
1. ATTACK button: an elegant bold four-part aiming reticle with a small diamond center, centered above the empty lower label area.
2. JUMP button: unmistakable FULL HUMAN FIGURE LEAPING UPWARD, round head, raised arm, torso extended, both feet airborne, one knee bent; a small broken takeoff baseline underneath. This is a jumping person, NOT upward chevrons, NOT a walking person.
3. UNDERWATER DASH button: horizontal forward BURST / DASH to the RIGHT, a strong pointed arrow/dart with three trailing speed streaks. Emphasize sudden horizontal acceleration. No upward icon, no jump person.
4. GRENADE button: clearly recognizable compact segmented hand grenade with pin and lever, upper-middle, empty lower label area.
ROW 2:
1. KNIFE ATTACK button: clean angled combat knife with prominent blade and wrapped handle.
2. SLIDE button: a dynamic compact FULL HUMAN FIGURE in a feet-forward low ground slide, bent back knee, extended front leg and two trailing motion streaks. Distinct from jump and dash.
3. PAUSE button: matching rounded-square charcoal and ivory button, two bold ivory vertical pause bars centered, no label area needed.
4. DOUBLE JUMP button: the SAME leaping human figure as row 1 column 2, with TWO short upward takeoff arcs underneath to signify a second air jump. Keep anatomy and proportions the same.
ROW 3:
1. JOYSTICK BASE: large shallow circular ivory/rubber socket, subtle painted inset edge, calm translucent pale center, four small directional notches engraved at cardinal directions, NO knob in its center.
2. JOYSTICK THUMB CAP: separate raised dark charcoal circular thumb grip with matching ivory rim, subtle tactile rubber grain and three short inset grip grooves, no direction arrow or letters.
3. INVENTORY COUNT BADGE: small ivory filled circular enamel chip, thin strong ink rim and tiny soft lower-edge shadow, completely EMPTY center for an overlaid number.
4. RECTANGULAR MENU BUTTON: wide rounded rectangular charcoal inset control with ivory rim, same physical finish, completely blank, no icon or text. Centered in its cell.
True transparent alpha outside every isolated asset, not a checkerboard painted into the image. Opaque action-button faces and ivory fills. All edges and complete silhouettes fully contained inside their cells. This is a sprite asset sheet, not a mockup of a phone screen.

