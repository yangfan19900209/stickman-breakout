import { GameConfig as C } from "../core/GameConfig";

/** The tutorial keeps its generous timing; pressure grows through composition
 * and recovery windows, while every committed attack retains its warning. */
export function oceanPressure(x:number):number { return x<2400?0:x<6200?.45:1; }
export const oceanAttackBudget=(x:number):number=>x<2400?2:x<6200?3:4;
export const oceanNearLockRange = 420;
// Density comes from repeated, separately warned attacks and spreading lanes.
// Ordinary harpoon/sonar attacks each release one projectile, then pause.
export const oceanVolleyCount = (x:number):number => x<2400?1:x<6200?2:3;
export const oceanRangedRest = { betweenAttacks:1.4, afterSequence:2.0 } as const;
export function oceanVolleyOffsets(source:string):readonly number[] {
  if(source === "turret")return [0,-.16,.16];
  return [0];
}
export const OceanWeaponDamage = { harpoon:1, sonar:2, torpedo:C.playerBossDamage.rocket } as const;
export const OceanBossWeaponDamage = { harpoon:C.playerBossDamage.bullet, sonar:C.playerBossDamage.sonar, torpedo:C.playerBossDamage.rocket } as const;
export const OceanFireInterval = { harpoon:.36, sonar:.43, torpedo:.80 } as const;
export const OceanWeaponAmmo = { sonar:24, torpedo:C.weapons.rocket.ammo } as const;

export type OceanShotTier = "standard" | "mini" | "boss";
/** Both owners share the same silhouette and swept hit radius; tier scales both. */
export function oceanShotProfile(kind: string, tier: OceanShotTier = "standard") {
  if(kind === "bomb" && tier === "boss") return {width:64,height:64*762/1038,radius:22};
  const scale = tier === "boss" ? 1.25 : tier === "mini" ? 1.15 : 1;
  const [width, height, radius] = kind === "harpoon" ? [72, 72 * 235 / 2075 * 1.25, 4]
    : kind === "sonar" ? [40, 40, 18]
    : kind === "torpedo" ? [58, 58 * 286 / 524, 10] : [34, 34 * 762 / 1038, 12];
  return { width: width * scale, height: height * scale, radius: radius * scale };
}

export const oceanBossTuning = {
  health: 140,
  recovery: [.35, .28, .22],
  sonarOffsets: [-.48, 0, .48],
  sonarVolleyInterval: .75,
  retreatApron: 500,
  edgeClearance: 140,
  cruiseSpeed: 155,
  chaseSpeed: 280,
  verticalSpeed: 105,
  preferredGap: 530,
};

export function oceanReticleStyle(lockAge:number,locked:boolean,zoom:number) {
  const progress=Math.max(0,Math.min(1,lockAge/.36)), ease=Math.pow(1-progress,3);
  return {progress,radius:(locked?18+56*ease:10)/zoom,
    line:(locked?1.2+1.1*ease:1.2)/zoom,halo:(locked?3.2+2.8*ease:3)/zoom};
}

/** The authored burst contains its own flash and pressure cloud. Extra outline
 * rings/flash discs can look like a transient black frame on mobile. */
export function oceanBlastVisual(age:number) {
  const fade=Math.max(0,Math.min(1,(.95-age)/.48));
  return {frame:Math.min(7,Math.floor(age*12)),opacity:Math.round(255*fade),
    cloudScale:1.15};
}
