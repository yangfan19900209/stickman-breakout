import { terrainColliders, terrainForms } from "./OceanTerrain";
import { Rect } from "../core/Types";
export type OceanEnemyKind =
  | "diver"
  | "fish"
  | "kelp"
  | "turret"
  | "mine"
  | "captain";
export type OceanWeapon = "harpoon" | "sonar" | "torpedo" | "knife";
export type OceanEnemyWeapon = Exclude<OceanWeapon, "knife">;
export interface OceanObstacle extends Rect {
  art: string;
}
export const OceanLevel = {
  name: "深海突围",
  width: 16400,
  surface: 680,
  floor: 70,
  spawn: { x: 110, y: 720 },
  swimSpawn: { x: 840, y: 360 },
  arena: 15200,
  zones: [
    { start: 0, end: 800, name: "悬崖入海" },
    { start: 800, end: 2400, name: "浅海训练" },
    { start: 2400, end: 4300, name: "水草暗礁" },
    { start: 4300, end: 6200, name: "沉船前哨" },
    { start: 6200, end: 8500, name: "深水断层" },
    { start: 8500, end: 10800, name: "潜艇防线" },
    { start: 10800, end: 12800, name: "海沟伏击" },
    { start: 12800, end: 14800, name: "船坞外环" },
    { start: 14800, end: 15200, name: "战前整备" },
    { start: 15200, end: 16400, name: "巨型潜艇" },
  ],
  get obstacles(): OceanObstacle[] {
    return collisionSurfaces;
  },
  landforms: terrainForms([
    { x: 1650, y: 70, w: 180, h: 180, art: "terrain.rock.pillar" },
    { x: 2180, y: 510, w: 240, h: 170, art: "terrain.rock.ceiling" },
    { x: 2820, y: 70, w: 250, h: 160, art: "terrain.coral.shelf" },
    { x: 3650, y: 490, w: 300, h: 190, art: "terrain.rock.ceiling" },
    { x: 4450, y: 270, w: 420, h: 50, art: "terrain.wreck.deck" },
    { x: 4950, y: 480, w: 360, h: 45, art: "terrain.wreck.deck" },
    { x: 5360, y: 70, w: 190, h: 180, art: "terrain.wreck.wall" },
    { x: 6720, y: 70, w: 180, h: 260, art: "terrain.rock.pillar" },
    { x: 7350, y: 480, w: 250, h: 200, art: "terrain.rock.ceiling" },
    { x: 7930, y: 70, w: 180, h: 210, art: "terrain.rock.pillar" },
    { x: 8670, y: 70, w: 300, h: 150, art: "terrain.pipe.elbow" },
    { x: 9270, y: 440, w: 400, h: 50, art: "terrain.wreck.deck" },
    { x: 10100, y: 70, w: 270, h: 180, art: "terrain.pipe.straight" },
    { x: 11080, y: 70, w: 240, h: 220, art: "terrain.coral.shelf" },
    { x: 11600, y: 475, w: 290, h: 205, art: "terrain.rock.ceiling" },
    { x: 12300, y: 70, w: 230, h: 240, art: "terrain.rock.pillar" },
    { x: 13010, y: 390, w: 420, h: 50, art: "terrain.wreck.deck" },
    { x: 13660, y: 70, w: 230, h: 200, art: "terrain.wreck.wall" },
    { x: 14200, y: 455, w: 380, h: 50, art: "terrain.wreck.deck" },
  ] as OceanObstacle[]),
  currents: [
    { x: 7000, y: 80, w: 420, h: 270, vx: 65, vy: 30 },
    { x: 8100, y: 430, w: 350, h: 210, vx: -60, vy: -25 },
    { x: 11840, y: 90, w: 360, h: 300, vx: 40, vy: 45 },
  ],
  recovery: [
    { id: "kelp-rest", x: 4050 },
    { id: "captain-prep", x: 5580 },
    { id: "abyss-rest", x: 8410 },
    { id: "defense-rest", x: 10800 },
    { id: "trench-rest", x: 12720 },
    { id: "sub-prep", x: 14970 },
  ],
  crates: [
    { x: 1180, y: 82, drop: "sonar" },
    { x: 3270, y: 95, drop: "sonar" },
    { x: 4800, y: 325, drop: "depth-charge" },
    { x: 6440, y: 82, drop: "torpedo" },
    { x: 9100, y: 82, drop: "sonar" },
    { x: 10600, y: 82, drop: "torpedo" },
    { x: 11980, y: 82, drop: "sonar" },
    { x: 14040, y: 82, drop: "depth-charge" },
    { x: 15000, y: 82, drop: "torpedo" },
  ],
  enemies: [
    ["diver", 1450, 350, "harpoon"],
    ["fish", 2010, 300],
    ["diver", 2550, 400, "sonar"],
    ["diver", 2700, 280, "harpoon", true],
    ["kelp", 2900, 230],
    ["fish", 3220, 380],
    ["diver", 3480, 280, "harpoon"],
    ["diver", 4020, 440, "sonar"],
    ["kelp", 3880, 70],
    ["turret", 4630, 320],
    ["diver", 4840, 170, "harpoon"],
    ["diver", 5080, 400, "torpedo"],
    ["diver", 5230, 250, "sonar"],
    ["fish", 5320, 350],
    ["captain", 5860, 360],
    ["fish", 6500, 420],
    ["diver", 6940, 480, "harpoon", true],
    ["diver", 7160, 365, "sonar"],
    ["fish", 7250, 210],
    ["kelp", 7470, 70],
    ["fish", 7720, 380],
    ["diver", 8240, 300, "torpedo"],
    ["diver", 8380, 490, "harpoon"],
    ["turret", 8730, 220],
    ["mine", 9020, 330],
    ["fish", 9140, 470],
    ["diver", 9470, 320, "sonar"],
    ["diver", 9690, 510, "harpoon"],
    ["mine", 9840, 400],
    ["turret", 10250, 250],
    ["diver", 10450, 420, "torpedo"],
    ["diver", 11000, 440, "harpoon", true],
    ["fish", 11390, 340],
    ["diver", 11770, 250, "sonar"],
    ["fish", 12060, 430],
    ["diver", 12460, 460, "harpoon"],
    ["kelp", 12060, 70],
    ["diver", 13000, 240, "sonar"],
    ["turret", 13220, 440],
    ["fish", 13540, 330],
    ["diver", 13910, 450, "torpedo"],
    ["mine", 13990, 170],
    ["diver", 14360, 310, "harpoon", true],
    ["diver", 14610, 530, "sonar"],
  ] as [OceanEnemyKind, number, number, OceanEnemyWeapon?, boolean?][],
};

const collisionSurfaces = terrainColliders(OceanLevel.landforms);
