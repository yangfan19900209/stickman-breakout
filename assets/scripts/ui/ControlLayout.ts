import { clamp } from "../core/Types";
export interface SafeInsets {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
export function controlLayout(
  insets: SafeInsets = { left: 0, right: 0, top: 0, bottom: 0 },
) {
  const l = clamp(insets.left, 0, 90),
    r = clamp(insets.right, 0, 90),
    b = clamp(insets.bottom, 0, 45),
    t = clamp(insets.top, 0, 45);
  return {
    joystick: { x: 140 + l, y: 105 + b, r: 66 },
    jump: { x: 1034 - r, y: 170 + b },
    shoot: { x: 1162 - r, y: 100 + b },
    grenade: { x: 934 - r, y: 92 + b },
    pause: { x: 1204 - r, y: 686 - t },
  };
}
