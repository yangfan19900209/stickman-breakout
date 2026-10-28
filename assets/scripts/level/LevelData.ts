import { EnemyKind, Rect } from "../core/Types";
import { ObjectData } from "../world/DestructibleObject";
import { road, roadHeight } from "./TerrainProfile";
export interface Solid extends Rect {
  kind: "ground" | "step" | "crate" | "platform";
  entityId?: string;
  breakable?: boolean;
  oneWay?: boolean;
}
export interface EnemySpawn {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
  patrol: number;
  health?: number;
  onPlatform?: boolean;
  encounter?: "mini" | "final";
}
export interface MechanismData {
  id: string;
  kind: "lift" | "bridge";
  x: number;
  y: number;
  w: number;
  h: number;
  minY: number;
  maxY: number;
  speed: number;
  ropeId?: string;
}
export interface ZoneData {
  id: string;
  name: string;
  start: number;
  end: number;
}
export interface LevelDefinition {
  name: string;
  width: number;
  spawn: { x: number; y: number };
  exit: { x: number; y: number };
  solids: Solid[];
  enemies: EnemySpawn[];
  objects: ObjectData[];
  zones?: ZoneData[];
  mechanisms?: MechanismData[];
  arena?: { start: number; end: number };
}
export const AbandonedBase: LevelDefinition = {
  name: "废弃前哨站",
  width: 8200,
  spawn: { x: 110, y: 150 },
  exit: { x: 8070, y: 150 },
  solids: [
    ...road.map((r) => ({ ...r, kind: "ground" as const })),
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
    // Leave standing/jumping clearance above the raised exit and its cover.
    { x: 3300, y: 320, w: 160, h: 16, kind: "platform" },
    { x: 4150, y: 150, w: 85, h: 58, kind: "step" },
    { x: 4235, y: 150, w: 85, h: 108, kind: "step" },
    { x: 4300, y: 292, w: 250, h: 18, kind: "platform" },
    { x: 5200, y: 278, w: 390, h: 16, kind: "platform" },
    { x: 5900, y: 150, w: 180, h: 50, kind: "step" },
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
    { id: "shield-B", kind: "shield", x: 2810, y: 150, patrol: 45 },
    { id: "turret-B", kind: "turret", x: 3600, y: 150, patrol: 0 },
    { id: "shield-C", kind: "shield", x: 4100, y: 150, patrol: 45 },
    { id: "charge-C", kind: "melee", x: 4650, y: 150, patrol: 40 },
    { id: "rifle-C1", kind: "ranged", x: 4900, y: 150, patrol: 45 },
    { id: "rifle-C2", kind: "ranged", x: 5360, y: 294, patrol: 70 },
    { id: "turret-C", kind: "turret", x: 5800, y: 150, patrol: 0 },
    { id: "shield-C2", kind: "shield", x: 6280, y: 150, patrol: 40 },
    { id: "rifle-C3", kind: "ranged", x: 6530, y: 150, patrol: 30 },
    {
      id: "outpost-tank",
      kind: "guard",
      x: 6160,
      y: 150,
      patrol: 0,
      health: 42,
      encounter: "mini",
    },
    {
      id: "gate-colossus",
      kind: "colossus",
      x: 7840,
      y: 150,
      patrol: 0,
      encounter: "final",
    },
  ] as EnemySpawn[],
  objects: [
    {
      id: "shotgun-cache",
      kind: "wood",
      x: 300,
      y: 150,
      w: 55,
      h: 50,
      drop: "shotgun",
      dropChance: 1,
    },
    {
      id: "crate-01",
      kind: "wood",
      x: 420,
      y: 150,
      w: 76,
      h: 54,
      drop: "health",
      dropChance: 0.7,
    },
    { id: "barrel-01", kind: "barrel", x: 660, y: 150, w: 38, h: 58 },
    { id: "barrel-02", kind: "barrel", x: 735, y: 150, w: 38, h: 58 },
    {
      id: "rocket-cache",
      kind: "wood",
      x: 1350,
      y: 262,
      w: 55,
      h: 50,
      drop: "rocket",
      dropChance: 1,
    },
    { id: "hanging-01", kind: "hanging", x: 1530, y: 410, w: 54, h: 48 },
    {
      id: "crate-02",
      kind: "wood",
      x: 1750,
      y: 150,
      w: 64,
      h: 64,
      drop: "grenades",
      dropChance: 1,
    },
    { id: "sandbags-01", kind: "sandbag", x: 1890, y: 150, w: 85, h: 44 },
    { id: "barrel-03", kind: "barrel", x: 2410, y: 150, w: 38, h: 58 },
    {
      id: "crate-03",
      kind: "wood",
      x: 2710,
      y: 150,
      w: 72,
      h: 60,
      drop: "health",
      dropChance: 0.6,
    },
    {
      id: "steel-01",
      kind: "steel",
      x: 3100,
      y: 150,
      w: 58,
      h: 62,
      drop: "rocket",
      dropChance: 1,
    },
  ] as ObjectData[],
  zones: [
    { id: "A", name: "道路遭遇", start: 0, end: 1850 },
    { id: "B", name: "工业突破", start: 1850, end: 3800 },
    { id: "C", name: "机械阵地", start: 3800, end: 6740 },
    { id: "D", name: "裁决者决战", start: 6740, end: 8200 },
  ],
  mechanisms: [
    {
      id: "bridge-B",
      kind: "bridge",
      x: 3080,
      y: 266,
      w: 210,
      h: 14,
      minY: 150,
      maxY: 266,
      speed: 0,
      ropeId: "bridge-rope",
    },
    {
      id: "lift-C",
      kind: "lift",
      x: 5000,
      y: 152,
      w: 142,
      h: 16,
      minY: 152,
      maxY: 318,
      speed: 65,
    },
  ],
  arena: { start: 6840, end: 8170 },
};
AbandonedBase.objects.push(
  {
    id: "bridge-rope",
    kind: "rope",
    x: 3140,
    y: 285,
    w: 14,
    h: 102,
    link: "bridge-B",
  },
  { id: "sandbags-B", kind: "sandbag", x: 3520, y: 150, w: 75, h: 44 },
  { id: "cargo-B", kind: "hanging", x: 3590, y: 440, w: 65, h: 55 },
  {
    id: "health-B",
    kind: "wood",
    x: 3730,
    y: 150,
    w: 52,
    h: 47,
    drop: "health",
    dropChance: 1,
  },
  { id: "concrete-C", kind: "concrete", x: 3880, y: 150, w: 90, h: 72 },
  {
    id: "hidden-rockets",
    kind: "wood",
    x: 4420,
    y: 310,
    w: 56,
    h: 48,
    drop: "rocket",
    dropChance: 1,
    hidden: true,
  },
  { id: "barrel-C1", kind: "barrel", x: 5580, y: 150, w: 38, h: 58 },
  { id: "barrel-C2", kind: "barrel", x: 5680, y: 150, w: 38, h: 58 },
  {
    id: "grenades-C",
    kind: "wood",
    x: 5800,
    y: 150,
    w: 53,
    h: 48,
    drop: "grenades",
    dropChance: 1,
  },
  { id: "cargo-C", kind: "hanging", x: 5980, y: 425, w: 56, h: 50 },
  {
    id: "health-C",
    kind: "wood",
    x: 6630,
    y: 150,
    w: 56,
    h: 48,
    drop: "health",
    dropChance: 1,
  },
  {
    id: "arena-rockets",
    kind: "wood",
    x: 7100,
    y: 150,
    w: 58,
    h: 48,
    drop: "rocket",
    dropChance: 1,
  },
  { id: "arena-sandbag", kind: "sandbag", x: 7410, y: 150, w: 80, h: 40 },
  { id: "arena-barrel", kind: "barrel", x: 7590, y: 150, w: 38, h: 58 },
);

// Attach ground props to the authored level pads; elevated caches keep their platform heights.
for (const s of AbandonedBase.solids)
  if (s.kind !== "ground" && s.y === 150) s.y = roadHeight(s.x + s.w / 2);
for (const o of AbandonedBase.objects)
  if (o.y === 150) o.y = roadHeight(o.x + o.w / 2);
for (const e of AbandonedBase.enemies) {
  e.onPlatform = e.y > 150;
  if (!e.onPlatform) e.y = roadHeight(e.x);
}
