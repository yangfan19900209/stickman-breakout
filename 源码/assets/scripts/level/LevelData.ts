import { EnemyKind, Rect } from "../core/Types";
import { GameConfig } from "../core/GameConfig";
import { ObjectData } from "../world/DestructibleObject";
import { LandLevelWidth, road, roadHeight } from "./TerrainProfile";
import { landDeckThickness, landScaffoldThickness, LandScaffoldTop } from "./LandDeckProfile";
import { bridgeRig } from "../render/BridgePresentation";
export interface Solid extends Rect {
  kind: "ground" | "step" | "crate" | "platform" | "support";
  supported?: boolean; // Authored optional deck; floating and one-way.
  supportFor?: number;
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
  unlockAfter?: "mini";
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
export interface RecoveryPoint {
  id: string;
  x: number;
  y: number;
  purpose: "after-encounter" | "before-boss";
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
  recoveryPoints?: RecoveryPoint[];
}
export const AbandonedBase: LevelDefinition = {
  name: "废弃前哨站",
  width: LandLevelWidth,
  spawn: { x: 110, y: 150 },
  exit: { x: LandLevelWidth - 130, y: 150 },
  solids: [
    ...road.map((r) => ({ ...r, kind: "ground" as const })),
    { x: 420, y: 150, w: 76, h: 54, kind: "crate" },
    { x: 1150, y: 248, w: 340, h: 14, kind: "platform" },
    { x: 1750, y: 150, w: 64, h: 64, kind: "crate" },
    { x: 2300, y: 266, w: 320, h: 16, kind: "platform" },
    { x: 2710, y: 150, w: 72, h: 60, kind: "crate" },
    { x: 3300, y: 320, w: 160, h: 16, kind: "platform" },
    { x: 4300, y: 292, w: 250, h: 18, kind: "platform" },
    { x: 5520, y: 278, w: 240, h: 16, kind: "platform" },
    // The tank is a midpoint encounter. A two-tier freight yard follows it;
    // every overhead deck leaves a full standing route underneath.
    { x: 7300, y: 292, w: 360, h: 16, kind: "platform" },
    { x: 8190, y: 314, w: 300, h: 16, kind: "platform" },
    // A second encounter uses cover and a shoot-down bridge rather than
    // immediately repeating the tank or extending an empty boss approach.
    { x: 9000, y: 320, w: 320, h: 16, kind: "platform" },
    // Repair corridor: two separated firing decks and ground-level cover.
    // Their lower passages remain clear; the main road stays continuous.
    { x: 11300, y: 244, w: 340, h: 16, kind: "platform" },
    { x: 12500, y: 244, w: 320, h: 16, kind: "platform" },
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
    { id: "rifle-C1", kind: "ranged", x: 4790, y: 150, patrol: 45 },
    { id: "rifle-E0", kind: "ranged", x: 7140, y: 150, patrol: 35 },
    { id: "rifle-E1", kind: "ranged", x: 7480, y: 308, patrol: 75 },
    { id: "charge-E1", kind: "melee", x: 7760, y: 150, patrol: 60 },
    { id: "shield-E", kind: "shield", x: 8120, y: 150, patrol: 50 },
    { id: "rifle-E2", kind: "ranged", x: 8380, y: 330, patrol: 60 },
    { id: "rifle-E3", kind: "ranged", x: 8640, y: 150, patrol: 35 },
    { id: "charge-F0", kind: "melee", x: 8925, y: 150, patrol: 40 },
    { id: "rifle-F1", kind: "ranged", x: 9160, y: 336, patrol: 60 },
    { id: "shield-F", kind: "shield", x: 9410, y: 150, patrol: 40 },
    { id: "charge-F", kind: "melee", x: 9760, y: 150, patrol: 50 },
    { id: "turret-F", kind: "turret", x: 10100, y: 150, patrol: 0 },
    { id: "rifle-F2", kind: "ranged", x: 10500, y: 150, patrol: 40 },
    { id: "shield-G1", kind: "shield", x: 11270, y: 150, patrol: 30 },
    { id: "rifle-G1", kind: "ranged", x: 11440, y: 260, patrol: 55 },
    { id: "charge-G1", kind: "melee", x: 11810, y: 150, patrol: 45 },
    { id: "shield-G2", kind: "shield", x: 12470, y: 150, patrol: 30 },
    { id: "rifle-G2", kind: "ranged", x: 12640, y: 260, patrol: 55 },
    { id: "turret-G", kind: "turret", x: 12980, y: 150, patrol: 0 },
    {
      id: "outpost-tank",
      kind: "guard",
      x: 6160,
      y: 150,
      patrol: 0,
      health: GameConfig.boss.miniHealth,
      encounter: "mini",
    },
    {
      id: "gate-colossus",
      kind: "colossus",
      x: LandLevelWidth - 360,
      y: 150,
      patrol: 0,
      encounter: "final",
    },
  ] as EnemySpawn[],
  objects: [
    {
      id: "entry-crate",
      kind: "wood",
      x: 300,
      y: 150,
      w: 55,
      h: 50,
    },
    {
      id: "crate-01",
      kind: "wood",
      x: 420,
      y: 150,
      w: 76,
      h: 54,
    },
    { id: "barrel-01", kind: "barrel", x: 660, y: 150, w: 38, h: 58 },
    { id: "barrel-02", kind: "barrel", x: 735, y: 150, w: 38, h: 58 },
    {
      id: "upper-crate-A",
      kind: "wood",
      x: 1350,
      y: 262,
      w: 55,
      h: 50,
    },
    { id: "hanging-01", kind: "hanging", x: 1530, y: 410, w: 54, h: 48 },
    {
      id: "crate-02",
      kind: "wood",
      x: 1750,
      y: 150,
      w: 64,
      h: 64,
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
    },
    {
      id: "concrete-B",
      kind: "concrete",
      x: 3100,
      y: 150,
      w: 58,
      h: 62,
    },
  ] as ObjectData[],
  zones: [
    { id: "A", name: "道路遭遇", start: 0, end: 1850 },
    { id: "B", name: "工业突破", start: 1850, end: 3800 },
    { id: "C", name: "机械阵地", start: 3800, end: 6740 },
    { id: "E", name: "运输栈道", start: 6740, end: 8840 },
    { id: "F", name: "封锁哨线", start: 8840, end: 10940 },
    { id: "G", name: "维修长廊", start: 10940, end: 13340 },
    { id: "D", name: "裁决者决战", start: 13340, end: LandLevelWidth },
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
      id: "bridge-F",
      kind: "bridge",
      x: 9690,
      y: 302,
      w: 220,
      h: 14,
      minY: 150,
      maxY: 302,
      speed: 0,
      ropeId: "bridge-rope-F",
    },
  ],
  arena: { start: LandLevelWidth - 1360, end: LandLevelWidth - 30 },
  // One optional +2 recovery after each costly stretch or before a boss.
  // They appear only when the player is nearby and missing at least two hearts.
  recoveryPoints: [
    { id: "after-industry", x: 3756, y: roadHeight(3756), purpose: "after-encounter" },
    { id: "before-tank", x: 5110, y: roadHeight(5110), purpose: "before-boss" },
    { id: "after-freight", x: 8810, y: roadHeight(8810), purpose: "after-encounter" },
    { id: "after-blockade", x: 10800, y: roadHeight(10800), purpose: "after-encounter" },
    { id: "before-colossus", x: 13180, y: roadHeight(13180), purpose: "before-boss" },
  ],
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
  // Every stone barrier is permanent concrete; destructible steel cannot
  // masquerade as this material and collapse like a crate.
  { id: "concrete-C", kind: "concrete", x: 3880, y: 150, w: 90, h: 40 },
  {
    id: "upper-crate-C",
    kind: "wood",
    x: 4420,
    y: 310,
    w: 56,
    h: 48,
    hidden: true,
  },
  { id: "barrel-C1", kind: "barrel", x: 5580, y: 150, w: 38, h: 58 },
  { id: "barrel-C2", kind: "barrel", x: 5680, y: 150, w: 38, h: 58 },
  {
    id: "rocket-before-tank",
    kind: "wood",
    x: 4880,
    y: 150,
    w: 53,
    h: 48,
    drop: "rocket",
    dropChance: 1,
  },
  { id: "cargo-C", kind: "hanging", x: 5980, y: 425, w: 56, h: 50 },
  {
    id: "rocket-before-colossus",
    kind: "wood",
    x: 13270,
    y: 150,
    w: 58,
    h: 48,
    drop: "rocket",
    dropChance: 1,
  },
  { id: "arena-sandbag", kind: "sandbag", x: 14010, y: 150, w: 80, h: 40 },
  { id: "arena-barrel", kind: "barrel", x: 14190, y: 150, w: 38, h: 58 },
  // Two grenade resupplies in the entire chapter: after the tank and before
  // the colossus. Ordinary crates no longer refill grenades along the route.
  { id: "grenades-E", kind: "wood", x: 6950, y: 150, w: 55, h: 50, drop: "grenades", dropChance: 1 },
  { id: "sandbag-E1", kind: "sandbag", x: 7680, y: 150, w: 80, h: 40 },
  { id: "barrel-E1", kind: "barrel", x: 7830, y: 150, w: 38, h: 58 },
  { id: "upper-crate-E", kind: "wood", x: 8220, y: 330, w: 56, h: 48, hidden: true },
  { id: "sandbag-E2", kind: "sandbag", x: 8560, y: 150, w: 80, h: 40 },
  { id: "upper-crate-F", kind: "wood", x: 9070, y: 336, w: 53, h: 48 },
  { id: "sandbag-F", kind: "sandbag", x: 9220, y: 150, w: 80, h: 40 },
  { id: "barrel-F", kind: "barrel", x: 9520, y: 150, w: 38, h: 58 },
  { id: "bridge-rope-F", kind: "rope", x: 9750, y: 322, w: 14, h: 102, link: "bridge-F" },
  { id: "concrete-F", kind: "concrete", x: 10000, y: 150, w: 90, h: 40 },
  { id: "crate-F", kind: "wood", x: 10330, y: 150, w: 56, h: 48 },
  { id: "concrete-G", kind: "concrete", x: 11080, y: 150, w: 148, h: 64 },
  { id: "barrel-G1", kind: "barrel", x: 11690, y: 150, w: 38, h: 58 },
  { id: "crate-G", kind: "wood", x: 12010, y: 150, w: 56, h: 48 },
  { id: "sandbag-G", kind: "sandbag", x: 12270, y: 150, w: 145, h: 64 },
  { id: "barrel-G2", kind: "barrel", x: 12855, y: 150, w: 38, h: 58 },
  // A short quiet resupply approach follows the last corridor encounter.
  { id: "grenades-before-final", kind: "wood", x: 13090, y: 150, w: 53, h: 48, drop: "grenades", dropChance: 1 },
);

// Gentle height variation keeps optional routes within a single normal jump.
// Move attached enemies/caches with their actual support, never leave old
// collision steps underneath a visually flat road.
for (const deck of AbandonedBase.solids.filter(s=>s.kind === "platform")) {
  const oldTop = deck.y + deck.h, top = LandScaffoldTop + ([2300,8190,12500].includes(deck.x)?6:0);
  for (const e of AbandonedBase.enemies)
    if (e.x >= deck.x && e.x <= deck.x + deck.w && e.y === oldTop) e.y = top;
  for (const o of AbandonedBase.objects) {
    if (o.x + o.w/2 < deck.x || o.x + o.w/2 > deck.x + deck.w) continue;
    if (o.y === oldTop) o.y += top - oldTop;
  }
  deck.h = landScaffoldThickness(deck.w);
  deck.y = top - deck.h;
  deck.supported = true;
  deck.oneWay = true;
}
// Fixed low/high routes replace the lifts. Rise of 82–88 and short gaps
// allow a normal jump from the lower deck; all ground routes stay open.
// Mini arena: 5520 low -> 5890 high <- 6300 low, with room to drop and dodge.
for (const [x, top, w] of [
  [1610, 348, 260], [2750, 354, 220],
  [4670, 348, 240], [5030, 260, 240],
  [5890, 348, 280], [6300, 260, 240],
  [7780, 348, 260], [9440, 348, 220],
  [11770, 348, 260],
  [13480, 260, 260], [13870, 324, 240], [14250, 260, 260],
]) {
  const h = landScaffoldThickness(w);
  AbandonedBase.solids.push({ x, y: top - h, w, h, kind: "platform", supported: true, oneWay: true });
}
for (const m of AbandonedBase.mechanisms ?? []) {
  m.h = landDeckThickness(m.w);
  m.maxY = 320 - m.h;
  if (m.kind === "bridge") {
    m.y = m.maxY;
    const rope = AbandonedBase.objects.find(o=>o.id === m.ropeId);
    if (rope) Object.assign(rope,bridgeRig(m).rope);
  }
}
// Keep tall cover outside the full-height passage beneath the decks.
AbandonedBase.objects.find(o=>o.id === "barrel-03")!.x = 2230;
AbandonedBase.objects.find(o=>o.id === "barrel-C1")!.x = 5330;
AbandonedBase.objects.find(o=>o.id === "barrel-C2")!.x = 5420;
AbandonedBase.objects.find(o=>o.id === "cargo-C")!.x = 6600;
// The new first high link must not land on a shot-down cargo crate mid-jump.
AbandonedBase.objects.find(o=>o.id === "hanging-01")!.x = 2110;

// Readable chest-high cover, with the same visible and physical envelope.
for(const o of AbandonedBase.objects){
  if(o.kind !== "sandbag" && o.kind !== "concrete" && o.kind !== "steel") continue;
  const center=o.x+o.w/2;
  o.w=o.kind === "sandbag" ? 145 : 148; o.h=64;
  o.x=center-o.w/2;
}
for(const [id,x] of [["sandbags-B",3508],["sandbag-E1",7700],["barrel-E1",7895],["sandbag-F",9370],["barrel-F",9570]] as const)
  AbandonedBase.objects.find(o=>o.id===id)!.x=x;
// Keep the established encounter spacing and avoid enlarged cover at spawns.
for(const [id,x] of [["r3",2045],["m3",2670],["turret-B",3700],["charge-E1",7870],["rifle-E3",8725],["shield-F",9645],["turret-F",10200]] as const)
  AbandonedBase.enemies.find(e=>e.id===id)!.x=x;

// Grounded objects share the same authored support surface.
for (const s of AbandonedBase.solids)
  if (s.kind !== "ground" && s.y === 150) s.y = roadHeight(s.x + s.w / 2);
for (const o of AbandonedBase.objects)
  if (o.y === 150) o.y = roadHeight(o.x + o.w / 2);
for (const e of AbandonedBase.enemies) {
  // The following encounter cannot join the tank fight or appear early.
  if (!e.encounter && e.x >= 6740) e.unlockAfter = "mini";
  e.onPlatform = e.y > 150;
  if (!e.onPlatform) e.y = roadHeight(e.x);
}
