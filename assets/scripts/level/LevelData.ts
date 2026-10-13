import { EnemyKind, Rect } from "../core/Types";
export interface Solid extends Rect {
  kind: "ground" | "step" | "crate" | "platform";
}
export interface EnemySpawn {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
  patrol: number;
}
export const AbandonedBase = {
  name: "废弃基地",
  width: 4000,
  spawn: { x: 110, y: 150 },
  exit: { x: 3860, y: 150 },
  solids: [
    { x: 0, y: 50, w: 4000, h: 100, kind: "ground" },
    { x: 420, y: 150, w: 76, h: 54, kind: "crate" },
    { x: 950, y: 150, w: 92, h: 48, kind: "step" },
    { x: 1042, y: 150, w: 90, h: 88, kind: "step" },
    { x: 1150, y: 248, w: 340, h: 14, kind: "platform" },
    { x: 1430, y: 360, w: 205, h: 14, kind: "platform" },
    { x: 1750, y: 150, w: 64, h: 64, kind: "crate" },
    { x: 2040, y: 150, w: 100, h: 55, kind: "step" },
    { x: 2140, y: 150, w: 100, h: 95, kind: "step" },
    { x: 2300, y: 266, w: 320, h: 16, kind: "platform" },
    { x: 2710, y: 150, w: 72, h: 60, kind: "crate" },
    { x: 2920, y: 150, w: 160, h: 50, kind: "step" },
  ] as Solid[],
  enemies: [
    { id: "m1", kind: "melee", x: 620, y: 150, patrol: 60 },
    { id: "r1", kind: "ranged", x: 850, y: 150, patrol: 35 },
    { id: "r2", kind: "ranged", x: 1290, y: 262, patrol: 60 },
    { id: "m2", kind: "melee", x: 1540, y: 150, patrol: 65 },
    { id: "r3", kind: "ranged", x: 1950, y: 150, patrol: 40 },
    { id: "m3", kind: "melee", x: 2440, y: 150, patrol: 70 },
    { id: "r4", kind: "ranged", x: 2500, y: 282, patrol: 75 },
    { id: "m4", kind: "melee", x: 2860, y: 150, patrol: 65 },
    { id: "r5", kind: "ranged", x: 3230, y: 150, patrol: 35 },
    { id: "gate-guard", kind: "guard", x: 3560, y: 150, patrol: 30 },
  ] as EnemySpawn[],
};
