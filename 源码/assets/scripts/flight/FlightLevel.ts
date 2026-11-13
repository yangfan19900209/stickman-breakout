import { Rect } from "../core/Types";

export type FlightWeapon = "rifle" | "rocket" | "knife";
export type FlightEnemyKind = "rifle" | "drone" | "helicopter";
export interface FlightObstacle extends Rect {
  id: string;
  kind: "deck" | "bridge" | "roof";
}
export interface FlightEnemySpawn {
  id: string;
  kind: FlightEnemyKind;
  x: number;
  y: number;
  patrolMin: number;
  patrolMax: number;
}

/** P0/P1 flight slice. The command airship and full nine-zone route are not part of this build. */
export const FlightLevel = {
  width: 6500,
  floor: 80,
  ceiling: 780,
  spawn: { x: 220, y: 280 },
  launchDuration: 3.2,
  speed: 300,
  brake: 2600,
  dodgeSpeed: 640,
  dodgeTime: .18,
  dodgeCooldown: 1.8,
  arenaStart: 3700,
  bossTrigger: 3900,
  arenaEnd: 5800,
  gate: { x: 5860, y: 80, w: 30, h: 700 },
  exit: { x: 6280, y: 250 },
  zones: [
    { start: 0, end: 700, name: "甲板试飞", hint: "摇杆上下左右飞行 · 松手悬停" },
    { start: 700, end: 2400, name: "屋顶巡逻", hint: "上下换位躲开锁线射击" },
    { start: 2400, end: 3300, name: "天桥绕行", hint: "从天桥上方或下方穿过" },
    { start: 3300, end: 3900, name: "战前整备", hint: "拾取火箭 · 准备拦截战" },
    { start: 3900, end: 5860, name: "猎隼拦截战", hint: "观察预警 · 上下绕行" },
    { start: 5860, end: 6500, name: "接应甲板", hint: "试飞样段终点 · 向右返航" },
  ],
  obstacles: [
    { id: "launch-deck", kind: "deck", x: 0, y: 80, w: 660, h: 90 },
    { id: "roof-a", kind: "roof", x: 1040, y: 80, w: 390, h: 120 },
    { id: "bridge-a", kind: "bridge", x: 1700, y: 450, w: 310, h: 32 },
    { id: "roof-b", kind: "roof", x: 2240, y: 80, w: 350, h: 160 },
    { id: "bridge-b", kind: "bridge", x: 2810, y: 480, w: 330, h: 32 },
    { id: "return-deck", kind: "deck", x: 6040, y: 80, w: 460, h: 90 },
  ] as FlightObstacle[],
  enemies: [
    { id: "air-rifle-1", kind: "rifle", x: 1000, y: 320, patrolMin: 800, patrolMax: 1480 },
    { id: "air-drone-1", kind: "drone", x: 1750, y: 570, patrolMin: 1380, patrolMax: 2180 },
    { id: "air-rifle-2", kind: "rifle", x: 2350, y: 330, patrolMin: 2080, patrolMax: 2640 },
    { id: "air-drone-2", kind: "drone", x: 2810, y: 600, patrolMin: 2550, patrolMax: 3120 },
  ] as FlightEnemySpawn[],
  boss: { id: "falcon", kind: "helicopter", x: 4750, y: 390,
    patrolMin: 3700, patrolMax: 5800 } as FlightEnemySpawn,
  supplies: [
    { x: 1500, y: 320, kind: "airburst", source: "trial-airburst" },
    { x: 3430, y: 350, kind: "medkit", source: "trial-preboss-health" },
    { x: 3590, y: 350, kind: "rocket", source: "trial-preboss-rockets" },
  ] as { x: number; y: number; kind: "medkit" | "rocket" | "airburst"; source: string }[],
} as const;
