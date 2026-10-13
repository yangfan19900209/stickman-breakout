import { clamp } from "../core/Types";
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
) {
  const sideLimit = Math.min(180, 90 + Math.max(0, width - 960) / 2);
  const l = clamp(insets.left, 0, sideLimit),
    r = clamp(insets.right, 0, sideLimit),
    b = clamp(insets.bottom, 0, 120),
    t = clamp(insets.top, 0, 120);
  return {
    joystick: { x: 158 + l, y: 128 + b, r: 92, hit: 224 },
    jump: { x: width - 292 - r, y: 170 + b, r: 62, hit: 152 },
    shoot: { x: width - 116 - r, y: 126 + b, r: 76, hit: 180 },
    grenade: { x: width - 436 - r, y: 90 + b, r: 48, hit: 120 },
    pause: { x: width - 66 - r, y: height - 54 - t, hit: 88 },
  };
}
