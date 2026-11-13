import { clamp, Rect } from "../core/Types";
export interface SafeInsets {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
export function controlLayout(
  insets: SafeInsets = { left: 0, right: 0, top: 0, bottom: 0 },
  width = 1280,
  height = 720,
  cssHeight = 390,
  systemMenu?: Rect,
) {
  const sideLimit = Math.min(180, 90 + Math.max(0, width - 960) / 2);
  const l = clamp(insets.left, 0, sideLimit),
    r = clamp(insets.right, 0, sideLimit),
    b = clamp(insets.bottom, 0, 120),
    t = clamp(insets.top, 0, 120);
  const k = height / cssHeight,
    baseR = (clamp(cssHeight * 0.375, 136, 156) * k) / 2,
    knobR = (clamp(cssHeight * 0.18, 62, 76) * k) / 2,
    dragR = clamp(cssHeight * 0.133, 45, 58) * k;
  const fireDiameter = clamp(cssHeight * 0.3, 108, 122) * k,
    jumpDiameter = clamp(cssHeight * 0.18, 64, 76) * k,
    grenadeDiameter = clamp(cssHeight * 0.152, 54, 66) * k;
  const fireHit = fireDiameter + 14 * k,
    jumpHit = jumpDiameter + 12 * k,
    grenadeHit = grenadeDiameter + 12 * k;
  const fireX = width - r - 18 * k - fireHit / 2,
    // Equal thumb centres balance the persistent left base and the main attack button.
    fireY = b + Math.max(baseR + 16 * k, 12 * k + fireHit / 2);
  const pauseHit = clamp(cssHeight * 0.11, 44, 48) * k;
  // WeChat also places a circular host button to the left of the capsule.
  // Reserve the whole cluster only in the top HUD; thumb controls continue
  // using the physical screen safe area instead of a full-height dead strip.
  const systemLeft = systemMenu ? systemMenu.x - Math.max(36 * k, systemMenu.h) - 8 * k : width - r;
  const hudRight = Math.min(width - r, systemMenu ? systemLeft - 10 * k : width - r);
  const pauseX = hudRight - 8 * k - pauseHit / 2;
  const levelHalf = (systemMenu && width / k - l / k < 740 ? 50 : 66) * k;
  const levelX = pauseX - pauseHit / 2 - 8 * k - levelHalf;
  const trackWidth = levelHalf * 2 - 20 * k;
  const objectiveLeft = 363 * k + l, objectiveRight = levelX - levelHalf - 12 * k;
  const secondRow = objectiveRight - objectiveLeft < 140 * k;
  return {
    systemMenu: systemMenu ?? null,
    systemReservedLeft: systemMenu ? systemLeft : null,
    safeInsets: { left: l, right: r, bottom: b, top: t },
    hud: {
      levelX, levelWidth: levelHalf * 2, trackWidth, trackX: levelX - trackWidth / 2, secondRow,
      objectiveX: secondRow ? width / 2 : (objectiveLeft + objectiveRight) / 2,
      objectiveWidth: secondRow ? Math.min(width - l - r, 280 * k) : objectiveRight - objectiveLeft,
    },
    joystick: {
      x: baseR + 20 * k + l,
      y: baseR + 16 * k + b,
      r: dragR,
      baseR,
      knobR,
      hit: baseR * 2,
      unit: k,
    },
    jump: {
      x: fireX - (fireHit + jumpHit) / 2 - 10 * k,
      y: fireY + fireHit * 0.22 + 6 * k,
      r: jumpDiameter / 2,
      hit: jumpHit,
    },
    shoot: { x: fireX, y: fireY, r: fireDiameter / 2, hit: fireHit },
    grenade: {
      x: fireX + 6 * k,
      y: fireY + (fireHit + grenadeHit) / 2 + 8 * k,
      r: grenadeDiameter / 2,
      hit: grenadeHit,
    },
    pause: {
      x: pauseX,
      y: height - t - 6 * k - pauseHit / 2,
      hit: pauseHit,
    },
  };
}
