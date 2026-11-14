import { OceanWeapon } from "./OceanLevel";
import { SonarMotionPoses } from "./OceanUpdateFrames";
export const HarpoonMotionPoses = [
  {frame:"diver.harpoon.swim.0",size:[519,348],pivot:[295,211],muzzle:[508,195],scale:.196},
  {frame:"diver.harpoon.swim.1",size:[476,384],pivot:[252,212],muzzle:[465,194],scale:.196},
] as const;
export const TorpedoMotionPoses = [
  {
    frame: "diver.torpedo.hover.0",
    size: [369, 442],
    pivot: [150, 234],
    muzzle: [347, 223],
    scale: 0.18,
  },
  {
    frame: "diver.torpedo.hover.1",
    size: [391, 446],
    pivot: [160, 233],
    muzzle: [374, 222],
    scale: 0.18,
  },
  {
    frame: "diver.torpedo.swim.0",
    size: [493, 413],
    pivot: [275, 220],
    muzzle: [473, 209],
    scale: 0.18,
  },
  {
    frame: "diver.torpedo.swim.1",
    size: [434, 421],
    pivot: [208, 228],
    muzzle: [416, 217],
    scale: 0.18,
  },
  {
    frame: "diver.torpedo.swim.2",
    size: [419, 401],
    pivot: [207, 236],
    muzzle: [402, 225],
    scale: 0.18,
  },
  {
    frame: "diver.torpedo.boost",
    size: [519, 372],
    pivot: [300, 223],
    muzzle: [499, 212],
    scale: 0.18,
  },
] as const;
/** Measured in the native cropped PNG (top-left origin). Body pivot is shared by art and muzzle. */
export const OceanGunPoses = {
  sonar: {
    frame: "diver.sonar.fire",
    size: [262, 340],
    pivot: [110, 190],
    muzzle: [240, 167],
    scale: 0.25,
  },
  harpoon: {
    frame: "diver.harpoon.fire",
    size: [418, 389],
    pivot: [177, 216],
    muzzle: [405, 177],
    scale: 0.196,
  },
  torpedo: TorpedoMotionPoses[0],
  knife: {
    frame: "diver.knife.windup",
    size: [276, 323],
    pivot: [130, 180],
    muzzle: [130, 180],
    scale: 0.25,
  },
} as const;
export function oceanHeldPose(
  weapon: OceanWeapon,
  time: number,
  speed: number,
  boost: boolean,
) {
  if(speed>25 || boost) {
    if(weapon === "harpoon") return HarpoonMotionPoses[Math.floor(time*6)%2];
    if(weapon === "sonar") return SonarMotionPoses[Math.floor(time*8)%4];
  }
  return weapon === "torpedo"
    ? TorpedoMotionPoses[
        boost
          ? 5
          : speed > 25
            ? 2 + (Math.floor(time * 7) % 3)
            : Math.floor(time * 2) % 2
      ]
    : OceanGunPoses[weapon];
}
export function oceanGunTransform(aim: number, facing?: 1 | -1) {
  const flip = facing ?? (Math.cos(aim) >= 0 ? 1 : -1);
  // Mirrored art rotates around the same body pivot; the tube remains coaxial.
  const angle = flip === 1 ? aim : aim - Math.PI;
  return { flip, angle };
}
/** Whole diver and painted gun recoil together, along the emitted ray. */
export function oceanGunOrigin(x:number,y:number,aim:number,recoil=0,weapon:OceanWeapon="harpoon") {
  const kick=(weapon === "torpedo" ? 6 : 4)*Math.min(1,Math.max(0,recoil))**2;
  return {x:x-Math.cos(aim)*kick,y:y+38-Math.sin(aim)*kick};
}
export function oceanMuzzle(
  x: number,
  y: number,
  aim: number,
  weapon: OceanWeapon,
  pose: ReturnType<typeof oceanHeldPose> = OceanGunPoses[weapon],
  recoil = 0,
  facing?: 1 | -1,
) {
  const d = pose,
    { flip, angle } = oceanGunTransform(aim, facing);
  const dx = (d.muzzle[0] - d.pivot[0]) * d.scale * flip,
    dy = (d.pivot[1] - d.muzzle[1]) * d.scale;
  const origin=oceanGunOrigin(x,y,aim,recoil,weapon);
  return {
    x: origin.x + dx * Math.cos(angle) - dy * Math.sin(angle),
    y: origin.y + dx * Math.sin(angle) + dy * Math.cos(angle),
  };
}
