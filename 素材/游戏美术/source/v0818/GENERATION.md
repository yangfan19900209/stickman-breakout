# V0.8.18 水下战斗资源

工具：当前会话内置 imagegen，透明背景。保留原图；仅按透明边界裁切、预乘 alpha 面积缩小并打包，不用程序绘制替代素材。原图 SHA-256、裁切区域、黑色像素比例和运行图集散列见 [资源校验](../../../../开发进度/验证记录/v0818-art.json)。

运行资源：`源码/assets/level02/combat-v0818.png`；6 帧，768×384，原图和帧挂点由 `源码/scripts/pack-v0818-ocean.mjs` 记录并生成。

## 独立鱼叉弹体

[harpoon.png](harpoon.png)，生成结果 `exec-c37b1e06-2b12-4911-8476-753ce56e3f9a.png`。一次初稿误画成完整发射器，未接入；最终独立弹体为黑色细杆和倒钩尖头。黑色像素占可见像素约 85%。

```text
A single harmless cartoon fishing spear item sprite for a family-friendly black-and-white underwater game, isolated on transparent background. Pure side view, a thin long black rod extending horizontally with a double-barbed spear tip pointing RIGHT. Simple plain tiny collar at rear LEFT. No grip, handle, trigger, launcher or housing: ONLY the separate long narrow rod and its hooked tip. Long-to-tall ratio about 7 to 1. Solid black hand-ink silhouette with two narrow white shine lines along the shaft and small white highlights inside the hooked tip. Two clearly visible backward curving notches on the head, to read as a fishing harpoon rather than a generic arrow. Clean chunky comic ink, no fine texture, no glow. Centered and complete with large transparent margins. No person, fish, text, action or violence. Intended final sprite length 72 pixels, so keep only a few clear shapes.
```

## 水下手雷

[grenade.png](grenade.png)，生成结果 `exec-305c0950-1097-40fc-9e46-0e905a261325.png`。

```text
Use case: stylized-concept. Asset type: transparent sprite of a compact underwater hand grenade for a black and white cartoon side-scrolling game. One single whole grenade, side view pointing right, isolated. Short oval black metal canister with white riveted center band, a visible small arming lever and safety ring on top, two short stabilizer fins at the rear left, rounded sturdy front right. Looks hand thrown, NOT a falling barrel or bomb with a giant downward nose, not a rocket or torpedo, no propeller. Bold clean hand ink outline, simple opaque white and black fills with restrained grey, same friendly thick ink cartoon style as the supplied game assets, no photoreal textures. Readable at 32 pixels wide. Full silhouette, generous transparent margins. No explosions, trails, text, badges, borders or scene. True transparent background.
```

## 盾牌潜水兵

[shield-diver.png](shield-diver.png)，生成结果 `exec-f8814e27-7dd4-4b71-9aa6-05133a1da10e.png`。参考已有 [敌人持枪原图](../v086/enemy-loadouts.png)。四帧为瞄准、两个游动步态、受击；破盾复用第一关已接入的六帧碎盾素材。

```text
Use case: precise-object-edit. Use the supplied image ONLY as the exact character/style reference. Create a NEW 2 by 2 sprite sheet of FOUR complete SHIELD DIVER poses on true transparent background. Same black hood, opaque white mask/gloves/limbs, twin air tanks, flippers, same friendly hand-ink line weight and simple shading as reference. Every diver faces LEFT and holds the same harpoon gun pointing horizontally left, with a large rounded rectangular BLACK-RIMMED WHITE ballistic shield strapped to the front forearm below the gun, covering torso but not hiding face, barrel or muzzle. The shield has a small dark viewing slot and a black lower rim, no text or logo. Top left: upright hovering aim with flippers down. Top right: swimming forward with one leg extended back right and one bent. Bottom left: swimming alternate stroke with the other leg extended back, visibly different. Bottom right: clear recoil from a hit, torso leaning back and shield cracked but intact, gun still in hand. All four keep identical head/body size and shield/gun design. Each whole character has ample transparent separation; no cut edges. No fired projectiles, muzzle flash, particles, motion trails, environment, grid lines, letters, labels or watermark. Keep the same proportions as the reference rather than a highly detailed soldier. White body parts remain solid opaque white.
```
